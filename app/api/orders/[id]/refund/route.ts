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
} from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic'

/**
 * POST /api/orders/[id]/refund
 *
 * Processes a full refund for an order via Stripe.
 * Requires ADMIN role.
 *
 * The order must have status "paid" and a valid Stripe session ID.
 * Retrieves the PaymentIntent from the Stripe Checkout Session and
 * creates a refund, then updates the order status to "refunded".
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

    const { id } = await params;

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        stripeSessionId: true,
        amount: true,
        customerEmail: true,
        customerName: true,
      },
    });

    if (!order) {
      return notFoundResponse("Order");
    }

    // Verify order is in a refundable state
    if (order.status === 'refunded') {
      return errorResponse(
        "This order has already been refunded",
        "ALREADY_REFUNDED",
        undefined,
        409
      );
    }

    if (order.status !== 'paid') {
      return errorResponse(
        `Cannot refund an order with status "${order.status}". Only paid orders can be refunded.`,
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

    // Create the refund via Stripe
    try {
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
      });
    } catch (stripeError: unknown) {
      const message = stripeError instanceof Error
        ? stripeError.message
        : 'An unexpected Stripe error occurred';

      logger.error("Stripe refund failed", {
        orderId: id,
        paymentIntentId,
        error: stripeError,
      });

      return errorResponse(
        `Stripe refund failed: ${message}`,
        "STRIPE_REFUND_FAILED",
        undefined,
        502
      );
    }

    // Update order status to refunded
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'refunded' },
    });

    logger.info("Order refunded", {
      orderId: id,
      adminUserId: userId,
      amount: Number(order.amount),
      paymentIntentId,
    });

    return successResponse({
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      message: "Refund processed successfully",
    });
  } catch (error) {
    logger.error("Failed to process refund", error);
    return handleApiError(error);
  }
}
