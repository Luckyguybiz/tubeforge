/**
 * POST /api/v1/mobile/auth/sign-out
 *
 * Revokes the device key that made the request. The key row stays with
 * revokedAt set (visible in Settings → API keys on the web).
 */
import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { ok, requireUser } from '@/lib/autopost/http';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  await db.apiKey.update({ where: { id: auth.apiKeyId }, data: { revokedAt: new Date() } });
  await db.auditLog
    .create({ data: { userId: auth.userId, action: 'autopost.sign_out', target: auth.apiKeyId } })
    .catch(() => undefined);
  return ok({ ok: true });
}
