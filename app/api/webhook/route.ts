import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { errorResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { sendOrderConfirmation, isEmailConfigured } from "@/lib/email";
import { awardPurchasePoints } from "@/lib/loyalty";
import { storeOrderImpact } from "@/lib/impact";
import { getStripe } from "@/lib/stripe-server";

export const dynamic = 'force-dynamic'

function getWebhookSecret(): string {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }
  return process.env.STRIPE_WEBHOOK_SECRET;
}

/**
 * Validates the Stripe webhook signature
 */
function validateWebhookSignature(body: string, signature: string): Stripe.Event {
  return getStripe().webhooks.constructEvent(
    body,
    signature,
    getWebhookSecret()
  );
}

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

/**
 * Decrements inventory for paid order items (variant or product level).
 * Uses guarded updates to avoid negative inventory in race conditions.
 */
async function decrementInventoryFromOrderItems(
  tx: Prisma.TransactionClient,
  orderItems: OrderWithItems["items"]
) {
  for (const item of orderItems) {
    if (item.variantId) {
      const result = await tx.productVariant.updateMany({
        where: {
          id: item.variantId,
          inventory: { gte: item.quantity },
        },
        data: {
          inventory: {
            decrement: item.quantity,
          },
        },
      });

      if (result.count === 0) {
        throw new Error(`Insufficient variant inventory for ${item.variantId}`);
      }
    } else {
      const result = await tx.product.updateMany({
        where: {
          id: item.productId,
          inventory: { gte: item.quantity },
        },
        data: {
          inventory: {
            decrement: item.quantity,
          },
        },
      });

      if (result.count === 0) {
        throw new Error(`Insufficient product inventory for ${item.productId}`);
      }
    }
  }
}

/**
 * Remove purchased quantities from mutable cart state while preserving newer additions.
 */
async function reconcileUserCartWithOrderItems(
  tx: Prisma.TransactionClient,
  userId: string,
  orderItems: OrderWithItems["items"]
) {
  for (const item of orderItems) {
    const cartItem = await tx.cartItem.findFirst({
      where: {
        userId,
        productId: item.productId,
        variantId: item.variantId ?? null,
      },
    });

    if (!cartItem) {
      continue;
    }

    if (cartItem.quantity <= item.quantity) {
      await tx.cartItem.delete({
        where: { id: cartItem.id },
      });
      continue;
    }

    await tx.cartItem.update({
      where: { id: cartItem.id },
      data: {
        quantity: {
          decrement: item.quantity,
        },
      },
    });
  }
}

/**
 * Finalize a pending snapshot order after successful Stripe payment.
 */
async function finalizePendingOrderFromCheckout(
  session: Stripe.Checkout.Session,
  pendingOrder: OrderWithItems
) {
  return prisma.$transaction(async (tx) => {
    await decrementInventoryFromOrderItems(tx, pendingOrder.items);
    await reconcileUserCartWithOrderItems(tx, pendingOrder.userId, pendingOrder.items);

    return tx.order.update({
      where: { id: pendingOrder.id },
      data: {
        amount: (session.amount_total || 0) / 100,
        status: "paid",
        customerEmail: session.customer_details?.email || pendingOrder.customerEmail,
        customerName: session.customer_details?.name || pendingOrder.customerName,
      },
      include: {
        items: true,
      },
    });
  });
}

/**
 * Sends order confirmation email if configured
 */
async function sendOrderConfirmationEmail(orderId: string, customerEmail: string) {
  if (!isEmailConfigured()) {
    logger.info('Email service not configured - skipping order confirmation', { orderId });
    return;
  }

  if (!customerEmail) {
    logger.warn('No customer email available for order confirmation', { orderId });
    return;
  }

  try {
    // Fetch order with items for email
    const orderWithItems = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!orderWithItems || !orderWithItems.customerEmail) {
      return;
    }

    const emailResult = await sendOrderConfirmation(
      orderWithItems.customerEmail,
      {
        orderId: orderWithItems.id,
        items: orderWithItems.items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        total: Number(orderWithItems.amount),
        customerName: orderWithItems.customerName || 'Customer',
      }
    );

    if (emailResult.success) {
      logger.info('Order confirmation email sent', {
        orderId,
        email: customerEmail,
      });
    } else {
      logger.error('Failed to send order confirmation email', {
        orderId,
        email: customerEmail,
        error: emailResult.error,
      });
    }
  } catch (error: unknown) {
    // Log but don't fail the webhook if email fails
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error sending order confirmation email', {
      orderId,
      error: message,
    });
  }
}

/**
 * Stripe webhook handler
 */
export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  // Validate webhook signature
  try {
    event = validateWebhookSignature(body, signature);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Webhook signature verification failed - potential security issue', {
      error: message,
      hasSignature: !!signature,
      bodyLength: body.length,
    });
    return errorResponse(`Webhook Error: ${message}`, 'WEBHOOK_SIGNATURE_INVALID', undefined, 400);
  }

  logger.info('Webhook received', {
    type: event.type,
    id: event.id,
  });

  // Wrap processing in try-catch for retry-friendly error handling
  try {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session?.metadata?.userId;

    if (event.type === "checkout.session.completed") {
      logger.info('Processing checkout.session.completed', {
        sessionId: session.id,
        userId,
      });

      // Find pending order snapshot created at checkout session creation.
      const pendingOrder = await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
        include: {
          items: true,
        },
      });

      if (!pendingOrder) {
        logger.error("Pending checkout snapshot order not found", {
          sessionId: session.id,
          userId,
        });
        throw new Error(`Missing pending order snapshot for session ${session.id}`);
      }

      // IDEMPOTENCY CHECK: Prevent duplicate fulfillment if webhook is retried.
      if (pendingOrder.status === "paid") {
        logger.info("Order already finalized, skipping", {
          orderId: pendingOrder.id,
          sessionId: session.id,
        });
        return new NextResponse(null, { status: 200 });
      }

      if (pendingOrder.items.length === 0) {
        logger.error("Pending order has no items", {
          orderId: pendingOrder.id,
          sessionId: session.id,
        });
        throw new Error(`Pending order ${pendingOrder.id} has no items`);
      }

      // Finalize pending order and apply inventory/cart updates atomically.
      const order = await finalizePendingOrderFromCheckout(session, pendingOrder);

      logger.info('Order created from webhook', {
        orderId: order.id,
        userId: order.userId,
        sessionId: session.id,
        amount: order.amount,
        itemCount: order.items.length,
        inventoryUpdated: true,
        isGift: order.isGift,
      });

      // Send order confirmation email
      await sendOrderConfirmationEmail(order.id, order.customerEmail || '');

      // Award loyalty points for the purchase
      // Only award points for authenticated users (not guest sessions)
      if (order.userId && !order.userId.startsWith('guest_')) {
        try {
          const loyaltyResult = await awardPurchasePoints(order.userId, order.id, Number(order.amount));
          if (loyaltyResult.success) {
            logger.info('Loyalty points awarded for purchase', {
              userId: order.userId,
              orderId: order.id,
              pointsAwarded: loyaltyResult.pointsAwarded,
              orderAmount: order.amount,
            });
          }
        } catch (loyaltyError) {
          // Log but don't fail the webhook if loyalty points fail
          logger.error('Failed to award loyalty points', loyaltyError, {
            userId: order.userId,
            orderId: order.id,
            orderAmount: order.amount,
          });
        }
      }

      // Calculate and store environmental impact for the order
      // Only track impact for authenticated users (not guest sessions)
      if (order.userId && !order.userId.startsWith('guest_')) {
        try {
          const impactItems = order.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          }));

          const impactResult = await storeOrderImpact(order.id, order.userId, impactItems);

          logger.info('Environmental impact stored for order', {
            userId: order.userId,
            orderId: order.id,
            impactMetricsCount: impactResult.orderImpacts.length,
            milestonesAchieved: impactResult.milestones.length,
          });

          // Log any milestones achieved
          if (impactResult.milestones.length > 0) {
            logger.info('User achieved impact milestones', {
              userId: order.userId,
              orderId: order.id,
              milestones: impactResult.milestones,
            });
          }
        } catch (impactError) {
          // Log but don't fail the webhook if impact tracking fails
          logger.error('Failed to store environmental impact', impactError, {
            userId: order.userId,
            orderId: order.id,
          });
        }
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;

    // Critical error during order processing - log detailed info for debugging
    logger.error('Critical error processing webhook', {
      eventType: event.type,
      eventId: event.id,
      error: message,
      stack,
      userId: (event.data.object as Stripe.Checkout.Session)?.metadata?.userId,
      sessionId: (event.data.object as Stripe.Checkout.Session)?.id,
    });

    // Return 500 to trigger Stripe's automatic retry
    return errorResponse(
      'Internal error processing webhook - will be retried',
      'WEBHOOK_PROCESSING_ERROR',
      { eventId: event.id, willRetry: true },
      500
    );
  }
}
