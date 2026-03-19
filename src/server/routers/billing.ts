import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_ERROR } from '@/lib/constants';

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
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { plan: true, stripeId: true },
    });
    if (!user?.stripeId) return { plan: user?.plan ?? 'FREE', subscription: null };

    const stripe = getStripe();
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeId,
      status: 'active',
      limit: 1,
    });
    const sub = subscriptions.data[0] ?? null;
    if (!sub) return { plan: user.plan, subscription: null };
    return {
      plan: user.plan,
      subscription: {
        id: sub.id,
        status: sub.status,
        cancelAt: sub.cancel_at,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        plan: sub.items.data[0]?.price?.id ?? null,
      },
    };
  }),

  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(['PRO', 'STUDIO']) }))
    .mutation(async ({ ctx, input }) => {
      await checkBillingRate(ctx.session.user.id);
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
            if (!customerId) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create Stripe customer' });
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

      const envRef = input.plan === 'PRO' ? env.STRIPE_PRICE_PRO : env.STRIPE_PRICE_STUDIO;

      // Support both price IDs (price_...) and product IDs (prod_...)
      let resolvedPriceId: string;
      if (envRef.startsWith('price_')) {
        resolvedPriceId = envRef;
      } else if (envRef.startsWith('prod_')) {
        // Lookup the default price from the product
        const prices = await stripe.prices.list({ product: envRef, active: true, limit: 1 });
        if (!prices.data[0]) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Не найдена цена для продукта в Stripe' });
        }
        resolvedPriceId = prices.data[0].id;
      } else {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Invalid Stripe price/product config: expected price_ or prod_ prefix, got: ${envRef.slice(0, 8)}...`,
        });
      }

      const appUrl = env.NEXT_PUBLIC_APP_URL.startsWith('http')
        ? env.NEXT_PUBLIC_APP_URL
        : `https://${env.NEXT_PUBLIC_APP_URL}`;

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: resolvedPriceId, quantity: 1 }],
        success_url: `${appUrl}/dashboard?upgraded=true`,
        cancel_url: `${appUrl}/dashboard`,
      });
      return { url: session.url };
    }),

  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    await checkBillingRate(ctx.session.user.id);
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { stripeId: true },
    });
    if (!user?.stripeId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Stripe-аккаунт не найден' });
    const stripe = getStripe();
    const appUrl = env.NEXT_PUBLIC_APP_URL.startsWith('http')
      ? env.NEXT_PUBLIC_APP_URL
      : `https://${env.NEXT_PUBLIC_APP_URL}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeId,
      return_url: `${appUrl}/dashboard`,
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
});
