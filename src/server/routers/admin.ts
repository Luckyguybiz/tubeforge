import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';

async function checkAdminRate(userId: string) {
  const { success } = await rateLimit({ identifier: `admin:${userId}`, limit: 60, window: 60 });
  if (!success) {
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
  }
}

export const adminRouter = router({
  getStats: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeSubscriptions,
      totalAI,
      totalProjects,
      videosToday,
      usersThisWeek,
      projectsThisWeek,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.user.count({ where: { plan: { not: 'FREE' } } }),
      ctx.db.user.aggregate({ _sum: { aiUsage: true } }),
      ctx.db.project.count(),
      ctx.db.scene.count({
        where: { status: 'READY', project: { updatedAt: { gte: todayStart } } },
      }),
      ctx.db.user.count({ where: { createdAt: { gte: weekAgo } } }),
      ctx.db.project.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);

    return {
      totalUsers,
      activeSubscriptions,
      totalAIUsage: totalAI._sum.aiUsage ?? 0,
      totalProjects,
      videosToday,
      usersThisWeek,
      projectsThisWeek,
    };
  }),

  listUsers: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
      search: z.string().optional(),
      planFilter: z.enum(['FREE', 'PRO', 'STUDIO']).optional(),
      sortBy: z.enum(['createdAt', 'name', 'plan', 'role']).default('createdAt'),
      sortDir: z.enum(['asc', 'desc']).default('desc'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 20, search, planFilter, sortBy = 'createdAt', sortDir = 'desc' } = input ?? {};
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
            image: true,
            plan: true,
            role: true,
            aiUsage: true,
            createdAt: true,
            _count: { select: { projects: true } },
          },
          orderBy: { [sortBy]: sortDir },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.db.user.count({ where }),
      ]);

      return { users, total, page, pages: Math.ceil(total / limit) };
    }),

  recentActivity: adminProcedure.query(async ({ ctx }) => {
    const [recentUsers, recentProjects] = await Promise.all([
      ctx.db.user.findMany({
        select: { id: true, name: true, email: true, image: true, plan: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      ctx.db.project.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return { recentUsers, recentProjects };
  }),

  updateUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      plan: z.enum(['FREE', 'PRO', 'STUDIO']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkAdminRate(ctx.session.user.id);
      const { userId, ...data } = input;
      const user = await ctx.db.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      return ctx.db.user.update({ where: { id: userId }, data, select: { id: true, plan: true, role: true } });
    }),

  deleteUser: adminProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkAdminRate(ctx.session.user.id);
      // Prevent admin from deleting themselves
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Нельзя удалить собственный аккаунт' });
      }
      await ctx.db.user.delete({ where: { id: input.userId } });
      return { success: true };
    }),

  /* ── Analytics chart endpoints ──────────────────────────────────── */

  getGrowthStats: adminProcedure.query(async ({ ctx }) => {
    // Return user growth by month for the last 6 months
    const months: { month: string; users: number; projects: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const [users, projects] = await Promise.all([
        ctx.db.user.count({ where: { createdAt: { gte: start, lte: end } } }),
        ctx.db.project.count({ where: { createdAt: { gte: start, lte: end } } }),
      ]);
      months.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        users,
        projects,
      });
    }
    return months;
  }),

  getRevenueStats: adminProcedure.query(async ({ ctx }) => {
    const months: { month: string; revenue: number; payouts: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const [proUsers, studioUsers, payoutSum] = await Promise.all([
        ctx.db.user.count({ where: { plan: 'PRO', createdAt: { lte: end } } }),
        ctx.db.user.count({ where: { plan: 'STUDIO', createdAt: { lte: end } } }),
        ctx.db.payout.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: start, lte: end } } }),
      ]);
      months.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        revenue: proUsers * 9 + studioUsers * 29, // estimated MRR
        payouts: payoutSum._sum.amount ?? 0,
      });
    }
    return months;
  }),

  getPlanDistribution: adminProcedure.query(async ({ ctx }) => {
    const [free, pro, studio] = await Promise.all([
      ctx.db.user.count({ where: { plan: 'FREE' } }),
      ctx.db.user.count({ where: { plan: 'PRO' } }),
      ctx.db.user.count({ where: { plan: 'STUDIO' } }),
    ]);
    return [
      { name: 'Free', value: free, color: '#6b7280' },
      { name: 'Pro', value: pro, color: '#3b82f6' },
      { name: 'Studio', value: studio, color: '#8b5cf6' },
    ];
  }),

  getActiveUsers: adminProcedure.query(async ({ ctx }) => {
    const days: { day: string; active: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59);
      const active = await ctx.db.project.groupBy({
        by: ['userId'],
        where: { updatedAt: { gte: start, lte: end } },
      });
      days.push({
        day: start.toLocaleString('default', { weekday: 'short' }),
        active: active.length,
      });
    }
    return days;
  }),

  referralStats: adminProcedure.query(async ({ ctx }) => {
    const referrers = await ctx.db.user.findMany({
      where: { referralEarnings: { gt: 0 } },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        referralEarnings: true,
        payouts: { select: { amount: true } },
      },
      orderBy: { referralEarnings: 'desc' },
      take: 50,
    });

    return referrers.map(r => ({
      ...r,
      totalPaid: r.payouts.reduce((s, p) => s + p.amount, 0),
      pending: r.referralEarnings - r.payouts.reduce((s, p) => s + p.amount, 0),
    }));
  }),

  createPayout: adminProcedure
    .input(z.object({ userId: z.string(), amount: z.number().positive(), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await checkAdminRate(ctx.session.user.id);
      return ctx.db.payout.create({
        data: { userId: input.userId, amount: input.amount, note: input.note },
      });
    }),
});
