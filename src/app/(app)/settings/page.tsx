'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { signOut, useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui';
import type { Theme } from '@/lib/types';

export default function SettingsPage() {
  const C = useThemeStore((s) => s.theme);
  const [language, setLanguage] = useState<'ru' | 'en'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tubeforge-lang');
      if (saved === 'en') return 'en';
    }
    return 'ru';
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const session = useSession();
  const profile = trpc.user.getProfile.useQuery();
  const subscription = trpc.billing.getSubscription.useQuery();

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => toast.success('Профиль обновлён'),
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

  const sectionStyle: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: 28,
    marginBottom: 20,
  };

  // Fix #6: Use sentence case labels instead of UPPERCASE
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
  };

  // Fix #2: Visually distinct read-only field style
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
    transition: 'opacity .15s',
  };

  const plan = subscription.data?.plan ?? profile.data?.plan ?? 'FREE';
  const hasSub = !!subscription.data?.subscription;

  // Derive auth provider from session
  const authProvider = session.data?.user?.image?.includes('google') ? 'Google' : session.data?.user?.image?.includes('github') ? 'GitHub' : 'OAuth';

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Fix #16: Removed duplicate "Настройки" heading — TopBar already shows it */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: C.sub, fontSize: 14, margin: 0 }}>Управление аккаунтом и предпочтениями</p>
      </div>

      {/* ===== SECTION: Profile ===== */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Профиль</h2>
        {profile.isLoading ? (
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}><Skeleton width="100%" height="42px" /></div>
            <div style={{ flex: 1 }}><Skeleton width="100%" height="42px" /></div>
          </div>
        ) : profile.isError ? (
          <div style={{ padding: 16, background: `${C.accent}11`, border: `1px solid ${C.accent}33`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: C.accent, fontSize: 16 }}>&#9888;</span>
            <span style={{ color: C.sub, fontSize: 13 }}>Не удалось загрузить профиль.</span>
            <button onClick={() => profile.refetch()} style={{ ...btnBase, padding: '6px 14px', fontSize: 12, background: C.surface, color: C.text, border: `1px solid ${C.border}`, marginLeft: 'auto' }}>Повторить</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              {/* Fix #13: Proper label+id association for accessibility */}
              <label htmlFor="settings-name" style={labelStyle}>Имя</label>
              <input
                id="settings-name"
                aria-label="Имя пользователя"
                maxLength={50}
                style={inputStyle}
                defaultValue={profile.data?.name ?? ''}
                placeholder="Введите имя"
                onBlur={(e) => {
                  // Fix #1: Save on blur + toast feedback
                  const val = e.target.value.trim();
                  if (val && val !== profile.data?.name) updateProfile.mutate({ name: val });
                }}
              />
              {/* Fix #1: Hint about auto-save */}
              <span style={{ fontSize: 10, color: C.dim, marginTop: 4, display: 'block' }}>Сохраняется автоматически</span>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              {/* Fix #13: Proper label association */}
              <label htmlFor="settings-email" style={labelStyle}>Почта</label>
              <div style={{ position: 'relative' }}>
                {/* Fix #2: Distinct read-only styling */}
                <input
                  id="settings-email"
                  aria-label="Электронная почта (только чтение)"
                  aria-readonly="true"
                  style={readOnlyInputStyle}
                  value={profile.data?.email ?? ''}
                  readOnly
                  tabIndex={-1}
                />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.dim, pointerEvents: 'none' }}>&#x1F512;</span>
              </div>
              {/* Fix #17: Show auth provider */}
              <span style={{ fontSize: 10, color: C.dim, marginTop: 4, display: 'block' }}>Вход через {authProvider}</span>
            </div>
          </div>
        )}
      </div>

      {/* ===== SECTION: Preferences (Language) ===== */}
      {/* Fix #18: Grouped preferences together */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Язык интерфейса</h2>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.orange, background: `${C.orange}18`, padding: '2px 8px', borderRadius: 4 }}>Скоро</span>
        </div>
        <p style={{ color: C.sub, fontSize: 13, marginBottom: 16 }}>Выберите предпочтительный язык интерфейса</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Fix #7: More balanced active/inactive button styles */}
          {(['ru', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                localStorage.setItem('tubeforge-lang', lang);
              }}
              aria-pressed={language === lang}
              style={{
                ...btnBase,
                background: language === lang ? C.accent : `${C.accent}0a`,
                color: language === lang ? '#fff' : C.text,
                border: `1px solid ${language === lang ? C.accent : C.border}`,
                minWidth: 100,
                opacity: language === lang ? 1 : 0.8,
              }}
            >
              {lang === 'ru' ? 'Русский' : 'English'}
            </button>
          ))}
        </div>
      </div>

      {/* Fix #3: Theme section REMOVED — toggle already exists in TopBar header */}
      {/* Theme is accessible via the sun/moon icon in the top bar at all times */}

      {/* ===== SECTION: Integrations (Channels) ===== */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Подключённые каналы</h2>
        {profile.data?.channels && profile.data.channels.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {profile.data.channels.map((ch) => (
              <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
                {ch.thumbnail && <img src={ch.thumbnail} alt={ch.title} loading="lazy" style={{ width: 36, height: 36, borderRadius: '50%' }} />}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{ch.title}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>{ch.subscribers?.toLocaleString() ?? 0} подписчиков</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 24, border: `1px dashed ${C.border}`, borderRadius: 12, textAlign: 'center' }}>
            {/* Fix #8: YouTube play icon instead of TV emoji */}
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#ff0000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, opacity: 0.6 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z"/></svg>
            </div>
            <p style={{ color: C.sub, fontSize: 14, marginBottom: 16 }}>Каналы пока не подключены</p>
            <button
              onClick={() => toast.info('Подключение YouTube-канала будет доступно в ближайшем обновлении')}
              style={{ ...btnBase, background: C.surface, color: C.text, border: `1px solid ${C.border}` }}
            >
              Подключить YouTube-канал
            </button>
          </div>
        )}
      </div>

      {/* ===== SECTION: Subscription ===== */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Подписка</h2>
        {subscription.isLoading ? (
          <Skeleton width="100%" height="60px" />
        ) : subscription.isError ? (
          <div style={{ padding: 16, background: `${C.accent}11`, border: `1px solid ${C.accent}33`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: C.accent, fontSize: 16 }}>&#9888;</span>
            <span style={{ color: C.sub, fontSize: 13 }}>Не удалось загрузить подписку.</span>
            <button onClick={() => subscription.refetch()} style={{ ...btnBase, padding: '6px 14px', fontSize: 12, background: C.surface, color: C.text, border: `1px solid ${C.border}`, marginLeft: 'auto' }}>Повторить</button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Текущий план:</span>
              <span style={{
                padding: '4px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                background: C.accentDim,
                color: C.accent,
              }}>
                {{ FREE: 'Бесплатный', PRO: 'Pro', STUDIO: 'Studio' }[plan] ?? plan}
              </span>
            </div>
            <p style={{ color: C.sub, fontSize: 13, marginBottom: 16 }}>
              {plan === 'FREE' && '3 проекта, 5 ИИ-генераций в месяц'}
              {plan === 'PRO' && '25 проектов, 100 ИИ-генераций в месяц'}
              {plan === 'STUDIO' && 'Безлимитные проекты и ИИ-генерации'}
            </p>

            {/* Fix #9: Usage progress bars for FREE/PRO */}
            {plan !== 'STUDIO' && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <UsageBar
                    C={C}
                    label="Проекты"
                    used={profile.data?._count?.projects ?? 0}
                    limit={plan === 'FREE' ? 3 : 25}
                  />
                  <UsageBar
                    C={C}
                    label="ИИ-генерации"
                    used={profile.data?.aiUsage ?? 0}
                    limit={plan === 'FREE' ? 5 : 100}
                  />
                </div>
              </div>
            )}

            {/* Fix #9: Show what upgrade gives */}
            {plan === 'FREE' && (
              <div style={{ padding: '12px 14px', background: `${C.accent}08`, border: `1px solid ${C.accent}15`, borderRadius: 10, marginBottom: 16, fontSize: 12, color: C.sub, lineHeight: 1.6 }}>
                <strong style={{ color: C.text }}>Pro</strong> &mdash; 25 проектов, 100 ИИ-генераций, приоритетная генерация, экспорт без водяного знака.
              </div>
            )}
            {plan === 'PRO' && (
              <div style={{ padding: '12px 14px', background: `${C.accent}08`, border: `1px solid ${C.accent}15`, borderRadius: 10, marginBottom: 16, fontSize: 12, color: C.sub, lineHeight: 1.6 }}>
                <strong style={{ color: C.text }}>Studio</strong> &mdash; безлимитные проекты и ИИ, командная работа, API-доступ, приоритетная поддержка.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              {hasSub && (
                <button
                  onClick={() => createPortal.mutate()}
                  disabled={createPortal.isPending}
                  style={{ ...btnBase, background: C.surface, color: C.text, border: `1px solid ${C.border}`, ...(createPortal.isPending ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                >
                  {createPortal.isPending ? '...' : 'Управление'}
                </button>
              )}
              {/* Fix #19: Toned down upgrade button — no gradient, solid accent */}
              {plan !== 'STUDIO' && (
                <button
                  onClick={() => createCheckout.mutate({ plan: plan === 'FREE' ? 'PRO' : 'STUDIO' })}
                  disabled={createCheckout.isPending}
                  style={{
                    ...btnBase,
                    background: C.accent,
                    color: '#fff',
                    ...(createCheckout.isPending ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                  }}
                >
                  {createCheckout.isPending ? '...' : `Перейти на ${plan === 'FREE' ? 'Pro' : 'Studio'}`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fix #4 + #5: Merged Logout into Danger Zone — no separate card */}
      {/* Fix #18: Danger zone + logout at the end */}
      <div style={{ ...sectionStyle, borderColor: `${C.accent}33` }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: C.accent }}>Аккаунт</h2>

        {/* Logout row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>Выйти из аккаунта</p>
            <p style={{ color: C.sub, fontSize: 12, margin: 0 }}>Вы сможете войти снова в любое время</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{ ...btnBase, background: C.surface, color: C.text, border: `1px solid ${C.border}` }}
          >
            Выйти
          </button>
        </div>

        {/* Delete account row — Fix #10: confirmation with text input */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, color: C.accent }}>Удалить аккаунт</p>
            <p style={{ color: C.sub, fontSize: 12, margin: 0, maxWidth: 340, lineHeight: 1.5 }}>
              Безвозвратное удаление аккаунта, всех проектов, загрузок и данных подписки.
            </p>
          </div>
          {showDeleteConfirm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
              <p style={{ fontSize: 11, color: C.accent, margin: 0 }}>Введите DELETE для подтверждения:</p>
              <input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                autoFocus
                aria-label="Введите DELETE для подтверждения удаления"
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${C.accent}55`,
                  background: C.surface,
                  color: C.text,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                  style={{ ...btnBase, flex: 1, padding: '8px', fontSize: 12, background: C.surface, color: C.text, border: `1px solid ${C.border}` }}
                >
                  Отмена
                </button>
                <button
                  onClick={() => { if (deleteInput === 'DELETE') deleteAccount.mutate(); }}
                  disabled={deleteInput !== 'DELETE' || deleteAccount.isPending}
                  style={{
                    ...btnBase, flex: 1, padding: '8px', fontSize: 12,
                    background: deleteInput === 'DELETE' ? C.accent : C.surface,
                    color: deleteInput === 'DELETE' ? '#fff' : C.dim,
                    border: `1px solid ${deleteInput === 'DELETE' ? C.accent : C.border}`,
                    cursor: deleteInput === 'DELETE' && !deleteAccount.isPending ? 'pointer' : 'not-allowed',
                    opacity: deleteInput === 'DELETE' ? 1 : 0.5,
                  }}
                >
                  {deleteAccount.isPending ? '...' : 'Удалить'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{ ...btnBase, background: 'transparent', color: C.accent, border: `1px solid ${C.accent}` }}
            >
              Удалить аккаунт
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Fix #9: Usage progress bar sub-component
function UsageBar({ C, label, used, limit }: { C: Theme; label: string; used: number; limit: number }) {
  const pct = Math.min(100, (used / limit) * 100);
  const isHigh = pct >= 80;
  return (
    <div style={{ flex: 1, minWidth: 140 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 11, color: isHigh ? C.accent : C.dim, fontWeight: 600 }}>{used}/{limit}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: C.surface, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: isHigh ? C.accent : C.blue, opacity: isHigh ? 1 : 0.6, transition: 'width .3s ease' }} />
      </div>
    </div>
  );
}
