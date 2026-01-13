import { NextResponse } from "next/server";
import { z } from "zod";
import { checkStrictRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { sendContactNotification, isEmailConfigured } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  handleApiError,
  rateLimitErrorResponse,
  validationErrorResponse,
  errorResponse
} from "@/lib/api-response";

// Validation schema for contact form
const ContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject is too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
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

    // Apply strict rate limiting (prevent spam)
    const identifier = getIdentifier(req);
    const { success, reset } = await checkStrictRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await req.json();

    // Validate input
    const validation = ContactSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { name, email, subject, message } = validation.data;

    // Store contact submission in database
    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        subject,
        message,
        submittedAt: new Date(),
      },
    });

    // Send notification email to admin and confirmation to user (if configured)
    if (isEmailConfigured()) {
      await sendContactNotification({ name, email, subject, message });
    } else {
      console.warn('[CONTACT] Email service not configured - skipping notification emails');
    }

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for contacting us! We'll get back to you soon.",
        id: contact.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CONTACT_POST]", error);
    return handleApiError(error);
  }
}
