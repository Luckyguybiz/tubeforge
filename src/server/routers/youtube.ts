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
    orderBy: { expires_at: 'desc' },
  });
  if (!account?.access_token) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'YouTube is not connected' });

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

      // FIX: Google returned HTTP 200 but the response body is missing access_token.
      // This can happen if the refresh_token was revoked or the response was malformed.
      // We must NOT silently fall through and use the old expired token — that would
      // cause confusing 401s from YouTube API. Instead, throw immediately so the user
      // knows to re-authenticate.
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Token refreshed but access_token is missing from the response. Please reconnect your Google account.',
      });
    }
    // Token was expired and refresh HTTP request failed — do not fall back to the old expired token
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Failed to refresh YouTube token. Please reconnect your Google account.' });
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
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Channel not found' });
  }
}

export const youtubeRouter = router({
  getChannels: protectedProcedure.query(async ({ ctx }) => {
    const token = await getYouTubeToken(ctx.session.user.id, ctx.db);
    const res = await fetchWithTimeout(`${API_ENDPOINTS.YOUTUBE_CHANNELS}?part=snippet,statistics&mine=true`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      let detail = `HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        detail = parsed?.error?.message ?? detail;
      } catch { /* use status code */ }
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `YouTube API error: ${detail}` });
    }
    const data = await res.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse YouTube API response' }); });
    // Sync channels to DB in a single transaction
    const items = data.items ?? [];
    if (items.length > 0) {
      // Check which channels are new before upsert
      const existingIds = new Set(
        (await ctx.db.channel.findMany({
          where: { id: { in: items.map((ch: { id: string }) => ch.id) } },
          select: { id: true },
        })).map((c) => c.id)
      );

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

      // Notify about newly connected channels
      const newChannels = items.filter((ch: { id: string }) => !existingIds.has(ch.id));
      if (newChannels.length > 0) {
        await ctx.db.notification.createMany({
          data: newChannels.map((ch: { snippet: { title: string } }) => ({
            userId: ctx.session.user.id,
            type: 'success',
            title: 'Channel connected',
            message: `YouTube channel "${ch.snippet.title}" has been connected`,
          })),
        }).catch(() => {}); // non-critical
      }
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
      if (!searchRes.ok) {
        const errBody = await searchRes.text().catch(() => '');
        let detail = `HTTP ${searchRes.status}`;
        try { const p = JSON.parse(errBody); detail = p?.error?.message ?? detail; } catch { /* use status code */ }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `YouTube video search error: ${detail}` });
      }
      const searchData = await searchRes.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse YouTube API response' }); });
      const videoIds = (searchData.items ?? []).map((i: { id: { videoId?: string } }) => i.id.videoId).filter(Boolean).join(',');
      if (!videoIds) return [];
      const statsRes = await fetchWithTimeout(
        `${API_ENDPOINTS.YOUTUBE_VIDEOS}?part=statistics,snippet&id=${videoIds}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!statsRes.ok) {
        const errBody = await statsRes.text().catch(() => '');
        let detail = `HTTP ${statsRes.status}`;
        try { const p = JSON.parse(errBody); detail = p?.error?.message ?? detail; } catch { /* use status code */ }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `YouTube statistics error: ${detail}` });
      }
      const statsData = await statsRes.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse YouTube API response' }); });
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
      if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        let detail = `HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(errorBody);
          detail = parsed?.error?.message ?? detail;
        } catch { /* use status code */ }

        // 403 usually means the YouTube Analytics API is not enabled or the OAuth scope is missing
        if (res.status === 403) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `YouTube Analytics access denied: ${detail}. Please reconnect your Google account with Analytics permissions.`,
          });
        }
        // 401 means token is invalid/expired despite our refresh attempt
        if (res.status === 401) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'YouTube Analytics token expired. Please reconnect your Google account.',
          });
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Analytics API error: ${detail}` });
      }
      return res.json().catch(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse Analytics API response' }); });
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
      if (!metadataRes.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to initiate video upload' });

      const uploadUrl = metadataRes.headers.get('location');
      return {
        uploadUrl,
        scheduled: !!input.publishAt,
        publishAt: input.publishAt ?? null,
        message: input.publishAt ? 'Publishing scheduled' : 'Upload started',
      };
    }),

  /**
   * III.D.2.3.1.a/b compliance — easy revoke UI.
   * Revokes the user's Google OAuth grant at oauth2.googleapis.com/revoke
   * (best-effort), then deletes local Channel + linked UploadJobs.
   * ExternalUser rows referencing this channel are NOT cascade-deleted —
   * their channelId is cleared so future re-connect can re-link.
   *
   * BugHunt fixes 2026-05-19:
   *  - Check res.ok before claiming revoke succeeded (BUG #2)
   *  - Skip in-flight UPLOADING jobs from cascade delete to avoid worker race (BUG #3)
   *  - Write AuditLog entry for compliance audit trail (BUG #4)
   */
  disconnectChannel: protectedProcedure
    .input(z.object({ channelId: channelIdSchema }))
    .mutation(async ({ ctx, input }) => {
      // 1. Verify ownership
      const channel = await ctx.db.channel.findFirst({
        where: { id: input.channelId, userId: ctx.session.user.id },
        select: { id: true, title: true },
      });
      if (!channel) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Channel not found or not owned by you' });
      }

      // 2. Reject if there are active uploads in flight (BUG #3 fix — race with worker).
      // Worker's atomic claim is via lockedBy/lockedAt set during UPLOADING state. Deleting
      // a UploadJob row mid-flight causes worker to fail and possibly leave orphan YT video.
      // Safer: require user to cancel/wait, or just exclude UPLOADING from delete and let
      // the worker complete naturally (orphan UploadJob will be cleaned up by retention cron).
      const activeUploads = await ctx.db.uploadJob.count({
        where: { channelId: input.channelId, status: 'UPLOADING' },
      });
      if (activeUploads > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot disconnect: ${activeUploads} upload(s) currently in progress. Wait a moment and try again.`,
        });
      }

      // 3. Revoke at Google (best-effort — don't block local cleanup if it fails)
      // Note: revoking the Google Account token affects ALL channels associated
      // with that Google account. Only revoke if this is the user's only channel
      // linked to that account.
      const channelCount = await ctx.db.channel.count({ where: { userId: ctx.session.user.id } });
      let revokedAtGoogle = false;
      if (channelCount === 1) {
        const account = await ctx.db.account.findFirst({
          where: { userId: ctx.session.user.id, provider: 'google' },
          select: { access_token: true, refresh_token: true },
        });
        const tokenToRevoke = account?.refresh_token || account?.access_token;
        if (tokenToRevoke) {
          try {
            const revokeRes = await fetchWithTimeout(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokenToRevoke)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }, 5000);
            // BUG #2 fix: actually check response status. Google returns 200 on success,
            // 400 with {error:'invalid_token'} if token already expired/revoked (which is
            // still effectively "revoked"), and 5xx on Google-side issues.
            if (revokeRes.ok || revokeRes.status === 400) {
              revokedAtGoogle = true;
            } else {
              console.warn('[disconnectChannel] Google revoke non-OK:', revokeRes.status);
            }
          } catch (e) {
            console.warn('[disconnectChannel] Google revoke threw:', e);
          }
        }
      }

      // 4. Delete local data — exclude any uploads still UPLOADING (defensive though we
      // checked above; user could trigger race in worst case).
      await ctx.db.$transaction([
        ctx.db.uploadJob.deleteMany({
          where: { channelId: input.channelId, status: { not: 'UPLOADING' } },
        }),
        ctx.db.externalUser.updateMany({ where: { channelId: input.channelId }, data: { channelId: null } }),
        ctx.db.channel.delete({ where: { id: input.channelId } }),
      ]);

      // 5. BUG #4 fix: AuditLog entry for compliance trail (III.E.4.7 + general security hygiene)
      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: 'channel.disconnected',
          target: input.channelId,
          metadata: {
            channelTitle: channel.title,
            revokedAtGoogle,
            wasOnlyChannel: channelCount === 1,
          },
        },
      }).catch((e) => {
        // AuditLog failure shouldn't block the actual disconnect — log and continue
        console.warn('[disconnectChannel] AuditLog write failed:', e);
      });

      return { ok: true, revokedAtGoogle, channelTitle: channel.title };
    }),

});
