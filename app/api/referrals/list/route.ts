import { getServerAuth } from "@/lib/auth";
import { getUserReferrals, ReferralStatus } from "@/lib/referrals";
import { z } from "zod";
import {
  handleApiError,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  paginatedResponse,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic'

// Query parameter schema
const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * GET /api/referrals/list
 * Get the list of referrals made by the authenticated user
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("Please sign in to view your referrals");
    }

    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(request, userId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryValidation = ListQuerySchema.safeParse({
      page: url.searchParams.get("page") || 1,
      limit: url.searchParams.get("limit") || 20,
    });

    if (!queryValidation.success) {
      return validationErrorResponse(queryValidation.error);
    }

    const { page, limit } = queryValidation.data;
    const offset = (page - 1) * limit;

    const { referrals, total } = await getUserReferrals(userId, limit, offset);

    // Format referrals for response
    const formattedReferrals = referrals.map((r) => ({
      id: r.id,
      refereeName: r.refereeName,
      status: r.status,
      statusLabel: getStatusLabel(r.status),
      rewardPoints: r.rewardPoints,
      discountApplied: r.discountApplied,
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString() || null,
    }));

    logger.info("Referrals list retrieved", {
      userId,
      page,
      limit,
      total,
    });

    return paginatedResponse(formattedReferrals, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    logger.error("Failed to get referrals list", error);
    return handleApiError(error);
  }
}

/**
 * Get human-readable status label
 */
function getStatusLabel(status: string): string {
  switch (status) {
    case ReferralStatus.PENDING:
      return "Pending - Waiting for first order";
    case ReferralStatus.COMPLETED:
      return "Completed - Order placed";
    case ReferralStatus.REWARDED:
      return "Rewarded - Points earned!";
    case ReferralStatus.EXPIRED:
      return "Expired";
    default:
      return status;
  }
}
