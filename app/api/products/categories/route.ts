import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-response';
import { getOrSetCached, CacheKeys, CacheTTL } from '@/lib/cache';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

export async function GET() {
  try {
    // Try to get from Redis cache, fallback to database
    const categories = await getOrSetCached<Array<{ name: string; count: number }>>(
      CacheKeys.CATEGORIES,
      async () => {
        const grouped = await prisma.product.groupBy({
          by: ['category'],
          _count: { _all: true },
        });

        return grouped
          .map((row) => ({
            name: row.category,
            count: row._count._all,
          }))
          .filter((row) => typeof row.name === 'string' && row.name.trim().length > 0)
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      },
      CacheTTL.LONG // 1 hour
    );

    return NextResponse.json(categories);
  } catch (error) {
    logger.error("Failed to fetch product categories", error);
    return handleApiError(error);
  }
}
