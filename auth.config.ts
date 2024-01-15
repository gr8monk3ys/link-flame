import type { NextAuthConfig } from 'next-auth';

/**
 * Auth config shared between middleware (Edge Runtime) and server.
 *
 * IMPORTANT: This file runs in Edge Runtime (middleware), so it must NOT
 * import Prisma, bcrypt, or any Node.js-only modules. The Credentials
 * provider with database lookup lives in auth.ts (server-side only).
 */
export default {
  providers: [],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
} satisfies NextAuthConfig;
