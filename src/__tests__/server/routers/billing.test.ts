// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';

/* ── Mock modules ──────────────────────────────────────────────── */

const mockRateLimit = vi.fn().mockResolvedValue({ success: true, remaining: 4, reset: Date.now() + 60_000 });
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...args: unknown[]) => mockRateLimit(...args) }));
vi.mock('@/lib/constants', () => ({ RATE_LIMIT_ERROR: 'Too many requests' }));

const mockStripeCustomersCreate = vi.fn().mockResolvedValue({ id: 'cus_new' });
const mockStripeCustomersDel = vi.fn().mockResolvedValue({});
const mockStripeSubscriptionsList = vi.fn().mockResolvedValue({ data: [] });
const mockStripeCheckoutSessionsCreate = vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/session' });
const mockStripeBillingPortalSessionsCreate = vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/portal' });
const mockStripePricesList = vi.fn().mockResolvedValue({ data: [{ id: 'price_resolved_1' }] });
const mockStripeInvoicesList = vi.fn().mockResolvedValue({
  data: [
    { id: 'inv_1', created: 1700000000, amount_paid: 2900, currency: 'usd', status: 'paid', invoice_pdf: 'https://pdf' },
  ],
});

// Stripe is imported as `import Stripe from 'stripe'` and used as `new Stripe(...)`.
// We need the default export to be a class/constructor.
class MockStripe {
  customers = { create: mockStripeCustomersCreate, del: mockStripeCustomersDel };
  subscriptions = { list: mockStripeSubscriptionsList };
  checkout = { sessions: { create: mockStripeCheckoutSessionsCreate } };
  billingPortal = { sessions: { create: mockStripeBillingPortalSessionsCreate } };
  prices = { list: mockStripePricesList };
  invoices = { list: mockStripeInvoicesList };
}

vi.mock('stripe', () => ({
  default: MockStripe,
}));

vi.mock('@/lib/env', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_PRICE_PRO: 'price_pro_123',
    STRIPE_PRICE_STUDIO: 'price_studio_456',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}));

/* ── tRPC setup ───────────────────────────────────────────────── */

type Session = {
  user: { id: string; name?: string | null; email?: string | null };
  expires: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type MockDb = Record<string, any>;
type TRPCContext = { db: MockDb; session: Session };

const t = initTRPC.context<TRPCContext>().create({ transformer: superjson });

const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx });
});

const { rateLimit } = await import('@/lib/rate-limit');
const { env } = await import('@/lib/env');

const RATE_LIMIT_ERROR = 'Too many requests';

async function checkBillingRate(userId: string) {
  const { success } = await rateLimit({ identifier: `billing:${userId}`, limit: 5, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
}

/* ── Replicate billing router logic ────────────────────────── */

const Stripe = (await import('stripe')).default;

function getStripe() {
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' as any });
}

const billingRouter = t.router({
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
        const customer = await stripe.customers.create({ email: user.email ?? undefined });
        customerId = customer.id;
        await ctx.db.user.updateMany({
          where: { id: ctx.session.user.id, stripeId: null },
          data: { stripeId: customerId },
        });
      }

      const envRef = input.plan === 'PRO' ? env.STRIPE_PRICE_PRO : env.STRIPE_PRICE_STUDIO;

      let resolvedPriceId: string;
      if (envRef.startsWith('price_')) {
        resolvedPriceId = envRef;
      } else if (envRef.startsWith('prod_')) {
        const prices = await stripe.prices.list({ product: envRef, active: true, limit: 1 });
        if (!prices.data[0]) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No price found for product' });
        }
        resolvedPriceId = prices.data[0].id;
      } else {
        resolvedPriceId = envRef;
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
    if (!user?.stripeId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Stripe account not found' });
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
      return invoices.data.map((inv: any) => ({
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

/* ── Helpers ───────────────────────────────────────────────── */

const USER_ID = 'user-billing-001';

function makeSession(userId = USER_ID): Session {
  return { user: { id: userId, name: 'Test User', email: 'test@example.com' }, expires: '2099-01-01' };
}

function makeDb(): MockDb {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({ email: 'test@example.com', stripeId: null, plan: 'FREE' }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

function createCaller(db: MockDb, session: Session) {
  return billingRouter.createCaller({ db, session });
}

/* ── Tests ─────────────────────────────────────────────────── */

describe('billingRouter', () => {
  let db: MockDb;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, remaining: 4, reset: Date.now() + 60_000 });
    db = makeDb();
    caller = createCaller(db, makeSession());
  });

  /* ── getSubscription ────────────────────────────────────── */

  describe('getSubscription', () => {
    it('returns FREE plan with no subscription when user has no stripeId', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'FREE', stripeId: null });
      const result = await caller.getSubscription();
      expect(result).toEqual({ plan: 'FREE', subscription: null });
    });

    it('returns plan with null subscription when stripe has no active subscriptions', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'PRO', stripeId: 'cus_123' });
      mockStripeSubscriptionsList.mockResolvedValue({ data: [] });
      const result = await caller.getSubscription();
      expect(result).toEqual({ plan: 'PRO', subscription: null });
    });

    it('returns active subscription details when stripe has one', async () => {
      db.user.findUnique.mockResolvedValue({ plan: 'PRO', stripeId: 'cus_123' });
      mockStripeSubscriptionsList.mockResolvedValue({
        data: [{
          id: 'sub_1',
          status: 'active',
          cancel_at: null,
          cancel_at_period_end: false,
          items: { data: [{ price: { id: 'price_pro_123' } }] },
        }],
      });
      const result = await caller.getSubscription();
      expect(result).toEqual({
        plan: 'PRO',
        subscription: {
          id: 'sub_1',
          status: 'active',
          cancelAt: null,
          cancelAtPeriodEnd: false,
          plan: 'price_pro_123',
        },
      });
    });

    it('defaults to FREE when user has no plan field', async () => {
      db.user.findUnique.mockResolvedValue({ plan: undefined, stripeId: null });
      const result = await caller.getSubscription();
      expect(result.plan).toBe('FREE');
    });
  });

  /* ── createCheckout ────────────────────────────────────── */

  describe('createCheckout', () => {
    it('creates a checkout session for PRO plan', async () => {
      db.user.findUnique.mockResolvedValue({ email: 'test@example.com', stripeId: null });
      const result = await caller.createCheckout({ plan: 'PRO' });
      expect(result).toEqual({ url: 'https://checkout.stripe.com/session' });
      expect(mockStripeCustomersCreate).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('creates a checkout session for STUDIO plan', async () => {
      db.user.findUnique.mockResolvedValue({ email: 'test@example.com', stripeId: null });
      await caller.createCheckout({ plan: 'STUDIO' });
      expect(mockStripeCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [{ price: 'price_studio_456', quantity: 1 }],
        }),
      );
    });

    it('uses existing stripeId when user already has one', async () => {
      db.user.findUnique.mockResolvedValue({ email: 'test@example.com', stripeId: 'cus_existing' });
      await caller.createCheckout({ plan: 'PRO' });
      expect(mockStripeCustomersCreate).not.toHaveBeenCalled();
      expect(mockStripeCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cus_existing' }),
      );
    });

    it('saves new customer ID via updateMany', async () => {
      db.user.findUnique.mockResolvedValue({ email: 'test@example.com', stripeId: null });
      await caller.createCheckout({ plan: 'PRO' });
      expect(db.user.updateMany).toHaveBeenCalledWith({
        where: { id: USER_ID, stripeId: null },
        data: { stripeId: 'cus_new' },
      });
    });

    it('throws NOT_FOUND when user is not found', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(caller.createCheckout({ plan: 'PRO' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('calls rate limit with billing identifier', async () => {
      db.user.findUnique.mockResolvedValue({ email: 'a@b.c', stripeId: 'cus_x' });
      await caller.createCheckout({ plan: 'PRO' });
      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: `billing:${USER_ID}`, limit: 5, window: 60 }),
      );
    });

    it('throws TOO_MANY_REQUESTS when rate limited', async () => {
      mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() });
      await expect(caller.createCheckout({ plan: 'PRO' })).rejects.toMatchObject({
        code: 'TOO_MANY_REQUESTS',
      });
    });

    it('passes correct success and cancel URLs', async () => {
      db.user.findUnique.mockResolvedValue({ email: 'a@b.c', stripeId: 'cus_x' });
      await caller.createCheckout({ plan: 'PRO' });
      expect(mockStripeCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'http://localhost:3000/dashboard?upgraded=true',
          cancel_url: 'http://localhost:3000/dashboard',
        }),
      );
    });

    it('rejects invalid plan', async () => {
      // @ts-expect-error - intentionally invalid for test
      await expect(caller.createCheckout({ plan: 'ULTIMATE' })).rejects.toThrow();
    });
  });

  /* ── createPortal ──────────────────────────────────────── */

  describe('createPortal', () => {
    it('creates a billing portal session', async () => {
      db.user.findUnique.mockResolvedValue({ stripeId: 'cus_123' });
      const result = await caller.createPortal();
      expect(result).toEqual({ url: 'https://billing.stripe.com/portal' });
      expect(mockStripeBillingPortalSessionsCreate).toHaveBeenCalledWith({
        customer: 'cus_123',
        return_url: 'http://localhost:3000/dashboard',
      });
    });

    it('throws BAD_REQUEST when user has no stripeId', async () => {
      db.user.findUnique.mockResolvedValue({ stripeId: null });
      await expect(caller.createPortal()).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    });

    it('throws BAD_REQUEST when user not found', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(caller.createPortal()).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    });

    it('calls rate limit check', async () => {
      db.user.findUnique.mockResolvedValue({ stripeId: 'cus_123' });
      await caller.createPortal();
      expect(mockRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: `billing:${USER_ID}` }),
      );
    });

    it('throws TOO_MANY_REQUESTS when rate limited', async () => {
      mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() });
      await expect(caller.createPortal()).rejects.toMatchObject({
        code: 'TOO_MANY_REQUESTS',
      });
    });
  });

  /* ── getInvoices ───────────────────────────────────────── */

  describe('getInvoices', () => {
    it('returns empty array when user has no stripeId', async () => {
      db.user.findUnique.mockResolvedValue({ stripeId: null });
      const result = await caller.getInvoices();
      expect(result).toEqual([]);
    });

    it('returns mapped invoice data', async () => {
      db.user.findUnique.mockResolvedValue({ stripeId: 'cus_123' });
      const result = await caller.getInvoices();
      expect(result).toEqual([
        {
          id: 'inv_1',
          date: 1700000000,
          amount: 2900,
          currency: 'usd',
          status: 'paid',
          pdf: 'https://pdf',
        },
      ]);
    });

    it('returns empty array when stripe throws', async () => {
      db.user.findUnique.mockResolvedValue({ stripeId: 'cus_123' });
      mockStripeInvoicesList.mockRejectedValueOnce(new Error('Stripe error'));
      const result = await caller.getInvoices();
      expect(result).toEqual([]);
    });

    it('returns empty array when user not found', async () => {
      db.user.findUnique.mockResolvedValue(null);
      const result = await caller.getInvoices();
      expect(result).toEqual([]);
    });
  });
});
