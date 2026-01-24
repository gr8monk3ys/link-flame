import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  handleApiError,
  notFoundResponse,
  successResponse,
  rateLimitErrorResponse,
} from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit"

interface RouteContext {
  params: Promise<{ slug: string }>
}

/**
 * GET /api/bundles/[slug] - Get bundle details with available products
 */
export async function GET(request: NextRequest, context: RouteContext) {
  // Rate limit
  const identifier = getIdentifier(request)
  const { success, reset } = await checkRateLimit(`bundle:${identifier}`)
  if (!success) {
    return rateLimitErrorResponse(reset)
  }

  try {
    const { slug } = await context.params

    // Get bundle with products
    const bundle = await prisma.bundle.findUnique({
      where: { slug, isActive: true },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                description: true,
                price: true,
                salePrice: true,
                image: true,
                category: true,
                inventory: true,
              },
            },
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    })

    if (!bundle) {
      return notFoundResponse("Bundle")
    }

    // For customizable bundles, also fetch available products from the category
    let availableProducts: Array<{
      id: string
      title: string
      description: string | null
      price: number
      salePrice: number | null
      image: string
      category: string
      inventory: number
    }> = []

    if (bundle.isCustomizable && bundle.category) {
      availableProducts = await prisma.product.findMany({
        where: {
          category: bundle.category,
          inventory: { gt: 0 },
        },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          salePrice: true,
          image: true,
          category: true,
          inventory: true,
        },
        orderBy: {
          title: "asc",
        },
      })
    } else if (bundle.isCustomizable) {
      // If no category filter, get all products
      availableProducts = await prisma.product.findMany({
        where: {
          inventory: { gt: 0 },
        },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          salePrice: true,
          image: true,
          category: true,
          inventory: true,
        },
        take: 50, // Limit for performance
        orderBy: {
          title: "asc",
        },
      })
    }

    // Calculate pricing based on bundle products
    const bundleProducts = bundle.products.map((bp) => ({
      ...bp,
      effectivePrice: bp.product.salePrice || bp.product.price,
    }))

    // For fixed bundles, calculate the total
    const basePrice = bundleProducts.reduce((sum, bp) => {
      return sum + bp.effectivePrice * bp.maxQuantity
    }, 0)

    const discountedPrice = basePrice * (1 - bundle.discountPercent / 100)
    const savings = basePrice - discountedPrice

    return successResponse({
      ...bundle,
      products: bundleProducts,
      availableProducts: bundle.isCustomizable ? availableProducts : [],
      pricing: {
        basePrice: Number(basePrice.toFixed(2)),
        discountedPrice: Number(discountedPrice.toFixed(2)),
        savings: Number(savings.toFixed(2)),
        discountPercent: bundle.discountPercent,
      },
    })
  } catch (error) {
    logger.error("Failed to fetch bundle", error)
    return handleApiError(error)
  }
}
