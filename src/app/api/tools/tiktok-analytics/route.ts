import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/server/db';

/* ================================================================== *
 *  TikTok Analytics API                                               *
 *                                                                     *
 *  Strategies (in order):                                             *
 *    1. YouTube Data API — search for viral TikTok content on YT      *
 *    2. Dynamic procedural data — seeded by period/category/time      *
 *                                                                     *
 *  TikTok has no public analytics API, so Strategy 1 searches for     *
 *  TikTok content reposted on YouTube (which IS publicly available).  *
 *  This gives real viral TikTok videos with real view counts.         *
 * ================================================================== */

const FETCH_TIMEOUT_MS = 10_000;

// In-memory cache: key = period+country+category+hashtag, value = { data, timestamp }
const cache = new Map<string, { data: TikTokAPIItem[]; ts: number; mock: boolean }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CACHE_MAX_SIZE = 100;

const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000;
let lastCacheCleanup = Date.now();

interface TikTokAPIItem {
  rank: number;
  videoId: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  uploaded: string;
  uploadedRaw?: string;
  creator: string;
  creatorId: string;
  creatorAvatar: string | null;
  thumbnail: string | null;
  duration: number;
  hashtags: string[];
  soundName: string;
  engagementRate?: number;
}

function cleanupCache() {
  const now = Date.now();
  if (now - lastCacheCleanup < CACHE_CLEANUP_INTERVAL && cache.size <= CACHE_MAX_SIZE) return;
  lastCacheCleanup = now;

  for (const [key, entry] of cache) {
    if (now - entry.ts >= CACHE_TTL) {
      cache.delete(key);
    }
  }

  if (cache.size > CACHE_MAX_SIZE) {
    const entries = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
    const toDelete = cache.size - CACHE_MAX_SIZE;
    for (let i = 0; i < toDelete; i++) {
      cache.delete(entries[i][0]);
    }
  }
}

/**
 * Promo codes loaded from env (mirrors the promo route logic).
 * TODO: replace with a DB-backed promo activation table so we can track
 * per-user activation time and expiry server-side.
 */
const PROMO_CODES: Record<string, { hours: number }> = (() => {
  const raw = process.env.PROMO_CODES;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, { hours: number }>;
  } catch {
    return {};
  }
})();

/**
 * Check if the user has access to analytics (PRO/STUDIO plan, or a valid promo code).
 */
async function hasAnalyticsAccess(
  userId: string,
  plan: string,
  promoCode?: string | null,
): Promise<boolean> {
  if (plan === 'PRO' || plan === 'STUDIO') return true;

  if (promoCode) {
    const normalized = promoCode.trim().toUpperCase();
    if (Object.prototype.hasOwnProperty.call(PROMO_CODES, normalized)) {
      return true;
    }
  }

  // Double-check plan from DB in case session is stale
  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  if (dbUser?.plan === 'PRO' || dbUser?.plan === 'STUDIO') return true;

  return false;
}

/* ── GET /api/tools/tiktok-analytics ─────────────────────────────── */

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 5 requests per minute per user
  const { success: rlOk, reset } = await rateLimit({
    identifier: `tiktok-analytics:${session.user.id}`,
    limit: 5,
    window: 60,
  });
  if (!rlOk) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } },
    );
  }

  const sp = req.nextUrl.searchParams;

  // Server-side plan/promo enforcement — FREE users get limited data (10 items, 7d period only)
  const promoCode = sp.get('promoCode');
  const hasPro = await hasAnalyticsAccess(session.user.id, session.user.plan, promoCode);

  const FREE_LIMIT = 10;
  const FREE_PERIOD = '7d';

  const period = hasPro ? (sp.get('period') ?? '7d') : FREE_PERIOD;
  const country = sp.get('country') ?? '';
  const category = sp.get('category') ?? '';
  const hashtag = sp.get('hashtag') ?? '';
  const limitParam = sp.get('limit');
  const limit = hasPro
    ? (limitParam ? Math.max(1, Math.min(50, parseInt(limitParam, 10) || 50)) : 50)
    : FREE_LIMIT;

  const cacheKey = `tiktok:${period}:${country}:${category}:${hashtag}`;
  cleanupCache();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    const cachedItems = cached.data.slice(0, limit);
    return NextResponse.json({ mock: cached.mock, items: cachedItems, cached: true });
  }

  // ── Strategy 1: YouTube Data API ──────────────────────────────────
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      const result = await fetchViaYouTubeAPI(apiKey, period, country, category, hashtag);
      if (result && result.length > 0) {
        cache.set(cacheKey, { data: result, ts: Date.now(), mock: false });
        return NextResponse.json({ mock: false, items: result.slice(0, limit), cached: false });
      }
    } catch (err) {
      console.error('[tiktok-analytics] YouTube API error:', err);
    }
  }

  // ── Strategy 2: Dynamic procedural data ───────────────────────────
  const dynamicData = generateDynamicData(period, country, category, hashtag);
  cache.set(cacheKey, { data: dynamicData, ts: Date.now(), mock: true });

  return NextResponse.json({
    mock: true,
    items: dynamicData.slice(0, limit),
  });
}

/* ================================================================== *
 *  Strategy 1: YouTube Data API                                       *
 *                                                                     *
 *  Search YouTube for TikTok content (compilations, reposts, viral    *
 *  TikTok clips). YouTube has tons of TikTok content that gives us    *
 *  real view counts and engagement data.                              *
 * ================================================================== */

async function fetchViaYouTubeAPI(
  apiKey: string,
  period: string,
  country: string,
  category: string,
  hashtag: string,
): Promise<TikTokAPIItem[] | null> {
  const publishedAfter = getPublishedAfter(period);

  // Build search queries based on category/hashtag
  const catSearchTerms: Record<string, string> = {
    dance: 'tiktok dance viral',
    comedy: 'tiktok comedy funny pov',
    education: 'tiktok education learn facts',
    food: 'tiktok food recipe cooking foodtok',
    beauty: 'tiktok beauty makeup grwm',
    fitness: 'tiktok fitness workout gym',
    music: 'tiktok music cover singing',
    gaming: 'tiktok gaming minecraft fortnite',
    diy: 'tiktok diy craft room decor',
    fashion: 'tiktok fashion ootd style haul',
    pets: 'tiktok pets cats dogs cute',
    travel: 'tiktok travel vacation budget tips',
  };

  const baseQuery = hashtag
    ? `tiktok #${hashtag.replace(/^#/, '')}`
    : category && catSearchTerms[category]
      ? catSearchTerms[category]
      : 'tiktok viral trending';

  // Run 2 parallel searches for better coverage
  const queries = [
    baseQuery,
    hashtag
      ? `#${hashtag.replace(/^#/, '')} tiktok trend`
      : `tiktok ${category || 'viral'} 2026`,
  ];

  const searchPromises = queries.map((q) => {
    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      videoDuration: 'short',
      order: 'viewCount',
      maxResults: '50',
      q,
      key: apiKey,
    });
    if (publishedAfter) params.set('publishedAfter', publishedAfter);
    if (country) params.set('regionCode', country);

    return fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  });

  const searchResults = await Promise.all(searchPromises);

  // Collect unique video IDs
  const idSet = new Set<string>();
  for (const data of searchResults) {
    if (!data?.items) continue;
    for (const item of data.items) {
      const vid = (item.id as Record<string, unknown>)?.videoId as string | undefined;
      if (vid) idSet.add(vid);
    }
  }

  const allIds = [...idSet];
  if (allIds.length === 0) return null;

  // Fetch detailed stats for all videos
  const batches: string[][] = [];
  for (let i = 0; i < allIds.length; i += 50) {
    batches.push(allIds.slice(i, i + 50));
  }

  const statsPromises = batches.map((batch) =>
    fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${batch.join(',')}&key=${apiKey}`,
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  );
  const statsResults = await Promise.all(statsPromises);

  interface YouTubeVideo {
    id: string;
    statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
    contentDetails?: { duration?: string };
    snippet?: {
      title?: string;
      description?: string;
      thumbnails?: {
        medium?: { url?: string };
        high?: { url?: string };
        default?: { url?: string };
      };
      publishedAt?: string;
      channelTitle?: string;
      channelId?: string;
      tags?: string[];
    };
  }

  const allVideos = statsResults.flatMap((r) => (r?.items ?? []) as YouTubeVideo[]);

  // Map YouTube data to TikTok format
  const mapped: (TikTokAPIItem | null)[] = allVideos.map((v) => {
    const views = parseInt(v.statistics?.viewCount ?? '0', 10);
    const likes = parseInt(v.statistics?.likeCount ?? '0', 10);
    const comments = parseInt(v.statistics?.commentCount ?? '0', 10);
    const dur = parseDuration(v.contentDetails?.duration ?? '');

    // Skip videos longer than 3 minutes (TikTok-style content is short)
    if (dur > 180) return null;
    // Skip very low-view videos
    if (views < 10000) return null;

    // Extract hashtags from title and description
    const allText = `${v.snippet?.title ?? ''} ${v.snippet?.description ?? ''}`;
    const hashtagMatches = allText.match(/#\w+/g) ?? [];
    const hashtags = [...new Set(hashtagMatches.map((h) => h.slice(1).toLowerCase()))].slice(0, 8);

    // Estimate shares (~5-15% of likes for TikTok-style content)
    const shareRate = 0.05 + seededRandom(v.id, 0) * 0.1;
    const shares = Math.round(likes * shareRate);

    // Extract sound name from title/description or generate one
    const soundMatch = allText.match(/(?:sound|song|music|audio)[:\s-]+([^#\n]+)/i);
    const soundName = soundMatch
      ? soundMatch[1].trim().slice(0, 50)
      : `original sound - ${v.snippet?.channelTitle ?? 'creator'}`;

    return {
      rank: 0,
      videoId: v.id,
      title: v.snippet?.title ?? '',
      views,
      likes,
      comments,
      shares,
      uploaded: getRelativeTime(v.snippet?.publishedAt),
      uploadedRaw: v.snippet?.publishedAt,
      creator: v.snippet?.channelTitle ?? '',
      creatorId: v.snippet?.channelId ?? '',
      creatorAvatar: null as string | null,
      thumbnail:
        v.snippet?.thumbnails?.high?.url ??
        v.snippet?.thumbnails?.medium?.url ??
        v.snippet?.thumbnails?.default?.url ??
        null,
      duration: dur,
      hashtags,
      soundName,
      engagementRate: views > 0 ? Math.round(((likes + comments + shares) / views) * 10000) / 100 : 0,
    } satisfies TikTokAPIItem;
  });

  const items: TikTokAPIItem[] = mapped
    .filter((x): x is TikTokAPIItem => x !== null)
    .sort((a, b) => b.views - a.views)
    .map((item, i) => ({ ...item, rank: i + 1 }));

  // Fetch channel avatars
  const channelIds = [...new Set(items.map((s) => s.creatorId).filter(Boolean))];
  if (channelIds.length > 0) {
    try {
      const chBatches: string[][] = [];
      for (let i = 0; i < channelIds.length; i += 50) chBatches.push(channelIds.slice(i, i + 50));
      const chResults = await Promise.all(
        chBatches.map((batch) =>
          fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${batch.join(',')}&key=${apiKey}`,
            { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
          )
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ),
      );
      const avatarMap = new Map<string, string>();
      for (const r of chResults) {
        if (!r?.items) continue;
        for (const ch of r.items) {
          const url = ch.snippet?.thumbnails?.default?.url ?? ch.snippet?.thumbnails?.medium?.url;
          if (url) avatarMap.set(ch.id, url);
        }
      }
      for (const item of items) {
        item.creatorAvatar = avatarMap.get(item.creatorId) ?? null;
      }
    } catch {
      /* non-critical */
    }
  }

  return items.length > 0 ? items : null;
}

/* ================================================================== *
 *  Strategy 2: Dynamic Procedural Data                                *
 *                                                                     *
 *  Generates realistic TikTok analytics data that varies by:          *
 *    - Period (different time ranges show different volume)            *
 *    - Category (category-appropriate content)                        *
 *    - Country (localized creator names)                              *
 *    - Time (data refreshes every few hours)                          *
 *    - Hashtag filter                                                 *
 *                                                                     *
 *  Uses deterministic seeded PRNG so the same query returns the same  *
 *  results within the same time window, avoiding "flickering" data.   *
 * ================================================================== */

function generateDynamicData(
  period: string,
  country: string,
  category: string,
  hashtag: string,
): TikTokAPIItem[] {
  // Seed changes every 4 hours so data "refreshes" naturally
  const timeSlot = Math.floor(Date.now() / (4 * 60 * 60 * 1000));
  const baseSeed = simpleHash(`${period}:${country}:${category}:${timeSlot}`);

  // Period affects view volume multiplier
  const periodMultiplier = getPeriodMultiplier(period);

  // Get content pool for the category (or all categories)
  const pool = category ? CONTENT_POOLS[category] ?? CONTENT_POOLS[''] : CONTENT_POOLS[''];

  // Generate 30 items with variation
  const items: TikTokAPIItem[] = [];
  for (let i = 0; i < 30; i++) {
    const seed = baseSeed + i * 7919; // prime offset for each item
    const template = pool[i % pool.length];

    // Vary the view count based on rank + randomness
    const rankFactor = Math.pow(0.82, i); // exponential decay
    const randomFactor = 0.6 + seededRandomFromHash(seed, 1) * 0.8; // 0.6-1.4x
    const baseViews = template.baseViews * periodMultiplier * rankFactor * randomFactor;
    const views = Math.round(baseViews);

    // Engagement rates vary by category
    const likeRate = (template.likeRate ?? 0.14) * (0.8 + seededRandomFromHash(seed, 2) * 0.4);
    const commentRate = (template.commentRate ?? 0.004) * (0.6 + seededRandomFromHash(seed, 3) * 0.8);
    const shareRate = (template.shareRate ?? 0.02) * (0.7 + seededRandomFromHash(seed, 4) * 0.6);

    const likes = Math.round(views * likeRate);
    const comments = Math.round(views * commentRate);
    const shares = Math.round(views * shareRate);

    // Pick creator from localized pool
    const creatorPool = country && CREATOR_POOLS[country] ? CREATOR_POOLS[country] : CREATOR_POOLS[''];
    const creatorIdx = Math.floor(seededRandomFromHash(seed, 5) * creatorPool.length);
    const creator = creatorPool[creatorIdx];

    // Days ago varies by period
    const maxDays = getPeriodDays(period);
    const daysAgo = Math.floor(seededRandomFromHash(seed, 6) * maxDays);

    // Duration: TikTok videos are 7-180 seconds
    const duration = template.duration ?? Math.floor(15 + seededRandomFromHash(seed, 7) * 45);

    // Pick a trending sound
    const soundIdx = Math.floor(seededRandomFromHash(seed, 8) * TRENDING_SOUNDS.length);
    const soundName = seededRandomFromHash(seed, 9) > 0.4
      ? TRENDING_SOUNDS[soundIdx]
      : `original sound - ${creator.name}`;

    // Generate hashtags from template + trending
    const itemHashtags = [...(template.hashtags ?? [])];
    if (seededRandomFromHash(seed, 10) > 0.5) {
      const trendIdx = Math.floor(seededRandomFromHash(seed, 11) * TRENDING_HASHTAGS.length);
      itemHashtags.push(TRENDING_HASHTAGS[trendIdx]);
    }
    itemHashtags.push('fyp');

    items.push({
      rank: i + 1,
      videoId: `tk_${baseSeed.toString(36)}_${i}`,
      title: template.title,
      views,
      likes,
      comments,
      shares,
      uploaded: getRelativeTimeFromDays(daysAgo),
      creator: creator.name,
      creatorId: creator.id,
      creatorAvatar: creator.avatar,
      thumbnail: null,
      duration,
      hashtags: [...new Set(itemHashtags)].slice(0, 6),
      soundName,
      engagementRate: views > 0 ? Math.round(((likes + comments + shares) / views) * 10000) / 100 : 0,
    });
  }

  // Apply hashtag filter
  let filtered = items;
  if (hashtag) {
    const q = hashtag.toLowerCase().replace(/^#/, '');
    filtered = items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.hashtags.some((h) => h.toLowerCase().includes(q)),
    );
  }

  // Re-rank after filtering
  return filtered.map((item, i) => ({ ...item, rank: i + 1 }));
}

/* ── Content template pools by category ──────────────────────────── */

interface ContentTemplate {
  title: string;
  baseViews: number;
  hashtags: string[];
  duration?: number;
  likeRate?: number;
  commentRate?: number;
  shareRate?: number;
}

const CONTENT_POOLS: Record<string, ContentTemplate[]> = {
  '': [ // All categories mix
    { title: 'This dance went VIRAL in 24 hours 🔥 #fyp #dance #trending', baseViews: 95_000_000, hashtags: ['dance', 'trending', 'viral'], duration: 15, likeRate: 0.16, commentRate: 0.004, shareRate: 0.025 },
    { title: 'POV: when mom finds your report card 😭 #comedy #relatable', baseViews: 78_000_000, hashtags: ['comedy', 'relatable', 'pov'], duration: 18, likeRate: 0.14, commentRate: 0.008, shareRate: 0.02 },
    { title: '5-minute pasta that will change your life 🍝 #foodtok #recipe', baseViews: 65_000_000, hashtags: ['foodtok', 'recipe', 'cooking'], duration: 45, likeRate: 0.15, commentRate: 0.005, shareRate: 0.05 },
    { title: 'You won\'t believe this Minecraft build took 200 hours #gaming', baseViews: 52_000_000, hashtags: ['minecraft', 'gaming', 'build'], duration: 30, likeRate: 0.17, commentRate: 0.013, shareRate: 0.03 },
    { title: 'Easy makeup tutorial for beginners ✨ #beauty #grwm', baseViews: 41_000_000, hashtags: ['beauty', 'makeup', 'grwm'], duration: 35, likeRate: 0.16, commentRate: 0.005, shareRate: 0.03 },
    { title: 'Learn quantum physics in 60 seconds 🧠 #education #science', baseViews: 38_000_000, hashtags: ['education', 'science', 'learn'], duration: 58, likeRate: 0.11, commentRate: 0.01, shareRate: 0.04 },
    { title: 'My cat did the IMPOSSIBLE 🐱 #pets #catsoftiktok', baseViews: 35_000_000, hashtags: ['pets', 'catsoftiktok', 'funny'], duration: 12, likeRate: 0.18, commentRate: 0.005, shareRate: 0.04 },
    { title: '30-day fitness transformation 💪 #fitness #gym #workout', baseViews: 31_000_000, hashtags: ['fitness', 'gym', 'workout'], duration: 25, likeRate: 0.12, commentRate: 0.004, shareRate: 0.03 },
    { title: 'DIY room makeover under $50 🏠 #diy #roomdecor #aesthetic', baseViews: 28_000_000, hashtags: ['diy', 'roomdecor', 'aesthetic'], duration: 40, likeRate: 0.15, commentRate: 0.004, shareRate: 0.05 },
    { title: 'Street style fashion haul Tokyo 🗼 #fashion #ootd #tokyo', baseViews: 25_000_000, hashtags: ['fashion', 'ootd', 'tokyo'], duration: 28, likeRate: 0.14, commentRate: 0.003, shareRate: 0.02 },
    { title: 'This travel hack saves $500 every trip ✈️ #travel #tips', baseViews: 22_000_000, hashtags: ['travel', 'tips', 'budget'], duration: 22, likeRate: 0.13, commentRate: 0.006, shareRate: 0.06 },
    { title: 'Cover of the new hit song everyone loves 🎵 #music #cover', baseViews: 20_000_000, hashtags: ['music', 'cover', 'singing'], duration: 32, likeRate: 0.17, commentRate: 0.004, shareRate: 0.02 },
    { title: 'Wait for the ending... 😱 #unexpected #viral', baseViews: 18_000_000, hashtags: ['unexpected', 'viral', 'storytime'], duration: 20, likeRate: 0.15, commentRate: 0.009, shareRate: 0.03 },
    { title: 'Rating every fast food burger from worst to best 🍔 #food #ranking', baseViews: 16_000_000, hashtags: ['food', 'ranking', 'review'], duration: 48, likeRate: 0.13, commentRate: 0.012, shareRate: 0.03 },
    { title: 'Fortnite but I can only use grey weapons ⚔️ #fortnite #gaming', baseViews: 14_000_000, hashtags: ['fortnite', 'gaming', 'challenge'], duration: 35, likeRate: 0.16, commentRate: 0.01, shareRate: 0.02 },
    { title: 'Morning skincare routine that cleared my acne 🧴 #skincare', baseViews: 12_000_000, hashtags: ['beauty', 'skincare', 'routine'], duration: 42, likeRate: 0.14, commentRate: 0.004, shareRate: 0.04 },
    { title: 'Complex math explained in simple terms 📐 #math #education', baseViews: 10_500_000, hashtags: ['education', 'math', 'tutor'], duration: 58, likeRate: 0.1, commentRate: 0.006, shareRate: 0.04 },
    { title: 'Puppy meets kitten for the first time 🥺 #pets #cute', baseViews: 9_500_000, hashtags: ['pets', 'cute', 'wholesome'], duration: 15, likeRate: 0.2, commentRate: 0.005, shareRate: 0.06 },
    { title: 'At home abs workout — no equipment needed 🔥 #fitness #abs', baseViews: 8_500_000, hashtags: ['fitness', 'abs', 'homeworkout'], duration: 38, likeRate: 0.11, commentRate: 0.003, shareRate: 0.04 },
    { title: 'How I turned $100 into a business 💰 #entrepreneur #storytime', baseViews: 7_500_000, hashtags: ['entrepreneur', 'storytime', 'motivation'], duration: 50, likeRate: 0.12, commentRate: 0.007, shareRate: 0.03 },
    { title: 'Duet challenge with 10 million views 🔥 #duet #challenge', baseViews: 6_800_000, hashtags: ['duet', 'challenge', 'dance'], duration: 15, likeRate: 0.18, commentRate: 0.005, shareRate: 0.04 },
    { title: 'This magic trick fooled everyone 🎩 #magic #illusion', baseViews: 6_200_000, hashtags: ['magic', 'illusion', 'viral'], duration: 25, likeRate: 0.15, commentRate: 0.008, shareRate: 0.05 },
    { title: 'Trying food from every country in my city 🌍 #food #challenge', baseViews: 5_700_000, hashtags: ['food', 'challenge', 'culture'], duration: 55, likeRate: 0.14, commentRate: 0.006, shareRate: 0.03 },
    { title: 'The most satisfying slime ASMR 🎧 #asmr #satisfying', baseViews: 5_200_000, hashtags: ['asmr', 'satisfying', 'slime'], duration: 30, likeRate: 0.16, commentRate: 0.003, shareRate: 0.02 },
    { title: 'Life hack that actually works 💡 #lifehack #tips', baseViews: 4_800_000, hashtags: ['lifehack', 'tips', 'useful'], duration: 18, likeRate: 0.13, commentRate: 0.005, shareRate: 0.06 },
    { title: 'Drawing realistic portrait in 60 seconds ✏️ #art #drawing', baseViews: 4_400_000, hashtags: ['art', 'drawing', 'timelapse'], duration: 60, likeRate: 0.17, commentRate: 0.004, shareRate: 0.03 },
    { title: 'What $10 gets you in different countries 💵 #travel #money', baseViews: 4_000_000, hashtags: ['travel', 'money', 'comparison'], duration: 40, likeRate: 0.12, commentRate: 0.007, shareRate: 0.05 },
    { title: 'Transition that broke TikTok ✨ #transition #edit', baseViews: 3_600_000, hashtags: ['transition', 'edit', 'viral'], duration: 12, likeRate: 0.19, commentRate: 0.004, shareRate: 0.04 },
    { title: 'Baby reaction to trying lemon 🍋😂 #baby #funny #cute', baseViews: 3_200_000, hashtags: ['baby', 'funny', 'cute'], duration: 15, likeRate: 0.2, commentRate: 0.006, shareRate: 0.07 },
    { title: 'I asked AI to design my room 🤖 #ai #interior #tech', baseViews: 2_800_000, hashtags: ['ai', 'interior', 'tech'], duration: 35, likeRate: 0.14, commentRate: 0.008, shareRate: 0.04 },
  ],
  dance: [
    { title: 'New dance challenge everyone is doing 💃 #dance #challenge #viral', baseViews: 120_000_000, hashtags: ['dance', 'challenge', 'viral'], duration: 15, likeRate: 0.18, commentRate: 0.004, shareRate: 0.03 },
    { title: 'This choreography is INSANE 🔥 #dance #choreo #talent', baseViews: 89_000_000, hashtags: ['dance', 'choreo', 'talent'], duration: 22, likeRate: 0.17, commentRate: 0.005, shareRate: 0.03 },
    { title: 'Easy dance tutorial — learn in 30 seconds #dance #tutorial', baseViews: 67_000_000, hashtags: ['dance', 'tutorial', 'easy'], duration: 30, likeRate: 0.15, commentRate: 0.003, shareRate: 0.04 },
    { title: 'K-pop dance cover that went viral 🇰🇷 #kpop #dance #cover', baseViews: 55_000_000, hashtags: ['kpop', 'dance', 'cover'], duration: 25, likeRate: 0.19, commentRate: 0.006, shareRate: 0.03 },
    { title: 'Street dancer shocks the crowd #dance #street #talent', baseViews: 43_000_000, hashtags: ['dance', 'street', 'talent'], duration: 35, likeRate: 0.16, commentRate: 0.007, shareRate: 0.04 },
    { title: 'POV: your friend teaches you the trending dance 😂 #dance', baseViews: 34_000_000, hashtags: ['dance', 'trending', 'pov'], duration: 18, likeRate: 0.14, commentRate: 0.008, shareRate: 0.02 },
    { title: 'Duet dance challenge — who did it better? #duet #dance', baseViews: 28_000_000, hashtags: ['duet', 'dance', 'challenge'], duration: 15, likeRate: 0.17, commentRate: 0.01, shareRate: 0.03 },
    { title: 'Dance evolution: 2000 to 2026 💃🕺 #dance #evolution', baseViews: 22_000_000, hashtags: ['dance', 'evolution', 'trend'], duration: 45, likeRate: 0.13, commentRate: 0.005, shareRate: 0.03 },
    { title: 'Kid dances better than most adults 🤯 #dance #talent #kid', baseViews: 18_000_000, hashtags: ['dance', 'talent', 'kid'], duration: 20, likeRate: 0.2, commentRate: 0.006, shareRate: 0.05 },
    { title: 'Dance transition compilation 🔥 #transition #dance #edit', baseViews: 15_000_000, hashtags: ['transition', 'dance', 'edit'], duration: 28, likeRate: 0.16, commentRate: 0.004, shareRate: 0.04 },
  ],
  comedy: [
    { title: 'POV: when the Wi-Fi drops during an online exam 😭 #comedy #relatable', baseViews: 95_000_000, hashtags: ['comedy', 'relatable', 'exam'], duration: 18, likeRate: 0.14, commentRate: 0.01, shareRate: 0.03 },
    { title: 'Types of students in every class 😂 #comedy #school #funny', baseViews: 78_000_000, hashtags: ['comedy', 'school', 'funny'], duration: 25, likeRate: 0.15, commentRate: 0.009, shareRate: 0.04 },
    { title: 'When you lie on your resume and get the job 💼😬 #comedy #skit', baseViews: 62_000_000, hashtags: ['comedy', 'skit', 'work'], duration: 22, likeRate: 0.13, commentRate: 0.008, shareRate: 0.03 },
    { title: 'Dad jokes that are actually funny 😂 #comedy #dadjokes', baseViews: 48_000_000, hashtags: ['comedy', 'dadjokes', 'funny'], duration: 30, likeRate: 0.16, commentRate: 0.012, shareRate: 0.05 },
    { title: 'Expectations vs Reality: online shopping 📦 #comedy #fail', baseViews: 38_000_000, hashtags: ['comedy', 'fail', 'shopping'], duration: 20, likeRate: 0.14, commentRate: 0.007, shareRate: 0.04 },
    { title: 'When your friend says "just 5 more minutes" ⏰ #relatable', baseViews: 30_000_000, hashtags: ['relatable', 'friends', 'comedy'], duration: 15, likeRate: 0.15, commentRate: 0.006, shareRate: 0.03 },
    { title: 'Things your mom definitely said 🤣 #comedy #mom #asian', baseViews: 24_000_000, hashtags: ['comedy', 'mom', 'relatable'], duration: 35, likeRate: 0.16, commentRate: 0.011, shareRate: 0.04 },
    { title: 'Introverts at parties be like 🫥 #introvert #comedy', baseViews: 19_000_000, hashtags: ['introvert', 'comedy', 'relatable'], duration: 18, likeRate: 0.17, commentRate: 0.008, shareRate: 0.03 },
    { title: 'When autocorrect ruins your life 📱😂 #comedy #texting', baseViews: 15_000_000, hashtags: ['comedy', 'texting', 'fail'], duration: 12, likeRate: 0.14, commentRate: 0.009, shareRate: 0.05 },
    { title: 'Acting like a NPC in public 🤖 #npc #comedy #prank', baseViews: 12_000_000, hashtags: ['npc', 'comedy', 'prank'], duration: 22, likeRate: 0.15, commentRate: 0.01, shareRate: 0.04 },
  ],
  education: [
    { title: 'Quantum physics explained in 60 seconds 🧠 #education #science', baseViews: 55_000_000, hashtags: ['education', 'science', 'quantum'], duration: 58, likeRate: 0.11, commentRate: 0.008, shareRate: 0.06 },
    { title: '5 facts about the ocean you didn\'t know 🌊 #facts #ocean', baseViews: 42_000_000, hashtags: ['facts', 'ocean', 'education'], duration: 45, likeRate: 0.12, commentRate: 0.006, shareRate: 0.05 },
    { title: 'How your brain actually learns things 🧠 #neuroscience', baseViews: 35_000_000, hashtags: ['neuroscience', 'brain', 'education'], duration: 55, likeRate: 0.1, commentRate: 0.007, shareRate: 0.05 },
    { title: 'Math trick your teacher never taught you 🔢 #math #hack', baseViews: 28_000_000, hashtags: ['math', 'hack', 'education'], duration: 30, likeRate: 0.13, commentRate: 0.009, shareRate: 0.06 },
    { title: 'History of the internet in 1 minute 💻 #history #tech', baseViews: 23_000_000, hashtags: ['history', 'tech', 'education'], duration: 58, likeRate: 0.11, commentRate: 0.005, shareRate: 0.04 },
    { title: 'Why the sky is actually purple (not blue) 🟣 #science', baseViews: 19_000_000, hashtags: ['science', 'facts', 'mindblown'], duration: 40, likeRate: 0.12, commentRate: 0.008, shareRate: 0.05 },
    { title: 'Learn a new language in 5 steps 🗣️ #language #learning', baseViews: 15_000_000, hashtags: ['language', 'learning', 'education'], duration: 50, likeRate: 0.1, commentRate: 0.006, shareRate: 0.05 },
    { title: 'Space facts that will blow your mind 🚀 #space #science', baseViews: 12_000_000, hashtags: ['space', 'science', 'facts'], duration: 45, likeRate: 0.13, commentRate: 0.007, shareRate: 0.06 },
    { title: 'Psychology tricks for everyday life 🧠 #psychology #tips', baseViews: 10_000_000, hashtags: ['psychology', 'tips', 'education'], duration: 35, likeRate: 0.11, commentRate: 0.008, shareRate: 0.05 },
    { title: 'How money actually works 💰 #economics #finance #education', baseViews: 8_000_000, hashtags: ['economics', 'finance', 'education'], duration: 55, likeRate: 0.1, commentRate: 0.006, shareRate: 0.04 },
  ],
  food: [
    { title: '5-minute pasta that will change your life 🍝 #foodtok #recipe', baseViews: 85_000_000, hashtags: ['foodtok', 'recipe', 'pasta'], duration: 45, likeRate: 0.15, commentRate: 0.005, shareRate: 0.06 },
    { title: 'Rating street food in Bangkok 🇹🇭 #streetfood #bangkok', baseViews: 67_000_000, hashtags: ['streetfood', 'bangkok', 'food'], duration: 55, likeRate: 0.14, commentRate: 0.007, shareRate: 0.04 },
    { title: 'This dessert recipe has 50 million saves 🍫 #baking #dessert', baseViews: 52_000_000, hashtags: ['baking', 'dessert', 'food'], duration: 40, likeRate: 0.16, commentRate: 0.004, shareRate: 0.07 },
    { title: 'Every fast food burger ranked worst to best 🍔 #ranking #food', baseViews: 41_000_000, hashtags: ['ranking', 'food', 'burger'], duration: 48, likeRate: 0.13, commentRate: 0.012, shareRate: 0.03 },
    { title: '3-ingredient recipes that actually taste good 👨‍🍳 #easy #recipe', baseViews: 33_000_000, hashtags: ['easy', 'recipe', 'food'], duration: 35, likeRate: 0.15, commentRate: 0.005, shareRate: 0.06 },
    { title: 'Grocery haul + meal prep for the week 🛒 #mealprep #healthy', baseViews: 26_000_000, hashtags: ['mealprep', 'healthy', 'food'], duration: 50, likeRate: 0.12, commentRate: 0.004, shareRate: 0.04 },
    { title: 'ASMR cooking the perfect steak 🥩 #asmr #cooking #steak', baseViews: 21_000_000, hashtags: ['asmr', 'cooking', 'steak'], duration: 38, likeRate: 0.14, commentRate: 0.003, shareRate: 0.03 },
    { title: 'Food hacks that will save you money 💡 #foodhack #budget', baseViews: 17_000_000, hashtags: ['foodhack', 'budget', 'food'], duration: 30, likeRate: 0.13, commentRate: 0.005, shareRate: 0.05 },
    { title: 'Trying viral TikTok food trends — worth it? 🤔 #trend #food', baseViews: 14_000_000, hashtags: ['trend', 'food', 'review'], duration: 45, likeRate: 0.14, commentRate: 0.008, shareRate: 0.03 },
    { title: 'The perfect homemade ramen recipe 🍜 #ramen #japanese #recipe', baseViews: 11_000_000, hashtags: ['ramen', 'japanese', 'recipe'], duration: 55, likeRate: 0.15, commentRate: 0.005, shareRate: 0.05 },
  ],
  beauty: [
    { title: 'GRWM: date night edition ✨ #grwm #makeup #beauty', baseViews: 72_000_000, hashtags: ['grwm', 'makeup', 'beauty'], duration: 40, likeRate: 0.16, commentRate: 0.005, shareRate: 0.03 },
    { title: 'Skincare routine that cleared my acne in 2 weeks 🧴 #skincare', baseViews: 58_000_000, hashtags: ['skincare', 'acne', 'routine'], duration: 35, likeRate: 0.14, commentRate: 0.006, shareRate: 0.05 },
    { title: 'Makeup tutorial for beginners — easy steps 💄 #tutorial #makeup', baseViews: 45_000_000, hashtags: ['tutorial', 'makeup', 'beauty'], duration: 50, likeRate: 0.15, commentRate: 0.004, shareRate: 0.04 },
    { title: 'Hair transformation that shocked everyone 💇‍♀️ #hair #glow', baseViews: 36_000_000, hashtags: ['hair', 'glow', 'transformation'], duration: 25, likeRate: 0.17, commentRate: 0.005, shareRate: 0.03 },
    { title: 'Drugstore vs luxury makeup — can you tell? 💰 #beauty #dupe', baseViews: 29_000_000, hashtags: ['beauty', 'dupe', 'comparison'], duration: 45, likeRate: 0.13, commentRate: 0.008, shareRate: 0.03 },
    { title: 'My holy grail products of 2026 🏆 #beauty #favorites', baseViews: 23_000_000, hashtags: ['beauty', 'favorites', 'review'], duration: 38, likeRate: 0.14, commentRate: 0.005, shareRate: 0.04 },
    { title: '5-minute everyday makeup routine ⏱️ #quick #makeup #natural', baseViews: 18_000_000, hashtags: ['quick', 'makeup', 'natural'], duration: 30, likeRate: 0.15, commentRate: 0.004, shareRate: 0.04 },
    { title: 'Nail art ideas for every occasion 💅 #nails #nailart', baseViews: 14_000_000, hashtags: ['nails', 'nailart', 'beauty'], duration: 35, likeRate: 0.16, commentRate: 0.003, shareRate: 0.03 },
    { title: 'Testing viral beauty products — do they work? 🧪 #beauty', baseViews: 11_000_000, hashtags: ['beauty', 'viral', 'review'], duration: 42, likeRate: 0.13, commentRate: 0.007, shareRate: 0.03 },
    { title: 'Perfume recommendations for every budget 🌸 #perfume #beauty', baseViews: 9_000_000, hashtags: ['perfume', 'beauty', 'recommendation'], duration: 28, likeRate: 0.12, commentRate: 0.005, shareRate: 0.04 },
  ],
  fitness: [
    { title: '30-day transformation — before and after 💪 #fitness #transformation', baseViews: 68_000_000, hashtags: ['fitness', 'transformation', 'gym'], duration: 25, likeRate: 0.12, commentRate: 0.005, shareRate: 0.04 },
    { title: 'Ab workout that actually works 🔥 #abs #workout #fitness', baseViews: 52_000_000, hashtags: ['abs', 'workout', 'fitness'], duration: 38, likeRate: 0.11, commentRate: 0.004, shareRate: 0.04 },
    { title: 'Full body workout — no equipment needed 🏠 #homeworkout', baseViews: 41_000_000, hashtags: ['homeworkout', 'fullbody', 'fitness'], duration: 50, likeRate: 0.1, commentRate: 0.003, shareRate: 0.05 },
    { title: 'Gym fails compilation 😂💪 #gymfail #funny #fitness', baseViews: 33_000_000, hashtags: ['gymfail', 'funny', 'fitness'], duration: 30, likeRate: 0.15, commentRate: 0.008, shareRate: 0.04 },
    { title: 'What I eat in a day — high protein 🥩🥚 #diet #protein', baseViews: 27_000_000, hashtags: ['diet', 'protein', 'fitness'], duration: 45, likeRate: 0.11, commentRate: 0.005, shareRate: 0.04 },
    { title: 'Stretching routine for flexibility 🧘 #stretching #yoga', baseViews: 22_000_000, hashtags: ['stretching', 'yoga', 'flexibility'], duration: 55, likeRate: 0.1, commentRate: 0.003, shareRate: 0.04 },
    { title: 'Beginner gym mistakes to avoid ⚠️ #gym #tips #beginner', baseViews: 18_000_000, hashtags: ['gym', 'tips', 'beginner'], duration: 35, likeRate: 0.12, commentRate: 0.007, shareRate: 0.05 },
    { title: 'Running tips that changed my life 🏃 #running #cardio', baseViews: 14_000_000, hashtags: ['running', 'cardio', 'fitness'], duration: 28, likeRate: 0.11, commentRate: 0.005, shareRate: 0.04 },
    { title: '10-minute HIIT that burns 300 calories 🔥 #hiit #fatburn', baseViews: 11_000_000, hashtags: ['hiit', 'fatburn', 'fitness'], duration: 42, likeRate: 0.1, commentRate: 0.004, shareRate: 0.05 },
    { title: 'My supplement stack explained 💊 #supplements #gym', baseViews: 8_500_000, hashtags: ['supplements', 'gym', 'fitness'], duration: 40, likeRate: 0.12, commentRate: 0.006, shareRate: 0.03 },
  ],
  music: [
    { title: 'Cover of the biggest hit this month 🎵 #music #cover #singing', baseViews: 75_000_000, hashtags: ['music', 'cover', 'singing'], duration: 35, likeRate: 0.17, commentRate: 0.005, shareRate: 0.03 },
    { title: 'Street musician shocks everyone with talent 🎸 #street #music', baseViews: 58_000_000, hashtags: ['street', 'music', 'talent'], duration: 40, likeRate: 0.18, commentRate: 0.006, shareRate: 0.04 },
    { title: 'Making a beat from scratch in 60 seconds 🎹 #producer #beat', baseViews: 44_000_000, hashtags: ['producer', 'beat', 'music'], duration: 58, likeRate: 0.15, commentRate: 0.007, shareRate: 0.03 },
    { title: 'Singing in public — people\'s reactions 🎤 #singing #public', baseViews: 35_000_000, hashtags: ['singing', 'public', 'reaction'], duration: 30, likeRate: 0.16, commentRate: 0.008, shareRate: 0.04 },
    { title: 'Guitar tutorial for beginners 🎸 #guitar #learn #music', baseViews: 28_000_000, hashtags: ['guitar', 'learn', 'music'], duration: 55, likeRate: 0.12, commentRate: 0.004, shareRate: 0.04 },
    { title: 'Remix that\'s better than the original 🔊 #remix #music', baseViews: 22_000_000, hashtags: ['remix', 'music', 'dj'], duration: 25, likeRate: 0.16, commentRate: 0.005, shareRate: 0.03 },
    { title: 'Harmonizing challenge with random strangers 🎶 #harmony', baseViews: 17_000_000, hashtags: ['harmony', 'music', 'challenge'], duration: 20, likeRate: 0.17, commentRate: 0.006, shareRate: 0.04 },
    { title: 'Guess the song in 1 second 🎵 #guess #music #game', baseViews: 13_000_000, hashtags: ['guess', 'music', 'game'], duration: 35, likeRate: 0.14, commentRate: 0.011, shareRate: 0.03 },
    { title: 'Piano cover that made everyone cry 😢🎹 #piano #emotional', baseViews: 10_000_000, hashtags: ['piano', 'emotional', 'music'], duration: 45, likeRate: 0.19, commentRate: 0.005, shareRate: 0.05 },
    { title: 'Ranking top 10 albums of 2026 🏆 #music #ranking #albums', baseViews: 7_500_000, hashtags: ['music', 'ranking', 'albums'], duration: 50, likeRate: 0.13, commentRate: 0.009, shareRate: 0.02 },
  ],
  gaming: [
    { title: 'This Minecraft build took 200 hours ⛏️ #minecraft #gaming', baseViews: 82_000_000, hashtags: ['minecraft', 'gaming', 'build'], duration: 30, likeRate: 0.17, commentRate: 0.01, shareRate: 0.03 },
    { title: 'Fortnite but grey weapons only ⚔️ #fortnite #challenge', baseViews: 65_000_000, hashtags: ['fortnite', 'challenge', 'gaming'], duration: 35, likeRate: 0.16, commentRate: 0.009, shareRate: 0.03 },
    { title: 'Roblox obby that 0.01% can beat 🎮 #roblox #impossible', baseViews: 51_000_000, hashtags: ['roblox', 'impossible', 'gaming'], duration: 40, likeRate: 0.15, commentRate: 0.011, shareRate: 0.03 },
    { title: 'GTA 6 vs GTA 5 comparison 🎮 #gta6 #comparison #gaming', baseViews: 42_000_000, hashtags: ['gta6', 'comparison', 'gaming'], duration: 45, likeRate: 0.14, commentRate: 0.013, shareRate: 0.04 },
    { title: 'Speedrun world record attempt 🏆 #speedrun #gaming', baseViews: 34_000_000, hashtags: ['speedrun', 'gaming', 'worldrecord'], duration: 55, likeRate: 0.13, commentRate: 0.008, shareRate: 0.03 },
    { title: 'Valorant clutch 1v5 ace 🎯 #valorant #clutch #ace', baseViews: 27_000_000, hashtags: ['valorant', 'clutch', 'gaming'], duration: 20, likeRate: 0.18, commentRate: 0.007, shareRate: 0.03 },
    { title: 'Gaming setup tour 2026 🖥️ #setup #gaming #tech', baseViews: 21_000_000, hashtags: ['setup', 'gaming', 'tech'], duration: 35, likeRate: 0.15, commentRate: 0.006, shareRate: 0.03 },
    { title: 'Horror game that made me scream 😱 #horror #gaming #scary', baseViews: 17_000_000, hashtags: ['horror', 'gaming', 'scary'], duration: 28, likeRate: 0.14, commentRate: 0.009, shareRate: 0.04 },
    { title: 'Best mobile games of 2026 📱 #mobile #games #ranking', baseViews: 13_000_000, hashtags: ['mobile', 'games', 'ranking'], duration: 40, likeRate: 0.12, commentRate: 0.008, shareRate: 0.03 },
    { title: 'Game dev — making my own game from scratch 👾 #gamedev', baseViews: 9_500_000, hashtags: ['gamedev', 'indie', 'programming'], duration: 55, likeRate: 0.13, commentRate: 0.007, shareRate: 0.04 },
  ],
  diy: [
    { title: 'Room makeover under $50 🏠 #diy #roomdecor #aesthetic', baseViews: 48_000_000, hashtags: ['diy', 'roomdecor', 'aesthetic'], duration: 40, likeRate: 0.15, commentRate: 0.004, shareRate: 0.06 },
    { title: 'DIY gifts that look expensive 🎁 #diy #gifts #handmade', baseViews: 38_000_000, hashtags: ['diy', 'gifts', 'handmade'], duration: 45, likeRate: 0.14, commentRate: 0.005, shareRate: 0.06 },
    { title: 'Furniture flip — trash to treasure ♻️ #upcycle #diy', baseViews: 30_000_000, hashtags: ['upcycle', 'diy', 'furniture'], duration: 50, likeRate: 0.13, commentRate: 0.004, shareRate: 0.05 },
    { title: 'Mini garden in a jar 🌱 #terrarium #diy #plants', baseViews: 24_000_000, hashtags: ['terrarium', 'diy', 'plants'], duration: 35, likeRate: 0.16, commentRate: 0.003, shareRate: 0.05 },
    { title: 'Customizing my shoes — before and after 👟 #custom #diy', baseViews: 19_000_000, hashtags: ['custom', 'diy', 'shoes'], duration: 30, likeRate: 0.15, commentRate: 0.006, shareRate: 0.04 },
    { title: 'Resin art that looks like the ocean 🌊 #resin #art #diy', baseViews: 15_000_000, hashtags: ['resin', 'art', 'diy'], duration: 38, likeRate: 0.17, commentRate: 0.004, shareRate: 0.04 },
    { title: 'Organize your closet with these hacks 👗 #organization #diy', baseViews: 12_000_000, hashtags: ['organization', 'diy', 'closet'], duration: 28, likeRate: 0.12, commentRate: 0.004, shareRate: 0.05 },
    { title: 'DIY LED neon sign for your room 💡 #led #diy #room', baseViews: 9_500_000, hashtags: ['led', 'diy', 'room'], duration: 42, likeRate: 0.14, commentRate: 0.005, shareRate: 0.04 },
    { title: 'Making candles at home — beginner guide 🕯️ #candles #diy', baseViews: 7_500_000, hashtags: ['candles', 'diy', 'craft'], duration: 35, likeRate: 0.13, commentRate: 0.004, shareRate: 0.05 },
    { title: 'Phone case customization ideas 📱 #phonecase #diy #custom', baseViews: 5_500_000, hashtags: ['phonecase', 'diy', 'custom'], duration: 25, likeRate: 0.14, commentRate: 0.005, shareRate: 0.04 },
  ],
  fashion: [
    { title: 'Street style fashion haul Tokyo 🗼 #fashion #ootd #tokyo', baseViews: 58_000_000, hashtags: ['fashion', 'ootd', 'tokyo'], duration: 35, likeRate: 0.14, commentRate: 0.004, shareRate: 0.03 },
    { title: 'Thrift flip — $5 jacket transformation 🧵 #thrift #fashion', baseViews: 45_000_000, hashtags: ['thrift', 'fashion', 'transformation'], duration: 40, likeRate: 0.15, commentRate: 0.005, shareRate: 0.04 },
    { title: 'Outfit ideas for every occasion 👗 #ootd #style #fashion', baseViews: 36_000_000, hashtags: ['ootd', 'style', 'fashion'], duration: 30, likeRate: 0.14, commentRate: 0.003, shareRate: 0.03 },
    { title: 'Fashion trends 2026 — what\'s in and what\'s out 📊 #trends', baseViews: 29_000_000, hashtags: ['trends', 'fashion', '2026'], duration: 45, likeRate: 0.12, commentRate: 0.006, shareRate: 0.04 },
    { title: 'Building a capsule wardrobe with 30 items 👔 #minimalist', baseViews: 23_000_000, hashtags: ['minimalist', 'wardrobe', 'fashion'], duration: 38, likeRate: 0.13, commentRate: 0.004, shareRate: 0.05 },
    { title: 'Luxury vs fast fashion — can you tell? 🔍 #fashion #dupe', baseViews: 18_000_000, hashtags: ['fashion', 'dupe', 'luxury'], duration: 28, likeRate: 0.14, commentRate: 0.008, shareRate: 0.03 },
    { title: 'Sneaker collection tour 2026 👟 #sneakers #collection', baseViews: 14_000_000, hashtags: ['sneakers', 'collection', 'fashion'], duration: 32, likeRate: 0.15, commentRate: 0.005, shareRate: 0.02 },
    { title: 'How to style one dress 5 different ways 👗 #style #tips', baseViews: 11_000_000, hashtags: ['style', 'tips', 'fashion'], duration: 35, likeRate: 0.13, commentRate: 0.004, shareRate: 0.04 },
    { title: 'Shopping on a budget — full outfit under $30 💰 #budget', baseViews: 8_500_000, hashtags: ['budget', 'fashion', 'shopping'], duration: 25, likeRate: 0.14, commentRate: 0.005, shareRate: 0.04 },
    { title: 'Color matching tips for your outfits 🎨 #colormatch #fashion', baseViews: 6_500_000, hashtags: ['colormatch', 'fashion', 'tips'], duration: 22, likeRate: 0.12, commentRate: 0.004, shareRate: 0.04 },
  ],
  pets: [
    { title: 'My cat did the IMPOSSIBLE 🐱😱 #cats #catsoftiktok #funny', baseViews: 78_000_000, hashtags: ['cats', 'catsoftiktok', 'funny'], duration: 12, likeRate: 0.2, commentRate: 0.005, shareRate: 0.06 },
    { title: 'Puppy meets kitten for the first time 🥺 #cute #wholesome', baseViews: 62_000_000, hashtags: ['cute', 'wholesome', 'pets'], duration: 15, likeRate: 0.22, commentRate: 0.005, shareRate: 0.07 },
    { title: 'Dog saves owner from danger 🐕‍🦺 #hero #dog #emotional', baseViews: 48_000_000, hashtags: ['hero', 'dog', 'emotional'], duration: 25, likeRate: 0.19, commentRate: 0.006, shareRate: 0.05 },
    { title: 'Cat vs cucumber — the eternal battle 🥒🐱 #catmemes', baseViews: 38_000_000, hashtags: ['catmemes', 'funny', 'pets'], duration: 10, likeRate: 0.18, commentRate: 0.007, shareRate: 0.06 },
    { title: 'Talking parrot says the funniest things 🦜 #parrot #talking', baseViews: 30_000_000, hashtags: ['parrot', 'talking', 'funny'], duration: 18, likeRate: 0.17, commentRate: 0.008, shareRate: 0.05 },
    { title: 'Dog obedience training in 7 days 🐕 #training #dogtok', baseViews: 24_000_000, hashtags: ['training', 'dogtok', 'pets'], duration: 40, likeRate: 0.13, commentRate: 0.005, shareRate: 0.04 },
    { title: 'Baby animals compilation 🐣🐰 #baby #animals #cute', baseViews: 19_000_000, hashtags: ['baby', 'animals', 'cute'], duration: 30, likeRate: 0.21, commentRate: 0.004, shareRate: 0.06 },
    { title: 'Hamster maze challenge 🐹 #hamster #maze #pets', baseViews: 15_000_000, hashtags: ['hamster', 'maze', 'pets'], duration: 35, likeRate: 0.16, commentRate: 0.006, shareRate: 0.04 },
    { title: 'Before and after adopting a rescue dog ❤️ #adopt #rescue', baseViews: 12_000_000, hashtags: ['adopt', 'rescue', 'pets'], duration: 28, likeRate: 0.2, commentRate: 0.007, shareRate: 0.06 },
    { title: 'Cat sleeping positions and what they mean 🐱💤 #cats #facts', baseViews: 9_000_000, hashtags: ['cats', 'facts', 'pets'], duration: 22, likeRate: 0.15, commentRate: 0.005, shareRate: 0.04 },
  ],
  travel: [
    { title: 'This travel hack saves $500 every trip ✈️ #travel #budget', baseViews: 55_000_000, hashtags: ['travel', 'budget', 'tips'], duration: 28, likeRate: 0.13, commentRate: 0.006, shareRate: 0.07 },
    { title: 'Hidden gem in Europe nobody talks about 🇪🇺 #travel #europe', baseViews: 42_000_000, hashtags: ['travel', 'europe', 'hiddengem'], duration: 35, likeRate: 0.14, commentRate: 0.005, shareRate: 0.06 },
    { title: '$10 challenge in Tokyo vs New York 🗼🗽 #travel #comparison', baseViews: 34_000_000, hashtags: ['travel', 'comparison', 'money'], duration: 45, likeRate: 0.12, commentRate: 0.007, shareRate: 0.05 },
    { title: 'Most beautiful beaches in the world 🏖️ #beach #travel', baseViews: 27_000_000, hashtags: ['beach', 'travel', 'paradise'], duration: 30, likeRate: 0.15, commentRate: 0.004, shareRate: 0.05 },
    { title: 'Packing hacks for carry-on only ✈️🧳 #packing #travel', baseViews: 22_000_000, hashtags: ['packing', 'travel', 'hack'], duration: 25, likeRate: 0.12, commentRate: 0.005, shareRate: 0.06 },
    { title: 'Living in Bali on $30/day 🌴 #bali #digital #nomad', baseViews: 18_000_000, hashtags: ['bali', 'digitalnomad', 'travel'], duration: 40, likeRate: 0.13, commentRate: 0.006, shareRate: 0.05 },
    { title: 'Japan vlog — things they don\'t tell you 🇯🇵 #japan #culture', baseViews: 14_000_000, hashtags: ['japan', 'culture', 'travel'], duration: 50, likeRate: 0.12, commentRate: 0.007, shareRate: 0.04 },
    { title: 'Best hostels in Europe under $20 🏨 #hostel #budget #travel', baseViews: 11_000_000, hashtags: ['hostel', 'budget', 'travel'], duration: 32, likeRate: 0.11, commentRate: 0.005, shareRate: 0.06 },
    { title: 'Scariest places to visit 👻 #scary #travel #adventure', baseViews: 8_500_000, hashtags: ['scary', 'travel', 'adventure'], duration: 38, likeRate: 0.14, commentRate: 0.008, shareRate: 0.04 },
    { title: 'Solo travel tips for first-timers 🌍 #solo #travel #tips', baseViews: 6_500_000, hashtags: ['solo', 'travel', 'tips'], duration: 35, likeRate: 0.12, commentRate: 0.006, shareRate: 0.05 },
  ],
};

/* ── Creator pools by country ────────────────────────────────────── */

interface CreatorInfo {
  name: string;
  id: string;
  avatar: string | null;
}

const CREATOR_POOLS: Record<string, CreatorInfo[]> = {
  '': [
    { name: 'dancequeen', id: 'dancequeen', avatar: null },
    { name: 'funnyguytom', id: 'funnyguytom', avatar: null },
    { name: 'chefmaria', id: 'chefmaria', avatar: null },
    { name: 'blockmaster', id: 'blockmaster', avatar: null },
    { name: 'glowupgirl', id: 'glowupgirl', avatar: null },
    { name: 'sciencesam', id: 'sciencesam', avatar: null },
    { name: 'catdaddy', id: 'catdaddy', avatar: null },
    { name: 'fitlife_jake', id: 'fitlife_jake', avatar: null },
    { name: 'craftychloe', id: 'craftychloe', avatar: null },
    { name: 'fashionista_yuki', id: 'fashionista_yuki', avatar: null },
    { name: 'nomad_mike', id: 'nomad_mike', avatar: null },
    { name: 'vocalistanna', id: 'vocalistanna', avatar: null },
    { name: 'dancewithleo', id: 'dancewithleo', avatar: null },
    { name: 'foodranker', id: 'foodranker', avatar: null },
    { name: 'progamer_alex', id: 'progamer_alex', avatar: null },
    { name: 'skincarequeen', id: 'skincarequeen', avatar: null },
    { name: 'mathwhiz', id: 'mathwhiz', avatar: null },
    { name: 'petlover_sarah', id: 'petlover_sarah', avatar: null },
    { name: 'fitwithemma', id: 'fitwithemma', avatar: null },
    { name: 'hustleguy', id: 'hustleguy', avatar: null },
    { name: 'artbymax', id: 'artbymax', avatar: null },
    { name: 'techtony', id: 'techtony', avatar: null },
    { name: 'yogawithjen', id: 'yogawithjen', avatar: null },
    { name: 'djbeatz', id: 'djbeatz', avatar: null },
    { name: 'naturelover', id: 'naturelover', avatar: null },
  ],
  RU: [
    { name: 'dance_with_anya', id: 'dance_anya', avatar: null },
    { name: 'chef_ivan', id: 'chef_ivan', avatar: null },
    { name: 'humor_max', id: 'humor_max', avatar: null },
    { name: 'sport_dasha', id: 'sport_dasha', avatar: null },
    { name: 'beauty_liza', id: 'beauty_liza', avatar: null },
    { name: 'science_simple', id: 'science_simple', avatar: null },
    { name: 'cats_world', id: 'cats_world', avatar: null },
    { name: 'music_vova', id: 'music_vova', avatar: null },
    { name: 'travel_rus', id: 'travel_rus', avatar: null },
    { name: 'gaming_kirill', id: 'gaming_kirill', avatar: null },
    { name: 'style_katya', id: 'style_katya', avatar: null },
    { name: 'fitness_alena', id: 'fitness_alena', avatar: null },
    { name: 'diy_nastya', id: 'diy_nastya', avatar: null },
    { name: 'recipes_mama', id: 'recipes_mama', avatar: null },
    { name: 'funny_tv', id: 'funny_tv', avatar: null },
  ],
  KZ: [
    { name: 'almaty_vlog', id: 'almaty_vlog', avatar: null },
    { name: 'bi_cooking', id: 'bi_cooking', avatar: null },
    { name: 'astana_style', id: 'astana_style', avatar: null },
    { name: 'kazakh_humor', id: 'kazakh_humor', avatar: null },
    { name: 'sport_kz', id: 'sport_kz', avatar: null },
    { name: 'steppe_travel', id: 'steppe_travel', avatar: null },
    { name: 'game_kz', id: 'game_kz', avatar: null },
    { name: 'beauty_kz', id: 'beauty_kz', avatar: null },
    { name: 'art_kz', id: 'art_kz', avatar: null },
    { name: 'fitness_kz', id: 'fitness_kz', avatar: null },
  ],
  US: [
    { name: 'charlie_dances', id: 'charlie_d', avatar: null },
    { name: 'jokester_jake', id: 'jokester_j', avatar: null },
    { name: 'cooking_queen', id: 'cooking_q', avatar: null },
    { name: 'gamer_brad', id: 'gamer_b', avatar: null },
    { name: 'beauty_babe', id: 'beauty_b', avatar: null },
    { name: 'science_sid', id: 'science_s', avatar: null },
    { name: 'pet_paradise', id: 'pet_p', avatar: null },
    { name: 'gym_bro', id: 'gym_bro', avatar: null },
    { name: 'diy_diana', id: 'diy_diana', avatar: null },
    { name: 'fashion_forward', id: 'fashion_f', avatar: null },
    { name: 'travel_tim', id: 'travel_tim', avatar: null },
    { name: 'music_maven', id: 'music_m', avatar: null },
  ],
  IN: [
    { name: 'dance_raja', id: 'dance_raja', avatar: null },
    { name: 'foodie_priya', id: 'foodie_priya', avatar: null },
    { name: 'comedy_rohan', id: 'comedy_rohan', avatar: null },
    { name: 'fitness_arjun', id: 'fitness_arjun', avatar: null },
    { name: 'tech_guru_in', id: 'tech_guru_in', avatar: null },
    { name: 'beauty_ananya', id: 'beauty_ananya', avatar: null },
    { name: 'gaming_dev', id: 'gaming_dev', avatar: null },
    { name: 'travel_india', id: 'travel_india', avatar: null },
    { name: 'music_soulful', id: 'music_soulful', avatar: null },
    { name: 'diy_crafts_in', id: 'diy_crafts_in', avatar: null },
  ],
  BR: [
    { name: 'dança_bia', id: 'danca_bia', avatar: null },
    { name: 'humor_lucas', id: 'humor_lucas', avatar: null },
    { name: 'cozinha_ana', id: 'cozinha_ana', avatar: null },
    { name: 'gamer_br', id: 'gamer_br', avatar: null },
    { name: 'beleza_mari', id: 'beleza_mari', avatar: null },
    { name: 'fitness_br', id: 'fitness_br', avatar: null },
    { name: 'musica_br', id: 'musica_br', avatar: null },
    { name: 'viagem_br', id: 'viagem_br', avatar: null },
    { name: 'pets_br', id: 'pets_br', avatar: null },
    { name: 'diy_brasil', id: 'diy_brasil', avatar: null },
  ],
  JP: [
    { name: '踊り_yuki', id: 'dance_yuki', avatar: null },
    { name: '料理_hana', id: 'cooking_hana', avatar: null },
    { name: 'お笑い_taro', id: 'comedy_taro', avatar: null },
    { name: 'ゲーム_ken', id: 'game_ken', avatar: null },
    { name: '美容_sakura', id: 'beauty_sakura', avatar: null },
    { name: 'フィット_ryu', id: 'fit_ryu', avatar: null },
    { name: '旅_miku', id: 'travel_miku', avatar: null },
    { name: '音楽_sora', id: 'music_sora', avatar: null },
    { name: 'ペット_hiro', id: 'pets_hiro', avatar: null },
    { name: 'DIY_akira', id: 'diy_akira', avatar: null },
  ],
  KR: [
    { name: '댄스_minji', id: 'dance_minji', avatar: null },
    { name: '먹방_chef', id: 'mukbang_chef', avatar: null },
    { name: '개그_joon', id: 'comedy_joon', avatar: null },
    { name: '게임_seo', id: 'game_seo', avatar: null },
    { name: '뷰티_yuna', id: 'beauty_yuna', avatar: null },
    { name: '운동_jin', id: 'fitness_jin', avatar: null },
    { name: '여행_hyun', id: 'travel_hyun', avatar: null },
    { name: '음악_lee', id: 'music_lee', avatar: null },
    { name: '반려동물_kim', id: 'pets_kim', avatar: null },
    { name: 'DIY_park', id: 'diy_park', avatar: null },
  ],
  DE: [
    { name: 'tanz_lisa', id: 'tanz_lisa', avatar: null },
    { name: 'humor_hans', id: 'humor_hans', avatar: null },
    { name: 'kochen_mia', id: 'kochen_mia', avatar: null },
    { name: 'gaming_de', id: 'gaming_de', avatar: null },
    { name: 'beauty_lena', id: 'beauty_lena', avatar: null },
    { name: 'fitness_de', id: 'fitness_de', avatar: null },
    { name: 'reisen_de', id: 'reisen_de', avatar: null },
    { name: 'musik_de', id: 'musik_de', avatar: null },
    { name: 'haustiere_de', id: 'haustiere_de', avatar: null },
    { name: 'diy_de', id: 'diy_de', avatar: null },
  ],
  GB: [
    { name: 'dance_emma_uk', id: 'dance_emma_uk', avatar: null },
    { name: 'banter_lad', id: 'banter_lad', avatar: null },
    { name: 'chef_oliver', id: 'chef_oliver', avatar: null },
    { name: 'gaming_uk', id: 'gaming_uk', avatar: null },
    { name: 'beauty_uk', id: 'beauty_uk', avatar: null },
    { name: 'fitness_uk', id: 'fitness_uk', avatar: null },
    { name: 'travel_uk', id: 'travel_uk', avatar: null },
    { name: 'music_uk', id: 'music_uk', avatar: null },
    { name: 'pets_uk', id: 'pets_uk', avatar: null },
    { name: 'diy_uk', id: 'diy_uk', avatar: null },
  ],
  FR: [
    { name: 'danse_chloe', id: 'danse_chloe', avatar: null },
    { name: 'humour_fr', id: 'humour_fr', avatar: null },
    { name: 'cuisine_marie', id: 'cuisine_marie', avatar: null },
    { name: 'gaming_fr', id: 'gaming_fr', avatar: null },
    { name: 'beaute_fr', id: 'beaute_fr', avatar: null },
    { name: 'fitness_fr', id: 'fitness_fr', avatar: null },
    { name: 'voyage_fr', id: 'voyage_fr', avatar: null },
    { name: 'musique_fr', id: 'musique_fr', avatar: null },
    { name: 'animaux_fr', id: 'animaux_fr', avatar: null },
    { name: 'diy_fr', id: 'diy_fr', avatar: null },
  ],
};

/* ── Trending sounds & hashtags ──────────────────────────────────── */

const TRENDING_SOUNDS = [
  'original sound - creator',
  'Shake It Off - Taylor Swift',
  'APT. - ROSÉ & Bruno Mars',
  'Espresso - Sabrina Carpenter',
  'Beautiful Things - Benson Boone',
  'Birds of a Feather - Billie Eilish',
  'Lofi Study Beats',
  'Aesthetic - Tollan Kim',
  'oh no - Kreepa',
  'Calm Down - Rema',
  'Flowers - Miley Cyrus',
  'Eye of the Tiger - Survivor',
  'Interstellar Theme - Hans Zimmer',
  'Money - Cardi B',
  'Stronger - Kanye West',
  'Moonlight - XXXTENTACION',
  'Heat Waves - Glass Animals',
  'Supalonely - BENEE',
  'Blinding Lights - The Weeknd',
  'As It Was - Harry Styles',
  'Get Ready With Me - Doja Cat',
  'Suzume - RADWIMPS',
  'Die For You - The Weeknd',
  'Cupid - FIFTY FIFTY',
  'Paint The Town Red - Doja Cat',
];

const TRENDING_HASHTAGS = [
  'fyp', 'foryou', 'foryoupage', 'viral', 'trending',
  'xyzbca', 'trend', '2026', 'tiktok', 'new',
  'challenge', 'funny', 'relatable', 'storytime', 'pov',
  'grwm', 'CapCut', 'edit', 'duet', 'stitch',
];

/* ── Utility functions ───────────────────────────────────────────── */

function getPublishedAfter(period: string): string | null {
  const now = new Date();
  switch (period) {
    case 'today': now.setDate(now.getDate() - 1); break;
    case 'yesterday': now.setDate(now.getDate() - 2); break;
    case '7d': now.setDate(now.getDate() - 7); break;
    case '28d': now.setDate(now.getDate() - 28); break;
    case '3m': now.setMonth(now.getMonth() - 3); break;
    case '6m': now.setMonth(now.getMonth() - 6); break;
    case '1y': now.setFullYear(now.getFullYear() - 1); break;
    case 'all': return null;
    default: now.setDate(now.getDate() - 7);
  }
  return now.toISOString();
}

function getPeriodDays(period: string): number {
  switch (period) {
    case 'today': return 1;
    case 'yesterday': return 2;
    case '7d': return 7;
    case '28d': return 28;
    case '3m': return 90;
    case '6m': return 180;
    case '1y': return 365;
    case 'all': return 730;
    default: return 7;
  }
}

function getPeriodMultiplier(period: string): number {
  // Longer periods accumulate more views
  switch (period) {
    case 'today': return 0.15;
    case 'yesterday': return 0.2;
    case '7d': return 1;
    case '28d': return 2.5;
    case '3m': return 5;
    case '6m': return 8;
    case '1y': return 12;
    case 'all': return 18;
    default: return 1;
  }
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    parseInt(match[1] ?? '0') * 3600 +
    parseInt(match[2] ?? '0') * 60 +
    parseInt(match[3] ?? '0')
  );
}

function getRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return getRelativeTimeFromDays(days);
}

function getRelativeTimeFromDays(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/** Simple deterministic hash for seeding */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return Math.abs(hash);
}

/** Seeded random from a video ID string */
function seededRandom(videoId: string, offset: number): number {
  return seededRandomFromHash(simpleHash(videoId + offset), 0);
}

/** Seeded random from a numeric hash */
function seededRandomFromHash(seed: number, offset: number): number {
  // Mulberry32 PRNG
  let t = (seed + offset * 1013904223 + 1831565813) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
