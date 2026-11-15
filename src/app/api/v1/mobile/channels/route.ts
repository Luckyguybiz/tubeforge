/**
 * GET /api/v1/mobile/channels: channels of the signed-in person with rules,
 * connection state and counters.
 */
import { NextResponse } from 'next/server';
import { ok, requireUser } from '@/lib/autopost/http';
import { listMobileChannels } from '@/lib/autopost/present';
import { maintain } from '@/lib/autopost/service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  await maintain(auth.userId);
  return ok({ channels: await listMobileChannels(auth.userId) });
}
