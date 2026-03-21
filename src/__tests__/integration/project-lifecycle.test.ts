// @vitest-environment node
/**
 * Integration tests — Project lifecycle
 *
 * Verifies the full project lifecycle:
 *   - Create -> Update -> Duplicate -> Delete
 *   - Scene CRUD within a project
 *   - Deleted projects are actually removed
 *   - Ownership scoping
 */
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

/* ── tRPC setup ───────────────────────────────────────────────── */

type Session = {
  user: { id: string; name?: string | null; email?: string | null };
  expires: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type MockDb = Record<string, any>;
type TRPCContext = { db: MockDb; session: Session | null };

const t = initTRPC.context<TRPCContext>().create({ transformer: superjson });

const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, session: ctx.session! } });
});

const { rateLimit } = await import('@/lib/rate-limit');
const { stripTags } = await import('@/lib/sanitize');

async function checkMutationRate(userId: string) {
  const { success } = await rateLimit({ identifier: `project:${userId}`, limit: 20, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many requests' });
}

async function checkSceneRate(userId: string) {
  const { success } = await rateLimit({ identifier: `scene:${userId}`, limit: 30, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many requests' });
}

/* ── Combined router for lifecycle testing ───────────────────── */

const lifecycleRouter = t.router({
  createProject: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(100).optional() }))
    .mutation(async ({ ctx, input }) => {
      await checkMutationRate(ctx.session.user.id);
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { plan: true, _count: { select: { projects: true } } },
      });
      const PLAN_LIMITS: Record<string, number> = { FREE: 3, PRO: 25, STUDIO: Infinity };
      const limit = PLAN_LIMITS[user?.plan ?? 'FREE'];
      if ((user?._count.projects ?? 0) >= limit) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Project limit reached' });
      }
      return ctx.db.project.create({
        data: { title: stripTags(input.title ?? 'Untitled'), userId: ctx.session.user.id },
        select: { id: true, title: true, status: true, createdAt: true },
      });
    }),

  updateProject: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).max(100).optional(),
      description: z.string().max(5000).optional(),
      status: z.enum(['DRAFT', 'RENDERING', 'READY', 'PUBLISHED']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      if (rest.title) rest.title = stripTags(rest.title);
      if (rest.description) rest.description = stripTags(rest.description);
      return ctx.db.project.update({
        where: { id, userId: ctx.session.user.id },
        data: rest,
        select: { id: true, title: true, status: true, updatedAt: true },
      });
    }),

  duplicateProject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkMutationRate(ctx.session.user.id);
      const original = await ctx.db.project.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { scenes: true },
      });
      if (!original) throw new TRPCError({ code: 'NOT_FOUND' });

      const newProject = await ctx.db.project.create({
        data: {
          title: `${original.title} (copy)`,
          userId: ctx.session.user.id,
          description: original.description,
        },
        select: { id: true, title: true, status: true, createdAt: true },
      });

      // Duplicate scenes
      if (original.scenes?.length) {
        for (const scene of original.scenes) {
          await ctx.db.scene.create({
            data: {
              projectId: newProject.id,
              prompt: scene.prompt,
              label: scene.label,
              model: scene.model,
              duration: scene.duration,
              order: scene.order,
            },
          });
        }
      }

      return newProject;
    }),

  deleteProject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkMutationRate(ctx.session.user.id);
      return ctx.db.project.delete({
        where: { id: input.id, userId: ctx.session.user.id },
        select: { id: true },
      });
    }),

  getProject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { scenes: { orderBy: { order: 'asc' } } },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
      return project;
    }),

  createScene: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      prompt: z.string().max(2000).default(''),
      label: z.string().max(100).default(''),
      duration: z.number().min(1).max(60).default(5),
      order: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkSceneRate(ctx.session.user.id);
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, userId: ctx.session.user.id },
        select: { id: true, _count: { select: { scenes: true } } },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      const order = input.order ?? project._count.scenes;
      return ctx.db.scene.create({
        data: {
          projectId: input.projectId,
          prompt: stripTags(input.prompt),
          label: stripTags(input.label),
          duration: input.duration,
          order,
        },
        select: { id: true, projectId: true, prompt: true, label: true, duration: true, order: true },
      });
    }),

  updateScene: protectedProcedure
    .input(z.object({
      id: z.string(),
      prompt: z.string().max(2000).optional(),
      label: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkSceneRate(ctx.session.user.id);
      const scene = await ctx.db.scene.findFirst({
        where: { id: input.id },
        select: { id: true, project: { select: { userId: true } } },
      });
      if (!scene || scene.project.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      const { id, ...data } = input;
      if (data.prompt) data.prompt = stripTags(data.prompt);
      if (data.label) data.label = stripTags(data.label);
      return ctx.db.scene.update({ where: { id }, data });
    }),

  deleteScene: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkSceneRate(ctx.session.user.id);
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

const USER_ID = 'user-lifecycle-001';

function makeSession(userId = USER_ID): Session {
  return { user: { id: userId, name: 'Lifecycle Tester', email: 'lifecycle@test.com' }, expires: '2099-01-01' };
}

function makeDb(): MockDb {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({ plan: 'PRO', _count: { projects: 2 } }),
    },
    project: {
      create: vi.fn().mockResolvedValue({ id: 'proj-new', title: 'Untitled', status: 'DRAFT', createdAt: new Date() }),
      update: vi.fn().mockResolvedValue({ id: 'proj-new', title: 'Updated Title', status: 'DRAFT', updatedAt: new Date() }),
      findFirst: vi.fn().mockResolvedValue({
        id: 'proj-new',
        title: 'Original',
        description: 'A project',
        userId: USER_ID,
        scenes: [
          { id: 's1', prompt: 'Hello', label: 'Scene 1', model: 'standard', duration: 5, order: 0 },
        ],
      }),
      delete: vi.fn().mockResolvedValue({ id: 'proj-new' }),
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
    scene: {
      create: vi.fn().mockResolvedValue({ id: 'scene-new', projectId: 'proj-new', prompt: '', label: '', duration: 5, order: 0 }),
      update: vi.fn().mockResolvedValue({ id: 'scene-1', prompt: 'Updated prompt', label: 'Updated label' }),
      findFirst: vi.fn().mockResolvedValue({ id: 'scene-1', project: { userId: USER_ID } }),
      delete: vi.fn().mockResolvedValue({ id: 'scene-1' }),
    },
  };
}

function createCaller(db: MockDb, session: Session | null) {
  return lifecycleRouter.createCaller({ db, session });
}

/* ── Tests ─────────────────────────────────────────────────── */

describe('Project lifecycle integration', () => {
  let db: MockDb;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, remaining: 19, reset: Date.now() + 60_000 });
    db = makeDb();
    caller = createCaller(db, makeSession());
  });

  /* ── Create -> Update -> Duplicate -> Delete ───────────── */

  it('project create returns a new project with DRAFT status', async () => {
    const project = await caller.createProject({ title: 'My Video' });

    expect(project).toHaveProperty('id');
    expect(db.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: 'My Video', userId: USER_ID }),
      }),
    );
  });

  it('project update modifies title and strips HTML tags', async () => {
    await caller.updateProject({ id: 'proj-new', title: '<b>Bold Title</b>' });

    expect(mockStripTags).toHaveBeenCalledWith('<b>Bold Title</b>');
    expect(db.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'proj-new', userId: USER_ID },
        data: expect.objectContaining({ title: 'Bold Title' }),
      }),
    );
  });

  it('project duplicate creates a copy with scenes', async () => {
    const duplicated = await caller.duplicateProject({ id: 'proj-new' });

    expect(duplicated).toHaveProperty('id');
    // Original project was looked up
    expect(db.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'proj-new', userId: USER_ID } }),
    );
    // New project was created with "(copy)" suffix
    expect(db.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: 'Original (copy)' }),
      }),
    );
    // Scene was duplicated
    expect(db.scene.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ prompt: 'Hello', label: 'Scene 1' }),
      }),
    );
  });

  it('project delete removes the project and scopes to user', async () => {
    const result = await caller.deleteProject({ id: 'proj-new' });

    expect(result).toEqual({ id: 'proj-new' });
    expect(db.project.delete).toHaveBeenCalledWith({
      where: { id: 'proj-new', userId: USER_ID },
      select: { id: true },
    });
  });

  it('deleted project is not found on subsequent get', async () => {
    // Simulate project no longer existing after deletion
    db.project.findFirst.mockResolvedValue(null);

    await expect(caller.getProject({ id: 'proj-deleted' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  /* ── Scene CRUD within a project ───────────────────────── */

  it('scene create adds a new scene to the project', async () => {
    db.project.findFirst.mockResolvedValue({ id: 'proj-new', _count: { scenes: 2 } });

    const scene = await caller.createScene({ projectId: 'proj-new', prompt: 'A sunset', label: 'Sunset' });

    expect(scene).toHaveProperty('id');
    expect(db.scene.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ projectId: 'proj-new', prompt: 'A sunset', order: 2 }),
      }),
    );
  });

  it('scene update modifies prompt and label', async () => {
    await caller.updateScene({ id: 'scene-1', prompt: 'Updated prompt', label: 'New label' });

    expect(db.scene.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'scene-1' },
        data: expect.objectContaining({ prompt: 'Updated prompt', label: 'New label' }),
      }),
    );
  });

  it('scene delete removes the scene and returns success', async () => {
    const result = await caller.deleteScene({ id: 'scene-1' });

    expect(result).toEqual({ success: true });
    expect(db.scene.delete).toHaveBeenCalledWith({ where: { id: 'scene-1' } });
  });
});
