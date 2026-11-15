// @vitest-environment node
/**
 * YouTube daily limit: app videos move to the first slot after the reset
 * (midnight Pacific Time) instead of failing.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UploadJob } from '@prisma/client';

vi.mock('@/lib/env', () => ({ env: { AUTH_SECRET: 's', AUTH_GOOGLE_ID: 'c', AUTH_GOOGLE_SECRET: 'g' } }));

const db = {
  autopostChannel: { upsert: vi.fn() },
  uploadJob: {
    findMany: vi.fn(async (_args?: unknown) => [] as unknown[]),
    update: vi.fn(async (_args: { data: Record<string, unknown> }) => ({})),
  },
};
vi.mock('@/server/db', () => ({ db }));

const settings = {
  channelId: 'UC1',
  slotTimes: ['12:00', '18:00'],
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  postsPerDay: 2,
  minGapMinutes: 120,
  timezone: 'Europe/Moscow',
  autopostEnabled: true,
  pausedUntil: null,
  connectionLostAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function job(over: Partial<UploadJob> = {}): UploadJob {
  return {
    id: 'job1',
    userId: 'u1',
    apiKeyId: 'k1',
    externalUserId: null,
    source: 'API',
    channelId: 'UC1',
    targetPlatform: 'YOUTUBE',
    videoUrl: 'https://tubeforge.co/api/v1/mobile/media/u1/x.mp4?s=1',
    thumbnailUrl: null,
    title: 'T',
    description: null,
    tags: [],
    privacyStatus: 'public',
    scheduledAt: new Date('2026-11-16T09:00:00Z'),
    idempotencyKey: null,
    consumerRef: 'autopost-app',
    metadata: { autopost: { fileId: 'x', slotReason: 'nearest' } },
    status: 'UPLOADING',
    youtubeVideoId: null,
    errorMessage: null,
    retryCount: 0,
    uploadProgress: 40,
    webhookDelivered: false,
    webhookFailed: false,
    lockedBy: 'w',
    lockedAt: new Date(),
    createdAt: new Date(),
    startedAt: new Date(),
    completedAt: null,
    ...over,
  } as UploadJob;
}

beforeEach(() => {
  vi.clearAllMocks();
  db.autopostChannel.upsert.mockResolvedValue(settings);
});

describe('daily limit', () => {
  it('tells the daily limit from a short burst limit', async () => {
    const { isDailyQuotaError } = await import('@/lib/autopost/service');
    expect(isDailyQuotaError('Metadata POST failed: HTTP 403 {"reason":"quotaExceeded"}')).toBe(true);
    expect(isDailyQuotaError('HTTP 400 uploadLimitExceeded')).toBe(true);
    expect(isDailyQuotaError('HTTP 429 rateLimitExceeded')).toBe(false);
    expect(isDailyQuotaError(null)).toBe(false);
  });

  it('resets at midnight Pacific Time', async () => {
    const { nextQuotaReset } = await import('@/lib/autopost/service');
    // 16 Nov 09:00 UTC is 01:00 PST: the next reset is 17 Nov 00:00 PST = 08:00 UTC.
    expect(nextQuotaReset(new Date('2026-11-16T09:00:00Z')).toISOString()).toBe('2026-11-17T08:00:00.000Z');
    // 16 Nov 07:30 UTC is still 15 Nov in California: reset at 16 Nov 08:00 UTC.
    expect(nextQuotaReset(new Date('2026-11-16T07:30:00Z')).toISOString()).toBe('2026-11-16T08:00:00.000Z');
  });

  it('moves an app video to the first slot after the reset', async () => {
    const { deferForQuota } = await import('@/lib/autopost/service');
    const ok = await deferForQuota(job(), 'HTTP 403 quotaExceeded', new Date('2026-11-16T09:00:00Z'));
    expect(ok).toBe(true);
    const call = db.uploadJob.update.mock.calls[0][0];
    // Reset 17 Nov 08:00 UTC = 11:00 Moscow; first slot is 12:00 Moscow = 09:00 UTC.
    expect((call.data.scheduledAt as Date).toISOString()).toBe('2026-11-17T09:00:00.000Z');
    expect(call.data.status).toBe('QUEUED');
    expect(call.data.retryCount).toBe(1);
    expect(call.data.lockedBy).toBeNull();
    expect((call.data.metadata as { autopost: { slotReason: string } }).autopost.slotReason).toBe('quota_moved');
  });

  it('leaves other jobs and endless deferrals to the normal failure path', async () => {
    const { deferForQuota, MAX_QUOTA_DEFERRALS } = await import('@/lib/autopost/service');
    expect(await deferForQuota(job({ consumerRef: null }), 'quotaExceeded')).toBe(false);
    expect(await deferForQuota(job({ retryCount: MAX_QUOTA_DEFERRALS }), 'quotaExceeded')).toBe(false);
    expect(db.uploadJob.update).not.toHaveBeenCalled();
  });

  it('a channel with autopost off keeps the video in stock', async () => {
    db.autopostChannel.upsert.mockResolvedValueOnce({ ...settings, autopostEnabled: false });
    const { deferForQuota } = await import('@/lib/autopost/service');
    await deferForQuota(job(), 'quotaExceeded', new Date('2026-11-16T09:00:00Z'));
    const call = db.uploadJob.update.mock.calls[0][0];
    expect(call.data.scheduledAt).toBeNull();
  });
});
