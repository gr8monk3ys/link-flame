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
    console.error('Error fetching CSRF token:', error)
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

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession()
  const [cart, dispatchCart] = useReducer(cartReducer, {
    items: [],
  })

  const [isLoading, setIsLoading] = useState(false)
  const hasInitialized = useRef(false)
  const [hasInitializedCart, setHasInitialized] = useState(false)
  const hasAttemptedCartMigration = useRef(false)

  // Track pending quantity updates to handle race conditions
  const pendingQuantityUpdates = useRef(0)
  const quantityUpdateVersion = useRef(0)

  // Check local storage for a cart
  // If there is a cart, fetch the products and hydrate the cart
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true

      const syncCartFromLocalStorage = async () => {
        setIsLoading(true)
        try {
          const localCart = localStorage.getItem('cart')
          const parsedCart = JSON.parse(localCart || '{}')

          if (parsedCart?.items && parsedCart?.items?.length > 0) {
            const initialCart = await Promise.all(
              parsedCart.items.map(async ({ id, quantity }: { id: string; quantity: number }) => {
                try {
                  const res = await fetch(`/api/products/${id}`)
                  if (!res.ok) throw new Error('Failed to fetch product')
                  const payload = await res.json()
                  const product = payload?.data ?? payload
                  if (!product?.id) {
                    throw new Error('Invalid product payload')
                  }
                  return {
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.image,
                    quantity,
                  }
                } catch (error) {
                  console.error(`Error fetching product ${id}:`, error)
                  return null
                }
              }),
            )

            dispatchCart({
              type: 'SET_CART',
              payload: {
                items: initialCart.filter(Boolean),
              },
            })
          } else {
            dispatchCart({
              type: 'SET_CART',
              payload: {
                items: [],
              },
            })
          }
        } catch (error) {
          console.error('Error syncing cart from local storage:', error)
        } finally {
          setIsLoading(false)
        }
      }

      syncCartFromLocalStorage()
    }
  }, [])

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
        console.error('Failed to fetch cart items')
      }
    } catch (error) {
      console.error('[FETCH_CART_ERROR]', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle cart migration when user logs in
  useEffect(() => {
    if (status === 'unauthenticated') {
      hasAttemptedCartMigration.current = false
      return
    }

    if (status !== 'authenticated' || !session?.user?.id || hasAttemptedCartMigration.current) {
      return
    }

    const migrateGuestCart = async () => {
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
          console.error('Failed to migrate guest cart')
          hasAttemptedCartMigration.current = false
        }
      } catch (error) {
        console.error('[CART_MIGRATION_ERROR]', error)
        hasAttemptedCartMigration.current = false
      }
    }

    migrateGuestCart()
  }, [status, session, fetchCartItems])

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
      setHasInitialized(true)
      return true
    } catch (error) {
      console.error('Error syncing cart to local storage:', error)
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
      console.error('Error getting user ID:', error)
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
      console.error('[ADD_TO_CART_ERROR]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add item to cart')

      // Revert optimistic update on error
      await fetchCartItems()
    } finally {
      setIsLoading(false)
    }
  }, [fetchCartItems])

  // Debounced API call for quantity updates with race condition handling
  const updateQuantityApi = useDebouncedCallback(async (productId: string, quantity: number, variantId: string | null, version: number) => {
    // Ignore stale requests - a newer update has been queued
    if (version !== quantityUpdateVersion.current) {
      pendingQuantityUpdates.current = Math.max(0, pendingQuantityUpdates.current - 1)
      if (pendingQuantityUpdates.current === 0) {
        setIsLoading(false)
      }
      return
    }

    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch('/api/cart', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ productId, variantId, quantity }),
      })

      // Check again if this is still the latest version after API call
      if (version !== quantityUpdateVersion.current) {
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || errorData.error || 'Failed to update cart')
      }
    } catch (error) {
      // Only handle error if this is still the latest version
      if (version === quantityUpdateVersion.current) {
        console.error('[UPDATE_CART_ERROR]', error)
        toast.error(error instanceof Error ? error.message : 'Failed to update quantity')
        // Revert optimistic update on error
        await fetchCartItems()
      }
    } finally {
      pendingQuantityUpdates.current = Math.max(0, pendingQuantityUpdates.current - 1)
      if (pendingQuantityUpdates.current === 0) {
        setIsLoading(false)
      }
    }
  }, 500)

  // Update quantity with optimistic updates and race condition handling
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

    // Track this update for race condition handling
    quantityUpdateVersion.current += 1
    pendingQuantityUpdates.current += 1
    const currentVersion = quantityUpdateVersion.current

    setIsLoading(true)

    // Actual API update (debounced) - pass version for stale request detection
    updateQuantityApi(productId, quantity, variantId || null, currentVersion)
  }, [updateQuantityApi])

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
      console.error('[REMOVE_ITEM_ERROR]', error)
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

  return (
    <Context.Provider
      value={{
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
      }}
    >
      {children}
    </Context.Provider>
  )
}
