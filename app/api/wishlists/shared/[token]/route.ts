import {
  successResponse,
  handleApiError,
  notFoundResponse,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getPublicWishlist } from "@/lib/wishlists";

/**
 * Public Shared Wishlist API
 *
 * GET /api/wishlists/shared/[token] - View a public wishlist
 */

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * GET /api/wishlists/shared/[token]
 *
 * Get a public wishlist by its share token
 * No authentication required - this is for public sharing
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    // Apply rate limiting to prevent abuse (public endpoint)
    const identifier = getIdentifier(req);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const { token } = await params;

    const wishlist = await getPublicWishlist(token);

    if (!wishlist) {
      return notFoundResponse("Wishlist");
    }

    logger.info("Public wishlist viewed", {
      wishlistId: wishlist.id,
      visibleId: wishlist.visibleId,
      itemCount: wishlist.items.length,
    });

    return successResponse({
      id: wishlist.visibleId, // Only expose visible ID, not internal ID
      name: wishlist.name,
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
          description: item.product.description,
        },
      })),
      createdAt: wishlist.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error("Failed to fetch public wishlist", error);
    return handleApiError(error);
  }
}
