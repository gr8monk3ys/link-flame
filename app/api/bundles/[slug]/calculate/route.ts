import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  handleApiError,
  notFoundResponse,
  successResponse,
  validationErrorResponse,
  rateLimitErrorResponse,
} from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit"

interface RouteContext {
  params: Promise<{ slug: string }>
}

// Schema for selected items
const selectedItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
})

const calculateRequestSchema = z.object({
  selectedItems: z.array(selectedItemSchema).min(1).max(20),
})

/**
 * POST /api/bundles/[slug]/calculate - Calculate price for selected items
 */
export async function POST(request: NextRequest, context: RouteContext) {
  // Rate limit
  const identifier = getIdentifier(request)
  const { success, reset } = await checkRateLimit(`bundle-calc:${identifier}`)
  if (!success) {
    return rateLimitErrorResponse(reset)
  }

  try {
    const { slug } = await context.params

    // Get bundle
    const bundle = await prisma.bundle.findUnique({
      where: { slug, isActive: true },
      include: {
        products: {
          select: {
            productId: true,
            isRequired: true,
            maxQuantity: true,
          },
        },
      },
    })

    if (!bundle) {
      return notFoundResponse("Bundle")
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = calculateRequestSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { selectedItems } = validation.data

    // Validate item count for customizable bundles
    const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0)

    if (bundle.minItems && totalItems < bundle.minItems) {
      return successResponse({
        valid: false,
        error: `Please select at least ${bundle.minItems} items to qualify for the bundle discount.`,
        itemsNeeded: bundle.minItems - totalItems,
        totalItems,
      })
    }

    if (bundle.maxItems && totalItems > bundle.maxItems) {
      return successResponse({
        valid: false,
        error: `This bundle allows a maximum of ${bundle.maxItems} items.`,
        itemsOver: totalItems - bundle.maxItems,
        totalItems,
      })
    }

    // Check that required items are included (for customizable bundles)
    const requiredProductIds = bundle.products
      .filter((bp) => bp.isRequired)
      .map((bp) => bp.productId)

    const selectedProductIds = selectedItems.map((item) => item.productId)
    const missingRequired = requiredProductIds.filter(
      (id) => !selectedProductIds.includes(id)
    )

    if (missingRequired.length > 0) {
      // Get names of missing products
      const missingProducts = await prisma.product.findMany({
        where: { id: { in: missingRequired } },
        select: { id: true, title: true },
      })

      return successResponse({
        valid: false,
        error: "Some required items are missing from your selection.",
        missingProducts,
        totalItems,
      })
    }

    // Get product prices
    const productIds = selectedItems.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        title: true,
        price: true,
        salePrice: true,
        image: true,
        inventory: true,
      },
    })

    // Create a map for quick lookup
    const productMap = new Map(products.map((p) => [p.id, p]))

    // Check inventory and calculate prices
    const itemsWithPrices = []
    let hasInventoryIssue = false
    const inventoryIssues: Array<{ productId: string; title: string; available: number; requested: number }> = []

    for (const item of selectedItems) {
      const product = productMap.get(item.productId)
      if (!product) {
        return successResponse({
          valid: false,
          error: `Product ${item.productId} not found.`,
        })
      }

      if (product.inventory < item.quantity) {
        hasInventoryIssue = true
        inventoryIssues.push({
          productId: product.id,
          title: product.title,
          available: product.inventory,
          requested: item.quantity,
        })
      }

      const effectivePrice = Number(product.salePrice || product.price)
      itemsWithPrices.push({
        productId: product.id,
        title: product.title,
        image: product.image,
        quantity: item.quantity,
        unitPrice: effectivePrice,
        lineTotal: effectivePrice * item.quantity,
      })
    }

    if (hasInventoryIssue) {
      return successResponse({
        valid: false,
        error: "Some items have insufficient inventory.",
        inventoryIssues,
        totalItems,
      })
    }

    // Calculate totals
    const subtotal = itemsWithPrices.reduce((sum, item) => sum + item.lineTotal, 0)
    const discountAmount = subtotal * (bundle.discountPercent / 100)
    const total = subtotal - discountAmount

    return successResponse({
      valid: true,
      items: itemsWithPrices,
      summary: {
        totalItems,
        subtotal: Number(subtotal.toFixed(2)),
        discountPercent: bundle.discountPercent,
        discountAmount: Number(discountAmount.toFixed(2)),
        total: Number(total.toFixed(2)),
        savings: Number(discountAmount.toFixed(2)),
      },
      bundleInfo: {
        id: bundle.id,
        title: bundle.title,
        slug: bundle.slug,
        minItems: bundle.minItems,
        maxItems: bundle.maxItems,
      },
    })
  } catch (error) {
    logger.error("Failed to calculate bundle price", error)
    return handleApiError(error)
  }
}
