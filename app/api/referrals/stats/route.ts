import { getServerAuth } from "@/lib/auth";
import { getReferralStats, REFERRAL_CONFIG } from "@/lib/referrals";
import {
  handleApiError,
  successResponse,
  unauthorizedResponse,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * GET /api/referrals/stats
 * Get referral statistics for the authenticated user
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("Please sign in to view your referral stats");
    }

    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(request, userId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const stats = await getReferralStats(userId);

    logger.info("Referral stats retrieved", {
      userId,
      totalReferred: stats.totalReferred,
      completedReferrals: stats.completedReferrals,
    });

    return successResponse({
      ...stats,
      rewardPointsPerReferral: REFERRAL_CONFIG.DEFAULT_REFERRER_REWARD,
      discountPercentForReferee: REFERRAL_CONFIG.DEFAULT_REFEREE_DISCOUNT,
    });
  } catch (error) {
    logger.error("Failed to get referral stats", error);
    return handleApiError(error);
  }
}
