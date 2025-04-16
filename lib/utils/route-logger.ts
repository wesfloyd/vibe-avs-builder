import type { NextRequest } from 'next/server';

export function logRoute(request: NextRequest) {
  const method = request.method;
  const path = request.nextUrl.pathname;
  console.log(`[${method}] ${path}`);
}
