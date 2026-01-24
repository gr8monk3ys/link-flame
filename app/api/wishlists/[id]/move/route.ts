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
import { moveToWishlist } from "@/lib/wishlists";

/**
 * Move Item Between Wishlists API
 *
 * POST /api/wishlists/[id]/move - Move an item from this wishlist to another
 */

const MoveItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  toWishlistId: z.string().min(1, "Target wishlist ID is required"),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/wishlists/[id]/move
 *
 * Move a product from this wishlist to another
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

    const { id: fromWishlistId } = await params;
    const { userId: authUserId } = await getServerAuth();

    // Apply rate limiting
    const identifier = getIdentifier(req, authUserId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await req.json();

    // Validate input
    const validation = MoveItemSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { productId, toWishlistId } = validation.data;
    const userIdToUse = await getUserIdForCart(authUserId);

    const result = await moveToWishlist(
      fromWishlistId,
      toWishlistId,
      productId,
      userIdToUse
    );

    if (!result.success) {
      if (result.error === "Wishlist not found") {
        return notFoundResponse("Wishlist");
      }
      if (result.error === "Item not found in source wishlist") {
        return notFoundResponse("Item");
      }
      return errorResponse(result.error || "Failed to move item", undefined, undefined, 400);
    }

    logger.info("Item moved between wishlists", {
      userId: userIdToUse,
      fromWishlistId,
      toWishlistId,
      productId,
      merged: result.merged || false,
    });

    if (result.merged) {
      return successResponse({
        moved: true,
        merged: true,
        message: "Item already existed in target wishlist. Removed from source.",
      });
    }

    return successResponse({
      moved: true,
      item: {
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
    });
  } catch (error) {
    logger.error("Failed to move item between wishlists", error);
    return handleApiError(error);
  }
}
