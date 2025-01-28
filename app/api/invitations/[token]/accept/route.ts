import { NextRequest } from 'next/server'
import { getServerAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  handleApiError,
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
  forbiddenResponse,
} from '@/lib/api-response'
import { acceptInvitation, getInvitationByToken } from '@/lib/teams/invitations'
import { logger } from '@/lib/logger'
import { validateCsrfToken } from '@/lib/csrf'
import {
  checkStrictRateLimit,
  getIdentifier,
  getRateLimitKey,
  RATE_LIMIT_NAMESPACES,
} from '@/lib/rate-limit'
import { rateLimitErrorResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ token: string }>
}

/**
 * GET /api/invitations/[token]/accept
 * Get invitation details by token (for preview before accepting)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const { token } = resolvedParams

    const invitation = await getInvitationByToken(token)

    if (!invitation) {
      return notFoundResponse('Invitation')
    }

    // Don't expose the full invitation details if already accepted or expired
    if (invitation.isAccepted) {
      return errorResponse(
        'This invitation has already been used',
        'INVITATION_USED',
        undefined,
        400
      )
    }

    if (invitation.isExpired) {
      return errorResponse(
        'This invitation has expired',
        'INVITATION_EXPIRED',
        undefined,
        400
      )
    }

    return successResponse({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        organization: {
          id: invitation.organization.id,
          name: invitation.organization.name,
          logo: invitation.organization.logo,
        },
      },
    })
  } catch (error) {
    logger.error('Failed to get invitation details', error)
    return handleApiError(error)
  }
}

/**
 * POST /api/invitations/[token]/accept
 * Accept an invitation to join an organization
 * Requires: authenticated user with matching email
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate CSRF token
    const csrfValid = await validateCsrfToken(request)
    if (!csrfValid) {
      return forbiddenResponse('Invalid or missing CSRF token')
    }

    const { userId } = await getServerAuth()

    if (!userId) {
      return unauthorizedResponse('Please sign in to accept this invitation')
    }

    // Rate limit: 5 acceptances per minute per user
    const identifier = getIdentifier(request, userId)
    const rateLimitKey = getRateLimitKey(RATE_LIMIT_NAMESPACES.TEAM_ACCEPT, identifier)
    const { success: rateLimitOk, reset } = await checkStrictRateLimit(rateLimitKey)
    if (!rateLimitOk) {
      return rateLimitErrorResponse(reset)
    }

    const resolvedParams = await params
    const { token } = resolvedParams

    // First, verify the invitation exists and is valid
    const invitation = await getInvitationByToken(token)

    if (!invitation) {
      return notFoundResponse('Invitation')
    }

    if (invitation.isAccepted) {
      return errorResponse(
        'This invitation has already been used',
        'INVITATION_USED',
        undefined,
        400
      )
    }

    if (invitation.isExpired) {
      return errorResponse(
        'This invitation has expired',
        'INVITATION_EXPIRED',
        undefined,
        400
      )
    }

    // Get the current user's email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!user) {
      return unauthorizedResponse('User not found')
    }

    // Check if the email matches
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return errorResponse(
        'This invitation was sent to a different email address. Please sign in with the correct account.',
        'EMAIL_MISMATCH',
        undefined,
        403
      )
    }

    // Accept the invitation
    const result = await acceptInvitation(token, userId)

    if (!result.success) {
      return errorResponse(
        result.error || 'Failed to accept invitation',
        'ACCEPT_FAILED',
        undefined,
        400
      )
    }

    logger.info('Invitation accepted', {
      userId,
      organizationId: result.organizationId,
      email: invitation.email,
    })

    return successResponse({
      accepted: true,
      organizationId: result.organizationId,
      organization: {
        id: invitation.organization.id,
        name: invitation.organization.name,
      },
    })
  } catch (error) {
    logger.error('Failed to accept invitation', error)
    return handleApiError(error)
  }
}
