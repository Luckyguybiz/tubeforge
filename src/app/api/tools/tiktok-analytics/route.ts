import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';

// In-memory cache: key = period+country+category+hashtag, value = { data, timestamp }
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
  const period = sp.get('period') ?? '7d';
  const country = sp.get('country') ?? '';
  const category = sp.get('category') ?? '';
  const hashtag = sp.get('hashtag') ?? '';
  const limitParam = sp.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(50, parseInt(limitParam, 10) || 50)) : 50;

  const cacheKey = `tiktok:${period}:${country}:${category}:${hashtag}`;
  cleanupCache();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    const cachedItems = Array.isArray(cached.data) ? cached.data.slice(0, limit) : cached.data;
    return NextResponse.json({ mock: true, items: cachedItems, cached: true });
  }

  // TikTok doesn't have a public API — return realistic mock data
  const mockData = getMockData(category, hashtag);
  cache.set(cacheKey, { data: mockData, ts: Date.now() });

  return NextResponse.json({
    mock: true,
    items: mockData.slice(0, limit),
    message: 'TikTok public API not available — showing mock data',
  });
}

function getRelativeTime(daysAgo: number): string {
  if (daysAgo === 0) return 'today';
  if (daysAgo === 1) return '1 day ago';
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
  return `${Math.floor(daysAgo / 30)} months ago`;
}

function getMockData(category: string, hashtag: string) {
  const allItems = [
    {
      rank: 1,
      videoId: 'tkmock001',
      title: 'This dance went VIRAL in 24 hours #fyp #dance #trending',
      views: 89_234_567,
      likes: 12_450_000,
      comments: 345_000,
      shares: 1_890_000,
      uploaded: getRelativeTime(1),
      creator: 'dancequeen',
      creatorId: 'dancequeen',
      creatorAvatar: null,
      thumbnail: null,
      duration: 15,
      hashtags: ['fyp', 'dance', 'trending'],
      soundName: 'original sound - dancequeen',
    },
    {
      rank: 2,
      videoId: 'tkmock002',
      title: 'POV: when mom finds your report card #comedy #relatable',
      views: 67_890_123,
      likes: 9_876_000,
      comments: 567_000,
      shares: 1_234_000,
      uploaded: getRelativeTime(2),
      creator: 'funnyguytom',
      creatorId: 'funnyguytom',
      creatorAvatar: null,
      thumbnail: null,
      duration: 18,
      hashtags: ['comedy', 'relatable', 'pov'],
      soundName: 'oh no - Kreepa',
    },
    {
      rank: 3,
      videoId: 'tkmock003',
      title: '5-minute pasta that will change your life #foodtok #recipe #cooking',
      views: 45_678_901,
      likes: 6_789_000,
      comments: 234_000,
      shares: 2_345_000,
      uploaded: getRelativeTime(3),
      creator: 'chefmaria',
      creatorId: 'chefmaria',
      creatorAvatar: null,
      thumbnail: null,
      duration: 45,
      hashtags: ['foodtok', 'recipe', 'cooking'],
      soundName: 'Aesthetic - Tollan Kim',
    },
    {
      rank: 4,
      videoId: 'tkmock004',
      title: 'You won\'t believe this Minecraft build took 200 hours #minecraft #gaming',
      views: 34_567_890,
      likes: 5_678_000,
      comments: 456_000,
      shares: 890_000,
      uploaded: getRelativeTime(2),
      creator: 'blockmaster',
      creatorId: 'blockmaster',
      creatorAvatar: null,
      thumbnail: null,
      duration: 30,
      hashtags: ['minecraft', 'gaming', 'build'],
      soundName: 'original sound - blockmaster',
    },
    {
      rank: 5,
      videoId: 'tkmock005',
      title: 'Easy makeup tutorial for beginners #beauty #makeup #grwm',
      views: 28_901_234,
      likes: 4_567_000,
      comments: 189_000,
      shares: 678_000,
      uploaded: getRelativeTime(4),
      creator: 'glowupgirl',
      creatorId: 'glowupgirl',
      creatorAvatar: null,
      thumbnail: null,
      duration: 35,
      hashtags: ['beauty', 'makeup', 'grwm'],
      soundName: 'Get Ready With Me - Doja Cat',
    },
    {
      rank: 6,
      videoId: 'tkmock006',
      title: 'Learn this in 60 seconds: quantum physics explained #education #science',
      views: 23_456_789,
      likes: 3_890_000,
      comments: 345_000,
      shares: 1_567_000,
      uploaded: getRelativeTime(1),
      creator: 'sciencesam',
      creatorId: 'sciencesam',
      creatorAvatar: null,
      thumbnail: null,
      duration: 58,
      hashtags: ['education', 'science', 'learn'],
      soundName: 'Interstellar Theme - Hans Zimmer',
    },
    {
      rank: 7,
      videoId: 'tkmock007',
      title: 'My cat did the IMPOSSIBLE #pets #catsoftiktok #funny',
      views: 19_876_543,
      likes: 3_456_000,
      comments: 234_000,
      shares: 567_000,
      uploaded: getRelativeTime(5),
      creator: 'catdaddy',
      creatorId: 'catdaddy',
      creatorAvatar: null,
      thumbnail: null,
      duration: 12,
      hashtags: ['pets', 'catsoftiktok', 'funny'],
      soundName: 'original sound - catdaddy',
    },
    {
      rank: 8,
      videoId: 'tkmock008',
      title: '30-day fitness transformation results #fitness #gym #workout',
      views: 17_654_321,
      likes: 2_890_000,
      comments: 167_000,
      shares: 456_000,
      uploaded: getRelativeTime(3),
      creator: 'fitlife_jake',
      creatorId: 'fitlife_jake',
      creatorAvatar: null,
      thumbnail: null,
      duration: 25,
      hashtags: ['fitness', 'gym', 'workout'],
      soundName: 'Eye of the Tiger - Survivor',
    },
    {
      rank: 9,
      videoId: 'tkmock009',
      title: 'DIY room makeover under $50 #diy #roomdecor #aesthetic',
      views: 15_432_100,
      likes: 2_345_000,
      comments: 145_000,
      shares: 789_000,
      uploaded: getRelativeTime(6),
      creator: 'craftychloe',
      creatorId: 'craftychloe',
      creatorAvatar: null,
      thumbnail: null,
      duration: 40,
      hashtags: ['diy', 'roomdecor', 'aesthetic'],
      soundName: 'Flowers - Miley Cyrus',
    },
    {
      rank: 10,
      videoId: 'tkmock010',
      title: 'Street style fashion haul Tokyo edition #fashion #ootd #tokyo',
      views: 14_321_000,
      likes: 2_123_000,
      comments: 123_000,
      shares: 345_000,
      uploaded: getRelativeTime(7),
      creator: 'fashionista_yuki',
      creatorId: 'fashionista_yuki',
      creatorAvatar: null,
      thumbnail: null,
      duration: 28,
      hashtags: ['fashion', 'ootd', 'tokyo'],
      soundName: 'original sound - fashionista_yuki',
    },
    {
      rank: 11,
      videoId: 'tkmock011',
      title: 'This travel hack saves $500 every trip #travel #tips #budget',
      views: 12_345_678,
      likes: 1_890_000,
      comments: 112_000,
      shares: 567_000,
      uploaded: getRelativeTime(4),
      creator: 'nomad_mike',
      creatorId: 'nomad_mike',
      creatorAvatar: null,
      thumbnail: null,
      duration: 22,
      hashtags: ['travel', 'tips', 'budget'],
      soundName: 'Around the World - Daft Punk',
    },
    {
      rank: 12,
      videoId: 'tkmock012',
      title: 'Cover of the new hit song everyone is obsessed with #music #cover #singing',
      views: 11_234_567,
      likes: 1_678_000,
      comments: 98_000,
      shares: 234_000,
      uploaded: getRelativeTime(2),
      creator: 'vocalistanna',
      creatorId: 'vocalistanna',
      creatorAvatar: null,
      thumbnail: null,
      duration: 32,
      hashtags: ['music', 'cover', 'singing'],
      soundName: 'original sound - vocalistanna',
    },
    {
      rank: 13,
      videoId: 'tkmock013',
      title: 'Dance tutorial: learn this in 1 minute #dance #tutorial #easy',
      views: 10_123_456,
      likes: 1_456_000,
      comments: 87_000,
      shares: 345_000,
      uploaded: getRelativeTime(5),
      creator: 'dancewithleo',
      creatorId: 'dancewithleo',
      creatorAvatar: null,
      thumbnail: null,
      duration: 55,
      hashtags: ['dance', 'tutorial', 'easy'],
      soundName: 'Shake It Off - Taylor Swift',
    },
    {
      rank: 14,
      videoId: 'tkmock014',
      title: 'Rating every fast food burger from worst to best #food #ranking #review',
      views: 9_876_543,
      likes: 1_234_000,
      comments: 234_000,
      shares: 456_000,
      uploaded: getRelativeTime(3),
      creator: 'foodranker',
      creatorId: 'foodranker',
      creatorAvatar: null,
      thumbnail: null,
      duration: 48,
      hashtags: ['food', 'ranking', 'review'],
      soundName: 'original sound - foodranker',
    },
    {
      rank: 15,
      videoId: 'tkmock015',
      title: 'Fortnite but I can only use grey weapons #fortnite #gaming #challenge',
      views: 8_765_432,
      likes: 1_123_000,
      comments: 178_000,
      shares: 234_000,
      uploaded: getRelativeTime(6),
      creator: 'progamer_alex',
      creatorId: 'progamer_alex',
      creatorAvatar: null,
      thumbnail: null,
      duration: 35,
      hashtags: ['fortnite', 'gaming', 'challenge'],
      soundName: 'original sound - progamer_alex',
    },
    {
      rank: 16,
      videoId: 'tkmock016',
      title: 'Morning skincare routine that cleared my acne #beauty #skincare #routine',
      views: 7_654_321,
      likes: 987_000,
      comments: 67_000,
      shares: 345_000,
      uploaded: getRelativeTime(4),
      creator: 'skincarequeen',
      creatorId: 'skincarequeen',
      creatorAvatar: null,
      thumbnail: null,
      duration: 42,
      hashtags: ['beauty', 'skincare', 'routine'],
      soundName: 'Calm Down - Rema',
    },
    {
      rank: 17,
      videoId: 'tkmock017',
      title: 'Explaining complex math in simple terms #education #math #tutor',
      views: 6_543_210,
      likes: 876_000,
      comments: 56_000,
      shares: 234_000,
      uploaded: getRelativeTime(7),
      creator: 'mathwhiz',
      creatorId: 'mathwhiz',
      creatorAvatar: null,
      thumbnail: null,
      duration: 58,
      hashtags: ['education', 'math', 'tutor'],
      soundName: 'Lofi Study Beats',
    },
    {
      rank: 18,
      videoId: 'tkmock018',
      title: 'Puppy meets kitten for the first time #pets #cute #wholesome',
      views: 5_432_100,
      likes: 765_000,
      comments: 45_000,
      shares: 567_000,
      uploaded: getRelativeTime(5),
      creator: 'petlover_sarah',
      creatorId: 'petlover_sarah',
      creatorAvatar: null,
      thumbnail: null,
      duration: 15,
      hashtags: ['pets', 'cute', 'wholesome'],
      soundName: 'Somewhere Over the Rainbow - Israel K.',
    },
    {
      rank: 19,
      videoId: 'tkmock019',
      title: 'At home abs workout no equipment needed #fitness #abs #homeworkout',
      views: 4_321_000,
      likes: 654_000,
      comments: 34_000,
      shares: 234_000,
      uploaded: getRelativeTime(3),
      creator: 'fitwithemma',
      creatorId: 'fitwithemma',
      creatorAvatar: null,
      thumbnail: null,
      duration: 38,
      hashtags: ['fitness', 'abs', 'homeworkout'],
      soundName: 'Stronger - Kanye West',
    },
    {
      rank: 20,
      videoId: 'tkmock020',
      title: 'How I turned $100 into a business #comedy #skit #storytime',
      views: 3_210_000,
      likes: 543_000,
      comments: 23_000,
      shares: 123_000,
      uploaded: getRelativeTime(8),
      creator: 'hustleguy',
      creatorId: 'hustleguy',
      creatorAvatar: null,
      thumbnail: null,
      duration: 50,
      hashtags: ['comedy', 'skit', 'storytime'],
      soundName: 'Money - Cardi B',
    },
  ];

  // Filter by category
  const catToHashtags: Record<string, string[]> = {
    dance: ['dance', 'choreography', 'dancechallenge'],
    comedy: ['comedy', 'funny', 'relatable', 'pov', 'skit'],
    education: ['education', 'learn', 'science', 'math', 'tutor'],
    food: ['food', 'foodtok', 'recipe', 'cooking', 'ranking'],
    beauty: ['beauty', 'makeup', 'skincare', 'grwm'],
    fitness: ['fitness', 'gym', 'workout', 'abs', 'homeworkout'],
    music: ['music', 'cover', 'singing'],
    gaming: ['gaming', 'minecraft', 'fortnite', 'roblox'],
    diy: ['diy', 'roomdecor', 'craft'],
    fashion: ['fashion', 'ootd', 'style'],
    pets: ['pets', 'catsoftiktok', 'cute', 'wholesome'],
    travel: ['travel', 'tips', 'budget'],
  };

  let filtered = allItems;
  if (category && catToHashtags[category]) {
    const catTags = catToHashtags[category];
    filtered = allItems.filter((item) =>
      (item.hashtags ?? []).some((h) => catTags.includes(h)),
    );
  }

  // Filter by hashtag search
  if (hashtag) {
    const q = hashtag.toLowerCase().replace(/^#/, '');
    filtered = filtered.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      (item.hashtags ?? []).some((h) => h.toLowerCase().includes(q)),
    );
  }

  // Re-rank after filtering
  return filtered.map((item, i) => ({ ...item, rank: i + 1 }));
}
