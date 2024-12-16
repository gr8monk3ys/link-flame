import { NextResponse } from "next/server"

// In a real application, you'd want to store this in a database
const subscribers = new Set<string>()

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Check if already subscribed
    if (subscribers.has(email)) {
      return NextResponse.json(
        { message: "Email already subscribed" },
        { status: 200 }
      )
    }

    // In a real application, you'd want to:
    // 1. Store the email in a database
    // 2. Send a confirmation email
    // 3. Integrate with an email service provider (e.g., Mailchimp)
    subscribers.add(email)

    return NextResponse.json(
      { message: "Successfully subscribed to newsletter" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return NextResponse.json(
      { error: "Failed to subscribe to newsletter" },
      { status: 500 }
    )
  }
}
