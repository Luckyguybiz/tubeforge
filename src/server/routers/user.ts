import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';
import { stripTags } from '@/lib/sanitize';
import { removePeerFromServer } from '@/lib/wireguard';

function getStripe() {
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' as Stripe.LatestApiVersion });
}

/** Mutation rate limit: 10 user actions per minute per user */
async function checkUserRate(userId: string) {
  const { success } = await rateLimit({ identifier: `user:${userId}`, limit: 10, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        plan: true,
        role: true,
        aiUsage: true,
        onboardingDone: true,
        createdAt: true,
        channels: { select: { id: true, title: true, thumbnail: true, subscribers: true } },
        _count: { select: { projects: true } },
      },
    });
  }),

  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await checkUserRate(ctx.session.user.id);
    return ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: { onboardingDone: true },
      select: { id: true, onboardingDone: true },
    });
  }),

  resetOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await checkUserRate(ctx.session.user.id);
    return ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: { onboardingDone: false },
      select: { id: true, onboardingDone: true },
    });
  }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(50).optional() }))
    .mutation(async ({ ctx, input }) => {
      await checkUserRate(ctx.session.user.id);
      const data = { ...input };
      if (data.name) data.name = stripTags(data.name);
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data,
        select: { id: true, name: true },
      });
    }),

  /**
   * GDPR data export — returns all user-facing data as structured JSON.
   * Rate-limited to 2 requests per hour per user (expensive query).
   * NEVER returns OAuth tokens, secrets, stripeId, or internal IDs of other users.
   */
  exportData: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Strict rate limit: 2 requests per hour (3600 seconds)
    const { success } = await rateLimit({
      identifier: `export:${userId}`,
      limit: 2,
      window: 3600,
    });
    if (!success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: RATE_LIMIT_ERROR,
      });
    }

    const userData = await ctx.db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        plan: true,
        role: true,
        referralCode: true,
        referralEarnings: true,
        aiUsage: true,
        createdAt: true,
        updatedAt: true,
        projects: {
          select: {
            id: true,
            title: true,
            description: true,
            tags: true,
            thumbnailUrl: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            scenes: {
              select: {
                id: true,
                label: true,
                prompt: true,
                duration: true,
                order: true,
                status: true,
                model: true,
                videoUrl: true,
              },
            },
          },
        },
        assets: {
          select: {
            id: true,
            url: true,
            filename: true,
            type: true,
            size: true,
            folderId: true,
            createdAt: true,
          },
        },
        designFolders: {
          select: {
            id: true,
            name: true,
            parentId: true,
            createdAt: true,
          },
        },
        accounts: {
          select: { provider: true, type: true },
        },
        payouts: {
          select: {
            id: true,
            amount: true,
            method: true,
            note: true,
            createdAt: true,
          },
        },
        channels: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            subscribers: true,
            createdAt: true,
          },
        },
        vpnPeer: {
          select: {
            assignedIp: true,
            publicKey: true,
            active: true,
            createdAt: true,
            revokedAt: true,
          },
        },
      },
    });

    if (!userData) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    return {
      exportDate: new Date().toISOString(),
      user: {
        name: userData.name,
        email: userData.email,
        plan: userData.plan,
        role: userData.role,
        referralCode: userData.referralCode,
        referralEarnings: userData.referralEarnings,
        aiUsage: userData.aiUsage,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      projects: userData.projects,
      assets: userData.assets,
      folders: userData.designFolders,
      channels: userData.channels,
      connectedAccounts: userData.accounts.map((a) => ({
        provider: a.provider,
        type: a.type,
      })),
      payouts: userData.payouts,
      vpnPeer: userData.vpnPeer,
    };
  }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await checkUserRate(ctx.session.user.id);
    const userId = ctx.session.user.id;

    // Cancel Stripe subscriptions before deleting user data.
    // This must happen BEFORE the DB transaction so billing stops.
    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: { stripeId: true },
    });

    if (user?.stripeId) {
      const stripe = getStripe();

      // Cancel all active subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeId,
        status: 'active',
      });
      for (const sub of subscriptions.data) {
        await stripe.subscriptions.cancel(sub.id);
      }

      // Also cancel any past_due or trialing subscriptions
      for (const status of ['past_due', 'trialing'] as const) {
        const subs = await stripe.subscriptions.list({
          customer: user.stripeId,
          status,
        });
        for (const sub of subs.data) {
          await stripe.subscriptions.cancel(sub.id);
        }
      }

      // Delete the Stripe customer to clean up payment methods and prevent
      // any future invoicing. This is a best-effort operation.
      try {
        await stripe.customers.del(user.stripeId);
      } catch {
        // Non-fatal: subscriptions are already cancelled above
      }
    }

    // Revoke VPN peer before deleting user data (best-effort)
    const vpnPeer = await ctx.db.vpnPeer.findUnique({
      where: { userId },
      select: { publicKey: true },
    });
    if (vpnPeer) {
      try { removePeerFromServer(vpnPeer.publicKey); } catch { /* best effort */ }
    }

    // Delete all user data in a single transaction to ensure atomicity.
    // Order respects FK constraints.
    await ctx.db.$transaction([
      // 1. Remove team memberships (FK to User without onDelete cascade)
      ctx.db.teamMember.deleteMany({ where: { userId } }),
      // 2. Delete owned teams (FK to User without onDelete cascade)
      //    TeamMember records of OTHER users in owned teams cascade from Team.
      ctx.db.team.deleteMany({ where: { ownerId: userId } }),
      // 3. Design folders (children SetNull via FolderTree, assets SetNull via folder FK)
      ctx.db.designFolder.deleteMany({ where: { userId } }),
      // 4. Assets
      ctx.db.asset.deleteMany({ where: { userId } }),
      // 5. Projects (scenes cascade via onDelete: Cascade)
      ctx.db.project.deleteMany({ where: { userId } }),
      // 6. YouTube channels
      ctx.db.channel.deleteMany({ where: { userId } }),
      // 7. Auth sessions and accounts (cascade exists, but explicit for clarity)
      ctx.db.session.deleteMany({ where: { userId } }),
      ctx.db.account.deleteMany({ where: { userId } }),
      // 8. Finally delete the user
      ctx.db.user.delete({ where: { id: userId } }),
    ]);

    return { success: true };
  }),
});
