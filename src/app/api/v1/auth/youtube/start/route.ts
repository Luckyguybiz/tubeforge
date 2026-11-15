import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateApiRequest } from '@/lib/api-auth';
import { db } from '@/server/db';
import { isValidTimeZone } from '@/lib/autopost/time';
import { authorizationUrl, connectCallbackUrl, isAllowedRedirect, signState } from '@/lib/autopost/youtube-connect';

export const dynamic = 'force-dynamic';

const InputSchema = z.object({
  /** Org end-user to link the channel to. Omit to link it to the key holder. */
  externalUserId: z.string().min(1).max(100).optional(),
  displayName: z.string().max(200).optional(),
  redirectUri: z
    .string()
    .max(2048)
    .refine(isAllowedRedirect, 'redirectUri must be an http(s) URL or an app link (autopost://)'),
  /** IANA time zone for the channel slots (autopost app). */
  timezone: z.string().max(64).refine(isValidTimeZone, 'Unknown time zone').optional(),
  /** Pre-fills the Google account picker. */
  loginHint: z.string().email().max(254).optional(),
});

/**
 * POST /api/v1/auth/youtube/start
 *
 * Returns a Google authorization URL. After consent Google redirects to the
 * registered callback, which links the OAuth tokens and the Channel either
 * to the ExternalUser (apiKeyId, externalUserId) or, without
 * externalUserId, to the API key holder, then redirects to redirectUri with
 * ?status=ok&channelId=… or ?status=error&reason=…
 *
 * State: HMAC-signed payload (src/lib/autopost/youtube-connect.ts), 1 hour.
 * Auth: X-Forge-Key
 */
export async function POST(req: Request) {
  const auth = await authenticateApiRequest(req);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: 'invalid_json', message: 'Body must be JSON' } }, { status: 400 });
  }
  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'invalid_input', message: 'Validation failed', details: parsed.error.issues } },
      { status: 400 },
    );
  }
  const { externalUserId, displayName, redirectUri, timezone, loginHint } = parsed.data;

  if (externalUserId) {
    // Ensure ExternalUser stub exists (will be linked on callback)
    await db.externalUser.upsert({
      where: { apiKeyId_externalUserId: { apiKeyId: auth.apiKeyId, externalUserId } },
      create: { apiKeyId: auth.apiKeyId, externalUserId, displayName: displayName ?? null },
      update: { ...(displayName !== undefined ? { displayName } : {}) },
    });
  }

  const callbackUrl = connectCallbackUrl();
  const state = signState({
    k: auth.apiKeyId,
    e: externalUserId ?? null,
    r: redirectUri,
    cb: callbackUrl,
    tz: timezone ?? null,
  });

  return NextResponse.json(
    {
      authorizationUrl: authorizationUrl(state, callbackUrl, loginHint),
      callbackUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
