/**
 * GET /api/impact/personal
 *
 * Returns the authenticated user's personal environmental impact metrics.
 * Includes total values, comparisons, and progress toward milestones.
 */

import { getServerAuth } from "@/lib/auth";
import { getPersonalImpact } from "@/lib/impact";
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
      return unauthorizedResponse("You must be logged in to view your impact");
    }

    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(request, userId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const personalImpact = await getPersonalImpact(userId);

    logger.info("Personal impact fetched", {
      userId,
      metricsCount: personalImpact.length,
    });

    return successResponse(personalImpact);
  } catch (error) {
    logger.error("Failed to fetch personal impact", error);
    return handleApiError(error);
  }
}
