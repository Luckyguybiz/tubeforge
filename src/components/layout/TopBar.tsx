'use client';
import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NAV, KEYBOARD_SHORTCUTS, SHORTCUT_CATEGORIES, Z_INDEX } from '@/lib/constants';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { Notification } from '@/stores/useNotificationStore';

/** Translation keys for extra page labels not in NAV */
const PAGE_LABEL_KEYS: Record<string, string> = {
  settings: 'nav.settings',
  admin: 'nav.admin',
  team: 'nav.team',
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

  // Close shortcuts modal on Escape
  useEffect(() => {
    if (!showShortcuts) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowShortcuts(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showShortcuts, setShowShortcuts]);

  // Global `?` shortcut (for pages that don't use useCanvasKeyboard)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const ce = (document.activeElement as HTMLElement)?.getAttribute('contenteditable') === 'true';
      if (ce || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === '?') {
        const ns = useNotificationStore.getState();
        ns.setShowShortcuts(!ns.showShortcuts);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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

  return (
    <div style={{ height: 44, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, background: C.surface, flexShrink: 0 }}>
      {isEditor && (
        <button title="Вернуться на дашборд" onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {'\u2190'} Назад
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

      {/* Keyboard shortcuts hint button */}
      <button
        title={t('topbar.shortcutsLabel')}
        aria-label={t('topbar.shortcuts')}
        onClick={() => setShowShortcuts(!showShortcuts)}
        onMouseEnter={(e) => handleBtnHover(e, true)}
        onMouseLeave={(e) => handleBtnHover(e, false)}
        style={{ ...btnBase, fontSize: 13, fontWeight: 700 }}
      >
        ?
      </button>

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

      {/* Theme toggle */}
      <button title="Переключить тему" aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'} onClick={toggle} onMouseEnter={(e) => handleBtnHover(e, true)} onMouseLeave={(e) => handleBtnHover(e, false)} style={btnBase}>
        {isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'}
      </button>

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <div
          onClick={() => setShowShortcuts(false)}
          style={{
            position: 'fixed', inset: 0, background: C.overlay,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
              padding: '24px 28px', width: 360, maxWidth: '90vw',
              boxShadow: `0 16px 48px ${C.overlay}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{t('topbar.shortcuts')}</span>
              <button
                aria-label={t('topbar.close')}
                onClick={() => setShowShortcuts(false)}
                style={{ background: 'none', border: 'none', color: C.dim, fontSize: 16, cursor: 'pointer', padding: '2px 6px', fontFamily: 'inherit' }}
              >
                {'\u2715'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(SHORTCUT_CATEGORIES).map(([catKey, catLabel]) => {
                const items = KEYBOARD_SHORTCUTS.filter((sc) => sc.category === catKey);
                if (items.length === 0) return null;
                return (
                  <div key={catKey} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.dim, marginBottom: 6, paddingBottom: 4, borderBottom: `1px solid ${C.border}` }}>
                      {catLabel}
                    </div>
                    {items.map((sc) => (
                      <div key={sc.keys} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
                        <span style={{ fontSize: 13, color: C.text }}>{sc.label}</span>
                        <kbd style={{
                          fontSize: 11, fontWeight: 600, color: C.sub,
                          background: C.surface, border: `1px solid ${C.border}`,
                          borderRadius: 5, padding: '3px 8px', fontFamily: 'inherit',
                        }}>
                          {sc.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
