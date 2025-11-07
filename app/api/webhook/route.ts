import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET");
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia",
});

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    logger.error('Webhook signature verification failed', error);
    return errorResponse(`Webhook Error: ${error.message}`, undefined, undefined, 400);
  }

  logger.info('Webhook received', {
    type: event.type,
    id: event.id,
  });

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

    // Get cart items before clearing them
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId,
      },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      logger.warn('No cart items found for completed checkout', {
        userId,
        sessionId: session.id,
      });
      return new NextResponse(null, { status: 200 });
    }

    // Create order record with order items
    const order = await prisma.order.create({
      data: {
        userId,
        stripeSessionId: session.id,
        amount: (session.amount_total || 0) / 100,
        status: "paid",
        customerEmail: session.customer_details?.email || session.metadata?.customerEmail,
        customerName: session.customer_details?.name || session.metadata?.customerName,
        shippingAddress: session.metadata?.shippingAddress,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.salePrice || item.product.price,
            title: item.product.title,
          })),
        },
      },
    });

    logger.info('Order created from webhook', {
      orderId: order.id,
      userId,
      sessionId: session.id,
      amount: order.amount,
      itemCount: cartItems.length,
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
  }

  return new NextResponse(null, { status: 200 });
}
