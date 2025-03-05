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
import { CartItem } from '@/types/cart'
import { cartReducer } from './cartReducer'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'

export type CartContext = {
  cart: {
    items: CartItem[]
  }
  addItemToCart: (item: CartItem) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  isProductInCart: (productId: string) => boolean
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
  const [cart, dispatchCart] = useReducer(cartReducer, {
    items: [],
  })

  const [total, setTotal] = useState<{
    formatted: string
    raw: number
  }>({
    formatted: '$0.00',
    raw: 0,
  })

  const [isLoading, setIsLoading] = useState(false)
  const hasInitialized = useRef(false)
  const [hasInitializedCart, setHasInitialized] = useState(false)

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
                  const product = await res.json()
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
        const items = await response.json()
        dispatchCart({
          type: 'SET_CART',
          payload: {
            items,
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

  // Sync cart to local storage - only store IDs and quantities
  const syncCartToLocalStorage = useCallback((currentCart: { items: CartItem[] }) => {
    if (!hasInitialized.current) return

    try {
      // Only store minimal data in localStorage
      const minimalCart = {
        items: currentCart?.items?.map((item: CartItem) => ({
          id: item.id,
          quantity: item.quantity,
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

  // Get user ID from Clerk or use a default
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
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          productId: item.id, 
          quantity: item.quantity 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to add item to cart')
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

  // Debounced API call for quantity updates
  const updateQuantityApi = useDebouncedCallback(async (productId: string, quantity: number) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update cart')
      }
    } catch (error) {
      console.error('[UPDATE_CART_ERROR]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update quantity')
      
      // Revert optimistic update on error
      await fetchCartItems()
    } finally {
      setIsLoading(false)
    }
  }, 500)

  // Update quantity with optimistic updates
  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    // Validate quantity
    if (quantity < 1 || quantity > 99) {
      toast.error('Quantity must be between 1 and 99')
      return
    }
    
    // Optimistic update
    dispatchCart({
      type: 'UPDATE_QUANTITY',
      payload: { id: productId, quantity },
    })
    
    setIsLoading(true)
    
    // Actual API update (debounced)
    updateQuantityApi(productId, quantity)
  }, [updateQuantityApi])

  // Remove item from cart with optimistic updates
  const removeItem = useCallback(async (productId: string) => {
    // Optimistic update
    dispatchCart({
      type: 'REMOVE_ITEM',
      payload: { id: productId },
    })
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/cart?productId=${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to remove item')
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

  // Check if product is in cart
  const isProductInCart = useCallback(
    (productId: string): boolean => {
      return Boolean(cart?.items?.find(item => item.id === productId))
    },
    [cart],
  )

  // Calculate cart total and derived values using useMemo
  useEffect(() => {
    if (!hasInitializedCart) return

    const newTotal = cart?.items?.reduce((acc, item) => {
      return acc + (item.price * item.quantity)
    }, 0) || 0

    setTotal({
      formatted: (newTotal).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
      raw: newTotal,
    })
  }, [cart, hasInitializedCart])
  
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
        cartTotal: total,
        hasInitializedCart,
        isLoading,
        fetchCartItems,
      }}
    >
      {children}
    </Context.Provider>
  )
}
