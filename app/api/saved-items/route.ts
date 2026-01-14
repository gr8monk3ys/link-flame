import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserIdForCart } from "@/lib/session";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { z } from "zod";
import {
  successResponse,
  handleApiError,
  rateLimitErrorResponse,
  validationErrorResponse,
  errorResponse,
  notFoundResponse,
} from "@/lib/api-response";
import { logger } from "@/lib/logger";

/**
 * Saved Items API
 *
 * GET  /api/saved-items - Get all saved items for the current user/guest
 * POST /api/saved-items - Add a product to saved items
 */

const SaveItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

/**
 * GET /api/saved-items
 *
 * Returns all saved items for the current user (authenticated or guest)
 */
export async function GET(req: Request) {
  try {
    const { userId } = await getServerAuth();
    const userIdToUse = await getUserIdForCart(userId);

    const savedItems = await prisma.savedItem.findMany({
      where: {
        userId: userIdToUse,
      },
      include: {
        product: true,
      },
      orderBy: {
        savedAt: "desc",
      },
    });

    // Transform the data to match the SavedItem interface expected by the hook
    const formattedItems = savedItems.map((item) => ({
      id: item.productId,
      title: item.product.title,
      price: Number(item.product.price),
      image: item.product.image,
      quantity: 1, // Saved items don't have quantities
      savedAt: item.savedAt.toISOString(),
    }));

    return successResponse(formattedItems);
  } catch (error) {
    logger.error("Failed to fetch saved items", error);
    return handleApiError(error);
  }
}

/**
 * POST /api/saved-items
 *
 * Add a product to saved items (wishlist)
 */
export async function POST(req: Request) {
  try {
    // CSRF protection
    const csrfValid = await validateCsrfToken(req);
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      );
    }

    // Get authenticated user ID for rate limiting
    const { userId: authUserId } = await getServerAuth();

    // Apply rate limiting
    const identifier = getIdentifier(req, authUserId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await req.json();

    // Validate input
    const validation = SaveItemSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { productId } = validation.data;

    // Get user ID for saved items operations
    const userIdToUse = await getUserIdForCart(authUserId);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, title: true },
    });

    if (!product) {
      return notFoundResponse("Product");
    }

    // Check if already saved (upsert handles this, but we want to return appropriate message)
    const existingItem = await prisma.savedItem.findUnique({
      where: {
        userId_productId: {
          userId: userIdToUse,
          productId,
        },
      },
    });

    if (existingItem) {
      return successResponse(
        { alreadySaved: true },
        { message: "Item already saved" }
      );
    }

    // Create saved item
    const savedItem = await prisma.savedItem.create({
      data: {
        userId: userIdToUse,
        productId,
      },
      include: {
        product: true,
      },
    });

    logger.info("Item saved to wishlist", {
      userId: userIdToUse,
      productId,
    });

    return successResponse(
      {
        id: savedItem.productId,
        title: savedItem.product.title,
        price: Number(savedItem.product.price),
        image: savedItem.product.image,
        quantity: 1,
        savedAt: savedItem.savedAt.toISOString(),
      },
      undefined,
      201
    );
  } catch (error) {
    logger.error("Failed to save item", error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/saved-items
 *
 * Remove a product from saved items
 */
export async function DELETE(req: Request) {
  try {
    // CSRF protection
    const csrfValid = await validateCsrfToken(req);
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      );
    }

    const { userId } = await getServerAuth();
    const userIdToUse = await getUserIdForCart(userId);

    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    if (!productId) {
      return errorResponse("Product ID is required", undefined, undefined, 400);
    }

    // Delete the saved item
    await prisma.savedItem.deleteMany({
      where: {
        userId: userIdToUse,
        productId,
      },
    });

    logger.info("Item removed from wishlist", {
      userId: userIdToUse,
      productId,
    });

    return successResponse({ removed: true });
  } catch (error) {
    logger.error("Failed to remove saved item", error);
    return handleApiError(error);
  }
}
