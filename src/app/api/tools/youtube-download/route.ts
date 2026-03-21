import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const ytLog = createLogger('youtube-analyzer');

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

interface YouTubeDataAPISnippet {
  publishedAt?: string;
  title?: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  channelTitle?: string;
}

interface YouTubeDataAPIStats {
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
}

interface YouTubeDataAPIContentDetails {
  duration?: string;
}

interface YouTubeDataAPIItem {
  snippet?: YouTubeDataAPISnippet;
  statistics?: YouTubeDataAPIStats;
  contentDetails?: YouTubeDataAPIContentDetails;
}

interface YouTubeDataAPIResponse {
  items?: YouTubeDataAPIItem[];
}

/* ─── Analysis helpers ──────────────────────────────────────────────── */

const POWER_WORDS_RU = [
  'секрет', 'лучший', 'топ', 'как', 'почему', 'ошибк', 'правда',
  'невероятн', 'шок', 'важн', 'идеальн', 'простой', 'быстр',
  'бесплатн', 'новый', 'первый',
];

const POWER_WORDS_EN = [
  'secret', 'best', 'top', 'how', 'why', 'mistake', 'truth',
  'incredible', 'shocking', 'important', 'perfect', 'simple', 'fast',
  'free', 'new', 'first', 'ultimate', 'amazing', 'hack', 'revealed',
];

function countEmojis(text: string): number {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu;
  return (text.match(emojiRegex) || []).length;
}

function hasNumbers(text: string): boolean {
  return /\d+/.test(text);
}

function hasQuestion(text: string): boolean {
  return /\?/.test(text) || /^(как|why|how|what|когда|where|зачем|почему)/i.test(text);
}

function capsRatio(text: string): number {
  const letters = text.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '');
  if (letters.length === 0) return 0;
  const upper = letters.replace(/[^A-ZА-ЯЁ]/g, '').length;
  return upper / letters.length;
}

function countPowerWords(title: string): number {
  const lower = title.toLowerCase();
  let count = 0;
  for (const word of [...POWER_WORDS_RU, ...POWER_WORDS_EN]) {
    if (lower.includes(word)) count++;
  }
  return count;
}

/**
 * Calculate a hook score (1-10) based on title characteristics.
 * Higher scores indicate more attention-grabbing titles.
 */
function calculateHookScore(title: string): number {
  let score = 5; // baseline

  // Numbers in title (+1)
  if (hasNumbers(title)) score += 1;

  // Question format (+1)
  if (hasQuestion(title)) score += 1;

  // Emojis (+0.5 each, max +1)
  score += Math.min(countEmojis(title) * 0.5, 1);

  // Power words (+0.5 each, max +2)
  score += Math.min(countPowerWords(title) * 0.5, 2);

  // Excessive caps (-1 if > 50%)
  if (capsRatio(title) > 0.5) score -= 1;

  // Too long title (-1 if > 80 chars)
  if (title.length > 80) score -= 1;

  // Too short title (-1 if < 20 chars)
  if (title.length < 20) score -= 1;

  return Math.max(1, Math.min(10, Math.round(score)));
}

/**
 * Calculate a title SEO score (1-10).
 */
function calculateTitleScore(title: string): number {
  let score = 5;

  // Optimal length: 40-70 characters
  if (title.length >= 40 && title.length <= 70) {
    score += 2;
  } else if (title.length >= 30 && title.length <= 80) {
    score += 1;
  } else {
    score -= 1;
  }

  // Has numbers (+1)
  if (hasNumbers(title)) score += 1;

  // Power words (+1)
  if (countPowerWords(title) >= 1) score += 1;

  // Contains a separator like | or - (common SEO pattern) (+0.5)
  if (/[|—–\-:]/.test(title)) score += 0.5;

  // Not all caps (+0.5)
  if (capsRatio(title) < 0.3) score += 0.5;

  return Math.max(1, Math.min(10, Math.round(score)));
}

/**
 * Estimate content type from title, tags, and description.
 */
function estimateContentType(
  title: string,
  tags?: string[],
  description?: string,
): string {
  const combined = [title, ...(tags ?? []), description ?? ''].join(' ').toLowerCase();

  if (/tutorial|урок|how to|как сделать|обучение|guide|гайд|learn|курс/.test(combined)) {
    return 'tutorial';
  }
  if (/review|обзор|распаковка|unboxing|тест|сравнение|comparison/.test(combined)) {
    return 'review';
  }
  if (/news|новост|breaking|срочно|update|обновлени/.test(combined)) {
    return 'news';
  }
  if (/vlog|влог|день из жизни|day in|routine|travel|путешестви/.test(combined)) {
    return 'vlog';
  }
  if (/podcast|подкаст|интервью|interview|разговор|беседа/.test(combined)) {
    return 'podcast';
  }
  if (/music|музык|clip|клип|song|песн|cover|кавер/.test(combined)) {
    return 'music';
  }
  if (/stream|стрим|live|прямой эфир|трансляция/.test(combined)) {
    return 'livestream';
  }
  if (/game|игр|gameplay|прохождение|minecraft|fortnite|gaming/.test(combined)) {
    return 'gaming';
  }

  return 'entertainment';
}

/**
 * Estimate CTR quality from title analysis.
 */
function estimateCTR(hookScore: number, titleScore: number): 'low' | 'medium' | 'high' | 'very_high' {
  const avg = (hookScore + titleScore) / 2;
  if (avg >= 8) return 'very_high';
  if (avg >= 6) return 'high';
  if (avg >= 4) return 'medium';
  return 'low';
}

/**
 * Parse ISO 8601 duration (PT5M30S) into total seconds.
 */
function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Estimate video structure based on total duration.
 */
function estimateStructure(durationISO?: string): Record<string, string> {
  if (!durationISO) {
    return {
      estimatedHookDuration: 'Нет данных',
      estimatedIntro: 'Нет данных',
      estimatedMainContent: 'Нет данных',
      estimatedOutro: 'Нет данных',
    };
  }

  const totalSec = parseDurationToSeconds(durationISO);
  if (totalSec === 0) {
    return {
      estimatedHookDuration: 'Нет данных',
      estimatedIntro: 'Нет данных',
      estimatedMainContent: 'Нет данных',
      estimatedOutro: 'Нет данных',
    };
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Hook: first 3-5 seconds
  const hookEnd = Math.min(5, totalSec * 0.02);
  // Intro: next ~10% of video
  const introEnd = Math.min(hookEnd + totalSec * 0.1, totalSec * 0.15);
  // Outro: last ~8% of video
  const outroStart = totalSec * 0.92;
  // Main content: everything in between
  const mainStart = introEnd;
  const mainEnd = outroStart;

  return {
    estimatedHookDuration: `${fmt(0)} - ${fmt(hookEnd)}`,
    estimatedIntro: `${fmt(hookEnd)} - ${fmt(introEnd)}`,
    estimatedMainContent: `${fmt(mainStart)} - ${fmt(mainEnd)}`,
    estimatedOutro: `${fmt(outroStart)} - ${fmt(totalSec)}`,
  };
}

/**
 * Generate actionable tips based on analysis data.
 */
function generateTips(
  title: string,
  hookScore: number,
  engagementRate: number,
  durationISO?: string,
  contentType?: string,
): string[] {
  const tips: string[] = [];

  // Hook quality tips
  if (hookScore >= 7) {
    tips.push('Хороший хук в заголовке — зрители кликают. Сохраняйте этот стиль.');
  } else if (hookScore >= 5) {
    tips.push('Заголовок средний. Попробуйте добавить число или вопрос для повышения CTR.');
  } else {
    tips.push('Слабый заголовок. Используйте числа, вопросы и сильные слова для привлечения внимания.');
  }

  // Title length tips
  if (title.length > 70) {
    tips.push('Заголовок слишком длинный — YouTube обрежет его в поиске. Оптимально: 40-70 символов.');
  } else if (title.length < 30) {
    tips.push('Заголовок слишком короткий. Добавьте ключевые слова для лучшего ранжирования в поиске.');
  }

  // Engagement tips
  if (engagementRate > 5) {
    tips.push('Отличный engagement rate! Аудитория активно взаимодействует с контентом.');
  } else if (engagementRate > 2) {
    tips.push('Добавьте CTA в описание и в видео для увеличения вовлечённости.');
  } else if (engagementRate > 0) {
    tips.push('Низкий engagement. Задавайте вопросы зрителям и призывайте к комментариям.');
  }

  // Duration tips
  if (durationISO) {
    const totalSec = parseDurationToSeconds(durationISO);
    const totalMin = totalSec / 60;

    const optimalRanges: Record<string, string> = {
      tutorial: '8-15',
      review: '8-12',
      news: '5-10',
      vlog: '10-20',
      entertainment: '8-15',
      podcast: '30-60',
      gaming: '15-30',
      music: '3-5',
      livestream: '60+',
    };

    const optimal = optimalRanges[contentType ?? 'entertainment'] ?? '8-15';
    tips.push(`Оптимальная длина для категории "${contentType ?? 'entertainment'}": ${optimal} минут. Ваше видео: ${Math.round(totalMin)} мин.`);

    if (totalMin < 1) {
      tips.push('Очень короткое видео. Рассмотрите формат YouTube Shorts для максимального охвата.');
    }
  }

  // Emoji tips
  if (countEmojis(title) === 0) {
    tips.push('Добавьте 1-2 эмодзи в заголовок — это повышает CTR на 5-10% по данным исследований.');
  } else if (countEmojis(title) > 3) {
    tips.push('Слишком много эмодзи в заголовке. Оставьте 1-2 для профессионального вида.');
  }

  return tips.slice(0, 6); // max 6 tips
}

/**
 * Detect viral factors.
 */
function detectViralFactors(
  title: string,
  hookScore: number,
  titleScore: number,
  engagementRate: number,
  views?: number,
  tags?: string[],
): string[] {
  const factors: string[] = [];

  if (hasNumbers(title)) {
    factors.push('Цепляющий заголовок с числом — повышает CTR');
  }

  if (hasQuestion(title)) {
    factors.push('Вопрос в заголовке вызывает любопытство');
  }

  if (countPowerWords(title) >= 2) {
    factors.push('Использование сильных слов в заголовке');
  }

  if (engagementRate > 5) {
    factors.push('Высокий engagement rate — алгоритм продвигает такой контент');
  }

  if (views && views > 1_000_000) {
    factors.push('Миллионные просмотры — видео попало в рекомендации');
  } else if (views && views > 100_000) {
    factors.push('Хорошие просмотры — видео нашло свою аудиторию');
  }

  if (countEmojis(title) >= 1 && countEmojis(title) <= 2) {
    factors.push('Умеренное использование эмодзи привлекает внимание');
  }

  if (tags && tags.length >= 5) {
    factors.push('Хорошая оптимизация тегов для поиска');
  }

  if (hookScore >= 8) {
    factors.push('Очень сильный хук — зрители не могут не кликнуть');
  }

  if (titleScore >= 8) {
    factors.push('SEO-оптимизированный заголовок для YouTube поиска');
  }

  return factors.slice(0, 5); // max 5 factors
}

/* ══════════════════════════════════════════════════════════════════════
 * GET /api/tools/youtube-analyzer?url=<youtube_url>
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
    limit: 15,
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
 * POST /api/tools/youtube-analyzer
 *
 * Performs a comprehensive video analysis:
 *   - Fetches metadata via oEmbed (always available)
 *   - Enriches with YouTube Data API v3 stats if YOUTUBE_API_KEY is set
 *   - Calculates hook score, title SEO score, engagement rate
 *   - Estimates content type, CTR, video structure
 *   - Returns actionable tips and viral factors (in Russian)
 *
 * Body: { url: string }
 * ══════════════════════════════════════════════════════════════════════ */

const analyzeSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success: rlOk, reset } = await rateLimit({
    identifier: `yt-analyze:${session.user.id}`,
    limit: 15,
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

  const { url } = parsed.data;
  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: 'Invalid YouTube URL. Please provide a valid youtube.com or youtu.be link.' },
      { status: 400 },
    );
  }

  try {
    // ── Step 1: Fetch oEmbed data (always available, no API key needed) ──
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

    const oembed = (await oembedRes.json()) as OEmbedResponse;
    const title = oembed.title;
    const channel = oembed.author_name;
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

    // ── Step 2: Try YouTube Data API v3 for enriched data ────────────
    let publishedAt: string | undefined;
    let duration: string | undefined;
    let views: number | undefined;
    let likes: number | undefined;
    let comments: number | undefined;
    let tags: string[] | undefined;
    let categoryId: string | undefined;
    let description: string | undefined;
    let dataApiAvailable = false;

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (youtubeApiKey) {
      try {
        const dataApiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${youtubeApiKey}&part=snippet,statistics,contentDetails`;

        const dataRes = await fetch(dataApiUrl, {
          headers: { 'User-Agent': 'TubeForge/1.0' },
          signal: AbortSignal.timeout(8000),
        });

        if (dataRes.ok) {
          const dataJson = (await dataRes.json()) as YouTubeDataAPIResponse;
          const item = dataJson.items?.[0];

          if (item) {
            dataApiAvailable = true;
            publishedAt = item.snippet?.publishedAt;
            duration = item.contentDetails?.duration;
            description = item.snippet?.description;
            tags = item.snippet?.tags;
            categoryId = item.snippet?.categoryId;

            views = item.statistics?.viewCount ? parseInt(item.statistics.viewCount, 10) : undefined;
            likes = item.statistics?.likeCount ? parseInt(item.statistics.likeCount, 10) : undefined;
            comments = item.statistics?.commentCount ? parseInt(item.statistics.commentCount, 10) : undefined;
          }
        } else {
          ytLog.warn('YouTube Data API returned error', { status: dataRes.status });
        }
      } catch (err) {
        ytLog.warn('YouTube Data API request failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // ── Step 3: Calculate analysis scores ────────────────────────────
    const hookScore = calculateHookScore(title);
    const titleScore = calculateTitleScore(title);
    const thumbnailPresent = true; // YouTube always has thumbnails

    // Engagement rate: (likes + comments) / views * 100
    let engagementRate = 0;
    if (views && views > 0) {
      engagementRate = Math.round(((likes ?? 0) + (comments ?? 0)) / views * 10000) / 100;
    }

    const estimatedCTR = estimateCTR(hookScore, titleScore);
    const contentType = estimateContentType(title, tags, description);
    const structure = estimateStructure(duration);
    const tips = generateTips(title, hookScore, engagementRate, duration, contentType);
    const viralFactors = detectViralFactors(title, hookScore, titleScore, engagementRate, views, tags);

    // ── Step 4: Build response ───────────────────────────────────────
    return NextResponse.json({
      videoId,
      title,
      channel,
      thumbnail,
      publishedAt: publishedAt ?? null,
      duration: duration ?? null,
      stats: {
        views: views ?? null,
        likes: likes ?? null,
        comments: comments ?? null,
      },
      analysis: {
        hookScore,
        titleScore,
        thumbnailPresent,
        engagementRate,
        estimatedCTR,
        contentType,
        tips,
        structure,
        viralFactors,
      },
      dataApiAvailable,
    });
  } catch (err) {
    ytLog.error('Analysis error', { error: err instanceof Error ? err.message : String(err) });

    const message =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'Request timed out. YouTube may be slow — please try again.'
        : 'Failed to analyze video. Please try again later.';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
