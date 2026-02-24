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
import { CheckoutSchema } from "@/lib/validations/checkout";
import { holdPointsForCheckout, reversePointsHold } from "@/lib/loyalty";
import { holdGiftCardBalance, reverseGiftCardHold } from "@/lib/gift-cards";

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
    const pendingOrderItems: Array<{
      productId: string;
      variantId: string | null;
      quantity: number;
      price: number;
      title: string;
      variantSku: string | null;
      variantSize: string | null;
      variantColor: string | null;
      variantMaterial: string | null;
    }> = [];

    for (const item of cartItems) {
      const product = item.product;
      const variant = item.variant;

      // Best-effort pre-check only. Inventory is decremented atomically in webhook
      // finalization and can still fail there due to concurrent purchases.
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

      pendingOrderItems.push({
        productId: product.id,
        variantId: variant?.id || null,
        quantity: item.quantity,
        price: actualPrice,
        title: productName,
        variantSku: variant?.sku || null,
        variantSize: variant?.size || null,
        variantColor: variant?.color || null,
        variantMaterial: variant?.material || null,
      });
    }

    const checkoutData = validation.data;

    let loyaltyPointsUsed: number | null = null;
    let loyaltyDiscountAmount = 0;
    let loyaltyRedemptionId: string | null = null;
    let giftCardId: string | null = null;
    let giftCardAmountUsed = 0;
    let giftCardHoldTransactionId: string | null = null;
    let stripeCouponId: string | null = null;

    const cleanupDiscountArtifacts = async () => {
      if (loyaltyRedemptionId) {
        try {
          await reversePointsHold(loyaltyRedemptionId);
        } catch (error) {
          logger.error("Failed to reverse loyalty points hold", error, {
            loyaltyRedemptionId,
          });
        }
      }

      if (giftCardHoldTransactionId && giftCardId && giftCardAmountUsed > 0) {
        try {
          await reverseGiftCardHold(
            giftCardHoldTransactionId,
            giftCardId,
            giftCardAmountUsed
          );
        } catch (error) {
          logger.error("Failed to reverse gift card hold", error, {
            giftCardHoldTransactionId,
            giftCardId,
            giftCardAmountUsed,
          });
        }
      }

      if (stripeCouponId) {
        try {
          await getStripe().coupons.del(stripeCouponId);
        } catch (error) {
          logger.error("Failed to delete Stripe checkout coupon", error, {
            stripeCouponId,
          });
        }
      }
    };

    // Place discount holds before creating the Stripe session.
    try {
      if (checkoutData.loyaltyPointsToRedeem) {
        if (!userId || userIdToUse.startsWith("guest_")) {
          return errorResponse(
            "You must be signed in to redeem loyalty points.",
            "LOYALTY_AUTH_REQUIRED",
            undefined,
            401
          );
        }

        const pointsHold = await holdPointsForCheckout(
          userId,
          checkoutData.loyaltyPointsToRedeem
        );
        loyaltyPointsUsed = checkoutData.loyaltyPointsToRedeem;
        loyaltyDiscountAmount = pointsHold.discountAmount;
        loyaltyRedemptionId = pointsHold.redemptionId;
      }

      if (checkoutData.giftCardCode) {
        const remainingAfterLoyalty = Math.max(0, serverTotal - loyaltyDiscountAmount);
        if (remainingAfterLoyalty <= 0) {
          throw new Error("Gift card amount cannot exceed order total.");
        }

        const requestedGiftCardAmount = checkoutData.giftCardAmount ?? remainingAfterLoyalty;
        const giftCardHold = await holdGiftCardBalance(
          checkoutData.giftCardCode,
          Math.min(requestedGiftCardAmount, remainingAfterLoyalty)
        );
        giftCardId = giftCardHold.giftCardId;
        giftCardAmountUsed = giftCardHold.amountApplied;
        giftCardHoldTransactionId = giftCardHold.transactionId;
      }

      const totalDiscount = loyaltyDiscountAmount + giftCardAmountUsed;
      if (totalDiscount > serverTotal) {
        throw new Error("Total discount cannot exceed order subtotal");
      }

      if (totalDiscount > 0) {
        const coupon = await getStripe().coupons.create({
          amount_off: Math.round(totalDiscount * 100),
          currency: "usd",
          max_redemptions: 1,
          duration: "once",
        });
        stripeCouponId = coupon.id;
      }
    } catch (discountError) {
      await cleanupDiscountArtifacts();
      logger.error("Failed to prepare checkout discounts", discountError, {
        userId: userIdToUse,
      });

      const message =
        discountError instanceof Error
          ? discountError.message
          : "Failed to apply checkout discounts";
      return errorResponse(message, "DISCOUNT_PREP_FAILED", undefined, 400);
    }

    const totalDiscount = loyaltyDiscountAmount + giftCardAmountUsed;

    // Extract gift options from validated data
    const giftOptions = {
      isGift: checkoutData.isGift || false,
      giftMessage: checkoutData.giftMessage || '',
      giftRecipientName: checkoutData.giftRecipientName || '',
      giftRecipientEmail: checkoutData.giftRecipientEmail || '',
      hidePrice: checkoutData.hidePrice || false,
    };

    const customerName = `${checkoutData.firstName} ${checkoutData.lastName}`;
    const shippingAddress = `${checkoutData.address}, ${checkoutData.city}, ${checkoutData.state} ${checkoutData.zipCode}`;

    logger.info('Creating Stripe checkout session', {
      userId: userIdToUse,
      itemCount: cartItems.length,
      total: serverTotal,
      totalDiscount,
      isGift: giftOptions.isGift,
    });

    try {
      // Create Stripe Checkout Session with automatic payment methods
      const session = await getStripe().checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : undefined,
        payment_method_types: ['card'],
        payment_method_options: {
          card: {
            request_three_d_secure: 'automatic',
          },
        },
        // Collect shipping address so Stripe Tax can calculate correct rates
        shipping_address_collection: {
          allowed_countries: ['US', 'CA'],
        },
        // Shipping options: free for orders over $75, flat rate otherwise
        shipping_options: [
          ...(serverTotal >= 75
            ? [
                {
                  shipping_rate_data: {
                    type: 'fixed_amount' as const,
                    fixed_amount: { amount: 0, currency: 'usd' },
                    display_name: 'Free Shipping',
                    delivery_estimate: {
                      minimum: { unit: 'business_day' as const, value: 5 },
                      maximum: { unit: 'business_day' as const, value: 7 },
                    },
                  },
                },
              ]
            : []),
          {
            shipping_rate_data: {
              type: 'fixed_amount' as const,
              fixed_amount: { amount: 599, currency: 'usd' },
              display_name: 'Standard Shipping',
              delivery_estimate: {
                minimum: { unit: 'business_day' as const, value: 5 },
                maximum: { unit: 'business_day' as const, value: 7 },
              },
            },
          },
          {
            shipping_rate_data: {
              type: 'fixed_amount' as const,
              fixed_amount: { amount: 1499, currency: 'usd' },
              display_name: 'Express Shipping',
              delivery_estimate: {
                minimum: { unit: 'business_day' as const, value: 2 },
                maximum: { unit: 'business_day' as const, value: 3 },
              },
            },
          },
        ],
        // Automatic tax calculation via Stripe Tax
        // Requires enabling Stripe Tax in dashboard and setting product tax codes
        automatic_tax: { enabled: true },
        metadata: {
          userId: userIdToUse,
          customerEmail: checkoutData.email,
          customerName,
          shippingAddress,
          isGift: giftOptions.isGift.toString(),
          giftMessage: giftOptions.giftMessage,
          giftRecipientName: giftOptions.giftRecipientName,
          giftRecipientEmail: giftOptions.giftRecipientEmail,
          hidePrice: giftOptions.hidePrice.toString(),
          loyaltyRedemptionId: loyaltyRedemptionId || '',
          giftCardHoldTransactionId: giftCardHoldTransactionId || '',
          stripeCouponId: stripeCouponId || '',
        },
        customer_email: checkoutData.email,
        billing_address_collection: 'auto',
        success_url: `${getBaseUrl()}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${getBaseUrl()}/checkout`,
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
      });

      // Persist immutable order snapshot before redirecting the user to Stripe.
      // Webhook finalization uses this pending order, not the mutable live cart.
      try {
        await prisma.order.create({
          data: {
            userId: userIdToUse,
            stripeSessionId: session.id,
            amount: serverTotal,
            status: "pending",
            paymentMethod: "stripe_checkout",
            customerEmail: checkoutData.email,
            customerName,
            shippingAddress,
            isGift: giftOptions.isGift,
            giftMessage: giftOptions.giftMessage || null,
            giftRecipientName: giftOptions.giftRecipientName || null,
            giftRecipientEmail: giftOptions.giftRecipientEmail || null,
            hidePrice: giftOptions.hidePrice,
            loyaltyPointsUsed,
            loyaltyDiscountAmount: loyaltyDiscountAmount > 0 ? loyaltyDiscountAmount : null,
            loyaltyRedemptionId,
            giftCardId,
            giftCardAmountUsed: giftCardAmountUsed > 0 ? giftCardAmountUsed : null,
            stripeCouponId,
            discountTotal: totalDiscount > 0 ? totalDiscount : null,
            items: {
              create: pendingOrderItems,
            },
          },
        });
      } catch (snapshotError) {
        logger.error("Failed to persist checkout snapshot order", snapshotError, {
          userId: userIdToUse,
          sessionId: session.id,
        });

        // Best effort: expire unusable checkout session to prevent orphaned payments.
        try {
          await getStripe().checkout.sessions.expire(session.id);
        } catch (expireError) {
          logger.error("Failed to expire Stripe session after snapshot failure", expireError, {
            sessionId: session.id,
          });
        }

        await cleanupDiscountArtifacts();

        return errorResponse(
          "Failed to initialize checkout session. Please try again.",
          undefined,
          undefined,
          500
        );
      }

      logger.info('Stripe checkout session created', {
        sessionId: session.id,
        userId: userIdToUse,
        amount: serverTotal,
        totalDiscount,
      });

      // Return session URL for redirect to Stripe
      // NOTE: A pending snapshot order already exists and will be finalized
      // by the webhook after successful payment.
      return NextResponse.json({
        sessionUrl: session.url,
        sessionId: session.id,
      });
    } catch (stripeError) {
      logger.error('Stripe checkout session creation failed', stripeError, {
        userId: userIdToUse,
      });

      await cleanupDiscountArtifacts();

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
