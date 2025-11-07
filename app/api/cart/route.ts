import { getServerAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdForCart } from "@/lib/session";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { z } from "zod";
import {
  handleApiError,
  rateLimitErrorResponse,
  validationErrorResponse,
  errorResponse
} from "@/lib/api-response";
import { logger } from "@/lib/logger";

// Validation schemas
const AddToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer").max(999, "Quantity cannot exceed 999").default(1),
});

const UpdateCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().nonnegative("Quantity must be 0 or positive").max(999, "Quantity cannot exceed 999"),
});

export async function GET(req: Request) {
  try {
    const { userId } = await getServerAuth();
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
    logger.error("Failed to fetch cart items", error);
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    // Get authenticated user ID first for rate limiting
    const { userId: authUserId } = await getServerAuth();

    // Apply rate limiting
    const identifier = getIdentifier(req, authUserId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await req.json();

    // Validate input
    const validation = AddToCartSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { productId, quantity } = validation.data;

    // Get user ID for cart operations
    const userIdToUse = await getUserIdForCart(authUserId);

    // Fetch product to check inventory
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, title: true, inventory: true },
    });

    if (!product) {
      return errorResponse("Product not found", undefined, undefined, 404);
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: userIdToUse,
        productId,
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      // Check if new quantity exceeds max limit
      if (newQuantity > 999) {
        return errorResponse(
          "Total quantity cannot exceed 999",
          undefined,
          undefined,
          400
        );
      }

      // Check if enough inventory available
      if (newQuantity > product.inventory) {
        return errorResponse(
          `Only ${product.inventory} items available for ${product.title}`,
          undefined,
          undefined,
          400
        );
      }

      await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: newQuantity,
        },
      });
    } else {
      // Check inventory for new item
      if (quantity > product.inventory) {
        return errorResponse(
          `Only ${product.inventory} items available for ${product.title}`,
          undefined,
          undefined,
          400
        );
      }

      await prisma.cartItem.create({
        data: {
          userId: userIdToUse,
          productId,
          quantity,
        },
      });
    }

    logger.info("Item added to cart", {
      userId: userIdToUse,
      productId,
      quantity,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Cart operation failed", error);
    return handleApiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await getServerAuth();
    const userIdToUse = await getUserIdForCart(userId);

    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    if (!productId) {
      return errorResponse("Product ID is required", undefined, undefined, 400);
    }

    await prisma.cartItem.deleteMany({
      where: {
        userId: userIdToUse,
        productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Cart operation failed", error);
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await getServerAuth();
    const userIdToUse = await getUserIdForCart(userId);

    const body = await req.json();

    // Validate input
    const validation = UpdateCartSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
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
    logger.error("Cart operation failed", error);
    return handleApiError(error);
  }
}
