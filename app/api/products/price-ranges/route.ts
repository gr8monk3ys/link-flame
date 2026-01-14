import { NextResponse } from 'next/server';
import { getPriceRanges } from '@/lib/products';
import { handleApiError } from '@/lib/api-response';
import { getOrSetCached, CacheKeys, CacheTTL } from '@/lib/cache';
import { logger } from '@/lib/logger';

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

export async function GET() {
  try {
    // Try to get from Redis cache, fallback to database
    const priceRanges = await getOrSetCached(
      CacheKeys.PRICE_RANGES,
      getPriceRanges,
      CacheTTL.LONG // 1 hour
    );

    return NextResponse.json(priceRanges);
  } catch (error) {
    logger.error("Failed to fetch price ranges", error);
    return handleApiError(error);
  }
}
