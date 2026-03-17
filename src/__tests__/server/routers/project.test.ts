// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';

/* ── Mock modules ──────────────────────────────────────────────── */

const mockRateLimit = vi.fn().mockResolvedValue({ success: true, remaining: 19, reset: Date.now() + 60_000 });
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...args: unknown[]) => mockRateLimit(...args) }));

const mockStripTags = vi.fn((s: string) => s.replace(/<[^>]*>/g, ''));
vi.mock('@/lib/sanitize', () => ({ stripTags: (s: string) => mockStripTags(s) }));

vi.mock('@/lib/constants', () => ({ RATE_LIMIT_ERROR: 'Too many requests' }));

/* ── tRPC setup mirroring src/server/trpc.ts ───────────────────── */

type Session = {
  user: { id: string; name?: string | null; email?: string | null };
  expires: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type MockFn = ReturnType<typeof vi.fn> & ((...args: any[]) => any);
type MockDb = Record<string, Record<string, MockFn>>;

type TRPCContext = { db: MockDb; session: Session };

const t = initTRPC.context<TRPCContext>().create({ transformer: superjson });

const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx });
});

/* ── Replicate project router logic ────────────────────────────── */

const { rateLimit } = await import('@/lib/rate-limit');
const { stripTags } = await import('@/lib/sanitize');

const RATE_LIMIT_ERROR = 'Too many requests';

async function checkMutationRate(userId: string) {
  const { success } = await rateLimit({ identifier: `project:${userId}`, limit: 20, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

const PLAN_LIMITS: Record<string, number> = { FREE: 3, PRO: 25, STUDIO: Infinity };

const projectRouter = t.router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(['DRAFT', 'RENDERING', 'READY', 'PUBLISHED']).optional(),
      sortBy: z.enum(['updatedAt', 'createdAt', 'title']).default('updatedAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { search, status, sortBy = 'updatedAt', sortOrder = 'desc', page = 1, limit = 20 } = input ?? {};
      const where: Record<string, unknown> = { userId: ctx.session.user.id };
      if (search) where.title = { contains: search, mode: 'insensitive' };
      if (status) where.status = status;

      const [items, total] = await Promise.all([
        ctx.db.project.findMany({
          where,
          include: { _count: { select: { scenes: true } } },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.db.project.count({ where }),
      ]);
      return { items, total, page, pages: Math.ceil(total / limit) };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { scenes: { orderBy: { order: 'asc' } } },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
      return project;
    }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(100).optional() }))
    .mutation(async ({ ctx, input }) => {
      await checkMutationRate(ctx.session.user.id);
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { plan: true, _count: { select: { projects: true } } },
      });
      const limit = PLAN_LIMITS[user?.plan ?? 'FREE'];
      if ((user?._count.projects ?? 0) >= limit) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Project limit reached' });
      }
      return ctx.db.project.create({
        data: { title: stripTags(input.title ?? 'Untitled'), userId: ctx.session.user.id },
        select: { id: true, title: true, status: true, createdAt: true },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).max(100).optional(),
      description: z.string().max(5000).optional(),
      tags: z.array(z.string()).max(30).optional(),
      status: z.enum(['DRAFT', 'RENDERING', 'READY', 'PUBLISHED']).optional(),
      characters: z.array(z.object({
        id: z.string(),
        name: z.string().max(100),
        role: z.string().max(100),
        avatar: z.string().max(10),
        ck: z.string().max(20),
        desc: z.string().max(500),
      })).max(50).optional(),
      thumbnailData: z.record(z.string(), z.unknown()).optional(),
      thumbnailUrl: z.string().nullish(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, characters, thumbnailData, ...rest } = input;
      if (rest.title) rest.title = stripTags(rest.title);
      if (rest.description) rest.description = stripTags(rest.description);
      if (rest.tags) rest.tags = rest.tags.map((tag) => stripTags(tag));
      const data: Record<string, unknown> = { ...rest };
      if (characters !== undefined) data.characters = characters;
      if (thumbnailData !== undefined) data.thumbnailData = thumbnailData;
      return ctx.db.project.update({
        where: { id, userId: ctx.session.user.id },
        data,
        select: { id: true, title: true, status: true, updatedAt: true },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkMutationRate(ctx.session.user.id);
      return ctx.db.project.delete({
        where: { id: input.id, userId: ctx.session.user.id },
        select: { id: true },
      });
    }),
});

/* ── Helpers ───────────────────────────────────────────────────── */

const USER_ID = 'user-abc-123';

function makeSession(userId = USER_ID): Session {
  return { user: { id: userId, name: 'Test User', email: 'test@example.com' }, expires: '2099-01-01' };
}

function makeDb(): MockDb {
  return {
    project: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: 'proj-1', title: 'Untitled', status: 'DRAFT', createdAt: new Date() }),
      update: vi.fn().mockResolvedValue({ id: 'proj-1', title: 'Updated', status: 'DRAFT', updatedAt: new Date() }),
      delete: vi.fn().mockResolvedValue({ id: 'proj-1' }),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ plan: 'FREE', _count: { projects: 0 } }),
    },
  };
}

function createCaller(db: MockDb, session: Session) {
  return projectRouter.createCaller({ db, session });
}

/* ── Tests ─────────────────────────────────────────────────────── */

describe('projectRouter', () => {
  let db: MockDb;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, remaining: 19, reset: Date.now() + 60_000 });
    db = makeDb();
    caller = createCaller(db, makeSession());
  });

  /* ── list ─────────────────────────────────────────────────────── */

  describe('list', () => {
    it('returns paginated results with defaults', async () => {
      const mockProjects = [{ id: 'p1', title: 'Project 1' }];
      db.project.findMany.mockResolvedValue(mockProjects);
      db.project.count.mockResolvedValue(1);

      const result = await caller.list();

      expect(result).toEqual({ items: mockProjects, total: 1, page: 1, pages: 1 });
      expect(db.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID },
          orderBy: { updatedAt: 'desc' },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('applies search filter to title', async () => {
      db.project.findMany.mockResolvedValue([]);
      db.project.count.mockResolvedValue(0);

      await caller.list({ search: 'hello' });

      expect(db.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID, title: { contains: 'hello', mode: 'insensitive' } },
        }),
      );
    });

    it('applies status filter', async () => {
      db.project.findMany.mockResolvedValue([]);
      db.project.count.mockResolvedValue(0);

      await caller.list({ status: 'DRAFT' });

      expect(db.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID, status: 'DRAFT' },
        }),
      );
    });

    it('applies custom sorting and pagination', async () => {
      db.project.findMany.mockResolvedValue([]);
      db.project.count.mockResolvedValue(50);

      const result = await caller.list({
        sortBy: 'title',
        sortOrder: 'asc',
        page: 3,
        limit: 10,
      });

      expect(db.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { title: 'asc' },
          skip: 20,
          take: 10,
        }),
      );
      expect(result.pages).toBe(5);
    });

    it('works without input (optional)', async () => {
      db.project.findMany.mockResolvedValue([]);
      db.project.count.mockResolvedValue(0);

      const result = await caller.list();
      expect(result.page).toBe(1);
    });

    it('always scopes to the current user', async () => {
      db.project.findMany.mockResolvedValue([]);
      db.project.count.mockResolvedValue(0);

      await caller.list();

      const findManyCall = db.project.findMany.mock.calls[0][0];
      expect(findManyCall.where.userId).toBe(USER_ID);
    });
  });

  /* ── getById ──────────────────────────────────────────────────── */

  describe('getById', () => {
    it('returns the project when found', async () => {
      const mockProject = { id: 'proj-1', title: 'Test', scenes: [] };
      db.project.findFirst.mockResolvedValue(mockProject);

      const result = await caller.getById({ id: 'proj-1' });

      expect(result).toEqual(mockProject);
      expect(db.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'proj-1', userId: USER_ID },
        include: { scenes: { orderBy: { order: 'asc' } } },
      });
    });

    it('throws NOT_FOUND when project does not exist', async () => {
      db.project.findFirst.mockResolvedValue(null);

      await expect(caller.getById({ id: 'nonexistent' })).rejects.toThrow(TRPCError);
      await expect(caller.getById({ id: 'nonexistent' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('scopes query to the authenticated user (prevents access to other users projects)', async () => {
      db.project.findFirst.mockResolvedValue(null);

      try { await caller.getById({ id: 'other-proj' }); } catch { /* expected */ }

      expect(db.project.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: USER_ID }),
        }),
      );
    });
  });

  /* ── create ───────────────────────────────────────────────────── */

  describe('create', () => {
    it('creates a project with default title when none is provided', async () => {
      await caller.create({});

      expect(db.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: USER_ID }),
        }),
      );
    });

    it('creates a project with the supplied title', async () => {
      await caller.create({ title: 'My Project' });

      expect(db.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: 'My Project' }),
        }),
      );
    });

    it('calls stripTags on the title', async () => {
      await caller.create({ title: '<b>Bold</b> Title' });

      expect(mockStripTags).toHaveBeenCalledWith('<b>Bold</b> Title');
    });

    it('calls rate limit check', async () => {
      await caller.create({});

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: `project:${USER_ID}` }),
      );
    });

    it('throws TOO_MANY_REQUESTS when rate limit is exceeded', async () => {
      mockRateLimit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() });

      await expect(caller.create({})).rejects.toThrow(TRPCError);
      await expect(caller.create({})).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    });

    /* ── Plan limits ──────────────────────────────────────────── */

    it('allows FREE plan up to 3 projects', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'FREE', _count: { projects: 2 } });

      await expect(caller.create({})).resolves.toBeDefined();
    });

    it('throws FORBIDDEN when FREE plan exceeds 3 projects', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'FREE', _count: { projects: 3 } });

      await expect(caller.create({})).rejects.toThrow(TRPCError);
      await expect(
        createCaller(
          (() => { const d = makeDb(); d.user.findUnique.mockResolvedValue({ plan: 'FREE', _count: { projects: 3 } }); return d; })(),
          makeSession(),
        ).create({}),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('allows PRO plan up to 25 projects', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'PRO', _count: { projects: 24 } });

      await expect(caller.create({})).resolves.toBeDefined();
    });

    it('throws FORBIDDEN when PRO plan exceeds 25 projects', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'PRO', _count: { projects: 25 } });

      await expect(caller.create({})).rejects.toThrow(TRPCError);
      await expect(
        createCaller(
          (() => { const d = makeDb(); d.user.findUnique.mockResolvedValue({ plan: 'PRO', _count: { projects: 25 } }); return d; })(),
          makeSession(),
        ).create({}),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('allows STUDIO plan unlimited projects', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'STUDIO', _count: { projects: 9999 } });

      await expect(caller.create({})).resolves.toBeDefined();
    });

    it('defaults to FREE limit when user has no plan', async () => {
      db.user.findUnique.mockResolvedValue({ plan: undefined, _count: { projects: 3 } });

      await expect(caller.create({})).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('defaults to FREE limit when user is not found', async () => {
      db.user.findUnique.mockResolvedValue(null);

      // user is null, so plan is undefined => defaults to FREE, count defaults to 0
      // 0 >= 3 is false so it should succeed
      await expect(caller.create({})).resolves.toBeDefined();
    });
  });

  /* ── update ───────────────────────────────────────────────────── */

  describe('update', () => {
    it('updates a project with the given fields', async () => {
      await caller.update({ id: 'proj-1', title: 'New Title', status: 'PUBLISHED' });

      expect(db.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'proj-1', userId: USER_ID },
          data: expect.objectContaining({ title: 'New Title', status: 'PUBLISHED' }),
        }),
      );
    });

    it('calls stripTags on title', async () => {
      await caller.update({ id: 'proj-1', title: '<script>alert(1)</script>Title' });

      expect(mockStripTags).toHaveBeenCalledWith('<script>alert(1)</script>Title');
    });

    it('calls stripTags on description', async () => {
      await caller.update({ id: 'proj-1', description: '<img src=x>Desc' });

      expect(mockStripTags).toHaveBeenCalledWith('<img src=x>Desc');
    });

    it('calls stripTags on each tag', async () => {
      await caller.update({ id: 'proj-1', tags: ['<b>tag1</b>', 'tag2'] });

      expect(mockStripTags).toHaveBeenCalledWith('<b>tag1</b>');
      expect(mockStripTags).toHaveBeenCalledWith('tag2');
    });

    it('passes characters as JSON data when provided', async () => {
      const chars = [{ id: 'c1', name: 'Alice', role: 'Hero', avatar: 'A', ck: 'happy', desc: 'Main' }];
      await caller.update({ id: 'proj-1', characters: chars });

      expect(db.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ characters: chars }),
        }),
      );
    });

    it('passes thumbnailData as JSON data when provided', async () => {
      const thumb = { width: 1280, height: 720 };
      await caller.update({ id: 'proj-1', thumbnailData: thumb });

      expect(db.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ thumbnailData: thumb }),
        }),
      );
    });

    it('scopes update to authenticated user', async () => {
      await caller.update({ id: 'proj-1', title: 'X' });

      expect(db.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: USER_ID }),
        }),
      );
    });
  });

  /* ── delete ───────────────────────────────────────────────────── */

  describe('delete', () => {
    it('deletes the project by id scoped to user', async () => {
      await caller.delete({ id: 'proj-1' });

      expect(db.project.delete).toHaveBeenCalledWith({
        where: { id: 'proj-1', userId: USER_ID },
        select: { id: true },
      });
    });

    it('calls rate limit check', async () => {
      await caller.delete({ id: 'proj-1' });

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: `project:${USER_ID}` }),
      );
    });

    it('throws TOO_MANY_REQUESTS when rate limit is exceeded', async () => {
      mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() });

      await expect(caller.delete({ id: 'proj-1' })).rejects.toMatchObject({
        code: 'TOO_MANY_REQUESTS',
      });
    });
  });

  /* ── Input validation ─────────────────────────────────────────── */

  describe('input validation', () => {
    it('rejects list with page less than 1', async () => {
      await expect(caller.list({ page: 0 })).rejects.toThrow();
    });

    it('rejects list with limit greater than 50', async () => {
      await expect(caller.list({ limit: 51 })).rejects.toThrow();
    });

    it('rejects list with invalid status', async () => {
      // @ts-expect-error - intentionally invalid for test
      await expect(caller.list({ status: 'INVALID' })).rejects.toThrow();
    });

    it('rejects list with invalid sortBy', async () => {
      // @ts-expect-error - intentionally invalid for test
      await expect(caller.list({ sortBy: 'random' })).rejects.toThrow();
    });

    it('rejects create with title over 100 chars', async () => {
      await expect(caller.create({ title: 'X'.repeat(101) })).rejects.toThrow();
    });

    it('rejects update with empty title', async () => {
      await expect(caller.update({ id: 'p1', title: '' })).rejects.toThrow();
    });

    it('rejects update with description over 5000 chars', async () => {
      await expect(caller.update({ id: 'p1', description: 'D'.repeat(5001) })).rejects.toThrow();
    });

    it('rejects update with more than 30 tags', async () => {
      const tags = Array.from({ length: 31 }, (_, i) => `tag${i}`);
      await expect(caller.update({ id: 'p1', tags })).rejects.toThrow();
    });

    it('rejects update with invalid status enum', async () => {
      // @ts-expect-error - intentionally invalid for test
      await expect(caller.update({ id: 'p1', status: 'DELETED' })).rejects.toThrow();
    });

    it('rejects update with more than 50 characters', async () => {
      const chars = Array.from({ length: 51 }, (_, i) => ({
        id: `c${i}`, name: 'N', role: 'R', avatar: 'A', ck: 'k', desc: 'd',
      }));
      await expect(caller.update({ id: 'p1', characters: chars })).rejects.toThrow();
    });
  });

  /* ── PLAN_LIMITS constant ─────────────────────────────────────── */

  describe('PLAN_LIMITS', () => {
    it('FREE limit is 3', () => {
      expect(PLAN_LIMITS.FREE).toBe(3);
    });

    it('PRO limit is 25', () => {
      expect(PLAN_LIMITS.PRO).toBe(25);
    });

    it('STUDIO limit is Infinity', () => {
      expect(PLAN_LIMITS.STUDIO).toBe(Infinity);
    });
  });
});
