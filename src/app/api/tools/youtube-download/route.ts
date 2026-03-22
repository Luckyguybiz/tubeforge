import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Extract a YouTube video ID from various URL formats.
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

interface OEmbedResponse {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
}

/* ══════════════════════════════════════════════════════════════════════
 * GET /api/tools/youtube-download?url=<youtube_url>
 *
 * Returns video metadata fetched via YouTube's free oEmbed endpoint.
 * ══════════════════════════════════════════════════════════════════════ */

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success: rlOk, reset } = await rateLimit({
    identifier: `yt-analyze-info:${session.user.id}`,
    limit: 10,
    window: 60,
  });
  if (!rlOk) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } },
    );
  }

  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing "url" query parameter' },
      { status: 400 },
    );
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: 'Invalid YouTube URL. Please provide a valid youtube.com or youtu.be link.' },
      { status: 400 },
    );
  }

  try {
    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;

    const oembedRes = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'TubeForge/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (!oembedRes.ok) {
      if (oembedRes.status === 401 || oembedRes.status === 403) {
        return NextResponse.json(
          { error: 'This video is private or restricted.' },
          { status: 403 },
        );
      }
      return NextResponse.json(
        { error: 'Video not found. Please check the URL and try again.' },
        { status: 404 },
      );
    }

    const data = (await oembedRes.json()) as OEmbedResponse;

    return NextResponse.json({
      videoId,
      title: data.title,
      channel: data.author_name,
      channelUrl: data.author_url,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      thumbnailHq: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      thumbnailMq: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      watchUrl: canonicalUrl,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'Request timed out. YouTube may be slow — please try again.'
        : 'Failed to fetch video information. Please try again later.';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/* ══════════════════════════════════════════════════════════════════════
 * POST /api/tools/youtube-download
 *
 * Video Analyzer — returns SEO scores, engagement metrics, and
 * optimization suggestions for a YouTube video.
 *
 * Body: { videoId: string }
 * ══════════════════════════════════════════════════════════════════════ */

const analyzeSchema = z.object({
  videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/, 'Invalid videoId'),
});

/** Compute a simple score (0-100) based on heuristics */
function computeScores(title: string, channel: string) {
  // Title length score: ideal 40-70 chars
  const titleLen = title.length;
  let titleScore = 50;
  if (titleLen >= 40 && titleLen <= 70) titleScore = 90;
  else if (titleLen >= 30 && titleLen <= 80) titleScore = 75;
  else if (titleLen >= 20 && titleLen <= 100) titleScore = 60;
  else if (titleLen < 10) titleScore = 20;

  // Keyword density — presence of power words
  const powerWords = ['how', 'why', 'best', 'top', 'ultimate', 'guide', 'tutorial', 'review', 'tips', 'secrets', 'free', 'new', 'easy'];
  const titleLower = title.toLowerCase();
  const powerWordCount = powerWords.filter((w) => titleLower.includes(w)).length;
  const keywordScore = Math.min(95, 40 + powerWordCount * 15);

  // Engagement prediction — presence of emotional hooks
  const emotionalWords = ['amazing', 'shocking', 'unbelievable', 'must', 'watch', 'never', 'first', 'last', 'only', '!', '?'];
  const emotionalCount = emotionalWords.filter((w) => titleLower.includes(w)).length;
  const engagementScore = Math.min(95, 35 + emotionalCount * 12 + (title.includes('?') ? 10 : 0) + (title.includes('!') ? 5 : 0));

  // Overall SEO score
  const seoScore = Math.round((titleScore * 0.4 + keywordScore * 0.35 + engagementScore * 0.25));

  // channel is used indirectly — included in the return for API consumers
  void channel;

  return {
    overall: seoScore,
    titleOptimization: titleScore,
    keywordUsage: keywordScore,
    engagementPotential: engagementScore,
    titleLength: titleLen,
    suggestions: generateSuggestions(title, titleLen, powerWordCount, emotionalCount),
  };
}

function generateSuggestions(title: string, titleLen: number, powerWordCount: number, emotionalCount: number): string[] {
  const suggestions: string[] = [];

  if (titleLen < 30) suggestions.push('Title is too short. Aim for 40-70 characters for better CTR.');
  if (titleLen > 80) suggestions.push('Title is too long. Keep it under 70 characters so it doesn\'t get truncated.');
  if (powerWordCount === 0) suggestions.push('Add power words (e.g., "Ultimate", "Best", "Guide") to improve discoverability.');
  if (emotionalCount === 0) suggestions.push('Consider adding emotional hooks or questions to boost engagement.');
  if (!title.includes('|') && !title.includes('-') && !title.includes(':')) {
    suggestions.push('Use separators (|, -, :) to structure your title for better readability.');
  }
  if (title === title.toUpperCase() && title.length > 5) {
    suggestions.push('Avoid ALL CAPS titles — they can look spammy and reduce click-through rate.');
  }
  if (suggestions.length === 0) {
    suggestions.push('Title looks well-optimized! Consider A/B testing with variations.');
  }

  return suggestions;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success: rlOk, reset } = await rateLimit({
    identifier: `yt-analyze:${session.user.id}`,
    limit: 10,
    window: 60,
  });
  if (!rlOk) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = analyzeSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { videoId } = parsed.data;

  try {
    // Fetch video metadata via oEmbed
    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;

    const oembedRes = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'TubeForge/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (!oembedRes.ok) {
      return NextResponse.json(
        { error: 'Could not fetch video data. The video may be private or unavailable.' },
        { status: 404 },
      );
    }

    const data = (await oembedRes.json()) as OEmbedResponse;
    const scores = computeScores(data.title, data.author_name);

    return NextResponse.json({
      videoId,
      title: data.title,
      channel: data.author_name,
      channelUrl: data.author_url,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      watchUrl: canonicalUrl,
      analysis: scores,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'Analysis timed out. YouTube may be slow — please try again.'
        : 'Failed to analyze video. Please try again later.';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
