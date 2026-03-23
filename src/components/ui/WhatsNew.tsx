'use client';

import { useState, useEffect, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { Z_INDEX } from '@/lib/constants';

/* ── Changelog entries ─────────────────────────────────────────────── */

interface ChangelogEntry {
  version: string;
  date: string;
  items: { type: 'feature' | 'improvement' | 'fix'; text: string }[];
}

// Changelog uses i18n keys for text — falls back to key if translation missing
function getChangelog(t: (key: string) => string): ChangelogEntry[] {
  return [
    {
      version: '1.4.0',
      date: '2026-03-19',
      items: [
        { type: 'feature', text: t('whatsnew.v140.1') },
        { type: 'feature', text: t('whatsnew.v140.2') },
        { type: 'improvement', text: t('whatsnew.v140.3') },
        { type: 'improvement', text: t('whatsnew.v140.4') },
      ],
    },
    {
      version: '1.3.0',
      date: '2026-03-15',
      items: [
        { type: 'feature', text: t('whatsnew.v130.1') },
        { type: 'feature', text: t('whatsnew.v130.2') },
        { type: 'improvement', text: t('whatsnew.v130.3') },
        { type: 'fix', text: t('whatsnew.v130.4') },
      ],
    },
    {
      version: '1.2.0',
      date: '2026-03-10',
      items: [
        { type: 'feature', text: t('whatsnew.v120.1') },
        { type: 'feature', text: t('whatsnew.v120.2') },
        { type: 'improvement', text: t('whatsnew.v120.3') },
      ],
    },
  ];
}

const LATEST_VERSION = '1.4.0';
const STORAGE_KEY = 'tubeforge_last_seen_version';

/* ── Badge type colors ─────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function typeBadge(type: string, C: Record<string, any>, t: (k: string) => string): { bg: string; color: string; label: string } {
  switch (type) {
    case 'feature':
      return { bg: `${C.green}18`, color: C.green, label: t('whatsnew.new') };
    case 'improvement':
      return { bg: `${C.blue}18`, color: C.blue, label: t('whatsnew.improved') };
    case 'fix':
      return { bg: `${C.orange}18`, color: C.orange, label: t('whatsnew.fix') };
    default:
      return { bg: `${C.dim}18`, color: C.dim, label: type.toUpperCase() };
  }
}

/* ── Exports ───────────────────────────────────────────────────────── */

/** Returns true if the user hasn't seen the latest version yet */
export function useHasNewUpdates(): boolean {
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    try {
      const lastSeen = localStorage.getItem(STORAGE_KEY);
      setHasNew(lastSeen !== LATEST_VERSION);
    } catch {
      // localStorage unavailable
    }
  }, []);

  return hasNew;
}

/** Mark current version as seen */
function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, LATEST_VERSION);
  } catch {
    // localStorage unavailable
  }
}

/* ── Modal ─────────────────────────────────────────────────────────── */

export function WhatsNewModal({ onClose }: { onClose: () => void }) {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const t = useLocaleStore((s) => s.t);

  // Mark as seen when opened
  useEffect(() => {
    markSeen();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: Z_INDEX.MODAL_BACKDROP,
          background: isDark ? 'rgba(0,0,0,.6)' : 'rgba(0,0,0,.3)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
        style={{
          position: 'fixed',
          zIndex: Z_INDEX.CONTEXT_MENU,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100vw - 32px)',
          maxWidth: 480,
          maxHeight: 'calc(100dvh - 80px)',
          background: isDark
            ? 'linear-gradient(135deg, rgba(16,16,28,.99), rgba(12,12,20,.99))'
            : C.surface,
          border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : C.border}`,
          borderRadius: 20,
          boxShadow: isDark
            ? '0 24px 80px rgba(0,0,0,.6)'
            : '0 24px 80px rgba(0,0,0,.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 16px 12px',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `${C.accent}12`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12.5 7.5L18 10L12.5 12.5L10 18L7.5 12.5L2 10L7.5 7.5L10 2Z" fill={C.accent} />
              </svg>
            </div>
            <h2
              id="whats-new-title"
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: C.text,
                margin: 0,
                letterSpacing: '-.02em',
              }}
            >
              {t('whatsNew.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t('whatsNew.close')}
            style={{
              width: 36,
              height: 36,
              minWidth: 36,
              minHeight: 36,
              borderRadius: 8,
              border: 'none',
              background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)',
              color: C.dim,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 16px 20px',
          }}
        >
          {getChangelog(t).map((entry, ei) => (
            <div key={entry.version} style={{ marginBottom: ei < getChangelog(t).length - 1 ? 24 : 0 }}>
              {/* Version header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: C.text,
                    letterSpacing: '-.01em',
                  }}
                >
                  v{entry.version}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: C.dim,
                    fontWeight: 500,
                  }}
                >
                  {entry.date}
                </span>
                {ei === 0 && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#fff',
                      background: `linear-gradient(135deg, ${C.accent}, ${C.pink ?? C.accent})`,
                      padding: '2px 7px',
                      borderRadius: 4,
                      letterSpacing: '.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Latest
                  </span>
                )}
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {entry.items.map((item, ii) => {
                  const badge = typeBadge(item.type, C, t);
                  return (
                    <div
                      key={ii}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.02)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: badge.color,
                          background: badge.bg,
                          padding: '2px 6px',
                          borderRadius: 4,
                          letterSpacing: '.04em',
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {badge.label}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: C.sub,
                          lineHeight: 1.5,
                          wordBreak: 'break-word',
                          overflow: 'hidden',
                        }}
                      >
                        {item.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              {ei < getChangelog(t).length - 1 && (
                <div
                  style={{
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${isDark ? 'rgba(255,255,255,.06)' : C.border}, transparent)`,
                    marginTop: 20,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Badge indicator (small dot) ───────────────────────────────────── */

export function WhatsNewBadge({ onClick }: { onClick: () => void }) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const hasNew = useHasNewUpdates();

  if (!hasNew) return null;

  return (
    <button
      onClick={onClick}
      title={t('whatsNew.badge')}
      aria-label={t('whatsNew.title')}
      style={{
        position: 'relative',
        width: 36,
        height: 36,
        minWidth: 36,
        minHeight: 36,
        borderRadius: 8,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'inherit',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L9.8 5.8L15 8L9.8 10.2L8 15L6.2 10.2L1 8L6.2 5.8L8 1Z" fill={C.accent} />
      </svg>
      {/* Red indicator dot */}
      <div
        style={{
          position: 'absolute',
          top: 2,
          right: 2,
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: C.accent,
          boxShadow: `0 0 6px ${C.accent}88`,
        }}
      />
    </button>
  );
}
