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
} from '@/lib/api-response'
import { hasPermission } from '@/lib/teams/permissions'
import { logger } from '@/lib/logger'

/**
 * Query params schema for GET /api/teams
 */
const getTeamQuerySchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
})

/**
 * GET /api/teams
 * Get all team members for an organization
 * Requires: team.read permission
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await getServerAuth()

    if (!userId) {
      return unauthorizedResponse('Please sign in to view team members')
    }

    const { searchParams } = new URL(request.url)
    const queryResult = getTeamQuerySchema.safeParse({
      organizationId: searchParams.get('organizationId'),
    })

    if (!queryResult.success) {
      return validationErrorResponse(queryResult.error)
    }

    const { organizationId } = queryResult.data

    // Check if user is a member of the organization
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

    // Check if user has permission to view team
    if (!hasPermission(membership.role, 'team.read')) {
      return forbiddenResponse('You do not have permission to view team members')
    }

    // Get all team members with user and organization details
    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, etc.
        { createdAt: 'asc' },
      ],
    })

    // Get pending invitations if user has permission
    const canInvite = hasPermission(membership.role, 'team.invite')
    let pendingInvitations: Array<{
      id: string
      email: string
      role: string
      expiresAt: Date
      createdAt: Date
      isExpired: boolean
    }> = []

    if (canInvite) {
      const invitations = await prisma.organizationInvitation.findMany({
        where: {
          organizationId,
          acceptedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
          createdAt: true,
        },
      })

      pendingInvitations = invitations.map((inv) => ({
        ...inv,
        isExpired: inv.expiresAt < new Date(),
      }))
    }

    const enrichedMembers = members.map((member) => {
      return {
        id: member.id,
        userId: member.userId,
        role: member.role,
        joinedAt: member.createdAt, // Use createdAt as joinedAt
        user: member.user
          ? {
              id: member.user.id,
              name: member.user.name,
              email: member.user.email,
              image: member.user.image,
            }
          : null,
      }
    })

    logger.info('Team members retrieved', {
      organizationId,
      userId,
      memberCount: members.length,
    })

    // Get organization from first member or fetch separately
    const organization = members[0]?.organization || null

    return successResponse({
      members: enrichedMembers,
      pendingInvitations,
      currentUserRole: membership.role,
      organization,
    })
  } catch (error) {
    logger.error('Failed to get team members', error)
    return handleApiError(error)
  }
}
