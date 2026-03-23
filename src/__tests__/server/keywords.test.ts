// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';

/* ── Mock modules ──────────────────────────────────────────────── */

const mockRateLimit = vi.fn().mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60_000 });
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...args: unknown[]) => mockRateLimit(...args) }));

const mockChatCreate = vi.fn().mockResolvedValue({
  choices: [
    {
      message: {
        content: JSON.stringify({
          mainKeyword: { keyword: 'test', searchVolume: 10000, competition: 'medium', cpc: 1.5, trend: 'rising' },
          relatedKeywords: [{ keyword: 'related', searchVolume: 5000, competition: 'low', relevance: 85 }],
          longTailKeywords: [{ keyword: 'long tail test', searchVolume: 1000, competition: 'low' }],
          risingKeywords: [{ keyword: 'rising test', searchVolume: 8000, volumeChange: 500 }],
          topOpportunities: [{ keyword: 'opp test', searchVolume: 3000, competition: 'low', opportunity: 'high' }],
        }),
      },
    },
  ],
});

vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = { completions: { create: mockChatCreate } };
    },
  };
});

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

/* ── Replicate keywords router logic ──────────────────────────── */

const { rateLimit } = await import('@/lib/rate-limit');

const keywordsRouter = t.router({
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const rl = await rateLimit({
        identifier: `keywords:${ctx.session.user.id}`,
        limit: 10,
        window: 60,
      });
      if (!rl.success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Try again in ${Math.ceil((rl.reset - Date.now()) / 1000)}s`,
        });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AI service is temporarily unavailable. Please try again later.',
        });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey });
      const res = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: `keyword data for "${input.query}"` }],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      });

      const raw = res.choices[0]?.message?.content;
      if (!raw) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No response from AI' });

      return JSON.parse(raw);
    }),

  getTrending: protectedProcedure
    .input(
      z.object({
        period: z.enum(['today', 'week', 'month']).default('month'),
        topic: z.string().max(200).optional(),
        language: z.string().max(50).default('English'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rl = await rateLimit({
        identifier: `trending:${ctx.session.user.id}`,
        limit: 5,
        window: 60,
      });
      if (!rl.success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded`,
        });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AI service is temporarily unavailable. Please try again later.',
        });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey });

      const periodLabel =
        input.period === 'today' ? 'today' : input.period === 'week' ? 'this week' : 'this month';

      const res = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Generate 15 trending YouTube keywords for ${periodLabel} in ${input.language}${input.topic ? ` for topic: ${input.topic}` : ''}.`,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1000,
      });

      const raw = res.choices[0]?.message?.content;
      if (!raw) return { keywords: [] };

      return JSON.parse(raw);
    }),
});

/* ── Helpers ───────────────────────────────────────────────────── */

const USER_ID = 'user-kw-123';
const ORIGINAL_ENV = { ...process.env };

function makeSession(userId = USER_ID): Session {
  return { user: { id: userId, name: 'Test User', email: 'test@example.com' }, expires: '2099-01-01' };
}

function makeDb(): MockDb {
  return {};
}

function createCaller(db: MockDb, session: Session) {
  return keywordsRouter.createCaller({ db, session });
}

/* ── Tests ─────────────────────────────────────────────────────── */

describe('keywords router', () => {
  let db: MockDb;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60_000 });
    process.env.OPENAI_API_KEY = 'test-api-key';
    db = makeDb();
    caller = createCaller(db, makeSession());
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('search requires authentication', async () => {
    const unauthCaller = keywordsRouter.createCaller({
      db: makeDb(),
      session: { user: { id: '' } } as any,
    });

    await expect(unauthCaller.search({ query: 'test' })).rejects.toThrow(TRPCError);
    await expect(unauthCaller.search({ query: 'test' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('search validates input length', async () => {
    // Empty query should fail (min 1)
    await expect(caller.search({ query: '' })).rejects.toThrow();

    // Over 200 chars should fail
    await expect(caller.search({ query: 'X'.repeat(201) })).rejects.toThrow();
  });

  it('getTrending returns data with period filter', async () => {
    mockChatCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              keywords: [
                { keyword: 'trending topic', searchVolume: 50000, volumeChange: 1200 },
                { keyword: 'viral video', searchVolume: 30000, volumeChange: 800 },
              ],
            }),
          },
        },
      ],
    });

    const result = await caller.getTrending({ period: 'week' });

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.keywords[0]).toHaveProperty('keyword');
    expect(result.keywords[0]).toHaveProperty('searchVolume');
  });

  it('search is rate limited', async () => {
    mockRateLimit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 30_000 });

    await expect(caller.search({ query: 'test keyword' })).rejects.toThrow(TRPCError);
    await expect(caller.search({ query: 'test keyword' })).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
    });
  });

  it('search calls OpenAI and returns parsed data', async () => {
    const result = await caller.search({ query: 'youtube seo' });

    expect(result).toBeDefined();
    expect(result.mainKeyword).toBeDefined();
    expect(result.mainKeyword.keyword).toBe('test');
    expect(result.relatedKeywords).toBeInstanceOf(Array);
    expect(mockChatCreate).toHaveBeenCalled();
  });

  it('search throws when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(caller.search({ query: 'test' })).rejects.toThrow(TRPCError);
    await expect(
      createCaller(makeDb(), makeSession()).search({ query: 'test' }),
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });

  it('getTrending accepts optional topic parameter', async () => {
    mockChatCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              keywords: [{ keyword: 'gaming trends', searchVolume: 20000, volumeChange: 300 }],
            }),
          },
        },
      ],
    });

    const result = await caller.getTrending({ period: 'today', topic: 'gaming' });

    expect(result.keywords).toBeDefined();
    expect(mockChatCreate).toHaveBeenCalled();
  });

  it('getTrending returns empty keywords when AI returns no content', async () => {
    mockChatCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    const result = await caller.getTrending({ period: 'month' });

    expect(result).toEqual({ keywords: [] });
  });
});
