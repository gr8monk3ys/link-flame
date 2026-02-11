/**
 * GET /api/loyalty/history
 *
 * Returns the authenticated user's loyalty points transaction history.
 * Includes both earned points and redemptions, sorted by date descending.
 *
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 50)
 */

import { getServerAuth } from "@/lib/auth";
import { getUserPointHistory } from "@/lib/loyalty";
import {
  successResponse,
  unauthorizedResponse,
  handleApiError,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("You must be logged in to view your points history");
    }

    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(req, userId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const url = new URL(req.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const limit = limitParam
      ? Math.min(50, Math.max(1, parseInt(limitParam, 10)))
      : 20;

    const { transactions, pagination } = await getUserPointHistory(userId, {
      page,
      limit,
    });

    logger.info("Loyalty history retrieved", {
      userId,
      page,
      limit,
      transactionCount: transactions.length,
    });

    return successResponse({
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        points: t.points,
        source: t.source,
        description: t.description,
        orderId: t.orderId,
        date: t.date.toISOString(),
      })),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
        hasNextPage: pagination.page < pagination.totalPages,
        hasPreviousPage: pagination.page > 1,
      },
    });
  } catch (error) {
    logger.error("Failed to get loyalty history", error);
    return handleApiError(error);
  }
}
