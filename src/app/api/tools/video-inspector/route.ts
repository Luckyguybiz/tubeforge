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
 * YouTube category ID → human-readable name
 * ══════════════════════════════════════════════════════════════════════ */
const CATEGORY_MAP: Record<string, string> = {
  '1': 'Film & Animation',
  '2': 'Autos & Vehicles',
  '10': 'Music',
  '15': 'Pets & Animals',
  '17': 'Sports',
  '18': 'Short Movies',
  '19': 'Travel & Events',
  '20': 'Gaming',
  '21': 'Videoblogging',
  '22': 'People & Blogs',
  '23': 'Comedy',
  '24': 'Entertainment',
  '25': 'News & Politics',
  '26': 'Howto & Style',
  '27': 'Education',
  '28': 'Science & Technology',
  '29': 'Nonprofits & Activism',
  '30': 'Movies',
  '31': 'Anime/Animation',
  '32': 'Action/Adventure',
  '33': 'Classics',
  '34': 'Comedy',
  '35': 'Documentary',
  '36': 'Drama',
  '37': 'Family',
  '38': 'Foreign',
  '39': 'Horror',
  '40': 'Sci-Fi/Fantasy',
  '41': 'Thriller',
  '42': 'Shorts',
  '43': 'Shows',
  '44': 'Trailers',
};

/* ══════════════════════════════════════════════════════════════════════
 * Parse ISO 8601 duration (PT1H2M30S) → total seconds
 * ══════════════════════════════════════════════════════════════════════ */
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseInt(match[3] || '0', 10);
  return h * 3600 + m * 60 + s;
}

/** Format seconds → "1:02:30" or "12:30" */
function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ══════════════════════════════════════════════════════════════════════
 * GET /api/tools/video-inspector?url=<youtube_url>
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
 * POST /api/tools/video-inspector
 *
 * Video Inspector — returns public YouTube Data API info (title, stats,
 * public info for a YouTube video.
 *
 * Uses YouTube Data API v3 when YOUTUBE_API_KEY is available,
 * falls back to oEmbed-only analysis otherwise.
 *
 * Body: { videoId: string }
 * ══════════════════════════════════════════════════════════════════════ */

const analyzeSchema = z.object({
  videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/, 'Invalid videoId'),
});

/* ── Power / emotional word lists ────────────────────────────────── */
const POWER_WORDS = [
  'how', 'why', 'best', 'top', 'ultimate', 'guide', 'tutorial',
  'review', 'tips', 'secrets', 'free', 'new', 'easy', 'step',
  'complete', 'proven', 'hack', 'strategy', 'mistake', 'avoid',
];
const EMOTIONAL_WORDS = [
  'amazing', 'shocking', 'unbelievable', 'must', 'watch', 'never',
  'first', 'last', 'only', 'insane', 'incredible', 'epic',
];
const CTA_PHRASES = [
  'subscribe', 'like', 'comment', 'share', 'follow', 'click',
  'check out', 'link in', 'sign up', 'download', 'join',
];

/* ── Description score (0-100) ───────────────────────────────────── */
function computeDescriptionScore(description: string): {
  hasTimestamps: boolean;
  hasLinks: boolean;
  hasHashtags: boolean;
  hasCTA: boolean;
  descriptionLength: number;
} {
  // Returns ONLY factual structure of the description text.
  // Per YouTube ToS Policy III.E.4h, no derived scoring metric is computed or returned.
  const lower = description.toLowerCase();
  return {
    hasTimestamps: /\d{1,2}:\d{2}/.test(description),
    hasLinks: /https?:\/\//.test(description),
    hasHashtags: /#\w+/.test(description),
    hasCTA: CTA_PHRASES.some((p) => lower.includes(p)),
    descriptionLength: description.length,
  };
}




interface YTSnippet {
  title: string;
  description: string;
  tags?: string[];
  publishedAt: string;
  channelTitle: string;
  channelId: string;
  categoryId?: string;
  thumbnails?: Record<string, { url?: string; width?: number; height?: number }>;
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
}

interface YTStatistics {
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
}

interface YTContentDetails {
  duration?: string;
  definition?: string;
  caption?: string;
}

interface YTVideoItem {
  id: string;
  snippet: YTSnippet;
  statistics: YTStatistics;
  contentDetails: YTContentDetails;
  topicDetails?: { topicCategories?: string[] };
}

interface YTApiResponse {
  items?: YTVideoItem[];
  error?: { code: number; message: string };
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
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  /* ── Full analysis via YouTube Data API v3 ─────────────────────── */
  if (YOUTUBE_API_KEY) {
    try {
      const apiUrl =
        `https://www.googleapis.com/youtube/v3/videos?` +
        `part=snippet,statistics,contentDetails,topicDetails` +
        `&id=${videoId}` +
        `&key=${YOUTUBE_API_KEY}`;

      const apiRes = await fetch(apiUrl, {
        headers: { 'User-Agent': 'TubeForge/1.0' },
        signal: AbortSignal.timeout(10_000),
      });

      const apiData = (await apiRes.json()) as YTApiResponse;

      if (!apiRes.ok || apiData.error) {
        return NextResponse.json(
          { error: `YouTube API error: ${apiData.error?.message ?? 'Unknown error'}` },
          { status: apiRes.status >= 400 ? apiRes.status : 502 },
        );
      }

      const video = apiData.items?.[0];
      if (!video) {
        return NextResponse.json(
          { error: 'Video not found. It may be private or deleted.' },
          { status: 404 },
        );
      }

      const { snippet, statistics, contentDetails } = video;

      const views = parseInt(statistics.viewCount ?? '0', 10);
      const likes = parseInt(statistics.likeCount ?? '0', 10);
      const comments = parseInt(statistics.commentCount ?? '0', 10);

      const durationSeconds = parseDuration(contentDetails.duration ?? 'PT0S');
      const isShorts = durationSeconds > 0 && durationSeconds <= 60;

      // Compliance (YouTube ToS, Policy III.E.4h): only API-direct fields.
      // Description structure analysis is factual (timestamps/links/hashtags/CTA presence).
      // 2026-05-19 (V.3 compliance): removed likeRate/commentRate derivations
      // proactively per Niki's V.2 offer. III.E.4.h does not allow derived metrics
      // from API data even via trivial arithmetic. Display now shows raw counts only.
      const descResult = computeDescriptionScore(snippet.description);

      const category = snippet.categoryId ? (CATEGORY_MAP[snippet.categoryId] ?? 'Unknown') : 'Unknown';
      const language = snippet.defaultAudioLanguage ?? snippet.defaultLanguage ?? 'unknown';

      return NextResponse.json({
        videoId,
        title: snippet.title,
        channel: snippet.channelTitle,
        channelUrl: `https://www.youtube.com/channel/${snippet.channelId}`,
        thumbnail: snippet.thumbnails?.maxres?.url ?? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: snippet.publishedAt,
        duration: contentDetails.duration ?? 'PT0S',
        durationFormatted: formatDuration(durationSeconds),
        definition: contentDetails.definition ?? 'unknown',
        hasCaptions: contentDetails.caption === 'true',
        category,
        language,
        statistics: { views, likes, comments },
        description: snippet.description.slice(0, 500),
        tags: snippet.tags ?? [],
        isShorts,
        structure: {
          hasTimestamps: descResult.hasTimestamps,
          hasLinks: descResult.hasLinks,
          hasHashtags: descResult.hasHashtags,
          hasCTA: descResult.hasCTA,
          descriptionLength: descResult.descriptionLength,
        },
        apiSource: 'youtube-data-api-v3' as const,
      });
    } catch (err) {
      const message =
        err instanceof Error && err.name === 'TimeoutError'
          ? 'Analysis timed out. YouTube API may be slow — please try again.'
          : 'Failed to analyze video via YouTube API. Please try again later.';

      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  /* ── Fallback: oEmbed-only analysis ────────────────────────────── */
  try {
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
    return NextResponse.json({
      videoId,
      title: data.title,
      channel: data.author_name,
      channelUrl: data.author_url,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      watchUrl: canonicalUrl,
      apiSource: 'oembed-fallback' as const,
      note: 'Limited info — set YOUTUBE_API_KEY for the full public field set (statistics, description, tags).',
    });
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'Analysis timed out. YouTube may be slow — please try again.'
        : 'Failed to analyze video. Please try again later.';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
