import NextAuth from 'next-auth';

import { authConfig } from '@/app/(auth)/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    '/', 
    '/:id', 
    '/api/:path*', 
    '/login', 
    '/register',
    // Exclude static files and favicon
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
