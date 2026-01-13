/**
 * Redis caching utilities using Upstash Redis.
 *
 * This module provides data caching that:
 * - Uses Upstash Redis when credentials are configured
 * - Gracefully degrades to no caching when credentials are missing
 * - Supports TTL-based cache expiration
 * - Provides typed get/set operations with JSON serialization
 *
 * **Environment Variables:**
 * - `UPSTASH_REDIS_REST_URL` - Your Upstash Redis REST URL
 * - `UPSTASH_REDIS_REST_TOKEN` - Your Upstash Redis REST token
 *
 * @module lib/cache
 */

import { Redis } from "@upstash/redis";

// Initialize Redis client
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Cache key prefixes for different data types
 */
export const CacheKeys = {
  PRODUCTS: "cache:products",
  PRODUCT: (id: string) => `cache:product:${id}`,
  CATEGORIES: "cache:categories",
  PRICE_RANGES: "cache:price_ranges",
  BLOG_POSTS: "cache:blog_posts",
  BLOG_POST: (slug: string) => `cache:blog_post:${slug}`,
  BLOG_CATEGORIES: "cache:blog_categories",
  BLOG_TAGS: "cache:blog_tags",
} as const;

/**
 * Default TTL values in seconds
 */
export const CacheTTL = {
  SHORT: 300,      // 5 minutes - for frequently changing data
  MEDIUM: 1800,    // 30 minutes - for product listings
  LONG: 3600,      // 1 hour - for categories, tags
  VERY_LONG: 86400, // 24 hours - for rarely changing data
} as const;

/**
 * Check if caching is available
 */
export function isCacheAvailable(): boolean {
  return redis !== null;
}

/**
 * Get a cached value by key
 *
 * @param key - The cache key to retrieve
 * @returns The cached value or null if not found/expired
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) {
    return null;
  }

  try {
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set a cached value with TTL
 *
 * @param key - The cache key
 * @param value - The value to cache (will be JSON serialized)
 * @param ttlSeconds - Time to live in seconds (default: 30 minutes)
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = CacheTTL.MEDIUM
): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
  }
}

/**
 * Delete a cached value
 *
 * @param key - The cache key to delete
 */
export async function deleteCached(key: string): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    await redis.del(key);
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
  }
}

/**
 * Delete multiple cached values by pattern
 *
 * @param pattern - The pattern to match (e.g., "cache:product:*")
 */
export async function deleteCachedByPattern(pattern: string): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    // Note: SCAN is not directly available in Upstash REST API
    // Use specific key deletion instead or implement batch deletion
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error(`Cache delete by pattern error for ${pattern}:`, error);
  }
}

/**
 * Get or set cached value (cache-aside pattern)
 *
 * @param key - The cache key
 * @param fetcher - Function to fetch the value if not cached
 * @param ttlSeconds - Time to live in seconds (default: 30 minutes)
 * @returns The cached or freshly fetched value
 */
export async function getOrSetCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = CacheTTL.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const value = await fetcher();

  // Cache the result (fire and forget)
  setCached(key, value, ttlSeconds);

  return value;
}

/**
 * Invalidate product-related caches
 * Call this when a product is created, updated, or deleted
 */
export async function invalidateProductCaches(productId?: string): Promise<void> {
  await deleteCached(CacheKeys.PRODUCTS);
  await deleteCached(CacheKeys.CATEGORIES);
  await deleteCached(CacheKeys.PRICE_RANGES);

  if (productId) {
    await deleteCached(CacheKeys.PRODUCT(productId));
  }
}

/**
 * Invalidate blog-related caches
 * Call this when a blog post is created, updated, or deleted
 */
export async function invalidateBlogCaches(slug?: string): Promise<void> {
  await deleteCached(CacheKeys.BLOG_POSTS);
  await deleteCached(CacheKeys.BLOG_CATEGORIES);
  await deleteCached(CacheKeys.BLOG_TAGS);

  if (slug) {
    await deleteCached(CacheKeys.BLOG_POST(slug));
  }
}
