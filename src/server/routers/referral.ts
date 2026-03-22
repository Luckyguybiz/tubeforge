import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { createHash } from 'crypto';
import { createLogger } from '@/lib/logger';

const log = createLogger('referral');

// Unambiguous alphanumeric chars (no O/0, I/1, l)
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Generate a deterministic TF-XXXX referral code from userId */
function generateReferralCode(userId: string): string {
  const hash = createHash('sha256').update(userId).digest();
  let code = 'TF-';
  for (let i = 0; i < 4; i++) {
    code += SAFE_CHARS[hash[i] % SAFE_CHARS.length];
  }
  return code;
}

/** Build share URLs for common platforms */
export function getReferralShareUrls(code: string) {
  const baseUrl = 'https://tubeforge.co';
  const refUrl = `${baseUrl}?ref=${code}`;
  const shareText = `Check out TubeForge — AI-powered YouTube tools! Use my referral code ${code} for a bonus.`;

  return {
    url: refUrl,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(refUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(refUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(refUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + refUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(refUrl)}&text=${encodeURIComponent(shareText)}`,
    email: `mailto:?subject=${encodeURIComponent('Try TubeForge!')}&body=${encodeURIComponent(shareText + '\n\n' + refUrl)}`,
  };
}

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
      shareUrls: user?.referralCode ? getReferralShareUrls(user.referralCode) : null,
    };
  }),

  /** Activate referral program — generate a deterministic TF-XXXX code */
  activate: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    // Check if user already has a code (idempotent)
    const existing = await ctx.db.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (existing?.referralCode) {
      return { code: existing.referralCode, shareUrls: getReferralShareUrls(existing.referralCode) };
    }

    let code = generateReferralCode(userId);

    // Handle unlikely collision — append extra char
    const collision = await ctx.db.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (collision) {
      const hash = createHash('sha256').update(userId + ':retry').digest();
      code = 'TF-' + Array.from({ length: 5 }, (_, i) => SAFE_CHARS[hash[i] % SAFE_CHARS.length]).join('');
    }

    await ctx.db.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });
    return { code, shareUrls: getReferralShareUrls(code) };
  }),

  /** Claim a referral code — called once after signup from localStorage */
  claimReferral: protectedProcedure
    .input(z.object({ code: z.string().min(1).max(20) }))
    .mutation(async ({ ctx, input }) => {
      const { success } = await rateLimit({
        identifier: `referral-apply:${ctx.session.user.id}`,
        limit: 5,
        window: 60,
      });
      if (!success) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' });
      }

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

  /** Get share URLs for a referral code */
  getShareUrls: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { referralCode: true },
    });
    if (!user?.referralCode) return null;
    return getReferralShareUrls(user.referralCode);
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

  /** Get rewards earned from referrals */
  getRewards: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { referralCode: true, referralEarnings: true, claimedMilestones: true },
    });
    if (!user?.referralCode) return { rewards: [], totalBonusCredits: 0 };

    const invited = await ctx.db.user.count({
      where: { referredBy: user.referralCode },
    });
    const paid = await ctx.db.user.count({
      where: { referredBy: user.referralCode, plan: { not: 'FREE' } },
    });

    const claimed = user.claimedMilestones ?? [];

    // Calculate reward milestones
    const rewards: { milestone: string; reward: string; earned: boolean; claimed: boolean }[] = [
      { milestone: '1_signup', reward: 'bonus_50_credits', earned: invited >= 1, claimed: claimed.includes('1_signup') },
      { milestone: '3_signups', reward: 'bonus_200_credits', earned: invited >= 3, claimed: claimed.includes('3_signups') },
      { milestone: '1_paid', reward: 'extended_trial_7d', earned: paid >= 1, claimed: claimed.includes('1_paid') },
      { milestone: '5_signups', reward: 'bonus_500_credits', earned: invited >= 5, claimed: claimed.includes('5_signups') },
      { milestone: '5_paid', reward: 'bonus_1000_credits', earned: paid >= 5, claimed: claimed.includes('5_paid') },
      { milestone: '10_paid', reward: 'pro_month_free', earned: paid >= 10, claimed: claimed.includes('10_paid') },
    ];

    // Total bonus AI credits (only count claimed milestones)
    let totalBonusCredits = 0;
    if (claimed.includes('1_signup')) totalBonusCredits += 50;
    if (claimed.includes('3_signups')) totalBonusCredits += 200;
    if (claimed.includes('5_signups')) totalBonusCredits += 500;
    if (claimed.includes('5_paid')) totalBonusCredits += 1000;

    return { rewards, totalBonusCredits };
  }),

  /** Claim a referral reward milestone — grants AI credits to the user */
  claimReward: protectedProcedure
    .input(z.object({ milestone: z.string().min(1).max(30) }))
    .mutation(async ({ ctx, input }) => {
      const { success } = await rateLimit({
        identifier: `referral-claim:${ctx.session.user.id}`,
        limit: 10,
        window: 60,
      });
      if (!success) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' });
      }

      const userId = ctx.session.user.id;
      const { milestone } = input;

      // Credit amounts per milestone (AI credits)
      const MILESTONE_CREDITS: Record<string, number> = {
        '1_signup': 50,
        '3_signups': 200,
        '5_signups': 500,
        '5_paid': 1000,
      };

      // Valid milestones (non-credit rewards handled separately)
      const VALID_MILESTONES = ['1_signup', '3_signups', '1_paid', '5_signups', '5_paid', '10_paid'];
      if (!VALID_MILESTONES.includes(milestone)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid milestone' });
      }

      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { referralCode: true, claimedMilestones: true, aiUsage: true },
      });

      if (!user?.referralCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Referral program not activated' });
      }

      // Already claimed?
      if ((user.claimedMilestones ?? []).includes(milestone)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Milestone already claimed' });
      }

      // Check if milestone is actually earned
      const [invited, paid] = await Promise.all([
        ctx.db.user.count({ where: { referredBy: user.referralCode } }),
        ctx.db.user.count({ where: { referredBy: user.referralCode, plan: { not: 'FREE' } } }),
      ]);

      const milestoneEarned: Record<string, boolean> = {
        '1_signup': invited >= 1,
        '3_signups': invited >= 3,
        '1_paid': paid >= 1,
        '5_signups': invited >= 5,
        '5_paid': paid >= 5,
        '10_paid': paid >= 10,
      };

      if (!milestoneEarned[milestone]) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Milestone not yet reached' });
      }

      // Grant the reward
      const credits = MILESTONE_CREDITS[milestone] ?? 0;
      const updatedClaimed = [...(user.claimedMilestones ?? []), milestone];

      // Use a transaction to atomically update claimedMilestones and grant credits
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ctx.db.$transaction(async (tx: any) => {
        // Mark milestone as claimed
        await tx.user.update({
          where: { id: userId },
          data: { claimedMilestones: updatedClaimed },
        });

        // Grant AI credits by decrementing aiUsage (lower usage = more credits remaining)
        // and increment referralEarnings to track total rewards earned
        if (credits > 0) {
          await tx.user.update({
            where: { id: userId },
            data: {
              aiUsage: { decrement: credits },
              referralEarnings: { increment: credits },
            },
          });
        }
      });

      log.info('Referral milestone claimed', { userId, milestone, credits });

      return { success: true, milestone, credits };
    }),
});
