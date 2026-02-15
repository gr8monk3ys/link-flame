/**
 * Subscription Webhook Handler
 *
 * Handles Stripe webhook events for subscription lifecycle management.
 * Implements idempotent processing to handle webhook retries safely.
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { logger } from '@/lib/logger'
import { errorResponse } from '@/lib/api-response'
import {
  type PlanId,
} from '@/lib/billing/plans'
import { mapStripeStatus, syncSubscriptionStatus } from '@/lib/billing/subscription'
import { getStripe } from '@/lib/stripe-server'

export const dynamic = 'force-dynamic'

function getWebhookSecret(): string {
  // Use a separate webhook secret for billing webhooks if available
  const secret = process.env.STRIPE_BILLING_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('Missing STRIPE_BILLING_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET')
  }
  return secret
}

/**
 * Validates the Stripe webhook signature
 */
function validateWebhookSignature(body: string, signature: string): Stripe.Event {
  return getStripe().webhooks.constructEvent(body, signature, getWebhookSecret())
}

/**
 * Check if an event has already been processed (idempotency)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  const existingEvent = await prisma.billingEvent.findUnique({
    where: { stripeEventId: eventId },
    select: { id: true },
  })

  return !!existingEvent
}

function getObjectId(value: string | { id: string } | null | undefined): string | null {
  if (!value) {
    return null
  }

  if (typeof value === 'string') {
    return value
  }

  return value.id
}

/**
 * Resolve organization ID from Stripe event payload/relations.
 */
async function resolveOrganizationIdFromEvent(event: Stripe.Event): Promise<string | null> {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'customer.subscription.trial_will_end': {
      const subscription = event.data.object as Stripe.Subscription
      return subscription.metadata?.organizationId || null
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const metadataOrgId = session.metadata?.organizationId
      if (metadataOrgId) {
        return metadataOrgId
      }

      if (session.mode === 'subscription' && session.subscription) {
        const subscriptionId = getObjectId(session.subscription)
        if (subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
          return subscription.metadata?.organizationId || null
        }
      }

      return null
    }

    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice

      const subscriptionId = getObjectId(invoice.subscription)
      if (subscriptionId) {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
        if (subscription.metadata?.organizationId) {
          return subscription.metadata.organizationId
        }
      }

      const customerId = getObjectId(invoice.customer)
      if (!customerId) {
        return null
      }

      const organization = await prisma.organization.findUnique({
        where: { stripeCustomerId: customerId },
        select: { id: true },
      })

      return organization?.id || null
    }

    case 'customer.updated': {
      const customer = event.data.object as Stripe.Customer
      const metadataOrgId = customer.metadata?.organizationId
      if (metadataOrgId) {
        return metadataOrgId
      }

      const organization = await prisma.organization.findUnique({
        where: { stripeCustomerId: customer.id },
        select: { id: true },
      })

      return organization?.id || null
    }

    default:
      return null
  }
}

/**
 * Mark an event as processed
 */
async function markEventProcessed(event: Stripe.Event): Promise<void> {
  const organizationId = await resolveOrganizationIdFromEvent(event)

  if (!organizationId) {
    logger.warn('Could not resolve organization for billing event; skipping persistence', {
      eventId: event.id,
      eventType: event.type,
    })
    return
  }

  try {
    await prisma.billingEvent.create({
      data: {
        organizationId,
        stripeEventId: event.id,
        eventType: event.type,
        eventData: JSON.stringify(event),
      },
    })
  } catch (error) {
    // Unique constraint means a concurrent worker already recorded this event.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      logger.info('Billing event already persisted by another worker', {
        eventId: event.id,
        eventType: event.type,
      })
      return
    }
    throw error
  }
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  const organizationId = subscription.metadata?.organizationId
  const planId = subscription.metadata?.planId as PlanId

  if (!organizationId) {
    logger.warn('Subscription created without organizationId', {
      subscriptionId: subscription.id,
    })
    return
  }

  logger.info('Processing subscription created', {
    subscriptionId: subscription.id,
    organizationId,
    planId,
    status: subscription.status,
  })

  // Sync subscription to database
  await syncSubscriptionStatus(organizationId, subscription)
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const organizationId = subscription.metadata?.organizationId

  if (!organizationId) {
    logger.warn('Subscription updated without organizationId', {
      subscriptionId: subscription.id,
    })
    return
  }

  const status = mapStripeStatus(subscription.status)

  logger.info('Processing subscription updated', {
    subscriptionId: subscription.id,
    organizationId,
    status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  })

  // Sync subscription to database
  await syncSubscriptionStatus(organizationId, subscription)
}

/**
 * Handle subscription deleted (cancelled) event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const organizationId = subscription.metadata?.organizationId

  if (!organizationId) {
    logger.warn('Subscription deleted without organizationId', {
      subscriptionId: subscription.id,
    })
    return
  }

  logger.info('Processing subscription deleted', {
    subscriptionId: subscription.id,
    organizationId,
  })

  // Sync final status to database (canceled => FREE entitlements).
  await syncSubscriptionStatus(organizationId, subscription)

  // Send cancellation email
  // await sendSubscriptionCancelledEmail(organizationId)
}

/**
 * Handle invoice payment succeeded
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId =
    typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id

  if (!subscriptionId) {
    // One-time payment, not subscription
    return
  }

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

  logger.info('Invoice payment succeeded', {
    invoiceId: invoice.id,
    subscriptionId,
    customerId,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
  })

  // Record payment in database for audit
  // await recordPayment(invoice)

  // Send receipt email (Stripe can do this automatically)
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId =
    typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id

  if (!subscriptionId) {
    return
  }

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

  logger.warn('Invoice payment failed', {
    invoiceId: invoice.id,
    subscriptionId,
    customerId,
    amount: invoice.amount_due / 100,
    attemptCount: invoice.attempt_count,
  })

  // Get subscription to find organization
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
  const organizationId = subscription.metadata?.organizationId

  if (organizationId) {
    // Update organization status
    // await prisma.organization.update({
    //   where: { id: organizationId },
    //   data: {
    //     subscriptionStatus: 'past_due',
    //     paymentFailedAt: new Date(),
    //   },
    // })

    // Send payment failed notification
    // await sendPaymentFailedEmail(organizationId, invoice)
  }
}

/**
 * Handle customer subscription trial ending
 */
async function handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
  const organizationId = subscription.metadata?.organizationId

  if (!organizationId) {
    return
  }

  const trialEndDate = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : new Date()

  logger.info('Trial will end soon', {
    subscriptionId: subscription.id,
    organizationId,
    trialEndDate: trialEndDate.toISOString(),
  })

  // Send trial ending notification
  // await sendTrialEndingEmail(organizationId, trialEndDate)
}

/**
 * Handle customer updated
 */
async function handleCustomerUpdated(customer: Stripe.Customer): Promise<void> {
  const organizationId = customer.metadata?.organizationId

  if (!organizationId) {
    return
  }

  logger.info('Customer updated', {
    customerId: customer.id,
    organizationId,
    email: customer.email,
  })

  // Sync customer data to organization
  // await prisma.organization.update({
  //   where: { id: organizationId },
  //   data: {
  //     billingEmail: customer.email,
  //   },
  // })
}

/**
 * Stripe billing webhook handler
 */
export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('Stripe-Signature')

  if (!signature) {
    return errorResponse('Missing Stripe signature', 'MISSING_SIGNATURE', undefined, 400)
  }

  let event: Stripe.Event

  // Validate webhook signature
  try {
    event = validateWebhookSignature(body, signature)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Billing webhook signature verification failed', {
      error: message,
      hasSignature: !!signature,
    })
    return errorResponse(`Webhook Error: ${message}`, 'WEBHOOK_SIGNATURE_INVALID', undefined, 400)
  }

  logger.info('Billing webhook received', {
    type: event.type,
    id: event.id,
  })

  // Check for duplicate event (idempotency)
  const alreadyProcessed = await isEventProcessed(event.id)
  if (alreadyProcessed) {
    logger.info('Webhook event already processed, skipping', {
      eventId: event.id,
      type: event.type,
    })
    return new NextResponse(null, { status: 200 })
  }

  try {
    // Handle different event types
    switch (event.type) {
      // Subscription lifecycle events
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription)
        break

      // Invoice/payment events
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      // Customer events
      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer)
        break

      // Checkout session completed (subscription started)
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id

          const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
          await handleSubscriptionCreated(subscription)
        }
        break
      }

      default:
        logger.info('Unhandled billing webhook event', { type: event.type })
    }

    // Mark event as processed
    await markEventProcessed(event)

    return new NextResponse(null, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const stack = error instanceof Error ? error.stack : undefined

    logger.error('Error processing billing webhook', {
      eventType: event.type,
      eventId: event.id,
      error: message,
      stack,
    })

    // Return 500 to trigger Stripe retry
    return errorResponse(
      'Internal error processing webhook - will be retried',
      'WEBHOOK_PROCESSING_ERROR',
      { eventId: event.id, willRetry: true },
      500
    )
  }
}
