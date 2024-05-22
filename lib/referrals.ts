import { prisma } from '@/lib/prisma';
import { getBaseUrl } from '@/lib/url';
import { randomBytes } from 'crypto';

/**
 * Referral Program Configuration
 */
export const REFERRAL_CONFIG = {
  // Default reward points for referrer when referee completes first order
  DEFAULT_REFERRER_REWARD: 200,
  // Default discount percentage for referee on first order
  DEFAULT_REFEREE_DISCOUNT: 10,
  // Referral code format prefix
  CODE_PREFIX: 'ECO',
  // Length of random part of code (excluding prefix)
  CODE_LENGTH: 6,
} as const;

/**
 * Referral status enum matching Prisma schema
 */
export const ReferralStatus = {
  PENDING: 'PENDING',       // Referral created but referee hasn't ordered yet
  COMPLETED: 'COMPLETED',   // Referee placed first order
  REWARDED: 'REWARDED',     // Referrer has been awarded points
  EXPIRED: 'EXPIRED',       // Referral expired without completion
} as const;

export type ReferralStatusType = typeof ReferralStatus[keyof typeof ReferralStatus];

/**
 * Generate a unique referral code
 * Format: ECO-XXXXXX where X is alphanumeric uppercase
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars: I, O, 0, 1
  const randomPart = Array.from(
    randomBytes(REFERRAL_CONFIG.CODE_LENGTH),
    (byte) => chars[byte % chars.length]
  ).join('');

  return `${REFERRAL_CONFIG.CODE_PREFIX}-${randomPart}`;
}

/**
 * Generate a username-based referral code if user has a name
 * Falls back to random code if name is not suitable
 */
export function generateUserBasedCode(userName: string | null): string {
  if (!userName) {
    return generateReferralCode();
  }

  // Clean up the name: remove special chars, take first word, uppercase
  const cleanName = userName
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .substring(0, 8);

  if (cleanName.length < 2) {
    return generateReferralCode();
  }

  // Add year and random suffix for uniqueness
  const year = new Date().getFullYear();
  const suffix = randomBytes(2).toString('hex').toUpperCase();

  return `${cleanName}${year}-${suffix}`;
}

/**
 * Validate referral code format
 */
export function isValidCodeFormat(code: string): boolean {
  // Accept both ECO-XXXXXX format and username-based formats
  const ecoFormat = /^ECO-[A-Z0-9]{6}$/;
  const userFormat = /^[A-Z0-9]{2,8}\d{4}-[A-F0-9]{4}$/;

  return ecoFormat.test(code) || userFormat.test(code);
}

/**
 * Get or create a user's referral code
 * Each user gets one default referral code that's stored on their profile
 */
export async function getUserReferralCode(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, name: true },
  });

  if (!user) return null;

  // If user already has a referral code, return it
  if (user.referralCode) {
    return user.referralCode;
  }

  // Generate and save a new referral code for the user
  let newCode: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    // Try username-based first, then fall back to random
    newCode = attempts === 0
      ? generateUserBasedCode(user.name)
      : generateReferralCode();

    // Check if code already exists
    const existing = await prisma.user.findUnique({
      where: { referralCode: newCode },
    });

    if (!existing) break;
    attempts++;
  } while (attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique referral code');
  }

  // Save the code to the user and create a ReferralCode entry
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { referralCode: newCode },
    }),
    prisma.referralCode.create({
      data: {
        code: newCode,
        ownerId: userId,
        isActive: true,
        discountPercent: REFERRAL_CONFIG.DEFAULT_REFEREE_DISCOUNT,
      },
    }),
  ]);

  return newCode;
}

/**
 * Validate a referral code and return its details
 */
export async function validateReferralCode(
  code: string,
  currentUserId?: string | null
): Promise<{
  valid: boolean;
  code?: string;
  discountPercent?: number;
  referrerId?: string;
  error?: string;
}> {
  const normalizedCode = code.trim().toUpperCase();

  // Find the referral code
  const referralCode = await prisma.referralCode.findUnique({
    where: { code: normalizedCode },
    include: {
      owner: {
        select: { id: true, name: true },
      },
    },
  });

  if (!referralCode) {
    return { valid: false, error: 'Invalid referral code' };
  }

  if (!referralCode.isActive) {
    return { valid: false, error: 'This referral code is no longer active' };
  }

  // Check usage limit
  if (referralCode.usageLimit !== null && referralCode.usageCount >= referralCode.usageLimit) {
    return { valid: false, error: 'This referral code has reached its usage limit' };
  }

  // Check if user is trying to use their own code
  if (currentUserId && referralCode.ownerId === currentUserId) {
    return { valid: false, error: 'You cannot use your own referral code' };
  }

  // Check if current user has already been referred
  if (currentUserId) {
    const existingReferral = await prisma.referral.findUnique({
      where: { refereeId: currentUserId },
    });

    if (existingReferral) {
      return { valid: false, error: 'You have already used a referral code' };
    }
  }

  return {
    valid: true,
    code: referralCode.code,
    discountPercent: referralCode.discountPercent,
    referrerId: referralCode.ownerId,
  };
}

/**
 * Apply a referral code when a new user signs up or at checkout
 */
export async function applyReferralCode(
  code: string,
  refereeId: string
): Promise<{
  success: boolean;
  referralId?: string;
  discountPercent?: number;
  error?: string;
}> {
  const validation = await validateReferralCode(code, refereeId);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const referralCode = await prisma.referralCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!referralCode) {
      return { success: false, error: 'Referral code not found' };
    }

    // Create the referral relationship
    const referral = await prisma.referral.create({
      data: {
        referrerId: referralCode.ownerId,
        refereeId: refereeId,
        referralCodeId: referralCode.id,
        status: ReferralStatus.PENDING,
        rewardPoints: REFERRAL_CONFIG.DEFAULT_REFERRER_REWARD,
      },
    });

    // Increment usage count
    await prisma.referralCode.update({
      where: { id: referralCode.id },
      data: { usageCount: { increment: 1 } },
    });

    return {
      success: true,
      referralId: referral.id,
      discountPercent: referralCode.discountPercent,
    };
  } catch (error) {
    // Handle unique constraint violation (user already referred)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, error: 'You have already used a referral code' };
    }
    throw error;
  }
}

/**
 * Complete a referral when referee places their first order
 * Awards points to the referrer
 */
export async function completeReferral(
  refereeId: string,
  orderId: string,
  orderAmount: number
): Promise<{
  success: boolean;
  referralId?: string;
  pointsAwarded?: number;
  discountApplied?: number;
  error?: string;
}> {
  // Find pending referral for this referee
  const referral = await prisma.referral.findUnique({
    where: { refereeId: refereeId },
    include: {
      referralCode: true,
    },
  });

  if (!referral) {
    // No referral for this user
    return { success: true };
  }

  if (referral.status !== ReferralStatus.PENDING) {
    // Already completed or expired
    return { success: true };
  }

  const discountPercent = referral.referralCode.discountPercent;
  const discountAmount = (orderAmount * discountPercent) / 100;
  const now = new Date();

  // Complete the referral and mark as rewarded
  // Note: Points awarding is handled separately if loyalty system exists
  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      status: ReferralStatus.REWARDED,
      refereeOrderId: orderId,
      discountApplied: discountAmount,
      completedAt: now,
      rewardedAt: now,
    },
  });

  return {
    success: true,
    referralId: referral.id,
    pointsAwarded: referral.rewardPoints,
    discountApplied: discountAmount,
  };
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(userId: string): Promise<{
  referralCode: string | null;
  totalReferred: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalPointsEarned: number;
  referralLink: string;
}> {
  const [user, referrals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    }),
    prisma.referral.findMany({
      where: { referrerId: userId },
      select: { status: true, rewardPoints: true },
    }),
  ]);

  // Calculate points earned from rewarded referrals
  const totalPointsEarned = referrals
    .filter(r => r.status === ReferralStatus.REWARDED)
    .reduce((sum, r) => sum + r.rewardPoints, 0);

  const referralCode = user?.referralCode || await getUserReferralCode(userId);
  const baseUrl = getBaseUrl();

  return {
    referralCode,
    totalReferred: referrals.length,
    pendingReferrals: referrals.filter(r => r.status === ReferralStatus.PENDING).length,
    completedReferrals: referrals.filter(
      r => r.status === ReferralStatus.COMPLETED || r.status === ReferralStatus.REWARDED
    ).length,
    totalPointsEarned,
    referralLink: `${baseUrl}?ref=${referralCode}`,
  };
}

/**
 * Get list of referrals for a user (as referrer)
 */
export async function getUserReferrals(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{
  referrals: Array<{
    id: string;
    refereeName: string | null;
    status: string;
    rewardPoints: number;
    discountApplied: number | null;
    createdAt: Date;
    completedAt: Date | null;
  }>;
  total: number;
}> {
  const [referrals, total] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referee: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.referral.count({
      where: { referrerId: userId },
    }),
  ]);

  return {
    referrals: referrals.map(r => ({
      id: r.id,
      refereeName: r.referee.name || r.referee.email.split('@')[0],
      status: r.status,
      rewardPoints: r.rewardPoints,
      discountApplied: r.discountApplied ? Number(r.discountApplied) : null,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
    })),
    total,
  };
}

/**
 * Check if a user has a pending referral discount to apply
 */
export async function getPendingReferralDiscount(
  userId: string
): Promise<{
  hasDiscount: boolean;
  discountPercent?: number;
  referralId?: string;
}> {
  const referral = await prisma.referral.findUnique({
    where: { refereeId: userId },
    include: {
      referralCode: {
        select: { discountPercent: true },
      },
    },
  });

  if (!referral || referral.status !== ReferralStatus.PENDING) {
    return { hasDiscount: false };
  }

  return {
    hasDiscount: true,
    discountPercent: referral.referralCode.discountPercent,
    referralId: referral.id,
  };
}

/**
 * Generate share links for social media
 */
export function generateShareLinks(referralCode: string, referralLink: string): {
  email: string;
  facebook: string;
  twitter: string;
  copy: string;
} {
  const message = `Join Link Flame and get 10% off your first order with my referral code: ${referralCode}`;
  const encodedMessage = encodeURIComponent(message);
  const encodedLink = encodeURIComponent(referralLink);

  return {
    email: `mailto:?subject=${encodeURIComponent('Get 10% off at Link Flame!')}&body=${encodeURIComponent(`Hey!\n\nI thought you might like Link Flame - they have amazing eco-friendly products. Use my referral code to get 10% off your first order!\n\nCode: ${referralCode}\nLink: ${referralLink}\n\nHappy shopping!`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encodedMessage}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`,
    copy: referralLink,
  };
}
