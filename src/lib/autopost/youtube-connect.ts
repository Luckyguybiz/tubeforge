/**
 * Connecting a YouTube channel to an API key holder (or to an external user
 * of an integrating org) through Google OAuth.
 *
 * Google only accepts redirect URIs registered for the OAuth client. The one
 * registered for TubeForge is the NextAuth callback
 * (https://tubeforge.co/api/auth/callback/google), so by default the connect
 * flow returns there too: the NextAuth route hands requests whose `state`
 * starts with STATE_PREFIX to handleConnectCallback() and leaves every other
 * request to NextAuth untouched. YOUTUBE_CONNECT_CALLBACK_URL switches to a
 * dedicated URI once it is registered in Google Cloud.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { env } from '@/lib/env';
import { API_ENDPOINTS } from '@/lib/constants';
import { createLogger } from '@/lib/logger';
import { afterReconnect, ensureSettings } from './service';

const log = createLogger('youtube-connect');

export const STATE_PREFIX = 'tfy1.';
const STATE_TTL_SEC = 3600;
const UPLOAD_SCOPE = 'https://www.googleapis.com/auth/youtube.upload';
const READONLY_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';
/** Custom schemes a connect flow may return to (mobile apps). */
const APP_SCHEMES = new Set(['autopost:']);

export interface ConnectState {
  /** ApiKey.id that started the flow. */
  k: string;
  /** ExternalUser.externalUserId, or null to link the channel to the key holder. */
  e: string | null;
  /** Where to send the person afterwards. */
  r: string;
  /** Callback URL used in the authorization request (must match on exchange). */
  cb: string;
  /** Time zone for the channel slots. */
  tz: string | null;
  n: string;
  iat: number;
}

function origin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://tubeforge.co').replace(/\/$/, '');
}

export function connectCallbackUrl(): string {
  return process.env.YOUTUBE_CONNECT_CALLBACK_URL || `${origin()}/api/auth/callback/google`;
}

function stateSecret(): string {
  return process.env.CRON_SECRET || env.AUTH_SECRET;
}

/** https / http URLs and the app schemes are allowed as redirect targets. */
export function isAllowedRedirect(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:' || APP_SCHEMES.has(u.protocol);
  } catch {
    return false;
  }
}

export function signState(payload: Omit<ConnectState, 'n' | 'iat'>, now = Date.now()): string {
  const body: ConnectState = { ...payload, n: randomBytes(12).toString('hex'), iat: Math.floor(now / 1000) };
  const b64 = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = createHmac('sha256', stateSecret()).update(STATE_PREFIX + b64).digest('base64url');
  return `${STATE_PREFIX}${b64}.${sig}`;
}

export function verifyState(state: string | null, now = Date.now()): ConnectState | 'expired' | null {
  if (!state || !state.startsWith(STATE_PREFIX)) return null;
  const rest = state.slice(STATE_PREFIX.length);
  const dot = rest.lastIndexOf('.');
  if (dot <= 0) return null;
  const b64 = rest.slice(0, dot);
  const sig = rest.slice(dot + 1);
  const expected = createHmac('sha256', stateSecret()).update(STATE_PREFIX + b64).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let parsed: ConnectState;
  try {
    parsed = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')) as ConnectState;
  } catch {
    return null;
  }
  if (typeof parsed.k !== 'string' || typeof parsed.r !== 'string' || typeof parsed.cb !== 'string') return null;
  if (now / 1000 - parsed.iat > STATE_TTL_SEC) return 'expired';
  return parsed;
}

export function authorizationUrl(state: string, callbackUrl: string, loginHint?: string | null): string {
  const oauth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  oauth.searchParams.set('client_id', env.AUTH_GOOGLE_ID);
  oauth.searchParams.set('redirect_uri', callbackUrl);
  oauth.searchParams.set('response_type', 'code');
  oauth.searchParams.set('scope', ['openid', 'email', 'profile', READONLY_SCOPE, UPLOAD_SCOPE].join(' '));
  oauth.searchParams.set('access_type', 'offline');
  // select_account lets people with several Google accounts pick the one
  // that owns the channel; consent guarantees a refresh token.
  oauth.searchParams.set('prompt', 'consent select_account');
  oauth.searchParams.set('include_granted_scopes', 'true');
  oauth.searchParams.set('state', state);
  if (loginHint) oauth.searchParams.set('login_hint', loginHint);
  return oauth.toString();
}

function back(redirect: string, params: Record<string, string>): NextResponse {
  const url = new URL(redirect);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url.toString(), { status: 302 });
}

/** Revokes a Google token. Never throws: the account is cleaned up either way. */
export async function revokeGoogleToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
      signal: AbortSignal.timeout(10_000),
    });
    // 400 invalid_token means it was already revoked or expired.
    return res.ok || res.status === 400;
  } catch {
    return false;
  }
}

/**
 * Google came back. Exchanges the code, finds the channel and links it.
 * Every outcome after the state check returns to the caller's redirect URI
 * with status=ok|error and a reason code, so a phone never lands on a bare
 * error page.
 */
export async function handleConnectCallback(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const verified = verifyState(url.searchParams.get('state'));
  if (verified === null) return new NextResponse('Invalid state', { status: 400 });
  if (verified === 'expired') return new NextResponse('This link has expired. Start connecting the channel again.', { status: 400 });
  const st = verified;
  const fail = (reason: string) => back(st.r, { status: 'error', reason });

  const oauthError = url.searchParams.get('error');
  if (oauthError) return fail(oauthError === 'access_denied' ? 'cancelled' : 'google_error');
  const code = url.searchParams.get('code');
  if (!code) return fail('google_error');

  const apiKey = await db.apiKey.findUnique({ where: { id: st.k }, select: { id: true, userId: true, revokedAt: true } });
  if (!apiKey || apiKey.revokedAt) return fail('signed_out');

  const tokenRes = await fetch(API_ENDPOINTS.GOOGLE_OAUTH_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.AUTH_GOOGLE_ID,
      client_secret: env.AUTH_GOOGLE_SECRET,
      redirect_uri: st.cb,
      grant_type: 'authorization_code',
    }),
  }).catch(() => null);
  if (!tokenRes || !tokenRes.ok) {
    log.error('Token exchange failed', { status: tokenRes?.status ?? 0 });
    return fail('google_error');
  }
  const token = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
    id_token?: string;
    token_type?: string;
  };

  const granted = new Set((token.scope ?? '').split(/\s+/));
  if (!granted.has(UPLOAD_SCOPE)) {
    await revokeGoogleToken(token.refresh_token ?? token.access_token);
    return fail('scope_missing');
  }

  const channelsRes = await fetch(`${API_ENDPOINTS.YOUTUBE_CHANNELS}?part=snippet,statistics&mine=true`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  }).catch(() => null);
  if (!channelsRes || !channelsRes.ok) return fail('google_error');
  const data = (await channelsRes.json()) as {
    items?: Array<{
      id: string;
      snippet: { title: string; thumbnails?: { default?: { url?: string }; medium?: { url?: string } } };
      statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
    }>;
  };
  const yt = data.items?.[0];
  if (!yt) {
    await revokeGoogleToken(token.refresh_token ?? token.access_token);
    return fail('no_channel');
  }

  // A channel belongs to one TubeForge account. Proof of Google access does
  // not silently move it away from somebody else.
  const [existingChannel, existingAccount] = await Promise.all([
    db.channel.findUnique({ where: { id: yt.id }, select: { userId: true } }),
    db.account.findUnique({
      where: { provider_providerAccountId: { provider: 'google', providerAccountId: yt.id } },
      select: { userId: true, refresh_token: true },
    }),
  ]);
  if ((existingChannel && existingChannel.userId !== apiKey.userId) || (existingAccount && existingAccount.userId !== apiKey.userId)) {
    log.warn('Channel already linked to another account', { channelId: yt.id });
    return fail('channel_taken');
  }
  const refresh = token.refresh_token ?? existingAccount?.refresh_token ?? null;
  if (!refresh) return fail('no_refresh_token');

  const expiresAt = Math.floor(Date.now() / 1000) + (token.expires_in || 3600);
  const account = await db.account.upsert({
    where: { provider_providerAccountId: { provider: 'google', providerAccountId: yt.id } },
    create: {
      userId: apiKey.userId,
      provider: 'google',
      providerAccountId: yt.id,
      type: 'oauth',
      access_token: token.access_token,
      refresh_token: refresh,
      expires_at: expiresAt,
      scope: token.scope,
      id_token: token.id_token,
      token_type: token.token_type ?? 'Bearer',
    },
    update: {
      access_token: token.access_token,
      refresh_token: refresh,
      expires_at: expiresAt,
      scope: token.scope,
    },
  });

  const thumb = yt.snippet.thumbnails?.medium?.url ?? yt.snippet.thumbnails?.default?.url ?? null;
  const subs = yt.statistics?.hiddenSubscriberCount ? 0 : Number.parseInt(yt.statistics?.subscriberCount ?? '0', 10) || 0;
  await db.channel.upsert({
    where: { id: yt.id },
    create: { id: yt.id, title: yt.snippet.title, thumbnail: thumb, subscribers: subs, userId: apiKey.userId },
    update: { title: yt.snippet.title, thumbnail: thumb, subscribers: subs },
  });
  await ensureSettings(yt.id, st.tz);
  await afterReconnect(yt.id).catch((e) => log.warn('afterReconnect failed', { error: String(e) }));

  if (st.e) {
    await db.externalUser.update({
      where: { apiKeyId_externalUserId: { apiKeyId: st.k, externalUserId: st.e } },
      data: { oauthAccountId: account.id, channelId: yt.id },
    });
  }

  await db.auditLog
    .create({
      data: {
        userId: apiKey.userId,
        action: 'youtube.channel.connect',
        target: yt.id,
        metadata: { via: st.e ? 'external_user' : 'api_key', apiKeyId: st.k },
      },
    })
    .catch(() => undefined);

  const params: Record<string, string> = { status: 'ok', channelId: yt.id };
  if (st.e) params.externalUserId = st.e;
  return back(st.r, params);
}
