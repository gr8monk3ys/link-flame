import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  handleApiError,
  rateLimitErrorResponse,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Rate limit to prevent excessive requests
  const identifier = getIdentifier(request)
  const { success, reset } = await checkRateLimit(`brands:${identifier}`)
  if (!success) {
    return rateLimitErrorResponse(reset)
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 12)

    // Get featured brands
    const brands = await prisma.brand.findMany({
      where: {
        isActive: true,
        featured: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      take: limit,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    // Parse JSON fields and normalize response
    const normalizedBrands = brands.map((brand) => ({
      ...brand,
      certifications: brand.certifications ? JSON.parse(brand.certifications) : [],
      values: brand.values ? JSON.parse(brand.values) : [],
      productCount: brand._count.products,
      _count: undefined,
    }))

    return NextResponse.json({
      brands: normalizedBrands,
    })
  } catch (error) {
    logger.error('Failed to fetch featured brands', error)
    return handleApiError(error)
  }
}
