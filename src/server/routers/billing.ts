import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';

function getStripe() {
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-12-18.acacia' as Stripe.LatestApiVersion });
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
    return {
      plan: user.plan,
      subscription: subscriptions.data[0] ?? null,
    };
  }),

  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(['PRO', 'STUDIO']) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { email: true, stripeId: true },
      });
      if (!user) throw new TRPCError({ code: 'NOT_FOUND' });

      const stripe = getStripe();
      let customerId = user.stripeId;
      if (!customerId) {
        const customer = await stripe.customers.create({ email: user.email ?? undefined });
        customerId = customer.id;
        await ctx.db.user.update({ where: { id: ctx.session.user.id }, data: { stripeId: customerId } });
      }

      const priceId = input.plan === 'PRO' ? env.STRIPE_PRICE_PRO : env.STRIPE_PRICE_STUDIO;
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
      });
      return { url: session.url };
    }),

  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { stripeId: true },
    });
    if (!user?.stripeId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Stripe-аккаунт не найден' });
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });
    return { url: session.url };
  }),
});
