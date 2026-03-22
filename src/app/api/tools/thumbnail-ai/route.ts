import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';
import { env } from '@/lib/env';
import { API_ENDPOINTS } from '@/lib/constants';

/* ── Helpers ──────────────────────────────────────────────── */

async function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = 60000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/* ── YouTube thumbnail extraction ─────────────────────────── */

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/* ── GPT-4o Vision call ───────────────────────────────────── */

async function visionDescribe(imageUrl: string, systemPrompt: string): Promise<string> {
  const res = await fetchWithTimeout(API_ENDPOINTS.OPENAI_CHAT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? 'Vision API error');
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function visionDescribeBase64(base64: string, systemPrompt: string, userText?: string): Promise<string> {
  const content: Array<Record<string, unknown>> = [
    { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'high' } },
  ];
  if (userText) {
    content.push({ type: 'text', text: userText });
  }

  const res = await fetchWithTimeout(API_ENDPOINTS.OPENAI_CHAT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? 'Vision API error');
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/* ── DALL-E 3 generation ──────────────────────────────────── */

async function generateDalle(prompt: string): Promise<string> {
  const res = await fetchWithTimeout(API_ENDPOINTS.OPENAI_IMAGES, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      quality: 'hd',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? 'DALL-E API error');
  }
  const data = await res.json();
  return data.data?.[0]?.url ?? '';
}

/* ── Schemas ──────────────────────────────────────────────── */

const recreateSchema = z.object({
  action: z.literal('recreate'),
  url: z.string().min(1).max(500),
  style: z.enum(['cinematic', 'cartoon', 'minimal', 'bold', 'gaming', 'vlog']).default('cinematic'),
});

const editSchema = z.object({
  action: z.literal('edit'),
  imageBase64: z.string().min(1),
  instruction: z.string().min(1).max(500),
});

const analyzeSchema = z.object({
  action: z.literal('analyze'),
  imageBase64: z.string().min(1),
});

const requestSchema = z.discriminatedUnion('action', [recreateSchema, editSchema, analyzeSchema]);

/* ── Style map ────────────────────────────────────────────── */

const STYLE_PROMPTS: Record<string, string> = {
  cinematic: 'cinematic movie poster style, dramatic lighting, epic composition',
  cartoon: 'cartoon illustration, vibrant colors, fun animated style',
  minimal: 'clean minimalist design, simple shapes, modern typography',
  bold: 'bold typography, high contrast, eye-catching design with big text',
  gaming: 'gaming aesthetic, neon colors, dynamic energy, futuristic',
  vlog: 'lifestyle vlog, bright warm colors, friendly and approachable feel',
};

/* ── POST handler ─────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  // Auth
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError('Unauthorized', 401);
  }

  // Rate limit
  const { success } = await rateLimit({ identifier: `thumbnail-ai:${session.user.id}`, limit: 15, window: 60 });
  if (!success) {
    return jsonError('Too many requests. Please try again in a minute.', 429);
  }

  // Check API key
  if (!env.OPENAI_API_KEY) {
    return jsonError('AI service not configured', 503);
  }

  // Parse body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return jsonError('Invalid request body');
  }

  const parsed = requestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const input = parsed.data;

  try {
    /* ── Recreate ──────────────────────────────────────── */
    if (input.action === 'recreate') {
      const videoId = extractVideoId(input.url);
      if (!videoId) {
        return jsonError('Invalid YouTube URL. Please provide a valid YouTube video link.');
      }

      const originalUrl = getThumbnailUrl(videoId);

      // Step 1: Describe the thumbnail with GPT-4o Vision
      const description = await visionDescribe(
        originalUrl,
        'You are a YouTube thumbnail analysis expert. Describe this YouTube thumbnail in precise visual detail: subjects, poses, expressions, text, colors, background, composition, and mood. Be concise but thorough. Do not add opinions.',
      );

      // Step 2: Recreate with DALL-E 3
      const stylePrompt = STYLE_PROMPTS[input.style] ?? STYLE_PROMPTS.cinematic;
      const dallePrompt = `YouTube thumbnail (1280x720), ${stylePrompt}. Recreate this concept: ${description}. High quality, detailed, eye-catching.`;
      const resultUrl = await generateDalle(dallePrompt);

      return NextResponse.json({ originalUrl, resultUrl });
    }

    /* ── Edit ──────────────────────────────────────────── */
    if (input.action === 'edit') {
      // Step 1: Describe image + understand edit instruction
      const dallePrompt = await visionDescribeBase64(
        input.imageBase64,
        'You are a professional image editor AI. Based on the image and the user\'s edit instruction, create a detailed DALL-E prompt that describes the final desired image after the edit is applied. Output ONLY the prompt, no explanation. Make it specific and visual. Always include "YouTube thumbnail, 1280x720" in the prompt.',
        `Edit instruction: ${input.instruction}`,
      );

      // Step 2: Generate edited version with DALL-E 3
      const resultUrl = await generateDalle(dallePrompt);

      return NextResponse.json({ resultUrl });
    }

    /* ── Analyze ───────────────────────────────────────── */
    if (input.action === 'analyze') {
      const analysisRaw = await visionDescribeBase64(
        input.imageBase64,
        `You are a YouTube thumbnail CTR expert with years of experience analyzing clickthrough rates.
Analyze this thumbnail and return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "overall": <number 1-10>,
  "color": <number 1-10>,
  "text": <number 1-10>,
  "emotion": <number 1-10>,
  "composition": <number 1-10>,
  "suggestions": ["<string>", "<string>", ...]
}

Scoring criteria:
- overall: Overall CTR potential considering all factors
- color: Color contrast, vibrancy, and visual pop
- text: Text readability, size, and positioning (0 if no text)
- emotion: Emotional impact, facial expressions, dramatic elements
- composition: Layout, rule of thirds, visual hierarchy, focal point
- suggestions: 3-5 specific, actionable improvement tips

Be honest and critical. Most thumbnails score 4-7.`,
      );

      // Parse JSON from GPT response
      let analysis: { overall: number; color: number; text: number; emotion: number; composition: number; suggestions: string[] };
      try {
        // Strip potential markdown code block wrapping
        const cleaned = analysisRaw.replace(/```json\s*\n?/g, '').replace(/```\s*$/g, '').trim();
        analysis = JSON.parse(cleaned);
      } catch {
        return jsonError('Failed to parse AI analysis. Please try again.');
      }

      // Validate ranges
      const clamp = (n: unknown) => Math.max(1, Math.min(10, typeof n === 'number' ? Math.round(n) : 5));
      analysis.overall = clamp(analysis.overall);
      analysis.color = clamp(analysis.color);
      analysis.text = clamp(analysis.text);
      analysis.emotion = clamp(analysis.emotion);
      analysis.composition = clamp(analysis.composition);
      if (!Array.isArray(analysis.suggestions)) analysis.suggestions = [];

      return NextResponse.json({ analysis });
    }
  } catch (e: unknown) {
    console.error('[thumbnail-ai]', e);
    return jsonError(e instanceof Error ? e.message : 'AI service error', 500);
  }

  return jsonError('Unknown action');
}
