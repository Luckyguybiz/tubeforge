/**
 * GET /api/v1/mobile/channels/:id/slots?count=5: nearest free slots.
 */
import { NextResponse } from 'next/server';
import { fail, ok, requireUser } from '@/lib/autopost/http';
import { AutopostError, ownedChannel, suggestSlots } from '@/lib/autopost/service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const count = Number(new URL(req.url).searchParams.get('count') ?? '5');
  try {
    await ownedChannel(auth.userId, id);
    const slots = await suggestSlots(id, Number.isFinite(count) ? count : 5);
    return ok({ slots: slots.map((s) => ({ at: s.at.toISOString(), reason: s.reason })) });
  } catch (e) {
    if (e instanceof AutopostError) return fail(e.status, e.code, e.message);
    throw e;
  }
}
