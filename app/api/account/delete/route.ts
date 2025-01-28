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

export const dynamic = 'force-dynamic'

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to confirm account deletion"),
  confirmation: z.literal("DELETE MY ACCOUNT", {
    errorMap: () => ({ message: 'Please type "DELETE MY ACCOUNT" to confirm' }),
  }),
});

/**
 * DELETE /api/account/delete
 *
 * Permanently deletes the current user's account and all associated data
 * This is irreversible and intended for GDPR compliance
 *
 * Body: { password: string, confirmation: "DELETE MY ACCOUNT" }
 */
export async function DELETE(request: Request) {
  try {
    // CSRF protection - Critical for account deletion
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
      return unauthorizedResponse("You must be logged in to delete your account");
    }

    // Rate limiting: 5 requests per minute for account deletion attempts
    const identifier = getIdentifier(request);
    const { success, reset } = await checkStrictRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await request.json();

    // Validate input
    const validation = deleteAccountSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { password } = validation.data;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return unauthorizedResponse("User not found");
    }

    // Verify password (only if user has one)
    if (user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return errorResponse("Incorrect password", undefined, undefined, 400);
      }
    }

    // Delete user and all associated data in a transaction
    // Prisma cascades will handle related records:
    // - Profile (onDelete: Cascade)
    // - Reviews (onDelete: Cascade)
    // CartItems, SavedItems, and Orders reference userId but don't cascade
    // We need to handle those explicitly
    await prisma.$transaction(async (tx) => {
      // Delete user's cart items
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      // Delete user's saved items
      await tx.savedItem.deleteMany({
        where: { userId },
      });

      // Anonymize orders (keep for business records but remove user association)
      // We update them to have anonymized data but keep them for financial records
      await tx.order.updateMany({
        where: { userId },
        data: {
          userId: "deleted_user",
          customerName: "Deleted User",
          customerEmail: null, // Remove email for GDPR
          shippingAddress: "[Address Removed]",
        },
      });

      // Delete the user (this will cascade to Profile and Reviews)
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return successResponse({
      message: "Your account has been permanently deleted",
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to delete account", error);
    return handleApiError(error);
  }
}
