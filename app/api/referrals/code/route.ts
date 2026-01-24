import { getServerAuth } from "@/lib/auth";
import { getUserReferralCode, generateShareLinks, REFERRAL_CONFIG } from "@/lib/referrals";
import {
  handleApiError,
  successResponse,
  unauthorizedResponse,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * GET /api/referrals/code
 * Get the authenticated user's referral code and share links
 * Creates a new code if the user doesn't have one
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("Please sign in to access your referral code");
    }

    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(request, userId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    // Get or create the user's referral code
    const referralCode = await getUserReferralCode(userId);

    if (!referralCode) {
      return handleApiError(new Error("Failed to generate referral code"));
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const referralLink = `${baseUrl}?ref=${referralCode}`;

    // Generate share links
    const shareLinks = generateShareLinks(referralCode, referralLink);

    logger.info("Referral code retrieved", {
      userId,
      referralCode,
    });

    return successResponse({
      code: referralCode,
      link: referralLink,
      discountPercent: REFERRAL_CONFIG.DEFAULT_REFEREE_DISCOUNT,
      rewardPoints: REFERRAL_CONFIG.DEFAULT_REFERRER_REWARD,
      shareLinks,
    });
  } catch (error) {
    logger.error("Failed to get referral code", error);
    return handleApiError(error);
  }
}
