import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';

// In-memory cache: key = period+country+category, value = { data, timestamp }
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

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
  const period = sp.get('period') ?? '7d';
  const country = sp.get('country') ?? '';
  const category = sp.get('category') ?? '';
  const game = sp.get('game') ?? '';
  const limitParam = sp.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(50, parseInt(limitParam, 10) || 50)) : 50;

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Return mock data if no API key configured
    return NextResponse.json({
      mock: true,
      shorts: getMockData().slice(0, limit),
      message: 'YOUTUBE_API_KEY not configured — showing mock data',
    });
  }

  const cacheKey = `${period}:${country}:${category}:${game}`;
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
    const queries = [
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
      return fetch(`https://www.googleapis.com/youtube/v3/search?${sp}`).then(r => r.ok ? r.json() : null);
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
      fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${batch.join(',')}&key=${apiKey}`)
        .then(r => r.ok ? r.json() : null)
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
          viewsFormatted: views.toLocaleString('ru-RU').replace(/,/g, ' '),
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
            fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${batch.join(',')}&key=${apiKey}`)
              .then(r => r.ok ? r.json() : null)
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

    // Cache the results
    cache.set(cacheKey, { data: shortsWithAvatars, ts: Date.now() });

    // Cleanup old cache entries
    if (cache.size > 100) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
      for (let i = 0; i < 50; i++) cache.delete(oldest[i][0]);
    }

    return NextResponse.json({ mock: false, shorts: shortsWithAvatars.slice(0, limit), cached: false });
  } catch (err) {
    console.error('[shorts-analytics] Error:', err);
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
  if (days === 0) return 'сегодня';
  if (days === 1) return '1 день назад';
  if (days < 7) return `${days} дней назад`;
  if (days < 30) return `${Math.floor(days / 7)} нед. назад`;
  if (days < 365) return `${Math.floor(days / 30)} мес. назад`;
  return `${Math.floor(days / 365)} г. назад`;
}

function getMockData() {
  return [
    {
      rank: 1,
      videoId: 'mock1',
      title: 'Невероятный трюк на скейтборде',
      views: 45234567,
      viewsFormatted: '45 234 567',
      uploaded: '2 дня назад',
      channel: 'SkateVibes',
      channelId: '',
      thumbnail: '',
      duration: 30,
    },
    {
      rank: 2,
      videoId: 'mock2',
      title: 'Котик просто захотел поспать, но...',
      views: 38901234,
      viewsFormatted: '38 901 234',
      uploaded: '1 день назад',
      channel: 'PetFun',
      channelId: '',
      thumbnail: '',
      duration: 25,
    },
    {
      rank: 3,
      videoId: 'mock3',
      title: 'Рецепт за 30 секунд: паста карбонара',
      views: 32456789,
      viewsFormatted: '32 456 789',
      uploaded: '3 дня назад',
      channel: 'QuickChef',
      channelId: '',
      thumbnail: '',
      duration: 30,
    },
    {
      rank: 4,
      videoId: 'mock4',
      title: 'Этот голос поразил всех зрителей',
      views: 28765432,
      viewsFormatted: '28 765 432',
      uploaded: '5 дней назад',
      channel: 'VoiceTalent',
      channelId: '',
      thumbnail: '',
      duration: 45,
    },
    {
      rank: 5,
      videoId: 'mock5',
      title: 'Лайфхак с телефоном, который ты не знал',
      views: 25123456,
      viewsFormatted: '25 123 456',
      uploaded: '4 дня назад',
      channel: 'TechTips',
      channelId: '',
      thumbnail: '',
      duration: 20,
    },
    {
      rank: 6,
      videoId: 'mock6',
      title: 'Танец, который взорвал TikTok и YouTube',
      views: 22987654,
      viewsFormatted: '22 987 654',
      uploaded: '6 дней назад',
      channel: 'DanceWave',
      channelId: '',
      thumbnail: '',
      duration: 35,
    },
    {
      rank: 7,
      videoId: 'mock7',
      title: 'Сделал невозможный бросок в баскетбол',
      views: 19876543,
      viewsFormatted: '19 876 543',
      uploaded: '2 дня назад',
      channel: 'SportsKing',
      channelId: '',
      thumbnail: '',
      duration: 15,
    },
    {
      rank: 8,
      videoId: 'mock8',
      title: 'Разоблачение популярного лайфхака',
      views: 17654321,
      viewsFormatted: '17 654 321',
      uploaded: '1 день назад',
      channel: 'TruthCheck',
      channelId: '',
      thumbnail: '',
      duration: 40,
    },
    {
      rank: 9,
      videoId: 'mock9',
      title: 'Попробовал самую острую еду в мире',
      views: 15432100,
      viewsFormatted: '15 432 100',
      uploaded: '3 дня назад',
      channel: 'FoodChallenge',
      channelId: '',
      thumbnail: '',
      duration: 50,
    },
    {
      rank: 10,
      videoId: 'mock10',
      title: 'Как заработать на YouTube Shorts',
      views: 14321000,
      viewsFormatted: '14 321 000',
      uploaded: '7 дней назад',
      channel: 'CreatorHub',
      channelId: '',
      thumbnail: '',
      duration: 55,
    },
  ];
}
