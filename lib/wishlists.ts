import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export const DEFAULT_WISHLIST_NAME = 'Favorites';

/**
 * Generate a unique share token for public wishlists
 */
export function generateShareToken(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Generate a visible ID for wishlists (user-facing)
 */
export function generateVisibleId(): string {
  return `wl_${randomBytes(12).toString('hex')}`;
}

/**
 * Get or create the default wishlist for a user
 * This ensures every user has a default "Favorites" wishlist
 */
export async function getOrCreateDefaultWishlist(userId: string) {
  // Try to find existing default wishlist
  let wishlist = await prisma.wishlist.findFirst({
    where: {
      userId,
      isDefault: true,
    },
    include: {
      items: {
        include: {
          product: true,
        },
        orderBy: {
          addedAt: 'desc',
        },
      },
    },
  });

  // If no default wishlist exists, create one
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: {
        userId,
        name: DEFAULT_WISHLIST_NAME,
        isDefault: true,
        visibleId: generateVisibleId(),
      },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: {
            addedAt: 'desc',
          },
        },
      },
    });
  }

  return wishlist;
}

/**
 * Get all wishlists for a user
 */
export async function getUserWishlists(userId: string) {
  return prisma.wishlist.findMany({
    where: {
      userId,
    },
    include: {
      items: {
        include: {
          product: true,
        },
        orderBy: {
          addedAt: 'desc',
        },
      },
    },
    orderBy: [
      { isDefault: 'desc' }, // Default wishlist first
      { createdAt: 'asc' },  // Then by creation date
    ],
  });
}

/**
 * Get a wishlist by ID (with ownership check)
 */
export async function getWishlistById(wishlistId: string, userId: string) {
  return prisma.wishlist.findFirst({
    where: {
      id: wishlistId,
      userId,
    },
    include: {
      items: {
        include: {
          product: true,
        },
        orderBy: {
          addedAt: 'desc',
        },
      },
    },
  });
}

/**
 * Get a public wishlist by share token
 */
export async function getPublicWishlist(shareToken: string) {
  return prisma.wishlist.findFirst({
    where: {
      shareToken,
      isPublic: true,
    },
    include: {
      items: {
        include: {
          product: true,
        },
        orderBy: {
          addedAt: 'desc',
        },
      },
    },
  });
}

/**
 * Create a new wishlist for a user
 */
export async function createWishlist(userId: string, name: string, isPublic = false) {
  return prisma.wishlist.create({
    data: {
      userId,
      name,
      isPublic,
      visibleId: generateVisibleId(),
      shareToken: isPublic ? generateShareToken() : null,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

/**
 * Update a wishlist (rename, toggle public)
 */
export async function updateWishlist(
  wishlistId: string,
  userId: string,
  data: { name?: string; isPublic?: boolean }
) {
  // Get current wishlist to check if we need to generate/remove share token
  const currentWishlist = await prisma.wishlist.findFirst({
    where: {
      id: wishlistId,
      userId,
      isDefault: false, // Cannot update default wishlist
    },
  });

  if (!currentWishlist) {
    return null;
  }

  const updateData: {
    name?: string;
    isPublic?: boolean;
    shareToken?: string | null;
  } = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.isPublic !== undefined) {
    updateData.isPublic = data.isPublic;
    // Generate or remove share token based on public status
    if (data.isPublic && !currentWishlist.shareToken) {
      updateData.shareToken = generateShareToken();
    } else if (!data.isPublic && currentWishlist.shareToken) {
      updateData.shareToken = null;
    }
  }

  return prisma.wishlist.update({
    where: {
      id: wishlistId,
    },
    data: updateData,
    include: {
      items: {
        include: {
          product: true,
        },
        orderBy: {
          addedAt: 'desc',
        },
      },
    },
  });
}

/**
 * Delete a wishlist and move its items to the default wishlist
 */
export async function deleteWishlist(wishlistId: string, userId: string) {
  // Get the wishlist to check if it's the default
  const wishlist = await prisma.wishlist.findFirst({
    where: {
      id: wishlistId,
      userId,
    },
    include: {
      items: true,
    },
  });

  if (!wishlist) {
    return { success: false, error: 'Wishlist not found' };
  }

  if (wishlist.isDefault) {
    return { success: false, error: 'Cannot delete the default wishlist' };
  }

  // Get the default wishlist to move items to
  const defaultWishlist = await getOrCreateDefaultWishlist(userId);

  // Move items to default wishlist (skip duplicates)
  if (wishlist.items.length > 0) {
    for (const item of wishlist.items) {
      // Check if product already exists in default wishlist
      const existing = await prisma.savedItem.findFirst({
        where: {
          wishlistId: defaultWishlist.id,
          productId: item.productId,
        },
      });

      if (!existing) {
        // Move item to default wishlist
        await prisma.savedItem.update({
          where: { id: item.id },
          data: { wishlistId: defaultWishlist.id },
        });
      }
    }
  }

  // Delete the wishlist (remaining duplicate items will be cascade deleted)
  await prisma.wishlist.delete({
    where: { id: wishlistId },
  });

  return { success: true, movedItems: wishlist.items.length };
}

/**
 * Add a product to a wishlist
 */
export async function addToWishlist(
  wishlistId: string,
  productId: string,
  userId: string,
  note?: string
) {
  // Verify the wishlist belongs to the user
  const wishlist = await prisma.wishlist.findFirst({
    where: {
      id: wishlistId,
      userId,
    },
  });

  if (!wishlist) {
    return { success: false, error: 'Wishlist not found' };
  }

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return { success: false, error: 'Product not found' };
  }

  // Check if already in wishlist
  const existing = await prisma.savedItem.findFirst({
    where: {
      wishlistId,
      productId,
    },
  });

  if (existing) {
    return { success: false, error: 'Product already in wishlist', alreadySaved: true };
  }

  // Add to wishlist
  const savedItem = await prisma.savedItem.create({
    data: {
      userId,
      productId,
      wishlistId,
      note,
    },
    include: {
      product: true,
      wishlist: true,
    },
  });

  return { success: true, item: savedItem };
}

/**
 * Remove a product from a wishlist
 */
export async function removeFromWishlist(
  wishlistId: string,
  productId: string,
  userId: string
) {
  // Verify the wishlist belongs to the user
  const wishlist = await prisma.wishlist.findFirst({
    where: {
      id: wishlistId,
      userId,
    },
  });

  if (!wishlist) {
    return { success: false, error: 'Wishlist not found' };
  }

  // Delete the saved item
  const result = await prisma.savedItem.deleteMany({
    where: {
      wishlistId,
      productId,
    },
  });

  return { success: true, deleted: result.count };
}

/**
 * Move a product between wishlists
 */
export async function moveToWishlist(
  fromWishlistId: string,
  toWishlistId: string,
  productId: string,
  userId: string
) {
  // Verify both wishlists belong to the user
  const [fromWishlist, toWishlist] = await Promise.all([
    prisma.wishlist.findFirst({ where: { id: fromWishlistId, userId } }),
    prisma.wishlist.findFirst({ where: { id: toWishlistId, userId } }),
  ]);

  if (!fromWishlist || !toWishlist) {
    return { success: false, error: 'Wishlist not found' };
  }

  // Get the saved item
  const savedItem = await prisma.savedItem.findFirst({
    where: {
      wishlistId: fromWishlistId,
      productId,
    },
  });

  if (!savedItem) {
    return { success: false, error: 'Item not found in source wishlist' };
  }

  // Check if product already exists in target wishlist
  const existingInTarget = await prisma.savedItem.findFirst({
    where: {
      wishlistId: toWishlistId,
      productId,
    },
  });

  if (existingInTarget) {
    // Just delete from source if already exists in target
    await prisma.savedItem.delete({
      where: { id: savedItem.id },
    });
    return { success: true, merged: true };
  }

  // Move item to new wishlist
  const movedItem = await prisma.savedItem.update({
    where: { id: savedItem.id },
    data: { wishlistId: toWishlistId },
    include: {
      product: true,
      wishlist: true,
    },
  });

  return { success: true, item: movedItem };
}

/**
 * Update note on a saved item
 */
export async function updateSavedItemNote(
  savedItemId: string,
  userId: string,
  note: string | null
) {
  const savedItem = await prisma.savedItem.findFirst({
    where: {
      id: savedItemId,
      userId,
    },
  });

  if (!savedItem) {
    return { success: false, error: 'Item not found' };
  }

  const updated = await prisma.savedItem.update({
    where: { id: savedItemId },
    data: { note },
    include: {
      product: true,
    },
  });

  return { success: true, item: updated };
}

/**
 * Check if a product is saved in any of the user's wishlists
 */
export async function isProductSaved(productId: string, userId: string) {
  const saved = await prisma.savedItem.findFirst({
    where: {
      productId,
      userId,
    },
    include: {
      wishlist: true,
    },
  });

  return saved ? { saved: true, wishlist: saved.wishlist } : { saved: false };
}

/**
 * Get all saved items for a user (across all wishlists)
 */
export async function getAllSavedItems(userId: string) {
  return prisma.savedItem.findMany({
    where: {
      userId,
    },
    include: {
      product: true,
      wishlist: {
        select: {
          id: true,
          name: true,
          isDefault: true,
        },
      },
    },
    orderBy: {
      addedAt: 'desc',
    },
  });
}
