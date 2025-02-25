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
      payload: { id: string; quantity: number }
    }
  | {
      type: 'REMOVE_ITEM'
      payload: { id: string }
    }
  | {
      type: 'CLEAR_CART'
    }

export const cartReducer = (cart: CartType, action: CartAction): CartType => {
  switch (action.type) {
    case 'SET_CART': {
      return action.payload
    }

    case 'ADD_ITEM': {
      const { payload: incomingItem } = action
      const productId = incomingItem.id

      const indexInCart = cart?.items?.findIndex(item => item.id === productId)

      let withAddedItem = [...(cart?.items || [])]

      if (indexInCart === -1) {
        withAddedItem.push(incomingItem)
      }

      if (typeof indexInCart === 'number' && indexInCart > -1) {
        withAddedItem[indexInCart] = {
          ...withAddedItem[indexInCart],
          quantity: incomingItem.quantity,
        }
      }

      return {
        ...cart,
        items: withAddedItem,
      }
    }

    case 'UPDATE_QUANTITY': {
      const { payload: { id, quantity } } = action
      
      const indexInCart = cart?.items?.findIndex(item => item.id === id)

      if (typeof indexInCart !== 'number' || indexInCart === -1) {
        return cart
      }

      const updatedItems = [...cart.items]
      updatedItems[indexInCart] = {
        ...updatedItems[indexInCart],
        quantity,
      }

      return {
        ...cart,
        items: updatedItems,
      }
    }

    case 'REMOVE_ITEM': {
      const { payload: { id } } = action
      
      return {
        ...cart,
        items: cart.items.filter(item => item.id !== id),
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
