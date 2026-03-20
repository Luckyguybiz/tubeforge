import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';
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
    // Single GROUP BY query instead of 12 individual queries (6 months x 2 tables)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [userCounts, projectCounts] = await Promise.all([
      ctx.db.$queryRaw<{ month: Date; count: bigint }[]>`
        SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*)::bigint as count
        FROM "User" WHERE "createdAt" >= ${sixMonthsAgo} GROUP BY 1 ORDER BY 1
      `,
      ctx.db.$queryRaw<{ month: Date; count: bigint }[]>`
        SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*)::bigint as count
        FROM "Project" WHERE "createdAt" >= ${sixMonthsAgo} GROUP BY 1 ORDER BY 1
      `,
    ]);

    // Build a map keyed by YYYY-MM for quick lookup
    const userMap = new Map(userCounts.map(r => [
      new Date(r.month).toISOString().slice(0, 7), Number(r.count),
    ]));
    const projectMap = new Map(projectCounts.map(r => [
      new Date(r.month).toISOString().slice(0, 7), Number(r.count),
    ]));

    const months: { month: string; users: number; projects: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      months.push({
        month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        users: userMap.get(key) ?? 0,
        projects: projectMap.get(key) ?? 0,
      });
    }
    return months;
  }),

  getRevenueStats: adminProcedure.query(async ({ ctx }) => {
    // Single aggregate queries instead of 18 individual queries (6 months x 3)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [planSnapshots, payoutsByMonth] = await Promise.all([
      // For each month-end, count PRO and STUDIO users created up to that point
      ctx.db.$queryRaw<{ month: Date; pro: bigint; studio: bigint }[]>`
        SELECT m.month,
          COUNT(*) FILTER (WHERE u.plan = 'PRO' AND u."createdAt" <= (m.month + INTERVAL '1 month' - INTERVAL '1 second')) as pro,
          COUNT(*) FILTER (WHERE u.plan = 'STUDIO' AND u."createdAt" <= (m.month + INTERVAL '1 month' - INTERVAL '1 second')) as studio
        FROM generate_series(${sixMonthsAgo}::timestamp, ${now}::timestamp, '1 month') AS m(month)
        LEFT JOIN "User" u ON u."createdAt" <= (m.month + INTERVAL '1 month' - INTERVAL '1 second')
          AND u.plan IN ('PRO', 'STUDIO')
        GROUP BY 1 ORDER BY 1
      `,
      ctx.db.$queryRaw<{ month: Date; total: number }[]>`
        SELECT DATE_TRUNC('month', "createdAt") as month, COALESCE(SUM(amount), 0)::float as total
        FROM "Payout" WHERE "createdAt" >= ${sixMonthsAgo} GROUP BY 1 ORDER BY 1
      `,
    ]);

    const planMap = new Map(planSnapshots.map(r => [
      new Date(r.month).toISOString().slice(0, 7),
      { pro: Number(r.pro), studio: Number(r.studio) },
    ]));
    const payoutMap = new Map(payoutsByMonth.map(r => [
      new Date(r.month).toISOString().slice(0, 7), r.total,
    ]));

    const months: { month: string; revenue: number; payouts: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const snap = planMap.get(key) ?? { pro: 0, studio: 0 };
      months.push({
        month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        revenue: snap.pro * 9 + snap.studio * 29, // estimated MRR
        payouts: payoutMap.get(key) ?? 0,
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
    // Single query instead of 7 individual groupBy queries (one per day)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    const activeCounts = await ctx.db.$queryRaw<{ day: Date; active: bigint }[]>`
      SELECT DATE_TRUNC('day', "updatedAt") as day, COUNT(DISTINCT "userId")::bigint as active
      FROM "Project"
      WHERE "updatedAt" >= ${sevenDaysAgo}
      GROUP BY 1 ORDER BY 1
    `;

    const activeMap = new Map(activeCounts.map(r => [
      new Date(r.day).toISOString().slice(0, 10), Number(r.active),
    ]));

    const days: { day: string; active: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        day: d.toLocaleString('default', { weekday: 'short' }),
        active: activeMap.get(key) ?? 0,
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

      return ctx.db.$transaction(async (tx) => {
        // 1. Fetch user's referralEarnings
        const user = await tx.user.findUnique({
          where: { id: input.userId },
          select: { referralEarnings: true },
        });

        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
        }

        // 2. Fetch sum of existing payouts for this user
        const existingPayouts = await tx.payout.aggregate({
          _sum: { amount: true },
          where: { userId: input.userId },
        });
        const totalPaidOut = existingPayouts._sum.amount ?? 0;

        // 3. Verify amount does not exceed pending earnings
        const pendingEarnings = user.referralEarnings - totalPaidOut;
        if (input.amount > pendingEarnings) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Payout amount ($${input.amount}) exceeds pending earnings ($${pendingEarnings.toFixed(2)})`,
          });
        }

        // 4. Create the payout record
        return tx.payout.create({
          data: { userId: input.userId, amount: input.amount, note: input.note },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    }),
});
