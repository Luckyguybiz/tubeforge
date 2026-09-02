/**
 * Batch upload-job creation shared by POST /api/v1/posts/schedule and the
 * MCP `tubeforge_schedule_uploads` tool.
 *
 * Pure business logic: resolves targets (own channel or ExternalUser),
 * enforces the per-key monthly quota, applies idempotency and creates the
 * UploadJob rows in one transaction. Transport layers map the result to
 * HTTP / MCP responses.
 */
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '@/server/db';
import type { ApiAuthContext } from '@/lib/api-auth';

export const UploadItemSchema = z.object({
  channelId: z.string().min(1).max(100).optional(),
  externalUserId: z.string().min(1).max(100).optional(),
  targetPlatform: z.enum(['youtube', 'tiktok', 'instagram']).default('youtube'),
  videoUrl: z.string().url().max(2048),
  title: z.string().min(1).max(100),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(30).optional(),
  thumbnailUrl: z.string().url().max(2048).optional(),
  privacyStatus: z.enum(['public', 'unlisted', 'private']).default('private'),
  scheduledAt: z.string().datetime().optional(),
  consumerRef: z.string().max(120).optional(),
});
export type UploadItem = z.infer<typeof UploadItemSchema>;

export const UploadBatchSchema = z.object({
  items: z.array(UploadItemSchema).min(1).max(50),
  idempotencyKey: z.string().min(8).max(120).optional(),
});

export interface CreatedJob {
  jobId: string;
  channelId: string;
  targetPlatform: string;
  status: string;
  scheduledAt: string | null;
  consumerRef: string | null;
}

export type CreateUploadJobsResult =
  | { ok: true; created: true; jobs: CreatedJob[] }
  | { ok: true; created: false; idempotent: true; jobs: CreatedJob[] }
  | { ok: false; status: number; code: string; message: string; details?: unknown };

function hashPayload(p: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(p)).digest('hex');
}

function fail(status: number, code: string, message: string, details?: unknown): CreateUploadJobsResult {
  return { ok: false, status, code, message, ...(details !== undefined ? { details } : {}) };
}

type JobRow = {
  id: string;
  channelId: string;
  targetPlatform: string;
  status: string;
  scheduledAt: Date | null;
  consumerRef: string | null;
};

function toCreated(j: JobRow): CreatedJob {
  return {
    jobId: j.id,
    channelId: j.channelId,
    targetPlatform: j.targetPlatform.toLowerCase(),
    status: j.status.toLowerCase(),
    scheduledAt: j.scheduledAt?.toISOString() ?? null,
    consumerRef: j.consumerRef,
  };
}

export async function createUploadJobs(
  auth: ApiAuthContext,
  items: UploadItem[],
  idempotencyKey?: string,
): Promise<CreateUploadJobsResult> {
  const nonYouTube = items.find((i) => i.targetPlatform !== 'youtube');
  if (nonYouTube) {
    return fail(
      501,
      'platform_not_supported',
      `Platform "${nonYouTube.targetPlatform}" is not yet available. YouTube only in Phase 1; TikTok and Instagram arrive in Phase 2.`,
      { platform: nonYouTube.targetPlatform },
    );
  }

  for (const item of items) {
    if (!item.channelId && !item.externalUserId) {
      return fail(400, 'missing_target', 'Each item must include either channelId or externalUserId');
    }
    if (item.channelId && item.externalUserId) {
      return fail(400, 'ambiguous_target', 'Each item must include EITHER channelId OR externalUserId, not both');
    }
  }

  const payloadHash = hashPayload(items);

  if (idempotencyKey) {
    const existing = await db.uploadJob.findMany({
      where: { apiKeyId: auth.apiKeyId, idempotencyKey },
      select: {
        id: true,
        channelId: true,
        targetPlatform: true,
        status: true,
        scheduledAt: true,
        consumerRef: true,
        metadata: true,
      },
    });

    if (existing.length > 0) {
      const firstHash =
        existing[0].metadata && typeof existing[0].metadata === 'object'
          ? (existing[0].metadata as Record<string, unknown>).requestHash
          : undefined;
      if (firstHash && firstHash !== payloadHash) {
        return fail(409, 'idempotency_conflict', 'idempotencyKey already used with a different payload', { idempotencyKey });
      }
      return { ok: true, created: false, idempotent: true, jobs: existing.map(toCreated) };
    }
  }

  const remainingQuota = auth.monthlyQuota - auth.monthlyUsage;
  if (items.length > remainingQuota) {
    return fail(
      429,
      'quota_exceeded',
      `Batch of ${items.length} exceeds remaining monthly quota of ${remainingQuota}`,
      { batchSize: items.length, remainingQuota },
    );
  }

  const resolutions: Array<{ channelId: string; externalUserDbId: string | null }> = [];
  for (const item of items) {
    if (item.externalUserId) {
      const ext = await db.externalUser.findUnique({
        where: { apiKeyId_externalUserId: { apiKeyId: auth.apiKeyId, externalUserId: item.externalUserId } },
        select: { id: true, channelId: true },
      });
      if (!ext) {
        return fail(
          404,
          'external_user_not_found',
          `External user "${item.externalUserId}" has not connected a channel. Send them through POST /api/v1/auth/youtube/start.`,
          { externalUserId: item.externalUserId },
        );
      }
      if (!ext.channelId) {
        return fail(
          409,
          'external_user_no_channel',
          `External user "${item.externalUserId}" exists but has no channel linked`,
          { externalUserId: item.externalUserId },
        );
      }
      resolutions.push({ channelId: ext.channelId, externalUserDbId: ext.id });
    } else {
      const channel = await db.channel.findFirst({
        where: { id: item.channelId!, userId: auth.userId },
        select: { id: true, platform: true },
      });
      if (!channel) {
        return fail(
          404,
          'channel_not_found',
          `Channel "${item.channelId}" not found or not owned by this API key holder`,
          { channelId: item.channelId },
        );
      }
      if (channel.platform !== 'YOUTUBE') {
        return fail(
          400,
          'channel_platform_mismatch',
          `Channel "${item.channelId}" is ${channel.platform.toLowerCase()}, but Phase 1 only supports youtube uploads`,
          { channelId: item.channelId, channelPlatform: channel.platform.toLowerCase() },
        );
      }
      resolutions.push({ channelId: channel.id, externalUserDbId: null });
    }
  }

  let jobs: JobRow[];
  try {
    jobs = await db.$transaction(
      items.map((item, idx) => {
        const r = resolutions[idx];
        const effectivePrivacy = item.scheduledAt ? 'private' : item.privacyStatus;
        return db.uploadJob.create({
          data: {
            userId: auth.userId,
            apiKeyId: auth.apiKeyId,
            externalUserId: r.externalUserDbId,
            source: 'API',
            channelId: r.channelId,
            videoUrl: item.videoUrl,
            thumbnailUrl: item.thumbnailUrl ?? null,
            title: item.title,
            description: item.description ?? null,
            tags: item.tags ?? [],
            privacyStatus: effectivePrivacy,
            scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : null,
            status: 'QUEUED',
            targetPlatform: 'YOUTUBE',
            consumerRef: item.consumerRef ?? null,
            idempotencyKey: idempotencyKey ?? null,
            metadata: { requestHash: payloadHash },
          },
          select: {
            id: true,
            channelId: true,
            targetPlatform: true,
            status: true,
            scheduledAt: true,
            consumerRef: true,
          },
        });
      }),
    );
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
      return fail(
        409,
        'idempotency_conflict',
        'Concurrent request used the same idempotencyKey — retry to fetch existing jobs',
        { idempotencyKey },
      );
    }
    throw e;
  }

  await db.apiKey.update({
    where: { id: auth.apiKeyId },
    data: { monthlyUsage: { increment: items.length } },
  });

  return { ok: true, created: true, jobs: jobs.map(toCreated) };
}
