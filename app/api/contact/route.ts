import { NextResponse } from "next/server";
import { z } from "zod";
import { checkStrictRateLimit, getIdentifier } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

// Validation schema for contact form
const ContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject is too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
});

export async function POST(req: Request) {
  try {
    // Apply strict rate limiting (prevent spam)
    const identifier = getIdentifier(req);
    const { success, reset } = await checkStrictRateLimit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: "Too many contact form submissions. Please try again later." },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.floor((reset - Date.now()) / 1000)),
          },
        }
      );
    }

    const body = await req.json();

    // Validate input
    const validation = ContactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
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

    // TODO: Send notification email to admin
    // TODO: Send confirmation email to user
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'noreply@linkflame.com',
    //   to: 'admin@linkflame.com',
    //   subject: `New Contact: ${subject}`,
    //   html: `<p><strong>From:</strong> ${name} (${email})</p><p><strong>Message:</strong> ${message}</p>`
    // });

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
    return NextResponse.json(
      { error: "Failed to submit contact form. Please try again." },
      { status: 500 }
    );
  }
}
