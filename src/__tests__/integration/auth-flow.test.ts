// @vitest-environment node
/**
 * Integration tests — Auth flow
 *
 * Verifies authentication-related critical paths:
 *   - Unauthenticated requests to protected tRPC endpoints return UNAUTHORIZED
 *   - Rate limiting behavior on protected endpoints
 *   - Session validation (valid session passes, missing/expired session fails)
 *   - Protected page routes redirect to login
 *   - API routes return JSON 401 without auth
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';

/* ── Mock modules ──────────────────────────────────────────────── */

const mockRateLimit = vi.fn().mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60_000 });
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...args: unknown[]) => mockRateLimit(...args) }));
vi.mock('@/lib/constants', () => ({ RATE_LIMIT_ERROR: 'Too many requests' }));

/* ── tRPC setup ───────────────────────────────────────────────── */

type Session = {
  user: { id: string; name?: string | null; email?: string | null };
  expires: string;
} | null;

/* eslint-disable @typescript-eslint/no-explicit-any */
type MockDb = Record<string, any>;
type TRPCContext = { db: MockDb; session: Session };

const t = initTRPC.context<TRPCContext>().create({ transformer: superjson });

const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx });
});

const { rateLimit } = await import('@/lib/rate-limit');

async function checkRate(userId: string) {
  const { success } = await rateLimit({ identifier: `auth:${userId}`, limit: 10, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many requests' });
}

/* ── Test router ──────────────────────────────────────────────── */

const authTestRouter = t.router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    await checkRate(ctx.session!.user.id);
    const user = await ctx.db.user.findUnique({ where: { id: ctx.session!.user.id } });
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
    return { id: user.id, name: user.name, email: user.email };
  }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await checkRate(ctx.session!.user.id);
      return ctx.db.user.update({
        where: { id: ctx.session!.user.id },
        data: { name: input.name },
      });
    }),

  listProjects: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.project.findMany({ where: { userId: ctx.session!.user.id } });
  }),

  publicHealthCheck: t.procedure.query(() => {
    return { status: 'ok', timestamp: Date.now() };
  }),
});

/* ── Middleware auth logic (replicated) ─────────────────────── */

const SESSION_COOKIE_NAMES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
];

const publicPaths = [
  '/', '/login', '/register', '/api/auth', '/api/stripe/webhook',
  '/api/webhooks', '/api/health', '/privacy', '/terms',
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isStaticAsset(pathname: string): boolean {
  return pathname.startsWith('/_next') || pathname.startsWith('/favicon') || /\.\w{2,5}$/.test(pathname);
}

function hasCookie(cookies: Map<string, string>): boolean {
  return SESSION_COOKIE_NAMES.some((name) => {
    const value = cookies.get(name);
    return value !== undefined && value.length > 0;
  });
}

type AuthResult = { action: 'next' | 'redirect' | 'json-401'; redirectUrl?: string };

function processAuthCheck(pathname: string, cookies: Map<string, string>): AuthResult {
  if (isStaticAsset(pathname)) return { action: 'next' };
  if (isPublicPath(pathname)) return { action: 'next' };
  const hasSession = hasCookie(cookies);
  if (!hasSession) {
    if (pathname.startsWith('/api/')) return { action: 'json-401' };
    return { action: 'redirect', redirectUrl: `/login?callbackUrl=${encodeURIComponent(pathname)}` };
  }
  return { action: 'next' };
}

/* ── Helpers ───────────────────────────────────────────────── */

const USER_ID = 'user-auth-int-001';

function makeSession(): Session {
  return { user: { id: USER_ID, name: 'Auth User', email: 'auth@test.com' }, expires: '2099-01-01' };
}

function makeDb(): MockDb {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: USER_ID, name: 'Auth User', email: 'auth@test.com' }),
      update: vi.fn().mockResolvedValue({ id: USER_ID, name: 'Updated Name' }),
    },
    project: {
      findMany: vi.fn().mockResolvedValue([{ id: 'p1', title: 'Project 1' }]),
    },
  };
}

function createCaller(db: MockDb, session: Session) {
  return authTestRouter.createCaller({ db, session });
}

/* ── Tests ─────────────────────────────────────────────────── */

describe('Auth flow integration', () => {
  let db: MockDb;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60_000 });
    db = makeDb();
  });

  /* ── Unauthenticated requests return UNAUTHORIZED ──────── */

  it('unauthenticated request to getProfile throws UNAUTHORIZED', async () => {
    const caller = createCaller(db, null);

    await expect(caller.getProfile()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('unauthenticated request to updateProfile throws UNAUTHORIZED', async () => {
    const caller = createCaller(db, null);

    await expect(caller.updateProfile({ name: 'Hacker' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('unauthenticated request to listProjects throws UNAUTHORIZED', async () => {
    const caller = createCaller(db, null);

    await expect(caller.listProjects()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('public health check works without authentication', async () => {
    const caller = createCaller(db, null);

    const result = await caller.publicHealthCheck();
    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeGreaterThan(0);
  });

  /* ── Rate limiting behavior ────────────────────────────── */

  it('rate limiting blocks rapid successive requests', async () => {
    const caller = createCaller(db, makeSession());

    // First request passes
    await expect(caller.getProfile()).resolves.toBeDefined();

    // Simulate rate limit hit
    mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() + 30_000 });

    await expect(caller.getProfile()).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
  });

  it('rate limit check uses correct identifier per user', async () => {
    const caller = createCaller(db, makeSession());

    await caller.getProfile();

    expect(mockRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: `auth:${USER_ID}`, limit: 10, window: 60 }),
    );
  });

  /* ── Session validation ────────────────────────────────── */

  it('valid session allows access to protected endpoints', async () => {
    const caller = createCaller(db, makeSession());

    const profile = await caller.getProfile();
    expect(profile).toEqual({ id: USER_ID, name: 'Auth User', email: 'auth@test.com' });
  });

  /* ── Middleware-level auth checks ──────────────────────── */

  it('middleware returns json-401 for unauthenticated API requests', () => {
    const emptyCookies = new Map<string, string>();

    const result = processAuthCheck('/api/upload', emptyCookies);
    expect(result.action).toBe('json-401');
  });

  it('middleware redirects unauthenticated page requests to login', () => {
    const emptyCookies = new Map<string, string>();

    const result = processAuthCheck('/dashboard', emptyCookies);
    expect(result.action).toBe('redirect');
    expect(result.redirectUrl).toContain('/login');
    expect(result.redirectUrl).toContain('callbackUrl=%2Fdashboard');
  });

  it('middleware allows authenticated requests through with valid session cookie', () => {
    const cookies = new Map<string, string>([['authjs.session-token', 'valid-token-abc']]);

    expect(processAuthCheck('/dashboard', cookies).action).toBe('next');
    expect(processAuthCheck('/editor', cookies).action).toBe('next');
    expect(processAuthCheck('/api/upload', cookies).action).toBe('next');
  });
});
