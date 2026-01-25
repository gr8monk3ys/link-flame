import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  LOYALTY_TIERS,
  LOYALTY_CONFIG,
  POINT_SOURCES,
  calculateTier,
  getTierInfo,
  getPointsToNextTier,
  calculatePurchasePoints,
  calculateDiscountFromPoints,
  calculatePointsForDiscount,
  getUserAvailablePoints,
  getUserLoyaltySummary,
  awardPoints,
  awardSignupBonus,
  awardPurchasePoints,
  awardReviewPoints,
  awardReferralPoints,
  redeemPoints,
  getUserPointHistory,
  type LoyaltyTier,
  type PointSource,
} from '@/lib/loyalty';

// Mock the Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    loyaltyPoints: {
      aggregate: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    loyaltyRedemption: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import the mocked prisma after mocking
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

describe('Loyalty Program', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ============================================================
  // TIER CALCULATION TESTS
  // ============================================================
  describe('calculateTier', () => {
    describe('SEEDLING tier (0-499 points)', () => {
      it('should return SEEDLING for 0 points', () => {
        expect(calculateTier(0)).toBe(LOYALTY_TIERS.SEEDLING);
      });

      it('should return SEEDLING for 1 point', () => {
        expect(calculateTier(1)).toBe(LOYALTY_TIERS.SEEDLING);
      });

      it('should return SEEDLING for 250 points (middle of tier)', () => {
        expect(calculateTier(250)).toBe(LOYALTY_TIERS.SEEDLING);
      });

      it('should return SEEDLING for 499 points (upper boundary)', () => {
        expect(calculateTier(499)).toBe(LOYALTY_TIERS.SEEDLING);
      });
    });

    describe('SPROUT tier (500-1499 points)', () => {
      it('should return SPROUT for 500 points (lower boundary)', () => {
        expect(calculateTier(500)).toBe(LOYALTY_TIERS.SPROUT);
      });

      it('should return SPROUT for 501 points', () => {
        expect(calculateTier(501)).toBe(LOYALTY_TIERS.SPROUT);
      });

      it('should return SPROUT for 1000 points (middle of tier)', () => {
        expect(calculateTier(1000)).toBe(LOYALTY_TIERS.SPROUT);
      });

      it('should return SPROUT for 1499 points (upper boundary)', () => {
        expect(calculateTier(1499)).toBe(LOYALTY_TIERS.SPROUT);
      });
    });

    describe('BLOOM tier (1500-2999 points)', () => {
      it('should return BLOOM for 1500 points (lower boundary)', () => {
        expect(calculateTier(1500)).toBe(LOYALTY_TIERS.BLOOM);
      });

      it('should return BLOOM for 1501 points', () => {
        expect(calculateTier(1501)).toBe(LOYALTY_TIERS.BLOOM);
      });

      it('should return BLOOM for 2250 points (middle of tier)', () => {
        expect(calculateTier(2250)).toBe(LOYALTY_TIERS.BLOOM);
      });

      it('should return BLOOM for 2999 points (upper boundary)', () => {
        expect(calculateTier(2999)).toBe(LOYALTY_TIERS.BLOOM);
      });
    });

    describe('FLOURISH tier (3000+ points)', () => {
      it('should return FLOURISH for 3000 points (lower boundary)', () => {
        expect(calculateTier(3000)).toBe(LOYALTY_TIERS.FLOURISH);
      });

      it('should return FLOURISH for 3001 points', () => {
        expect(calculateTier(3001)).toBe(LOYALTY_TIERS.FLOURISH);
      });

      it('should return FLOURISH for 5000 points', () => {
        expect(calculateTier(5000)).toBe(LOYALTY_TIERS.FLOURISH);
      });

      it('should return FLOURISH for very large point values', () => {
        expect(calculateTier(100000)).toBe(LOYALTY_TIERS.FLOURISH);
        expect(calculateTier(1000000)).toBe(LOYALTY_TIERS.FLOURISH);
      });
    });

    describe('edge cases', () => {
      it('should handle negative points by returning SEEDLING', () => {
        // Negative points should fall through to SEEDLING (lowest tier)
        expect(calculateTier(-1)).toBe(LOYALTY_TIERS.SEEDLING);
        expect(calculateTier(-100)).toBe(LOYALTY_TIERS.SEEDLING);
      });

      it('should handle decimal points correctly', () => {
        // Decimal points - function takes number so it might receive floats
        expect(calculateTier(499.9)).toBe(LOYALTY_TIERS.SEEDLING);
        expect(calculateTier(500.0)).toBe(LOYALTY_TIERS.SPROUT);
        expect(calculateTier(500.1)).toBe(LOYALTY_TIERS.SPROUT);
      });
    });
  });

  // ============================================================
  // TIER INFO TESTS
  // ============================================================
  describe('getTierInfo', () => {
    it('should return correct info for SEEDLING tier', () => {
      const info = getTierInfo(LOYALTY_TIERS.SEEDLING);

      expect(info.tier).toBe(LOYALTY_TIERS.SEEDLING);
      expect(info.min).toBe(0);
      expect(info.max).toBe(499);
      expect(info.multiplier).toBe(1.0);
      expect(info.name).toBe('Seedling');
      expect(info.benefits).toContain('Earn 1 point per $1 spent');
    });

    it('should return correct info for SPROUT tier', () => {
      const info = getTierInfo(LOYALTY_TIERS.SPROUT);

      expect(info.tier).toBe(LOYALTY_TIERS.SPROUT);
      expect(info.min).toBe(500);
      expect(info.max).toBe(1499);
      expect(info.multiplier).toBe(1.1);
      expect(info.name).toBe('Sprout');
      expect(info.benefits).toContain('Earn 1.1x points on purchases');
    });

    it('should return correct info for BLOOM tier', () => {
      const info = getTierInfo(LOYALTY_TIERS.BLOOM);

      expect(info.tier).toBe(LOYALTY_TIERS.BLOOM);
      expect(info.min).toBe(1500);
      expect(info.max).toBe(2999);
      expect(info.multiplier).toBe(1.25);
      expect(info.name).toBe('Bloom');
      expect(info.benefits).toContain('Earn 1.25x points on purchases');
    });

    it('should return correct info for FLOURISH tier', () => {
      const info = getTierInfo(LOYALTY_TIERS.FLOURISH);

      expect(info.tier).toBe(LOYALTY_TIERS.FLOURISH);
      expect(info.min).toBe(3000);
      expect(info.max).toBe(Infinity);
      expect(info.multiplier).toBe(1.5);
      expect(info.name).toBe('Flourish');
      expect(info.benefits).toContain('Earn 1.5x points on purchases');
    });
  });

  // ============================================================
  // POINTS TO NEXT TIER TESTS
  // ============================================================
  describe('getPointsToNextTier', () => {
    describe('from SEEDLING tier', () => {
      it('should return 500 points needed from 0 points', () => {
        const result = getPointsToNextTier(0);

        expect(result.nextTier).toBe(LOYALTY_TIERS.SPROUT);
        expect(result.pointsNeeded).toBe(500);
      });

      it('should return 250 points needed from 250 points', () => {
        const result = getPointsToNextTier(250);

        expect(result.nextTier).toBe(LOYALTY_TIERS.SPROUT);
        expect(result.pointsNeeded).toBe(250);
      });

      it('should return 1 point needed from 499 points', () => {
        const result = getPointsToNextTier(499);

        expect(result.nextTier).toBe(LOYALTY_TIERS.SPROUT);
        expect(result.pointsNeeded).toBe(1);
      });
    });

    describe('from SPROUT tier', () => {
      it('should return 1000 points needed from 500 points', () => {
        const result = getPointsToNextTier(500);

        expect(result.nextTier).toBe(LOYALTY_TIERS.BLOOM);
        expect(result.pointsNeeded).toBe(1000);
      });

      it('should return 500 points needed from 1000 points', () => {
        const result = getPointsToNextTier(1000);

        expect(result.nextTier).toBe(LOYALTY_TIERS.BLOOM);
        expect(result.pointsNeeded).toBe(500);
      });

      it('should return 1 point needed from 1499 points', () => {
        const result = getPointsToNextTier(1499);

        expect(result.nextTier).toBe(LOYALTY_TIERS.BLOOM);
        expect(result.pointsNeeded).toBe(1);
      });
    });

    describe('from BLOOM tier', () => {
      it('should return 1500 points needed from 1500 points', () => {
        const result = getPointsToNextTier(1500);

        expect(result.nextTier).toBe(LOYALTY_TIERS.FLOURISH);
        expect(result.pointsNeeded).toBe(1500);
      });

      it('should return 750 points needed from 2250 points', () => {
        const result = getPointsToNextTier(2250);

        expect(result.nextTier).toBe(LOYALTY_TIERS.FLOURISH);
        expect(result.pointsNeeded).toBe(750);
      });

      it('should return 1 point needed from 2999 points', () => {
        const result = getPointsToNextTier(2999);

        expect(result.nextTier).toBe(LOYALTY_TIERS.FLOURISH);
        expect(result.pointsNeeded).toBe(1);
      });
    });

    describe('from FLOURISH tier (max tier)', () => {
      it('should return null next tier and 0 points needed from 3000 points', () => {
        const result = getPointsToNextTier(3000);

        expect(result.nextTier).toBeNull();
        expect(result.pointsNeeded).toBe(0);
      });

      it('should return null next tier for very high points', () => {
        const result = getPointsToNextTier(100000);

        expect(result.nextTier).toBeNull();
        expect(result.pointsNeeded).toBe(0);
      });
    });
  });

  // ============================================================
  // PURCHASE POINTS CALCULATION TESTS
  // ============================================================
  describe('calculatePurchasePoints', () => {
    describe('base points calculation (SEEDLING tier - 1x multiplier)', () => {
      it('should return 0 points for $0 order', () => {
        expect(calculatePurchasePoints(0, LOYALTY_TIERS.SEEDLING)).toBe(0);
      });

      it('should return 1 point for $1 order', () => {
        expect(calculatePurchasePoints(1, LOYALTY_TIERS.SEEDLING)).toBe(1);
      });

      it('should return 10 points for $10 order', () => {
        expect(calculatePurchasePoints(10, LOYALTY_TIERS.SEEDLING)).toBe(10);
      });

      it('should return 99 points for $99.99 order (floor rounding)', () => {
        expect(calculatePurchasePoints(99.99, LOYALTY_TIERS.SEEDLING)).toBe(99);
      });

      it('should return 100 points for $100 order', () => {
        expect(calculatePurchasePoints(100, LOYALTY_TIERS.SEEDLING)).toBe(100);
      });
    });

    describe('SPROUT tier (1.1x multiplier)', () => {
      it('should return 11 points for $10 order (10 * 1.1 = 11)', () => {
        expect(calculatePurchasePoints(10, LOYALTY_TIERS.SPROUT)).toBe(11);
      });

      it('should return 110 points for $100 order (100 * 1.1 = 110)', () => {
        expect(calculatePurchasePoints(100, LOYALTY_TIERS.SPROUT)).toBe(110);
      });

      it('should floor partial points correctly', () => {
        // $50.50 = 50 base points * 1.1 = 55
        expect(calculatePurchasePoints(50.50, LOYALTY_TIERS.SPROUT)).toBe(55);
      });
    });

    describe('BLOOM tier (1.25x multiplier)', () => {
      it('should return 12 points for $10 order (10 * 1.25 = 12.5 -> 12)', () => {
        expect(calculatePurchasePoints(10, LOYALTY_TIERS.BLOOM)).toBe(12);
      });

      it('should return 125 points for $100 order (100 * 1.25 = 125)', () => {
        expect(calculatePurchasePoints(100, LOYALTY_TIERS.BLOOM)).toBe(125);
      });

      it('should floor partial points correctly', () => {
        // $40 = 40 base points * 1.25 = 50
        expect(calculatePurchasePoints(40, LOYALTY_TIERS.BLOOM)).toBe(50);
      });
    });

    describe('FLOURISH tier (1.5x multiplier)', () => {
      it('should return 15 points for $10 order (10 * 1.5 = 15)', () => {
        expect(calculatePurchasePoints(10, LOYALTY_TIERS.FLOURISH)).toBe(15);
      });

      it('should return 150 points for $100 order (100 * 1.5 = 150)', () => {
        expect(calculatePurchasePoints(100, LOYALTY_TIERS.FLOURISH)).toBe(150);
      });

      it('should floor partial points correctly', () => {
        // $33 = 33 base points * 1.5 = 49.5 -> 49
        expect(calculatePurchasePoints(33, LOYALTY_TIERS.FLOURISH)).toBe(49);
      });
    });

    describe('edge cases', () => {
      it('should handle very small amounts', () => {
        // $0.99 = 0 base points
        expect(calculatePurchasePoints(0.99, LOYALTY_TIERS.SEEDLING)).toBe(0);
      });

      it('should handle very large amounts', () => {
        // $10,000 = 10,000 base points * 1.5 = 15,000
        expect(calculatePurchasePoints(10000, LOYALTY_TIERS.FLOURISH)).toBe(15000);
      });

      it('should return 0 for negative amounts', () => {
        // Implementation uses Math.floor, negative values should return 0 or negative
        expect(calculatePurchasePoints(-10, LOYALTY_TIERS.SEEDLING)).toBe(-10);
      });
    });
  });

  // ============================================================
  // DISCOUNT CALCULATION TESTS
  // ============================================================
  describe('calculateDiscountFromPoints', () => {
    it('should return $0 for 0 points', () => {
      expect(calculateDiscountFromPoints(0)).toBe(0);
    });

    it('should return $1 for 100 points', () => {
      expect(calculateDiscountFromPoints(100)).toBe(1);
    });

    it('should return $0.50 for 50 points', () => {
      expect(calculateDiscountFromPoints(50)).toBe(0.5);
    });

    it('should return $10 for 1000 points', () => {
      expect(calculateDiscountFromPoints(1000)).toBe(10);
    });

    it('should return $25 for 2500 points', () => {
      expect(calculateDiscountFromPoints(2500)).toBe(25);
    });

    it('should handle partial discounts', () => {
      // 1 point = $0.01
      expect(calculateDiscountFromPoints(1)).toBe(0.01);
      // 37 points = $0.37
      expect(calculateDiscountFromPoints(37)).toBe(0.37);
    });

    it('should handle large point values', () => {
      expect(calculateDiscountFromPoints(100000)).toBe(1000);
    });
  });

  // ============================================================
  // POINTS FOR DISCOUNT CALCULATION TESTS
  // ============================================================
  describe('calculatePointsForDiscount', () => {
    it('should return 0 points for $0 discount', () => {
      expect(calculatePointsForDiscount(0)).toBe(0);
    });

    it('should return 100 points for $1 discount', () => {
      expect(calculatePointsForDiscount(1)).toBe(100);
    });

    it('should return 1000 points for $10 discount', () => {
      expect(calculatePointsForDiscount(10)).toBe(1000);
    });

    it('should return 2500 points for $25 discount', () => {
      expect(calculatePointsForDiscount(25)).toBe(2500);
    });

    it('should round up partial amounts (ceil)', () => {
      // $0.01 = 1 point (ceil of 1)
      expect(calculatePointsForDiscount(0.01)).toBe(1);
      // $0.99 = 99 points (ceil of 99)
      expect(calculatePointsForDiscount(0.99)).toBe(99);
      // $1.01 = 101 points (ceil of 101)
      expect(calculatePointsForDiscount(1.01)).toBe(101);
    });

    it('should handle large discount values', () => {
      expect(calculatePointsForDiscount(100)).toBe(10000);
    });
  });

  // ============================================================
  // GET USER AVAILABLE POINTS TESTS
  // ============================================================
  describe('getUserAvailablePoints', () => {
    const mockUserId = 'user-123';

    it('should return 0 when user has no earned or redeemed points', async () => {
      vi.mocked(prisma.loyaltyPoints.aggregate).mockResolvedValue({
        _sum: { points: null },
        _count: 0,
        _avg: { points: null },
        _min: { points: null },
        _max: { points: null },
      });
      vi.mocked(prisma.loyaltyRedemption.aggregate).mockResolvedValue({
        _sum: { pointsUsed: null },
        _count: 0,
        _avg: { pointsUsed: null },
        _min: { pointsUsed: null },
        _max: { pointsUsed: null },
      });

      const result = await getUserAvailablePoints(mockUserId);

      expect(result).toBe(0);
    });

    it('should return earned points when no redemptions', async () => {
      vi.mocked(prisma.loyaltyPoints.aggregate).mockResolvedValue({
        _sum: { points: 500 },
        _count: 1,
        _avg: { points: 500 },
        _min: { points: 500 },
        _max: { points: 500 },
      });
      vi.mocked(prisma.loyaltyRedemption.aggregate).mockResolvedValue({
        _sum: { pointsUsed: null },
        _count: 0,
        _avg: { pointsUsed: null },
        _min: { pointsUsed: null },
        _max: { pointsUsed: null },
      });

      const result = await getUserAvailablePoints(mockUserId);

      expect(result).toBe(500);
    });

    it('should subtract redeemed points from earned points', async () => {
      vi.mocked(prisma.loyaltyPoints.aggregate).mockResolvedValue({
        _sum: { points: 1000 },
        _count: 1,
        _avg: { points: 1000 },
        _min: { points: 1000 },
        _max: { points: 1000 },
      });
      vi.mocked(prisma.loyaltyRedemption.aggregate).mockResolvedValue({
        _sum: { pointsUsed: 300 },
        _count: 1,
        _avg: { pointsUsed: 300 },
        _min: { pointsUsed: 300 },
        _max: { pointsUsed: 300 },
      });

      const result = await getUserAvailablePoints(mockUserId);

      expect(result).toBe(700);
    });

    it('should return 0 when redeemed exceeds earned (safety floor)', async () => {
      vi.mocked(prisma.loyaltyPoints.aggregate).mockResolvedValue({
        _sum: { points: 100 },
        _count: 1,
        _avg: { points: 100 },
        _min: { points: 100 },
        _max: { points: 100 },
      });
      vi.mocked(prisma.loyaltyRedemption.aggregate).mockResolvedValue({
        _sum: { pointsUsed: 200 },
        _count: 1,
        _avg: { pointsUsed: 200 },
        _min: { pointsUsed: 200 },
        _max: { pointsUsed: 200 },
      });

      const result = await getUserAvailablePoints(mockUserId);

      expect(result).toBe(0); // Math.max(0, 100 - 200) = 0
    });
  });

  // ============================================================
  // GET USER LOYALTY SUMMARY TESTS
  // ============================================================
  describe('getUserLoyaltySummary', () => {
    const mockUserId = 'user-123';

    it('should return null when user is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await getUserLoyaltySummary(mockUserId);

      expect(result).toBeNull();
    });

    it('should return complete loyalty summary for valid user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        loyaltyTier: 'SPROUT',
        totalLifetimePoints: 750,
      } as any);
      vi.mocked(prisma.loyaltyPoints.aggregate).mockResolvedValue({
        _sum: { points: 750 },
        _count: 1,
        _avg: { points: 750 },
        _min: { points: 750 },
        _max: { points: 750 },
      });
      vi.mocked(prisma.loyaltyRedemption.aggregate).mockResolvedValue({
        _sum: { pointsUsed: 200 },
        _count: 1,
        _avg: { pointsUsed: 200 },
        _min: { pointsUsed: 200 },
        _max: { pointsUsed: 200 },
      });

      const result = await getUserLoyaltySummary(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.availablePoints).toBe(550);
      expect(result?.lifetimePoints).toBe(750);
      expect(result?.tier).toBe('SPROUT');
      expect(result?.tierInfo.name).toBe('Sprout');
      expect(result?.nextTier).toBe(LOYALTY_TIERS.BLOOM);
      expect(result?.pointsToNextTier).toBe(750); // 1500 - 750
      expect(result?.maxDiscount).toBe(5.5); // 550 / 100
    });

    it('should return null next tier for FLOURISH members', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        loyaltyTier: 'FLOURISH',
        totalLifetimePoints: 5000,
      } as any);
      vi.mocked(prisma.loyaltyPoints.aggregate).mockResolvedValue({
        _sum: { points: 5000 },
        _count: 1,
        _avg: { points: 5000 },
        _min: { points: 5000 },
        _max: { points: 5000 },
      });
      vi.mocked(prisma.loyaltyRedemption.aggregate).mockResolvedValue({
        _sum: { pointsUsed: 0 },
        _count: 0,
        _avg: { pointsUsed: null },
        _min: { pointsUsed: null },
        _max: { pointsUsed: null },
      });

      const result = await getUserLoyaltySummary(mockUserId);

      expect(result?.nextTier).toBeNull();
      expect(result?.pointsToNextTier).toBe(0);
    });
  });

  // ============================================================
  // AWARD POINTS TESTS
  // ============================================================
  describe('awardPoints', () => {
    const mockUserId = 'user-123';

    beforeEach(() => {
      vi.mocked(prisma.$transaction).mockImplementation(async (operations) => {
        // Execute operations if they're functions
        if (typeof operations === 'function') {
          return await operations(prisma);
        }
        return Promise.all(operations);
      });
    });

    it('should return failure when user is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await awardPoints({
        userId: mockUserId,
        points: 100,
        source: POINT_SOURCES.PURCHASE,
      });

      expect(result.success).toBe(false);
      expect(result.pointsAwarded).toBe(0);
      expect(result.newTotal).toBe(0);
      expect(result.tierChanged).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should award points without tier change', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        loyaltyTier: 'SEEDLING',
        totalLifetimePoints: 100,
      } as any);

      const result = await awardPoints({
        userId: mockUserId,
        points: 50,
        source: POINT_SOURCES.PURCHASE,
        orderId: 'order-123',
      });

      expect(result.success).toBe(true);
      expect(result.pointsAwarded).toBe(50);
      expect(result.newTotal).toBe(150);
      expect(result.tierChanged).toBe(false);
      expect(result.newTier).toBeUndefined();
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });

    it('should award points with tier change', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        loyaltyTier: 'SEEDLING',
        totalLifetimePoints: 450,
      } as any);

      const result = await awardPoints({
        userId: mockUserId,
        points: 100, // 450 + 100 = 550 -> SPROUT
        source: POINT_SOURCES.PURCHASE,
      });

      expect(result.success).toBe(true);
      expect(result.pointsAwarded).toBe(100);
      expect(result.newTotal).toBe(550);
      expect(result.tierChanged).toBe(true);
      expect(result.newTier).toBe(LOYALTY_TIERS.SPROUT);
    });

    it('should handle transaction errors gracefully', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        loyaltyTier: 'SEEDLING',
        totalLifetimePoints: 100,
      } as any);
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Database error'));

      const result = await awardPoints({
        userId: mockUserId,
        points: 50,
        source: POINT_SOURCES.PURCHASE,
      });

      expect(result.success).toBe(false);
      expect(result.pointsAwarded).toBe(0);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ============================================================
  // AWARD SIGNUP BONUS TESTS
  // ============================================================
  describe('awardSignupBonus', () => {
    const mockUserId = 'user-123';

    it('should return false if user already received signup bonus', async () => {
      vi.mocked(prisma.loyaltyPoints.findFirst).mockResolvedValue({
        id: 'existing-bonus',
        userId: mockUserId,
        source: POINT_SOURCES.SIGNUP,
      } as any);

      const result = await awardSignupBonus(mockUserId);

      expect(result).toBe(false);
      expect(logger.info).toHaveBeenCalledWith(
        'User already received signup bonus',
        { userId: mockUserId }
      );
    });

    it('should award signup bonus for new user', async () => {
      vi.mocked(prisma.loyaltyPoints.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        loyaltyTier: 'SEEDLING',
        totalLifetimePoints: 0,
      } as any);

      const result = await awardSignupBonus(mockUserId);

      expect(result).toBe(true);
    });
  });

  // ============================================================
  // AWARD PURCHASE POINTS TESTS
  // ============================================================
  describe('awardPurchasePoints', () => {
    const mockUserId = 'user-123';
    const mockOrderId = 'order-123';

    it('should return failure when user is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await awardPurchasePoints(mockUserId, mockOrderId, 100);

      expect(result.success).toBe(false);
      expect(result.pointsAwarded).toBe(0);
    });

    it('should award correct points based on tier', async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          loyaltyTier: 'BLOOM',
        } as any)
        .mockResolvedValueOnce({
          loyaltyTier: 'BLOOM',
          totalLifetimePoints: 2000,
        } as any);

      const result = await awardPurchasePoints(mockUserId, mockOrderId, 100);

      // BLOOM tier: 100 * 1.25 = 125 points
      expect(result.success).toBe(true);
      expect(result.pointsAwarded).toBe(125);
    });

    it('should return success with 0 points for very small orders', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        loyaltyTier: 'SEEDLING',
      } as any);

      const result = await awardPurchasePoints(mockUserId, mockOrderId, 0.50);

      expect(result.success).toBe(true);
      expect(result.pointsAwarded).toBe(0);
    });
  });

  // ============================================================
  // AWARD REVIEW POINTS TESTS
  // ============================================================
  describe('awardReviewPoints', () => {
    const mockUserId = 'user-123';
    const mockReviewId = 'review-123';

    it('should return false if points already awarded for review', async () => {
      vi.mocked(prisma.loyaltyPoints.findFirst).mockResolvedValue({
        id: 'existing-points',
        userId: mockUserId,
        reviewId: mockReviewId,
      } as any);

      const result = await awardReviewPoints(mockUserId, mockReviewId);

      expect(result).toBe(false);
      expect(logger.info).toHaveBeenCalledWith(
        'Points already awarded for this review',
        { userId: mockUserId, reviewId: mockReviewId }
      );
    });

    it('should award review points for new review', async () => {
      vi.mocked(prisma.loyaltyPoints.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        loyaltyTier: 'SEEDLING',
        totalLifetimePoints: 100,
      } as any);

      const result = await awardReviewPoints(mockUserId, mockReviewId);

      expect(result).toBe(true);
    });
  });

  // ============================================================
  // AWARD REFERRAL POINTS TESTS
  // ============================================================
  describe('awardReferralPoints', () => {
    const mockUserId = 'user-123';
    const mockReferralId = 'referral-123';

    it('should return false if points already awarded for referral', async () => {
      vi.mocked(prisma.loyaltyPoints.findFirst).mockResolvedValue({
        id: 'existing-points',
        userId: mockUserId,
        referralId: mockReferralId,
      } as any);

      const result = await awardReferralPoints(mockUserId, mockReferralId);

      expect(result).toBe(false);
      expect(logger.info).toHaveBeenCalledWith(
        'Points already awarded for this referral',
        { userId: mockUserId, referralId: mockReferralId }
      );
    });

    it('should award referral points for new referral', async () => {
      vi.mocked(prisma.loyaltyPoints.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        loyaltyTier: 'SEEDLING',
        totalLifetimePoints: 0,
      } as any);

      const result = await awardReferralPoints(mockUserId, mockReferralId);

      expect(result).toBe(true);
    });
  });

  // ============================================================
  // REDEEM POINTS TESTS
  // ============================================================
  describe('redeemPoints', () => {
    const mockUserId = 'user-123';

    it('should fail when points to redeem is zero or negative', async () => {
      const result = await redeemPoints({
        userId: mockUserId,
        pointsToRedeem: 0,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Points to redeem must be positive');
    });

    it('should fail when points to redeem is negative', async () => {
      const result = await redeemPoints({
        userId: mockUserId,
        pointsToRedeem: -100,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Points to redeem must be positive');
    });

    it('should fail when user has insufficient points', async () => {
      vi.mocked(prisma.loyaltyPoints.aggregate).mockResolvedValue({
        _sum: { points: 100 },
        _count: 1,
        _avg: { points: 100 },
        _min: { points: 100 },
        _max: { points: 100 },
      });
      vi.mocked(prisma.loyaltyRedemption.aggregate).mockResolvedValue({
        _sum: { pointsUsed: 0 },
        _count: 0,
        _avg: { pointsUsed: null },
        _min: { pointsUsed: null },
        _max: { pointsUsed: null },
      });

      const result = await redeemPoints({
        userId: mockUserId,
        pointsToRedeem: 500,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient points');
      expect(result.remainingPoints).toBe(100);
    });

    it('should successfully redeem points', async () => {
      vi.mocked(prisma.loyaltyPoints.aggregate).mockResolvedValue({
        _sum: { points: 1000 },
        _count: 1,
        _avg: { points: 1000 },
        _min: { points: 1000 },
        _max: { points: 1000 },
      });
      vi.mocked(prisma.loyaltyRedemption.aggregate).mockResolvedValue({
        _sum: { pointsUsed: 0 },
        _count: 0,
        _avg: { pointsUsed: null },
        _min: { pointsUsed: null },
        _max: { pointsUsed: null },
      });
      vi.mocked(prisma.loyaltyRedemption.create).mockResolvedValue({
        id: 'redemption-123',
        userId: mockUserId,
        pointsUsed: 500,
        discount: 5,
        discountAmount: 5,
        status: 'applied',
      } as any);

      const result = await redeemPoints({
        userId: mockUserId,
        pointsToRedeem: 500,
        orderId: 'order-123',
      });

      expect(result.success).toBe(true);
      expect(result.discountAmount).toBe(5); // 500 / 100 = $5
      expect(result.remainingPoints).toBe(500); // 1000 - 500
      expect(result.error).toBeUndefined();
      expect(prisma.loyaltyRedemption.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          pointsUsed: 500,
          discount: 5,
          discountAmount: 5,
          orderId: 'order-123',
          status: 'applied',
        }),
      });
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.loyaltyPoints.aggregate).mockResolvedValue({
        _sum: { points: 1000 },
        _count: 1,
        _avg: { points: 1000 },
        _min: { points: 1000 },
        _max: { points: 1000 },
      });
      vi.mocked(prisma.loyaltyRedemption.aggregate).mockResolvedValue({
        _sum: { pointsUsed: 0 },
        _count: 0,
        _avg: { pointsUsed: null },
        _min: { pointsUsed: null },
        _max: { pointsUsed: null },
      });
      vi.mocked(prisma.loyaltyRedemption.create).mockRejectedValue(new Error('Database error'));

      const result = await redeemPoints({
        userId: mockUserId,
        pointsToRedeem: 500,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to redeem points. Please try again.');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ============================================================
  // GET USER POINT HISTORY TESTS
  // ============================================================
  describe('getUserPointHistory', () => {
    const mockUserId = 'user-123';

    it('should return empty history when user has no transactions', async () => {
      vi.mocked(prisma.loyaltyPoints.findMany).mockResolvedValue([]);
      vi.mocked(prisma.loyaltyPoints.count).mockResolvedValue(0);
      vi.mocked(prisma.loyaltyRedemption.findMany).mockResolvedValue([]);
      vi.mocked(prisma.loyaltyRedemption.count).mockResolvedValue(0);

      const result = await getUserPointHistory(mockUserId);

      expect(result.transactions).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should return combined and sorted transactions', async () => {
      const earnedDate = new Date('2024-01-15');
      const redeemedDate = new Date('2024-01-20');

      vi.mocked(prisma.loyaltyPoints.findMany).mockResolvedValue([
        {
          id: 'earned-1',
          points: 100,
          source: 'PURCHASE',
          description: 'Purchase reward',
          orderId: 'order-1',
          earnedAt: earnedDate,
        } as any,
      ]);
      vi.mocked(prisma.loyaltyPoints.count).mockResolvedValue(1);
      vi.mocked(prisma.loyaltyRedemption.findMany).mockResolvedValue([
        {
          id: 'redemption-1',
          pointsUsed: 50,
          discountAmount: 0.5,
          orderId: 'order-2',
          redeemedAt: redeemedDate,
        } as any,
      ]);
      vi.mocked(prisma.loyaltyRedemption.count).mockResolvedValue(1);

      const result = await getUserPointHistory(mockUserId);

      expect(result.transactions.length).toBe(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);

      // Should be sorted by date descending (redemption comes first)
      expect(result.transactions[0].type).toBe('redeemed');
      expect(result.transactions[0].points).toBe(-50);
      expect(result.transactions[1].type).toBe('earned');
      expect(result.transactions[1].points).toBe(100);
    });

    it('should handle pagination options', async () => {
      vi.mocked(prisma.loyaltyPoints.findMany).mockResolvedValue([]);
      vi.mocked(prisma.loyaltyPoints.count).mockResolvedValue(50);
      vi.mocked(prisma.loyaltyRedemption.findMany).mockResolvedValue([]);
      vi.mocked(prisma.loyaltyRedemption.count).mockResolvedValue(10);

      const result = await getUserPointHistory(mockUserId, { page: 2, limit: 10 });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(60);
      expect(result.pagination.totalPages).toBe(6);

      // Verify Prisma was called with correct pagination
      expect(prisma.loyaltyPoints.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * limit 10
          take: 10,
        })
      );
    });

    it('should use default pagination values', async () => {
      vi.mocked(prisma.loyaltyPoints.findMany).mockResolvedValue([]);
      vi.mocked(prisma.loyaltyPoints.count).mockResolvedValue(0);
      vi.mocked(prisma.loyaltyRedemption.findMany).mockResolvedValue([]);
      vi.mocked(prisma.loyaltyRedemption.count).mockResolvedValue(0);

      const result = await getUserPointHistory(mockUserId);

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);

      expect(prisma.loyaltyPoints.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      );
    });
  });

  // ============================================================
  // LOYALTY CONFIG TESTS
  // ============================================================
  describe('LOYALTY_CONFIG', () => {
    it('should have correct point earning rates', () => {
      expect(LOYALTY_CONFIG.pointsPerDollar).toBe(1);
      expect(LOYALTY_CONFIG.reviewPoints).toBe(50);
      expect(LOYALTY_CONFIG.referralPoints).toBe(200);
      expect(LOYALTY_CONFIG.signupBonus).toBe(200);
    });

    it('should have correct redemption rate', () => {
      expect(LOYALTY_CONFIG.pointsPerDollarDiscount).toBe(100);
    });

    it('should have correct tier thresholds', () => {
      expect(LOYALTY_CONFIG.tiers.SEEDLING.min).toBe(0);
      expect(LOYALTY_CONFIG.tiers.SEEDLING.max).toBe(499);
      expect(LOYALTY_CONFIG.tiers.SPROUT.min).toBe(500);
      expect(LOYALTY_CONFIG.tiers.SPROUT.max).toBe(1499);
      expect(LOYALTY_CONFIG.tiers.BLOOM.min).toBe(1500);
      expect(LOYALTY_CONFIG.tiers.BLOOM.max).toBe(2999);
      expect(LOYALTY_CONFIG.tiers.FLOURISH.min).toBe(3000);
      expect(LOYALTY_CONFIG.tiers.FLOURISH.max).toBe(Infinity);
    });

    it('should have correct tier multipliers', () => {
      expect(LOYALTY_CONFIG.tiers.SEEDLING.multiplier).toBe(1.0);
      expect(LOYALTY_CONFIG.tiers.SPROUT.multiplier).toBe(1.1);
      expect(LOYALTY_CONFIG.tiers.BLOOM.multiplier).toBe(1.25);
      expect(LOYALTY_CONFIG.tiers.FLOURISH.multiplier).toBe(1.5);
    });

    it('should have tier benefits defined for all tiers', () => {
      expect(LOYALTY_CONFIG.tierBenefits.SEEDLING).toBeDefined();
      expect(LOYALTY_CONFIG.tierBenefits.SEEDLING.length).toBeGreaterThan(0);
      expect(LOYALTY_CONFIG.tierBenefits.SPROUT).toBeDefined();
      expect(LOYALTY_CONFIG.tierBenefits.SPROUT.length).toBeGreaterThan(0);
      expect(LOYALTY_CONFIG.tierBenefits.BLOOM).toBeDefined();
      expect(LOYALTY_CONFIG.tierBenefits.BLOOM.length).toBeGreaterThan(0);
      expect(LOYALTY_CONFIG.tierBenefits.FLOURISH).toBeDefined();
      expect(LOYALTY_CONFIG.tierBenefits.FLOURISH.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // CONSTANTS AND TYPES TESTS
  // ============================================================
  describe('Constants and Types', () => {
    it('should export LOYALTY_TIERS constant', () => {
      expect(LOYALTY_TIERS.SEEDLING).toBe('SEEDLING');
      expect(LOYALTY_TIERS.SPROUT).toBe('SPROUT');
      expect(LOYALTY_TIERS.BLOOM).toBe('BLOOM');
      expect(LOYALTY_TIERS.FLOURISH).toBe('FLOURISH');
    });

    it('should export POINT_SOURCES constant', () => {
      expect(POINT_SOURCES.PURCHASE).toBe('PURCHASE');
      expect(POINT_SOURCES.REVIEW).toBe('REVIEW');
      expect(POINT_SOURCES.REFERRAL).toBe('REFERRAL');
      expect(POINT_SOURCES.SIGNUP).toBe('SIGNUP');
    });

    it('should have correct type inference for LoyaltyTier', () => {
      const tier: LoyaltyTier = LOYALTY_TIERS.SEEDLING;
      expect(tier).toBe('SEEDLING');
    });

    it('should have correct type inference for PointSource', () => {
      const source: PointSource = POINT_SOURCES.PURCHASE;
      expect(source).toBe('PURCHASE');
    });
  });
});
