import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  handleApiError,
  paginatedResponse,
  PaginationMeta,
} from "@/lib/api-response";

// Shipping status labels for display
export const SHIPPING_STATUS_LABELS: Record<string, string> = {
  processing: "Processing",
  shipped: "Shipped",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/**
 * GET /api/orders
 *
 * Returns paginated list of orders for the authenticated user
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 50)
 * - status: Filter by shipping status (optional)
 */
export async function GET(req: Request) {
  try {
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("You must be logged in to view orders");
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10")));
    const status = url.searchParams.get("status"); // Filter by shipping status

    const where: any = { userId };

    // Optional status filter
    if (status && status !== "all") {
      where.shippingStatus = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  image: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Format orders with status labels and computed fields
    const formattedOrders = orders.map((order) => ({
      ...order,
      shippingStatusLabel: order.shippingStatus
        ? SHIPPING_STATUS_LABELS[order.shippingStatus] || order.shippingStatus
        : "Processing",
      itemCount: order.items.reduce((acc, item) => acc + item.quantity, 0),
      // Get first product image for order thumbnail
      thumbnail: order.items[0]?.product?.image || null,
    }));

    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    };

    return paginatedResponse(formattedOrders, pagination);
  } catch (error) {
    console.error("[ORDERS_GET_ERROR]", error);
    return handleApiError(error);
  }
}
