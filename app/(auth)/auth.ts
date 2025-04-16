import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUser } from '@/lib/db/queries';

import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

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
      async authorize({ email, password }: any) {
        try {
          console.log('Attempting to authorize user:', email);
          const users = await getUser(email);

          if (users.length === 0) {
            console.log('No user found with email:', email);
            return null;
          }

          const user = users[0];
          if (!user.password) {
            console.log('User found but no password set:', email);
            return null;
          }

          const passwordsMatch = await compare(password, user.password);
          if (!passwordsMatch) {
            console.log('Password mismatch for user:', email);
            return null;
          }

          console.log('Successfully authorized user:', email);
          return user as any;
        } catch (error) {
          console.error('Error during authorization:', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            email,
            timestamp: new Date().toISOString(),
          });
          return null;
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
      }
      return session;
    },
  },
});
