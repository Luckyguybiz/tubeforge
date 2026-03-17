import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { API_ENDPOINTS } from '@/lib/constants';
import { env } from '@/lib/env';
import type { PrismaClient } from '@prisma/client';

async function getYouTubeToken(userId: string, db: PrismaClient) {
  const account = await db.account.findFirst({
    where: { userId, provider: 'google' },
    select: { id: true, access_token: true, refresh_token: true, expires_at: true },
  });
  if (!account?.access_token) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'YouTube не подключён' });

  // Refresh expired token
  if (account.expires_at && account.expires_at * 1000 < Date.now() && account.refresh_token) {
    const res = await fetch(API_ENDPOINTS.GOOGLE_OAUTH_TOKEN, {
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
      const data = await res.json();
      await db.account.update({
        where: { id: account.id },
        data: {
          access_token: data.access_token,
          expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
        },
        select: { id: true },
      });
      return data.access_token as string;
    }
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
    const res = await fetch(`${API_ENDPOINTS.YOUTUBE_CHANNELS}?part=snippet,statistics&mine=true`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Ошибка YouTube API' });
    const data = await res.json();
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
    .input(z.object({ channelId: z.string(), maxResults: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      await verifyChannelOwnership(input.channelId, ctx.session.user.id, ctx.db);
      const token = await getYouTubeToken(ctx.session.user.id, ctx.db);
      const searchRes = await fetch(
        `${API_ENDPOINTS.YOUTUBE_SEARCH}?part=snippet&channelId=${input.channelId}&maxResults=${input.maxResults}&order=date&type=video`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!searchRes.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Ошибка поиска видео YouTube API' });
      const searchData = await searchRes.json();
      const videoIds = (searchData.items ?? []).map((i: { id: { videoId?: string } }) => i.id.videoId).filter(Boolean).join(',');
      if (!videoIds) return [];
      const statsRes = await fetch(
        `${API_ENDPOINTS.YOUTUBE_VIDEOS}?part=statistics,snippet&id=${videoIds}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!statsRes.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Ошибка получения статистики YouTube API' });
      const statsData = await statsRes.json();
      return statsData.items ?? [];
    }),

  getAnalytics: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      period: z.enum(['7', '28', '90', '365']).default('28'),
    }))
    .query(async ({ ctx, input }) => {
      await verifyChannelOwnership(input.channelId, ctx.session.user.id, ctx.db);
      const token = await getYouTubeToken(ctx.session.user.id, ctx.db);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - parseInt(input.period) * 86400000).toISOString().split('T')[0];
      const res = await fetch(
        `${API_ENDPOINTS.YOUTUBE_ANALYTICS}?ids=channel==${input.channelId}&startDate=${startDate}&endDate=${endDate}&metrics=views,subscribersGained,estimatedMinutesWatched,averageViewPercentage&dimensions=day`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Ошибка Analytics API' });
      return res.json();
    }),

  uploadVideo: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(100),
      description: z.string().max(5000).optional(),
      tags: z.array(z.string().max(50)).max(30).optional(),
      videoUrl: z.string().url(),
      thumbnailUrl: z.string().url().optional(),
      privacyStatus: z.enum(['public', 'private', 'unlisted']).default('private'),
    }))
    .mutation(async ({ ctx, input }) => {
      const token = await getYouTubeToken(ctx.session.user.id, ctx.db);
      // Upload video metadata
      const metadataRes = await fetch(
        `${API_ENDPOINTS.YOUTUBE_UPLOAD}?uploadType=resumable&part=snippet,status`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: { title: input.title, description: input.description, tags: input.tags },
            status: { privacyStatus: input.privacyStatus },
          }),
        }
      );
      if (!metadataRes.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Не удалось начать загрузку видео' });
      return { uploadUrl: metadataRes.headers.get('location'), message: 'Загрузка начата' };
    }),
});
