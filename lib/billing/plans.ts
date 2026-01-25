/**
 * SaaS Billing Plans Configuration
 *
 * Defines the pricing tiers and features for the subscription-based
 * e-commerce platform. All prices are in USD.
 */

export interface PlanLimits {
  products: number // -1 = unlimited
  orders: number // Monthly order limit, -1 = unlimited
  teamMembers: number // -1 = unlimited
  storageMB: number // -1 = unlimited
}

export interface Plan {
  id: string
  name: string
  description: string
  priceMonthly: number | null // null for custom pricing
  priceYearly: number | null
  stripePriceIdMonthly: string | null | undefined
  stripePriceIdYearly: string | null | undefined
  limits: PlanLimits
  features: readonly string[]
  isPopular?: boolean
  isBeta?: boolean
}

export const SAAS_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic features',
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    limits: {
      products: 10,
      orders: 50,
      teamMembers: 1,
      storageMB: 100,
    },
    features: [
      'Basic analytics',
      'Email support',
      'Standard checkout',
      'Up to 10 products',
      '50 orders/month',
    ],
    isPopular: false,
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses',
    priceMonthly: 29,
    priceYearly: 290,
    stripePriceIdMonthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    stripePriceIdYearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
    limits: {
      products: 100,
      orders: 1000,
      teamMembers: 3,
      storageMB: 1000,
    },
    features: [
      'Advanced analytics',
      'Priority support',
      'Custom domain',
      'Remove branding',
      'Up to 100 products',
      '1,000 orders/month',
      '3 team members',
    ],
    isPopular: true,
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses',
    priceMonthly: 79,
    priceYearly: 790,
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    limits: {
      products: -1, // unlimited
      orders: -1,
      teamMembers: 10,
      storageMB: 10000,
    },
    features: [
      'Everything in Starter',
      'API access',
      'Webhooks',
      'Advanced integrations',
      'Dedicated support',
      'Unlimited products',
      'Unlimited orders',
      '10 team members',
    ],
    isPopular: false,
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    priceMonthly: null, // Custom pricing
    priceYearly: null,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    limits: {
      products: -1,
      orders: -1,
      teamMembers: -1,
      storageMB: -1,
    },
    features: [
      'Everything in Pro',
      'SSO/SAML',
      'SLA guarantee',
      'Dedicated account manager',
      'Custom integrations',
      'On-premise deployment option',
      'Priority feature requests',
      'Custom training',
    ],
    isPopular: false,
  },
} as const

export type PlanId = keyof typeof SAAS_PLANS
export type PlanConfig = (typeof SAAS_PLANS)[PlanId]

/**
 * Billing intervals for subscription management
 */
export type BillingInterval = 'monthly' | 'yearly'

/**
 * Subscription status types matching Stripe subscription statuses
 */
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'paused'
  | 'trialing'
  | 'unpaid'

/**
 * Get a plan by its ID
 */
export function getPlanById(planId: string): Plan | undefined {
  const upperPlanId = planId.toUpperCase() as PlanId
  const plan = SAAS_PLANS[upperPlanId]
  return plan ? { ...plan } as Plan : undefined
}

/**
 * Get the Stripe price ID for a plan and interval
 */
export function getStripePriceId(
  planId: PlanId,
  interval: BillingInterval
): string | null | undefined {
  const plan = SAAS_PLANS[planId]
  return interval === 'monthly' ? plan.stripePriceIdMonthly : plan.stripePriceIdYearly
}

/**
 * Check if a plan is the free tier
 */
export function isFreePlan(planId: string): boolean {
  return planId.toLowerCase() === 'free'
}

/**
 * Check if a plan requires payment (non-free)
 */
export function isPaidPlan(planId: string): boolean {
  return !isFreePlan(planId)
}

/**
 * Calculate yearly savings compared to monthly billing
 */
export function calculateYearlySavings(planId: PlanId): number {
  const plan = SAAS_PLANS[planId]
  if (!plan.priceMonthly || !plan.priceYearly) return 0

  const monthlyTotal = plan.priceMonthly * 12
  return monthlyTotal - plan.priceYearly
}

/**
 * Calculate yearly savings percentage
 */
export function calculateYearlySavingsPercent(planId: PlanId): number {
  const plan = SAAS_PLANS[planId]
  if (!plan.priceMonthly || !plan.priceYearly) return 0

  const monthlyTotal = plan.priceMonthly * 12
  return Math.round(((monthlyTotal - plan.priceYearly) / monthlyTotal) * 100)
}

/**
 * Get all plans as an array (useful for rendering plan cards)
 */
export function getAllPlans(): Plan[] {
  return Object.values(SAAS_PLANS).map((plan) => ({ ...plan })) as Plan[]
}

/**
 * Get only paid plans (excludes free tier)
 */
export function getPaidPlans(): Plan[] {
  return getAllPlans().filter((plan) => plan.priceMonthly !== 0 && plan.priceMonthly !== null)
}

/**
 * Compare two plans and determine upgrade/downgrade direction
 * Returns: 1 for upgrade, -1 for downgrade, 0 for same
 */
export function comparePlans(fromPlanId: PlanId, toPlanId: PlanId): number {
  const planOrder: PlanId[] = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE']
  const fromIndex = planOrder.indexOf(fromPlanId)
  const toIndex = planOrder.indexOf(toPlanId)

  if (toIndex > fromIndex) return 1 // upgrade
  if (toIndex < fromIndex) return -1 // downgrade
  return 0 // same
}

/**
 * Check if a specific limit is unlimited
 */
export function isUnlimited(value: number): boolean {
  return value === -1
}

/**
 * Format a limit value for display
 */
export function formatLimit(value: number): string {
  if (value === -1) return 'Unlimited'
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toString()
}

/**
 * Default plan for new organizations
 */
export const DEFAULT_PLAN_ID: PlanId = 'FREE'

/**
 * Trial period in days for paid plans
 */
export const TRIAL_PERIOD_DAYS = 14

/**
 * Grace period in days before downgrading after failed payment
 */
export const PAYMENT_GRACE_PERIOD_DAYS = 7
