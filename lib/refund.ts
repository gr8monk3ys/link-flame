/**
 * Refund Processing Utilities
 *
 * Handles all refund side-effects: inventory restoration, loyalty point reversal,
 * gift card balance restoration, and order status updates.
 *
 * Supports both full and partial refunds. Full refunds reverse all side-effects
 * (inventory, loyalty points earned/redeemed, gift card). Partial refunds only
 * restore inventory for the specified items.
 *
 * @module lib/refund
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { calculateTier } from '@/lib/loyalty'
import { refundGiftCard } from '@/lib/gift-cards'

// Use Prisma's transaction client type
type TransactionClient = Prisma.TransactionClient

/**
 * Partial refund item request shape.
 */
export interface RefundItemInput {
  orderItemId: string
  quantity: number
}

interface RefundableOrderItem {
  id: string
  price: Prisma.Decimal | number
  quantity: number
  refundedQuantity: number
  title?: string | null
}

interface RefundableOrderSummary {
  amount: Prisma.Decimal | number
  refundAmount?: Prisma.Decimal | number | null
  items: RefundableOrderItem[]
}

export interface PartialRefundCalculation {
  normalizedItems: RefundItemInput[]
  selectedSubtotal: number
  refundableSubtotal: number
  remainingRefundableAmount: number
  refundAmount: number
  refundAmountCents: number
}

function roundToCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

function normalizeRefundItems(items: RefundItemInput[]): RefundItemInput[] {
  const quantityByOrderItemId = new Map<string, number>()

  for (const item of items) {
    const current = quantityByOrderItemId.get(item.orderItemId) ?? 0
    quantityByOrderItemId.set(item.orderItemId, current + item.quantity)
  }

  return Array.from(quantityByOrderItemId.entries()).map(([orderItemId, quantity]) => ({
    orderItemId,
    quantity,
  }))
}

/**
 * Calculates a partial refund amount using proportional allocation against
 * the order's remaining refundable amount.
 *
 * This keeps Stripe refund amounts aligned with discounts and prior refunds.
 */
export function calculateProratedPartialRefund(
  order: RefundableOrderSummary,
  requestedItems: RefundItemInput[]
): PartialRefundCalculation {
  if (requestedItems.length === 0) {
    throw new Error('At least one refund item is required for partial refunds')
  }

  const normalizedItems = normalizeRefundItems(requestedItems)

  const remainingRefundableAmount = roundToCents(
    Number(order.amount) - Number(order.refundAmount || 0)
  )
  if (remainingRefundableAmount <= 0) {
    throw new Error('Order has no remaining refundable amount')
  }

  let selectedSubtotal = 0
  for (const refundItem of normalizedItems) {
    const orderItem = order.items.find((item) => item.id === refundItem.orderItemId)
    if (!orderItem) {
      throw new Error(`Order item not found: ${refundItem.orderItemId}`)
    }

    const availableToRefund = orderItem.quantity - orderItem.refundedQuantity
    if (availableToRefund <= 0) {
      throw new Error(`Item "${orderItem.title || orderItem.id}" is already fully refunded`)
    }

    if (refundItem.quantity > availableToRefund) {
      throw new Error(
        `Cannot refund ${refundItem.quantity} of item "${orderItem.title || orderItem.id}". Only ${availableToRefund} available for refund.`
      )
    }

    selectedSubtotal += Number(orderItem.price) * refundItem.quantity
  }

  const refundableSubtotal = order.items.reduce((sum, item) => {
    const remainingQuantity = item.quantity - item.refundedQuantity
    if (remainingQuantity <= 0) {
      return sum
    }
    return sum + Number(item.price) * remainingQuantity
  }, 0)

  if (selectedSubtotal <= 0 || refundableSubtotal <= 0) {
    throw new Error('Refund amount must be greater than zero')
  }

  const selectedSubtotalRounded = roundToCents(selectedSubtotal)
  const refundableSubtotalRounded = roundToCents(refundableSubtotal)

  let refundAmount = 0
  if (selectedSubtotalRounded >= refundableSubtotalRounded) {
    refundAmount = remainingRefundableAmount
  } else {
    refundAmount = roundToCents(
      remainingRefundableAmount * (selectedSubtotalRounded / refundableSubtotalRounded)
    )
  }

  if (refundAmount <= 0) {
    refundAmount = Math.min(remainingRefundableAmount, 0.01)
  }

  if (refundAmount > remainingRefundableAmount) {
    refundAmount = remainingRefundableAmount
  }

  return {
    normalizedItems,
    selectedSubtotal: selectedSubtotalRounded,
    refundableSubtotal: refundableSubtotalRounded,
    remainingRefundableAmount,
    refundAmount,
    refundAmountCents: Math.round(refundAmount * 100),
  }
}

/**
 * Request shape for processRefund
 */
export interface RefundRequest {
  orderId: string
  items?: RefundItemInput[] // omit for full refund
  reason?: string
  // Optional explicit amount (used to keep DB state aligned with Stripe partial refund amount)
  refundAmount?: number
}

/**
 * Result returned from processRefund
 */
export interface RefundResult {
  refundedAmount: number
  inventoryRestored: boolean
  loyaltyPointsReversed: boolean
  giftCardAmountRestored: number
}

/**
 * Restore inventory for refunded items.
 *
 * For each item, if it has a variantId, increments productVariant.inventory;
 * otherwise increments product.inventory.
 */
export async function restoreInventory(
  tx: TransactionClient,
  items: Array<{ productId: string; variantId: string | null; quantity: number }>
): Promise<void> {
  for (const item of items) {
    if (item.variantId) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { inventory: { increment: item.quantity } },
      })
      logger.info('Restored variant inventory', {
        variantId: item.variantId,
        quantity: item.quantity,
      })
    } else {
      await tx.product.update({
        where: { id: item.productId },
        data: { inventory: { increment: item.quantity } },
      })
      logger.info('Restored product inventory', {
        productId: item.productId,
        quantity: item.quantity,
      })
    }
  }
}

/**
 * Reverse loyalty points that were awarded for an order.
 *
 * Finds all LoyaltyPoints records matching the userId and orderId, sums them,
 * then creates a negative points record and decrements the user's lifetime total.
 * Recalculates tier after adjustment.
 */
export async function reverseLoyaltyPointsAwarded(
  tx: TransactionClient,
  userId: string,
  orderId: string
): Promise<boolean> {
  const pointsRecords = await tx.loyaltyPoints.findMany({
    where: { userId, orderId },
  })

  if (pointsRecords.length === 0) {
    logger.info('No loyalty points to reverse for order', { userId, orderId })
    return false
  }

  const totalPoints = pointsRecords.reduce((sum, record) => sum + record.points, 0)

  if (totalPoints <= 0) {
    logger.info('No positive loyalty points to reverse', { userId, orderId, totalPoints })
    return false
  }

  // Create a negative points record to reverse the award
  await tx.loyaltyPoints.create({
    data: {
      userId,
      points: -totalPoints,
      source: 'REFUND',
      orderId,
      description: 'Points reversed due to refund',
    },
  })

  // Decrement user's lifetime points and recalculate tier
  const user = await tx.user.findUniqueOrThrow({
    where: { id: userId },
    select: { totalLifetimePoints: true },
  })

  const newLifetimePoints = Math.max(0, user.totalLifetimePoints - totalPoints)
  const newTier = calculateTier(newLifetimePoints)

  await tx.user.update({
    where: { id: userId },
    data: {
      totalLifetimePoints: newLifetimePoints,
      loyaltyTier: newTier,
    },
  })

  logger.info('Reversed loyalty points awarded', {
    userId,
    orderId,
    pointsReversed: totalPoints,
    newLifetimePoints,
    newTier,
  })

  return true
}

/**
 * Reverse loyalty points that were redeemed for an order.
 *
 * Finds LoyaltyRedemption records matching userId, orderId, and status "applied",
 * then updates their status to "refunded". This restores point availability.
 */
export async function reverseLoyaltyPointsRedeemed(
  tx: TransactionClient,
  userId: string,
  orderId: string
): Promise<boolean> {
  const redemptions = await tx.loyaltyRedemption.findMany({
    where: {
      userId,
      orderId,
      status: 'applied',
    },
  })

  if (redemptions.length === 0) {
    logger.info('No loyalty redemptions to reverse for order', { userId, orderId })
    return false
  }

  for (const redemption of redemptions) {
    await tx.loyaltyRedemption.update({
      where: { id: redemption.id },
      data: { status: 'refunded' },
    })
  }

  const totalPointsRestored = redemptions.reduce((sum, r) => sum + r.pointsUsed, 0)

  logger.info('Reversed loyalty points redeemed', {
    userId,
    orderId,
    redemptionsReversed: redemptions.length,
    totalPointsRestored,
  })

  return true
}

/**
 * Process a refund with all side-effects.
 *
 * Orchestrates inventory restoration, loyalty point reversal, order status updates,
 * and gift card balance restoration.
 *
 * - Full refund (no items specified): restores all inventory, reverses loyalty
 *   points (earned and redeemed), restores gift card balance.
 * - Partial refund (items specified): restores inventory only for specified items,
 *   updates each orderItem.refundedQuantity. Does NOT reverse loyalty points or
 *   gift card for partial refunds.
 */
export async function processRefund(request: RefundRequest): Promise<RefundResult> {
  const { orderId, items: refundItems, reason, refundAmount: explicitRefundAmount } = request

  logger.info('Processing refund', { orderId, isPartial: !!refundItems, reason })

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order) {
    throw new Error(`Order not found: ${orderId}`)
  }

  if (order.status !== 'paid' && order.status !== 'partially_refunded') {
    throw new Error(
      `Cannot refund order with status "${order.status}". Only paid or partially_refunded orders can be refunded.`
    )
  }

  const isPartial = !!refundItems && refundItems.length > 0
  const orderAmount = Number(order.amount)
  const previousRefundAmount = order.refundAmount ? Number(order.refundAmount) : 0

  let refundedAmount = 0
  let inventoryRestored = false
  let loyaltyPointsReversed = false

  await prisma.$transaction(async (tx) => {
    if (isPartial) {
      const partialCalculation = calculateProratedPartialRefund(order, refundItems)
      const normalizedRefundItems = partialCalculation.normalizedItems

      // Partial refund: only restore specified items
      const inventoryItems: Array<{ productId: string; variantId: string | null; quantity: number }> = []

      for (const refundItem of normalizedRefundItems) {
        const orderItem = order.items.find((oi) => oi.id === refundItem.orderItemId)
        if (!orderItem) {
          throw new Error(`Order item not found: ${refundItem.orderItemId}`)
        }

        const availableToRefund = orderItem.quantity - orderItem.refundedQuantity
        if (refundItem.quantity > availableToRefund) {
          throw new Error(
            `Cannot refund ${refundItem.quantity} of item ${refundItem.orderItemId}. Only ${availableToRefund} available.`
          )
        }

        inventoryItems.push({
          productId: orderItem.productId,
          variantId: orderItem.variantId,
          quantity: refundItem.quantity,
        })

        // Update refundedQuantity on the order item
        await tx.orderItem.update({
          where: { id: orderItem.id },
          data: { refundedQuantity: { increment: refundItem.quantity } },
        })
      }

      if (explicitRefundAmount !== undefined) {
        const remainingRefundableAmount = roundToCents(orderAmount - previousRefundAmount)
        refundedAmount = roundToCents(explicitRefundAmount)

        if (refundedAmount <= 0) {
          throw new Error('Refund amount must be greater than zero')
        }

        if (refundedAmount > remainingRefundableAmount) {
          throw new Error('Refund amount exceeds the order remaining refundable amount')
        }
      } else {
        refundedAmount = partialCalculation.refundAmount
      }

      await restoreInventory(tx, inventoryItems)
      inventoryRestored = true

      // Update order status to partially_refunded
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'partially_refunded',
          refundReason: reason || order.refundReason,
          refundedAt: new Date(),
          refundAmount: previousRefundAmount + refundedAmount,
        },
      })
    } else {
      // Full refund: restore all items
      refundedAmount = Math.max(0, orderAmount - previousRefundAmount)

      if (refundedAmount <= 0) {
        throw new Error('Order has no remaining refundable amount')
      }

      const inventoryItems = order.items.map((oi) => ({
        productId: oi.productId,
        variantId: oi.variantId,
        quantity: oi.quantity - oi.refundedQuantity, // Only restore un-refunded quantity
      })).filter((item) => item.quantity > 0)

      await restoreInventory(tx, inventoryItems)
      inventoryRestored = true

      // Mark all order items as fully refunded for auditability.
      for (const orderItem of order.items) {
        if (orderItem.refundedQuantity < orderItem.quantity) {
          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: { refundedQuantity: orderItem.quantity },
          })
        }
      }

      // Reverse loyalty points (earned and redeemed) for full refunds only
      if (order.userId) {
        const awardReversed = await reverseLoyaltyPointsAwarded(tx, order.userId, orderId)
        const redemptionReversed = await reverseLoyaltyPointsRedeemed(tx, order.userId, orderId)
        loyaltyPointsReversed = awardReversed || redemptionReversed
      }

      // Update order status to refunded
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'refunded',
          refundReason: reason || order.refundReason,
          refundedAt: new Date(),
          refundAmount: orderAmount,
        },
      })
    }
  })

  // After transaction: restore gift card balance if applicable (full refund only)
  let giftCardAmountRestored = 0
  if (!isPartial && order.giftCardId && order.giftCardAmountUsed) {
    const gcAmount = Number(order.giftCardAmountUsed)
    if (gcAmount > 0) {
      const result = await refundGiftCard(order.giftCardId, gcAmount, orderId)
      if (result.success) {
        giftCardAmountRestored = gcAmount
        logger.info('Gift card balance restored', {
          orderId,
          giftCardId: order.giftCardId,
          amountRestored: gcAmount,
        })
      } else {
        logger.error('Failed to restore gift card balance', undefined, {
          orderId,
          giftCardId: order.giftCardId,
          error: result.error,
        })
      }
    }
  }

  logger.info('Refund processed successfully', {
    orderId,
    isPartial,
    refundedAmount,
    inventoryRestored,
    loyaltyPointsReversed,
    giftCardAmountRestored,
  })

  return {
    refundedAmount,
    inventoryRestored,
    loyaltyPointsReversed,
    giftCardAmountRestored,
  }
}
