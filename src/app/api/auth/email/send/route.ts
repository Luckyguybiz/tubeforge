/**
 * POST /api/auth/email/send
 * Issues a fresh 6-digit code for the supplied email and delivers it.
 *
 * Anti-enumeration: the response is always `{ ok: true }` (status 200) with
 * a sub-second baseline so an attacker cannot tell whether the email exists
 * in our database. Errors that the user can act on (rate limit, malformed
 * email) DO return 4xx — there is no enumeration risk in those signals.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { issueCode, normalizeEmail, CODE_TTL_MS } from '@/lib/email-code';
import { sendEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

export const runtime = 'nodejs';

const log = createLogger('auth-email-send');

const BodySchema = z.object({
  email: z.string().email().max(254),
  locale: z.enum(['en', 'ru']).optional(),
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
      { ok: false, error: 'invalid_email' },
      { status: 400 },
    );
  }

  const email = normalizeEmail(parsed.email);
  const locale = parsed.locale ?? 'en';
  const ip = clientIp(req);

  // Per-email send budget: 3 codes per 15 minutes — generous for typo
  // recoveries, tight enough to make spamming someone's inbox cost real money.
  const emailLimit = await rateLimit({
    identifier: `auth:email:send:email:${email}`,
    limit: 3,
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

  // Per-IP send budget: 10 codes per hour. Defends against an attacker
  // cycling through many emails to flood our Resend quota.
  const ipLimit = await rateLimit({
    identifier: `auth:email:send:ip:${ip}`,
    limit: 10,
    window: 60 * 60,
  });
  if (!ipLimit.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'rate_limited',
        retryAt: ipLimit.reset,
      },
      { status: 429 },
    );
  }

  try {
    const code = await issueCode(email);
    // sendEmail is non-throwing; if RESEND_API_KEY is not set the call is
    // logged and skipped — production must have it set, see deploy checklist.
    await sendEmail({
      to: email,
      template: 'email-verification',
      data: { code, locale, ttlMinutes: Math.floor(CODE_TTL_MS / 60_000) },
    });
    log.info('Code issued', { email, ip });
  } catch (err) {
    // DB write failed — surface to the caller so they retry, but do NOT
    // leak the underlying message.
    log.error('issueCode failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { ok: false, error: 'server_error' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
