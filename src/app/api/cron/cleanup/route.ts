import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { createLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const log = createLogger('cron-cleanup');

/**
 * Periodic cleanup endpoint for stale data.
 *
 * Purges:
 *   - ProcessedEvent rows older than 90 days (Stripe idempotency keys)
 *   - AuditLog rows older than 365 days
 *
 * Usage with cron (run daily at 3 AM):
 *   0 3 * * * curl -sH "Authorization: Bearer $CRON_SECRET" https://tubeforge.co/api/cron/cleanup > /dev/null
 */
export async function POST(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const results: Record<string, number> = {};

  try {
    // Purge ProcessedEvent rows older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const deletedEvents = await db.processedEvent.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } },
    });
    results.processedEvents = deletedEvents.count;

    // Purge AuditLog rows older than 365 days
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    try {
      const deletedLogs = await db.auditLog.deleteMany({
        where: { createdAt: { lt: oneYearAgo } },
      });
      results.auditLogs = deletedLogs.count;
    } catch {
      // AuditLog table may not exist yet
      results.auditLogs = 0;
    }
  } catch (err) {
    log.error('Cleanup cron failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Cleanup failed', durationMs: Date.now() - start },
      { status: 500 },
    );
  }

  const durationMs = Date.now() - start;
  log.info('Cleanup completed', { ...results, durationMs });

  return NextResponse.json({
    success: true,
    purged: results,
    durationMs,
    timestamp: new Date().toISOString(),
  });
}
