import { describe, expect, it } from 'vitest'

import { calculateProratedPartialRefund } from '@/lib/refund'

describe('calculateProratedPartialRefund', () => {
  it('prorates partial refunds against discounted order totals', () => {
    const result = calculateProratedPartialRefund(
      {
        amount: 90, // Paid amount after discounts/tax adjustments
        refundAmount: 0,
        items: [
          { id: 'item-a', price: 60, quantity: 1, refundedQuantity: 0, title: 'A' },
          { id: 'item-b', price: 40, quantity: 1, refundedQuantity: 0, title: 'B' },
        ],
      },
      [{ orderItemId: 'item-a', quantity: 1 }]
    )

    expect(result.selectedSubtotal).toBe(60)
    expect(result.refundableSubtotal).toBe(100)
    expect(result.remainingRefundableAmount).toBe(90)
    expect(result.refundAmount).toBe(54)
    expect(result.refundAmountCents).toBe(5400)
  })

  it('returns all remaining refundable amount when all remaining items are selected', () => {
    const result = calculateProratedPartialRefund(
      {
        amount: 73.27,
        refundAmount: 13.27,
        items: [
          { id: 'item-a', price: 20, quantity: 2, refundedQuantity: 1, title: 'A' },
          { id: 'item-b', price: 30, quantity: 2, refundedQuantity: 0, title: 'B' },
        ],
      },
      [
        { orderItemId: 'item-a', quantity: 1 },
        { orderItemId: 'item-b', quantity: 2 },
      ]
    )

    expect(result.remainingRefundableAmount).toBe(60)
    expect(result.refundAmount).toBe(60)
    expect(result.refundAmountCents).toBe(6000)
  })

  it('normalizes duplicate order item entries by summing their quantities', () => {
    const result = calculateProratedPartialRefund(
      {
        amount: 120,
        refundAmount: 0,
        items: [
          { id: 'item-a', price: 25, quantity: 4, refundedQuantity: 0, title: 'A' },
          { id: 'item-b', price: 10, quantity: 2, refundedQuantity: 0, title: 'B' },
        ],
      },
      [
        { orderItemId: 'item-a', quantity: 1 },
        { orderItemId: 'item-a', quantity: 2 },
      ]
    )

    expect(result.normalizedItems).toEqual([{ orderItemId: 'item-a', quantity: 3 }])
    expect(result.selectedSubtotal).toBe(75)
  })

  it('throws when requested quantity exceeds remaining refundable quantity', () => {
    expect(() =>
      calculateProratedPartialRefund(
        {
          amount: 100,
          refundAmount: 0,
          items: [
            { id: 'item-a', price: 50, quantity: 1, refundedQuantity: 1, title: 'A' },
            { id: 'item-b', price: 50, quantity: 1, refundedQuantity: 0, title: 'B' },
          ],
        },
        [{ orderItemId: 'item-a', quantity: 1 }]
      )
    ).toThrow('already fully refunded')
  })
})
