import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { sendOrderConfirmation, isEmailConfigured } from "@/lib/email";

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

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  // Validate webhook signature
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      getWebhookSecret()
    );
  } catch (error: any) {
    // Signature verification failure - likely tampering, don't retry
    logger.error('Webhook signature verification failed - potential security issue', {
      error: error.message,
      hasSignature: !!signature,
      bodyLength: body.length,
    });
    return errorResponse(`Webhook Error: ${error.message}`, 'WEBHOOK_SIGNATURE_INVALID', undefined, 400);
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
      where: {
        userId,
      },
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

    // Create order record with order items and decrement inventory in a transaction
    const order = await prisma.$transaction(async (tx) => {
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

      // Decrement inventory for each item (variant or product level)
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

      return newOrder;
    });

    logger.info('Order created from webhook', {
      orderId: order.id,
      userId,
      sessionId: session.id,
      amount: order.amount,
      itemCount: cartItems.length,
      inventoryUpdated: true,
    });

    // Clear the user's cart
    await prisma.cartItem.deleteMany({
      where: {
        userId,
      },
    });

    logger.info('Cart cleared after order creation', {
      userId,
      orderId: order.id,
    });

    // Send order confirmation email (if configured)
    if (isEmailConfigured() && order.customerEmail) {
      try {
        // Fetch order with items for email
        const orderWithItems = await prisma.order.findUnique({
          where: { id: order.id },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        if (orderWithItems && orderWithItems.customerEmail) {
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
              orderId: order.id,
              email: order.customerEmail,
            });
          } else {
            logger.error('Failed to send order confirmation email', {
              orderId: order.id,
              email: order.customerEmail,
              error: emailResult.error,
            });
          }
        }
      } catch (emailError: any) {
        // Log but don't fail the webhook if email fails
        logger.error('Error sending order confirmation email', {
          orderId: order.id,
          error: emailError.message,
        });
      }
    } else if (!order.customerEmail) {
      logger.warn('No customer email available for order confirmation', {
        orderId: order.id,
      });
    } else {
      logger.info('Email service not configured - skipping order confirmation', {
        orderId: order.id,
      });
    }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    // Critical error during order processing - log detailed info for debugging
    logger.error('Critical error processing webhook', {
      eventType: event.type,
      eventId: event.id,
      error: error.message,
      stack: error.stack,
      userId: (event.data.object as any)?.metadata?.userId,
      sessionId: (event.data.object as any)?.id,
    });

    // Return 500 to trigger Stripe's automatic retry
    // Stripe will retry webhooks with exponential backoff for up to 3 days
    return errorResponse(
      'Internal error processing webhook - will be retried',
      'WEBHOOK_PROCESSING_ERROR',
      { eventId: event.id, willRetry: true },
      500
    );
  }
}
