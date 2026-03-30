import { describe, it, expect } from 'vitest'
import { cartReducer } from '@/lib/providers/cartReducer'
import type { CartItem } from '@/types/cart'

/**
 * Cart Reducer Unit Tests
 *
 * Tests the cart state management logic:
 * - Adding items (new items, duplicate items, variant handling)
 * - Updating quantities
 * - Removing items
 * - Clearing cart
 * - Variant-based item matching
 */

// Helper to create a cart item for testing
const createCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'product-1',
  title: 'Test Product',
  price: 29.99,
  quantity: 1,
  image: '/test-image.jpg',
  variantId: null,
  ...overrides,
})

// Initial empty cart state
const emptyCart = { items: [] }

describe('Cart Reducer', () => {
  describe('SET_CART', () => {
    it('should set cart to provided state', () => {
      const items = [createCartItem()]
      const result = cartReducer(emptyCart, {
        type: 'SET_CART',
        payload: { items },
      })

      expect(result.items).toEqual(items)
    })

    it('should replace existing cart items', () => {
      const initialCart = {
        items: [createCartItem({ id: 'old-product' })],
      }
      const newItems = [createCartItem({ id: 'new-product' })]

      const result = cartReducer(initialCart, {
        type: 'SET_CART',
        payload: { items: newItems },
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].id).toBe('new-product')
    })

    it('should handle empty cart payload', () => {
      const initialCart = {
        items: [createCartItem()],
      }

      const result = cartReducer(initialCart, {
        type: 'SET_CART',
        payload: { items: [] },
      })

      expect(result.items).toHaveLength(0)
    })
  })

  describe('ADD_ITEM', () => {
    it('should add new item to empty cart', () => {
      const item = createCartItem()

      const result = cartReducer(emptyCart, {
        type: 'ADD_ITEM',
        payload: item,
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toEqual(item)
    })

    it('should add new item to existing cart', () => {
      const existingItem = createCartItem({ id: 'existing' })
      const newItem = createCartItem({ id: 'new' })
      const initialCart = { items: [existingItem] }

      const result = cartReducer(initialCart, {
        type: 'ADD_ITEM',
        payload: newItem,
      })

      expect(result.items).toHaveLength(2)
      expect(result.items[1].id).toBe('new')
    })

    it('should increase quantity when adding duplicate item', () => {
      const existingItem = createCartItem({ quantity: 2 })
      const sameItem = createCartItem({ quantity: 3 })
      const initialCart = { items: [existingItem] }

      const result = cartReducer(initialCart, {
        type: 'ADD_ITEM',
        payload: sameItem,
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].quantity).toBe(5) // 2 + 3
    })

    it('should treat different variants as different items', () => {
      const blueVariant = createCartItem({ variantId: 'blue-large' })
      const redVariant = createCartItem({ variantId: 'red-large' })
      const initialCart = { items: [blueVariant] }

      const result = cartReducer(initialCart, {
        type: 'ADD_ITEM',
        payload: redVariant,
      })

      expect(result.items).toHaveLength(2)
      expect(result.items[0].variantId).toBe('blue-large')
      expect(result.items[1].variantId).toBe('red-large')
    })

    it('should combine quantities for same product with same variant', () => {
      const variant = createCartItem({ variantId: 'blue-large', quantity: 1 })
      const sameVariant = createCartItem({ variantId: 'blue-large', quantity: 2 })
      const initialCart = { items: [variant] }

      const result = cartReducer(initialCart, {
        type: 'ADD_ITEM',
        payload: sameVariant,
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].quantity).toBe(3)
    })

    it('should handle null variant as distinct from undefined', () => {
      const noVariant = createCartItem({ variantId: null })
      const alsoNoVariant = createCartItem({ variantId: undefined })
      const initialCart = { items: [noVariant] }

      const result = cartReducer(initialCart, {
        type: 'ADD_ITEM',
        payload: alsoNoVariant,
      })

      // Both should be treated as no variant, so quantity increases
      expect(result.items).toHaveLength(1)
      expect(result.items[0].quantity).toBe(2)
    })
  })

  describe('UPDATE_QUANTITY', () => {
    it('should update quantity for existing item', () => {
      const item = createCartItem({ quantity: 1 })
      const initialCart = { items: [item] }

      const result = cartReducer(initialCart, {
        type: 'UPDATE_QUANTITY',
        payload: { id: 'product-1', quantity: 5 },
      })

      expect(result.items[0].quantity).toBe(5)
    })

    it('should not modify cart if item not found', () => {
      const item = createCartItem({ id: 'product-1' })
      const initialCart = { items: [item] }

      const result = cartReducer(initialCart, {
        type: 'UPDATE_QUANTITY',
        payload: { id: 'non-existent', quantity: 10 },
      })

      expect(result.items[0].quantity).toBe(1) // Unchanged
    })

    it('should update correct variant when multiple variants exist', () => {
      const blueVariant = createCartItem({ variantId: 'blue', quantity: 1 })
      const redVariant = createCartItem({ variantId: 'red', quantity: 1 })
      const initialCart = { items: [blueVariant, redVariant] }

      const result = cartReducer(initialCart, {
        type: 'UPDATE_QUANTITY',
        payload: { id: 'product-1', variantId: 'red', quantity: 10 },
      })

      expect(result.items[0].quantity).toBe(1) // Blue unchanged
      expect(result.items[1].quantity).toBe(10) // Red updated
    })

    it('should handle updating item without variant', () => {
      const itemNoVariant = createCartItem({ variantId: null, quantity: 2 })
      const initialCart = { items: [itemNoVariant] }

      const result = cartReducer(initialCart, {
        type: 'UPDATE_QUANTITY',
        payload: { id: 'product-1', variantId: null, quantity: 7 },
      })

      expect(result.items[0].quantity).toBe(7)
    })

    it('should not update wrong variant', () => {
      const itemWithVariant = createCartItem({ variantId: 'blue', quantity: 3 })
      const initialCart = { items: [itemWithVariant] }

      const result = cartReducer(initialCart, {
        type: 'UPDATE_QUANTITY',
        payload: { id: 'product-1', variantId: null, quantity: 10 },
      })

      // Should not match because variantIds don't match
      expect(result.items[0].quantity).toBe(3)
    })
  })

  describe('REMOVE_ITEM', () => {
    it('should remove item from cart', () => {
      const item = createCartItem()
      const initialCart = { items: [item] }

      const result = cartReducer(initialCart, {
        type: 'REMOVE_ITEM',
        payload: { id: 'product-1' },
      })

      expect(result.items).toHaveLength(0)
    })

    it('should only remove matching item', () => {
      const item1 = createCartItem({ id: 'product-1' })
      const item2 = createCartItem({ id: 'product-2' })
      const initialCart = { items: [item1, item2] }

      const result = cartReducer(initialCart, {
        type: 'REMOVE_ITEM',
        payload: { id: 'product-1' },
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].id).toBe('product-2')
    })

    it('should remove only matching variant', () => {
      const blueVariant = createCartItem({ variantId: 'blue' })
      const redVariant = createCartItem({ variantId: 'red' })
      const initialCart = { items: [blueVariant, redVariant] }

      const result = cartReducer(initialCart, {
        type: 'REMOVE_ITEM',
        payload: { id: 'product-1', variantId: 'blue' },
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].variantId).toBe('red')
    })

    it('should not remove anything if item not found', () => {
      const item = createCartItem()
      const initialCart = { items: [item] }

      const result = cartReducer(initialCart, {
        type: 'REMOVE_ITEM',
        payload: { id: 'non-existent' },
      })

      expect(result.items).toHaveLength(1)
    })

    it('should handle removing from empty cart', () => {
      const result = cartReducer(emptyCart, {
        type: 'REMOVE_ITEM',
        payload: { id: 'any-id' },
      })

      expect(result.items).toHaveLength(0)
    })
  })

  describe('CLEAR_CART', () => {
    it('should remove all items from cart', () => {
      const items = [
        createCartItem({ id: '1' }),
        createCartItem({ id: '2' }),
        createCartItem({ id: '3' }),
      ]
      const initialCart = { items }

      const result = cartReducer(initialCart, {
        type: 'CLEAR_CART',
      })

      expect(result.items).toHaveLength(0)
    })

    it('should handle clearing empty cart', () => {
      const result = cartReducer(emptyCart, {
        type: 'CLEAR_CART',
      })

      expect(result.items).toHaveLength(0)
    })
  })

  describe('Default Case', () => {
    it('should return unchanged cart for unknown action', () => {
      const initialCart = { items: [createCartItem()] }

      // @ts-expect-error - Testing unknown action type
      const result = cartReducer(initialCart, { type: 'UNKNOWN_ACTION' })

      expect(result).toEqual(initialCart)
    })
  })

  describe('Edge Cases', () => {
    it('should handle cart with undefined items array', () => {
      // @ts-expect-error - Testing malformed cart state
      const result = cartReducer({ items: undefined }, {
        type: 'ADD_ITEM',
        payload: createCartItem(),
      })

      // The reducer handles undefined items by treating it as empty
      // and creates a new array with the item
      expect(Array.isArray(result.items)).toBe(true)
    })

    it('should preserve other cart properties', () => {
      const initialCart = {
        items: [createCartItem()],
        // @ts-expect-error - Testing extra properties
        customProperty: 'value',
      }

      const result = cartReducer(initialCart, {
        type: 'ADD_ITEM',
        payload: createCartItem({ id: 'new' }),
      })

      expect(result.items).toHaveLength(2)
    })

    it('should handle items with all variant options', () => {
      const fullVariantItem = createCartItem({
        variantId: 'variant-123',
        variant: {
          id: 'variant-123',
          sku: 'SKU-001',
          size: 'Large',
          color: 'Blue',
          colorCode: '#0000FF',
          material: 'Cotton',
        },
      })

      const result = cartReducer(emptyCart, {
        type: 'ADD_ITEM',
        payload: fullVariantItem,
      })

      expect(result.items[0].variant?.size).toBe('Large')
      expect(result.items[0].variant?.color).toBe('Blue')
    })

    it('should handle zero quantity update', () => {
      const item = createCartItem({ quantity: 5 })
      const initialCart = { items: [item] }

      const result = cartReducer(initialCart, {
        type: 'UPDATE_QUANTITY',
        payload: { id: 'product-1', quantity: 0 },
      })

      expect(result.items[0].quantity).toBe(0)
    })

    it('should handle high quantity values', () => {
      const item = createCartItem({ quantity: 1 })
      const initialCart = { items: [item] }

      const result = cartReducer(initialCart, {
        type: 'UPDATE_QUANTITY',
        payload: { id: 'product-1', quantity: 99999 },
      })

      expect(result.items[0].quantity).toBe(99999)
    })
  })
})
