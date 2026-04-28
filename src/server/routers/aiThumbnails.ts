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
import sharp from 'sharp';
import fsPromises from 'node:fs/promises';
import pathModule from 'node:path';

/* ────────────────────────────────────────────────────────
   Text overlay helper — renders text on image via Sharp
   ──────────────────────────────────────────────────────── */

async function overlayTextOnImage(imageUrl: string, text: string, format: '16:9' | '9:16'): Promise<Buffer> {
  // Download image
  const imgRes = await fetch(imageUrl);
  const imgBuf = Buffer.from(await imgRes.arrayBuffer());

  const meta = await sharp(imgBuf).metadata();
  const w = meta.width || (format === '16:9' ? 1792 : 1024);
  const h = meta.height || (format === '16:9' ? 1024 : 1792);

  // Calculate font size based on image dimensions and text length
  const maxFontSize = Math.round(w * 0.08);
  const minFontSize = Math.round(w * 0.04);
  const fontSize = Math.max(minFontSize, Math.min(maxFontSize, Math.round(w * 0.07 * (12 / Math.max(text.length, 1)))));

  // Escape XML entities
  const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // SVG with bold text, outline stroke, and drop shadow
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.7"/>
      </filter>
    </defs>
    <text
      x="50%" y="${Math.round(h * 0.82)}"
      text-anchor="middle"
      font-family="Arial Black, Impact, sans-serif"
      font-size="${fontSize}"
      font-weight="900"
      fill="#FFFFFF"
      stroke="#000000"
      stroke-width="${Math.round(fontSize * 0.08)}"
      paint-order="stroke"
      filter="url(#shadow)"
      letter-spacing="2"
    >${safeText}</text>
  </svg>`;

  return sharp(imgBuf)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

/* ────────────────────────────────────────────────────────
   Replicate API helpers (FLUX Schnell + face swap)
   ──────────────────────────────────────────────────────── */

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
}

async function replicateCreate(
  model: string,
  input: Record<string, unknown>,
  timeoutMs = 90_000,
): Promise<string> {
  const token = env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('REPLICATE_API_TOKEN not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Create prediction
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({ model, input }),
      signal: controller.signal,
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({})) as { detail?: string };
      throw new Error(err.detail ?? `Replicate API error ${createRes.status}`);
    }

    let prediction = (await createRes.json()) as ReplicatePrediction;

    // If "Prefer: wait" returned a completed prediction, use it
    if (prediction.status === 'succeeded' && prediction.output) {
      const out = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      if (out) return out;
    }

    // Otherwise poll
    const pollUrl = `https://api.replicate.com/v1/predictions/${prediction.id}`;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      if (!pollRes.ok) throw new Error('Replicate poll error');
      prediction = (await pollRes.json()) as ReplicatePrediction;

      if (prediction.status === 'succeeded' && prediction.output) {
        const out = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        if (out) return out;
      }
      if (prediction.status === 'failed' || prediction.status === 'canceled') {
        throw new Error(prediction.error ?? 'Replicate prediction failed');
      }
    }
    throw new Error('Replicate prediction timed out');
  } finally {
    clearTimeout(timer);
  }
}

/** Generate image via Replicate FLUX Schnell */
async function replicateFluxSchnell(
  prompt: string,
  width: number,
  height: number,
): Promise<string> {
  return replicateCreate(
    'black-forest-labs/flux-schnell',
    {
      prompt: prompt.slice(0, 4000),
      width,
      height,
      num_outputs: 1,
      go_fast: true,
    },
    90_000,
  );
}

/** Face swap via Replicate */
async function replicateFaceSwap(
  targetImage: string,
  sourceImage: string,
): Promise<string> {
  return replicateCreate(
    'lucataco/facefusion',
    {
      target_path: targetImage,
      source_path: sourceImage,
      face_enhancer_model: 'gfpgan_1.4',
    },
    120_000,
  );
}

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

      // Warn when usage hits 80% of plan limit
      const newUsage = user.aiUsage + 1;
      const threshold = Math.floor(planLimits.aiGenerations * 0.8);
      if (newUsage === threshold) {
        await tx.notification.create({
          data: {
            userId,
            type: 'warning',
            title: 'AI limit approaching',
            message: `You have used ${newUsage} of ${planLimits.aiGenerations} AI generations this month`,
          },
        }).catch(() => {});
      }
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
        photoUrl: z.string().optional(),
        youtubeUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // DALL-E 3 is primary — best text rendering + prompt adherence for YouTube thumbnails
      const useDallE = !!env.OPENAI_API_KEY;
      const useReplicate = !useDallE && !!env.REPLICATE_API_TOKEN;
      const useFal = !useDallE && !useReplicate && !!env.FAL_KEY;

      if (!useDallE && !useReplicate && !useFal) {
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

      // Check count limit per plan
      // Unlocked for testing — all users can generate 1-3
      const actualCount = Math.min(input.count, 3);

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
          ' The thumbnail must prominently feature the person from the reference photo.';
      }

      // Generate images
      const results: Array<{ url: string; id: string; revisedPrompt?: string }> = [];
      let failedCount = 0;

      // Extract text overlay from prompt (text in «», "", ** **, or after "текст:", "text:")
      const textOverlayMatches = input.prompt.match(/[«""]([^»""]+)[»""]|\*\*([^*]+)\*\*|(?:текст|text)[:\s]+['"]?([^'".,!]+)['"]?/gi);
      let overlayText = '';
      if (textOverlayMatches) {
        // Get the text content from the first match
        const raw = textOverlayMatches[0];
        overlayText = raw.replace(/[«»""**]/g, '').replace(/^(?:текст|text)[:\s]+['"]?/i, '').replace(/['"]?$/, '').trim();
      }

      // Remove text instructions from prompt for image gen (DALL-E can't render text well)
      let cleanPrompt = input.prompt;
      if (overlayText) {
        cleanPrompt = cleanPrompt
          .replace(/[«""][^»""]+[»""]|\*\*[^*]+\*\*/g, '')
          .replace(/(?:текст|text)[:\s]+['"]?[^'".,!]+['"]?/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
      }

      // TEMPORARY: Nano Banana free-tier quota hits before DALL-E fallback can
      // engage; the if/else-if chain below has no try/catch fallback when one
      // provider fails. Re-enable by removing the " && false" once the chain
      // is refactored to retry the next provider on failure.
      const useNanoBanana = !!env.GOOGLE_AI_API_KEY && false;

      if (useNanoBanana) {
        // ── Nano Banana 2 (Gemini Image Generation) ──
        const formatInstruction = input.format === '9:16'
          ? 'Generate in VERTICAL 9:16 portrait format (1080x1920 pixels). The image MUST be taller than wide.'
          : 'Generate in HORIZONTAL 16:9 landscape format (1920x1080 pixels). The image MUST be wider than tall.';

        const nanoBananaPrompt =
          `Generate a professional YouTube thumbnail image.

USER REQUEST: ${input.prompt}

STYLE: ${styleDesc || 'Professional, cinematic'}

RULES:
1. ${formatInstruction}
2. If the user's text contains words in quotes, bold (**text**), or explicitly asks for text on the image — render that EXACT text as large, bold, stylish 3D typography with shadows, glow, and perspective effects. The text is part of the image, NOT an overlay.
3. DO NOT translate any text from the prompt. If text is in Russian — write it in Russian. If in English — in English. Render EXACTLY as written.
4. Follow the EXACT art style requested. 2D/cartoon → 2D style. Realistic → photorealistic. Anime → anime style.
5. Vibrant saturated colors, strong contrast, cinematic lighting, clear focal point.
6. Ultra high quality, eye-catching, click-worthy YouTube thumbnail.`;

        for (let i = 0; i < actualCount; i++) {
          try {
            // Build multimodal parts: text prompt + optional photo reference
            const contentParts: any[] = [{ text: nanoBananaPrompt }];

            // If user uploaded a photo for face/style reference — include it
            if (input.photoUrl) {
              try {
                console.log('[aiThumbnails] Fetching user photo for Gemini multimodal input...');
                const photoRes = await fetch(input.photoUrl);
                if (photoRes.ok) {
                  const photoBuf = Buffer.from(await photoRes.arrayBuffer());
                  const photoMime = photoRes.headers.get('content-type') || 'image/jpeg';
                  contentParts.unshift({
                    inlineData: {
                      mimeType: photoMime,
                      data: photoBuf.toString('base64'),
                    },
                  });
                  contentParts.push({
                    text: 'Use the face and style from the uploaded photo above. The generated person should have THIS EXACT face. If the photo is in 2D/cartoon style, generate the thumbnail in the SAME 2D/cartoon style.',
                  });
                }
              } catch (photoErr) {
                console.error('[aiThumbnails] Failed to fetch user photo:', photoErr);
              }
            }

            console.log('[aiThumbnails] Generating with Nano Banana 2, format:', input.format, 'hasPhoto:', !!input.photoUrl);
            const nbRes = await fetchWithTimeout(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${env.GOOGLE_AI_API_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: contentParts }],
                  generationConfig: {
                    responseModalities: ['TEXT', 'IMAGE'],
                  },
                }),
              },
              120000,
            );

            if (!nbRes.ok) {
              const errText = await nbRes.text().catch(() => 'unknown');
              console.error('[aiThumbnails] Nano Banana error:', nbRes.status, errText);
              failedCount++;
              continue;
            }

            const nbJson = await nbRes.json() as any;
            const parts = nbJson?.candidates?.[0]?.content?.parts || [];
            const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

            if (!imagePart?.inlineData?.data) {
              console.error('[aiThumbnails] Nano Banana returned no image, parts:', parts.map((p: any) => Object.keys(p)));
              failedCount++;
              continue;
            }

            // Save image to file and serve via API route
            const thumbsDir = pathModule.join(process.cwd(), '.gen-thumbs');
            await fsPromises.mkdir(thumbsDir, { recursive: true });
            const fileName = `nb_${Date.now()}_${i}.png`;
            await fsPromises.writeFile(
              pathModule.join(thumbsDir, fileName),
              Buffer.from(imagePart.inlineData.data, 'base64'),
            );
            const imageUrl = `/api/gen-thumbs?id=${fileName}`;
            console.log('[aiThumbnails] Nano Banana generated successfully');

            const gen = await ctx.db.thumbnailGeneration.create({
              data: {
                userId,
                prompt: input.prompt,
                style: input.style,
                format: input.format,
                imageUrl,
                photoUrl: input.photoUrl ?? null,
              },
              select: { id: true, imageUrl: true },
            });

            // Face/style is already handled by Gemini multimodal input — no separate face swap needed

            results.push({ url: gen.imageUrl, id: gen.id });
          } catch (err) {
            console.error('[aiThumbnails] Nano Banana exception:', err);
            failedCount++;
          }
        }
      } else if (useReplicate) {
        // ── Replicate FLUX Schnell ──
        const repSize = input.format === '9:16'
          ? { w: 768, h: 1344 }
          : { w: 1344, h: 768 };

        const fluxPrompt =
          `${input.prompt}.${contextParts} Professional YouTube thumbnail photo.

Ultra photorealistic, shot on Canon EOS R5 with 85mm f/1.4 lens.
Dramatic cinematic side lighting, strong contrast, deep shadows.
Extremely vibrant saturated colors, color graded like a Hollywood movie.
Single clear focal point with shallow depth of field and creamy bokeh background.
Person showing intense emotional expression, looking directly at camera.
Composition leaves empty space on the right side for text overlay.
DO NOT include any text, letters, words, or watermarks in the image.
${styleDesc}
8K, hyper-detailed, professional quality.`.slice(0, 4000);

        for (let i = 0; i < actualCount; i++) {
          try {
            let imageUrl = await replicateFluxSchnell(fluxPrompt, repSize.w, repSize.h);

            // Face swap if photo provided
            if (input.photoUrl && imageUrl) {
              try {
                console.log('[aiThumbnails] Attempting face swap with photo:', input.photoUrl.slice(0, 80));
                imageUrl = await replicateFaceSwap(imageUrl, input.photoUrl);
                console.log('[aiThumbnails] Face swap succeeded');
              } catch (faceErr) {
                console.error('[aiThumbnails] Face swap FAILED:', faceErr);
                // Face swap failed, use original image
              }
            }

            if (!imageUrl) { failedCount++; continue; }

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
          } catch (err) {
            console.error('[aiThumbnails] Replicate generation error:', err instanceof Error ? err.message : err);
            failedCount++;
            continue;
          }
        }
      } else if (useFal) {
        // ── Flux via fal.ai ──
        fal.config({ credentials: env.FAL_KEY });

        const falSize = input.format === '9:16'
          ? { width: 768, height: 1344 }
          : { width: 1344, height: 768 };

        const fluxPrompt =
          `${input.prompt}.${contextParts} Professional YouTube thumbnail photo.

Ultra photorealistic, shot on Canon EOS R5 with 85mm f/1.4 lens.
Dramatic cinematic side lighting, strong contrast, deep shadows.
Extremely vibrant saturated colors, color graded like a Hollywood movie.
Single clear focal point with shallow depth of field and creamy bokeh background.
Person showing intense emotional expression, looking directly at camera.
Composition leaves empty space on the right side for text overlay.
DO NOT include any text, letters, words, or watermarks in the image.
${styleDesc}
8K, hyper-detailed, professional quality.`.slice(0, 4000);

        for (let i = 0; i < actualCount; i++) {
          try {
            // Try Ideogram first (better text + prompt adherence)
            let falResult: any;
            try {
              falResult = await fal.subscribe('fal-ai/ideogram/v3', {
                input: {
                  prompt: fluxPrompt,
                  aspect_ratio: input.format === '9:16' ? '9:16' : '16:9',
                  style: 'realistic' as any,
                  ...(input.photoUrl ? { image_url: input.photoUrl, strength: 0.6 } : {}),
                } as any,
                timeout: 120_000,
              });
            } catch (ideogramErr) {
              console.error('[aiThumbnails] Ideogram failed, falling back to FLUX:', ideogramErr);
              // Fallback to FLUX Pro
              falResult = await fal.subscribe('fal-ai/flux-pro/v1.1', {
                input: {
                  prompt: fluxPrompt,
                  image_size: falSize,
                  num_images: 1,
                  safety_tolerance: '5',
                  ...(input.photoUrl ? { image_url: input.photoUrl, strength: 0.65 } : {}),
                } as any,
                timeout: 90_000,
              });
            }

            const imageUrl = falResult?.data?.images?.[0]?.url || falResult?.images?.[0]?.url;
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
          } catch (err) {
            console.error('[aiThumbnails] fal.ai generation error:', err instanceof Error ? err.message : err);
            failedCount++;
            continue;
          }
        }
      } else {
        // ── Fallback: DALL-E 3 ──
        const size = input.format === '16:9' ? '1792x1024' : '1024x1792';

        const fullPrompt =
          `${input.prompt}.${contextParts} Professional YouTube video thumbnail photo.

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
          } catch (err) {
            console.error('[aiThumbnails] DALL-E request error:', err instanceof Error ? err.message : err);
            failedCount++;
            continue;
          }

          if (!res.ok) {
            const errBody = await res.text().catch(() => '');
            console.error('[aiThumbnails] DALL-E API error:', res.status, errBody.slice(0, 200));
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

      // Create notification for completed generation
      await ctx.db.notification.create({
        data: {
          userId,
          type: 'success',
          title: 'Thumbnail ready',
          message: `Generated ${results.length} thumbnail${results.length > 1 ? 's' : ''} for "${input.prompt.slice(0, 60)}"`,
        },
      }).catch(() => {}); // non-critical

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
        locale: z.enum(['en', 'ru', 'kk', 'es']).optional(),
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
      const locale = input.locale ?? 'en';
      const langInstruction = locale === 'ru'
        ? 'Respond in Russian (русский язык). '
        : locale === 'kk'
        ? 'Respond in Kazakh (қазақ тілі). '
        : locale === 'es'
        ? 'Respond in Spanish (español). '
        : '';
      const systemPrompt =
        'You are an expert YouTube thumbnail designer who understands what makes thumbnails get millions of clicks. ' +
        `You generate creative, specific visual descriptions for YouTube thumbnail images. ${langInstruction}Respond with a JSON object.`;
      const userPrompt =
        `Generate 5 creative YouTube THUMBNAIL (preview image/обложка) ideas for: "${topicText}".${context ? ` Video context: ${context}` : ''}\n\n` +
        'Each idea must be a ready-to-use prompt for an AI image generator to create a YouTube thumbnail. ' +
        'Describe: person/character (expression, pose, clothing), background (colors, setting), text overlay (exact words to show on thumbnail), composition. ' +
        'Every idea MUST include bold text overlay suggestion for the thumbnail. ' +
        'Focus on what the THUMBNAIL IMAGE looks like — high contrast, vibrant, clickable. NOT video content. ' +
        `${langInstruction}` +
        'Return ONLY a JSON object: { "ideas": ["idea 1", "idea 2", ...] }';

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
      const useReplicate = !!env.REPLICATE_API_TOKEN;
      const useFal = !useReplicate && !!env.FAL_KEY;

      if (!useReplicate && !useFal && !env.OPENAI_API_KEY) {
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

      if (useReplicate) {
        // ── Replicate FLUX Schnell ──
        try {
          imageUrl = await replicateFluxSchnell(editPrompt.slice(0, 4000), 1344, 768);
        } catch {
          await decrementAIUsage(userId, ctx.db);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'AI service error during image generation.',
          });
        }
      } else if (useFal) {
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
