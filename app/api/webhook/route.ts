import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { errorResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { sendOrderConfirmation, isEmailConfigured, sendOutOfStockRefundEmail } from "@/lib/email";
import { awardPurchasePoints, finalizePointsRedemption, reversePointsHold } from "@/lib/loyalty";
import { storeOrderImpact } from "@/lib/impact";
import { getStripe } from "@/lib/stripe-server";
import { finalizeGiftCardHold, reverseGiftCardHold } from "@/lib/gift-cards";

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

async function deleteStripeCouponIfPresent(couponId: string | null | undefined) {
  if (!couponId) {
    return;
  }

  try {
    await getStripe().coupons.del(couponId);
  } catch (error) {
    const stripeError = error as { code?: string; type?: string; message?: string };
    // Idempotent cleanup: missing coupon is fine.
    if (stripeError.code === 'resource_missing' || stripeError.type === 'invalid_request_error') {
      logger.info('Stripe coupon already deleted', { couponId });
      return;
    }
    throw error;
  }
}

async function finalizeCheckoutDiscountHolds(
  order: OrderWithItems,
  session: Stripe.Checkout.Session
) {
  const giftCardHoldTransactionId = session.metadata?.giftCardHoldTransactionId;

  if (order.loyaltyRedemptionId) {
    await finalizePointsRedemption(order.loyaltyRedemptionId, order.id);
  }

  if (order.giftCardId && giftCardHoldTransactionId) {
    await finalizeGiftCardHold(giftCardHoldTransactionId, order.id);
  }

  await deleteStripeCouponIfPresent(order.stripeCouponId);
}

async function reverseCheckoutDiscountHolds(
  order: Pick<OrderWithItems, "id" | "loyaltyRedemptionId" | "giftCardId" | "giftCardAmountUsed" | "stripeCouponId">,
  session: Stripe.Checkout.Session
) {
  if (order.loyaltyRedemptionId) {
    await reversePointsHold(order.loyaltyRedemptionId);
  }

  const giftCardHoldTransactionId = session.metadata?.giftCardHoldTransactionId;
  if (
    order.giftCardId &&
    order.giftCardAmountUsed &&
    giftCardHoldTransactionId
  ) {
    await reverseGiftCardHold(
      giftCardHoldTransactionId,
      order.giftCardId,
      Number(order.giftCardAmountUsed)
    );
  }

  await deleteStripeCouponIfPresent(order.stripeCouponId);
}

/**
 * Handles auto-refund when inventory is exhausted between checkout and payment.
 * Issues a full Stripe refund, updates the order status, and notifies the customer.
 */
async function handleOutOfStockAutoRefund(
  session: Stripe.Checkout.Session,
  pendingOrder: OrderWithItems,
  reason: string
) {
  const paymentIntentId = session.payment_intent as string;

  if (paymentIntentId) {
    try {
      await getStripe().refunds.create({ payment_intent: paymentIntentId });
    } catch (refundError) {
      logger.error('Failed to auto-refund out-of-stock order', refundError, {
        orderId: pendingOrder.id,
        paymentIntentId,
      });
      throw refundError;
    }
  }

  await prisma.order.update({
    where: { id: pendingOrder.id },
    data: {
      status: 'refunded',
      refundReason: `out_of_stock: ${reason}`,
      refundedAt: new Date(),
      refundAmount: (session.amount_total || Math.round(Number(pendingOrder.amount) * 100)) / 100,
    },
  });

  // Best-effort cleanup for checkout discount holds.
  try {
    await reverseCheckoutDiscountHolds(
      {
        id: pendingOrder.id,
        loyaltyRedemptionId: pendingOrder.loyaltyRedemptionId,
        giftCardId: pendingOrder.giftCardId,
        giftCardAmountUsed: pendingOrder.giftCardAmountUsed,
        stripeCouponId: pendingOrder.stripeCouponId,
      },
      session
    );
  } catch (holdError) {
    logger.error('Failed to reverse discount holds for out-of-stock refund', holdError, {
      orderId: pendingOrder.id,
      sessionId: session.id,
    });
  }

  logger.warn('Order auto-refunded due to inventory exhaustion', {
    orderId: pendingOrder.id,
    sessionId: session.id,
    reason,
  });

  // Send out-of-stock notification email
  if (pendingOrder.customerEmail) {
    try {
      await sendOutOfStockRefundEmail(
        pendingOrder.customerEmail,
        pendingOrder.id,
        pendingOrder.customerName || 'Customer'
      );
    } catch (emailError) {
      logger.error('Failed to send out-of-stock email', emailError, {
        orderId: pendingOrder.id,
      });
    }
  }
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
      let order: OrderWithItems;
      try {
        order = await finalizePendingOrderFromCheckout(session, pendingOrder);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('Insufficient')) {
          await handleOutOfStockAutoRefund(session, pendingOrder, error.message);
          return new NextResponse(null, { status: 200 });
        }
        throw error;
      }

      logger.info('Order created from webhook', {
        orderId: order.id,
        userId: order.userId,
        sessionId: session.id,
        amount: order.amount,
        itemCount: order.items.length,
        inventoryUpdated: true,
        isGift: order.isGift,
      });

      // Finalize discount holds created during checkout.
      await finalizeCheckoutDiscountHolds(order, session);

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
    } else if (event.type === "checkout.session.expired") {
      logger.info('Processing checkout.session.expired', {
        sessionId: session.id,
        userId,
      });

      // Find pending order by stripeSessionId and mark as failed
      const pendingOrder = await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
        select: {
          id: true,
          status: true,
          userId: true,
          stripeCouponId: true,
          loyaltyRedemptionId: true,
          giftCardId: true,
          giftCardAmountUsed: true,
          customerEmail: true,
          customerName: true,
        },
      });

      if (pendingOrder && pendingOrder.status === "pending") {
        await prisma.order.update({
          where: { id: pendingOrder.id },
          data: { status: "failed" },
        });

        await reverseCheckoutDiscountHolds(
          {
            id: pendingOrder.id,
            loyaltyRedemptionId: pendingOrder.loyaltyRedemptionId,
            giftCardId: pendingOrder.giftCardId,
            giftCardAmountUsed: pendingOrder.giftCardAmountUsed,
            stripeCouponId: pendingOrder.stripeCouponId,
          },
          session
        );

        logger.info('Expired checkout order marked as failed', {
          orderId: pendingOrder.id,
          sessionId: session.id,
          userId: pendingOrder.userId,
        });
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
