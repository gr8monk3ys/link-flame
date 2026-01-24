/**
 * Loyalty Program Utilities
 *
 * Handles all loyalty point calculations, tier management, and redemption logic.
 * This module provides business logic for the Link Flame rewards program.
 *
 * Points Structure:
 * - 1 point per $1 spent on purchases
 * - 50 points for writing a review
 * - 200 points for successful referral
 * - 100 points for signup bonus
 *
 * Redemption:
 * - 100 points = $1 discount
 *
 * Tiers:
 * - SEEDLING: 0-499 lifetime points (1x multiplier)
 * - SPROUT: 500-1499 lifetime points (1.1x multiplier)
 * - BLOOM: 1500-2999 lifetime points (1.25x multiplier)
 * - FLOURISH: 3000+ lifetime points (1.5x multiplier)
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Loyalty tier definitions
 */
export const LOYALTY_TIERS = {
  SEEDLING: "SEEDLING",
  SPROUT: "SPROUT",
  BLOOM: "BLOOM",
  FLOURISH: "FLOURISH",
} as const;

export type LoyaltyTier = (typeof LOYALTY_TIERS)[keyof typeof LOYALTY_TIERS];

/**
 * Point source definitions
 */
export const POINT_SOURCES = {
  PURCHASE: "PURCHASE",
  REVIEW: "REVIEW",
  REFERRAL: "REFERRAL",
  SIGNUP: "SIGNUP",
} as const;

export type PointSource = (typeof POINT_SOURCES)[keyof typeof POINT_SOURCES];

/**
 * Points configuration
 */
export const LOYALTY_CONFIG = {
  // Points earned per action
  pointsPerDollar: 1,
  reviewPoints: 50,
  referralPoints: 200,
  signupBonus: 100,

  // Redemption rate: 100 points = $1
  pointsPerDollarDiscount: 100,

  // Tier thresholds (lifetime points)
  tiers: {
    SEEDLING: { min: 0, max: 499, multiplier: 1.0, name: "Seedling" },
    SPROUT: { min: 500, max: 1499, multiplier: 1.1, name: "Sprout" },
    BLOOM: { min: 1500, max: 2999, multiplier: 1.25, name: "Bloom" },
    FLOURISH: { min: 3000, max: Infinity, multiplier: 1.5, name: "Flourish" },
  },

  // Tier benefits
  tierBenefits: {
    SEEDLING: ["Earn 1 point per $1 spent", "Member-exclusive offers"],
    SPROUT: ["Earn 1.1x points on purchases", "Early access to sales", "Free shipping on orders $50+"],
    BLOOM: ["Earn 1.25x points on purchases", "Free shipping on all orders", "Birthday bonus points"],
    FLOURISH: ["Earn 1.5x points on purchases", "Free express shipping", "Exclusive products", "VIP support"],
  },
} as const;

/**
 * Calculate tier from lifetime points
 */
export function calculateTier(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= LOYALTY_CONFIG.tiers.FLOURISH.min) {
    return LOYALTY_TIERS.FLOURISH;
  }
  if (lifetimePoints >= LOYALTY_CONFIG.tiers.BLOOM.min) {
    return LOYALTY_TIERS.BLOOM;
  }
  if (lifetimePoints >= LOYALTY_CONFIG.tiers.SPROUT.min) {
    return LOYALTY_TIERS.SPROUT;
  }
  return LOYALTY_TIERS.SEEDLING;
}

/**
 * Get tier info for a given tier
 */
export function getTierInfo(tier: LoyaltyTier) {
  return {
    ...LOYALTY_CONFIG.tiers[tier],
    tier,
    benefits: LOYALTY_CONFIG.tierBenefits[tier],
  };
}

/**
 * Calculate points needed for next tier
 */
export function getPointsToNextTier(lifetimePoints: number): { nextTier: LoyaltyTier | null; pointsNeeded: number } {
  const currentTier = calculateTier(lifetimePoints);

  if (currentTier === LOYALTY_TIERS.FLOURISH) {
    return { nextTier: null, pointsNeeded: 0 };
  }

  if (currentTier === LOYALTY_TIERS.BLOOM) {
    return {
      nextTier: LOYALTY_TIERS.FLOURISH,
      pointsNeeded: LOYALTY_CONFIG.tiers.FLOURISH.min - lifetimePoints,
    };
  }

  if (currentTier === LOYALTY_TIERS.SPROUT) {
    return {
      nextTier: LOYALTY_TIERS.BLOOM,
      pointsNeeded: LOYALTY_CONFIG.tiers.BLOOM.min - lifetimePoints,
    };
  }

  return {
    nextTier: LOYALTY_TIERS.SPROUT,
    pointsNeeded: LOYALTY_CONFIG.tiers.SPROUT.min - lifetimePoints,
  };
}

/**
 * Calculate purchase points with tier multiplier
 */
export function calculatePurchasePoints(orderTotal: number, tier: LoyaltyTier): number {
  const basePoints = Math.floor(orderTotal * LOYALTY_CONFIG.pointsPerDollar);
  const multiplier = LOYALTY_CONFIG.tiers[tier].multiplier;
  return Math.floor(basePoints * multiplier);
}

/**
 * Calculate discount amount from points
 */
export function calculateDiscountFromPoints(points: number): number {
  return points / LOYALTY_CONFIG.pointsPerDollarDiscount;
}

/**
 * Calculate points needed for a specific discount
 */
export function calculatePointsForDiscount(discountAmount: number): number {
  return Math.ceil(discountAmount * LOYALTY_CONFIG.pointsPerDollarDiscount);
}

/**
 * Get user's current available points (earned minus redeemed)
 */
export async function getUserAvailablePoints(userId: string): Promise<number> {
  // Get total earned points
  const earnedPoints = await prisma.loyaltyPoints.aggregate({
    where: {
      userId,
      // Only count non-expired points
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    _sum: {
      points: true,
    },
  });

  // Get total redeemed points
  const redeemedPoints = await prisma.loyaltyRedemption.aggregate({
    where: {
      userId,
      status: "applied",
    },
    _sum: {
      pointsUsed: true,
    },
  });

  const earned = earnedPoints._sum.points || 0;
  const redeemed = redeemedPoints._sum.pointsUsed || 0;

  return Math.max(0, earned - redeemed);
}

/**
 * Get user's loyalty summary (points, tier, progress)
 */
export async function getUserLoyaltySummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      loyaltyTier: true,
      totalLifetimePoints: true,
    },
  });

  if (!user) {
    return null;
  }

  const availablePoints = await getUserAvailablePoints(userId);
  const tier = user.loyaltyTier as LoyaltyTier;
  const tierInfo = getTierInfo(tier);
  const nextTierInfo = getPointsToNextTier(user.totalLifetimePoints);

  return {
    availablePoints,
    lifetimePoints: user.totalLifetimePoints,
    tier,
    tierInfo,
    nextTier: nextTierInfo.nextTier,
    pointsToNextTier: nextTierInfo.pointsNeeded,
    maxDiscount: calculateDiscountFromPoints(availablePoints),
  };
}

/**
 * Award points to a user
 */
export async function awardPoints(params: {
  userId: string;
  points: number;
  source: PointSource;
  orderId?: string;
  reviewId?: string;
  referralId?: string;
  description?: string;
}): Promise<{ success: boolean; pointsAwarded: number; newTotal: number; tierChanged: boolean; newTier?: LoyaltyTier }> {
  const { userId, points, source, orderId, reviewId, referralId, description } = params;

  try {
    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        loyaltyTier: true,
        totalLifetimePoints: true,
      },
    });

    if (!user) {
      logger.error("User not found for awarding points", { userId });
      return { success: false, pointsAwarded: 0, newTotal: 0, tierChanged: false };
    }

    const currentTier = user.loyaltyTier as LoyaltyTier;
    const newLifetimePoints = user.totalLifetimePoints + points;
    const newTier = calculateTier(newLifetimePoints);
    const tierChanged = currentTier !== newTier;

    // Create points record and update user in transaction
    await prisma.$transaction([
      prisma.loyaltyPoints.create({
        data: {
          userId,
          points,
          source,
          orderId,
          reviewId,
          referralId,
          description: description || `${source} points`,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          totalLifetimePoints: newLifetimePoints,
          loyaltyTier: newTier,
        },
      }),
    ]);

    logger.info("Points awarded successfully", {
      userId,
      points,
      source,
      newTotal: newLifetimePoints,
      tierChanged,
      newTier: tierChanged ? newTier : undefined,
    });

    return {
      success: true,
      pointsAwarded: points,
      newTotal: newLifetimePoints,
      tierChanged,
      newTier: tierChanged ? newTier : undefined,
    };
  } catch (error) {
    logger.error("Failed to award points", error, { userId, points, source });
    return { success: false, pointsAwarded: 0, newTotal: 0, tierChanged: false };
  }
}

/**
 * Award signup bonus points to a new user
 */
export async function awardSignupBonus(userId: string): Promise<boolean> {
  // Check if user already received signup bonus
  const existingBonus = await prisma.loyaltyPoints.findFirst({
    where: {
      userId,
      source: POINT_SOURCES.SIGNUP,
    },
  });

  if (existingBonus) {
    logger.info("User already received signup bonus", { userId });
    return false;
  }

  const result = await awardPoints({
    userId,
    points: LOYALTY_CONFIG.signupBonus,
    source: POINT_SOURCES.SIGNUP,
    description: "Welcome bonus for joining Link Flame!",
  });

  return result.success;
}

/**
 * Award points for a purchase
 */
export async function awardPurchasePoints(userId: string, orderId: string, orderTotal: number): Promise<{ success: boolean; pointsAwarded: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loyaltyTier: true },
  });

  if (!user) {
    return { success: false, pointsAwarded: 0 };
  }

  const tier = user.loyaltyTier as LoyaltyTier;
  const points = calculatePurchasePoints(orderTotal, tier);

  if (points <= 0) {
    return { success: true, pointsAwarded: 0 };
  }

  const result = await awardPoints({
    userId,
    points,
    source: POINT_SOURCES.PURCHASE,
    orderId,
    description: `Purchase reward - $${orderTotal.toFixed(2)} order`,
  });

  return { success: result.success, pointsAwarded: result.pointsAwarded };
}

/**
 * Award points for writing a review
 */
export async function awardReviewPoints(userId: string, reviewId: string): Promise<boolean> {
  // Check if points were already awarded for this review
  const existingPoints = await prisma.loyaltyPoints.findFirst({
    where: {
      userId,
      reviewId,
      source: POINT_SOURCES.REVIEW,
    },
  });

  if (existingPoints) {
    logger.info("Points already awarded for this review", { userId, reviewId });
    return false;
  }

  const result = await awardPoints({
    userId,
    points: LOYALTY_CONFIG.reviewPoints,
    source: POINT_SOURCES.REVIEW,
    reviewId,
    description: "Thank you for your review!",
  });

  return result.success;
}

/**
 * Award referral points
 */
export async function awardReferralPoints(userId: string, referralId: string): Promise<boolean> {
  // Check if points were already awarded for this referral
  const existingPoints = await prisma.loyaltyPoints.findFirst({
    where: {
      userId,
      referralId,
      source: POINT_SOURCES.REFERRAL,
    },
  });

  if (existingPoints) {
    logger.info("Points already awarded for this referral", { userId, referralId });
    return false;
  }

  const result = await awardPoints({
    userId,
    points: LOYALTY_CONFIG.referralPoints,
    source: POINT_SOURCES.REFERRAL,
    referralId,
    description: "Thank you for referring a friend!",
  });

  return result.success;
}

/**
 * Redeem points for a discount
 */
export async function redeemPoints(params: {
  userId: string;
  pointsToRedeem: number;
  orderId?: string;
}): Promise<{ success: boolean; discountAmount: number; remainingPoints: number; error?: string }> {
  const { userId, pointsToRedeem, orderId } = params;

  try {
    // Validate points to redeem
    if (pointsToRedeem <= 0) {
      return { success: false, discountAmount: 0, remainingPoints: 0, error: "Points to redeem must be positive" };
    }

    // Get available points
    const availablePoints = await getUserAvailablePoints(userId);

    if (pointsToRedeem > availablePoints) {
      return {
        success: false,
        discountAmount: 0,
        remainingPoints: availablePoints,
        error: `Insufficient points. You have ${availablePoints} available.`,
      };
    }

    const discountAmount = calculateDiscountFromPoints(pointsToRedeem);

    // Create redemption record
    await prisma.loyaltyRedemption.create({
      data: {
        userId,
        pointsUsed: pointsToRedeem,
        discount: discountAmount,
        discountAmount,
        orderId,
        status: "applied",
      },
    });

    const remainingPoints = availablePoints - pointsToRedeem;

    logger.info("Points redeemed successfully", {
      userId,
      pointsRedeemed: pointsToRedeem,
      discountAmount,
      remainingPoints,
    });

    return {
      success: true,
      discountAmount,
      remainingPoints,
    };
  } catch (error) {
    logger.error("Failed to redeem points", error, { userId, pointsToRedeem });
    return {
      success: false,
      discountAmount: 0,
      remainingPoints: 0,
      error: "Failed to redeem points. Please try again.",
    };
  }
}

/**
 * Get user's point history (paginated)
 */
export async function getUserPointHistory(
  userId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{
  transactions: Array<{
    id: string;
    type: "earned" | "redeemed";
    points: number;
    source?: string;
    description?: string | null;
    orderId?: string | null;
    date: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // Get earned points
  const [earnedPoints, earnedCount] = await Promise.all([
    prisma.loyaltyPoints.findMany({
      where: { userId },
      orderBy: { earnedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.loyaltyPoints.count({ where: { userId } }),
  ]);

  // Get redemptions
  const [redemptions, redemptionsCount] = await Promise.all([
    prisma.loyaltyRedemption.findMany({
      where: { userId },
      orderBy: { redeemedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.loyaltyRedemption.count({ where: { userId } }),
  ]);

  // Combine and sort transactions
  const allTransactions: Array<{
    id: string;
    type: "earned" | "redeemed";
    points: number;
    source?: string;
    description?: string | null;
    orderId?: string | null;
    date: Date;
  }> = [
    ...earnedPoints.map((p) => ({
      id: p.id,
      type: "earned" as const,
      points: p.points,
      source: p.source,
      description: p.description,
      orderId: p.orderId,
      date: p.earnedAt,
    })),
    ...redemptions.map((r) => ({
      id: r.id,
      type: "redeemed" as const,
      points: -r.pointsUsed,
      source: undefined as string | undefined,
      description: `Redeemed for $${r.discountAmount.toFixed(2)} discount`,
      orderId: r.orderId,
      date: r.redeemedAt,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const total = earnedCount + redemptionsCount;

  return {
    transactions: allTransactions.slice(0, limit),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
