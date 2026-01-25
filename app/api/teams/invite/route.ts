import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getServerAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  handleApiError,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  forbiddenResponse,
  errorResponse,
} from '@/lib/api-response'
import {
  createInvitation,
  cancelInvitation,
  resendInvitation,
  generateInvitationLink,
} from '@/lib/teams/invitations'
import { hasPermission, isValidRole, getAssignableRoles } from '@/lib/teams/permissions'
import { logger } from '@/lib/logger'
import { validateCsrfToken } from '@/lib/csrf'
import {
  checkStrictRateLimit,
  getIdentifier,
  getRateLimitKey,
  RATE_LIMIT_NAMESPACES,
} from '@/lib/rate-limit'
import { rateLimitErrorResponse } from '@/lib/api-response'

/**
 * Request body schema for POST /api/teams/invite
 */
const inviteSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
})

/**
 * Request body schema for DELETE /api/teams/invite (cancel invitation)
 */
const cancelInviteSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  invitationId: z.string().min(1, 'Invitation ID is required'),
})

/**
 * Request body schema for PUT /api/teams/invite (resend invitation)
 */
const resendInviteSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  invitationId: z.string().min(1, 'Invitation ID is required'),
})

/**
 * POST /api/teams/invite
 * Send an invitation to join the organization
 * Requires: team.invite permission
 */
export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfValid = await validateCsrfToken(request)
    if (!csrfValid) {
      return forbiddenResponse('Invalid or missing CSRF token')
    }

    const { userId } = await getServerAuth()

    if (!userId) {
      return unauthorizedResponse('Please sign in to invite team members')
    }

    // Rate limit: 5 invitations per minute per user
    const identifier = getIdentifier(request, userId)
    const rateLimitKey = getRateLimitKey(RATE_LIMIT_NAMESPACES.TEAM_INVITE, identifier)
    const { success: rateLimitOk, reset } = await checkStrictRateLimit(rateLimitKey)
    if (!rateLimitOk) {
      return rateLimitErrorResponse(reset)
    }

    const body = await request.json()
    const parseResult = inviteSchema.safeParse(body)

    if (!parseResult.success) {
      return validationErrorResponse(parseResult.error)
    }

    const { organizationId, email, role } = parseResult.data

    // Validate role
    if (!isValidRole(role)) {
      return errorResponse(`Invalid role: ${role}`, 'INVALID_ROLE', undefined, 400)
    }

    // Check if user is a member and has permission
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: { role: true },
    })

    if (!membership) {
      return forbiddenResponse('You are not a member of this organization')
    }

    if (!hasPermission(membership.role, 'team.invite')) {
      return forbiddenResponse('You do not have permission to invite team members')
    }

    // Check if the role can be assigned by this user
    const assignableRoles = getAssignableRoles(membership.role)
    if (!assignableRoles.includes(role as 'ADMIN' | 'MEMBER' | 'VIEWER')) {
      return forbiddenResponse(`You cannot assign the ${role} role`)
    }

    // Create the invitation
    const result = await createInvitation(organizationId, email, role, userId)

    if (!result.success) {
      return errorResponse(result.error || 'Failed to create invitation', 'INVITATION_FAILED', undefined, 400)
    }

    const invitationLink = generateInvitationLink(result.invitation!.token)

    logger.info('Invitation created', {
      organizationId,
      invitedBy: userId,
      email,
      role,
    })

    return successResponse(
      {
        invitation: {
          id: result.invitation!.id,
          email: result.invitation!.email,
          role: result.invitation!.role,
          expiresAt: result.invitation!.expiresAt,
          invitationLink,
        },
      },
      undefined,
      201
    )
  } catch (error) {
    logger.error('Failed to create invitation', error)
    return handleApiError(error)
  }
}

/**
 * DELETE /api/teams/invite
 * Cancel a pending invitation
 * Requires: team.invite permission
 */
export async function DELETE(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfValid = await validateCsrfToken(request)
    if (!csrfValid) {
      return forbiddenResponse('Invalid or missing CSRF token')
    }

    const { userId } = await getServerAuth()

    if (!userId) {
      return unauthorizedResponse('Please sign in to cancel invitations')
    }

    // Rate limit: 5 cancellations per minute per user
    const identifier = getIdentifier(request, userId)
    const rateLimitKey = getRateLimitKey(RATE_LIMIT_NAMESPACES.TEAM_INVITE, identifier)
    const { success: rateLimitOk, reset } = await checkStrictRateLimit(rateLimitKey)
    if (!rateLimitOk) {
      return rateLimitErrorResponse(reset)
    }

    const body = await request.json()
    const parseResult = cancelInviteSchema.safeParse(body)

    if (!parseResult.success) {
      return validationErrorResponse(parseResult.error)
    }

    const { organizationId, invitationId } = parseResult.data

    // Cancel the invitation
    const result = await cancelInvitation(invitationId, organizationId, userId)

    if (!result.success) {
      return errorResponse(result.error || 'Failed to cancel invitation', 'CANCEL_FAILED', undefined, 400)
    }

    logger.info('Invitation cancelled', {
      organizationId,
      cancelledBy: userId,
      invitationId,
    })

    return successResponse({ cancelled: true })
  } catch (error) {
    logger.error('Failed to cancel invitation', error)
    return handleApiError(error)
  }
}

/**
 * PUT /api/teams/invite
 * Resend a pending invitation (generates new token and extends expiry)
 * Requires: team.invite permission
 */
export async function PUT(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfValid = await validateCsrfToken(request)
    if (!csrfValid) {
      return forbiddenResponse('Invalid or missing CSRF token')
    }

    const { userId } = await getServerAuth()

    if (!userId) {
      return unauthorizedResponse('Please sign in to resend invitations')
    }

    // Rate limit: 5 resends per minute per user
    const identifier = getIdentifier(request, userId)
    const rateLimitKey = getRateLimitKey(RATE_LIMIT_NAMESPACES.TEAM_INVITE, identifier)
    const { success: rateLimitOk, reset } = await checkStrictRateLimit(rateLimitKey)
    if (!rateLimitOk) {
      return rateLimitErrorResponse(reset)
    }

    const body = await request.json()
    const parseResult = resendInviteSchema.safeParse(body)

    if (!parseResult.success) {
      return validationErrorResponse(parseResult.error)
    }

    const { organizationId, invitationId } = parseResult.data

    // Resend the invitation
    const result = await resendInvitation(invitationId, organizationId, userId)

    if (!result.success) {
      return errorResponse(result.error || 'Failed to resend invitation', 'RESEND_FAILED', undefined, 400)
    }

    const invitationLink = generateInvitationLink(result.invitation!.token)

    logger.info('Invitation resent', {
      organizationId,
      resentBy: userId,
      invitationId,
    })

    return successResponse({
      invitation: {
        id: result.invitation!.id,
        email: result.invitation!.email,
        role: result.invitation!.role,
        expiresAt: result.invitation!.expiresAt,
        invitationLink,
      },
    })
  } catch (error) {
    logger.error('Failed to resend invitation', error)
    return handleApiError(error)
  }
}
