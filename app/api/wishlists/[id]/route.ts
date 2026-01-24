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
  forbiddenResponse,
} from "@/lib/api-response";
import { logger } from "@/lib/logger";
import {
  getWishlistById,
  updateWishlist,
  deleteWishlist,
} from "@/lib/wishlists";

/**
 * Individual Wishlist API
 *
 * GET    /api/wishlists/[id] - Get a specific wishlist
 * PATCH  /api/wishlists/[id] - Update wishlist (rename, toggle public)
 * DELETE /api/wishlists/[id] - Delete wishlist (moves items to default)
 */

const UpdateWishlistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isPublic: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/wishlists/[id]
 *
 * Get a specific wishlist by ID
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { userId } = await getServerAuth();
    const userIdToUse = await getUserIdForCart(userId);

    const wishlist = await getWishlistById(id, userIdToUse);

    if (!wishlist) {
      return notFoundResponse("Wishlist");
    }

    return successResponse({
      id: wishlist.id,
      visibleId: wishlist.visibleId,
      name: wishlist.name,
      isDefault: wishlist.isDefault,
      isPublic: wishlist.isPublic,
      shareToken: wishlist.isPublic ? wishlist.shareToken : null,
      itemCount: wishlist.items.length,
      items: wishlist.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        note: item.note,
        addedAt: item.addedAt.toISOString(),
        product: {
          id: item.product.id,
          title: item.product.title,
          price: Number(item.product.price),
          salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
          image: item.product.image,
          category: item.product.category,
        },
      })),
      createdAt: wishlist.createdAt.toISOString(),
      updatedAt: wishlist.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error("Failed to fetch wishlist", error);
    return handleApiError(error);
  }
}

/**
 * PATCH /api/wishlists/[id]
 *
 * Update a wishlist (rename, toggle public status)
 */
export async function PATCH(req: Request, { params }: RouteParams) {
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

    const { id } = await params;
    const { userId: authUserId } = await getServerAuth();

    // Apply rate limiting
    const identifier = getIdentifier(req, authUserId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await req.json();

    // Validate input
    const validation = UpdateWishlistSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const userIdToUse = await getUserIdForCart(authUserId);

    // Check if trying to update default wishlist
    const existing = await getWishlistById(id, userIdToUse);
    if (!existing) {
      return notFoundResponse("Wishlist");
    }

    if (existing.isDefault && validation.data.name) {
      return forbiddenResponse("Cannot rename the default wishlist");
    }

    // Update the wishlist
    const wishlist = await updateWishlist(id, userIdToUse, validation.data);

    if (!wishlist) {
      return notFoundResponse("Wishlist");
    }

    logger.info("Wishlist updated", {
      userId: userIdToUse,
      wishlistId: id,
      updates: validation.data,
    });

    return successResponse({
      id: wishlist.id,
      visibleId: wishlist.visibleId,
      name: wishlist.name,
      isDefault: wishlist.isDefault,
      isPublic: wishlist.isPublic,
      shareToken: wishlist.isPublic ? wishlist.shareToken : null,
      itemCount: wishlist.items.length,
      items: wishlist.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        note: item.note,
        addedAt: item.addedAt.toISOString(),
        product: {
          id: item.product.id,
          title: item.product.title,
          price: Number(item.product.price),
          salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
          image: item.product.image,
          category: item.product.category,
        },
      })),
      createdAt: wishlist.createdAt.toISOString(),
      updatedAt: wishlist.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error("Failed to update wishlist", error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/wishlists/[id]
 *
 * Delete a wishlist and move its items to the default wishlist
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

    const { id } = await params;
    const { userId: authUserId } = await getServerAuth();

    // Apply rate limiting
    const identifier = getIdentifier(req, authUserId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const userIdToUse = await getUserIdForCart(authUserId);

    const result = await deleteWishlist(id, userIdToUse);

    if (!result.success) {
      if (result.error === "Wishlist not found") {
        return notFoundResponse("Wishlist");
      }
      return forbiddenResponse(result.error);
    }

    logger.info("Wishlist deleted", {
      userId: userIdToUse,
      wishlistId: id,
      movedItems: result.movedItems,
    });

    return successResponse({
      deleted: true,
      movedItems: result.movedItems,
      message: `Wishlist deleted. ${result.movedItems} item(s) moved to Favorites.`,
    });
  } catch (error) {
    logger.error("Failed to delete wishlist", error);
    return handleApiError(error);
  }
}
