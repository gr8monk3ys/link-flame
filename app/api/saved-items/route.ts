import { NextRequest } from "next/server";
import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserIdForCart } from "@/lib/session";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { z } from "zod";
import {
  paginatedResponse,
  handleApiError,
  rateLimitErrorResponse,
  validationErrorResponse,
  errorResponse,
  notFoundResponse,
  successResponse,
} from "@/lib/api-response";
import { logger } from "@/lib/logger";
import {
  getOrCreateDefaultWishlist,
  addToWishlist,
  removeFromWishlist,
} from "@/lib/wishlists";

export const dynamic = 'force-dynamic'

/**
 * Saved Items API (Legacy/Backward Compatible)
 *
 * This API maintains backward compatibility with the original saved items implementation
 * while using the new wishlist-based system underneath.
 *
 * All operations use the user's default "Favorites" wishlist.
 *
 * GET  /api/saved-items - Get paginated saved items for the current user/guest
 * POST /api/saved-items - Add a product to saved items (default wishlist)
 * DELETE /api/saved-items?productId=xxx - Remove a product from saved items
 */

const SaveItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

// Pagination query parameter validation schema
const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

/**
 * GET /api/saved-items
 *
 * Returns paginated saved items for the current user (authenticated or guest)
 * across all wishlists, formatted for backward compatibility.
 *
 * Query Parameters:
 * - page: number (optional, default: 1) - Page number
 * - limit: number (optional, default: 20, max: 50) - Items per page
 *
 * Response: 200 OK
 * {
 *   "success": true,
 *   "data": [...items],
 *   "meta": {
 *     "timestamp": "...",
 *     "pagination": {
 *       "page": 1,
 *       "limit": 20,
 *       "total": 45,
 *       "totalPages": 3,
 *       "hasNextPage": true,
 *       "hasPreviousPage": false
 *     }
 *   }
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await getServerAuth();
    const userIdToUse = await getUserIdForCart(userId);

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    };

    const validation = PaginationSchema.safeParse(queryParams);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { page, limit } = validation.data;
    const skip = (page - 1) * limit;

    // Ensure default wishlist exists
    await getOrCreateDefaultWishlist(userIdToUse);

    // Get total count of saved items
    const total = await prisma.savedItem.count({
      where: { userId: userIdToUse },
    });

    // Get paginated saved items across all wishlists
    const savedItems = await prisma.savedItem.findMany({
      where: { userId: userIdToUse },
      include: {
        product: true,
        wishlist: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
      skip,
      take: limit,
    });

    // Transform the data to match the original SavedItem interface
    const formattedItems = savedItems.map((item) => ({
      id: item.productId, // Use productId as id for backward compatibility
      title: item.product.title,
      price: Number(item.product.price),
      image: item.product.image,
      quantity: 1, // Saved items don't have quantities
      savedAt: item.addedAt.toISOString(),
      wishlistId: item.wishlist?.id ?? null,
      wishlistName: item.wishlist?.name ?? "Favorites",
    }));

    const totalPages = Math.ceil(total / limit);

    return paginatedResponse(formattedItems, {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    logger.error("Failed to fetch saved items", error);
    return handleApiError(error);
  }
}

/**
 * POST /api/saved-items
 *
 * Add a product to saved items (default wishlist)
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

    // Get or create default wishlist
    const defaultWishlist = await getOrCreateDefaultWishlist(userIdToUse);

    // Add to default wishlist
    const result = await addToWishlist(defaultWishlist.id, productId, userIdToUse);

    if (!result.success) {
      if (result.error === "Product not found") {
        return notFoundResponse("Product");
      }
      if (result.alreadySaved) {
        return successResponse(
          { alreadySaved: true },
          { message: "Item already saved" }
        );
      }
      return errorResponse(result.error || "Failed to save item", undefined, undefined, 400);
    }

    logger.info("Item saved to wishlist", {
      userId: userIdToUse,
      productId,
      wishlistId: defaultWishlist.id,
    });

    // Return in original format for backward compatibility
    return successResponse(
      {
        id: result.item!.productId,
        title: result.item!.product.title,
        price: Number(result.item!.product.price),
        image: result.item!.product.image,
        quantity: 1,
        savedAt: result.item!.addedAt.toISOString(),
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
 * Remove a product from saved items (searches across all wishlists)
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

    // Find the saved item across all wishlists
    const savedItem = await prisma.savedItem.findFirst({
      where: {
        userId: userIdToUse,
        productId,
      },
      include: {
        wishlist: true,
      },
    });

    if (!savedItem) {
      // Item not found, but we'll still return success for backward compatibility
      return successResponse({ removed: true });
    }

    // Remove from wishlist
    const wishlistId = savedItem.wishlistId;
    if (!wishlistId) {
      // If no wishlist ID, just delete the saved item directly
      await prisma.savedItem.delete({ where: { id: savedItem.id } });
      return successResponse({ removed: true });
    }
    const result = await removeFromWishlist(wishlistId, productId, userIdToUse);

    if (!result.success) {
      return errorResponse(result.error || "Failed to remove item", undefined, undefined, 400);
    }

    logger.info("Item removed from wishlist", {
      userId: userIdToUse,
      productId,
      wishlistId: savedItem.wishlistId,
    });

    return successResponse({ removed: true });
  } catch (error) {
    logger.error("Failed to remove saved item", error);
    return handleApiError(error);
  }
}
