/**
 * POST /api/v1/mobile/posts/:id/retry
 * POST /api/v1/mobile/posts/:id/reschedule   { at: ISO | "auto" }
 * POST /api/v1/mobile/posts/:id/cancel
 * POST /api/v1/mobile/posts/:id/restore
 * POST /api/v1/mobile/posts/:id/publish-now
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fail, ok, readBody, requireUser } from '@/lib/autopost/http';
import { findVideo } from '@/lib/autopost/media';
import { presentPost } from '@/lib/autopost/present';
import {
  AutopostError,
  cancelVideo,
  metaOf,
  ownedJob,
  publishVideoNow,
  rescheduleVideo,
  restoreVideo,
  retryVideo,
} from '@/lib/autopost/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Reschedule = z.object({ at: z.union([z.literal('auto'), z.string().datetime({ offset: true })]) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string; action: string }> }) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  const { id, action } = await params;
  try {
    const job = await ownedJob(auth.userId, id);
    switch (action) {
      case 'retry':
        return ok({ post: presentPost(await retryVideo(job)) });
      case 'reschedule': {
        const body = await readBody(req, Reschedule);
        if (!body.ok) return body.response;
        return ok({ post: presentPost(await rescheduleVideo(job, body.data.at)) });
      }
      case 'cancel':
        return ok({ post: presentPost(await cancelVideo(job)) });
      case 'restore': {
        const meta = metaOf(job);
        const exists = meta.fileId ? !!(await findVideo(auth.userId, meta.fileId)) : false;
        return ok({ post: presentPost(await restoreVideo(job, exists)) });
      }
      case 'publish-now':
        return ok({ post: presentPost(await publishVideoNow(job)) });
      default:
        return fail(404, 'unknown_action', 'Unknown action');
    }
  } catch (e) {
    if (e instanceof AutopostError) return fail(e.status, e.code, e.message);
    throw e;
  }
}
