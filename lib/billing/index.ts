/**
 * SaaS Billing Module
 *
 * Exports all billing-related utilities for subscription management,
 * usage tracking, and Stripe integration.
 */

// Plan definitions and utilities
export {
  SAAS_PLANS,
  type Plan,
  type PlanId,
  type PlanConfig,
  type PlanLimits,
  type BillingInterval,
  type SubscriptionStatus,
  getPlanById,
  getStripePriceId,
  isFreePlan,
  isPaidPlan,
  calculateYearlySavings,
  calculateYearlySavingsPercent,
  getAllPlans,
  getPaidPlans,
  comparePlans,
  isUnlimited,
  formatLimit,
  DEFAULT_PLAN_ID,
  TRIAL_PERIOD_DAYS,
  PAYMENT_GRACE_PERIOD_DAYS,
} from './plans'

// Usage tracking
export {
  type ResourceType,
  type OrganizationUsage,
  type UsageLimitResult,
  getOrganizationUsage,
  checkUsageLimit,
  canAddResource,
  getAllUsageLimits,
  getApproachingLimits,
  getExceededLimits,
  recordUsageEvent,
  getUsageHistory,
  getEndOfCurrentMonth,
  getDaysRemainingInBillingPeriod,
  projectMonthEndUsage,
  wouldUpgradeResolveLimits,
  getSuggestedPlan,
} from './usage'

// Stripe subscription management
export {
  SubscriptionError,
  type CreateSubscriptionResult,
  getOrCreateStripeCustomer,
  createCheckoutSession,
  createCustomerPortalSession,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  pauseSubscription,
  resumeSubscription,
  getUpcomingInvoice,
  previewSubscriptionChange,
  applyCoupon,
  getPaymentMethods,
  setDefaultPaymentMethod,
  getInvoices,
  mapStripeStatus,
  syncSubscriptionStatus,
} from './subscription'
