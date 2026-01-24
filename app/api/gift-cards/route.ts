/**
 * Gift Cards API Routes
 *
 * POST /api/gift-cards - Purchase a new gift card
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
import {
  createGiftCard,
  formatGiftCardCode,
  GIFT_CARD_CONFIG,
} from '@/lib/gift-cards'

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

    const { amount, recipientEmail, recipientName, message, expiryDays } = validation.data

    // Create the gift card
    const giftCard = await createGiftCard({
      amount,
      purchaserId: userId,
      recipientEmail,
      recipientName,
      message,
      expiryDays,
    })

    logger.info('Gift card purchased', {
      giftCardId: giftCard.id,
      amount,
      purchaserId: userId,
      hasRecipient: !!recipientEmail,
    })

    // Return the created gift card (with formatted code for display)
    return successResponse(
      {
        id: giftCard.id,
        code: formatGiftCardCode(giftCard.code),
        amount: giftCard.initialBalance,
        balance: giftCard.currentBalance,
        status: giftCard.status,
        expiresAt: giftCard.expiresAt,
      },
      undefined,
      201
    )
  } catch (error) {
    logger.error('Failed to purchase gift card', error)
    return handleApiError(error)
  }
}
