import { checkStrictRateLimit, getIdentifier } from "@/lib/rate-limit"
import { validateCsrfToken } from "@/lib/csrf"
import { prisma } from "@/lib/prisma"
import { sendNewsletterConfirmation, isEmailConfigured } from "@/lib/email"
import { z } from "zod"
import {
  successResponse,
  validationErrorResponse,
  rateLimitErrorResponse,
  handleApiError,
  errorResponse
} from "@/lib/api-response"

// Validation schema for newsletter subscription
const NewsletterSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
})

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

    // Apply rate limiting
    const identifier = getIdentifier(req);
    const { success, reset } = await checkStrictRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await req.json()

    // Validate input with Zod
    const validation = NewsletterSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { email } = validation.data

    // Check if already subscribed
    const existing = await prisma.newsletter.findUnique({
      where: { email }
    })

    if (existing) {
      return successResponse(
        { email, alreadySubscribed: true },
        { message: "Email already subscribed" }
      );
    }

    // Store subscription in database
    const subscription = await prisma.newsletter.create({
      data: {
        email,
        subscribedAt: new Date(),
      }
    })

    // Send confirmation email (if configured)
    if (isEmailConfigured()) {
      await sendNewsletterConfirmation(email);
    } else {
      console.warn('[NEWSLETTER] Email service not configured - skipping confirmation email');
    }

    return successResponse(
      { email, subscriptionId: subscription.id },
      { message: "Successfully subscribed to newsletter" },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
