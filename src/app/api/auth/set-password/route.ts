/**
 * POST /api/auth/set-password
 * Sets (or replaces) the bcrypt hash on the authenticated user. Used
 * after the first OTP login to opt the user into faster password
 * sign-in, and from /settings to rotate the password.
 *
 * To rotate an existing password the caller must supply the current
 * password — protects against stolen-session abuse where a hijacker
 * could otherwise lock the real owner out by setting their own.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import {
  hashPassword,
  validatePassword,
  verifyPassword,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '@/lib/password';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

export const runtime = 'nodejs';

const log = createLogger('auth-set-password');

const BodySchema = z.object({
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`),
  // Required when changing an existing password; ignored on first set
  currentPassword: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message ?? 'invalid_input' : 'invalid_input';
    return NextResponse.json({ ok: false, error: 'invalid_password', message }, { status: 400 });
  }

  const v = validatePassword(parsed.password);
  if (!v.ok) {
    return NextResponse.json({ ok: false, error: v.reason }, { status: 400 });
  }

  // 5 set-password attempts per user per 10 minutes — defends against
  // brute-forcing the currentPassword check during rotation.
  const limit = await rateLimit({
    identifier: `auth:set-password:${session.user.id}`,
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
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  // If a password is already set, require the current one to rotate.
  if (user.passwordHash) {
    if (!parsed.currentPassword) {
      return NextResponse.json(
        { ok: false, error: 'current_password_required' },
        { status: 400 },
      );
    }
    const valid = await verifyPassword(parsed.currentPassword, user.passwordHash);
    if (!valid) {
      log.warn('Wrong currentPassword on rotate', { userId: user.id });
      return NextResponse.json(
        { ok: false, error: 'current_password_invalid' },
        { status: 400 },
      );
    }
  }

  const hash = await hashPassword(parsed.password);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hash },
  });

  log.info('Password set', { userId: user.id, rotation: !!user.passwordHash });
  return NextResponse.json({ ok: true });
}
