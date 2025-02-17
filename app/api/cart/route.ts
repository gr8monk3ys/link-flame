import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { productId, quantity = 1 } = await req.json();
    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId,
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
          userId,
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
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    await prisma.cartItem.deleteMany({
      where: {
        userId,
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
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { productId, quantity } = await req.json();
    if (!productId || typeof quantity !== "number") {
      return new NextResponse("Invalid request", { status: 400 });
    }

    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: {
          userId,
          productId,
        },
      });
    } else {
      await prisma.cartItem.updateMany({
        where: {
          userId,
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
