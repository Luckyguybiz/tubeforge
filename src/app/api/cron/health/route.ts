import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const log = createLogger('cron-health');

/**
 * Cron-compatible health endpoint.
 * Calls the main /api/health internally and logs the result.
 * Can be pinged by external monitoring services (UptimeRobot, BetterStack, etc.).
 *
 * Usage with cron:
 *   * / 5 * * * * curl -s https://tubeforge.co/api/cron/health > /dev/null
 */
export async function GET(request: Request) {
  const start = Date.now();

  let healthStatus: string = 'unknown';
  let dbOk = false;

  try {
    // Build the origin from the request URL so it works in any environment
    const url = new URL(request.url);
    const origin = url.origin;

    const res = await fetch(`${origin}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(15_000),
    });

    const data = (await res.json()) as { status?: string; db?: boolean };
    healthStatus = data.status ?? 'unknown';
    dbOk = data.db ?? false;
  } catch (err) {
    healthStatus = 'error';
    log.error('Health check failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const durationMs = Date.now() - start;

  log.info('Health check completed', { status: healthStatus, db: dbOk, durationMs });

  return NextResponse.json({
    checked: true,
    status: healthStatus,
    db: dbOk,
    durationMs,
    timestamp: new Date().toISOString(),
  }, {
    status: healthStatus === 'ok' ? 200 : 503,
  });
}
