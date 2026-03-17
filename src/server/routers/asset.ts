import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';
import { stripTags } from '@/lib/sanitize';

/** Mutation rate limit: 30 asset actions per minute per user */
async function checkAssetRate(userId: string) {
  const { success } = await rateLimit({ identifier: `asset:${userId}`, limit: 30, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

export const assetRouter = router({
  list: protectedProcedure
    .input(z.object({
      folderId: z.string().nullish(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(30),
    }))
    .query(async ({ ctx, input }) => {
      const where = {
        userId: ctx.session.user.id,
        ...(input.folderId ? { folderId: input.folderId } : {}),
      };
      const [items, total] = await Promise.all([
        ctx.db.asset.findMany({
          where,
          select: {
            id: true,
            url: true,
            filename: true,
            type: true,
            size: true,
            folderId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.asset.count({ where }),
      ]);
      return { items, total, pages: Math.ceil(total / input.limit) };
    }),

  create: protectedProcedure
    .input(z.object({
      url: z.string().url(),
      filename: z.string().min(1).max(255),
      type: z.string().default('image'),
      size: z.number().min(0).default(0),
      folderId: z.string().nullish(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkAssetRate(ctx.session.user.id);
      return ctx.db.asset.create({
        data: {
          url: input.url,
          filename: stripTags(input.filename),
          type: input.type,
          size: input.size,
          folderId: input.folderId ?? null,
          userId: ctx.session.user.id,
        },
        select: { id: true, url: true, filename: true, type: true, folderId: true },
      });
    }),

  move: protectedProcedure
    .input(z.object({
      id: z.string(),
      folderId: z.string().nullish(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkAssetRate(ctx.session.user.id);

      if (input.folderId) {
        const folder = await ctx.db.designFolder.findFirst({
          where: { id: input.folderId, userId: ctx.session.user.id },
          select: { id: true },
        });
        if (!folder) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Папка назначения не найдена' });
        }
      }

      return ctx.db.asset.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { folderId: input.folderId ?? null },
        select: { id: true, folderId: true },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkAssetRate(ctx.session.user.id);
      return ctx.db.asset.delete({
        where: { id: input.id, userId: ctx.session.user.id },
        select: { id: true },
      });
    }),
});
