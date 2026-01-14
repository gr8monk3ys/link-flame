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
