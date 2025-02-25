import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    const userIdToUse = userId || "guest-user";

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: userIdToUse,
      },
      include: {
        product: true,
      },
    });

    // Transform the data to match the CartItem interface
    const formattedItems = cartItems.map(item => ({
      id: item.productId,
      title: item.product.title,
      price: Number(item.product.price),
      image: item.product.image,
      quantity: item.quantity,
    }));

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error("[CART_GET_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId: providedUserId, productId, quantity = 1 } = await req.json();
    
    // Get authenticated user ID or use provided ID as fallback
    const { userId: authUserId } = await auth();
    const userIdToUse = authUserId || providedUserId || "guest-user";
    
    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: userIdToUse,
        productId,
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          userId: userIdToUse,
          productId,
          quantity,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CART_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    const userIdToUse = userId || "guest-user";

    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    await prisma.cartItem.deleteMany({
      where: {
        userId: userIdToUse,
        productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CART_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    const userIdToUse = userId || "guest-user";

    const { productId, quantity } = await req.json();
    if (!productId || typeof quantity !== "number") {
      return new NextResponse("Invalid request", { status: 400 });
    }

    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: {
          userId: userIdToUse,
          productId,
        },
      });
    } else {
      await prisma.cartItem.updateMany({
        where: {
          userId: userIdToUse,
          productId,
        },
        data: {
          quantity,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CART_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
