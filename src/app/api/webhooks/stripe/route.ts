import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/server/db';
import { env } from '@/lib/env';

function getStripe() {
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' as Stripe.LatestApiVersion });
}

export async function POST(req: NextRequest) {
  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 });
  }

  /**
   * Determine plan from subscription.
   * Supports both price IDs (price_...) and product IDs (prod_...) in env config.
   */
  function getPlanFromSub(sub: Stripe.Subscription): 'FREE' | 'PRO' | 'STUDIO' {
    const item = sub.items?.data?.[0];
    if (!item) {
      console.warn('[Stripe] getPlanFromSub: subscription has no items');
      return 'FREE';
    }

    const priceId = item.price?.id ?? '';
    const productId = typeof item.price?.product === 'string'
      ? item.price.product
      : (item.price?.product as Stripe.Product)?.id ?? '';

    // Match by price ID or product ID
    const studioRef = env.STRIPE_PRICE_STUDIO;
    if (priceId === studioRef || productId === studioRef) return 'STUDIO';

    const proRef = env.STRIPE_PRICE_PRO;
    if (priceId === proRef || productId === proRef) return 'PRO';

    // Unknown subscription — don't grant any paid plan
    console.warn('[Stripe] Unknown price/product:', priceId, productId);
    return 'FREE';
  }

  /** Update user plan by stripeId — uses updateMany to avoid throwing if user not found */
  async function updatePlan(stripeId: string, plan: 'FREE' | 'PRO' | 'STUDIO') {
    const result = await db.user.updateMany({
      where: { stripeId },
      data: { plan },
    });
    if (result.count === 0) {
      console.warn(`[Stripe webhook] No user found for stripeId: ${stripeId}`);
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.subscription || !session.customer) break;
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await updatePlan(session.customer as string, getPlanFromSub(sub));
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        if (!sub.customer) break;
        await updatePlan(sub.customer as string, 'FREE');
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        if (!sub.customer) break;
        await updatePlan(sub.customer as string, getPlanFromSub(sub));
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.customer || !invoice.amount_paid) break;

        // Find the paying user and check if they were referred
        const payingUser = await db.user.findFirst({
          where: { stripeId: invoice.customer as string },
          select: { referredBy: true },
        });
        if (!payingUser?.referredBy) break;

        // Idempotency: use Stripe event ID to prevent duplicate referral credits
        // on webhook retries. The stripeEventId field must be unique in the Payout model.
        const alreadyProcessed = await db.payout.findFirst({
          where: { stripeEventId: event.id },
        });
        if (alreadyProcessed) {
          console.warn('[Stripe] Duplicate invoice.paid event, skipping:', event.id);
          break;
        }

        // Credit 20% commission to the referrer
        const commission = (invoice.amount_paid / 100) * 0.2;

        // Find the referrer so we can link the payout record
        const referrer = await db.user.findFirst({
          where: { referralCode: payingUser.referredBy },
          select: { id: true },
        });
        if (!referrer) break;

        // Atomically credit the referrer and record the payout for dedup
        await db.$transaction([
          db.user.update({
            where: { id: referrer.id },
            data: { referralEarnings: { increment: commission } },
          }),
          db.payout.create({
            data: {
              userId: referrer.id,
              amount: commission,
              stripeEventId: event.id,
            },
          }),
        ]);
        break;
      }
      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object as Stripe.Invoice;
        // Don't immediately downgrade — Stripe will retry. Log for monitoring.
        console.warn(
          '[Stripe] Payment failed for customer:', failedInvoice.customer,
          'invoice:', failedInvoice.id,
        );
        break;
      }
    }
  } catch (err) {
    console.error(`[Stripe webhook] Error processing ${event.type}:`, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
