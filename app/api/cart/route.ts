import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { clearGuestSession, getExistingGuestSessionId, getUserIdForCart } from "@/lib/session";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import {
  handleApiError,
  rateLimitErrorResponse,
  validationErrorResponse,
  errorResponse,
  successResponse
} from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { AddToCartSchema, UpdateCartSchema } from "@/lib/validations/cart";

export const dynamic = 'force-dynamic'

async function migrateGuestCartToAuthenticatedUser(
  guestSessionId: string,
  userId: string
): Promise<void> {
  const guestCartItems = await prisma.cartItem.findMany({
    where: { userId: guestSessionId },
    select: {
      id: true,
      productId: true,
      variantId: true,
      quantity: true,
    },
  });

  if (guestCartItems.length === 0) {
    await clearGuestSession();
    return;
  }

  await prisma.$transaction(async (tx) => {
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
        await tx.cartItem.updateMany({
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
        await tx.cartItem.deleteMany({
          where: {
            id: guestItem.id,
            userId: guestSessionId,
          },
        });
      } else {
        try {
          const transferred = await tx.cartItem.updateMany({
            where: {
              id: guestItem.id,
              userId: guestSessionId,
            },
            data: { userId },
          });

          if (transferred.count === 0) {
            continue;
          }
        } catch (migrationError) {
          if (
            migrationError instanceof Prisma.PrismaClientKnownRequestError &&
            migrationError.code === "P2002"
          ) {
            await tx.cartItem.updateMany({
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
            await tx.cartItem.deleteMany({
              where: {
                id: guestItem.id,
                userId: guestSessionId,
              },
            });
            continue;
          }

          throw migrationError;
        }
      }
    }
  });

  await clearGuestSession();
}

export async function GET(req: Request) {
  try {
    const { userId } = await getServerAuth();
    let userIdToUse: string;

    if (userId) {
      const guestSessionId = await getExistingGuestSessionId();
      if (
        guestSessionId &&
        guestSessionId.startsWith('guest_') &&
        guestSessionId !== userId
      ) {
        await migrateGuestCartToAuthenticatedUser(guestSessionId, userId);
      }
      userIdToUse = userId;
    } else {
      userIdToUse = await getUserIdForCart(null);
    }

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: userIdToUse,
      },
      include: {
        product: true,
        variant: true,
      },
    });

    // Transform the data to match the CartItem interface
    const formattedItems = cartItems.map(item => {
      // Use variant price if available, otherwise use product price
      const price = item.variant?.price ?? item.variant?.salePrice ??
                    item.product.salePrice ?? item.product.price;
      const image = item.variant?.image ?? item.product.image;

      return {
        id: item.productId,
        cartItemId: item.id,
        title: item.product.title,
        price: Number(price),
        image: image,
        quantity: item.quantity,
        // Variant info
        variantId: item.variantId,
        variant: item.variant ? {
          id: item.variant.id,
          sku: item.variant.sku,
          size: item.variant.size,
          color: item.variant.color,
          colorCode: item.variant.colorCode,
          material: item.variant.material,
        } : null,
      };
    });

    return successResponse(formattedItems);
  } catch (error) {
    logger.error("Failed to fetch cart items", error);
    return handleApiError(error);
  }
}

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

    // Get authenticated user ID first for rate limiting
    const { userId: authUserId } = await getServerAuth();

    // Apply rate limiting
    const identifier = getIdentifier(req, authUserId);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await req.json();

    // Validate input
    const validation = AddToCartSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { productId, variantId, quantity } = validation.data;

    // Get user ID for cart operations
    const userIdToUse = await getUserIdForCart(authUserId);

    // Fetch product with variants to check inventory
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        inventory: true,
        hasVariants: true,
        variants: true,
      },
    });

    if (!product) {
      return errorResponse("Product not found", undefined, undefined, 404);
    }

    // Validate variant if product has variants
    let variant = null;
    let inventoryToCheck = product.inventory;

    if (product.hasVariants) {
      if (!variantId) {
        return errorResponse(
          "Please select a variant (size/color) for this product",
          undefined,
          undefined,
          400
        );
      }

      variant = product.variants.find(v => v.id === variantId);
      if (!variant) {
        return errorResponse("Selected variant not found", undefined, undefined, 404);
      }

      inventoryToCheck = variant.inventory;
    } else if (variantId) {
      // Product doesn't have variants but variantId was provided - ignore it
      // This allows backward compatibility
    }

    // Find existing cart item for this product+variant combination
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: userIdToUse,
        productId,
        variantId: variantId || null,
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      // Check if new quantity exceeds max limit
      if (newQuantity > 999) {
        return errorResponse(
          "Total quantity cannot exceed 999",
          undefined,
          undefined,
          400
        );
      }

      // Check if enough inventory available
      if (newQuantity > inventoryToCheck) {
        const itemName = variant
          ? `${product.title} (${[variant.size, variant.color, variant.material].filter(Boolean).join(", ")})`
          : product.title;
        return errorResponse(
          `Only ${inventoryToCheck} items available for ${itemName}`,
          undefined,
          undefined,
          400
        );
      }

      await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: newQuantity,
        },
      });
    } else {
      // Check inventory for new item
      if (quantity > inventoryToCheck) {
        const itemName = variant
          ? `${product.title} (${[variant.size, variant.color, variant.material].filter(Boolean).join(", ")})`
          : product.title;
        return errorResponse(
          `Only ${inventoryToCheck} items available for ${itemName}`,
          undefined,
          undefined,
          400
        );
      }

      await prisma.cartItem.create({
        data: {
          userId: userIdToUse,
          productId,
          variantId: variantId || null,
          quantity,
        },
      });
    }

    logger.info("Item added to cart", {
      userId: userIdToUse,
      productId,
      variantId,
      quantity,
    });

    return successResponse({ success: true });
  } catch (error) {
    logger.error("Cart operation failed", error);
    return handleApiError(error);
  }
}

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
    const variantId = url.searchParams.get("variantId");
    const cartItemId = url.searchParams.get("cartItemId"); // Alternative: delete by cart item ID

    // Support deletion by cartItemId (more precise) or by productId+variantId
    if (cartItemId) {
      await prisma.cartItem.deleteMany({
        where: {
          id: cartItemId,
          userId: userIdToUse,
        },
      });
    } else if (productId) {
      await prisma.cartItem.deleteMany({
        where: {
          userId: userIdToUse,
          productId,
          variantId: variantId || null,
        },
      });
    } else {
      return errorResponse("Product ID or Cart Item ID is required", undefined, undefined, 400);
    }

    return successResponse({ success: true });
  } catch (error) {
    logger.error("Cart operation failed", error);
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
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

    const body = await req.json();

    // Validate input
    const validation = UpdateCartSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { productId, variantId, quantity } = validation.data;

    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: {
          userId: userIdToUse,
          productId,
          variantId: variantId || null,
        },
      });
    } else {
      await prisma.cartItem.updateMany({
        where: {
          userId: userIdToUse,
          productId,
          variantId: variantId || null,
        },
        data: {
          quantity,
        },
      });
    }

    return successResponse({ success: true });
  } catch (error) {
    logger.error("Cart operation failed", error);
    return handleApiError(error);
  }
}
