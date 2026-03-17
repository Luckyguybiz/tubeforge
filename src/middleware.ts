import { auth } from '@/server/auth';

/**
 * NextAuth v5 middleware — protects app routes from unauthenticated access.
 *
 * Public routes (landing, auth, legal, API, static assets) are excluded
 * via the `matcher` config below. Everything else requires a valid session.
 */
export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    /*
     * Match only /dashboard, /editor, /thumbnails, /metadata,
     * /preview, /settings, /team, /admin — the protected app routes.
     *
     * Everything else (landing, auth, legal, API, static assets) is public.
     */
    '/dashboard/:path*',
    '/editor/:path*',
    '/thumbnails/:path*',
    '/metadata/:path*',
    '/preview/:path*',
    '/settings/:path*',
    '/team/:path*',
    '/admin/:path*',
  ],
};
