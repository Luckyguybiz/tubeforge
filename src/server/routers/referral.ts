import { router, protectedProcedure } from '../trpc';

/**
 * Referral router — partner / affiliate programme.
 *
 * NOTE: The Prisma schema has been updated with referralCode, referredBy and
 * referralEarnings fields, but the migration has not been run yet. To keep
 * the code compiling before `prisma migrate`, we cast the select/data objects
 * through `as any`. Remove the casts once `npx prisma generate` is run after
 * the migration.
 */

export const referralRouter = router({
  /** Get current user's referral code and earnings */
  getMyReferral: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { referralCode: true, referralEarnings: true } as any,
    });
    return {
      code: (user as any)?.referralCode ?? null,
      earnings: (user as any)?.referralEarnings ?? 0,
    };
  }),

  /** Activate referral program — generate a code from the user ID */
  activate: protectedProcedure.mutation(async ({ ctx }) => {
    const code = ctx.session.user.id.slice(0, 8).toUpperCase();
    await ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: { referralCode: code } as any,
    });
    return { code };
  }),

  /** Get referral stats (invited count, paid, earnings) */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { referralCode: true, referralEarnings: true } as any,
    });
    if (!(user as any)?.referralCode) return { invited: 0, paid: 0, earnings: 0 };

    const invited = await ctx.db.user.count({
      where: { referredBy: (user as any).referralCode } as any,
    });
    // paid = 0 for MVP — will be tracked via Stripe webhook later
    return { invited, paid: 0, earnings: (user as any)?.referralEarnings ?? 0 };
  }),
});
