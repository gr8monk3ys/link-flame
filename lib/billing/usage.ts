/**
 * Usage Tracking for SaaS Billing
 *
 * Tracks resource usage against plan limits for organizations.
 * Provides functions to check limits, get current usage, and enforce quotas.
 */

import { prisma } from '@/lib/prisma'
import { type Plan, type PlanId, SAAS_PLANS, isUnlimited } from './plans'
import { logger } from '@/lib/logger'

/**
 * Resource types that can be tracked against plan limits
 */
export type ResourceType = 'products' | 'orders' | 'teamMembers' | 'storageMB'

/**
 * Usage data for an organization
 */
export interface OrganizationUsage {
  products: number
  orders: number
  teamMembers: number
  storageMB: number
}

/**
 * Result of a usage limit check
 */
export interface UsageLimitResult {
  allowed: boolean
  current: number
  limit: number | 'unlimited'
  remaining: number | 'unlimited'
  percentUsed: number
}

/**
 * Get current usage for an organization
 * Note: This requires Organization model to exist in Prisma schema
 */
export async function getOrganizationUsage(organizationId: string): Promise<OrganizationUsage> {
  try {
    // Execute all queries in parallel for better performance
    const [productCount, orderCount, memberCount, storageUsage] = await Promise.all([
      // Count products belonging to the organization
      prisma.product.count({
        where: {
          // When Organization model is added, filter by organizationId
          // organizationId: organizationId,
        },
      }),

      // Count orders in the current billing period (this month)
      prisma.order.count({
        where: {
          // When Organization model is added, filter by organizationId
          // organizationId: organizationId,
          createdAt: {
            gte: getStartOfCurrentMonth(),
          },
        },
      }),

      // Count organization members
      // When OrganizationMember model is added:
      // prisma.organizationMember.count({ where: { organizationId } }),
      Promise.resolve(1), // Default to 1 for now

      // Calculate storage usage
      // This would typically query file storage records
      // For now, return 0 as placeholder
      Promise.resolve(0),
    ])

    return {
      products: productCount,
      orders: orderCount,
      teamMembers: memberCount,
      storageMB: storageUsage,
    }
  } catch (error) {
    logger.error('Failed to get organization usage', error, { organizationId })
    throw error
  }
}

/**
 * Check if a specific resource usage is within plan limits
 */
export async function checkUsageLimit(
  organizationId: string,
  resource: ResourceType,
  plan: Plan
): Promise<UsageLimitResult> {
  const usage = await getOrganizationUsage(organizationId)
  const currentValue = usage[resource]
  const limit = plan.limits[resource]

  // Handle unlimited resources
  if (isUnlimited(limit)) {
    return {
      allowed: true,
      current: currentValue,
      limit: 'unlimited',
      remaining: 'unlimited',
      percentUsed: 0,
    }
  }

  const remaining = Math.max(0, limit - currentValue)
  const percentUsed = Math.round((currentValue / limit) * 100)

  return {
    allowed: currentValue < limit,
    current: currentValue,
    limit,
    remaining,
    percentUsed: Math.min(100, percentUsed),
  }
}

/**
 * Check if organization can add one more of a resource type
 */
export async function canAddResource(
  organizationId: string,
  resource: ResourceType,
  planId: PlanId,
  quantity: number = 1
): Promise<boolean> {
  const plan = SAAS_PLANS[planId]
  const limit = plan.limits[resource]

  // Unlimited resources are always allowed
  if (isUnlimited(limit)) {
    return true
  }

  const usage = await getOrganizationUsage(organizationId)
  return usage[resource] + quantity <= limit
}

/**
 * Get all usage limits for an organization
 */
export async function getAllUsageLimits(
  organizationId: string,
  planId: PlanId
): Promise<Record<ResourceType, UsageLimitResult>> {
  const plan = SAAS_PLANS[planId]
  const usage = await getOrganizationUsage(organizationId)

  const resources: ResourceType[] = ['products', 'orders', 'teamMembers', 'storageMB']

  const results: Record<ResourceType, UsageLimitResult> = {} as Record<
    ResourceType,
    UsageLimitResult
  >

  for (const resource of resources) {
    const currentValue = usage[resource]
    const limit = plan.limits[resource]

    if (isUnlimited(limit)) {
      results[resource] = {
        allowed: true,
        current: currentValue,
        limit: 'unlimited',
        remaining: 'unlimited',
        percentUsed: 0,
      }
    } else {
      const remaining = Math.max(0, limit - currentValue)
      const percentUsed = Math.round((currentValue / limit) * 100)

      results[resource] = {
        allowed: currentValue < limit,
        current: currentValue,
        limit,
        remaining,
        percentUsed: Math.min(100, percentUsed),
      }
    }
  }

  return results
}

/**
 * Check if organization is approaching any limits (over 80% used)
 */
export async function getApproachingLimits(
  organizationId: string,
  planId: PlanId,
  thresholdPercent: number = 80
): Promise<ResourceType[]> {
  const allLimits = await getAllUsageLimits(organizationId, planId)
  const approaching: ResourceType[] = []

  for (const [resource, result] of Object.entries(allLimits)) {
    if (result.limit !== 'unlimited' && result.percentUsed >= thresholdPercent) {
      approaching.push(resource as ResourceType)
    }
  }

  return approaching
}

/**
 * Check if organization has exceeded any limits
 */
export async function getExceededLimits(
  organizationId: string,
  planId: PlanId
): Promise<ResourceType[]> {
  const allLimits = await getAllUsageLimits(organizationId, planId)
  const exceeded: ResourceType[] = []

  for (const [resource, result] of Object.entries(allLimits)) {
    if (!result.allowed) {
      exceeded.push(resource as ResourceType)
    }
  }

  return exceeded
}

/**
 * Record a usage event (for tracking purposes)
 */
export async function recordUsageEvent(
  organizationId: string,
  resource: ResourceType,
  action: 'add' | 'remove',
  quantity: number = 1,
  metadata?: Record<string, unknown>
): Promise<void> {
  // This would typically store to a usage events table for billing analysis
  logger.info('Usage event recorded', {
    organizationId,
    resource,
    action,
    quantity,
    metadata,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Get usage history for a specific resource
 */
export async function getUsageHistory(
  organizationId: string,
  resource: ResourceType,
  startDate: Date,
  endDate: Date
): Promise<Array<{ date: string; value: number }>> {
  // This would typically query from a time-series usage table
  // For now, return empty array as placeholder
  logger.info('Getting usage history', {
    organizationId,
    resource,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  })

  return []
}

/**
 * Get the start of the current billing month
 */
function getStartOfCurrentMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

/**
 * Get the end of the current billing month
 */
export function getEndOfCurrentMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
}

/**
 * Calculate days remaining in current billing period
 */
export function getDaysRemainingInBillingPeriod(): number {
  const now = new Date()
  const endOfMonth = getEndOfCurrentMonth()
  const diffTime = endOfMonth.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Project usage for the end of the billing period based on current rate
 */
export async function projectMonthEndUsage(
  organizationId: string,
  resource: ResourceType
): Promise<number> {
  const usage = await getOrganizationUsage(organizationId)
  const currentValue = usage[resource]

  // Calculate daily average
  const now = new Date()
  const dayOfMonth = now.getDate()
  const dailyAverage = currentValue / dayOfMonth

  // Project to end of month
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return Math.round(dailyAverage * daysInMonth)
}

/**
 * Check if upgrading would resolve exceeded limits
 */
export async function wouldUpgradeResolveLimits(
  organizationId: string,
  currentPlanId: PlanId,
  targetPlanId: PlanId
): Promise<boolean> {
  const exceeded = await getExceededLimits(organizationId, currentPlanId)

  if (exceeded.length === 0) {
    return true // No limits exceeded
  }

  const targetPlan = SAAS_PLANS[targetPlanId]
  const usage = await getOrganizationUsage(organizationId)

  for (const resource of exceeded) {
    const targetLimit = targetPlan.limits[resource]

    // If target has unlimited, it resolves the issue
    if (isUnlimited(targetLimit)) {
      continue
    }

    // If target limit is still not enough
    if (usage[resource] > targetLimit) {
      return false
    }
  }

  return true
}

/**
 * Suggested plan based on current usage
 */
export async function getSuggestedPlan(
  organizationId: string,
  currentPlanId: PlanId
): Promise<PlanId | null> {
  const usage = await getOrganizationUsage(organizationId)
  const planOrder: PlanId[] = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE']

  // Find the minimum plan that can accommodate current usage
  for (const planId of planOrder) {
    const plan = SAAS_PLANS[planId]
    let canAccommodate = true

    for (const resource of Object.keys(usage) as ResourceType[]) {
      const limit = plan.limits[resource]
      if (!isUnlimited(limit) && usage[resource] > limit) {
        canAccommodate = false
        break
      }
    }

    if (canAccommodate && planId !== currentPlanId) {
      return planId
    }
  }

  return null
}
