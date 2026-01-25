/**
 * Stripe Subscription Management
 *
 * Provides helper functions for managing Stripe subscriptions,
 * checkout sessions, and customer portal access.
 */

import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import {
  type PlanId,
  type BillingInterval,
  type SubscriptionStatus,
  getStripePriceId,
  isFreePlan,
  SAAS_PLANS,
  TRIAL_PERIOD_DAYS,
} from './plans'

// Initialize Stripe lazily to allow build without secret key
let stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable')
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
      typescript: true,
    })
  }
  return stripe
}

/**
 * Error class for subscription-related errors
 */
export class SubscriptionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly stripeError?: Stripe.errors.StripeError
  ) {
    super(message)
    this.name = 'SubscriptionError'
  }
}

/**
 * Result of subscription creation
 */
export interface CreateSubscriptionResult {
  subscriptionId: string
  clientSecret: string | null
  status: SubscriptionStatus
}

/**
 * Create or get a Stripe customer for an organization
 */
export async function getOrCreateStripeCustomer(
  organizationId: string,
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<string> {
  try {
    // Check if organization already has a Stripe customer ID
    // This would require a stripeCustomerId field on Organization model
    // For now, we'll search by metadata

    // Search for existing customer
    const existingCustomers = await getStripe().customers.list({
      email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      const existingCustomer = existingCustomers.data[0]

      // Update metadata if needed
      if (organizationId && existingCustomer.metadata?.organizationId !== organizationId) {
        await getStripe().customers.update(existingCustomer.id, {
          metadata: {
            ...existingCustomer.metadata,
            organizationId,
          },
        })
      }

      return existingCustomer.id
    }

    // Create new customer
    const customer = await getStripe().customers.create({
      email,
      name,
      metadata: {
        organizationId,
        ...metadata,
      },
    })

    logger.info('Created Stripe customer', {
      customerId: customer.id,
      organizationId,
      email,
    })

    return customer.id
  } catch (error) {
    logger.error('Failed to get or create Stripe customer', error, { organizationId, email })
    throw new SubscriptionError(
      'Failed to create customer',
      'CUSTOMER_CREATION_FAILED',
      error instanceof Error && 'type' in error ? (error as Stripe.errors.StripeError) : undefined
    )
  }
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  organizationId: string,
  planId: PlanId,
  interval: BillingInterval,
  successUrl: string,
  cancelUrl: string,
  customerEmail: string,
  customerId?: string,
  trialPeriod: boolean = true
): Promise<Stripe.Checkout.Session> {
  // Free plan doesn't need a checkout session
  if (isFreePlan(planId)) {
    throw new SubscriptionError('Free plan does not require checkout', 'INVALID_PLAN')
  }

  const priceId = getStripePriceId(planId, interval)

  if (!priceId) {
    throw new SubscriptionError(`No price ID configured for plan: ${planId} (${interval})`, 'MISSING_PRICE_ID')
  }

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organizationId,
        planId,
        interval,
      },
      subscription_data: {
        metadata: {
          organizationId,
          planId,
        },
        ...(trialPeriod && { trial_period_days: TRIAL_PERIOD_DAYS }),
      },
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      tax_id_collection: {
        enabled: true,
      },
    }

    // Add customer if ID provided, otherwise use email
    if (customerId) {
      sessionParams.customer = customerId
    } else {
      sessionParams.customer_email = customerEmail
    }

    const session = await getStripe().checkout.sessions.create(sessionParams)

    logger.info('Created subscription checkout session', {
      sessionId: session.id,
      organizationId,
      planId,
      interval,
    })

    return session
  } catch (error) {
    logger.error('Failed to create checkout session', error, {
      organizationId,
      planId,
      interval,
    })
    throw new SubscriptionError(
      'Failed to create checkout session',
      'CHECKOUT_SESSION_FAILED',
      error instanceof Error && 'type' in error ? (error as Stripe.errors.StripeError) : undefined
    )
  }
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    logger.info('Created customer portal session', {
      customerId,
      sessionId: session.id,
    })

    return session
  } catch (error) {
    logger.error('Failed to create customer portal session', error, { customerId })
    throw new SubscriptionError(
      'Failed to create customer portal session',
      'PORTAL_SESSION_FAILED',
      error instanceof Error && 'type' in error ? (error as Stripe.errors.StripeError) : undefined
    )
  }
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    return await getStripe().subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'latest_invoice'],
    })
  } catch (error) {
    logger.error('Failed to retrieve subscription', error, { subscriptionId })
    throw new SubscriptionError(
      'Failed to retrieve subscription',
      'SUBSCRIPTION_NOT_FOUND',
      error instanceof Error && 'type' in error ? (error as Stripe.errors.StripeError) : undefined
    )
  }
}

/**
 * Update subscription to a different plan
 */
export async function updateSubscription(
  subscriptionId: string,
  newPlanId: PlanId,
  newInterval: BillingInterval,
  prorate: boolean = true
): Promise<Stripe.Subscription> {
  const priceId = getStripePriceId(newPlanId, newInterval)

  if (!priceId) {
    throw new SubscriptionError(`No price ID configured for plan: ${newPlanId} (${newInterval})`, 'MISSING_PRICE_ID')
  }

  try {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId)

    const updatedSubscription = await getStripe().subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: prorate ? 'create_prorations' : 'none',
      metadata: {
        planId: newPlanId,
      },
    })

    logger.info('Updated subscription', {
      subscriptionId,
      newPlanId,
      newInterval,
      prorate,
    })

    return updatedSubscription
  } catch (error) {
    logger.error('Failed to update subscription', error, {
      subscriptionId,
      newPlanId,
      newInterval,
    })
    throw new SubscriptionError(
      'Failed to update subscription',
      'SUBSCRIPTION_UPDATE_FAILED',
      error instanceof Error && 'type' in error ? (error as Stripe.errors.StripeError) : undefined
    )
  }
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelImmediately: boolean = false
): Promise<Stripe.Subscription> {
  try {
    const subscription = cancelImmediately
      ? await getStripe().subscriptions.cancel(subscriptionId)
      : await getStripe().subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        })

    logger.info('Cancelled subscription', {
      subscriptionId,
      cancelImmediately,
      cancelAt: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : 'immediately',
    })

    return subscription
  } catch (error) {
    logger.error('Failed to cancel subscription', error, { subscriptionId })
    throw new SubscriptionError(
      'Failed to cancel subscription',
      'SUBSCRIPTION_CANCEL_FAILED',
      error instanceof Error && 'type' in error ? (error as Stripe.errors.StripeError) : undefined
    )
  }
}

/**
 * Reactivate a cancelled subscription (if still within period)
 */
export async function reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await getStripe().subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })

    logger.info('Reactivated subscription', { subscriptionId })

    return subscription
  } catch (error) {
    logger.error('Failed to reactivate subscription', error, { subscriptionId })
    throw new SubscriptionError(
      'Failed to reactivate subscription',
      'SUBSCRIPTION_REACTIVATE_FAILED',
      error instanceof Error && 'type' in error ? (error as Stripe.errors.StripeError) : undefined
    )
  }
}

/**
 * Pause a subscription (requires Stripe Billing configuration)
 */
export async function pauseSubscription(
  subscriptionId: string,
  resumeAt?: Date
): Promise<Stripe.Subscription> {
  try {
    const params: Stripe.SubscriptionUpdateParams = {
      pause_collection: {
        behavior: 'void',
        ...(resumeAt && { resumes_at: Math.floor(resumeAt.getTime() / 1000) }),
      },
    }

    const subscription = await getStripe().subscriptions.update(subscriptionId, params)

    logger.info('Paused subscription', {
      subscriptionId,
      resumeAt: resumeAt?.toISOString(),
    })

    return subscription
  } catch (error) {
    logger.error('Failed to pause subscription', error, { subscriptionId })
    throw new SubscriptionError(
      'Failed to pause subscription',
      'SUBSCRIPTION_PAUSE_FAILED',
      error instanceof Error && 'type' in error ? (error as Stripe.errors.StripeError) : undefined
    )
  }
}

/**
 * Resume a paused subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await getStripe().subscriptions.update(subscriptionId, {
      pause_collection: null,
    })

    logger.info('Resumed subscription', { subscriptionId })

    return subscription
  } catch (error) {
    logger.error('Failed to resume subscription', error, { subscriptionId })
    throw new SubscriptionError(
      'Failed to resume subscription',
      'SUBSCRIPTION_RESUME_FAILED',
      error instanceof Error && 'type' in error ? (error as Stripe.errors.StripeError) : undefined
    )
  }
}

/**
 * Get upcoming invoice for a subscription
 */
export async function getUpcomingInvoice(
  customerId: string,
  subscriptionId?: string
): Promise<Stripe.UpcomingInvoice> {
  try {
    const params: Stripe.InvoiceRetrieveUpcomingParams = {
      customer: customerId,
    }

    if (subscriptionId) {
      params.subscription = subscriptionId
    }

    return await getStripe().invoices.retrieveUpcoming(params)
  } catch (error) {
    logger.error('Failed to get upcoming invoice', error, { customerId, subscriptionId })
    throw new SubscriptionError(
      'Failed to get upcoming invoice',
      'UPCOMING_INVOICE_FAILED',
      error instanceof Error && 'type' in error ? (error as Stripe.errors.StripeError) : undefined
    )
  }
}

/**
 * Preview price change for a subscription
 */
export async function previewSubscriptionChange(
  subscriptionId: string,
  newPlanId: PlanId,
  newInterval: BillingInterval
): Promise<{
  proratedAmount: number
  newAmount: number
  immediateCharge: number
  creditApplied: number
}> {
  const priceId = getStripePriceId(newPlanId, newInterval)

  if (!priceId) {
    throw new SubscriptionError(`No price ID configured for plan: ${newPlanId} (${newInterval})`, 'MISSING_PRICE_ID')
  }

  try {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId)

    const invoice = await getStripe().invoices.retrieveUpcoming({
      subscription: subscriptionId,
      subscription_items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      subscription_proration_behavior: 'create_prorations',
    })

    // Calculate prorations from line items
    let proratedAmount = 0
    let creditApplied = 0

    for (const line of invoice.lines.data) {
      if (line.proration) {
        if (line.amount > 0) {
          proratedAmount += line.amount
        } else {
          creditApplied += Math.abs(line.amount)
        }
      }
    }

    const newPlan = SAAS_PLANS[newPlanId]
    const newAmount = newInterval === 'monthly'
      ? (newPlan.priceMonthly || 0) * 100
      : (newPlan.priceYearly || 0) * 100

    return {
      proratedAmount: proratedAmount / 100,
      newAmount: newAmount / 100,
      immediateCharge: Math.max(0, invoice.amount_due / 100),
      creditApplied: creditApplied / 100,
    }
  } catch (error) {
    logger.error('Failed to preview subscription change', error, {
      subscriptionId,
      newPlanId,
      newInterval,
    })
    throw new SubscriptionError(
      'Failed to preview subscription change',
      'PREVIEW_FAILED',
      error instanceof Error && 'type' in error ? (error as Stripe.errors.StripeError) : undefined
    )
  }
}

/**
 * Apply a coupon to a subscription
 */
export async function applyCoupon(subscriptionId: string, couponId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await getStripe().subscriptions.update(subscriptionId, {
      coupon: couponId,
    })

    logger.info('Applied coupon to subscription', {
      subscriptionId,
      couponId,
    })

    return subscription
  } catch (error) {
    logger.error('Failed to apply coupon', error, { subscriptionId, couponId })
    throw new SubscriptionError(
      'Failed to apply coupon',
      'COUPON_APPLY_FAILED',
      error instanceof Error && 'type' in error ? (error as Stripe.errors.StripeError) : undefined
    )
  }
}

/**
 * Get payment methods for a customer
 */
export async function getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
  try {
    const paymentMethods = await getStripe().paymentMethods.list({
      customer: customerId,
      type: 'card',
    })

    return paymentMethods.data
  } catch (error) {
    logger.error('Failed to get payment methods', error, { customerId })
    throw new SubscriptionError(
      'Failed to get payment methods',
      'PAYMENT_METHODS_FAILED',
      error instanceof Error && 'type' in error ? (error as Stripe.errors.StripeError) : undefined
    )
  }
}

/**
 * Set default payment method for a customer
 */
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> {
  try {
    const customer = await getStripe().customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    logger.info('Set default payment method', {
      customerId,
      paymentMethodId,
    })

    return customer
  } catch (error) {
    logger.error('Failed to set default payment method', error, {
      customerId,
      paymentMethodId,
    })
    throw new SubscriptionError(
      'Failed to set default payment method',
      'DEFAULT_PAYMENT_METHOD_FAILED',
      error instanceof Error && 'type' in error ? (error as Stripe.errors.StripeError) : undefined
    )
  }
}

/**
 * Get invoices for a customer
 */
export async function getInvoices(
  customerId: string,
  limit: number = 10
): Promise<Stripe.Invoice[]> {
  try {
    const invoices = await getStripe().invoices.list({
      customer: customerId,
      limit,
    })

    return invoices.data
  } catch (error) {
    logger.error('Failed to get invoices', error, { customerId })
    throw new SubscriptionError(
      'Failed to get invoices',
      'INVOICES_FAILED',
      error instanceof Error && 'type' in error ? (error as Stripe.errors.StripeError) : undefined
    )
  }
}

/**
 * Map Stripe subscription status to our status type
 */
export function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'active',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    past_due: 'past_due',
    paused: 'paused',
    trialing: 'trialing',
    unpaid: 'unpaid',
  }

  return statusMap[stripeStatus] || 'incomplete'
}

/**
 * Sync subscription status from Stripe to database
 */
export async function syncSubscriptionStatus(
  organizationId: string,
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  try {
    const status = mapStripeStatus(stripeSubscription.status)
    const planId = stripeSubscription.metadata?.planId as PlanId | undefined

    // Update organization subscription status in database
    // This would require Organization model with subscription fields
    logger.info('Syncing subscription status', {
      organizationId,
      subscriptionId: stripeSubscription.id,
      status,
      planId,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    })

    // When Organization model exists:
    // await prisma.organization.update({
    //   where: { id: organizationId },
    //   data: {
    //     stripeSubscriptionId: stripeSubscription.id,
    //     subscriptionStatus: status,
    //     planId: planId,
    //     currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    //   },
    // })
  } catch (error) {
    logger.error('Failed to sync subscription status', error, {
      organizationId,
      subscriptionId: stripeSubscription.id,
    })
    throw error
  }
}
