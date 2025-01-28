import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import {
  isEmailConfigured,
  sendOrderConfirmation,
  sendSubscriptionPaymentFailedEmail,
} from '@/lib/email';
import { awardPurchasePoints } from '@/lib/loyalty';
import { getStripe } from '@/lib/stripe-server';
import {
  createOrderFromSubscriptionInvoice,
  type SubscriptionInvoiceContext,
} from '@/lib/stripe-subscription';

export const dynamic = 'force-dynamic';

function getWebhookSecret(): string {
  const dedicatedSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;
  if (dedicatedSecret) {
    return dedicatedSecret;
  }

  const sharedSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sharedSecret) {
    throw new Error(
      'Missing STRIPE_SUBSCRIPTION_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET'
    );
  }

  logger.warn(
    'STRIPE_SUBSCRIPTION_WEBHOOK_SECRET not set; using STRIPE_WEBHOOK_SECRET fallback'
  );
  return sharedSecret;
}

function validateWebhookSignature(body: string, signature: string): Stripe.Event {
  return getStripe().webhooks.constructEvent(body, signature, getWebhookSecret());
}

function resolveSubscriptionId(
  value: string | { id: string } | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  return value.id;
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') {
    return;
  }

  const localSubscriptionId = session.metadata?.subscriptionId;
  const stripeSubscriptionId = resolveSubscriptionId(session.subscription);

  if (!localSubscriptionId || !stripeSubscriptionId) {
    logger.warn('Subscription checkout session missing identifiers', {
      sessionId: session.id,
      localSubscriptionId,
      stripeSubscriptionId,
    });
    return;
  }

  const stripeSubscription = await getStripe().subscriptions.retrieve(
    stripeSubscriptionId,
    {
      expand: ['items.data.price'],
    }
  );

  await prisma.$transaction(async (tx) => {
    const existingSubscription = await tx.subscription.findUnique({
      where: { id: localSubscriptionId },
      select: { id: true },
    });

    if (!existingSubscription) {
      logger.warn('Local subscription not found during checkout completion', {
        localSubscriptionId,
        stripeSubscriptionId,
      });
      return;
    }

    const subscriptionUpdateData: {
      status: string;
      stripeSubscriptionId: string;
      stripeStatus: string;
      paymentFailedCount: number;
      paymentFailedAt: null;
      nextDeliveryDate?: Date;
    } = {
      status: stripeSubscription.pause_collection ? 'PAUSED' : 'ACTIVE',
      stripeSubscriptionId,
      stripeStatus: stripeSubscription.status,
      paymentFailedCount: 0,
      paymentFailedAt: null,
    };

    if (stripeSubscription.current_period_end) {
      subscriptionUpdateData.nextDeliveryDate = new Date(
        stripeSubscription.current_period_end * 1000
      );
    }

    await tx.subscription.update({
      where: { id: localSubscriptionId },
      data: subscriptionUpdateData,
    });

    for (const stripeItem of stripeSubscription.items.data) {
      const stripePrice = stripeItem.price as Stripe.Price;
      const subscriptionItemId = stripePrice.metadata?.subscriptionItemId;

      if (!subscriptionItemId) {
        continue;
      }

      await tx.subscriptionItem.updateMany({
        where: {
          id: subscriptionItemId,
          subscriptionId: localSubscriptionId,
        },
        data: {
          stripePriceId: stripePrice.id,
        },
      });
    }
  });

  logger.info('Subscription checkout completed', {
    sessionId: session.id,
    localSubscriptionId,
    stripeSubscriptionId,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.id) {
    logger.warn('invoice.paid missing invoice id');
    return;
  }

  const stripeSubscriptionId = resolveSubscriptionId(invoice.subscription);
  if (!stripeSubscriptionId) {
    return;
  }

  const subscription = await prisma.subscription.findUnique({
    where: {
      stripeSubscriptionId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  if (!subscription) {
    logger.warn('No local subscription found for invoice.paid', {
      stripeSubscriptionId,
      invoiceId: invoice.id,
    });
    return;
  }

  const { order, created } = await createOrderFromSubscriptionInvoice(
    subscription as SubscriptionInvoiceContext,
    invoice
  );

  if (!created) {
    logger.info('Skipping duplicate invoice.paid side-effects', {
      invoiceId: invoice.id,
      stripeSubscriptionId,
      orderId: order.id,
    });
    return;
  }

  if (isEmailConfigured() && order.customerEmail) {
    await sendOrderConfirmation(order.customerEmail, {
      orderId: order.id,
      items: order.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      total: Number(order.amount),
      customerName: order.customerName || subscription.user.name || 'Customer',
    });
  }

  try {
    await awardPurchasePoints(subscription.userId, order.id, Number(order.amount));
  } catch (error) {
    logger.error('Failed to award loyalty points for subscription invoice', error, {
      orderId: order.id,
      userId: subscription.userId,
      invoiceId: invoice.id,
    });
  }

  logger.info('Subscription invoice processed', {
    invoiceId: invoice.id,
    orderId: order.id,
    subscriptionId: subscription.id,
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = resolveSubscriptionId(invoice.subscription);
  if (!stripeSubscriptionId) {
    return;
  }

  const subscription = await prisma.subscription.findUnique({
    where: {
      stripeSubscriptionId,
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (!subscription) {
    logger.warn('No local subscription found for invoice.payment_failed', {
      stripeSubscriptionId,
      invoiceId: invoice.id,
    });
    return;
  }

  const updatedSubscription = await prisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      paymentFailedCount: {
        increment: 1,
      },
      paymentFailedAt: new Date(),
      stripeStatus: 'past_due',
      status:
        subscription.paymentFailedCount + 1 >= 3
          ? 'PAYMENT_FAILED'
          : subscription.status,
    },
    select: {
      visibleId: true,
      paymentFailedCount: true,
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (updatedSubscription.user.email) {
    await sendSubscriptionPaymentFailedEmail(
      updatedSubscription.user.email,
      updatedSubscription.visibleId,
      updatedSubscription.user.name || 'Customer',
      updatedSubscription.paymentFailedCount
    );
  }

  logger.warn('Subscription invoice payment failed', {
    invoiceId: invoice.id,
    stripeSubscriptionId,
    paymentFailedCount: updatedSubscription.paymentFailedCount,
  });
}

async function handleCustomerSubscriptionDeleted(
  deletedSubscription: { id: string }
) {
  const result = await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: deletedSubscription.id,
    },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      stripeStatus: 'canceled',
    },
  });

  if (result.count === 0) {
    logger.warn('No local subscription found for customer.subscription.deleted', {
      stripeSubscriptionId: deletedSubscription.id,
    });
  }
}

async function handleCustomerSubscriptionUpdated(
  updatedSubscription: Stripe.Subscription
) {
  const nextStatus = updatedSubscription.pause_collection
    ? 'PAUSED'
    : updatedSubscription.status === 'past_due'
      ? 'PAYMENT_FAILED'
      : updatedSubscription.status === 'canceled'
        ? 'CANCELLED'
        : 'ACTIVE';

  const updateData: {
    status: string;
    stripeStatus: string;
    nextDeliveryDate?: Date;
    cancelledAt?: Date;
    pausedAt?: Date | null;
  } = {
    status: nextStatus,
    stripeStatus: updatedSubscription.status,
  };

  if (updatedSubscription.current_period_end) {
    updateData.nextDeliveryDate = new Date(
      updatedSubscription.current_period_end * 1000
    );
  }

  if (nextStatus === 'PAUSED') {
    updateData.pausedAt = new Date();
  } else if (nextStatus === 'ACTIVE') {
    updateData.pausedAt = null;
  } else if (nextStatus === 'CANCELLED') {
    updateData.cancelledAt = new Date();
  }

  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: updatedSubscription.id,
    },
    data: updateData,
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('Stripe-Signature');

  if (!signature) {
    return errorResponse(
      'Missing Stripe signature',
      'WEBHOOK_SIGNATURE_MISSING',
      undefined,
      400
    );
  }

  let event: Stripe.Event;
  try {
    event = validateWebhookSignature(body, signature);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown signature error';
    logger.error('Subscription webhook signature verification failed', {
      message,
    });
    return errorResponse(
      `Webhook Error: ${message}`,
      'WEBHOOK_SIGNATURE_INVALID',
      undefined,
      400
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.deleted':
        await handleCustomerSubscriptionDeleted(
          event.data.object as { id: string }
        );
        break;
      case 'customer.subscription.updated':
        await handleCustomerSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      default:
        logger.info('Ignoring unhandled subscription webhook event', {
          type: event.type,
          eventId: event.id,
        });
        break;
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Subscription webhook processing failed', {
      eventType: event.type,
      eventId: event.id,
      message,
    });

    return errorResponse(
      'Internal error processing subscription webhook',
      'SUBSCRIPTION_WEBHOOK_PROCESSING_ERROR',
      { eventId: event.id, willRetry: true },
      500
    );
  }
}
