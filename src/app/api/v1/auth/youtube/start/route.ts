import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateApiRequest } from '@/lib/api-auth';
import { env } from '@/lib/env';
import { db } from '@/server/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const InputSchema = z.object({
  externalUserId: z.string().min(1).max(100),
  displayName: z.string().max(200).optional(),
  redirectUri: z.string().url().max(2048),
});

/**
 * POST /api/v1/auth/youtube/start
 *
 * Phase 3b — external-user OAuth onboarding.
 * Returns a Google authorization_url that the integrating org should
 * redirect their end-user to. After consent, Google redirects back to
 * /api/v1/auth/youtube/callback which links the OAuth tokens + Channel
 * to the ExternalUser row keyed by (apiKeyId, externalUserId).
 *
 * State parameter: opaque JWT-like payload encoding
 *   { apiKeyId, externalUserId, redirectUri, nonce }
 *   HMAC-signed with CRON_SECRET (re-purposed) to prevent tampering.
 *
 * Auth: X-Forge-Key
 */
export async function POST(req: Request) {
  const auth = await authenticateApiRequest(req);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'invalid_json', message: 'Body must be JSON' } },
      { status: 400 },
    );
  }
  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'invalid_input', message: 'Validation failed', details: parsed.error.issues } },
      { status: 400 },
    );
  }
  const { externalUserId, displayName, redirectUri } = parsed.data;

  // Ensure ExternalUser stub exists (will be linked on callback)
  await db.externalUser.upsert({
    where: {
      apiKeyId_externalUserId: { apiKeyId: auth.apiKeyId, externalUserId },
    },
    create: {
      apiKeyId: auth.apiKeyId,
      externalUserId,
      displayName: displayName ?? null,
    },
    update: {
      ...(displayName !== undefined ? { displayName } : {}),
    },
  });

  // Build state — signed payload to prevent tampering on callback
  const nonce = crypto.randomBytes(16).toString('hex');
  const statePayload = JSON.stringify({
    apiKeyId: auth.apiKeyId,
    externalUserId,
    redirectUri,
    nonce,
    iat: Math.floor(Date.now() / 1000),
  });
  const secret = process.env.CRON_SECRET || env.AUTH_SECRET;
  const stateB64 = Buffer.from(statePayload).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(stateB64).digest('base64url');
  const state = `${stateB64}.${sig}`;

  const callbackUrl = new URL('/api/v1/auth/youtube/callback', getOrigin(req)).toString();

  const oauth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  oauth.searchParams.set('client_id', env.AUTH_GOOGLE_ID);
  oauth.searchParams.set('redirect_uri', callbackUrl);
  oauth.searchParams.set('response_type', 'code');
  oauth.searchParams.set(
    'scope',
    [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.upload',
    ].join(' '),
  );
  oauth.searchParams.set('access_type', 'offline');
  oauth.searchParams.set('prompt', 'consent');
  oauth.searchParams.set('state', state);
  oauth.searchParams.set('include_granted_scopes', 'true');

  return NextResponse.json({
    authorizationUrl: oauth.toString(),
    callbackUrl,
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  });
}

function getOrigin(req: Request): string {
  const url = new URL(req.url);
  return url.origin;
}
