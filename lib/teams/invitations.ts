/**
 * Invitation handling for multi-tenant team management
 * Handles creating, sending, and accepting team invitations
 */

import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { hasPermission, isValidRole, type Role } from './permissions'
import { getBaseUrl } from '@/lib/url'

/**
 * Invitation expiration time in milliseconds (7 days)
 */
const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Result type for invitation operations
 */
export interface InvitationResult {
  success: boolean
  error?: string
  invitation?: {
    id: string
    email: string
    role: string
    token: string
    expiresAt: Date
  }
}

/**
 * Create an invitation to join an organization
 * @param organizationId - The organization to invite to
 * @param email - The email address to invite
 * @param role - The role to assign when accepted
 * @param invitedById - The user ID of the person sending the invitation
 * @returns InvitationResult with the created invitation or error
 */
export async function createInvitation(
  organizationId: string,
  email: string,
  role: string,
  invitedById: string
): Promise<InvitationResult> {
  // Validate role
  if (!isValidRole(role)) {
    return {
      success: false,
      error: `Invalid role: ${role}`,
    }
  }

  // Cannot invite as OWNER
  if (role === 'OWNER') {
    return {
      success: false,
      error: 'Cannot invite users as owners',
    }
  }

  // Check if the inviter has permission to invite
  const inviterMembership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: invitedById,
      },
    },
    select: { role: true },
  })

  if (!inviterMembership) {
    return {
      success: false,
      error: 'You are not a member of this organization',
    }
  }

  if (!hasPermission(inviterMembership.role, 'team.invite')) {
    return {
      success: false,
      error: 'You do not have permission to invite team members',
    }
  }

  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (existingUser) {
    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: existingUser.id,
        },
      },
    })

    if (existingMember) {
      return {
        success: false,
        error: 'This user is already a member of the organization',
      }
    }
  }

  // Check for existing pending invitation
  const existingInvitation = await prisma.organizationInvitation.findUnique({
    where: {
      organizationId_email: {
        organizationId,
        email,
      },
    },
  })

  if (existingInvitation && !existingInvitation.acceptedAt) {
    // Update existing invitation if not expired
    if (existingInvitation.expiresAt > new Date()) {
      return {
        success: false,
        error: 'An invitation has already been sent to this email address',
      }
    }

    // Delete expired invitation to allow new one
    await prisma.organizationInvitation.delete({
      where: { id: existingInvitation.id },
    })
  }

  // Generate a secure token
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS)

  try {
    const invitation = await prisma.organizationInvitation.create({
      data: {
        organizationId,
        email: email.toLowerCase().trim(),
        role,
        token,
        expiresAt,
        invitedById,
      },
    })

    return {
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
      },
    }
  } catch (error) {
    console.error('Failed to create invitation:', error)
    return {
      success: false,
      error: 'Failed to create invitation',
    }
  }
}

/**
 * Accept an invitation to join an organization
 * @param token - The invitation token
 * @param userId - The user ID accepting the invitation
 * @returns Object with success status and error message if applicable
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string; organizationId?: string }> {
  // Find the invitation
  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token },
    include: {
      organization: {
        select: { id: true, name: true },
      },
    },
  })

  if (!invitation) {
    return {
      success: false,
      error: 'Invitation not found',
    }
  }

  // Check if already accepted
  if (invitation.acceptedAt) {
    return {
      success: false,
      error: 'This invitation has already been used',
    }
  }

  // Check if expired
  if (invitation.expiresAt < new Date()) {
    return {
      success: false,
      error: 'This invitation has expired',
    }
  }

  // Verify the user's email matches the invitation
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  if (!user) {
    return {
      success: false,
      error: 'User not found',
    }
  }

  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return {
      success: false,
      error: 'This invitation was sent to a different email address',
    }
  }

  // Check if user is already a member
  const existingMember = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: invitation.organizationId,
        userId,
      },
    },
  })

  if (existingMember) {
    return {
      success: false,
      error: 'You are already a member of this organization',
    }
  }

  try {
    // Accept the invitation in a transaction
    await prisma.$transaction([
      // Create the membership
      prisma.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId,
          role: invitation.role,
        },
      }),
      // Mark invitation as accepted
      prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ])

    return {
      success: true,
      organizationId: invitation.organizationId,
    }
  } catch (error) {
    console.error('Failed to accept invitation:', error)
    return {
      success: false,
      error: 'Failed to accept invitation',
    }
  }
}

/**
 * Get invitation details by token
 * @param token - The invitation token
 * @returns Invitation details or null if not found
 */
export async function getInvitationByToken(token: string) {
  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          logo: true,
        },
      },
    },
  })

  if (!invitation) {
    return null
  }

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
    isExpired: invitation.expiresAt < new Date(),
    isAccepted: invitation.acceptedAt !== null,
    organization: invitation.organization,
  }
}

/**
 * Cancel (delete) an invitation
 * @param invitationId - The invitation ID to cancel
 * @param organizationId - The organization ID
 * @param userId - The user ID performing the cancellation
 * @returns Object with success status and error message if applicable
 */
export async function cancelInvitation(
  invitationId: string,
  organizationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Check if the user has permission to remove invitations
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
    return {
      success: false,
      error: 'You are not a member of this organization',
    }
  }

  if (!hasPermission(membership.role, 'team.invite')) {
    return {
      success: false,
      error: 'You do not have permission to cancel invitations',
    }
  }

  // Find and delete the invitation
  const invitation = await prisma.organizationInvitation.findFirst({
    where: {
      id: invitationId,
      organizationId,
      acceptedAt: null, // Can only cancel pending invitations
    },
  })

  if (!invitation) {
    return {
      success: false,
      error: 'Invitation not found or already accepted',
    }
  }

  try {
    await prisma.organizationInvitation.delete({
      where: { id: invitationId },
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to cancel invitation:', error)
    return {
      success: false,
      error: 'Failed to cancel invitation',
    }
  }
}

/**
 * Resend an invitation (refresh the token and expiry)
 * @param invitationId - The invitation ID to resend
 * @param organizationId - The organization ID
 * @param userId - The user ID performing the resend
 * @returns InvitationResult with the updated invitation or error
 */
export async function resendInvitation(
  invitationId: string,
  organizationId: string,
  userId: string
): Promise<InvitationResult> {
  // Check if the user has permission
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
    return {
      success: false,
      error: 'You are not a member of this organization',
    }
  }

  if (!hasPermission(membership.role, 'team.invite')) {
    return {
      success: false,
      error: 'You do not have permission to resend invitations',
    }
  }

  // Find the invitation
  const invitation = await prisma.organizationInvitation.findFirst({
    where: {
      id: invitationId,
      organizationId,
      acceptedAt: null,
    },
  })

  if (!invitation) {
    return {
      success: false,
      error: 'Invitation not found or already accepted',
    }
  }

  // Generate new token and expiry
  const newToken = randomBytes(32).toString('hex')
  const newExpiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS)

  try {
    const updatedInvitation = await prisma.organizationInvitation.update({
      where: { id: invitationId },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
      },
    })

    return {
      success: true,
      invitation: {
        id: updatedInvitation.id,
        email: updatedInvitation.email,
        role: updatedInvitation.role,
        token: updatedInvitation.token,
        expiresAt: updatedInvitation.expiresAt,
      },
    }
  } catch (error) {
    console.error('Failed to resend invitation:', error)
    return {
      success: false,
      error: 'Failed to resend invitation',
    }
  }
}

/**
 * Get all pending invitations for an organization
 * @param organizationId - The organization ID
 * @param userId - The user ID requesting the list
 * @returns Array of pending invitations or error
 */
export async function getPendingInvitations(
  organizationId: string,
  userId: string
): Promise<{
  success: boolean
  error?: string
  invitations?: Array<{
    id: string
    email: string
    role: string
    expiresAt: Date
    createdAt: Date
    isExpired: boolean
  }>
}> {
  // Check if the user has permission to view team
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
    return {
      success: false,
      error: 'You are not a member of this organization',
    }
  }

  if (!hasPermission(membership.role, 'team.read')) {
    return {
      success: false,
      error: 'You do not have permission to view invitations',
    }
  }

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

  return {
    success: true,
    invitations: invitations.map((inv) => ({
      ...inv,
      isExpired: inv.expiresAt < new Date(),
    })),
  }
}

/**
 * Generate an invitation link
 * @param token - The invitation token
 * @returns The full invitation URL
 */
export function generateInvitationLink(token: string): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/invitations/${token}`
}
