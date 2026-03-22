// @vitest-environment node
/**
 * N2 — Stripe webhook handler tests.
 *
 * Tests the core webhook event processing logic replicated from
 * src/app/api/webhooks/stripe/route.ts:
 *   - checkout.session.completed -> sets user plan
 *   - customer.subscription.deleted -> downgrades to FREE
 *   - invoice.paid -> sends receipt email / referral commission
 *   - Duplicate event (same stripeEventId) -> skipped
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ── Mock modules ──────────────────────────────────────────────── */

const mockSendEmail = vi.fn().mockResolvedValue({});
const mockRemovePeer = vi.fn();

vi.mock('@/lib/email', () => ({ sendEmail: (...args: unknown[]) => mockSendEmail(...args) }));
vi.mock('@/lib/wireguard', () => ({ removePeerFromServer: (...args: unknown[]) => mockRemovePeer(...args) }));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

/* ── Types ────────────────────────────────────────────────────── */

/* eslint-disable @typescript-eslint/no-explicit-any */
type MockDb = Record<string, any>;

interface WebhookEvent {
  id: string;
  type: string;
  data: { object: any };
}

/* ── Replicated webhook logic ─────────────────────────────────── */

const ENV = {
  STRIPE_PRICE_PRO: 'price_pro_123',
  STRIPE_PRICE_STUDIO: 'price_studio_456',
};

function getPlanFromSub(sub: {
  id: string;
  items: { data: { price: { id: string; product: string } }[] };
}): 'PRO' | 'STUDIO' | null {
  const item = sub.items?.data?.[0];
  if (!item) return null;
  const priceId = item.price?.id ?? '';
  const productId = typeof item.price?.product === 'string' ? item.price.product : '';

  if (priceId === ENV.STRIPE_PRICE_STUDIO || productId === ENV.STRIPE_PRICE_STUDIO) return 'STUDIO';
  if (priceId === ENV.STRIPE_PRICE_PRO || productId === ENV.STRIPE_PRICE_PRO) return 'PRO';
  return null;
}

/**
 * Process a webhook event. This is a simplified version of the handler
 * that exercises the core business logic.
 */
async function processWebhookEvent(event: WebhookEvent, db: MockDb, stripeApi: any) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (!session.subscription || !session.customer) return { skipped: true };

      const existing = await db.processedEvent.findUnique({
        where: { stripeEventId: event.id },
      });
      if (existing) return { skipped: true, reason: 'duplicate' };

      const sub = await stripeApi.subscriptions.retrieve(session.subscription);
      const plan = getPlanFromSub(sub);
      if (!plan) return { skipped: true, reason: 'unknown_plan' };

      await db.$transaction([
        db.processedEvent.create({ data: { stripeEventId: event.id } }),
        db.user.updateMany({
          where: { stripeId: session.customer },
          data: { plan },
        }),
      ]);
      return { processed: true, plan };
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      if (!sub.customer) return { skipped: true };

      const existing = await db.processedEvent.findUnique({
        where: { stripeEventId: event.id },
      });
      if (existing) return { skipped: true, reason: 'duplicate' };

      await db.$transaction([
        db.processedEvent.create({ data: { stripeEventId: event.id } }),
        db.user.updateMany({
          where: { stripeId: sub.customer },
          data: { plan: 'FREE' },
        }),
      ]);
      return { processed: true, plan: 'FREE' };
    }

    case 'invoice.paid': {
      const invoice = event.data.object;
      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;
      if (!customerId || !invoice.amount_paid) return { skipped: true };

      // Send receipt email
      const user = await db.user.findFirst({
        where: { stripeId: customerId },
        select: { email: true, name: true, plan: true, referredBy: true },
      });

      if (user?.email) {
        const amountFormatted = (invoice.amount_paid / 100).toFixed(2);
        await mockSendEmail({
          to: user.email,
          template: 'payment-receipt',
          data: {
            plan: user.plan,
            amount: `${amountFormatted} ${invoice.currency?.toUpperCase() ?? 'USD'}`,
            date: new Date().toLocaleDateString('en-US'),
            locale: 'ru',
          },
        });
      }

      // Referral commission
      if (user?.referredBy) {
        const commission = Math.round((invoice.amount_paid * 20) / 100);
        const referrer = await db.user.findFirst({
          where: { referralCode: user.referredBy },
          select: { id: true },
        });
        if (referrer) {
          try {
            await db.$transaction([
              db.user.update({
                where: { id: referrer.id },
                data: { referralEarnings: { increment: commission } },
              }),
              db.payout.create({
                data: { userId: referrer.id, amount: commission, stripeEventId: event.id },
              }),
            ]);
          } catch (err: any) {
            if (err?.code === 'P2002') {
              return { processed: true, duplicate_commission: true };
            }
            throw err;
          }
        }
      }

      return { processed: true };
    }

    default:
      return { skipped: true, reason: 'unhandled_event_type' };
  }
}

/* ── Helpers ───────────────────────────────────────────────── */

function makeDb(): MockDb {
  return {
    processedEvent: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'pe-1' }),
    },
    user: {
      findFirst: vi.fn().mockResolvedValue({ email: 'user@test.com', name: 'User', plan: 'PRO', referredBy: null }),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    payout: {
      create: vi.fn().mockResolvedValue({ id: 'payout-1' }),
    },
    vpnPeer: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    $transaction: vi.fn(async (ops: any[]) => Promise.all(ops)),
  };
}

function makeStripeApi() {
  return {
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        id: 'sub_1',
        items: { data: [{ price: { id: 'price_pro_123', product: 'prod_1' } }] },
      }),
    },
  };
}

/* ── Tests ─────────────────────────────────────────────────── */

describe('Stripe webhook handler', () => {
  let db: MockDb;
  let stripeApi: ReturnType<typeof makeStripeApi>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeDb();
    stripeApi = makeStripeApi();
  });

  /* ── checkout.session.completed ────────────────────────── */

  describe('checkout.session.completed', () => {
    it('sets user plan to PRO on successful checkout', async () => {
      const result = await processWebhookEvent({
        id: 'evt_checkout_1',
        type: 'checkout.session.completed',
        data: { object: { subscription: 'sub_1', customer: 'cus_1' } },
      }, db, stripeApi);

      expect(result).toEqual({ processed: true, plan: 'PRO' });
      expect(db.$transaction).toHaveBeenCalled();
      expect(db.user.updateMany).toHaveBeenCalledWith({
        where: { stripeId: 'cus_1' },
        data: { plan: 'PRO' },
      });
    });

    it('sets user plan to STUDIO when subscription matches studio price', async () => {
      stripeApi.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_2',
        items: { data: [{ price: { id: 'price_studio_456', product: 'prod_2' } }] },
      });

      const result = await processWebhookEvent({
        id: 'evt_checkout_2',
        type: 'checkout.session.completed',
        data: { object: { subscription: 'sub_2', customer: 'cus_2' } },
      }, db, stripeApi);

      expect(result).toEqual({ processed: true, plan: 'STUDIO' });
    });

    it('creates processedEvent record for idempotency', async () => {
      await processWebhookEvent({
        id: 'evt_checkout_3',
        type: 'checkout.session.completed',
        data: { object: { subscription: 'sub_1', customer: 'cus_1' } },
      }, db, stripeApi);

      expect(db.processedEvent.create).toHaveBeenCalledWith({
        data: { stripeEventId: 'evt_checkout_3' },
      });
    });

    it('skips duplicate event (same stripeEventId)', async () => {
      db.processedEvent.findUnique.mockResolvedValue({ id: 'pe-existing', stripeEventId: 'evt_dup_1' });

      const result = await processWebhookEvent({
        id: 'evt_dup_1',
        type: 'checkout.session.completed',
        data: { object: { subscription: 'sub_1', customer: 'cus_1' } },
      }, db, stripeApi);

      expect(result).toEqual({ skipped: true, reason: 'duplicate' });
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('skips when subscription is missing', async () => {
      const result = await processWebhookEvent({
        id: 'evt_no_sub',
        type: 'checkout.session.completed',
        data: { object: { subscription: null, customer: 'cus_1' } },
      }, db, stripeApi);

      expect(result).toEqual({ skipped: true });
    });

    it('skips when plan cannot be determined from subscription', async () => {
      stripeApi.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_unknown',
        items: { data: [{ price: { id: 'price_unknown', product: 'prod_unknown' } }] },
      });

      const result = await processWebhookEvent({
        id: 'evt_unknown_plan',
        type: 'checkout.session.completed',
        data: { object: { subscription: 'sub_unknown', customer: 'cus_1' } },
      }, db, stripeApi);

      expect(result).toEqual({ skipped: true, reason: 'unknown_plan' });
    });
  });

  /* ── customer.subscription.deleted ─────────────────────── */

  describe('customer.subscription.deleted', () => {
    it('downgrades user to FREE', async () => {
      const result = await processWebhookEvent({
        id: 'evt_del_1',
        type: 'customer.subscription.deleted',
        data: { object: { customer: 'cus_1' } },
      }, db, stripeApi);

      expect(result).toEqual({ processed: true, plan: 'FREE' });
      expect(db.user.updateMany).toHaveBeenCalledWith({
        where: { stripeId: 'cus_1' },
        data: { plan: 'FREE' },
      });
    });

    it('creates processedEvent record for idempotency', async () => {
      await processWebhookEvent({
        id: 'evt_del_2',
        type: 'customer.subscription.deleted',
        data: { object: { customer: 'cus_1' } },
      }, db, stripeApi);

      expect(db.processedEvent.create).toHaveBeenCalledWith({
        data: { stripeEventId: 'evt_del_2' },
      });
    });

    it('skips duplicate event', async () => {
      db.processedEvent.findUnique.mockResolvedValue({ id: 'pe-existing' });

      const result = await processWebhookEvent({
        id: 'evt_del_dup',
        type: 'customer.subscription.deleted',
        data: { object: { customer: 'cus_1' } },
      }, db, stripeApi);

      expect(result).toEqual({ skipped: true, reason: 'duplicate' });
    });

    it('skips when customer is missing', async () => {
      const result = await processWebhookEvent({
        id: 'evt_del_no_cus',
        type: 'customer.subscription.deleted',
        data: { object: { customer: null } },
      }, db, stripeApi);

      expect(result).toEqual({ skipped: true });
    });
  });

  /* ── invoice.paid ──────────────────────────────────────── */

  describe('invoice.paid', () => {
    it('sends receipt email when user has email', async () => {
      db.user.findFirst.mockResolvedValue({
        email: 'user@test.com', name: 'User', plan: 'PRO', referredBy: null,
      });

      await processWebhookEvent({
        id: 'evt_inv_1',
        type: 'invoice.paid',
        data: {
          object: {
            customer: 'cus_1',
            amount_paid: 2900,
            currency: 'usd',
            status_transitions: { paid_at: 1700000000 },
          },
        },
      }, db, stripeApi);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          template: 'payment-receipt',
          data: expect.objectContaining({
            plan: 'PRO',
            amount: expect.stringContaining('29.00'),
          }),
        }),
      );
    });

    it('credits 20% referral commission', async () => {
      db.user.findFirst
        .mockResolvedValueOnce({
          email: 'user@test.com', name: 'User', plan: 'PRO', referredBy: 'REF123',
        })
        .mockResolvedValueOnce({ id: 'referrer-1' });

      await processWebhookEvent({
        id: 'evt_inv_ref',
        type: 'invoice.paid',
        data: {
          object: { customer: 'cus_1', amount_paid: 2900, currency: 'usd' },
        },
      }, db, stripeApi);

      // 20% of 2900 = 580
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'referrer-1' },
        data: { referralEarnings: { increment: 580 } },
      });
      expect(db.payout.create).toHaveBeenCalledWith({
        data: { userId: 'referrer-1', amount: 580, stripeEventId: 'evt_inv_ref' },
      });
    });

    it('skips when amount_paid is 0', async () => {
      const result = await processWebhookEvent({
        id: 'evt_inv_zero',
        type: 'invoice.paid',
        data: {
          object: { customer: 'cus_1', amount_paid: 0 },
        },
      }, db, stripeApi);

      expect(result).toEqual({ skipped: true });
    });

    it('handles duplicate commission via P2002 gracefully', async () => {
      db.user.findFirst
        .mockResolvedValueOnce({
          email: 'u@test.com', name: 'U', plan: 'PRO', referredBy: 'REF1',
        })
        .mockResolvedValueOnce({ id: 'ref-1' });

      db.$transaction.mockRejectedValueOnce({ code: 'P2002' });

      const result = await processWebhookEvent({
        id: 'evt_inv_dup_commission',
        type: 'invoice.paid',
        data: {
          object: { customer: 'cus_1', amount_paid: 1000, currency: 'usd' },
        },
      }, db, stripeApi);

      expect(result).toEqual({ processed: true, duplicate_commission: true });
    });
  });

  /* ── getPlanFromSub ────────────────────────────────────── */

  describe('getPlanFromSub', () => {
    it('returns PRO for matching price ID', () => {
      expect(getPlanFromSub({
        id: 'sub_1',
        items: { data: [{ price: { id: 'price_pro_123', product: 'prod_1' } }] },
      })).toBe('PRO');
    });

    it('returns STUDIO for matching price ID', () => {
      expect(getPlanFromSub({
        id: 'sub_2',
        items: { data: [{ price: { id: 'price_studio_456', product: 'prod_2' } }] },
      })).toBe('STUDIO');
    });

    it('returns PRO for matching product ID', () => {
      expect(getPlanFromSub({
        id: 'sub_3',
        items: { data: [{ price: { id: 'price_other', product: 'price_pro_123' } }] },
      })).toBe('PRO');
    });

    it('returns null for unknown price/product', () => {
      expect(getPlanFromSub({
        id: 'sub_4',
        items: { data: [{ price: { id: 'price_unknown', product: 'prod_unknown' } }] },
      })).toBeNull();
    });

    it('returns null when no items', () => {
      expect(getPlanFromSub({
        id: 'sub_5',
        items: { data: [] },
      })).toBeNull();
    });
  });

  /* ── Unhandled event types ─────────────────────────────── */

  describe('Unhandled event types', () => {
    it('returns skipped for unknown event types', async () => {
      const result = await processWebhookEvent({
        id: 'evt_unknown',
        type: 'customer.updated',
        data: { object: {} },
      }, db, stripeApi);

      expect(result).toEqual({ skipped: true, reason: 'unhandled_event_type' });
    });
  });
});
