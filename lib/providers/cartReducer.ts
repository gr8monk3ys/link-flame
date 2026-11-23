import { CartItem } from '@/types/cart'

type CartType = {
  items: CartItem[]
}

type CartAction =
  | {
      type: 'SET_CART'
      payload: CartType
    }
  | {
      type: 'ADD_ITEM'
      payload: CartItem
    }
  | {
      type: 'UPDATE_QUANTITY'
      payload: { id: string; variantId?: string | null; quantity: number }
    }
  | {
      type: 'REMOVE_ITEM'
      payload: { id: string; variantId?: string | null }
    }
  | {
      type: 'CLEAR_CART'
    }

// Helper to match cart items by productId + variantId
const matchCartItem = (item: CartItem, productId: string, variantId?: string | null): boolean => {
  if (item.id !== productId) return false
  // Match by variantId (null === null for items without variants)
  return (item.variantId || null) === (variantId || null)
}

export const cartReducer = (cart: CartType, action: CartAction): CartType => {
  switch (action.type) {
    case 'SET_CART': {
      return action.payload
    }

    case 'ADD_ITEM': {
      const { payload: incomingItem } = action
      const productId = incomingItem.id
      const variantId = incomingItem.variantId || null

      // Find by productId + variantId
      const indexInCart = cart?.items?.findIndex(item =>
        matchCartItem(item, productId, variantId)
      )

      let withAddedItem = [...(cart?.items || [])]

      if (indexInCart === -1) {
        withAddedItem.push(incomingItem)
      }

      const existing = typeof indexInCart === 'number' ? withAddedItem[indexInCart] : undefined
      if (typeof indexInCart === 'number' && existing) {
        withAddedItem[indexInCart] = {
          ...existing,
          quantity: existing.quantity + incomingItem.quantity,
        }
      }

      return {
        ...cart,
        items: withAddedItem,
      }
    }

    case 'UPDATE_QUANTITY': {
      const { payload: { id, variantId, quantity } } = action

      const indexInCart = cart?.items?.findIndex(item =>
        matchCartItem(item, id, variantId)
      )

      if (typeof indexInCart !== 'number' || indexInCart === -1) {
        return cart
      }

      const updatedItems = [...cart.items]
      const existing = updatedItems[indexInCart]
      if (!existing) {
        return cart
      }
      updatedItems[indexInCart] = {
        ...existing,
        quantity,
      }

      return {
        ...cart,
        items: updatedItems,
      }
    }

    case 'REMOVE_ITEM': {
      const { payload: { id, variantId } } = action

      return {
        ...cart,
        items: cart.items.filter(item => !matchCartItem(item, id, variantId)),
      }
    }

    case 'CLEAR_CART': {
      return {
        ...cart,
        items: [],
      }
    }

    default: {
      return cart
    }
  }
}
