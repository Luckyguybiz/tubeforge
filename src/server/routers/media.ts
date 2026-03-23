import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { getPlanLimits } from '@/lib/constants';

export const mediaRouter = router({
  /** List user's media assets with search/filter */
  list: protectedProcedure
    .input(z.object({
      search: z.string().max(200).optional(),
      type: z.enum(['all', 'image', 'video', 'audio']).default('all'),
      folderId: z.string().min(1).max(100).nullish(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(30),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const where: Record<string, unknown> = { userId };

      if (input.folderId) {
        where.folderId = input.folderId;
      }

      if (input.type !== 'all') {
        where.type = input.type;
      }

      if (input.search) {
        where.filename = { contains: input.search, mode: 'insensitive' };
      }

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

  /** Get storage usage stats */
  storageStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const plan = user?.plan ?? 'FREE';

    const result = await ctx.db.asset.aggregate({
      where: { userId },
      _sum: { size: true },
      _count: true,
    });

    const usedBytes = result._sum.size ?? 0;
    const totalBytes = getPlanLimits(plan).storageBytes;
    const fileCount = result._count;

    return {
      usedBytes,
      totalBytes,
      fileCount,
      plan,
    };
  }),

  /** Get folders for media organization */
  folders: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.designFolder.findMany({
      where: { userId: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        parentId: true,
        _count: { select: { assets: true } },
      },
      orderBy: { name: 'asc' },
    });
  }),
});
