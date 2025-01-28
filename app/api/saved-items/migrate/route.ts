import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGuestSessionId } from "@/lib/session";
import { handleApiError, unauthorizedResponse, errorResponse, rateLimitErrorResponse } from "@/lib/api-response";
import { checkStrictRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";
import { getOrCreateDefaultWishlist } from "@/lib/wishlists";

export const dynamic = 'force-dynamic'

/**
 * POST /api/saved-items/migrate
 *
 * Migrates guest saved items and wishlists to authenticated user's account.
 * This endpoint should be called after user authentication to merge
 * any items they saved as a guest with their authenticated account.
 */
export async function POST(request: Request) {
  try {
    // CSRF protection for saved items migration
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      );
    }

    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("Must be logged in to migrate saved items");
    }

    // Apply strict rate limiting for saved items migration (5 req/min) - sensitive operation
    const identifier = getIdentifier(request, userId);
    const { success, reset } = await checkStrictRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    // Get the guest session ID from cookie
    const guestSessionId = await getGuestSessionId();

    // If no guest session, nothing to migrate
    if (!guestSessionId.startsWith("guest_")) {
      return NextResponse.json({
        success: true,
        message: "No guest saved items to migrate",
        migrated: 0,
      });
    }

    // Migrate wishlists first
    const guestWishlists = await prisma.wishlist.findMany({
      where: {
        userId: guestSessionId,
      },
      include: {
        items: true,
      },
    });

    // Get or create user's default wishlist
    const userDefaultWishlist = await getOrCreateDefaultWishlist(userId);

    let migratedItems = 0;
    let skippedItems = 0;

    for (const guestWishlist of guestWishlists) {
      if (guestWishlist.isDefault) {
        // Migrate items from guest's default wishlist to user's default wishlist
        for (const item of guestWishlist.items) {
          // Check if product already exists in user's default wishlist
          const existingItem = await prisma.savedItem.findFirst({
            where: {
              wishlistId: userDefaultWishlist.id,
              productId: item.productId,
            },
          });

          if (existingItem) {
            skippedItems++;
          } else {
            // Transfer the item to user's default wishlist
            await prisma.savedItem.update({
              where: { id: item.id },
              data: {
                userId: userId,
                wishlistId: userDefaultWishlist.id,
              },
            });
            migratedItems++;
          }
        }
      } else {
        // For non-default wishlists, check if user already has a wishlist with the same name
        const existingUserWishlist = await prisma.wishlist.findFirst({
          where: {
            userId: userId,
            name: guestWishlist.name,
          },
        });

        if (existingUserWishlist) {
          // Merge items into existing user wishlist
          for (const item of guestWishlist.items) {
            const existingItem = await prisma.savedItem.findFirst({
              where: {
                wishlistId: existingUserWishlist.id,
                productId: item.productId,
              },
            });

            if (existingItem) {
              skippedItems++;
            } else {
              await prisma.savedItem.update({
                where: { id: item.id },
                data: {
                  userId: userId,
                  wishlistId: existingUserWishlist.id,
                },
              });
              migratedItems++;
            }
          }
        } else {
          // Transfer entire wishlist to user
          await prisma.wishlist.update({
            where: { id: guestWishlist.id },
            data: { userId: userId },
          });

          // Update all items in the wishlist
          await prisma.savedItem.updateMany({
            where: { wishlistId: guestWishlist.id },
            data: { userId: userId },
          });

          migratedItems += guestWishlist.items.length;
        }
      }
    }

    // Delete any remaining guest wishlists (those that were merged)
    await prisma.wishlist.deleteMany({
      where: {
        userId: guestSessionId,
      },
    });

    logger.info("Saved items migration completed", {
      userId,
      guestSessionId,
      migrated: migratedItems,
      skipped: skippedItems,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${migratedItems} items (${skippedItems} already existed)`,
      migrated: migratedItems,
      skipped: skippedItems,
      total: migratedItems + skippedItems,
    });
  } catch (error) {
    logger.error("Saved items migration failed", error);
    return handleApiError(error);
  }
}
