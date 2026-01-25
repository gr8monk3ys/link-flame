/**
 * Rate limiting utilities using Upstash Redis.
 *
 * This module provides graceful rate limiting that:
 * - Uses Upstash Redis when credentials are configured
 * - Gracefully degrades to allowing all requests when credentials are missing
 * - Supports standard (10 req/10s) and strict (5 req/min) rate limits
 *
 * **Environment Variables:**
 * - `UPSTASH_REDIS_REST_URL` - Your Upstash Redis REST URL
 * - `UPSTASH_REDIS_REST_TOKEN` - Your Upstash Redis REST token
 *
 * @see https://upstash.com/docs/redis/overall/getstarted
 * @module lib/rate-limit
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

// Initialize Redis client (requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars)
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

// Only initialize if Upstash credentials are available
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Create a rate limiter that allows 10 requests per 10 seconds
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
  });
}

/**
 * Check rate limit for a given identifier using the standard rate limit (10 requests per 10 seconds).
 *
 * This function uses Upstash Redis with a sliding window algorithm to track request counts.
 * If Upstash credentials are not configured, it gracefully allows all requests with a warning.
 *
 * **Rate Limit Configuration:**
 * - **Standard**: 10 requests per 10 seconds (sliding window)
 * - **Analytics**: Enabled for tracking usage patterns
 *
 * **Graceful Degradation:**
 * When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are not set, this function
 * returns `success: true` with infinite limits and logs a warning.
 *
 * @param {string} identifier - Unique identifier for the requester (e.g., "user:abc123" or "ip:192.168.1.1")
 *                              Use {@link getIdentifier} to generate this from a Request object
 * @returns {Promise<Object>} Rate limit status object
 * @returns {boolean} success - Whether the request is allowed (true) or rate limited (false)
 * @returns {number} limit - Maximum number of requests allowed in the window
 * @returns {number} remaining - Number of requests remaining in current window
 * @returns {number} reset - Unix timestamp (ms) when the rate limit resets
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
export async function checkRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // If rate limiting is not configured, allow all requests
  if (!ratelimit) {
    logger.warn("Rate limiting is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.");
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: 0,
    };
  }

  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

  return {
    success,
    limit,
    remaining,
    reset,
  };
}

/**
 * Extracts a unique identifier from a request for rate limiting purposes.
 *
 * This function determines the best identifier to use for rate limiting by prioritizing
 * authenticated user IDs over IP addresses. Using user IDs is more accurate because:
 * - Users behind shared IPs (corporate networks, VPNs) won't affect each other
 * - Users can't bypass limits by changing IP addresses
 *
 * **Identifier Priority:**
 * 1. **User ID** (if authenticated): `"user:{userId}"`
 * 2. **IP Address** (if not authenticated): `"ip:{ipAddress}"`
 *
 * **IP Detection Strategy:**
 * - Checks `x-forwarded-for` header first (for proxies/load balancers)
 * - Falls back to `x-real-ip` header
 * - Returns `"ip:unknown"` if neither is available
 *
 * @param {Request} request - The incoming HTTP request object
 * @param {string | null} [userId] - Optional authenticated user ID from Clerk or other auth provider
 * @returns {string} Formatted identifier string (e.g., "user:clerk_abc123" or "ip:192.168.1.1")
 *
 * @example
 * ```typescript
 * // With authenticated user
 * import { auth } from '@clerk/nextjs/server'
 * const { userId } = await auth()
 * const identifier = getIdentifier(request, userId)
 * // Returns: "user:clerk_abc123"
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

  // Otherwise use IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown";

  return `ip:${ip}`;
}

/**
 * Check rate limit using a stricter limit for sensitive endpoints.
 *
 * This function provides enhanced protection for sensitive operations like authentication,
 * payment processing, and account modifications. It uses a tighter rate limit (5 requests
 * per minute) compared to the standard rate limit (10 requests per 10 seconds).
 *
 * **Rate Limit Configuration:**
 * - **Strict**: 5 requests per minute (sliding window)
 * - **Analytics**: Enabled for tracking usage patterns
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
 * Like {@link checkRateLimit}, this returns `success: true` with infinite limits
 * when Upstash credentials are not configured.
 *
 * @param {string} identifier - Unique identifier for the requester (e.g., "user:abc123" or "ip:192.168.1.1")
 *                              Use {@link getIdentifier} to generate this from a Request object
 * @returns {Promise<Object>} Rate limit status object
 * @returns {boolean} success - Whether the request is allowed (true) or rate limited (false)
 * @returns {number} limit - Maximum number of requests allowed in the window (5)
 * @returns {number} remaining - Number of requests remaining in current window
 * @returns {number} reset - Unix timestamp (ms) when the rate limit resets
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
export async function checkStrictRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // If rate limiting is not configured, allow all requests
  if (!redis) {
    logger.warn("Rate limiting is not configured.");
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: 0,
    };
  }

  // Create a stricter rate limiter: 5 requests per minute
  const strictRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
  });

  const { success, limit, remaining, reset } = await strictRatelimit.limit(identifier);

  return {
    success,
    limit,
    remaining,
    reset,
  };
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
