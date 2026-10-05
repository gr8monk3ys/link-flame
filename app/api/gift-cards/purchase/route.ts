/**
 * Gift Card Purchase Confirmation
 *
 * GET /api/gift-cards/purchase?session_id=cs_... - Confirm a paid gift card
 * checkout and return the card, including its code.
 *
 * Stripe redirects the buyer here (via /gift-cards) after payment. The session
 * ID is an unguessable bearer value only the buyer receives. The card is
 * activated only if Stripe itself reports the session as paid, so this is a
 * second, idempotent activation path alongside the webhook.
 *
 * @module app/api/gift-cards/purchase/route
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
import { getStripe } from '@/lib/stripe-server'
import {
  activatePaidGiftCard,
  formatGiftCardCode,
  GIFT_CARD_CHECKOUT_TYPE,
} from '@/lib/gift-cards'

export const dynamic = 'force-dynamic'

const SESSION_ID_PATTERN = /^cs_(test|live)_[A-Za-z0-9]{1,200}$/

export async function GET(request: Request) {
  try {
    const identifier = getIdentifier(request)
    const { success, reset } = await checkRateLimit(identifier)
    if (!success) {
      return rateLimitErrorResponse(reset)
    }

    const sessionId = new URL(request.url).searchParams.get('session_id') ?? ''
    if (!SESSION_ID_PATTERN.test(sessionId)) {
      return errorResponse('Invalid checkout session', 'INVALID_SESSION', undefined, 400)
    }

    let session
    try {
      session = await getStripe().checkout.sessions.retrieve(sessionId)
    } catch {
      return notFoundResponse('Checkout session')
    }

    const giftCardId = session.metadata?.giftCardId
    if (session.metadata?.type !== GIFT_CARD_CHECKOUT_TYPE || !giftCardId) {
      return notFoundResponse('Gift card purchase')
    }

    if (session.payment_status !== 'paid') {
      return errorResponse(
        'Payment has not been confirmed yet',
        'PAYMENT_PENDING',
        undefined,
        409
      )
    }

    const giftCard = await activatePaidGiftCard(giftCardId, session.id)
    if (!giftCard) {
      logger.error('Paid gift card session has no activatable card', {
        sessionId: session.id,
        giftCardId,
      })
      return notFoundResponse('Gift card')
    }

    return successResponse({
      id: giftCard.id,
      code: formatGiftCardCode(giftCard.code),
      amount: giftCard.initialBalance,
      balance: giftCard.currentBalance,
      status: giftCard.status,
      expiresAt: giftCard.expiresAt,
    })
  } catch (error) {
    logger.error('Failed to confirm gift card purchase', error)
    return handleApiError(error)
  }
}
