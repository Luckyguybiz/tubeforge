import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/server/db';
import { createLogger } from '@/lib/logger';

const shortsLog = createLogger('shorts-analytics');

const FETCH_TIMEOUT_MS = 10_000;

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
 * The `promoCode` query param is validated against the server-side promo list.
 */
async function hasAnalyticsAccess(
  userId: string,
  plan: string,
  promoCode?: string | null,
): Promise<boolean> {
  // PRO and STUDIO plans always have access
  if (plan === 'PRO' || plan === 'STUDIO') return true;

  // Check promo code server-side
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

// In-memory cache: key = period+country+category, value = { data, timestamp }
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CACHE_MAX_SIZE = 100;

// Periodic cache cleanup: evict expired entries every 10 minutes
const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000;
let lastCacheCleanup = Date.now();

function cleanupCache() {
  const now = Date.now();
  if (now - lastCacheCleanup < CACHE_CLEANUP_INTERVAL && cache.size <= CACHE_MAX_SIZE) return;
  lastCacheCleanup = now;

  // Remove expired entries
  for (const [key, entry] of cache) {
    if (now - entry.ts >= CACHE_TTL) {
      cache.delete(key);
    }
  }

  // If still over limit, evict oldest entries
  if (cache.size > CACHE_MAX_SIZE) {
    const entries = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
    const toDelete = cache.size - CACHE_MAX_SIZE;
    for (let i = 0; i < toDelete; i++) {
      cache.delete(entries[i][0]);
    }
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 5 requests per minute per user
  const { success: rlOk, reset } = await rateLimit({
    identifier: `shorts-analytics:${session.user.id}`,
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
  const game = sp.get('game') ?? '';
  const platformParam = sp.get('platform') ?? 'youtube';
  const limitParam = sp.get('limit');
  const limit = hasPro
    ? (limitParam ? Math.max(1, Math.min(50, parseInt(limitParam, 10) || 50)) : 50)
    : FREE_LIMIT;

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Return mock data if no API key configured
    const mockData = platformParam === 'tiktok' ? getTiktokMockData() : getMockData();
    return NextResponse.json({
      mock: true,
      shorts: mockData.slice(0, limit),
      message: 'YOUTUBE_API_KEY not configured — showing mock data',
    });
  }

  // TikTok analytics: use YouTube search for TikTok content (re-uploaded/viral TikToks)
  const isTiktok = platformParam === 'tiktok';

  const cacheKey = `${platformParam}:${period}:${country}:${category}:${game}`;
  cleanupCache();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    const cachedShorts = Array.isArray(cached.data) ? cached.data.slice(0, limit) : cached.data;
    return NextResponse.json({ mock: false, shorts: cachedShorts, cached: true });
  }

  try {
    const publishedAfter = getPublishedAfter(period);
    const catMap: Record<string, string> = {
      '1': 'movie film', '2': 'cars auto', '10': 'music', '15': 'pets animals',
      '17': 'sports', '20': 'gaming', '22': 'people vlog', '23': 'comedy funny',
      '24': 'entertainment', '25': 'news', '26': 'howto tutorial', '27': 'education', '28': 'science',
    };
    const catKeyword = category ? (catMap[category] ?? '') : '';
    const gameKeyword = game ? game : '';

    // Strategy: run 2 parallel searches for better coverage, then merge & dedupe
    const searchTerm = gameKeyword || catKeyword;
    const queries = isTiktok
      ? [
          `tiktok viral ${searchTerm}`.trim(),
          `#tiktok trending ${searchTerm}`.trim(),
        ]
      : [
          `shorts viral ${searchTerm}`.trim(),
          `#shorts ${searchTerm}`.trim(),
        ];

    const searchPromises = queries.map((q) => {
      const sp = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        videoDuration: 'short',
        order: 'viewCount',
        maxResults: '50',
        q,
        key: apiKey,
      });
      if (publishedAfter) sp.set('publishedAfter', publishedAfter);
      if (country) sp.set('regionCode', country);
      return fetch(`https://www.googleapis.com/youtube/v3/search?${sp}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }).then(r => r.ok ? r.json() : null).catch(() => null);
    });

    const searchResults = await Promise.all(searchPromises);

    // Collect unique video IDs from all searches
    const idSet = new Set<string>();
    for (const data of searchResults) {
      if (!data?.items) continue;
      for (const item of data.items) {
        const vid = (item.id as Record<string, unknown>)?.videoId as string | undefined;
        if (vid) idSet.add(vid);
      }
    }

    const allIds = [...idSet];
    if (allIds.length === 0) {
      return NextResponse.json({ mock: true, shorts: getMockData().slice(0, limit), error: 'No shorts found' });
    }

    // YouTube videos.list accepts max 50 IDs per request — batch if needed
    const batches: string[][] = [];
    for (let i = 0; i < allIds.length; i += 50) {
      batches.push(allIds.slice(i, i + 50));
    }

    const statsPromises = batches.map((batch) =>
      fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${batch.join(',')}&key=${apiKey}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    );
    const statsResults = await Promise.all(statsPromises);

    // Merge all items from batches
    const statsData = { items: statsResults.flatMap(r => r?.items ?? []) };

    interface YouTubeVideo {
      id: string;
      statistics?: { viewCount?: string };
      contentDetails?: { duration?: string };
      snippet?: {
        title?: string;
        thumbnails?: {
          medium?: { url?: string };
          default?: { url?: string };
        };
        publishedAt?: string;
        channelTitle?: string;
        channelId?: string;
      };
    }

    // Step 3: Map and sort by views
    const shorts = ((statsData.items ?? []) as YouTubeVideo[])
      .map((v: YouTubeVideo) => {
        const views = parseInt(v.statistics?.viewCount ?? '0', 10);
        const dur = parseDuration(v.contentDetails?.duration ?? '');
        // videoDuration=short already filters < 4 min; skip very long outliers only
        if (dur > 240) return null;
        return {
          rank: 0,
          videoId: v.id,
          title: v.snippet?.title ?? '',
          thumbnail:
            v.snippet?.thumbnails?.medium?.url ??
            v.snippet?.thumbnails?.default?.url ??
            '',
          views,
          viewsFormatted: views.toLocaleString('en-US').replace(/,/g, ' '),
          uploaded: getRelativeTime(v.snippet?.publishedAt),
          uploadedRaw: v.snippet?.publishedAt,
          channel: v.snippet?.channelTitle ?? '',
          channelId: v.snippet?.channelId ?? '',
          duration: dur,
        };
      })
      .filter(
        (
          x,
        ): x is {
          rank: number;
          videoId: string;
          title: string;
          thumbnail: string;
          views: number;
          viewsFormatted: string;
          uploaded: string;
          uploadedRaw: string | undefined;
          channel: string;
          channelId: string;
          duration: number;
        } => x !== null,
      )
      .sort((a, b) => b.views - a.views)
      .map((item, i) => ({ ...item, rank: i + 1 }));

    // Fetch channel avatars (1 API unit per 50 channels)
    const channelIds = [...new Set(shorts.map(s => s.channelId).filter(Boolean))];
    const avatarMap = new Map<string, string>();
    if (channelIds.length > 0) {
      try {
        const chBatches: string[][] = [];
        for (let i = 0; i < channelIds.length; i += 50) chBatches.push(channelIds.slice(i, i + 50));
        const chResults = await Promise.all(
          chBatches.map(batch =>
            fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${batch.join(',')}&key=${apiKey}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          )
        );
        for (const r of chResults) {
          if (!r?.items) continue;
          for (const ch of r.items) {
            const url = ch.snippet?.thumbnails?.default?.url ?? ch.snippet?.thumbnails?.medium?.url;
            if (url) avatarMap.set(ch.id, url);
          }
        }
      } catch { /* non-critical, skip avatars */ }
    }

    // Attach avatars to shorts
    const shortsWithAvatars = shorts.map(s => ({
      ...s,
      channelAvatar: avatarMap.get(s.channelId) ?? null,
    }));

    // Cache the results and run periodic cleanup
    cache.set(cacheKey, { data: shortsWithAvatars, ts: Date.now() });
    cleanupCache();

    return NextResponse.json({ mock: false, shorts: shortsWithAvatars.slice(0, limit), cached: false });
  } catch (err) {
    shortsLog.error('Fetch error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({
      mock: true,
      shorts: getMockData().slice(0, limit),
      error: 'Failed to fetch',
    });
  }
}

function getPublishedAfter(period: string): string | null {
  const now = new Date();
  switch (period) {
    case 'today':
      now.setDate(now.getDate() - 1);
      break;
    case 'yesterday':
      now.setDate(now.getDate() - 2);
      break;
    case '7d':
      now.setDate(now.getDate() - 7);
      break;
    case '28d':
      now.setDate(now.getDate() - 28);
      break;
    case '3m':
      now.setMonth(now.getMonth() - 3);
      break;
    case '6m':
      now.setMonth(now.getMonth() - 6);
      break;
    case '1y':
      now.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
      return null;
    default:
      now.setDate(now.getDate() - 7);
  }
  return now.toISOString();
}

function parseDuration(iso: string): number {
  // Parse ISO 8601 duration like PT1M30S, PT45S, etc.
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
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function getMockData() {
  return [
    {
      rank: 1,
      videoId: 'mock1',
      title: 'Incredible skateboard trick',
      views: 45234567,
      viewsFormatted: '45,234,567',
      uploaded: '2 days ago',
      channel: 'SkateVibes',
      channelId: '',
      thumbnail: '',
      duration: 30,
    },
    {
      rank: 2,
      videoId: 'mock2',
      title: 'Cat just wanted to sleep, but...',
      views: 38901234,
      viewsFormatted: '38,901,234',
      uploaded: '1 day ago',
      channel: 'PetFun',
      channelId: '',
      thumbnail: '',
      duration: 25,
    },
    {
      rank: 3,
      videoId: 'mock3',
      title: '30-second recipe: pasta carbonara',
      views: 32456789,
      viewsFormatted: '32,456,789',
      uploaded: '3 days ago',
      channel: 'QuickChef',
      channelId: '',
      thumbnail: '',
      duration: 30,
    },
    {
      rank: 4,
      videoId: 'mock4',
      title: 'This voice stunned the entire audience',
      views: 28765432,
      viewsFormatted: '28,765,432',
      uploaded: '5 days ago',
      channel: 'VoiceTalent',
      channelId: '',
      thumbnail: '',
      duration: 45,
    },
    {
      rank: 5,
      videoId: 'mock5',
      title: 'Phone hack you never knew about',
      views: 25123456,
      viewsFormatted: '25,123,456',
      uploaded: '4 days ago',
      channel: 'TechTips',
      channelId: '',
      thumbnail: '',
      duration: 20,
    },
    {
      rank: 6,
      videoId: 'mock6',
      title: 'The dance that blew up TikTok and YouTube',
      views: 22987654,
      viewsFormatted: '22,987,654',
      uploaded: '6 days ago',
      channel: 'DanceWave',
      channelId: '',
      thumbnail: '',
      duration: 35,
    },
    {
      rank: 7,
      videoId: 'mock7',
      title: 'Made an impossible basketball shot',
      views: 19876543,
      viewsFormatted: '19,876,543',
      uploaded: '2 days ago',
      channel: 'SportsKing',
      channelId: '',
      thumbnail: '',
      duration: 15,
    },
    {
      rank: 8,
      videoId: 'mock8',
      title: 'Debunking a popular life hack',
      views: 17654321,
      viewsFormatted: '17,654,321',
      uploaded: '1 day ago',
      channel: 'TruthCheck',
      channelId: '',
      thumbnail: '',
      duration: 40,
    },
    {
      rank: 9,
      videoId: 'mock9',
      title: 'Tried the spiciest food in the world',
      views: 15432100,
      viewsFormatted: '15,432,100',
      uploaded: '3 days ago',
      channel: 'FoodChallenge',
      channelId: '',
      thumbnail: '',
      duration: 50,
    },
    {
      rank: 10,
      videoId: 'mock10',
      title: 'How to earn money on YouTube Shorts',
      views: 14321000,
      viewsFormatted: '14,321,000',
      uploaded: '7 days ago',
      channel: 'CreatorHub',
      channelId: '',
      thumbnail: '',
      duration: 55,
    },
  ];
}

function getTiktokMockData() {
  return [
    { rank: 1, videoId: 'tkmock1', title: 'This trend blew up TikTok in 1 day', views: 89234567, viewsFormatted: '89,234,567', uploaded: '1 day ago', channel: 'TikTokViral', channelId: '', thumbnail: '', duration: 15 },
    { rank: 2, videoId: 'tkmock2', title: 'POV: when mom found your grades', views: 67890123, viewsFormatted: '67,890,123', uploaded: '2 days ago', channel: 'MemeMaster', channelId: '', thumbnail: '', duration: 12 },
    { rank: 3, videoId: 'tkmock3', title: 'Fastest pasta recipe ever #foodtok', views: 45678901, viewsFormatted: '45,678,901', uploaded: '3 days ago', channel: 'FoodTok', channelId: '', thumbnail: '', duration: 30 },
    { rank: 4, videoId: 'tkmock4', title: 'Minecraft but every block = $1', views: 34567890, viewsFormatted: '34,567,890', uploaded: '2 days ago', channel: 'GameClips', channelId: '', thumbnail: '', duration: 25 },
    { rank: 5, videoId: 'tkmock5', title: 'Ranking all ice cream flavors worst to best', views: 28901234, viewsFormatted: '28,901,234', uploaded: '4 days ago', channel: 'RankingKing', channelId: '', thumbnail: '', duration: 45 },
    { rank: 6, videoId: 'tkmock6', title: 'Dance that anyone can repeat', views: 23456789, viewsFormatted: '23,456,789', uploaded: '1 day ago', channel: 'DanceTok', channelId: '', thumbnail: '', duration: 15 },
    { rank: 7, videoId: 'tkmock7', title: 'Phone hack you never knew about', views: 19876543, viewsFormatted: '19,876,543', uploaded: '5 days ago', channel: 'TechTips', channelId: '', thumbnail: '', duration: 20 },
    { rank: 8, videoId: 'tkmock8', title: 'Ranking best Minecraft servers', views: 17654321, viewsFormatted: '17,654,321', uploaded: '3 days ago', channel: 'MCRanking', channelId: '', thumbnail: '', duration: 35 },
    { rank: 9, videoId: 'tkmock9', title: 'This voice stunned everyone on the street', views: 15432100, viewsFormatted: '15,432,100', uploaded: '6 days ago', channel: 'StreetVibes', channelId: '', thumbnail: '', duration: 18 },
    { rank: 10, videoId: 'tkmock10', title: 'How to go viral on TikTok in 2026', views: 12345678, viewsFormatted: '12,345,678', uploaded: '7 days ago', channel: 'CreatorSchool', channelId: '', thumbnail: '', duration: 40 },
  ];
}
