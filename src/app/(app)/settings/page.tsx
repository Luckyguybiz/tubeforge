'use client';

import { useState, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { signOut, useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Theme } from '@/lib/types';

/* ── Plan feature lists ──────────────────────────── */
const PLAN_FEATURES: Record<string, string[]> = {
  FREE: [
    '3 проекта',
    '5 ИИ-генераций в месяц',
    'Базовые шаблоны',
    'Водяной знак на экспорте',
  ],
  PRO: [
    '25 проектов',
    '100 ИИ-генераций в месяц',
    'Приоритетная генерация',
    'Экспорт без водяного знака',
    'Расширенные шаблоны',
  ],
  STUDIO: [
    'Безлимитные проекты',
    'Безлимитные ИИ-генерации',
    'Командная работа',
    'API-доступ',
    'Приоритетная поддержка',
    'Все шаблоны и функции',
  ],
};

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

export default function SettingsPage() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const toggle = useThemeStore((s) => s.toggle);

  const language = useLocaleStore((s) => s.locale);
  const setLanguage = useLocaleStore((s) => s.setLocale);
  const t = useLocaleStore((s) => s.t);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

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

  const handleNameBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val && val !== profile.data?.name) updateProfile.mutate({ name: val });
  }, [profile.data?.name, updateProfile]);

  /* ── Shared styles ──────────────────────────── */

  const sectionStyle: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: 28,
    marginBottom: 20,
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: 17,
    fontWeight: 700,
    color: C.text,
    margin: 0,
    marginBottom: 6,
  };

  const sectionDescStyle: React.CSSProperties = {
    fontSize: 13,
    color: C.sub,
    margin: 0,
    marginBottom: 20,
    lineHeight: 1.5,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: C.sub,
    marginBottom: 6,
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
  };

  const readOnlyInputStyle: React.CSSProperties = {
    ...inputStyle,
    color: C.dim,
    cursor: 'not-allowed',
    background: C.bg,
    borderStyle: 'dashed',
    paddingRight: 36,
  };

  const btnBase: React.CSSProperties = {
    padding: '10px 24px',
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

  const authProvider = session.data?.user?.image?.includes('google')
    ? 'Google'
    : session.data?.user?.image?.includes('github')
      ? 'GitHub'
      : 'OAuth';

  const userImage = profile.data?.image ?? session.data?.user?.image ?? null;
  const userName = profile.data?.name ?? session.data?.user?.name ?? '';
  const userEmail = profile.data?.email ?? session.data?.user?.email ?? '';

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
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
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 24 }}>
              {/* Avatar */}
              <div style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                overflow: 'hidden',
                flexShrink: 0,
                background: C.surface,
                border: `2px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
                {/* Google icon */}
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
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Google</div>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px 16px' }}>
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
                    {(ch.subscribers ?? 0).toLocaleString('ru-RU')} {t('settings.subscribers')}
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
      {/* SECTION 4: Theme                                       */}
      {/* ====================================================== */}
      <div style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>{t('settings.themeTitle')}</h2>
        <p style={sectionDescStyle}>{t('settings.themeDesc')}</p>

        <div style={{ display: 'flex', gap: 12 }}>
          {/* Dark theme option */}
          <button
            onClick={() => { if (!isDark) toggle(); }}
            aria-pressed={isDark}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: 14,
              border: `2px solid ${isDark ? C.accent : C.border}`,
              background: isDark ? `${C.accent}08` : C.surface,
              cursor: 'pointer',
              textAlign: 'center',
              fontFamily: 'inherit',
              transition: 'border-color .15s, background .15s',
            }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#111119',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              border: '1px solid #1e1e2e',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e8e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>
              {t('settings.dark')}
            </div>
            <div style={{ fontSize: 11, color: C.sub }}>
              {t('settings.darkDesc')}
            </div>
            {isDark && (
              <div style={{
                marginTop: 8,
                padding: '3px 10px',
                borderRadius: 6,
                background: C.accentDim,
                color: C.accent,
                fontSize: 10,
                fontWeight: 700,
                display: 'inline-block',
                letterSpacing: 0.3,
              }}>
                {t('settings.activeTheme')}
              </div>
            )}
          </button>

          {/* Light theme option */}
          <button
            onClick={() => { if (isDark) toggle(); }}
            aria-pressed={!isDark}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: 14,
              border: `2px solid ${!isDark ? C.accent : C.border}`,
              background: !isDark ? `${C.accent}08` : C.surface,
              cursor: 'pointer',
              textAlign: 'center',
              fontFamily: 'inherit',
              transition: 'border-color .15s, background .15s',
            }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#f3f3f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              border: '1px solid #d4d4de',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>
              {t('settings.light')}
            </div>
            <div style={{ fontSize: 11, color: C.sub }}>
              {t('settings.lightDesc')}
            </div>
            {!isDark && (
              <div style={{
                marginTop: 8,
                padding: '3px 10px',
                borderRadius: 6,
                background: C.accentDim,
                color: C.accent,
                fontSize: 10,
                fontWeight: 700,
                display: 'inline-block',
                letterSpacing: 0.3,
              }}>
                {t('settings.activeTheme')}
              </div>
            )}
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

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {([
            { code: 'ru' as const, label: 'Русский', flag: 'RU' },
            { code: 'en' as const, label: 'English', flag: 'EN' },
            { code: 'kk' as const, label: 'Қазақша', flag: 'KZ' },
            { code: 'es' as const, label: 'Español', flag: 'ES' },
          ]).map(({ code, label, flag }) => (
            <button
              key={code}
              onClick={() => {
                setLanguage(code);
                toast.success(`${t('settings.langChanged')}: ${label}`);
              }}
              aria-pressed={language === code}
              style={{
                ...btnBase,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 20px',
                minWidth: 110,
                background: language === code ? `${C.accent}0c` : C.surface,
                color: language === code ? C.text : C.sub,
                border: `2px solid ${language === code ? C.accent : C.border}`,
                borderRadius: 12,
                transition: 'border-color .15s, background .15s, color .15s',
              }}
            >
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                background: language === code ? C.accent : C.dim,
                color: '#fff',
                borderRadius: 4,
                padding: '2px 6px',
                letterSpacing: 0.5,
              }}>
                {flag}
              </span>
              <span style={{ fontSize: 14 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ====================================================== */}
      {/* SECTION 6: Account (Danger Zone)                       */}
      {/* ====================================================== */}
      <div style={{
        ...sectionStyle,
        borderColor: `${C.accent}30`,
      }}>
        <h2 style={{ ...sectionHeaderStyle, color: C.accent }}>{t('settings.account')}</h2>
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
