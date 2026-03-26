import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';

/** Rate limit: 30 notification actions per minute per user */
async function checkNotifRate(userId: string) {
  const { success } = await rateLimit({ identifier: `notif:${userId}`, limit: 30, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

export const notificationRouter = router({
  /** Fetch user notifications (last 50, newest first) */
  list: protectedProcedure
    .input(z.object({ cursor: z.string().nullish() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const items = await ctx.db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          read: true,
          createdAt: true,
        },
      });
      return {
        items: items.map((n) => ({
          ...n,
          createdAt: n.createdAt.getTime(),
        })),
        nextCursor: items.length === 50 ? items[items.length - 1]?.id : null,
      };
    }),

  /** Unread count */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.notification.count({
      where: { userId: ctx.session.user.id, read: false },
    });
    return { count };
  }),

  /** Mark single notification as read */
  markRead: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await checkNotifRate(ctx.session.user.id);
      const notif = await ctx.db.notification.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        select: { id: true },
      });
      if (!notif) throw new TRPCError({ code: 'NOT_FOUND' });

      await ctx.db.notification.update({
        where: { id: input.id },
        data: { read: true },
      });
      return { success: true };
    }),

  /** Mark all notifications as read */
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await checkNotifRate(ctx.session.user.id);
    await ctx.db.notification.updateMany({
      where: { userId: ctx.session.user.id, read: false },
      data: { read: true },
    });
    return { success: true };
  }),

  /** Clear all notifications */
  clearAll: protectedProcedure.mutation(async ({ ctx }) => {
    await checkNotifRate(ctx.session.user.id);
    await ctx.db.notification.deleteMany({
      where: { userId: ctx.session.user.id },
    });
    return { success: true };
  }),

  /** Create a notification (internal use / server-side triggers) */
  create: protectedProcedure
    .input(z.object({
      type: z.enum(['success', 'error', 'info', 'warning']).default('info'),
      title: z.string().min(1).max(200),
      message: z.string().min(1).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkNotifRate(ctx.session.user.id);
      const notif = await ctx.db.notification.create({
        data: {
          userId: ctx.session.user.id,
          type: input.type,
          title: input.title,
          message: input.message,
        },
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          read: true,
          createdAt: true,
        },
      });
      return { ...notif, createdAt: notif.createdAt.getTime() };
    }),
});
