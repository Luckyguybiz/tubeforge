import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db';
import { authenticateApiRequest } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const InputSchema = z.object({
  /** YouTube channel ID owned by the API key holder (Phase 3a) OR
   *  externalUserId mapping for cross-org channel (Phase 3b). */
  channelId: z.string().min(1).max(100).optional(),
  externalUserId: z.string().min(1).max(100).optional(),

  videoUrl: z.string().url().max(2048),
  title: z.string().min(1).max(100),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(30).optional(),
  thumbnailUrl: z.string().url().max(2048).optional(),
  privacyStatus: z.enum(['public', 'unlisted', 'private']).default('private'),
  scheduledAt: z.string().datetime().optional(),
});

/**
 * POST /api/v1/youtube/upload
 *
 * Creates an async UploadJob. Worker picks it up within 60s and PUTs
 * the video bytes to YouTube server-side. Returns { jobId } immediately
 * so caller can poll GET /api/v1/youtube/jobs/:id or wait for webhook.
 *
 * Auth: X-Forge-Key: tf_<key>
 *
 * Phase 3a: channelId must belong to the API key holder.
 * Phase 3b: externalUserId resolves the linked channel via ExternalUser
 *   mapping. The integrating org's end-user must have completed OAuth
 *   via /api/v1/auth/youtube/start.
 */
export async function POST(req: Request) {
  const auth = await authenticateApiRequest(req);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'invalid_json', message: 'Request body must be valid JSON' } },
      { status: 400 },
    );
  }

  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'invalid_input',
          message: 'Validation failed',
          details: parsed.error.issues,
        },
      },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // Either channelId (Phase 3a) or externalUserId (Phase 3b) must be set.
  if (!input.channelId && !input.externalUserId) {
    return NextResponse.json(
      {
        error: {
          code: 'missing_target',
          message: 'Either channelId or externalUserId must be provided',
        },
      },
      { status: 400 },
    );
  }

  // Resolve target channel
  let channelId: string;
  let externalUserDbId: string | null = null;

  if (input.externalUserId) {
    // Phase 3b: look up external user mapping
    const ext = await db.externalUser.findUnique({
      where: {
        apiKeyId_externalUserId: {
          apiKeyId: auth.apiKeyId,
          externalUserId: input.externalUserId,
        },
      },
      select: { id: true, channelId: true },
    });
    if (!ext) {
      return NextResponse.json(
        {
          error: {
            code: 'external_user_not_found',
            message: 'External user has not connected a YouTube channel. Send them to /api/v1/auth/youtube/start.',
          },
        },
        { status: 404 },
      );
    }
    if (!ext.channelId) {
      return NextResponse.json(
        {
          error: {
            code: 'external_user_no_channel',
            message: 'External user record exists but no channel is linked',
          },
        },
        { status: 409 },
      );
    }
    channelId = ext.channelId;
    externalUserDbId = ext.id;
  } else {
    // Phase 3a: API key holder's own channel
    const channel = await db.channel.findFirst({
      where: { id: input.channelId!, userId: auth.userId },
      select: { id: true },
    });
    if (!channel) {
      return NextResponse.json(
        {
          error: {
            code: 'channel_not_found',
            message: 'Channel not found or not owned by this API key',
          },
        },
        { status: 404 },
      );
    }
    channelId = channel.id;
  }

  // Privacy enforcement (YouTube requires private for scheduled)
  const effectivePrivacy = input.scheduledAt ? 'private' : input.privacyStatus;

  // Create job
  const job = await db.uploadJob.create({
    data: {
      userId: auth.userId,
      apiKeyId: auth.apiKeyId,
      externalUserId: externalUserDbId,
      source: 'API',
      channelId,
      videoUrl: input.videoUrl,
      thumbnailUrl: input.thumbnailUrl,
      title: input.title,
      description: input.description,
      tags: input.tags ?? [],
      privacyStatus: effectivePrivacy,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      status: 'QUEUED',
    },
    select: { id: true, status: true, scheduledAt: true, createdAt: true },
  });

  // Increment quota usage
  await db.apiKey.update({
    where: { id: auth.apiKeyId },
    data: { monthlyUsage: { increment: 1 } },
  });

  const estimatedCompletion = input.scheduledAt
    ? new Date(new Date(input.scheduledAt).getTime() + 30_000).toISOString()
    : new Date(Date.now() + 60_000).toISOString();

  return NextResponse.json(
    {
      jobId: job.id,
      status: 'queued',
      scheduledAt: job.scheduledAt?.toISOString() ?? null,
      estimatedCompletion,
    },
    { status: 202 },
  );
}
