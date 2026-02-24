import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import authConfig from './auth.config';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id as string;
        token.tokenVersion = user.tokenVersion ?? 0;
        return token;
      }

      if (!token.id) {
        return token;
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { tokenVersion: true },
      });

      if (!currentUser) {
        return {};
      }

      // Session revocation check: password reset increments tokenVersion.
      if ((token.tokenVersion ?? 0) !== currentUser.tokenVersion) {
        return {};
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id && token.role) {
          session.user.role = token.role as string;
          session.user.id = token.id as string;
        } else {
          session.user.role = '';
          session.user.id = '';
        }
      }
      return session;
    },
  },
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const validatedFields = credentialsSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            password: true,
            tokenVersion: true,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
    ...authConfig.providers,
  ],
});
