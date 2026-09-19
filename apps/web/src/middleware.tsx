import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith('/auth');
  const isProtectedDashboard = pathname.startsWith('/dashboard');

  if (isProtectedDashboard && !accessToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (isAuthRoute && accessToken && pathname !== '/auth/change-password') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.redirect(request.url); // fallback safety
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};