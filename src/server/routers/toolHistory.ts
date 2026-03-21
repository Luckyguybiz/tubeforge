import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const toolHistoryRouter = router({
  /** Fetch recent tool usage for the logged-in user */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        tool: z.string().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const tool = input?.tool;

      return ctx.db.auditLog.findMany({
        where: {
          userId: ctx.session.user.id,
          action: 'TOOL_USAGE',
          ...(tool
            ? { metadata: { path: ['tool'], equals: tool } }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    }),

  /** Fetch recent translations (Assets of type video with Translation_ prefix) */
  translations: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;

      return ctx.db.asset.findMany({
        where: {
          userId: ctx.session.user.id,
          type: 'video',
          filename: { startsWith: 'Translation_' },
        },
        select: {
          id: true,
          url: true,
          filename: true,
          size: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    }),
});
