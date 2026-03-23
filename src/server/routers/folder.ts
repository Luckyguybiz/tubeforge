import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';
import { stripTags } from '@/lib/sanitize';

/** Mutation rate limit: 20 folder actions per minute per user */
async function checkFolderRate(userId: string) {
  const { success } = await rateLimit({ identifier: `folder:${userId}`, limit: 20, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

export const folderRouter = router({
  list: protectedProcedure
    .input(z.object({
      parentId: z.string().min(1).max(100).nullish(),
      limit: z.number().min(1).max(200).default(100),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.designFolder.findMany({
        where: {
          userId: ctx.session.user.id,
          parentId: input.parentId ?? null,
        },
        select: {
          id: true,
          name: true,
          parentId: true,
          createdAt: true,
          _count: { select: { assets: true, children: true } },
        },
        orderBy: { name: 'asc' },
        take: input.limit,
      });
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      parentId: z.string().min(1).max(100).nullish(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkFolderRate(ctx.session.user.id);

      if (input.parentId) {
        const parent = await ctx.db.designFolder.findFirst({
          where: { id: input.parentId, userId: ctx.session.user.id },
          select: { id: true },
        });
        if (!parent) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Parent folder not found' });
        }
      }

      return ctx.db.designFolder.create({
        data: {
          name: stripTags(input.name),
          parentId: input.parentId ?? null,
          userId: ctx.session.user.id,
        },
        select: { id: true, name: true, parentId: true },
      });
    }),

  rename: protectedProcedure
    .input(z.object({
      id: z.string().min(1).max(100),
      name: z.string().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkFolderRate(ctx.session.user.id);
      return ctx.db.designFolder.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { name: stripTags(input.name) },
        select: { id: true, name: true },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await checkFolderRate(ctx.session.user.id);
      // Move assets out of folder and delete in a single transaction
      const [, deleted] = await ctx.db.$transaction([
        ctx.db.asset.updateMany({
          where: { folderId: input.id, userId: ctx.session.user.id },
          data: { folderId: null },
        }),
        ctx.db.designFolder.delete({
          where: { id: input.id, userId: ctx.session.user.id },
          select: { id: true },
        }),
      ]);
      return deleted;
    }),
});
