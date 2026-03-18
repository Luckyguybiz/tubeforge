import { NextRequest, NextResponse } from 'next/server';

// In-memory cache: key = period+country+category, value = { data, timestamp }
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const period = sp.get('period') ?? '7d';
  const country = sp.get('country') ?? '';
  const category = sp.get('category') ?? '';

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Return mock data if no API key configured
    return NextResponse.json({
      mock: true,
      shorts: getMockData(),
      message: 'YOUTUBE_API_KEY not configured — showing mock data',
    });
  }

  const cacheKey = `${period}:${country}:${category}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ mock: false, shorts: cached.data, cached: true });
  }

  try {
    // Step 1: Search for popular shorts
    const publishedAfter = getPublishedAfter(period);
    const searchParams = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      videoDuration: 'short',
      order: 'viewCount',
      maxResults: '50',
      q: '#shorts',
      key: apiKey,
    });
    if (publishedAfter) searchParams.set('publishedAfter', publishedAfter);
    if (country) searchParams.set('regionCode', country);
    if (category) searchParams.set('videoCategoryId', category);

    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${searchParams}`,
      { next: { revalidate: 3600 } },
    );
    if (!searchRes.ok) {
      const errText = await searchRes.text().catch(() => '');
      console.error('[shorts-analytics] Search API error:', searchRes.status, errText);
      return NextResponse.json({
        mock: true,
        shorts: getMockData(),
        error: `YouTube API error: ${searchRes.status}`,
        debug: errText.substring(0, 200),
      });
    }
    const searchData = await searchRes.json();
    console.log('[shorts-analytics] Search returned', searchData.items?.length ?? 0, 'items');

    const videoIds = (searchData.items ?? [])
      .map((item: Record<string, unknown>) => {
        const id = item.id as Record<string, unknown> | undefined;
        return id?.videoId;
      })
      .filter(Boolean)
      .join(',');

    if (!videoIds) {
      console.warn('[shorts-analytics] No video IDs found in search results');
      return NextResponse.json({ mock: true, shorts: getMockData(), error: 'No shorts found for this period' });
    }

    // Step 2: Get video statistics (views, duration)
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${apiKey}`,
    );
    if (!statsRes.ok) {
      return NextResponse.json({
        mock: true,
        shorts: getMockData(),
        error: 'Stats API error',
      });
    }
    const statsData = await statsRes.json();

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
        // Only include actual Shorts (< 180 seconds) - YouTube Shorts can be up to 3 min
        if (dur > 180) return null;
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

    // Cache the results
    cache.set(cacheKey, { data: shorts, ts: Date.now() });

    // Cleanup old cache entries
    if (cache.size > 100) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
      for (let i = 0; i < 50; i++) cache.delete(oldest[i][0]);
    }

    return NextResponse.json({ mock: false, shorts, cached: false });
  } catch (err) {
    console.error('[shorts-analytics] Error:', err);
    return NextResponse.json({
      mock: true,
      shorts: getMockData(),
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
