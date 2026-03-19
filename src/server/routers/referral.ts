import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const referralRouter = router({
  /** Get current user's referral code and earnings */
  getMyReferral: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { referralCode: true, referralEarnings: true },
    });
    return {
      code: user?.referralCode ?? null,
      earnings: user?.referralEarnings ?? 0,
    };
  }),

  /** Activate referral program — generate a code from the user ID */
  activate: protectedProcedure.mutation(async ({ ctx }) => {
    const code = ctx.session.user.id.slice(0, 8).toUpperCase();
    await ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: { referralCode: code },
    });
    return { code };
  }),

  /** Claim a referral code — called once after signup from localStorage */
  claimReferral: protectedProcedure
    .input(z.object({ code: z.string().min(1).max(20) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const code = input.code.toUpperCase();

      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { referredBy: true, referralCode: true },
      });

      // Already has a referrer
      if (user?.referredBy) return { alreadyClaimed: true };
      // Can't refer yourself
      if (user?.referralCode === code) return { selfReferral: true };

      // Validate referral code exists
      const referrer = await ctx.db.user.findUnique({
        where: { referralCode: code },
        select: { id: true },
      });
      if (!referrer) return { invalidCode: true };

      await ctx.db.user.update({
        where: { id: userId },
        data: { referredBy: code },
      });
      return { success: true };
    }),

  /** Get referral stats (invited count, paid, earnings) */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { referralCode: true, referralEarnings: true },
    });
    if (!user?.referralCode) return { invited: 0, paid: 0, earnings: 0 };

    const [invited, paid] = await Promise.all([
      ctx.db.user.count({
        where: { referredBy: user.referralCode },
      }),
      ctx.db.user.count({
        where: { referredBy: user.referralCode, plan: { not: 'FREE' } },
      }),
    ]);

    return { invited, paid, earnings: user?.referralEarnings ?? 0 };
  }),
});
