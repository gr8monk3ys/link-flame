import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  successResponse,
  unauthorizedResponse,
  handleApiError,
  validationErrorResponse,
  errorResponse,
} from "@/lib/api-response";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
});

/**
 * GET /api/account/profile
 *
 * Returns the current user's profile information
 */
export async function GET() {
  try {
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("You must be logged in to view your profile");
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
    console.error("[PROFILE_GET_ERROR]", error);
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
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("You must be logged in to update your profile");
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
        return errorResponse("Email is already in use by another account", undefined, undefined, 400);
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
    console.error("[PROFILE_UPDATE_ERROR]", error);
    return handleApiError(error);
  }
}
