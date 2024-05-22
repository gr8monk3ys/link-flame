import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

/**
 * Get the Stripe.js instance for client-side operations.
 * Uses singleton pattern to ensure only one instance is created.
 *
 * @returns Promise resolving to Stripe instance or null if publishable key is not configured
 */
export function getStripeClient(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!publishableKey || isPlaceholderKey(publishableKey)) {
      console.warn(
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured. ' +
        'Apple Pay and Google Pay will not be available.'
      )
      return Promise.resolve(null)
    }

    stripePromise = loadStripe(publishableKey)
  }

  return stripePromise
}

/**
 * Check if Stripe is properly configured on the client side.
 *
 * @returns boolean indicating if the publishable key is present
 */
export function isStripeConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  return Boolean(key && !isPlaceholderKey(key))
}

function isPlaceholderKey(key: string): boolean {
  const normalized = key.trim().toLowerCase()
  return (
    normalized.includes('placeholder') ||
    normalized.includes('your_stripe_publishable_key') ||
    normalized === 'pk_test_placeholder'
  )
}
