import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/server/db';
import { env } from '@/lib/env';

function getStripe() {
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-12-18.acacia' as Stripe.LatestApiVersion });
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

  /** Safely extract priceId from a subscription's first line item */
  function getPlanFromSub(sub: Stripe.Subscription): 'PRO' | 'STUDIO' {
    const priceId = sub.items?.data?.[0]?.price?.id;
    return priceId === env.STRIPE_PRICE_STUDIO ? 'STUDIO' : 'PRO';
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
        // Subscription renewed successfully
        break;
      }
      case 'invoice.payment_failed': {
        console.warn('[Stripe webhook] Payment failed for customer:', (event.data.object as Stripe.Invoice).customer);
        break;
      }
    }
  } catch (err) {
    console.error(`[Stripe webhook] Error processing ${event.type}:`, err instanceof Error ? err.message : err);
    // Return 200 to Stripe to prevent retries on application errors
  }

  return NextResponse.json({ received: true });
}
