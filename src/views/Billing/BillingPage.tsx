'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

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
      priceLabel: '0\u20BD',
      features: [
        t('billing.feat.projects3'),
        t('billing.feat.ai5'),
        t('billing.feat.export720'),
        t('billing.feat.basicThumbs'),
        t('billing.feat.watermark'),
      ],
      buttonLabel: t('billing.currentPlanBtn'),
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: 990,
      priceLabel: '990\u20BD',
      badge: t('billing.popular'),
      badgeGradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
      features: [
        t('billing.feat.unlimitedProjects'),
        t('billing.feat.ai50'),
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
      price: 2490,
      priceLabel: '2490\u20BD',
      features: [
        t('billing.feat.allPro'),
        t('billing.feat.unlimitedAi'),
        t('billing.feat.export4k'),
        t('billing.feat.team5'),
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
      price: 890,
      originalPrice: 1990,
      highlight: true,
    },
    {
      id: 'consultation',
      title: '1:1 Expert Consultation',
      description: 'Personal video consultation on YouTube strategy.',
      price: 4900,
      originalPrice: 9900,
    },
  ];
}

/* ── Main Component ────────────────────────────────────────────────── */

export function BillingPage() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const t = useLocaleStore((s) => s.t);
  const router = useRouter();
  const { data: session } = useSession();

  const userPlan: PlanId = (session?.user?.plan as PlanId) ?? 'FREE';

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
        : isDark
          ? 'rgba(255,255,255,.08)'
          : 'rgba(0,0,0,.06)';

  const planBadgeColor = userPlan === 'FREE' ? C.sub : '#fff';

  /* ── Helpers ───────────────────────────────────── */

  const cardBg = isDark ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.7)';
  const cardBorder = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.08)';

  return (
    <div
      style={{
        flex: 1,
        minHeight: '100dvh',
        background: C.bg,
        color: C.text,
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
              borderRadius: 50,
              border: `1.5px solid ${cardBorder}`,
              background: hoveredBtn === 'back'
                ? isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'
                : 'transparent',
              color: C.sub,
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
              fontWeight: 800,
              letterSpacing: '-.03em',
              margin: 0,
              color: C.text,
            }}
          >
            {t('billing.title')}
          </h1>
          <p
            style={{
              fontSize: 14,
              color: C.sub,
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
                borderRadius: 16,
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
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
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
                    borderRadius: 50,
                    border: `1.5px solid ${cardBorder}`,
                    background: hoveredBtn === 'manage'
                      ? isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'
                      : 'transparent',
                    color: C.text,
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
            </div>

            {/* ── Section 2: Plan Selection ──────── */}
            <div style={{ marginBottom: 40 }}>
              <h2
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.dim,
                  textTransform: 'uppercase',
                  letterSpacing: '.12em',
                  margin: '0 0 20px',
                }}
              >
                {t('billing.choosePlan')}
              </h2>

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
                        borderRadius: 16,
                        border: plan.highlight
                          ? '1.5px solid rgba(99, 102, 241, .4)'
                          : isSelected
                            ? `1.5px solid ${C.accent}`
                            : `1px solid ${cardBorder}`,
                        background: cardBg,
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all .25s cubic-bezier(.4,0,.2,1)',
                        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                        boxShadow: plan.highlight
                          ? isHovered
                            ? '0 12px 40px rgba(99, 102, 241, .18), 0 0 0 1px rgba(99, 102, 241, .1)'
                            : '0 8px 30px rgba(99, 102, 241, .12)'
                          : isHovered
                            ? isDark
                              ? '0 8px 30px rgba(0,0,0,.3)'
                              : '0 8px 30px rgba(0,0,0,.08)'
                            : 'none',
                        cursor: isCurrentPlan ? 'default' : 'pointer',
                      }}
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
                            padding: '3px 10px',
                            borderRadius: 50,
                            background: plan.badgeGradient,
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '.03em',
                          }}
                        >
                          {plan.badge}
                        </span>
                      )}

                      {/* Plan name */}
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: C.text,
                          marginBottom: 8,
                        }}
                      >
                        {plan.name}
                      </div>

                      {/* Price */}
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 800,
                          color: C.text,
                          letterSpacing: '-.03em',
                          marginBottom: 20,
                          lineHeight: 1.1,
                        }}
                      >
                        {plan.priceLabel}
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
                              color: C.sub,
                              lineHeight: 1.4,
                            }}
                          >
                            <span style={{ flexShrink: 0, display: 'flex', color: C.green }}>
                              <CheckIcon color={C.green} />
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
                            borderRadius: 50,
                            border: `1.5px solid ${cardBorder}`,
                            background: 'transparent',
                            color: C.dim,
                            fontSize: 13,
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
                            borderRadius: 50,
                            border: 'none',
                            background: plan.buttonGradient ?? `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            transition: 'all .25s cubic-bezier(.4,0,.2,1)',
                            transform: hoveredBtn === `plan-btn-${plan.id}` ? 'translateY(-1px)' : 'translateY(0)',
                            boxShadow: hoveredBtn === `plan-btn-${plan.id}`
                              ? '0 6px 20px rgba(99, 102, 241, .35)'
                              : '0 2px 10px rgba(99, 102, 241, .2)',
                          }}
                        >
                          <LightningIcon />
                          {plan.buttonLabel}
                        </button>
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
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.dim,
                  textTransform: 'uppercase',
                  letterSpacing: '.12em',
                  margin: '0 0 20px',
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
                      onClick={() => toggleDeal(idx)}
                      style={{
                        padding: 24,
                        borderRadius: 16,
                        border: deal.highlight
                          ? '1.5px solid rgba(99, 102, 241, .35)'
                          : isSelected
                            ? `1.5px solid ${C.green}`
                            : `1px solid ${cardBorder}`,
                        background: isSelected
                          ? isDark ? 'rgba(99, 102, 241, .06)' : 'rgba(99, 102, 241, .04)'
                          : cardBg,
                        cursor: 'pointer',
                        transition: 'all .25s cubic-bezier(.4,0,.2,1)',
                        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                        boxShadow: deal.highlight
                          ? isHovered
                            ? '0 8px 30px rgba(99, 102, 241, .15)'
                            : '0 4px 20px rgba(99, 102, 241, .08)'
                          : isHovered
                            ? isDark
                              ? '0 8px 30px rgba(0,0,0,.2)'
                              : '0 8px 30px rgba(0,0,0,.06)'
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
                              : `2px solid ${isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)'}`,
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
                                    background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)',
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
                              {t('billing.getFor')} {deal.price.toLocaleString()}{'\u20BD'}
                            </span>
                            <span
                              style={{
                                fontSize: 13,
                                color: C.dim,
                                textDecoration: 'line-through',
                              }}
                            >
                              {deal.originalPrice.toLocaleString()}{'\u20BD'}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 50,
                                background: isDark ? 'rgba(34, 197, 94, .12)' : 'rgba(34, 197, 94, .1)',
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
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.dim,
                    textTransform: 'uppercase',
                    letterSpacing: '.12em',
                    margin: '0 0 20px',
                  }}
                >
                  {t('billing.history') || 'Billing History'}
                </h2>

                {invoicesQuery.isLoading ? (
                  <p style={{ fontSize: 13, color: C.sub }}>{t('common.loading')}</p>
                ) : !invoicesQuery.data || invoicesQuery.data.length === 0 ? (
                  <p style={{ fontSize: 13, color: C.sub }}>{t('billing.noInvoices') || 'No invoices yet.'}</p>
                ) : (
                  <div
                    style={{
                      borderRadius: 16,
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
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          <span style={{ fontSize: 13, color: C.sub, whiteSpace: 'nowrap' }}>
                            {new Date(inv.date * 1000).toLocaleDateString('ru-RU')}
                          </span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 50,
                              fontSize: 11,
                              fontWeight: 600,
                              background: inv.status === 'paid'
                                ? isDark ? 'rgba(34,197,94,.12)' : 'rgba(34,197,94,.1)'
                                : isDark ? 'rgba(234,179,8,.12)' : 'rgba(234,179,8,.1)',
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
                borderRadius: 20,
                border: `1px solid ${cardBorder}`,
                background: isDark
                  ? 'linear-gradient(180deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.02) 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,.9) 0%, rgba(255,255,255,.7) 100%)',
                boxShadow: isDark
                  ? '0 8px 40px rgba(0,0,0,.4)'
                  : '0 8px 40px rgba(0,0,0,.06)',
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
                      ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                      : isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)',
                    color: selectedPlan !== 'FREE' ? '#fff' : C.dim,
                  }}
                >
                  <LightningIcon />
                </span>
                <span style={{ fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: '-.02em' }}>
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
                      borderRadius: 10,
                      border: `1.5px solid ${promoApplied ? C.green : cardBorder}`,
                      background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)',
                      color: C.text,
                      fontSize: 13,
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'border-color .2s ease',
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
                      borderRadius: 10,
                      border: `1.5px solid ${promoApplied ? C.green : cardBorder}`,
                      background: promoApplied
                        ? isDark ? 'rgba(34, 197, 94, .1)' : 'rgba(34, 197, 94, .08)'
                        : hoveredBtn === 'promo'
                          ? isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'
                          : 'transparent',
                      color: promoApplied ? C.green : C.text,
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
                    {planPrice.toLocaleString()}{'\u20BD'}
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
                      {dealsTotal.toLocaleString()}{'\u20BD'}
                    </span>
                  </div>
                )}

                {/* Warning when no deals selected */}
                {noDealsSelected && selectedPlan !== 'FREE' && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: isDark ? 'rgba(234, 179, 8, .08)' : 'rgba(234, 179, 8, .06)',
                      border: `1px solid ${isDark ? 'rgba(234, 179, 8, .2)' : 'rgba(234, 179, 8, .15)'}`,
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
                    {totalDue.toLocaleString()}{'\u20BD'}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onMouseEnter={() => setHoveredBtn('checkout')}
                onMouseLeave={() => setHoveredBtn(null)}
                onClick={() => {
                  if (selectedPlan !== 'FREE') {
                    createCheckout.mutate({ plan: selectedPlan });
                  }
                }}
                disabled={(selectedPlan === 'FREE' && dealsTotal === 0) || createCheckout.isPending}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: 50,
                  border: 'none',
                  background:
                    selectedPlan === 'FREE' && dealsTotal === 0
                      ? isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'
                      : 'linear-gradient(135deg, #6366f1, #818cf8)',
                  color:
                    selectedPlan === 'FREE' && dealsTotal === 0
                      ? C.dim
                      : '#fff',
                  fontSize: 15,
                  fontWeight: 800,
                  cursor:
                    selectedPlan === 'FREE' && dealsTotal === 0
                      ? 'not-allowed'
                      : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all .25s cubic-bezier(.4,0,.2,1)',
                  transform: hoveredBtn === 'checkout' && !(selectedPlan === 'FREE' && dealsTotal === 0)
                    ? 'translateY(-2px)'
                    : 'translateY(0)',
                  boxShadow:
                    selectedPlan === 'FREE' && dealsTotal === 0
                      ? 'none'
                      : hoveredBtn === 'checkout'
                        ? '0 8px 30px rgba(99, 102, 241, .4)'
                        : '0 4px 20px rgba(99, 102, 241, .25)',
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
