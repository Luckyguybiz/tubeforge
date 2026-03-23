// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';

/* ── Mock modules ──────────────────────────────────────────────── */

const mockRateLimit = vi.fn().mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60_000 });
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...args: unknown[]) => mockRateLimit(...args) }));

vi.mock('@/lib/constants', () => ({
  RATE_LIMIT_ERROR: 'Too many requests',
  API_ENDPOINTS: {
    OPENAI_IMAGES: 'https://api.openai.com/v1/images/generations',
    OPENAI_CHAT: 'https://api.openai.com/v1/chat/completions',
  },
  getAiThumbnailLimit: (key: string, plan: string) => {
    const limits: Record<string, Record<string, number>> = {
      dailyGenerations: { FREE: 3, PRO: 100, STUDIO: Infinity },
      multiGen: { FREE: 1, PRO: 2, STUDIO: 3 },
      faces: { FREE: 3, PRO: 10, STUDIO: 20 },
    };
    return limits[key]?.[plan] ?? limits[key]?.FREE ?? 1;
  },
  getPlanLimits: (plan: string) => {
    const plans: Record<string, { aiGenerations: number }> = {
      FREE: { aiGenerations: 5 },
      PRO: { aiGenerations: 100 },
      STUDIO: { aiGenerations: Infinity },
    };
    return plans[plan] ?? plans.FREE;
  },
}));

vi.mock('@/lib/env', () => ({
  env: { OPENAI_API_KEY: 'test-key', FAL_KEY: '' },
}));

/* ── tRPC setup ────────────────────────────────────────────────── */

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

/* ── Replicate aiThumbnails router logic (subset) ─────────────── */

const { rateLimit } = await import('@/lib/rate-limit');
const RATE_LIMIT_ERROR = 'Too many requests';

async function checkRate(userId: string, endpoint: string, limit: number) {
  const { success } = await rateLimit({ identifier: `${endpoint}:${userId}`, limit, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

const AI_PLAN_LIMITS: Record<string, number> = { FREE: 5, PRO: 100, STUDIO: Infinity };

const aiThumbnailsRouter = t.router({
  generate: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(3).max(1000),
        style: z.enum(['realistic', 'anime', 'cinematic', 'minimalist', '3d', 'popart']).default('realistic'),
        format: z.enum(['16:9', '9:16']).default('16:9'),
        count: z.number().min(1).max(3).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Rate limit
      await checkRate(userId, 'ai-thumb-gen', 10);

      // Fetch user plan and check limits
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { plan: true, aiUsage: true, aiResetAt: true },
      });
      const plan = user?.plan ?? 'FREE';
      const limit = AI_PLAN_LIMITS[plan] ?? AI_PLAN_LIMITS.FREE;

      if ((user?.aiUsage ?? 0) >= limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `AI limit exceeded (${limit}/mo). Please upgrade your plan.`,
        });
      }

      // Check daily generation limit
      const todayCount = await ctx.db.thumbnailGeneration.count({
        where: { userId, parentId: null },
      });
      const dailyLimits: Record<string, number> = { FREE: 3, PRO: 100, STUDIO: Infinity };
      const dailyLimit = dailyLimits[plan] ?? dailyLimits.FREE;
      if (todayCount + input.count > dailyLimit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Daily thumbnail limit reached (${dailyLimit}/day).`,
        });
      }

      // Simulate image generation
      const gen = await ctx.db.thumbnailGeneration.create({
        data: { userId, prompt: input.prompt, style: input.style, format: input.format, imageUrl: 'https://example.com/thumb.png' },
        select: { id: true, imageUrl: true },
      });

      return {
        images: [{ url: gen.imageUrl, id: gen.id }],
        prompt: input.prompt,
        style: input.style,
      };
    }),

  suggestIdeas: protectedProcedure
    .input(z.object({ topic: z.string().max(500).optional(), youtubeUrl: z.string().url().optional() }))
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      await checkRate(userId, 'ai-thumb-ideas', 10);

      // Simulate API response
      return {
        ideas: [
          'Shocked face with bold red arrow pointing at product',
          'Split screen before/after transformation',
          'Close-up reaction with neon glow text',
          'Minimalist design with single emoji and dark bg',
          'Action shot with motion blur and speed lines',
        ],
      };
    }),

  getFaces: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const faces = await ctx.db.asset.findMany({
      where: { userId, type: 'face' },
      select: { id: true, url: true, filename: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return { faces };
  }),

  deleteGeneration: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const gen = await ctx.db.thumbnailGeneration.findFirst({
        where: { id: input.id, userId },
        select: { id: true },
      });
      if (!gen) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Generation not found.' });
      }

      await ctx.db.thumbnailGeneration.delete({ where: { id: input.id } });
      return { id: input.id };
    }),
});

/* ── Helpers ───────────────────────────────────────────────────── */

const USER_ID = 'user-thumb-123';

function makeSession(userId = USER_ID): Session {
  return { user: { id: userId, name: 'Test User', email: 'test@example.com' }, expires: '2099-01-01' };
}

function makeDb(): MockDb {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({ plan: 'FREE', aiUsage: 0, aiResetAt: new Date() }),
    },
    thumbnailGeneration: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: 'gen-1', imageUrl: 'https://example.com/thumb.png' }),
      findFirst: vi.fn().mockResolvedValue({ id: 'gen-1' }),
      delete: vi.fn().mockResolvedValue({ id: 'gen-1' }),
    },
    asset: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'face-1', url: 'https://example.com/face1.jpg', filename: 'face1.jpg', createdAt: new Date() },
        { id: 'face-2', url: 'https://example.com/face2.jpg', filename: 'face2.jpg', createdAt: new Date() },
      ]),
    },
  };
}

function createCaller(db: MockDb, session: Session) {
  return aiThumbnailsRouter.createCaller({ db, session });
}

/* ── Tests ─────────────────────────────────────────────────────── */

describe('aiThumbnails router', () => {
  let db: MockDb;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60_000 });
    db = makeDb();
    caller = createCaller(db, makeSession());
  });

  it('generate requires authentication', async () => {
    const unauthCaller = aiThumbnailsRouter.createCaller({
      db: makeDb(),
      session: { user: { id: '' } } as any,
    });

    await expect(
      unauthCaller.generate({ prompt: 'test thumbnail', style: 'realistic' }),
    ).rejects.toThrow(TRPCError);
    await expect(
      unauthCaller.generate({ prompt: 'test thumbnail', style: 'realistic' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('generate validates prompt min length', async () => {
    // Prompt must be at least 3 characters
    await expect(caller.generate({ prompt: 'ab' })).rejects.toThrow();
    await expect(caller.generate({ prompt: '' })).rejects.toThrow();
  });

  it('generate enforces plan limits', async () => {
    // User at FREE plan with 5 AI usages (at limit)
    db.user.findUnique.mockResolvedValue({ plan: 'FREE', aiUsage: 5, aiResetAt: new Date() });

    await expect(
      caller.generate({ prompt: 'test thumbnail concept' }),
    ).rejects.toThrow(TRPCError);
    await expect(
      createCaller(
        (() => {
          const d = makeDb();
          d.user.findUnique.mockResolvedValue({ plan: 'FREE', aiUsage: 5, aiResetAt: new Date() });
          return d;
        })(),
        makeSession(),
      ).generate({ prompt: 'test thumbnail concept' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('generate succeeds for PRO plan with usage under limit', async () => {
    db.user.findUnique.mockResolvedValue({ plan: 'PRO', aiUsage: 50, aiResetAt: new Date() });

    const result = await caller.generate({ prompt: 'pro user thumbnail' });

    expect(result).toBeDefined();
    expect(result.images).toBeInstanceOf(Array);
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images[0]).toHaveProperty('url');
    expect(result.images[0]).toHaveProperty('id');
  });

  it('suggestIdeas returns array of ideas', async () => {
    const result = await caller.suggestIdeas({ topic: 'gaming' });

    expect(result).toBeDefined();
    expect(result.ideas).toBeInstanceOf(Array);
    expect(result.ideas.length).toBe(5);
    result.ideas.forEach((idea) => {
      expect(typeof idea).toBe('string');
      expect(idea.length).toBeGreaterThan(0);
    });
  });

  it('suggestIdeas requires authentication', async () => {
    const unauthCaller = aiThumbnailsRouter.createCaller({
      db: makeDb(),
      session: { user: { id: '' } } as any,
    });

    await expect(unauthCaller.suggestIdeas({})).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('getFaces returns user face assets', async () => {
    const result = await caller.getFaces();

    expect(result).toBeDefined();
    expect(result.faces).toBeInstanceOf(Array);
    expect(result.faces.length).toBe(2);
    expect(result.faces[0]).toHaveProperty('id');
    expect(result.faces[0]).toHaveProperty('url');
    expect(result.faces[0]).toHaveProperty('filename');

    // Verify it queries for the correct user
    expect(db.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, type: 'face' },
      }),
    );
  });

  it('getFaces returns empty array for user with no faces', async () => {
    db.asset.findMany.mockResolvedValue([]);

    const result = await caller.getFaces();

    expect(result.faces).toEqual([]);
  });

  it('deleteGeneration verifies ownership', async () => {
    // Generation not found for this user
    db.thumbnailGeneration.findFirst.mockResolvedValue(null);

    await expect(caller.deleteGeneration({ id: 'gen-other-user' })).rejects.toThrow(TRPCError);
    await expect(
      createCaller(
        (() => {
          const d = makeDb();
          d.thumbnailGeneration.findFirst.mockResolvedValue(null);
          return d;
        })(),
        makeSession(),
      ).deleteGeneration({ id: 'gen-other-user' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('deleteGeneration succeeds for owned generation', async () => {
    const result = await caller.deleteGeneration({ id: 'gen-1' });

    expect(result).toEqual({ id: 'gen-1' });
    expect(db.thumbnailGeneration.findFirst).toHaveBeenCalledWith({
      where: { id: 'gen-1', userId: USER_ID },
      select: { id: true },
    });
    expect(db.thumbnailGeneration.delete).toHaveBeenCalledWith({
      where: { id: 'gen-1' },
    });
  });

  it('generate is rate limited', async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() });

    await expect(
      caller.generate({ prompt: 'test thumbnail for rate limit' }),
    ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
  });

  it('generate enforces daily generation limit', async () => {
    // User already used 3 daily generations on FREE plan
    db.thumbnailGeneration.count.mockResolvedValue(3);

    await expect(
      caller.generate({ prompt: 'one more thumbnail please' }),
    ).rejects.toThrow(TRPCError);
    await expect(
      createCaller(
        (() => {
          const d = makeDb();
          d.thumbnailGeneration.count.mockResolvedValue(3);
          return d;
        })(),
        makeSession(),
      ).generate({ prompt: 'one more thumbnail please' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
