import { checkStrictRateLimit, getIdentifier } from "@/lib/rate-limit"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  successResponse,
  validationErrorResponse,
  rateLimitErrorResponse,
  handleApiError,
} from "@/lib/api-response"

// Validation schema for newsletter subscription
const NewsletterSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
})

export async function POST(req: Request) {
  try {
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

    // TODO: Send confirmation email (integrate with email service like Resend, SendGrid, etc.)

    return successResponse(
      { email, subscriptionId: subscription.id },
      { message: "Successfully subscribed to newsletter" },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
