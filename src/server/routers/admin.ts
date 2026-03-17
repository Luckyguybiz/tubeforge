import { z } from 'zod';
import { router, adminProcedure } from '../trpc';

export const adminRouter = router({
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [totalUsers, activeSubscriptions, totalAI] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.user.count({ where: { plan: { not: 'FREE' } } }),
      ctx.db.user.aggregate({ _sum: { aiUsage: true } }),
    ]);

    return {
      totalUsers,
      activeSubscriptions,
      totalAIUsage: totalAI._sum.aiUsage ?? 0,
    };
  }),

  listUsers: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
      search: z.string().optional(),
      planFilter: z.enum(['FREE', 'PRO', 'STUDIO']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 20, search, planFilter } = input ?? {};
      const where: Record<string, unknown> = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (planFilter) {
        where.plan = planFilter;
      }

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            plan: true,
            role: true,
            createdAt: true,
            _count: { select: { projects: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.db.user.count({ where }),
      ]);

      return { users, total, page, pages: Math.ceil(total / limit) };
    }),

  updateUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      plan: z.enum(['FREE', 'PRO', 'STUDIO']).optional(),
      role: z.enum(['USER', 'ADMIN']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, ...data } = input;
      return ctx.db.user.update({ where: { id: userId }, data, select: { id: true, plan: true, role: true } });
    }),
});
