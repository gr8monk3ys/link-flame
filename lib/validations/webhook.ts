import type Stripe from 'stripe'

/**
 * Extracts gift options from Stripe session metadata.
 * Shared between the webhook handler and unit tests.
 */
export function extractGiftOptions(metadata: Stripe.Metadata | null) {
  if (!metadata) {
    return {
      isGift: false,
      giftMessage: null,
      giftRecipientName: null,
      giftRecipientEmail: null,
      hidePrice: false,
    }
  }

  return {
    isGift: metadata.isGift === 'true',
    giftMessage: metadata.giftMessage || null,
    giftRecipientName: metadata.giftRecipientName || null,
    giftRecipientEmail: metadata.giftRecipientEmail || null,
    hidePrice: metadata.hidePrice === 'true',
  }
}

/**
 * Converts Stripe amount in cents to a dollar amount.
 */
export function convertCentsToAmount(cents: number): number {
  return cents / 100
}
