import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define validation schema for checkout data
const CheckoutSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format"),
  paymentMethod: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      price: z.number().positive(),
      quantity: z.number().int().positive(),
      image: z.string(),
    })
  ).min(1, "Cart cannot be empty"),
  total: z.number().nonnegative(),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const data = await request.json();
    
    // Validate request data
    try {
      CheckoutSchema.parse(data);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errors = validationError.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return NextResponse.json(
          { error: "Validation failed", details: errors },
          { status: 400 }
        );
      }
      
      throw validationError;
    }

    // Simulate payment processing
    // In a real application, you would integrate with a payment gateway like Stripe
    try {
      // This would be replaced with actual payment processing logic
      const paymentSuccessful = Math.random() > 0.1; // 90% success rate for demo
      
      if (!paymentSuccessful) {
        throw new Error("Payment processing failed");
      }
      
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

      // Return success with redirect URL including order ID
      return NextResponse.json({ 
        success: true,
        message: "Order created successfully",
        orderId: order.id,
        redirectUrl: `/order-confirmation?orderId=${order.id}`
      });
    } catch (paymentError) {
      console.error("[PAYMENT_ERROR]", paymentError);
      return NextResponse.json(
        { error: paymentError instanceof Error ? paymentError.message : "Payment failed" },
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
