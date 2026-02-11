/**
 * Usage API
 *
 * Returns current usage and limits for an organization's subscription plan.
 * Used by the frontend to display usage meters and limit warnings.
 */

import { z } from 'zod'
import { getServerAuth } from '@/lib/auth'
import { checkStrictRateLimit, getIdentifier } from '@/lib/rate-limit'
import {
  forbiddenResponse,
  handleApiError,
  rateLimitErrorResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { type PlanId, SAAS_PLANS, formatLimit } from '@/lib/billing/plans'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/teams/permissions'
import {
  getAllUsageLimits,
  getApproachingLimits,
  getExceededLimits,
  getDaysRemainingInBillingPeriod,
  getOrganizationUsage,
  type ResourceType,
} from '@/lib/billing/usage'

export const dynamic = 'force-dynamic'

/**
 * Query params schema
 */
const UsageQuerySchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  planId: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE'] as const).optional(),
})

/**
 * GET /api/billing/usage
 *
 * Get current usage and limits for an organization
 */
export async function GET(request: Request) {
  try {
    // Authentication check
    const { userId } = await getServerAuth()
    if (!userId) {
      return unauthorizedResponse('You must be logged in to view usage')
    }

    // Rate limiting
    const identifier = getIdentifier(request, userId)
    const { success, reset } = await checkStrictRateLimit(identifier)
    if (!success) {
      return rateLimitErrorResponse(reset)
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const params = {
      organizationId: searchParams.get('organizationId') || '',
      planId: searchParams.get('planId') || undefined,
    }

    const validation = UsageQuerySchema.safeParse(params)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { organizationId, planId: requestedPlanId } = validation.data

    // CRITICAL: Verify user is a member of this organization
    const organization = await prisma.organization.findFirst({
      where: { id: organizationId },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    })

    if (!organization || organization.members.length === 0) {
      logger.warn('Unauthorized usage access attempt', {
        userId,
        organizationId,
      })
      return forbiddenResponse('You do not have access to this organization')
    }

    // Verify user has billing read permission
    const userRole = organization.members[0].role
    if (!hasPermission(userRole, 'billing.read')) {
      return forbiddenResponse('You do not have permission to view billing usage')
    }

    // Get organization's current plan from database or use requested/default
    const planId: PlanId = (organization.plan as PlanId) || requestedPlanId || 'FREE'
    const plan = SAAS_PLANS[planId]

    // Get all usage data
    const [usage, limits, approaching, exceeded] = await Promise.all([
      getOrganizationUsage(organizationId),
      getAllUsageLimits(organizationId, planId),
      getApproachingLimits(organizationId, planId),
      getExceededLimits(organizationId, planId),
    ])

    // Calculate days remaining in billing period
    const daysRemaining = getDaysRemainingInBillingPeriod()

    // Build response with formatted limits
    const formattedLimits: Record<
      ResourceType,
      {
        current: number
        limit: number | 'unlimited'
        limitFormatted: string
        percentUsed: number
        remaining: number | 'unlimited'
        isApproaching: boolean
        isExceeded: boolean
      }
    > = {} as Record<ResourceType, {
      current: number
      limit: number | 'unlimited'
      limitFormatted: string
      percentUsed: number
      remaining: number | 'unlimited'
      isApproaching: boolean
      isExceeded: boolean
    }>

    const resources: ResourceType[] = ['products', 'orders', 'teamMembers', 'storageMB']

    for (const resource of resources) {
      const limitData = limits[resource]
      const limit = typeof limitData.limit === 'number' ? limitData.limit : -1

      formattedLimits[resource] = {
        current: limitData.current,
        limit: limitData.limit,
        limitFormatted: formatLimit(limit),
        percentUsed: limitData.percentUsed,
        remaining: limitData.remaining,
        isApproaching: approaching.includes(resource),
        isExceeded: exceeded.includes(resource),
      }
    }

    logger.info('Usage data retrieved', {
      userId,
      organizationId,
      planId,
      hasExceededLimits: exceeded.length > 0,
    })

    return successResponse({
      organizationId,
      plan: {
        id: planId,
        name: plan.name,
      },
      usage: formattedLimits,
      billing: {
        daysRemainingInPeriod: daysRemaining,
        periodResetDate: getEndOfCurrentMonthISO(),
      },
      warnings: {
        approachingLimits: approaching,
        exceededLimits: exceeded,
      },
    })
  } catch (error) {
    logger.error('Failed to get usage data', error)
    return handleApiError(error)
  }
}

/**
 * Get end of current month as ISO string
 */
function getEndOfCurrentMonthISO(): string {
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return endOfMonth.toISOString()
}
