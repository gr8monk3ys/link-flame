/**
 * GET /api/impact/order/[id]
 *
 * Returns the environmental impact for a specific order.
 * Only accessible to the order owner or admin.
 */

import { NextRequest } from "next/server";
import { getServerAuth, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrderImpact } from "@/lib/impact";
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  handleApiError,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("You must be logged in to view order impact");
    }

    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(request, userId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    // Fetch the order to verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      return notFoundResponse("Order");
    }

    // Check if user owns the order or is an admin
    const isAdmin = await requireRole(userId, ["ADMIN"]);
    if (order.userId !== userId && !isAdmin) {
      return forbiddenResponse("You can only view impact for your own orders");
    }

    const orderImpact = await getOrderImpact(orderId);

    logger.info("Order impact fetched", {
      orderId,
      userId,
      metricsCount: orderImpact.length,
    });

    return successResponse(orderImpact);
  } catch (error) {
    logger.error("Failed to fetch order impact", error);
    return handleApiError(error);
  }
}
