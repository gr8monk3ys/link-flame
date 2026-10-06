'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  useMemo,
} from 'react'
import { useSession } from 'next-auth/react'
import { CartItem } from '@/types/cart'
import { cartReducer } from './cartReducer'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'

// Helper to fetch CSRF token
async function getCsrfToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf')
    if (response.ok) {
      const { token } = await response.json()
      return token || ''
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching CSRF token:', error)
    }
  }
  return ''
}

export type CartContext = {
  cart: {
    items: CartItem[]
  }
  addItemToCart: (item: CartItem) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => void
  removeItem: (productId: string, variantId?: string | null, cartItemId?: string) => void
  clearCart: () => void
  isProductInCart: (productId: string, variantId?: string | null) => boolean
  cartTotal: {
    formatted: string
    raw: number
  }
  hasInitializedCart: boolean
  isLoading: boolean
  fetchCartItems: () => Promise<void>
}

const Context = createContext({} as CartContext)

export const useCart = () => useContext(Context)

function useCartProviderValue(): CartContext {
  const { data: session, status } = useSession()
  const [cart, dispatchCart] = useReducer(cartReducer, {
    items: [],
  })

  const [isLoading, setIsLoading] = useState(false)
  const hasInitialized = useRef(false)
  const [hasInitializedCart, setHasInitialized] = useState(false)
  const hasAttemptedCartMigration = useRef(false)

  // Latest unsent quantity per line item (productId + variantId). One
  // debounced flush sends them all, so editing two items inside the debounce
  // window saves both instead of only the last one.
  const pendingQuantities = useRef(
    new Map<string, { productId: string; variantId: string | null; quantity: number }>()
  )
  // Flushes run one after another so a slow request can't land after a newer one.
  const quantityFlushChain = useRef<Promise<void>>(Promise.resolve())
  const quantityUpdateFailed = useRef(false)

  // Fetch cart items from the server
  const fetchCartItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/cart')

      if (response.ok) {
        const result = await response.json()
        // Handle both wrapped response { success, data } and direct array response
        const items = result.data || result
        dispatchCart({
          type: 'SET_CART',
          payload: {
            items: Array.isArray(items) ? items : [],
          },
        })
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch cart items')
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[FETCH_CART_ERROR]', error)
      }
    } finally {
      setIsLoading(false)
      // The cart page shows "empty" only after the first server answer.
      setHasInitialized(true)
    }
  }, [])

  // Hydrate from the server cart, which checkout reads. The localStorage copy
  // keeps only ids and quantities, so rebuilding from it lost each line's
  // variant, cart item id and sale price: after a reload a guest's remove or
  // quantity change matched no server row, and checkout still charged it.
  useEffect(() => {
    if (hasInitialized.current) {
      return
    }

    hasInitialized.current = true
    void fetchCartItems()
  }, [fetchCartItems])

  const migrateGuestCart = useCallback(async () => {
    hasAttemptedCartMigration.current = true

    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch('/api/cart/migrate', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.total > 0) {
          toast.success(`Welcome back! ${data.total} item(s) added to your cart`)
        }
        // Always refresh after migration attempt because server cart might have changed.
        await fetchCartItems()
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to migrate guest cart')
        }
        hasAttemptedCartMigration.current = false
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[CART_MIGRATION_ERROR]', error)
      }
      hasAttemptedCartMigration.current = false
    }
  }, [fetchCartItems])

  // Handle cart migration when user logs in
  useEffect(() => {
    if (status === 'unauthenticated') {
      hasAttemptedCartMigration.current = false
      return
    }

    if (
      status !== 'authenticated' ||
      !session?.user?.id ||
      hasAttemptedCartMigration.current
    ) {
      return
    }

    void migrateGuestCart()
  }, [migrateGuestCart, session?.user?.id, status])

  // Sync cart to local storage - only store IDs, quantities, and variantIds
  const syncCartToLocalStorage = useCallback((currentCart: { items: CartItem[] }) => {
    if (!hasInitialized.current) return

    try {
      // Only store minimal data in localStorage
      const minimalCart = {
        items: currentCart?.items?.map((item: CartItem) => ({
          id: item.id,
          quantity: item.quantity,
          variantId: item.variantId || null,
        })) || [],
      }

      localStorage.setItem('cart', JSON.stringify(minimalCart))
      return true
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error syncing cart to local storage:', error)
      }
      return false
    }
  }, [])

  // Every time the cart changes, save to local storage
  useEffect(() => {
    syncCartToLocalStorage(cart)
  }, [cart, syncCartToLocalStorage])

  // Get user ID from session or use a default
  const getUserId = async (): Promise<string> => {
    try {
      // Try to get the user ID from the auth API
      const response = await fetch('/api/auth/user')
      if (response.ok) {
        const { userId } = await response.json()
        return userId || 'guest-user'
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting user ID:', error)
      }
    }
    return 'guest-user'
  }

  // Add item to cart with optimistic updates and error handling
  const addItemToCart = useCallback(async (item: CartItem) => {
    // Optimistic update
    dispatchCart({
      type: 'ADD_ITEM',
      payload: item,
    })

    setIsLoading(true)
    try {
      const userId = await getUserId()
      const csrfToken = await getCsrfToken()

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          userId,
          productId: item.id,
          variantId: item.variantId || null,
          quantity: item.quantity
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || errorData.error || 'Failed to add item to cart')
      }

      toast.success('Item added to cart')
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[ADD_TO_CART_ERROR]', error)
      }
      toast.error(error instanceof Error ? error.message : 'Failed to add item to cart')

      // Revert optimistic update on error
      await fetchCartItems()
    } finally {
      setIsLoading(false)
    }
  }, [fetchCartItems])

  const sendPendingQuantities = useCallback(async () => {
    const updates = [...pendingQuantities.current.values()]
    pendingQuantities.current.clear()
    if (updates.length === 0) return

    try {
      const csrfToken = await getCsrfToken()
      const results = await Promise.allSettled(
        updates.map(async ({ productId, variantId, quantity }) => {
          const response = await fetch('/api/cart', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({ productId, variantId, quantity }),
          })
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error?.message || errorData.error || 'Failed to update cart')
          }
        }),
      )
      const failure = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
      if (failure) throw failure.reason
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[UPDATE_CART_ERROR]', error)
      }
      toast.error(error instanceof Error ? error.message : 'Failed to update quantity')
      quantityUpdateFailed.current = true
    }

    // Newer edits are queued: leave loading on and let their flush finish up.
    if (pendingQuantities.current.size > 0) return

    if (quantityUpdateFailed.current) {
      quantityUpdateFailed.current = false
      // Revert optimistic updates to what the server actually has
      await fetchCartItems()
    }
    setIsLoading(false)
  }, [fetchCartItems])

  const flushQuantityUpdates = useDebouncedCallback(() => {
    quantityFlushChain.current = quantityFlushChain.current.then(sendPendingQuantities)
  }, 500)

  // Update quantity with an optimistic update; the server write is debounced
  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string | null) => {
    // Validate quantity
    if (quantity < 1 || quantity > 99) {
      toast.error('Quantity must be between 1 and 99')
      return
    }

    // Optimistic update - find item by productId + variantId
    dispatchCart({
      type: 'UPDATE_QUANTITY',
      payload: { id: productId, variantId: variantId || null, quantity },
    })

    pendingQuantities.current.set(`${productId}:${variantId || ''}`, {
      productId,
      variantId: variantId || null,
      quantity,
    })

    setIsLoading(true)
    flushQuantityUpdates()
  }, [flushQuantityUpdates])

  // Remove item from cart with optimistic updates
  const removeItem = useCallback(async (productId: string, variantId?: string | null, cartItemId?: string) => {
    // Optimistic update
    dispatchCart({
      type: 'REMOVE_ITEM',
      payload: { id: productId, variantId: variantId || null },
    })

    setIsLoading(true)
    try {
      // Build query params - prefer cartItemId if available for precise deletion
      const params = new URLSearchParams()
      if (cartItemId) {
        params.set('cartItemId', cartItemId)
      } else {
        params.set('productId', productId)
        if (variantId) {
          params.set('variantId', variantId)
        }
      }

      const csrfToken = await getCsrfToken()
      const response = await fetch(`/api/cart?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || errorData.error || 'Failed to remove item')
      }

      toast.success('Item removed from cart')
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[REMOVE_ITEM_ERROR]', error)
      }
      toast.error(error instanceof Error ? error.message : 'Failed to remove item')

      // Revert optimistic update on error
      await fetchCartItems()
    } finally {
      setIsLoading(false)
    }
  }, [fetchCartItems])

  // Clear cart
  const clearCart = useCallback(() => {
    dispatchCart({
      type: 'CLEAR_CART',
    })
  }, [])

  // Check if product (with optional variant) is in cart
  const isProductInCart = useCallback(
    (productId: string, variantId?: string | null): boolean => {
      return Boolean(cart?.items?.find(item => {
        if (item.id !== productId) return false
        // If variantId is specified, also match by variantId
        if (variantId !== undefined) {
          return item.variantId === (variantId || null)
        }
        return true
      }))
    },
    [cart],
  )

  // Calculate cart total synchronously using useMemo
  const cartTotal = useMemo(() => {
    const rawTotal = cart?.items?.reduce((acc, item) => {
      return acc + (item.price * item.quantity)
    }, 0) || 0

    return {
      formatted: rawTotal.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
      raw: rawTotal,
    }
  }, [cart.items])
  
  // Memoized cart items with additional derived data
  const cartItems = useMemo(() => 
    cart.items.map(item => ({
      ...item,
      totalPrice: item.price * item.quantity,
      formattedPrice: (item.price).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
      formattedTotalPrice: (item.price * item.quantity).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
    })),
    [cart.items]
  )

  return {
    cart: { ...cart, items: cartItems },
    addItemToCart,
    updateQuantity,
    removeItem,
    clearCart,
    isProductInCart,
    cartTotal,
    hasInitializedCart,
    isLoading,
    fetchCartItems,
  }
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useCartProviderValue()
  return <Context.Provider value={value}>{children}</Context.Provider>
}
