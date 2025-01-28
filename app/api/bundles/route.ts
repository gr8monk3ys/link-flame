import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  handleApiError,
  successResponse,
  paginatedResponse,
  rateLimitErrorResponse,
} from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit"

export const dynamic = 'force-dynamic'

// Schema for query params
const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  category: z.string().optional(),
  customizable: z.enum(["true", "false"]).optional(),
})

/**
 * GET /api/bundles - List all active bundles
 */
export async function GET(request: NextRequest) {
  // Rate limit to prevent catalog scraping
  const identifier = getIdentifier(request)
  const { success, reset } = await checkRateLimit(`bundles:${identifier}`)
  if (!success) {
    return rateLimitErrorResponse(reset)
  }

  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate query params
    const params = querySchema.parse({
      page: searchParams.get("page") || 1,
      pageSize: searchParams.get("pageSize") || 12,
      category: searchParams.get("category") || undefined,
      customizable: searchParams.get("customizable") || undefined,
    })

    // Build where clause
    const where: {
      isActive: boolean
      category?: string
      isCustomizable?: boolean
    } = {
      isActive: true,
    }

    if (params.category) {
      where.category = params.category
    }

    if (params.customizable !== undefined) {
      where.isCustomizable = params.customizable === "true"
    }

    // Get total count
    const total = await prisma.bundle.count({ where })

    // Get bundles with their products
    const bundles = await prisma.bundle.findMany({
      where,
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                salePrice: true,
                image: true,
                category: true,
              },
            },
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    })

    // Calculate potential savings for each bundle
    const bundlesWithSavings = bundles.map((bundle) => {
      // Calculate total price of default/required products
      const basePrice = bundle.products.reduce((sum, bp) => {
        const productPrice = Number(bp.product.salePrice || bp.product.price)
        return sum + productPrice * bp.maxQuantity
      }, 0)

      // Apply discount
      const discountedPrice = basePrice * (1 - bundle.discountPercent / 100)
      const savings = basePrice - discountedPrice

      return {
        ...bundle,
        calculatedPricing: {
          basePrice: Number(basePrice.toFixed(2)),
          discountedPrice: Number(discountedPrice.toFixed(2)),
          savings: Number(savings.toFixed(2)),
        },
      }
    })

    const totalPages = Math.ceil(total / params.pageSize)
    return paginatedResponse(bundlesWithSavings, {
      page: params.page,
      limit: params.pageSize,
      total,
      totalPages,
      hasNextPage: params.page < totalPages,
      hasPreviousPage: params.page > 1,
    })
  } catch (error) {
    logger.error("Failed to fetch bundles", error)
    return handleApiError(error)
  }
}
