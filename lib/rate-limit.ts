/**
 * Rate limiting utilities.
 *
 * Thin app-specific layer over `@gr8monk3ys/next-kit/rate-limit`. This module
 * owns the things that are link-flame's: the two named buckets (standard and
 * strict), the `user:` / `ip:` / `anon:` identifier shape every API route
 * passes around, the `RATE_LIMIT_NAMESPACES` table, and the response shape the
 * routes destructure. The window accounting, the store implementations and the
 * client-identifier rules live in the kit.
 *
 * Uses Upstash Redis when credentials are configured, and an in-memory limiter
 * otherwise — or when Redis is configured but unreachable.
 *
 * **Environment Variables:**
 * - `UPSTASH_REDIS_REST_URL` - Your Upstash Redis REST URL
 * - `UPSTASH_REDIS_REST_TOKEN` - Your Upstash Redis REST token
 * - `RATE_LIMIT_STRICT_MAX_REQUESTS` - Strict bucket ceiling (default 5)
 * - `RATE_LIMIT_STRICT_WINDOW_SECONDS` - Strict bucket window (default 60)
 *
 * @see https://upstash.com/docs/redis/overall/getstarted
 * @module lib/rate-limit
 */

import {
  createRateLimiter,
  getClientId,
  MemoryStore,
  RedisStore,
  type RateLimiter,
  type RateLimitStore,
} from "@gr8monk3ys/next-kit/rate-limit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

let hasLoggedStandardFallback = false;
let hasLoggedStrictFallback = false;

function parsePositiveIntegerEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (!rawValue) return fallback;

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    logger.warn(`Invalid ${name} value "${rawValue}". Falling back to ${fallback}.`);
    return fallback;
  }

  return parsed;
}

const STANDARD_RATE_LIMIT_MAX_REQUESTS = 10;
const STANDARD_RATE_LIMIT_WINDOW_MS = 10_000;

const STRICT_RATE_LIMIT_MAX_REQUESTS = parsePositiveIntegerEnv(
  "RATE_LIMIT_STRICT_MAX_REQUESTS",
  5
);
const STRICT_RATE_LIMIT_WINDOW_SECONDS = parsePositiveIntegerEnv(
  "RATE_LIMIT_STRICT_WINDOW_SECONDS",
  60
);
const STRICT_RATE_LIMIT_WINDOW_MS = STRICT_RATE_LIMIT_WINDOW_SECONDS * 1_000;

/**
 * Redis key namespace.
 *
 * `v2` because the counters changed shape: `@upstash/ratelimit` wrote
 * `@upstash/ratelimit:<identifier>:<window-index>` counters from its own Lua
 * scripts, and the kit's `RedisStore` writes plain `INCR` counters. A distinct
 * namespace means the two never meet — the old keys simply drain on the TTLs
 * Upstash already set.
 */
const REDIS_KEY_PREFIX = "linkflame:ratelimit:v2:";

/**
 * Module-level singleton Redis-backed store.
 *
 * The Upstash REST client already satisfies the kit's `RedisLike` shape
 * (`incr` / `pexpire` / `pttl` / `del`), so no adapter is needed. Built once at
 * module scope, exactly as the two `Ratelimit` instances it replaces were.
 */
const redisStore: RateLimitStore | null =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new RedisStore(
        new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        {
          prefix: REDIS_KEY_PREFIX,
          // Surface the failure to the caller below rather than admitting the
          // request, so an Upstash outage degrades to the in-memory limiter
          // instead of switching rate limiting off entirely.
          onError: "closed",
        }
      )
    : null;

/**
 * In-memory fallback, shared by both buckets. Does not survive a cold start and
 * does not coordinate across instances — both were true of the hand-rolled Map
 * it replaces. The bucket prefixes below keep standard and strict apart.
 */
const memoryStore = new MemoryStore();

function limiter(
  store: RateLimitStore,
  bucket: "standard" | "strict",
  limit: number,
  windowMs: number
): RateLimiter {
  return createRateLimiter({ store, limit, windowMs, prefix: bucket });
}

// Two limiters per store. Giving each bucket its own prefix also fixes a
// collision the Upstash version had: both `Ratelimit` instances used the
// default `@upstash/ratelimit` prefix, so standard and strict shared a key
// space and only the window index kept them apart.
const redisStandard = redisStore
  ? limiter(redisStore, "standard", STANDARD_RATE_LIMIT_MAX_REQUESTS, STANDARD_RATE_LIMIT_WINDOW_MS)
  : null;
const redisStrict = redisStore
  ? limiter(redisStore, "strict", STRICT_RATE_LIMIT_MAX_REQUESTS, STRICT_RATE_LIMIT_WINDOW_MS)
  : null;
const memoryStandard = limiter(
  memoryStore,
  "standard",
  STANDARD_RATE_LIMIT_MAX_REQUESTS,
  STANDARD_RATE_LIMIT_WINDOW_MS
);
const memoryStrict = limiter(
  memoryStore,
  "strict",
  STRICT_RATE_LIMIT_MAX_REQUESTS,
  STRICT_RATE_LIMIT_WINDOW_MS
);

export interface RateLimitStatus {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

async function checkWith(
  rateLimiter: RateLimiter,
  identifier: string
): Promise<RateLimitStatus> {
  const result = await rateLimiter.check(identifier);

  return {
    success: result.ok,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.resetAt,
  };
}

function logFallback(bucket: "standard" | "strict"): void {
  const isProduction = process.env.NODE_ENV === "production";

  if (bucket === "standard") {
    if (hasLoggedStandardFallback) return;
    hasLoggedStandardFallback = true;
  } else {
    if (hasLoggedStrictFallback) return;
    hasLoggedStrictFallback = true;
  }

  const message = isProduction
    ? "Redis rate limiting is not configured in production. Falling back to in-memory limits. Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN before launch."
    : "Redis rate limiting is not configured. Using in-memory fallback. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production.";

  if (isProduction) {
    logger.error(message);
    return;
  }

  logger.warn(message);
}

async function check(
  bucket: "standard" | "strict",
  redisLimiter: RateLimiter | null,
  memoryLimiter: RateLimiter,
  identifier: string
): Promise<RateLimitStatus> {
  if (!redisLimiter) {
    logFallback(bucket);
    return checkWith(memoryLimiter, identifier);
  }

  try {
    return await checkWith(redisLimiter, identifier);
  } catch (error) {
    // An Upstash outage must not turn every request into a 500. Fall back to
    // the in-memory limiter, which still enforces the configured limits
    // (per instance) rather than failing open entirely.
    logger.error("Rate limiter unavailable, falling back to in-memory", error);
    return checkWith(memoryLimiter, identifier);
  }
}

/**
 * Check rate limit for a given identifier using the standard rate limit
 * (10 requests per 10 seconds).
 *
 * **Rate Limit Configuration:**
 * - **Standard**: 10 requests per 10 seconds (fixed window)
 *
 * **Graceful Degradation:**
 * When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are not set — or
 * when Redis is configured but unreachable — the same limits are enforced by an
 * in-memory limiter, per instance, and a warning is logged once.
 *
 * @param {string} identifier - Unique identifier for the requester (e.g. "user:abc123" or "ip:192.168.1.1")
 *                              Use {@link getIdentifier} to generate this from a Request object
 * @returns {Promise<RateLimitStatus>} Rate limit status object
 *
 * @example
 * ```typescript
 * // In an API route
 * import { checkRateLimit, getIdentifier } from '@/lib/rate-limit'
 *
 * export async function POST(request: Request) {
 *   const identifier = getIdentifier(request, userId)
 *   const { success, limit, remaining, reset } = await checkRateLimit(identifier)
 *
 *   if (!success) {
 *     return NextResponse.json(
 *       { error: 'Too many requests', limit, reset },
 *       { status: 429 }
 *     )
 *   }
 *
 *   // Process request...
 * }
 * ```
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitStatus> {
  return check("standard", redisStandard, memoryStandard, identifier);
}

/**
 * Session cookies consulted when no trustworthy IP is available, so an
 * unidentified caller gets its own bucket instead of sharing one global
 * "anonymous" bucket that any single client could exhaust for everyone.
 */
const ANONYMOUS_SESSION_COOKIES = [
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
  "__Host-next-auth.csrf-token",
  "next-auth.csrf-token",
  "guest_session_id",
];

/**
 * Extracts a unique identifier from a request for rate limiting purposes.
 *
 * Prioritises authenticated user IDs over IP addresses. Using user IDs is more
 * accurate because users behind shared IPs (corporate networks, VPNs) do not
 * affect each other, and a user cannot bypass a limit by changing IP.
 *
 * **Identifier Priority:**
 * 1. **User ID** (if authenticated): `"user:{userId}"`
 * 2. **IP Address**: `"ip:{ipAddress}"`
 * 3. **Session cookie / request fingerprint**: `"anon:session:{hash}"` or
 *    `"anon:fingerprint:{hash}"`
 *
 * **IP Detection Strategy** (delegated to the kit's `getClientId`):
 * platform-set headers first (`x-vercel-forwarded-for`, `cf-connecting-ip`,
 * `x-real-ip`), then the RIGHT-most `x-forwarded-for` entry — the hop our own
 * edge appended. Taking `[0]`, as this module used to, lets a caller mint a
 * fresh bucket per request just by rotating the header. Candidates that do not
 * parse as an IP are discarded rather than trusted as a bucket key.
 *
 * @param {Request} request - The incoming HTTP request object
 * @param {string | null} [userId] - Optional authenticated user ID from NextAuth or other auth provider
 * @returns {string} Formatted identifier string (e.g. "user:clerk_abc123" or "ip:192.168.1.1")
 *
 * @example
 * ```typescript
 * // With authenticated user
 * import { getServerAuth } from '@/lib/auth'
 * const { userId } = await getServerAuth()
 * const identifier = getIdentifier(request, userId)
 * // Returns: "user:auth_abc123"
 *
 * // With anonymous user
 * const identifier = getIdentifier(request, null)
 * // Returns: "ip:192.168.1.1"
 * ```
 */
export function getIdentifier(request: Request, userId?: string | null): string {
  // Use user ID if available (more accurate)
  if (userId) {
    return `user:${userId}`;
  }

  const clientId = getClientId(request, {
    sessionCookieNames: ANONYMOUS_SESSION_COOKIES,
  });

  // `getClientId` returns a bare IP when it found a trustworthy one, and a
  // `session:` / `fingerprint:` pseudo-identifier otherwise. Keep link-flame's
  // `ip:` / `anon:` split so keys stay readable in Redis and in logs.
  return /^(?:session|fingerprint):/.test(clientId)
    ? `anon:${clientId}`
    : `ip:${clientId}`;
}

/**
 * Check rate limit using a stricter limit for sensitive endpoints.
 *
 * Provides enhanced protection for sensitive operations like authentication,
 * payment processing, and account modifications. It uses a tighter rate limit
 * (5 requests per minute by default) compared to the standard rate limit.
 *
 * **Rate Limit Configuration:**
 * - **Strict**: `RATE_LIMIT_STRICT_MAX_REQUESTS` (default 5) requests per
 *   `RATE_LIMIT_STRICT_WINDOW_SECONDS` (default 60) seconds, fixed window
 *
 * **Use Cases:**
 * - Authentication endpoints (login, signup, password reset)
 * - Payment/checkout operations
 * - Account modification (profile updates, email changes)
 * - Admin operations
 * - Newsletter subscription
 * - Contact form submission
 *
 * **Graceful Degradation:**
 * Like {@link checkRateLimit}, this falls back to an in-memory limiter that
 * enforces the same limits when Upstash is not configured or unreachable.
 *
 * @param {string} identifier - Unique identifier for the requester (e.g. "user:abc123" or "ip:192.168.1.1")
 *                              Use {@link getIdentifier} to generate this from a Request object
 * @returns {Promise<RateLimitStatus>} Rate limit status object
 *
 * @example
 * ```typescript
 * // In a login API route
 * import { checkStrictRateLimit, getIdentifier } from '@/lib/rate-limit'
 *
 * export async function POST(request: Request) {
 *   const identifier = getIdentifier(request)
 *   const { success, reset } = await checkStrictRateLimit(identifier)
 *
 *   if (!success) {
 *     const resetDate = new Date(reset)
 *     return NextResponse.json(
 *       { error: `Too many login attempts. Try again at ${resetDate.toISOString()}` },
 *       { status: 429 }
 *     )
 *   }
 *
 *   // Process login...
 * }
 * ```
 */
export async function checkStrictRateLimit(identifier: string): Promise<RateLimitStatus> {
  return check("strict", redisStrict, memoryStrict, identifier);
}

/**
 * Rate limit namespace prefixes for consistent key naming across API routes.
 *
 * Using consistent namespaces helps:
 * - Organize rate limit keys in Redis
 * - Enable per-resource rate limiting
 * - Make debugging and monitoring easier
 * - Prevent key collisions between different endpoints
 *
 * @example
 * ```typescript
 * import { RATE_LIMIT_NAMESPACES, getRateLimitKey, getIdentifier } from '@/lib/rate-limit'
 *
 * const identifier = getIdentifier(request)
 * const key = getRateLimitKey(RATE_LIMIT_NAMESPACES.PRODUCTS, identifier)
 * const { success, reset } = await checkRateLimit(key)
 * ```
 */
export const RATE_LIMIT_NAMESPACES = {
  // Product endpoints
  PRODUCTS: 'products',
  PRODUCT: 'product',
  PRODUCT_REVIEWS: 'product-reviews',
  PRODUCT_VALUES: 'values',
  PRODUCTS_IMPERFECT: 'products-imperfect',

  // Brand endpoints
  BRANDS: 'brands',
  BRAND: 'brand',

  // Cart endpoints
  CART: 'cart',
  CART_MIGRATE: 'cart-migrate',

  // Checkout endpoints
  CHECKOUT: 'checkout',
  CHECKOUT_EXPRESS: 'checkout-express',

  // Order endpoints
  ORDERS: 'orders',
  ORDER: 'order',
  ORDERS_BY_SESSION: 'orders-by-session',

  // Authentication endpoints
  AUTH_SIGNUP: 'auth-signup',
  AUTH_LOGIN: 'auth-login',
  AUTH_USER: 'auth-user',

  // Account endpoints
  ACCOUNT_PROFILE: 'account-profile',
  ACCOUNT_PASSWORD: 'account-password',
  ACCOUNT_DELETE: 'account-delete',

  // Contact and newsletter
  CONTACT: 'contact',
  NEWSLETTER: 'newsletter',

  // Search endpoints
  SEARCH: 'search',
  SEARCH_SUGGESTIONS: 'search-suggestions',

  // Blog endpoints
  BLOG_SEARCH: 'blog-search',

  // Wishlist endpoints
  WISHLISTS: 'wishlists',
  WISHLIST: 'wishlist',
  WISHLIST_ITEMS: 'wishlist-items',
  WISHLIST_MOVE: 'wishlist-move',
  WISHLIST_SHARED: 'wishlist-shared',

  // Saved items endpoints
  SAVED_ITEMS: 'saved-items',
  SAVED_ITEMS_MIGRATE: 'saved-items-migrate',

  // Bundle endpoints
  BUNDLES: 'bundles',
  BUNDLE: 'bundle',
  BUNDLE_CART: 'bundle-cart',
  BUNDLE_CALC: 'bundle-calc',

  // Loyalty endpoints
  LOYALTY_BALANCE: 'loyalty-balance',
  LOYALTY_HISTORY: 'loyalty-history',
  LOYALTY_EARN: 'loyalty-earn',
  LOYALTY_REDEEM: 'loyalty-redeem',

  // Gift card endpoints
  GIFT_CARDS: 'gift-cards',
  GIFT_CARD: 'gift-card',
  GIFT_CARD_REDEEM: 'gift-card-redeem',
  GIFT_CARDS_MY: 'gift-cards-my',

  // Referral endpoints
  REFERRAL_CODE: 'referral-code',
  REFERRAL_STATS: 'referral-stats',
  REFERRAL_VALIDATE: 'referral-validate',
  REFERRAL_LIST: 'referral-list',

  // Subscription endpoints
  SUBSCRIPTIONS: 'subscriptions',
  SUBSCRIPTION: 'subscription',
  SUBSCRIPTION_SKIP: 'subscription-skip',
  SUBSCRIPTION_UPCOMING: 'subscription-upcoming',

  // Quiz endpoints
  QUIZ_QUESTIONS: 'quiz-questions',
  QUIZ_SUBMIT: 'quiz-submit',
  QUIZ_RESULTS: 'quiz-results',

  // Impact endpoints
  IMPACT_PERSONAL: 'impact-personal',
  IMPACT_COMMUNITY: 'impact-community',
  IMPACT_PREVIEW: 'impact-preview',
  IMPACT_ORDER: 'impact-order',

  // Team management endpoints
  TEAM_INVITE: 'team-invite',
  TEAM_MEMBER: 'team-member',
  TEAM_ACCEPT: 'team-accept',
} as const;

export type RateLimitNamespace = typeof RATE_LIMIT_NAMESPACES[keyof typeof RATE_LIMIT_NAMESPACES];

/**
 * Creates a standardized rate limit key with namespace prefix.
 *
 * This function combines a namespace prefix with the request identifier
 * to create a consistent and organized rate limit key.
 *
 * @param namespace - The rate limit namespace (e.g., 'products', 'cart')
 * @param identifier - The request identifier from getIdentifier()
 * @returns Formatted rate limit key (e.g., 'products:user:abc123')
 *
 * @example
 * ```typescript
 * const identifier = getIdentifier(request, userId)
 * const key = getRateLimitKey(RATE_LIMIT_NAMESPACES.PRODUCTS, identifier)
 * // Returns: 'products:user:abc123' or 'products:ip:192.168.1.1'
 *
 * const { success, reset } = await checkRateLimit(key)
 * ```
 */
export function getRateLimitKey(
  namespace: RateLimitNamespace | string,
  identifier: string
): string {
  return `${namespace}:${identifier}`;
}
