import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  handleApiError,
} from "@/lib/api-response";

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

/**
 * GET /api/orders/[id]
 *
 * Returns detailed order information including shipping tracking
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

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: {
        id,
        userId, // Ensure user can only access their own orders
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true, // Include variant for variant-specific details
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
    console.error("[ORDER_GET_ERROR]", error);
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
