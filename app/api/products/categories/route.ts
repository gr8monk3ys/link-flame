import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-response';
import { getOrSetCached, CacheKeys, CacheTTL } from '@/lib/cache';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

interface Category {
  id: string;
  name: string;
}

export async function GET() {
  try {
    // Try to get from Redis cache, fallback to database
    const categories = await getOrSetCached<Category[]>(
      CacheKeys.CATEGORIES,
      async () => prisma.category.findMany(),
      CacheTTL.LONG // 1 hour
    );

    return NextResponse.json(categories);
  } catch (error) {
    logger.error("Failed to fetch product categories", error);
    return handleApiError(error);
  }
}
