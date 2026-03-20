import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/* ------------------------------------------------------------------ */
/*  Edge-level IP rate limiting                                       */
/*                                                                    */
/*  The Edge Runtime keeps a single long-lived instance per region,   */
/*  so an in-memory Map here is significantly more effective than     */
/*  one inside a serverless function (which cold-starts frequently).  */
/*                                                                    */
/*  This is still best-effort — Vercel may recycle edge instances at  */
/*  any time. For strict guarantees, migrate to @upstash/ratelimit.   */
/* ------------------------------------------------------------------ */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/** IP -> sliding-window counter */
const rateLimitMap = new Map<string, RateLimitEntry>();

/** Requests allowed per window per IP */
const RATE_LIMIT_MAX = 120;
/** Window duration in ms (1 minute) */
const RATE_LIMIT_WINDOW_MS = 60_000;
/** Purge stale entries every N calls to keep the Map bounded */
const CLEANUP_INTERVAL = 1_000;
/** Entries older than this are eligible for purge */
const STALE_THRESHOLD_MS = 5 * 60_000; // 5 minutes

let callCounter = 0;

/**
 * Returns `true` if the request is within the rate limit for the given IP.
 * Returns `false` (should 429) when the IP has exceeded RATE_LIMIT_MAX
 * requests within the current window.
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Periodic cleanup of stale entries
  callCounter++;
  if (callCounter >= CLEANUP_INTERVAL) {
    callCounter = 0;
    const cutoff = now - STALE_THRESHOLD_MS;
    for (const [key, entry] of rateLimitMap) {
      if (entry.resetAt < cutoff) {
        rateLimitMap.delete(key);
      }
    }
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    // No record or window expired — start a fresh window
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

/* ------------------------------------------------------------------ */
/*  Auth.js v5 session cookie names                                   */
/* ------------------------------------------------------------------ */
const SESSION_COOKIE_NAMES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  // Legacy next-auth v4 names (fallback during migration)
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
];

/* ------------------------------------------------------------------ */
/*  Middleware                                                         */
/* ------------------------------------------------------------------ */

/**
 * Lightweight middleware that:
 *  1. Rate-limits requests by IP at the edge layer.
 *  2. Checks for the session cookie directly (instead of using the
 *     `auth()` wrapper, which requires Prisma / Node runtime).
 */
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets — let through immediately (no rate-limit cost)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.\w{2,5}$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // --- IP rate limiting (applies to all non-static requests) ---
  // Prefer Vercel's x-real-ip (set by Vercel Edge from the actual client IP,
  // more trustworthy than x-forwarded-for which can be appended to).
  const ip =
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  if (!checkRateLimit(ip)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
        'Content-Type': 'text/plain',
      },
    });
  }

  // Public routes that don't require auth
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/api/auth',
    '/api/stripe/webhook',
    '/api/webhooks',
    '/api/health',
    '/privacy',
    '/terms',
  ];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for session cookie (Auth.js v5 uses different names in dev vs prod)
  const hasSession = SESSION_COOKIE_NAMES.some((name) => {
    const cookie = req.cookies.get(name);
    return cookie && cookie.value.length > 0;
  });

  if (!hasSession) {
    // API routes: return JSON 401 instead of redirect (fetch can't follow redirects to HTML)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }
    // Page routes: redirect to login
    const loginUrl = new URL('/login', req.url);
    // Prevent open redirect: only allow internal paths (starting with / but not //)
    const safeCallback =
      pathname.startsWith('/') && !pathname.startsWith('//')
        ? pathname
        : '/dashboard';
    loginUrl.searchParams.set('callbackUrl', safeCallback);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
