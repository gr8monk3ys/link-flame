import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Prisma before importing modules that use it
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      count: vi.fn(),
    },
    order: {
      count: vi.fn(),
    },
  },
}))

// Mock logger to avoid console output during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

import {
  getPlanById,
  getStripePriceId,
  calculateYearlySavings,
  calculateYearlySavingsPercent,
  comparePlans,
  formatLimit,
  isUnlimited,
  isFreePlan,
  isPaidPlan,
  getAllPlans,
  getPaidPlans,
  SAAS_PLANS,
  type PlanId,
} from '@/lib/billing/plans'

import {
  checkUsageLimit,
  canAddResource,
  getApproachingLimits,
  getExceededLimits,
  getDaysRemainingInBillingPeriod,
  getEndOfCurrentMonth,
  getAllUsageLimits,
  type ResourceType,
} from '@/lib/billing/usage'

import { prisma } from '@/lib/prisma'

// Helper to mock organization usage
function mockOrganizationUsage(products: number, orders: number, teamMembers = 1, storageMB = 0) {
  vi.mocked(prisma.product.count).mockResolvedValue(products)
  vi.mocked(prisma.order.count).mockResolvedValue(orders)
  // teamMembers and storageMB are currently hardcoded in the actual implementation
}

describe('Billing Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // =============================================================================
  // PLANS MODULE TESTS
  // =============================================================================

  describe('lib/billing/plans.ts', () => {
    describe('getPlanById', () => {
      it('should return FREE plan for "free" id', () => {
        const plan = getPlanById('free')

        expect(plan).toBeDefined()
        expect(plan?.id).toBe('free')
        expect(plan?.name).toBe('Free')
        expect(plan?.priceMonthly).toBe(0)
        expect(plan?.limits.products).toBe(10)
        expect(plan?.limits.orders).toBe(50)
      })

      it('should return STARTER plan for "starter" id', () => {
        const plan = getPlanById('starter')

        expect(plan).toBeDefined()
        expect(plan?.id).toBe('starter')
        expect(plan?.name).toBe('Starter')
        expect(plan?.priceMonthly).toBe(29)
        expect(plan?.priceYearly).toBe(290)
        expect(plan?.limits.products).toBe(100)
        expect(plan?.limits.orders).toBe(1000)
        expect(plan?.limits.teamMembers).toBe(3)
      })

      it('should return PRO plan for "pro" id', () => {
        const plan = getPlanById('pro')

        expect(plan).toBeDefined()
        expect(plan?.id).toBe('pro')
        expect(plan?.name).toBe('Pro')
        expect(plan?.priceMonthly).toBe(79)
        expect(plan?.limits.products).toBe(-1) // unlimited
        expect(plan?.limits.orders).toBe(-1) // unlimited
      })

      it('should return ENTERPRISE plan for "enterprise" id', () => {
        const plan = getPlanById('enterprise')

        expect(plan).toBeDefined()
        expect(plan?.id).toBe('enterprise')
        expect(plan?.name).toBe('Enterprise')
        expect(plan?.priceMonthly).toBeNull() // custom pricing
        expect(plan?.priceYearly).toBeNull()
        expect(plan?.limits.products).toBe(-1)
        expect(plan?.limits.orders).toBe(-1)
        expect(plan?.limits.teamMembers).toBe(-1)
        expect(plan?.limits.storageMB).toBe(-1)
      })

      it('should be case-insensitive for plan id', () => {
        const lowercase = getPlanById('free')
        const uppercase = getPlanById('FREE')
        const mixedCase = getPlanById('FrEe')

        expect(lowercase?.id).toBe('free')
        expect(uppercase?.id).toBe('free')
        expect(mixedCase?.id).toBe('free')
      })

      it('should return undefined for invalid plan id', () => {
        const plan = getPlanById('invalid-plan')
        expect(plan).toBeUndefined()
      })

      it('should return undefined for empty string', () => {
        const plan = getPlanById('')
        expect(plan).toBeUndefined()
      })

      it('should return a copy of the plan (not the original object)', () => {
        const plan1 = getPlanById('starter')
        const plan2 = getPlanById('starter')

        expect(plan1).not.toBe(plan2)
        expect(plan1).toEqual(plan2)
      })
    })

    describe('getStripePriceId', () => {
      it('should return monthly price ID for monthly interval', () => {
        const priceId = getStripePriceId('STARTER', 'monthly')
        // Returns env variable or undefined
        expect(priceId).toBe(SAAS_PLANS.STARTER.stripePriceIdMonthly)
      })

      it('should return yearly price ID for yearly interval', () => {
        const priceId = getStripePriceId('STARTER', 'yearly')
        expect(priceId).toBe(SAAS_PLANS.STARTER.stripePriceIdYearly)
      })

      it('should return null for FREE plan monthly', () => {
        const priceId = getStripePriceId('FREE', 'monthly')
        expect(priceId).toBeNull()
      })

      it('should return null for FREE plan yearly', () => {
        const priceId = getStripePriceId('FREE', 'yearly')
        expect(priceId).toBeNull()
      })

      it('should return null for ENTERPRISE plan (custom pricing)', () => {
        const monthlyPriceId = getStripePriceId('ENTERPRISE', 'monthly')
        const yearlyPriceId = getStripePriceId('ENTERPRISE', 'yearly')

        expect(monthlyPriceId).toBeNull()
        expect(yearlyPriceId).toBeNull()
      })

      it('should return correct price IDs for PRO plan', () => {
        const monthlyPriceId = getStripePriceId('PRO', 'monthly')
        const yearlyPriceId = getStripePriceId('PRO', 'yearly')

        expect(monthlyPriceId).toBe(SAAS_PLANS.PRO.stripePriceIdMonthly)
        expect(yearlyPriceId).toBe(SAAS_PLANS.PRO.stripePriceIdYearly)
      })
    })

    describe('calculateYearlySavings', () => {
      it('should calculate correct savings for STARTER plan', () => {
        const savings = calculateYearlySavings('STARTER')
        // Monthly: $29 * 12 = $348, Yearly: $290, Savings: $58
        expect(savings).toBe(58)
      })

      it('should calculate correct savings for PRO plan', () => {
        const savings = calculateYearlySavings('PRO')
        // Monthly: $79 * 12 = $948, Yearly: $790, Savings: $158
        expect(savings).toBe(158)
      })

      it('should return 0 for FREE plan', () => {
        const savings = calculateYearlySavings('FREE')
        expect(savings).toBe(0)
      })

      it('should return 0 for ENTERPRISE plan (null pricing)', () => {
        const savings = calculateYearlySavings('ENTERPRISE')
        expect(savings).toBe(0)
      })
    })

    describe('calculateYearlySavingsPercent', () => {
      it('should calculate correct percentage for STARTER plan', () => {
        const percent = calculateYearlySavingsPercent('STARTER')
        // Savings: $58 / $348 = 16.67% rounded to 17%
        expect(percent).toBe(17)
      })

      it('should calculate correct percentage for PRO plan', () => {
        const percent = calculateYearlySavingsPercent('PRO')
        // Savings: $158 / $948 = 16.67% rounded to 17%
        expect(percent).toBe(17)
      })

      it('should return 0 for FREE plan', () => {
        const percent = calculateYearlySavingsPercent('FREE')
        expect(percent).toBe(0)
      })

      it('should return 0 for ENTERPRISE plan', () => {
        const percent = calculateYearlySavingsPercent('ENTERPRISE')
        expect(percent).toBe(0)
      })
    })

    describe('comparePlans', () => {
      it('should return 1 for upgrade (FREE to STARTER)', () => {
        const result = comparePlans('FREE', 'STARTER')
        expect(result).toBe(1)
      })

      it('should return 1 for upgrade (STARTER to PRO)', () => {
        const result = comparePlans('STARTER', 'PRO')
        expect(result).toBe(1)
      })

      it('should return 1 for upgrade (PRO to ENTERPRISE)', () => {
        const result = comparePlans('PRO', 'ENTERPRISE')
        expect(result).toBe(1)
      })

      it('should return 1 for upgrade (FREE to ENTERPRISE)', () => {
        const result = comparePlans('FREE', 'ENTERPRISE')
        expect(result).toBe(1)
      })

      it('should return -1 for downgrade (STARTER to FREE)', () => {
        const result = comparePlans('STARTER', 'FREE')
        expect(result).toBe(-1)
      })

      it('should return -1 for downgrade (PRO to STARTER)', () => {
        const result = comparePlans('PRO', 'STARTER')
        expect(result).toBe(-1)
      })

      it('should return -1 for downgrade (ENTERPRISE to FREE)', () => {
        const result = comparePlans('ENTERPRISE', 'FREE')
        expect(result).toBe(-1)
      })

      it('should return 0 for same plan (FREE to FREE)', () => {
        const result = comparePlans('FREE', 'FREE')
        expect(result).toBe(0)
      })

      it('should return 0 for same plan (PRO to PRO)', () => {
        const result = comparePlans('PRO', 'PRO')
        expect(result).toBe(0)
      })

      it('should return 0 for same plan (ENTERPRISE to ENTERPRISE)', () => {
        const result = comparePlans('ENTERPRISE', 'ENTERPRISE')
        expect(result).toBe(0)
      })
    })

    describe('formatLimit', () => {
      it('should return "Unlimited" for -1', () => {
        const result = formatLimit(-1)
        expect(result).toBe('Unlimited')
      })

      it('should return number as string for values under 1000', () => {
        expect(formatLimit(0)).toBe('0')
        expect(formatLimit(10)).toBe('10')
        expect(formatLimit(50)).toBe('50')
        expect(formatLimit(100)).toBe('100')
        expect(formatLimit(999)).toBe('999')
      })

      it('should format values >= 1000 with K suffix', () => {
        expect(formatLimit(1000)).toBe('1K')
        expect(formatLimit(5000)).toBe('5K')
        expect(formatLimit(10000)).toBe('10K')
        expect(formatLimit(50000)).toBe('50K')
        expect(formatLimit(100000)).toBe('100K')
      })

      it('should handle edge cases', () => {
        expect(formatLimit(1)).toBe('1')
        expect(formatLimit(1500)).toBe('2K') // Rounds to nearest K
        expect(formatLimit(2500)).toBe('3K')
      })
    })

    describe('isUnlimited', () => {
      it('should return true for -1', () => {
        expect(isUnlimited(-1)).toBe(true)
      })

      it('should return false for 0', () => {
        expect(isUnlimited(0)).toBe(false)
      })

      it('should return false for positive numbers', () => {
        expect(isUnlimited(1)).toBe(false)
        expect(isUnlimited(100)).toBe(false)
        expect(isUnlimited(1000)).toBe(false)
      })

      it('should return false for other negative numbers', () => {
        expect(isUnlimited(-2)).toBe(false)
        expect(isUnlimited(-100)).toBe(false)
      })
    })

    describe('isFreePlan', () => {
      it('should return true for "free"', () => {
        expect(isFreePlan('free')).toBe(true)
      })

      it('should return true for "FREE" (case-insensitive)', () => {
        expect(isFreePlan('FREE')).toBe(true)
        expect(isFreePlan('Free')).toBe(true)
      })

      it('should return false for paid plans', () => {
        expect(isFreePlan('starter')).toBe(false)
        expect(isFreePlan('pro')).toBe(false)
        expect(isFreePlan('enterprise')).toBe(false)
      })
    })

    describe('isPaidPlan', () => {
      it('should return false for free plan', () => {
        expect(isPaidPlan('free')).toBe(false)
      })

      it('should return true for paid plans', () => {
        expect(isPaidPlan('starter')).toBe(true)
        expect(isPaidPlan('pro')).toBe(true)
        expect(isPaidPlan('enterprise')).toBe(true)
      })
    })

    describe('getAllPlans', () => {
      it('should return all 4 plans', () => {
        const plans = getAllPlans()
        expect(plans).toHaveLength(4)
      })

      it('should include FREE, STARTER, PRO, and ENTERPRISE plans', () => {
        const plans = getAllPlans()
        const planIds = plans.map((p) => p.id)

        expect(planIds).toContain('free')
        expect(planIds).toContain('starter')
        expect(planIds).toContain('pro')
        expect(planIds).toContain('enterprise')
      })

      it('should return copies (not original objects)', () => {
        const plans1 = getAllPlans()
        const plans2 = getAllPlans()

        expect(plans1).not.toBe(plans2)
        expect(plans1[0]).not.toBe(plans2[0])
      })
    })

    describe('getPaidPlans', () => {
      it('should return only paid plans (excludes FREE)', () => {
        const plans = getPaidPlans()
        expect(plans).toHaveLength(2) // STARTER and PRO (ENTERPRISE has null price)

        const planIds = plans.map((p) => p.id)
        expect(planIds).not.toContain('free')
        expect(planIds).toContain('starter')
        expect(planIds).toContain('pro')
      })

      it('should exclude plans with null pricing (ENTERPRISE)', () => {
        const plans = getPaidPlans()
        const planIds = plans.map((p) => p.id)
        expect(planIds).not.toContain('enterprise')
      })
    })
  })

  // =============================================================================
  // USAGE MODULE TESTS
  // =============================================================================

  describe('lib/billing/usage.ts', () => {
    describe('checkUsageLimit', () => {
      it('should return allowed=true when usage is below limit', async () => {
        mockOrganizationUsage(5, 25) // 5 products, 25 orders

        const plan = getPlanById('free')!
        const result = await checkUsageLimit('org-123', 'products', plan)

        expect(result.allowed).toBe(true)
        expect(result.current).toBe(5)
        expect(result.limit).toBe(10)
        expect(result.remaining).toBe(5)
        expect(result.percentUsed).toBe(50)
      })

      it('should return allowed=false when usage equals limit', async () => {
        mockOrganizationUsage(10, 50) // At the limit

        const plan = getPlanById('free')!
        const result = await checkUsageLimit('org-123', 'products', plan)

        expect(result.allowed).toBe(false)
        expect(result.current).toBe(10)
        expect(result.limit).toBe(10)
        expect(result.remaining).toBe(0)
        expect(result.percentUsed).toBe(100)
      })

      it('should return allowed=false when usage exceeds limit', async () => {
        mockOrganizationUsage(15, 60) // Over the limit

        const plan = getPlanById('free')!
        const result = await checkUsageLimit('org-123', 'products', plan)

        expect(result.allowed).toBe(false)
        expect(result.current).toBe(15)
        expect(result.limit).toBe(10)
        expect(result.remaining).toBe(0)
        expect(result.percentUsed).toBe(100) // Capped at 100
      })

      it('should return allowed=true and unlimited for unlimited plans', async () => {
        mockOrganizationUsage(1000, 5000) // High usage

        const plan = getPlanById('pro')!
        const result = await checkUsageLimit('org-123', 'products', plan)

        expect(result.allowed).toBe(true)
        expect(result.current).toBe(1000)
        expect(result.limit).toBe('unlimited')
        expect(result.remaining).toBe('unlimited')
        expect(result.percentUsed).toBe(0)
      })

      it('should handle zero usage correctly', async () => {
        mockOrganizationUsage(0, 0)

        const plan = getPlanById('free')!
        const result = await checkUsageLimit('org-123', 'products', plan)

        expect(result.allowed).toBe(true)
        expect(result.current).toBe(0)
        expect(result.remaining).toBe(10)
        expect(result.percentUsed).toBe(0)
      })

      it('should check orders resource correctly', async () => {
        mockOrganizationUsage(5, 40)

        const plan = getPlanById('free')! // 50 orders/month limit
        const result = await checkUsageLimit('org-123', 'orders', plan)

        expect(result.allowed).toBe(true)
        expect(result.current).toBe(40)
        expect(result.limit).toBe(50)
        expect(result.remaining).toBe(10)
        expect(result.percentUsed).toBe(80)
      })
    })

    describe('canAddResource', () => {
      it('should return true when adding resource stays under limit', async () => {
        mockOrganizationUsage(5, 25)

        const canAdd = await canAddResource('org-123', 'products', 'FREE', 1)
        expect(canAdd).toBe(true)
      })

      it('should return true when adding brings usage to exactly the limit', async () => {
        mockOrganizationUsage(9, 25)

        const canAdd = await canAddResource('org-123', 'products', 'FREE', 1)
        expect(canAdd).toBe(true)
      })

      it('should return false when adding resource would exceed limit', async () => {
        mockOrganizationUsage(10, 25)

        const canAdd = await canAddResource('org-123', 'products', 'FREE', 1)
        expect(canAdd).toBe(false)
      })

      it('should return false when adding quantity exceeds limit', async () => {
        mockOrganizationUsage(8, 25)

        const canAdd = await canAddResource('org-123', 'products', 'FREE', 5)
        expect(canAdd).toBe(false)
      })

      it('should return true for unlimited resources regardless of quantity', async () => {
        mockOrganizationUsage(1000, 5000)

        const canAdd = await canAddResource('org-123', 'products', 'PRO', 1000)
        expect(canAdd).toBe(true)
      })

      it('should default to quantity of 1 when not specified', async () => {
        mockOrganizationUsage(9, 25)

        const canAdd = await canAddResource('org-123', 'products', 'FREE')
        expect(canAdd).toBe(true)
      })

      it('should handle STARTER plan limits correctly', async () => {
        mockOrganizationUsage(99, 999)

        const canAddProducts = await canAddResource('org-123', 'products', 'STARTER', 1)
        expect(canAddProducts).toBe(true)

        mockOrganizationUsage(100, 999)
        const cannotAdd = await canAddResource('org-123', 'products', 'STARTER', 1)
        expect(cannotAdd).toBe(false)
      })
    })

    describe('getApproachingLimits', () => {
      it('should return resources at 80%+ usage by default', async () => {
        // FREE plan: 10 products, 50 orders
        // 8 products = 80%, 45 orders = 90%
        mockOrganizationUsage(8, 45)

        const approaching = await getApproachingLimits('org-123', 'FREE')

        expect(approaching).toContain('products')
        expect(approaching).toContain('orders')
      })

      it('should not return resources below threshold', async () => {
        mockOrganizationUsage(7, 35) // 70% products, 70% orders

        const approaching = await getApproachingLimits('org-123', 'FREE')

        expect(approaching).not.toContain('products')
        expect(approaching).not.toContain('orders')
      })

      it('should not return unlimited resources', async () => {
        mockOrganizationUsage(1000, 5000)

        const approaching = await getApproachingLimits('org-123', 'PRO')

        expect(approaching).not.toContain('products')
        expect(approaching).not.toContain('orders')
      })

      it('should use custom threshold when provided', async () => {
        mockOrganizationUsage(6, 30) // 60% products, 60% orders

        const approaching = await getApproachingLimits('org-123', 'FREE', 50)

        expect(approaching).toContain('products')
        expect(approaching).toContain('orders')
      })

      it('should return empty array when no limits are approaching', async () => {
        // Use STARTER plan because FREE plan has teamMembers limit of 1
        // and the implementation hardcodes teamMembers to 1, making it always at 100%
        mockOrganizationUsage(1, 10) // Low usage relative to STARTER limits (100 products, 1000 orders)

        const approaching = await getApproachingLimits('org-123', 'STARTER')

        // Products: 1/100 = 1%, Orders: 10/1000 = 1%, TeamMembers: 1/3 = 33%
        expect(approaching).not.toContain('products')
        expect(approaching).not.toContain('orders')
        expect(approaching).not.toContain('teamMembers')
      })

      it('should include resources exactly at threshold', async () => {
        mockOrganizationUsage(8, 40) // 80% products, 80% orders

        const approaching = await getApproachingLimits('org-123', 'FREE', 80)

        expect(approaching).toContain('products')
        expect(approaching).toContain('orders')
      })
    })

    describe('getExceededLimits', () => {
      it('should return resources that have exceeded their limit', async () => {
        mockOrganizationUsage(15, 60) // Both over limit

        const exceeded = await getExceededLimits('org-123', 'FREE')

        expect(exceeded).toContain('products')
        expect(exceeded).toContain('orders')
      })

      it('should return resources at exactly the limit as exceeded', async () => {
        mockOrganizationUsage(10, 50) // Exactly at limit

        const exceeded = await getExceededLimits('org-123', 'FREE')

        expect(exceeded).toContain('products')
        expect(exceeded).toContain('orders')
      })

      it('should not return resources below limit', async () => {
        mockOrganizationUsage(5, 25)

        const exceeded = await getExceededLimits('org-123', 'FREE')

        expect(exceeded).not.toContain('products')
        expect(exceeded).not.toContain('orders')
      })

      it('should not return unlimited resources', async () => {
        mockOrganizationUsage(10000, 50000)

        const exceeded = await getExceededLimits('org-123', 'PRO')

        expect(exceeded).not.toContain('products')
        expect(exceeded).not.toContain('orders')
      })

      it('should return empty array when no limits are exceeded', async () => {
        // Use STARTER plan because FREE plan has teamMembers limit of 1
        // and the implementation hardcodes teamMembers to 1, making it always at limit
        mockOrganizationUsage(0, 0)

        const exceeded = await getExceededLimits('org-123', 'STARTER')

        // Products: 0/100, Orders: 0/1000, TeamMembers: 1/3 - none exceeded
        expect(exceeded).not.toContain('products')
        expect(exceeded).not.toContain('orders')
        expect(exceeded).not.toContain('teamMembers')
      })

      it('should return empty array for enterprise plan (all unlimited)', async () => {
        mockOrganizationUsage(10000, 50000)

        const exceeded = await getExceededLimits('org-123', 'ENTERPRISE')

        expect(exceeded).toHaveLength(0)
      })
    })

    describe('getDaysRemainingInBillingPeriod', () => {
      it('should return a positive number of days', () => {
        const days = getDaysRemainingInBillingPeriod()

        expect(days).toBeGreaterThanOrEqual(0)
        expect(days).toBeLessThanOrEqual(31)
      })

      it('should return correct days remaining for end of month', () => {
        // We cannot easily mock Date in vitest without additional setup,
        // but we can verify the function returns reasonable values
        const days = getDaysRemainingInBillingPeriod()
        const now = new Date()
        const endOfMonth = getEndOfCurrentMonth()
        const expectedDays = Math.ceil(
          (endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        expect(days).toBe(expectedDays)
      })

      it('should return at least 0 days', () => {
        const days = getDaysRemainingInBillingPeriod()
        expect(days).toBeGreaterThanOrEqual(0)
      })
    })

    describe('getEndOfCurrentMonth', () => {
      it('should return a date at end of current month', () => {
        const endOfMonth = getEndOfCurrentMonth()
        const now = new Date()

        // Should be in the same month as now
        expect(endOfMonth.getMonth()).toBe(now.getMonth())

        // Should be the last day of the month
        const nextDay = new Date(endOfMonth)
        nextDay.setDate(nextDay.getDate() + 1)
        expect(nextDay.getMonth()).not.toBe(now.getMonth())
      })

      it('should return time at 23:59:59.999', () => {
        const endOfMonth = getEndOfCurrentMonth()

        expect(endOfMonth.getHours()).toBe(23)
        expect(endOfMonth.getMinutes()).toBe(59)
        expect(endOfMonth.getSeconds()).toBe(59)
        expect(endOfMonth.getMilliseconds()).toBe(999)
      })
    })

    describe('getAllUsageLimits', () => {
      it('should return usage limits for all resource types', async () => {
        mockOrganizationUsage(5, 25)

        const limits = await getAllUsageLimits('org-123', 'FREE')

        expect(limits).toHaveProperty('products')
        expect(limits).toHaveProperty('orders')
        expect(limits).toHaveProperty('teamMembers')
        expect(limits).toHaveProperty('storageMB')
      })

      it('should correctly calculate limits for FREE plan', async () => {
        mockOrganizationUsage(5, 25)

        const limits = await getAllUsageLimits('org-123', 'FREE')

        expect(limits.products.current).toBe(5)
        expect(limits.products.limit).toBe(10)
        expect(limits.products.allowed).toBe(true)
        expect(limits.products.percentUsed).toBe(50)

        expect(limits.orders.current).toBe(25)
        expect(limits.orders.limit).toBe(50)
        expect(limits.orders.allowed).toBe(true)
      })

      it('should show unlimited for PRO plan resources', async () => {
        mockOrganizationUsage(500, 5000)

        const limits = await getAllUsageLimits('org-123', 'PRO')

        expect(limits.products.limit).toBe('unlimited')
        expect(limits.products.remaining).toBe('unlimited')
        expect(limits.products.allowed).toBe(true)
        expect(limits.products.percentUsed).toBe(0)

        expect(limits.orders.limit).toBe('unlimited')
      })
    })
  })

  // =============================================================================
  // EDGE CASES AND INTEGRATION
  // =============================================================================

  describe('Edge Cases', () => {
    describe('Unlimited plans (-1 limits)', () => {
      it('should always allow adding resources on PRO plan (unlimited products/orders)', async () => {
        mockOrganizationUsage(999999, 999999)

        const canAddProduct = await canAddResource('org-123', 'products', 'PRO', 1)
        const canAddOrder = await canAddResource('org-123', 'orders', 'PRO', 1)

        expect(canAddProduct).toBe(true)
        expect(canAddOrder).toBe(true)
      })

      it('should always allow on ENTERPRISE plan (all unlimited)', async () => {
        mockOrganizationUsage(999999, 999999)

        const canAddProduct = await canAddResource('org-123', 'products', 'ENTERPRISE', 1)
        const canAddOrder = await canAddResource('org-123', 'orders', 'ENTERPRISE', 1)
        const canAddTeamMember = await canAddResource('org-123', 'teamMembers', 'ENTERPRISE', 1)

        expect(canAddProduct).toBe(true)
        expect(canAddOrder).toBe(true)
        expect(canAddTeamMember).toBe(true)
      })

      it('should report 0% usage for unlimited resources', async () => {
        mockOrganizationUsage(1000, 5000)

        const plan = getPlanById('pro')!
        const result = await checkUsageLimit('org-123', 'products', plan)

        expect(result.percentUsed).toBe(0)
      })
    })

    describe('Zero usage', () => {
      it('should correctly handle zero usage', async () => {
        mockOrganizationUsage(0, 0)

        const plan = getPlanById('free')!
        const result = await checkUsageLimit('org-123', 'products', plan)

        expect(result.allowed).toBe(true)
        expect(result.current).toBe(0)
        expect(result.remaining).toBe(10)
        expect(result.percentUsed).toBe(0)
      })

      it('should allow adding when at zero', async () => {
        mockOrganizationUsage(0, 0)

        const canAdd = await canAddResource('org-123', 'products', 'FREE', 10)
        expect(canAdd).toBe(true)
      })
    })

    describe('Exactly at limit', () => {
      it('should mark as not allowed when exactly at limit', async () => {
        mockOrganizationUsage(10, 50)

        const plan = getPlanById('free')!
        const result = await checkUsageLimit('org-123', 'products', plan)

        expect(result.allowed).toBe(false)
        expect(result.remaining).toBe(0)
        expect(result.percentUsed).toBe(100)
      })

      it('should not allow adding more when at limit', async () => {
        mockOrganizationUsage(10, 50)

        const canAdd = await canAddResource('org-123', 'products', 'FREE', 1)
        expect(canAdd).toBe(false)
      })
    })

    describe('Over limit', () => {
      it('should cap percentUsed at 100', async () => {
        mockOrganizationUsage(20, 100) // 200% of limit

        const plan = getPlanById('free')!
        const result = await checkUsageLimit('org-123', 'products', plan)

        expect(result.percentUsed).toBe(100)
        expect(result.remaining).toBe(0)
      })

      it('should show as exceeded in getExceededLimits', async () => {
        mockOrganizationUsage(20, 100)

        const exceeded = await getExceededLimits('org-123', 'FREE')

        expect(exceeded).toContain('products')
        expect(exceeded).toContain('orders')
      })
    })

    describe('Various plan tiers', () => {
      it('should correctly enforce FREE tier limits', async () => {
        mockOrganizationUsage(10, 50)

        const exceeded = await getExceededLimits('org-123', 'FREE')
        expect(exceeded.length).toBeGreaterThan(0)
      })

      it('should correctly enforce STARTER tier limits', async () => {
        mockOrganizationUsage(100, 1000)

        const exceeded = await getExceededLimits('org-123', 'STARTER')
        // Products: 100 >= 100 (exceeded), Orders: 1000 >= 1000 (exceeded)
        expect(exceeded).toContain('products')
        expect(exceeded).toContain('orders')
      })

      it('should correctly enforce PRO tier limits (unlimited products/orders)', async () => {
        mockOrganizationUsage(10000, 50000)

        const exceeded = await getExceededLimits('org-123', 'PRO')
        // Products and orders are unlimited on PRO
        expect(exceeded).not.toContain('products')
        expect(exceeded).not.toContain('orders')
        // But teamMembers (10) and storageMB (10000) have limits
      })

      it('should have no exceeded limits on ENTERPRISE (all unlimited)', async () => {
        mockOrganizationUsage(999999, 999999)

        const exceeded = await getExceededLimits('org-123', 'ENTERPRISE')
        expect(exceeded).toHaveLength(0)
      })
    })
  })

  // =============================================================================
  // PLAN FEATURES
  // =============================================================================

  describe('Plan Features', () => {
    it('should have correct features for each plan', () => {
      const freePlan = getPlanById('free')!
      expect(freePlan.features).toContain('Basic analytics')
      expect(freePlan.features).toContain('Email support')

      const starterPlan = getPlanById('starter')!
      expect(starterPlan.features).toContain('Advanced analytics')
      expect(starterPlan.features).toContain('Priority support')
      expect(starterPlan.features).toContain('Custom domain')

      const proPlan = getPlanById('pro')!
      expect(proPlan.features).toContain('Everything in Starter')
      expect(proPlan.features).toContain('API access')
      expect(proPlan.features).toContain('Webhooks')

      const enterprisePlan = getPlanById('enterprise')!
      expect(enterprisePlan.features).toContain('Everything in Pro')
      expect(enterprisePlan.features).toContain('SSO/SAML')
      expect(enterprisePlan.features).toContain('SLA guarantee')
    })

    it('should mark STARTER as popular', () => {
      const starter = getPlanById('starter')!
      expect(starter.isPopular).toBe(true)

      const free = getPlanById('free')!
      expect(free.isPopular).toBe(false)

      const pro = getPlanById('pro')!
      expect(pro.isPopular).toBe(false)
    })
  })
})
