import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getUserIdForCart } from "@/lib/session";
import { checkStrictRateLimit, getIdentifier } from "@/lib/rate-limit";
import {
  handleApiError,
  rateLimitErrorResponse,
  validationErrorResponse,
  errorResponse
} from "@/lib/api-response";
import { logger } from "@/lib/logger";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia",
});

// Define validation schema for checkout data
const CheckoutSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format"),
});

export async function POST(request: Request) {
  try {
    const { userId } = await getServerAuth();

    // Apply strict rate limiting for checkout
    const identifier = getIdentifier(request, userId);
    const { success, reset } = await checkStrictRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const userIdToUse = await getUserIdForCart(userId);
    const data = await request.json();

    // Validate request data
    const validation = CheckoutSchema.safeParse(data);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    // Get cart items from database (server-side source of truth)
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: userIdToUse,
      },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      return errorResponse(
        "Cart is empty",
        undefined,
        undefined,
        400
      );
    }

    // Verify inventory and build line items with SERVER-SIDE prices
    let serverTotal = 0;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of cartItems) {
      const product = item.product;

      // Check inventory availability
      if (product.inventory < item.quantity) {
        return errorResponse(
          `Insufficient inventory for ${product.title}. Only ${product.inventory} available.`,
          undefined,
          undefined,
          400
        );
      }

      // Use server-side prices (NEVER trust client-provided prices)
      const actualPrice = product.salePrice || product.price;
      serverTotal += actualPrice * item.quantity;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.title,
            description: product.subtitle || undefined,
            images: product.image ? [product.image] : undefined,
          },
          unit_amount: Math.round(actualPrice * 100), // Convert to cents
        },
        quantity: item.quantity,
      });
    }

    logger.info('Creating Stripe checkout session', {
      userId: userIdToUse,
      itemCount: cartItems.length,
      total: serverTotal,
    });

    try {
      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        metadata: {
          userId: userIdToUse,
          customerEmail: data.email,
          customerName: `${data.firstName} ${data.lastName}`,
          shippingAddress: `${data.address}, ${data.city}, ${data.state} ${data.zipCode}`,
        },
        customer_email: data.email,
        success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/checkout`,
        // Expire after 30 minutes
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
      });

      logger.info('Stripe checkout session created', {
        sessionId: session.id,
        userId: userIdToUse,
        amount: serverTotal,
      });

      // Return session URL for redirect to Stripe
      // NOTE: Order is NOT created yet - it will be created by the webhook
      // after successful payment
      return NextResponse.json({
        sessionUrl: session.url,
        sessionId: session.id,
      });
    } catch (stripeError) {
      logger.error('Stripe checkout session creation failed', stripeError, {
        userId: userIdToUse,
      });
      return errorResponse(
        "Failed to create checkout session. Please try again.",
        undefined,
        undefined,
        500
      );
    }
  } catch (error) {
    logger.error('Checkout failed', error);
    return handleApiError(error);
  }
}
