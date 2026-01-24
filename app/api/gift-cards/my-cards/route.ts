/**
 * User Gift Cards API Route
 *
 * GET /api/gift-cards/my-cards - Get gift cards purchased by the authenticated user
 *
 * @module app/api/gift-cards/my-cards/route
 */

import { getServerAuth } from '@/lib/auth'
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit'
import {
  successResponse,
  rateLimitErrorResponse,
  unauthorizedResponse,
  handleApiError,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'
import {
  getUserPurchasedGiftCards,
  formatGiftCardCode,
  isExpired,
  GIFT_CARD_CONFIG,
} from '@/lib/gift-cards'

/**
 * GET /api/gift-cards/my-cards
 * Get all gift cards purchased by the authenticated user
 */
export async function GET(request: Request) {
  try {
    // Require authentication
    const { userId } = await getServerAuth()
    if (!userId) {
      return unauthorizedResponse('You must be signed in to view your gift cards')
    }

    // Apply rate limiting (standard rate)
    const identifier = getIdentifier(request, userId)
    const { success, reset } = await checkRateLimit(identifier)

    if (!success) {
      return rateLimitErrorResponse(reset)
    }

    // Fetch user's purchased gift cards
    const giftCards = await getUserPurchasedGiftCards(userId)

    // Format the response
    const formattedCards = giftCards.map((card: {
      id: string
      code: string
      initialBalance: number
      currentBalance: number
      status: string
      recipientEmail: string | null
      recipientName: string | null
      message: string | null
      expiresAt: Date | null
      purchasedAt: Date
      createdAt: Date
    }) => {
      // Check if expired but not yet updated in database
      const expired = isExpired(card.expiresAt)
      const effectiveStatus = expired && card.status === GIFT_CARD_CONFIG.STATUS.ACTIVE
        ? GIFT_CARD_CONFIG.STATUS.EXPIRED
        : card.status

      return {
        id: card.id,
        code: formatGiftCardCode(card.code),
        initialBalance: card.initialBalance,
        currentBalance: card.currentBalance,
        status: effectiveStatus,
        recipientEmail: card.recipientEmail,
        recipientName: card.recipientName,
        message: card.message,
        expiresAt: card.expiresAt,
        purchasedAt: card.purchasedAt,
      }
    })

    logger.info('User gift cards fetched', {
      userId,
      count: giftCards.length,
    })

    return successResponse({
      giftCards: formattedCards,
      total: formattedCards.length,
    })
  } catch (error) {
    logger.error('Failed to fetch user gift cards', error)
    return handleApiError(error)
  }
}
