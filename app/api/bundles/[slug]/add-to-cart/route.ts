import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { validateCsrfToken } from "@/lib/csrf"
import {
  handleApiError,
  notFoundResponse,
  successResponse,
  validationErrorResponse,
  rateLimitErrorResponse,
  errorResponse,
} from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit"
import { getServerAuth } from "@/lib/auth"
import { getGuestSessionId, getUserIdForCart } from "@/lib/session"

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// Schema for selected items
const selectedItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
})

const addToCartRequestSchema = z.object({
  selectedItems: z.array(selectedItemSchema).min(1).max(20),
})

/**
 * POST /api/bundles/[slug]/add-to-cart - Add configured bundle to cart
 */
export async function POST(request: NextRequest, context: RouteContext) {
  // Rate limit
  const identifier = getIdentifier(request)
  const { success, reset } = await checkRateLimit(`bundle-cart:${identifier}`)
  if (!success) {
    return rateLimitErrorResponse(reset)
  }

  try {
    // CSRF protection
    const csrfValid = await validateCsrfToken(request)
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      )
    }

    const { slug } = await context.params

    // Get user or guest session
    const { userId } = await getServerAuth()
    const cartUserId = await getUserIdForCart(userId)
    const sessionId = !userId ? await getGuestSessionId() : null

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
    const validation = addToCartRequestSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { selectedItems } = validation.data

    // Validate item count for customizable bundles
    const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0)

    if (bundle.minItems && totalItems < bundle.minItems) {
      return errorResponse(
        `Please select at least ${bundle.minItems} items to qualify for the bundle discount.`,
        "BUNDLE_MIN_ITEMS",
        { itemsNeeded: bundle.minItems - totalItems },
        400
      )
    }

    if (bundle.maxItems && totalItems > bundle.maxItems) {
      return errorResponse(
        `This bundle allows a maximum of ${bundle.maxItems} items.`,
        "BUNDLE_MAX_ITEMS",
        { itemsOver: totalItems - bundle.maxItems },
        400
      )
    }

    // Check that required items are included
    const requiredProductIds = bundle.products
      .filter((bp) => bp.isRequired)
      .map((bp) => bp.productId)

    const selectedProductIds = selectedItems.map((item) => item.productId)
    const missingRequired = requiredProductIds.filter(
      (id) => !selectedProductIds.includes(id)
    )

    if (missingRequired.length > 0) {
      return errorResponse(
        "Some required items are missing from your selection.",
        "BUNDLE_MISSING_REQUIRED",
        { missingProductIds: missingRequired },
        400
      )
    }

    // Get product details and calculate prices
    const productIds = selectedItems.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        title: true,
        price: true,
        salePrice: true,
        inventory: true,
      },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    // Validate inventory
    for (const item of selectedItems) {
      const product = productMap.get(item.productId)
      if (!product) {
        return errorResponse(
          `Product not found: ${item.productId}`,
          "PRODUCT_NOT_FOUND",
          undefined,
          400
        )
      }
      if (product.inventory < item.quantity) {
        return errorResponse(
          `Insufficient inventory for ${product.title}. Only ${product.inventory} available.`,
          "INSUFFICIENT_INVENTORY",
          { productId: product.id, available: product.inventory },
          400
        )
      }
    }

    // Calculate prices
    const itemsWithPrices = selectedItems.map((item) => {
      const product = productMap.get(item.productId)!
      const effectivePrice = Number(product.salePrice || product.price)
      return {
        productId: product.id,
        title: product.title,
        quantity: item.quantity,
        price: effectivePrice,
      }
    })

    const subtotal = itemsWithPrices.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const discountedTotal = subtotal * (1 - bundle.discountPercent / 100)

    // Create bundle selection record
    const bundleSelection = await prisma.bundleSelection.create({
      data: {
        bundleId: bundle.id,
        userId: userId || undefined,
        sessionId: sessionId || undefined,
        selectedItems: JSON.stringify(itemsWithPrices),
        totalPrice: subtotal,
        discountedPrice: discountedTotal,
        status: "in_cart",
      },
    })

    // Add individual items to cart
    // Note: We add them as individual cart items for checkout processing
    // The bundle selection ID can be stored for display purposes
    const cartOperations = selectedItems.map(async (item) => {
      // Check if cart item already exists for this user and product (without variant)
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          userId: cartUserId,
          productId: item.productId,
          variantId: null,
        },
      })

      if (existingItem) {
        // Update quantity
        return prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        })
      } else {
        // Create new cart item
        return prisma.cartItem.create({
          data: {
            userId: cartUserId,
            productId: item.productId,
            quantity: item.quantity,
          },
        })
      }
    })

    await Promise.all(cartOperations)

    logger.info("Bundle added to cart", {
      bundleId: bundle.id,
      bundleSlug: bundle.slug,
      selectionId: bundleSelection.id,
      userId: cartUserId,
      totalItems,
      subtotal,
      discountedTotal,
    })

    return successResponse(
      {
        success: true,
        selectionId: bundleSelection.id,
        bundle: {
          id: bundle.id,
          title: bundle.title,
          slug: bundle.slug,
          discountPercent: bundle.discountPercent,
        },
        items: itemsWithPrices,
        pricing: {
          subtotal: Number(subtotal.toFixed(2)),
          discountPercent: bundle.discountPercent,
          discountAmount: Number((subtotal - discountedTotal).toFixed(2)),
          total: Number(discountedTotal.toFixed(2)),
        },
        message: `${bundle.title} added to your cart with ${bundle.discountPercent}% savings!`,
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error("Failed to add bundle to cart", error)
    return handleApiError(error)
  }
}
