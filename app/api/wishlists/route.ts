import { NextRequest } from "next/server";
import { getServerAuth } from "@/lib/auth";
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
  conflictResponse,
  successResponse,
} from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  getUserWishlists,
  getOrCreateDefaultWishlist,
  createWishlist,
} from "@/lib/wishlists";

export const dynamic = 'force-dynamic'

/**
 * Wishlists API
 *
 * GET  /api/wishlists - Get all wishlists for the current user
 * POST /api/wishlists - Create a new wishlist
 */

const CreateWishlistSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  isPublic: z.boolean().optional().default(false),
});

// Pagination query parameter validation schema
const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  itemsPerWishlist: z.coerce.number().int().positive().max(50).default(10),
});

/**
 * GET /api/wishlists
 *
 * Returns paginated wishlists for the current user (authenticated or guest)
 *
 * Query Parameters:
 * - page: number (optional, default: 1) - Page number
 * - limit: number (optional, default: 10, max: 50) - Wishlists per page
 * - itemsPerWishlist: number (optional, default: 10, max: 50) - Items to include per wishlist
 *
 * Response: 200 OK
 * {
 *   "success": true,
 *   "data": [...wishlists],
 *   "meta": {
 *     "timestamp": "...",
 *     "pagination": {
 *       "page": 1,
 *       "limit": 10,
 *       "total": 5,
 *       "totalPages": 1,
 *       "hasNextPage": false,
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
      limit: searchParams.get("limit") || "10",
      itemsPerWishlist: searchParams.get("itemsPerWishlist") || "10",
    };

    const validation = PaginationSchema.safeParse(queryParams);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { page, limit, itemsPerWishlist } = validation.data;
    const skip = (page - 1) * limit;

    // Ensure default wishlist exists
    await getOrCreateDefaultWishlist(userIdToUse);

    // Get total count of wishlists for the user
    const total = await prisma.wishlist.count({
      where: { userId: userIdToUse },
    });

    // Get paginated wishlists with limited items per wishlist
    const wishlists = await prisma.wishlist.findMany({
      where: { userId: userIdToUse },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: {
            addedAt: "desc",
          },
          take: itemsPerWishlist, // Limit items per wishlist
        },
        _count: {
          select: { items: true }, // Get total item count for each wishlist
        },
      },
      orderBy: [
        { isDefault: "desc" }, // Default wishlist first
        { createdAt: "asc" },  // Then by creation date
      ],
      skip,
      take: limit,
    });

    // Transform the data for frontend consumption
    const formattedWishlists = wishlists.map((wishlist) => ({
      id: wishlist.id,
      visibleId: wishlist.visibleId,
      name: wishlist.name,
      isDefault: wishlist.isDefault,
      isPublic: wishlist.isPublic,
      shareToken: wishlist.isPublic ? wishlist.shareToken : null,
      itemCount: wishlist._count.items, // Total items in wishlist
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
    }));

    const totalPages = Math.ceil(total / limit);

    return paginatedResponse(formattedWishlists, {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    logger.error("Failed to fetch wishlists", error);
    return handleApiError(error);
  }
}

/**
 * POST /api/wishlists
 *
 * Create a new wishlist
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
    const validation = CreateWishlistSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { name, isPublic } = validation.data;

    // Get user ID for wishlist operations
    const userIdToUse = await getUserIdForCart(authUserId);

    // Check if wishlist with same name already exists
    const wishlists = await getUserWishlists(userIdToUse);
    if (wishlists.some((w) => w.name.toLowerCase() === name.toLowerCase())) {
      return conflictResponse(`A wishlist named "${name}" already exists`);
    }

    // Create the wishlist
    const wishlist = await createWishlist(userIdToUse, name, isPublic);

    logger.info("Wishlist created", {
      userId: userIdToUse,
      wishlistId: wishlist.id,
      name,
    });

    return successResponse(
      {
        id: wishlist.id,
        visibleId: wishlist.visibleId,
        name: wishlist.name,
        isDefault: wishlist.isDefault,
        isPublic: wishlist.isPublic,
        shareToken: wishlist.isPublic ? wishlist.shareToken : null,
        itemCount: 0,
        items: [],
        createdAt: wishlist.createdAt.toISOString(),
        updatedAt: wishlist.updatedAt.toISOString(),
      },
      undefined,
      201
    );
  } catch (error) {
    logger.error("Failed to create wishlist", error);
    return handleApiError(error);
  }
}
