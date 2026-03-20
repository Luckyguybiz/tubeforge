import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/lib/rate-limit';
import { createHash } from 'crypto';

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
});
