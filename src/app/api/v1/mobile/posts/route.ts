/**
 * GET  /api/v1/mobile/posts?from&to&channelId&status=a,b&limit
 *      Videos of the signed-in person. from/to filter by the publish time
 *      (scheduled or actual), both inclusive; videos without a time (stock)
 *      are left out when a range is given.
 * POST /api/v1/mobile/posts  { channelId, title, description?, fileId, publishAt, visibility }
 *      Creates a video from a file sent to /uploads. publishAt = "auto" puts
 *      it into the nearest free slot (or the stock if there is none).
 *      Idempotent per fileId: a repeated call returns the same video.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma, UploadJobStatus } from '@prisma/client';
import { db } from '@/server/db';
import { fail, ok, readBody, requireUser } from '@/lib/autopost/http';
import { findVideo, isFileId, mediaUrl, videoFacts } from '@/lib/autopost/media';
import { presentPost, statusOf, type MobilePostStatus } from '@/lib/autopost/present';
import { AutopostError, createVideo, maintain } from '@/lib/autopost/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES: MobilePostStatus[] = ['ready', 'scheduled', 'uploading', 'published', 'failed', 'cancelled'];
const DB_STATUS: Record<MobilePostStatus, UploadJobStatus> = {
  ready: 'QUEUED',
  scheduled: 'QUEUED',
  uploading: 'UPLOADING',
  published: 'COMPLETED',
  failed: 'FAILED',
  cancelled: 'CANCELLED',
};

function date(v: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  await maintain(auth.userId);

  const q = new URL(req.url).searchParams;
  const from = date(q.get('from'));
  const to = date(q.get('to'));
  const channelId = q.get('channelId');
  const wanted = (q.get('status') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is MobilePostStatus => (STATUSES as string[]).includes(s));
  const limit = Math.max(1, Math.min(500, Number(q.get('limit') ?? '300') || 300));

  const where: Prisma.UploadJobWhereInput = { userId: auth.userId };
  if (channelId) where.channelId = channelId;
  if (wanted.length) where.status = { in: [...new Set(wanted.map((s) => DB_STATUS[s]))] };
  if (from || to) {
    const range = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
    where.OR = [{ scheduledAt: range }, { scheduledAt: null, completedAt: range, status: 'COMPLETED' }];
  }

  const jobs = await db.uploadJob.findMany({
    where,
    orderBy: [{ scheduledAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
    take: limit,
  });
  const posts = jobs.filter((j) => !wanted.length || wanted.includes(statusOf(j))).map(presentPost);
  return ok({ posts });
}

const Create = z.object({
  channelId: z.string().min(1).max(100),
  title: z.string().max(200),
  description: z.string().max(6000).optional(),
  fileId: z.string().refine(isFileId, 'Unknown file'),
  publishAt: z.union([z.literal('auto'), z.string().datetime({ offset: true })]),
  visibility: z.enum(['public', 'unlisted', 'private']).default('public'),
});

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  const body = await readBody(req, Create);
  if (!body.ok) return body.response;
  const input = body.data;

  const existing = await db.uploadJob.findFirst({ where: { userId: auth.userId, idempotencyKey: input.fileId } });
  if (existing) return ok({ post: presentPost(existing) });

  const file = await findVideo(auth.userId, input.fileId);
  if (!file) return fail(404, 'file_missing', 'The file was not found. Upload it again.');

  const facts = await videoFacts(auth.userId, input.fileId, file.ext);
  try {
    const job = await createVideo(auth.userId, auth.apiKeyId, {
      channelId: input.channelId,
      title: input.title,
      description: input.description ?? '',
      fileId: input.fileId,
      ext: file.ext,
      size: file.size,
      durationSec: facts.durationSec,
      publishAt: input.publishAt,
      visibility: input.visibility,
      videoUrl: mediaUrl(auth.userId, input.fileId, 'video', file.ext),
      thumbnailUrl: facts.hasThumb ? mediaUrl(auth.userId, input.fileId, 'thumb') : null,
    });
    return ok({ post: presentPost(job) }, 201);
  } catch (e) {
    if (e instanceof AutopostError) return fail(e.status, e.code, e.message);
    throw e;
  }
}
