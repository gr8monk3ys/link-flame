import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGuestSessionId, clearGuestSession } from "@/lib/session";
import { handleApiError, unauthorizedResponse } from "@/lib/api-response";

/**
 * POST /api/saved-items/migrate
 *
 * Migrates guest saved items to authenticated user's account.
 * This endpoint should be called after user authentication to merge
 * any items they saved as a guest with their authenticated account.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse("Must be logged in to migrate saved items");
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

    // Fetch all guest saved items
    const guestSavedItems = await prisma.savedItem.findMany({
      where: {
        userId: guestSessionId,
      },
    });

    if (guestSavedItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Guest saved items is empty",
        migrated: 0,
      });
    }

    let migratedCount = 0;
    let skippedCount = 0;

    // Migrate each guest saved item
    for (const guestItem of guestSavedItems) {
      // Check if user already has this product saved
      const existingItem = await prisma.savedItem.findUnique({
        where: {
          userId_productId: {
            userId: userId,
            productId: guestItem.productId,
          },
        },
      });

      if (existingItem) {
        // Product already saved by authenticated user, skip
        skippedCount++;
      } else {
        // Transfer the item to authenticated user
        await prisma.savedItem.update({
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

    // Delete any remaining guest saved items (those that were skipped)
    await prisma.savedItem.deleteMany({
      where: {
        userId: guestSessionId,
      },
    });

    console.log("[SAVED_ITEMS_MIGRATION]", {
      userId,
      guestSessionId,
      migrated: migratedCount,
      skipped: skippedCount,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${migratedCount} items (${skippedCount} already existed)`,
      migrated: migratedCount,
      skipped: skippedCount,
      total: migratedCount + skippedCount,
    });
  } catch (error) {
    console.error("[SAVED_ITEMS_MIGRATION_ERROR]", error);
    return handleApiError(error);
  }
}
