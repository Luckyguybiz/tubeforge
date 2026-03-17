'use client';
import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NAV, KEYBOARD_SHORTCUTS, Z_INDEX } from '@/lib/constants';
import { useThemeStore } from '@/stores/useThemeStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { Notification } from '@/stores/useNotificationStore';

/** Extra page labels not in NAV */
const PAGE_LABELS: Record<string, string> = {
  settings: 'Настройки',
  admin: 'Админка',
  team: 'Команда',
};

const NOTIF_ICONS: Record<Notification['type'], string> = {
  success: '\u2705',
  error: '\u274C',
  info: '\u2139\uFE0F',
  warning: '\u26A0\uFE0F',
};

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

  const pageLabel = NAV.find((n) => n.id === current)?.label ?? PAGE_LABELS[current] ?? '';

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
      {!isEditor && pageLabel && (
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
          {pageLabel}
        </span>
      )}
      <div style={{ flex: 1 }} />

      {/* Keyboard shortcuts hint button */}
      <button
        title="Горячие клавиши (?)"
        aria-label="Горячие клавиши"
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
          title="Уведомления"
          aria-label="Уведомления"
          aria-expanded={bellOpen}
          aria-haspopup="true"
          onClick={() => setBellOpen((v) => !v)}
          onMouseEnter={(e) => handleBtnHover(e, true)}
          onMouseLeave={(e) => handleBtnHover(e, false)}
          style={btnBase}
        >
          {'\uD83D\uDD14'}
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
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Уведомления</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  style={{
                    background: 'none', border: 'none', color: C.accent,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    padding: '2px 6px', borderRadius: 4,
                  }}
                >
                  Отметить все прочитанными
                </button>
              )}
            </div>
            {/* List */}
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {notifications.length === 0 && (
                <div style={{ padding: '24px 14px', textAlign: 'center', color: C.dim, fontSize: 12 }}>
                  Нет уведомлений
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
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Горячие клавиши</span>
              <button
                aria-label="Закрыть"
                onClick={() => setShowShortcuts(false)}
                style={{ background: 'none', border: 'none', color: C.dim, fontSize: 16, cursor: 'pointer', padding: '2px 6px', fontFamily: 'inherit' }}
              >
                {'\u2715'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {KEYBOARD_SHORTCUTS.map((sc) => (
                <div key={sc.keys} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
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
          </div>
        </div>
      )}
    </div>
  );
});
