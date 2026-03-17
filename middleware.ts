import { auth } from '@/server/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes that don't require auth
  const publicPaths = ['/', '/login', '/register', '/api/auth', '/api/stripe/webhook', '/privacy', '/terms'];
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Static assets — match common file extensions, not arbitrary dots in paths
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || /\.\w{2,5}$/.test(pathname)) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublic) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
