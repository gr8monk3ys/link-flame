/**
 * Permission system for multi-tenant team management
 * Defines granular permissions and role-based access control
 */

/**
 * All available permissions in the system
 * Keys are permission identifiers, values are human-readable descriptions
 */
export const PERMISSIONS = {
  'products.read': 'View products',
  'products.create': 'Create products',
  'products.update': 'Update products',
  'products.delete': 'Delete products',
  'orders.read': 'View orders',
  'orders.manage': 'Manage orders',
  'team.read': 'View team members',
  'team.invite': 'Invite team members',
  'team.remove': 'Remove team members',
  'billing.read': 'View billing',
  'billing.manage': 'Manage billing',
  'settings.read': 'View settings',
  'settings.manage': 'Manage settings',
} as const

/**
 * Type representing a valid permission key
 */
export type Permission = keyof typeof PERMISSIONS

/**
 * Available roles in the system
 */
export const ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const

/**
 * Type representing a valid role
 */
export type Role = keyof typeof ROLES

/**
 * Human-readable role labels for UI display
 */
export const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Owner',
  ADMIN: 'Administrator',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
}

/**
 * Role descriptions for UI display
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  OWNER: 'Full access to all features including billing and team management',
  ADMIN: 'Can manage team members and all content, but cannot manage billing',
  MEMBER: 'Can create and manage products and orders',
  VIEWER: 'Read-only access to products, orders, and team information',
}

/**
 * Permissions assigned to each role
 * Roles inherit permissions hierarchically (OWNER > ADMIN > MEMBER > VIEWER)
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: Object.keys(PERMISSIONS) as Permission[],
  ADMIN: Object.keys(PERMISSIONS).filter(
    (p) => p !== 'billing.manage'
  ) as Permission[],
  MEMBER: [
    'products.read',
    'products.create',
    'products.update',
    'orders.read',
    'orders.manage',
    'team.read',
    'settings.read',
  ],
  VIEWER: ['products.read', 'orders.read', 'team.read'],
}

/**
 * Check if a role has a specific permission
 * @param role - The role to check
 * @param permission - The permission to verify
 * @returns true if the role has the permission
 */
export function hasPermission(role: string, permission: string): boolean {
  const roleKey = role as Role
  if (!ROLE_PERMISSIONS[roleKey]) {
    return false
  }
  return ROLE_PERMISSIONS[roleKey].includes(permission as Permission)
}

/**
 * Get all permissions for a role
 * @param role - The role to get permissions for
 * @returns Array of permission keys for the role
 */
export function getPermissionsForRole(role: string): Permission[] {
  const roleKey = role as Role
  return ROLE_PERMISSIONS[roleKey] ?? []
}

/**
 * Get all available roles
 * @returns Array of role objects with key, label, and description
 */
export function getAllRoles(): Array<{
  key: Role
  label: string
  description: string
  permissions: Permission[]
}> {
  return Object.keys(ROLES).map((key) => ({
    key: key as Role,
    label: ROLE_LABELS[key as Role],
    description: ROLE_DESCRIPTIONS[key as Role],
    permissions: ROLE_PERMISSIONS[key as Role],
  }))
}

/**
 * Check if a role can manage another role
 * Owners can manage all roles, Admins can manage Members and Viewers
 * @param managerRole - The role of the user trying to manage
 * @param targetRole - The role of the user being managed
 * @returns true if the manager can manage the target
 */
export function canManageRole(managerRole: string, targetRole: string): boolean {
  const roleHierarchy: Record<Role, number> = {
    OWNER: 4,
    ADMIN: 3,
    MEMBER: 2,
    VIEWER: 1,
  }

  const managerLevel = roleHierarchy[managerRole as Role] ?? 0
  const targetLevel = roleHierarchy[targetRole as Role] ?? 0

  // Can only manage roles with lower hierarchy level
  return managerLevel > targetLevel
}

/**
 * Get roles that a user can assign to others based on their own role
 * @param userRole - The role of the user assigning roles
 * @returns Array of roles the user can assign
 */
export function getAssignableRoles(userRole: string): Role[] {
  switch (userRole) {
    case 'OWNER':
      return ['ADMIN', 'MEMBER', 'VIEWER']
    case 'ADMIN':
      return ['MEMBER', 'VIEWER']
    default:
      return []
  }
}

/**
 * Validate if a role string is a valid role
 * @param role - The role string to validate
 * @returns true if the role is valid
 */
export function isValidRole(role: string): role is Role {
  return Object.keys(ROLES).includes(role)
}

/**
 * Permission groups for UI organization
 */
export const PERMISSION_GROUPS = {
  Products: ['products.read', 'products.create', 'products.update', 'products.delete'],
  Orders: ['orders.read', 'orders.manage'],
  Team: ['team.read', 'team.invite', 'team.remove'],
  Billing: ['billing.read', 'billing.manage'],
  Settings: ['settings.read', 'settings.manage'],
} as const

/**
 * Get permissions organized by groups
 * @returns Object with permission groups and their permissions
 */
export function getPermissionsByGroup(): Record<
  string,
  Array<{ key: Permission; label: string }>
> {
  const result: Record<string, Array<{ key: Permission; label: string }>> = {}

  for (const [group, permissions] of Object.entries(PERMISSION_GROUPS)) {
    result[group] = permissions.map((p) => ({
      key: p as Permission,
      label: PERMISSIONS[p as Permission],
    }))
  }

  return result
}
