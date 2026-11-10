import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  successResponse,
  handleApiError,
  notFoundResponse,
  validationErrorResponse,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getUserIdForCart } from "@/lib/session";
import { getOrderDownloads } from "@/lib/digital-downloads";
import { requiresShipping } from "@/lib/fulfillment";

export const dynamic = 'force-dynamic'

// Schema for query parameter validation
const queryParamsSchema = z.object({
  session_id: z.string().min(1, "Session ID is required"),
});

/**
 * GET /api/orders/by-session?session_id=xxx
 *
 * Returns order details by Stripe session ID
 * Used by the order confirmation page
 */
export async function GET(req: Request) {
  try {
    const { userId } = await getServerAuth();
    const userIdForCart = await getUserIdForCart(userId);

    // Apply rate limiting
    const identifier = getIdentifier(req, userIdForCart);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const url = new URL(req.url);

    // Validate query parameters
    const queryParams = {
      session_id: url.searchParams.get("session_id") || "",
    };

    const validation = queryParamsSchema.safeParse(queryParams);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { session_id } = validation.data;

    // Find order by Stripe session ID
    // The order is linked to the user who made the purchase (can be guest or authenticated)
    const order = await prisma.order.findFirst({
      where: {
        stripeSessionId: session_id,
        userId: userIdForCart,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                image: true,
                title: true,
                fulfillment: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return notFoundResponse("Order");
    }

    const downloads = await getOrderDownloads(order.id);
    const shipsSomething = order.items.some((item) =>
      requiresShipping(item.product?.fulfillment)
    );

    // Format order with gift info for display
    const formattedOrder = {
      id: order.id,
      amount: Number(order.amount),
      status: order.status,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress,
      shippingStatus: order.shippingStatus,
      createdAt: order.createdAt,
      estimatedDelivery: order.estimatedDelivery,
      // Gift options
      isGift: order.isGift,
      giftMessage: order.giftMessage,
      giftRecipientName: order.giftRecipientName,
      giftRecipientEmail: order.giftRecipientEmail,
      hidePrice: order.hidePrice,
      // Items
      items: order.items.map((item) => ({
        id: item.id,
        title: item.title,
        price: Number(item.price),
        quantity: item.quantity,
        productImage: item.product?.image,
      })),
      itemCount: order.items.reduce((acc, item) => acc + item.quantity, 0),
      shipsSomething,
      // Download links carry their own secret token; they are only returned
      // to the cart owner who completed this Checkout session.
      downloads: downloads.map(({ url, productTitle, filename, sizeBytes, downloadsLeft }) => ({
        url,
        productTitle,
        filename,
        sizeBytes,
        downloadsLeft,
      })),
    };

    return successResponse(formattedOrder);
  } catch (error) {
    logger.error("Failed to fetch order by session", error);
    return handleApiError(error);
  }
}
