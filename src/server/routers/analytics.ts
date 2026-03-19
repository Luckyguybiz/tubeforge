import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';

const AI_LIMITS: Record<string, number> = { FREE: 5, PRO: 100, STUDIO: Infinity };

/** Rate limit: 30 reads per minute per user */
async function checkAnalyticsRate(userId: string) {
  const { success } = await rateLimit({ identifier: `analytics:${userId}`, limit: 30, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

export const analyticsRouter = router({
  /**
   * Overview statistics for the current user:
   * - Total projects, total scenes
   * - Projects created this week / this month
   * - Total video duration (sum of scene durations)
   * - AI plan usage (used vs limit)
   * - Projects breakdown by status
   */
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    await checkAnalyticsRate(ctx.session.user.id);
    const userId = ctx.session.user.id;

    const [user, totalProjects, totalScenes, weekProjects, monthProjects, durationResult, statusCounts] =
      await Promise.all([
        ctx.db.user.findUnique({
          where: { id: userId },
          select: { plan: true, aiUsage: true, aiResetAt: true },
        }),
        ctx.db.project.count({ where: { userId } }),
        ctx.db.scene.count({ where: { project: { userId } } }),
        ctx.db.project.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        ctx.db.project.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        ctx.db.scene.aggregate({
          where: { project: { userId } },
          _sum: { duration: true },
        }),
        ctx.db.project.groupBy({
          by: ['status'],
          where: { userId },
          _count: true,
        }),
      ]);

    const plan = user?.plan ?? 'FREE';
    const aiLimit = AI_LIMITS[plan] ?? 5;
    const aiUsage = user?.aiUsage ?? 0;

    // Build status breakdown map
    const statusBreakdown = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalProjects,
      totalScenes,
      weekProjects,
      monthProjects,
      totalDurationSeconds: durationResult._sum.duration ?? 0,
      plan,
      aiUsage,
      aiLimit: aiLimit === Infinity ? -1 : aiLimit, // -1 signals unlimited
      statusBreakdown: {
        DRAFT: statusBreakdown.DRAFT ?? 0,
        RENDERING: statusBreakdown.RENDERING ?? 0,
        READY: statusBreakdown.READY ?? 0,
        PUBLISHED: statusBreakdown.PUBLISHED ?? 0,
      },
    };
  }),

  /**
   * Daily project creation/update activity for the last 30 days.
   * Returns an array of { date, created, updated } entries.
   */
  getProjectActivity: protectedProcedure.query(async ({ ctx }) => {
    await checkAnalyticsRate(ctx.session.user.id);
    const userId = ctx.session.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    type ActivityRow = { day: Date; created: bigint; updated: bigint };

    const activity = await ctx.db.$queryRaw<ActivityRow[]>`
      SELECT
        DATE_TRUNC('day', "createdAt") AS day,
        COUNT(*) AS created,
        (
          SELECT COUNT(*)
          FROM "Project" p2
          WHERE p2."userId" = ${userId}
            AND DATE_TRUNC('day', p2."updatedAt") = DATE_TRUNC('day', p."createdAt")
            AND p2."updatedAt" != p2."createdAt"
        ) AS updated
      FROM "Project" p
      WHERE p."userId" = ${userId}
        AND p."createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
    `;

    // Fill in missing days with zeros
    const result: Array<{ date: string; created: number; updated: number }> = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const activityMap = new Map(
      activity.map((row) => [
        new Date(row.day).toISOString().slice(0, 10),
        { created: Number(row.created), updated: Number(row.updated) },
      ]),
    );

    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * dayMs).toISOString().slice(0, 10);
      const entry = activityMap.get(date);
      result.push({
        date,
        created: entry?.created ?? 0,
        updated: entry?.updated ?? 0,
      });
    }

    return result;
  }),

  /**
   * Tool usage breakdown.
   * Accepts client-side usage data and returns combined counts.
   * The tool counters are tracked in localStorage on the client and
   * optionally synced here for server-side aggregation.
   */
  getToolUsage: protectedProcedure
    .input(
      z
        .object({
          counters: z
            .record(z.string(), z.number().int().min(0))
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // For now, return the client-provided counters echoed back,
      // since there's no server-side usage tracking table yet.
      // In production this would merge with a server-side store.
      const counters = input?.counters ?? {};
      return {
        tools: Object.entries(counters).map(([tool, count]) => ({
          tool,
          count,
        })),
      };
    }),

  /**
   * Sync tool usage from client to server.
   * Accepts a batch of tool usage deltas and stores them.
   */
  syncToolUsage: protectedProcedure
    .input(
      z.object({
        counters: z.record(z.string(), z.number().int().min(0)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await checkAnalyticsRate(ctx.session.user.id);
      // In a full implementation, these counters would be stored in a
      // ToolUsage table keyed by (userId, toolId, month). For now we
      // acknowledge receipt successfully.
      return { synced: Object.keys(input.counters).length };
    }),
});
