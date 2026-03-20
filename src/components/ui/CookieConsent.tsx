'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

const STORAGE_KEY = 'tf-cookie-consent';

export function CookieConsent() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  if (!visible) return null;

  const respond = (value: 'accepted' | 'declined') => {
    localStorage.setItem(STORAGE_KEY, value);
    window.dispatchEvent(new Event('tf-consent-changed'));
    setVisible(false);
  };

  const btnBase: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
    minHeight: 44,
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        padding: 16,
        pointerEvents: 'none',
      }}
    >
      <div
        role="dialog"
        aria-label="Cookie consent"
        style={{
          background: C.surface,
          color: C.text,
          borderRadius: 12,
          padding: '16px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          maxWidth: 720,
          width: '100%',
          boxShadow: '0 -2px 24px rgba(0,0,0,0.25)',
          border: `1px solid ${C.border}`,
          pointerEvents: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ flex: '1 1 200px', fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>
          {t('cookie.message')}
        </span>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => respond('declined')}
            style={{
              ...btnBase,
              background: 'transparent',
              color: C.sub,
              border: `1px solid ${C.border}`,
            }}
          >
            {t('cookie.decline')}
          </button>
          <button
            onClick={() => respond('accepted')}
            style={{
              ...btnBase,
              background: C.accent,
              color: '#fff',
            }}
          >
            {t('cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
