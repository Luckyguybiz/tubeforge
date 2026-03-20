import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { API_ENDPOINTS, RATE_LIMIT_ERROR, getPlanLimits } from '@/lib/constants';
import { env } from '@/lib/env';
import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

/** Fetch wrapper with AbortController timeout */
async function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkRateLimit(userId: string, endpoint: string = 'ai-gen', limit: number = 10) {
  const { success } = await rateLimit({ identifier: `${endpoint}:${userId}`, limit, window: 60 });
  if (!success) {
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
  }
}

/**
 * Atomically check AI usage limit and increment in a single transaction.
 * Prevents race conditions where concurrent requests could bypass the limit.
 */
async function checkAndIncrementAIUsage(userId: string, db: PrismaClient) {
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { plan: true, aiUsage: true, aiResetAt: true },
    });
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });

    // Reset monthly counter
    const now = new Date();
    const resetAt = new Date(user.aiResetAt);
    if (now.getUTCMonth() !== resetAt.getUTCMonth() || now.getUTCFullYear() !== resetAt.getUTCFullYear()) {
      await tx.user.update({ where: { id: userId }, data: { aiUsage: 0, aiResetAt: now }, select: { id: true } });
      user.aiUsage = 0;
    }

    const limit = getPlanLimits(user.plan).aiGenerations;
    if (user.aiUsage >= limit) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `AI limit exceeded (${limit}/mo). Please upgrade your plan.` });
    }

    // Increment within the same transaction
    await tx.user.update({ where: { id: userId }, data: { aiUsage: { increment: 1 } }, select: { id: true } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function decrementAIUsage(userId: string, db: PrismaClient, amount = 1) {
  await db.$transaction(async (tx) => {
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
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export const aiRouter = router({
  generateThumbnail: protectedProcedure
    .input(z.object({
      prompt: z.string().min(1).max(1000),
      style: z.enum(['realistic', 'anime', 'cinematic', 'minimalist', '3d', 'popart']).default('realistic'),
      count: z.number().min(1).max(6).default(4),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkRateLimit(ctx.session.user.id, 'ai-thumbnail', 10);
      await checkAndIncrementAIUsage(ctx.session.user.id, ctx.db);

      let res: Response;
      try {
        res = await fetchWithTimeout(API_ENDPOINTS.OPENAI_IMAGES, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: `YouTube thumbnail: ${input.prompt}. Style: ${input.style}. High quality, eye-catching, 16:9 aspect ratio.`,
            n: 1,
            size: '1792x1024',
            quality: 'hd',
          }),
        });
      } catch (e) {
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'AI service error' });
      }

      if (!res.ok) {
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        const err = await res.json().catch(() => ({}));
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: err.error?.message ?? 'DALL-E API error' });
      }

      const data = await res.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse DALL-E API response' }); });
      return { images: data.data?.map((d: { url: string; revised_prompt?: string }) => ({ url: d.url, revisedPrompt: d.revised_prompt })) ?? [] };
    }),

  generateFromImage: protectedProcedure
    .input(z.object({
      imageBase64: z.string().min(1).max(2_000_000).refine(
        (v) => /^data:image\/(jpeg|png|webp|gif|avif);base64,[A-Za-z0-9+/=]/.test(v),
        { message: 'Must be a valid base64-encoded image (JPEG, PNG, WebP, GIF, or AVIF)' }
      ),
      prompt: z.string().max(1000).default(''),
      style: z.enum(['realistic', 'anime', 'cinematic', 'minimalist', '3d', 'popart']).default('realistic'),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkRateLimit(ctx.session.user.id, 'ai-from-image', 10);
      // Charge 2 credits: one for GPT-4o Vision analysis, one for DALL-E generation
      await checkAndIncrementAIUsage(ctx.session.user.id, ctx.db);
      await checkAndIncrementAIUsage(ctx.session.user.id, ctx.db);

      // Step 1: GPT-4o Vision describes the canvas image
      let visionRes: Response;
      try {
        visionRes = await fetchWithTimeout(API_ENDPOINTS.OPENAI_CHAT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            max_tokens: 300,
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `This image is a canvas sketch for a YouTube thumbnail. Analyze it and describe the EXACT layout for image generation:

1. POSITION of each element (left/center/right, top/middle/bottom, percentages)
2. If there's a PHOTO of a person — describe where they are positioned and how large
3. BACKGROUND: what color/style
4. TEXT areas: where text should go, approximate size
5. Any drawn shapes or highlights

${input.prompt ? `The user also wants: "${input.prompt}"` : ''}

Be VERY specific about spatial positioning. Example: "Person photo occupying right 30% of frame, large bold text on left 60%, dark gradient background"`,
                },
                {
                  type: 'image_url',
                  image_url: { url: input.imageBase64, detail: 'high' },
                },
              ],
            }],
          }),
        });
      } catch (e) {
        await decrementAIUsage(ctx.session.user.id, ctx.db, 2);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'AI service error' });
      }

      if (!visionRes.ok) {
        await decrementAIUsage(ctx.session.user.id, ctx.db, 2);
        const err = await visionRes.json().catch(() => ({}));
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: err.error?.message ?? 'GPT-4o Vision API error' });
      }

      const visionData = await visionRes.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse GPT-4o Vision API response' }); });
      const description = visionData.choices?.[0]?.message?.content ?? '';

      // Step 2: DALL-E 3 generates based on description + user prompt
      const styleMap: Record<string, string> = {
        realistic: 'photorealistic, professional photography',
        anime: 'anime/manga art style, vibrant Japanese animation',
        cinematic: 'cinematic movie poster style, dramatic lighting',
        minimalist: 'clean minimalist design, simple and modern',
        '3d': '3D rendered, CGI quality',
        popart: 'pop art style, bold colors and high contrast',
      };
      const fullPrompt = `Create a YouTube thumbnail with this EXACT layout: ${description}. Style: ${styleMap[input.style] ?? input.style}. Requirements: follow the described spatial positioning precisely, 16:9 aspect ratio, professional quality, eye-catching. Do NOT add text/watermarks unless specified in the layout.`;

      let dalleRes: Response;
      try {
        dalleRes = await fetchWithTimeout(API_ENDPOINTS.OPENAI_IMAGES, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: fullPrompt.slice(0, 4000),
            n: 1,
            size: '1792x1024',
            quality: 'hd',
          }),
        });
      } catch (e) {
        // Vision succeeded (1 credit consumed), refund only the DALL-E credit
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'AI service error' });
      }

      if (!dalleRes.ok) {
        // Vision succeeded (1 credit consumed), refund only the DALL-E credit
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        const err = await dalleRes.json().catch(() => ({}));
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: err.error?.message ?? 'DALL-E API error' });
      }

      const dalleData = await dalleRes.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse DALL-E API response' }); });
      return {
        description,
        images: dalleData.data?.map((d: { url: string; revised_prompt?: string }) => ({ url: d.url, revisedPrompt: d.revised_prompt })) ?? [],
      };
    }),

  generateMetadata: protectedProcedure
    .input(z.object({
      topic: z.string().min(1).max(500),
      language: z.enum(['ru', 'en']).default('ru'),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkRateLimit(ctx.session.user.id, 'ai-metadata', 20);
      await checkAndIncrementAIUsage(ctx.session.user.id, ctx.db);

      let res: Response;
      try {
        res = await fetchWithTimeout(API_ENDPOINTS.ANTHROPIC_MESSAGES, {
          method: 'POST',
          headers: {
            'x-api-key': env.ANTHROPIC_API_KEY,
            'content-type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            messages: [{
              role: 'user',
              content: `Generate SEO-optimized YouTube video metadata in ${input.language === 'ru' ? 'Russian' : 'English'} for the topic: "${input.topic}".
Return JSON with: { "title": "...", "description": "...", "tags": ["...", "..."] }
Title: max 100 chars, catchy, with keywords.
Description: 200-500 chars with CTA and timestamps placeholder.
Tags: 10-15 relevant tags.
Return ONLY valid JSON, no markdown.`,
            }],
          }),
        });
      } catch (e) {
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'AI service error' });
      }

      if (!res.ok) {
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Claude API error' });
      }

      const data = await res.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse Claude API response' }); });
      const text = data.content?.[0]?.text ?? '';
      try {
        return JSON.parse(text);
      } catch {
        // Try to extract JSON from text that may contain markdown fences or extra text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch {
            // fall through to error fallback
          }
        }
        return { title: 'Generation error', description: 'Failed to generate metadata. Please try again.', tags: [] };
      }
    }),

  generateVideo: protectedProcedure
    .input(z.object({
      prompt: z.string().min(1).max(1000),
      model: z.enum(['turbo', 'standard', 'pro', 'cinematic']).default('standard'),
      duration: z.number().min(1).max(30).default(5),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkRateLimit(ctx.session.user.id, 'ai-video', 10);
      await checkAndIncrementAIUsage(ctx.session.user.id, ctx.db);

      // Runway ML Gen-3 Alpha API
      const runwayModelMap: Record<string, string> = {
        turbo: 'gen3a_turbo',
        standard: 'gen3a',
        pro: 'gen3a',
        cinematic: 'gen3a',
      };
      let res: Response;
      try {
        res = await fetchWithTimeout(API_ENDPOINTS.RUNWAY_VIDEO, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RUNWAY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            promptText: input.prompt,
            model: runwayModelMap[input.model] ?? 'gen3a_turbo',
            duration: input.duration,
            ratio: '16:9',
          }),
        });
      } catch (e) {
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'AI service error' });
      }

      if (!res.ok) {
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Runway API error' });
      }

      const data = await res.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse Runway API response' }); });
      return { taskId: data.id, status: 'processing' };
    }),

  /* ═══════════════════════════════════════════════════════════════
     Z1: AI Script Generator — uses OpenAI GPT to generate scenes
     ═══════════════════════════════════════════════════════════════ */
  generateScript: protectedProcedure
    .input(z.object({
      topic: z.string().min(1).max(500),
      tone: z.enum(['professional', 'casual', 'fun']).default('professional'),
      duration: z.enum(['30s', '1min', '3min']).default('1min'),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!env.OPENAI_API_KEY) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'OpenAI API key not configured. Contact the administrator.' });
      }

      await checkRateLimit(ctx.session.user.id, 'ai-script', 10);
      // Costs 2 AI credits
      await checkAndIncrementAIUsage(ctx.session.user.id, ctx.db);
      await checkAndIncrementAIUsage(ctx.session.user.id, ctx.db);

      const durationMap: Record<string, { scenes: number; totalSec: number }> = {
        '30s': { scenes: 3, totalSec: 30 },
        '1min': { scenes: 5, totalSec: 60 },
        '3min': { scenes: 10, totalSec: 180 },
      };
      const cfg = durationMap[input.duration] ?? durationMap['1min'];

      const toneMap: Record<string, string> = {
        professional: 'профессиональный, деловой',
        casual: 'разговорный, дружелюбный',
        fun: 'весёлый, энергичный, с юмором',
      };

      let res: Response;
      try {
        res = await fetchWithTimeout(API_ENDPOINTS.OPENAI_CHAT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            max_tokens: 2000,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: `Ты — сценарист YouTube-видео. Создавай сценарии на русском языке. Отвечай ТОЛЬКО в JSON формате.`,
              },
              {
                role: 'user',
                content: `Создай сценарий YouTube-видео на тему: "${input.topic}".

Тон: ${toneMap[input.tone] ?? 'профессиональный'}.
Общая длительность: ~${cfg.totalSec} секунд.
Количество сцен: ${cfg.scenes}.

Верни JSON:
{
  "scenes": [
    { "text": "Текст/описание для сцены (промпт для генерации видео)", "duration": <число секунд> }
  ]
}

Каждая сцена должна содержать:
- text: описание визуальной сцены для AI-генерации видео (что показывать, какая атмосфера)
- duration: длительность в секундах (сумма должна быть ~${cfg.totalSec})

Сделай сцены визуально разнообразными и увлекательными.`,
              },
            ],
          }),
        }, 60000);
      } catch (e) {
        await decrementAIUsage(ctx.session.user.id, ctx.db, 2);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'AI service error. Please try again later.' });
      }

      if (!res.ok) {
        await decrementAIUsage(ctx.session.user.id, ctx.db, 2);
        const err = await res.json().catch(() => ({}));
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: (err as { error?: { message?: string } }).error?.message ?? 'OpenAI API error' });
      }

      const data = await res.json().catch(() => {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse OpenAI API response' });
      });
      const text = (data as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ?? '';

      try {
        const parsed = JSON.parse(text) as { scenes?: { text: string; duration: number }[] };
        if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
          throw new Error('Invalid format');
        }
        return {
          scenes: parsed.scenes.map((s: { text: string; duration: number }) => ({
            text: String(s.text || ''),
            duration: Math.max(3, Math.min(30, Number(s.duration) || 5)),
          })),
        };
      } catch {
        // Try extracting JSON from possible markdown wrapping
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]) as { scenes?: { text: string; duration: number }[] };
            if (parsed.scenes && Array.isArray(parsed.scenes)) {
              return {
                scenes: parsed.scenes.map((s: { text: string; duration: number }) => ({
                  text: String(s.text || ''),
                  duration: Math.max(3, Math.min(30, Number(s.duration) || 5)),
                })),
              };
            }
          } catch {
            // fall through
          }
        }
        await decrementAIUsage(ctx.session.user.id, ctx.db, 2);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse script. Please try again.' });
      }
    }),

  /* ═══════════════════════════════════════════════════════════════
     Z2: AI Auto-Captions — generates SRT-style captions from text
     ═══════════════════════════════════════════════════════════════ */
  generateCaptions: protectedProcedure
    .input(z.object({
      scenes: z.array(z.object({
        text: z.string(),
        duration: z.number(),
      })).min(1).max(50),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!env.OPENAI_API_KEY) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'OpenAI API key not configured. This feature will be available soon.' });
      }

      await checkRateLimit(ctx.session.user.id, 'ai-captions', 10);
      await checkAndIncrementAIUsage(ctx.session.user.id, ctx.db);

      const sceneSummary = input.scenes.map((s, i) => `Сцена ${i + 1} (${s.duration}с): ${s.text}`).join('\n');

      let res: Response;
      try {
        res = await fetchWithTimeout(API_ENDPOINTS.OPENAI_CHAT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            max_tokens: 3000,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: 'Ты генерируешь субтитры для видео в формате SRT. Отвечай ТОЛЬКО в JSON.',
              },
              {
                role: 'user',
                content: `Создай субтитры для видео на основе описаний сцен:

${sceneSummary}

Верни JSON:
{
  "srt": "полный текст SRT файла с таймкодами",
  "captions": [
    { "index": 1, "start": "00:00:00,000", "end": "00:00:03,000", "text": "Текст субтитра" }
  ]
}

Разбей текст на короткие субтитры (макс 2 строки, ~10 слов). Таймкоды должны точно покрывать длительность каждой сцены.`,
              },
            ],
          }),
        }, 60000);
      } catch (e) {
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'AI service error' });
      }

      if (!res.ok) {
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        const err = await res.json().catch(() => ({}));
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: (err as { error?: { message?: string } }).error?.message ?? 'OpenAI API error' });
      }

      const data = await res.json().catch(() => {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse response' });
      });
      const text = (data as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ?? '';

      try {
        const parsed = JSON.parse(text) as { srt?: string; captions?: { index: number; start: string; end: string; text: string }[] };
        return {
          srt: parsed.srt ?? '',
          captions: parsed.captions ?? [],
        };
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]) as { srt?: string; captions?: { index: number; start: string; end: string; text: string }[] };
            return { srt: parsed.srt ?? '', captions: parsed.captions ?? [] };
          } catch {
            // fall through
          }
        }
        return { srt: '', captions: [] };
      }
    }),

  /* ═══════════════════════════════════════════════════════════════
     Z5: AI Image Generator — general-purpose DALL-E 3 image gen
     ═══════════════════════════════════════════════════════════════ */
  generateImage: protectedProcedure
    .input(z.object({
      prompt: z.string().min(1).max(1000),
      style: z.enum(['realistic', 'anime', '3d', 'watercolor', 'oil', 'pixel', 'minimalist', 'cinematic']).default('realistic'),
      size: z.enum(['1024x1024', '1792x1024', '1024x1792']).default('1024x1024'),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkRateLimit(ctx.session.user.id, 'ai-image', 10);
      await checkAndIncrementAIUsage(ctx.session.user.id, ctx.db);

      const styleMap: Record<string, string> = {
        realistic: 'photorealistic, professional photography, detailed',
        anime: 'anime/manga art style, vibrant Japanese animation, detailed illustration',
        '3d': '3D rendered, CGI quality, volumetric lighting',
        watercolor: 'watercolor painting, soft strokes, artistic, hand-painted feel',
        oil: 'oil painting on canvas, rich textures, classical art style',
        pixel: 'pixel art, 16-bit retro game style, crisp pixels',
        minimalist: 'clean minimalist design, simple shapes, modern, geometric',
        cinematic: 'cinematic movie poster style, dramatic lighting, epic composition',
      };

      let res: Response;
      try {
        res = await fetchWithTimeout(API_ENDPOINTS.OPENAI_IMAGES, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: `${input.prompt}. Style: ${styleMap[input.style] ?? input.style}. High quality, detailed.`,
            n: 1,
            size: input.size,
            quality: 'hd',
          }),
        });
      } catch (e) {
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'AI service error' });
      }

      if (!res.ok) {
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        const err = await res.json().catch(() => ({}));
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: err.error?.message ?? 'DALL-E API error' });
      }

      const data = await res.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse DALL-E API response' }); });
      const img = data.data?.[0] as { url?: string; revised_prompt?: string } | undefined;
      return {
        url: img?.url ?? '',
        revisedPrompt: img?.revised_prompt ?? '',
      };
    }),

  /* ═══════════════════════════════════════════════════════════════
     Z4: AI Background Removal — placeholder
     ═══════════════════════════════════════════════════════════════ */
  removeBackground: protectedProcedure
    .input(z.object({
      imageUrl: z.string().min(1),
    }))
    .mutation(async () => {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Background removal coming soon. Feature is under development.',
      });
    }),

  /* ═══════════════════════════════════════════════════════════════
     Z3: Check ElevenLabs API status (for Settings page)
     ═══════════════════════════════════════════════════════════════ */
  checkVoiceCloneStatus: protectedProcedure
    .query(async () => {
      const hasKey = !!(process.env.ELEVENLABS_API_KEY);
      return { available: hasKey };
    }),
});
