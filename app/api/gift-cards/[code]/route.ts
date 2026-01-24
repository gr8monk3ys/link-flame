/**
 * Gift Card Balance Check API Route
 *
 * GET /api/gift-cards/[code] - Check gift card balance and status
 *
 * @module app/api/gift-cards/[code]/route
 */

import { checkRateLimit, getIdentifier } from '@/lib/rate-limit'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  rateLimitErrorResponse,
  handleApiError,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'
import {
  getGiftCardByCode,
  formatGiftCardCode,
  isValidCodeFormat,
  normalizeGiftCardCode,
  validateGiftCardForUse,
  isExpired,
  GIFT_CARD_CONFIG,
} from '@/lib/gift-cards'

interface RouteContext {
  params: Promise<{ code: string }>
}

/**
 * GET /api/gift-cards/[code]
 * Check gift card balance and status
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params

    // Apply rate limiting (standard rate)
    const identifier = getIdentifier(request)
    const { success, reset } = await checkRateLimit(identifier)

    if (!success) {
      return rateLimitErrorResponse(reset)
    }

    // Validate code format first
    if (!isValidCodeFormat(code)) {
      return errorResponse(
        'Invalid gift card code format',
        'INVALID_CODE_FORMAT',
        undefined,
        400
      )
    }

    // Look up the gift card
    const giftCard = await getGiftCardByCode(code)

    if (!giftCard) {
      return notFoundResponse('Gift card')
    }

    // Check if expired but not yet updated in database
    const expired = isExpired(giftCard.expiresAt)
    const effectiveStatus = expired && giftCard.status === GIFT_CARD_CONFIG.STATUS.ACTIVE
      ? GIFT_CARD_CONFIG.STATUS.EXPIRED
      : giftCard.status

    // Validate if card can be used
    const validation = validateGiftCardForUse({
      status: effectiveStatus,
      currentBalance: giftCard.currentBalance,
      expiresAt: giftCard.expiresAt,
    })

    logger.info('Gift card balance checked', {
      giftCardId: giftCard.id,
      status: effectiveStatus,
      isValid: validation.valid,
    })

    // Return gift card information
    return successResponse({
      code: formatGiftCardCode(giftCard.code),
      balance: giftCard.currentBalance,
      initialBalance: giftCard.initialBalance,
      status: effectiveStatus,
      expiresAt: giftCard.expiresAt,
      recipientName: giftCard.recipientName,
      isValid: validation.valid,
      validationMessage: validation.reason || null,
      recentTransactions: giftCard.transactions.map((tx) => ({
        amount: tx.amount,
        type: tx.type,
        date: tx.createdAt,
      })),
    })
  } catch (error) {
    logger.error('Failed to check gift card balance', error)
    return handleApiError(error)
  }
}
