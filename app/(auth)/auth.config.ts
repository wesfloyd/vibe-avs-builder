import type { NextAuthConfig } from 'next-auth';
import { isDevelopmentEnvironment, getTrustedHosts } from '@/lib/constants';

export const authConfig = {
  pages: {
    signIn: '/', // Redirect to home instead of login
    newUser: '/',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // Always authorize all requests - effectively disabling auth checks
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnLogin = nextUrl.pathname.startsWith('/login');

      // Redirect login/register pages to home
      if (isOnLogin || isOnRegister) {
        return Response.redirect(new URL('/', nextUrl as unknown as URL));
      }

      // Always allow access to all pages
      return true;
    },
  },
  trustHost: true,
  debug: isDevelopmentEnvironment(),
} satisfies NextAuthConfig;
