import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGuestSessionId, clearGuestSession } from "@/lib/session";
import { handleApiError, unauthorizedResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";

/**
 * POST /api/cart/migrate
 * Migrates guest cart items to authenticated user's cart
 *
 * This endpoint should be called after user authentication to merge
 * any items they added as a guest with their authenticated account.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("Must be logged in to migrate cart");
    }

    // Get the guest session ID from cookie
    const guestSessionId = await getGuestSessionId();

    // If no guest session, nothing to migrate
    if (!guestSessionId.startsWith("guest_")) {
      return NextResponse.json({
        success: true,
        message: "No guest cart to migrate",
        migrated: 0,
      });
    }

    // Fetch all guest cart items
    const guestCartItems = await prisma.cartItem.findMany({
      where: {
        userId: guestSessionId,
      },
      include: {
        product: true,
      },
    });

    if (guestCartItems.length === 0) {
      await clearGuestSession();
      return NextResponse.json({
        success: true,
        message: "Guest cart is empty",
        migrated: 0,
      });
    }

    let migratedCount = 0;
    let mergedCount = 0;

    // Migrate each guest cart item
    for (const guestItem of guestCartItems) {
      // Check if user already has this product in their cart
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          userId: userId,
          productId: guestItem.productId,
        },
      });

      if (existingItem) {
        // Merge quantities if product already exists in authenticated cart
        await prisma.cartItem.update({
          where: {
            id: existingItem.id,
          },
          data: {
            quantity: existingItem.quantity + guestItem.quantity,
          },
        });
        mergedCount++;
      } else {
        // Transfer the item to authenticated user
        await prisma.cartItem.update({
          where: {
            id: guestItem.id,
          },
          data: {
            userId: userId,
          },
        });
        migratedCount++;
      }
    }

    // Delete any remaining guest cart items (those that were merged)
    await prisma.cartItem.deleteMany({
      where: {
        userId: guestSessionId,
      },
    });

    // Clear the guest session cookie
    await clearGuestSession();

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${migratedCount} items and merged ${mergedCount} items`,
      migrated: migratedCount,
      merged: mergedCount,
      total: migratedCount + mergedCount,
    });
  } catch (error) {
    logger.error("Cart migration failed", error);
    return handleApiError(error);
  }
}
