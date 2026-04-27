/**
 * POST /api/auth/email/verify
 * Verifies a 6-digit code and, on success, marks the email as verified and
 * returns `{ ok: true }`. The browser then calls NextAuth's `signIn` with
 * the `email-code` Credentials provider, which re-checks the code (defence
 * in depth) and creates the session.
 *
 * We deliberately do NOT issue the JWT here — keeping NextAuth as the single
 * point of session creation avoids drift between the credentials provider
 * cookie format and any custom format we might invent.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db';
import { hashCode, normalizeEmail } from '@/lib/email-code';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

export const runtime = 'nodejs';

const log = createLogger('auth-email-verify');

const BodySchema = z.object({
  email: z.string().email().max(254),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof BodySchema>;
  try {
    const json = await req.json();
    parsed = BodySchema.parse(json);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_input' },
      { status: 400 },
    );
  }

  const email = normalizeEmail(parsed.email);
  const ip = clientIp(req);

  // 5 verify attempts per email per 15 minutes. After exhausting, the user
  // must wait — even with a fresh code, the limit applies to verify clicks
  // (anti brute-force across rotating codes).
  const emailLimit = await rateLimit({
    identifier: `auth:email:verify:email:${email}`,
    limit: 5,
    window: 15 * 60,
  });
  if (!emailLimit.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'rate_limited',
        retryAt: emailLimit.reset,
      },
      { status: 429 },
    );
  }

  // Look up the active token. We DON'T call consumeCode() here because the
  // NextAuth Credentials provider also runs verification — consuming twice
  // would invalidate the code before signIn() finishes. Instead we peek and
  // let the provider call consumeCode on its own.
  const stored = await db.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { expires: 'desc' },
  });

  if (!stored) {
    return NextResponse.json(
      { ok: false, error: 'invalid_code' },
      { status: 400 },
    );
  }

  if (stored.expires < new Date()) {
    await db.verificationToken.deleteMany({ where: { identifier: email } });
    return NextResponse.json(
      { ok: false, error: 'expired_code' },
      { status: 400 },
    );
  }

  const expected = hashCode(email, parsed.code);
  if (stored.token !== expected) {
    return NextResponse.json(
      { ok: false, error: 'invalid_code' },
      { status: 400 },
    );
  }

  log.info('Code verified — handing off to NextAuth signIn', { email, ip });
  return NextResponse.json({ ok: true });
}
