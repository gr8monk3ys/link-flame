import { NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getUserIdForCart } from '@/lib/session'
import { checkStrictRateLimit, getIdentifier } from '@/lib/rate-limit'
import {
  handleApiError,
  rateLimitErrorResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'
import Stripe from 'stripe'

// Initialize Stripe lazily to allow build without secret key
let stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY')
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
    })
  }
  return stripe
}

// Define validation schema for express checkout data
const ExpressCheckoutSchema = z.object({
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID is required'),
      variantId: z.string().nullable().optional(),
      quantity: z.number().int().min(1).max(99),
    })
  ).min(1, 'At least one item is required'),
})

/**
 * Express checkout API endpoint for Apple Pay / Google Pay / Wallet payments.
 * This endpoint processes payments using a payment method ID from the Payment Request API.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getServerAuth()

    // Apply strict rate limiting for checkout
    const identifier = getIdentifier(request, userId)
    const { success, reset } = await checkStrictRateLimit(identifier)

    if (!success) {
      return rateLimitErrorResponse(reset)
    }

    const userIdToUse = await getUserIdForCart(userId)
    const data = await request.json()

    // Validate request data
    const validation = ExpressCheckoutSchema.safeParse(data)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { paymentMethodId, items } = validation.data

    // Get cart items from database to verify prices (server-side source of truth)
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: userIdToUse,
      },
      include: {
        product: true,
        variant: true,
      },
    })

    if (cartItems.length === 0) {
      return errorResponse('Cart is empty', undefined, undefined, 400)
    }

    // Verify inventory and calculate total with SERVER-SIDE prices
    let serverTotal = 0
    const orderItems: Array<{
      productId: string
      variantId: string | null
      title: string
      price: number
      quantity: number
    }> = []

    for (const cartItem of cartItems) {
      const product = cartItem.product
      const variant = cartItem.variant

      // Check inventory availability (variant or product level)
      const availableInventory = variant ? variant.inventory : product.inventory
      const inventorySource = variant
        ? `${product.title} (${[variant.size, variant.color, variant.material].filter(Boolean).join(', ')})`
        : product.title

      if (availableInventory < cartItem.quantity) {
        return errorResponse(
          `Insufficient inventory for ${inventorySource}. Only ${availableInventory} available.`,
          undefined,
          undefined,
          400
        )
      }

      // Use server-side prices (NEVER trust client-provided prices)
      const actualPrice =
        variant?.salePrice ?? variant?.price ?? product.salePrice ?? product.price
      serverTotal += actualPrice * cartItem.quantity

      // Build product name with variant info
      let productName = product.title
      if (variant) {
        const variantParts = [variant.size, variant.color, variant.material].filter(Boolean)
        if (variantParts.length > 0) {
          productName += ` (${variantParts.join(', ')})`
        }
      }

      orderItems.push({
        productId: product.id,
        variantId: variant?.id || null,
        title: productName,
        price: actualPrice,
        quantity: cartItem.quantity,
      })
    }

    logger.info('Creating express checkout payment intent', {
      userId: userIdToUse,
      itemCount: cartItems.length,
      total: serverTotal,
    })

    try {
      // Create a PaymentIntent with the payment method
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: Math.round(serverTotal * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        metadata: {
          userId: userIdToUse,
          orderItemCount: String(cartItems.length),
        },
      })

      // Check if payment succeeded
      if (paymentIntent.status !== 'succeeded') {
        logger.warn('Payment not immediately successful', {
          userId: userIdToUse,
          status: paymentIntent.status,
        })

        // Handle requires_action (3D Secure, etc.)
        if (paymentIntent.status === 'requires_action') {
          return errorResponse(
            'Additional authentication required. Please use standard checkout.',
            'REQUIRES_ACTION',
            undefined,
            400
          )
        }

        return errorResponse(
          'Payment could not be processed. Please try again.',
          undefined,
          undefined,
          400
        )
      }

      // Payment succeeded - create the order
      // Note: stripeSessionId field is used to store payment intent ID for express checkout
      const order = await prisma.order.create({
        data: {
          userId: userIdToUse,
          amount: serverTotal,
          status: 'paid',
          stripeSessionId: paymentIntent.id, // Store payment intent ID here
          paymentMethod: 'express_checkout', // Track that this was via Apple Pay/Google Pay
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
            })),
          },
        },
      })

      // Clear the user's cart after successful order
      await prisma.cartItem.deleteMany({
        where: {
          userId: userIdToUse,
        },
      })

      // Update inventory for each item
      for (const cartItem of cartItems) {
        if (cartItem.variantId) {
          await prisma.productVariant.update({
            where: { id: cartItem.variantId },
            data: {
              inventory: {
                decrement: cartItem.quantity,
              },
            },
          })
        } else {
          await prisma.product.update({
            where: { id: cartItem.productId },
            data: {
              inventory: {
                decrement: cartItem.quantity,
              },
            },
          })
        }
      }

      logger.info('Express checkout completed successfully', {
        orderId: order.id,
        userId: userIdToUse,
        total: serverTotal,
        paymentIntentId: paymentIntent.id,
      })

      return NextResponse.json({
        success: true,
        orderId: order.id,
        redirectUrl: `/order-confirmation?orderId=${order.id}`,
      })
    } catch (stripeError) {
      logger.error('Stripe payment processing failed', stripeError, {
        userId: userIdToUse,
      })

      // Handle specific Stripe errors
      if (stripeError instanceof Stripe.errors.StripeCardError) {
        return errorResponse(
          stripeError.message || 'Your card was declined. Please try a different payment method.',
          'CARD_ERROR',
          undefined,
          400
        )
      }

      return errorResponse(
        'Failed to process payment. Please try again.',
        undefined,
        undefined,
        500
      )
    }
  } catch (error) {
    logger.error('Express checkout failed', error)
    return handleApiError(error)
  }
}
