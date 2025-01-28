import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  successResponse,
  unauthorizedResponse,
  handleApiError,
  validationErrorResponse,
  errorResponse,
  conflictResponse,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, checkStrictRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic'

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
});

/**
 * GET /api/account/profile
 *
 * Returns the current user's profile information
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("You must be logged in to view your profile");
    }

    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(request, userId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        Profile: {
          select: {
            bio: true,
          },
        },
      },
    });

    if (!user) {
      return unauthorizedResponse("User not found");
    }

    return successResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
      bio: user.Profile?.bio || null,
    });
  } catch (error) {
    logger.error("Failed to fetch profile", error);
    return handleApiError(error);
  }
}

/**
 * PATCH /api/account/profile
 *
 * Updates the current user's profile information
 * Body: { name?: string, email?: string }
 */
export async function PATCH(request: Request) {
  try {
    // CSRF protection for profile updates
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
      return unauthorizedResponse("You must be logged in to update your profile");
    }

    // Apply strict rate limiting for profile modifications (5 req/min)
    const identifier = getIdentifier(request, userId);
    const { success, reset } = await checkStrictRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await request.json();

    // Validate input
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { name, email } = validation.data;

    // Check if nothing to update
    if (!name && !email) {
      return errorResponse("No fields to update", undefined, undefined, 400);
    }

    // If email is being changed, check if it's already taken
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return conflictResponse("Email is already in use by another account");
      }
    }

    // Build update data
    const updateData: { name?: string; email?: string } = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    return successResponse({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    logger.error("Failed to update profile", error);
    return handleApiError(error);
  }
}
