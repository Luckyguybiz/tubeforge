import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Lightweight middleware that checks for the session cookie directly.
 *
 * We cannot use the `auth()` wrapper here because it pulls in the Prisma
 * adapter, and Prisma does not run on the Edge Runtime that Next.js
 * middleware uses.  Instead we simply look for the session-token cookie
 * that NextAuth sets after a successful sign-in.
 */
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes that don't require auth
  const publicPaths = ['/', '/login', '/register', '/api/auth', '/api/stripe/webhook', '/api/webhooks', '/api/health', '/api/auth-debug', '/privacy', '/terms'];
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || /\.\w{2,5}$/.test(pathname)) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublic) {
    return NextResponse.next();
  }

  // Check for session cookie (NextAuth uses different cookie names in dev vs prod)
  const hasSession =
    req.cookies.has('authjs.session-token') ||
    req.cookies.has('__Secure-authjs.session-token') ||
    req.cookies.has('next-auth.session-token') ||
    req.cookies.has('__Secure-next-auth.session-token');

  if (!hasSession) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
