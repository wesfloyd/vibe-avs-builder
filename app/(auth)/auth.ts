import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUser, createGuestUserIfNotExists } from '@/lib/db/queries';

import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

// Removed eager guest user creation to prevent timeouts

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
        try {
          // Auto-login as guest user - lazy loading approach
          const guestEmail = 'guest@example.com';
          
          // Try to get guest user first without creating
          try {
            const users = await getUser(guestEmail);
            if (users.length > 0) {
              return users[0] as any;
            }
          } catch (error) {
            console.warn('Failed to get guest user, attempting to create', error);
          }
          
          // If getting failed, try to create the guest user
          try {
            await createGuestUserIfNotExists();
            const users = await getUser(guestEmail);
            if (users.length > 0) {
              return users[0] as any;
            }
          } catch (createError) {
            console.error('Failed to create guest user', createError);
          }
          
          // Fallback to normal login if somehow guest user fails
          if (email && password) {
            try {
              const users = await getUser(email);
              if (users.length > 0) {
                // biome-ignore lint: Forbidden non-null assertion.
                const passwordsMatch = await compare(password, users[0].password!);
                if (passwordsMatch) {
                  return users[0] as any;
                }
              }
            } catch (loginError) {
              console.error('Login error:', loginError);
            }
          }
          
          // If all database operations fail, create an in-memory user
          // This allows the app to work even if DB isn't available
          return {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'guest@example.com'
          } as any;
        } catch (error) {
          console.error('Auth error:', error);
          // Return fallback user on any error
          return {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'guest@example.com'
          } as any;
        }
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
