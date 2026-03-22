import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { sendEmail } from '@/lib/email';
import type { EmailTemplate } from '@/lib/email-templates';
import { createLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const log = createLogger('cron-emails');

/**
 * Welcome email sequence cron endpoint.
 *
 * Sends drip emails based on user signup age:
 *   - Day 0:  welcome          (sent on signup, not here)
 *   - Day 3:  feature_discovery
 *   - Day 7:  social_proof
 *   - Day 14: upgrade_nudge    (FREE plan users only)
 *
 * Tracking is done via AuditLog entries with action = 'EMAIL_SENT'.
 *
 * Usage with cron (run daily at 10 AM):
 *   0 10 * * * curl -sX POST -H "Authorization: Bearer $CRON_SECRET" https://tubeforge.co/api/cron/emails
 */

interface SequenceStep {
  day: number;
  template: EmailTemplate;
  /** If set, only send to users on this plan */
  planFilter?: 'FREE';
  /** If true, only send to users who have NOT logged in recently */
  requireInactive?: boolean;
}

const SEQUENCE: SequenceStep[] = [
  { day: 3,  template: 'day-three' },
  { day: 7,  template: 'day-seven' },
  { day: 14, template: 'reengagement-day14', planFilter: 'FREE' },
  // Re-engagement for inactive users (no login in X days)
  { day: 3,  template: 'reengagement-day3', requireInactive: true },
  { day: 7,  template: 'reengagement-day7', requireInactive: true },
  { day: 14, template: 'reengagement-day14', requireInactive: true },
];

export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const results: Record<string, number> = {};
  let totalSent = 0;

  try {
    for (const step of SEQUENCE) {
      const templateKey = step.template;
      results[templateKey] = 0;

      // Date window: users who signed up exactly `step.day` days ago (± 1 day)
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - step.day);
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Find eligible users
      const users = await db.user.findMany({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
          email: { not: null },
          ...(step.planFilter ? { plan: step.planFilter } : {}),
        },
        select: { id: true, email: true, name: true, plan: true },
      });

      if (users.length === 0) continue;

      // Get list of users who already received this template
      const alreadySent = await db.auditLog.findMany({
        where: {
          action: 'EMAIL_SENT',
          userId: { in: users.map((u) => u.id) },
          metadata: {
            path: ['template'],
            equals: templateKey,
          },
        },
        select: { userId: true },
      });
      const sentSet = new Set(alreadySent.map((a) => a.userId));

      // Send to users who haven't received this email yet
      for (const user of users) {
        if (!user.email || sentSet.has(user.id)) continue;

        // Skip active users for re-engagement emails
        if (step.requireInactive) {
          const hasRecentSession = await db.session.findFirst({
            where: { userId: user.id, expires: { gt: new Date() } },
          });
          if (hasRecentSession) continue;
        }

        await sendEmail({
          to: user.email,
          template: templateKey,
          data: { name: user.name || '', locale: 'ru' },
        });

        // Track in AuditLog
        await db.auditLog.create({
          data: {
            userId: user.id,
            action: 'EMAIL_SENT',
            target: user.email,
            metadata: { template: templateKey, day: step.day },
          },
        });

        results[templateKey]!++;
        totalSent++;
      }

      log.info(`Sent ${results[templateKey]} "${templateKey}" emails`);
    }
  } catch (err) {
    log.error('Email cron failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Email cron failed', sent: totalSent, durationMs: Date.now() - start },
      { status: 500 },
    );
  }

  const durationMs = Date.now() - start;
  log.info('Email cron completed', { totalSent, ...results, durationMs });

  return NextResponse.json({
    success: true,
    sent: results,
    totalSent,
    durationMs,
    timestamp: new Date().toISOString(),
  });
}
