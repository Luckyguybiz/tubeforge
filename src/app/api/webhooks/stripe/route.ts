import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/server/db';
import { env } from '@/lib/env';

function getStripe() {
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' as Stripe.LatestApiVersion });
}

export async function POST(req: NextRequest) {
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
  if (contentLength > 1_000_000) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

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
  function getPlanFromSub(sub: Stripe.Subscription): 'PRO' | 'STUDIO' | null {
    const item = sub.items?.data?.[0];
    if (!item) {
      console.error('[Stripe] getPlanFromSub: subscription has no items, sub:', sub.id);
      return null;
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

    // Unknown subscription — refuse to map to any plan
    console.error('[Stripe] Unknown price/product, cannot determine plan. priceId:', priceId, 'productId:', productId, 'sub:', sub.id);
    return null;
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

        // Idempotency: skip if this event was already processed
        const existingCheckout = await db.processedEvent.findUnique({
          where: { stripeEventId: event.id },
        });
        if (existingCheckout) {
          console.warn('[Stripe] Duplicate checkout.session.completed event, skipping:', event.id);
          break;
        }

        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const plan = getPlanFromSub(sub);
        if (plan) {
          try {
            await db.$transaction([
              db.processedEvent.create({ data: { stripeEventId: event.id } }),
              db.user.updateMany({
                where: { stripeId: session.customer as string },
                data: { plan },
              }),
            ]);
          } catch (err) {
            const isPrismaUnique = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002';
            if (isPrismaUnique) {
              console.warn('[Stripe] Duplicate checkout.session.completed event (unique constraint), skipping:', event.id);
            } else {
              throw err;
            }
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        if (!sub.customer) break;

        // Idempotency: skip if this event was already processed
        const existingDeletion = await db.processedEvent.findUnique({
          where: { stripeEventId: event.id },
        });
        if (existingDeletion) {
          console.warn('[Stripe] Duplicate customer.subscription.deleted event, skipping:', event.id);
          break;
        }

        try {
          await db.$transaction([
            db.processedEvent.create({ data: { stripeEventId: event.id } }),
            db.user.updateMany({
              where: { stripeId: sub.customer as string },
              data: { plan: 'FREE' },
            }),
          ]);
        } catch (err) {
          const isPrismaUnique = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002';
          if (isPrismaUnique) {
            console.warn('[Stripe] Duplicate customer.subscription.deleted event (unique constraint), skipping:', event.id);
          } else {
            throw err;
          }
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        if (!sub.customer) break;

        // If the subscription is not active (e.g. past_due, canceled, unpaid),
        // downgrade to FREE instead of upgrading.
        if (sub.status !== 'active' && sub.status !== 'trialing') {
          console.warn('[Stripe] Subscription not active, status:', sub.status, 'sub:', sub.id);
          // Idempotency: skip if this event was already processed
          const existingInactive = await db.processedEvent.findUnique({
            where: { stripeEventId: event.id },
          });
          if (existingInactive) {
            console.warn('[Stripe] Duplicate customer.subscription.updated event, skipping:', event.id);
            break;
          }
          try {
            await db.$transaction([
              db.processedEvent.create({ data: { stripeEventId: event.id } }),
              db.user.updateMany({
                where: { stripeId: sub.customer as string },
                data: { plan: 'FREE' },
              }),
            ]);
          } catch (err) {
            const isPrismaUnique = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002';
            if (isPrismaUnique) {
              console.warn('[Stripe] Duplicate customer.subscription.updated event (unique constraint), skipping:', event.id);
            } else {
              throw err;
            }
          }
          break;
        }

        // Idempotency: skip if this event was already processed
        const existingUpdate = await db.processedEvent.findUnique({
          where: { stripeEventId: event.id },
        });
        if (existingUpdate) {
          console.warn('[Stripe] Duplicate customer.subscription.updated event, skipping:', event.id);
          break;
        }

        const updatedPlan = getPlanFromSub(sub);
        if (updatedPlan) {
          try {
            await db.$transaction([
              db.processedEvent.create({ data: { stripeEventId: event.id } }),
              db.user.updateMany({
                where: { stripeId: sub.customer as string },
                data: { plan: updatedPlan },
              }),
            ]);
          } catch (err) {
            const isPrismaUnique = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002';
            if (isPrismaUnique) {
              console.warn('[Stripe] Duplicate customer.subscription.updated event (unique constraint), skipping:', event.id);
            } else {
              throw err;
            }
          }
        }
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

        // Credit 20% commission to the referrer
        const commission = Math.round((invoice.amount_paid * 20) / 100);

        // Find the referrer so we can link the payout record
        const referrer = await db.user.findFirst({
          where: { referralCode: payingUser.referredBy },
          select: { id: true },
        });
        if (!referrer) break;

        // Idempotency: rely on the UNIQUE constraint on stripeEventId.
        // If two webhooks race, the second insert will fail with P2002.
        // This is safer than check-then-insert which has a TOCTOU window.
        try {
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
        } catch (err) {
          // P2002 = unique constraint violation → duplicate webhook, safe to ignore
          const isPrismaUnique = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002';
          if (isPrismaUnique) {
            console.warn('[Stripe] Duplicate invoice.paid event (unique constraint), skipping:', event.id);
          } else {
            throw err; // Re-throw real errors
          }
        }
        break;
      }
      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object as Stripe.Invoice;
        const failedCustomerId = typeof failedInvoice.customer === 'string'
          ? failedInvoice.customer
          : failedInvoice.customer?.id;

        console.warn(
          '[Stripe] Payment failed for customer:', failedCustomerId,
          'invoice:', failedInvoice.id,
          'attempt:', failedInvoice.attempt_count,
        );

        if (failedCustomerId) {
          // Idempotency: skip if this event was already processed
          const existingFailed = await db.processedEvent.findUnique({
            where: { stripeEventId: event.id },
          });
          if (existingFailed) {
            console.warn('[Stripe] Duplicate invoice.payment_failed event, skipping:', event.id);
            break;
          }

          // Check how many times Stripe has retried. On final attempt (typically 4th),
          // downgrade the user to FREE so they lose access to paid features.
          // On earlier attempts, just log — Stripe's smart retries may recover payment.
          const attemptCount = failedInvoice.attempt_count ?? 0;

          if (attemptCount >= 3) {
            // Final retry exhausted — downgrade to FREE
            try {
              await db.$transaction([
                db.processedEvent.create({ data: { stripeEventId: event.id } }),
                db.user.updateMany({
                  where: { stripeId: failedCustomerId },
                  data: { plan: 'FREE' },
                }),
              ]);
              console.warn(
                '[Stripe] Downgraded user to FREE after', attemptCount,
                'failed payment attempts. Customer:', failedCustomerId,
              );
            } catch (err) {
              const isPrismaUnique = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002';
              if (isPrismaUnique) {
                console.warn('[Stripe] Duplicate invoice.payment_failed event (unique constraint), skipping:', event.id);
              } else {
                throw err;
              }
            }
          } else {
            // Early retry — record event for idempotency but don't downgrade yet
            try {
              await db.processedEvent.create({ data: { stripeEventId: event.id } });
            } catch (err) {
              const isPrismaUnique = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002';
              if (!isPrismaUnique) throw err;
            }
            console.warn(
              '[Stripe] Payment failed (attempt', attemptCount,
              ') — not downgrading yet. Customer:', failedCustomerId,
            );
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('[Stripe Webhook] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
