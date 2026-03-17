// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';

/* ── Mock modules ──────────────────────────────────────────────── */

const mockRateLimit = vi.fn().mockResolvedValue({ success: true, remaining: 29, reset: Date.now() + 60_000 });
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
type MockDb = Record<string, any>;

type TRPCContext = { db: MockDb; session: Session };

const t = initTRPC.context<TRPCContext>().create({ transformer: superjson });

const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx });
});

/* ── Imports after mocks are set up ────────────────────────────── */

const { rateLimit } = await import('@/lib/rate-limit');
const { stripTags } = await import('@/lib/sanitize');

const RATE_LIMIT_ERROR = 'Too many requests';

async function checkSceneRate(userId: string) {
  const { success } = await rateLimit({ identifier: `scene:${userId}`, limit: 30, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

const sceneMetadataSchema = z.object({
  ck: z.string().optional(),
  sf: z.string().nullish(),
  ef: z.string().nullish(),
  enh: z.boolean().optional(),
  snd: z.boolean().optional(),
  chars: z.array(z.string()).optional(),
}).transform((v) => v as unknown as Record<string, unknown>);

/* ── Replicate scene router logic ──────────────────────────────── */

const sceneRouter = t.router({
  create: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      prompt: z.string().max(2000).default(''),
      label: z.string().max(100).default(''),
      model: z.enum(['turbo', 'standard', 'pro', 'cinematic']).default('standard'),
      duration: z.number().min(1).max(60).default(5),
      order: z.number().optional(),
      metadata: sceneMetadataSchema.optional(),
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
          model: input.model,
          duration: input.duration,
          order,
          metadata: input.metadata ?? undefined,
        },
        select: { id: true, projectId: true, prompt: true, label: true, model: true, duration: true, order: true, status: true },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      prompt: z.string().max(2000).optional(),
      label: z.string().max(100).optional(),
      model: z.enum(['turbo', 'standard', 'pro', 'cinematic']).optional(),
      duration: z.number().min(1).max(60).optional(),
      status: z.enum(['EMPTY', 'EDITING', 'GENERATING', 'READY', 'ERROR']).optional(),
      videoUrl: z.string().url().nullish(),
      metadata: sceneMetadataSchema.optional(),
      taskId: z.string().nullish(),
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
      return ctx.db.scene.update({
        where: { id },
        data,
        select: { id: true, prompt: true, label: true, model: true, duration: true, order: true, status: true, videoUrl: true },
      });
    }),

  delete: protectedProcedure
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

  reorder: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      sceneIds: z.array(z.string()).max(200),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkSceneRate(ctx.session.user.id);
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, userId: ctx.session.user.id },
        select: { id: true },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      const sceneCount = await ctx.db.scene.count({
        where: { id: { in: input.sceneIds }, projectId: project.id },
      });
      if (sceneCount !== input.sceneIds.length) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid scene IDs' });
      }

      await ctx.db.$transaction(
        input.sceneIds.map((id: string, index: number) =>
          ctx.db.scene.update({ where: { id }, data: { order: index }, select: { id: true } }),
        ),
      );
      return { success: true };
    }),
});

/* ── Helpers ───────────────────────────────────────────────────── */

const USER_ID = 'user-scene-123';

function makeSession(userId = USER_ID): Session {
  return { user: { id: userId, name: 'Test User', email: 'test@example.com' }, expires: '2099-01-01' };
}

function makeDb(): MockDb {
  return {
    project: {
      findFirst: vi.fn().mockResolvedValue({ id: 'proj-1', _count: { scenes: 3 } }),
    },
    scene: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'scene-1',
        project: { userId: USER_ID },
      }),
      create: vi.fn().mockResolvedValue({
        id: 'scene-new', projectId: 'proj-1', prompt: '', label: '',
        model: 'standard', duration: 5, order: 3, status: 'EMPTY',
      }),
      update: vi.fn().mockResolvedValue({
        id: 'scene-1', prompt: 'Updated', label: '', model: 'standard',
        duration: 5, order: 0, status: 'EDITING', videoUrl: null,
      }),
      delete: vi.fn().mockResolvedValue({ id: 'scene-1' }),
      count: vi.fn().mockResolvedValue(3),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

function createCaller(db: MockDb, session: Session) {
  return sceneRouter.createCaller({ db, session });
}

/* ── Tests ─────────────────────────────────────────────────────── */

describe('sceneRouter', () => {
  let db: MockDb;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, remaining: 29, reset: Date.now() + 60_000 });
    db = makeDb();
    caller = createCaller(db, makeSession());
  });

  /* ── create ───────────────────────────────────────────────────── */

  describe('create', () => {
    it('creates a scene within an owned project', async () => {
      const result = await caller.create({ projectId: 'proj-1' });

      expect(result).toHaveProperty('id');
      expect(db.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'proj-1', userId: USER_ID },
        select: { id: true, _count: { select: { scenes: true } } },
      });
      expect(db.scene.create).toHaveBeenCalled();
    });

    it('uses existing scene count as default order', async () => {
      db.project.findFirst.mockResolvedValue({ id: 'proj-1', _count: { scenes: 5 } });

      await caller.create({ projectId: 'proj-1' });

      expect(db.scene.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 5 }),
        }),
      );
    });

    it('uses provided order when specified', async () => {
      await caller.create({ projectId: 'proj-1', order: 0 });

      expect(db.scene.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 0 }),
        }),
      );
    });

    it('calls stripTags on prompt and label', async () => {
      await caller.create({
        projectId: 'proj-1',
        prompt: '<b>bold</b> prompt',
        label: '<i>italic</i> label',
      });

      expect(mockStripTags).toHaveBeenCalledWith('<b>bold</b> prompt');
      expect(mockStripTags).toHaveBeenCalledWith('<i>italic</i> label');
    });

    it('calls rate limit with scene identifier', async () => {
      await caller.create({ projectId: 'proj-1' });

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: `scene:${USER_ID}`, limit: 30, window: 60 }),
      );
    });

    it('throws TOO_MANY_REQUESTS when rate limited', async () => {
      mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() });

      await expect(caller.create({ projectId: 'proj-1' })).rejects.toMatchObject({
        code: 'TOO_MANY_REQUESTS',
      });
    });

    it('throws NOT_FOUND when project does not exist', async () => {
      db.project.findFirst.mockResolvedValue(null);

      await expect(caller.create({ projectId: 'nonexistent' })).rejects.toThrow(TRPCError);
      await expect(
        createCaller(
          (() => { const d = makeDb(); d.project.findFirst.mockResolvedValue(null); return d; })(),
          makeSession(),
        ).create({ projectId: 'nonexistent' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws NOT_FOUND when project belongs to different user', async () => {
      // findFirst returns null because userId filter does not match
      db.project.findFirst.mockResolvedValue(null);

      await expect(caller.create({ projectId: 'other-user-proj' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('passes model and duration to create data', async () => {
      await caller.create({ projectId: 'proj-1', model: 'cinematic', duration: 30 });

      expect(db.scene.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ model: 'cinematic', duration: 30 }),
        }),
      );
    });

    it('passes metadata when provided', async () => {
      await caller.create({
        projectId: 'proj-1',
        metadata: { ck: 'happy', enh: true },
      });

      expect(db.scene.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({ ck: 'happy', enh: true }),
          }),
        }),
      );
    });
  });

  /* ── update ───────────────────────────────────────────────────── */

  describe('update', () => {
    it('updates a scene owned by the user', async () => {
      await caller.update({ id: 'scene-1', prompt: 'New prompt' });

      expect(db.scene.findFirst).toHaveBeenCalledWith({
        where: { id: 'scene-1' },
        select: { id: true, project: { select: { userId: true } } },
      });
      expect(db.scene.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'scene-1' },
          data: expect.objectContaining({ prompt: 'New prompt' }),
        }),
      );
    });

    it('throws NOT_FOUND when scene does not exist', async () => {
      db.scene.findFirst.mockResolvedValue(null);

      await expect(caller.update({ id: 'nonexistent' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('throws NOT_FOUND when scene belongs to different user', async () => {
      db.scene.findFirst.mockResolvedValue({
        id: 'scene-1',
        project: { userId: 'other-user' },
      });

      await expect(caller.update({ id: 'scene-1', prompt: 'x' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('calls stripTags on prompt when provided', async () => {
      await caller.update({ id: 'scene-1', prompt: '<script>xss</script>' });

      expect(mockStripTags).toHaveBeenCalledWith('<script>xss</script>');
    });

    it('calls stripTags on label when provided', async () => {
      await caller.update({ id: 'scene-1', label: '<b>label</b>' });

      expect(mockStripTags).toHaveBeenCalledWith('<b>label</b>');
    });

    it('calls rate limit check', async () => {
      await caller.update({ id: 'scene-1' });

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: `scene:${USER_ID}` }),
      );
    });

    it('throws TOO_MANY_REQUESTS when rate limited', async () => {
      mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() });

      await expect(caller.update({ id: 'scene-1' })).rejects.toMatchObject({
        code: 'TOO_MANY_REQUESTS',
      });
    });

    it('can update status field', async () => {
      await caller.update({ id: 'scene-1', status: 'READY' });

      expect(db.scene.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'READY' }),
        }),
      );
    });

    it('can update videoUrl field', async () => {
      await caller.update({ id: 'scene-1', videoUrl: 'https://example.com/video.mp4' });

      expect(db.scene.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ videoUrl: 'https://example.com/video.mp4' }),
        }),
      );
    });

    it('can set videoUrl to null', async () => {
      await caller.update({ id: 'scene-1', videoUrl: null });

      expect(db.scene.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ videoUrl: null }),
        }),
      );
    });
  });

  /* ── delete ───────────────────────────────────────────────────── */

  describe('delete', () => {
    it('deletes a scene owned by the user', async () => {
      const result = await caller.delete({ id: 'scene-1' });

      expect(result).toEqual({ success: true });
      expect(db.scene.delete).toHaveBeenCalledWith({ where: { id: 'scene-1' } });
    });

    it('throws NOT_FOUND when scene does not exist', async () => {
      db.scene.findFirst.mockResolvedValue(null);

      await expect(caller.delete({ id: 'nonexistent' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('throws NOT_FOUND when scene belongs to different user', async () => {
      db.scene.findFirst.mockResolvedValue({
        id: 'scene-1',
        project: { userId: 'other-user' },
      });

      await expect(caller.delete({ id: 'scene-1' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('calls rate limit check', async () => {
      await caller.delete({ id: 'scene-1' });

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: `scene:${USER_ID}` }),
      );
    });

    it('throws TOO_MANY_REQUESTS when rate limited', async () => {
      mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() });

      await expect(caller.delete({ id: 'scene-1' })).rejects.toMatchObject({
        code: 'TOO_MANY_REQUESTS',
      });
    });

    it('verifies ownership before deleting', async () => {
      await caller.delete({ id: 'scene-1' });

      expect(db.scene.findFirst).toHaveBeenCalledWith({
        where: { id: 'scene-1' },
        select: { id: true, project: { select: { userId: true } } },
      });
    });
  });

  /* ── reorder ──────────────────────────────────────────────────── */

  describe('reorder', () => {
    it('reorders scenes within an owned project', async () => {
      db.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      db.scene.count.mockResolvedValue(3);

      const result = await caller.reorder({
        projectId: 'proj-1',
        sceneIds: ['s1', 's2', 's3'],
      });

      expect(result).toEqual({ success: true });
      expect(db.$transaction).toHaveBeenCalled();
    });

    it('updates each scene with its new order index', async () => {
      db.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      db.scene.count.mockResolvedValue(2);

      await caller.reorder({ projectId: 'proj-1', sceneIds: ['s2', 's1'] });

      // Each scene.update call is produced inside $transaction
      expect(db.scene.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 's2' }, data: { order: 0 } }),
      );
      expect(db.scene.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 's1' }, data: { order: 1 } }),
      );
    });

    it('throws NOT_FOUND when project does not exist', async () => {
      db.project.findFirst.mockResolvedValue(null);

      await expect(
        caller.reorder({ projectId: 'nonexistent', sceneIds: ['s1'] }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws BAD_REQUEST when scene IDs do not match project', async () => {
      db.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      db.scene.count.mockResolvedValue(1); // only 1 matches, but 2 provided

      await expect(
        caller.reorder({ projectId: 'proj-1', sceneIds: ['s1', 's2'] }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('calls rate limit check', async () => {
      db.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      db.scene.count.mockResolvedValue(1);

      await caller.reorder({ projectId: 'proj-1', sceneIds: ['s1'] });

      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: `scene:${USER_ID}` }),
      );
    });

    it('throws TOO_MANY_REQUESTS when rate limited', async () => {
      mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() });

      await expect(
        caller.reorder({ projectId: 'proj-1', sceneIds: ['s1'] }),
      ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    });

    it('verifies project ownership', async () => {
      db.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      db.scene.count.mockResolvedValue(1);

      await caller.reorder({ projectId: 'proj-1', sceneIds: ['s1'] });

      expect(db.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'proj-1', userId: USER_ID },
        select: { id: true },
      });
    });
  });

  /* ── Input validation ─────────────────────────────────────────── */

  describe('input validation', () => {
    it('rejects create with prompt over 2000 chars', async () => {
      await expect(
        caller.create({ projectId: 'proj-1', prompt: 'X'.repeat(2001) }),
      ).rejects.toThrow();
    });

    it('rejects create with label over 100 chars', async () => {
      await expect(
        caller.create({ projectId: 'proj-1', label: 'L'.repeat(101) }),
      ).rejects.toThrow();
    });

    it('rejects create with invalid model', async () => {
      await expect(
        // @ts-expect-error - intentionally invalid for test
        caller.create({ projectId: 'proj-1', model: 'ultra' }),
      ).rejects.toThrow();
    });

    it('rejects create with duration below 1', async () => {
      await expect(
        caller.create({ projectId: 'proj-1', duration: 0 }),
      ).rejects.toThrow();
    });

    it('rejects create with duration above 60', async () => {
      await expect(
        caller.create({ projectId: 'proj-1', duration: 61 }),
      ).rejects.toThrow();
    });

    it('rejects update with invalid status enum', async () => {
      await expect(
        // @ts-expect-error - intentionally invalid for test
        caller.update({ id: 's1', status: 'DELETED' }),
      ).rejects.toThrow();
    });

    it('rejects update with invalid videoUrl', async () => {
      await expect(
        caller.update({ id: 's1', videoUrl: 'not-a-url' }),
      ).rejects.toThrow();
    });

    it('rejects reorder with more than 200 scene IDs', async () => {
      const sceneIds = Array.from({ length: 201 }, (_, i) => `s${i}`);
      await expect(
        caller.reorder({ projectId: 'proj-1', sceneIds }),
      ).rejects.toThrow();
    });

    it('accepts create with all valid models', async () => {
      for (const model of ['turbo', 'standard', 'pro', 'cinematic'] as const) {
        const d = makeDb();
        const c = createCaller(d, makeSession());
        await expect(c.create({ projectId: 'proj-1', model })).resolves.toBeDefined();
      }
    });

    it('accepts create with valid metadata', async () => {
      await expect(
        caller.create({
          projectId: 'proj-1',
          metadata: { ck: 'sad', enh: false, snd: true, chars: ['c1'] },
        }),
      ).resolves.toBeDefined();
    });

    it('accepts update with all valid scene statuses', async () => {
      for (const status of ['EMPTY', 'EDITING', 'GENERATING', 'READY', 'ERROR'] as const) {
        const d = makeDb();
        const c = createCaller(d, makeSession());
        await expect(c.update({ id: 'scene-1', status })).resolves.toBeDefined();
      }
    });
  });
});
