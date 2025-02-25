import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const data = await request.json();
    console.log("Received checkout data:", data);

    // Validate required fields
    if (!data.email || !data.firstName || !data.lastName || !data.address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate cart items
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Simulate payment processing
    // In a real application, you would integrate with a payment gateway like Stripe
    const paymentSuccessful = true;

    if (paymentSuccessful) {
      // Create order in database
      const order = await prisma.order.create({
        data: {
          userId: userId || "guest-user",
          status: "processing",
          amount: data.total || 0,
          shippingAddress: `${data.address}, ${data.city}, ${data.state} ${data.zipCode}`,
          paymentMethod: data.paymentMethod,
          customerEmail: data.email,
          customerName: `${data.firstName} ${data.lastName}`,
        },
      });

      // Store order items
      for (const item of data.items) {
        await prisma.cartItem.deleteMany({
          where: {
            userId: userId || "guest-user",
            productId: item.id,
          },
        });
      }

      return NextResponse.json({ 
        message: "Order created successfully",
        orderId: order.id
      });
    } else {
      return NextResponse.json(
        { error: "Payment failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[CHECKOUT_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
