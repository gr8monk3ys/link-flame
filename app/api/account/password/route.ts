import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  successResponse,
  unauthorizedResponse,
  handleApiError,
  validationErrorResponse,
  errorResponse,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { checkStrictRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(100, "New password must be less than 100 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

/**
 * PATCH /api/account/password
 *
 * Changes the current user's password
 * Body: { currentPassword: string, newPassword: string, confirmPassword: string }
 */
export async function PATCH(request: Request) {
  try {
    // CSRF protection - Critical for password changes
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

    if (!userId) {
      return unauthorizedResponse("You must be logged in to change your password");
    }

    // Rate limiting: 5 requests per minute for password changes
    const identifier = getIdentifier(request);
    const { success, reset } = await checkStrictRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await request.json();

    // Validate input
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { currentPassword, newPassword } = validation.data;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return unauthorizedResponse("User not found");
    }

    // Check if user has a password (might be OAuth only)
    if (!user.password) {
      return errorResponse(
        "Cannot change password for accounts created with social login",
        undefined,
        undefined,
        400
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return errorResponse("Current password is incorrect", undefined, undefined, 400);
    }

    // Ensure new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return errorResponse(
        "New password must be different from your current password",
        undefined,
        undefined,
        400
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return successResponse({
      message: "Password changed successfully",
    });
  } catch (error) {
    logger.error("Failed to change password", error);
    return handleApiError(error);
  }
}
