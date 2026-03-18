import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Lightweight middleware — checks session cookie directly instead of using
 * the `auth()` wrapper (which requires Prisma / Node runtime).
 *
 * NOTE: Next.js uses the ROOT middleware.ts when both exist.
 * This file is kept as reference; the root copy is the active one.
 */
export default function middleware(req: NextRequest) {
  const hasSession =
    req.cookies.has('authjs.session-token') ||
    req.cookies.has('__Secure-authjs.session-token') ||
    req.cookies.has('next-auth.session-token') ||
    req.cookies.has('__Secure-next-auth.session-token');

  if (!hasSession) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/editor/:path*',
    '/tools/:path*',
    '/thumbnails/:path*',
    '/metadata/:path*',
    '/preview/:path*',
    '/settings/:path*',
    '/team/:path*',
    '/admin/:path*',
    '/shorts-analytics/:path*',
  ],
};
