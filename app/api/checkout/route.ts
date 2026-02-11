import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getUserIdForCart } from "@/lib/session";
import { checkStrictRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import {
  handleApiError,
  rateLimitErrorResponse,
  validationErrorResponse,
  errorResponse
} from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { getBaseUrl } from "@/lib/url";
import { getStripe } from "@/lib/stripe-server";
import Stripe from "stripe";
import { CheckoutSchema, GiftOptionsSchema } from "@/lib/validations/checkout";

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // CSRF protection
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      );
    }

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
        variant: true,
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
      const variant = item.variant;

      // Check inventory availability (variant or product level)
      const availableInventory = variant ? variant.inventory : product.inventory;
      const inventorySource = variant ? `${product.title} (${[variant.size, variant.color, variant.material].filter(Boolean).join(', ')})` : product.title;

      if (availableInventory < item.quantity) {
        return errorResponse(
          `Insufficient inventory for ${inventorySource}. Only ${availableInventory} available.`,
          undefined,
          undefined,
          400
        );
      }

      // Use server-side prices (NEVER trust client-provided prices)
      // Priority: variant sale price > variant price > product sale price > product price
      const actualPrice = Number(variant?.salePrice ?? variant?.price ?? product.salePrice ?? product.price);
      serverTotal += actualPrice * item.quantity;

      // Build product name with variant info
      let productName = product.title;
      if (variant) {
        const variantParts = [variant.size, variant.color, variant.material].filter(Boolean);
        if (variantParts.length > 0) {
          productName += ` (${variantParts.join(', ')})`;
        }
      }

      // Use variant image if available, otherwise product image
      const productImage = variant?.image ?? product.image;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: productName,
            description: product.subtitle || undefined,
            images: productImage ? [productImage] : undefined,
            metadata: {
              productId: product.id,
              variantId: variant?.id || '',
              sku: variant?.sku || '',
            },
          },
          unit_amount: Math.round(actualPrice * 100), // Convert to cents
        },
        quantity: item.quantity,
      });
    }

    // Extract gift options from validated data
    const giftOptions = {
      isGift: validation.data.isGift || false,
      giftMessage: validation.data.giftMessage || '',
      giftRecipientName: validation.data.giftRecipientName || '',
      giftRecipientEmail: validation.data.giftRecipientEmail || '',
      hidePrice: validation.data.hidePrice || false,
    };

    logger.info('Creating Stripe checkout session', {
      userId: userIdToUse,
      itemCount: cartItems.length,
      total: serverTotal,
      isGift: giftOptions.isGift,
    });

    try {
      // Create Stripe Checkout Session with automatic payment methods
      // This enables Apple Pay, Google Pay, and other payment methods based on customer location
      const session = await getStripe().checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        // Enable automatic payment methods - Stripe will show Apple Pay, Google Pay, etc.
        // based on what's available on the customer's device and region
        payment_method_types: ['card'],
        payment_method_options: {
          card: {
            // Enable wallet payment methods (Apple Pay, Google Pay) for card payments
            request_three_d_secure: 'automatic',
          },
        },
        metadata: {
          userId: userIdToUse,
          customerEmail: data.email,
          customerName: `${validation.data.firstName} ${validation.data.lastName}`,
          shippingAddress: `${validation.data.address}, ${validation.data.city}, ${validation.data.state} ${validation.data.zipCode}`,
          // Gift options stored in metadata
          isGift: giftOptions.isGift.toString(),
          giftMessage: giftOptions.giftMessage,
          giftRecipientName: giftOptions.giftRecipientName,
          giftRecipientEmail: giftOptions.giftRecipientEmail,
          hidePrice: giftOptions.hidePrice.toString(),
        },
        customer_email: data.email,
        // Billing address collection for better fraud prevention
        billing_address_collection: 'auto',
        success_url: `${getBaseUrl()}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${getBaseUrl()}/checkout`,
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
