/**
 * REST API v1 — Webhook management.
 *
 * GET  /api/v1/webhooks — List registered webhooks
 * POST /api/v1/webhooks — Register a new webhook endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { rateLimit } from '@/lib/rate-limit';
import { lookupApiKey } from '@/lib/api-keys';
import { sanitizeUrl } from '@/lib/sanitize';
import { randomBytes } from 'crypto';
import { WEBHOOK_EVENTS } from '@/server/routers/webhook';

export const dynamic = 'force-dynamic';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function authenticateRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return lookupApiKey(authHeader.slice(7).trim());
}

async function checkRateLimit(userId: string) {
  return rateLimit({ identifier: `api:v1:${userId}`, limit: 60, window: 60 });
}

/** GET /api/v1/webhooks */
export async function GET(req: NextRequest) {
  const userId = await authenticateRequest(req);
  if (!userId) return jsonError('Unauthorized', 401);

  const rl = await checkRateLimit(userId);
  if (!rl.success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const webhooks = await db.webhookEndpoint.findMany({
    where: { userId },
    select: { id: true, url: true, events: true, active: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: webhooks });
}

/** POST /api/v1/webhooks */
export async function POST(req: NextRequest) {
  const userId = await authenticateRequest(req);
  if (!userId) return jsonError('Unauthorized', 401);

  const rl = await checkRateLimit(userId);
  if (!rl.success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  // Check plan
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  if (user?.plan !== 'STUDIO') {
    return jsonError('Webhooks are available on the Studio plan only', 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const { url, events } = body as { url?: string; events?: string[] };
  if (!url || typeof url !== 'string') return jsonError('url is required', 400);
  if (!Array.isArray(events) || events.length === 0) {
    return jsonError(`events must be a non-empty array of: ${WEBHOOK_EVENTS.join(', ')}`, 400);
  }

  const validEvents = events.filter((e) => (WEBHOOK_EVENTS as readonly string[]).includes(e));
  if (validEvents.length === 0) {
    return jsonError(`Invalid events. Valid: ${WEBHOOK_EVENTS.join(', ')}`, 400);
  }

  const sanitized = sanitizeUrl(url);
  if (!sanitized) return jsonError('Invalid URL. Only https:// URLs are allowed', 400);

  // Limit: max 10 webhooks
  const count = await db.webhookEndpoint.count({ where: { userId } });
  if (count >= 10) return jsonError('Maximum 10 webhooks allowed', 403);

  const secret = `whsec_${randomBytes(24).toString('hex')}`;

  const entry = await db.webhookEndpoint.create({
    data: { userId, url: sanitized, events: validEvents, secret, active: true },
    select: { id: true, url: true, events: true, secret: true, active: true, createdAt: true },
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}
