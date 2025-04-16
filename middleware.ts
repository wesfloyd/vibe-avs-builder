import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function runs on every request
export function middleware(request: NextRequest) {
  // Log the request method and path
  console.log(
    `${new Date().toISOString()} - ${request.method} ${request.nextUrl.pathname}${request.nextUrl.search || ''}`,
  );

  // Allow the request to continue
  return NextResponse.next();
}

// Optional: Configure which paths the middleware runs on
// Remove this if you want it to run on all paths
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
console.log('--- END MIDDLEWARE INIT ---\n');
