import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { env } from '@/lib/env';
import { API_ENDPOINTS } from '@/lib/constants';
import { createLogger } from '@/lib/logger';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const log = createLogger('api-v1-auth-callback');

/**
 * GET /api/v1/auth/youtube/callback?code=…&state=…
 *
 * Google redirects here after the end-user consents on the OAuth page
 * initiated by /api/v1/auth/youtube/start.
 *
 * Validates state (HMAC-signed) to recover apiKeyId + externalUserId +
 * redirectUri. Exchanges code → tokens. Fetches the end-user's primary
 * YouTube channel. Upserts Account + Channel + ExternalUser, then
 * redirects to redirectUri with ?status=ok&channelId=…
 *
 * No API key required — auth is via signed state parameter.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  if (oauthError) {
    log.warn('OAuth error from Google', { error: oauthError });
    return new NextResponse(`OAuth error: ${oauthError}`, { status: 400 });
  }
  if (!code || !state) {
    return new NextResponse('Missing code or state', { status: 400 });
  }

  // Verify state signature
  const parts = state.split('.');
  if (parts.length !== 2) {
    return new NextResponse('Malformed state', { status: 400 });
  }
  const [stateB64, sig] = parts;
  const secret = process.env.CRON_SECRET || env.AUTH_SECRET;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(stateB64)
    .digest('base64url');
  if (sig !== expectedSig) {
    log.warn('State signature mismatch');
    return new NextResponse('Invalid state signature', { status: 400 });
  }

  let parsed: {
    apiKeyId: string;
    externalUserId: string;
    redirectUri: string;
    nonce: string;
    iat: number;
  };
  try {
    parsed = JSON.parse(Buffer.from(stateB64, 'base64url').toString('utf-8'));
  } catch {
    return new NextResponse('Malformed state payload', { status: 400 });
  }

  // State TTL: 1 hour
  if (Date.now() / 1000 - parsed.iat > 3600) {
    return new NextResponse('State expired (>1h since /start)', { status: 400 });
  }

  // Look up the API key (must still exist + not revoked)
  const apiKey = await db.apiKey.findUnique({
    where: { id: parsed.apiKeyId },
    select: { id: true, userId: true, revokedAt: true },
  });
  if (!apiKey || apiKey.revokedAt) {
    return new NextResponse('API key no longer valid', { status: 401 });
  }

  // Exchange code → tokens
  const callbackUrl = url.origin + '/api/v1/auth/youtube/callback';
  const tokenRes = await fetch(API_ENDPOINTS.GOOGLE_OAUTH_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.AUTH_GOOGLE_ID,
      client_secret: env.AUTH_GOOGLE_SECRET,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) {
    const txt = await tokenRes.text().catch(() => '');
    log.error('Token exchange failed', { status: tokenRes.status, body: txt.slice(0, 300) });
    return new NextResponse('Token exchange failed', { status: 502 });
  }
  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
    id_token?: string;
    token_type?: string;
  };

  // Get YouTube channel ID for this user
  const channelsRes = await fetch(
    `${API_ENDPOINTS.YOUTUBE_CHANNELS}?part=snippet,statistics&mine=true`,
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
  );
  if (!channelsRes.ok) {
    return new NextResponse('Failed to fetch YouTube channel', { status: 502 });
  }
  const channelsData = (await channelsRes.json()) as {
    items?: Array<{
      id: string;
      snippet: { title: string; thumbnails?: { default?: { url?: string } } };
      statistics: { subscriberCount?: string };
    }>;
  };
  const ytChannel = channelsData.items?.[0];
  if (!ytChannel) {
    return new NextResponse('No YouTube channel on this account', { status: 404 });
  }

  // Upsert Account row to store the OAuth tokens for getYouTubeToken() helper
  const account = await db.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'google',
        providerAccountId: ytChannel.id,
      },
    },
    create: {
      userId: apiKey.userId, // owned by the API-key holder for now
      provider: 'google',
      providerAccountId: ytChannel.id,
      type: 'oauth',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
      scope: tokenData.scope,
      id_token: tokenData.id_token,
      token_type: tokenData.token_type ?? 'Bearer',
    },
    update: {
      access_token: tokenData.access_token,
      ...(tokenData.refresh_token ? { refresh_token: tokenData.refresh_token } : {}),
      expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
      scope: tokenData.scope,
    },
  });

  // Upsert Channel
  await db.channel.upsert({
    where: { id: ytChannel.id },
    create: {
      id: ytChannel.id,
      title: ytChannel.snippet.title,
      thumbnail: ytChannel.snippet.thumbnails?.default?.url,
      subscribers: parseInt(ytChannel.statistics.subscriberCount ?? '0'),
      userId: apiKey.userId,
    },
    update: {
      title: ytChannel.snippet.title,
      thumbnail: ytChannel.snippet.thumbnails?.default?.url,
      subscribers: parseInt(ytChannel.statistics.subscriberCount ?? '0'),
    },
  });

  // Update ExternalUser with the linked channel + account
  await db.externalUser.update({
    where: {
      apiKeyId_externalUserId: {
        apiKeyId: parsed.apiKeyId,
        externalUserId: parsed.externalUserId,
      },
    },
    data: {
      oauthAccountId: account.id,
      channelId: ytChannel.id,
    },
  });

  // Redirect back to org's redirectUri with success params
  const redirectUrl = new URL(parsed.redirectUri);
  redirectUrl.searchParams.set('status', 'ok');
  redirectUrl.searchParams.set('externalUserId', parsed.externalUserId);
  redirectUrl.searchParams.set('channelId', ytChannel.id);
  return NextResponse.redirect(redirectUrl.toString());
}
