/**
 * DELETE /api/v1/mobile/account  { confirm: "DELETE", locale? }
 *
 * Deletes the account of the signed-in person (App Store 5.1.1(v), Google
 * Play account deletion). The explicit confirm field is the force gate: the
 * app sends it only after the person confirms on the deletion screen.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp, fail, ok, readBody, requireUser } from '@/lib/autopost/http';
import { deleteAccount } from '@/lib/autopost/account';
import { AutopostError } from '@/lib/autopost/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ confirm: z.literal('DELETE'), locale: z.enum(['ru', 'en']).optional() });

export async function DELETE(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  const body = await readBody(req, Body);
  if (!body.ok) return fail(400, 'confirm_required', 'Send { "confirm": "DELETE" } to delete the account');
  const limit = await rateLimit({ identifier: `autopost:delete:${auth.userId}`, limit: 3, window: 600 });
  if (!limit.success) return fail(429, 'rate_limited', 'Too many attempts');
  try {
    const result = await deleteAccount(
      { userId: auth.userId, apiKeyId: auth.apiKeyId, ip: clientIp(req), userAgent: req.headers.get('user-agent') },
      body.data.locale ?? 'en',
    );
    return ok({ deleted: true, ...result });
  } catch (e) {
    if (e instanceof AutopostError) return fail(e.status, e.code, e.message);
    throw e;
  }
}
