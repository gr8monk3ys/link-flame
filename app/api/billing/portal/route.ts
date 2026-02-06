/**
 * Customer Portal API
 *
 * Creates Stripe Customer Portal sessions for subscription management.
 * Customers can update payment methods, view invoices, and cancel subscriptions.
 */

import { z } from 'zod'
import { getServerAuth } from '@/lib/auth'
import { checkStrictRateLimit, getIdentifier } from '@/lib/rate-limit'
import { validateCsrfToken } from '@/lib/csrf'
import {
  errorResponse,
  forbiddenResponse,
  handleApiError,
  rateLimitErrorResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { getBaseUrl } from '@/lib/url'
import {
  createCustomerPortalSession,
  SubscriptionError,
} from '@/lib/billing/subscription'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/teams/permissions'

/**
 * Validation schema for portal request
 */
const PortalSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  returnUrl: z.string().url('Return URL must be a valid URL').optional(),
})

/**
 * POST /api/billing/portal
 *
 * Create a Stripe Customer Portal session
 */
export async function POST(request: Request) {
  try {
    // CSRF protection
    const csrfValid = await validateCsrfToken(request)
    if (!csrfValid) {
      return errorResponse(
        'Invalid or missing CSRF token',
        'CSRF_VALIDATION_FAILED',
        undefined,
        403
      )
    }

    // Authentication check
    const { userId } = await getServerAuth()
    if (!userId) {
      return unauthorizedResponse('You must be logged in to access the billing portal')
    }

    // Rate limiting
    const identifier = getIdentifier(request, userId)
    const { success, reset } = await checkStrictRateLimit(identifier)
    if (!success) {
      return rateLimitErrorResponse(reset)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = PortalSchema.safeParse(body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { customerId, returnUrl } = validation.data

    // Build return URL (default to billing page)
    const baseUrl = getBaseUrl()
    const finalReturnUrl = returnUrl || `${baseUrl}/billing`

    // CRITICAL: Verify customer belongs to user's organization
    const organization = await prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    })

    if (!organization || organization.members.length === 0) {
      logger.warn('Unauthorized billing portal access attempt', {
        userId,
        customerId,
        hasOrg: !!organization,
        isMember: organization?.members.length ?? 0,
      })
      return forbiddenResponse('You do not have access to this billing account')
    }

    // Verify user has billing permissions
    const userRole = organization.members[0].role
    if (!hasPermission(userRole, 'billing.read')) {
      logger.warn('User lacks billing permission', {
        userId,
        customerId,
        role: userRole,
      })
      return forbiddenResponse('You do not have permission to access billing')
    }

    // Create portal session
    const session = await createCustomerPortalSession(customerId, finalReturnUrl)

    logger.info('Created customer portal session', {
      userId,
      customerId,
      sessionId: session.id,
    })

    return successResponse({
      sessionId: session.id,
      sessionUrl: session.url,
    })
  } catch (error) {
    if (error instanceof SubscriptionError) {
      logger.error('Subscription error during portal creation', error, {
        code: error.code,
      })
      return errorResponse(error.message, error.code, undefined, 400)
    }

    logger.error('Portal session creation failed', error)
    return handleApiError(error)
  }
}

/**
 * GET /api/billing/portal
 *
 * Get portal configuration and allowed actions
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) {
      return unauthorizedResponse('You must be logged in')
    }

    // Return portal capabilities
    // This information helps the frontend know what actions are available
    return successResponse({
      capabilities: {
        updatePaymentMethod: true,
        cancelSubscription: true,
        viewInvoices: true,
        downloadInvoices: true,
        updateBillingAddress: true,
        applyPromotionCode: true,
      },
      portalUrl: process.env.STRIPE_CUSTOMER_PORTAL_URL || null,
    })
  } catch (error) {
    logger.error('Failed to get portal configuration', error)
    return handleApiError(error)
  }
}
