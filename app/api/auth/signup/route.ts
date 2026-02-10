import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  handleApiError,
  validationErrorResponse,
  conflictResponse,
  rateLimitErrorResponse,
  errorResponse,
  successResponse,
} from "@/lib/api-response";
import { checkStrictRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";
import { awardSignupBonus, LOYALTY_CONFIG } from "@/lib/loyalty";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    // CSRF protection for user registration
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      );
    }

    // Rate limiting: 5 requests per minute for signup
    const identifier = getIdentifier(request);
    const { success, reset } = await checkStrictRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await request.json();

    // Validate input
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { name, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return conflictResponse("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    // Award signup bonus points (200 points)
    // This is idempotent - will not award duplicate points
    let bonusPointsAwarded = false;
    try {
      bonusPointsAwarded = await awardSignupBonus(user.id);
      if (bonusPointsAwarded) {
        logger.info("Signup bonus points awarded", {
          userId: user.id,
          points: LOYALTY_CONFIG.signupBonus,
        });
      }
    } catch (bonusError) {
      // Log the error but don't fail signup - points can be awarded later
      logger.error("Failed to award signup bonus points", bonusError, {
        userId: user.id,
      });
    }

    return successResponse(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        loyaltyBonus: bonusPointsAwarded
          ? {
              awarded: true,
              points: LOYALTY_CONFIG.signupBonus,
              message: "Welcome bonus for joining Link Flame!",
            }
          : null,
      },
      undefined,
      201
    )
  } catch (error) {
    logger.error("Signup failed", error);
    return handleApiError(error);
  }
}
