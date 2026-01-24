/**
 * GET /api/impact/community
 *
 * Returns aggregate environmental impact metrics for the entire community.
 * This is a public endpoint that can be displayed on the homepage.
 */

import { getCommunityImpact } from "@/lib/impact";
import {
  successResponse,
  handleApiError,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    // Apply rate limiting to prevent abuse (public endpoint)
    const identifier = getIdentifier(request);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const communityImpact = await getCommunityImpact();

    logger.info("Community impact fetched", {
      metricsCount: communityImpact.length,
    });

    return successResponse(communityImpact);
  } catch (error) {
    logger.error("Failed to fetch community impact", error);
    return handleApiError(error);
  }
}
