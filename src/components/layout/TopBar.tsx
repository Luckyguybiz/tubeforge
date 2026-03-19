'use client';
import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NAV, Z_INDEX } from '@/lib/constants';
import { useThemeStore } from '@/stores/useThemeStore';
import type { ThemeMode } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useMobileMenuStore } from '@/stores/useMobileMenuStore';
import type { Notification } from '@/stores/useNotificationStore';
import { WhatsNewBadge, WhatsNewModal } from '@/components/ui/WhatsNew';

/** Translation keys for extra page labels not in NAV */
const PAGE_LABEL_KEYS: Record<string, string> = {
  settings: 'nav.settings',
  admin: 'nav.admin',
  team: 'nav.team',
  referral: 'nav.referral',
};

const NOTIF_ICONS: Record<Notification['type'], string> = {
  success: '\u2705',
  error: '\u274C',
  info: '\u2139\uFE0F',
  warning: '\u26A0\uFE0F',
};

/** SVG bell icon – replaces emoji for consistent cross-platform rendering */
function BellIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

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

function timeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'только что';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  const d = Math.floor(h / 24);
  return `${d} дн. назад`;
}

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

  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const showShortcuts = useNotificationStore((s) => s.showShortcuts);
  const setShowShortcuts = useNotificationStore((s) => s.setShowShortcuts);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  /* ── What's New ────────────────────────────────── */
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  /* ── Search ─────────────────────────────────────── */
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const openSearch = useCallback(() => {
    setSearchExpanded(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchExpanded(false);
    setSearchQuery('');
  }, []);

  // Listen for sidebar search click
  useEffect(() => {
    const handler = () => openSearch();
    window.addEventListener('tubeforge:open-search', handler);
    return () => window.removeEventListener('tubeforge:open-search', handler);
  }, [openSearch]);

  // Cmd/Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openSearch]);

  // Close notification dropdown on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  // Close notification dropdown on Escape
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBellOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [bellOpen]);

  // Note: `?` shortcut and Escape for shortcuts modal are now handled
  // by useGlobalShortcuts in AppShell and ShortcutsModal component.

  const pageLabelKey = PAGE_LABEL_KEYS[current];
  const navItem = NAV.find((n) => n.id === current);
  const pageLabel = pageLabelKey ? t(pageLabelKey) : navItem ? t(`nav.${navItem.id}`) : '';

  const btnBase: React.CSSProperties = { width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', position: 'relative', transition: 'background 0.15s ease' };

  const handleBtnHover = useCallback((e: React.MouseEvent<HTMLButtonElement>, entering: boolean) => {
    (e.currentTarget as HTMLButtonElement).style.background = entering ? C.surface : 'transparent';
  }, [C.surface]);

  const handleNotifKeyDown = useCallback((e: React.KeyboardEvent, n: Notification) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!n.read) markRead(n.id);
    }
  }, [markRead]);

  const mobileMenuToggle = useMobileMenuStore((s) => s.toggle);

  return (
    <div style={{ height: 44, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, background: C.surface, flexShrink: 0 }}>
      {/* Hamburger – visible only below 768px */}
      <button
        className="tf-hamburger"
        aria-label="Menu"
        onClick={mobileMenuToggle}
        style={{
          display: 'none', /* shown via @media in layout.tsx */
          width: 32,
          height: 32,
          borderRadius: 7,
          border: `1px solid ${C.border}`,
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
          <div style={{ width: 20, height: 20, borderRadius: 5, background: `linear-gradient(135deg,${C.accent},${C.pink})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>Y</div>
          <span style={{ fontWeight: 700, fontSize: 12 }}>Студия</span>
        </div>
      )}
      {/* Breadcrumbs */}
      {!isEditor && (() => {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length === 0) segments.push('dashboard');
        return (
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 0, fontSize: 13 }}>
            <span
              role="link"
              tabIndex={0}
              onClick={() => router.push('/dashboard')}
              onKeyDown={(e) => { if (e.key === 'Enter') router.push('/dashboard'); }}
              style={{ color: segments.length > 1 ? C.sub : C.text, fontWeight: segments.length > 1 ? 500 : 600, cursor: segments.length > 1 ? 'pointer' : 'default', transition: 'color 0.15s' }}
            >
              {t('nav.dashboard')}
            </span>
            {segments.length > 1 && segments.slice(1).map((seg, i) => {
              const isLast = i === segments.length - 2;
              const href = '/' + segments.slice(0, i + 2).join('/');
              const labelKey = `nav.${seg}`;
              const label = t(labelKey) !== labelKey ? t(labelKey) : seg.charAt(0).toUpperCase() + seg.slice(1);
              return (
                <span key={seg + i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <span style={{ color: C.dim, margin: '0 6px', fontSize: 11 }}>/</span>
                  <span
                    role="link"
                    tabIndex={0}
                    onClick={() => { if (!isLast) router.push(href); }}
                    onKeyDown={(e) => { if (!isLast && e.key === 'Enter') router.push(href); }}
                    style={{ color: isLast ? C.text : C.sub, fontWeight: isLast ? 600 : 500, cursor: isLast ? 'default' : 'pointer', transition: 'color 0.15s' }}
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

      {/* Search input */}
      {searchExpanded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') closeSearch(); }}
            placeholder={t('sidebar.search')}
            style={{
              width: 220,
              maxWidth: 'calc(100vw - 120px)',
              height: 28,
              padding: '0 10px',
              borderRadius: 7,
              border: `1px solid ${C.borderActive}`,
              background: C.bg,
              color: C.text,
              fontSize: 12,
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color .15s',
            }}
          />
          <button
            onClick={closeSearch}
            style={{
              ...btnBase,
              width: 22,
              height: 22,
              fontSize: 10,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Referral CTA */}
      <button
        className="tf-topbar-referral"
        onClick={() => router.push('/referral')}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,.2)';
        }}
        style={{
          padding: '6px 14px',
          borderRadius: 20,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'inherit',
          transition: 'all .2s ease',
          boxShadow: '0 2px 8px rgba(99,102,241,.2)',
          whiteSpace: 'nowrap',
        }}
      >
        {'\uD83D\uDCB0'} {t('topbar.referralCta')}
      </button>

      {/* Keyboard shortcuts hint button */}
      <button
        className="tf-topbar-shortcuts"
        title={t('topbar.shortcutsLabel')}
        aria-label={t('topbar.shortcuts')}
        onClick={() => setShowShortcuts(!showShortcuts)}
        onMouseEnter={(e) => handleBtnHover(e, true)}
        onMouseLeave={(e) => handleBtnHover(e, false)}
        style={{ ...btnBase, fontSize: 13, fontWeight: 700 }}
      >
        ?
      </button>

      {/* What's New badge */}
      <WhatsNewBadge onClick={() => setShowWhatsNew(true)} />

      {/* Notification bell */}
      <div ref={bellRef} style={{ position: 'relative' }}>
        <button
          title={t('topbar.notifications')}
          aria-label={t('topbar.notifications')}
          aria-expanded={bellOpen}
          aria-haspopup="true"
          onClick={() => setBellOpen((v) => !v)}
          onMouseEnter={(e) => handleBtnHover(e, true)}
          onMouseLeave={(e) => handleBtnHover(e, false)}
          style={btnBase}
        >
          <BellIcon size={14} color={C.sub} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16,
              borderRadius: 8, background: C.accent, color: '#fff', fontSize: 9,
              fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px', lineHeight: 1,
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification dropdown */}
        {bellOpen && (
          <div style={{
            position: 'absolute', top: 36, right: 0, width: 320,
            maxWidth: 'calc(100vw - 24px)',
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
            boxShadow: `0 8px 32px ${C.overlay}`, zIndex: Z_INDEX.DROPDOWN, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t('topbar.notifications')}</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  style={{
                    background: 'none', border: 'none', color: C.accent,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    padding: '2px 6px', borderRadius: 4,
                  }}
                >
                  {t('topbar.markAllRead')}
                </button>
              )}
            </div>
            {/* List */}
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {notifications.length === 0 && (
                <div style={{ padding: '24px 14px', textAlign: 'center', color: C.dim, fontSize: 12 }}>
                  {t('topbar.noNotifications')}
                </div>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => { if (!n.read) markRead(n.id); }}
                  onKeyDown={(e) => handleNotifKeyDown(e, n)}
                  style={{
                    display: 'flex', gap: 10, padding: '10px 14px', cursor: n.read ? 'default' : 'pointer',
                    background: n.read ? 'transparent' : `${C.accent}08`,
                    borderBottom: `1px solid ${C.border}`,
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0, lineHeight: '20px' }}>{NOTIF_ICONS[n.type]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                      {!n.read && (
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: C.accent, flexShrink: 0 }} />
                      )}
                    </div>
                    <div title={n.message} style={{ fontSize: 11, color: C.sub, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Theme toggle: cycles dark -> light -> system */}
      <button
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

      {/* Keyboard shortcuts modal is now rendered by ShortcutsModal in AppShell */}

      {/* What's New modal */}
      {showWhatsNew && <WhatsNewModal onClose={() => setShowWhatsNew(false)} />}
    </div>
  );
});
