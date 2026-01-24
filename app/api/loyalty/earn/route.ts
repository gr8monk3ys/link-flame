/**
 * POST /api/loyalty/earn
 *
 * Awards loyalty points to a user. This endpoint is primarily used internally
 * by other systems (checkout webhook, review creation, etc.) but can be
 * called by admins for manual point adjustments.
 *
 * Request body:
 * - source: "PURCHASE" | "REVIEW" | "REFERRAL" | "SIGNUP"
 * - orderId?: string (required for PURCHASE source)
 * - orderTotal?: number (required for PURCHASE source)
 * - reviewId?: string (required for REVIEW source)
 * - referralId?: string (required for REFERRAL source)
 *
 * For regular users, this endpoint validates the source data to prevent fraud.
 * Admin users can award arbitrary points.
 */

import { getServerAuth, requireRole } from "@/lib/auth";
import {
  awardPurchasePoints,
  awardReviewPoints,
  awardReferralPoints,
  awardSignupBonus,
  POINT_SOURCES,
  LOYALTY_CONFIG,
  type PointSource,
} from "@/lib/loyalty";
import { validateCsrfToken } from "@/lib/csrf";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { z } from "zod";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse,
  validationErrorResponse,
  rateLimitErrorResponse,
  handleApiError,
} from "@/lib/api-response";
import { logger } from "@/lib/logger";

const EarnPointsSchema = z.object({
  source: z.enum([
    POINT_SOURCES.PURCHASE,
    POINT_SOURCES.REVIEW,
    POINT_SOURCES.REFERRAL,
    POINT_SOURCES.SIGNUP,
  ]),
  orderId: z.string().optional(),
  orderTotal: z.number().positive().max(1000000).optional(),
  reviewId: z.string().optional(),
  referralId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // CSRF protection
    const csrfValid = await validateCsrfToken(req);
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      );
    }

    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("You must be logged in to earn points");
    }

    // Rate limiting
    const identifier = getIdentifier(req, userId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await req.json();

    // Validate input
    const validation = EarnPointsSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { source, orderId, orderTotal, reviewId, referralId } = validation.data;

    let result: { success: boolean; pointsAwarded?: number; error?: string };

    switch (source) {
      case POINT_SOURCES.PURCHASE:
        // Purchase points are typically awarded by the webhook
        // Only admins can manually award purchase points
        const isAdmin = await requireRole(userId, ["ADMIN"]);
        if (!isAdmin) {
          return forbiddenResponse(
            "Purchase points are automatically awarded after checkout"
          );
        }
        if (!orderId || !orderTotal) {
          return errorResponse(
            "orderId and orderTotal are required for purchase points",
            undefined,
            undefined,
            400
          );
        }
        const purchaseResult = await awardPurchasePoints(userId, orderId, orderTotal);
        result = {
          success: purchaseResult.success,
          pointsAwarded: purchaseResult.pointsAwarded,
        };
        break;

      case POINT_SOURCES.REVIEW:
        if (!reviewId) {
          return errorResponse(
            "reviewId is required for review points",
            undefined,
            undefined,
            400
          );
        }
        const reviewSuccess = await awardReviewPoints(userId, reviewId);
        result = {
          success: reviewSuccess,
          pointsAwarded: reviewSuccess ? 50 : 0,
          error: reviewSuccess ? undefined : "Points already awarded for this review",
        };
        break;

      case POINT_SOURCES.REFERRAL:
        if (!referralId) {
          return errorResponse(
            "referralId is required for referral points",
            undefined,
            undefined,
            400
          );
        }
        const referralSuccess = await awardReferralPoints(userId, referralId);
        result = {
          success: referralSuccess,
          pointsAwarded: referralSuccess ? 200 : 0,
          error: referralSuccess ? undefined : "Points already awarded for this referral",
        };
        break;

      case POINT_SOURCES.SIGNUP:
        const signupSuccess = await awardSignupBonus(userId);
        result = {
          success: signupSuccess,
          pointsAwarded: signupSuccess ? LOYALTY_CONFIG.signupBonus : 0,
          error: signupSuccess ? undefined : "Signup bonus already claimed",
        };
        break;

      default:
        return errorResponse("Invalid points source", undefined, undefined, 400);
    }

    if (!result.success) {
      return errorResponse(
        result.error || "Failed to award points",
        undefined,
        undefined,
        400
      );
    }

    logger.info("Points earned via API", {
      userId,
      source,
      pointsAwarded: result.pointsAwarded,
    });

    return successResponse({
      success: true,
      pointsAwarded: result.pointsAwarded,
      source,
    });
  } catch (error) {
    logger.error("Failed to earn points", error);
    return handleApiError(error);
  }
}
