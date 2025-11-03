/**
 * Cart database operations using Prisma.
 *
 * This module provides CRUD operations for shopping cart items stored in the database.
 * It supports both authenticated users (via Clerk user IDs) and guest users (via session IDs).
 *
 * **Key Features:**
 * - Automatic quantity aggregation when adding duplicate items
 * - Product data joined from Product table
 * - Type-safe operations with Prisma
 *
 * **User Identification:**
 * Use {@link getUserIdForCart} from `lib/session.ts` to get the appropriate user ID:
 * - Authenticated users: Clerk user ID
 * - Guest users: Session ID from cookie
 *
 * @module lib/cart
 */

import { prisma } from "@/lib/prisma";
import type { CartItem } from "@/types/cart";

/**
 * Retrieves all cart items for a given user.
 *
 * This function fetches cart items from the database and joins with the Product table
 * to get full product details (title, price, image). The returned data is transformed
 * to match the CartItem type used throughout the application.
 *
 * @param {string} userId - User identifier (Clerk user ID for authenticated users, session ID for guests)
 * @returns {Promise<CartItem[]>} Array of cart items with product details
 *
 * @example
 * ```typescript
 * import { getUserIdForCart } from '@/lib/session'
 * import { getCartItems } from '@/lib/cart'
 * import { auth } from '@clerk/nextjs/server'
 *
 * const { userId: authUserId } = await auth()
 * const userId = await getUserIdForCart(authUserId)
 * const items = await getCartItems(userId)
 * // Returns: [{ id: "prod_123", title: "Eco Bottle", price: 25, image: "/...", quantity: 2 }]
 * ```
 */
export async function getCartItems(userId: string): Promise<CartItem[]> {
  const cartItems = await prisma.cartItem.findMany({
    where: {
      userId,
    },
    include: {
      product: true,
    },
  });

  return cartItems.map((item) => ({
    id: item.productId,
    title: item.product.title,
    price: Number(item.product.price),
    image: item.product.image,
    quantity: item.quantity,
  }));
}

/**
 * Adds a product to the user's cart or increments quantity if already present.
 *
 * This function implements smart cart addition by:
 * - Checking if the product already exists in the user's cart
 * - If exists: Increments the quantity by the specified amount
 * - If new: Creates a new cart item with the specified quantity
 *
 * This prevents duplicate cart entries for the same product and provides a better
 * user experience by automatically aggregating quantities.
 *
 * @param {string} userId - User identifier (Clerk user ID for authenticated users, session ID for guests)
 * @param {string} productId - The product ID to add to cart
 * @param {number} [quantity=1] - Quantity to add (defaults to 1)
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * // Add 1 item
 * await addToCart(userId, "prod_abc123")
 *
 * // Add 3 items
 * await addToCart(userId, "prod_abc123", 3)
 *
 * // If product already exists with quantity 2, this makes it quantity 5
 * await addToCart(userId, "prod_abc123", 3)
 * ```
 *
 * @example
 * ```typescript
 * // In an API route
 * export async function POST(request: Request) {
 *   const { productId, quantity } = await request.json()
 *   const { userId: authUserId } = await auth()
 *   const userId = await getUserIdForCart(authUserId)
 *
 *   await addToCart(userId, productId, quantity)
 *   return NextResponse.json({ success: true })
 * }
 * ```
 */
export async function addToCart(userId: string, productId: string, quantity: number = 1): Promise<void> {
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      userId,
      productId,
    },
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: {
        id: existingItem.id,
      },
      data: {
        quantity: existingItem.quantity + quantity,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity,
      },
    });
  }
}

/**
 * Updates the quantity of a cart item to an exact value.
 *
 * Unlike {@link addToCart} which increments the quantity, this function sets the
 * quantity to the exact value specified. This is typically used when a user manually
 * adjusts the quantity in the cart UI (e.g., via a number input or +/- buttons).
 *
 * **Important:** This function uses `updateMany` instead of `update` to avoid
 * needing to find the cart item ID first. Since userId + productId is effectively
 * unique, updateMany will only affect one record.
 *
 * @param {string} userId - User identifier (Clerk user ID for authenticated users, session ID for guests)
 * @param {string} productId - The product ID to update
 * @param {number} quantity - The new quantity (not added to existing, but replaces it)
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * // Set cart item quantity to exactly 5 (regardless of current quantity)
 * await updateCartItemQuantity(userId, "prod_abc123", 5)
 * ```
 *
 * @example
 * ```typescript
 * // In a cart update API route
 * export async function PATCH(request: Request) {
 *   const { productId, quantity } = await request.json()
 *   const { userId: authUserId } = await auth()
 *   const userId = await getUserIdForCart(authUserId)
 *
 *   if (quantity <= 0) {
 *     await removeFromCart(userId, productId)
 *   } else {
 *     await updateCartItemQuantity(userId, productId, quantity)
 *   }
 *
 *   return NextResponse.json({ success: true })
 * }
 * ```
 */
export async function updateCartItemQuantity(userId: string, productId: string, quantity: number): Promise<void> {
  await prisma.cartItem.updateMany({
    where: {
      userId,
      productId,
    },
    data: {
      quantity,
    },
  });
}

/**
 * Removes a specific product from the user's cart.
 *
 * This function completely removes a cart item regardless of its quantity.
 * If the product doesn't exist in the cart, the operation completes successfully
 * (no error is thrown).
 *
 * **Use Cases:**
 * - User clicks "Remove" button on cart item
 * - Auto-removal when quantity is set to 0
 * - Cleanup when a product is no longer available
 *
 * @param {string} userId - User identifier (Clerk user ID for authenticated users, session ID for guests)
 * @param {string} productId - The product ID to remove from cart
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * // Remove a product from cart
 * await removeFromCart(userId, "prod_abc123")
 * ```
 *
 * @example
 * ```typescript
 * // In a cart delete API route
 * export async function DELETE(
 *   request: Request,
 *   { params }: { params: Promise<{ productId: string }> }
 * ) {
 *   const { productId } = await params
 *   const { userId: authUserId } = await auth()
 *   const userId = await getUserIdForCart(authUserId)
 *
 *   await removeFromCart(userId, productId)
 *   return NextResponse.json({ success: true })
 * }
 * ```
 */
export async function removeFromCart(userId: string, productId: string): Promise<void> {
  await prisma.cartItem.deleteMany({
    where: {
      userId,
      productId,
    },
  });
}

/**
 * Removes all items from the user's cart.
 *
 * This function performs a bulk deletion of all cart items for a given user.
 * It's typically used after a successful checkout or when a user explicitly
 * wants to empty their cart.
 *
 * **Use Cases:**
 * - After successful checkout/payment (order confirmation)
 * - User clicks "Clear Cart" or "Empty Cart" button
 * - Account cleanup operations
 * - Merging guest cart to authenticated user (clear old guest cart)
 *
 * **Warning:** This operation cannot be undone. Ensure you have user confirmation
 * or a valid business reason before calling this function.
 *
 * @param {string} userId - User identifier (Clerk user ID for authenticated users, session ID for guests)
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * // Clear cart after successful checkout
 * await clearCart(userId)
 * ```
 *
 * @example
 * ```typescript
 * // In a webhook handler after payment success
 * import Stripe from 'stripe'
 * import { clearCart } from '@/lib/cart'
 *
 * const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
 *
 * export async function POST(request: Request) {
 *   const event = await stripe.webhooks.constructEvent(...)
 *
 *   if (event.type === 'checkout.session.completed') {
 *     const session = event.data.object
 *     const userId = session.metadata.userId
 *
 *     // Clear cart after successful payment
 *     await clearCart(userId)
 *   }
 *
 *   return NextResponse.json({ received: true })
 * }
 * ```
 */
export async function clearCart(userId: string): Promise<void> {
  await prisma.cartItem.deleteMany({
    where: {
      userId,
    },
  });
}
