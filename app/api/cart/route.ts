import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdForCart } from "@/lib/session";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { z } from "zod";

// Validation schemas
const AddToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer").default(1),
});

const UpdateCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().nonnegative("Quantity must be 0 or positive"),
});

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    const userIdToUse = await getUserIdForCart(userId);

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
    // Get authenticated user ID first for rate limiting
    const { userId: authUserId } = await auth();

    // Apply rate limiting
    const identifier = getIdentifier(req, authUserId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
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
    const validation = AddToCartSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { productId, quantity } = validation.data;

    // Get user ID for cart operations
    const userIdToUse = await getUserIdForCart(authUserId);

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
    const userIdToUse = await getUserIdForCart(userId);

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
    const userIdToUse = await getUserIdForCart(userId);

    const body = await req.json();

    // Validate input
    const validation = UpdateCartSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { productId, quantity } = validation.data;

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
