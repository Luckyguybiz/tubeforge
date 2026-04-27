/**
 * POST /api/auth/remove-password
 * Disables password sign-in for the authenticated user. Returns the
 * account back to OTP-only. Requires the current password to confirm —
 * defence against a hijacked session silently disabling the password
 * the real owner relies on.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { verifyPassword } from '@/lib/password';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

export const runtime = 'nodejs';

const log = createLogger('auth-remove-password');

const BodySchema = z.object({
  currentPassword: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });
  }

  const limit = await rateLimit({
    identifier: `auth:remove-password:${session.user.id}`,
    limit: 5,
    window: 10 * 60,
  });
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', retryAt: limit.reset },
      { status: 429 },
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ ok: false, error: 'no_password_set' }, { status: 400 });
  }

  const valid = await verifyPassword(parsed.currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { ok: false, error: 'current_password_invalid' },
      { status: 400 },
    );
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: null },
  });

  log.info('Password removed', { userId: user.id });
  return NextResponse.json({ ok: true });
}
