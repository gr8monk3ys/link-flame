import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getServerAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  handleApiError,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  notFoundResponse,
  forbiddenResponse,
  errorResponse,
} from '@/lib/api-response'
import {
  hasPermission,
  canManageRole,
  getAssignableRoles,
  isValidRole,
} from '@/lib/teams/permissions'
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

/**
 * Request body schema for PATCH /api/teams/[memberId]
 */
const updateMemberSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  role: z.string().min(1, 'Role is required'),
})

/**
 * Request body schema for DELETE /api/teams/[memberId]
 */
const removeMemberSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
})

interface RouteParams {
  params: Promise<{ memberId: string }>
}

/**
 * PATCH /api/teams/[memberId]
 * Update a team member's role
 * Requires: team.invite permission (same as managing team)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate CSRF token
    const csrfValid = await validateCsrfToken(request)
    if (!csrfValid) {
      return forbiddenResponse('Invalid or missing CSRF token')
    }

    const { userId } = await getServerAuth()

    if (!userId) {
      return unauthorizedResponse('Please sign in to update team members')
    }

    // Rate limit: 5 updates per minute per user
    const identifier = getIdentifier(request, userId)
    const rateLimitKey = getRateLimitKey(RATE_LIMIT_NAMESPACES.TEAM_MEMBER, identifier)
    const { success: rateLimitOk, reset } = await checkStrictRateLimit(rateLimitKey)
    if (!rateLimitOk) {
      return rateLimitErrorResponse(reset)
    }

    const resolvedParams = await params
    const { memberId } = resolvedParams

    const body = await request.json()
    const parseResult = updateMemberSchema.safeParse(body)

    if (!parseResult.success) {
      return validationErrorResponse(parseResult.error)
    }

    const { organizationId, role: newRole } = parseResult.data

    // Validate the new role
    if (!isValidRole(newRole)) {
      return errorResponse(`Invalid role: ${newRole}`, 'INVALID_ROLE', undefined, 400)
    }

    // Cannot change to OWNER role
    if (newRole === 'OWNER') {
      return forbiddenResponse('Cannot change a member to owner role')
    }

    // Get the current user's membership
    const currentMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: { role: true },
    })

    if (!currentMembership) {
      return forbiddenResponse('You are not a member of this organization')
    }

    // Check permission to manage team
    if (!hasPermission(currentMembership.role, 'team.invite')) {
      return forbiddenResponse('You do not have permission to manage team members')
    }

    // Get the target member
    const targetMember = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
      select: {
        id: true,
        userId: true,
        role: true,
      },
    })

    if (!targetMember) {
      return notFoundResponse('Team member')
    }

    // Cannot modify yourself
    if (targetMember.userId === userId) {
      return forbiddenResponse('You cannot change your own role')
    }

    // Check if current user can manage the target's role
    if (!canManageRole(currentMembership.role, targetMember.role)) {
      return forbiddenResponse('You cannot manage members with equal or higher roles')
    }

    // Check if the new role can be assigned by this user
    const assignableRoles = getAssignableRoles(currentMembership.role)
    if (!assignableRoles.includes(newRole as 'ADMIN' | 'MEMBER' | 'VIEWER')) {
      return forbiddenResponse(`You cannot assign the ${newRole} role`)
    }

    // Update the member's role
    const updatedMember = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    logger.info('Team member role updated', {
      organizationId,
      updatedBy: userId,
      memberId,
      previousRole: targetMember.role,
      newRole,
    })

    return successResponse({
      member: {
        id: updatedMember.id,
        userId: updatedMember.userId,
        role: updatedMember.role,
        joinedAt: updatedMember.createdAt, // Use createdAt as joinedAt
        user: updatedMember.user,
      },
    })
  } catch (error) {
    logger.error('Failed to update team member', error)
    return handleApiError(error)
  }
}

/**
 * DELETE /api/teams/[memberId]
 * Remove a team member from the organization
 * Requires: team.remove permission
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate CSRF token
    const csrfValid = await validateCsrfToken(request)
    if (!csrfValid) {
      return forbiddenResponse('Invalid or missing CSRF token')
    }

    const { userId } = await getServerAuth()

    if (!userId) {
      return unauthorizedResponse('Please sign in to remove team members')
    }

    // Rate limit: 5 removals per minute per user
    const identifier = getIdentifier(request, userId)
    const rateLimitKey = getRateLimitKey(RATE_LIMIT_NAMESPACES.TEAM_MEMBER, identifier)
    const { success: rateLimitOk, reset } = await checkStrictRateLimit(rateLimitKey)
    if (!rateLimitOk) {
      return rateLimitErrorResponse(reset)
    }

    const resolvedParams = await params
    const { memberId } = resolvedParams

    const body = await request.json()
    const parseResult = removeMemberSchema.safeParse(body)

    if (!parseResult.success) {
      return validationErrorResponse(parseResult.error)
    }

    const { organizationId } = parseResult.data

    // Get the current user's membership
    const currentMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: { role: true },
    })

    if (!currentMembership) {
      return forbiddenResponse('You are not a member of this organization')
    }

    // Check permission to remove team members
    if (!hasPermission(currentMembership.role, 'team.remove')) {
      return forbiddenResponse('You do not have permission to remove team members')
    }

    // Get the target member
    const targetMember = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
      select: {
        id: true,
        userId: true,
        role: true,
      },
    })

    if (!targetMember) {
      return notFoundResponse('Team member')
    }

    // Cannot remove yourself (must leave instead)
    if (targetMember.userId === userId) {
      return forbiddenResponse('You cannot remove yourself. Use the leave team option instead.')
    }

    // Cannot remove owners
    if (targetMember.role === 'OWNER') {
      return forbiddenResponse('Owners cannot be removed from the organization')
    }

    // Check if current user can manage the target's role
    if (!canManageRole(currentMembership.role, targetMember.role)) {
      return forbiddenResponse('You cannot remove members with equal or higher roles')
    }

    // Remove the member
    await prisma.organizationMember.delete({
      where: { id: memberId },
    })

    logger.info('Team member removed', {
      organizationId,
      removedBy: userId,
      memberId,
      removedUserId: targetMember.userId,
    })

    return successResponse({ removed: true })
  } catch (error) {
    logger.error('Failed to remove team member', error)
    return handleApiError(error)
  }
}

/**
 * GET /api/teams/[memberId]
 * Get details for a specific team member
 * Requires: team.read permission
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await getServerAuth()

    if (!userId) {
      return unauthorizedResponse('Please sign in to view team member details')
    }

    const resolvedParams = await params
    const { memberId } = resolvedParams

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return errorResponse('Organization ID is required', 'MISSING_ORG_ID', undefined, 400)
    }

    // Check if user is a member of the organization
    const currentMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: { role: true },
    })

    if (!currentMembership) {
      return forbiddenResponse('You are not a member of this organization')
    }

    // Check permission to view team
    if (!hasPermission(currentMembership.role, 'team.read')) {
      return forbiddenResponse('You do not have permission to view team members')
    }

    // Get the target member with user details
    const member = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    if (!member) {
      return notFoundResponse('Team member')
    }

    return successResponse({
      member: {
        id: member.id,
        userId: member.userId,
        role: member.role,
        joinedAt: member.createdAt, // Use createdAt as joinedAt
        user: member.user,
      },
    })
  } catch (error) {
    logger.error('Failed to get team member', error)
    return handleApiError(error)
  }
}
