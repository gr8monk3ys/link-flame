import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia",
});

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session?.metadata?.userId;

  if (event.type === "checkout.session.completed" && userId) {
    // Clear the user's cart
    await prisma.cartItem.deleteMany({
      where: {
        userId,
      },
    });

    // Create order record
    await prisma.order.create({
      data: {
        userId,
        stripeSessionId: session.id,
        amount: (session.amount_total || 0) / 100,
        status: "paid",
      },
    });
  }

  return new NextResponse(null, { status: 200 });
}
