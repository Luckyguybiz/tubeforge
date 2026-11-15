/**
 * POST /api/v1/mobile/uploads
 * Body: the video bytes as is (Content-Type: video/mp4 | video/quicktime | video/webm).
 *
 * Streams the file to the media disk and answers with a fileId for
 * POST /api/v1/mobile/posts. The path is excluded from the middleware
 * matcher (src/middleware.ts), so its 100 MB body buffer does not apply.
 */
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';
import { fail, ok, requireUser } from '@/lib/autopost/http';
import { MAX_VIDEO_BYTES, MediaError, mediaUrl, storeVideo } from '@/lib/autopost/media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 900;

const log = createLogger('mobile-upload');

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const limit = await rateLimit({ identifier: `autopost:upload:${auth.userId}`, limit: 60, window: 3600 });
  if (!limit.success) return fail(429, 'rate_limited', 'Too many uploads in an hour');

  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > MAX_VIDEO_BYTES) return fail(413, 'too_large', 'The file is larger than 2 GB');
  if (!req.body) return fail(400, 'empty', 'No file in the request');

  try {
    const stored = await storeVideo(auth.userId, req.body);
    return ok(
      {
        fileId: stored.fileId,
        size: stored.size,
        durationSec: stored.durationSec,
        thumbnailUrl: stored.hasThumb ? mediaUrl(auth.userId, stored.fileId, 'thumb') : null,
      },
      201,
    );
  } catch (e) {
    if (e instanceof MediaError) {
      const status = e.code === 'too_large' ? 413 : e.code === 'not_video' ? 415 : 400;
      return fail(status, e.code, e.message);
    }
    log.error('Upload failed', { error: e instanceof Error ? e.message : String(e) });
    return fail(500, 'server_error', 'Could not save the file');
  }
}
