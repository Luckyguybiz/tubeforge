'use client';

import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import type { Theme } from '@/lib/types';

interface ToolPageShellProps {
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  gradient: [string, string];
  children: React.ReactNode;
}

export function ToolPageShell({ title, subtitle, badge, badgeColor, gradient, children }: ToolPageShellProps) {
  const C = useThemeStore((s) => s.theme);
  const router = useRouter();

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: C.bg }}>
      {/* Header */}
      <div style={{
        padding: '24px 32px',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <button
          onClick={() => router.push('/tools')}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.card,
            color: C.text, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            transition: 'all .2s', fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px ${gradient[0]}33`,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h1>
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
          <p style={{ fontSize: 13, color: C.sub, margin: '4px 0 0' }}>{subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
}

/* Reusable upload area */
export function UploadArea({ C, accept, onFile, label }: {
  C: Theme; accept?: string; onFile: (file: File) => void; label?: string;
}) {
  return (
    <label style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', borderRadius: 16,
      border: `2px dashed ${C.border}`, background: C.surface,
      cursor: 'pointer', transition: 'all .2s', textAlign: 'center',
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <span style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 12 }}>
        {label ?? 'Drop file here or click to upload'}
      </span>
      <span style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
        {accept ?? 'All formats supported'}
      </span>
      <input type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onFile(f);
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
      style={{
        padding: '12px 32px', borderRadius: 12, border: 'none',
        background: disabled ? '#555' : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        color: '#fff', fontSize: 15, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all .2s', fontFamily: 'inherit',
        boxShadow: disabled ? 'none' : `0 4px 16px ${gradient[0]}33`,
        opacity: loading ? 0.7 : 1,
        display: 'flex', alignItems: 'center', gap: 8,
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
