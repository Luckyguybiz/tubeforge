/**
 * JSON shapes of the /api/v1/mobile routes. The app maps them to its own
 * domain model (autopost-app: mobile/src/core/tubeforge/map.ts).
 */
import type { AutopostChannel, Channel, UploadJob } from '@prisma/client';
import { db } from '@/server/db';
import { DAY } from './time';
import { AUTOPOST_REF, DAILY_CAP, classifyError, ensureSettings, metaOf, rulesOf, type ErrorCode } from './service';

export type MobilePostStatus = 'ready' | 'scheduled' | 'uploading' | 'published' | 'failed' | 'cancelled';

export interface MobilePost {
  id: string;
  channelId: string;
  title: string;
  description: string;
  status: MobilePostStatus;
  publishAt: string | null;
  publishedAt: string | null;
  youtubeVideoId: string | null;
  youtubeUrl: string | null;
  visibility: 'public' | 'unlisted' | 'private';
  slotReason: string | null;
  error: { code: ErrorCode; message: string; attempts: number; retrying: boolean } | null;
  uploadProgress: number | null;
  durationSec: number | null;
  thumbnailUrl: string | null;
  fromApp: boolean;
  createdAt: string;
}

export interface MobileChannel {
  id: string;
  title: string;
  thumbnail: string | null;
  subscribers: number | null;
  platform: 'youtube';
  connection: 'ok' | 'lost';
  autopostEnabled: boolean;
  pausedUntil: string | null;
  rules: { slotTimes: string[]; weekdays: number[]; postsPerDay: number; minGapMinutes: number; timezone: string };
  dailyCap: number;
  stockCount: number;
  scheduledCount: number;
  failedCount: number;
  /** Videos moved to a later slot because of the YouTube daily limit. */
  quotaWaiting: number;
  published7d: number;
  nextPublishAt: string | null;
  lastPublishedAt: string | null;
  createdAt: string;
}

function visibility(v: string): MobilePost['visibility'] {
  return v === 'unlisted' || v === 'private' ? v : 'public';
}

export function statusOf(job: UploadJob): MobilePostStatus {
  switch (job.status) {
    case 'QUEUED':
      return job.scheduledAt ? 'scheduled' : job.consumerRef === AUTOPOST_REF ? 'ready' : 'scheduled';
    case 'UPLOADING':
      return 'uploading';
    case 'COMPLETED':
      return 'published';
    case 'FAILED':
      return 'failed';
    default:
      return 'cancelled';
  }
}

export function presentPost(job: UploadJob): MobilePost {
  const meta = metaOf(job);
  const status = statusOf(job);
  const failed = status === 'failed';
  const retrying = job.status === 'QUEUED' && job.retryCount > 0 && !!job.errorMessage;
  return {
    id: job.id,
    channelId: job.channelId,
    title: job.title,
    description: job.description ?? '',
    status,
    publishAt: (job.scheduledAt ?? (status === 'published' ? job.completedAt : null))?.toISOString() ?? null,
    publishedAt: status === 'published' ? (job.completedAt ?? job.scheduledAt)?.toISOString() ?? null : null,
    youtubeVideoId: job.youtubeVideoId,
    youtubeUrl: job.youtubeVideoId ? `https://www.youtube.com/watch?v=${job.youtubeVideoId}` : null,
    visibility: visibility(job.privacyStatus),
    slotReason: meta.slotReason ?? null,
    error:
      failed || retrying
        ? {
            code: classifyError(job.errorMessage),
            message: (job.errorMessage ?? '').slice(0, 300),
            attempts: job.retryCount,
            retrying,
          }
        : null,
    uploadProgress: status === 'uploading' ? job.uploadProgress : null,
    durationSec: meta.durationSec ?? null,
    thumbnailUrl: job.thumbnailUrl,
    fromApp: job.consumerRef === AUTOPOST_REF,
    createdAt: job.createdAt.toISOString(),
  };
}

/** Channels of a user with settings, connection and counters. */
export async function listMobileChannels(userId: string, now = new Date()): Promise<MobileChannel[]> {
  const channels = await db.channel.findMany({
    where: { userId, platform: 'YOUTUBE' },
    include: { autopost: true },
    orderBy: { createdAt: 'asc' },
  });
  if (channels.length === 0) return [];
  const ids = channels.map((c) => c.id);

  const [accounts, loginAccounts, byStatus, stock, next, last, recent, quota] = await Promise.all([
    db.account.findMany({
      where: { userId, provider: 'google', providerAccountId: { in: ids } },
      select: { providerAccountId: true, refresh_token: true },
    }),
    db.account.count({ where: { userId, provider: 'google', providerAccountId: { notIn: ids }, refresh_token: { not: null } } }),
    db.uploadJob.groupBy({ by: ['channelId', 'status'], where: { channelId: { in: ids } }, _count: { _all: true } }),
    db.uploadJob.groupBy({
      by: ['channelId'],
      where: { channelId: { in: ids }, consumerRef: AUTOPOST_REF, status: 'QUEUED', scheduledAt: null },
      _count: { _all: true },
    }),
    db.uploadJob.groupBy({
      by: ['channelId'],
      where: { channelId: { in: ids }, status: 'QUEUED', scheduledAt: { gt: now } },
      _min: { scheduledAt: true },
    }),
    db.uploadJob.groupBy({ by: ['channelId'], where: { channelId: { in: ids }, status: 'COMPLETED' }, _max: { completedAt: true } }),
    db.uploadJob.groupBy({
      by: ['channelId'],
      where: { channelId: { in: ids }, status: 'COMPLETED', completedAt: { gte: new Date(now.getTime() - 7 * DAY) } },
      _count: { _all: true },
    }),
    db.uploadJob.groupBy({
      by: ['channelId'],
      where: {
        channelId: { in: ids },
        consumerRef: AUTOPOST_REF,
        status: 'QUEUED',
        metadata: { path: ['autopost', 'slotReason'], equals: 'quota_moved' },
      },
      _count: { _all: true },
    }),
  ]);

  const tokens = new Map(accounts.map((a) => [a.providerAccountId, !!a.refresh_token]));
  const count = (id: string, status: UploadJob['status']) =>
    byStatus.find((r) => r.channelId === id && r.status === status)?._count._all ?? 0;

  const out: MobileChannel[] = [];
  for (const c of channels) {
    const s = c.autopost ?? (await ensureSettings(c.id));
    const own = tokens.get(c.id);
    const hasToken = own ?? loginAccounts > 0;
    const stockCount = stock.find((r) => r.channelId === c.id)?._count._all ?? 0;
    out.push(
      presentChannel(c, s, {
        connection: hasToken && !s.connectionLostAt ? 'ok' : 'lost',
        stockCount,
        scheduledCount: count(c.id, 'QUEUED') - stockCount,
        failedCount: count(c.id, 'FAILED'),
        quotaWaiting: quota.find((r) => r.channelId === c.id)?._count._all ?? 0,
        published7d: recent.find((r) => r.channelId === c.id)?._count._all ?? 0,
        nextPublishAt: next.find((r) => r.channelId === c.id)?._min.scheduledAt ?? null,
        lastPublishedAt: last.find((r) => r.channelId === c.id)?._max.completedAt ?? null,
      }, now),
    );
  }
  return out;
}

export function presentChannel(
  c: Channel,
  s: AutopostChannel,
  x: {
    connection: 'ok' | 'lost';
    stockCount: number;
    scheduledCount: number;
    failedCount: number;
    quotaWaiting: number;
    published7d: number;
    nextPublishAt: Date | null;
    lastPublishedAt: Date | null;
  },
  now: Date,
): MobileChannel {
  return {
    id: c.id,
    title: c.title,
    thumbnail: c.thumbnail,
    subscribers: c.subscribers > 0 ? c.subscribers : null,
    platform: 'youtube',
    connection: x.connection,
    autopostEnabled: s.autopostEnabled,
    pausedUntil: s.pausedUntil && s.pausedUntil.getTime() > now.getTime() ? s.pausedUntil.toISOString() : null,
    rules: rulesOf(s),
    dailyCap: DAILY_CAP,
    stockCount: x.stockCount,
    scheduledCount: Math.max(0, x.scheduledCount),
    failedCount: x.failedCount,
    quotaWaiting: x.quotaWaiting,
    published7d: x.published7d,
    nextPublishAt: x.nextPublishAt?.toISOString() ?? null,
    lastPublishedAt: x.lastPublishedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}
