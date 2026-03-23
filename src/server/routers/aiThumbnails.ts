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
import { fal } from '@fal-ai/client';

/* ────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────── */

async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs = 60000,
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
  realistic: 'photorealistic, cinematic lighting, high detail, professional photography',
  anime: 'anime art style, vibrant colors, manga-inspired, clean lines',
  cinematic: 'cinematic movie poster style, dramatic lighting, film grain, epic composition',
  minimalist: 'minimalist design, clean composition, bold typography space, simple shapes',
  '3d': '3D rendered, Pixar-style, volumetric lighting, smooth surfaces',
  popart: 'pop art style, bold colors, halftone dots, comic book aesthetic',
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
        youtubeUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const useFal = !!env.FAL_KEY;

      if (!useFal && !env.OPENAI_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Image generation service is temporarily unavailable. Please try again later.',
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

      // Generate images
      const results: Array<{ url: string; id: string; revisedPrompt?: string }> = [];
      let failedCount = 0;

      if (useFal) {
        // ── Flux via fal.ai ──
        fal.config({ credentials: env.FAL_KEY });

        const falSize = input.format === '9:16'
          ? { width: 768, height: 1344 }
          : { width: 1344, height: 768 };

        const fluxPrompt =
          `Professional YouTube thumbnail photo. ${input.prompt}.${contextParts}

Ultra photorealistic, shot on Canon EOS R5 with 85mm f/1.4 lens.
Dramatic cinematic side lighting, strong contrast, deep shadows.
Extremely vibrant saturated colors, color graded like a Hollywood movie.
Single clear focal point with shallow depth of field and creamy bokeh background.
Person showing intense emotional expression, looking directly at camera.
Composition leaves empty space on the right side for text overlay.
DO NOT include any text, letters, words, or watermarks in the image.
${styleDesc}
Professional YouTube thumbnail that would get millions of clicks.
8K, hyper-detailed, magazine quality.`.slice(0, 4000);

        for (let i = 0; i < actualCount; i++) {
          try {
            const falResult = await fal.subscribe('fal-ai/flux-pro/v1.1', {
              input: {
                prompt: fluxPrompt,
                image_size: falSize,
                num_images: 1,
                safety_tolerance: '5',
              },
              timeout: 90_000,
            }) as { data: { images: Array<{ url: string }> } };

            const imageUrl = falResult.data?.images?.[0]?.url;
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
          } catch {
            failedCount++;
            continue;
          }
        }
      } else {
        // ── Fallback: DALL-E 3 ──
        const size = input.format === '16:9' ? '1792x1024' : '1024x1792';

        const fullPrompt =
          `Professional YouTube video thumbnail photo. ${input.prompt}.${contextParts}

CRITICAL REQUIREMENTS for YouTube thumbnail:
- Photorealistic, ultra high quality, 8K detail
- Dramatic cinematic lighting with strong contrast and shadows
- Extremely vibrant, saturated colors that pop on small screens
- Clear single focal point (usually a person's face showing strong emotion)
- Composition leaves clear empty space on one side for text overlay
- DO NOT include any text, letters, words, or watermarks in the image
- Shot from slightly below eye level for power/authority feeling
- Shallow depth of field with bokeh background
- ${styleDesc}

The image must look like a professional YouTube thumbnail that would get millions of clicks.`.slice(
            0,
            4000,
          );

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
          const revisedPrompt = data?.data?.[0]?.revised_prompt;
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

          results.push({ url: gen.imageUrl, id: gen.id, revisedPrompt });
        }
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
     Analyze thumbnail CTR score via GPT-4o Vision
     ═══════════════════════════════════════════════════════ */
  analyzeThumbnail: protectedProcedure
    .input(z.object({ imageUrl: z.string().url(), prompt: z.string().min(1).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (!env.OPENAI_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'AI service is temporarily unavailable. Please try again later.',
        });
      }

      // Rate limit
      await checkRate(userId, 'ai-thumb-analyze', 10);

      // Costs 1 AI credit
      await checkAndIncrementAIUsage(userId, ctx.db);

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
              max_tokens: 1000,
              response_format: { type: 'json_object' },
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'image_url',
                      image_url: { url: input.imageUrl },
                    },
                    {
                      type: 'text',
                      text: `Analyze this YouTube thumbnail image. The user's original prompt was: "${input.prompt}".

Return JSON with this EXACT structure:
{
  "ctrScore": <number 1-10, e.g. 7.2>,
  "summary": "<one sentence summary of the thumbnail's CTR potential>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "titleSuggestions": [
    { "title": "<TITLE IN CAPS>", "score": <number 1-10>, "reason": "<why this title works>" },
    { "title": "<TITLE IN CAPS>", "score": <number 1-10>, "reason": "<why this title works>" },
    { "title": "<TITLE IN CAPS>", "score": <number 1-10>, "reason": "<why this title works>" }
  ],
  "scores": {
    "emotion": <1-10>,
    "contrast": <1-10>,
    "composition": <1-10>,
    "clickability": <1-10>
  }
}

Be specific and actionable. Score realistically — most thumbnails are 5-8.`,
                    },
                  ],
                },
              ],
            }),
          },
          30000,
        );
      } catch {
        await decrementAIUsage(userId, ctx.db);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AI service error during thumbnail analysis.',
        });
      }

      if (!res.ok) {
        await decrementAIUsage(userId, ctx.db);
        const err = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err.error?.message ?? 'GPT-4o Vision API error',
        });
      }

      const data = (await res.json().catch(() => {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to parse GPT-4o Vision response',
        });
      })) as { choices?: Array<{ message?: { content?: string } }> };

      const text = data.choices?.[0]?.message?.content ?? '';

      try {
        const parsed = JSON.parse(text) as {
          ctrScore?: number;
          summary?: string;
          strengths?: string[];
          improvements?: string[];
          titleSuggestions?: Array<{
            title: string;
            score: number;
            reason: string;
          }>;
          scores?: {
            emotion: number;
            contrast: number;
            composition: number;
            clickability: number;
          };
        };
        return {
          ctrScore: parsed.ctrScore ?? 5,
          summary: parsed.summary ?? '',
          strengths: parsed.strengths ?? [],
          improvements: parsed.improvements ?? [],
          titleSuggestions: parsed.titleSuggestions ?? [],
          scores: parsed.scores ?? {
            emotion: 5,
            contrast: 5,
            composition: 5,
            clickability: 5,
          },
        };
      } catch {
        // Try extracting JSON from text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]) as {
              ctrScore?: number;
              summary?: string;
              strengths?: string[];
              improvements?: string[];
              titleSuggestions?: Array<{
                title: string;
                score: number;
                reason: string;
              }>;
              scores?: {
                emotion: number;
                contrast: number;
                composition: number;
                clickability: number;
              };
            };
            return {
              ctrScore: parsed.ctrScore ?? 5,
              summary: parsed.summary ?? '',
              strengths: parsed.strengths ?? [],
              improvements: parsed.improvements ?? [],
              titleSuggestions: parsed.titleSuggestions ?? [],
              scores: parsed.scores ?? {
                emotion: 5,
                contrast: 5,
                composition: 5,
                clickability: 5,
              },
            };
          } catch {
            // fall through
          }
        }
        return {
          ctrScore: 5,
          summary: 'Unable to analyze thumbnail.',
          strengths: [],
          improvements: [],
          titleSuggestions: [],
          scores: { emotion: 5, contrast: 5, composition: 5, clickability: 5 },
        };
      }
    }),

  /* ═══════════════════════════════════════════════════════
     AI idea suggestions
     ═══════════════════════════════════════════════════════ */
  suggestIdeas: protectedProcedure
    .input(
      z.object({
        topic: z.string().max(500).optional(),
        youtubeUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (!env.OPENAI_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'AI service is temporarily unavailable. Please try again later.',
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

      let data: { choices?: Array<{ message?: { content?: string } }> };
      try {
        const text = await res.text();
        if (!text || text.trim().length === 0) {
          console.error('[suggestIdeas] Empty response from OpenAI');
          return { ideas: [] };
        }
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error('[suggestIdeas] Failed to parse OpenAI response:', parseErr);
        return { ideas: [] };
      }

      const content = data.choices?.[0]?.message?.content ?? '';

      try {
        const parsed = JSON.parse(content) as { ideas?: string[] };
        if (parsed.ideas && Array.isArray(parsed.ideas)) {
          return { ideas: parsed.ideas.map(String).slice(0, 5) };
        }
      } catch {
        // Try extracting JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
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
     Iterative edit (GPT-4o Vision describe + Flux/DALL-E regen)
     ═══════════════════════════════════════════════════════ */
  edit: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        instruction: z.string().min(3).max(500),
        generationId: z.string().min(1).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const useFal = !!env.FAL_KEY;

      if (!useFal && !env.OPENAI_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Image generation service is temporarily unavailable. Please try again later.',
        });
      }

      // GPT-4o Vision step always needs OpenAI
      if (!env.OPENAI_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'AI analysis service is temporarily unavailable. Please try again later.',
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

      // Costs 2 credits: GPT-4o Vision + image generation
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

      // Step 2: Generate modified version
      const editPrompt =
        `Recreate this YouTube thumbnail with modifications. Original: ${description}. EDIT: ${input.instruction}. ` +
        'Maintain the overall composition and style unless the edit specifically changes it. ' +
        'Ultra photorealistic, 16:9, professional YouTube thumbnail. 8K, hyper-detailed.';

      let imageUrl: string;

      if (useFal) {
        // ── Flux via fal.ai ──
        fal.config({ credentials: env.FAL_KEY });
        try {
          const falResult = await fal.subscribe('fal-ai/flux-pro/v1.1', {
            input: {
              prompt: editPrompt.slice(0, 4000),
              image_size: { width: 1344, height: 768 },
              num_images: 1,
              safety_tolerance: '5',
            },
            timeout: 90_000,
          }) as { data: { images: Array<{ url: string }> } };

          const url = falResult.data?.images?.[0]?.url;
          if (!url) {
            await decrementAIUsage(userId, ctx.db);
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'No image returned from Flux.',
            });
          }
          imageUrl = url;
        } catch (e) {
          if (e instanceof TRPCError) throw e;
          await decrementAIUsage(userId, ctx.db);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'AI service error during image generation.',
          });
        }
      } else {
        // ── Fallback: DALL-E 3 ──
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

        const url = dalleData.data?.[0]?.url;
        if (!url) {
          await decrementAIUsage(userId, ctx.db);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'No image returned from DALL-E.',
          });
        }
        imageUrl = url;
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
        search: z.string().max(200).optional(),
        cursor: z.string().min(1).max(100).optional(),
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
    .input(z.object({ assetId: z.string().min(1).max(100) }))
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
    .input(z.object({ assetId: z.string().min(1).max(100) }))
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
    .input(z.object({ id: z.string().min(1).max(100) }))
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
