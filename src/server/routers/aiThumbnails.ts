import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import {
  API_ENDPOINTS,
  RATE_LIMIT_ERROR,
  getAiThumbnailLimit,
} from '@/lib/constants';
import { env } from '@/lib/env';
import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

/* ────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────── */

async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs = 30000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkRate(userId: string, endpoint: string, limit: number) {
  const { success } = await rateLimit({
    identifier: `${endpoint}:${userId}`,
    limit,
    window: 60,
  });
  if (!success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: RATE_LIMIT_ERROR,
    });
  }
}

/**
 * Count how many thumbnail generations the user has created today.
 * Uses the `createdAt` field on ThumbnailGeneration.
 */
async function countTodayGenerations(
  userId: string,
  db: PrismaClient,
): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  return db.thumbnailGeneration.count({
    where: {
      userId,
      parentId: null, // only original generations, not edits
      createdAt: { gte: startOfDay },
    },
  });
}

/**
 * Count today's edits (generations with a parentId).
 */
async function countTodayEdits(
  userId: string,
  db: PrismaClient,
): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  return db.thumbnailGeneration.count({
    where: {
      userId,
      parentId: { not: null },
      createdAt: { gte: startOfDay },
    },
  });
}

/**
 * Atomically check AI usage limit and increment in a single transaction.
 * Same logic as the ai.ts router — prevents race conditions.
 */
async function checkAndIncrementAIUsage(userId: string, db: PrismaClient) {
  await db.$transaction(
    async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { plan: true, aiUsage: true, aiResetAt: true },
      });
      if (!user) throw new TRPCError({ code: 'NOT_FOUND' });

      // Reset monthly counter if month rolled over
      const now = new Date();
      const resetAt = new Date(user.aiResetAt);
      if (
        now.getUTCMonth() !== resetAt.getUTCMonth() ||
        now.getUTCFullYear() !== resetAt.getUTCFullYear()
      ) {
        await tx.user.update({
          where: { id: userId },
          data: { aiUsage: 0, aiResetAt: now },
          select: { id: true },
        });
        user.aiUsage = 0;
      }

      const planLimits = await import('@/lib/constants').then((m) =>
        m.getPlanLimits(user.plan),
      );
      if (user.aiUsage >= planLimits.aiGenerations) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `AI limit exceeded (${planLimits.aiGenerations}/mo). Please upgrade your plan.`,
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: { aiUsage: { increment: 1 } },
        select: { id: true },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

async function decrementAIUsage(
  userId: string,
  db: PrismaClient,
  amount = 1,
) {
  await db.$transaction(
    async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { aiUsage: true },
      });
      if (!user || user.aiUsage < amount) return;
      await tx.user.update({
        where: { id: userId },
        data: { aiUsage: { decrement: amount } },
        select: { id: true },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

/** Style description map for DALL-E prompt augmentation. */
const STYLE_MAP: Record<string, string> = {
  realistic: 'photorealistic, professional photography, detailed',
  anime: 'anime/manga art style, vibrant Japanese animation, detailed illustration',
  cinematic: 'cinematic movie poster style, dramatic lighting, epic composition',
  minimalist: 'clean minimalist design, simple shapes, modern, geometric',
  '3d': '3D rendered, CGI quality, volumetric lighting',
  popart: 'pop art style, bold colors, high contrast, Roy Lichtenstein influence',
};

/**
 * Attempt to fetch YouTube video context via oEmbed (no API key needed).
 * Returns title + author or empty string on failure.
 */
async function fetchYouTubeContext(url: string): Promise<string> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetchWithTimeout(oembedUrl, undefined, 5000);
    if (!res.ok) return '';
    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
    };
    const parts: string[] = [];
    if (data.title) parts.push(`Video title: "${data.title}"`);
    if (data.author_name) parts.push(`Channel: ${data.author_name}`);
    return parts.join('. ');
  } catch {
    return '';
  }
}

/* ────────────────────────────────────────────────────────
   Router
   ──────────────────────────────────────────────────────── */

export const aiThumbnailsRouter = router({
  /* ═══════════════════════════════════════════════════════
     Generate thumbnail from scratch
     ═══════════════════════════════════════════════════════ */
  generate: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(3).max(1000),
        style: z
          .enum(['realistic', 'anime', 'cinematic', 'minimalist', '3d', 'popart'])
          .default('realistic'),
        format: z.enum(['16:9', '9:16']).default('16:9'),
        count: z.number().min(1).max(3).default(1),
        photoUrl: z.string().url().optional(),
        youtubeUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (!env.OPENAI_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'OpenAI API key not configured. Contact the administrator.',
        });
      }

      // Rate limit: 10 requests/min
      await checkRate(userId, 'ai-thumb-gen', 10);

      // Fetch user plan
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });
      const plan = user?.plan ?? 'FREE';

      // Check 9:16 format (PRO+ only)
      if (input.format === '9:16' && plan === 'FREE') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Vertical (9:16) format is available on Pro and Studio plans. Please upgrade.',
        });
      }

      // Check count limit per plan
      const maxCount = getAiThumbnailLimit('multiGen', plan);
      const actualCount = Math.min(input.count, maxCount);

      // Check daily generation limit
      const todayCount = await countTodayGenerations(userId, ctx.db);
      const dailyLimit = getAiThumbnailLimit('dailyGenerations', plan);
      if (todayCount + actualCount > dailyLimit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Daily thumbnail limit reached (${dailyLimit}/day). ${plan === 'FREE' ? 'Upgrade to Pro for 100/day.' : 'Please try again tomorrow.'}`,
        });
      }

      // Check AI credits (one per image)
      for (let i = 0; i < actualCount; i++) {
        await checkAndIncrementAIUsage(userId, ctx.db);
      }

      // Build prompt
      const styleDesc = STYLE_MAP[input.style] ?? input.style;
      let contextParts = '';

      // YouTube context
      if (input.youtubeUrl) {
        const ytContext = await fetchYouTubeContext(input.youtubeUrl);
        if (ytContext) contextParts += ` Context: ${ytContext}.`;
      }

      // Photo reference
      if (input.photoUrl) {
        contextParts +=
          ' Include a prominent person/face as the main subject, positioned prominently in the thumbnail.';
      }

      const size = input.format === '16:9' ? '1792x1024' : '1024x1792';
      const aspectDesc = input.format === '16:9' ? '16:9 landscape' : '9:16 vertical/portrait';

      const fullPrompt =
        `YouTube thumbnail: ${input.prompt}. Style: ${styleDesc}. ${aspectDesc} aspect ratio, eye-catching, professional quality, high detail.${contextParts}`.slice(
          0,
          4000,
        );

      // Generate images (DALL-E 3 only supports n=1, so loop)
      const results: Array<{ url: string; id: string }> = [];
      let failedCount = 0;

      for (let i = 0; i < actualCount; i++) {
        let res: Response;
        try {
          res = await fetchWithTimeout(
            API_ENDPOINTS.OPENAI_IMAGES,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'dall-e-3',
                prompt: fullPrompt,
                n: 1,
                size,
                quality: 'hd',
              }),
            },
            60000,
          );
        } catch {
          failedCount++;
          continue;
        }

        if (!res.ok) {
          failedCount++;
          continue;
        }

        const data = (await res.json().catch(() => null)) as {
          data?: Array<{ url: string; revised_prompt?: string }>;
        } | null;
        const imageUrl = data?.data?.[0]?.url;
        if (!imageUrl) {
          failedCount++;
          continue;
        }

        // Save to database
        const gen = await ctx.db.thumbnailGeneration.create({
          data: {
            userId,
            prompt: input.prompt,
            style: input.style,
            format: input.format,
            imageUrl,
            youtubeUrl: input.youtubeUrl ?? null,
            photoUrl: input.photoUrl ?? null,
          },
          select: { id: true, imageUrl: true },
        });

        results.push({ url: gen.imageUrl, id: gen.id });
      }

      // Refund credits for failed generations
      if (failedCount > 0) {
        await decrementAIUsage(userId, ctx.db, failedCount);
      }

      if (results.length === 0) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'All image generations failed. Please try again.',
        });
      }

      return {
        images: results,
        prompt: input.prompt,
        style: input.style,
      };
    }),

  /* ═══════════════════════════════════════════════════════
     AI idea suggestions
     ═══════════════════════════════════════════════════════ */
  suggestIdeas: protectedProcedure
    .input(
      z.object({
        topic: z.string().max(500).optional(),
        youtubeUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (!env.OPENAI_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'OpenAI API key not configured. Contact the administrator.',
        });
      }

      // Rate limit
      await checkRate(userId, 'ai-thumb-ideas', 10);

      // Build context
      let context = '';
      if (input.youtubeUrl) {
        const ytContext = await fetchYouTubeContext(input.youtubeUrl);
        if (ytContext) context = ytContext;
      }

      const topicText = input.topic || context || 'trending YouTube content';
      const systemPrompt =
        'You are an expert YouTube thumbnail designer who understands what makes thumbnails go viral. ' +
        'You generate creative, specific, and actionable thumbnail concepts. Respond with a JSON array of strings.';
      const userPrompt =
        `Generate 5 creative and viral YouTube thumbnail concepts for: "${topicText}".${context ? ` Video context: ${context}` : ''}\n\n` +
        'Each concept should include:\n' +
        '- A brief visual description (what the thumbnail shows)\n' +
        '- Suggested text overlay (if any)\n' +
        '- Color scheme suggestion\n' +
        '- Emotional hook (what makes it click-worthy)\n\n' +
        'Return ONLY a JSON object: { "ideas": ["concept 1", "concept 2", ...] }';

      let res: Response;
      try {
        res = await fetchWithTimeout(
          API_ENDPOINTS.OPENAI_CHAT,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              max_tokens: 1500,
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
            }),
          },
          30000,
        );
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AI service error. Please try again later.',
        });
      }

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err.error?.message ?? 'OpenAI API error',
        });
      }

      const data = (await res.json().catch(() => {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to parse OpenAI response',
        });
      })) as { choices?: Array<{ message?: { content?: string } }> };

      const text = data.choices?.[0]?.message?.content ?? '';

      try {
        const parsed = JSON.parse(text) as { ideas?: string[] };
        if (parsed.ideas && Array.isArray(parsed.ideas)) {
          return { ideas: parsed.ideas.map(String).slice(0, 5) };
        }
      } catch {
        // Try extracting JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]) as { ideas?: string[] };
            if (parsed.ideas && Array.isArray(parsed.ideas)) {
              return { ideas: parsed.ideas.map(String).slice(0, 5) };
            }
          } catch {
            // fall through
          }
        }
      }

      return { ideas: [] };
    }),

  /* ═══════════════════════════════════════════════════════
     Iterative edit (GPT-4o Vision describe + DALL-E regen)
     ═══════════════════════════════════════════════════════ */
  edit: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        instruction: z.string().min(3).max(500),
        generationId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (!env.OPENAI_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'OpenAI API key not configured. Contact the administrator.',
        });
      }

      await checkRate(userId, 'ai-thumb-edit', 10);

      // Fetch user plan
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });
      const plan = user?.plan ?? 'FREE';

      // Check daily edit limit
      const todayEdits = await countTodayEdits(userId, ctx.db);
      const editLimit = getAiThumbnailLimit('dailyEdits', plan);
      if (todayEdits >= editLimit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Daily edit limit reached (${editLimit}/day). ${plan === 'FREE' ? 'Upgrade to Pro for unlimited edits.' : 'Please try again tomorrow.'}`,
        });
      }

      // Costs 2 credits: GPT-4o Vision + DALL-E generation
      await checkAndIncrementAIUsage(userId, ctx.db);
      await checkAndIncrementAIUsage(userId, ctx.db);

      // Step 1: GPT-4o Vision describes the existing image
      let visionRes: Response;
      try {
        visionRes = await fetchWithTimeout(
          API_ENDPOINTS.OPENAI_CHAT,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              max_tokens: 500,
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text:
                        'Describe this YouTube thumbnail image in great detail for recreation. ' +
                        'Include: layout, colors, subjects, text, style, mood, background, and composition. ' +
                        'Be extremely specific about positioning and visual elements.',
                    },
                    {
                      type: 'image_url',
                      image_url: { url: input.imageUrl, detail: 'high' },
                    },
                  ],
                },
              ],
            }),
          },
          30000,
        );
      } catch {
        await decrementAIUsage(userId, ctx.db, 2);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AI service error during image analysis.',
        });
      }

      if (!visionRes.ok) {
        await decrementAIUsage(userId, ctx.db, 2);
        const err = (await visionRes.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err.error?.message ?? 'GPT-4o Vision API error',
        });
      }

      const visionData = (await visionRes.json().catch(() => {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to parse GPT-4o Vision response',
        });
      })) as { choices?: Array<{ message?: { content?: string } }> };

      const description =
        visionData.choices?.[0]?.message?.content ?? '';

      // Step 2: DALL-E 3 generates modified version
      const editPrompt =
        `Recreate this YouTube thumbnail with modifications. Original: ${description}. EDIT: ${input.instruction}. ` +
        'Maintain the overall composition and style unless the edit specifically changes it. ' +
        'High quality, 16:9, professional YouTube thumbnail.';

      let dalleRes: Response;
      try {
        dalleRes = await fetchWithTimeout(
          API_ENDPOINTS.OPENAI_IMAGES,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'dall-e-3',
              prompt: editPrompt.slice(0, 4000),
              n: 1,
              size: '1792x1024',
              quality: 'hd',
            }),
          },
          60000,
        );
      } catch {
        // Vision succeeded (1 credit consumed), refund only the DALL-E credit
        await decrementAIUsage(userId, ctx.db);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AI service error during image generation.',
        });
      }

      if (!dalleRes.ok) {
        await decrementAIUsage(userId, ctx.db);
        const err = (await dalleRes.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err.error?.message ?? 'DALL-E API error',
        });
      }

      const dalleData = (await dalleRes.json().catch(() => {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to parse DALL-E response',
        });
      })) as { data?: Array<{ url: string; revised_prompt?: string }> };

      const imageUrl = dalleData.data?.[0]?.url;
      if (!imageUrl) {
        await decrementAIUsage(userId, ctx.db);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No image returned from DALL-E.',
        });
      }

      // Save as child of original generation
      const gen = await ctx.db.thumbnailGeneration.create({
        data: {
          userId,
          prompt: input.instruction,
          style: 'realistic',
          format: '16:9',
          imageUrl,
          parentId: input.generationId ?? null,
        },
        select: { id: true, imageUrl: true },
      });

      return { url: gen.imageUrl, id: gen.id };
    }),

  /* ═══════════════════════════════════════════════════════
     Gallery: get user's generation history
     ═══════════════════════════════════════════════════════ */
  getGallery: protectedProcedure
    .input(
      z.object({
        filter: z.enum(['all', 'originals', 'edited']).default('all'),
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      type WhereClause = {
        userId: string;
        parentId?: null | { not: null };
        prompt?: { contains: string; mode: 'insensitive' };
        id?: { lt: string };
      };

      const where: WhereClause = { userId };

      // Filter by type
      if (input.filter === 'originals') {
        where.parentId = null;
      } else if (input.filter === 'edited') {
        where.parentId = { not: null };
      }

      // Search by prompt text
      if (input.search) {
        where.prompt = { contains: input.search, mode: 'insensitive' };
      }

      // Cursor-based pagination (use id < cursor for descending order)
      if (input.cursor) {
        where.id = { lt: input.cursor };
      }

      const items = await ctx.db.thumbnailGeneration.findMany({
        where,
        select: {
          id: true,
          prompt: true,
          style: true,
          format: true,
          imageUrl: true,
          parentId: true,
          youtubeUrl: true,
          photoUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1, // fetch one extra to determine if there's a next page
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop()!;
        nextCursor = nextItem.id;
      }

      return { items, nextCursor };
    }),

  /* ═══════════════════════════════════════════════════════
     Face gallery management
     ═══════════════════════════════════════════════════════ */
  getFaces: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    // Face photos are assets with type='face'
    const faces = await ctx.db.asset.findMany({
      where: { userId, type: 'face' },
      select: {
        id: true,
        url: true,
        filename: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { faces };
  }),

  uploadFace: protectedProcedure
    .input(z.object({ assetId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify asset ownership
      const asset = await ctx.db.asset.findFirst({
        where: { id: input.assetId, userId },
        select: { id: true, type: true },
      });
      if (!asset) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Asset not found.',
        });
      }

      // Check face limit
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });
      const plan = user?.plan ?? 'FREE';
      const faceLimit = getAiThumbnailLimit('faces', plan);

      const currentFaceCount = await ctx.db.asset.count({
        where: { userId, type: 'face' },
      });
      if (currentFaceCount >= faceLimit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Face photo limit reached (${faceLimit}). ${plan === 'FREE' ? 'Upgrade to Pro for more.' : 'Remove existing faces to add new ones.'}`,
        });
      }

      // Tag asset as face
      const updated = await ctx.db.asset.update({
        where: { id: input.assetId, userId },
        data: { type: 'face' },
        select: { id: true, url: true, filename: true },
      });

      return updated;
    }),

  removeFace: protectedProcedure
    .input(z.object({ assetId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify ownership and that it's a face
      const asset = await ctx.db.asset.findFirst({
        where: { id: input.assetId, userId, type: 'face' },
        select: { id: true },
      });
      if (!asset) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Face photo not found.',
        });
      }

      // Revert to 'image' type
      const updated = await ctx.db.asset.update({
        where: { id: input.assetId, userId },
        data: { type: 'image' },
        select: { id: true },
      });

      return updated;
    }),

  /* ═══════════════════════════════════════════════════════
     Delete a generation
     ═══════════════════════════════════════════════════════ */
  deleteGeneration: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify ownership
      const gen = await ctx.db.thumbnailGeneration.findFirst({
        where: { id: input.id, userId },
        select: { id: true },
      });
      if (!gen) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Generation not found.',
        });
      }

      // Delete (cascade will handle children if any)
      await ctx.db.thumbnailGeneration.delete({
        where: { id: input.id },
      });

      return { id: input.id };
    }),
});
