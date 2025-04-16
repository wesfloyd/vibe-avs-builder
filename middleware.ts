import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';

// Track unique routes we've seen
const seenRoutes = new Set<string>();

// This function runs on every request
export async function middleware(request: NextRequest) {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const isOnChat = request.nextUrl.pathname.startsWith('/');
  const isOnRegister = request.nextUrl.pathname.startsWith('/register');
  const isOnLogin = request.nextUrl.pathname.startsWith('/login');

  // Log the request method and path
  console.log(
    `${new Date().toISOString()} - ${request.method} ${request.nextUrl.pathname}${request.nextUrl.search || ''}`,
  );

  // Track routes for debugging
  const route = `${request.method} ${request.nextUrl.pathname}`;
  if (!seenRoutes.has(route)) {
    seenRoutes.add(route);
    console.log(`\n🔍 New route discovered: ${route}`);
    console.log('📋 Current available routes:');
    seenRoutes.forEach((r) => console.log(`   ${r}`));
    console.log('\n');
  }

  // Auth logic
  if (isLoggedIn && (isOnLogin || isOnRegister)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isOnRegister || isOnLogin) {
    return NextResponse.next();
  }

  if (isOnChat) {
    if (isLoggedIn) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Match all request paths except for:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// Log available routes at startup
console.log('\n--- MIDDLEWARE INITIALIZED ---');
console.log('Middleware active and logging all requests');
console.log('New routes will be logged as they are discovered');
console.log('--- END MIDDLEWARE INIT ---\n');
