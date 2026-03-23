import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { submitToIndexNow } from '@/lib/indexnow';
import { createLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const log = createLogger('api-indexnow');

/** Maximum number of URLs per submission */
const MAX_URLS = 10_000;

/**
 * POST /api/indexnow
 *
 * Accepts `{ urls: string[] }` and submits them to IndexNow.
 *
 * Authentication: requires either:
 *   - `Authorization: Bearer <CRON_SECRET>` header (for server-to-server calls)
 *   - `x-api-key: <CRON_SECRET>` header (alternative)
 *
 * Rate limited to 10 requests per 60 seconds per IP.
 */
export async function POST(request: Request) {
  // ── Auth check ──────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const apiKeyHeader = request.headers.get('x-api-key');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    log.error('CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 },
    );
  }

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : apiKeyHeader;

  if (token !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Rate limiting ───────────────────────────────────────────
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';

  const { success, remaining, reset } = await rateLimit({
    identifier: `indexnow:${ip}`,
    limit: 10,
    window: 60,
  });

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      },
    );
  }

  // ── Parse body ──────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  if (
    !body ||
    typeof body !== 'object' ||
    !('urls' in body) ||
    !Array.isArray((body as { urls: unknown }).urls)
  ) {
    return NextResponse.json(
      { error: 'Body must contain { urls: string[] }' },
      { status: 400 },
    );
  }

  const { urls } = body as { urls: unknown[] };

  // Validate each entry is a string
  const validUrls = urls.filter((u): u is string => typeof u === 'string');

  if (!validUrls.length) {
    return NextResponse.json(
      { error: 'No valid URL strings provided' },
      { status: 400 },
    );
  }

  if (validUrls.length > MAX_URLS) {
    return NextResponse.json(
      { error: `Too many URLs (max ${MAX_URLS})` },
      { status: 400 },
    );
  }

  // ── Submit ──────────────────────────────────────────────────
  log.info('IndexNow submission requested', { urlCount: validUrls.length });
  submitToIndexNow(validUrls);

  return NextResponse.json({
    success: true,
    submitted: validUrls.length,
    message: 'URLs queued for IndexNow submission',
    timestamp: new Date().toISOString(),
  });
}
