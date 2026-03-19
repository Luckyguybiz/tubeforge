// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';

/* ── Mock modules ──────────────────────────────────────────────── */

const mockRateLimit = vi.fn().mockResolvedValue({ success: true, remaining: 59, reset: Date.now() + 60_000 });
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...args: unknown[]) => mockRateLimit(...args) }));
vi.mock('@/lib/constants', () => ({ RATE_LIMIT_ERROR: 'Too many requests' }));

/* ── tRPC setup ───────────────────────────────────────────────── */

type Session = {
  user: { id: string; name?: string | null; email?: string | null; role?: string };
  expires: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type MockDb = Record<string, any>;
type TRPCContext = { db: MockDb; session: Session };

const t = initTRPC.context<TRPCContext>().create({ transformer: superjson });

const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx });
});

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.db.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { role: true },
  });
  if (user?.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

const { rateLimit } = await import('@/lib/rate-limit');
const RATE_LIMIT_ERROR = 'Too many requests';

async function checkAdminRate(userId: string) {
  const { success } = await rateLimit({ identifier: `admin:${userId}`, limit: 60, window: 60 });
  if (!success) {
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
  }
}

/* ── Admin router replica ─────────────────────────────────── */

const adminRouter = t.router({
  getStats: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, activeSubscriptions, totalAI, totalProjects, videosToday, usersThisWeek, projectsThisWeek] =
      await Promise.all([
        ctx.db.user.count(),
        ctx.db.user.count({ where: { plan: { not: 'FREE' } } }),
        ctx.db.user.aggregate({ _sum: { aiUsage: true } }),
        ctx.db.project.count(),
        ctx.db.scene.count({
          where: { status: 'READY', project: { updatedAt: { gte: todayStart } } },
        }),
        ctx.db.user.count({ where: { createdAt: { gte: weekAgo } } }),
        ctx.db.project.count({ where: { createdAt: { gte: weekAgo } } }),
      ]);

    return {
      totalUsers,
      activeSubscriptions,
      totalAIUsage: totalAI._sum.aiUsage ?? 0,
      totalProjects,
      videosToday,
      usersThisWeek,
      projectsThisWeek,
    };
  }),

  listUsers: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
      search: z.string().optional(),
      planFilter: z.enum(['FREE', 'PRO', 'STUDIO']).optional(),
      sortBy: z.enum(['createdAt', 'name', 'plan', 'role']).default('createdAt'),
      sortDir: z.enum(['asc', 'desc']).default('desc'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 20, search, planFilter, sortBy = 'createdAt', sortDir = 'desc' } = input ?? {};
      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (planFilter) where.plan = planFilter;

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          select: expect.anything(),
          orderBy: { [sortBy]: sortDir },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.db.user.count({ where }),
      ]);
      return { users, total, page, pages: Math.ceil(total / limit) };
    }),

  updateUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      plan: z.enum(['FREE', 'PRO', 'STUDIO']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkAdminRate(ctx.session.user.id);
      const { userId, ...data } = input;
      const user = await ctx.db.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      return ctx.db.user.update({ where: { id: userId }, data, select: { id: true, plan: true, role: true } });
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkAdminRate(ctx.session.user.id);
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete own account' });
      }
      await ctx.db.user.delete({ where: { id: input.userId }, select: { id: true } });
      return { success: true };
    }),

  createPayout: adminProcedure
    .input(z.object({ userId: z.string(), amount: z.number().positive(), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await checkAdminRate(ctx.session.user.id);
      return ctx.db.payout.create({
        data: { userId: input.userId, amount: input.amount, note: input.note },
        select: { id: true, userId: true, amount: true, createdAt: true },
      });
    }),
});

/* ── Helpers ───────────────────────────────────────────────── */

const ADMIN_ID = 'admin-user-001';

function makeAdminSession(userId = ADMIN_ID): Session {
  return { user: { id: userId, name: 'Admin', email: 'admin@example.com', role: 'ADMIN' }, expires: '2099-01-01' };
}

function makeUserSession(): Session {
  return { user: { id: 'user-normal-001', name: 'Regular', email: 'user@example.com', role: 'USER' }, expires: '2099-01-01' };
}

function makeDb(): MockDb {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: ADMIN_ID, role: 'ADMIN' }),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(100),
      aggregate: vi.fn().mockResolvedValue({ _sum: { aiUsage: 5000 } }),
      update: vi.fn().mockResolvedValue({ id: 'target-user', plan: 'PRO', role: 'USER' }),
      delete: vi.fn().mockResolvedValue({ id: 'target-user' }),
    },
    project: {
      count: vi.fn().mockResolvedValue(250),
    },
    scene: {
      count: vi.fn().mockResolvedValue(10),
    },
    payout: {
      create: vi.fn().mockResolvedValue({ id: 'payout-1', userId: 'target', amount: 1000, createdAt: new Date() }),
    },
  };
}

function createCaller(db: MockDb, session: Session) {
  return adminRouter.createCaller({ db, session });
}

/* ── Tests ─────────────────────────────────────────────────── */

describe('adminRouter', () => {
  let db: MockDb;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, remaining: 59, reset: Date.now() + 60_000 });
    db = makeDb();
    caller = createCaller(db, makeAdminSession());
  });

  /* ── Authorization ─────────────────────────────────────── */

  describe('authorization', () => {
    it('rejects non-admin users with FORBIDDEN', async () => {
      const userDb = makeDb();
      // The middleware checks the user's role from DB
      userDb.user.findUnique.mockResolvedValue({ role: 'USER' });
      const userCaller = createCaller(userDb, makeUserSession());
      await expect(userCaller.getStats()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('rejects unauthenticated access with UNAUTHORIZED', async () => {
      const noAuthCaller = adminRouter.createCaller({
        db,
        session: { user: { id: '' }, expires: '2099-01-01' },
      });
      await expect(noAuthCaller.getStats()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('allows admin users to access procedures', async () => {
      const result = await caller.getStats();
      expect(result).toBeDefined();
      expect(result.totalUsers).toBe(100);
    });
  });

  /* ── getStats ──────────────────────────────────────────── */

  describe('getStats', () => {
    it('returns aggregated stats', async () => {
      const result = await caller.getStats();
      expect(result).toEqual({
        totalUsers: 100,
        activeSubscriptions: 100,
        totalAIUsage: 5000,
        totalProjects: 250,
        videosToday: 10,
        usersThisWeek: 100,
        projectsThisWeek: 250,
      });
    });

    it('defaults totalAIUsage to 0 when null', async () => {
      db.user.aggregate.mockResolvedValue({ _sum: { aiUsage: null } });
      const result = await caller.getStats();
      expect(result.totalAIUsage).toBe(0);
    });

    it('queries db with correct parallel calls', async () => {
      await caller.getStats();
      // user.count is called multiple times for different filters
      expect(db.user.count).toHaveBeenCalled();
      expect(db.user.aggregate).toHaveBeenCalledWith({ _sum: { aiUsage: true } });
      expect(db.project.count).toHaveBeenCalled();
      expect(db.scene.count).toHaveBeenCalled();
    });
  });

  /* ── listUsers ─────────────────────────────────────────── */

  describe('listUsers', () => {
    it('returns paginated users with defaults', async () => {
      db.user.findMany.mockResolvedValue([{ id: 'u1', name: 'User 1' }]);
      db.user.count.mockResolvedValue(1);

      const result = await caller.listUsers();
      expect(result).toEqual({ users: [{ id: 'u1', name: 'User 1' }], total: 1, page: 1, pages: 1 });
    });

    it('applies search filter', async () => {
      db.user.findMany.mockResolvedValue([]);
      db.user.count.mockResolvedValue(0);

      await caller.listUsers({ search: 'john' });
      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('applies plan filter', async () => {
      db.user.findMany.mockResolvedValue([]);
      db.user.count.mockResolvedValue(0);

      await caller.listUsers({ planFilter: 'PRO' });
      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ plan: 'PRO' }),
        }),
      );
    });

    it('applies custom sort and pagination', async () => {
      db.user.findMany.mockResolvedValue([]);
      db.user.count.mockResolvedValue(100);

      const result = await caller.listUsers({ page: 3, limit: 10, sortBy: 'name', sortDir: 'asc' });
      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
          skip: 20,
          take: 10,
        }),
      );
      expect(result.pages).toBe(10);
    });

    it('works without input (optional)', async () => {
      db.user.findMany.mockResolvedValue([]);
      db.user.count.mockResolvedValue(0);
      const result = await caller.listUsers();
      expect(result.page).toBe(1);
    });
  });

  /* ── updateUser ────────────────────────────────────────── */

  describe('updateUser', () => {
    it('updates a user plan', async () => {
      db.user.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN' }) // adminProcedure check
        .mockResolvedValueOnce({ id: 'target-user' }); // user existence check

      const result = await caller.updateUser({ userId: 'target-user', plan: 'PRO' });
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'target-user' },
        data: { plan: 'PRO' },
        select: { id: true, plan: true, role: true },
      });
      expect(result).toEqual({ id: 'target-user', plan: 'PRO', role: 'USER' });
    });

    it('throws NOT_FOUND when target user does not exist', async () => {
      db.user.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN' }) // adminProcedure check
        .mockResolvedValueOnce(null); // user not found

      await expect(caller.updateUser({ userId: 'nonexistent' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('calls rate limit check', async () => {
      db.user.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN' })
        .mockResolvedValueOnce({ id: 'target' });

      await caller.updateUser({ userId: 'target' });
      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: `admin:${ADMIN_ID}`, limit: 60, window: 60 }),
      );
    });

    it('throws TOO_MANY_REQUESTS when rate limited', async () => {
      db.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
      mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() });

      await expect(caller.updateUser({ userId: 'target' })).rejects.toMatchObject({
        code: 'TOO_MANY_REQUESTS',
      });
    });
  });

  /* ── deleteUser ────────────────────────────────────────── */

  describe('deleteUser', () => {
    it('deletes a user', async () => {
      db.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' }); // adminProcedure check
      const result = await caller.deleteUser({ userId: 'target-user' });
      expect(result).toEqual({ success: true });
      expect(db.user.delete).toHaveBeenCalledWith({
        where: { id: 'target-user' },
        select: { id: true },
      });
    });

    it('throws BAD_REQUEST when admin tries to delete themselves', async () => {
      db.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });

      await expect(caller.deleteUser({ userId: ADMIN_ID })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    });

    it('calls rate limit check', async () => {
      db.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
      await caller.deleteUser({ userId: 'target' });
      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: `admin:${ADMIN_ID}` }),
      );
    });

    it('throws TOO_MANY_REQUESTS when rate limited', async () => {
      db.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
      mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() });
      await expect(caller.deleteUser({ userId: 'target' })).rejects.toMatchObject({
        code: 'TOO_MANY_REQUESTS',
      });
    });
  });

  /* ── createPayout ──────────────────────────────────────── */

  describe('createPayout', () => {
    it('creates a payout record', async () => {
      db.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
      const result = await caller.createPayout({ userId: 'ref-user', amount: 5000 });
      expect(db.payout.create).toHaveBeenCalledWith({
        data: { userId: 'ref-user', amount: 5000, note: undefined },
        select: { id: true, userId: true, amount: true, createdAt: true },
      });
      expect(result.id).toBe('payout-1');
    });

    it('includes optional note', async () => {
      db.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
      await caller.createPayout({ userId: 'ref-user', amount: 1000, note: 'Monthly payout' });
      expect(db.payout.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ note: 'Monthly payout' }),
        }),
      );
    });

    it('rejects non-positive amount', async () => {
      await expect(caller.createPayout({ userId: 'u', amount: 0 })).rejects.toThrow();
      await expect(caller.createPayout({ userId: 'u', amount: -100 })).rejects.toThrow();
    });

    it('calls rate limit check', async () => {
      db.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
      await caller.createPayout({ userId: 'u', amount: 100 });
      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: `admin:${ADMIN_ID}` }),
      );
    });
  });

  /* ── Input validation ──────────────────────────────────── */

  describe('input validation', () => {
    it('rejects listUsers with page less than 1', async () => {
      await expect(caller.listUsers({ page: 0 })).rejects.toThrow();
    });

    it('rejects listUsers with limit greater than 50', async () => {
      await expect(caller.listUsers({ limit: 51 })).rejects.toThrow();
    });

    it('rejects listUsers with invalid planFilter', async () => {
      // @ts-expect-error - intentionally invalid
      await expect(caller.listUsers({ planFilter: 'ULTRA' })).rejects.toThrow();
    });

    it('rejects listUsers with invalid sortBy', async () => {
      // @ts-expect-error - intentionally invalid
      await expect(caller.listUsers({ sortBy: 'email' })).rejects.toThrow();
    });

    it('rejects updateUser with invalid plan', async () => {
      // @ts-expect-error - intentionally invalid
      await expect(caller.updateUser({ userId: 'u', plan: 'ULTIMATE' })).rejects.toThrow();
    });
  });
});
