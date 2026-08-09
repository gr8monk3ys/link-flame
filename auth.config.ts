import type { NextAuthConfig } from 'next-auth';

/**
 * Auth config shared between middleware (Edge Runtime) and server.
 *
 * IMPORTANT: This file runs in Edge Runtime (middleware), so it must NOT
 * import Prisma, bcrypt, or any Node.js-only modules. The Credentials
 * provider with database lookup lives in auth.ts (server-side only).
 */
export default {
  // Auth.js rejects any request whose Host it does not trust, and it only
  // infers trust automatically in development or when it detects Vercel. This
  // repo also ships a Dockerfile and docker-compose, and on any self-hosted
  // production host every /api/auth/* request failed outright with
  // `UntrustedHost` - sign-in, session, callbacks, all of it.
  //
  // It never showed up because the dev server trusts localhost and nothing
  // tested a production build. Pointing the E2E suite at `next start` surfaced
  // it immediately.
  //
  // NEXTAUTH_URL is what callback URLs are built from, so trusting the
  // forwarded host does not let an attacker redirect the flow elsewhere.
  trustHost: true,
  providers: [],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
} satisfies NextAuthConfig;
