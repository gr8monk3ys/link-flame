import { getServerAuth, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  handleApiError,
  validationErrorResponse,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { sendShippingNotificationEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic'

// Shipping status labels for display
const SHIPPING_STATUS_LABELS: Record<string, string> = {
  processing: "Processing",
  shipped: "Shipped",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Shipping progress steps
const SHIPPING_STEPS = [
  { key: "processing", label: "Order Placed" },
  { key: "shipped", label: "Shipped" },
  { key: "in_transit", label: "In Transit" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

// Zod schema for PATCH body validation
const updateOrderSchema = z.object({
  shippingStatus: z.enum([
    "processing",
    "shipped",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]).optional(),
  trackingNumber: z.string().max(100).optional(),
  shippingCarrier: z.string().max(50).optional(),
  estimatedDelivery: z.string().optional(),
});

/**
 * GET /api/orders/[id]
 *
 * Returns detailed order information including shipping tracking.
 * Admins can view any order; regular users can only view their own.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("You must be logged in to view order details");
    }

    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(req, userId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const { id } = await params;

    // Admins can view any order; regular users only their own
    const isAdmin = await requireRole(userId, ['ADMIN']);

    const whereClause = isAdmin
      ? { id }
      : { id, userId };

    const order = await prisma.order.findUnique({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!order) {
      return notFoundResponse("Order");
    }

    // Calculate shipping progress
    const currentStatusIndex = SHIPPING_STEPS.findIndex(
      (step) => step.key === order.shippingStatus
    );

    const shippingProgress = SHIPPING_STEPS.map((step, index) => ({
      ...step,
      completed: index <= currentStatusIndex && order.shippingStatus !== "cancelled",
      current: index === currentStatusIndex,
    }));

    // Format order with additional tracking info
    const formattedOrder = {
      ...order,
      shippingStatusLabel: order.shippingStatus
        ? SHIPPING_STATUS_LABELS[order.shippingStatus] || order.shippingStatus
        : "Processing",
      shippingProgress,
      itemCount: order.items.reduce((acc, item) => acc + item.quantity, 0),
      isCancelled: order.shippingStatus === "cancelled",
      isDelivered: order.shippingStatus === "delivered",
      // Format tracking URL if carrier and tracking number exist
      trackingUrl: order.trackingNumber && order.shippingCarrier
        ? getTrackingUrl(order.shippingCarrier, order.trackingNumber)
        : null,
    };

    return successResponse(formattedOrder);
  } catch (error) {
    logger.error("Failed to fetch order", error);
    return handleApiError(error);
  }
}

/**
 * PATCH /api/orders/[id]
 *
 * Updates shipping status and tracking information for an order.
 * Requires ADMIN role.
 */
export async function PATCH(
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

    // Validate request body
    const body = await req.json();
    const validation = updateOrderSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { shippingStatus, trackingNumber, shippingCarrier, estimatedDelivery } = validation.data;

    // Verify order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        shippingStatus: true,
        customerEmail: true,
        customerName: true,
      },
    });

    if (!existingOrder) {
      return notFoundResponse("Order");
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (shippingStatus !== undefined) {
      updateData.shippingStatus = shippingStatus;

      // Set timestamp fields based on status transitions
      if (shippingStatus === 'shipped') {
        updateData.shippedAt = new Date();
      }
      if (shippingStatus === 'delivered') {
        updateData.deliveredAt = new Date();
      }
    }

    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }

    if (shippingCarrier !== undefined) {
      updateData.shippingCarrier = shippingCarrier;
    }

    if (estimatedDelivery !== undefined) {
      updateData.estimatedDelivery = new Date(estimatedDelivery);
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                image: true,
              },
            },
          },
        },
      },
    });

    logger.info("Order updated by admin", {
      orderId: id,
      adminUserId: userId,
      changes: updateData,
    });

    // Send shipping notification email when status changes to "shipped"
    if (
      shippingStatus === 'shipped' &&
      existingOrder.shippingStatus !== 'shipped' &&
      existingOrder.customerEmail
    ) {
      const emailResult = await sendShippingNotificationEmail(
        existingOrder.customerEmail,
        {
          orderId: id,
          customerName: existingOrder.customerName || 'Customer',
          trackingNumber: trackingNumber || updatedOrder.trackingNumber,
          shippingCarrier: shippingCarrier || updatedOrder.shippingCarrier,
          estimatedDelivery: estimatedDelivery || (
            updatedOrder.estimatedDelivery
              ? updatedOrder.estimatedDelivery.toISOString().split('T')[0]
              : null
          ),
        }
      );

      if (!emailResult.success) {
        logger.warn("Failed to send shipping notification email", {
          orderId: id,
          error: emailResult.error,
        });
        // Do not fail the request - the order update succeeded
      }
    }

    return successResponse(updatedOrder);
  } catch (error) {
    logger.error("Failed to update order", error);
    return handleApiError(error);
  }
}

// Helper function to generate tracking URLs for common carriers
function getTrackingUrl(carrier: string, trackingNumber: string): string | null {
  const carrierUrls: Record<string, string> = {
    ups: `https://www.ups.com/track?tracknum=${trackingNumber}`,
    usps: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    fedex: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    dhl: `https://www.dhl.com/us-en/home/tracking/tracking-global-forwarding.html?submit=1&tracking-id=${trackingNumber}`,
  };

  const normalizedCarrier = carrier.toLowerCase().replace(/[^a-z]/g, "");
  return carrierUrls[normalizedCarrier] || null;
}
