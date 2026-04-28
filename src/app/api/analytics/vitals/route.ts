/**
 * POST /api/analytics/vitals
 * Receives Core Web Vitals from `WebVitals.tsx` (sent via
 * navigator.sendBeacon).
 *
 * Design choices:
 *   - Public endpoint (no auth) — vitals fire on every page load,
 *     including the marketing landing where the visitor isn't logged in.
 *   - Always returns 204 with no body — sendBeacon ignores responses,
 *     and 204 keeps the server transcript noise-free.
 *   - Logs structured JSON via the existing logger so the entries land
 *     in PM2 stdout alongside other request logs and can be tailed /
 *     piped to a log aggregator later without code changes.
 *   - Soft validation: we don't reject malformed payloads (web-vitals
 *     library may evolve), we just log what we get.
 *   - Rate-limit: per-IP soft cap so a misconfigured client can't spam
 *     the logger. Vitals fire ~5 metrics per page load — 60/min
 *     accommodates a power user navigating fast.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

export const runtime = 'nodejs';

const log = createLogger('vitals');

interface VitalPayload {
  name?: string;
  value?: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  const limit = await rateLimit({
    identifier: `vitals:${ip}`,
    limit: 60,
    window: 60,
  });
  if (!limit.success) {
    // Even rate-limited responses are 204 — sendBeacon doesn't surface
    // status to the client and we don't want to encourage retries.
    return new NextResponse(null, { status: 204 });
  }

  let payload: VitalPayload | null = null;
  try {
    // sendBeacon may send Blob or string; we accept both via .text()
    const raw = await req.text();
    if (raw) payload = JSON.parse(raw) as VitalPayload;
  } catch {
    // Malformed body — still log the request signature for debugging.
    log.warn('Malformed vitals payload', { ip, ua: req.headers.get('user-agent')?.slice(0, 80) });
    return new NextResponse(null, { status: 204 });
  }

  if (payload && typeof payload.name === 'string') {
    log.info('vital', {
      name: payload.name,
      value: typeof payload.value === 'number' ? Number(payload.value.toFixed(2)) : null,
      rating: payload.rating ?? null,
      delta: typeof payload.delta === 'number' ? Number(payload.delta.toFixed(2)) : null,
      id: payload.id ?? null,
      ip,
    });
  }

  return new NextResponse(null, { status: 204 });
}
