'use client';

import { useState, useEffect, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

const STORAGE_KEY = 'tf-cookie-consent';

export interface CookiePreferences {
  necessary: boolean; // always true
  analytics: boolean;
  marketing: boolean;
}

/** Read persisted cookie preferences (null = no choice yet) */
export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && 'necessary' in parsed) {
      return { necessary: true, analytics: !!parsed.analytics, marketing: !!parsed.marketing };
    }
    // Legacy format: 'accepted' | 'declined'
    if (raw === 'accepted') return { necessary: true, analytics: true, marketing: true };
    if (raw === 'declined') return { necessary: true, analytics: false, marketing: false };
    return null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const prefs = getCookiePreferences();
    if (!prefs) {
      setVisible(true);
    }
  }, []);

  const persist = useCallback((prefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new Event('tf-consent-changed'));
    setVisible(false);
    setShowCustomize(false);
  }, []);

  const acceptAll = useCallback(() => {
    persist({ necessary: true, analytics: true, marketing: true });
  }, [persist]);

  const necessaryOnly = useCallback(() => {
    persist({ necessary: true, analytics: false, marketing: false });
  }, [persist]);

  const saveCustom = useCallback(() => {
    persist({ necessary: true, analytics, marketing });
  }, [persist, analytics, marketing]);

  if (!visible) return null;

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

  const toggleStyle = (on: boolean): React.CSSProperties => ({
    position: 'relative',
    width: 44,
    height: 24,
    borderRadius: 12,
    background: on ? C.accent : C.border,
    cursor: 'pointer',
    border: 'none',
    padding: 0,
    flexShrink: 0,
    transition: 'background 0.2s',
  });

  const toggleKnob = (on: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: 2,
    left: on ? 22 : 2,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    transition: 'left 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  });

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
        aria-modal="true"
        aria-label="Cookie consent"
        style={{
          background: C.surface,
          color: C.text,
          borderRadius: 16,
          padding: '20px 20px',
          maxWidth: 520,
          width: '100%',
          boxShadow: '0 -2px 24px rgba(0,0,0,0.25)',
          border: `1px solid ${C.border}`,
          pointerEvents: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Main message */}
        <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16, color: C.sub }}>
          {t('cookie.message')}{' '}
          <a href="/privacy#faily-cookie" style={{ color: C.accent, textDecoration: 'underline' }}>
            {t('cookie.learnMore')}
          </a>
        </p>

        {/* Customize panel */}
        {showCustomize && (
          <div
            style={{
              background: C.bg,
              borderRadius: 12,
              padding: '16px',
              marginBottom: 16,
              border: `1px solid ${C.border}`,
            }}
          >
            {/* Necessary — always on */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{t('cookie.necessary')}</div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{t('cookie.necessaryDesc')}</div>
              </div>
              <button
                type="button"
                disabled
                style={{ ...toggleStyle(true), opacity: 0.6, cursor: 'not-allowed' }}
                aria-label="Necessary cookies (always enabled)"
              >
                <span style={toggleKnob(true)} />
              </button>
            </div>

            {/* Analytics */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{t('cookie.analytics')}</div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{t('cookie.analyticsDesc')}</div>
              </div>
              <button
                type="button"
                onClick={() => setAnalytics((v) => !v)}
                style={toggleStyle(analytics)}
                aria-label={`Analytics cookies: ${analytics ? 'enabled' : 'disabled'}`}
                aria-pressed={analytics}
              >
                <span style={toggleKnob(analytics)} />
              </button>
            </div>

            {/* Marketing */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{t('cookie.marketing')}</div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{t('cookie.marketingDesc')}</div>
              </div>
              <button
                type="button"
                onClick={() => setMarketing((v) => !v)}
                style={toggleStyle(marketing)}
                aria-label={`Marketing cookies: ${marketing ? 'enabled' : 'disabled'}`}
                aria-pressed={marketing}
              >
                <span style={toggleKnob(marketing)} />
              </button>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {showCustomize ? (
            <button
              onClick={saveCustom}
              style={{
                ...btnBase,
                background: C.accent,
                color: '#fff',
                flex: '1 1 auto',
              }}
            >
              {t('cookie.savePreferences')}
            </button>
          ) : (
            <>
              <button
                onClick={necessaryOnly}
                style={{
                  ...btnBase,
                  background: 'transparent',
                  color: C.sub,
                  border: `1px solid ${C.border}`,
                  flex: '1 1 auto',
                }}
              >
                {t('cookie.necessaryOnly')}
              </button>
              <button
                onClick={() => setShowCustomize(true)}
                style={{
                  ...btnBase,
                  background: 'transparent',
                  color: C.sub,
                  border: `1px solid ${C.border}`,
                  flex: '1 1 auto',
                }}
              >
                {t('cookie.customize')}
              </button>
              <button
                onClick={acceptAll}
                style={{
                  ...btnBase,
                  background: C.accent,
                  color: '#fff',
                  flex: '1 1 auto',
                }}
              >
                {t('cookie.acceptAll')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
