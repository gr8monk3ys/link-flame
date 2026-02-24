import { z } from 'zod'
import { getServerAuth, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe-server";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  errorResponse,
  handleApiError,
  rateLimitErrorResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";
import { processRefund } from "@/lib/refund";

export const dynamic = 'force-dynamic'

/**
 * Zod schema for optional refund request body.
 * If body is omitted or empty, a full refund is performed.
 * If items are provided, a partial refund is performed for those items only.
 */
const RefundBodySchema = z.object({
  items: z.array(z.object({
    orderItemId: z.string(),
    quantity: z.number().int().positive(),
  })).optional(),
  reason: z.string().max(500).optional(),
}).optional()

/**
 * POST /api/orders/[id]/refund
 *
 * Processes a full or partial refund for an order via Stripe.
 * Requires ADMIN role.
 *
 * Full refund (no body or empty body):
 *   - Refunds the entire payment via Stripe
 *   - Restores all inventory
 *   - Reverses loyalty points earned and redeemed
 *   - Restores gift card balance if applicable
 *
 * Partial refund (body with items array):
 *   - Refunds specified items via Stripe (calculated amount)
 *   - Restores inventory for specified items only
 *   - Does NOT reverse loyalty points or gift card
 *
 * The order must have status "paid" or "partially_refunded" and a valid Stripe session ID.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("You must be logged in");
    }

    // Validate CSRF token
    const csrfValid = await validateCsrfToken(req);
    if (!csrfValid) {
      return forbiddenResponse("Invalid or missing CSRF token");
    }

    // Require ADMIN role
    const isAdmin = await requireRole(userId, ['ADMIN']);
    if (!isAdmin) {
      return forbiddenResponse("Admin access required");
    }

    // Apply rate limiting
    const identifier = getIdentifier(req, userId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    // Parse optional request body
    let body: z.infer<typeof RefundBodySchema> = undefined
    try {
      const text = await req.text()
      if (text.trim()) {
        const parsed = JSON.parse(text)
        const validated = RefundBodySchema.parse(parsed)
        body = validated
      }
    } catch (parseError) {
      if (parseError instanceof z.ZodError) {
        return validationErrorResponse(parseError)
      }
      if (parseError instanceof SyntaxError) {
        return errorResponse('Invalid JSON body', 'BAD_REQUEST', undefined, 400)
      }
      throw parseError
    }

    const { id } = await params;

    // Fetch the order with items included
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        stripeSessionId: true,
        amount: true,
        customerEmail: true,
        customerName: true,
        giftCardId: true,
        giftCardAmountUsed: true,
        items: true,
      },
    });

    if (!order) {
      return notFoundResponse("Order");
    }

    // Verify order is in a refundable state
    if (order.status === 'refunded') {
      return errorResponse(
        "This order has already been fully refunded",
        "ALREADY_REFUNDED",
        undefined,
        409
      );
    }

    if (order.status !== 'paid' && order.status !== 'partially_refunded') {
      return errorResponse(
        `Cannot refund an order with status "${order.status}". Only paid or partially_refunded orders can be refunded.`,
        "INVALID_ORDER_STATUS",
        undefined,
        400
      );
    }

    if (!order.stripeSessionId) {
      return errorResponse(
        "This order does not have an associated Stripe session and cannot be refunded automatically",
        "NO_STRIPE_SESSION",
        undefined,
        400
      );
    }

    // Retrieve the Stripe Checkout Session to get the PaymentIntent
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);

    const paymentIntentId = session.payment_intent as string;

    if (!paymentIntentId) {
      return errorResponse(
        "No payment intent found for this order. The payment may not have been captured.",
        "NO_PAYMENT_INTENT",
        undefined,
        400
      );
    }

    const isPartial = !!body?.items && body.items.length > 0

    // Calculate refund amount
    let stripeRefundAmountCents: number | undefined = undefined // undefined = full refund in Stripe

    if (isPartial) {
      // For partial refunds, calculate the amount from specified items
      let partialTotal = 0
      for (const refundItem of body!.items!) {
        const orderItem = order.items.find((oi) => oi.id === refundItem.orderItemId)
        if (!orderItem) {
          return errorResponse(
            `Order item not found: ${refundItem.orderItemId}`,
            "INVALID_ORDER_ITEM",
            undefined,
            400
          )
        }

        const availableToRefund = orderItem.quantity - orderItem.refundedQuantity
        if (refundItem.quantity > availableToRefund) {
          return errorResponse(
            `Cannot refund ${refundItem.quantity} of item "${orderItem.title}". Only ${availableToRefund} available for refund.`,
            "QUANTITY_EXCEEDS_AVAILABLE",
            undefined,
            400
          )
        }

        partialTotal += Number(orderItem.price) * refundItem.quantity
      }

      stripeRefundAmountCents = Math.round(partialTotal * 100)

      if (stripeRefundAmountCents <= 0) {
        return errorResponse(
          "Refund amount must be greater than zero",
          "INVALID_REFUND_AMOUNT",
          undefined,
          400
        )
      }
    }

    // Create the refund via Stripe
    try {
      const refundParams: { payment_intent: string; amount?: number } = {
        payment_intent: paymentIntentId,
      }
      if (stripeRefundAmountCents !== undefined) {
        refundParams.amount = stripeRefundAmountCents
      }
      await stripe.refunds.create(refundParams);
    } catch (stripeError: unknown) {
      const message = stripeError instanceof Error
        ? stripeError.message
        : 'An unexpected Stripe error occurred';

      logger.error("Stripe refund failed", stripeError instanceof Error ? stripeError : undefined, {
        orderId: id,
        paymentIntentId,
        isPartial,
      });

      return errorResponse(
        `Stripe refund failed: ${message}`,
        "STRIPE_REFUND_FAILED",
        undefined,
        502
      );
    }

    // Process all refund side-effects (inventory, loyalty, order status)
    const refundResult = await processRefund({
      orderId: id,
      items: body?.items,
      reason: body?.reason,
    })

    logger.info("Order refund completed", {
      orderId: id,
      adminUserId: userId,
      amount: refundResult.refundedAmount,
      paymentIntentId,
      isPartial,
    });

    return successResponse({
      orderId: id,
      status: isPartial ? 'partially_refunded' : 'refunded',
      refundedAmount: refundResult.refundedAmount,
      inventoryRestored: refundResult.inventoryRestored,
      loyaltyPointsReversed: refundResult.loyaltyPointsReversed,
      giftCardAmountRestored: refundResult.giftCardAmountRestored,
    });
  } catch (error) {
    logger.error("Failed to process refund", error instanceof Error ? error : undefined);
    return handleApiError(error);
  }
}
