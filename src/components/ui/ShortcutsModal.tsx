'use client';

import { useEffect, useRef, useCallback, memo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { formatShortcut } from '@/hooks/useKeyboardShortcuts';

/* ── Shortcut definitions for display ────────────────────── */

interface ShortcutMeta {
  keys: string;
  labelKey: string;
}

interface ShortcutGroupMeta {
  id: string;
  titleKey: string;
  icon: string;
  shortcuts: ShortcutMeta[];
}

const SHORTCUT_GROUPS: ShortcutGroupMeta[] = [
  {
    id: 'global',
    titleKey: 'shortcuts.group.global',
    icon: '\u2318',
    shortcuts: [
      { keys: 'Ctrl+K', labelKey: 'shortcuts.openSearch' },
      { keys: '/', labelKey: 'shortcuts.focusSearch' },
      { keys: '?', labelKey: 'shortcuts.keyboardShortcuts' },
      { keys: 'Ctrl+/', labelKey: 'shortcuts.keyboardShortcuts' },
      { keys: 'Escape', labelKey: 'shortcuts.closeModal' },
      { keys: 'G then D', labelKey: 'shortcuts.gotoDashboard' },
      { keys: 'G then E', labelKey: 'shortcuts.gotoEditor' },
      { keys: 'G then T', labelKey: 'shortcuts.gotoTools' },
      { keys: 'G then B', labelKey: 'shortcuts.gotoBilling' },
      { keys: 'G then S', labelKey: 'shortcuts.gotoSettings' },
    ],
  },
  {
    id: 'editor',
    titleKey: 'shortcuts.group.editor',
    icon: '\u270E',
    shortcuts: [
      { keys: 'Ctrl+Z', labelKey: 'shortcuts.undo' },
      { keys: 'Ctrl+Shift+Z', labelKey: 'shortcuts.redo' },
      { keys: 'Ctrl+S', labelKey: 'shortcuts.save' },
      { keys: 'Ctrl+A', labelKey: 'shortcuts.selectAll' },
      { keys: 'Ctrl+C', labelKey: 'shortcuts.copy' },
      { keys: 'Ctrl+V', labelKey: 'shortcuts.paste' },
      { keys: 'Ctrl+X', labelKey: 'shortcuts.cut' },
      { keys: 'Ctrl+D', labelKey: 'shortcuts.duplicate' },
      { keys: 'Delete', labelKey: 'shortcuts.deleteSelected' },
      { keys: 'Ctrl+=', labelKey: 'shortcuts.zoomIn' },
      { keys: 'Ctrl+-', labelKey: 'shortcuts.zoomOut' },
      { keys: 'Ctrl+0', labelKey: 'shortcuts.fitToScreen' },
      { keys: 'Arrows', labelKey: 'shortcuts.nudgeElement' },
    ],
  },
  {
    id: 'tools',
    titleKey: 'shortcuts.group.tools',
    icon: '\u2699',
    shortcuts: [
      { keys: 'Ctrl+]', labelKey: 'shortcuts.bringToFront' },
      { keys: 'Ctrl+[', labelKey: 'shortcuts.sendToBack' },
      { keys: 'Ctrl+Enter', labelKey: 'shortcuts.generateWithAI' },
    ],
  },
];

/* ── Kbd component ───────────────────────────────────────── */

function Kbd({
  children,
  bg,
  border,
  color,
}: {
  children: React.ReactNode;
  bg: string;
  border: string;
  color: string;
}) {
  return (
    <kbd
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 24,
        height: 24,
        padding: '0 7px',
        borderRadius: 6,
        background: bg,
        border: `1px solid ${border}`,
        color,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'var(--font-mono), monospace',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        boxShadow: `0 1px 2px rgba(0,0,0,.1), inset 0 -1px 0 rgba(0,0,0,.08)`,
      }}
    >
      {children}
    </kbd>
  );
}

/** Renders a key combo like "Ctrl+Shift+Z" as multiple <kbd> elements */
function KeyCombo({
  keys,
  bg,
  border,
  color,
  dimColor,
}: {
  keys: string;
  bg: string;
  border: string;
  color: string;
  dimColor: string;
}) {
  const formatted = formatShortcut(keys);

  // Sequence: "G then D"
  if (formatted.includes(' then ')) {
    const parts = formatted.split(' then ');
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {parts.map((p, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && (
              <span style={{ fontSize: 10, color: dimColor, fontWeight: 500 }}>then</span>
            )}
            <Kbd bg={bg} border={border} color={color}>
              {p.trim()}
            </Kbd>
          </span>
        ))}
      </span>
    );
  }

  // Combo: "Ctrl+Shift+Z"
  const parts = formatted.split('+');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {parts.map((p, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          {i > 0 && (
            <span style={{ fontSize: 10, color: dimColor, fontWeight: 600 }}>+</span>
          )}
          <Kbd bg={bg} border={border} color={color}>
            {p.trim()}
          </Kbd>
        </span>
      ))}
    </span>
  );
}

/* ── ShortcutsModal ──────────────────────────────────────── */

export const ShortcutsModal = memo(function ShortcutsModal() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const t = useLocaleStore((s) => s.t);
  const showShortcuts = useNotificationStore((s) => s.showShortcuts);
  const setShowShortcuts = useNotificationStore((s) => s.setShowShortcuts);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!showShortcuts) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setShowShortcuts(false);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [showShortcuts, setShowShortcuts]);

  // Focus trap: focus dialog on open
  useEffect(() => {
    if (showShortcuts && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [showShortcuts]);

  const handleBackdropClick = useCallback(() => {
    setShowShortcuts(false);
  }, [setShowShortcuts]);

  const handleDialogClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!showShortcuts) return null;

  const kbdBg = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
  const kbdBorder = isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)';
  const kbdColor = C.text;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('shortcuts.title')}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: C.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
        animation: 'shortcutsModalFadeIn .15s ease-out',
      }}
    >
      <style>{`
        @keyframes shortcutsModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shortcutsModalSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={handleDialogClick}
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 0,
          width: 'calc(100vw - 32px)',
          maxWidth: 560,
          maxHeight: '85dvh',
          boxShadow: `0 24px 64px rgba(0,0,0,.3), 0 0 0 1px ${isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)'}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'shortcutsModalSlideUp .2s ease-out',
          outline: 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                color: '#fff',
                fontWeight: 700,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h8" />
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-.02em' }}>
              {t('shortcuts.title')}
            </span>
          </div>
          <button
            aria-label={t('shortcuts.close')}
            onClick={() => setShowShortcuts(false)}
            style={{
              width: 36,
              height: 36,
              minWidth: 36,
              minHeight: 36,
              borderRadius: 7,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.sub,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'inherit',
              transition: 'all .15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.surface;
              e.currentTarget.style.color = C.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = C.sub;
            }}
          >
            {'\u2715'}
          </button>
        </div>

        {/* Content — scrollable */}
        <div
          style={{
            padding: '12px 16px 16px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* Grid of groups */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
              gap: 20,
            }}
          >
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.id}>
                {/* Group header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 10,
                    paddingBottom: 8,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                      color: C.accent,
                    }}
                  >
                    {t(group.titleKey)}
                  </span>
                </div>

                {/* Shortcuts list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {group.shortcuts.map((sc) => (
                    <div
                      key={sc.keys}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 4px',
                        borderRadius: 6,
                        transition: 'background .1s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDark
                          ? 'rgba(255,255,255,.03)'
                          : 'rgba(0,0,0,.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: 13, color: C.text, fontWeight: 450 }}>
                        {t(sc.labelKey)}
                      </span>
                      <KeyCombo
                        keys={sc.keys}
                        bg={kbdBg}
                        border={kbdBorder}
                        color={kbdColor}
                        dimColor={C.dim}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11, color: C.dim }}>{t('shortcuts.press')}</span>
          <Kbd bg={kbdBg} border={kbdBorder} color={C.sub}>
            ?
          </Kbd>
          <span style={{ fontSize: 11, color: C.dim }}>{t('shortcuts.or')}</span>
          <Kbd bg={kbdBg} border={kbdBorder} color={C.sub}>
            Esc
          </Kbd>
          <span style={{ fontSize: 11, color: C.dim }}>{t('shortcuts.toClose')}</span>
        </div>
      </div>
    </div>
  );
});
