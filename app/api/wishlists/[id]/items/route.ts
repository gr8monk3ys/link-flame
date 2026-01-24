import { getServerAuth } from "@/lib/auth";
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
import {
  addToWishlist,
  removeFromWishlist,
} from "@/lib/wishlists";

/**
 * Wishlist Items API
 *
 * POST   /api/wishlists/[id]/items - Add an item to the wishlist
 * DELETE /api/wishlists/[id]/items - Remove an item from the wishlist
 */

const AddItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  note: z.string().max(500).optional(),
});

const RemoveItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/wishlists/[id]/items
 *
 * Add a product to the wishlist
 */
export async function POST(req: Request, { params }: RouteParams) {
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

    const { id: wishlistId } = await params;
    const { userId: authUserId } = await getServerAuth();

    // Apply rate limiting
    const identifier = getIdentifier(req, authUserId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await req.json();

    // Validate input
    const validation = AddItemSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { productId, note } = validation.data;
    const userIdToUse = await getUserIdForCart(authUserId);

    const result = await addToWishlist(wishlistId, productId, userIdToUse, note);

    if (!result.success) {
      if (result.error === "Wishlist not found") {
        return notFoundResponse("Wishlist");
      }
      if (result.error === "Product not found") {
        return notFoundResponse("Product");
      }
      if (result.alreadySaved) {
        return successResponse(
          { alreadySaved: true },
          { message: "Item already in wishlist" }
        );
      }
      return errorResponse(result.error || "Failed to add item", undefined, undefined, 400);
    }

    logger.info("Item added to wishlist", {
      userId: userIdToUse,
      wishlistId,
      productId,
    });

    return successResponse(
      {
        id: result.item!.id,
        productId: result.item!.productId,
        wishlistId: result.item!.wishlistId,
        note: result.item!.note,
        addedAt: result.item!.addedAt.toISOString(),
        product: {
          id: result.item!.product.id,
          title: result.item!.product.title,
          price: Number(result.item!.product.price),
          salePrice: result.item!.product.salePrice
            ? Number(result.item!.product.salePrice)
            : null,
          image: result.item!.product.image,
        },
      },
      undefined,
      201
    );
  } catch (error) {
    logger.error("Failed to add item to wishlist", error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/wishlists/[id]/items
 *
 * Remove a product from the wishlist
 */
export async function DELETE(req: Request, { params }: RouteParams) {
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

    const { id: wishlistId } = await params;
    const { userId: authUserId } = await getServerAuth();

    // Apply rate limiting
    const identifier = getIdentifier(req, authUserId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    // Get productId from query params
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");

    if (!productId) {
      return errorResponse("Product ID is required", undefined, undefined, 400);
    }

    const userIdToUse = await getUserIdForCart(authUserId);

    const result = await removeFromWishlist(wishlistId, productId, userIdToUse);

    if (!result.success) {
      if (result.error === "Wishlist not found") {
        return notFoundResponse("Wishlist");
      }
      return errorResponse(result.error || "Failed to remove item", undefined, undefined, 400);
    }

    logger.info("Item removed from wishlist", {
      userId: userIdToUse,
      wishlistId,
      productId,
    });

    return successResponse({
      removed: true,
      deleted: result.deleted,
    });
  } catch (error) {
    logger.error("Failed to remove item from wishlist", error);
    return handleApiError(error);
  }
}
