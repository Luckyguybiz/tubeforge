import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
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
 * Record a worker breadcrumb + capture exception to Sentry. Tagged
 * with worker.youtube-upload-processor and the failing jobId so we
 * can filter production errors by job/user/retry.
 */
function captureWorkerError(
  err: Error | string,
  context: {
    jobId?: string;
    userId?: string;
    retryCount?: number;
    operation?: string;
  },
) {
  const error = typeof err === 'string' ? new Error(err) : err;
  Sentry.withScope((scope) => {
    scope.setTag('worker', 'youtube-upload-processor');
    if (context.jobId) scope.setTag('jobId', context.jobId);
    if (context.userId) scope.setUser({ id: context.userId });
    if (context.retryCount !== undefined) scope.setExtra('retryCount', context.retryCount);
    if (context.operation) scope.setTag('operation', context.operation);
    Sentry.captureException(error);
  });
}

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

    // Step 2: Probe source for size (HEAD), then fetch (GET)
    const headRes = await fetchWithTimeout(job.videoUrl, { method: 'HEAD' }, FETCH_TIMEOUT_MS).catch(() => null);
    let knownSize: number | null = null;
    let contentType = 'video/*';
    if (headRes && headRes.ok) {
      const cl = headRes.headers.get('content-length');
      knownSize = cl ? parseInt(cl, 10) : null;
      contentType = headRes.headers.get('content-type') ?? contentType;
    }

    const videoRes = await fetchWithTimeout(job.videoUrl, { method: 'GET' }, UPLOAD_TIMEOUT_MS);
    if (!videoRes.ok) {
      return { ok: false, error: `Source video fetch failed: HTTP ${videoRes.status}`, retriable: videoRes.status >= 500 };
    }
    // If HEAD didn't yield size, try Content-Length from GET response
    if (knownSize === null) {
      const cl = videoRes.headers.get('content-length');
      if (cl) knownSize = parseInt(cl, 10);
    }
    if (!videoRes.headers.get('content-type') && contentType === 'video/*') {
      contentType = videoRes.headers.get('content-type') ?? contentType;
    }

    // Decide path: single PUT for small known-size, chunked for large/unknown.
    // 50 MB threshold matches YouTube's recommendation for multi-part uploads.
    const SMALL_THRESHOLD = 50 * 1024 * 1024;

    if (knownSize !== null && knownSize <= SMALL_THRESHOLD) {
      // Fast path — single PUT (existing behaviour, preserves the original
      // codepath that has been working in production)
      const putRes = await fetchWithTimeout(
        uploadUrl,
        {
          method: 'PUT',
          headers: {
            'Content-Type': contentType,
            'Content-Length': String(knownSize),
          },
          body: videoRes.body ?? undefined,
          // @ts-expect-error — duplex is required for streaming bodies in Node 18+
          duplex: 'half',
        },
        UPLOAD_TIMEOUT_MS,
      );

      if (!putRes.ok) {
        const body = await putRes.text().catch(() => '');
        return {
          ok: false,
          error: `Video PUT failed: HTTP ${putRes.status} ${body.slice(0, 200)}`,
          retriable: putRes.status >= 500,
        };
      }

      const result = (await putRes.json().catch(() => ({}))) as YouTubeUploadResponse;
      if (!result.id) return { ok: false, error: 'YouTube did not return a video ID', retriable: true };
      return { ok: true, videoId: result.id };
    }

    // Slow path — chunked PUT with Content-Range. Resilient to slow/unstable
    // networks because each 8MB chunk is its own request with its own timeout.
    // YouTube returns 308 Resume Incomplete after each non-final chunk, and
    // the final chunk yields 200/201 with the video metadata.
    if (!videoRes.body) {
      return { ok: false, error: 'Source response has no body to stream', retriable: false };
    }
    const result = await uploadChunked({
      uploadUrl,
      sourceStream: videoRes.body,
      contentType,
      totalSize: knownSize, // may be null — pass through
      onProgress: async (offset) => {
        // Best-effort progress update — fire-and-forget, never block PUTs
        if (knownSize && knownSize > 0) {
          const pct = Math.min(100, Math.round((offset / knownSize) * 100));
          db.uploadJob.update({
            where: { id: job.id },
            data: { uploadProgress: pct },
            select: { id: true },
          }).catch(() => { /* non-critical */ });
        }
      },
    });
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Network errors are usually retriable
    const retriable = msg.includes('aborted') || msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT');
    return { ok: false, error: msg, retriable };
  }
}

/**
 * Chunked resumable PUT to a YouTube upload session.
 *
 * Reads source bytes in CHUNK_SIZE pieces, sends each as a Content-Range
 * PUT, and stitches the offsets. For known-size uploads we send the
 * proper "bytes a-b/total" header. For unknown-size we send "bytes a-b/*"
 * and only set the total on the final chunk.
 *
 * Retries each chunk PUT up to 3 times on 5xx / network errors before
 * giving up. Reports `onProgress` after each successful chunk.
 */
const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB — YouTube best practice multiple of 256KB
const CHUNK_MAX_RETRIES = 3;
const CHUNK_TIMEOUT_MS = 90_000; // 90s per chunk

async function uploadChunked(opts: {
  uploadUrl: string;
  sourceStream: ReadableStream<Uint8Array>;
  contentType: string;
  totalSize: number | null;
  onProgress?: (offset: number) => void | Promise<void>;
}): Promise<{ ok: true; videoId: string } | { ok: false; error: string; retriable: boolean }> {
  const reader = opts.sourceStream.getReader();
  let buffer = new Uint8Array(0);
  let offset = 0;
  let receivedEof = false;

  // Fill `buffer` until it contains at least CHUNK_SIZE bytes or stream
  // ends. Returns the chunk and whether stream is exhausted.
  async function readChunk(): Promise<{ chunk: Uint8Array; eof: boolean }> {
    while (buffer.length < CHUNK_SIZE && !receivedEof) {
      const { value, done } = await reader.read();
      if (done) {
        receivedEof = true;
        break;
      }
      if (value && value.length > 0) {
        const next = new Uint8Array(buffer.length + value.length);
        next.set(buffer, 0);
        next.set(value, buffer.length);
        buffer = next;
      }
    }
    const chunkSize = Math.min(CHUNK_SIZE, buffer.length);
    const chunk = buffer.slice(0, chunkSize);
    buffer = buffer.slice(chunkSize);
    return { chunk, eof: receivedEof && buffer.length === 0 };
  }

  while (true) {
    const { chunk, eof } = await readChunk();

    if (chunk.length === 0 && !eof) {
      // Shouldn't happen — bail to avoid infinite loop
      return { ok: false, error: 'Source stream stalled (read returned 0 bytes mid-stream)', retriable: true };
    }
    if (chunk.length === 0 && eof) {
      // Stream ended exactly on a chunk boundary; finalize with empty body
      // by sending a 0-byte Content-Range on the trailing position.
      // YouTube requires the final PUT to include the total size.
      const finalRange = `bytes */${offset}`;
      const finalRes = await fetchWithTimeout(
        opts.uploadUrl,
        {
          method: 'PUT',
          headers: {
            'Content-Type': opts.contentType,
            'Content-Length': '0',
            'Content-Range': finalRange,
          },
        },
        CHUNK_TIMEOUT_MS,
      );
      return parseFinalResponse(finalRes, offset);
    }

    const start = offset;
    const end = offset + chunk.length - 1;
    // Range header. If we know the total, use it; else `*` until the last chunk.
    const totalStr =
      opts.totalSize !== null
        ? String(opts.totalSize)
        : eof
          ? String(offset + chunk.length)
          : '*';
    const rangeHeader = `bytes ${start}-${end}/${totalStr}`;

    // Retry the chunk up to CHUNK_MAX_RETRIES on 5xx / network errors
    let lastError = '';
    let chunkRes: Response | null = null;
    for (let attempt = 0; attempt <= CHUNK_MAX_RETRIES; attempt++) {
      try {
        chunkRes = await fetchWithTimeout(
          opts.uploadUrl,
          {
            method: 'PUT',
            headers: {
              'Content-Type': opts.contentType,
              'Content-Length': String(chunk.length),
              'Content-Range': rangeHeader,
            },
            // Cast to ArrayBuffer view — fetch accepts BufferSource, of
            // which Uint8Array<ArrayBuffer> is a member. TS lib types
            // generic'd this on ArrayBufferLike which fetch refuses.
            body: chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength) as ArrayBuffer,
          },
          CHUNK_TIMEOUT_MS,
        );
        // 308 Resume Incomplete is the expected response for non-final chunks
        if (chunkRes.status === 308 || chunkRes.ok) break;
        if (chunkRes.status < 500) {
          // 4xx — not retriable
          const body = await chunkRes.text().catch(() => '');
          return {
            ok: false,
            error: `Chunked PUT failed: HTTP ${chunkRes.status} at offset ${start} — ${body.slice(0, 200)}`,
            retriable: false,
          };
        }
        lastError = `HTTP ${chunkRes.status}`;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
      }
      if (attempt < CHUNK_MAX_RETRIES) {
        // Exponential backoff: 1s, 3s, 7s
        await new Promise((r) => setTimeout(r, (2 ** attempt) * 1000 + 1000));
      }
    }

    if (!chunkRes || (!chunkRes.ok && chunkRes.status !== 308)) {
      return {
        ok: false,
        error: `Chunked PUT exhausted retries at offset ${start} — ${lastError}`,
        retriable: true,
      };
    }

    offset += chunk.length;
    if (opts.onProgress) {
      await opts.onProgress(offset);
    }

    // If the final chunk: YouTube returns 200/201 with video metadata
    if (eof || chunkRes.ok) {
      return parseFinalResponse(chunkRes, offset);
    }
    // Otherwise loop — next iteration reads next 8MB
  }
}

async function parseFinalResponse(
  res: Response,
  totalUploaded: number,
): Promise<{ ok: true; videoId: string } | { ok: false; error: string; retriable: boolean }> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return {
      ok: false,
      error: `Final chunk failed after ${totalUploaded} bytes: HTTP ${res.status} ${body.slice(0, 200)}`,
      retriable: res.status >= 500,
    };
  }
  const result = (await res.json().catch(() => ({}))) as YouTubeUploadResponse;
  if (!result.id) {
    return { ok: false, error: 'YouTube did not return a video ID on final chunk', retriable: true };
  }
  return { ok: true, videoId: result.id };
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
          // Permanent failure — capture to Sentry for ops alerting.
          // Retriable failures are NOT sent (would be noisy — single
          // retry-then-success is normal at scale).
          captureWorkerError(result.error, {
            jobId: job.id,
            userId: job.userId,
            retryCount: nextRetryCount,
            operation: 'youtube-upload',
          });
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
    (acc, r, i) => {
      if (r.status === 'fulfilled') {
        if (r.value.status === 'completed') acc.completed++;
        else if (r.value.status === 'failed') acc.failed++;
        else acc.requeued++;
      } else {
        acc.crashed++;
        // Sentry capture for uncaught crashes (rare — processJob has its
        // own try/catch, so this only fires if something throws in the
        // Prisma update or webhook delivery section).
        const failedJob = claimed[i];
        captureWorkerError(
          r.reason instanceof Error ? r.reason : new Error(String(r.reason)),
          {
            jobId: failedJob?.id,
            userId: failedJob?.userId,
            operation: 'worker-tick-crash',
          },
        );
        // Best-effort: release the lock + flip to FAILED so it does not
        // hang in UPLOADING forever
        if (failedJob) {
          db.uploadJob
            .update({
              where: { id: failedJob.id, status: 'UPLOADING' },
              data: {
                status: 'FAILED',
                errorMessage: 'Worker crashed during job processing',
                completedAt: new Date(),
                lockedBy: null,
                lockedAt: null,
              },
            })
            .catch(() => {
              /* lock release best-effort */
            });
        }
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
