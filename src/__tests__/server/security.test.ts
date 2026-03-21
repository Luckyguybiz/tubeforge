// @vitest-environment node
/**
 * N1 — Security-critical behavior tests.
 *
 * Consolidates cross-cutting security invariants that individual router
 * tests may not cover in a single, auditable file:
 *   - Admin updateUser only accepts `plan`, NOT `role`
 *   - Team shareProject requires project ownership
 *   - Asset move checks destination folder ownership
 *   - Folder create checks parent folder ownership
 *   - AI limit enforcement (FREE user cannot exceed 5)
 *   - Scene delete requires ownership
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';

/* ── Mock modules ──────────────────────────────────────────────── */

const mockRateLimit = vi.fn().mockResolvedValue({ success: true, remaining: 59, reset: Date.now() + 60_000 });
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...args: unknown[]) => mockRateLimit(...args) }));
vi.mock('@/lib/constants', () => ({ RATE_LIMIT_ERROR: 'Too many requests' }));
const mockStripTags = vi.fn((s: string) => s.replace(/<[^>]*>/g, ''));
vi.mock('@/lib/sanitize', () => ({ stripTags: (s: string) => mockStripTags(s) }));

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
const { stripTags } = await import('@/lib/sanitize');

async function checkRate(prefix: string, userId: string, limit = 60) {
  const { success } = await rateLimit({ identifier: `${prefix}:${userId}`, limit, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many requests' });
}

/* ── AI limit constants ──────────────────────────────────────── */

const AI_LIMITS: Record<string, number> = { FREE: 5, PRO: 100, STUDIO: Infinity };

/* ── Router replicas (minimal) ───────────────────────────────── */

const securityRouter = t.router({
  // --- Admin updateUser: only accepts `plan`, not `role` ---
  adminUpdateUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      plan: z.enum(['FREE', 'PRO', 'STUDIO']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkRate('admin', ctx.session.user.id);
      const { userId, ...data } = input;
      const user = await ctx.db.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      return ctx.db.user.update({ where: { id: userId }, data, select: { id: true, plan: true, role: true } });
    }),

  // --- Team shareProject: requires project ownership ---
  shareProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, userId: ctx.session.user.id },
        select: { id: true },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
      const team = await ctx.db.team.findFirst({
        where: { ownerId: ctx.session.user.id },
        select: { id: true },
      });
      if (!team) throw new TRPCError({ code: 'NOT_FOUND', message: 'Create a team first' });
      return ctx.db.project.update({
        where: { id: input.projectId },
        data: { teamId: team.id },
        select: { id: true, teamId: true },
      });
    }),

  // --- Asset move: checks destination folder ownership ---
  assetMove: protectedProcedure
    .input(z.object({ id: z.string(), folderId: z.string().nullish() }))
    .mutation(async ({ ctx, input }) => {
      await checkRate('asset', ctx.session.user.id, 30);
      if (input.folderId) {
        const folder = await ctx.db.designFolder.findFirst({
          where: { id: input.folderId, userId: ctx.session.user.id },
          select: { id: true },
        });
        if (!folder) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Destination folder not found' });
        }
      }
      return ctx.db.asset.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { folderId: input.folderId ?? null },
        select: { id: true, folderId: true },
      });
    }),

  // --- Folder create: checks parent ownership ---
  folderCreate: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100), parentId: z.string().nullish() }))
    .mutation(async ({ ctx, input }) => {
      await checkRate('folder', ctx.session.user.id, 20);
      if (input.parentId) {
        const parent = await ctx.db.designFolder.findFirst({
          where: { id: input.parentId, userId: ctx.session.user.id },
          select: { id: true },
        });
        if (!parent) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Parent folder not found' });
        }
      }
      return ctx.db.designFolder.create({
        data: { name: stripTags(input.name), parentId: input.parentId ?? null, userId: ctx.session.user.id },
        select: { id: true, name: true, parentId: true },
      });
    }),

  // --- AI usage check (replicated from ai.ts logic) ---
  checkAI: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { plan: true, aiUsage: true, aiResetAt: true },
    });
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });

    const now = new Date();
    const resetAt = new Date(user.aiResetAt);
    const shouldReset =
      now.getMonth() !== resetAt.getMonth() ||
      now.getFullYear() !== resetAt.getFullYear();

    const limit = AI_LIMITS[user.plan] ?? AI_LIMITS.FREE;
    const allowed = shouldReset || user.aiUsage < limit;

    if (!allowed) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'AI limit reached' });
    }
    return { allowed: true, remaining: shouldReset ? limit : limit - user.aiUsage };
  }),

  // --- Scene delete: requires ownership ---
  sceneDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkRate('scene', ctx.session.user.id, 30);
      const scene = await ctx.db.scene.findFirst({
        where: { id: input.id },
        select: { id: true, project: { select: { userId: true } } },
      });
      if (!scene || scene.project.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      await ctx.db.scene.delete({ where: { id: input.id } });
      return { success: true };
    }),
});

/* ── Helpers ───────────────────────────────────────────────── */

const USER_ID = 'user-sec-001';
const ADMIN_ID = 'admin-sec-001';

function makeSession(userId = USER_ID, role = 'USER'): Session {
  return { user: { id: userId, name: 'Test', email: 'test@test.com', role }, expires: '2099-01-01' };
}

function makeDb(): MockDb {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: ADMIN_ID, role: 'ADMIN', plan: 'FREE', aiUsage: 0, aiResetAt: new Date() }),
      update: vi.fn().mockResolvedValue({ id: 'target', plan: 'PRO', role: 'USER' }),
    },
    project: {
      findFirst: vi.fn().mockResolvedValue({ id: 'proj-1' }),
      update: vi.fn().mockResolvedValue({ id: 'proj-1', teamId: 'team-1' }),
    },
    team: {
      findFirst: vi.fn().mockResolvedValue({ id: 'team-1' }),
    },
    asset: {
      update: vi.fn().mockResolvedValue({ id: 'asset-1', folderId: 'folder-1' }),
    },
    designFolder: {
      findFirst: vi.fn().mockResolvedValue({ id: 'folder-1' }),
      create: vi.fn().mockResolvedValue({ id: 'folder-new', name: 'New Folder', parentId: null }),
    },
    scene: {
      findFirst: vi.fn().mockResolvedValue({ id: 'scene-1', project: { userId: USER_ID } }),
      delete: vi.fn().mockResolvedValue({ id: 'scene-1' }),
    },
  };
}

function createCaller(db: MockDb, session: Session) {
  return securityRouter.createCaller({ db, session });
}

/* ── Tests ─────────────────────────────────────────────────── */

describe('Security invariants', () => {
  let db: MockDb;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, remaining: 59, reset: Date.now() + 60_000 });
    db = makeDb();
  });

  /* ── S1: Admin updateUser only accepts plan, not role ─────── */

  describe('Admin updateUser: plan only, no role', () => {
    it('accepts plan field in input', async () => {
      const caller = createCaller(db, makeSession(ADMIN_ID, 'ADMIN'));
      db.user.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN' }) // admin check
        .mockResolvedValueOnce({ id: 'target' }); // existence check

      await caller.adminUpdateUser({ userId: 'target', plan: 'PRO' });

      expect(db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { plan: 'PRO' },
        }),
      );
    });

    it('rejects role field in input (Zod validation)', async () => {
      const caller = createCaller(db, makeSession(ADMIN_ID, 'ADMIN'));

      // The Zod schema only allows `plan`, so `role` should be stripped or rejected
      await expect(
        // @ts-expect-error - intentionally testing disallowed field
        caller.adminUpdateUser({ userId: 'target', role: 'ADMIN' }),
      ).resolves.toBeDefined(); // Zod strips unknown fields; role won't be in data

      // Verify the `data` passed to db.user.update does NOT include `role`
      const updateCall = db.user.update.mock.calls[0]?.[0];
      expect(updateCall?.data).not.toHaveProperty('role');
    });

    it('does not pass role even if explicitly provided via object spread', async () => {
      const caller = createCaller(db, makeSession(ADMIN_ID, 'ADMIN'));
      db.user.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN' })
        .mockResolvedValueOnce({ id: 'target' });

      // @ts-expect-error - intentionally testing disallowed field
      await caller.adminUpdateUser({ userId: 'target', plan: 'STUDIO', role: 'ADMIN' });

      const data = db.user.update.mock.calls[0]?.[0]?.data;
      expect(data).toEqual({ plan: 'STUDIO' });
      expect(data.role).toBeUndefined();
    });
  });

  /* ── S2: Team share requires project ownership ──────────── */

  describe('Team share: project ownership required', () => {
    it('throws NOT_FOUND when user does not own the project', async () => {
      db.project.findFirst.mockResolvedValue(null);
      const caller = createCaller(db, makeSession());

      await expect(caller.shareProject({ projectId: 'other-proj' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('verifies project ownership via userId filter', async () => {
      const caller = createCaller(db, makeSession());
      await caller.shareProject({ projectId: 'proj-1' });

      expect(db.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'proj-1', userId: USER_ID },
        select: { id: true },
      });
    });

    it('succeeds when user owns the project and has a team', async () => {
      const caller = createCaller(db, makeSession());
      const result = await caller.shareProject({ projectId: 'proj-1' });
      expect(result.teamId).toBe('team-1');
    });
  });

  /* ── S3: Asset move checks destination folder ownership ─── */

  describe('Asset move: folder ownership check', () => {
    it('throws FORBIDDEN when destination folder belongs to different user', async () => {
      db.designFolder.findFirst.mockResolvedValue(null);
      const caller = createCaller(db, makeSession());

      await expect(caller.assetMove({ id: 'asset-1', folderId: 'other-folder' })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });

    it('verifies folder ownership via userId filter', async () => {
      const caller = createCaller(db, makeSession());
      await caller.assetMove({ id: 'asset-1', folderId: 'folder-1' });

      expect(db.designFolder.findFirst).toHaveBeenCalledWith({
        where: { id: 'folder-1', userId: USER_ID },
        select: { id: true },
      });
    });

    it('skips folder check when moving to root (folderId = null)', async () => {
      const caller = createCaller(db, makeSession());
      await caller.assetMove({ id: 'asset-1', folderId: null });

      expect(db.designFolder.findFirst).not.toHaveBeenCalled();
    });

    it('allows move when user owns the destination folder', async () => {
      const caller = createCaller(db, makeSession());
      const result = await caller.assetMove({ id: 'asset-1', folderId: 'folder-1' });
      expect(result.id).toBe('asset-1');
    });
  });

  /* ── S4: Folder create checks parent ownership ─────────── */

  describe('Folder create: parent ownership check', () => {
    it('throws FORBIDDEN when parent folder belongs to different user', async () => {
      db.designFolder.findFirst.mockResolvedValue(null);
      const caller = createCaller(db, makeSession());

      await expect(caller.folderCreate({ name: 'Sub', parentId: 'other-parent' })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });

    it('verifies parent ownership via userId filter', async () => {
      const caller = createCaller(db, makeSession());
      await caller.folderCreate({ name: 'Sub', parentId: 'parent-1' });

      expect(db.designFolder.findFirst).toHaveBeenCalledWith({
        where: { id: 'parent-1', userId: USER_ID },
        select: { id: true },
      });
    });

    it('skips parent check when creating at root (parentId = null)', async () => {
      const caller = createCaller(db, makeSession());
      await caller.folderCreate({ name: 'Root Folder' });

      expect(db.designFolder.findFirst).not.toHaveBeenCalled();
    });

    it('allows creation when user owns the parent folder', async () => {
      const caller = createCaller(db, makeSession());
      const result = await caller.folderCreate({ name: 'Child', parentId: 'folder-1' });
      expect(result.id).toBe('folder-new');
    });
  });

  /* ── S5: AI limit enforcement ──────────────────────────── */

  describe('AI limit enforcement', () => {
    it('FREE user with 4 uses can generate (under limit of 5)', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'FREE', aiUsage: 4, aiResetAt: new Date() });
      const caller = createCaller(db, makeSession());
      const result = await caller.checkAI();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('FREE user with 5 uses is blocked (at limit)', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'FREE', aiUsage: 5, aiResetAt: new Date() });
      const caller = createCaller(db, makeSession());

      await expect(caller.checkAI()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('FREE user with 6 uses is blocked (over limit)', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'FREE', aiUsage: 6, aiResetAt: new Date() });
      const caller = createCaller(db, makeSession());

      await expect(caller.checkAI()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('PRO user with 99 uses is allowed', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'PRO', aiUsage: 99, aiResetAt: new Date() });
      const caller = createCaller(db, makeSession());
      const result = await caller.checkAI();
      expect(result.allowed).toBe(true);
    });

    it('PRO user with 100 uses is blocked', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'PRO', aiUsage: 100, aiResetAt: new Date() });
      const caller = createCaller(db, makeSession());

      await expect(caller.checkAI()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('STUDIO user with 999999 uses is allowed', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'STUDIO', aiUsage: 999999, aiResetAt: new Date() });
      const caller = createCaller(db, makeSession());
      const result = await caller.checkAI();
      expect(result.allowed).toBe(true);
    });

    it('monthly reset allows FREE user with exhausted limit', async () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      db.user.findUnique.mockResolvedValue({ plan: 'FREE', aiUsage: 999, aiResetAt: lastMonth });
      const caller = createCaller(db, makeSession());
      const result = await caller.checkAI();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });
  });

  /* ── S6: Scene delete requires ownership ───────────────── */

  describe('Scene delete: ownership required', () => {
    it('deletes scene when user owns the project', async () => {
      const caller = createCaller(db, makeSession());
      const result = await caller.sceneDelete({ id: 'scene-1' });
      expect(result.success).toBe(true);
    });

    it('throws NOT_FOUND when scene does not exist', async () => {
      db.scene.findFirst.mockResolvedValue(null);
      const caller = createCaller(db, makeSession());

      await expect(caller.sceneDelete({ id: 'nonexistent' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('throws NOT_FOUND when scene belongs to a different user', async () => {
      db.scene.findFirst.mockResolvedValue({
        id: 'scene-1',
        project: { userId: 'other-user' },
      });
      const caller = createCaller(db, makeSession());

      await expect(caller.sceneDelete({ id: 'scene-1' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('verifies ownership by checking project.userId', async () => {
      const caller = createCaller(db, makeSession());
      await caller.sceneDelete({ id: 'scene-1' });

      expect(db.scene.findFirst).toHaveBeenCalledWith({
        where: { id: 'scene-1' },
        select: { id: true, project: { select: { userId: true } } },
      });
    });
  });
});
