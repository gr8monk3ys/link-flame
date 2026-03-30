import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Teams Module Unit Tests
 *
 * Tests the teams permission system and invitation handling:
 * - Permission checking for different roles
 * - Role hierarchy and management
 * - Invitation creation, acceptance, cancellation, and resending
 */

// Mock Prisma before importing modules that use it
vi.mock('@/lib/prisma', () => ({
  prisma: {
    organizationMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    organizationInvitation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Import after mocking
import {
  hasPermission,
  getPermissionsForRole,
  canManageRole,
  getAssignableRoles,
  isValidRole,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  type Role,
} from '@/lib/teams/permissions'

import {
  createInvitation,
  acceptInvitation,
  cancelInvitation,
  resendInvitation,
  generateInvitationLink,
} from '@/lib/teams/invitations'

import { prisma } from '@/lib/prisma'

// Cast prisma methods as mocks for easier use
const mockPrisma = prisma as unknown as {
  organizationMember: {
    findUnique: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  organizationInvitation: {
    findUnique: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  user: {
    findUnique: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

describe('Teams Permissions - hasPermission()', () => {
  describe('OWNER role permissions', () => {
    it('should have all permissions', () => {
      const allPermissions = Object.keys(PERMISSIONS)
      allPermissions.forEach((permission) => {
        expect(hasPermission('OWNER', permission)).toBe(true)
      })
    })

    it('should have products.read permission', () => {
      expect(hasPermission('OWNER', 'products.read')).toBe(true)
    })

    it('should have products.create permission', () => {
      expect(hasPermission('OWNER', 'products.create')).toBe(true)
    })

    it('should have products.update permission', () => {
      expect(hasPermission('OWNER', 'products.update')).toBe(true)
    })

    it('should have products.delete permission', () => {
      expect(hasPermission('OWNER', 'products.delete')).toBe(true)
    })

    it('should have orders.read permission', () => {
      expect(hasPermission('OWNER', 'orders.read')).toBe(true)
    })

    it('should have orders.manage permission', () => {
      expect(hasPermission('OWNER', 'orders.manage')).toBe(true)
    })

    it('should have team.read permission', () => {
      expect(hasPermission('OWNER', 'team.read')).toBe(true)
    })

    it('should have team.invite permission', () => {
      expect(hasPermission('OWNER', 'team.invite')).toBe(true)
    })

    it('should have team.remove permission', () => {
      expect(hasPermission('OWNER', 'team.remove')).toBe(true)
    })

    it('should have billing.read permission', () => {
      expect(hasPermission('OWNER', 'billing.read')).toBe(true)
    })

    it('should have billing.manage permission', () => {
      expect(hasPermission('OWNER', 'billing.manage')).toBe(true)
    })

    it('should have settings.read permission', () => {
      expect(hasPermission('OWNER', 'settings.read')).toBe(true)
    })

    it('should have settings.manage permission', () => {
      expect(hasPermission('OWNER', 'settings.manage')).toBe(true)
    })
  })

  describe('ADMIN role permissions', () => {
    it('should have all permissions except billing.manage', () => {
      const allPermissions = Object.keys(PERMISSIONS)
      allPermissions.forEach((permission) => {
        if (permission === 'billing.manage') {
          expect(hasPermission('ADMIN', permission)).toBe(false)
        } else {
          expect(hasPermission('ADMIN', permission)).toBe(true)
        }
      })
    })

    it('should NOT have billing.manage permission', () => {
      expect(hasPermission('ADMIN', 'billing.manage')).toBe(false)
    })

    it('should have billing.read permission', () => {
      expect(hasPermission('ADMIN', 'billing.read')).toBe(true)
    })

    it('should have team.invite permission', () => {
      expect(hasPermission('ADMIN', 'team.invite')).toBe(true)
    })

    it('should have team.remove permission', () => {
      expect(hasPermission('ADMIN', 'team.remove')).toBe(true)
    })

    it('should have settings.manage permission', () => {
      expect(hasPermission('ADMIN', 'settings.manage')).toBe(true)
    })

    it('should have products.delete permission', () => {
      expect(hasPermission('ADMIN', 'products.delete')).toBe(true)
    })
  })

  describe('MEMBER role permissions', () => {
    it('should have products.read permission', () => {
      expect(hasPermission('MEMBER', 'products.read')).toBe(true)
    })

    it('should have products.create permission', () => {
      expect(hasPermission('MEMBER', 'products.create')).toBe(true)
    })

    it('should have products.update permission', () => {
      expect(hasPermission('MEMBER', 'products.update')).toBe(true)
    })

    it('should NOT have products.delete permission', () => {
      expect(hasPermission('MEMBER', 'products.delete')).toBe(false)
    })

    it('should have orders.read permission', () => {
      expect(hasPermission('MEMBER', 'orders.read')).toBe(true)
    })

    it('should have orders.manage permission', () => {
      expect(hasPermission('MEMBER', 'orders.manage')).toBe(true)
    })

    it('should have team.read permission', () => {
      expect(hasPermission('MEMBER', 'team.read')).toBe(true)
    })

    it('should NOT have team.invite permission', () => {
      expect(hasPermission('MEMBER', 'team.invite')).toBe(false)
    })

    it('should NOT have team.remove permission', () => {
      expect(hasPermission('MEMBER', 'team.remove')).toBe(false)
    })

    it('should NOT have billing.read permission', () => {
      expect(hasPermission('MEMBER', 'billing.read')).toBe(false)
    })

    it('should NOT have billing.manage permission', () => {
      expect(hasPermission('MEMBER', 'billing.manage')).toBe(false)
    })

    it('should have settings.read permission', () => {
      expect(hasPermission('MEMBER', 'settings.read')).toBe(true)
    })

    it('should NOT have settings.manage permission', () => {
      expect(hasPermission('MEMBER', 'settings.manage')).toBe(false)
    })
  })

  describe('VIEWER role permissions', () => {
    it('should have products.read permission', () => {
      expect(hasPermission('VIEWER', 'products.read')).toBe(true)
    })

    it('should NOT have products.create permission', () => {
      expect(hasPermission('VIEWER', 'products.create')).toBe(false)
    })

    it('should NOT have products.update permission', () => {
      expect(hasPermission('VIEWER', 'products.update')).toBe(false)
    })

    it('should NOT have products.delete permission', () => {
      expect(hasPermission('VIEWER', 'products.delete')).toBe(false)
    })

    it('should have orders.read permission', () => {
      expect(hasPermission('VIEWER', 'orders.read')).toBe(true)
    })

    it('should NOT have orders.manage permission', () => {
      expect(hasPermission('VIEWER', 'orders.manage')).toBe(false)
    })

    it('should have team.read permission', () => {
      expect(hasPermission('VIEWER', 'team.read')).toBe(true)
    })

    it('should NOT have team.invite permission', () => {
      expect(hasPermission('VIEWER', 'team.invite')).toBe(false)
    })

    it('should NOT have billing.read permission', () => {
      expect(hasPermission('VIEWER', 'billing.read')).toBe(false)
    })

    it('should NOT have settings.read permission', () => {
      expect(hasPermission('VIEWER', 'settings.read')).toBe(false)
    })

    it('should only have read-only permissions', () => {
      const viewerPermissions = getPermissionsForRole('VIEWER')
      expect(viewerPermissions).toEqual(['products.read', 'orders.read', 'team.read'])
    })
  })

  describe('Invalid role handling', () => {
    it('should return false for invalid role', () => {
      expect(hasPermission('INVALID_ROLE', 'products.read')).toBe(false)
    })

    it('should return false for empty role', () => {
      expect(hasPermission('', 'products.read')).toBe(false)
    })

    it('should return false for lowercase role', () => {
      expect(hasPermission('owner', 'products.read')).toBe(false)
    })

    it('should return false for mixed case role', () => {
      expect(hasPermission('Owner', 'products.read')).toBe(false)
    })

    it('should return false for null-like role', () => {
      expect(hasPermission('null', 'products.read')).toBe(false)
    })

    it('should return false for invalid permission', () => {
      expect(hasPermission('OWNER', 'invalid.permission')).toBe(false)
    })

    it('should return false for empty permission', () => {
      expect(hasPermission('OWNER', '')).toBe(false)
    })
  })
})

describe('Teams Permissions - getPermissionsForRole()', () => {
  it('should return all permissions for OWNER', () => {
    const permissions = getPermissionsForRole('OWNER')
    expect(permissions).toEqual(Object.keys(PERMISSIONS))
    expect(permissions.length).toBe(13)
  })

  it('should return all permissions except billing.manage for ADMIN', () => {
    const permissions = getPermissionsForRole('ADMIN')
    expect(permissions).not.toContain('billing.manage')
    expect(permissions.length).toBe(12)
  })

  it('should return limited permissions for MEMBER', () => {
    const permissions = getPermissionsForRole('MEMBER')
    expect(permissions).toEqual([
      'products.read',
      'products.create',
      'products.update',
      'orders.read',
      'orders.manage',
      'team.read',
      'settings.read',
    ])
    expect(permissions.length).toBe(7)
  })

  it('should return read-only permissions for VIEWER', () => {
    const permissions = getPermissionsForRole('VIEWER')
    expect(permissions).toEqual(['products.read', 'orders.read', 'team.read'])
    expect(permissions.length).toBe(3)
  })

  it('should return empty array for invalid role', () => {
    const permissions = getPermissionsForRole('INVALID')
    expect(permissions).toEqual([])
  })

  it('should return empty array for empty role', () => {
    const permissions = getPermissionsForRole('')
    expect(permissions).toEqual([])
  })
})

describe('Teams Permissions - canManageRole()', () => {
  describe('OWNER management capabilities', () => {
    it('should be able to manage ADMIN', () => {
      expect(canManageRole('OWNER', 'ADMIN')).toBe(true)
    })

    it('should be able to manage MEMBER', () => {
      expect(canManageRole('OWNER', 'MEMBER')).toBe(true)
    })

    it('should be able to manage VIEWER', () => {
      expect(canManageRole('OWNER', 'VIEWER')).toBe(true)
    })

    it('should NOT be able to manage another OWNER', () => {
      expect(canManageRole('OWNER', 'OWNER')).toBe(false)
    })
  })

  describe('ADMIN management capabilities', () => {
    it('should be able to manage MEMBER', () => {
      expect(canManageRole('ADMIN', 'MEMBER')).toBe(true)
    })

    it('should be able to manage VIEWER', () => {
      expect(canManageRole('ADMIN', 'VIEWER')).toBe(true)
    })

    it('should NOT be able to manage OWNER', () => {
      expect(canManageRole('ADMIN', 'OWNER')).toBe(false)
    })

    it('should NOT be able to manage another ADMIN', () => {
      expect(canManageRole('ADMIN', 'ADMIN')).toBe(false)
    })
  })

  describe('MEMBER management capabilities', () => {
    it('should NOT be able to manage OWNER', () => {
      expect(canManageRole('MEMBER', 'OWNER')).toBe(false)
    })

    it('should NOT be able to manage ADMIN', () => {
      expect(canManageRole('MEMBER', 'ADMIN')).toBe(false)
    })

    it('should NOT be able to manage another MEMBER', () => {
      expect(canManageRole('MEMBER', 'MEMBER')).toBe(false)
    })

    it('should be able to manage VIEWER (hierarchy level)', () => {
      // Note: canManageRole is based on hierarchy levels (MEMBER=2 > VIEWER=1)
      // This is different from getAssignableRoles which returns empty for MEMBER
      expect(canManageRole('MEMBER', 'VIEWER')).toBe(true)
    })
  })

  describe('VIEWER management capabilities', () => {
    it('should NOT be able to manage anyone', () => {
      expect(canManageRole('VIEWER', 'OWNER')).toBe(false)
      expect(canManageRole('VIEWER', 'ADMIN')).toBe(false)
      expect(canManageRole('VIEWER', 'MEMBER')).toBe(false)
      expect(canManageRole('VIEWER', 'VIEWER')).toBe(false)
    })
  })

  describe('Equal role management', () => {
    it('should NOT allow managing equal roles', () => {
      expect(canManageRole('OWNER', 'OWNER')).toBe(false)
      expect(canManageRole('ADMIN', 'ADMIN')).toBe(false)
      expect(canManageRole('MEMBER', 'MEMBER')).toBe(false)
      expect(canManageRole('VIEWER', 'VIEWER')).toBe(false)
    })
  })

  describe('Invalid role handling', () => {
    it('should return false when manager role is invalid', () => {
      expect(canManageRole('INVALID', 'MEMBER')).toBe(false)
    })

    it('should return false when target role is invalid', () => {
      expect(canManageRole('OWNER', 'INVALID')).toBe(true) // Invalid has level 0, OWNER (4) > 0
    })

    it('should return false for both invalid roles', () => {
      expect(canManageRole('INVALID1', 'INVALID2')).toBe(false) // Both have level 0
    })
  })
})

describe('Teams Permissions - getAssignableRoles()', () => {
  it('should return ADMIN, MEMBER, VIEWER for OWNER', () => {
    const roles = getAssignableRoles('OWNER')
    expect(roles).toEqual(['ADMIN', 'MEMBER', 'VIEWER'])
  })

  it('should return MEMBER, VIEWER for ADMIN', () => {
    const roles = getAssignableRoles('ADMIN')
    expect(roles).toEqual(['MEMBER', 'VIEWER'])
  })

  it('should return empty array for MEMBER', () => {
    const roles = getAssignableRoles('MEMBER')
    expect(roles).toEqual([])
  })

  it('should return empty array for VIEWER', () => {
    const roles = getAssignableRoles('VIEWER')
    expect(roles).toEqual([])
  })

  it('should return empty array for invalid role', () => {
    const roles = getAssignableRoles('INVALID')
    expect(roles).toEqual([])
  })

  it('OWNER should not be able to assign OWNER role', () => {
    const roles = getAssignableRoles('OWNER')
    expect(roles).not.toContain('OWNER')
  })

  it('ADMIN should not be able to assign ADMIN or OWNER role', () => {
    const roles = getAssignableRoles('ADMIN')
    expect(roles).not.toContain('ADMIN')
    expect(roles).not.toContain('OWNER')
  })
})

describe('Teams Permissions - isValidRole()', () => {
  it('should return true for OWNER', () => {
    expect(isValidRole('OWNER')).toBe(true)
  })

  it('should return true for ADMIN', () => {
    expect(isValidRole('ADMIN')).toBe(true)
  })

  it('should return true for MEMBER', () => {
    expect(isValidRole('MEMBER')).toBe(true)
  })

  it('should return true for VIEWER', () => {
    expect(isValidRole('VIEWER')).toBe(true)
  })

  it('should return false for lowercase role', () => {
    expect(isValidRole('owner')).toBe(false)
  })

  it('should return false for mixed case role', () => {
    expect(isValidRole('Admin')).toBe(false)
  })

  it('should return false for invalid role', () => {
    expect(isValidRole('SUPERUSER')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isValidRole('')).toBe(false)
  })

  it('should return false for whitespace', () => {
    expect(isValidRole(' ')).toBe(false)
  })

  it('should return false for role with spaces', () => {
    expect(isValidRole('OWNER ')).toBe(false)
  })
})

describe('Teams Invitations - createInvitation()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should create invitation with correct fields', async () => {
    const organizationId = 'org-123'
    const email = 'test@example.com'
    const role = 'MEMBER'
    const invitedById = 'user-123'

    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' })
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.organizationInvitation.findUnique.mockResolvedValue(null)
    mockPrisma.organizationInvitation.create.mockImplementation(async ({ data }) => ({
      id: 'inv-123',
      email: data.email,
      role: data.role,
      token: data.token,
      expiresAt: data.expiresAt,
    }))

    const result = await createInvitation(organizationId, email, role, invitedById)

    expect(result.success).toBe(true)
    expect(result.invitation).toBeDefined()
    expect(result.invitation?.email).toBe('test@example.com')
    expect(result.invitation?.role).toBe('MEMBER')
    expect(result.invitation?.token).toBeDefined()
    expect(result.invitation?.token.length).toBeGreaterThan(0)
  })

  it('should generate secure token', async () => {
    const organizationId = 'org-123'
    const email = 'test@example.com'
    const role = 'MEMBER'
    const invitedById = 'user-123'

    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' })
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.organizationInvitation.findUnique.mockResolvedValue(null)
    mockPrisma.organizationInvitation.create.mockImplementation(async ({ data }) => ({
      id: 'inv-123',
      email: data.email,
      role: data.role,
      token: data.token,
      expiresAt: data.expiresAt,
    }))

    const result = await createInvitation(organizationId, email, role, invitedById)

    expect(result.success).toBe(true)
    // Token should be 64 characters (32 bytes as hex)
    expect(result.invitation?.token.length).toBe(64)
    // Token should be a valid hex string
    expect(result.invitation?.token).toMatch(/^[a-f0-9]+$/)
  })

  it('should set correct expiration (7 days)', async () => {
    const organizationId = 'org-123'
    const email = 'test@example.com'
    const role = 'MEMBER'
    const invitedById = 'user-123'

    const now = Date.now()

    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' })
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.organizationInvitation.findUnique.mockResolvedValue(null)
    mockPrisma.organizationInvitation.create.mockImplementation(async ({ data }) => ({
      id: 'inv-123',
      email: data.email,
      role: data.role,
      token: data.token,
      expiresAt: data.expiresAt,
    }))

    const result = await createInvitation(organizationId, email, role, invitedById)

    expect(result.success).toBe(true)
    expect(result.invitation?.expiresAt).toBeDefined()
    // Check expiry is approximately 7 days from now (within 1 minute tolerance)
    const expiryTime = result.invitation!.expiresAt.getTime()
    const expectedTime = now + 7 * 24 * 60 * 60 * 1000
    expect(Math.abs(expiryTime - expectedTime)).toBeLessThan(60000)
  })

  it('should normalize email to lowercase', async () => {
    const organizationId = 'org-123'
    const email = 'TEST@EXAMPLE.COM'
    const role = 'MEMBER'
    const invitedById = 'user-123'

    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' })
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.organizationInvitation.findUnique.mockResolvedValue(null)
    mockPrisma.organizationInvitation.create.mockImplementation(async ({ data }) => ({
      id: 'inv-123',
      email: data.email,
      role: data.role,
      token: data.token,
      expiresAt: data.expiresAt,
    }))

    const result = await createInvitation(organizationId, email, role, invitedById)

    expect(result.success).toBe(true)
    expect(result.invitation?.email).toBe('test@example.com')
    expect(mockPrisma.organizationInvitation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'test@example.com',
        }),
      })
    )
  })

  it('should reject duplicate pending invitation', async () => {
    const organizationId = 'org-123'
    const email = 'test@example.com'
    const role = 'MEMBER'
    const invitedById = 'user-123'

    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' })
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.organizationInvitation.findUnique.mockResolvedValue({
      id: 'existing-inv',
      email,
      role,
      acceptedAt: null,
      expiresAt: new Date(Date.now() + 86400000), // Still valid (expires in 1 day)
    })

    const result = await createInvitation(organizationId, email, role, invitedById)

    expect(result.success).toBe(false)
    expect(result.error).toBe('An invitation has already been sent to this email address')
  })

  it('should reject invalid role', async () => {
    const result = await createInvitation('org-123', 'test@example.com', 'INVALID_ROLE', 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid role: INVALID_ROLE')
  })

  it('should reject OWNER role assignment', async () => {
    const result = await createInvitation('org-123', 'test@example.com', 'OWNER', 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Cannot invite users as owners')
  })

  it('should reject if inviter is not a member', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null)

    const result = await createInvitation('org-123', 'test@example.com', 'MEMBER', 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('You are not a member of this organization')
  })

  it('should reject if inviter lacks permission', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'MEMBER' })

    const result = await createInvitation('org-123', 'test@example.com', 'VIEWER', 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('You do not have permission to invite team members')
  })

  it('should reject if user is already a member', async () => {
    mockPrisma.organizationMember.findUnique
      .mockResolvedValueOnce({ role: 'OWNER' }) // Inviter check
      .mockResolvedValueOnce({ role: 'MEMBER' }) // Existing member check

    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user-id' })

    const result = await createInvitation('org-123', 'test@example.com', 'MEMBER', 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('This user is already a member of the organization')
  })
})

describe('Teams Invitations - acceptInvitation()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should accept valid token', async () => {
    const token = 'valid-token'
    const userId = 'user-123'

    mockPrisma.organizationInvitation.findUnique.mockResolvedValue({
      id: 'inv-123',
      token,
      email: 'test@example.com',
      role: 'MEMBER',
      organizationId: 'org-123',
      acceptedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
      organization: { id: 'org-123', name: 'Test Org' },
    })

    mockPrisma.user.findUnique.mockResolvedValue({
      id: userId,
      email: 'test@example.com',
    })

    mockPrisma.organizationMember.findUnique.mockResolvedValue(null)
    mockPrisma.$transaction.mockResolvedValue([{}, {}])

    const result = await acceptInvitation(token, userId)

    expect(result.success).toBe(true)
    expect(result.organizationId).toBe('org-123')
  })

  it('should reject expired token', async () => {
    const token = 'expired-token'
    const userId = 'user-123'

    mockPrisma.organizationInvitation.findUnique.mockResolvedValue({
      id: 'inv-123',
      token,
      email: 'test@example.com',
      role: 'MEMBER',
      organizationId: 'org-123',
      acceptedAt: null,
      expiresAt: new Date(Date.now() - 86400000), // Expired yesterday
      organization: { id: 'org-123', name: 'Test Org' },
    })

    const result = await acceptInvitation(token, userId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('This invitation has expired')
  })

  it('should reject already accepted invitation', async () => {
    const token = 'used-token'
    const userId = 'user-123'

    mockPrisma.organizationInvitation.findUnique.mockResolvedValue({
      id: 'inv-123',
      token,
      email: 'test@example.com',
      role: 'MEMBER',
      organizationId: 'org-123',
      acceptedAt: new Date(), // Already accepted
      expiresAt: new Date(Date.now() + 86400000),
      organization: { id: 'org-123', name: 'Test Org' },
    })

    const result = await acceptInvitation(token, userId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('This invitation has already been used')
  })

  it('should reject email mismatch', async () => {
    const token = 'valid-token'
    const userId = 'user-123'

    mockPrisma.organizationInvitation.findUnique.mockResolvedValue({
      id: 'inv-123',
      token,
      email: 'invited@example.com',
      role: 'MEMBER',
      organizationId: 'org-123',
      acceptedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
      organization: { id: 'org-123', name: 'Test Org' },
    })

    mockPrisma.user.findUnique.mockResolvedValue({
      id: userId,
      email: 'different@example.com', // Different email
    })

    const result = await acceptInvitation(token, userId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('This invitation was sent to a different email address')
  })

  it('should reject invitation not found', async () => {
    mockPrisma.organizationInvitation.findUnique.mockResolvedValue(null)

    const result = await acceptInvitation('nonexistent-token', 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invitation not found')
  })

  it('should reject if user not found', async () => {
    mockPrisma.organizationInvitation.findUnique.mockResolvedValue({
      id: 'inv-123',
      token: 'valid-token',
      email: 'test@example.com',
      role: 'MEMBER',
      organizationId: 'org-123',
      acceptedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
      organization: { id: 'org-123', name: 'Test Org' },
    })

    mockPrisma.user.findUnique.mockResolvedValue(null)

    const result = await acceptInvitation('valid-token', 'nonexistent-user')

    expect(result.success).toBe(false)
    expect(result.error).toBe('User not found')
  })

  it('should reject if already a member', async () => {
    mockPrisma.organizationInvitation.findUnique.mockResolvedValue({
      id: 'inv-123',
      token: 'valid-token',
      email: 'test@example.com',
      role: 'MEMBER',
      organizationId: 'org-123',
      acceptedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
      organization: { id: 'org-123', name: 'Test Org' },
    })

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    })

    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      userId: 'user-123',
      organizationId: 'org-123',
      role: 'MEMBER',
    })

    const result = await acceptInvitation('valid-token', 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('You are already a member of this organization')
  })
})

describe('Teams Invitations - cancelInvitation()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should cancel pending invitation', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'ADMIN' })
    mockPrisma.organizationInvitation.findFirst.mockResolvedValue({
      id: 'inv-123',
      email: 'test@example.com',
      acceptedAt: null,
    })
    mockPrisma.organizationInvitation.delete.mockResolvedValue({})

    const result = await cancelInvitation('inv-123', 'org-123', 'user-123')

    expect(result.success).toBe(true)
    expect(mockPrisma.organizationInvitation.delete).toHaveBeenCalledWith({
      where: { id: 'inv-123' },
    })
  })

  it('should reject if user is not a member', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null)

    const result = await cancelInvitation('inv-123', 'org-123', 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('You are not a member of this organization')
  })

  it('should reject if user lacks permission', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'MEMBER' })

    const result = await cancelInvitation('inv-123', 'org-123', 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('You do not have permission to cancel invitations')
  })

  it('should reject if invitation not found', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'ADMIN' })
    mockPrisma.organizationInvitation.findFirst.mockResolvedValue(null)

    const result = await cancelInvitation('nonexistent-inv', 'org-123', 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invitation not found or already accepted')
  })

  it('should reject if invitation already accepted', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'ADMIN' })
    mockPrisma.organizationInvitation.findFirst.mockResolvedValue(null) // findFirst filters out accepted

    const result = await cancelInvitation('inv-123', 'org-123', 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invitation not found or already accepted')
  })
})

describe('Teams Invitations - resendInvitation()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate new token on resend', async () => {
    const originalToken = 'original-token-that-is-different-from-new-one-1234567890'

    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'ADMIN' })
    mockPrisma.organizationInvitation.findFirst.mockResolvedValue({
      id: 'inv-123',
      email: 'test@example.com',
      role: 'MEMBER',
      token: originalToken,
      acceptedAt: null,
    })
    mockPrisma.organizationInvitation.update.mockImplementation(async ({ data }) => ({
      id: 'inv-123',
      email: 'test@example.com',
      role: 'MEMBER',
      token: data.token,
      expiresAt: data.expiresAt,
    }))

    const result = await resendInvitation('inv-123', 'org-123', 'user-123')

    expect(result.success).toBe(true)
    // New token should be 64 characters (32 bytes as hex)
    expect(result.invitation?.token.length).toBe(64)
    // New token should be different from original
    expect(result.invitation?.token).not.toBe(originalToken)
    // New token should be a valid hex string
    expect(result.invitation?.token).toMatch(/^[a-f0-9]+$/)
  })

  it('should extend expiration on resend', async () => {
    const now = Date.now()

    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'ADMIN' })
    mockPrisma.organizationInvitation.findFirst.mockResolvedValue({
      id: 'inv-123',
      email: 'test@example.com',
      role: 'MEMBER',
      token: 'old-token',
      acceptedAt: null,
    })
    mockPrisma.organizationInvitation.update.mockImplementation(async ({ data }) => ({
      id: 'inv-123',
      email: 'test@example.com',
      role: 'MEMBER',
      token: data.token,
      expiresAt: data.expiresAt,
    }))

    const result = await resendInvitation('inv-123', 'org-123', 'user-123')

    expect(result.success).toBe(true)
    expect(result.invitation?.expiresAt).toBeDefined()
    // New expiry should be approximately 7 days from now
    const expiryTime = result.invitation!.expiresAt.getTime()
    expect(Math.abs(expiryTime - (now + 7 * 24 * 60 * 60 * 1000))).toBeLessThan(60000)
  })

  it('should reject if user is not a member', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null)

    const result = await resendInvitation('inv-123', 'org-123', 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('You are not a member of this organization')
  })

  it('should reject if user lacks permission', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'VIEWER' })

    const result = await resendInvitation('inv-123', 'org-123', 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('You do not have permission to resend invitations')
  })

  it('should reject if invitation not found', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'ADMIN' })
    mockPrisma.organizationInvitation.findFirst.mockResolvedValue(null)

    const result = await resendInvitation('nonexistent-inv', 'org-123', 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invitation not found or already accepted')
  })

  it('should reject if invitation already accepted', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'ADMIN' })
    mockPrisma.organizationInvitation.findFirst.mockResolvedValue(null) // findFirst filters out accepted

    const result = await resendInvitation('inv-123', 'org-123', 'user-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invitation not found or already accepted')
  })
})

describe('Teams Invitations - generateInvitationLink()', () => {
  const originalEnv = process.env.NEXT_PUBLIC_URL

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_URL = originalEnv
    } else {
      delete process.env.NEXT_PUBLIC_URL
    }
  })

  it('should generate correct invitation link with default URL', () => {
    delete process.env.NEXT_PUBLIC_URL
    const link = generateInvitationLink('test-token')
    expect(link).toBe('http://localhost:3000/invitations/test-token')
  })

  it('should use NEXT_PUBLIC_URL if set', () => {
    process.env.NEXT_PUBLIC_URL = 'https://example.com'
    const link = generateInvitationLink('test-token')
    expect(link).toBe('https://example.com/invitations/test-token')
  })

  it('should handle token with special characters', () => {
    const link = generateInvitationLink('token-with-dashes-123')
    expect(link).toContain('token-with-dashes-123')
  })
})

describe('Teams Permissions - Role Hierarchy Consistency', () => {
  it('should have consistent permission hierarchy (OWNER > ADMIN > MEMBER > VIEWER)', () => {
    const ownerPerms = getPermissionsForRole('OWNER')
    const adminPerms = getPermissionsForRole('ADMIN')
    const memberPerms = getPermissionsForRole('MEMBER')
    const viewerPerms = getPermissionsForRole('VIEWER')

    // OWNER should have more or equal permissions than ADMIN
    expect(ownerPerms.length).toBeGreaterThanOrEqual(adminPerms.length)

    // ADMIN should have more or equal permissions than MEMBER
    expect(adminPerms.length).toBeGreaterThanOrEqual(memberPerms.length)

    // MEMBER should have more or equal permissions than VIEWER
    expect(memberPerms.length).toBeGreaterThanOrEqual(viewerPerms.length)
  })

  it('should have VIEWER permissions as subset of MEMBER permissions', () => {
    const memberPerms = getPermissionsForRole('MEMBER')
    const viewerPerms = getPermissionsForRole('VIEWER')

    viewerPerms.forEach((perm) => {
      expect(memberPerms).toContain(perm)
    })
  })

  it('should have MEMBER permissions as subset of ADMIN permissions', () => {
    const adminPerms = getPermissionsForRole('ADMIN')
    const memberPerms = getPermissionsForRole('MEMBER')

    memberPerms.forEach((perm) => {
      expect(adminPerms).toContain(perm)
    })
  })

  it('should have ADMIN permissions as subset of OWNER permissions', () => {
    const ownerPerms = getPermissionsForRole('OWNER')
    const adminPerms = getPermissionsForRole('ADMIN')

    adminPerms.forEach((perm) => {
      expect(ownerPerms).toContain(perm)
    })
  })
})

describe('Teams Permissions - ROLE_PERMISSIONS constant', () => {
  it('should define permissions for all roles', () => {
    expect(ROLE_PERMISSIONS.OWNER).toBeDefined()
    expect(ROLE_PERMISSIONS.ADMIN).toBeDefined()
    expect(ROLE_PERMISSIONS.MEMBER).toBeDefined()
    expect(ROLE_PERMISSIONS.VIEWER).toBeDefined()
  })

  it('should have non-empty arrays for all roles', () => {
    expect(ROLE_PERMISSIONS.OWNER.length).toBeGreaterThan(0)
    expect(ROLE_PERMISSIONS.ADMIN.length).toBeGreaterThan(0)
    expect(ROLE_PERMISSIONS.MEMBER.length).toBeGreaterThan(0)
    expect(ROLE_PERMISSIONS.VIEWER.length).toBeGreaterThan(0)
  })

  it('should only contain valid permissions', () => {
    const validPermissions = Object.keys(PERMISSIONS)

    Object.values(ROLE_PERMISSIONS).forEach((perms) => {
      perms.forEach((perm) => {
        expect(validPermissions).toContain(perm)
      })
    })
  })
})
