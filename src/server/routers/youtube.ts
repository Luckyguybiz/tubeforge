import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { API_ENDPOINTS } from '@/lib/constants';
import { env } from '@/lib/env';
import type { PrismaClient } from '@prisma/client';

/** YouTube channel ID validation schema */
const channelIdSchema = z.string().regex(/^UC[\w-]{22}$/, 'Invalid channel ID format');

/** Fetch wrapper with AbortController timeout */
async function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getYouTubeToken(userId: string, db: PrismaClient) {
  const account = await db.account.findFirst({
    where: { userId, provider: 'google' },
    select: { id: true, access_token: true, refresh_token: true, expires_at: true },
  });
  if (!account?.access_token) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'YouTube не подключён' });

  // Refresh expired token
  if (account.expires_at && account.expires_at * 1000 < Date.now() && account.refresh_token) {
    const res = await fetchWithTimeout(API_ENDPOINTS.GOOGLE_OAUTH_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.AUTH_GOOGLE_ID,
        client_secret: env.AUTH_GOOGLE_SECRET,
        refresh_token: account.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data?.access_token) {
        // Validate expires_in is a positive number; default to 3600 if invalid
        const expiresIn = typeof data.expires_in === 'number' && data.expires_in > 0
          ? data.expires_in
          : 3600;
        await db.account.update({
          where: { id: account.id },
          data: {
            access_token: data.access_token,
            expires_at: Math.floor(Date.now() / 1000) + expiresIn,
          },
          select: { id: true },
        });
        return data.access_token as string;
      }
    }
    // Token was expired and refresh failed — do not fall back to the old expired token
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Не удалось обновить токен YouTube. Переподключите аккаунт Google.' });
  }

  return account.access_token;
}

/** Verify the user owns this channel (synced via getChannels) */
async function verifyChannelOwnership(channelId: string, userId: string, db: PrismaClient) {
  const channel = await db.channel.findFirst({
    where: { id: channelId, userId },
    select: { id: true },
  });
  if (!channel) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Канал не найден' });
  }
}

export const youtubeRouter = router({
  getChannels: protectedProcedure.query(async ({ ctx }) => {
    const token = await getYouTubeToken(ctx.session.user.id, ctx.db);
    const res = await fetchWithTimeout(`${API_ENDPOINTS.YOUTUBE_CHANNELS}?part=snippet,statistics&mine=true`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Ошибка YouTube API' });
    const data = await res.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Не удалось разобрать ответ YouTube API' }); });
    // Sync channels to DB in a single transaction
    const items = data.items ?? [];
    if (items.length > 0) {
      await ctx.db.$transaction(
        items.map((ch: { id: string; snippet: { title: string; thumbnails?: { default?: { url?: string } } }; statistics: { subscriberCount?: string } }) =>
          ctx.db.channel.upsert({
            where: { id: ch.id },
            create: {
              id: ch.id,
              title: ch.snippet.title,
              thumbnail: ch.snippet.thumbnails?.default?.url,
              subscribers: parseInt(ch.statistics.subscriberCount ?? '0'),
              userId: ctx.session.user.id,
            },
            update: {
              title: ch.snippet.title,
              thumbnail: ch.snippet.thumbnails?.default?.url,
              subscribers: parseInt(ch.statistics.subscriberCount ?? '0'),
            },
          })
        )
      );
    }
    return data.items ?? [];
  }),

  getVideos: protectedProcedure
    .input(z.object({ channelId: channelIdSchema, maxResults: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      await verifyChannelOwnership(input.channelId, ctx.session.user.id, ctx.db);
      const token = await getYouTubeToken(ctx.session.user.id, ctx.db);
      const searchRes = await fetchWithTimeout(
        `${API_ENDPOINTS.YOUTUBE_SEARCH}?part=snippet&channelId=${input.channelId}&maxResults=${input.maxResults}&order=date&type=video`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!searchRes.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Ошибка поиска видео YouTube API' });
      const searchData = await searchRes.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Не удалось разобрать ответ YouTube API' }); });
      const videoIds = (searchData.items ?? []).map((i: { id: { videoId?: string } }) => i.id.videoId).filter(Boolean).join(',');
      if (!videoIds) return [];
      const statsRes = await fetchWithTimeout(
        `${API_ENDPOINTS.YOUTUBE_VIDEOS}?part=statistics,snippet&id=${videoIds}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!statsRes.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Ошибка получения статистики YouTube API' });
      const statsData = await statsRes.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Не удалось разобрать ответ YouTube API' }); });
      return statsData.items ?? [];
    }),

  getAnalytics: protectedProcedure
    .input(z.object({
      channelId: channelIdSchema,
      period: z.enum(['7', '28', '90', '365']).default('28'),
    }))
    .query(async ({ ctx, input }) => {
      await verifyChannelOwnership(input.channelId, ctx.session.user.id, ctx.db);
      const token = await getYouTubeToken(ctx.session.user.id, ctx.db);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - parseInt(input.period) * 86400000).toISOString().split('T')[0];
      const res = await fetchWithTimeout(
        `${API_ENDPOINTS.YOUTUBE_ANALYTICS}?ids=channel==${input.channelId}&startDate=${startDate}&endDate=${endDate}&metrics=views,subscribersGained,estimatedMinutesWatched,averageViewPercentage&dimensions=day`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Ошибка Analytics API' });
      return res.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Не удалось разобрать ответ Analytics API' }); });
    }),

  uploadVideo: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(100),
      description: z.string().max(5000).optional(),
      tags: z.array(z.string().max(50)).max(30).optional(),
      videoUrl: z.string().url(),
      thumbnailUrl: z.string().url().optional(),
      privacyStatus: z.enum(['public', 'private', 'unlisted']).default('private'),
      /** ISO 8601 date for scheduled publishing. When set, privacyStatus
       *  is forced to 'private' and YouTube auto-publishes at this time. */
      publishAt: z.string().datetime().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { success } = await rateLimit({
        identifier: `youtube-mutation:${ctx.session.user.id}`,
        limit: 30,
        window: 60,
      });
      if (!success) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' });
      }

      // Scheduled videos must be private per YouTube API requirements
      const effectivePrivacy = input.publishAt ? 'private' : input.privacyStatus;

      const token = await getYouTubeToken(ctx.session.user.id, ctx.db);

      // Build status payload — include publishAt when scheduling
      const status: Record<string, string> = { privacyStatus: effectivePrivacy };
      if (input.publishAt) {
        status.publishAt = input.publishAt;
      }

      // Initiate resumable upload session with YouTube Data API v3
      const metadataRes = await fetchWithTimeout(
        `${API_ENDPOINTS.YOUTUBE_UPLOAD}?uploadType=resumable&part=snippet,status`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: { title: input.title, description: input.description, tags: input.tags },
            status,
          }),
        }
      );
      if (!metadataRes.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Не удалось начать загрузку видео' });

      const uploadUrl = metadataRes.headers.get('location');
      return {
        uploadUrl,
        scheduled: !!input.publishAt,
        publishAt: input.publishAt ?? null,
        message: input.publishAt ? 'Публикация запланирована' : 'Загрузка начата',
      };
    }),
});
