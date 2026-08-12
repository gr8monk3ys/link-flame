import { logger } from '@/lib/logger'

/**
 * Resolves the signing secret for one Stripe webhook route.
 *
 * Two routes verify Stripe signatures - /api/webhook and
 * /api/subscriptions/webhook - and the latter used to fall back to the
 * shared STRIPE_WEBHOOK_SECRET whenever its dedicated secret was unset. That
 * fallback makes one leaked secret enough to forge events against both,
 * and the subscription route mutates subscription state, so a forged event
 * there can grant paid access.
 *
 * Stripe signs each endpoint's events with *that endpoint's* signing secret, so
 * in a correctly configured production account every route that actually
 * receives traffic already has its own secret. The fallback's only real use is
 * local development, where `stripe listen` forwards to several paths under a
 * single secret. So it is kept there and refused in production.
 */
export function resolveWebhookSecret(dedicatedName: string): string {
  const dedicated = process.env[dedicatedName]
  if (dedicated) {
    return dedicated
  }

  const shared = process.env.STRIPE_WEBHOOK_SECRET

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `Missing ${dedicatedName}. Register this route as its own webhook ` +
        `endpoint in the Stripe dashboard and set ${dedicatedName} to its ` +
        `signing secret. Falling back to the shared STRIPE_WEBHOOK_SECRET is ` +
        `refused in production: one leaked secret would forge events for every ` +
        `webhook route.`
    )
  }

  if (!shared) {
    throw new Error(`Missing ${dedicatedName} or STRIPE_WEBHOOK_SECRET`)
  }

  logger.warn(
    `${dedicatedName} not set; using the shared STRIPE_WEBHOOK_SECRET. ` +
      `This is allowed in development only - production requires a dedicated secret.`
  )
  return shared
}
