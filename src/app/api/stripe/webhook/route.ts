import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/server/db';
import { env } from '@/lib/env';

function getStripe() {
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-12-18.acacia' as Stripe.LatestApiVersion });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 });
  }

  const stripe = getStripe();

  /** Safely extract priceId from a subscription's first line item */
  function getPlanFromSub(sub: Stripe.Subscription): 'PRO' | 'STUDIO' {
    const priceId = sub.items?.data?.[0]?.price?.id;
    return priceId === env.STRIPE_PRICE_STUDIO ? 'STUDIO' : 'PRO';
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.subscription || !session.customer) break;
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await db.user.update({
          where: { stripeId: session.customer as string },
          data: { plan: getPlanFromSub(sub) },
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        if (!sub.customer) break;
        await db.user.update({
          where: { stripeId: sub.customer as string },
          data: { plan: 'FREE' },
        });
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        if (!sub.customer) break;
        await db.user.update({
          where: { stripeId: sub.customer as string },
          data: { plan: getPlanFromSub(sub) },
        });
        break;
      }
      case 'invoice.paid': {
        // Subscription renewed successfully
        break;
      }
      case 'invoice.payment_failed': {
        console.warn('Payment failed for customer:', (event.data.object as Stripe.Invoice).customer);
        break;
      }
    }
  } catch (err) {
    console.error(`[Stripe webhook] Error processing ${event.type}:`, err instanceof Error ? err.message : err);
    // Return 200 to Stripe to prevent retries on application errors
  }

  return NextResponse.json({ received: true });
}
