import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { env } from '@/lib/env';
import { auth } from '@/server/auth';
import { API_ENDPOINTS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const RequestSchema = z.object({
  type: z.enum(['title', 'description', 'tags', 'channel-name', 'script', 'video-ideas']),
  input: z.string().min(2).max(500),
  keywords: z.string().max(500).optional(),
});

/* ──────────────────────────────────────────────────────────────────────
 * System prompts for each tool type
 * ────────────────────────────────────────────────────────────────────── */

const SYSTEM_PROMPTS: Record<string, string> = {
  title: `You are a YouTube title expert. Generate exactly 10 clickable, SEO-optimized YouTube title variations for the given topic. Each title should be unique and use proven engagement patterns like numbers, power words, curiosity gaps, or how-to formats. Return ONLY a JSON object with a "titles" array of 10 strings. No explanation or extra text.`,

  description: `You are a YouTube SEO expert. Generate a fully optimized YouTube video description for the given title and keywords. Include:
1. An engaging opening hook (2-3 sentences)
2. A detailed description section (3-4 sentences)
3. A timestamps placeholder section (00:00 Intro, etc. — 5 placeholder timestamps)
4. A links section with placeholders
5. 5 relevant hashtags at the end
Return ONLY a JSON object with a "description" string containing the full formatted description. Use newlines for formatting.`,

  tags: `You are a YouTube SEO expert. Generate 25 highly relevant YouTube tags for the given topic. Include a mix of:
- Broad tags (high volume)
- Specific long-tail tags (low competition)
- Related topic tags
- Trending variation tags
Return ONLY a JSON object with a "tags" array of 25 strings. No explanation or extra text.`,

  'channel-name': `You are a YouTube branding expert. Generate exactly 20 creative, memorable, and brandable YouTube channel name ideas for the given niche and style preference. Each name should be:
- Short (1-3 words)
- Easy to spell and pronounce
- Unique and searchable
- Relevant to the niche
Mix different naming patterns: descriptive, abstract, personal-style, compound words, and playful variations.
Return ONLY a JSON object with a "names" array of 20 strings. No explanation or extra text.`,

  script: `You are a professional YouTube scriptwriter. Generate a complete, ready-to-read YouTube video script for the given topic, format, and duration. Structure the script with clear sections:

1. **HOOK** (first 5-10 seconds) — A bold opening that grabs attention
2. **INTRO** (15-30 seconds) — Introduce the topic and what the viewer will learn
3. **BODY** — The main content, broken into 3-5 clearly labeled sections with transitions
4. **CTA** (10-15 seconds) — Ask viewers to like, subscribe, and comment
5. **OUTRO** (10-15 seconds) — Recap key takeaways and tease the next video

Use conversational, spoken language (not formal writing). Include [B-ROLL] and [CUT TO] markers where visual changes should happen.
Return ONLY a JSON object with a "script" string containing the full formatted script. Use newlines for formatting.`,

  'video-ideas': `You are a YouTube content strategist. Generate video ideas for the given niche, categorized into 4 groups. Provide:
- "trending": 15 timely video ideas based on current trends and events in this niche
- "evergreen": 15 video ideas that will get views year-round regardless of timing
- "shorts": 10 quick video ideas perfect for YouTube Shorts (under 60 seconds)
- "series": 10 series concepts (multi-part video ideas that keep viewers coming back)

Each idea should be a complete, specific video title — not just a vague topic.
Return ONLY a JSON object with "trending" (array of 15 strings), "evergreen" (array of 15 strings), "shorts" (array of 10 strings), and "series" (array of 10 strings). No explanation or extra text.`,
};

/* ──────────────────────────────────────────────────────────────────────
 * POST /api/free-tools/generate
 * ────────────────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  /* --- Parse request body --- */
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request.', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { type, input, keywords } = parsed.data;

  /* --- Rate limiting --- */
  // Check if user is authenticated (unlimited for logged-in users)
  const session = await auth();
  const isAuthenticated = !!session?.user?.id;

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (!isAuthenticated) {
    // 3 generations per day for unauthenticated users
    const identifier = `free-tool:${ip}`;
    const { success, reset } = await rateLimit({
      identifier,
      limit: 3,
      window: 86400, // 24 hours
    });

    if (!success) {
      return NextResponse.json(
        {
          error: 'Daily limit reached (3 free generations per day). Sign up for unlimited access.',
          limitReached: true,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) },
        },
      );
    }
  } else {
    // Logged-in users: standard per-minute rate limit
    const { success, reset } = await rateLimit({
      identifier: `free-tool-auth:${session.user.id}`,
      limit: 30,
      window: 60,
    });
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } },
      );
    }
  }

  /* --- Check OpenAI key --- */
  if (!env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'AI generation is currently unavailable. Please try again later.' },
      { status: 503 },
    );
  }

  /* --- Build the user message --- */
  let userMessage: string;
  let maxTokens = 2000;
  switch (type) {
    case 'title':
      userMessage = `Generate 10 YouTube title variations for: "${input}"`;
      break;
    case 'description':
      userMessage = `Generate a YouTube description for the video titled: "${input}"${keywords ? `\nKeywords to include: ${keywords}` : ''}`;
      break;
    case 'tags':
      userMessage = `Generate 25 YouTube tags for: "${input}"`;
      break;
    case 'channel-name':
      userMessage = `Generate 20 YouTube channel name ideas for the niche: "${input}"\nStyle preference: ${keywords || 'professional'}`;
      break;
    case 'script': {
      const [scriptFormat, scriptDuration] = (keywords || 'tutorial,10min').split(',');
      userMessage = `Write a complete YouTube video script.\nTopic: "${input}"\nFormat: ${scriptFormat}\nTarget duration: ${scriptDuration}`;
      maxTokens = 4000;
      break;
    }
    case 'video-ideas':
      userMessage = `Generate 50 YouTube video ideas for the niche: "${input}"`;
      maxTokens = 4000;
      break;
  }

  /* --- Call OpenAI --- */
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(API_ENDPOINTS.OPENAI_CHAT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[type] },
          { role: 'user', content: userMessage },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[free-tools] OpenAI error ${response.status}:`, errorText);
      return NextResponse.json(
        { error: 'AI generation failed. Please try again.' },
        { status: 502 },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No content generated. Please try again.' },
        { status: 502 },
      );
    }

    const parsed_content = JSON.parse(content);

    return NextResponse.json({
      result: parsed_content,
      authenticated: isAuthenticated,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out. Please try again.' }, { status: 504 });
    }
    console.error('[free-tools] Generation error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
