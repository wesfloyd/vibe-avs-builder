import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUser, createGuestUserIfNotExists } from '@/lib/db/queries';

import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

// Ensure guest user exists on initialization
createGuestUserIfNotExists().catch(console.error);

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any = {}) {
        // Auto-login as guest user
        // Get or create a guest user
        const guestEmail = 'guest@example.com';
        await createGuestUserIfNotExists();
        const users = await getUser(guestEmail);
        
        if (users.length > 0) {
          return users[0] as any;
        }
        
        // Fallback to normal login if somehow guest user fails
        if (email && password) {
          const users = await getUser(email);
          if (users.length === 0) return null;
          // biome-ignore lint: Forbidden non-null assertion.
          const passwordsMatch = await compare(password, users[0].password!);
          if (!passwordsMatch) return null;
          return users[0] as any;
        }
        
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session.user) {
        session.user.id = token.id as string;
        
        // Override email to show as guest if needed
        if (!session.user.email) {
          session.user.email = 'guest@example.com';
        }
      }

      return session;
    },
  },
});
