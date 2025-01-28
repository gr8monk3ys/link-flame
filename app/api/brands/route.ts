import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  handleApiError,
  rateLimitErrorResponse,
  validationErrorResponse,
  paginatedResponse,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit'
import { calculatePaginationMeta } from '@/lib/api/pagination'

export const dynamic = 'force-dynamic'

// Schema for brand filtering
const filterSchema = z.object({
  certification: z.string().optional(),
  value: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

export async function GET(request: NextRequest) {
  // Rate limit to prevent excessive requests
  const identifier = getIdentifier(request)
  const { success, reset } = await checkRateLimit(`brands:${identifier}`)
  if (!success) {
    return rateLimitErrorResponse(reset)
  }

  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const params = {
      certification: searchParams.get('certification') || undefined,
      value: searchParams.get('value') || undefined,
      featured: searchParams.get('featured') || undefined,
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
    }

    const validation = filterSchema.safeParse(params)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { certification, value, featured, page, pageSize } = validation.data

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true,
    }

    // Filter by certification (stored as JSON array in certifications field)
    if (certification) {
      where.certifications = {
        contains: certification,
      }
    }

    // Filter by value (stored as JSON array in values field)
    if (value) {
      where.values = {
        contains: value,
      }
    }

    // Filter by featured status
    if (featured === 'true') {
      where.featured = true
    }

    // Get total count for pagination
    const total = await prisma.brand.count({ where })

    // Get brands with pagination
    const brands = await prisma.brand.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
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

    // Use standardized paginated response format
    const pagination = calculatePaginationMeta(total, page, pageSize)

    return paginatedResponse(normalizedBrands, pagination)
  } catch (error) {
    logger.error('Failed to fetch brands', error)
    return handleApiError(error)
  }
}
