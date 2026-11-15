/**
 * POST /api/v1/mobile/auth/code  { email, locale? }
 *
 * Step one of the phone sign-in: a 6-digit code goes to the email. Same code
 * store and limits as the web login (src/app/api/auth/email/send). Always
 * answers { ok: true } for a well-formed email so the endpoint does not tell
 * whether an account exists.
 */
import { z } from 'zod';
import { CODE_TTL_MS, issueCode, normalizeEmail } from '@/lib/email-code';
import { sendEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';
import { clientIp, fail, ok, readBody } from '@/lib/autopost/http';
import { isReviewEmail } from '@/lib/autopost/review';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const log = createLogger('mobile-auth-code');

const Body = z.object({
  email: z.string().trim().email('Enter a valid email').max(254),
  locale: z.enum(['ru', 'en']).optional(),
});

export async function POST(req: Request) {
  const body = await readBody(req, Body);
  if (!body.ok) return fail(400, 'invalid_email', 'Enter a valid email');
  const email = normalizeEmail(body.data.email);
  const locale = body.data.locale ?? 'en';
  const ttlMinutes = Math.floor(CODE_TTL_MS / 60_000);

  if (isReviewEmail(email)) return ok({ ok: true, ttlMinutes });

  const perEmail = await rateLimit({ identifier: `auth:email:send:email:${email}`, limit: 3, window: 15 * 60 });
  if (!perEmail.success) return fail(429, 'rate_limited', 'Too many codes for this email', { retryAt: perEmail.reset });
  const perIp = await rateLimit({ identifier: `auth:email:send:ip:${clientIp(req)}`, limit: 10, window: 60 * 60 });
  if (!perIp.success) return fail(429, 'rate_limited', 'Too many codes from this network', { retryAt: perIp.reset });

  try {
    const code = await issueCode(email);
    await sendEmail({ to: email, template: 'autopost-sign-in-code', data: { code, locale, ttlMinutes } });
    log.info('Mobile code issued');
  } catch (err) {
    log.error('issueCode failed', { error: err instanceof Error ? err.message : String(err) });
    return fail(500, 'server_error', 'Could not send the code');
  }
  return ok({ ok: true, ttlMinutes });
}
