import { auth as nextAuth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Server-side auth helper using NextAuth
 * Returns the current user's ID if authenticated, null otherwise
 */
export async function getServerAuth() {
  const session = await nextAuth();
  return {
    userId: session?.user?.id || null,
    user: session?.user || null,
    session,
  };
}

/**
 * Check if user has a specific role
 * @param userId - The user ID to check
 * @param allowedRoles - Array of allowed roles
 * @returns true if user has one of the allowed roles
 */
export async function requireRole(
  userId: string | null,
  allowedRoles: string[]
): Promise<boolean> {
  if (!userId) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;

  return allowedRoles.includes(user.role);
}

/**
 * Get user role
 * @param userId - The user ID
 * @returns The user's role or null
 */
export async function getUserRole(userId: string | null): Promise<string | null> {
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role || null;
}
