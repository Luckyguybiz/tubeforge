'use client';

import { useState, useCallback, useEffect } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import QRCode from 'qrcode';

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

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="currentColor" />
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

function EmailIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 4L12 13L2 4" />
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

function TrophyIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 1012 0V2z" />
    </svg>
  );
}

function DownloadIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 2V10.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 8L8 11L11 8" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 13H13" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5L9.8 5.8L14.5 6.2L11 9.3L12 14L8 11.5L4 14L5 9.3L1.5 6.2L6.2 5.8L8 1.5Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" fill={color} fillOpacity="0.15" />
    </svg>
  );
}

function LockIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke={color} strokeWidth="1.3" />
      <path d="M5.5 7V5C5.5 3.62 6.62 2.5 8 2.5C9.38 2.5 10.5 3.62 10.5 5V7" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/* ── Main Component ────────────────────────────────────────────────── */

function ReferralContent() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const t = useLocaleStore((s) => s.t);

  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [activating, setActivating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const myReferral = trpc.referral.getMyReferral.useQuery();
  const stats = trpc.referral.getStats.useQuery(undefined, {
    enabled: !!myReferral.data?.code,
  });
  const rewards = trpc.referral.getRewards.useQuery(undefined, {
    enabled: !!myReferral.data?.code,
  });
  const activateMutation = trpc.referral.activate.useMutation({
    onSuccess: () => {
      myReferral.refetch();
      stats.refetch();
      toast.success(t('referral.activated'));
    },
    onError: () => {
      toast.error(t('referral.activateError'));
    },
  });
  const [claimingMilestone, setClaimingMilestone] = useState<string | null>(null);
  const claimRewardMutation = trpc.referral.claimReward.useMutation({
    onSuccess: (data) => {
      rewards.refetch();
      setClaimingMilestone(null);
      toast.success(t('referral.claimSuccess').replace('{credits}', String(data.credits)));
    },
    onError: () => {
      setClaimingMilestone(null);
      toast.error('Failed to claim reward');
    },
  });


  const claimAllMutation = trpc.referral.claimReward.useMutation({
    onSuccess: (data) => {
      rewards.refetch();
      toast.success(t('referral.claimSuccess').replace('{credits}', String(data.credits)));
    },
    onError: () => {
      toast.error(t('referral.claimError'));
    },
  });
  const referralCode = myReferral.data?.code ?? null;
  const referralLink = referralCode ? `https://tubeforge.co?ref=${referralCode}` : '';
  const invited = stats.data?.invited ?? 0;
  const paid = stats.data?.paid ?? 0;
  const earnings = stats.data?.earnings ?? 0;
  const pending = (stats.data as { pending?: number } | undefined)?.pending ?? 0;

  /* ── Generate QR code when referral link is available ──── */
  useEffect(() => {
    if (referralLink) {
      QRCode.toDataURL(referralLink, {
        width: 180,
        margin: 2,
        color: {
          dark: isDark ? '#e2e8f0' : '#1e1b4b',
          light: '#00000000',
        },
      }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
    }
  }, [referralLink, isDark]);

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
      `${t('referral.shareText')} ${referralLink}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  }, [referralLink, t]);

  const handleShareWhatsApp = useCallback(() => {
    const text = encodeURIComponent(
      `${t('referral.shareText')} ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [referralLink, t]);

  const handleShareTwitter = useCallback(() => {
    const text = encodeURIComponent(
      `${t('referral.shareText')} ${referralLink}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  }, [referralLink, t]);

  const handleShareEmail = useCallback(() => {
    const subject = encodeURIComponent(t('referral.shareEmailSubject'));
    const body = encodeURIComponent(`${t('referral.shareEmailBody')}\n\n${referralLink}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  }, [referralLink, t]);

  const handleCopyCode = useCallback(async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCodeCopied(true);
      toast.success(t('referral.codeCopied'));
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = referralCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCodeCopied(true);
      toast.success(t('referral.codeCopied'));
      setTimeout(() => setCodeCopied(false), 2000);
    }
  }, [referralCode, t]);

  const handleDownloadQR = useCallback(async () => {
    if (!referralLink) return;
    try {
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, referralLink, {
        width: 512,
        margin: 3,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `tubeforge-referral-${referralCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(t('referral.qrDownloaded'));
    } catch {
      toast.error('Failed to download QR code');
    }
  }, [referralLink, referralCode, t]);

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
    alignItems: 'center',
    padding: '40px 48px',
    overflowY: 'auto',
    minWidth: 0,
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 560,
  };

  const inputRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    height: 48,
    padding: '0 16px',
    borderRadius: 12,
    border: `1.5px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 600,
    outline: 'none',
    letterSpacing: '0.01em',
  };

  const primaryBtnStyle: React.CSSProperties = {
    height: 48,
    padding: '0 24px',
    borderRadius: 12,
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
    padding: '20px 16px',
    borderRadius: 14,
    background: C.surface,
    border: `1px solid ${C.border}`,
    textAlign: 'center',
    minWidth: 0,
  };

  const shareButtonStyle: React.CSSProperties = {
    height: 42,
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
    flex: 1,
    minWidth: 0,
  };

  /* ── Benefits list ──────────────────────────────────────────── */
  const benefits = [
    t('referral.benefit1'),
    t('referral.benefit2'),
    t('referral.benefit3'),
    t('referral.benefit4'),
  ];

  /* ── Referral tiers ─────────────────────────────────────────── */
  const tiers = [
    { label: t('referral.tier1Label'), commission: t('referral.tier1Commission'), active: invited <= 5 || invited === 0, comingSoon: false },
    { label: t('referral.tier2Label'), commission: t('referral.tier2Commission'), active: false, comingSoon: true },
    { label: t('referral.tier3Label'), commission: t('referral.tier3Commission'), active: false, comingSoon: true },
  ];

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="tf-referral-container" style={containerStyle}>
      {/* ── Left Panel: Branding ──────────────────────────────── */}
      <div className="tf-referral-left" style={leftPanelStyle}>
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
          {t('referral.heading')}
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
          {t('referral.subheading')} <span style={{ fontWeight: 700, color: '#fff' }}>20%</span> {t('referral.subheadingEnd')}
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
            {t('referral.potentialEarnings')}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-.03em' }}>
            $75 — $500+
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 4 }}>
            {t('referral.perMonth')}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form/Dashboard ───────────────────────── */}
      <div className="tf-referral-right" style={rightPanelStyle}>
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
              <div style={{ color: C.sub, fontSize: 13 }}>{t('referral.loading')}</div>
            </div>
          )}

          {/* Error state */}
          {!isLoading && myReferral.isError && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 14, color: C.sub, marginBottom: 16 }}>
                {t('referral.loadError')}
              </div>
              <button
                onClick={() => myReferral.refetch()}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  color: C.text,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {t('referral.retry')}
              </button>
            </div>
          )}

          {/* ── State 1: Not yet activated ─────────────────────── */}
          {!isLoading && !myReferral.isError && !referralCode && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <GiftIcon color="#6366f1" />
                <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-.02em' }}>
                  {t('referral.joinProgram')}
                </h2>
              </div>
              <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, marginBottom: 32 }}>
                {t('referral.joinDesc')}
              </p>

              {/* How it works (4 steps) */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
                  {t('referral.howItWorks')}
                </div>
                {[
                  { step: '1', text: t('referral.howStep1') },
                  { step: '2', text: t('referral.howStep2') },
                  { step: '3', text: t('referral.howStep3') },
                  { step: '4', text: t('referral.howStep4') },
                ].map((item) => (
                  <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
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
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.text, lineHeight: 1.4 }}>
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Referral Tiers */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>
                  {t('referral.tiersTitle')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tiers.map((tier, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: `1px solid ${tier.active && !tier.comingSoon ? (isDark ? 'rgba(99,102,241,.3)' : 'rgba(99,102,241,.2)') : C.border}`,
                      background: tier.active && !tier.comingSoon
                        ? (isDark ? 'rgba(99,102,241,.08)' : 'rgba(99,102,241,.04)')
                        : C.surface,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TrophyIcon color={tier.active && !tier.comingSoon ? '#6366f1' : C.dim} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{tier.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: tier.active && !tier.comingSoon ? '#6366f1' : C.sub }}>
                          {tier.commission}
                        </span>
                        {tier.comingSoon && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#fff',
                            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                            borderRadius: 4,
                            padding: '2px 6px',
                            lineHeight: '14px',
                            letterSpacing: '.02em',
                          }}>
                            {t('referral.comingSoon')}
                          </span>
                        )}
                        {tier.active && !tier.comingSoon && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#fff',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            borderRadius: 4,
                            padding: '2px 6px',
                            lineHeight: '14px',
                            letterSpacing: '.02em',
                          }}>
                            {t('referral.currentTier')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
                {activating ? t('referral.activating') : t('referral.activateProgram')}
              </button>
            </>
          )}

          {/* ── State 2: Dashboard (code exists) ───────────────── */}
          {!isLoading && !myReferral.isError && referralCode && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <GiftIcon color="#6366f1" />
                <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-.02em' }}>
                  {t('referral.dashboard')}
                </h2>
              </div>
              <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, marginBottom: 28 }}>
                {t('referral.dashboardDesc')}
              </p>

              {/* ── Invite Widget: Big referral link ──────────────── */}
              <div style={{
                marginBottom: 24,
                padding: '24px',
                borderRadius: 16,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(99,102,241,.08), rgba(139,92,246,.06))'
                  : 'linear-gradient(135deg, rgba(99,102,241,.04), rgba(139,92,246,.03))',
                border: `1.5px solid ${isDark ? 'rgba(99,102,241,.2)' : 'rgba(99,102,241,.12)'}`,
              }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 10 }}>
                  {t('referral.yourLink')}
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
                      padding: '0 20px',
                      minWidth: copied ? 130 : 100,
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
                        {t('referral.copied')}
                      </>
                    ) : (
                      <>
                        <CopyIcon color="#fff" />
                        {t('referral.copy')}
                      </>
                    )}
                  </button>
                </div>

                {/* Referral code badge with copy */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: isDark ? 'rgba(99,102,241,.12)' : 'rgba(99,102,241,.08)',
                  }}>
                    <span style={{ fontSize: 11, color: C.sub, fontWeight: 500 }}>{t('referral.yourCode')}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#6366f1', letterSpacing: '.05em', fontFamily: 'monospace' }}>
                      {referralCode}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 10,
                      border: `1.5px solid ${codeCopied ? 'rgba(22,163,74,.3)' : (isDark ? 'rgba(99,102,241,.25)' : 'rgba(99,102,241,.15)')}`,
                      background: codeCopied
                        ? (isDark ? 'rgba(22,163,74,.12)' : 'rgba(22,163,74,.06)')
                        : (isDark ? 'rgba(99,102,241,.08)' : 'rgba(99,102,241,.04)'),
                      color: codeCopied ? '#16a34a' : '#6366f1',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .25s ease',
                    }}
                  >
                    {codeCopied ? <CheckCircleIcon color="#16a34a" /> : <CopyIcon color="#6366f1" />}
                    {codeCopied ? t('referral.copied') : t('referral.copyCode')}
                  </button>
                </div>
              </div>

              {/* ── Share buttons (Telegram, WhatsApp, Twitter/X, Email) ── */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 10 }}>
                  {t('referral.share')}
                </label>
                <div className="tf-referral-share-row" style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleShareTelegram}
                    style={{
                      ...shareButtonStyle,
                      background: isDark ? 'rgba(0,136,204,.1)' : 'rgba(0,136,204,.06)',
                      borderColor: isDark ? 'rgba(0,136,204,.2)' : 'rgba(0,136,204,.12)',
                      color: '#0088cc',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(0,136,204,.18)' : 'rgba(0,136,204,.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(0,136,204,.1)' : 'rgba(0,136,204,.06)';
                    }}
                  >
                    <TelegramIcon size={14} />
                    Telegram
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    style={{
                      ...shareButtonStyle,
                      background: isDark ? 'rgba(37,211,102,.08)' : 'rgba(37,211,102,.05)',
                      borderColor: isDark ? 'rgba(37,211,102,.2)' : 'rgba(37,211,102,.12)',
                      color: '#25D366',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(37,211,102,.15)' : 'rgba(37,211,102,.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(37,211,102,.08)' : 'rgba(37,211,102,.05)';
                    }}
                  >
                    <WhatsAppIcon size={14} />
                    {t('referral.shareWhatsApp')}
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
                  <button
                    onClick={handleShareEmail}
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
                    <EmailIcon size={13} />
                    {t('referral.shareEmail')}
                  </button>
                </div>
              </div>

              {/* ── QR Code ──────────────────────────────────────── */}
              {qrDataUrl && (
                <div className="tf-referral-qr" style={{
                  marginBottom: 28,
                  padding: '20px',
                  borderRadius: 14,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                }}>
                  <div style={{
                    width: 120,
                    height: 120,
                    borderRadius: 12,
                    background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    padding: 8,
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="Referral QR Code" decoding="async" style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                      {t('referral.qrTitle')}
                    </div>
                    <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5, marginBottom: 12 }}>
                      {t('referral.qrDesc')}
                    </div>
                    <button
                      onClick={handleDownloadQR}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        color: C.text,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all .2s ease',
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
                      <DownloadIcon color={C.text} />
                      {t('referral.downloadQR')}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Stats Dashboard ──────────────────────────────── */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
                  {t('referral.statsTitle')}
                </div>
                <div className="tf-referral-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  <div style={statCardStyle}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-.03em', lineHeight: 1 }}>
                      {invited}
                    </div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 6, fontWeight: 500 }}>{t('referral.statTotalReferrals')}</div>
                  </div>
                  <div style={statCardStyle}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981', letterSpacing: '-.03em', lineHeight: 1 }}>
                      {paid}
                    </div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 6, fontWeight: 500 }}>{t('referral.statActiveReferrals')}</div>
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
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 6, fontWeight: 500 }}>{t('referral.statTotalEarned')}</div>
                  </div>
                  <div style={statCardStyle}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b', letterSpacing: '-.03em', lineHeight: 1 }}>
                      ${pending.toFixed(0)}
                    </div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 6, fontWeight: 500 }}>{t('referral.statPendingPayout')}</div>
                  </div>
                </div>
              </div>

              {/* ── Rewards ─────────────────────────────────────── */}
              {rewards.data?.rewards && rewards.data.rewards.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                      {t('referral.rewardsTitle')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {rewards.data.totalBonusCredits > 0 && (
                        <div style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#6366f1',
                          background: isDark ? 'rgba(99,102,241,.12)' : 'rgba(99,102,241,.06)',
                          padding: '4px 10px',
                          borderRadius: 6,
                        }}>
                          +{rewards.data.totalBonusCredits} {t('referral.rewardCreditsLabel')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {rewards.data.rewards.map((r) => {
                      const milestoneLabel = t(`referral.milestone.${r.milestone}`);
                      const rewardLabel = t(`referral.reward.${r.reward}`);
                      const isClaimed = 'claimed' in r && r.claimed;
                      return (
                        <div key={r.milestone} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: `1px solid ${r.earned ? (isClaimed ? (isDark ? 'rgba(99,102,241,.25)' : 'rgba(99,102,241,.15)') : (isDark ? 'rgba(16,185,129,.25)' : 'rgba(16,185,129,.15)')) : C.border}`,
                          background: r.earned
                            ? (isClaimed
                                ? (isDark ? 'rgba(99,102,241,.06)' : 'rgba(99,102,241,.03)')
                                : (isDark ? 'rgba(16,185,129,.06)' : 'rgba(16,185,129,.03)'))
                            : C.surface,
                          opacity: r.earned ? 1 : 0.65,
                          transition: 'all .2s ease',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {r.earned
                              ? <CheckCircleIcon color={isClaimed ? '#6366f1' : '#10b981'} />
                              : <LockIcon color={C.dim} />
                            }
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{milestoneLabel}</span>
                            {isClaimed && (
                              <span style={{ fontSize: 10, fontWeight: 600, color: '#6366f1', background: isDark ? 'rgba(99,102,241,.12)' : 'rgba(99,102,241,.06)', padding: '2px 6px', borderRadius: 4 }}>
                                {t('referral.claimed')}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <StarIcon color={r.earned ? '#f59e0b' : C.dim} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: r.earned ? '#f59e0b' : C.sub }}>
                              {rewardLabel}
                            </span>
                            {r.earned && !r.claimed && (
                              <button
                                onClick={() => {
                                  setClaimingMilestone(r.milestone);
                                  claimRewardMutation.mutate({ milestone: r.milestone });
                                }}
                                disabled={claimingMilestone === r.milestone}
                                style={{
                                  marginLeft: 6,
                                  padding: '3px 10px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#fff',
                                  background: '#6366f1',
                                  border: 'none',
                                  borderRadius: 6,
                                  cursor: claimingMilestone === r.milestone ? 'wait' : 'pointer',
                                  opacity: claimingMilestone === r.milestone ? 0.6 : 1,
                                  transition: 'opacity .15s ease',
                                }}
                              >
                                {claimingMilestone === r.milestone ? '...' : t('referral.claimReward')}
                              </button>
                            )}
                            {r.earned && r.claimed && (
                              <span style={{
                                marginLeft: 6,
                                fontSize: 10,
                                fontWeight: 600,
                                color: '#10b981',
                                textTransform: 'uppercase',
                                letterSpacing: '.04em',
                              }}>
                                {t('referral.rewardClaimed')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── How It Works (4 steps) ───────────────────────── */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>
                  {t('referral.howItWorks')}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 10,
                }}>
                  {[
                    { step: '1', text: t('referral.howStep1') },
                    { step: '2', text: t('referral.howStep2') },
                    { step: '3', text: t('referral.howStep3') },
                    { step: '4', text: t('referral.howStep4') },
                  ].map((item) => (
                    <div key={item.step} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 14px',
                      borderRadius: 12,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                    }}>
                      <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
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
                      <div style={{ fontSize: 12, fontWeight: 500, color: C.text, lineHeight: 1.4 }}>
                        {item.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Referral Tiers ────────────────────────────────── */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>
                  {t('referral.tiersTitle')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tiers.map((tier, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: `1px solid ${tier.active && !tier.comingSoon ? (isDark ? 'rgba(99,102,241,.3)' : 'rgba(99,102,241,.2)') : C.border}`,
                      background: tier.active && !tier.comingSoon
                        ? (isDark ? 'rgba(99,102,241,.08)' : 'rgba(99,102,241,.04)')
                        : C.surface,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TrophyIcon color={tier.active && !tier.comingSoon ? '#6366f1' : C.dim} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{tier.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: tier.active && !tier.comingSoon ? '#6366f1' : C.sub }}>
                          {tier.commission}
                        </span>
                        {tier.comingSoon && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#fff',
                            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                            borderRadius: 4,
                            padding: '2px 6px',
                            lineHeight: '14px',
                            letterSpacing: '.02em',
                          }}>
                            {t('referral.comingSoon')}
                          </span>
                        )}
                        {tier.active && !tier.comingSoon && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#fff',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            borderRadius: 4,
                            padding: '2px 6px',
                            lineHeight: '14px',
                            letterSpacing: '.02em',
                          }}>
                            {t('referral.currentTier')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commission info */}
              <div style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 8 }}>{t('referral.termsTitle')}</div>
                <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.7 }}>
                  {t('referral.termsDesc')}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReferralPage() {
  return (
    <ErrorBoundary>
      <ReferralContent />
    </ErrorBoundary>
  );
}
