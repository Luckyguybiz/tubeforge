import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/server/db';
import { env } from '@/lib/env';
import { createLogger } from '@/lib/logger';
import { removePeerFromServer } from '@/lib/wireguard';
import { sendEmail } from '@/lib/email';

const log = createLogger('stripe');

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
      log.error('getPlanFromSub: subscription has no items', { subId: sub.id });
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
    log.error('Unknown price/product, cannot determine plan', { priceId, productId, subId: sub.id });
    return null;
  }

  /** Update user plan by stripeId — uses updateMany to avoid throwing if user not found */
  async function updatePlan(stripeId: string, plan: 'FREE' | 'PRO' | 'STUDIO') {
    const result = await db.user.updateMany({
      where: { stripeId },
      data: { plan },
    });
    if (result.count === 0) {
      log.warn('No user found for stripeId', { stripeId });
    }
  }

  /** Look up user email + name by Stripe customer ID (for sending emails) */
  async function getUserEmailByStripeId(stripeId: string): Promise<{ email: string; name: string; plan: string } | null> {
    const user = await db.user.findFirst({
      where: { stripeId },
      select: { email: true, name: true, plan: true },
    });
    if (!user?.email) return null;
    return { email: user.email, name: user.name ?? '', plan: user.plan ?? 'FREE' };
  }

  /** Revoke VPN access for a customer being downgraded to FREE */
  async function revokeVpnForCustomer(stripeId: string) {
    try {
      const user = await db.user.findFirst({ where: { stripeId }, select: { id: true } });
      if (!user) return;
      const peer = await db.vpnPeer.findUnique({ where: { userId: user.id } });
      if (!peer || !peer.active) return;
      await db.vpnPeer.update({
        where: { id: peer.id },
        data: { active: false, revokedAt: new Date() },
      });
      try {
        removePeerFromServer(peer.publicKey);
      } catch (err) {
        log.error('Failed to remove VPN peer from server during downgrade', { stripeId, error: String(err) });
      }
      log.info('VPN peer revoked due to plan downgrade', { stripeId, userId: user.id });
    } catch (err) {
      log.error('Failed to revoke VPN for customer', { stripeId, error: String(err) });
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
          log.warn('Duplicate checkout.session.completed event, skipping', { eventId: event.id });
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
              log.warn('Duplicate checkout.session.completed event (unique constraint), skipping', { eventId: event.id });
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
          log.warn('Duplicate customer.subscription.deleted event, skipping', { eventId: event.id });
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
            log.warn('Duplicate customer.subscription.deleted event (unique constraint), skipping', { eventId: event.id });
          } else {
            throw err;
          }
        }
        await revokeVpnForCustomer(sub.customer as string);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        if (!sub.customer) break;

        // If the subscription is not active (e.g. past_due, canceled, unpaid),
        // downgrade to FREE instead of upgrading.
        if (sub.status !== 'active' && sub.status !== 'trialing') {
          log.warn('Subscription not active', { status: sub.status, subId: sub.id });
          // Idempotency: skip if this event was already processed
          const existingInactive = await db.processedEvent.findUnique({
            where: { stripeEventId: event.id },
          });
          if (existingInactive) {
            log.warn('Duplicate customer.subscription.updated event, skipping', { eventId: event.id });
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
              log.warn('Duplicate customer.subscription.updated event (unique constraint), skipping', { eventId: event.id });
            } else {
              throw err;
            }
          }
          await revokeVpnForCustomer(sub.customer as string);
          break;
        }

        // Idempotency: skip if this event was already processed
        const existingUpdate = await db.processedEvent.findUnique({
          where: { stripeEventId: event.id },
        });
        if (existingUpdate) {
          log.warn('Duplicate customer.subscription.updated event, skipping', { eventId: event.id });
          break;
        }

        const updatedPlan = getPlanFromSub(sub);
        if (updatedPlan) {
          // Capture old plan before updating for the email notification
          const preUpdateUser = await getUserEmailByStripeId(sub.customer as string);
          const oldPlan = preUpdateUser?.plan ?? 'FREE';

          try {
            await db.$transaction([
              db.processedEvent.create({ data: { stripeEventId: event.id } }),
              db.user.updateMany({
                where: { stripeId: sub.customer as string },
                data: { plan: updatedPlan },
              }),
            ]);

            // Send plan change email (non-blocking)
            if (preUpdateUser?.email && oldPlan !== updatedPlan) {
              try {
                sendEmail({
                  to: preUpdateUser.email,
                  template: 'plan-change',
                  data: {
                    oldPlan,
                    newPlan: updatedPlan,
                    locale: 'ru',
                  },
                }).catch((err) => log.error('Plan change email failed', { error: String(err) }));
              } catch {
                // Never block webhook due to email
              }
            }

            // Revoke VPN if downgrading to a plan without VPN (FREE or PRO)
            if (updatedPlan !== 'STUDIO') {
              await revokeVpnForCustomer(sub.customer as string);
            }
          } catch (err) {
            const isPrismaUnique = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002';
            if (isPrismaUnique) {
              log.warn('Duplicate customer.subscription.updated event (unique constraint), skipping', { eventId: event.id });
            } else {
              throw err;
            }
          }
        }
        break;
      }
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        if (!sub.customer) break;

        // Only activate if the subscription is active or trialing
        if (sub.status !== 'active' && sub.status !== 'trialing') {
          log.warn('subscription.created but status is not active', { status: sub.status, subId: sub.id });
          break;
        }

        // Idempotency: skip if this event was already processed
        const existingCreated = await db.processedEvent.findUnique({
          where: { stripeEventId: event.id },
        });
        if (existingCreated) {
          log.warn('Duplicate customer.subscription.created event, skipping', { eventId: event.id });
          break;
        }

        const createdPlan = getPlanFromSub(sub);
        if (createdPlan) {
          try {
            await db.$transaction([
              db.processedEvent.create({ data: { stripeEventId: event.id } }),
              db.user.updateMany({
                where: { stripeId: sub.customer as string },
                data: { plan: createdPlan },
              }),
            ]);
            log.info('subscription.created — plan set', { plan: createdPlan, customerId: sub.customer as string });
          } catch (err) {
            const isPrismaUnique = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002';
            if (isPrismaUnique) {
              log.warn('Duplicate customer.subscription.created event (unique constraint), skipping', { eventId: event.id });
            } else {
              throw err;
            }
          }
        }
        break;
      }
      case 'customer.subscription.paused': {
        const sub = event.data.object as Stripe.Subscription;
        if (!sub.customer) break;

        // Idempotency: skip if this event was already processed
        const existingPaused = await db.processedEvent.findUnique({
          where: { stripeEventId: event.id },
        });
        if (existingPaused) {
          log.warn('Duplicate customer.subscription.paused event, skipping', { eventId: event.id });
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
          log.info('subscription.paused — downgraded to FREE', { customerId: sub.customer as string });
        } catch (err) {
          const isPrismaUnique = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002';
          if (isPrismaUnique) {
            log.warn('Duplicate customer.subscription.paused event (unique constraint), skipping', { eventId: event.id });
          } else {
            throw err;
          }
        }
        await revokeVpnForCustomer(sub.customer as string);
        break;
      }
      case 'customer.subscription.resumed': {
        const sub = event.data.object as Stripe.Subscription;
        if (!sub.customer) break;

        // Idempotency: skip if this event was already processed
        const existingResumed = await db.processedEvent.findUnique({
          where: { stripeEventId: event.id },
        });
        if (existingResumed) {
          log.warn('Duplicate customer.subscription.resumed event, skipping', { eventId: event.id });
          break;
        }

        const resumedPlan = getPlanFromSub(sub);
        if (resumedPlan) {
          try {
            await db.$transaction([
              db.processedEvent.create({ data: { stripeEventId: event.id } }),
              db.user.updateMany({
                where: { stripeId: sub.customer as string },
                data: { plan: resumedPlan },
              }),
            ]);
            log.info('subscription.resumed — plan restored', { plan: resumedPlan, customerId: sub.customer as string });
          } catch (err) {
            const isPrismaUnique = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002';
            if (isPrismaUnique) {
              log.warn('Duplicate customer.subscription.resumed event (unique constraint), skipping', { eventId: event.id });
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

        const invoiceCustomerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;

        if (!invoiceCustomerId) break;

        // --- Payment recovery: restore plan if user was downgraded to FREE ---
        // When a previously-failed payment succeeds, the user may be on FREE
        // despite having an active subscription. Detect and restore.
        const paidUser = await db.user.findFirst({
          where: { stripeId: invoiceCustomerId },
          select: { id: true, plan: true, referredBy: true },
        });

        // In Stripe v20+, subscription lives under parent.subscription_details
        const invoiceSubRef = invoice.parent?.subscription_details?.subscription;
        if (paidUser?.plan === 'FREE' && invoiceSubRef) {
          const paidSub = await stripe.subscriptions.retrieve(
            typeof invoiceSubRef === 'string'
              ? invoiceSubRef
              : invoiceSubRef.id,
          );
          if (paidSub.status === 'active' || paidSub.status === 'trialing') {
            const restoredPlan = getPlanFromSub(paidSub);
            if (restoredPlan) {
              await updatePlan(invoiceCustomerId, restoredPlan);
              log.info('invoice.paid — restored plan (was FREE due to prior payment failure)', {
                plan: restoredPlan,
                customerId: invoiceCustomerId,
              });
            }
          }
        }

        // --- Send payment receipt email (non-blocking) ---
        try {
          const paymentUser = await getUserEmailByStripeId(invoiceCustomerId);
          if (paymentUser?.email) {
            const amountFormatted = (invoice.amount_paid / 100).toFixed(2);
            const paidDate = invoice.status_transitions?.paid_at
              ? new Date((invoice.status_transitions as { paid_at?: number }).paid_at! * 1000).toLocaleDateString('ru-RU')
              : new Date().toLocaleDateString('ru-RU');
            sendEmail({
              to: paymentUser.email,
              template: 'payment-receipt',
              data: {
                plan: paymentUser.plan,
                amount: `${amountFormatted} ${invoice.currency?.toUpperCase() ?? 'USD'}`,
                date: paidDate,
                locale: 'ru',
              },
            }).catch((err) => log.error('Payment receipt email failed', { error: String(err) }));
          }
        } catch {
          // Never block webhook due to email
        }

        // --- Referral commission ---
        if (!paidUser?.referredBy) break;

        // Credit 20% commission to the referrer
        const commission = Math.round((invoice.amount_paid * 20) / 100);

        // Find the referrer so we can link the payout record
        const referrer = await db.user.findFirst({
          where: { referralCode: paidUser.referredBy },
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

          // Send referral commission email to the referrer (non-blocking)
          try {
            const referrerUser = await db.user.findUnique({
              where: { id: referrer.id },
              select: { email: true, name: true, referralEarnings: true },
            });
            if (referrerUser?.email) {
              const commissionFormatted = (commission / 100).toFixed(2);
              const totalFormatted = ((referrerUser.referralEarnings ?? 0) / 100).toFixed(2);
              sendEmail({
                to: referrerUser.email,
                template: 'referral-commission',
                data: {
                  amount: `${commissionFormatted} ${invoice.currency?.toUpperCase() ?? 'USD'}`,
                  totalBalance: `${totalFormatted} ${invoice.currency?.toUpperCase() ?? 'USD'}`,
                  locale: 'ru',
                },
              }).catch((err) => log.error('Referral commission email failed', { error: String(err) }));
            }
          } catch {
            // Never block webhook due to email
          }
        } catch (err) {
          // P2002 = unique constraint violation → duplicate webhook, safe to ignore
          const isPrismaUnique = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002';
          if (isPrismaUnique) {
            log.warn('Duplicate invoice.paid event (unique constraint), skipping', { eventId: event.id });
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

        log.warn('Payment failed', {
          customerId: failedCustomerId ?? 'unknown',
          invoiceId: failedInvoice.id,
          attempt: failedInvoice.attempt_count ?? 0,
        });

        if (failedCustomerId) {
          // Idempotency: skip if this event was already processed
          const existingFailed = await db.processedEvent.findUnique({
            where: { stripeEventId: event.id },
          });
          if (existingFailed) {
            log.warn('Duplicate invoice.payment_failed event, skipping', { eventId: event.id });
            break;
          }

          // Check how many times Stripe has retried. On final attempt (typically 4th),
          // downgrade the user to FREE so they lose access to paid features.
          // On earlier attempts, just log — Stripe's smart retries may recover payment.
          const attemptCount = failedInvoice.attempt_count ?? 0;

          // Send payment-failed notification email (non-blocking, on every attempt)
          try {
            const failedUser = await getUserEmailByStripeId(failedCustomerId);
            if (failedUser?.email) {
              sendEmail({
                to: failedUser.email,
                template: 'payment-failed',
                data: {
                  plan: failedUser.plan,
                  attempt: attemptCount,
                  locale: 'ru',
                },
              }).catch((err) => log.error('Payment-failed email failed', { error: String(err) }));
            }
          } catch {
            // Never block webhook due to email
          }

          if (attemptCount >= 4) {
            // Final retry exhausted — downgrade to FREE
            try {
              await db.$transaction([
                db.processedEvent.create({ data: { stripeEventId: event.id } }),
                db.user.updateMany({
                  where: { stripeId: failedCustomerId },
                  data: { plan: 'FREE' },
                }),
              ]);
              log.warn('Downgraded user to FREE after failed payment attempts', {
                attempts: attemptCount,
                customerId: failedCustomerId,
              });
              await revokeVpnForCustomer(failedCustomerId);
            } catch (err) {
              const isPrismaUnique = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002';
              if (isPrismaUnique) {
                log.warn('Duplicate invoice.payment_failed event (unique constraint), skipping', { eventId: event.id });
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
            log.warn('Payment failed — not downgrading yet', {
              attempt: attemptCount,
              customerId: failedCustomerId,
            });
          }
        }
        break;
      }
    }
  } catch (err) {
    log.error('Unhandled webhook error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
