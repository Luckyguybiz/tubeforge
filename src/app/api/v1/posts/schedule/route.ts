import { NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { UploadBatchSchema, createUploadJobs } from '@/lib/publishing/create-upload-jobs';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/posts/schedule — batch publishing endpoint.
 *
 * Wraps the existing single-item /api/v1/youtube/upload logic in a
 * batch primitive with idempotency. Designed to be the primary entry
 * point for high-volume consumers like Lucky Team (autopost pipeline).
 * The same core (`createUploadJobs`) powers the MCP
 * `tubeforge_schedule_uploads` tool.
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

  const parsed = UploadBatchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_input', 'Validation failed', 400, parsed.error.issues);
  }
  const { items, idempotencyKey } = parsed.data;

  const result = await createUploadJobs(auth, items, idempotencyKey);
  if (!result.ok) {
    return jsonError(result.code, result.message, result.status, result.details);
  }
  if (!result.created) {
    return NextResponse.json({ idempotent: true, jobs: result.jobs });
  }
  return NextResponse.json({ jobs: result.jobs }, { status: 201 });
}
