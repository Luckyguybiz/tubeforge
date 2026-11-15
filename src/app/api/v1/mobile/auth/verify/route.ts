/**
 * POST /api/v1/mobile/auth/verify  { email, code, device? }
 *
 * Step two: checks the code and issues a device key (ApiKey, X-Forge-Key).
 * The key is returned once; the phone keeps it in the secure store. A new
 * email gets a TubeForge account, as on the web.
 */
import { z } from 'zod';
import { consumeCode, normalizeEmail } from '@/lib/email-code';
import { generateApiKey } from '@/lib/api-keys';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';
import { db } from '@/server/db';
import { clientIp, fail, ok, readBody } from '@/lib/autopost/http';
import { checkReviewCode, isReviewEmail } from '@/lib/autopost/review';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const log = createLogger('mobile-auth-verify');

const Body = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().trim().regex(/^\d{6}$/),
  device: z.string().trim().max(60).optional(),
});

export async function POST(req: Request) {
  const body = await readBody(req, Body);
  if (!body.ok) return fail(400, 'invalid_code', 'The code must be 6 digits');
  const email = normalizeEmail(body.data.email);
  const { code } = body.data;

  const limit = await rateLimit({ identifier: `auth:email:verify:email:${email}`, limit: 5, window: 15 * 60 });
  if (!limit.success) return fail(429, 'rate_limited', 'Too many attempts', { retryAt: limit.reset });

  if (isReviewEmail(email)) {
    if (!checkReviewCode(email, code)) return fail(400, 'invalid_code', 'The code is wrong');
  } else {
    const result = await consumeCode(email, code);
    if (!result.ok) {
      return result.reason === 'expired'
        ? fail(400, 'expired_code', 'The code has expired')
        : fail(400, 'invalid_code', 'The code is wrong');
    }
  }

  const user = await db.user.upsert({
    where: { email },
    update: { emailVerified: new Date() },
    create: { email, emailVerified: new Date() },
    select: { id: true, email: true, name: true },
  });

  const device = body.data.device?.replace(/\s+/g, ' ') || 'Phone';
  const { fullKey, entry } = await generateApiKey(user.id, `Автопостинг · ${device}`);

  await db.auditLog
    .create({
      data: {
        userId: user.id,
        action: 'autopost.sign_in',
        target: entry.id,
        ipAddress: clientIp(req),
        userAgent: req.headers.get('user-agent')?.slice(0, 200) ?? null,
      },
    })
    .catch(() => undefined);
  log.info('Mobile sign-in', { userId: user.id });

  return ok({ apiKey: fullKey, user: { id: user.id, email: user.email, name: user.name } });
}
