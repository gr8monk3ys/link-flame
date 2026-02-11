/**
 * POST /api/loyalty/redeem
 *
 * Redeems loyalty points for a discount.
 *
 * Request body:
 * - pointsToRedeem: number (must be positive and <= available points)
 * - orderId?: string (optional: link redemption to an order)
 *
 * Response:
 * - discountAmount: number (dollar amount of discount)
 * - remainingPoints: number (points left after redemption)
 *
 * Redemption rate: 100 points = $1 discount
 */

import { getServerAuth } from "@/lib/auth";
import {
  redeemPoints,
  getUserAvailablePoints,
  calculateDiscountFromPoints,
  LOYALTY_CONFIG,
} from "@/lib/loyalty";
import { validateCsrfToken } from "@/lib/csrf";
import { checkStrictRateLimit, getIdentifier } from "@/lib/rate-limit";
import { z } from "zod";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
  validationErrorResponse,
  rateLimitErrorResponse,
  handleApiError,
} from "@/lib/api-response";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic'

const RedeemPointsSchema = z.object({
  pointsToRedeem: z
    .number()
    .int("Points must be a whole number")
    .positive("Points must be positive")
    .min(LOYALTY_CONFIG.pointsPerDollarDiscount, `Minimum redemption is ${LOYALTY_CONFIG.pointsPerDollarDiscount} points ($1)`),
  orderId: z.string().optional(),
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
      return unauthorizedResponse("You must be logged in to redeem points");
    }

    // Strict rate limiting for redemption (5 requests per minute)
    const identifier = getIdentifier(req, userId);
    const { success, reset } = await checkStrictRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await req.json();

    // Validate input
    const validation = RedeemPointsSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { pointsToRedeem, orderId } = validation.data;

    // Check available points before attempting redemption
    const availablePoints = await getUserAvailablePoints(userId);

    if (pointsToRedeem > availablePoints) {
      return errorResponse(
        `Insufficient points. You have ${availablePoints} available, but tried to redeem ${pointsToRedeem}.`,
        "INSUFFICIENT_POINTS",
        {
          availablePoints,
          requestedPoints: pointsToRedeem,
          maxDiscount: calculateDiscountFromPoints(availablePoints),
        },
        400
      );
    }

    // Perform redemption
    const result = await redeemPoints({
      userId,
      pointsToRedeem,
      orderId,
    });

    if (!result.success) {
      return errorResponse(
        result.error || "Failed to redeem points",
        undefined,
        undefined,
        400
      );
    }

    logger.info("Points redeemed via API", {
      userId,
      pointsRedeemed: pointsToRedeem,
      discountAmount: result.discountAmount,
      remainingPoints: result.remainingPoints,
    });

    return successResponse({
      success: true,
      pointsRedeemed: pointsToRedeem,
      discountAmount: result.discountAmount,
      remainingPoints: result.remainingPoints,
      message: `You saved $${result.discountAmount.toFixed(2)}!`,
    });
  } catch (error) {
    logger.error("Failed to redeem points", error);
    return handleApiError(error);
  }
}

/**
 * GET /api/loyalty/redeem
 *
 * Preview redemption - calculate discount for a given number of points
 * without actually redeeming them.
 */
export async function GET(req: Request) {
  try {
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("You must be logged in to preview redemption");
    }

    const url = new URL(req.url);
    const pointsParam = url.searchParams.get("points");

    if (!pointsParam) {
      // Return max available discount info
      const availablePoints = await getUserAvailablePoints(userId);
      const maxDiscount = calculateDiscountFromPoints(availablePoints);

      return successResponse({
        availablePoints,
        maxDiscount,
        pointsPerDollarDiscount: LOYALTY_CONFIG.pointsPerDollarDiscount,
        minimumRedemption: LOYALTY_CONFIG.pointsPerDollarDiscount,
      });
    }

    const pointsToPreview = parseInt(pointsParam, 10);

    if (isNaN(pointsToPreview) || pointsToPreview <= 0) {
      return errorResponse("Invalid points value", undefined, undefined, 400);
    }

    const availablePoints = await getUserAvailablePoints(userId);
    const effectivePoints = Math.min(pointsToPreview, availablePoints);
    const discount = calculateDiscountFromPoints(effectivePoints);

    return successResponse({
      requestedPoints: pointsToPreview,
      effectivePoints,
      discountAmount: discount,
      availablePoints,
      wouldExceedAvailable: pointsToPreview > availablePoints,
    });
  } catch (error) {
    logger.error("Failed to preview redemption", error);
    return handleApiError(error);
  }
}
