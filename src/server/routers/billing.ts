import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';
import { cache } from '@/lib/cache';

const SUBSCRIPTION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Billing rate limit: 5 checkout/portal actions per minute per user */
async function checkBillingRate(userId: string) {
  const { success } = await rateLimit({ identifier: `billing:${userId}`, limit: 5, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

function getStripe() {
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' as Stripe.LatestApiVersion });
}

export const billingRouter = router({
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const cacheKey = `billing:sub:${ctx.session.user.id}`;
    type SubResult = { plan: string; subscription: { id: string; status: string; cancelAt: number | null; cancelAtPeriodEnd: boolean; currentPeriodEnd: number | null } | null };
    const cached = cache.get<SubResult>(cacheKey);
    if (cached) return cached;

    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { plan: true, stripeId: true },
    });
    if (!user?.stripeId) {
      const result = { plan: user?.plan ?? 'FREE', subscription: null };
      cache.set(cacheKey, result, SUBSCRIPTION_CACHE_TTL);
      return result;
    }

    const stripe = getStripe();
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeId,
      limit: 5,
    });
    // Filter to active, past_due, or trialing — ignore canceled/incomplete
    const relevantSub = subscriptions.data.find(
      (s) => s.status === 'active' || s.status === 'past_due' || s.status === 'trialing',
    );
    const sub = relevantSub ?? null;
    if (!sub) {
      const result = { plan: user.plan, subscription: null };
      cache.set(cacheKey, result, SUBSCRIPTION_CACHE_TTL);
      return result;
    }
    if (!sub.items.data[0]) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to load subscription details. Please try again.' });
    }
    const result = {
      plan: user.plan,
      subscription: {
        id: sub.id,
        status: sub.status,
        cancelAt: sub.cancel_at,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        currentPeriodEnd: sub.items.data[0]?.current_period_end ?? null,
      },
    };
    cache.set(cacheKey, result, SUBSCRIPTION_CACHE_TTL);
    return result;
  }),

  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(['PRO', 'STUDIO']), annual: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      await checkBillingRate(ctx.session.user.id);
      cache.delete(`billing:sub:${ctx.session.user.id}`);
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { email: true, stripeId: true },
      });
      if (!user) throw new TRPCError({ code: 'NOT_FOUND' });

      const stripe = getStripe();
      let customerId = user.stripeId;
      if (!customerId) {
        if (!user.email) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email required for billing' });
        }
        let newCustomerId: string | undefined;
        try {
          const customer = await stripe.customers.create({ email: user.email ?? undefined });
          newCustomerId = customer.id;
          // Atomic: only set stripeId if still null (prevents race with concurrent requests)
          const updated = await ctx.db.user.updateMany({
            where: { id: ctx.session.user.id, stripeId: null },
            data: { stripeId: newCustomerId },
          });
          if (updated.count === 0) {
            // Another request already set stripeId — use the existing one, clean up ours
            try { await stripe.customers.del(newCustomerId); } catch { /* best effort */ }
            const fresh = await ctx.db.user.findUnique({
              where: { id: ctx.session.user.id },
              select: { stripeId: true },
            });
            customerId = fresh?.stripeId ?? null;
            if (!customerId) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to set up billing. Please try again.' });
          } else {
            customerId = newCustomerId;
          }
        } catch (err) {
          if (err instanceof TRPCError) throw err;
          if (newCustomerId) {
            try { await stripe.customers.del(newCustomerId); } catch { /* best effort */ }
          }
          throw err;
        }
      }

      const isAnnual = input.annual ?? false;

      let envRef: string;
      if (input.plan === 'PRO') {
        envRef = isAnnual && env.STRIPE_PRICE_PRO_ANNUAL
          ? env.STRIPE_PRICE_PRO_ANNUAL
          : env.STRIPE_PRICE_PRO;
      } else {
        envRef = isAnnual && env.STRIPE_PRICE_STUDIO_ANNUAL
          ? env.STRIPE_PRICE_STUDIO_ANNUAL
          : env.STRIPE_PRICE_STUDIO;
      }

      // Support both price IDs (price_...) and product IDs (prod_...)
      let resolvedPriceId: string;
      if (envRef.startsWith('price_')) {
        resolvedPriceId = envRef;
      } else if (envRef.startsWith('prod_')) {
        // Lookup the default price from the product
        const prices = await stripe.prices.list({ product: envRef, active: true, limit: 1 });
        if (!prices.data[0]) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Pricing configuration error. Please contact support.' });
        }
        resolvedPriceId = prices.data[0].id;
      } else {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Billing configuration error. Please contact support.',
        });
      }

      // Check if the user already has an active/trialing/past_due subscription.
      // If so, update the existing subscription (plan change) instead of creating a new checkout.
      if (customerId) {
        const existingSubs = await stripe.subscriptions.list({
          customer: customerId,
          limit: 5,
        });
        const activeSub = existingSubs.data.find(
          (s) => s.status === 'active' || s.status === 'past_due' || s.status === 'trialing',
        );
        if (activeSub) {
          const currentItem = activeSub.items.data[0];
          if (!currentItem) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to update subscription. Please try again.' });
          }
          // If they're already on this price, no change needed — send to portal
          if (currentItem.price?.id === resolvedPriceId) {
            const appUrl = env.NEXT_PUBLIC_APP_URL.startsWith('http')
              ? env.NEXT_PUBLIC_APP_URL
              : `https://${env.NEXT_PUBLIC_APP_URL}`;
            const portalSession = await stripe.billingPortal.sessions.create({
              customer: customerId,
              return_url: `${appUrl}/billing`,
            });
            return { url: portalSession.url };
          }
          // Update the subscription to the new price with prorated billing
          await stripe.subscriptions.update(activeSub.id, {
            items: [{ id: currentItem.id, price: resolvedPriceId }],
            proration_behavior: 'create_prorations',
          });
          return { url: null, updated: true };
        }
      }

      const appUrl = env.NEXT_PUBLIC_APP_URL.startsWith('http')
        ? env.NEXT_PUBLIC_APP_URL
        : `https://${env.NEXT_PUBLIC_APP_URL}`;

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        client_reference_id: ctx.session.user.id,
        metadata: { userId: ctx.session.user.id, plan: input.plan },
        mode: 'subscription',
        allow_promotion_codes: true,
        line_items: [{ price: resolvedPriceId, quantity: 1 }],
        success_url: `${appUrl}/billing?success=true`,
        cancel_url: `${appUrl}/billing`,
      });
      return { url: session.url };
    }),

  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    await checkBillingRate(ctx.session.user.id);
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { stripeId: true },
    });
    if (!user?.stripeId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No Stripe account found' });
    const stripe = getStripe();
    const appUrl = env.NEXT_PUBLIC_APP_URL.startsWith('http')
      ? env.NEXT_PUBLIC_APP_URL
      : `https://${env.NEXT_PUBLIC_APP_URL}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeId,
      return_url: `${appUrl}/billing`,
    });
    return { url: session.url };
  }),

  getInvoices: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { stripeId: true },
    });
    if (!user?.stripeId) return [];
    try {
      const stripe = getStripe();
      const invoices = await stripe.invoices.list({ customer: user.stripeId, limit: 12 });
      return invoices.data.map((inv) => ({
        id: inv.id,
        date: inv.created,
        amount: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        pdf: inv.invoice_pdf,
      }));
    } catch {
      return [];
    }
  }),

  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    await checkBillingRate(ctx.session.user.id);
    cache.delete(`billing:sub:${ctx.session.user.id}`);
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { stripeId: true },
    });
    if (!user?.stripeId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'No Stripe account found' });
    }

    const stripe = getStripe();
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeId,
      limit: 5,
    });
    const activeSub = subscriptions.data.find(
      (s) => s.status === 'active' || s.status === 'past_due' || s.status === 'trialing',
    );
    if (!activeSub) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'No active subscription found' });
    }

    // Cancel at period end — user keeps access until the current billing period expires
    await stripe.subscriptions.update(activeSub.id, {
      cancel_at_period_end: true,
    });

    return { cancelAtPeriodEnd: true, currentPeriodEnd: activeSub.items.data[0]?.current_period_end ?? null };
  }),

  reactivateSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    await checkBillingRate(ctx.session.user.id);
    cache.delete(`billing:sub:${ctx.session.user.id}`);
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { stripeId: true },
    });
    if (!user?.stripeId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'No Stripe account found' });
    }

    const stripe = getStripe();
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeId,
      limit: 5,
    });
    // Find a subscription that was cancelled at period end but is still active
    const cancelledSub = subscriptions.data.find(
      (s) => (s.status === 'active' || s.status === 'trialing') && s.cancel_at_period_end,
    );
    if (!cancelledSub) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'No cancelled subscription to reactivate' });
    }

    // Remove the scheduled cancellation — subscription continues as normal
    await stripe.subscriptions.update(cancelledSub.id, {
      cancel_at_period_end: false,
    });

    return { reactivated: true };
  }),
});
