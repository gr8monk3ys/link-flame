import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getExistingGuestSessionId, clearGuestSession } from "@/lib/session";
import { handleApiError, unauthorizedResponse, errorResponse, rateLimitErrorResponse } from "@/lib/api-response";
import { checkStrictRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic'

/**
 * POST /api/cart/migrate
 * Migrates guest cart items to authenticated user's cart
 *
 * This endpoint should be called after user authentication to merge
 * any items they added as a guest with their authenticated account.
 */
export async function POST(request: Request) {
  try {
    // CSRF protection for cart migration
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
      return unauthorizedResponse("Must be logged in to migrate cart");
    }

    // Apply strict rate limiting for cart migration (5 req/min) - sensitive operation
    const identifier = getIdentifier(request, userId);
    const { success, reset } = await checkStrictRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    // Get the guest session ID from cookie
    const guestSessionId = await getExistingGuestSessionId();

    // If no guest session, nothing to migrate
    if (!guestSessionId || !guestSessionId.startsWith("guest_")) {
      return NextResponse.json({
        success: true,
        message: "No guest cart to migrate",
        migrated: 0,
      });
    }

    const { migratedCount, mergedCount, guestItemCount } = await prisma.$transaction(async (tx) => {
      const guestCartItems = await tx.cartItem.findMany({
        where: {
          userId: guestSessionId,
        },
        select: {
          id: true,
          productId: true,
          variantId: true,
          quantity: true,
        },
      });

      if (guestCartItems.length === 0) {
        return { migratedCount: 0, mergedCount: 0, guestItemCount: 0 };
      }

      let migrated = 0;
      let merged = 0;

      for (const guestItem of guestCartItems) {
        const existingItem = await tx.cartItem.findFirst({
          where: {
            userId,
            productId: guestItem.productId,
            variantId: guestItem.variantId,
          },
          select: {
            id: true,
          },
        });

        if (existingItem) {
          const updated = await tx.cartItem.updateMany({
            where: {
              id: existingItem.id,
              userId,
            },
            data: {
              quantity: {
                increment: guestItem.quantity,
              },
            },
          });

          if (updated.count > 0) {
            await tx.cartItem.deleteMany({
              where: {
                id: guestItem.id,
                userId: guestSessionId,
              },
            });
            merged += 1;
          }
          continue;
        }

        try {
          const transferred = await tx.cartItem.updateMany({
            where: {
              id: guestItem.id,
              userId: guestSessionId,
            },
            data: {
              userId,
            },
          });

          if (transferred.count > 0) {
            migrated += 1;
          }
        } catch (migrationError) {
          if (
            migrationError instanceof Prisma.PrismaClientKnownRequestError &&
            migrationError.code === "P2002"
          ) {
            // A concurrent request created or moved the same product+variant in the target cart.
            const mergedTarget = await tx.cartItem.updateMany({
              where: {
                userId,
                productId: guestItem.productId,
                variantId: guestItem.variantId,
              },
              data: {
                quantity: {
                  increment: guestItem.quantity,
                },
              },
            });

            if (mergedTarget.count > 0) {
              await tx.cartItem.deleteMany({
                where: {
                  id: guestItem.id,
                  userId: guestSessionId,
                },
              });
              merged += 1;
            }
            continue;
          }

          throw migrationError;
        }
      }

      await tx.cartItem.deleteMany({
        where: {
          id: {
            in: guestCartItems.map((item) => item.id),
          },
          userId: guestSessionId,
        },
      });

      return {
        migratedCount: migrated,
        mergedCount: merged,
        guestItemCount: guestCartItems.length,
      };
    });

    if (guestItemCount === 0) {
      await clearGuestSession();
      return NextResponse.json({
        success: true,
        message: "Guest cart is empty",
        migrated: 0,
      });
    }

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
