'use client';
import { memo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import type { ThemeMode } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useMobileMenuStore } from '@/stores/useMobileMenuStore';

/** SVG sun icon for light mode */
function SunIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
/** SVG moon icon for dark mode */
function MoonIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
/** SVG monitor icon for system mode */
function MonitorIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

const THEME_MODE_LABELS: Record<ThemeMode, string> = { dark: 'settings.dark', light: 'settings.light', system: 'settings.system' };

export const TopBar = memo(function TopBar() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const themeMode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const t = useLocaleStore((s) => s.t);
  const pathname = usePathname();
  const router = useRouter();
  const current = pathname.split('/').filter(Boolean)[0] || 'dashboard';
  const isEditor = current === 'editor';

  const btnBase: React.CSSProperties = { width: 36, height: 36, minWidth: 36, minHeight: 36, borderRadius: 18, border: 'none', background: 'transparent', color: C.sub, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', position: 'relative', transition: 'background 0.15s ease', flexShrink: 0 };

  const handleBtnHover = useCallback((e: React.MouseEvent<HTMLButtonElement>, entering: boolean) => {
    (e.currentTarget as HTMLButtonElement).style.background = entering ? C.border : 'transparent';
  }, [C.border]);

  const mobileMenuToggle = useMobileMenuStore((s) => s.toggle);

  return (
    <div className="tf-topbar" style={{ height: 56, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10, background: isDark ? 'rgba(10,10,10,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', flexShrink: 0, color: C.text }}>
      {/* Hamburger – visible only below 768px */}
      <button
        className="tf-hamburger"
        aria-label="Menu"
        onClick={mobileMenuToggle}
        style={{
          display: 'none', /* shown via @media in layout.tsx */
          width: 36,
          height: 36,
          minWidth: 36,
          minHeight: 36,
          borderRadius: 18,
          border: 'none',
          background: 'transparent',
          color: C.text,
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          padding: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="3" y1="4.5" x2="15" y2="4.5" />
          <line x1="3" y1="9" x2="15" y2="9" />
          <line x1="3" y1="13.5" x2="15" y2="13.5" />
        </svg>
      </button>
      {isEditor && (
        <button title={t('nav.dashboard')} onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {'\u2190'} {t('common.back')}
        </button>
      )}
      {isEditor && <div style={{ height: 16, width: 1, background: C.border }} />}
      {isEditor && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>Y</div>
          <span style={{ fontWeight: 700, fontSize: 12 }}>{t('topbar.studio')}</span>
        </div>
      )}
      {/* Breadcrumbs */}
      {!isEditor && (() => {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length === 0) segments.push('dashboard');
        return (
          <nav className="tf-topbar-breadcrumb" aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 400, minWidth: 0, overflow: 'hidden', letterSpacing: '-0.01em' }}>
            <span
              role="link"
              tabIndex={0}
              onClick={() => router.push('/dashboard')}
              onKeyDown={(e) => { if (e.key === 'Enter') router.push('/dashboard'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: segments.length > 1 ? C.dim : C.text, fontWeight: segments.length > 1 ? 400 : 500, cursor: segments.length > 1 ? 'pointer' : 'default', transition: 'color 0.15s' }}
            >
              <span style={{ width: 22, height: 22, borderRadius: 6, background: C.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0 }}>TF</span>
              {segments.length > 1 ? t('nav.dashboard') : ''}
            </span>
            {segments.length > 1 && segments.slice(1).map((seg, i) => {
              const isLast = i === segments.length - 2;
              const href = '/' + segments.slice(0, i + 2).join('/');
              const labelKey = `nav.${seg}`;
              const label = t(labelKey) !== labelKey ? t(labelKey) : seg.charAt(0).toUpperCase() + seg.slice(1);
              return (
                <span key={seg + i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <span style={{ color: C.borderActive, margin: '0 6px', fontSize: 11 }}>/</span>
                  <span
                    role="link"
                    tabIndex={0}
                    onClick={() => { if (!isLast) router.push(href); }}
                    onKeyDown={(e) => { if (!isLast && e.key === 'Enter') router.push(href); }}
                    style={{ color: isLast ? C.text : C.dim, fontWeight: isLast ? 600 : 500, cursor: isLast ? 'default' : 'pointer', transition: 'color 0.15s' }}
                  >
                    {label}
                  </span>
                </span>
              );
            })}
          </nav>
        );
      })()}
      <div style={{ flex: 1 }} />

      {/* Referral CTA */}
      <button
        className="tf-topbar-referral"
        onClick={() => router.push('/referral')}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.85';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        style={{
          padding: '6px 14px',
          borderRadius: 20,
          background: C.accent,
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'inherit',
          transition: 'all .2s ease',
          whiteSpace: 'nowrap',
        }}
      >
        {'\uD83D\uDCB0'} {t('topbar.referralCta')}
      </button>

      {/* Theme toggle: cycles dark -> light -> system */}
      <button
        className="tf-topbar-btn"
        title={t(THEME_MODE_LABELS[themeMode])}
        aria-label={`${t('settings.themeTitle')}: ${t(THEME_MODE_LABELS[themeMode])}`}
        onClick={toggle}
        onMouseEnter={(e) => handleBtnHover(e, true)}
        onMouseLeave={(e) => handleBtnHover(e, false)}
        style={btnBase}
      >
        {themeMode === 'dark' && <MoonIcon size={14} color={C.sub} />}
        {themeMode === 'light' && <SunIcon size={14} color={C.sub} />}
        {themeMode === 'system' && <MonitorIcon size={14} color={C.sub} />}
      </button>
    </div>
  );
});
