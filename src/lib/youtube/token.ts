/**
 * YouTube OAuth token access shared by the MCP server and (eventually)
 * the tRPC router / upload worker.
 *
 * Resolves the Google `Account` row for a user (or a specific account id
 * for ExternalUser flows), refreshes the access token when expired and
 * reports which OAuth scopes were granted so callers can fail early with
 * an actionable message instead of a bare 403 from YouTube.
 */
import type { PrismaClient } from '@prisma/client';
import { env } from '@/lib/env';
import { API_ENDPOINTS } from '@/lib/constants';

/** Scope required for videos.update / comments.insert / thumbnails on
 *  behalf of the user. NOT requested by default — see YOUTUBE_MANAGE_SCOPE. */
export const YOUTUBE_MANAGE_SCOPE = 'https://www.googleapis.com/auth/youtube.force-ssl';
/** Full-access scope; a superset of force-ssl for our purposes. */
export const YOUTUBE_FULL_SCOPE = 'https://www.googleapis.com/auth/youtube';
export const YOUTUBE_UPLOAD_SCOPE = 'https://www.googleapis.com/auth/youtube.upload';
export const YOUTUBE_READONLY_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';
export const YT_ANALYTICS_READONLY_SCOPE = 'https://www.googleapis.com/auth/yt-analytics.readonly';

/**
 * Feature flag: when `YOUTUBE_MANAGE_SCOPE=1`, the OAuth consent flows also
 * request `youtube.force-ssl`, which unlocks title/description edits and
 * comment replies. Off by default because adding a sensitive scope requires
 * the scope to be listed on the Cloud Console consent screen first.
 */
export function manageScopeEnabled(): boolean {
  return process.env.YOUTUBE_MANAGE_SCOPE === '1';
}

export function baseOAuthScopes(): string[] {
  const scopes = [
    'openid',
    'email',
    'profile',
    YOUTUBE_READONLY_SCOPE,
    YT_ANALYTICS_READONLY_SCOPE,
    YOUTUBE_UPLOAD_SCOPE,
  ];
  if (manageScopeEnabled()) scopes.push(YOUTUBE_MANAGE_SCOPE);
  return scopes;
}

export class YouTubeAuthError extends Error {
  readonly code: 'not_connected' | 'refresh_failed';
  constructor(code: 'not_connected' | 'refresh_failed', message: string) {
    super(message);
    this.name = 'YouTubeAuthError';
    this.code = code;
  }
}

export interface YouTubeCredentials {
  accessToken: string;
  /** Granted OAuth scopes (space separated in DB, split here). */
  scopes: string[];
  accountId: string;
}

export function hasScope(scopes: string[], needed: string): boolean {
  if (scopes.includes(needed)) return true;
  // youtube (full) implies force-ssl, readonly and upload
  if (scopes.includes(YOUTUBE_FULL_SCOPE) && needed !== YT_ANALYTICS_READONLY_SCOPE) return true;
  // force-ssl implies readonly + upload
  if (
    scopes.includes(YOUTUBE_MANAGE_SCOPE) &&
    (needed === YOUTUBE_READONLY_SCOPE || needed === YOUTUBE_UPLOAD_SCOPE)
  ) {
    return true;
  }
  return false;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Return a valid access token for the user's Google account.
 *
 * @param opts.accountId — when set (ExternalUser.oauthAccountId), use that
 *   exact Account row instead of the user's newest google Account.
 */
export async function getYouTubeCredentials(
  db: PrismaClient,
  opts: { userId: string; accountId?: string | null },
): Promise<YouTubeCredentials> {
  const account = opts.accountId
    ? await db.account.findUnique({
        where: { id: opts.accountId },
        select: { id: true, access_token: true, refresh_token: true, expires_at: true, scope: true },
      })
    : await db.account.findFirst({
        where: { userId: opts.userId, provider: 'google' },
        select: { id: true, access_token: true, refresh_token: true, expires_at: true, scope: true },
        orderBy: { expires_at: 'desc' },
      });

  if (!account?.access_token) {
    throw new YouTubeAuthError(
      'not_connected',
      'YouTube is not connected. Sign in at tubeforge.co with Google and connect your channel in Settings → Channels.',
    );
  }

  const scopes = (account.scope ?? '').split(/\s+/).filter(Boolean);

  const expired = account.expires_at !== null && account.expires_at * 1000 < Date.now() + 30_000;
  if (!expired) {
    return { accessToken: account.access_token, scopes, accountId: account.id };
  }

  if (!account.refresh_token) {
    throw new YouTubeAuthError(
      'refresh_failed',
      'YouTube session expired and no refresh token is stored. Reconnect your Google account at tubeforge.co/settings.',
    );
  }

  const res = await fetchWithTimeout(API_ENDPOINTS.GOOGLE_OAUTH_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.AUTH_GOOGLE_ID,
      client_secret: env.AUTH_GOOGLE_SECRET,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    throw new YouTubeAuthError(
      'refresh_failed',
      `Failed to refresh YouTube token (HTTP ${res.status}). Reconnect your Google account at tubeforge.co/settings.`,
    );
  }
  const data = (await res.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number; scope?: string }
    | null;
  if (!data?.access_token) {
    throw new YouTubeAuthError(
      'refresh_failed',
      'Token refresh returned no access_token. Reconnect your Google account at tubeforge.co/settings.',
    );
  }
  const expiresIn = typeof data.expires_in === 'number' && data.expires_in > 0 ? data.expires_in : 3600;
  await db.account.update({
    where: { id: account.id },
    data: { access_token: data.access_token, expires_at: Math.floor(Date.now() / 1000) + expiresIn },
    select: { id: true },
  });
  const refreshedScopes = data.scope ? data.scope.split(/\s+/).filter(Boolean) : scopes;
  return { accessToken: data.access_token, scopes: refreshedScopes, accountId: account.id };
}
