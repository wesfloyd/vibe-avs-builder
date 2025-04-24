import NextAuth, { type User, type Session } from 'next-auth';
import Google from 'next-auth/providers/google';

import { authConfig } from './auth.config';
import { createGoogleUser, getUser } from '@/lib/db/queries';

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
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only handle Google sign ins
      if (account?.provider === 'google' && user.email) {
        try {
          // Check if user exists
          const existingUsers = await getUser(user.email);
          
          // If user doesn't exist, create them
          if (!existingUsers || existingUsers.length === 0) {
            await createGoogleUser(user.email);
          }
          
          return true;
        } catch (error) {
          console.error('Error creating user during Google sign in:', error);
          return false;
        }
      }
      
      return true;
    },
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
