import { getServerAuth, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  successResponse,
  unauthorizedResponse,
  handleApiError,
  paginatedResponse,
  PaginationMeta,
  validationErrorResponse,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic'

// Schema for query parameter validation
const queryParamsSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(["processing", "shipped", "in_transit", "out_for_delivery", "delivered", "cancelled", "all"]).optional(),
});

// Shipping status labels for display
const SHIPPING_STATUS_LABELS: Record<string, string> = {
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
 * Returns paginated list of orders for the authenticated user.
 * If the user has ADMIN role and passes ?admin=true, returns all orders
 * (not filtered by userId) with user relation included.
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 50)
 * - status: Filter by shipping status (optional)
 * - admin: If "true" and user is ADMIN, returns all orders
 */
export async function GET(req: Request) {
  try {
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("You must be logged in to view orders");
    }

    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(req, userId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const url = new URL(req.url);

    // Validate query parameters with Zod
    const queryParams = {
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      status: url.searchParams.get("status") || undefined,
    };

    const validation = queryParamsSchema.safeParse(queryParams);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { page, limit, status } = validation.data;

    // Check if admin mode is requested
    const adminMode = url.searchParams.get("admin") === "true";
    const isAdmin = adminMode ? await requireRole(userId, ['ADMIN']) : false;

    // Build where clause - admins see all orders, users see only their own
    const where: Prisma.OrderWhereInput = isAdmin ? {} : { userId };

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
          // Include user relation for admin view
          ...(isAdmin ? {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          } : {}),
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
      amount: Number(order.amount),
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
    logger.error("Failed to fetch orders", error);
    return handleApiError(error);
  }
}
