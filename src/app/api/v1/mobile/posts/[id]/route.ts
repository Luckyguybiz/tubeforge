/**
 * GET   /api/v1/mobile/posts/:id
 * PATCH /api/v1/mobile/posts/:id  { title?, description? } while not on YouTube yet
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fail, ok, readBody, requireUser } from '@/lib/autopost/http';
import { presentPost } from '@/lib/autopost/present';
import { AutopostError, editVideo, ownedJob } from '@/lib/autopost/service';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const Patch = z.object({ title: z.string().max(200).optional(), description: z.string().max(6000).optional() }).strict();

export async function GET(req: Request, { params }: Ctx) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    return ok({ post: presentPost(await ownedJob(auth.userId, id)) });
  } catch (e) {
    if (e instanceof AutopostError) return fail(e.status, e.code, e.message);
    throw e;
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await readBody(req, Patch);
  if (!body.ok) return body.response;
  try {
    const job = await ownedJob(auth.userId, id);
    return ok({ post: presentPost(await editVideo(job, body.data)) });
  } catch (e) {
    if (e instanceof AutopostError) return fail(e.status, e.code, e.message);
    throw e;
  }
}
