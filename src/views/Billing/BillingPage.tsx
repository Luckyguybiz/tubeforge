'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { trackEvent } from '@/lib/analytics-events';
import { PLAN_LIMITS } from '@/lib/constants';

/* ── Icons ─────────────────────────────────────────────────────────── */

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M5 10.5L8.5 14L15 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowLeftIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M10 3L5 8L10 13" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CrownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
    <path d="M3 14L4.5 6L8 10L10 4L12 10L15.5 6L17 14H3Z" fill="currentColor" />
  </svg>
);

const RocketIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
    <path d="M10 2C10 2 6 6 6 12H14C14 6 10 2 10 2Z" fill="currentColor" />
    <rect x="7" y="12" width="6" height="3" rx="1" fill="currentColor" opacity="0.6" />
    <circle cx="10" cy="8" r="1.5" fill="currentColor" opacity="0.3" />
  </svg>
);

const ChevronDownIcon = ({ open }: { open: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    style={{
      transform: open ? 'rotate(180deg)' : 'rotate(0)',
      transition: 'transform .25s ease',
      flexShrink: 0,
    }}
  >
    <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShieldCheckIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M8 1L2 4V7.5C2 11.4 4.7 14.3 8 15C11.3 14.3 14 11.4 14 7.5V4L8 1Z" fill={color} opacity=".15" />
    <path d="M8 1L2 4V7.5C2 11.4 4.7 14.3 8 15C11.3 14.3 14 11.4 14 7.5V4L8 1Z" stroke={color} strokeWidth="1" opacity=".6" />
    <path d="M5.5 8L7 9.5L10.5 6" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
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
  features: string[];
  buttonLabel: string;
  highlight?: boolean;
  description: string;
}

interface CompareFeature {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  studio: string | boolean;
}

interface FaqItem {
  question: string;
  answer: string;
}

/* ── Data ──────────────────────────────────────────────────────────── */

function getPlans(t: (key: string) => string): PlanDef[] {
  return [
    {
      id: 'FREE',
      name: t('billing.planFree'),
      price: 0,
      priceLabel: '$0',
      description: t('billing.freePlanDesc'),
      features: [
        `${PLAN_LIMITS.FREE.projects} ${t('billing.feat.projectsUnit')}`,
        `${PLAN_LIMITS.FREE.aiGenerations} ${t('billing.feat.aiUnit')}`,
        t('billing.feat.export720'),
        t('billing.feat.basicThumbs'),
        t('billing.feat.watermark'),
      ],
      buttonLabel: t('billing.getStarted') || 'Get Started',
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: 12,
      priceLabel: '$12',
      badge: t('billing.popular'),
      description: t('billing.paidPlanDesc'),
      features: [
        `${PLAN_LIMITS.PRO.projects} ${t('billing.feat.projectsUnit')}`,
        `${PLAN_LIMITS.PRO.aiGenerations} ${t('billing.feat.aiUnit')}`,
        t('billing.feat.export1080'),
        t('billing.feat.advancedThumbs'),
        t('billing.feat.seo'),
        t('billing.feat.noWatermark'),
        t('billing.feat.prioritySupport'),
      ],
      buttonLabel: t('billing.planPro') || 'Upgrade to Pro',
      highlight: true,
    },
    {
      id: 'STUDIO',
      name: 'Studio',
      price: 30,
      priceLabel: '$30',
      description: t('billing.studioPlanDesc') || 'For teams and professionals',
      features: [
        t('billing.feat.allPro'),
        t('billing.feat.unlimitedAi'),
        t('billing.feat.export4k'),
        `${t('billing.feat.teamUnit')} (${PLAN_LIMITS.STUDIO.teamMembers})`,
        t('billing.feat.api'),
        t('billing.feat.whiteLabel'),
        t('billing.feat.personalManager'),
      ],
      buttonLabel: t('billing.contactSales') || 'Contact Sales',
    },
  ];
}

function getCompareFeatures(t: (key: string) => string): CompareFeature[] {
  return [
    { name: t('billing.feat.projectsUnit'), free: String(PLAN_LIMITS.FREE.projects), pro: String(PLAN_LIMITS.PRO.projects), studio: 'Unlimited' },
    { name: t('billing.feat.aiUnit'), free: String(PLAN_LIMITS.FREE.aiGenerations), pro: String(PLAN_LIMITS.PRO.aiGenerations), studio: 'Unlimited' },
    { name: t('billing.feat.exportQuality') || 'Export Quality', free: '720p', pro: '1080p', studio: '4K' },
    { name: t('billing.feat.storage') || 'Storage', free: '500 MB', pro: '5 GB', studio: '50 GB' },
    { name: t('billing.feat.advancedThumbs'), free: false, pro: true, studio: true },
    { name: t('billing.feat.seo'), free: false, pro: true, studio: true },
    { name: t('billing.feat.noWatermark'), free: false, pro: true, studio: true },
    { name: t('billing.feat.prioritySupport'), free: false, pro: true, studio: true },
    { name: t('billing.feat.teamUnit'), free: false, pro: false, studio: `${PLAN_LIMITS.STUDIO.teamMembers} members` },
    { name: t('billing.feat.api'), free: false, pro: false, studio: true },
    { name: t('billing.feat.whiteLabel'), free: false, pro: false, studio: true },
    { name: t('billing.feat.personalManager'), free: false, pro: false, studio: true },
  ];
}

function getFaqItems(): FaqItem[] {
  return [
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, cancel anytime from your account settings.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards via Stripe.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, the Free plan is forever free with basic features.',
    },
    {
      question: 'Can I switch plans?',
      answer: 'Yes, upgrade or downgrade anytime. Changes take effect immediately.',
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, 14-day money-back guarantee on all paid plans.',
    },
    {
      question: 'What happens when I reach my limit?',
      answer: "You'll be prompted to upgrade. Your existing work is never deleted.",
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
  const COMPARE = useMemo(() => getCompareFeatures(t), [t]);
  const FAQ_ITEMS = useMemo(() => getFaqItems(), []);

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [hoveredFaq, setHoveredFaq] = useState<number | null>(null);

  /* ── Toggle refs for sliding pill ─── */
  const toggleContainerRef = useRef<HTMLDivElement>(null);
  const monthlyBtnRef = useRef<HTMLButtonElement>(null);
  const annualBtnRef = useRef<HTMLButtonElement>(null);

  /* ── Accent colors ───────────────────────────────────── */
  const accent = '#6366f1';
  const accentLight = '#818cf8';
  const accentGlow = 'rgba(99, 102, 241, 0.25)';
  const studioColor = '#8b5cf6';

  /* ── Card backgrounds for dark look ──────────────────── */
  const pageBg = C.bg;
  const cardBg = C.card;
  const cardBorder = C.border;
  const surfaceBg = C.surface;

  return (
    <div
      style={{
        flex: 1,
        minHeight: '100dvh',
        background: pageBg,
        color: C.text,
        fontFamily: 'inherit',
        overflowY: 'auto',
      }}
    >
      <style>{`
        @keyframes tf-glow-pulse {
          0%, 100% { box-shadow: 0 0 20px ${accentGlow}, 0 0 60px rgba(99, 102, 241, 0.1); }
          50% { box-shadow: 0 0 30px ${accentGlow}, 0 0 80px rgba(99, 102, 241, 0.15); }
        }
        @keyframes tf-border-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @media(max-width:960px){
          .tf-pricing-grid{grid-template-columns:1fr!important}
          .tf-pricing-card{max-width:480px!important;margin:0 auto!important}
        }
        @media(max-width:768px){
          .tf-pricing-inner{padding:20px 16px 40px!important}
          .tf-pricing-heading{font-size:28px!important}
          .tf-pricing-subheading{font-size:15px!important}
          .tf-compare-table{font-size:12px!important}
          .tf-faq-section{padding:0 8px!important}
        }
        @media(max-width:480px){
          .tf-pricing-inner{padding:16px 10px 32px!important}
          .tf-pricing-heading{font-size:24px!important}
        }
      `}</style>

      <div
        className="tf-pricing-inner"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '40px 32px 80px',
        }}
      >
        {/* ── Back button ────────────────────────────── */}
        <button
          onClick={() => router.back()}
          onMouseEnter={() => setHoveredBtn('back')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 10,
            border: 'none',
            background: hoveredBtn === 'back' ? cardBorder : surfaceBg,
            color: C.sub,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all .2s ease',
            marginBottom: 32,
          }}
        >
          <ArrowLeftIcon color={C.sub} />
          <span>{t('billing.back')}</span>
        </button>

        {/* ── Hero header ────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1
            className="tf-pricing-heading"
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: '-.03em',
              margin: 0,
              color: C.text,
              lineHeight: 1.15,
            }}
          >
            {t('billing.title')}
          </h1>
          <p
            className="tf-pricing-subheading"
            style={{
              fontSize: 17,
              color: C.sub,
              margin: '12px auto 0',
              lineHeight: 1.6,
              maxWidth: 520,
            }}
          >
            {t('billing.subtitle')}
          </p>

          {/* ── Current plan badge ───────────────────── */}
          {userPlan !== 'FREE' && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 16,
              padding: '8px 20px',
              borderRadius: 50,
              background: surfaceBg,
              border: `1px solid ${cardBorder}`,
            }}>
              <span style={{ fontSize: 13, color: C.sub }}>
                {t('billing.currentPlan')}:
              </span>
              <span style={{
                padding: '3px 12px',
                borderRadius: 50,
                background: userPlan === 'STUDIO'
                  ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                  : 'linear-gradient(135deg, #6366f1, #818cf8)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
              }}>
                {userPlan === 'PRO' ? 'Pro' : 'Studio'}
              </span>

              <button
                onMouseEnter={() => setHoveredBtn('manage')}
                onMouseLeave={() => setHoveredBtn(null)}
                onClick={() => createPortal.mutate()}
                disabled={createPortal.isPending}
                style={{
                  padding: '4px 14px',
                  borderRadius: 50,
                  border: `1px solid ${cardBorder}`,
                  background: hoveredBtn === 'manage' ? cardBorder : 'transparent',
                  color: C.sub,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: createPortal.isPending ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all .2s ease',
                  opacity: createPortal.isPending ? 0.6 : 1,
                }}
              >
                {t('billing.manageSubscription')}
              </button>
            </div>
          )}

          {/* ── Cancel / Reactivate notice ───────────── */}
          {userPlan !== 'FREE' && subscription && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              {isCancelledAtPeriodEnd ? (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 20px',
                  borderRadius: 12,
                  background: 'rgba(234,179,8,0.08)',
                  border: '1px solid rgba(234,179,8,0.2)',
                }}>
                  <div>
                    <span style={{ fontSize: 13, color: C.orange, fontWeight: 600 }}>
                      {t('billing.cancelledNotice')}
                    </span>
                    {subscription.currentPeriodEnd && (
                      <span style={{ fontSize: 12, color: C.sub, marginLeft: 8 }}>
                        {t('billing.expiresOn')}: {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-US')}
                      </span>
                    )}
                  </div>
                  <button
                    onMouseEnter={() => setHoveredBtn('reactivate')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    onClick={() => reactivateSubscription.mutate()}
                    disabled={reactivateSubscription.isPending}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: 'none',
                      background: accent,
                      color: '#fff',
                      fontSize: 13,
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
                    borderRadius: 8,
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: hoveredBtn === 'cancel' ? 'rgba(239,68,68,0.1)' : 'transparent',
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

          {/* ── Monthly / Annual toggle with sliding pill ── */}
          <div
            ref={toggleContainerRef}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0,
              marginTop: 32,
              padding: 4,
              borderRadius: 12,
              background: surfaceBg,
              border: `1px solid ${cardBorder}`,
              position: 'relative',
            }}
          >
            {/* Sliding pill indicator */}
            <div
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                height: 'calc(100% - 8px)',
                width: 'calc(50% - 4px)',
                borderRadius: 9,
                background: cardBg,
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
                transform: isAnnual ? 'translateX(100%)' : 'translateX(0)',
                zIndex: 0,
              }}
            />
            <button
              ref={monthlyBtnRef}
              onClick={() => setIsAnnual(false)}
              style={{
                padding: '10px 24px',
                borderRadius: 9,
                border: 'none',
                background: 'transparent',
                color: !isAnnual ? C.text : C.sub,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color .25s ease',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {t('billing.monthlyLabel')}
            </button>
            <button
              ref={annualBtnRef}
              onClick={() => setIsAnnual(true)}
              style={{
                padding: '10px 24px',
                borderRadius: 9,
                border: 'none',
                background: 'transparent',
                color: isAnnual ? C.text : C.sub,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color .25s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {t('billing.annualLabel')}
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.green,
                background: `${C.green}18`,
                padding: '2px 8px',
                borderRadius: 50,
              }}>
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* ── Plan cards grid ────────────────────────── */}
        <div
          className="tf-pricing-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            marginBottom: 80,
            alignItems: 'stretch',
          }}
        >
          {PLANS.map((plan) => {
            const isCurrentPlan = plan.id === userPlan;
            const isHovered = hoveredCard === `plan-${plan.id}`;
            const isPro = plan.id === 'PRO';
            const isStudio = plan.id === 'STUDIO';

            const displayPrice = isAnnual && plan.price > 0
              ? Math.round(plan.price * 0.8)
              : plan.price;

            /* Pro card uses an outer wrapper for the animated gradient border */
            const cardContent = (
              <div
                className="tf-pricing-card"
                onMouseEnter={() => setHoveredCard(`plan-${plan.id}`)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  padding: 0,
                  borderRadius: isPro ? 18 : 20,
                  border: isPro
                    ? 'none'
                    : `1px solid ${cardBorder}`,
                  background: cardBg,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all .3s cubic-bezier(.4,0,.2,1)',
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: isPro
                    ? 'none'
                    : isHovered
                      ? '0 8px 32px rgba(0,0,0,0.25)'
                      : '0 2px 12px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  flex: 1,
                  height: isPro ? 'calc(100% - 4px)' : undefined,
                  width: isPro ? 'calc(100% - 4px)' : undefined,
                  margin: isPro ? '2px' : undefined,
                }}
              >
                {/* Popular badge */}
                {plan.badge && (
                  <div style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 14px',
                    borderRadius: 50,
                    background: `linear-gradient(135deg, ${accent}, ${accentLight})`,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '.02em',
                    boxShadow: `0 2px 12px ${accentGlow}`,
                  }}>
                    <CrownIcon />
                    {plan.badge}
                  </div>
                )}

                {/* Card content */}
                <div style={{ padding: '36px 32px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Plan name */}
                  <div style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: C.text,
                    marginBottom: 6,
                    letterSpacing: '-.01em',
                  }}>
                    {plan.name}
                  </div>

                  {/* Description */}
                  <div style={{
                    fontSize: 13,
                    color: C.sub,
                    marginBottom: 24,
                    lineHeight: 1.5,
                  }}>
                    {plan.description}
                  </div>

                  {/* Price */}
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{
                        fontSize: 48,
                        fontWeight: 800,
                        color: isPro ? accentLight : C.text,
                        letterSpacing: '-.04em',
                        lineHeight: 1,
                      }}>
                        ${displayPrice}
                      </span>
                      {plan.price > 0 && (
                        <span style={{
                          fontSize: 15,
                          fontWeight: 500,
                          color: C.sub,
                          marginLeft: 2,
                        }}>
                          {t('billing.perMonth')}
                        </span>
                      )}
                    </div>

                    {isAnnual && plan.price > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 8,
                      }}>
                        <span style={{
                          fontSize: 13,
                          color: C.dim,
                          textDecoration: 'line-through',
                        }}>
                          {plan.priceLabel}{t('billing.perMonth')}
                        </span>
                        {/* Save 20% pill badge */}
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#fff',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          padding: '3px 10px',
                          borderRadius: 50,
                          boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
                          letterSpacing: '.02em',
                        }}>
                          Save 20%
                        </span>
                      </div>
                    )}

                    {plan.price === 0 && (
                      <div style={{
                        fontSize: 13,
                        color: C.sub,
                        marginTop: 6,
                      }}>
                        {t('billing.freeForever') || 'Free forever'}
                      </div>
                    )}
                  </div>

                  {/* Features list */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    marginBottom: 32,
                    flex: 1,
                  }}>
                    {plan.features.map((feat) => (
                      <div
                        key={feat}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          fontSize: 14,
                          color: C.sub,
                          lineHeight: 1.4,
                        }}
                      >
                        <span style={{
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: isPro
                            ? `${accent}18`
                            : isStudio
                              ? `${studioColor}18`
                              : `${C.sub}15`,
                          color: isPro
                            ? accentLight
                            : isStudio
                              ? studioColor
                              : C.sub,
                          marginTop: -1,
                        }}>
                          <CheckIcon />
                        </span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  {isCurrentPlan ? (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '16px 24px',
                        borderRadius: 12,
                        border: `1px solid ${cardBorder}`,
                        background: surfaceBg,
                        color: C.sub,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: 'not-allowed',
                        fontFamily: 'inherit',
                        opacity: 0.7,
                        letterSpacing: '-.01em',
                      }}
                    >
                      {t('billing.currentPlanBtn')}
                    </button>
                  ) : (
                    <button
                      onMouseEnter={() => setHoveredBtn(`plan-btn-${plan.id}`)}
                      onMouseLeave={() => setHoveredBtn(null)}
                      onClick={() => {
                        if (plan.id === 'STUDIO') {
                          window.location.href = 'mailto:support@tubeforge.co?subject=Studio%20Plan%20Inquiry';
                        } else if (plan.id !== 'FREE') {
                          trackEvent('upgrade_click', { plan: plan.id });
                          createCheckout.mutate({ plan: plan.id });
                        }
                      }}
                      disabled={createCheckout.isPending && plan.id !== 'FREE'}
                      style={{
                        width: '100%',
                        padding: '16px 24px',
                        borderRadius: 12,
                        border: isPro
                          ? 'none'
                          : isStudio
                            ? `1px solid ${studioColor}50`
                            : `1px solid ${cardBorder}`,
                        background: isPro
                          ? `linear-gradient(135deg, ${accent}, ${accentLight})`
                          : isStudio
                            ? 'transparent'
                            : 'transparent',
                        color: isPro
                          ? '#fff'
                          : isStudio
                            ? studioColor
                            : C.text,
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: createCheckout.isPending ? 'wait' : 'pointer',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        transition: 'all .25s ease',
                        letterSpacing: '-.01em',
                        opacity: hoveredBtn === `plan-btn-${plan.id}` ? 0.9 : 1,
                        transform: hoveredBtn === `plan-btn-${plan.id}` ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: isPro && hoveredBtn === `plan-btn-${plan.id}`
                          ? `0 4px 20px ${accentGlow}`
                          : 'none',
                      }}
                    >
                      {isPro && <RocketIcon />}
                      {createCheckout.isPending && plan.id !== 'FREE' ? '...' : plan.buttonLabel}
                    </button>
                  )}

                  {/* Money-back guarantee badge below CTA */}
                  {plan.price > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      marginTop: 16,
                    }}>
                      <ShieldCheckIcon color={C.green} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: C.green }}>
                        {t('billing.guarantee')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );

            /* Pro card: wrap in animated gradient border container */
            if (isPro) {
              return (
                <div
                  key={plan.id}
                  style={{
                    borderRadius: 20,
                    padding: 2,
                    background: `linear-gradient(135deg, ${accent}, ${accentLight}, #a78bfa, ${accent})`,
                    backgroundSize: '200% 200%',
                    animation: 'tf-border-shimmer 3s ease-in-out infinite',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: `0 0 20px ${accentGlow}, 0 0 60px rgba(99, 102, 241, 0.1)`,
                    transition: 'box-shadow .3s ease',
                  }}
                >
                  {cardContent}
                </div>
              );
            }

            return (
              <div key={plan.id} style={{ display: 'flex', flexDirection: 'column' }}>
                {cardContent}
              </div>
            );
          })}
        </div>

        {/* ── Compare all features table ─────────────── */}
        <div style={{ marginBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 800,
              color: C.text,
              margin: 0,
              letterSpacing: '-.02em',
            }}>
              {t('billing.compareFeatures') || 'Compare all features'}
            </h2>
            <p style={{
              fontSize: 15,
              color: C.sub,
              margin: '8px 0 0',
              lineHeight: 1.5,
            }}>
              {t('billing.compareDesc') || 'Find the perfect plan for your needs'}
            </p>
          </div>

          <div
            className="tf-compare-table"
            style={{
              borderRadius: 16,
              border: `1px solid ${cardBorder}`,
              background: cardBg,
              overflow: 'hidden',
            }}
          >
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.8fr 1fr 1fr 1fr',
              padding: '20px 28px',
              borderBottom: `1px solid ${cardBorder}`,
              background: surfaceBg,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                {t('billing.feature') || 'Feature'}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.sub, textAlign: 'center' }}>
                {t('billing.planFree')}
              </div>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: accentLight,
                textAlign: 'center',
              }}>
                Pro
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: studioColor, textAlign: 'center' }}>
                Studio
              </div>
            </div>

            {/* Table rows with hover highlight + alternating backgrounds */}
            {COMPARE.map((row, idx) => (
              <div
                key={row.name}
                onMouseEnter={() => setHoveredRow(idx)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.8fr 1fr 1fr 1fr',
                  padding: '16px 28px',
                  borderBottom: idx < COMPARE.length - 1 ? `1px solid ${cardBorder}` : 'none',
                  background: hoveredRow === idx
                    ? `${accent}10`
                    : idx % 2 === 1
                      ? `${surfaceBg}80`
                      : 'transparent',
                  transition: 'background .15s ease',
                  cursor: 'default',
                }}
              >
                <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>
                  {row.name}
                </div>
                {([row.free, row.pro, row.studio] as (string | boolean)[]).map((val, ci) => (
                  <div
                    key={ci}
                    style={{
                      fontSize: 14,
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: typeof val === 'boolean'
                        ? val
                          ? ci === 1 ? accentLight : studioColor
                          : C.dim
                        : ci === 1 ? accentLight : ci === 2 ? studioColor : C.sub,
                      fontWeight: typeof val === 'string' ? 600 : 400,
                    }}
                  >
                    {typeof val === 'boolean' ? (
                      val ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M5 10.5L8.5 14L15 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span style={{ fontSize: 16, opacity: 0.4 }}>{'\u2014'}</span>
                      )
                    ) : (
                      val
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ Section ─────────────────────────────── */}
        <div className="tf-faq-section" style={{ marginBottom: 80, maxWidth: 720, margin: '0 auto 80px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 800,
              color: C.text,
              margin: 0,
              letterSpacing: '-.02em',
            }}>
              Frequently Asked Questions
            </h2>
            <p style={{
              fontSize: 15,
              color: C.sub,
              margin: '8px 0 0',
              lineHeight: 1.5,
            }}>
              Everything you need to know about our plans
            </p>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              const isFaqHovered = hoveredFaq === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredFaq(idx)}
                  onMouseLeave={() => setHoveredFaq(null)}
                  style={{
                    borderRadius: 14,
                    border: `1px solid ${isOpen ? accent + '40' : cardBorder}`,
                    background: isFaqHovered ? `${surfaceBg}` : cardBg,
                    overflow: 'hidden',
                    transition: 'all .2s ease',
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      padding: '18px 24px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: isOpen ? accentLight : C.text,
                      transition: 'color .2s ease',
                    }}>
                      {faq.question}
                    </span>
                    <ChevronDownIcon open={isOpen} />
                  </button>

                  {/* Expandable answer */}
                  <div
                    style={{
                      maxHeight: isOpen ? 200 : 0,
                      overflow: 'hidden',
                      transition: 'max-height .3s cubic-bezier(.4,0,.2,1), padding .3s ease',
                      padding: isOpen ? '0 24px 18px' : '0 24px 0',
                    }}
                  >
                    <p style={{
                      fontSize: 14,
                      color: C.sub,
                      lineHeight: 1.6,
                      margin: 0,
                    }}>
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Billing History ────────────────────────── */}
        {userPlan !== 'FREE' && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 700,
                color: C.text,
                margin: 0,
                letterSpacing: '-.02em',
              }}>
                {t('billing.history') || 'Billing History'}
              </h2>
            </div>

            {invoicesQuery.isLoading ? (
              <p style={{ fontSize: 14, color: C.sub, textAlign: 'center' }}>{t('common.loading')}</p>
            ) : invoicesQuery.isError ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '16px 24px',
                  background: `${accent}10`,
                  border: `1px solid ${accent}25`,
                  borderRadius: 12,
                  maxWidth: 500,
                  margin: '0 auto',
                }}
              >
                <span style={{ fontSize: 14, color: C.sub, flex: 1 }}>
                  {t('billing.invoiceLoadError') || 'Failed to load billing history'}
                </span>
                <button
                  onClick={() => invoicesQuery.refetch()}
                  style={{
                    padding: '8px 16px',
                    background: accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                  }}
                >
                  {t('error.tryAgain')}
                </button>
              </div>
            ) : !invoicesQuery.data || invoicesQuery.data.length === 0 ? (
              <p style={{ fontSize: 14, color: C.sub, textAlign: 'center' }}>{t('billing.noInvoices') || 'No invoices yet.'}</p>
            ) : (
              <div
                style={{
                  borderRadius: 16,
                  border: `1px solid ${cardBorder}`,
                  background: cardBg,
                  overflow: 'hidden',
                  maxWidth: 700,
                  margin: '0 auto',
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
                      padding: '16px 24px',
                      borderBottom: idx < invoicesQuery.data.length - 1 ? `1px solid ${cardBorder}` : 'none',
                      background: idx % 2 === 1 ? surfaceBg : 'transparent',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <span style={{ fontSize: 13, color: C.sub, whiteSpace: 'nowrap' }}>
                        {new Date(inv.date * 1000).toLocaleDateString('en-US')}
                      </span>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 50,
                          fontSize: 11,
                          fontWeight: 700,
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
                            color: accentLight,
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

        {/* ── Fine print ─────────────────────────────── */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <p style={{
            fontSize: 12,
            color: C.dim,
            lineHeight: 1.6,
            maxWidth: 500,
            margin: '0 auto',
          }}>
            {t('billing.termsConsent')}{' '}
            <span
              style={{
                color: accentLight,
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
  );
}
