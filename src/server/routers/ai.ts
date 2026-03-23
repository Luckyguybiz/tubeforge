import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { API_ENDPOINTS, RATE_LIMIT_ERROR, getPlanLimits } from '@/lib/constants';
import { env } from '@/lib/env';
import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { fal } from '@fal-ai/client';

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
      const useFal = !!env.FAL_KEY;

      await checkRateLimit(ctx.session.user.id, 'ai-thumbnail', 10);
      await checkAndIncrementAIUsage(ctx.session.user.id, ctx.db);

      // YouTube-optimized style modifiers
      const styleModifiers: Record<string, string> = {
        realistic: 'photorealistic, cinematic lighting, high detail, professional photography',
        anime: 'anime art style, vibrant colors, manga-inspired, clean lines',
        cinematic: 'cinematic movie poster style, dramatic lighting, film grain, epic composition',
        minimalist: 'minimalist design, clean composition, bold typography space, simple shapes',
        '3d': '3D rendered, Pixar-style, volumetric lighting, smooth surfaces',
        popart: 'pop art style, bold colors, halftone dots, comic book aesthetic',
      };

      if (useFal) {
        // ── Flux via fal.ai ──
        fal.config({ credentials: env.FAL_KEY });

        const fluxPrompt = `Professional YouTube thumbnail photo. ${input.prompt}.

Ultra photorealistic, shot on Canon EOS R5 with 85mm f/1.4 lens.
Dramatic cinematic side lighting, strong contrast, deep shadows.
Extremely vibrant saturated colors, color graded like a Hollywood movie.
Single clear focal point with shallow depth of field and creamy bokeh background.
Person showing intense emotional expression, looking directly at camera.
Composition leaves empty space on the right side for text overlay.
DO NOT include any text, letters, words, or watermarks in the image.
${styleModifiers[input.style] || 'photorealistic'}
Professional YouTube thumbnail that would get millions of clicks.
8K, hyper-detailed, magazine quality.`.slice(0, 4000);

        try {
          const falResult = await fal.subscribe('fal-ai/flux-pro/v1.1', {
            input: {
              prompt: fluxPrompt,
              image_size: { width: 1344, height: 768 },
              num_images: 1,
              safety_tolerance: '5',
            },
          }) as { data: { images: Array<{ url: string }> } };

          const imageUrl = falResult.data?.images?.[0]?.url;
          if (!imageUrl) {
            await decrementAIUsage(ctx.session.user.id, ctx.db);
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No image generated by Flux' });
          }

          return { images: [{ url: imageUrl }] };
        } catch (e) {
          if (e instanceof TRPCError) throw e;
          await decrementAIUsage(ctx.session.user.id, ctx.db);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Flux image generation failed' });
        }
      } else {
        // ── Fallback: DALL-E 3 ──
        const thumbnailPrompt = `Create a YouTube video thumbnail image. ${input.prompt}. Style: ${styleModifiers[input.style] || 'photorealistic'}. Requirements: Bold, eye-catching composition optimized for small display sizes. High contrast, vibrant colors, clear focal point. Leave space for overlay text (do not add any text or letters to the image). Professional YouTube thumbnail quality, 16:9 aspect ratio composition. The image should make viewers want to click.`;

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
              prompt: thumbnailPrompt.slice(0, 4000),
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
      }
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

      // Step 2: Generate image based on description + user prompt
      const styleMap: Record<string, string> = {
        realistic: 'photorealistic, professional photography',
        anime: 'anime/manga art style, vibrant Japanese animation',
        cinematic: 'cinematic movie poster style, dramatic lighting',
        minimalist: 'clean minimalist design, simple and modern',
        '3d': '3D rendered, CGI quality',
        popart: 'pop art style, bold colors and high contrast',
      };
      const fullPrompt = `Create a YouTube thumbnail with this EXACT layout: ${description}. Style: ${styleMap[input.style] ?? input.style}. Requirements: follow the described spatial positioning precisely, 16:9 aspect ratio, professional quality, eye-catching. Ultra photorealistic, 8K, hyper-detailed. Do NOT add text/watermarks unless specified in the layout.`;

      const useFal = !!env.FAL_KEY;

      if (useFal) {
        // ── Flux via fal.ai ──
        fal.config({ credentials: env.FAL_KEY });
        try {
          const falResult = await fal.subscribe('fal-ai/flux-pro/v1.1', {
            input: {
              prompt: fullPrompt.slice(0, 4000),
              image_size: { width: 1344, height: 768 },
              num_images: 1,
              safety_tolerance: '5',
            },
          }) as { data: { images: Array<{ url: string }> } };

          const imageUrl = falResult.data?.images?.[0]?.url;
          if (!imageUrl) {
            await decrementAIUsage(ctx.session.user.id, ctx.db);
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No image generated by Flux' });
          }

          return { description, images: [{ url: imageUrl }] };
        } catch (e) {
          if (e instanceof TRPCError) throw e;
          await decrementAIUsage(ctx.session.user.id, ctx.db);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Flux image generation failed' });
        }
      } else {
        // ── Fallback: DALL-E 3 ──
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
      }
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
        professional: 'professional, business-like',
        casual: 'casual, friendly',
        fun: 'fun, energetic, humorous',
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
                content: `You are a YouTube video scriptwriter. Create scripts in English. Respond ONLY in JSON format.`,
              },
              {
                role: 'user',
                content: `Create a YouTube video script on the topic: "${input.topic}".

Tone: ${toneMap[input.tone] ?? 'professional'}.
Total duration: ~${cfg.totalSec} seconds.
Number of scenes: ${cfg.scenes}.

Return JSON:
{
  "scenes": [
    { "text": "Text/description for the scene (prompt for video generation)", "duration": <number of seconds> }
  ]
}

Each scene must contain:
- text: description of the visual scene for AI video generation (what to show, what atmosphere)
- duration: duration in seconds (sum should be ~${cfg.totalSec})

Make the scenes visually diverse and engaging.`,
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

      const sceneSummary = input.scenes.map((s, i) => `Scene ${i + 1} (${s.duration}s): ${s.text}`).join('\n');

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
                content: 'You generate subtitles for videos in SRT format. Respond ONLY in JSON.',
              },
              {
                role: 'user',
                content: `Create subtitles for a video based on scene descriptions:

${sceneSummary}

Return JSON:
{
  "srt": "full SRT file text with timecodes",
  "captions": [
    { "index": 1, "start": "00:00:00,000", "end": "00:00:03,000", "text": "Subtitle text" }
  ]
}

Break the text into short subtitles (max 2 lines, ~10 words). Timecodes must precisely cover the duration of each scene.`,
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
     Z5: AI Image Generator — general-purpose image gen (Flux / DALL-E 3)
     ═══════════════════════════════════════════════════════════════ */
  generateImage: protectedProcedure
    .input(z.object({
      prompt: z.string().min(1).max(1000),
      style: z.enum(['realistic', 'anime', '3d', 'watercolor', 'oil', 'pixel', 'minimalist', 'cinematic']).default('realistic'),
      size: z.enum(['1024x1024', '1792x1024', '1024x1792']).default('1024x1024'),
    }))
    .mutation(async ({ ctx, input }) => {
      const useFal = !!env.FAL_KEY;

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

      if (useFal) {
        // ── Flux via fal.ai ──
        fal.config({ credentials: env.FAL_KEY });

        // Map DALL-E size strings to Flux dimensions
        const sizeMap: Record<string, { width: number; height: number }> = {
          '1024x1024': { width: 1024, height: 1024 },
          '1792x1024': { width: 1344, height: 768 },
          '1024x1792': { width: 768, height: 1344 },
        };
        const falSize = sizeMap[input.size] ?? { width: 1024, height: 1024 };

        const fluxPrompt = `${input.prompt}. Style: ${styleMap[input.style] ?? input.style}. Ultra high quality, 8K, hyper-detailed.`.slice(0, 4000);

        try {
          const falResult = await fal.subscribe('fal-ai/flux-pro/v1.1', {
            input: {
              prompt: fluxPrompt,
              image_size: falSize,
              num_images: 1,
              safety_tolerance: '5',
            },
          }) as { data: { images: Array<{ url: string }> } };

          const imageUrl = falResult.data?.images?.[0]?.url;
          if (!imageUrl) {
            await decrementAIUsage(ctx.session.user.id, ctx.db);
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No image generated by Flux' });
          }

          return { url: imageUrl, revisedPrompt: '' };
        } catch (e) {
          if (e instanceof TRPCError) throw e;
          await decrementAIUsage(ctx.session.user.id, ctx.db);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Flux image generation failed' });
        }
      } else {
        // ── Fallback: DALL-E 3 ──
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
      }
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

  /* ═══════════════════════════════════════════════════════════════
     Z6: ElevenLabs Text-to-Speech
     ═══════════════════════════════════════════════════════════════ */
  generateTTS: protectedProcedure
    .input(z.object({
      text: z.string().min(1).max(5000),
      voiceId: z.string().default('21m00Tcm4TlvDq8ikWAM'), // Rachel
      speed: z.number().min(0.5).max(2).default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'ElevenLabs API key not configured' });
      }

      await checkRateLimit(ctx.session.user.id, 'ai-tts', 10);
      await checkAndIncrementAIUsage(ctx.session.user.id, ctx.db);

      let res: Response;
      try {
        res = await fetchWithTimeout(
          `https://api.elevenlabs.io/v1/text-to-speech/${input.voiceId}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': apiKey,
              'Content-Type': 'application/json',
              Accept: 'audio/mpeg',
            },
            body: JSON.stringify({
              text: input.text,
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                speed: input.speed,
              },
            }),
          },
          60000,
        );
      } catch (e) {
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'ElevenLabs service error' });
      }

      if (!res.ok) {
        await decrementAIUsage(ctx.session.user.id, ctx.db);
        const err = await res.json().catch(() => ({}));
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: (err as { detail?: { message?: string } }).detail?.message ?? 'TTS generation failed',
        });
      }

      const audioBuffer = Buffer.from(await res.arrayBuffer());
      return { audioBase64: audioBuffer.toString('base64'), format: 'mp3' as const };
    }),

  /* ═══════════════════════════════════════════════════════════════
     Phase 4: AI Text Suggestions for Thumbnails
     ═══════════════════════════════════════════════════════════════ */
  suggestThumbnailText: protectedProcedure
    .input(z.object({ context: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!env.OPENAI_API_KEY) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'OpenAI API key not configured.' });
      }

      await checkRateLimit(ctx.session.user.id, 'ai-text-suggest', 20);
      await checkAndIncrementAIUsage(ctx.session.user.id, ctx.db);

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
            messages: [{
              role: 'user',
              content: `Generate 5 catchy, clickable YouTube thumbnail text options. ${input.context ? `Context: ${input.context}` : 'Make them viral and attention-grabbing.'}
Return JSON: { "suggestions": ["TEXT 1", "TEXT 2", "TEXT 3", "TEXT 4", "TEXT 5"] }
Rules: ALL CAPS, max 4 words each, emotionally charged, curiosity-inducing.`,
            }],
            response_format: { type: 'json_object' },
            max_tokens: 200,
          }),
        });
      } catch {
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
      const text = (data as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ?? '{"suggestions":[]}';

      try {
        const parsed = JSON.parse(text) as { suggestions?: string[] };
        return { suggestions: parsed.suggestions ?? [] };
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]) as { suggestions?: string[] };
            return { suggestions: parsed.suggestions ?? [] };
          } catch {
            // fall through
          }
        }
        return { suggestions: [] };
      }
    }),
});
