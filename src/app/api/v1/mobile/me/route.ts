/**
 * GET /api/v1/mobile/me: who is signed in on this device.
 */
import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { fail, ok, requireUser } from '@/lib/autopost/http';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  const user = await db.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, email: true, name: true, image: true, createdAt: true },
  });
  if (!user) return fail(401, 'invalid_api_key', 'Account not found');
  return ok({ user: { ...user, createdAt: user.createdAt.toISOString() } });
}
