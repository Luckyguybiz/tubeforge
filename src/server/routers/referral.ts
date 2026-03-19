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

  /** Get referral stats (invited count, paid, earnings) */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { referralCode: true, referralEarnings: true },
    });
    if (!user?.referralCode) return { invited: 0, paid: 0, earnings: 0 };

    const invited = await ctx.db.user.count({
      where: { referredBy: user.referralCode },
    });
    return { invited, paid: 0, earnings: user?.referralEarnings ?? 0 };
  }),
});
