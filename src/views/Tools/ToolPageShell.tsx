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
    <div style={{ width: '100%', minHeight: '100vh', background: C.bg }}>
      {/* Header */}
      <div style={{
        padding: '12px 12px',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => router.push('/tools')}
          aria-label="Back to tools"
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.card,
            color: C.text, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease', fontFamily: 'inherit',
            outline: 'none', flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
          onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${gradient[0]}44`; }}
          onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px ${gradient[0]}33`, flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0, wordBreak: 'break-word' }}>{title}</h1>
            {badge && (
              <span style={{
                padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                background: badgeColor ?? `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                color: '#fff',
              }}>
                {badge}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: C.sub, margin: '4px 0 0', wordBreak: 'break-word' }}>{subtitle}</p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      {comingSoon && (
        <div style={{
          margin: '12px 12px 0',
          padding: '12px 14px',
          borderRadius: 12,
          background: `linear-gradient(135deg, ${gradient[0]}12, ${gradient[1]}12)`,
          border: `1px solid ${gradient[0]}30`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t('tools.comingSoon')}</div>
            <div style={{ fontSize: 12, color: C.sub }}>{t('tools.comingSoonDesc')}</div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{
        padding: '16px 12px', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>
        {children}
      </div>
    </div>
  );
}

/* Reusable upload area */
export function UploadArea({ C, accept, onFile, label }: {
  C: Theme; accept?: string; onFile: (file: File) => void; label?: string;
}) {
  const t = useLocaleStore((s) => s.t);
  return (
    <label
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px', borderRadius: 16,
        border: `2px dashed ${C.border}`, background: C.surface,
        cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.text; e.currentTarget.style.background = C.card; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <span style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 12 }}>
        {label ?? t('tools.defaultDropLabel')}
      </span>
      <span style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
        {accept ?? t('tools.allFormatsSupported')}
      </span>
      <input type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onFile(f);
        // Reset value so re-uploading same file triggers change
        e.target.value = '';
      }} />
    </label>
  );
}

/* Reusable action button */
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
        background: (disabled || loading) ? 'rgba(128,128,128,.45)' : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        color: '#fff', fontSize: 15, fontWeight: 700,
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease', fontFamily: 'inherit',
        boxShadow: (disabled || loading) ? 'none' : `0 4px 16px ${gradient[0]}33`,
        opacity: loading ? 0.7 : 1,
        display: 'flex', alignItems: 'center', gap: 8,
        outline: 'none',
      }}
      onFocus={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.boxShadow = `0 4px 16px ${gradient[0]}33, 0 0 0 2px ${gradient[0]}66`;
        }
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = (disabled || loading) ? 'none' : `0 4px 16px ${gradient[0]}33`;
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = `0 6px 20px ${gradient[0]}44`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = (disabled || loading) ? 'none' : `0 4px 16px ${gradient[0]}33`;
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

/* Reusable result preview */
export function ResultPreview({ C, label }: { C: Theme; label: string }) {
  return (
    <div style={{
      padding: '48px 24px', borderRadius: 16,
      border: `1px solid ${C.border}`, background: C.card,
      textAlign: 'center',
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" opacity={0.4}>
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
      </svg>
      <p style={{ fontSize: 13, color: C.dim, marginTop: 12 }}>{label}</p>
    </div>
  );
}
