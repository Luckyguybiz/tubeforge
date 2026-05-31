import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '@/server/db';
import { authenticateApiRequest } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/posts/schedule — batch publishing endpoint.
 *
 * Wraps the existing single-item /api/v1/youtube/upload logic in a
 * batch primitive with idempotency. Designed to be the primary entry
 * point for high-volume consumers like Lucky Team (autopost pipeline).
 *
 * Phase 1: YouTube only — TikTok/Instagram items return 501.
 * Phase 2: TT/IG adapters land + worker dispatches by targetPlatform.
 *
 * Auth: X-Forge-Key (same as existing /api/v1 endpoints).
 *
 * Body:
 *   {
 *     items: [{
 *       channelId? | externalUserId?,  // exactly one required
 *       targetPlatform: "youtube",     // Phase 1 only YT accepted
 *       videoUrl, title, description?, tags?, thumbnailUrl?,
 *       privacyStatus?: "public" | "unlisted" | "private",
 *       scheduledAt?: ISO8601,
 *       consumerRef?: string           // your internal post id for webhook lookup
 *     }],
 *     idempotencyKey?: string          // batch-level retry safety (max 120 chars)
 *   }
 *
 * Response 201:
 *   { jobs: [{ jobId, status, scheduledAt, consumerRef, targetPlatform }] }
 *
 * Response 200 (idempotent replay):
 *   { jobs: [...], idempotent: true }
 */

const ItemSchema = z.object({
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

const BatchSchema = z.object({
  items: z.array(ItemSchema).min(1).max(50),
  idempotencyKey: z.string().min(8).max(120).optional(),
});

function hashPayload(p: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(p)).digest('hex');
}

function jsonError(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status },
  );
}

export async function POST(req: Request) {
  const auth = await authenticateApiRequest(req);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Body must be valid JSON', 400);
  }

  const parsed = BatchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_input', 'Validation failed', 400, parsed.error.issues);
  }
  const { items, idempotencyKey } = parsed.data;

  const nonYouTube = items.find((i) => i.targetPlatform !== 'youtube');
  if (nonYouTube) {
    return jsonError(
      'platform_not_supported',
      `Platform "${nonYouTube.targetPlatform}" is not yet available. YouTube only in Phase 1; TikTok and Instagram arrive in Phase 2.`,
      501,
      { platform: nonYouTube.targetPlatform },
    );
  }

  for (const item of items) {
    if (!item.channelId && !item.externalUserId) {
      return jsonError(
        'missing_target',
        'Each item must include either channelId or externalUserId',
        400,
      );
    }
    if (item.channelId && item.externalUserId) {
      return jsonError(
        'ambiguous_target',
        'Each item must include EITHER channelId OR externalUserId, not both',
        400,
      );
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
        return jsonError(
          'idempotency_conflict',
          'idempotencyKey already used with a different payload',
          409,
          { idempotencyKey },
        );
      }

      return NextResponse.json({
        idempotent: true,
        jobs: existing.map((j) => ({
          jobId: j.id,
          channelId: j.channelId,
          targetPlatform: j.targetPlatform.toLowerCase(),
          status: j.status.toLowerCase(),
          scheduledAt: j.scheduledAt?.toISOString() ?? null,
          consumerRef: j.consumerRef,
        })),
      });
    }
  }

  const remainingQuota = auth.monthlyQuota - auth.monthlyUsage;
  if (items.length > remainingQuota) {
    return jsonError(
      'quota_exceeded',
      `Batch of ${items.length} exceeds remaining monthly quota of ${remainingQuota}`,
      429,
      { batchSize: items.length, remainingQuota },
    );
  }

  const resolutions: Array<{ channelId: string; externalUserDbId: string | null }> = [];
  for (const item of items) {
    if (item.externalUserId) {
      const ext = await db.externalUser.findUnique({
        where: {
          apiKeyId_externalUserId: {
            apiKeyId: auth.apiKeyId,
            externalUserId: item.externalUserId,
          },
        },
        select: { id: true, channelId: true },
      });
      if (!ext) {
        return jsonError(
          'external_user_not_found',
          `External user "${item.externalUserId}" has not connected a channel. Send them through POST /api/v1/auth/youtube/start.`,
          404,
          { externalUserId: item.externalUserId },
        );
      }
      if (!ext.channelId) {
        return jsonError(
          'external_user_no_channel',
          `External user "${item.externalUserId}" exists but has no channel linked`,
          409,
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
        return jsonError(
          'channel_not_found',
          `Channel "${item.channelId}" not found or not owned by this API key holder`,
          404,
          { channelId: item.channelId },
        );
      }
      if (channel.platform !== 'YOUTUBE') {
        return jsonError(
          'channel_platform_mismatch',
          `Channel "${item.channelId}" is ${channel.platform.toLowerCase()}, but Phase 1 only supports youtube uploads`,
          400,
          { channelId: item.channelId, channelPlatform: channel.platform.toLowerCase() },
        );
      }
      resolutions.push({ channelId: channel.id, externalUserDbId: null });
    }
  }

  let jobs;
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
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code: string }).code === 'P2002'
    ) {
      return jsonError(
        'idempotency_conflict',
        'Concurrent request used the same idempotencyKey — retry to fetch existing jobs',
        409,
        { idempotencyKey },
      );
    }
    throw e;
  }

  await db.apiKey.update({
    where: { id: auth.apiKeyId },
    data: { monthlyUsage: { increment: items.length } },
  });

  return NextResponse.json(
    {
      jobs: jobs.map((j) => ({
        jobId: j.id,
        channelId: j.channelId,
        targetPlatform: j.targetPlatform.toLowerCase(),
        status: j.status.toLowerCase(),
        scheduledAt: j.scheduledAt?.toISOString() ?? null,
        consumerRef: j.consumerRef,
      })),
    },
    { status: 201 },
  );
}
