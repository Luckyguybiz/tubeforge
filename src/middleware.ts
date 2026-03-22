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
/** Separate stricter rate limit map for auth endpoints */
const authRateLimitMap = new Map<string, RateLimitEntry>();

/** Requests allowed per window per IP */
const RATE_LIMIT_MAX = 120;
/** Auth endpoint: stricter limit (10 requests per minute) */
const AUTH_RATE_LIMIT_MAX = 10;
/** Window duration in ms (1 minute) */
const RATE_LIMIT_WINDOW_MS = 60_000;
/** Purge stale entries every N calls to keep the Map bounded */
const CLEANUP_INTERVAL = 1_000;
/** Entries older than this are eligible for purge */
const STALE_THRESHOLD_MS = 5 * 60_000; // 5 minutes
/** Maximum number of entries per rate-limit map to prevent memory exhaustion */
const MAX_ENTRIES = 10_000;

let callCounter = 0;

/**
 * Emergency cleanup when a map exceeds MAX_ENTRIES.
 * First removes expired entries, then drops the oldest 50%.
 */
function emergencyCleanup(map: Map<string, RateLimitEntry>): void {
  const now = Date.now();

  // Step 1: remove expired entries
  for (const [key, entry] of map) {
    if (now >= entry.resetAt) {
      map.delete(key);
    }
  }

  // Step 2: if still >= MAX_ENTRIES, drop the oldest half
  if (map.size >= MAX_ENTRIES) {
    const entries = [...map.entries()].sort(
      (a, b) => a[1].resetAt - b[1].resetAt,
    );
    const toDelete = Math.ceil(entries.length * 0.5);
    for (let i = 0; i < toDelete; i++) {
      map.delete(entries[i][0]);
    }
  }
}

/**
 * Returns `true` if the request is within the rate limit for the given IP.
 * Returns `false` (should 429) when the IP has exceeded the allowed
 * requests within the current window.
 *
 * @param ip - Client IP address
 * @param map - Which rate limit map to use
 * @param max - Maximum requests per window
 */
function checkRateLimit(
  ip: string,
  map: Map<string, RateLimitEntry> = rateLimitMap,
  max: number = RATE_LIMIT_MAX,
): boolean {
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
    for (const [key, entry] of authRateLimitMap) {
      if (entry.resetAt < cutoff) {
        authRateLimitMap.delete(key);
      }
    }
  }

  // Emergency cleanup if the map exceeds the size cap
  if (map.size >= MAX_ENTRIES) {
    emergencyCleanup(map);
  }

  const entry = map.get(ip);

  if (!entry || now > entry.resetAt) {
    // No record or window expired — start a fresh window
    map.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  entry.count++;
  return entry.count <= max;
}

/* ------------------------------------------------------------------ */
/*  Security headers                                                   */
/* ------------------------------------------------------------------ */
const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/** Create a NextResponse.next() with security headers applied. */
function nextWithSecurityHeaders() {
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
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
    return nextWithSecurityHeaders();
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

  // --- Stricter rate limiting for auth endpoints (brute-force protection) ---
  if (pathname.startsWith('/api/auth/')) {
    if (!checkRateLimit(ip, authRateLimitMap, AUTH_RATE_LIMIT_MAX)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
          'Content-Type': 'text/plain',
        },
      });
    }
  }

  // Public routes that don't require auth
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/pricing',
    '/blog',
    '/about',
    '/contact',
    '/help',
    '/compare',
    '/vpn',
    '/free-tools',
    '/api/free-tools',
    '/api/auth',
    '/api/stripe/webhook',
    '/api/webhooks',
    '/api/health',
    '/privacy',
    '/terms',
    '/dpa',
    '/sla',
    '/security',
  ];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (isPublic) {
    return nextWithSecurityHeaders();
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

  return nextWithSecurityHeaders();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/tools/video-translate).*)'],
};
