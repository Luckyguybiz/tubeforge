import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';

/**
 * Tool History Router
 *
 * Tracks which tools a user has recently used for quick-access suggestions.
 * Reads from AuditLog entries with action 'tool-usage' created by the
 * analytics.syncToolUsage procedure.
 */
export const toolHistoryRouter = router({
  /** Get the user's recent tool usage history from audit logs */
  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      const userId = ctx.session.user.id;

      // Query recent tool-usage audit log entries
      const recentLogs = await ctx.db.auditLog.findMany({
        where: { userId, action: 'tool-usage' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          metadata: true,
          createdAt: true,
        },
      });

      // Extract tool IDs from the counters metadata
      const toolSet = new Map<string, { toolId: string; lastUsed: Date; usageCount: number }>();
      for (const log of recentLogs) {
        const meta = log.metadata as { counters?: Record<string, number> } | null;
        if (meta?.counters) {
          for (const [toolId, count] of Object.entries(meta.counters)) {
            const existing = toolSet.get(toolId);
            if (existing) {
              existing.usageCount += count;
            } else {
              toolSet.set(toolId, { toolId, lastUsed: log.createdAt, usageCount: count });
            }
          }
        }
      }

      return Array.from(toolSet.values())
        .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
        .slice(0, limit);
    }),
});
