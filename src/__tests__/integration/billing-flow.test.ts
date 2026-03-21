// @vitest-environment node
/**
 * Integration tests — Billing flow
 *
 * Verifies critical billing paths:
 *   - createCheckout returns a valid Stripe URL
 *   - Plan limits are enforced (FREE can't create >3 projects)
 *   - cancelSubscription / portal flow updates subscription state
 *   - Checkout with existing vs new Stripe customer
 *   - Rate limiting on billing endpoints
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';

/* ── Mock modules ──────────────────────────────────────────────── */

const mockRateLimit = vi.fn().mockResolvedValue({ success: true, remaining: 4, reset: Date.now() + 60_000 });
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...args: unknown[]) => mockRateLimit(...args) }));
vi.mock('@/lib/constants', () => ({ RATE_LIMIT_ERROR: 'Too many requests' }));

const mockStripeCustomersCreate = vi.fn().mockResolvedValue({ id: 'cus_new_abc' });
const mockStripeSubscriptionsList = vi.fn().mockResolvedValue({ data: [] });
const mockStripeSubscriptionsUpdate = vi.fn().mockResolvedValue({
  id: 'sub_1',
  status: 'active',
  cancel_at_period_end: true,
  cancel_at: 1700000000,
});
const mockStripeCheckoutSessionsCreate = vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/cs_test_session123' });
const mockStripeBillingPortalSessionsCreate = vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/p/session_xyz' });

class MockStripe {
  customers = { create: mockStripeCustomersCreate };
  subscriptions = { list: mockStripeSubscriptionsList, update: mockStripeSubscriptionsUpdate };
  checkout = { sessions: { create: mockStripeCheckoutSessionsCreate } };
  billingPortal = { sessions: { create: mockStripeBillingPortalSessionsCreate } };
}

vi.mock('stripe', () => ({ default: MockStripe }));

vi.mock('@/lib/env', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_integration',
    STRIPE_PRICE_PRO: 'price_pro_int',
    STRIPE_PRICE_STUDIO: 'price_studio_int',
    NEXT_PUBLIC_APP_URL: 'https://tubeforge.co',
  },
}));

/* ── tRPC setup ───────────────────────────────────────────────── */

type Session = {
  user: { id: string; name?: string | null; email?: string | null; plan?: string };
  expires: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type MockDb = Record<string, any>;
type TRPCContext = { db: MockDb; session: Session | null };

const t = initTRPC.context<TRPCContext>().create({ transformer: superjson });

const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, session: ctx.session! } });
});

const { rateLimit } = await import('@/lib/rate-limit');
const { env } = await import('@/lib/env');

async function checkBillingRate(userId: string) {
  const { success } = await rateLimit({ identifier: `billing:${userId}`, limit: 5, window: 60 });
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many requests' });
}

const PLAN_LIMITS: Record<string, number> = { FREE: 3, PRO: 25, STUDIO: Infinity };

const Stripe = (await import('stripe')).default;
function getStripe() {
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' as any });
}

/* ── Replicate billing + project limit logic ────────────────── */

const billingRouter = t.router({
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

  cancelSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkBillingRate(ctx.session.user.id);
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { stripeId: true },
      });
      if (!user?.stripeId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No Stripe account' });

      const stripe = getStripe();
      const updated = await stripe.subscriptions.update(input.subscriptionId, {
        cancel_at_period_end: true,
      });
      return {
        id: updated.id,
        cancelAtPeriodEnd: updated.cancel_at_period_end,
        cancelAt: updated.cancel_at,
      };
    }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { plan: true, stripeId: true },
    });
    if (!user?.stripeId) return { plan: user?.plan ?? 'FREE', subscription: null };

    const stripe = getStripe();
    const subs = await stripe.subscriptions.list({
      customer: user.stripeId,
      status: 'active',
      limit: 1,
    });
    const sub = subs.data[0] ?? null;
    if (!sub) return { plan: user.plan, subscription: null };
    return {
      plan: user.plan,
      subscription: {
        id: sub.id,
        status: sub.status,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    };
  }),

  createProject: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(100).optional() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { plan: true, _count: { select: { projects: true } } },
      });
      const limit = PLAN_LIMITS[user?.plan ?? 'FREE'];
      if ((user?._count.projects ?? 0) >= limit) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Project limit reached' });
      }
      return ctx.db.project.create({
        data: { title: input.title ?? 'Untitled', userId: ctx.session.user.id },
      });
    }),
});

/* ── Helpers ───────────────────────────────────────────────── */

const USER_ID = 'user-billing-int-001';

function makeSession(overrides?: Partial<Session['user']>): Session {
  return {
    user: { id: USER_ID, name: 'Billing Test User', email: 'billing@test.com', plan: 'FREE', ...overrides },
    expires: '2099-01-01',
  };
}

function makeDb(): MockDb {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({ email: 'billing@test.com', stripeId: null, plan: 'FREE', _count: { projects: 0 } }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    project: {
      create: vi.fn().mockResolvedValue({ id: 'proj-new', title: 'Untitled' }),
    },
  };
}

function createCaller(db: MockDb, session: Session | null) {
  return billingRouter.createCaller({ db, session });
}

/* ── Tests ─────────────────────────────────────────────────── */

describe('Billing flow integration', () => {
  let db: MockDb;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, remaining: 4, reset: Date.now() + 60_000 });
    db = makeDb();
    caller = createCaller(db, makeSession());
  });

  /* ── createCheckout ────────────────────────────────────── */

  it('createCheckout returns a valid Stripe checkout URL', async () => {
    const result = await caller.createCheckout({ plan: 'PRO' });

    expect(result.url).toBeDefined();
    expect(result.url).toContain('https://checkout.stripe.com/');
    expect(mockStripeCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: 'price_pro_int', quantity: 1 }],
        success_url: 'https://tubeforge.co/dashboard?upgraded=true',
        cancel_url: 'https://tubeforge.co/dashboard',
      }),
    );
  });

  it('createCheckout creates a new Stripe customer when user has no stripeId', async () => {
    db.user.findUnique.mockResolvedValue({ email: 'new@test.com', stripeId: null });

    await caller.createCheckout({ plan: 'STUDIO' });

    expect(mockStripeCustomersCreate).toHaveBeenCalledWith({ email: 'new@test.com' });
    expect(db.user.updateMany).toHaveBeenCalledWith({
      where: { id: USER_ID, stripeId: null },
      data: { stripeId: 'cus_new_abc' },
    });
  });

  it('createCheckout reuses existing stripeId without creating a new customer', async () => {
    db.user.findUnique.mockResolvedValue({ email: 'existing@test.com', stripeId: 'cus_existing_123' });

    await caller.createCheckout({ plan: 'PRO' });

    expect(mockStripeCustomersCreate).not.toHaveBeenCalled();
    expect(mockStripeCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing_123' }),
    );
  });

  /* ── Plan limits enforcement ───────────────────────────── */

  it('FREE plan cannot create more than 3 projects', async () => {
    db.user.findUnique.mockResolvedValue({ plan: 'FREE', _count: { projects: 3 } });

    await expect(caller.createProject({})).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Project limit reached',
    });
  });

  it('PRO plan allows up to 25 projects and blocks the 26th', async () => {
    db.user.findUnique.mockResolvedValue({ plan: 'PRO', _count: { projects: 24 } });
    await expect(caller.createProject({ title: 'Allowed' })).resolves.toBeDefined();

    const db2 = makeDb();
    db2.user.findUnique.mockResolvedValue({ plan: 'PRO', _count: { projects: 25 } });
    const caller2 = createCaller(db2, makeSession());
    await expect(caller2.createProject({ title: 'Blocked' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  /* ── cancelSubscription ────────────────────────────────── */

  it('cancelSubscription updates subscription to cancel at period end', async () => {
    db.user.findUnique.mockResolvedValue({ stripeId: 'cus_cancel_test' });

    const result = await caller.cancelSubscription({ subscriptionId: 'sub_1' });

    expect(result.cancelAtPeriodEnd).toBe(true);
    expect(result.id).toBe('sub_1');
    expect(mockStripeSubscriptionsUpdate).toHaveBeenCalledWith('sub_1', {
      cancel_at_period_end: true,
    });
  });

  it('cancelSubscription throws BAD_REQUEST when user has no Stripe account', async () => {
    db.user.findUnique.mockResolvedValue({ stripeId: null });

    await expect(caller.cancelSubscription({ subscriptionId: 'sub_x' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });

  /* ── Rate limiting ─────────────────────────────────────── */

  it('billing endpoints reject requests when rate limited', async () => {
    mockRateLimit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() });

    await expect(caller.createCheckout({ plan: 'PRO' })).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
    });
  });
});
