/**
 * API key authentication for the v1 REST surface.
 *
 * Reads `X-Forge-Key: tf_<hex>` header, verifies against ApiKey table
 * via SHA-256 hash lookup (re-using lib/api-keys helper), respects the
 * revokedAt marker, and enforces monthlyQuota soft-cap.
 *
 * Returns context with userId + apiKeyId on success, or NextResponse
 * with 401/429/403 on failure. Route handlers call:
 *
 *   const auth = await authenticateApiRequest(req);
 *   if (auth instanceof NextResponse) return auth;
 *   // use auth.userId, auth.apiKeyId
 */
import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { hashKey } from './api-keys';
import { createLogger } from './logger';

const log = createLogger('api-auth');

export interface ApiAuthContext {
  userId: string;
  apiKeyId: string;
  monthlyQuota: number;
  monthlyUsage: number;
}

/**
 * MCP clients (Claude, Cursor, ChatGPT) send credentials as
 * `Authorization: Bearer tf_…`. Accept that as an alias of X-Forge-Key.
 * Only TubeForge keys are accepted — anything not starting with `tf_`
 * is ignored so unrelated bearer tokens never reach the key lookup.
 */
export function extractBearerKey(authorization: string | null): string | null {
  if (!authorization) return null;
  const m = /^Bearer\s+(tf_[A-Za-z0-9]+)\s*$/i.exec(authorization);
  return m ? m[1] : null;
}

/**
 * Resolve the X-Forge-Key header to an ApiAuthContext, or return a
 * NextResponse to short-circuit the request with proper JSON error.
 */
export async function authenticateApiRequest(req: Request): Promise<ApiAuthContext | NextResponse> {
  const header = req.headers.get('x-forge-key') ?? extractBearerKey(req.headers.get('authorization'));
  if (!header) {
    return NextResponse.json(
      { error: { code: 'missing_api_key', message: 'X-Forge-Key header (or Authorization: Bearer tf_…) is required' } },
      { status: 401 },
    );
  }

  const raw = header.trim();
  if (!raw.startsWith('tf_')) {
    return NextResponse.json(
      { error: { code: 'invalid_api_key', message: 'API key must start with tf_' } },
      { status: 401 },
    );
  }

  const h = hashKey(raw);
  const key = await db.apiKey.findUnique({
    where: { keyHash: h },
    select: {
      id: true,
      userId: true,
      revokedAt: true,
      monthlyQuota: true,
      monthlyUsage: true,
      quotaResetAt: true,
    },
  });

  if (!key) {
    log.warn('Unknown API key attempted', { prefix: raw.slice(0, 7) });
    return NextResponse.json(
      { error: { code: 'invalid_api_key', message: 'API key not recognized' } },
      { status: 401 },
    );
  }

  if (key.revokedAt) {
    return NextResponse.json(
      { error: { code: 'revoked_api_key', message: 'This API key has been revoked' } },
      { status: 401 },
    );
  }

  // Quota check — soft cap. Reset monthly via cron.
  if (key.monthlyUsage >= key.monthlyQuota) {
    return NextResponse.json(
      {
        error: {
          code: 'quota_exceeded',
          message: `Monthly upload quota of ${key.monthlyQuota} reached. Quota resets ${new Date(
            key.quotaResetAt.getTime() + 30 * 24 * 3600 * 1000,
          ).toISOString()}`,
        },
      },
      { status: 429 },
    );
  }

  // Fire-and-forget: update lastUsed + increment usageCount
  // (does not block the request)
  db.apiKey
    .update({
      where: { id: key.id },
      data: { lastUsed: new Date(), usageCount: { increment: 1 } },
    })
    .catch(() => {
      /* non-critical */
    });

  return {
    userId: key.userId,
    apiKeyId: key.id,
    monthlyQuota: key.monthlyQuota,
    monthlyUsage: key.monthlyUsage,
  };
}

/**
 * Helper to extract HMAC-SHA256 signature for webhook signing.
 * Used by deliverWebhooks and verified by SDK consumers.
 */
export { hashKey } from './api-keys';
