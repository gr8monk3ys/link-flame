/**
 * Gift Card Utilities
 *
 * Provides secure gift card code generation, validation, and management functions.
 *
 * @module lib/gift-cards
 */

import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// Gift card configuration
export const GIFT_CARD_CONFIG = {
  // Code format: 16 alphanumeric characters (uppercase letters and digits)
  CODE_LENGTH: 16,
  CODE_CHARSET: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // Excludes I, O, 0, 1 to avoid confusion

  // Preset amounts
  PRESET_AMOUNTS: [25, 50, 100, 150, 200] as const,

  // Custom amount limits
  MIN_AMOUNT: 10,
  MAX_AMOUNT: 500,

  // Expiration (in days, null for no expiration)
  DEFAULT_EXPIRY_DAYS: 365,

  // Status values
  STATUS: {
    ACTIVE: 'ACTIVE',
    REDEEMED: 'REDEEMED',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED',
  } as const,

  // Transaction types
  TRANSACTION_TYPES: {
    PURCHASE: 'PURCHASE',
    REDEMPTION: 'REDEMPTION',
    REFUND: 'REFUND',
    HOLD: 'HOLD',
  } as const,
}

export type GiftCardStatus = (typeof GIFT_CARD_CONFIG.STATUS)[keyof typeof GIFT_CARD_CONFIG.STATUS]
export type GiftCardTransactionType =
  (typeof GIFT_CARD_CONFIG.TRANSACTION_TYPES)[keyof typeof GIFT_CARD_CONFIG.TRANSACTION_TYPES]

/**
 * Generate a cryptographically secure gift card code.
 *
 * The code is a 16-character alphanumeric string formatted as XXXX-XXXX-XXXX-XXXX
 * for readability. Uses a charset that excludes ambiguous characters (I, O, 0, 1).
 *
 * @returns The generated gift card code (without dashes for storage)
 */
export function generateGiftCardCode(): string {
  const bytes = randomBytes(GIFT_CARD_CONFIG.CODE_LENGTH)
  let code = ''

  for (let i = 0; i < GIFT_CARD_CONFIG.CODE_LENGTH; i++) {
    const index = bytes[i] % GIFT_CARD_CONFIG.CODE_CHARSET.length
    code += GIFT_CARD_CONFIG.CODE_CHARSET[index]
  }

  return code
}

/**
 * Format a gift card code for display (adds dashes).
 *
 * @param code - The raw gift card code
 * @returns Formatted code (e.g., "ABCD-EFGH-JKLM-NPQR")
 */
export function formatGiftCardCode(code: string): string {
  const cleaned = code.replace(/-/g, '').toUpperCase()
  return cleaned.match(/.{1,4}/g)?.join('-') || cleaned
}

/**
 * Normalize a gift card code (removes dashes and converts to uppercase).
 *
 * @param code - The input gift card code
 * @returns Normalized code for database lookup
 */
export function normalizeGiftCardCode(code: string): string {
  return code.replace(/-/g, '').toUpperCase()
}

/**
 * Validate gift card code format.
 *
 * @param code - The gift card code to validate
 * @returns True if the code format is valid
 */
export function isValidCodeFormat(code: string): boolean {
  const normalized = normalizeGiftCardCode(code)

  if (normalized.length !== GIFT_CARD_CONFIG.CODE_LENGTH) {
    return false
  }

  // Check that all characters are in the allowed charset
  for (const char of normalized) {
    if (!GIFT_CARD_CONFIG.CODE_CHARSET.includes(char)) {
      return false
    }
  }

  return true
}

/**
 * Calculate the expiration date for a gift card.
 *
 * @param purchaseDate - The date the gift card was purchased
 * @param expiryDays - Number of days until expiration (default from config)
 * @returns The expiration date, or null for no expiration
 */
export function calculateExpirationDate(
  purchaseDate: Date = new Date(),
  expiryDays: number | null = GIFT_CARD_CONFIG.DEFAULT_EXPIRY_DAYS
): Date | null {
  if (expiryDays === null) {
    return null
  }

  const expirationDate = new Date(purchaseDate)
  expirationDate.setDate(expirationDate.getDate() + expiryDays)
  return expirationDate
}

/**
 * Check if a gift card is expired.
 *
 * @param expiresAt - The expiration date
 * @returns True if the gift card has expired
 */
export function isExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) {
    return false
  }
  return new Date() > expiresAt
}

/**
 * Check if a gift card is valid for use (active, has balance, not expired).
 *
 * @param giftCard - The gift card to validate
 * @returns Object with validation result and reason if invalid
 */
export function validateGiftCardForUse(giftCard: {
  status: string
  currentBalance: number
  expiresAt: Date | null
}): { valid: boolean; reason?: string } {
  if (giftCard.status !== GIFT_CARD_CONFIG.STATUS.ACTIVE) {
    return {
      valid: false,
      reason: `Gift card is ${giftCard.status.toLowerCase()}`,
    }
  }

  if (isExpired(giftCard.expiresAt)) {
    return {
      valid: false,
      reason: 'Gift card has expired',
    }
  }

  if (giftCard.currentBalance <= 0) {
    return {
      valid: false,
      reason: 'Gift card has no remaining balance',
    }
  }

  return { valid: true }
}

/**
 * Generate a unique gift card code (checks database for collisions).
 *
 * @param maxAttempts - Maximum number of attempts to generate a unique code
 * @returns A unique gift card code
 * @throws Error if unable to generate a unique code
 */
export async function generateUniqueGiftCardCode(maxAttempts: number = 10): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateGiftCardCode()

    // Check if code already exists
    const existing = await prisma.giftCard.findUnique({
      where: { code },
      select: { id: true },
    })

    if (!existing) {
      return code
    }

    logger.warn('Gift card code collision detected, regenerating', { attempt })
  }

  throw new Error('Unable to generate unique gift card code after maximum attempts')
}

/**
 * Get gift card by code with validation.
 *
 * @param code - The gift card code
 * @returns The gift card if found and valid, null otherwise
 */
export async function getGiftCardByCode(code: string): Promise<{
  id: string
  code: string
  initialBalance: number
  currentBalance: number
  status: string
  expiresAt: Date | null
  recipientName: string | null
  transactions: Array<{
    id: string
    amount: number
    type: string
    createdAt: Date
  }>
} | null> {
  const normalizedCode = normalizeGiftCardCode(code)

  if (!isValidCodeFormat(normalizedCode)) {
    return null
  }

  const giftCard = await prisma.giftCard.findUnique({
    where: { code: normalizedCode },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!giftCard) return null

  return {
    ...giftCard,
    initialBalance: Number(giftCard.initialBalance),
    currentBalance: Number(giftCard.currentBalance),
    transactions: giftCard.transactions.map(t => ({ ...t, amount: Number(t.amount) })),
  }
}

/**
 * Create a new gift card.
 *
 * @param params - Gift card creation parameters
 * @returns The created gift card
 */
export async function createGiftCard(params: {
  amount: number
  purchaserId?: string | null
  recipientEmail?: string | null
  recipientName?: string | null
  message?: string | null
  expiryDays?: number | null
}): Promise<{
  id: string
  code: string
  initialBalance: number
  currentBalance: number
  status: string
  expiresAt: Date | null
}> {
  const code = await generateUniqueGiftCardCode()
  const expiresAt = calculateExpirationDate(new Date(), params.expiryDays ?? GIFT_CARD_CONFIG.DEFAULT_EXPIRY_DAYS)

  const giftCard = await prisma.giftCard.create({
    data: {
      code,
      initialBalance: params.amount,
      currentBalance: params.amount,
      purchaserId: params.purchaserId || null,
      recipientEmail: params.recipientEmail || null,
      recipientName: params.recipientName || null,
      message: params.message || null,
      status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
      expiresAt,
      transactions: {
        create: {
          amount: params.amount,
          type: GIFT_CARD_CONFIG.TRANSACTION_TYPES.PURCHASE,
          description: 'Gift card purchased',
        },
      },
    },
    select: {
      id: true,
      code: true,
      initialBalance: true,
      currentBalance: true,
      status: true,
      expiresAt: true,
    },
  })

  logger.info('Gift card created', { giftCardId: giftCard.id, amount: params.amount })

  return {
    ...giftCard,
    initialBalance: Number(giftCard.initialBalance),
    currentBalance: Number(giftCard.currentBalance),
  }
}

/**
 * Redeem a gift card (apply to an order).
 *
 * @param code - The gift card code
 * @param amount - The amount to redeem
 * @param orderId - The order ID (optional, for tracking)
 * @returns The updated gift card or error
 */
export async function redeemGiftCard(
  code: string,
  amount: number,
  orderId?: string
): Promise<
  | { success: true; remainingBalance: number; amountApplied: number }
  | { success: false; error: string }
> {
  const normalizedCode = normalizeGiftCardCode(code)

  return await prisma.$transaction(async (tx) => {
    const giftCard = await tx.giftCard.findUnique({
      where: { code: normalizedCode },
    })

    if (!giftCard) {
      return { success: false, error: 'Gift card not found' }
    }

    // Validate the gift card
    const validation = validateGiftCardForUse({ ...giftCard, currentBalance: Number(giftCard.currentBalance) })
    if (!validation.valid) {
      return { success: false, error: validation.reason || 'Gift card is not valid' }
    }

    // Calculate the amount to apply (cannot exceed balance)
    const amountToApply = Math.min(amount, Number(giftCard.currentBalance))
    const newBalance = Number(giftCard.currentBalance) - amountToApply

    // Determine new status
    const newStatus =
      newBalance <= 0 ? GIFT_CARD_CONFIG.STATUS.REDEEMED : GIFT_CARD_CONFIG.STATUS.ACTIVE

    // Update the gift card
    await tx.giftCard.update({
      where: { id: giftCard.id },
      data: {
        currentBalance: newBalance,
        status: newStatus,
      },
    })

    // Create transaction record
    await tx.giftCardTransaction.create({
      data: {
        giftCardId: giftCard.id,
        orderId: orderId || null,
        amount: -amountToApply, // Negative for redemption
        type: GIFT_CARD_CONFIG.TRANSACTION_TYPES.REDEMPTION,
        description: orderId ? `Redeemed for order ${orderId}` : 'Gift card redeemed',
      },
    })

    logger.info('Gift card redeemed', {
      giftCardId: giftCard.id,
      amountApplied: amountToApply,
      remainingBalance: newBalance,
      orderId,
    })

    return {
      success: true,
      remainingBalance: newBalance,
      amountApplied: amountToApply,
    }
  })
}

/**
 * Hold gift card balance during checkout session creation.
 *
 * Deducts balance immediately and writes a HOLD transaction. This hold is later
 * finalized to REDEMPTION when payment succeeds, or reversed if checkout fails/expires.
 */
export async function holdGiftCardBalance(
  code: string,
  amount: number
): Promise<{ giftCardId: string; amountApplied: number; transactionId: string }> {
  if (amount <= 0) {
    throw new Error('Gift card hold amount must be greater than zero')
  }

  const normalizedCode = normalizeGiftCardCode(code)

  return await prisma.$transaction(async (tx) => {
    const giftCard = await tx.giftCard.findUnique({
      where: { code: normalizedCode },
    })

    if (!giftCard) {
      throw new Error('Gift card not found')
    }

    const validation = validateGiftCardForUse({
      status: giftCard.status,
      currentBalance: Number(giftCard.currentBalance),
      expiresAt: giftCard.expiresAt,
    })
    if (!validation.valid) {
      throw new Error(validation.reason || 'Gift card is not valid')
    }

    const amountToApply = Math.min(amount, Number(giftCard.currentBalance))
    if (amountToApply <= 0) {
      throw new Error('Gift card has no remaining balance')
    }

    const newBalance = Number(giftCard.currentBalance) - amountToApply
    const newStatus =
      newBalance <= 0 ? GIFT_CARD_CONFIG.STATUS.REDEEMED : GIFT_CARD_CONFIG.STATUS.ACTIVE

    await tx.giftCard.update({
      where: { id: giftCard.id },
      data: {
        currentBalance: newBalance,
        status: newStatus,
      },
    })

    const holdTransaction = await tx.giftCardTransaction.create({
      data: {
        giftCardId: giftCard.id,
        amount: -amountToApply,
        type: GIFT_CARD_CONFIG.TRANSACTION_TYPES.HOLD,
        description: 'Gift card balance held for checkout',
      },
      select: {
        id: true,
      },
    })

    logger.info('Gift card balance held for checkout', {
      giftCardId: giftCard.id,
      amountHeld: amountToApply,
      remainingBalance: newBalance,
      transactionId: holdTransaction.id,
    })

    return {
      giftCardId: giftCard.id,
      amountApplied: amountToApply,
      transactionId: holdTransaction.id,
    }
  })
}

/**
 * Finalize a gift card hold after successful payment.
 *
 * Idempotent: if the transaction is already finalized/deleted, this is a no-op.
 */
export async function finalizeGiftCardHold(
  transactionId: string,
  orderId?: string
): Promise<void> {
  const existingTransaction = await prisma.giftCardTransaction.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      type: true,
      orderId: true,
    },
  })

  if (!existingTransaction) {
    logger.info('Gift card hold transaction already finalized or missing', { transactionId })
    return
  }

  if (existingTransaction.type === GIFT_CARD_CONFIG.TRANSACTION_TYPES.REDEMPTION) {
    logger.info('Gift card hold already finalized', { transactionId })
    return
  }

  if (existingTransaction.type !== GIFT_CARD_CONFIG.TRANSACTION_TYPES.HOLD) {
    throw new Error(`Cannot finalize non-hold transaction: ${existingTransaction.type}`)
  }

  await prisma.giftCardTransaction.update({
    where: { id: transactionId },
    data: {
      type: GIFT_CARD_CONFIG.TRANSACTION_TYPES.REDEMPTION,
      orderId: orderId || existingTransaction.orderId,
      description: orderId
        ? `Gift card redeemed for order ${orderId}`
        : 'Gift card redeemed',
    },
  })

  logger.info('Gift card hold finalized', { transactionId, orderId })
}

/**
 * Reverse a pending gift card hold (e.g., failed/expired checkout).
 *
 * Idempotent: if hold is missing or already finalized, this is a no-op.
 */
export async function reverseGiftCardHold(
  transactionId: string,
  giftCardId: string,
  amount: number
): Promise<void> {
  if (amount <= 0) {
    return
  }

  await prisma.$transaction(async (tx) => {
    const holdTransaction = await tx.giftCardTransaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        giftCardId: true,
        type: true,
      },
    })

    if (!holdTransaction) {
      logger.info('Gift card hold transaction missing; assuming already reversed', { transactionId })
      return
    }

    if (holdTransaction.type !== GIFT_CARD_CONFIG.TRANSACTION_TYPES.HOLD) {
      logger.info('Gift card hold already finalized; skip reverse', {
        transactionId,
        type: holdTransaction.type,
      })
      return
    }

    if (holdTransaction.giftCardId !== giftCardId) {
      throw new Error('Gift card hold does not match provided gift card')
    }

    const giftCard = await tx.giftCard.findUnique({
      where: { id: giftCardId },
      select: {
        id: true,
        currentBalance: true,
        initialBalance: true,
      },
    })

    if (!giftCard) {
      throw new Error('Gift card not found while reversing hold')
    }

    const newBalance = Math.min(
      Number(giftCard.currentBalance) + amount,
      Number(giftCard.initialBalance)
    )

    await tx.giftCard.update({
      where: { id: giftCardId },
      data: {
        currentBalance: newBalance,
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
      },
    })

    await tx.giftCardTransaction.delete({
      where: { id: transactionId },
    })
  })

  logger.info('Gift card hold reversed', {
    transactionId,
    giftCardId,
    amount,
  })
}

/**
 * Refund a gift card redemption.
 *
 * @param giftCardId - The gift card ID
 * @param amount - The amount to refund
 * @param orderId - The original order ID
 * @returns The updated gift card or error
 */
export async function refundGiftCard(
  giftCardId: string,
  amount: number,
  orderId?: string
): Promise<
  | { success: true; newBalance: number }
  | { success: false; error: string }
> {
  return await prisma.$transaction(async (tx) => {
    const giftCard = await tx.giftCard.findUnique({
      where: { id: giftCardId },
    })

    if (!giftCard) {
      return { success: false, error: 'Gift card not found' }
    }

    // Calculate new balance (cannot exceed initial balance)
    const newBalance = Math.min(Number(giftCard.currentBalance) + amount, Number(giftCard.initialBalance))

    // Update the gift card
    await tx.giftCard.update({
      where: { id: giftCard.id },
      data: {
        currentBalance: newBalance,
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
      },
    })

    // Create transaction record
    await tx.giftCardTransaction.create({
      data: {
        giftCardId: giftCard.id,
        orderId: orderId || null,
        amount: amount, // Positive for refund
        type: GIFT_CARD_CONFIG.TRANSACTION_TYPES.REFUND,
        description: orderId ? `Refund for order ${orderId}` : 'Gift card refund',
      },
    })

    logger.info('Gift card refunded', {
      giftCardId: giftCard.id,
      amountRefunded: amount,
      newBalance,
      orderId,
    })

    return {
      success: true,
      newBalance,
    }
  })
}

/**
 * Get all gift cards purchased by a user.
 *
 * @param userId - The user ID
 * @returns Array of gift cards
 */
export async function getUserPurchasedGiftCards(userId: string) {
  return await prisma.giftCard.findMany({
    where: { purchaserId: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      code: true,
      initialBalance: true,
      currentBalance: true,
      status: true,
      recipientEmail: true,
      recipientName: true,
      message: true,
      expiresAt: true,
      purchasedAt: true,
      createdAt: true,
    },
  })
}

/**
 * Update expired gift cards to EXPIRED status.
 * This should be run periodically (e.g., daily cron job).
 *
 * @returns Number of gift cards updated
 */
export async function updateExpiredGiftCards(): Promise<number> {
  const result = await prisma.giftCard.updateMany({
    where: {
      status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
      expiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: GIFT_CARD_CONFIG.STATUS.EXPIRED,
    },
  })

  if (result.count > 0) {
    logger.info('Updated expired gift cards', { count: result.count })
  }

  return result.count
}
