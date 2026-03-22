'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { trackEvent } from '@/lib/analytics-events';
import { PLAN_LIMITS } from '@/lib/constants';

/* ── Icons ─────────────────────────────────────────────────────────── */

const LightningIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M8.5 1L3 9H7.5L7 15L13 7H8.5L8.5 1Z" fill="currentColor" />
  </svg>
);

const CheckIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowLeftIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M10 3L5 8L10 13" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Types ─────────────────────────────────────────────────────────── */

type PlanId = 'FREE' | 'PRO' | 'STUDIO';

interface PlanDef {
  id: PlanId;
  name: string;
  price: number;
  priceLabel: string;
  badge?: string;
  badgeGradient?: string;
  features: string[];
  buttonLabel: string;
  buttonGradient?: string;
  highlight?: boolean;
}

interface DealDef {
  id: string;
  title: string;
  description: string;
  details?: string[];
  price: number;
  originalPrice: number;
  highlight?: boolean;
}

/* ── Data (uses t() for translatable labels) ──────────────────────── */

function getPlans(t: (key: string) => string): PlanDef[] {
  return [
    {
      id: 'FREE',
      name: t('billing.planFree'),
      price: 0,
      priceLabel: '$0',
      features: [
        `${PLAN_LIMITS.FREE.projects} ${t('billing.feat.projectsUnit')}`,
        `${PLAN_LIMITS.FREE.aiGenerations} ${t('billing.feat.aiUnit')}`,
        t('billing.feat.export720'),
        t('billing.feat.basicThumbs'),
        t('billing.feat.watermark'),
      ],
      buttonLabel: t('billing.currentPlanBtn'),
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: 12,
      priceLabel: '$12',
      badge: t('billing.popular'),
      badgeGradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
      features: [
        `${PLAN_LIMITS.PRO.projects} ${t('billing.feat.projectsUnit')}`,
        `${PLAN_LIMITS.PRO.aiGenerations} ${t('billing.feat.aiUnit')}`,
        t('billing.feat.export1080'),
        t('billing.feat.advancedThumbs'),
        t('billing.feat.seo'),
        t('billing.feat.noWatermark'),
        t('billing.feat.prioritySupport'),
      ],
      buttonLabel: t('billing.planPro'),
      buttonGradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
      highlight: true,
    },
    {
      id: 'STUDIO',
      name: 'Studio',
      price: 30,
      priceLabel: '$30',
      features: [
        t('billing.feat.allPro'),
        t('billing.feat.unlimitedAi'),
        t('billing.feat.export4k'),
        `${t('billing.feat.teamUnit')} (${PLAN_LIMITS.STUDIO.teamMembers})`,
        t('billing.feat.api'),
        t('billing.feat.whiteLabel'),
        t('billing.feat.personalManager'),
      ],
      buttonLabel: t('billing.planStudio'),
      buttonGradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    },
  ];
}

function getDeals(): DealDef[] {
  return [
    {
      id: 'lifetime-credits',
      title: 'Lifetime Credit Pack',
      description: 'Credits added to your subscription that never expire.',
      details: [
        '100 workflow credits',
        '200 AI Image credits',
        '30 voiceovers',
        '30 exports',
      ],
      price: 9,
      originalPrice: 20,
      highlight: true,
    },
    {
      id: 'consultation',
      title: '1:1 Expert Consultation',
      description: 'Personal video consultation on YouTube strategy.',
      price: 49,
      originalPrice: 99,
    },
  ];
}

/* ── Main Component ────────────────────────────────────────────────── */

export function BillingPage() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const userPlan: PlanId = (session?.user?.plan as PlanId) ?? 'FREE';

  /* ── Handle success URL param from Stripe redirect ─── */
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      toast.success(t('billing.successTitle') || 'Welcome to your new plan!');
      trackEvent('upgrade_success', { plan: userPlan });
      // Clean up URL params
      router.replace('/billing', { scroll: false });
    }
  }, [searchParams, t, userPlan, router]);

  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else if ('updated' in data && data.updated) {
        toast.success(t('billing.planUpdated') || 'Plan updated successfully!');
        router.refresh();
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const createPortal = trpc.billing.createPortal.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: (err) => toast.error(err.message),
  });

  const invoicesQuery = trpc.billing.getInvoices.useQuery(undefined, {
    enabled: userPlan !== 'FREE',
  });

  const subscriptionQuery = trpc.billing.getSubscription.useQuery();
  const subscription = subscriptionQuery.data?.subscription ?? null;
  const isCancelledAtPeriodEnd = subscription?.cancelAtPeriodEnd ?? false;

  const cancelSubscription = trpc.billing.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success(t('billing.cancelSuccess') || 'Subscription cancelled.');
      subscriptionQuery.refetch();
      router.refresh();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const reactivateSubscription = trpc.billing.reactivateSubscription.useMutation({
    onSuccess: () => {
      toast.success(t('billing.reactivateSuccess') || 'Subscription reactivated!');
      subscriptionQuery.refetch();
      router.refresh();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const PLANS = useMemo(() => getPlans(t), [t]);
  const DEALS = useMemo(() => getDeals(), []);

  const [selectedPlan, setSelectedPlan] = useState<PlanId>(userPlan);
  const [selectedDeals, setSelectedDeals] = useState<boolean[]>(() => DEALS.map(() => false));
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);

  /* ── Calculations ──────────────────────────────── */

  const selectedPlanDef = PLANS.find((p) => p.id === selectedPlan)!;
  const planPrice = selectedPlanDef.price;
  const dealsTotal = DEALS.reduce((sum, deal, i) => sum + (selectedDeals[i] ? deal.price : 0), 0);
  const totalDue = planPrice + dealsTotal;
  const noDealsSelected = selectedDeals.every((d) => !d);

  const toggleDeal = useCallback((index: number) => {
    setSelectedDeals((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }, []);

  const handleApplyPromo = useCallback(async () => {
    const code = promoCode.trim();
    if (!code) return;

    setPromoValidating(true);
    setPromoError(null);
    setPromoApplied(false);

    try {
      const res = await fetch('/api/tools/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setPromoError(data.error || 'Invalid promo code');
        return;
      }

      setPromoApplied(true);
      toast.success(data.label || 'Promo code applied!');
    } catch {
      setPromoError('Failed to validate promo code. Please try again.');
    } finally {
      setPromoValidating(false);
    }
  }, [promoCode]);

  /* ── Plan badge for current plan header ───────── */

  const planBadgeGradient =
    userPlan === 'STUDIO'
      ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
      : userPlan === 'PRO'
        ? 'linear-gradient(135deg, #6366f1, #818cf8)'
        : C.border;

  const planBadgeColor = userPlan === 'FREE' ? C.sub : '#fff';

  /* ── Helpers ───────────────────────────────────── */

  const cardBg = C.card;
  const cardBorder = C.border;
  const pageBg = C.bg;
  const textPrimary = C.text;
  const textSecondary = C.sub;
  const secondaryBtnBg = C.surface;

  return (
    <div
      style={{
        flex: 1,
        minHeight: '100dvh',
        background: pageBg,
        color: textPrimary,
        fontFamily: 'inherit',
        overflowY: 'auto',
      }}
    >
      <style>{`
        @media(max-width:768px){
          .tf-billing-inner{padding:16px 12px 32px!important}
          .tf-billing-heading{font-size:22px!important}
          .tf-billing-cols{flex-direction:column!important}
          .tf-billing-left{flex:1 1 auto!important}
          .tf-billing-right{flex:1 1 auto!important;position:static!important;width:100%!important}
          .tf-billing-plan-grid{grid-template-columns:1fr!important}
        }
        @media(max-width:480px){
          .tf-billing-inner{padding:10px 8px 24px!important}
          .tf-billing-heading{font-size:20px!important}
        }
      `}</style>
      {/* ── Inner container ───────────────────────── */}
      <div
        className="tf-billing-inner"
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '32px 32px 64px',
        }}
      >
        {/* ── Header ─────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => router.back()}
            onMouseEnter={() => setHoveredBtn('back')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              minHeight: 44,
              borderRadius: 10,
              border: 'none',
              background: hoveredBtn === 'back'
                ? C.border
                : secondaryBtnBg,
              color: textSecondary,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .2s ease',
              marginBottom: 20,
            }}
          >
            <ArrowLeftIcon color={C.sub} />
            <span>{t('billing.back')}</span>
          </button>

          <h1
            className="tf-billing-heading"
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-.02em',
              margin: 0,
              color: textPrimary,
            }}
          >
            {t('billing.title')}
          </h1>
          <p
            style={{
              fontSize: 14,
              color: textSecondary,
              margin: '8px 0 0',
              lineHeight: 1.5,
            }}
          >
            {t('billing.subtitle')}
          </p>
        </div>

        {/* ── Two-column layout ──────────────────── */}
        <div
          className="tf-billing-cols"
          style={{
            display: 'flex',
            gap: 32,
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {/* ── LEFT COLUMN ─────────────────────── */}
          <div className="tf-billing-left" style={{ flex: '1 1 640px', minWidth: 0 }}>
            {/* ── Section 1: Current Plan ────────── */}
            <div
              style={{
                padding: 24,
                borderRadius: 14,
                border: `1px solid ${cardBorder}`,
                background: cardBg,

                marginBottom: 32,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Decorative gradient strip */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: planBadgeGradient,
                  opacity: 0.8,
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: textPrimary }}>
                      {t('billing.currentPlan')}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 12px',
                        borderRadius: 50,
                        background: planBadgeGradient,
                        color: planBadgeColor,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '.02em',
                      }}
                    >
                      {userPlan === 'FREE' ? t('billing.planFree') : userPlan === 'PRO' ? t('billing.planPro') : t('billing.planStudio')}
                    </span>
                  </div>
                  {userPlan === 'FREE' ? (
                    <p style={{ fontSize: 13, color: C.sub, margin: 0, lineHeight: 1.6 }}>
                      {t('billing.freePlanDesc')}
                    </p>
                  ) : (
                    <p style={{ fontSize: 13, color: C.sub, margin: 0, lineHeight: 1.6 }}>
                      {t('billing.plan')} {userPlan === 'PRO' ? 'Pro' : 'Studio'} — {t('billing.paidPlanDesc')}
                    </p>
                  )}
                </div>

                <button
                  onMouseEnter={() => setHoveredBtn('manage')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  onClick={() => createPortal.mutate()}
                  disabled={createPortal.isPending}
                  style={{
                    padding: '10px 22px',
                    minHeight: 44,
                    borderRadius: 10,
                    border: 'none',
                    background: hoveredBtn === 'manage'
                      ? C.border
                      : secondaryBtnBg,
                    color: textPrimary,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: createPortal.isPending ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all .2s ease',
                    whiteSpace: 'nowrap',
                    opacity: createPortal.isPending ? 0.6 : 1,
                  }}
                >
                  {t('billing.manageSubscription')}
                </button>
              </div>

              {/* Cancel / Reactivate subscription notice */}
              {userPlan !== 'FREE' && subscription && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${cardBorder}` }}>
                  {isCancelledAtPeriodEnd ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 13, color: C.orange, margin: 0, fontWeight: 600, lineHeight: 1.5 }}>
                          {t('billing.cancelledNotice')}
                        </p>
                        {subscription.currentPeriodEnd && (
                          <p style={{ fontSize: 12, color: C.sub, margin: '4px 0 0', lineHeight: 1.5 }}>
                            {t('billing.expiresOn')}: {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-US')}
                          </p>
                        )}
                      </div>
                      <button
                        onMouseEnter={() => setHoveredBtn('reactivate')}
                        onMouseLeave={() => setHoveredBtn(null)}
                        onClick={() => reactivateSubscription.mutate()}
                        disabled={reactivateSubscription.isPending}
                        style={{
                          padding: '10px 22px',
                          minHeight: 44,
                          borderRadius: 10,
                          border: 'none',
                          background: C.accent,
                          color: C.text,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: reactivateSubscription.isPending ? 'wait' : 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all .2s ease',
                          whiteSpace: 'nowrap',
                          opacity: reactivateSubscription.isPending ? 0.6 : hoveredBtn === 'reactivate' ? 0.9 : 1,
                        }}
                      >
                        {t('billing.reactivateSubscription')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onMouseEnter={() => setHoveredBtn('cancel')}
                      onMouseLeave={() => setHoveredBtn(null)}
                      onClick={() => {
                        if (window.confirm(t('billing.cancelConfirm') || 'Are you sure you want to cancel?')) {
                          cancelSubscription.mutate();
                        }
                      }}
                      disabled={cancelSubscription.isPending}
                      style={{
                        padding: '8px 18px',
                        minHeight: 44,
                        borderRadius: 10,
                        border: `1px solid ${'rgba(239,68,68,0.3)'}`,
                        background: hoveredBtn === 'cancel'
                          ? 'rgba(239,68,68,0.1)'
                          : 'transparent',
                        color: '#ef4444',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: cancelSubscription.isPending ? 'wait' : 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all .2s ease',
                        whiteSpace: 'nowrap',
                        opacity: cancelSubscription.isPending ? 0.6 : 1,
                      }}
                    >
                      {t('billing.cancelSubscription')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Section: Render Priority Queue ──── */}
            <div
              style={{
                padding: 20,
                borderRadius: 14,
                border: `1px solid ${cardBorder}`,
                background: cardBg,

                marginBottom: 32,
              }}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: textPrimary,
                  margin: '0 0 16px',
                  letterSpacing: '-.01em',
                }}
              >
                {t('billing.renderQueue')}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {([
                  {
                    plan: 'FREE' as PlanId,
                    label: t('billing.planFree'),
                    queue: t('billing.standardQueue'),
                    color: C.dim,
                    bg: C.surface,
                    borderColor: cardBorder,
                  },
                  {
                    plan: 'PRO' as PlanId,
                    label: 'Pro',
                    queue: t('billing.priorityQueue'),
                    color: '#6366f1',
                    bg: 'rgba(99, 102, 241, .06)',
                    borderColor: 'rgba(99, 102, 241, .15)',
                  },
                  {
                    plan: 'STUDIO' as PlanId,
                    label: 'Studio',
                    queue: t('billing.dedicatedQueue'),
                    color: '#8b5cf6',
                    bg: 'rgba(139, 92, 246, .06)',
                    borderColor: 'rgba(139, 92, 246, .15)',
                  },
                ] as const).map((item) => (
                  <div
                    key={item.plan}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: `1px solid ${item.plan === userPlan ? item.borderColor : cardBorder}`,
                      background: item.plan === userPlan ? item.bg : 'transparent',
                      opacity: item.plan === userPlan ? 1 : 0.5,
                      transition: 'all .2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: item.color,
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: item.plan === userPlan ? item.color : C.dim, fontWeight: 500 }}>
                        {item.queue}
                      </span>
                      {item.plan === userPlan && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 50,
                          background: `${item.color}18`,
                          color: item.color,
                        }}>
                          {t('billing.currentPlanBtn')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Section 2: Plan Selection ──────── */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: textPrimary,
                    margin: 0,
                    letterSpacing: '-.01em',
                  }}
                >
                  {t('billing.choosePlan')}
                </h2>

                {/* Monthly / Annual segmented control */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0,
                  padding: '3px',
                  borderRadius: 10,
                  background: C.surface,
                }}>
                  <button
                    onClick={() => setIsAnnual(false)}
                    style={{
                      padding: '7px 18px',
                      borderRadius: 8,
                      border: 'none',
                      background: !isAnnual ? (C.border) : 'transparent',
                      color: !isAnnual ? textPrimary : textSecondary,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .2s ease',
                      boxShadow: !isAnnual ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {t('billing.monthlyLabel')}
                  </button>
                  <button
                    onClick={() => setIsAnnual(true)}
                    style={{
                      padding: '7px 18px',
                      borderRadius: 8,
                      border: 'none',
                      background: isAnnual ? (C.border) : 'transparent',
                      color: isAnnual ? textPrimary : textSecondary,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: isAnnual ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {t('billing.annualLabel')}
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: C.green,
                      background: `${C.green}15`,
                      padding: '1px 6px',
                      borderRadius: 50,
                    }}>
                      -20%
                    </span>
                  </button>
                </div>
              </div>

              <div
                className="tf-billing-plan-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
                  gap: 16,
                }}
              >
                {PLANS.map((plan) => {
                  const isCurrentPlan = plan.id === userPlan;
                  const isSelected = plan.id === selectedPlan;
                  const isHovered = hoveredCard === `plan-${plan.id}`;

                  return (
                    <div
                      key={plan.id}
                      onMouseEnter={() => setHoveredCard(`plan-${plan.id}`)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        padding: 24,
                        borderRadius: 14,
                        border: isCurrentPlan
                          ? `2px solid ${C.accent}`
                          : isSelected
                            ? `2px solid ${C.accent}`
                            : `1px solid ${cardBorder}`,
                        background: cardBg,
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all .25s cubic-bezier(.4,0,.2,1)',
                        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                        boxShadow: isHovered
                          ? '0 4px 20px rgba(0,0,0,0.3)'
                          : 'none',
                        cursor: isCurrentPlan ? 'default' : 'pointer',
                      }}
                      role={isCurrentPlan ? undefined : "button"}
                      tabIndex={isCurrentPlan ? undefined : 0}
                      onKeyDown={(e: React.KeyboardEvent) => { if (!isCurrentPlan && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setSelectedPlan(plan.id); } }}
                      onClick={() => {
                        if (!isCurrentPlan) setSelectedPlan(plan.id);
                      }}
                    >
                      {/* Popular badge */}
                      {plan.badge && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            padding: '4px 12px',
                            borderRadius: 50,
                            background: C.accent,
                            color: C.text,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {plan.badge}
                        </span>
                      )}

                      {/* Plan name */}
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 600,
                          color: textPrimary,
                          marginBottom: 8,
                        }}
                      >
                        {plan.name}
                      </div>

                      {/* Price */}
                      <div style={{ marginBottom: 20 }}>
                        <div
                          style={{
                            fontSize: 36,
                            fontWeight: 700,
                            color: C.text,
                            letterSpacing: '-.02em',
                            lineHeight: 1.1,
                          }}
                        >
                          {isAnnual && plan.price > 0
                            ? `$${Math.round(plan.price * 0.8)}`
                            : plan.priceLabel}
                          {plan.price > 0 && (
                            <span style={{ fontSize: 14, fontWeight: 400, color: textSecondary }}>
                              {t('billing.perMonth')}
                            </span>
                          )}
                        </div>
                        {isAnnual && plan.price > 0 && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
                          }}>
                            <span style={{ fontSize: 12, color: C.dim, textDecoration: 'line-through' }}>
                              {plan.priceLabel}{t('billing.perMonth')}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: C.green,
                              background: `${C.green}12`, padding: '1px 6px', borderRadius: 50,
                            }}>
                              {t('billing.annualSave').replace('{amount}', `$${Math.round(plan.price * 0.2 * 12)}`)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                        {plan.features.map((feat) => (
                          <div
                            key={feat}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: 13,
                              color: textSecondary,
                              lineHeight: 1.4,
                            }}
                          >
                            <span style={{ flexShrink: 0, display: 'flex', color: C.accent }}>
                              <CheckIcon color={C.accent} />
                            </span>
                            {feat}
                          </div>
                        ))}
                      </div>

                      {/* Button */}
                      {isCurrentPlan ? (
                        <button
                          disabled
                          style={{
                            width: '100%',
                            padding: '12px 20px',
                            minHeight: 44,
                            borderRadius: 10,
                            border: 'none',
                            background: secondaryBtnBg,
                            color: textSecondary,
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'not-allowed',
                            fontFamily: 'inherit',
                            opacity: 0.6,
                          }}
                        >
                          {t('billing.currentPlanBtn')}
                        </button>
                      ) : (
                        <button
                          onMouseEnter={() => setHoveredBtn(`plan-btn-${plan.id}`)}
                          onMouseLeave={() => setHoveredBtn(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlan(plan.id);
                            if (plan.id !== 'FREE') {
                              createCheckout.mutate({ plan: plan.id });
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 20px',
                            minHeight: 44,
                            borderRadius: 10,
                            border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                            color: C.text,
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            transition: 'all .2s ease',
                            opacity: hoveredBtn === `plan-btn-${plan.id}` ? 0.9 : 1,
                          }}
                        >
                          <LightningIcon />
                          {plan.buttonLabel}
                        </button>
                      )}

                      {/* Guarantee badge for paid plans */}
                      {plan.price > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                          marginTop: 12,
                          padding: '6px 0',
                        }}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M8 1L2 4V7.5C2 11.4 4.7 14.3 8 15C11.3 14.3 14 11.4 14 7.5V4L8 1Z" fill={C.green} opacity=".15" />
                            <path d="M8 1L2 4V7.5C2 11.4 4.7 14.3 8 15C11.3 14.3 14 11.4 14 7.5V4L8 1Z" stroke={C.green} strokeWidth="1" opacity=".6" />
                            <path d="M5.5 8L7 9.5L10.5 6" stroke={C.green} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span style={{ fontSize: 11, fontWeight: 500, color: C.green }}>
                            {t('billing.guarantee')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Section 3: Exclusive Deals ─────── */}
            <div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: textPrimary,
                  margin: '0 0 20px',
                  letterSpacing: '-.01em',
                }}
              >
                {t('billing.exclusiveDeals')}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {DEALS.map((deal, idx) => {
                  const isSelected = selectedDeals[idx];
                  const isHovered = hoveredCard === `deal-${deal.id}`;

                  return (
                    <div
                      key={deal.id}
                      onMouseEnter={() => setHoveredCard(`deal-${deal.id}`)}
                      onMouseLeave={() => setHoveredCard(null)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleDeal(idx); } }}
                      onClick={() => toggleDeal(idx)}
                      style={{
                        padding: 24,
                        borderRadius: 14,
                        border: isSelected
                          ? `2px solid ${C.accent}`
                          : `1px solid ${cardBorder}`,
                        background: cardBg,
                        cursor: 'pointer',
                        transition: 'all .2s ease',
                        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
                        boxShadow: isHovered
                          ? '0 4px 20px rgba(0,0,0,0.3)'
                          : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        {/* Checkbox */}
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: isSelected
                              ? '2px solid #6366f1'
                              : `2px solid ${C.borderActive}`,
                            background: isSelected
                              ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                              : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 2,
                            transition: 'all .2s ease',
                          }}
                        >
                          {isSelected && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: C.text,
                              marginBottom: 6,
                            }}
                          >
                            {deal.title}
                          </div>

                          {deal.details && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                              {deal.details.map((d) => (
                                <span
                                  key={d}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: 50,
                                    background: C.border,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: C.sub,
                                  }}
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                          )}

                          <p style={{ fontSize: 13, color: C.sub, margin: '0 0 12px', lineHeight: 1.5 }}>
                            {deal.description}
                          </p>

                          {/* Price */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
                              {t('billing.getFor')} ${deal.price.toLocaleString()}
                            </span>
                            <span
                              style={{
                                fontSize: 13,
                                color: C.dim,
                                textDecoration: 'line-through',
                              }}
                            >
                              ${deal.originalPrice.toLocaleString()}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 50,
                                background: 'rgba(34,197,94,0.12)',
                                color: C.green,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              -{Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Section 4: Billing History ──────── */}
            {userPlan !== 'FREE' && (
              <div style={{ marginTop: 40 }}>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: textPrimary,
                    margin: '0 0 20px',
                    letterSpacing: '-.01em',
                  }}
                >
                  {t('billing.history') || 'Billing History'}
                </h2>

                {invoicesQuery.isLoading ? (
                  <p style={{ fontSize: 13, color: C.sub }}>{t('common.loading')}</p>
                ) : invoicesQuery.isError ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '14px 18px',
                      background: `${C.accent}10`,
                      border: `1px solid ${C.accent}25`,
                      borderRadius: 12,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{'\u26A0\uFE0F'}</span>
                    <span style={{ fontSize: 13, color: C.sub, flex: 1 }}>
                      {t('billing.invoiceLoadError') || 'Failed to load billing history'}
                    </span>
                    <button
                      onClick={() => invoicesQuery.refetch()}
                      style={{
                        padding: '6px 14px',
                        background: C.accent,
                        color: C.text,
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'inherit',
                      }}
                    >
                      {t('error.tryAgain')}
                    </button>
                  </div>
                ) : !invoicesQuery.data || invoicesQuery.data.length === 0 ? (
                  <p style={{ fontSize: 13, color: C.sub }}>{t('billing.noInvoices') || 'No invoices yet.'}</p>
                ) : (
                  <div
                    style={{
                      borderRadius: 14,
                      border: `1px solid ${cardBorder}`,
                      background: cardBg,
      
                      overflow: 'hidden',
                    }}
                  >
                    {invoicesQuery.data.map((inv, idx) => (
                      <div
                        key={inv.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: '14px 20px',
                          borderBottom: idx < invoicesQuery.data.length - 1 ? `1px solid ${cardBorder}` : 'none',
                          background: idx % 2 === 1 ? C.surface : 'transparent',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          <span style={{ fontSize: 13, color: C.sub, whiteSpace: 'nowrap' }}>
                            {new Date(inv.date * 1000).toLocaleDateString('en-US')}
                          </span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 50,
                              fontSize: 11,
                              fontWeight: 600,
                              background: inv.status === 'paid'
                                ? 'rgba(34,197,94,0.12)'
                                : 'rgba(234,179,8,0.12)',
                              color: inv.status === 'paid' ? C.green : C.orange,
                            }}
                          >
                            {inv.status === 'paid' ? (t('billing.paid') || 'Paid') : inv.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                            {((inv.amount ?? 0) / 100).toFixed(2)} {inv.currency?.toUpperCase()}
                          </span>
                          {inv.pdf && (
                            <a
                              href={inv.pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: 12,
                                color: C.accent,
                                textDecoration: 'none',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              PDF
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN — Order Summary ────── */}
          <div
            className="tf-billing-right"
            style={{
              flex: '0 1 380px',
              width: '100%',
              maxWidth: 380,
              position: 'sticky',
              top: 32,
              alignSelf: 'flex-start',
              minWidth: 0,
            }}
          >
            <div
              style={{
                padding: 28,
                borderRadius: 14,
                border: `1px solid ${cardBorder}`,
                background: cardBg,
                boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: selectedPlan !== 'FREE'
                      ? C.accent
                      : secondaryBtnBg,
                    color: selectedPlan !== 'FREE' ? '#fff' : textSecondary,
                  }}
                >
                  <LightningIcon />
                </span>
                <span style={{ fontSize: 20, fontWeight: 600, color: textPrimary, letterSpacing: '-.01em' }}>
                  {t('billing.yourOrder')}
                </span>
              </div>

              {/* Selected plan info */}
              <div
                style={{
                  fontSize: 14,
                  color: C.sub,
                  marginBottom: 20,
                  paddingBottom: 20,
                  borderBottom: `1px solid ${cardBorder}`,
                }}
              >
                {t('billing.plan')}: <strong style={{ color: C.text }}>{selectedPlanDef.name}</strong>
                {selectedPlan !== 'FREE' && ` — ${t('billing.monthly')}`}
              </div>

              {/* Promo Code */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.dim,
                    textTransform: 'uppercase',
                    letterSpacing: '.12em',
                    marginBottom: 10,
                  }}
                >
                  {t('billing.promoCode')}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder={t('billing.enterCode')}
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      if (promoApplied) setPromoApplied(false);
                      if (promoError) setPromoError(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      minHeight: 44,
                      borderRadius: 10,
                      border: `1px solid ${promoApplied ? C.green : cardBorder}`,
                      background: C.surface,
                      color: textPrimary,
                      fontSize: 13,
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'border-color .2s ease',
                      boxSizing: 'border-box' as const,
                    }}
                    onFocus={(e) => {
                      if (!promoApplied) e.currentTarget.style.borderColor = C.accent;
                    }}
                    onBlur={(e) => {
                      if (!promoApplied) e.currentTarget.style.borderColor = cardBorder;
                    }}
                  />
                  <button
                    onClick={handleApplyPromo}
                    onMouseEnter={() => setHoveredBtn('promo')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    disabled={promoValidating || promoApplied}
                    style={{
                      padding: '10px 18px',
                      minHeight: 44,
                      borderRadius: 10,
                      border: 'none',
                      background: promoApplied
                        ? 'rgba(34,197,94,0.1)'
                        : secondaryBtnBg,
                      color: promoApplied ? C.green : textPrimary,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: promoValidating || promoApplied ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .2s ease',
                      whiteSpace: 'nowrap',
                      opacity: promoValidating ? 0.6 : 1,
                    }}
                  >
                    {promoValidating ? '...' : promoApplied ? t('billing.applied') : t('billing.apply')}
                  </button>
                </div>
                {promoError && (
                  <p style={{ fontSize: 12, color: C.red ?? '#ef4444', margin: '8px 0 0', lineHeight: 1.4 }}>
                    {promoError}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: cardBorder,
                  marginBottom: 20,
                }}
              />

              {/* Total section */}
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.dim,
                    textTransform: 'uppercase',
                    letterSpacing: '.12em',
                    marginBottom: 14,
                  }}
                >
                  {t('billing.total')}
                </div>

                {/* Plan price line */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: C.sub }}>{t('billing.plan')} {selectedPlanDef.name}</span>
                  <span style={{ fontWeight: 700, color: C.text }}>
                    ${planPrice.toLocaleString()}
                  </span>
                </div>

                {/* Deals price line */}
                {dealsTotal > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: C.sub }}>{t('billing.deals')}</span>
                    <span style={{ fontWeight: 700, color: C.text }}>
                      ${dealsTotal.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Warning when no deals selected */}
                {noDealsSelected && selectedPlan !== 'FREE' && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: 'rgba(234,179,8,0.08)',
                      border: `1px solid ${'rgba(234,179,8,0.2)'}`,
                      fontSize: 12,
                      color: C.orange,
                      lineHeight: 1.5,
                      marginBottom: 14,
                    }}
                  >
                    {t('billing.noDealsWarning')}
                  </div>
                )}

                {/* Divider */}
                <div
                  style={{
                    height: 1,
                    background: cardBorder,
                    margin: '14px 0',
                  }}
                />

                {/* Total Due */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 18,
                  }}
                >
                  <span style={{ fontWeight: 700, color: C.text }}>{t('billing.toPay')}</span>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 22,
                      color: C.text,
                      letterSpacing: '-.02em',
                    }}
                  >
                    ${totalDue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onMouseEnter={() => setHoveredBtn('checkout')}
                onMouseLeave={() => setHoveredBtn(null)}
                onClick={() => {
                  if (selectedPlan !== 'FREE') {
                    trackEvent('upgrade_click', { plan: selectedPlan });
                    createCheckout.mutate({ plan: selectedPlan });
                  }
                }}
                disabled={(selectedPlan === 'FREE' && dealsTotal === 0) || createCheckout.isPending}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  minHeight: 44,
                  borderRadius: 10,
                  border: 'none',
                  background:
                    selectedPlan === 'FREE' && dealsTotal === 0
                      ? secondaryBtnBg
                      : 'linear-gradient(135deg, #6366f1, #818cf8)',
                  color:
                    selectedPlan === 'FREE' && dealsTotal === 0
                      ? textSecondary
                      : '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor:
                    selectedPlan === 'FREE' && dealsTotal === 0
                      ? 'not-allowed'
                      : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all .2s ease',
                  opacity: hoveredBtn === 'checkout' && !(selectedPlan === 'FREE' && dealsTotal === 0)
                    ? 0.9 : 1,
                  letterSpacing: '-.01em',
                }}
              >
                <LightningIcon />
                <span>{createCheckout.isPending ? '...' : t('billing.checkout')}</span>
                <span style={{ fontSize: 18 }}>{'\u2192'}</span>
              </button>

              {/* Fine print */}
              <p
                style={{
                  textAlign: 'center',
                  fontSize: 11,
                  color: C.dim,
                  marginTop: 14,
                  marginBottom: 0,
                  lineHeight: 1.5,
                }}
              >
                {t('billing.termsConsent')}{' '}
                <span
                  style={{
                    color: C.accent,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: 2,
                  }}
                >
                  {t('billing.termsLink')}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
