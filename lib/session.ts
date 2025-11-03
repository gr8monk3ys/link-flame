import { nanoid } from 'nanoid'
import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'guest_session_id'
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/**
 * Gets or creates a guest session ID from cookies.
 *
 * This function manages anonymous user sessions by checking for an existing
 * guest session cookie and creating a new one if it doesn't exist. Guest
 * sessions enable features like cart persistence and saved items for users
 * who haven't authenticated yet.
 *
 * The session ID is stored in an httpOnly cookie for security and persists
 * for 30 days. When a user logs in, the guest session can be merged with
 * their authenticated account using {@link clearGuestSession}.
 *
 * @returns {Promise<string>} A unique session identifier prefixed with "guest_" (e.g., "guest_V1StGXR8_Z5jdHi6B-myT")
 *
 * @example
 * ```typescript
 * // In an API route for guest cart management
 * const sessionId = await getGuestSessionId()
 * const cart = await getCartItems(sessionId)
 * ```
 */
export async function getGuestSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionId) {
    // Generate a new session ID for this guest user
    sessionId = `guest_${nanoid(24)}`
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_COOKIE_MAX_AGE,
      path: '/',
    })
  }

  return sessionId
}

/**
 * Gets the appropriate user identifier for cart operations.
 *
 * This is a convenience function that determines whether to use an authenticated
 * user's ID or create/retrieve a guest session ID. It's the primary function used
 * throughout the cart API to handle both authenticated and anonymous users seamlessly.
 *
 * **Flow:**
 * - If `authUserId` is provided (user is logged in), returns it directly
 * - If `authUserId` is null (user is anonymous), calls {@link getGuestSessionId} to get/create a guest session
 *
 * @param {string | null} authUserId - The authenticated user ID from Clerk, or null for guest users
 * @returns {Promise<string>} Either the authenticated user ID or a guest session ID
 *
 * @example
 * ```typescript
 * // In an API route
 * import { auth } from '@clerk/nextjs/server'
 * import { getUserIdForCart } from '@/lib/session'
 *
 * const { userId } = await auth()
 * const cartUserId = await getUserIdForCart(userId) // Returns userId or creates guest session
 * const items = await getCartItems(cartUserId)
 * ```
 */
export async function getUserIdForCart(authUserId: string | null): Promise<string> {
  if (authUserId) {
    return authUserId
  }
  return getGuestSessionId()
}

/**
 * Clears the guest session cookie.
 *
 * This function should be called after a user authenticates and their guest cart
 * has been successfully merged with their authenticated account. It removes the
 * guest session cookie to prevent duplicate cart entries and session conflicts.
 *
 * **Common use cases:**
 * - After user logs in and guest cart items are migrated to their account
 * - During account creation when merging guest cart
 * - When explicitly clearing session data for privacy/security
 *
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * // After merging guest cart on login
 * import { clearGuestSession, getGuestSessionId } from '@/lib/session'
 * import { auth } from '@clerk/nextjs/server'
 *
 * const { userId } = await auth()
 * if (userId) {
 *   const guestSessionId = await getGuestSessionId()
 *   await mergeGuestCartToUser(guestSessionId, userId)
 *   await clearGuestSession() // Clean up guest session
 * }
 * ```
 */
export async function clearGuestSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
