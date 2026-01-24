import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  handleApiError,
  rateLimitErrorResponse,
  validationErrorResponse,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit'

// Schema for brand filtering
const filterSchema = z.object({
  certification: z.string().optional(),
  value: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

// Brand certifications available for filtering
export const BRAND_CERTIFICATIONS = [
  { slug: 'b-corp', name: 'B Corp Certified', description: 'Meets highest standards of social and environmental performance' },
  { slug: '1-percent-planet', name: '1% for the Planet', description: 'Donates 1% of sales to environmental causes' },
  { slug: 'fair-trade', name: 'Fair Trade Certified', description: 'Ensures fair wages and safe working conditions' },
  { slug: 'climate-neutral', name: 'Climate Neutral Certified', description: 'Carbon emissions measured and offset' },
  { slug: 'leaping-bunny', name: 'Leaping Bunny', description: 'Cruelty-free certification' },
  { slug: 'usda-organic', name: 'USDA Organic', description: 'Certified organic by USDA' },
  { slug: 'ewg-verified', name: 'EWG Verified', description: 'Meets Environmental Working Group standards' },
  { slug: 'made-safe', name: 'MADE SAFE', description: 'Free of known toxic ingredients' },
] as const

// Brand values available for filtering
export const BRAND_VALUES = [
  { slug: 'women-owned', name: 'Women-Owned', description: 'Business owned by women' },
  { slug: 'bipoc-owned', name: 'BIPOC-Owned', description: 'Business owned by Black, Indigenous, or People of Color' },
  { slug: 'family-owned', name: 'Family-Owned', description: 'Family-owned business' },
  { slug: 'small-batch', name: 'Small Batch', description: 'Products made in small batches' },
  { slug: 'made-in-usa', name: 'Made in USA', description: 'Products manufactured in the United States' },
  { slug: 'plastic-free', name: 'Plastic-Free', description: 'Committed to plastic-free products and packaging' },
  { slug: 'zero-waste', name: 'Zero Waste', description: 'Working towards zero waste operations' },
  { slug: 'carbon-negative', name: 'Carbon Negative', description: 'Removes more carbon than it produces' },
  { slug: 'regenerative', name: 'Regenerative', description: 'Uses regenerative agriculture practices' },
  { slug: 'vegan', name: 'Vegan', description: 'All products are 100% vegan' },
] as const

export type BrandCertification = typeof BRAND_CERTIFICATIONS[number]
export type BrandValue = typeof BRAND_VALUES[number]

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
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

    return NextResponse.json({
      brands: normalizedBrands,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    logger.error('Failed to fetch brands', error)
    return handleApiError(error)
  }
}
