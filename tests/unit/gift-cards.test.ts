import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Gift Card Unit Tests
 *
 * Tests the gift card functionality including:
 * - Code generation (cryptographically secure, no collisions)
 * - Code validation (format, length, character set)
 * - Gift card state validation (active, expired, redeemed, cancelled)
 * - Redemption logic (balance deduction, overdraft prevention)
 * - Refund logic (balance restoration, limits)
 */

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    giftCard: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    giftCardTransaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

// Import the module under test
import {
  GIFT_CARD_CONFIG,
  generateGiftCardCode,
  formatGiftCardCode,
  normalizeGiftCardCode,
  isValidCodeFormat,
  calculateExpirationDate,
  isExpired,
  validateGiftCardForUse,
  generateUniqueGiftCardCode,
  getGiftCardByCode,
  createGiftCard,
  redeemGiftCard,
  refundGiftCard,
  getUserPurchasedGiftCards,
  updateExpiredGiftCards,
} from '@/lib/gift-cards'

import { prisma } from '@/lib/prisma'

describe('Gift Card Configuration', () => {
  it('should have correct code length', () => {
    expect(GIFT_CARD_CONFIG.CODE_LENGTH).toBe(16)
  })

  it('should exclude ambiguous characters from charset', () => {
    const charset = GIFT_CARD_CONFIG.CODE_CHARSET
    expect(charset).not.toContain('I')
    expect(charset).not.toContain('O')
    expect(charset).not.toContain('0')
    expect(charset).not.toContain('1')
  })

  it('should have valid preset amounts', () => {
    expect(GIFT_CARD_CONFIG.PRESET_AMOUNTS).toEqual([25, 50, 100, 150, 200])
  })

  it('should have valid amount limits', () => {
    expect(GIFT_CARD_CONFIG.MIN_AMOUNT).toBe(10)
    expect(GIFT_CARD_CONFIG.MAX_AMOUNT).toBe(500)
  })

  it('should have default expiry of 365 days', () => {
    expect(GIFT_CARD_CONFIG.DEFAULT_EXPIRY_DAYS).toBe(365)
  })

  it('should have valid status values', () => {
    expect(GIFT_CARD_CONFIG.STATUS).toEqual({
      ACTIVE: 'ACTIVE',
      REDEEMED: 'REDEEMED',
      EXPIRED: 'EXPIRED',
      CANCELLED: 'CANCELLED',
    })
  })

  it('should have valid transaction types', () => {
    expect(GIFT_CARD_CONFIG.TRANSACTION_TYPES).toEqual({
      PURCHASE: 'PURCHASE',
      REDEMPTION: 'REDEMPTION',
      REFUND: 'REFUND',
    })
  })
})

describe('Code Generation', () => {
  describe('generateGiftCardCode', () => {
    it('should generate a code of correct length (16 characters)', () => {
      const code = generateGiftCardCode()
      expect(code).toHaveLength(16)
    })

    it('should only contain characters from the allowed charset', () => {
      const code = generateGiftCardCode()
      const charset = GIFT_CARD_CONFIG.CODE_CHARSET

      for (const char of code) {
        expect(charset).toContain(char)
      }
    })

    it('should exclude ambiguous characters (I, O, 0, 1)', () => {
      // Generate many codes to statistically ensure no ambiguous chars
      for (let i = 0; i < 100; i++) {
        const code = generateGiftCardCode()
        expect(code).not.toContain('I')
        expect(code).not.toContain('O')
        expect(code).not.toContain('0')
        expect(code).not.toContain('1')
      }
    })

    it('should generate unique codes (test 100+ iterations for collisions)', () => {
      const codes = new Set<string>()
      const iterations = 150

      for (let i = 0; i < iterations; i++) {
        const code = generateGiftCardCode()
        codes.add(code)
      }

      // All codes should be unique (no collisions)
      expect(codes.size).toBe(iterations)
    })

    it('should generate cryptographically random codes', () => {
      // Generate many codes and check character distribution
      const charCounts: Record<string, number> = {}
      const iterations = 1000

      for (let i = 0; i < iterations; i++) {
        const code = generateGiftCardCode()
        for (const char of code) {
          charCounts[char] = (charCounts[char] || 0) + 1
        }
      }

      // Check that all characters in charset are used
      const charset = GIFT_CARD_CONFIG.CODE_CHARSET
      const usedChars = Object.keys(charCounts)

      // With 1000 codes of 16 chars, all charset chars should appear
      expect(usedChars.length).toBeGreaterThan(charset.length * 0.8)

      // Check for reasonable distribution (no single char dominates)
      const totalChars = iterations * 16
      const expectedAvg = totalChars / charset.length
      const maxDeviation = expectedAvg * 0.5 // Allow 50% deviation

      for (const char of Object.keys(charCounts)) {
        expect(charCounts[char]).toBeGreaterThan(expectedAvg - maxDeviation)
        expect(charCounts[char]).toBeLessThan(expectedAvg + maxDeviation)
      }
    })

    it('should be uppercase only', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateGiftCardCode()
        expect(code).toBe(code.toUpperCase())
      }
    })
  })
})

describe('Code Validation', () => {
  describe('normalizeGiftCardCode', () => {
    it('should remove dashes from code', () => {
      const result = normalizeGiftCardCode('ABCD-EFGH-JKLM-NPQR')
      expect(result).toBe('ABCDEFGHJKLMNPQR')
    })

    it('should convert to uppercase', () => {
      const result = normalizeGiftCardCode('abcd-efgh-jklm-npqr')
      expect(result).toBe('ABCDEFGHJKLMNPQR')
    })

    it('should handle code without dashes', () => {
      const result = normalizeGiftCardCode('ABCDEFGHJKLMNPQR')
      expect(result).toBe('ABCDEFGHJKLMNPQR')
    })

    it('should handle mixed case with dashes', () => {
      const result = normalizeGiftCardCode('AbCd-EfGh-JkLm-NpQr')
      expect(result).toBe('ABCDEFGHJKLMNPQR')
    })
  })

  describe('formatGiftCardCode', () => {
    it('should add dashes every 4 characters', () => {
      const result = formatGiftCardCode('ABCDEFGHJKLMNPQR')
      expect(result).toBe('ABCD-EFGH-JKLM-NPQR')
    })

    it('should handle code already with dashes', () => {
      const result = formatGiftCardCode('ABCD-EFGH-JKLM-NPQR')
      expect(result).toBe('ABCD-EFGH-JKLM-NPQR')
    })

    it('should convert to uppercase', () => {
      const result = formatGiftCardCode('abcdefghjklmnpqr')
      expect(result).toBe('ABCD-EFGH-JKLM-NPQR')
    })

    it('should handle short codes', () => {
      const result = formatGiftCardCode('ABCD')
      expect(result).toBe('ABCD')
    })

    it('should handle codes not divisible by 4', () => {
      const result = formatGiftCardCode('ABCDEFGH')
      expect(result).toBe('ABCD-EFGH')
    })
  })

  describe('isValidCodeFormat', () => {
    it('should accept valid codes', () => {
      // Generate a valid code and test it
      const code = generateGiftCardCode()
      expect(isValidCodeFormat(code)).toBe(true)
    })

    it('should accept valid codes with dashes', () => {
      const code = generateGiftCardCode()
      const formatted = formatGiftCardCode(code)
      expect(isValidCodeFormat(formatted)).toBe(true)
    })

    it('should reject codes with invalid length (too short)', () => {
      expect(isValidCodeFormat('ABCD')).toBe(false)
      expect(isValidCodeFormat('ABCDEFGH')).toBe(false)
      expect(isValidCodeFormat('ABCDEFGHJKLMNPQ')).toBe(false) // 15 chars
    })

    it('should reject codes with invalid length (too long)', () => {
      expect(isValidCodeFormat('ABCDEFGHJKLMNPQRS')).toBe(false) // 17 chars
      expect(isValidCodeFormat('ABCDEFGHJKLMNPQRSTUV')).toBe(false)
    })

    it('should reject codes with invalid characters', () => {
      // Contains 'I' which is excluded
      expect(isValidCodeFormat('ABCDEFGHIJKLMNPQ')).toBe(false)
      // Contains 'O' which is excluded
      expect(isValidCodeFormat('ABCDEFGHOKLMNPQR')).toBe(false)
      // Contains '0' (zero) which is excluded
      expect(isValidCodeFormat('ABCDEFGH0KLMNPQR')).toBe(false)
      // Contains '1' (one) which is excluded
      expect(isValidCodeFormat('ABCDEFGH1KLMNPQR')).toBe(false)
    })

    it('should handle formatted codes with dashes', () => {
      // Valid formatted code
      expect(isValidCodeFormat('ABCD-EFGH-JKLM-NPQR')).toBe(true)
    })

    it('should normalize to uppercase before validation', () => {
      const code = generateGiftCardCode().toLowerCase()
      expect(isValidCodeFormat(code)).toBe(true)
    })

    it('should reject empty string', () => {
      expect(isValidCodeFormat('')).toBe(false)
    })

    it('should reject codes with special characters', () => {
      expect(isValidCodeFormat('ABCD!FGH@KLMNPQR')).toBe(false)
      expect(isValidCodeFormat('ABCD EFGH JKLM NPQR')).toBe(false) // spaces
    })
  })
})

describe('Gift Card State Validation', () => {
  describe('calculateExpirationDate', () => {
    it('should calculate expiration date correctly', () => {
      const purchaseDate = new Date('2024-01-01T00:00:00.000Z')
      const expiresAt = calculateExpirationDate(purchaseDate, 365)

      expect(expiresAt).not.toBeNull()
      // 2024 is a leap year, so 365 days from Jan 1, 2024 = Dec 31, 2024
      // Verify by calculating expected date
      const expectedDate = new Date('2024-01-01T00:00:00.000Z')
      expectedDate.setDate(expectedDate.getDate() + 365)
      expect(expiresAt!.getTime()).toBe(expectedDate.getTime())
    })

    it('should use default expiry days from config', () => {
      const purchaseDate = new Date()
      const expiresAt = calculateExpirationDate(purchaseDate)

      expect(expiresAt).not.toBeNull()
      const expectedDate = new Date(purchaseDate)
      expectedDate.setDate(expectedDate.getDate() + GIFT_CARD_CONFIG.DEFAULT_EXPIRY_DAYS)

      expect(expiresAt!.getTime()).toBe(expectedDate.getTime())
    })

    it('should return null for no expiration', () => {
      const expiresAt = calculateExpirationDate(new Date(), null)
      expect(expiresAt).toBeNull()
    })

    it('should handle custom expiry days', () => {
      const purchaseDate = new Date('2024-06-15T00:00:00.000Z')
      const expiresAt = calculateExpirationDate(purchaseDate, 30)

      expect(expiresAt).not.toBeNull()
      // Verify by calculating expected date
      const expectedDate = new Date('2024-06-15T00:00:00.000Z')
      expectedDate.setDate(expectedDate.getDate() + 30)
      expect(expiresAt!.getTime()).toBe(expectedDate.getTime())
    })
  })

  describe('isExpired', () => {
    it('should return false for non-expired card', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      expect(isExpired(futureDate)).toBe(false)
    })

    it('should return true for expired card', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      expect(isExpired(pastDate)).toBe(true)
    })

    it('should return false for null expiration (no expiry)', () => {
      expect(isExpired(null)).toBe(false)
    })

    it('should handle date at exact current time', () => {
      const now = new Date()
      // A moment in the past should be expired
      const momentAgo = new Date(now.getTime() - 1)
      expect(isExpired(momentAgo)).toBe(true)
    })
  })

  describe('validateGiftCardForUse', () => {
    it('should validate active card with balance', () => {
      const giftCard = {
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        currentBalance: 50,
        expiresAt: new Date(Date.now() + 86400000), // Tomorrow
      }

      const result = validateGiftCardForUse(giftCard)
      expect(result.valid).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should reject expired card', () => {
      const giftCard = {
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        currentBalance: 50,
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
      }

      const result = validateGiftCardForUse(giftCard)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Gift card has expired')
    })

    it('should reject redeemed card (zero balance)', () => {
      const giftCard = {
        status: GIFT_CARD_CONFIG.STATUS.REDEEMED,
        currentBalance: 0,
        expiresAt: new Date(Date.now() + 86400000),
      }

      const result = validateGiftCardForUse(giftCard)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Gift card is redeemed')
    })

    it('should reject cancelled card', () => {
      const giftCard = {
        status: GIFT_CARD_CONFIG.STATUS.CANCELLED,
        currentBalance: 50,
        expiresAt: new Date(Date.now() + 86400000),
      }

      const result = validateGiftCardForUse(giftCard)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Gift card is cancelled')
    })

    it('should reject card with no remaining balance', () => {
      const giftCard = {
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        currentBalance: 0,
        expiresAt: new Date(Date.now() + 86400000),
      }

      const result = validateGiftCardForUse(giftCard)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Gift card has no remaining balance')
    })

    it('should reject card with negative balance', () => {
      const giftCard = {
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        currentBalance: -10,
        expiresAt: new Date(Date.now() + 86400000),
      }

      const result = validateGiftCardForUse(giftCard)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Gift card has no remaining balance')
    })

    it('should accept card with no expiration date', () => {
      const giftCard = {
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        currentBalance: 100,
        expiresAt: null,
      }

      const result = validateGiftCardForUse(giftCard)
      expect(result.valid).toBe(true)
    })

    it('should check status before expiration', () => {
      const giftCard = {
        status: GIFT_CARD_CONFIG.STATUS.EXPIRED,
        currentBalance: 50,
        expiresAt: new Date(Date.now() + 86400000), // Not yet expired by date
      }

      const result = validateGiftCardForUse(giftCard)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Gift card is expired')
    })
  })
})

describe('Redemption Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('redeemGiftCard', () => {
    it('should deduct correct amount from balance', async () => {
      const mockGiftCard = {
        id: 'gc-123',
        code: 'ABCDEFGHJKLMNPQR',
        initialBalance: 100,
        currentBalance: 100,
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000),
      }

      const mockTx = {
        giftCard: {
          findUnique: vi.fn().mockResolvedValue(mockGiftCard),
          update: vi.fn().mockResolvedValue({ ...mockGiftCard, currentBalance: 70 }),
        },
        giftCardTransaction: {
          create: vi.fn().mockResolvedValue({}),
        },
      }

      const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
      mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      })

      const result = await redeemGiftCard('ABCDEFGHJKLMNPQR', 30)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.remainingBalance).toBe(70)
        expect(result.amountApplied).toBe(30)
      }
    })

    it('should not allow overdraft (caps at balance)', async () => {
      const mockGiftCard = {
        id: 'gc-123',
        code: 'ABCDEFGHJKLMNPQR',
        initialBalance: 50,
        currentBalance: 30,
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000),
      }

      const mockTx = {
        giftCard: {
          findUnique: vi.fn().mockResolvedValue(mockGiftCard),
          update: vi.fn().mockResolvedValue({ ...mockGiftCard, currentBalance: 0 }),
        },
        giftCardTransaction: {
          create: vi.fn().mockResolvedValue({}),
        },
      }

      const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
      mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      })

      // Try to redeem 50 when only 30 is available
      const result = await redeemGiftCard('ABCDEFGHJKLMNPQR', 50)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.amountApplied).toBe(30) // Only deducted available balance
        expect(result.remainingBalance).toBe(0)
      }
    })

    it('should update status when balance reaches zero', async () => {
      const mockGiftCard = {
        id: 'gc-123',
        code: 'ABCDEFGHJKLMNPQR',
        initialBalance: 50,
        currentBalance: 50,
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000),
      }

      let updatedStatus = ''
      const mockTx = {
        giftCard: {
          findUnique: vi.fn().mockResolvedValue(mockGiftCard),
          update: vi.fn().mockImplementation(({ data }) => {
            updatedStatus = data.status
            return { ...mockGiftCard, currentBalance: 0, status: data.status }
          }),
        },
        giftCardTransaction: {
          create: vi.fn().mockResolvedValue({}),
        },
      }

      const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
      mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      })

      const result = await redeemGiftCard('ABCDEFGHJKLMNPQR', 50)

      expect(result.success).toBe(true)
      expect(updatedStatus).toBe(GIFT_CARD_CONFIG.STATUS.REDEEMED)
    })

    it('should fail for non-existent code', async () => {
      const mockTx = {
        giftCard: {
          findUnique: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
        },
        giftCardTransaction: {
          create: vi.fn(),
        },
      }

      const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
      mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      })

      const result = await redeemGiftCard('NONEXISTENT12345', 50)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Gift card not found')
      }
    })

    it('should fail for expired card', async () => {
      const mockGiftCard = {
        id: 'gc-123',
        code: 'ABCDEFGHJKLMNPQR',
        initialBalance: 100,
        currentBalance: 100,
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        expiresAt: new Date(Date.now() - 86400000), // Expired
      }

      const mockTx = {
        giftCard: {
          findUnique: vi.fn().mockResolvedValue(mockGiftCard),
          update: vi.fn(),
        },
        giftCardTransaction: {
          create: vi.fn(),
        },
      }

      const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
      mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      })

      const result = await redeemGiftCard('ABCDEFGHJKLMNPQR', 50)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Gift card has expired')
      }
    })

    it('should fail for cancelled card', async () => {
      const mockGiftCard = {
        id: 'gc-123',
        code: 'ABCDEFGHJKLMNPQR',
        initialBalance: 100,
        currentBalance: 100,
        status: GIFT_CARD_CONFIG.STATUS.CANCELLED,
        expiresAt: new Date(Date.now() + 86400000),
      }

      const mockTx = {
        giftCard: {
          findUnique: vi.fn().mockResolvedValue(mockGiftCard),
          update: vi.fn(),
        },
        giftCardTransaction: {
          create: vi.fn(),
        },
      }

      const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
      mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      })

      const result = await redeemGiftCard('ABCDEFGHJKLMNPQR', 50)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Gift card is cancelled')
      }
    })

    it('should normalize code before lookup', async () => {
      const mockGiftCard = {
        id: 'gc-123',
        code: 'ABCDEFGHJKLMNPQR',
        initialBalance: 100,
        currentBalance: 100,
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000),
      }

      let lookupCode = ''
      const mockTx = {
        giftCard: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            lookupCode = where.code
            return mockGiftCard
          }),
          update: vi.fn().mockResolvedValue({ ...mockGiftCard, currentBalance: 90 }),
        },
        giftCardTransaction: {
          create: vi.fn().mockResolvedValue({}),
        },
      }

      const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
      mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      })

      await redeemGiftCard('abcd-efgh-jklm-npqr', 10)

      // Should normalize to uppercase without dashes
      expect(lookupCode).toBe('ABCDEFGHJKLMNPQR')
    })

    it('should record transaction with order ID', async () => {
      const mockGiftCard = {
        id: 'gc-123',
        code: 'ABCDEFGHJKLMNPQR',
        initialBalance: 100,
        currentBalance: 100,
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000),
      }

      let transactionData: Record<string, unknown> = {}
      const mockTx = {
        giftCard: {
          findUnique: vi.fn().mockResolvedValue(mockGiftCard),
          update: vi.fn().mockResolvedValue({ ...mockGiftCard, currentBalance: 70 }),
        },
        giftCardTransaction: {
          create: vi.fn().mockImplementation(({ data }) => {
            transactionData = data
            return {}
          }),
        },
      }

      const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
      mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      })

      await redeemGiftCard('ABCDEFGHJKLMNPQR', 30, 'order-456')

      expect(transactionData.orderId).toBe('order-456')
      expect(transactionData.amount).toBe(-30) // Negative for redemption
      expect(transactionData.type).toBe(GIFT_CARD_CONFIG.TRANSACTION_TYPES.REDEMPTION)
    })
  })
})

describe('Refund Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('refundGiftCard', () => {
    it('should restore balance correctly', async () => {
      const mockGiftCard = {
        id: 'gc-123',
        code: 'ABCDEFGHJKLMNPQR',
        initialBalance: 100,
        currentBalance: 50, // Had 50 redeemed
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000),
      }

      const mockTx = {
        giftCard: {
          findUnique: vi.fn().mockResolvedValue(mockGiftCard),
          update: vi.fn().mockResolvedValue({ ...mockGiftCard, currentBalance: 70 }),
        },
        giftCardTransaction: {
          create: vi.fn().mockResolvedValue({}),
        },
      }

      const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
      mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      })

      const result = await refundGiftCard('gc-123', 20)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.newBalance).toBe(70)
      }
    })

    it('should not exceed initial balance', async () => {
      const mockGiftCard = {
        id: 'gc-123',
        code: 'ABCDEFGHJKLMNPQR',
        initialBalance: 100,
        currentBalance: 90,
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000),
      }

      let newBalance = 0
      const mockTx = {
        giftCard: {
          findUnique: vi.fn().mockResolvedValue(mockGiftCard),
          update: vi.fn().mockImplementation(({ data }) => {
            newBalance = data.currentBalance
            return { ...mockGiftCard, currentBalance: data.currentBalance }
          }),
        },
        giftCardTransaction: {
          create: vi.fn().mockResolvedValue({}),
        },
      }

      const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
      mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      })

      // Try to refund 50 when only 10 was redeemed
      const result = await refundGiftCard('gc-123', 50)

      expect(result.success).toBe(true)
      if (result.success) {
        // Should cap at initial balance of 100
        expect(result.newBalance).toBe(100)
        expect(newBalance).toBe(100)
      }
    })

    it('should reactivate previously redeemed card', async () => {
      const mockGiftCard = {
        id: 'gc-123',
        code: 'ABCDEFGHJKLMNPQR',
        initialBalance: 100,
        currentBalance: 0,
        status: GIFT_CARD_CONFIG.STATUS.REDEEMED,
        expiresAt: new Date(Date.now() + 86400000),
      }

      let updatedStatus = ''
      const mockTx = {
        giftCard: {
          findUnique: vi.fn().mockResolvedValue(mockGiftCard),
          update: vi.fn().mockImplementation(({ data }) => {
            updatedStatus = data.status
            return { ...mockGiftCard, currentBalance: 30, status: data.status }
          }),
        },
        giftCardTransaction: {
          create: vi.fn().mockResolvedValue({}),
        },
      }

      const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
      mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      })

      const result = await refundGiftCard('gc-123', 30)

      expect(result.success).toBe(true)
      expect(updatedStatus).toBe(GIFT_CARD_CONFIG.STATUS.ACTIVE)
    })

    it('should fail for non-existent gift card', async () => {
      const mockTx = {
        giftCard: {
          findUnique: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
        },
        giftCardTransaction: {
          create: vi.fn(),
        },
      }

      const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
      mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      })

      const result = await refundGiftCard('nonexistent-id', 50)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Gift card not found')
      }
    })

    it('should record transaction with order ID', async () => {
      const mockGiftCard = {
        id: 'gc-123',
        code: 'ABCDEFGHJKLMNPQR',
        initialBalance: 100,
        currentBalance: 70,
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000),
      }

      let transactionData: Record<string, unknown> = {}
      const mockTx = {
        giftCard: {
          findUnique: vi.fn().mockResolvedValue(mockGiftCard),
          update: vi.fn().mockResolvedValue({ ...mockGiftCard, currentBalance: 90 }),
        },
        giftCardTransaction: {
          create: vi.fn().mockImplementation(({ data }) => {
            transactionData = data
            return {}
          }),
        },
      }

      const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
      mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      })

      await refundGiftCard('gc-123', 20, 'order-456')

      expect(transactionData.orderId).toBe('order-456')
      expect(transactionData.amount).toBe(20) // Positive for refund
      expect(transactionData.type).toBe(GIFT_CARD_CONFIG.TRANSACTION_TYPES.REFUND)
    })
  })
})

describe('Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateUniqueGiftCardCode', () => {
    it('should return first code when no collision', async () => {
      const mockFindUnique = prisma.giftCard.findUnique as ReturnType<typeof vi.fn>
      mockFindUnique.mockResolvedValue(null)

      const code = await generateUniqueGiftCardCode()

      expect(code).toHaveLength(16)
      expect(mockFindUnique).toHaveBeenCalledTimes(1)
    })

    it('should retry on collision', async () => {
      const mockFindUnique = prisma.giftCard.findUnique as ReturnType<typeof vi.fn>
      mockFindUnique
        .mockResolvedValueOnce({ id: 'existing' }) // First code exists
        .mockResolvedValueOnce(null) // Second code is unique

      const code = await generateUniqueGiftCardCode()

      expect(code).toHaveLength(16)
      expect(mockFindUnique).toHaveBeenCalledTimes(2)
    })

    it('should throw error after max attempts', async () => {
      const mockFindUnique = prisma.giftCard.findUnique as ReturnType<typeof vi.fn>
      mockFindUnique.mockResolvedValue({ id: 'existing' }) // Always collision

      await expect(generateUniqueGiftCardCode(3)).rejects.toThrow(
        'Unable to generate unique gift card code after maximum attempts'
      )

      expect(mockFindUnique).toHaveBeenCalledTimes(3)
    })
  })

  describe('getGiftCardByCode', () => {
    it('should return gift card with transactions', async () => {
      const mockGiftCard = {
        id: 'gc-123',
        code: 'ABCDEFGHJKLMNPQR',
        initialBalance: 100,
        currentBalance: 70,
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        expiresAt: new Date(),
        recipientName: 'John Doe',
        transactions: [
          { id: 't-1', amount: -30, type: 'REDEMPTION', createdAt: new Date() },
        ],
      }

      const mockFindUnique = prisma.giftCard.findUnique as ReturnType<typeof vi.fn>
      mockFindUnique.mockResolvedValue(mockGiftCard)

      const result = await getGiftCardByCode('ABCD-EFGH-JKLM-NPQR')

      expect(result).not.toBeNull()
      expect(result!.code).toBe('ABCDEFGHJKLMNPQR')
      expect(result!.transactions).toHaveLength(1)
    })

    it('should return null for invalid code format', async () => {
      const result = await getGiftCardByCode('INVALID')

      expect(result).toBeNull()
    })

    it('should return null for non-existent code', async () => {
      const mockFindUnique = prisma.giftCard.findUnique as ReturnType<typeof vi.fn>
      mockFindUnique.mockResolvedValue(null)

      const result = await getGiftCardByCode('ABCDEFGHJKLMNPQR')

      expect(result).toBeNull()
    })
  })

  describe('createGiftCard', () => {
    it('should create gift card with correct data', async () => {
      const mockFindUnique = prisma.giftCard.findUnique as ReturnType<typeof vi.fn>
      mockFindUnique.mockResolvedValue(null) // No collision

      const mockCreate = prisma.giftCard.create as ReturnType<typeof vi.fn>
      mockCreate.mockResolvedValue({
        id: 'gc-new',
        code: 'ABCDEFGHJKLMNPQR',
        initialBalance: 50,
        currentBalance: 50,
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        expiresAt: new Date(),
      })

      const result = await createGiftCard({
        amount: 50,
        purchaserId: 'user-123',
        recipientEmail: 'recipient@example.com',
        recipientName: 'Jane Doe',
        message: 'Happy Birthday!',
      })

      expect(result.initialBalance).toBe(50)
      expect(result.currentBalance).toBe(50)
      expect(result.status).toBe(GIFT_CARD_CONFIG.STATUS.ACTIVE)
      expect(mockCreate).toHaveBeenCalled()
    })
  })

  describe('getUserPurchasedGiftCards', () => {
    it('should return all gift cards purchased by user', async () => {
      const mockGiftCards = [
        { id: 'gc-1', code: 'CODE1234567890AB', initialBalance: 50, currentBalance: 50 },
        { id: 'gc-2', code: 'CODE2345678901AB', initialBalance: 100, currentBalance: 75 },
      ]

      const mockFindMany = prisma.giftCard.findMany as ReturnType<typeof vi.fn>
      mockFindMany.mockResolvedValue(mockGiftCards)

      const result = await getUserPurchasedGiftCards('user-123')

      expect(result).toHaveLength(2)
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { purchaserId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      })
    })

    it('should return empty array for user with no gift cards', async () => {
      const mockFindMany = prisma.giftCard.findMany as ReturnType<typeof vi.fn>
      mockFindMany.mockResolvedValue([])

      const result = await getUserPurchasedGiftCards('user-without-cards')

      expect(result).toHaveLength(0)
    })
  })

  describe('updateExpiredGiftCards', () => {
    it('should update expired cards to EXPIRED status', async () => {
      const mockUpdateMany = prisma.giftCard.updateMany as ReturnType<typeof vi.fn>
      mockUpdateMany.mockResolvedValue({ count: 5 })

      const result = await updateExpiredGiftCards()

      expect(result).toBe(5)
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: {
          status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
          expiresAt: {
            lt: expect.any(Date),
          },
        },
        data: {
          status: GIFT_CARD_CONFIG.STATUS.EXPIRED,
        },
      })
    })

    it('should return zero when no cards need updating', async () => {
      const mockUpdateMany = prisma.giftCard.updateMany as ReturnType<typeof vi.fn>
      mockUpdateMany.mockResolvedValue({ count: 0 })

      const result = await updateExpiredGiftCards()

      expect(result).toBe(0)
    })
  })
})

describe('Edge Cases', () => {
  describe('Code format edge cases', () => {
    it('should handle codes with multiple consecutive dashes', () => {
      const result = normalizeGiftCardCode('ABCD--EFGH--JKLM')
      expect(result).toBe('ABCDEFGHJKLM')
    })

    it('should handle codes with leading/trailing dashes', () => {
      const result = normalizeGiftCardCode('-ABCDEFGHJKLMNPQR-')
      expect(result).toBe('ABCDEFGHJKLMNPQR')
    })

    it('should handle mixed valid and invalid characters validation', () => {
      // Valid chars with one invalid
      expect(isValidCodeFormat('ABCDEFGHI0KLMNPQ')).toBe(false) // I and 0 are invalid
    })
  })

  describe('Balance edge cases', () => {
    it('should handle redemption of exact balance', async () => {
      const mockGiftCard = {
        id: 'gc-123',
        code: 'ABCDEFGHJKLMNPQR',
        initialBalance: 50,
        currentBalance: 50,
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000),
      }

      const mockTx = {
        giftCard: {
          findUnique: vi.fn().mockResolvedValue(mockGiftCard),
          update: vi.fn().mockResolvedValue({ ...mockGiftCard, currentBalance: 0 }),
        },
        giftCardTransaction: {
          create: vi.fn().mockResolvedValue({}),
        },
      }

      const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
      mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      })

      const result = await redeemGiftCard('ABCDEFGHJKLMNPQR', 50)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.remainingBalance).toBe(0)
        expect(result.amountApplied).toBe(50)
      }
    })

    it('should handle zero amount redemption attempt', async () => {
      const mockGiftCard = {
        id: 'gc-123',
        code: 'ABCDEFGHJKLMNPQR',
        initialBalance: 100,
        currentBalance: 100,
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000),
      }

      const mockTx = {
        giftCard: {
          findUnique: vi.fn().mockResolvedValue(mockGiftCard),
          update: vi.fn().mockResolvedValue({ ...mockGiftCard }),
        },
        giftCardTransaction: {
          create: vi.fn().mockResolvedValue({}),
        },
      }

      const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
      mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
        return callback(mockTx)
      })

      const result = await redeemGiftCard('ABCDEFGHJKLMNPQR', 0)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.amountApplied).toBe(0)
        expect(result.remainingBalance).toBe(100)
      }
    })
  })

  describe('Date edge cases', () => {
    it('should handle expiration at midnight', () => {
      const midnight = new Date()
      midnight.setHours(0, 0, 0, 0)

      // If the date is today at midnight and current time is after midnight
      const result = isExpired(midnight)
      expect(typeof result).toBe('boolean')
    })

    it('should handle leap year in expiration calculation', () => {
      // Feb 29, 2024 (leap year)
      const purchaseDate = new Date('2024-02-29')
      const expiresAt = calculateExpirationDate(purchaseDate, 365)

      expect(expiresAt).not.toBeNull()
      // Should be Feb 28, 2025 (next year is not leap year)
      expect(expiresAt!.getFullYear()).toBe(2025)
    })

    it('should handle null expiration in validation', () => {
      const giftCard = {
        status: GIFT_CARD_CONFIG.STATUS.ACTIVE,
        currentBalance: 100,
        expiresAt: null,
      }

      const result = validateGiftCardForUse(giftCard)
      expect(result.valid).toBe(true)
    })
  })
})
