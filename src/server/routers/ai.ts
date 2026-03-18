import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { API_ENDPOINTS, RATE_LIMIT_ERROR } from '@/lib/constants';
import { env } from '@/lib/env';
import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

const AI_LIMITS: Record<string, number> = { FREE: 5, PRO: 100, STUDIO: Infinity };

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

async function checkRateLimit(userId: string) {
  const { success } = await rateLimit({ identifier: `ai:${userId}`, limit: 10, window: 60 });
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

    const limit = AI_LIMITS[user.plan];
    if (user.aiUsage >= limit) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Лимит ИИ исчерпан (${limit}/мес). Обновите тарифный план.` });
    }

    // Increment within the same transaction
    await tx.user.update({ where: { id: userId }, data: { aiUsage: { increment: 1 } }, select: { id: true } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function decrementAIUsage(userId: string, db: PrismaClient) {
  await db.user.update({ where: { id: userId }, data: { aiUsage: { decrement: 1 } }, select: { id: true } });
}

export const aiRouter = router({
  generateThumbnail: protectedProcedure
    .input(z.object({
      prompt: z.string().min(1).max(1000),
      style: z.enum(['realistic', 'anime', 'cinematic', 'minimalist', '3d', 'popart']).default('realistic'),
      count: z.number().min(1).max(6).default(4),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkRateLimit(ctx.session.user.id);
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
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: err.error?.message ?? 'Ошибка DALL-E API' });
      }

      const data = await res.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Не удалось разобрать ответ DALL-E API' }); });
      return { images: data.data?.map((d: { url: string; revised_prompt?: string }) => ({ url: d.url, revisedPrompt: d.revised_prompt })) ?? [] };
    }),

  generateFromImage: protectedProcedure
    .input(z.object({
      imageBase64: z.string().min(1).max(10_000_000),
      prompt: z.string().max(1000).default(''),
      style: z.enum(['realistic', 'anime', 'cinematic', 'minimalist', '3d', 'popart']).default('realistic'),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkRateLimit(ctx.session.user.id);
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
                  text: 'This is a rough sketch/wireframe for a YouTube thumbnail. The user drew an approximate layout of what they want. Interpret the shapes, lines, and text as a BLUEPRINT — not literally. Describe what the final professional thumbnail should look like based on this sketch. Focus on: 1) Main subject/person placement 2) Text areas and what they might say 3) Background style 4) Color scheme 5) Overall composition and mood. Be specific and creative in interpreting the rough drawing into a polished thumbnail concept.',
                },
                {
                  type: 'image_url',
                  image_url: { url: input.imageBase64, detail: 'low' },
                },
              ],
            }],
          }),
        });
      } catch (e) {
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'AI service error' });
      }

      if (!visionRes.ok) {
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        const err = await visionRes.json().catch(() => ({}));
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: err.error?.message ?? 'Ошибка GPT-4o Vision API' });
      }

      const visionData = await visionRes.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Не удалось разобрать ответ GPT-4o Vision API' }); });
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
      const fullPrompt = `Professional YouTube thumbnail. Layout and composition based on this sketch: ${description}. ${input.prompt ? `User wants: ${input.prompt}.` : ''} Style: ${styleMap[input.style] ?? input.style}. Must be eye-catching, high quality, 16:9 aspect ratio, suitable for YouTube. No watermarks or text artifacts.`;

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
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'AI service error' });
      }

      if (!dalleRes.ok) {
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        const err = await dalleRes.json().catch(() => ({}));
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: err.error?.message ?? 'Ошибка DALL-E API' });
      }

      const dalleData = await dalleRes.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Не удалось разобрать ответ DALL-E API' }); });
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
      await checkRateLimit(ctx.session.user.id);
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
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Ошибка Claude API' });
      }

      const data = await res.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Не удалось разобрать ответ Claude API' }); });
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
        return { title: 'Ошибка генерации', description: 'Не удалось сгенерировать метаданные. Попробуйте ещё раз.', tags: [] };
      }
    }),

  generateVideo: protectedProcedure
    .input(z.object({
      prompt: z.string().min(1).max(1000),
      model: z.enum(['turbo', 'standard', 'pro', 'cinematic']).default('standard'),
      duration: z.number().min(1).max(30).default(5),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkRateLimit(ctx.session.user.id);
      await checkAndIncrementAIUsage(ctx.session.user.id, ctx.db);

      // Runway ML Gen-3 Alpha API
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
            model: 'gen3a_turbo',
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
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Ошибка Runway API' });
      }

      const data = await res.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Не удалось разобрать ответ Runway API' }); });
      return { taskId: data.id, status: 'processing' };
    }),
});
