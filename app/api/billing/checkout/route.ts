/**
 * Subscription Checkout API
 *
 * Creates Stripe Checkout sessions for subscription purchases.
 * Handles plan selection, billing interval, and trial periods.
 */

import { z } from 'zod'
import { getServerAuth } from '@/lib/auth'
import { checkStrictRateLimit, getIdentifier } from '@/lib/rate-limit'
import { validateCsrfToken } from '@/lib/csrf'
import {
  errorResponse,
  handleApiError,
  rateLimitErrorResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { getBaseUrl } from '@/lib/url'
import {
  type PlanId,
  type BillingInterval,
  SAAS_PLANS,
  isFreePlan,
  getStripePriceId,
} from '@/lib/billing/plans'
import {
  createCheckoutSession,
  getOrCreateStripeCustomer,
  SubscriptionError,
} from '@/lib/billing/subscription'

export const dynamic = 'force-dynamic'

/**
 * Validation schema for checkout request
 */
const CheckoutSchema = z.object({
  planId: z.enum(['STARTER', 'PRO'] as const, {
    errorMap: () => ({ message: 'Invalid plan. Choose STARTER or PRO.' }),
  }),
  interval: z.enum(['monthly', 'yearly'] as const, {
    errorMap: () => ({ message: 'Invalid interval. Choose monthly or yearly.' }),
  }),
  organizationId: z.string().min(1, 'Organization ID is required'),
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  enableTrial: z.boolean().default(true),
})

type CheckoutRequest = z.infer<typeof CheckoutSchema>

/**
 * POST /api/billing/checkout
 *
 * Create a Stripe Checkout session for subscription purchase
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

    // Authentication check
    const { userId, user } = await getServerAuth()
    if (!userId) {
      return unauthorizedResponse('You must be logged in to subscribe')
    }

    // Rate limiting
    const identifier = getIdentifier(request, userId)
    const { success, reset } = await checkStrictRateLimit(identifier)
    if (!success) {
      return rateLimitErrorResponse(reset)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = CheckoutSchema.safeParse(body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { planId, interval, organizationId, email, name, enableTrial } = validation.data

    // Verify the plan exists and is not free
    if (isFreePlan(planId)) {
      return errorResponse(
        'Free plan does not require checkout',
        'INVALID_PLAN',
        undefined,
        400
      )
    }

    const plan = SAAS_PLANS[planId]
    if (!plan) {
      return errorResponse('Invalid plan selected', 'INVALID_PLAN', undefined, 400)
    }

    // Verify price ID is configured
    const priceId = getStripePriceId(planId, interval)
    if (!priceId) {
      logger.error('Missing Stripe price ID', {
        planId,
        interval,
        envVar: interval === 'monthly'
          ? `STRIPE_${planId}_MONTHLY_PRICE_ID`
          : `STRIPE_${planId}_YEARLY_PRICE_ID`,
      })
      return errorResponse(
        'Subscription configuration error. Please contact support.',
        'PRICE_NOT_CONFIGURED',
        undefined,
        500
      )
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      organizationId,
      email,
      name || user?.name || undefined,
      { userId }
    )

    // Build success/cancel URLs
    const baseUrl = getBaseUrl()
    const successUrl = `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/billing/plans?cancelled=true`

    // Create checkout session
    const session = await createCheckoutSession(
      organizationId,
      planId,
      interval,
      successUrl,
      cancelUrl,
      email,
      customerId,
      enableTrial
    )

    logger.info('Created subscription checkout session', {
      userId,
      organizationId,
      planId,
      interval,
      sessionId: session.id,
      trialEnabled: enableTrial,
    })

    return successResponse({
      sessionId: session.id,
      sessionUrl: session.url,
      planId,
      interval,
      trialDays: enableTrial ? 14 : 0,
    })
  } catch (error) {
    if (error instanceof SubscriptionError) {
      logger.error('Subscription error during checkout', error, {
        code: error.code,
      })
      return errorResponse(error.message, error.code, undefined, 400)
    }

    logger.error('Checkout failed', error)
    return handleApiError(error)
  }
}

/**
 * GET /api/billing/checkout
 *
 * Get checkout session details (for verifying success)
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) {
      return unauthorizedResponse('You must be logged in')
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return errorResponse('Session ID is required', 'MISSING_SESSION_ID', undefined, 400)
    }

    // Import Stripe directly for session retrieval
    const StripeModule = await import('stripe')
    const stripe = new StripeModule.default(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
    })

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    // Verify session belongs to this user's organization
    // Additional authorization check would go here

    // Type-safe handling of subscription and customer
    const subscription = typeof session.subscription === 'object' && session.subscription !== null
      ? session.subscription
      : null

    const customer = typeof session.customer === 'object' && session.customer !== null
      ? session.customer
      : null

    // Get customer email (handle DeletedCustomer case)
    const customerEmail = session.customer_email ||
      (customer && 'email' in customer ? customer.email : null)

    return successResponse({
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail,
      planId: session.metadata?.planId,
      interval: session.metadata?.interval,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            trialEnd: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          }
        : null,
    })
  } catch (error) {
    logger.error('Failed to get checkout session', error)
    return handleApiError(error)
  }
}
