import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { authenticateApiRequest } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/youtube/jobs/[id]
 *
 * Returns full job status. Use this for polling when not subscribing to
 * webhooks. Throttle to ≤1 req/sec per job.
 *
 * Auth: X-Forge-Key
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const job = await db.uploadJob.findFirst({
    where: { id, apiKeyId: auth.apiKeyId },
    select: {
      id: true,
      status: true,
      uploadProgress: true,
      youtubeVideoId: true,
      errorMessage: true,
      retryCount: true,
      scheduledAt: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
      title: true,
      privacyStatus: true,
      channelId: true,
      webhookDelivered: true,
    },
  });

  if (!job) {
    return NextResponse.json(
      { error: { code: 'not_found', message: 'Job not found or not owned by this API key' } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status.toLowerCase(),
    title: job.title,
    privacyStatus: job.privacyStatus,
    channelId: job.channelId,
    uploadProgress: job.uploadProgress,
    youtubeVideoId: job.youtubeVideoId,
    youtubeUrl: job.youtubeVideoId ? `https://youtube.com/watch?v=${job.youtubeVideoId}` : null,
    errorMessage: job.errorMessage,
    retryCount: job.retryCount,
    scheduledAt: job.scheduledAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    webhookDelivered: job.webhookDelivered,
  });
}

/**
 * POST /api/v1/youtube/jobs/[id]/cancel
 *
 * Cancels a QUEUED job. 409 if already UPLOADING/COMPLETED/etc.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  // Path resolution: this same route accepts POST for "cancel" by convention
  // (no separate /cancel subpath to keep routing simple). REST purists may
  // prefer DELETE — both are valid here, POST chosen for parity with tRPC.

  const job = await db.uploadJob.findFirst({
    where: { id, apiKeyId: auth.apiKeyId },
    select: { id: true, status: true },
  });
  if (!job) {
    return NextResponse.json(
      { error: { code: 'not_found', message: 'Job not found' } },
      { status: 404 },
    );
  }
  if (job.status !== 'QUEUED') {
    return NextResponse.json(
      {
        error: {
          code: 'invalid_state',
          message: `Cannot cancel a job in ${job.status} state`,
        },
      },
      { status: 409 },
    );
  }
  await db.uploadJob.update({
    where: { id },
    data: { status: 'CANCELLED', completedAt: new Date() },
  });
  return NextResponse.json({ cancelled: true, jobId: id });
}
