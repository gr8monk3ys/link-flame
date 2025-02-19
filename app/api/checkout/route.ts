import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getCartItems } from "@/lib/cart";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

export async function POST(req: Request) {
  const authData = await auth();
  const userId = authData?.userId;

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const cartItems = await getCartItems(userId);

  if (!cartItems || cartItems.length === 0) {
    return new NextResponse("Cart is empty", { status: 400 });
  }

  try {
    const lineItems = cartItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.title,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart?canceled=true`,
      metadata: {
        userId,
      },
    });

    return NextResponse.json({ url: session.url }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error: any) {
    console.error("[CHECKOUT_POST]", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
