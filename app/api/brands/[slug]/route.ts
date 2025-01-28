import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  handleApiError,
  notFoundResponse,
  rateLimitErrorResponse,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // Rate limit to prevent excessive requests
  const identifier = getIdentifier(request)
  const { success, reset } = await checkRateLimit(`brands:${identifier}`)
  if (!success) {
    return rateLimitErrorResponse(reset)
  }

  try {
    const { slug } = await params

    // Get brand by slug with products
    const brand = await prisma.brand.findUnique({
      where: {
        slug,
        isActive: true,
      },
      include: {
        products: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            salePrice: true,
            image: true,
            category: true,
            inventory: true,
            featured: true,
            isPlasticFree: true,
            isVegan: true,
            isCrueltyFree: true,
            isOrganicCertified: true,
            reviews: {
              select: {
                rating: true,
              },
            },
          },
          orderBy: [
            { featured: 'desc' },
            { createdAt: 'desc' },
          ],
        },
      },
    })

    if (!brand) {
      return notFoundResponse('Brand')
    }

    // Parse JSON fields and normalize response
    const normalizedBrand = {
      ...brand,
      certifications: brand.certifications ? JSON.parse(brand.certifications) : [],
      values: brand.values ? JSON.parse(brand.values) : [],
      products: brand.products.map((product) => ({
        ...product,
        averageRating:
          product.reviews.length > 0
            ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
            : null,
        reviewCount: product.reviews.length,
        reviews: undefined,
      })),
    }

    return NextResponse.json(normalizedBrand)
  } catch (error) {
    logger.error('Failed to fetch brand', error)
    return handleApiError(error)
  }
}
