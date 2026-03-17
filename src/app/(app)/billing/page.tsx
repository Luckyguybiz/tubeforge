'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useThemeStore } from '@/stores/useThemeStore';

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

/* ── Data ──────────────────────────────────────────────────────────── */

const PLANS: PlanDef[] = [
  {
    id: 'FREE',
    name: 'Бесплатный',
    price: 0,
    priceLabel: '0\u20BD/мес',
    features: [
      '3 проекта',
      '5 ИИ-генераций/день',
      '720p экспорт',
      'Базовые обложки',
      'Водяной знак',
    ],
    buttonLabel: 'Текущий план',
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 990,
    priceLabel: '990\u20BD/мес',
    badge: 'Популярный',
    badgeGradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
    features: [
      'Безлимит проектов',
      '50 ИИ-генераций/день',
      '1080p экспорт',
      'Продвинутые обложки',
      'SEO-оптимизатор',
      'Без водяного знака',
      'Приоритетная поддержка',
    ],
    buttonLabel: 'Выбрать Pro',
    buttonGradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
    highlight: true,
  },
  {
    id: 'STUDIO',
    name: 'Studio',
    price: 2490,
    priceLabel: '2490\u20BD/мес',
    features: [
      'Всё из Pro',
      'Безлимит ИИ-генераций',
      '4K экспорт',
      'Командный доступ (5 чел.)',
      'API доступ',
      'Белый лейбл',
      'Персональный менеджер',
    ],
    buttonLabel: 'Выбрать Studio',
    buttonGradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  },
];

const DEALS: DealDef[] = [
  {
    id: 'lifetime-credits',
    title: 'Пожизненный Кредит-Пак',
    description: 'Эти кредиты добавляются к вашей подписке и никогда не истекают.',
    details: [
      '100 workflow кредитов',
      '200 AI Image кредитов',
      '30 озвучек',
      '30 экспортов',
    ],
    price: 890,
    originalPrice: 1990,
    highlight: true,
  },
  {
    id: 'consultation',
    title: '1:1 Консультация с экспертом',
    description: 'Персональная видеоконсультация по YouTube-стратегии.',
    price: 4900,
    originalPrice: 9900,
  },
];

/* ── Main Component ────────────────────────────────────────────────── */

export default function BillingPage() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const router = useRouter();
  const { data: session } = useSession();

  const userPlan: PlanId = (session?.user?.plan as PlanId) ?? 'FREE';

  const [selectedPlan, setSelectedPlan] = useState<PlanId>(userPlan);
  const [selectedDeals, setSelectedDeals] = useState<boolean[]>(DEALS.map(() => false));
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
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

  const handleApplyPromo = useCallback(() => {
    if (promoCode.trim()) {
      setPromoApplied(true);
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
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        fontFamily: 'inherit',
        overflowY: 'auto',
      }}
    >
      {/* ── Inner container ───────────────────────── */}
      <div
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
            <span>Назад</span>
          </button>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-.03em',
              margin: 0,
              color: C.text,
            }}
          >
            Тарифы и оплата
          </h1>
          <p
            style={{
              fontSize: 14,
              color: C.sub,
              margin: '8px 0 0',
              lineHeight: 1.5,
            }}
          >
            Управляйте подпиской, выбирайте тариф и получайте эксклюзивные предложения
          </p>
        </div>

        {/* ── Two-column layout ──────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 32,
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {/* ── LEFT COLUMN ─────────────────────── */}
          <div style={{ flex: '1 1 640px', minWidth: 0 }}>
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
                      Текущий план
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
                      {userPlan === 'FREE' ? 'Бесплатный' : userPlan === 'PRO' ? 'Pro' : 'Studio'}
                    </span>
                  </div>
                  {userPlan === 'FREE' ? (
                    <p style={{ fontSize: 13, color: C.sub, margin: 0, lineHeight: 1.6 }}>
                      Вы на бесплатном плане. Ограничения: 3 проекта, 5 ИИ-генераций/день, 720p экспорт.
                    </p>
                  ) : (
                    <p style={{ fontSize: 13, color: C.sub, margin: 0, lineHeight: 1.6 }}>
                      Тариф {userPlan === 'PRO' ? 'Pro' : 'Studio'} — Ежемесячная подписка.
                      Следующее продление: 17 апреля 2026.
                    </p>
                  )}
                </div>

                <button
                  onMouseEnter={() => setHoveredBtn('manage')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 50,
                    border: `1.5px solid ${cardBorder}`,
                    background: hoveredBtn === 'manage'
                      ? isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'
                      : 'transparent',
                    color: C.text,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all .2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Управить подпиской
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
                Выберите тариф
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
                          Текущий план
                        </button>
                      ) : (
                        <button
                          onMouseEnter={() => setHoveredBtn(`plan-btn-${plan.id}`)}
                          onMouseLeave={() => setHoveredBtn(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlan(plan.id);
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
                Эксклюзивные предложения
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
                        <div style={{ flex: 1, minWidth: 0 }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
                              Получить за {deal.price.toLocaleString()}{'\u20BD'}
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
          </div>

          {/* ── RIGHT COLUMN — Order Summary ────── */}
          <div
            style={{
              flex: '0 0 380px',
              position: 'sticky',
              top: 32,
              alignSelf: 'flex-start',
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
                  Ваш заказ
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
                Тариф: <strong style={{ color: C.text }}>{selectedPlanDef.name}</strong>
                {selectedPlan !== 'FREE' && ' — Ежемесячно'}
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
                  Промокод
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Введите код"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      if (promoApplied) setPromoApplied(false);
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
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .2s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {promoApplied ? 'Применён' : 'Применить'}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: cardBorder,
                  marginBottom: 20,
                }}
              />

              {/* ИТОГО section */}
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
                  Итого
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
                  <span style={{ color: C.sub }}>Тариф {selectedPlanDef.name}</span>
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
                    <span style={{ color: C.sub }}>Предложения</span>
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
                    Не выбрано ни одно предложение! Вы упускаете экономию более 3000{'\u20BD'}!
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
                  <span style={{ fontWeight: 700, color: C.text }}>К оплате</span>
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
                disabled={selectedPlan === 'FREE' && dealsTotal === 0}
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
                <span>Оформить подписку</span>
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
                Продолжая, вы соглашаетесь с{' '}
                <span
                  style={{
                    color: C.accent,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: 2,
                  }}
                >
                  Условиями использования
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
