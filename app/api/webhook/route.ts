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

// Initialize Stripe lazily to allow build without secret key
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-01-27.acacia",
    });
  }
  return stripe;
}

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

/**
 * Cart item with product and variant relations
 */
type CartItemWithRelations = Prisma.CartItemGetPayload<{
  include: { product: true; variant: true };
}>;

/**
 * Creates an order from checkout session and decrements inventory
 */
async function createOrderFromCheckout(
  session: Stripe.Checkout.Session,
  userId: string,
  cartItems: CartItemWithRelations[]
) {
  return prisma.$transaction(async (tx) => {
    // Create the order with items (including variant details)
    const newOrder = await tx.order.create({
      data: {
        userId,
        stripeSessionId: session.id,
        amount: (session.amount_total || 0) / 100,
        status: "paid",
        customerEmail: session.customer_details?.email || session.metadata?.customerEmail,
        customerName: session.customer_details?.name || session.metadata?.customerName,
        shippingAddress: session.metadata?.shippingAddress,
        items: {
          create: cartItems.map((item) => {
            // Use variant price if available, otherwise product price
            const price = item.variant?.salePrice ?? item.variant?.price ??
                         item.product.salePrice ?? item.product.price;

            // Build title with variant info
            let title = item.product.title;
            if (item.variant) {
              const variantParts = [
                item.variant.size,
                item.variant.color,
                item.variant.material
              ].filter(Boolean);
              if (variantParts.length > 0) {
                title += ` (${variantParts.join(', ')})`;
              }
            }

            return {
              productId: item.productId,
              quantity: item.quantity,
              price,
              title,
              // Variant details (denormalized for historical accuracy)
              variantId: item.variantId,
              variantSku: item.variant?.sku || null,
              variantSize: item.variant?.size || null,
              variantColor: item.variant?.color || null,
              variantMaterial: item.variant?.material || null,
            };
          }),
        },
      },
    });

    // Decrement inventory for each item
    await decrementInventory(tx, cartItems);

    return newOrder;
  });
}

/**
 * Decrements inventory for cart items (variant or product level)
 */
async function decrementInventory(
  tx: Prisma.TransactionClient,
  cartItems: CartItemWithRelations[]
) {
  for (const item of cartItems) {
    if (item.variantId && item.variant) {
      // Decrement variant inventory
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          inventory: {
            decrement: item.quantity,
          },
        },
      });
    } else {
      // Decrement product inventory
      await tx.product.update({
        where: { id: item.productId },
        data: {
          inventory: {
            decrement: item.quantity,
          },
        },
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
          price: item.price,
        })),
        total: orderWithItems.amount,
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
 * Clears the user's cart after successful order
 */
async function clearUserCart(userId: string, orderId: string) {
  await prisma.cartItem.deleteMany({
    where: { userId },
  });

  logger.info('Cart cleared after order creation', {
    userId,
    orderId,
  });
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

    if (event.type === "checkout.session.completed" && userId) {
      logger.info('Processing checkout.session.completed', {
        sessionId: session.id,
        userId,
      });

      // IDEMPOTENCY CHECK: Prevent duplicate orders if webhook is retried
      const existingOrder = await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
      });

      if (existingOrder) {
        logger.info('Order already processed, skipping', {
          orderId: existingOrder.id,
          sessionId: session.id,
        });
        return new NextResponse(null, { status: 200 });
      }

      // Get cart items before clearing them (include variants)
      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: {
          product: true,
          variant: true,
        },
      });

      if (cartItems.length === 0) {
        logger.warn('No cart items found for completed checkout', {
          userId,
          sessionId: session.id,
        });
        return new NextResponse(null, { status: 200 });
      }

      // Create order and decrement inventory
      const order = await createOrderFromCheckout(session, userId, cartItems);

      logger.info('Order created from webhook', {
        orderId: order.id,
        userId,
        sessionId: session.id,
        amount: order.amount,
        itemCount: cartItems.length,
        inventoryUpdated: true,
      });

      // Clear the user's cart
      await clearUserCart(userId, order.id);

      // Send order confirmation email
      await sendOrderConfirmationEmail(order.id, order.customerEmail || '');

      // Award loyalty points for the purchase
      // Only award points for authenticated users (not guest sessions)
      if (userId && !userId.startsWith('guest_')) {
        try {
          const loyaltyResult = await awardPurchasePoints(userId, order.id, order.amount);
          if (loyaltyResult.success) {
            logger.info('Loyalty points awarded for purchase', {
              userId,
              orderId: order.id,
              pointsAwarded: loyaltyResult.pointsAwarded,
              orderAmount: order.amount,
            });
          }
        } catch (loyaltyError) {
          // Log but don't fail the webhook if loyalty points fail
          logger.error('Failed to award loyalty points', loyaltyError, {
            userId,
            orderId: order.id,
            orderAmount: order.amount,
          });
        }
      }

      // Calculate and store environmental impact for the order
      // Only track impact for authenticated users (not guest sessions)
      if (userId && !userId.startsWith('guest_')) {
        try {
          const impactItems = cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          }));

          const impactResult = await storeOrderImpact(order.id, userId, impactItems);

          logger.info('Environmental impact stored for order', {
            userId,
            orderId: order.id,
            impactMetricsCount: impactResult.orderImpacts.length,
            milestonesAchieved: impactResult.milestones.length,
          });

          // Log any milestones achieved
          if (impactResult.milestones.length > 0) {
            logger.info('User achieved impact milestones', {
              userId,
              orderId: order.id,
              milestones: impactResult.milestones,
            });
          }
        } catch (impactError) {
          // Log but don't fail the webhook if impact tracking fails
          logger.error('Failed to store environmental impact', impactError, {
            userId,
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
