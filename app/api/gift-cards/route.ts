/**
 * Gift Cards API Routes
 *
 * POST /api/gift-cards - Start a gift card purchase (returns a Stripe Checkout URL)
 *
 * The card is created PENDING_PAYMENT and its code is never returned here. It
 * is activated by the Stripe webhook or /api/gift-cards/purchase once Stripe
 * reports the session paid.
 *
 * @module app/api/gift-cards/route
 */

import { z } from 'zod'
import { getServerAuth } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { checkStrictRateLimit, getIdentifier } from '@/lib/rate-limit'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  rateLimitErrorResponse,
  handleApiError,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { getStripe } from '@/lib/stripe-server'
import { getBaseUrl } from '@/lib/url'
import {
  cancelUnpaidGiftCard,
  createGiftCard,
  GIFT_CARD_CONFIG,
  GIFT_CARD_CHECKOUT_TYPE,
} from '@/lib/gift-cards'

export const dynamic = 'force-dynamic'

// Validation schema for purchasing a gift card
const PurchaseGiftCardSchema = z.object({
  amount: z
    .number()
    .min(GIFT_CARD_CONFIG.MIN_AMOUNT, `Minimum amount is $${GIFT_CARD_CONFIG.MIN_AMOUNT}`)
    .max(GIFT_CARD_CONFIG.MAX_AMOUNT, `Maximum amount is $${GIFT_CARD_CONFIG.MAX_AMOUNT}`),
  recipientEmail: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email address too long')
    .optional()
    .nullable(),
  recipientName: z
    .string()
    .min(1, 'Recipient name is required')
    .max(100, 'Recipient name too long')
    .optional()
    .nullable(),
  message: z
    .string()
    .max(500, 'Message cannot exceed 500 characters')
    .optional()
    .nullable(),
  expiryDays: z
    .number()
    .int()
    .min(30, 'Expiry must be at least 30 days')
    .max(730, 'Expiry cannot exceed 2 years')
    .optional()
    .nullable(),
})

/**
 * POST /api/gift-cards
 * Purchase a new gift card
 */
export async function POST(request: Request) {
  try {
    // CSRF protection
    const csrfValid = await validateCsrfToken(request)
    if (!csrfValid) {
      return errorResponse(
        'Invalid or missing CSRF token',
        'CSRF_VALIDATION_FAILED',
        undefined,
        403
      )
    }

    // Get authenticated user ID (optional for gift card purchases)
    const { userId } = await getServerAuth()

    // Apply strict rate limiting (5 requests per minute)
    const identifier = getIdentifier(request, userId)
    const { success, reset } = await checkStrictRateLimit(identifier)

    if (!success) {
      return rateLimitErrorResponse(reset)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = PurchaseGiftCardSchema.safeParse(body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { recipientEmail, recipientName, message, expiryDays } = validation.data
    // Charge whole cents and store exactly what was charged.
    const amountCents = Math.round(validation.data.amount * 100)
    const amount = amountCents / 100

    const giftCard = await createGiftCard({
      amount,
      purchaserId: userId,
      recipientEmail,
      recipientName,
      message,
      expiryDays,
    })

    let checkoutUrl: string | null
    try {
      const session = await getStripe().checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: amountCents,
              product_data: {
                name: `Link Flame Gift Card ($${amount.toFixed(2)})`,
              },
            },
          },
        ],
        metadata: {
          type: GIFT_CARD_CHECKOUT_TYPE,
          giftCardId: giftCard.id,
          userId: userId || '',
        },
        success_url: `${getBaseUrl()}/gift-cards?gift_card_session={CHECKOUT_SESSION_ID}`,
        cancel_url: `${getBaseUrl()}/gift-cards`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      })
      checkoutUrl = session.url
    } catch (stripeError) {
      await cancelUnpaidGiftCard(giftCard.id)
      throw stripeError
    }

    if (!checkoutUrl) {
      await cancelUnpaidGiftCard(giftCard.id)
      throw new Error('Stripe did not return a checkout URL')
    }

    logger.info('Gift card checkout started', {
      giftCardId: giftCard.id,
      amount,
      purchaserId: userId,
      hasRecipient: !!recipientEmail,
    })

    return successResponse({ checkoutUrl }, undefined, 201)
  } catch (error) {
    logger.error('Failed to purchase gift card', error)
    return handleApiError(error)
  }
}
