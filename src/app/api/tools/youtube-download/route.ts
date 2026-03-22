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

/* ── Title score (0-100) ─────────────────────────────────────────── */
function computeTitleScore(title: string): number {
  const len = title.length;
  const lower = title.toLowerCase();
  let score = 0;

  // Length: optimal 40-70
  if (len >= 40 && len <= 70) score += 90;
  else if (len >= 30 && len <= 80) score += 75;
  else score += 50;

  // Power words (+10 each, max 30)
  const pwCount = POWER_WORDS.filter((w) => lower.includes(w)).length;
  score += Math.min(30, pwCount * 10);

  // Emotional hooks (+8 each, max 24)
  const emCount = EMOTIONAL_WORDS.filter((w) => lower.includes(w)).length;
  score += Math.min(24, emCount * 8);

  // Numbers in title (+10)
  if (/\d/.test(title)) score += 10;

  // Question / exclamation (+5 each)
  if (title.includes('?')) score += 5;
  if (title.includes('!')) score += 5;

  // ALL CAPS penalty
  if (title === title.toUpperCase() && len > 5) score -= 20;

  return Math.max(0, Math.min(100, Math.round(score * 100 / 164)));
}

/* ── Description score (0-100) ───────────────────────────────────── */
function computeDescriptionScore(description: string): {
  score: number;
  hasTimestamps: boolean;
  hasLinks: boolean;
  hasHashtags: boolean;
  hasCTA: boolean;
  descriptionLength: number;
} {
  const len = description.length;
  const lower = description.toLowerCase();
  let score = 0;

  // Length
  if (len >= 500) score += 90;
  else if (len >= 200) score += 70;
  else score += 40;

  // Timestamps (e.g. 0:00, 1:23:45)
  const hasTimestamps = /\d{1,2}:\d{2}/.test(description);
  if (hasTimestamps) score += 15;

  // Links
  const hasLinks = /https?:\/\//.test(description);
  if (hasLinks) score += 10;

  // Hashtags
  const hasHashtags = /#\w+/.test(description);
  if (hasHashtags) score += 10;

  // CTA phrases
  const hasCTA = CTA_PHRASES.some((p) => lower.includes(p));
  if (hasCTA) score += 10;

  return {
    score: Math.max(0, Math.min(100, Math.round(score * 100 / 135))),
    hasTimestamps,
    hasLinks,
    hasHashtags,
    hasCTA,
    descriptionLength: len,
  };
}

/* ── Tags score (0-100) ──────────────────────────────────────────── */
function computeTagsScore(tags: string[] | undefined, title: string): number {
  if (!tags || tags.length === 0) return 10;

  let score = 0;
  const count = tags.length;

  // Tag count
  if (count >= 8 && count <= 15) score += 90;
  else if (count >= 3 && count <= 7) score += 70;
  else if (count > 15) score += 60;
  else score += 40;

  // Tag relevance: overlap with title words
  const titleWords = new Set(title.toLowerCase().split(/\W+/).filter(Boolean));
  const tagWords = new Set(tags.flatMap((t) => t.toLowerCase().split(/\W+/).filter(Boolean)));
  let overlap = 0;
  for (const w of titleWords) {
    if (tagWords.has(w) && w.length > 2) overlap++;
  }
  const relevance = titleWords.size > 0 ? overlap / titleWords.size : 0;
  score += Math.round(relevance * 30);

  return Math.max(0, Math.min(100, Math.round(score * 100 / 120)));
}

/* ── Thumbnail score (0-100) ─────────────────────────────────────── */
async function computeThumbnailScore(videoId: string, thumbnails: Record<string, { url?: string; width?: number; height?: number }> | undefined): Promise<number> {
  let score = 50; // base

  // Check maxres thumbnail
  const maxres = thumbnails?.maxres;
  if (maxres?.url) {
    score += 30; // has high-res custom thumbnail
  } else {
    // Try HEAD request for maxresdefault
    try {
      const headRes = await fetch(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      });
      if (headRes.ok) score += 25;
    } catch {
      // ignore
    }
  }

  // Resolution check
  const width = maxres?.width ?? thumbnails?.high?.width ?? 0;
  const height = maxres?.height ?? thumbnails?.high?.height ?? 0;
  if (width >= 1280 && height >= 720) score += 20;
  else if (width >= 480) score += 10;

  return Math.max(0, Math.min(100, score));
}

/* ── Engagement score (0-100) ────────────────────────────────────── */
function computeEngagementScore(
  views: number,
  likes: number,
  comments: number,
  publishedAt: string,
): { score: number; likeRate: number; commentRate: number; viewsPerDay: number } {
  const daysSincePublish = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / 86_400_000);
  const likeRate = views > 0 ? (likes / views) * 100 : 0;
  const commentRate = views > 0 ? (comments / views) * 100 : 0;
  const viewsPerDay = Math.round(views / daysSincePublish);

  let score = 0;

  // Like rate
  if (likeRate >= 4) score += 40;
  else if (likeRate >= 2) score += 28;
  else if (likeRate >= 1) score += 18;
  else score += 8;

  // Comment rate
  if (commentRate >= 0.5) score += 25;
  else if (commentRate >= 0.2) score += 18;
  else if (commentRate >= 0.05) score += 10;
  else score += 4;

  // Views velocity
  if (viewsPerDay >= 10000) score += 35;
  else if (viewsPerDay >= 1000) score += 28;
  else if (viewsPerDay >= 100) score += 18;
  else if (viewsPerDay >= 10) score += 10;
  else score += 4;

  return {
    score: Math.max(0, Math.min(100, score)),
    likeRate: Math.round(likeRate * 100) / 100,
    commentRate: Math.round(commentRate * 1000) / 1000,
    viewsPerDay,
  };
}

/* ── Suggestion generator ────────────────────────────────────────── */
function generateSuggestions(
  title: string,
  description: string,
  tags: string[] | undefined,
  engagement: { likeRate: number; commentRate: number; viewsPerDay: number },
  descMeta: { hasTimestamps: boolean; hasLinks: boolean; hasHashtags: boolean; hasCTA: boolean; descriptionLength: number },
): string[] {
  const suggestions: string[] = [];
  const titleLen = title.length;
  const titleLower = title.toLowerCase();

  // Title suggestions
  if (titleLen < 30) suggestions.push('Title is too short. Aim for 40-70 characters for better CTR.');
  if (titleLen > 80) suggestions.push('Title is too long. Keep it under 70 characters so it doesn\'t get truncated.');
  if (title === title.toUpperCase() && titleLen > 5) suggestions.push('Avoid ALL CAPS titles -- they can look spammy and reduce click-through rate.');
  if (POWER_WORDS.filter((w) => titleLower.includes(w)).length === 0) {
    suggestions.push('Add power words (e.g., "Ultimate", "Best", "Guide") to improve discoverability.');
  }
  if (!/\d/.test(title)) suggestions.push('Consider adding numbers to your title -- listicles and numbered tips perform well.');

  // Description suggestions
  if (!descMeta.hasTimestamps) suggestions.push('Add timestamps to your description for better SEO and viewer navigation.');
  if (!descMeta.hasLinks) suggestions.push('Include relevant links in your description (social media, resources, related videos).');
  if (!descMeta.hasHashtags) suggestions.push('Add 3-5 hashtags to your description to improve discoverability.');
  if (!descMeta.hasCTA) suggestions.push('Include a call-to-action in your description (e.g., "Subscribe for more...").');
  if (descMeta.descriptionLength < 200) suggestions.push('Write a longer description (500+ characters) to improve SEO ranking.');

  // Tags suggestions
  if (!tags || tags.length === 0) suggestions.push('Add relevant tags to your video -- this significantly improves search discoverability.');
  else if (tags.length < 5) suggestions.push(`You only have ${tags.length} tags. Add 8-15 tags for optimal discoverability.`);
  else if (tags.length > 15) suggestions.push('You have many tags. Focus on the 8-15 most relevant ones for best results.');

  // Engagement feedback
  if (engagement.likeRate >= 4) suggestions.push(`Your like rate (${engagement.likeRate}%) is excellent -- above the 4% benchmark.`);
  else if (engagement.likeRate < 2) suggestions.push(`Your like rate (${engagement.likeRate}%) is below average. Ask viewers to like the video.`);
  if (engagement.commentRate < 0.05) suggestions.push('Low comment rate. Ask questions or encourage discussion to boost comments.');

  // Ensure at least one suggestion
  if (suggestions.length === 0) suggestions.push('Great job! Your video is well-optimized. Consider A/B testing with variations.');

  return suggestions;
}

/* ── Fallback: oEmbed-only analysis ──────────────────────────────── */
function computeFallbackScores(title: string, channel: string) {
  const titleLen = title.length;
  const titleLower = title.toLowerCase();
  let titleScore = 50;
  if (titleLen >= 40 && titleLen <= 70) titleScore = 90;
  else if (titleLen >= 30 && titleLen <= 80) titleScore = 75;
  else if (titleLen >= 20 && titleLen <= 100) titleScore = 60;
  else if (titleLen < 10) titleScore = 20;

  const pwCount = POWER_WORDS.filter((w) => titleLower.includes(w)).length;
  const keywordScore = Math.min(95, 40 + pwCount * 15);
  const emCount = EMOTIONAL_WORDS.filter((w) => titleLower.includes(w)).length;
  const engagementScore = Math.min(95, 35 + emCount * 12 + (title.includes('?') ? 10 : 0) + (title.includes('!') ? 5 : 0));
  const seoScore = Math.round(titleScore * 0.4 + keywordScore * 0.35 + engagementScore * 0.25);

  void channel;

  const suggestions: string[] = [];
  if (titleLen < 30) suggestions.push('Title is too short. Aim for 40-70 characters for better CTR.');
  if (titleLen > 80) suggestions.push('Title is too long. Keep it under 70 characters so it doesn\'t get truncated.');
  if (pwCount === 0) suggestions.push('Add power words (e.g., "Ultimate", "Best", "Guide") to improve discoverability.');
  if (emCount === 0) suggestions.push('Consider adding emotional hooks or questions to boost engagement.');
  if (title === title.toUpperCase() && titleLen > 5) suggestions.push('Avoid ALL CAPS titles -- they can look spammy and reduce click-through rate.');
  if (suggestions.length === 0) suggestions.push('Title looks well-optimized! Consider A/B testing with variations.');

  return { overall: seoScore, titleOptimization: titleScore, keywordUsage: keywordScore, engagementPotential: engagementScore, titleLength: titleLen, suggestions };
}

/* ── YouTube Data API v3 types ───────────────────────────────────── */
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

      // Compute all scores
      const titleScore = computeTitleScore(snippet.title);
      const descResult = computeDescriptionScore(snippet.description);
      const tagsScore = computeTagsScore(snippet.tags, snippet.title);
      const thumbnailScore = await computeThumbnailScore(videoId, snippet.thumbnails);
      const engagementResult = computeEngagementScore(views, likes, comments, snippet.publishedAt);

      // SEO is weighted combination
      const seoScore = Math.round(
        titleScore * 0.2 +
        descResult.score * 0.15 +
        tagsScore * 0.1 +
        thumbnailScore * 0.15 +
        engagementResult.score * 0.2 +
        // Remaining 20% from combined factors
        ((titleScore + descResult.score + tagsScore) / 3) * 0.2,
      );

      const overall = Math.round(
        titleScore * 0.20 +
        descResult.score * 0.15 +
        tagsScore * 0.10 +
        thumbnailScore * 0.15 +
        engagementResult.score * 0.20 +
        seoScore * 0.20,
      );

      // Estimated CTR
      let estimatedCTR: 'high' | 'medium' | 'low';
      if (overall >= 75) estimatedCTR = 'high';
      else if (overall >= 50) estimatedCTR = 'medium';
      else estimatedCTR = 'low';

      // Benchmark comparison
      let benchmarkComparison: 'above_average' | 'average' | 'below_average';
      if (engagementResult.likeRate >= 4) benchmarkComparison = 'above_average';
      else if (engagementResult.likeRate >= 2) benchmarkComparison = 'average';
      else benchmarkComparison = 'below_average';

      const suggestions = generateSuggestions(
        snippet.title,
        snippet.description,
        snippet.tags,
        engagementResult,
        descResult,
      );

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
        scores: {
          overall,
          title: titleScore,
          description: descResult.score,
          tags: tagsScore,
          thumbnail: thumbnailScore,
          engagement: engagementResult.score,
          seo: seoScore,
        },
        metrics: {
          likeRate: engagementResult.likeRate,
          commentRate: engagementResult.commentRate,
          viewsPerDay: engagementResult.viewsPerDay,
          estimatedCTR,
          benchmarkComparison,
        },
        suggestions,
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
    const scores = computeFallbackScores(data.title, data.author_name);

    return NextResponse.json({
      videoId,
      title: data.title,
      channel: data.author_name,
      channelUrl: data.author_url,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      watchUrl: canonicalUrl,
      analysis: scores,
      apiSource: 'oembed-fallback' as const,
      note: 'Limited analysis — set YOUTUBE_API_KEY for comprehensive video analysis with engagement metrics, description analysis, and more.',
    });
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'Analysis timed out. YouTube may be slow — please try again.'
        : 'Failed to analyze video. Please try again later.';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
