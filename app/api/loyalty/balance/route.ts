/**
 * GET /api/loyalty/balance
 *
 * Returns the authenticated user's loyalty program summary including:
 * - Available points
 * - Current tier
 * - Progress to next tier
 * - Maximum discount available
 */

import { getServerAuth } from "@/lib/auth";
import { getUserLoyaltySummary, LOYALTY_CONFIG } from "@/lib/loyalty";
import {
  successResponse,
  unauthorizedResponse,
  handleApiError,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("You must be logged in to view your loyalty balance");
    }

    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(request, userId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const summary = await getUserLoyaltySummary(userId);

    if (!summary) {
      return unauthorizedResponse("User not found");
    }

    logger.info("Loyalty balance retrieved", {
      userId,
      availablePoints: summary.availablePoints,
      tier: summary.tier,
    });

    return successResponse({
      availablePoints: summary.availablePoints,
      lifetimePoints: summary.lifetimePoints,
      tier: summary.tier,
      tierInfo: {
        name: summary.tierInfo.name,
        multiplier: summary.tierInfo.multiplier,
        benefits: summary.tierInfo.benefits,
      },
      nextTier: summary.nextTier,
      pointsToNextTier: summary.pointsToNextTier,
      maxDiscount: summary.maxDiscount,
      config: {
        pointsPerDollar: LOYALTY_CONFIG.pointsPerDollar,
        pointsPerDollarDiscount: LOYALTY_CONFIG.pointsPerDollarDiscount,
        reviewPoints: LOYALTY_CONFIG.reviewPoints,
        referralPoints: LOYALTY_CONFIG.referralPoints,
        signupBonus: LOYALTY_CONFIG.signupBonus,
      },
    });
  } catch (error) {
    logger.error("Failed to get loyalty balance", error);
    return handleApiError(error);
  }
}
