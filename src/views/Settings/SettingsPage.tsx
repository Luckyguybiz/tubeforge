'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { signOut, useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePushNotifications } from '@/components/PushNotificationManager';
import QRCode from 'qrcode';
import type { Theme } from '@/lib/types';

/* ── Plan feature lists ──────────────────────────── */
function getPlanFeatures(t: (key: string) => string): Record<string, string[]> {
  return {
    FREE: [
      t('settings.plan.free.projects'),
      t('settings.plan.free.aiGen'),
      t('settings.plan.free.templates'),
      t('settings.plan.free.watermark'),
    ],
    PRO: [
      t('settings.plan.pro.projects'),
      t('settings.plan.pro.aiGen'),
      t('settings.plan.pro.priority'),
      t('settings.plan.pro.noWatermark'),
      t('settings.plan.pro.templates'),
    ],
    STUDIO: [
      t('settings.plan.studio.projects'),
      t('settings.plan.studio.aiGen'),
      t('settings.plan.studio.team'),
      t('settings.plan.studio.api'),
      t('settings.plan.studio.support'),
      t('settings.plan.studio.allFeatures'),
    ],
  };
}

function getPlanLabel(plan: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    FREE: t('common.free'),
    PRO: t('common.pro'),
    STUDIO: t('common.studio'),
  };
  return map[plan] ?? plan;
}

const PLAN_LIMITS: Record<string, { projects: number; ai: number }> = {
  FREE: { projects: 3, ai: 5 },
  PRO: { projects: 25, ai: 100 },
  STUDIO: { projects: Infinity, ai: Infinity },
};

export function SettingsPage() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const toggle = useThemeStore((s) => s.toggle);

  const language = useLocaleStore((s) => s.locale);
  const setLanguage = useLocaleStore((s) => s.setLocale);
  const t = useLocaleStore((s) => s.t);
  const PLAN_FEATURES = useMemo(() => getPlanFeatures(t), [t]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [cookieConsent, setCookieConsent] = useState<string | null>(null);

  /** Derive a simple 'accepted'/'declined' status from the new JSON-based consent */
  const deriveCookieStatus = (): string | null => {
    const raw = localStorage.getItem('tf-cookie-consent');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null && 'analytics' in parsed) {
        return parsed.analytics ? 'accepted' : 'declined';
      }
    } catch { /* legacy string format */ }
    return raw; // 'accepted' or 'declined' (legacy)
  };

  useEffect(() => {
    setCookieConsent(deriveCookieStatus());
    const handler = () => setCookieConsent(deriveCookieStatus());
    window.addEventListener('tf-consent-changed', handler);
    return () => window.removeEventListener('tf-consent-changed', handler);
  }, []);

  const session = useSession();
  const profile = trpc.user.getProfile.useQuery();
  const subscription = trpc.billing.getSubscription.useQuery();

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => toast.success(t('settings.profile') + ' \u2714'),
    onError: (err) => toast.error(err.message),
  });

  const createPortal = trpc.billing.createPortal.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: (err) => toast.error(err.message),
  });

  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: (err) => toast.error(err.message),
  });

  const deleteAccount = trpc.user.deleteAccount.useMutation({
    onSuccess: () => signOut({ callbackUrl: '/' }),
    onError: (err) => toast.error(err.message),
  });

  const resetOnboarding = trpc.user.resetOnboarding.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const exportData = trpc.user.exportData.useQuery(undefined, {
    enabled: false, // only fetch on manual trigger via refetch()
  });

  /* ── VPN / YouTube Access ──────────────────────── */
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [vpnGenerating, setVpnGenerating] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [vpnGuideOpen, setVpnGuideOpen] = useState(false);
  const vpnStatus = trpc.vpn.getStatus.useQuery();
  const vpnGetConfig = trpc.vpn.getConfig.useQuery(undefined, { enabled: false });
  const vpnRevoke = trpc.vpn.revokeConfig.useMutation({
    onSuccess: () => { vpnStatus.refetch(); toast.success(t('settings.vpn.revoked')); },
    onError: (err) => toast.error(err.message),
  });
  const vpnPromo = trpc.vpn.unlockWithPromo.useMutation({
    onSuccess: () => { vpnStatus.refetch(); toast.success(t('settings.vpn.promoSuccess')); setPromoCode(''); },
    onError: (e) => toast.error(e.message),
  });

  const handleVpnGenerate = useCallback(async () => {
    setVpnGenerating(true);
    try {
      await vpnGetConfig.refetch();
      await vpnStatus.refetch();
    } finally {
      setVpnGenerating(false);
    }
  }, [vpnGetConfig, vpnStatus]);

  const handleVpnDownload = useCallback((config: string) => {
    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tubeforge-vpn.conf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleShowQr = useCallback(async (config: string) => {
    const url = await QRCode.toDataURL(config, { width: 280, margin: 2 });
    setQrDataUrl(url);
  }, []);

  const handleNameBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val && val !== profile.data?.name) updateProfile.mutate({ name: val });
  }, [profile.data?.name, updateProfile]);

  /* ── Apple design tokens ──────────────────────── */
  const textPrimary = isDark ? C.text : '#1d1d1f';
  const textSecondary = isDark ? C.sub : '#86868b';
  const cardBg = isDark ? C.card : '#ffffff';
  const cardBorder = isDark ? C.border : '#e5e5ea';
  const cardShadow = isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)';
  const inputBg = isDark ? C.surface : '#f5f5f7';
  const secondaryBtnBg = isDark ? C.surface : '#f5f5f7';

  /* ── Shared styles ──────────────────────────── */

  const sectionStyle: React.CSSProperties = {
    background: cardBg,
    border: `1px solid ${cardBorder}`,
    borderRadius: 16,
    boxShadow: cardShadow,
    padding: '28px 24px',
    marginBottom: 32,
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 600,
    color: textPrimary,
    margin: 0,
    marginBottom: 6,
    letterSpacing: '-.01em',
  };

  const sectionDescStyle: React.CSSProperties = {
    fontSize: 13,
    color: textSecondary,
    margin: 0,
    marginBottom: 20,
    lineHeight: 1.5,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: textSecondary,
    marginBottom: 6,
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    minHeight: 44,
    borderRadius: 10,
    border: `1px solid ${cardBorder}`,
    background: inputBg,
    color: textPrimary,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
  };

  const readOnlyInputStyle: React.CSSProperties = {
    ...inputStyle,
    color: textSecondary,
    cursor: 'not-allowed',
    background: isDark ? C.bg : '#f5f5f7',
    borderStyle: 'dashed',
    paddingRight: 36,
  };

  const btnBase: React.CSSProperties = {
    padding: '10px 24px',
    minHeight: 44,
    borderRadius: 10,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity .15s, transform .1s',
  };

  const plan = subscription.data?.plan ?? profile.data?.plan ?? 'FREE';
  const hasSub = !!subscription.data?.subscription;
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;

  const authProvider = (() => {
    const img = session.data?.user?.image ?? '';
    if (img.includes('lh3.googleusercontent.com') || img.includes('googleusercontent.com')) return 'Google';
    if (img.includes('avatars.githubusercontent.com') || img.includes('github')) return 'GitHub';
    if (img) return 'OAuth';
    return 'Email';
  })();

  const userImage = profile.data?.image ?? session.data?.user?.image ?? null;
  const userName = profile.data?.name ?? session.data?.user?.name ?? '';
  const userEmail = profile.data?.email ?? session.data?.user?.email ?? '';

  return (
    <div style={{ maxWidth: 700, width: '100%', margin: '0 auto', padding: '0 16px', boxSizing: 'border-box' }}>
      {/* Page subtitle */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ color: C.sub, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
          {t('settings.subtitle')}
        </p>
      </div>

      {/* ====================================================== */}
      {/* SECTION 1: Profile                                     */}
      {/* ====================================================== */}
      <div style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>{t('settings.profile')}</h2>
        <p style={sectionDescStyle}>{t('settings.profileDesc')}</p>

        {profile.isLoading ? (
          <ProfileSkeleton />
        ) : profile.isError ? (
          <ErrorRow C={C} btnBase={btnBase} message={t('settings.errorProfile')} onRetry={() => profile.refetch()} />
        ) : (
          <>
            {/* Avatar + Name + Email */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap' }}>
              {/* Avatar with upload overlay */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: inputBg,
                  border: `2px solid ${cardBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  {userImage ? (
                    <img
                      src={userImage}
                      alt={userName}
                      width={72}
                      height={72}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span style={{ fontSize: 28, color: C.dim }}>
                      {userName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  title="Coming soon"
                  disabled
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.dim,
                    background: 'none',
                    border: 'none',
                    cursor: 'not-allowed',
                    padding: '2px 0',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  {t('common.comingSoon') || 'Coming soon'}
                </button>
              </div>

              {/* Name + Email fields */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label htmlFor="settings-name" style={labelStyle}>{t('settings.name')}</label>
                    <input
                      id="settings-name"
                      aria-label={t('settings.name')}
                      maxLength={50}
                      style={inputStyle}
                      defaultValue={userName}
                      placeholder={t('settings.name')}
                      onBlur={handleNameBlur}
                    />
                    <span style={{ fontSize: 11, color: C.dim, marginTop: 4, display: 'block' }}>
                      {t('settings.autoSave')}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label htmlFor="settings-email" style={labelStyle}>{t('settings.email')}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="settings-email"
                        aria-label={t('settings.email')}
                        aria-readonly="true"
                        style={readOnlyInputStyle}
                        value={userEmail}
                        readOnly
                        tabIndex={-1}
                      />
                      <span style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 13,
                        color: C.dim,
                        pointerEvents: 'none',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: C.dim, marginTop: 4, display: 'block' }}>
                      {t('settings.linkedTo')} {authProvider}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Connected accounts */}
            <div style={{
              padding: '14px 18px',
              background: C.surface,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 12 }}>
                {t('settings.connectedAccounts')}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                {/* Provider icon — dynamic based on detected auth provider */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {authProvider === 'Google' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  ) : authProvider === 'GitHub' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isDark ? '#fff' : '#24292f'}>
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  ) : (
                    /* Generic key icon for OAuth / Email */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{authProvider}</span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 4,
                      background: C.bg,
                      color: C.dim,
                      letterSpacing: 0.3,
                      textTransform: 'uppercase' as const,
                    }}>
                      Provider
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: C.sub }}>{userEmail}</div>
                </div>
                <div style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: `${C.green}18`,
                  color: C.green,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                }}>
                  {t('settings.connected')}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ====================================================== */}
      {/* SECTION 2: Subscription                                */}
      {/* ====================================================== */}
      <div style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>{t('settings.subscription')}</h2>
        <p style={sectionDescStyle}>{t('settings.subscriptionDesc')}</p>

        {subscription.isLoading ? (
          <SubscriptionSkeleton />
        ) : subscription.isError ? (
          <ErrorRow C={C} btnBase={btnBase} message={t('settings.errorSubscription')} onRetry={() => subscription.refetch()} />
        ) : (
          <>
            {/* Plan badge + label */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 20,
              padding: '18px 20px',
              background: C.surface,
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              flexWrap: 'wrap',
            }}>
              {/* Plan icon */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: plan === 'STUDIO'
                  ? `linear-gradient(135deg, ${C.purple}, ${C.blue})`
                  : plan === 'PRO'
                    ? `linear-gradient(135deg, ${C.blue}, ${C.cyan})`
                    : C.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: plan === 'FREE' ? `1px solid ${C.border}` : 'none',
              }}>
                <span style={{ fontSize: 20, color: plan === 'FREE' ? C.dim : '#fff' }}>
                  {plan === 'STUDIO' ? '\u2726' : plan === 'PRO' ? '\u25C6' : '\u25CB'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                    {getPlanLabel(plan, t)}
                  </span>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    background: plan === 'STUDIO'
                      ? `linear-gradient(135deg, ${C.purple}25, ${C.blue}25)`
                      : plan === 'PRO'
                        ? `${C.blue}18`
                        : C.accentDim,
                    color: plan === 'STUDIO'
                      ? C.purple
                      : plan === 'PRO'
                        ? C.blue
                        : C.accent,
                  }}>
                    {plan === 'FREE' ? t('settings.current') : t('settings.active')}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
                  {plan === 'FREE' && t('settings.planDescFree')}
                  {plan === 'PRO' && t('settings.planDescPro')}
                  {plan === 'STUDIO' && t('settings.planDescStudio')}
                </div>
              </div>
            </div>

            {/* Usage bars for FREE/PRO */}
            {plan !== 'STUDIO' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 12 }}>
                  {t('settings.usage')}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <UsageBar
                    C={C}
                    label={t('settings.projects')}
                    used={profile.data?._count?.projects ?? 0}
                    limit={limits.projects}
                  />
                  <UsageBar
                    C={C}
                    label={t('settings.aiGenerations')}
                    used={profile.data?.aiUsage ?? 0}
                    limit={limits.ai}
                  />
                </div>
              </div>
            )}

            {/* Plan features list */}
            <div style={{
              padding: '16px 20px',
              background: C.surface,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 12 }}>
                {t('settings.planFeatures')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: '8px 16px' }}>
                {(PLAN_FEATURES[plan] ?? PLAN_FEATURES.FREE).map((feature, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ fontSize: 13, color: C.text }}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upgrade hint for FREE/PRO */}
            {plan !== 'STUDIO' && (
              <div style={{
                padding: '14px 18px',
                background: plan === 'FREE' ? `${C.blue}0a` : `${C.purple}0a`,
                border: `1px solid ${plan === 'FREE' ? `${C.blue}20` : `${C.purple}20`}`,
                borderRadius: 12,
                marginBottom: 20,
                fontSize: 13,
                color: C.sub,
                lineHeight: 1.6,
              }}>
                {plan === 'FREE' && (
                  <>
                    <strong style={{ color: C.blue }}>Pro</strong> — {t('settings.planDescPro')}
                  </>
                )}
                {plan === 'PRO' && (
                  <>
                    <strong style={{ color: C.purple }}>Studio</strong> — {t('settings.planDescStudio')}
                  </>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {hasSub && (
                <button
                  onClick={() => createPortal.mutate()}
                  disabled={createPortal.isPending}
                  style={{
                    ...btnBase,
                    background: C.surface,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                    ...(createPortal.isPending ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                  }}
                >
                  {createPortal.isPending ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Spinner size={14} color={C.sub} /> {t('settings.loading')}
                    </span>
                  ) : t('settings.manageSubscription')}
                </button>
              )}
              {plan !== 'STUDIO' && (
                <button
                  onClick={() => createCheckout.mutate({ plan: plan === 'FREE' ? 'PRO' : 'STUDIO' })}
                  disabled={createCheckout.isPending}
                  style={{
                    ...btnBase,
                    background: plan === 'FREE' ? C.blue : C.purple,
                    color: '#fff',
                    ...(createCheckout.isPending ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                  }}
                >
                  {createCheckout.isPending ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Spinner size={14} color="#fff" /> {t('settings.loading')}
                    </span>
                  ) : `${t('settings.upgradeTo')} ${plan === 'FREE' ? 'Pro' : 'Studio'}`}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* ====================================================== */}
      {/* SECTION 3: YouTube Channels                            */}
      {/* ====================================================== */}
      <div style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>{t('settings.youtubeChannels')}</h2>
        <p style={sectionDescStyle}>{t('settings.youtubeDesc')}</p>

        {profile.isLoading ? (
          <ChannelsSkeleton />
        ) : profile.data?.channels && profile.data.channels.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {profile.data.channels.map((ch) => (
              <div key={ch.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                background: C.surface,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                transition: 'border-color .15s',
              }}>
                {ch.thumbnail ? (
                  <img
                    src={ch.thumbnail}
                    alt={ch.title}
                    loading="lazy"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `2px solid ${C.border}`,
                    }}
                  />
                ) : (
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#ff000015',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: `2px solid ${C.border}`,
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff0000" opacity="0.6">
                      <path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z"/>
                    </svg>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {ch.title}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                    {(ch.subscribers ?? 0).toLocaleString('en-US')} {t('settings.subscribers')}
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: `${C.green}18`,
                  color: C.green,
                  fontSize: 11,
                  fontWeight: 700,
                }}>
                  {t('settings.active')}
                </div>
              </div>
            ))}
            <button
              disabled={true}
              style={{
                ...btnBase,
                background: 'transparent',
                color: C.sub,
                border: `1px dashed ${C.border}`,
                padding: '12px',
                borderRadius: 12,
                fontSize: 13,
                marginTop: 4,
                opacity: 0.5,
                cursor: 'not-allowed',
              }}
            >
              + {t('settings.connectChannel')}
            </button>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 6, textAlign: 'center' }}>
              {t('settings.viaGoogleOAuth')}
            </div>
          </div>
        ) : (
          <div style={{
            padding: '36px 24px',
            border: `1px dashed ${C.border}`,
            borderRadius: 14,
            textAlign: 'center',
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#ff000010',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" fill="#ff0000" opacity="0.15" stroke="#ff0000" strokeWidth="0"/>
                <polygon points="9.75,15.02 15.5,11.75 9.75,8.48" fill="#ff0000" opacity="0.6"/>
              </svg>
            </div>
            <p style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              {t('settings.noChannels')}
            </p>
            <p style={{ color: C.sub, fontSize: 13, marginBottom: 20, maxWidth: 320, margin: '0 auto 20px' }}>
              {t('settings.noChannelsDesc')}
            </p>
            <button
              disabled={true}
              style={{
                ...btnBase,
                background: C.surface,
                color: C.text,
                border: `1px solid ${C.border}`,
                opacity: 0.5,
                cursor: 'not-allowed',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t('settings.connectChannel')}
              </span>
            </button>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>
              {t('settings.viaGoogleOAuth')}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* SECTION: YouTube Access (VPN)                          */}
      {/* ====================================================== */}
      <div style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>{t('settings.vpn')}</h2>
        <p style={sectionDescStyle}>{t('settings.vpnDesc')}</p>

        {plan === 'FREE' && !vpnStatus.data?.peer?.active ? (
          /* Plan gate — feature preview for free users */
          <div style={{
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
          }}>
            {/* Semi-transparent mockup of active VPN section */}
            <div style={{ opacity: 0.5, pointerEvents: 'none', padding: '18px 20px', background: C.surface, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: C.green,
                  display: 'inline-block', flexShrink: 0,
                }} />
                <span style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: `${C.green}18`, color: C.green, letterSpacing: 0.3,
                }}>
                  {t('settings.vpn.active')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
                <div>
                  <span style={{ color: C.sub, fontWeight: 600 }}>{t('settings.vpn.ip')}: </span>
                  <span style={{ color: C.text, fontFamily: 'monospace' }}>10.8.0.xx</span>
                </div>
                <div>
                  <span style={{ color: C.sub, fontWeight: 600 }}>{t('settings.vpn.created')}: </span>
                  <span style={{ color: C.text }}>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                <button disabled style={{ ...btnBase, background: C.surface, color: C.text, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, cursor: 'not-allowed' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  {t('settings.vpn.download')}
                </button>
                <button disabled style={{ ...btnBase, background: C.surface, color: C.text, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, cursor: 'not-allowed' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                  {t('settings.vpn.showQr')}
                </button>
              </div>
            </div>

            {/* Feature list + CTA */}
            <div style={{ padding: '20px 20px 24px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 14px' }}>
                {t('settings.vpn.preview.title')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {[
                  t('settings.vpn.preview.feature1'),
                  t('settings.vpn.preview.feature2'),
                  t('settings.vpn.preview.feature3'),
                  t('settings.vpn.preview.feature4'),
                  t('settings.vpn.preview.feature5'),
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ fontSize: 13, color: C.text }}>{f}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                <a
                  href="/billing"
                  style={{
                    ...btnBase,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: C.blue,
                    color: '#fff',
                    textDecoration: 'none',
                  }}
                >
                  {t('settings.upgradeTo')} Pro
                </a>
              </div>

              {/* Promo code input */}
              <div style={{
                padding: '14px 16px',
                background: C.surface,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 10 }}>
                  {t('settings.vpn.promo')}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder={t('settings.vpn.promoPlaceholder')}
                    style={{
                      ...inputStyle,
                      flex: 1,
                    }}
                    maxLength={50}
                  />
                  <button
                    onClick={() => { if (promoCode.trim()) vpnPromo.mutate({ code: promoCode.trim() }); }}
                    disabled={vpnPromo.isPending || !promoCode.trim()}
                    style={{
                      ...btnBase,
                      background: C.blue,
                      color: '#fff',
                      padding: '10px 18px',
                      opacity: vpnPromo.isPending || !promoCode.trim() ? 0.6 : 1,
                      cursor: vpnPromo.isPending || !promoCode.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {vpnPromo.isPending ? (
                      <Spinner size={14} color="#fff" />
                    ) : t('settings.vpn.promoApply')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : vpnStatus.isLoading ? (
          /* Loading state */
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Spinner size={16} color={C.sub} />
            <span style={{ fontSize: 13, color: C.sub }}>{t('settings.loading')}</span>
          </div>
        ) : vpnStatus.data?.peer?.active ? (
          /* Active config state */
          <>
            <div style={{
              padding: '18px 20px',
              background: C.surface,
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: C.green,
                  display: 'inline-block',
                  flexShrink: 0,
                }} />
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  background: `${C.green}18`,
                  color: C.green,
                  letterSpacing: 0.3,
                }}>
                  {t('settings.vpn.active')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
                <div>
                  <span style={{ color: C.sub, fontWeight: 600 }}>{t('settings.vpn.ip')}: </span>
                  <span style={{ color: C.text, fontFamily: 'monospace' }}>{vpnStatus.data.peer.assignedIp}</span>
                </div>
                <div>
                  <span style={{ color: C.sub, fontWeight: 600 }}>{t('settings.vpn.created')}: </span>
                  <span style={{ color: C.text }}>{new Date(vpnStatus.data.peer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Collapsible step-by-step VPN setup guide */}
            <div style={{
              borderRadius: 12,
              border: `1px solid ${C.blue}20`,
              marginBottom: 16,
              overflow: 'hidden',
            }}>
              <button
                onClick={() => setVpnGuideOpen(!vpnGuideOpen)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: `${C.blue}0a`,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.text,
                }}
              >
                <span>{t('settings.vpn.guide')}</span>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.sub}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: vpnGuideOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {vpnGuideOpen && (
                <div style={{ padding: '16px 18px', fontSize: 13, color: C.sub, lineHeight: 1.7 }}>
                  {/* Mobile */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, color: C.text, marginBottom: 6, fontSize: 13 }}>
                      {t('settings.vpn.guide.mobile')}
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 18 }}>
                      <li>{t('settings.vpn.guide.mobile.step1')} <a href="https://play.google.com/store/apps/details?id=com.wireguard.android" target="_blank" rel="noopener noreferrer" style={{ color: C.blue }}>Google Play</a> / <a href="https://apps.apple.com/app/wireguard/id1441195209" target="_blank" rel="noopener noreferrer" style={{ color: C.blue }}>App Store</a></li>
                      <li>{t('settings.vpn.guide.mobile.step2')}</li>
                      <li>{t('settings.vpn.guide.mobile.step3')}</li>
                      <li>{t('settings.vpn.guide.mobile.step4')}</li>
                      <li>{t('settings.vpn.guide.mobile.step5')}</li>
                    </ol>
                  </div>
                  {/* Desktop */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, color: C.text, marginBottom: 6, fontSize: 13 }}>
                      {t('settings.vpn.guide.desktop')}
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 18 }}>
                      <li>{t('settings.vpn.guide.desktop.step1')} <a href="https://www.wireguard.com/install/" target="_blank" rel="noopener noreferrer" style={{ color: C.blue }}>wireguard.com/install</a></li>
                      <li>{t('settings.vpn.guide.desktop.step2')}</li>
                      <li>{t('settings.vpn.guide.desktop.step3')}</li>
                      <li>{t('settings.vpn.guide.desktop.step4')}</li>
                    </ol>
                  </div>
                  {/* AmneziaVPN */}
                  <div>
                    <div style={{ fontWeight: 700, color: C.text, marginBottom: 6, fontSize: 13 }}>
                      {t('settings.vpn.guide.amnezia')}
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 18 }}>
                      <li>{t('settings.vpn.guide.amnezia.step1')} <a href="https://amnezia.org" target="_blank" rel="noopener noreferrer" style={{ color: C.blue }}>amnezia.org</a></li>
                      <li>{t('settings.vpn.guide.amnezia.step2')}</li>
                      <li>{t('settings.vpn.guide.amnezia.step3')}</li>
                      <li>{t('settings.vpn.guide.amnezia.step4')}</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  vpnGetConfig.refetch().then((r) => {
                    if (r.data?.config) handleVpnDownload(r.data.config);
                  });
                }}
                disabled={vpnGetConfig.isFetching}
                style={{
                  ...btnBase,
                  background: C.surface,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: vpnGetConfig.isFetching ? 0.7 : 1,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t('settings.vpn.download')}
              </button>
              <button
                onClick={() => {
                  vpnGetConfig.refetch().then((r) => {
                    if (r.data?.config) handleShowQr(r.data.config);
                  });
                }}
                disabled={vpnGetConfig.isFetching}
                style={{
                  ...btnBase,
                  background: C.surface,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: vpnGetConfig.isFetching ? 0.7 : 1,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
                {t('settings.vpn.showQr')}
              </button>
              <button
                onClick={() => {
                  if (window.confirm(t('settings.vpn.revokeConfirm'))) {
                    vpnRevoke.mutate();
                  }
                }}
                disabled={vpnRevoke.isPending}
                style={{
                  ...btnBase,
                  background: 'transparent',
                  color: C.accent,
                  border: `1px solid ${C.accent}60`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: vpnRevoke.isPending ? 0.7 : 1,
                }}
              >
                {vpnRevoke.isPending ? (
                  <Spinner size={14} color={C.accent} />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                )}
                {t('settings.vpn.revoke')}
              </button>
            </div>
          </>
        ) : vpnStatus.data?.peer && !vpnStatus.data.peer.active ? (
          /* Revoked state */
          <div style={{
            padding: '24px 20px',
            border: `1px dashed ${C.border}`,
            borderRadius: 14,
            textAlign: 'center',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
              padding: '4px 12px',
              borderRadius: 6,
              background: `${C.accent}15`,
              color: C.accent,
              fontSize: 12,
              fontWeight: 700,
            }}>
              {t('settings.vpn.revoked')}
            </div>
            <p style={{ color: C.sub, fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
              {t('settings.vpn.instructions')}
            </p>
            <button
              onClick={handleVpnGenerate}
              disabled={vpnGenerating}
              style={{
                ...btnBase,
                background: C.blue,
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                opacity: vpnGenerating ? 0.7 : 1,
              }}
            >
              {vpnGenerating ? (
                <><Spinner size={14} color="#fff" /> {t('settings.vpn.generating')}</>
              ) : t('settings.vpn.regenerate')}
            </button>
          </div>
        ) : (
          /* No config state */
          <div style={{
            padding: '24px 20px',
            border: `1px dashed ${C.border}`,
            borderRadius: 14,
            textAlign: 'center',
          }}>
            <p style={{ color: C.sub, fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
              {t('settings.vpn.instructions')}
            </p>
            <button
              onClick={handleVpnGenerate}
              disabled={vpnGenerating}
              style={{
                ...btnBase,
                background: C.blue,
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                opacity: vpnGenerating ? 0.7 : 1,
              }}
            >
              {vpnGenerating ? (
                <><Spinner size={14} color="#fff" /> {t('settings.vpn.generating')}</>
              ) : t('settings.vpn.generate')}
            </button>
          </div>
        )}
      </div>

      {/* QR Code overlay */}
      {qrDataUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setQrDataUrl(null)}
        >
          <div
            style={{
              background: C.surface,
              borderRadius: 16,
              padding: 32,
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: '0 0 16px' }}>
              {t('settings.vpn.qrTitle')}
            </h3>
            <img src={qrDataUrl} alt="QR" decoding="async" width={280} height={280} style={{ width: 280, height: 280 }} />
            <p style={{ marginTop: 12, color: C.sub, fontSize: 13, maxWidth: 280, lineHeight: 1.5 }}>
              {t('settings.vpn.instructions')}
            </p>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* SECTION 4: Theme                                       */}
      {/* ====================================================== */}
      <div style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>{t('settings.themeTitle')}</h2>
        <p style={sectionDescStyle}>{t('settings.themeDesc')}</p>

        {/* Apple-style segmented control for theme */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0,
          padding: '3px',
          borderRadius: 10,
          background: isDark ? 'rgba(255,255,255,.06)' : '#e5e5ea',
        }}>
          <button
            onClick={() => setThemeMode('dark')}
            aria-pressed={themeMode === 'dark'}
            style={{
              padding: '10px 24px',
              minHeight: 44,
              borderRadius: 8,
              border: 'none',
              background: themeMode === 'dark' ? (isDark ? 'rgba(255,255,255,.12)' : '#ffffff') : 'transparent',
              color: themeMode === 'dark' ? textPrimary : textSecondary,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .2s ease',
              boxShadow: themeMode === 'dark' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            {t('settings.dark')}
          </button>

          <button
            onClick={() => setThemeMode('light')}
            aria-pressed={themeMode === 'light'}
            style={{
              padding: '10px 24px',
              minHeight: 44,
              borderRadius: 8,
              border: 'none',
              background: themeMode === 'light' ? (isDark ? 'rgba(255,255,255,.12)' : '#ffffff') : 'transparent',
              color: themeMode === 'light' ? textPrimary : textSecondary,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .2s ease',
              boxShadow: themeMode === 'light' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            {t('settings.light')}
          </button>

          <button
            onClick={() => setThemeMode('system')}
            aria-pressed={themeMode === 'system'}
            style={{
              padding: '10px 24px',
              minHeight: 44,
              borderRadius: 8,
              border: 'none',
              background: themeMode === 'system' ? (isDark ? 'rgba(255,255,255,.12)' : '#ffffff') : 'transparent',
              color: themeMode === 'system' ? textPrimary : textSecondary,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .2s ease',
              boxShadow: themeMode === 'system' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            {t('settings.system')}
          </button>
        </div>
      </div>

      {/* ====================================================== */}
      {/* SECTION 5: Language                                     */}
      {/* ====================================================== */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h2 style={{ ...sectionHeaderStyle, marginBottom: 0 }}>{t('settings.languageTitle')}</h2>
        </div>
        <p style={sectionDescStyle}>{t('settings.languageDescFull')}</p>

        {/* Apple-style segmented language selector */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0,
          padding: '3px',
          borderRadius: 10,
          background: isDark ? 'rgba(255,255,255,.06)' : '#e5e5ea',
          flexWrap: 'wrap',
        }}>
          {([
            { code: 'ru' as const, label: 'RU' },
            { code: 'en' as const, label: 'EN' },
            { code: 'kk' as const, label: 'KZ' },
            { code: 'es' as const, label: 'ES' },
          ]).map(({ code, label }) => (
            <button
              key={code}
              onClick={() => {
                setLanguage(code);
                toast.success(`${t('settings.langChanged')}: ${label}`);
              }}
              aria-pressed={language === code}
              style={{
                padding: '10px 20px',
                minHeight: 44,
                borderRadius: 8,
                border: 'none',
                background: language === code ? (isDark ? 'rgba(255,255,255,.12)' : '#ffffff') : 'transparent',
                color: language === code ? textPrimary : textSecondary,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all .2s ease',
                boxShadow: language === code ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ====================================================== */}
      {/* SECTION 6: Onboarding Tour Replay                      */}
      {/* ====================================================== */}
      <div style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>{t('settings.replayTour')}</h2>
        <p style={sectionDescStyle}>{t('settings.replayTourDesc')}</p>
        <button
          onClick={() => {
            resetOnboarding.mutate(undefined, {
              onSuccess: () => {
                window.dispatchEvent(new Event('tubeforge:replay-onboarding'));
                toast.success(t('settings.replayTour'));
              },
            });
          }}
          disabled={resetOnboarding.isPending}
          style={{
            ...btnBase,
            background: C.surface,
            color: C.text,
            border: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          {resetOnboarding.isPending ? t('common.loading') : t('settings.replayTourBtn')}
        </button>
      </div>

      {/* ====================================================== */}
      {/* SECTION 6b: Push Notifications                         */}
      {/* ====================================================== */}
      <PushNotificationSection C={C} sectionStyle={sectionStyle} sectionHeaderStyle={sectionHeaderStyle} sectionDescStyle={sectionDescStyle} t={t} />

      {/* ====================================================== */}
      {/* SECTION 7: Privacy & Cookies                           */}
      {/* ====================================================== */}
      <div style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>{t('settings.privacy')}</h2>
        <p style={sectionDescStyle}>{t('settings.privacyDesc')}</p>

        {/* Cookie status row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: C.surface,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          marginBottom: 16,
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>
              {t('settings.cookieStatus')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: cookieConsent === 'accepted' ? C.green : C.dim,
                display: 'inline-block',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, color: C.sub }}>
                {cookieConsent === 'accepted' ? t('settings.cookieAccepted') : t('settings.cookieDeclined')}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              const isAccepted = cookieConsent === 'accepted';
              const prefs = { necessary: true, analytics: !isAccepted, marketing: !isAccepted };
              localStorage.setItem('tf-cookie-consent', JSON.stringify(prefs));
              window.dispatchEvent(new Event('tf-consent-changed'));
            }}
            style={{
              ...btnBase,
              background: cookieConsent === 'accepted' ? C.surface : C.accent,
              color: cookieConsent === 'accepted' ? C.text : '#fff',
              border: `1px solid ${cookieConsent === 'accepted' ? C.border : C.accent}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {cookieConsent === 'accepted' ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
                {t('settings.cookieToggleOff')}
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t('settings.cookieToggleOn')}
              </>
            )}
          </button>
        </div>

        {/* Info text */}
        <div style={{
          padding: '14px 18px',
          background: `${C.blue}0a`,
          border: `1px solid ${C.blue}20`,
          borderRadius: 12,
          marginBottom: 16,
          fontSize: 13,
          color: C.sub,
          lineHeight: 1.6,
        }}>
          {t('settings.cookieInfo')}
        </div>

        {/* Privacy policy link */}
        <a
          href="/privacy"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: C.accent,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'opacity .15s',
          }}
        >
          {t('settings.privacyPolicy')}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        </a>
      </div>

      {/* ====================================================== */}
      {/* SECTION 8: Data Export (GDPR)                          */}
      {/* ====================================================== */}
      <div style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>{t('settings.exportData')}</h2>
        <p style={sectionDescStyle}>{t('settings.exportDataDesc')}</p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => {
              exportData.refetch().then((result) => {
                if (result.data) {
                  const json = JSON.stringify(result.data, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `tubeforge-export-${new Date().toISOString().slice(0, 10)}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
              });
            }}
            disabled={exportData.isFetching}
            style={{
              ...btnBase,
              background: C.surface,
              color: C.text,
              border: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: exportData.isFetching ? 0.7 : 1,
              cursor: exportData.isFetching ? 'wait' : 'pointer',
            }}
          >
            {exportData.isFetching ? (
              <>
                <Spinner size={14} color={C.text} />
                {t('settings.exportLoading')}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t('settings.exportData')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ====================================================== */}
      {/* SECTION: API Keys (Studio only)                        */}
      {/* ====================================================== */}
      {plan === 'STUDIO' && (
        <ApiKeysSection C={C} sectionStyle={sectionStyle} sectionHeaderStyle={sectionHeaderStyle} sectionDescStyle={sectionDescStyle} btnBase={btnBase} inputStyle={inputStyle} />
      )}

      {/* ====================================================== */}
      {/* SECTION: SSO Placeholder (Studio only)                 */}
      {/* ====================================================== */}
      {plan === 'STUDIO' && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h2 style={{ ...sectionHeaderStyle, marginBottom: 0 }}>
              {'\u{1F512}'} {t('settings.sso.title') !== 'settings.sso.title' ? t('settings.sso.title') : '\u0415\u0434\u0438\u043D\u044B\u0439 \u0432\u0445\u043E\u0434 (SSO)'}
            </h2>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 50,
              background: `${C.purple}18`,
              color: C.purple,
              letterSpacing: '.03em',
            }}>
              COMING SOON
            </span>
          </div>
          <p style={sectionDescStyle}>
            {'\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u0442\u0435 SSO \u0434\u043B\u044F \u0432\u0430\u0448\u0435\u0439 \u043A\u043E\u043C\u0430\u043D\u0434\u044B'}
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginBottom: 20,
          }}>
            {['Google Workspace', 'Okta', 'Azure AD'].map((provider) => (
              <div key={provider} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: C.surface,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                opacity: 0.6,
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: C.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{provider}</div>
                  <div style={{ fontSize: 12, color: C.dim }}>{'\u041D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u043E'}</div>
                </div>
                <button
                  disabled
                  style={{
                    ...btnBase,
                    padding: '6px 14px',
                    fontSize: 12,
                    background: 'transparent',
                    color: C.dim,
                    border: `1px solid ${C.border}`,
                    cursor: 'not-allowed',
                    opacity: 0.5,
                  }}
                >
                  {'\u041D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C'}
                </button>
              </div>
            ))}
          </div>

          <div style={{
            padding: '14px 18px',
            background: `${C.purple}08`,
            borderRadius: 12,
            border: `1px solid ${C.purple}20`,
            fontSize: 13,
            color: C.sub,
            lineHeight: 1.6,
          }}>
            {'\u0414\u043B\u044F \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 SSO \u0441\u0432\u044F\u0436\u0438\u0442\u0435\u0441\u044C \u0441 \u043D\u0430\u043C\u0438: '}
            <a href="mailto:enterprise@tubeforge.co" style={{ color: C.purple, fontWeight: 600 }}>
              enterprise@tubeforge.co
            </a>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* SECTION: White-Label (Studio only)                     */}
      {/* ====================================================== */}
      {plan === 'STUDIO' && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h2 style={{ ...sectionHeaderStyle, marginBottom: 0 }}>White-Label</h2>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 50,
              background: `${C.purple}18`,
              color: C.purple,
              letterSpacing: '.03em',
            }}>
              COMING SOON
            </span>
          </div>
          <p style={sectionDescStyle}>
            {'\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u0438\u0437\u0438\u0440\u0443\u0439\u0442\u0435 \u0432\u0438\u0434\u0435\u043E \u043F\u043E\u0434 \u0432\u0430\u0448 \u0431\u0440\u0435\u043D\u0434'}
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginBottom: 20,
          }}>
            {[
              { icon: '\u{1F3AC}', text: '\u0423\u0431\u0435\u0440\u0438\u0442\u0435 \u0431\u0440\u0435\u043D\u0434\u0438\u043D\u0433 TubeForge \u0438\u0437 \u0432\u0430\u0448\u0438\u0445 \u0432\u0438\u0434\u0435\u043E' },
              { icon: '\u{1F310}', text: '\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u0442\u0435 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0434\u043E\u043C\u0435\u043D \u0434\u043B\u044F \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438' },
              { icon: '\u{1F3A8}', text: '\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0441\u0432\u043E\u0439 \u043B\u043E\u0433\u043E\u0442\u0438\u043F \u0438 \u0446\u0432\u0435\u0442\u043E\u0432\u0443\u044E \u0441\u0445\u0435\u043C\u0443' },
            ].map((item) => (
              <div key={item.text} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: C.surface,
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                opacity: 0.65,
              }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: C.text }}>{item.text}</span>
              </div>
            ))}
          </div>

          <div style={{
            padding: '14px 18px',
            background: `${C.purple}08`,
            borderRadius: 12,
            border: `1px solid ${C.purple}20`,
            fontSize: 13,
            color: C.sub,
            lineHeight: 1.6,
          }}>
            {'\u0414\u043B\u044F \u0430\u043A\u0442\u0438\u0432\u0430\u0446\u0438\u0438 White-Label \u0441\u0432\u044F\u0436\u0438\u0442\u0435\u0441\u044C \u0441 \u043D\u0430\u043C\u0438: '}
            <a href="mailto:enterprise@tubeforge.co" style={{ color: C.purple, fontWeight: 600 }}>
              enterprise@tubeforge.co
            </a>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* SECTION: Enterprise Admin Console                      */}
      {/* ====================================================== */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h2 style={{ ...sectionHeaderStyle, marginBottom: 0 }}>Enterprise</h2>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 50,
            background: `${C.blue}18`,
            color: C.blue,
            letterSpacing: '.03em',
          }}>
            ENTERPRISE
          </span>
        </div>
        <p style={sectionDescStyle}>
          {'\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u0439, \u043E\u0442\u0447\u0451\u0442\u043D\u043E\u0441\u0442\u044C, \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C'}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
          gap: 10,
          marginBottom: 20,
        }}>
          {[
            { icon: '\u{1F465}', title: 'Team Management', desc: '\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430\u043C\u0438 \u0438 \u0440\u043E\u043B\u044F\u043C\u0438' },
            { icon: '\u{1F4CA}', title: 'Usage Reports', desc: '\u041E\u0442\u0447\u0451\u0442\u044B \u043E\u0431 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0438' },
            { icon: '\u{1F6E1}\uFE0F', title: 'IP Whitelist', desc: '\u041E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043F\u043E IP' },
            { icon: '\u{23F1}\uFE0F', title: 'Session Timeout', desc: '\u0410\u0432\u0442\u043E-\u0432\u044B\u0445\u043E\u0434 \u0438\u0437 \u043D\u0435\u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u0441\u0435\u0441\u0441\u0438\u0439' },
          ].map((feature) => (
            <div key={feature.title} style={{
              padding: '16px',
              background: C.surface,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              opacity: 0.6,
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{feature.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{feature.title}</div>
              <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.4 }}>{feature.desc}</div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '14px 18px',
          background: `${C.blue}08`,
          borderRadius: 12,
          border: `1px solid ${C.blue}20`,
          fontSize: 13,
          color: C.sub,
          lineHeight: 1.6,
        }}>
          {'\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E \u0432 Enterprise \u043F\u043B\u0430\u043D\u0435 \u2014 \u0441\u0432\u044F\u0436\u0438\u0442\u0435\u0441\u044C \u0441 \u043D\u0430\u043C\u0438: '}
          <a href="mailto:enterprise@tubeforge.co" style={{ color: C.blue, fontWeight: 600 }}>
            enterprise@tubeforge.co
          </a>
        </div>
      </div>

      {/* ====================================================== */}
      {/* SECTION 9b: AI Voice (Z3 placeholder)                  */}
      {/* ====================================================== */}
      {plan === 'STUDIO' && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h2 style={{ ...sectionHeaderStyle, marginBottom: 0 }}>AI Голос</h2>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              background: `${C.purple}15`, color: C.purple,
            }}>
              STUDIO
            </span>
          </div>
          <p style={sectionDescStyle}>
            Клонирование голоса и озвучка с помощью ИИ. Создайте уникальный голос для вашего канала.
          </p>

          <div style={{
            padding: '20px 24px',
            background: C.surface,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: C.purple + '12',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                  Клонирование голоса — скоро
                </div>
                <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
                  Загрузите образец вашего голоса, и ИИ создаст озвучку для всех ваших видео.
                </div>
              </div>
            </div>

            <VoiceCloneStatusBadge C={C} />
          </div>

          <div style={{
            padding: '14px 18px',
            background: C.bg,
            borderRadius: 10,
            border: `1px dashed ${C.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.dim }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Мы работаем над интеграцией с ElevenLabs. Функция будет доступна в ближайшем обновлении.
            </div>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* SECTION: Integrations (Zapier, Make.com)               */}
      {/* ====================================================== */}
      <div style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>{t('settings.integrations')}</h2>
        <p style={sectionDescStyle}>{t('settings.integrationsDesc')}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Zapier */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 18px', borderRadius: 12,
            background: C.surface, border: `1px solid ${C.border}`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: '#ff4a00', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <path d="M15.54 8.46l-2.83 2.83L15.54 14.12l1.41-1.41-1.41-1.42 1.41-1.41-1.41-1.42zM8.46 15.54l2.83-2.83L8.46 9.88 7.05 11.29l1.41 1.42-1.41 1.41 1.41 1.42zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>Zapier</div>
              <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{t('settings.zapierDesc')}</div>
            </div>
            <a
              href="https://zapier.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: `1px solid ${C.border}`, background: 'transparent',
                color: C.sub, fontSize: 12, fontWeight: 600,
                textDecoration: 'none', flexShrink: 0,
                transition: 'all .15s',
              }}
            >
              zapier.com
            </a>
          </div>

          {/* Make.com */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 18px', borderRadius: 12,
            background: C.surface, border: `1px solid ${C.border}`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: '#6d28d9', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>Make.com</div>
              <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{t('settings.makeDesc')}</div>
            </div>
            <a
              href="https://make.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: `1px solid ${C.border}`, background: 'transparent',
                color: C.sub, fontSize: 12, fontWeight: 600,
                textDecoration: 'none', flexShrink: 0,
                transition: 'all .15s',
              }}
            >
              make.com
            </a>
          </div>
        </div>

        <div style={{
          marginTop: 14, padding: '12px 16px', borderRadius: 10,
          background: `${C.blue}08`, border: `1px solid ${C.blue}15`,
          fontSize: 12, color: C.sub, lineHeight: 1.6,
        }}>
          {t('settings.integrationsNote')}
        </div>
      </div>

      {/* ====================================================== */}
      {/* SECTION: Your Year in TubeForge (Wrapped)              */}
      {/* ====================================================== */}
      <WrappedSection
        C={C}
        isDark={isDark}
        sectionStyle={sectionStyle}
        sectionHeaderStyle={sectionHeaderStyle}
        sectionDescStyle={sectionDescStyle}
      />

      {/* ====================================================== */}
      {/* SECTION 10: Account (Danger Zone)                      */}
      {/* ====================================================== */}
      <div style={{
        ...sectionStyle,
        borderColor: isDark ? 'rgba(220, 38, 38, 0.25)' : 'rgba(220, 38, 38, 0.2)',
        borderWidth: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h2 style={{ ...sectionHeaderStyle, color: '#dc2626', marginBottom: 0 }}>
            {t('settings.account')}
          </h2>
        </div>
        <p style={sectionDescStyle}>{t('settings.accountDesc')}</p>

        {/* Logout row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          paddingBottom: 20,
          borderBottom: `1px solid ${C.border}`,
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, margin: 0, color: C.text }}>
              {t('settings.logout')}
            </p>
            <p style={{ color: C.sub, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
              {t('settings.logoutDesc')}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{
              ...btnBase,
              background: C.surface,
              color: C.text,
              border: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {t('settings.logoutBtn')}
          </button>
        </div>

        {/* Delete account row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: C.accent, margin: 0 }}>
              {t('settings.deleteTitle')}
            </p>
            <p style={{ color: C.sub, fontSize: 12, margin: 0, maxWidth: 360, lineHeight: 1.5, marginTop: 4 }}>
              {t('settings.deleteDesc')}
            </p>
          </div>
          {showDeleteConfirm ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minWidth: 220,
              padding: '16px',
              background: `${C.accent}08`,
              borderRadius: 12,
              border: `1px solid ${C.accent}25`,
            }}>
              <p style={{ fontSize: 12, color: C.accent, margin: 0, fontWeight: 600 }}>
                {t('settings.deleteConfirm')}
              </p>
              <input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                autoFocus
                aria-label={t('settings.deleteConfirm')}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `1px solid ${C.accent}40`,
                  background: C.surface,
                  color: C.text,
                  fontSize: 14,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  letterSpacing: 2,
                  textAlign: 'center',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                  style={{
                    ...btnBase,
                    flex: 1,
                    padding: '10px',
                    fontSize: 13,
                    background: C.surface,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  {t('settings.cancel')}
                </button>
                <button
                  onClick={() => { if (deleteInput === 'DELETE') deleteAccount.mutate(); }}
                  disabled={deleteInput !== 'DELETE' || deleteAccount.isPending}
                  style={{
                    ...btnBase,
                    flex: 1,
                    padding: '10px',
                    fontSize: 13,
                    background: deleteInput === 'DELETE' ? C.accent : C.surface,
                    color: deleteInput === 'DELETE' ? '#fff' : C.dim,
                    border: `1px solid ${deleteInput === 'DELETE' ? C.accent : C.border}`,
                    cursor: deleteInput === 'DELETE' && !deleteAccount.isPending ? 'pointer' : 'not-allowed',
                    opacity: deleteInput === 'DELETE' ? 1 : 0.5,
                  }}
                >
                  {deleteAccount.isPending ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      <Spinner size={12} color="#fff" /> {t('settings.loading')}
                    </span>
                  ) : t('settings.deleteForever')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                ...btnBase,
                background: 'transparent',
                color: C.accent,
                border: `1px solid ${C.accent}60`,
              }}
            >
              {t('settings.deleteBtn')}
            </button>
          )}
        </div>
      </div>

      {/* Bottom spacer */}
      <div style={{ height: 40 }} />
    </div>
  );
}

/* ── Sub-components ─────────────────────────────── */

/** Animated spinner */
function Spinner({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

/** Usage progress bar */
function UsageBar({ C, label, used, limit }: { C: Theme; label: string; used: number; limit: number }) {
  const t = useLocaleStore((s) => s.t);
  const pct = Math.min(100, (used / limit) * 100);
  const isHigh = pct >= 80;
  const isFull = pct >= 100;
  return (
    <div style={{ flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>{label}</span>
        <span style={{
          fontSize: 12,
          color: isFull ? C.accent : isHigh ? C.orange : C.dim,
          fontWeight: 700,
        }}>
          {used}/{limit}
        </span>
      </div>
      <div style={{
        height: 8,
        borderRadius: 4,
        background: C.surface,
        overflow: 'hidden',
        border: `1px solid ${C.border}`,
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 4,
          background: isFull
            ? C.accent
            : isHigh
              ? C.orange
              : C.blue,
          transition: 'width .4s ease, background .3s ease',
        }} />
      </div>
      {isFull && (
        <span style={{ fontSize: 10, color: C.accent, marginTop: 4, display: 'block', fontWeight: 600 }}>
          {t('settings.limitReached')}
        </span>
      )}
    </div>
  );
}

/** Error row with retry */
function ErrorRow({ C, btnBase, message, onRetry }: { C: Theme; btnBase: React.CSSProperties; message: string; onRetry: () => void }) {
  const t = useLocaleStore((s) => s.t);
  return (
    <div style={{
      padding: '16px 18px',
      background: `${C.accent}08`,
      border: `1px solid ${C.accent}25`,
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span style={{ color: C.sub, fontSize: 13, flex: 1 }}>{message}</span>
      <button
        onClick={onRetry}
        style={{
          ...btnBase,
          padding: '6px 14px',
          fontSize: 12,
          background: C.surface,
          color: C.text,
          border: `1px solid ${C.border}`,
        }}
      >
        {t('settings.retry')}
      </button>
    </div>
  );
}

/** Profile section skeleton */
function ProfileSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <Skeleton width={72} height={72} style={{ borderRadius: 20 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <Skeleton width={60} height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={44} style={{ borderRadius: 10 }} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <Skeleton width={50} height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={44} style={{ borderRadius: 10 }} />
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <Skeleton width="100%" height={70} style={{ borderRadius: 12 }} />
        </div>
      </div>
    </div>
  );
}

/** Subscription section skeleton */
function SubscriptionSkeleton() {
  return (
    <div>
      <Skeleton width="100%" height={84} style={{ borderRadius: 14, marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <Skeleton width="50%" height={50} style={{ borderRadius: 10 }} />
        <Skeleton width="50%" height={50} style={{ borderRadius: 10 }} />
      </div>
      <Skeleton width="100%" height={100} style={{ borderRadius: 12, marginBottom: 16 }} />
      <Skeleton width={140} height={40} style={{ borderRadius: 10 }} />
    </div>
  );
}

/** Push notification settings section */
function PushNotificationSection({
  C,
  sectionStyle,
  sectionHeaderStyle,
  sectionDescStyle,
  t,
}: {
  C: Theme;
  sectionStyle: React.CSSProperties;
  sectionHeaderStyle: React.CSSProperties;
  sectionDescStyle: React.CSSProperties;
  t: (key: string) => string;
}) {
  const { isSupported, isEnabled, isDenied, enable, disable } = usePushNotifications();

  if (!isSupported) return null;

  return (
    <div style={sectionStyle}>
      <h2 style={sectionHeaderStyle}>{t('settings.pushNotifications')}</h2>
      <p style={sectionDescStyle}>{t('settings.pushNotificationsDesc')}</p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
            {t('settings.pushLabel')}
          </span>
        </div>

        {isDenied ? (
          <span style={{ fontSize: 12, color: C.dim, fontStyle: 'italic' }}>
            {t('settings.pushDenied')}
          </span>
        ) : (
          <button
            onClick={() => (isEnabled ? disable() : enable())}
            style={{
              position: 'relative',
              width: 44,
              height: 24,
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              background: isEnabled ? '#6366f1' : C.border,
              transition: 'background .2s',
              padding: 0,
              flexShrink: 0,
            }}
            aria-label={isEnabled ? t('settings.pushDisable') : t('settings.pushEnable')}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: isEnabled ? 22 : 2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left .2s',
                boxShadow: '0 1px 3px rgba(0,0,0,.2)',
              }}
            />
          </button>
        )}
      </div>
    </div>
  );
}

/** Email notification preferences section — persisted in localStorage */
function EmailNotificationSection({
  C,
  sectionStyle,
  sectionHeaderStyle,
  sectionDescStyle,
  t,
}: {
  C: Theme;
  sectionStyle: React.CSSProperties;
  sectionHeaderStyle: React.CSSProperties;
  sectionDescStyle: React.CSSProperties;
  t: (key: string) => string;
}) {
  const STORAGE_KEY = 'tf-email-notif-prefs';

  const getPrefs = useCallback(() => {
    if (typeof window === 'undefined') return { marketing: false, product: true, security: true };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as { marketing: boolean; product: boolean; security: boolean };
    } catch { /* ignore */ }
    return { marketing: false, product: true, security: true };
  }, []);

  const [prefs, setPrefs] = useState(getPrefs);

  const togglePref = useCallback((key: 'marketing' | 'product' | 'security') => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const items: { key: 'marketing' | 'product' | 'security'; label: string; desc: string }[] = [
    { key: 'marketing', label: t('settings.emailMarketing'), desc: t('settings.emailMarketingDesc') },
    { key: 'product', label: t('settings.emailProduct'), desc: t('settings.emailProductDesc') },
    { key: 'security', label: t('settings.emailSecurity'), desc: t('settings.emailSecurityDesc') },
  ];

  return (
    <div style={sectionStyle}>
      <h2 style={sectionHeaderStyle}>{t('settings.emailNotifications')}</h2>
      <p style={sectionDescStyle}>{t('settings.emailNotificationsDesc')}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(({ key, label, desc }) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              padding: '14px 18px',
              background: C.surface,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{desc}</div>
            </div>
            <button
              onClick={() => togglePref(key)}
              style={{
                position: 'relative',
                width: 44,
                height: 24,
                borderRadius: 12,
                border: 'none',
                cursor: key === 'security' ? 'not-allowed' : 'pointer',
                background: prefs[key] ? '#6366f1' : C.border,
                transition: 'background .2s',
                padding: 0,
                flexShrink: 0,
                opacity: key === 'security' ? 0.7 : 1,
              }}
              disabled={key === 'security'}
              aria-label={label}
              title={key === 'security' ? 'Always enabled for your safety' : undefined}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: prefs[key] ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left .2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Channels section skeleton */
function ChannelsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14 }}>
          <Skeleton width={44} height={44} style={{ borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
            <Skeleton width="30%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Wrapped section — Your Year in TubeForge */
function WrappedSection({
  C,
  isDark,
  sectionStyle,
  sectionHeaderStyle,
  sectionDescStyle,
}: {
  C: Theme;
  isDark: boolean;
  sectionStyle: React.CSSProperties;
  sectionHeaderStyle: React.CSSProperties;
  sectionDescStyle: React.CSSProperties;
}) {
  const profile = trpc.user.getProfile.useQuery();
  const user = profile.data;

  if (!user) return null;

  // Only show if user has been active > 30 days
  const createdAt = user.createdAt ? new Date(user.createdAt as string | number | Date) : null;
  if (!createdAt) return null;

  const daysSinceCreation = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreation < 30) return null;

  const projectCount = user._count?.projects ?? 0;
  const aiUsage = (user as Record<string, unknown>).aiUsage as number ?? 0;

  const statItems = [
    {
      icon: '\uD83C\uDFAC',
      label: '\u041F\u0440\u043E\u0435\u043A\u0442\u043E\u0432 \u0441\u043E\u0437\u0434\u0430\u043D\u043E',
      value: String(projectCount),
      gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
    },
    {
      icon: '\u2728',
      label: 'AI \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0439',
      value: String(aiUsage),
      gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    },
    {
      icon: '\uD83D\uDCC5',
      label: '\u0414\u043D\u0435\u0439 \u0441 \u043D\u0430\u043C\u0438',
      value: String(daysSinceCreation),
      gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
    },
  ];

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h2 style={{ ...sectionHeaderStyle, marginBottom: 0 }}>
          {'\u0412\u0430\u0448 \u0433\u043E\u0434 \u0432 TubeForge'}
        </h2>
        <span style={{ fontSize: 16 }}>{'\uD83C\uDF89'}</span>
      </div>
      <p style={sectionDescStyle}>
        {'\u0412\u0430\u0448\u0430 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B'}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
      }}>
        {statItems.map((item) => (
          <div
            key={item.label}
            style={{
              background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)',
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: '20px 16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
            <div style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-.03em',
              background: item.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 4,
            }}>
              {item.value}
            </div>
            <div style={{
              fontSize: 12,
              fontWeight: 500,
              color: C.sub,
              letterSpacing: '.01em',
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** API Keys management section — only rendered for STUDIO plan users */
function ApiKeysSection({
  C,
  sectionStyle,
  sectionHeaderStyle,
  sectionDescStyle,
  btnBase,
  inputStyle,
}: {
  C: Theme;
  sectionStyle: React.CSSProperties;
  sectionHeaderStyle: React.CSSProperties;
  sectionDescStyle: React.CSSProperties;
  btnBase: React.CSSProperties;
  inputStyle: React.CSSProperties;
}) {
  const t = useLocaleStore((s) => s.t);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const apiKeys = trpc.apikey.list.useQuery();
  const apiUsage = trpc.apikey.usage.useQuery();

  const generateKey = trpc.apikey.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedKey(data.key);
      setNewKeyLabel('');
      apiKeys.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const revokeKey = trpc.apikey.revoke.useMutation({
    onSuccess: () => {
      toast.success('API key revoked');
      apiKeys.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h2 style={{ ...sectionHeaderStyle, marginBottom: 0 }}>API Keys</h2>
        <a
          href="/api-docs"
          style={{
            fontSize: 12,
            color: C.blue,
            textDecoration: 'none',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 4,
            background: `${C.blue}10`,
          }}
        >
          Docs
        </a>
      </div>
      <p style={sectionDescStyle}>
        Manage API keys for programmatic access. Keys are shown only once after generation.
      </p>

      {/* API Usage */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: C.surface,
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        marginBottom: 16,
        fontSize: 13,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20V10" />
          <path d="M18 20V4" />
          <path d="M6 20v-4" />
        </svg>
        <span style={{ color: C.sub }}>API calls this month:</span>
        <strong style={{ color: C.text }}>{apiUsage.data?.count ?? 0}</strong>
      </div>

      {/* Generated key alert */}
      {generatedKey && (
        <div style={{
          padding: '16px 20px',
          background: `${C.green}0a`,
          border: `1px solid ${C.green}30`,
          borderRadius: 12,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Key generated! Copy it now — it will not be shown again.
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{
              flex: 1,
              padding: '10px 14px',
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: C.text,
              wordBreak: 'break-all',
              lineHeight: 1.5,
            }}>
              {generatedKey}
            </code>
            <button
              onClick={() => handleCopy(generatedKey)}
              style={{
                ...btnBase,
                padding: '10px 16px',
                background: copied ? C.green : C.surface,
                color: copied ? '#fff' : C.text,
                border: `1px solid ${copied ? C.green : C.border}`,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => setGeneratedKey(null)}
            style={{
              marginTop: 10,
              background: 'none',
              border: 'none',
              color: C.sub,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Generate new key */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        <input
          type="text"
          value={newKeyLabel}
          onChange={(e) => setNewKeyLabel(e.target.value)}
          placeholder="Key label (e.g. 'Production')"
          maxLength={50}
          style={{ ...inputStyle, flex: 1, minWidth: 180 }}
        />
        <button
          onClick={() => generateKey.mutate({ label: newKeyLabel || undefined })}
          disabled={generateKey.isPending}
          style={{
            ...btnBase,
            background: C.blue,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
            opacity: generateKey.isPending ? 0.7 : 1,
          }}
        >
          {generateKey.isPending ? (
            <ApiKeySpinner size={14} color="#fff" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
          Generate Key
        </button>
      </div>

      {/* Key list */}
      {apiKeys.isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16 }}>
          <ApiKeySpinner size={16} color={C.sub} />
          <span style={{ fontSize: 13, color: C.sub }}>{t('settings.loading')}</span>
        </div>
      ) : apiKeys.data && apiKeys.data.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {apiKeys.data.map((k) => (
            <div
              key={k.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: C.surface,
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                flexWrap: 'wrap',
              }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: C.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{k.label}</div>
                <div style={{ fontSize: 12, color: C.dim, fontFamily: 'monospace' }}>
                  tf_{'*'.repeat(8)}{k.last4}
                  <span style={{ marginLeft: 10, fontFamily: 'inherit', color: C.sub }}>
                    Created {new Date(k.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Revoke this API key? This cannot be undone.')) {
                    revokeKey.mutate({ id: k.id });
                  }
                }}
                disabled={revokeKey.isPending}
                style={{
                  ...btnBase,
                  padding: '6px 14px',
                  fontSize: 12,
                  background: 'transparent',
                  color: C.accent,
                  border: `1px solid ${C.accent}40`,
                }}
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: '24px',
          border: `1px dashed ${C.border}`,
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: C.bg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          <p style={{ color: C.sub, fontSize: 13, margin: 0 }}>
            No API keys yet. Generate one to get started.
          </p>
        </div>
      )}
    </div>
  );
}

/** Z3: Voice clone status badge — checks ElevenLabs API key on server */
function VoiceCloneStatusBadge({ C }: { C: Theme }) {
  const status = trpc.ai.checkVoiceCloneStatus.useQuery(undefined, { retry: false });
  if (status.isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: C.bg, borderRadius: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid transparent', borderTopColor: C.dim, animation: 'spin .8s linear infinite', display: 'inline-block' }} />
        <span style={{ fontSize: 12, color: C.dim }}>Проверка...</span>
      </div>
    );
  }
  if (status.data?.available) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: `${C.green}0a`, borderRadius: 8, border: `1px solid ${C.green}25` }}>
        <span style={{ fontSize: 14, color: C.green }}>&#10003;</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.green }}>API подключён</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 14, color: C.dim }}>&#9679;</span>
      <span style={{ fontSize: 12, color: C.sub }}>Для активации свяжитесь с поддержкой</span>
    </div>
  );
}

/** Small spinner for API keys section */
function ApiKeySpinner({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
