import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  debug: true,
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      
      // If the user is logged in and tries to access login page, redirect to home
      if (isLoggedIn && isOnLogin) {
        return Response.redirect(new URL('/', nextUrl));
      }
      
      // Always allow access to login page
      if (isOnLogin) {
        return true;
      }
      
      // If user is not logged in, redirect to login page
      if (!isLoggedIn) {
        return Response.redirect(new URL('/login', nextUrl));
      }
      
      // Logged in users can access all other pages
      return true;
    },
  },
};

// Conditionally add trustHost
if (
  process.env.NEXTAUTH_URL?.includes('localhost') ||
  process.env.NODE_ENV === 'development'
) {
  authConfig.trustHost = true;
}
