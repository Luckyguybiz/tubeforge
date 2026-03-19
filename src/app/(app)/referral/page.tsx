'use client';

import { useState, useCallback, useEffect } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

/* ── SVG Icons ─────────────────────────────────────────────────────── */

function CopyIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="5" y="5" width="9" height="9" rx="1.5" stroke={color} strokeWidth="1.4" />
      <path d="M3 11V3C3 2.45 3.45 2 4 2H11" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function TelegramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21.2 3.1L2.8 10.4C1.7 10.9 1.7 11.6 2.6 11.9L7.3 13.4L18.1 6.7C18.6 6.4 19.1 6.5 18.7 6.8L9.7 15.1H9.7L9.7 15.1L9.4 19.9C9.8 19.9 10 19.7 10.3 19.5L12.6 17.3L17.3 20.8C18.1 21.2 18.6 21 18.8 20.1L21.9 4.5C22.2 3.4 21.6 2.9 21.2 3.1Z" fill="currentColor" />
    </svg>
  );
}

function TwitterIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor" />
    </svg>
  );
}

function CheckCircleIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.3" />
      <path d="M5.5 8L7.5 10L10.5 6" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GiftIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="8" width="16" height="10" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M10 8V18" stroke={color} strokeWidth="1.5" />
      <path d="M2 11H18" stroke={color} strokeWidth="1.5" />
      <path d="M10 8C10 8 10 4 7 4C5.5 4 4 5 5 6.5C6 8 10 8 10 8Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 8C10 8 10 4 13 4C14.5 4 16 5 15 6.5C14 8 10 8 10 8Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Main Component ────────────────────────────────────────────────── */

export default function ReferralPage() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const t = useLocaleStore((s) => s.t);

  const [copied, setCopied] = useState(false);
  const [activating, setActivating] = useState(false);

  const myReferral = trpc.referral.getMyReferral.useQuery();
  const stats = trpc.referral.getStats.useQuery(undefined, {
    enabled: !!myReferral.data?.code,
  });
  const activateMutation = trpc.referral.activate.useMutation({
    onSuccess: () => {
      myReferral.refetch();
      stats.refetch();
      toast.success('Партнёрская программа активирована!');
    },
    onError: () => {
      toast.error('Не удалось активировать. Попробуйте снова.');
    },
  });

  const referralCode = myReferral.data?.code ?? null;
  const referralLink = referralCode ? `https://tubeforge.co?ref=${referralCode}` : '';
  const invited = stats.data?.invited ?? 0;
  const paid = stats.data?.paid ?? 0;
  const earnings = stats.data?.earnings ?? 0;

  const handleActivate = useCallback(async () => {
    setActivating(true);
    try {
      await activateMutation.mutateAsync();
    } finally {
      setActivating(false);
    }
  }, [activateMutation]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = referralLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralLink]);

  const handleShareTelegram = useCallback(() => {
    const text = encodeURIComponent(
      `Присоединяйся к TubeForge — лучшей платформе для создания видео с ИИ! Регистрируйся по моей ссылке: ${referralLink}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  }, [referralLink]);

  const handleShareTwitter = useCallback(() => {
    const text = encodeURIComponent(
      `Check out TubeForge — the best AI video creation platform! Sign up with my link: ${referralLink}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  }, [referralLink]);

  /* ── Save ref code from URL to localStorage on landing page ──── */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
        localStorage.setItem('tf-ref', refCode);
      }
    }
  }, []);

  const isLoading = myReferral.isLoading;

  /* ── Styles ──────────────────────────────────────────────────── */
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '100%',
    fontFamily: 'inherit',
  };

  const leftPanelStyle: React.CSSProperties = {
    width: '42%',
    minWidth: 360,
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #a855f7 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '60px 48px',
    position: 'relative',
    overflow: 'hidden',
  };

  const rightPanelStyle: React.CSSProperties = {
    flex: 1,
    background: C.bg,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px 48px',
    overflowY: 'auto',
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 480,
  };

  const inputRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    height: 44,
    padding: '0 14px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontSize: 13,
    fontFamily: 'inherit',
    fontWeight: 500,
    outline: 'none',
    letterSpacing: '0.02em',
  };

  const primaryBtnStyle: React.CSSProperties = {
    height: 44,
    padding: '0 24px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all .2s ease',
    boxShadow: '0 4px 14px rgba(99,102,241,.3)',
    whiteSpace: 'nowrap',
  };

  const statCardStyle: React.CSSProperties = {
    flex: 1,
    padding: '18px 16px',
    borderRadius: 12,
    background: C.surface,
    border: `1px solid ${C.border}`,
    textAlign: 'center',
  };

  const shareButtonStyle: React.CSSProperties = {
    height: 40,
    padding: '0 16px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all .2s ease',
  };

  /* ── Benefits list ──────────────────────────────────────────── */
  const benefits = [
    'Получайте 20% с каждого оплаченного реферала',
    'Бессрочная привязка — реферал остаётся вашим навсегда',
    'Мгновенные выплаты при достижении $50',
    'Доступ к маркетинговым материалам',
  ];

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div style={containerStyle}>
      {/* ── Left Panel: Branding ──────────────────────────────── */}
      <div style={leftPanelStyle}>
        {/* Background decorative circles */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '10%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.03)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'rgba(255,255,255,.2)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 800,
            color: '#fff',
            boxShadow: '0 4px 16px rgba(0,0,0,.15)',
          }}>
            TF
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-.03em' }}>TubeForge</span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          color: '#fff',
          lineHeight: 1.25,
          letterSpacing: '-.03em',
          marginBottom: 20,
          position: 'relative',
          zIndex: 1,
        }}>
          Добро пожаловать в{'\u00A0'}партнёрскую программу TubeForge
        </h1>

        {/* Subheading */}
        <p style={{
          fontSize: 17,
          color: 'rgba(255,255,255,.85)',
          lineHeight: 1.6,
          marginBottom: 40,
          position: 'relative',
          zIndex: 1,
        }}>
          Зарабатывайте <span style={{ fontWeight: 700, color: '#fff' }}>20%</span> с каждого оплаченного реферала. Без ограничений по сумме.
        </p>

        {/* Benefits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 1 }}>
          {benefits.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                background: 'rgba(255,255,255,.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <CheckCircleIcon color="rgba(255,255,255,.9)" />
              </div>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,.85)', lineHeight: 1.4 }}>{b}</span>
            </div>
          ))}
        </div>

        {/* Big earnings callout */}
        <div style={{
          marginTop: 48,
          padding: '20px 24px',
          borderRadius: 16,
          background: 'rgba(255,255,255,.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,.15)',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.7)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Потенциальный доход
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-.03em' }}>
            $75 — $500+
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 4 }}>
            в месяц при 10–50 рефералах
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form/Dashboard ───────────────────────── */}
      <div style={rightPanelStyle}>
        <div style={cardStyle}>
          {/* Loading state */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: `3px solid ${C.border}`,
                borderTopColor: '#6366f1',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ color: C.sub, fontSize: 13 }}>Загрузка...</div>
            </div>
          )}

          {/* ── State 1: Not yet activated ─────────────────────── */}
          {!isLoading && !referralCode && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <GiftIcon color="#6366f1" />
                <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-.02em' }}>
                  Присоединитесь к программе
                </h2>
              </div>
              <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, marginBottom: 32 }}>
                Активируйте партнёрскую программу чтобы получить уникальный реферальный код и начать зарабатывать.
              </p>

              {/* How it works */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
                  Как это работает
                </div>
                {[
                  { step: '1', title: 'Получите ссылку', desc: 'Активируйте программу и получите уникальную реферальную ссылку' },
                  { step: '2', title: 'Поделитесь', desc: 'Отправьте ссылку друзьям, подписчикам или коллегам' },
                  { step: '3', title: 'Зарабатывайте', desc: '20% с каждой оплаты ваших рефералов — навсегда' },
                ].map((item) => (
                  <div key={item.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#fff',
                      flexShrink: 0,
                    }}>
                      {item.step}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.4 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleActivate}
                disabled={activating}
                style={{
                  ...primaryBtnStyle,
                  width: '100%',
                  height: 48,
                  fontSize: 14,
                  opacity: activating ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,.3)';
                }}
              >
                {activating ? 'Активация...' : 'Активировать программу'}
              </button>
            </>
          )}

          {/* ── State 2: Dashboard (code exists) ───────────────── */}
          {!isLoading && referralCode && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <GiftIcon color="#6366f1" />
                <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-.02em' }}>
                  Партнёрская панель
                </h2>
              </div>
              <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, marginBottom: 28 }}>
                Делитесь ссылкой и зарабатывайте 20% с каждого оплаченного реферала.
              </p>

              {/* Referral link */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>
                  Ваша реферальная ссылка
                </label>
                <div style={inputRowStyle}>
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    style={inputStyle}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={handleCopy}
                    style={{
                      ...primaryBtnStyle,
                      padding: '0 16px',
                      minWidth: copied ? 120 : 90,
                      background: copied
                        ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      boxShadow: copied
                        ? '0 4px 14px rgba(22,163,74,.3)'
                        : '0 4px 14px rgba(99,102,241,.3)',
                    }}
                  >
                    {copied ? (
                      <>
                        <CheckCircleIcon color="#fff" />
                        Скопировано!
                      </>
                    ) : (
                      <>
                        <CopyIcon color="#fff" />
                        Копировать
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Referral code badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 10,
                background: isDark ? 'rgba(99,102,241,.1)' : 'rgba(99,102,241,.06)',
                border: `1px solid ${isDark ? 'rgba(99,102,241,.2)' : 'rgba(99,102,241,.12)'}`,
                marginBottom: 28,
              }}>
                <span style={{ fontSize: 11, color: C.sub, fontWeight: 500 }}>Ваш код:</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#6366f1', letterSpacing: '.05em', fontFamily: 'monospace' }}>
                  {referralCode}
                </span>
              </div>

              {/* Stats cards */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
                <div style={statCardStyle}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-.03em', lineHeight: 1 }}>
                    {invited}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 6, fontWeight: 500 }}>Приглашено</div>
                </div>
                <div style={statCardStyle}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-.03em', lineHeight: 1 }}>
                    {paid}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 6, fontWeight: 500 }}>Оплатили</div>
                </div>
                <div style={{
                  ...statCardStyle,
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(99,102,241,.08), rgba(139,92,246,.08))'
                    : 'linear-gradient(135deg, rgba(99,102,241,.05), rgba(139,92,246,.05))',
                  border: `1px solid ${isDark ? 'rgba(99,102,241,.2)' : 'rgba(99,102,241,.12)'}`,
                }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#6366f1', letterSpacing: '-.03em', lineHeight: 1 }}>
                    ${earnings.toFixed(0)}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 6, fontWeight: 500 }}>Заработано</div>
                </div>
              </div>

              {/* Share buttons */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 10 }}>
                  Поделиться
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleCopy}
                    style={shareButtonStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = C.cardHover;
                      e.currentTarget.style.borderColor = C.borderActive;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = C.surface;
                      e.currentTarget.style.borderColor = C.border;
                    }}
                  >
                    <CopyIcon color={C.sub} />
                    {copied ? 'Скопировано!' : 'Копировать ссылку'}
                  </button>
                  <button
                    onClick={handleShareTelegram}
                    style={{
                      ...shareButtonStyle,
                      background: isDark ? 'rgba(0,136,204,.1)' : 'rgba(0,136,204,.06)',
                      borderColor: isDark ? 'rgba(0,136,204,.2)' : 'rgba(0,136,204,.12)',
                      color: '#0088cc',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(0,136,204,.15)' : 'rgba(0,136,204,.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(0,136,204,.1)' : 'rgba(0,136,204,.06)';
                    }}
                  >
                    <TelegramIcon size={14} />
                    Telegram
                  </button>
                  <button
                    onClick={handleShareTwitter}
                    style={{
                      ...shareButtonStyle,
                      color: C.text,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = C.cardHover;
                      e.currentTarget.style.borderColor = C.borderActive;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = C.surface;
                      e.currentTarget.style.borderColor = C.border;
                    }}
                  >
                    <TwitterIcon size={13} />
                    Twitter
                  </button>
                </div>
              </div>

              {/* Commission info */}
              <div style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 8 }}>Условия программы</div>
                <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.7 }}>
                  Вы получаете 20% от каждого платежа привлечённого пользователя.
                  Привязка реферала бессрочная. Выплаты при достижении $50 на баланс.
                  Подробности в разделе помощи.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
