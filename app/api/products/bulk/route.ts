import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  rateLimitErrorResponse,
} from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit"

// Schema for bulk product fetch
const bulkProductsSchema = z.object({
  ids: z
    .array(z.string().min(1, "Product ID cannot be empty"))
    .min(1, "At least one product ID is required")
    .max(50, "Cannot fetch more than 50 products at once"),
  includeVariants: z.boolean().optional().default(false),
  includeReviews: z.boolean().optional().default(false),
})

/**
 * POST /api/products/bulk
 * Fetch multiple products by IDs in a single request
 * This is more efficient than making multiple individual requests
 */
export async function POST(request: NextRequest) {
  // Rate limit to prevent abuse
  const identifier = getIdentifier(request)
  const { success, reset } = await checkRateLimit("products-bulk:" + identifier)
  if (!success) {
    return rateLimitErrorResponse(reset)
  }

  try {
    const body = await request.json()

    // Validate input
    const validation = bulkProductsSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { ids, includeVariants, includeReviews } = validation.data

    // Build include clause based on options
    const include: {
      variants?: boolean
      reviews?: { select: { rating: boolean } }
      values?: {
        include: {
          value: {
            select: {
              id: boolean
              name: boolean
              slug: boolean
              iconName: boolean
            }
          }
        }
      }
    } = {
      values: {
        include: {
          value: {
            select: {
              id: true,
              name: true,
              slug: true,
              iconName: true,
            },
          },
        },
      },
    }

    if (includeVariants) {
      include.variants = true
    }

    if (includeReviews) {
      include.reviews = {
        select: { rating: true },
      }
    }

    // Fetch products in a single query
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
      },
      include,
    })

    // Normalize and transform the data
    const normalizedProducts = products.map((product) => {
      const basePrice = Number(product.price)
      const salePrice = product.salePrice ? Number(product.salePrice) : null

      // Calculate imperfect price if applicable
      let imperfectPrice = null
      if (product.isImperfect && product.imperfectDiscount) {
        const effectivePrice = salePrice ?? basePrice
        imperfectPrice = effectivePrice * (1 - product.imperfectDiscount / 100)
      }

      // Flatten values for easier frontend consumption
      // Use unknown cast to handle Prisma's complex conditional include types
      const productValues = product.values as unknown as Array<{
        value: { id: string; name: string; slug: string; iconName: string | null }
      }> | undefined
      const values = productValues?.map((pva) => pva.value) || []

      return {
        ...product,
        price: basePrice,
        salePrice,
        imperfectPrice,
        values,
      }
    })

    // Create a map for ordered response matching the input order
    const productMap = new Map(normalizedProducts.map((p) => [p.id, p]))
    const orderedProducts = ids
      .map((id) => productMap.get(id))
      .filter((p): p is typeof normalizedProducts[0] => p !== undefined)

    return successResponse({
      products: orderedProducts,
      found: orderedProducts.length,
      requested: ids.length,
      missing: ids.filter((id) => !productMap.has(id)),
    })
  } catch (error) {
    logger.error("Failed to fetch bulk products", error)
    return handleApiError(error)
  }
}
