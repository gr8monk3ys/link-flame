/**
 * Unsubscribe links for the newsletter.
 *
 * A link carries the subscription's id and an HMAC of that id, never the
 * email address: a URL ends up in mail-scanner logs, browser history and
 * analytics, and an email address there is personal data we do not need to
 * put in it.
 *
 * The token has no expiry on purpose. An unsubscribe link has to keep working
 * for as long as the email that carries it sits in an inbox.
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { getBaseUrl } from '@/lib/url'

const TOKEN_CONTEXT = 'newsletter-unsubscribe'

// Lazy, so importing this module during `next build` does not need the secret.
function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET is required to sign unsubscribe links in production.')
  }
  return 'newsletter-unsubscribe-dev-only'
}

export function createUnsubscribeToken(subscriptionId: string): string {
  return createHmac('sha256', getSecret())
    .update(`${TOKEN_CONTEXT}:${subscriptionId}`)
    .digest('base64url')
}

export function verifyUnsubscribeToken(subscriptionId: string, token: string): boolean {
  if (!subscriptionId || !token) return false
  const expected = Buffer.from(createUnsubscribeToken(subscriptionId))
  const given = Buffer.from(token)
  // timingSafeEqual throws on a length mismatch, so compare lengths first.
  if (expected.length !== given.length) return false
  return timingSafeEqual(expected, given)
}

/** The link that goes in an email footer. */
export function buildUnsubscribeUrl(subscriptionId: string): string {
  const params = new URLSearchParams({
    id: subscriptionId,
    t: createUnsubscribeToken(subscriptionId),
  })
  return `${getBaseUrl()}/unsubscribe?${params.toString()}`
}
