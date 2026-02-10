/**
 * Stripe Server-Side Instance
 *
 * Provides a lazily-initialized Stripe instance for server-side operations.
 * Centralizes Stripe initialization to avoid duplication across checkout,
 * webhook, and billing routes.
 *
 * For client-side Stripe (publishable key), see lib/stripe-client.ts.
 */

import Stripe from 'stripe'

let stripe: Stripe | null = null

/**
 * Get the server-side Stripe instance.
 *
 * Uses a singleton pattern with lazy initialization so the application
 * can build even when STRIPE_SECRET_KEY is not set.
 *
 * @throws {Error} If STRIPE_SECRET_KEY is not set when called
 * @returns The initialized Stripe instance
 */
export function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable')
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }
  return stripe
}
