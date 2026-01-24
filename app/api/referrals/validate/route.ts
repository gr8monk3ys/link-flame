import { getServerAuth } from "@/lib/auth";
import { getUserIdForCart } from "@/lib/session";
import { validateReferralCode, applyReferralCode, REFERRAL_CONFIG } from "@/lib/referrals";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { z } from "zod";
import {
  handleApiError,
  successResponse,
  errorResponse,
  validationErrorResponse,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { logger } from "@/lib/logger";

// Validation schema for referral code
const ValidateCodeSchema = z.object({
  code: z.string().min(1, "Referral code is required").max(50, "Invalid referral code"),
  apply: z.boolean().optional().default(false), // If true, apply the referral to the user
});

/**
 * POST /api/referrals/validate
 * Validate a referral code and optionally apply it to the current user
 */
export async function POST(request: Request) {
  try {
    // CSRF protection for referral code validation/application
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      );
    }

    const { userId } = await getServerAuth();

    // Apply rate limiting
    const identifier = getIdentifier(request, userId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await request.json();

    // Validate input
    const validation = ValidateCodeSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { code, apply } = validation.data;
    const normalizedCode = code.trim().toUpperCase();

    // For validation, use authenticated userId if available
    const validationResult = await validateReferralCode(normalizedCode, userId);

    if (!validationResult.valid) {
      return errorResponse(
        validationResult.error || "Invalid referral code",
        "INVALID_REFERRAL_CODE",
        undefined,
        400
      );
    }

    // If just validating (not applying), return success
    if (!apply) {
      logger.info("Referral code validated", {
        code: normalizedCode,
        userId: userId || "guest",
      });

      return successResponse({
        valid: true,
        code: validationResult.code,
        discountPercent: validationResult.discountPercent,
        message: `This code gives you ${validationResult.discountPercent}% off your first order!`,
      });
    }

    // If applying, user must be authenticated
    if (!userId) {
      return errorResponse(
        "Please sign in to apply this referral code",
        "AUTHENTICATION_REQUIRED",
        undefined,
        401
      );
    }

    // Apply the referral code
    const applyResult = await applyReferralCode(normalizedCode, userId);

    if (!applyResult.success) {
      return errorResponse(
        applyResult.error || "Failed to apply referral code",
        "APPLY_FAILED",
        undefined,
        400
      );
    }

    logger.info("Referral code applied", {
      code: normalizedCode,
      userId,
      referralId: applyResult.referralId,
    });

    return successResponse({
      valid: true,
      applied: true,
      code: validationResult.code,
      discountPercent: applyResult.discountPercent,
      referralId: applyResult.referralId,
      message: `Success! You'll get ${applyResult.discountPercent}% off your first order.`,
    });
  } catch (error) {
    logger.error("Failed to validate referral code", error);
    return handleApiError(error);
  }
}
