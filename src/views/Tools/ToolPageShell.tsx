'use client';

import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import type { Theme } from '@/lib/types';

interface ToolPageShellProps {
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  gradient: [string, string];
  comingSoon?: boolean;
  children: React.ReactNode;
}

export function ToolPageShell({ title, subtitle, badge, badgeColor, gradient, comingSoon, children }: ToolPageShellProps) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const router = useRouter();

  return (
    <div style={{ width: '100%', minHeight: '100dvh', background: '#0a0a0a' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#111111',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {/* Back button — ghost style */}
        <button
          onClick={() => { if (window.history.length > 1) { router.back(); } else { router.push('/tools'); } }}
          aria-label="Back to tools"
          style={{
            height: 36, borderRadius: 10,
            border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s ease', fontFamily: 'inherit',
            outline: 'none', flexShrink: 0, padding: '0 10px',
            fontSize: 13, fontWeight: 500,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#ffffff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Tools
        </button>

        <div style={{ flex: 1 }} />

        {/* Tool icon — 40px accent circle */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: `${gradient[0]}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={gradient[0]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', margin: 0, wordBreak: 'break-word' }}>{title}</h1>
            {badge && (
              <span style={{
                padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                background: badgeColor ?? `${gradient[0]}25`,
                color: badgeColor ? '#fff' : gradient[0],
              }}>
                {badge}
              </span>
            )}
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', wordBreak: 'break-word' }}>{subtitle}</p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      {comingSoon && (
        <div style={{
          margin: '16px 20px 0',
          padding: '14px 18px',
          borderRadius: 16,
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${gradient[0]}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={gradient[0]} strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>{t('tools.comingSoon')}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{t('tools.comingSoonDesc')}</div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{
        padding: '20px 20px', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>
        <div style={{
          background: '#1a1a1a',
          borderRadius: 16,
          padding: 24,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* Reusable upload area — dark style */
export function UploadArea({ C, accept, onFile, label }: {
  C: Theme; accept?: string; onFile: (file: File) => void; label?: string;
}) {
  const t = useLocaleStore((s) => s.t);
  return (
    <label
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px', borderRadius: 16,
        border: '2px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
        cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <span style={{ fontSize: 15, fontWeight: 600, color: '#ffffff', marginTop: 12 }}>
        {label ?? t('tools.defaultDropLabel')}
      </span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
        {accept ?? t('tools.allFormatsSupported')}
      </span>
      <input type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onFile(f);
        e.target.value = '';
      }} />
    </label>
  );
}

/* Reusable action button — dark style with accent gradient + glow */
export function ActionButton({ label, gradient, onClick, disabled, loading }: {
  label: string; gradient: [string, string]; onClick: () => void; disabled?: boolean; loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      style={{
        padding: '12px 32px', borderRadius: 12, border: 'none',
        height: 44,
        background: (disabled || loading)
          ? 'rgba(255,255,255,0.08)'
          : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        color: (disabled || loading) ? 'rgba(255,255,255,0.3)' : '#fff',
        fontSize: 15, fontWeight: 600,
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease', fontFamily: 'inherit',
        boxShadow: (disabled || loading) ? 'none' : `0 4px 20px ${gradient[0]}40`,
        opacity: loading ? 0.7 : 1,
        display: 'flex', alignItems: 'center', gap: 8,
        outline: 'none',
      }}
      onFocus={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.boxShadow = `0 0 0 3px ${gradient[0]}44, 0 4px 20px ${gradient[0]}40`;
        }
      }}
      onBlur={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.boxShadow = `0 4px 20px ${gradient[0]}40`;
        } else {
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.opacity = '0.85';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = loading ? '0.7' : '1';
      }}
    >
      {loading && (
        <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,.3)" strokeWidth="2" fill="none" />
          <path d="M8 2a6 6 0 014.47 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      )}
      {label}
    </button>
  );
}

/* Reusable result preview — dark style */
export function ResultPreview({ C, label }: { C: Theme; label: string }) {
  return (
    <div style={{
      padding: '48px 24px', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)',
      textAlign: 'center',
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" opacity={0.4}>
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
      </svg>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>{label}</p>
    </div>
  );
}
