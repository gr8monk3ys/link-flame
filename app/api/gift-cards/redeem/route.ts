/**
 * Gift Card Redemption API Route
 *
 * POST /api/gift-cards/redeem - Redeem gift card at checkout
 *
 * @module app/api/gift-cards/redeem/route
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
  unauthorizedResponse,
  handleApiError,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'
import {
  redeemGiftCard,
  formatGiftCardCode,
  isValidCodeFormat,
  normalizeGiftCardCode,
} from '@/lib/gift-cards'

// Validation schema for redeeming a gift card
const RedeemGiftCardSchema = z.object({
  code: z
    .string()
    .min(1, 'Gift card code is required')
    .max(20, 'Gift card code too long'), // Allow for dashes in input
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(10000, 'Amount cannot exceed $10,000'),
  orderId: z.string().optional(),
})

/**
 * POST /api/gift-cards/redeem
 * Redeem gift card at checkout
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

    // Require authentication for redemption
    const { userId } = await getServerAuth()
    if (!userId) {
      return unauthorizedResponse('You must be signed in to redeem a gift card')
    }

    // Apply strict rate limiting (5 requests per minute)
    const identifier = getIdentifier(request, userId)
    const { success, reset } = await checkStrictRateLimit(identifier)

    if (!success) {
      return rateLimitErrorResponse(reset)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = RedeemGiftCardSchema.safeParse(body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { code, amount, orderId } = validation.data

    // Validate code format
    if (!isValidCodeFormat(code)) {
      return errorResponse(
        'Invalid gift card code format',
        'INVALID_CODE_FORMAT',
        undefined,
        400
      )
    }

    // Attempt to redeem the gift card
    const result = await redeemGiftCard(code, amount, orderId)

    if (!result.success) {
      return errorResponse(
        result.error,
        'REDEMPTION_FAILED',
        undefined,
        400
      )
    }

    logger.info('Gift card redeemed', {
      code: normalizeGiftCardCode(code),
      amountRequested: amount,
      amountApplied: result.amountApplied,
      remainingBalance: result.remainingBalance,
      userId,
      orderId,
    })

    // Return redemption details
    return successResponse({
      amountApplied: result.amountApplied,
      remainingBalance: result.remainingBalance,
      code: formatGiftCardCode(normalizeGiftCardCode(code)),
    })
  } catch (error) {
    logger.error('Failed to redeem gift card', error)
    return handleApiError(error)
  }
}
