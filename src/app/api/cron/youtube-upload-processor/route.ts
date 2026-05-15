import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { createLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { API_ENDPOINTS } from '@/lib/constants';
import { deliverWebhooks } from '@/server/routers/webhook';
import type { Prisma, PrismaClient, UploadJob } from '@prisma/client';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes — chunked upload may take a while

const log = createLogger('worker-upload');

/**
 * YouTube resumable upload worker.
 *
 * Triggered by cron every minute via:
 *   * * * * * curl -sf 'http://localhost:3000/api/cron/youtube-upload-processor?key=$CRON_SECRET' > /dev/null 2>&1
 *
 * Picks QUEUED jobs (where scheduledAt is null or in the past), atomically
 * claims them to prevent double-processing, fetches video bytes from
 * videoUrl, performs YouTube resumable upload server-side, updates job
 * status, and fires deliverWebhooks() on terminal states.
 *
 * Idempotent — safe to invoke multiple times concurrently; atomic UPDATE
 * with status=QUEUED guard ensures one worker per job.
 */

const MAX_JOBS_PER_TICK = 5;
const MAX_RETRIES = 3;
const FETCH_TIMEOUT_MS = 30_000;
const UPLOAD_TIMEOUT_MS = 180_000; // 3 minutes for the PUT

async function getYouTubeToken(userId: string, db: PrismaClient): Promise<string> {
  const account = await db.account.findFirst({
    where: { userId, provider: 'google' },
    select: { id: true, access_token: true, refresh_token: true, expires_at: true },
    orderBy: { expires_at: 'desc' },
  });
  if (!account?.access_token) {
    throw new Error('YouTube account not connected');
  }
  // Refresh if expired
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
    if (!res.ok) throw new Error(`Token refresh failed: HTTP ${res.status}`);
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) throw new Error('Token refresh returned no access_token');
    const expiresIn = typeof data.expires_in === 'number' && data.expires_in > 0 ? data.expires_in : 3600;
    await db.account.update({
      where: { id: account.id },
      data: { access_token: data.access_token, expires_at: Math.floor(Date.now() / 1000) + expiresIn },
    });
    return data.access_token;
  }
  return account.access_token;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

interface YouTubeUploadResponse {
  id: string;
  kind: string;
  snippet?: { title: string; channelId: string };
  status?: { uploadStatus: string };
}

async function processJob(job: UploadJob): Promise<{ ok: true; videoId: string } | { ok: false; error: string; retriable: boolean }> {
  try {
    const token = await getYouTubeToken(job.userId, db);

    // Step 1: POST metadata → get YouTube's resumable session URL
    const status: Record<string, string | boolean> = { privacyStatus: job.privacyStatus };
    if (job.scheduledAt) {
      status.privacyStatus = 'private'; // YouTube requirement for scheduled
      status.publishAt = job.scheduledAt.toISOString();
    }
    const metadataRes = await fetchWithTimeout(
      `${API_ENDPOINTS.YOUTUBE_UPLOAD}?uploadType=resumable&part=snippet,status`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            title: job.title,
            description: job.description ?? undefined,
            tags: job.tags.length > 0 ? job.tags : undefined,
          },
          status,
        }),
      },
      FETCH_TIMEOUT_MS,
    );

    if (!metadataRes.ok) {
      const body = await metadataRes.text().catch(() => '');
      const retriable = metadataRes.status >= 500 || metadataRes.status === 429;
      return { ok: false, error: `Metadata POST failed: HTTP ${metadataRes.status} ${body.slice(0, 200)}`, retriable };
    }

    const uploadUrl = metadataRes.headers.get('location');
    if (!uploadUrl) {
      return { ok: false, error: 'YouTube did not return upload location', retriable: true };
    }

    // Step 2: Fetch source video bytes
    const videoRes = await fetchWithTimeout(job.videoUrl, { method: 'GET' }, UPLOAD_TIMEOUT_MS);
    if (!videoRes.ok) {
      return { ok: false, error: `Source video fetch failed: HTTP ${videoRes.status}`, retriable: videoRes.status >= 500 };
    }
    const contentLength = videoRes.headers.get('content-length');
    const contentType = videoRes.headers.get('content-type') ?? 'video/*';

    // Step 3: PUT video bytes to YouTube's session URL
    // For very large files we'd want chunked PUT with Content-Range — for v1
    // we stream the body straight through.
    const putRes = await fetchWithTimeout(
      uploadUrl,
      {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          ...(contentLength ? { 'Content-Length': contentLength } : {}),
        },
        body: videoRes.body ?? undefined,
        // @ts-expect-error — duplex is required for streaming bodies in Node 18+
        duplex: 'half',
      },
      UPLOAD_TIMEOUT_MS,
    );

    if (!putRes.ok) {
      const body = await putRes.text().catch(() => '');
      return { ok: false, error: `Video PUT failed: HTTP ${putRes.status} ${body.slice(0, 200)}`, retriable: putRes.status >= 500 };
    }

    const result = (await putRes.json().catch(() => ({}))) as YouTubeUploadResponse;
    if (!result.id) {
      return { ok: false, error: 'YouTube did not return a video ID', retriable: true };
    }

    return { ok: true, videoId: result.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Network errors are usually retriable
    const retriable = msg.includes('aborted') || msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT');
    return { ok: false, error: msg, retriable };
  }
}

export async function GET(request: Request) {
  return handleRequest(request);
}
export async function POST(request: Request) {
  return handleRequest(request);
}

async function handleRequest(request: Request) {
  // Auth: either Authorization: Bearer <CRON_SECRET> OR ?key=<CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key');
  const authHeader = request.headers.get('authorization');
  if (queryKey !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workerId = crypto.randomUUID();
  const startedAt = Date.now();

  // Step 1: Atomic claim. Use updateMany with status guard.
  // Two-phase claim: select IDs first, then update each individually.
  // This avoids race conditions where two workers updateMany the same rows.
  const candidates = await db.uploadJob.findMany({
    where: {
      status: 'QUEUED',
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: new Date() } },
      ],
    },
    select: { id: true },
    take: MAX_JOBS_PER_TICK,
    orderBy: { createdAt: 'asc' },
  });

  const claimed: UploadJob[] = [];
  for (const c of candidates) {
    // Atomic conditional update — only flips QUEUED → UPLOADING
    const claim = await db.uploadJob.updateMany({
      where: { id: c.id, status: 'QUEUED' },
      data: {
        status: 'UPLOADING',
        startedAt: new Date(),
        lockedBy: workerId,
        lockedAt: new Date(),
      },
    });
    if (claim.count === 1) {
      const job = await db.uploadJob.findUnique({ where: { id: c.id } });
      if (job) claimed.push(job);
    }
  }

  if (claimed.length === 0) {
    return NextResponse.json({ processed: 0, workerId, durationMs: Date.now() - startedAt });
  }

  log.info('Worker tick claiming jobs', { workerId, count: claimed.length });

  // Step 2: Process claimed jobs in parallel
  const results = await Promise.allSettled(
    claimed.map(async (job) => {
      const result = await processJob(job);
      if (result.ok) {
        await db.uploadJob.update({
          where: { id: job.id },
          data: {
            status: 'COMPLETED',
            youtubeVideoId: result.videoId,
            completedAt: new Date(),
            uploadProgress: 100,
            lockedBy: null,
            lockedAt: null,
          },
        });
        // Fire-and-forget webhook delivery
        deliverWebhooks(job.userId, 'job.completed', {
          jobId: job.id,
          youtubeVideoId: result.videoId,
          channelId: job.channelId,
          title: job.title,
        });
        return { id: job.id, status: 'completed' as const, videoId: result.videoId };
      } else {
        const nextRetryCount = job.retryCount + 1;
        const isRetriable = result.retriable && nextRetryCount < MAX_RETRIES;
        await db.uploadJob.update({
          where: { id: job.id },
          data: {
            status: isRetriable ? 'QUEUED' : 'FAILED',
            errorMessage: result.error.slice(0, 1000),
            retryCount: nextRetryCount,
            startedAt: null,
            lockedBy: null,
            lockedAt: null,
            ...(isRetriable ? {} : { completedAt: new Date() }),
          },
        });
        if (!isRetriable) {
          deliverWebhooks(job.userId, 'job.failed', {
            jobId: job.id,
            error: result.error,
            channelId: job.channelId,
          });
        }
        return { id: job.id, status: isRetriable ? ('requeued' as const) : ('failed' as const), error: result.error };
      }
    }),
  );

  const summary = results.reduce(
    (acc, r) => {
      if (r.status === 'fulfilled') {
        if (r.value.status === 'completed') acc.completed++;
        else if (r.value.status === 'failed') acc.failed++;
        else acc.requeued++;
      } else {
        acc.crashed++;
      }
      return acc;
    },
    { completed: 0, failed: 0, requeued: 0, crashed: 0 },
  );

  return NextResponse.json({
    processed: claimed.length,
    workerId,
    durationMs: Date.now() - startedAt,
    ...summary,
  });
}
