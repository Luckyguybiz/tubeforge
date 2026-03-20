'use client';

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorFallback } from '@/components/ui/ErrorFallback';
import { toast } from '@/stores/useNotificationStore';
import { pluralRu, timeAgo } from '@/lib/utils';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';
import { ExportButton } from '@/components/project/ExportButton';
import { ImportModal } from '@/components/project/ImportModal';

/* ── Status config ─────────────────────────────────────── */

const STATUS_COLOR: Record<string, 'green' | 'orange' | 'blue' | 'dim' | 'purple'> = {
  PUBLISHED: 'green',
  READY: 'blue',
  RENDERING: 'orange',
  DRAFT: 'dim',
};

function getStatusLabel(status: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    PUBLISHED: t('dashboard.statusPublished'),
    READY: t('dashboard.statusReady'),
    RENDERING: t('dashboard.statusRendering'),
    DRAFT: t('dashboard.statusDraft'),
  };
  return map[status] ?? t('dashboard.statusDraft');
}

function getFilterOptions(t: (key: string) => string) {
  return [
    { label: t('dashboard.filterAll'),       value: undefined },
    { label: t('dashboard.filterDraft'),     value: 'DRAFT'     as const },
    { label: t('dashboard.filterRendering'), value: 'RENDERING' as const },
    { label: t('dashboard.filterReady'),     value: 'READY'     as const },
    { label: t('dashboard.filterPublished'), value: 'PUBLISHED' as const },
  ];
}

function getSortOptions(t: (key: string) => string) {
  return [
    { label: t('dashboard.sortByDate'),    value: 'updatedAt'  as const },
    { label: t('dashboard.sortByTitle'),   value: 'title'      as const },
    { label: t('dashboard.sortByCreated'), value: 'createdAt'  as const },
  ];
}

function getPlanLabel(plan: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    FREE: t('common.free'),
    PRO: t('common.pro'),
    STUDIO: t('common.studio'),
  };
  return map[plan] ?? plan;
}

/* ── SVG icons (inline, no deps) ───────────────────────── */

function IconFilm({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" /><line x1="17" y1="17" x2="22" y2="17" />
    </svg>
  );
}

function IconPlus({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconSearch({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconFolder({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

function IconSend({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconStar({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconTrash({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function IconEdit({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconChevronLeft({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconPlay({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function IconImage({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
function IconArrowRight({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/* ── Additional icons for welcome section ─────────────── */

function IconWrench({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconSparkles({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M18 14l.67 2 2 .67-2 .67L18 19.33l-.67-2-2-.67 2-.67L18 14z" />
    </svg>
  );
}
function IconDownload({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function IconUploadSmall({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}


function IconScissors({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

/* ── Additional icons for welcome section tools ── */

function IconMusic({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function IconCompress({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function IconChart({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

/* ── Welcome Section (minimalist, Crayo-style) ───────── */

function WelcomeSection({
  C,
  router,
  t,
}: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  router: ReturnType<typeof useRouter>;
  t: (key: string) => string;
}) {
  const [hov, setHov] = useState<string | null>(null);

  return (
    <div style={{ marginBottom: 28 }}>

      {/* ── Row 1: Three action cards (compact, horizontal) ── */}
      <div className="tf-dash-welcome-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {/* Card 1: Video Editor */}
        <div
          className="tf-dash-welcome-card"
          onClick={() => router.push('/editor')}
          onMouseEnter={() => setHov('ac-0')}
          onMouseLeave={() => setHov(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/editor'); } }}
          style={{
            flex: '1 1 220px',
            minWidth: 200,
            height: 72,
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            borderRadius: 14,
            padding: '0 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            transition: 'all .15s ease',
            transform: hov === 'ac-0' ? 'translateY(-1px)' : 'none',
            boxShadow: hov === 'ac-0' ? '0 6px 20px rgba(79,70,229,.3)' : '0 2px 8px rgba(0,0,0,.08)',
          }}
        >
          <IconPlay size={18} color="#fff" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-.01em' }}>{t('dashboard.videoEditor')}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('dashboard.videoEditorDesc')}</div>
          </div>
          <IconArrowRight size={14} color="rgba(255,255,255,.6)" />
        </div>

        {/* Card 2: AI Generation */}
        <div
          className="tf-dash-welcome-card"
          onClick={() => router.push('/editor')}
          onMouseEnter={() => setHov('ac-1')}
          onMouseLeave={() => setHov(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/editor'); } }}
          style={{
            flex: '1 1 220px',
            minWidth: 200,
            height: 72,
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            borderRadius: 14,
            padding: '0 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            transition: 'all .15s ease',
            transform: hov === 'ac-1' ? 'translateY(-1px)' : 'none',
            boxShadow: hov === 'ac-1' ? '0 6px 20px rgba(124,58,237,.3)' : '0 2px 8px rgba(0,0,0,.08)',
          }}
        >
          <IconSparkles size={18} color="#fff" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-.01em' }}>{t('dashboard.aiGeneration')}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('dashboard.aiGenerationDesc')}</div>
          </div>
          <IconArrowRight size={14} color="rgba(255,255,255,.6)" />
        </div>

        {/* Card 3: Free tools */}
        <div
          className="tf-dash-welcome-card"
          onClick={() => router.push('/tools')}
          onMouseEnter={() => setHov('ac-2')}
          onMouseLeave={() => setHov(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/tools'); } }}
          style={{
            flex: '1 1 220px',
            minWidth: 200,
            height: 72,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: '0 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            transition: 'all .15s ease',
            transform: hov === 'ac-2' ? 'translateY(-1px)' : 'none',
            boxShadow: hov === 'ac-2' ? '0 6px 20px rgba(0,0,0,.08)' : '0 1px 4px rgba(0,0,0,.04)',
          }}
        >
          <IconWrench size={18} color={C.text} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-.01em' }}>{t('dashboard.freeTools')}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#fff',
                background: '#10b981', borderRadius: 4, padding: '1px 5px',
                lineHeight: '16px', letterSpacing: '.02em',
              }}>FREE</span>
            </div>
            <div style={{ fontSize: 12, color: C.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('dashboard.freeToolsDesc')}</div>
          </div>
          <IconArrowRight size={14} color={C.dim} />
        </div>
      </div>

      {/* ── Row 2: Two featured tool cards ────────────────── */}
      <div className="tf-dash-featured-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {/* AutoClip */}
        <div
          className="tf-dash-featured-card"
          onClick={() => router.push('/tools/autoclip')}
          onMouseEnter={() => setHov('ft-0')}
          onMouseLeave={() => setHov(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/tools/autoclip'); } }}
          style={{
            flex: '1 1 260px',
            minWidth: 0,
            minHeight: 180,
            borderRadius: 16,
            padding: 2,
            background: 'linear-gradient(135deg, #8b5cf6, #c084fc, #8b5cf6)',
            cursor: 'pointer',
            transition: 'all .15s ease',
            transform: hov === 'ft-0' ? 'translateY(-1px)' : 'none',
            boxShadow: hov === 'ft-0' ? '0 8px 24px rgba(139,92,246,.2)' : '0 2px 8px rgba(0,0,0,.05)',
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
            borderRadius: 14,
            padding: '22px 20px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <IconScissors size={20} color="#fff" />
                <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-.01em' }}>AutoClip</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#fff',
                  background: 'rgba(255,255,255,.2)', borderRadius: 4, padding: '1px 6px',
                  lineHeight: '16px',
                }}>Pro</span>
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)', lineHeight: 1.5 }}>
                {t('dashboard.autoClipDesc')}
              </div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 13, fontWeight: 600, color: '#fff',
              opacity: hov === 'ft-0' ? 1 : 0.8, transition: 'opacity .15s ease',
              marginTop: 14,
            }}>
              {t('dashboard.tryIt')}
            </div>
          </div>
        </div>

        {/* Cut & Crop */}
        <div
          className="tf-dash-featured-card"
          onClick={() => router.push('/tools/cut-crop')}
          onMouseEnter={() => setHov('ft-1')}
          onMouseLeave={() => setHov(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/tools/cut-crop'); } }}
          style={{
            flex: '1 1 260px',
            minWidth: 0,
            minHeight: 180,
            borderRadius: 16,
            padding: 2,
            background: `linear-gradient(135deg, ${C.border}, ${C.dim}40, ${C.border})`,
            cursor: 'pointer',
            transition: 'all .15s ease',
            transform: hov === 'ft-1' ? 'translateY(-1px)' : 'none',
            boxShadow: hov === 'ft-1' ? '0 8px 24px rgba(0,0,0,.1)' : '0 2px 8px rgba(0,0,0,.05)',
          }}
        >
          <div style={{
            background: C.card,
            borderRadius: 14,
            padding: '22px 20px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <IconScissors size={20} color={C.text} />
                <span style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: '-.01em' }}>Cut & Crop</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#fff',
                  background: '#10b981', borderRadius: 4, padding: '1px 6px',
                  lineHeight: '16px',
                }}>{t('common.free')}</span>
              </div>
              <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.5 }}>
                {t('dashboard.cutCropDesc')}
              </div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 13, fontWeight: 600, color: C.text,
              opacity: hov === 'ft-1' ? 1 : 0.7, transition: 'opacity .15s ease',
              marginTop: 14,
            }}>
              {t('dashboard.tryIt')}
            </div>
          </div>
        </div>
      </div>

      {/* ── ChannelLens Extension Banner ──────────────────── */}
      <a
        href="/downloads/channellens-v1.0.0.zip"
        download
        onMouseEnter={() => setHov('cl-ext')}
        onMouseLeave={() => setHov(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 18px',
          marginBottom: 20,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #0a84ff, #bf5af2)',
          cursor: 'pointer',
          transition: 'all .15s ease',
          transform: hov === 'cl-ext' ? 'translateY(-1px)' : 'none',
          boxShadow: hov === 'cl-ext' ? '0 8px 24px rgba(10,132,255,.3)' : '0 2px 8px rgba(0,0,0,.08)',
          textDecoration: 'none',
          color: '#fff',
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            <path d="M8 11h6" strokeWidth="1.5"/><path d="M11 8v6" strokeWidth="1.5"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.01em' }}>ChannelLens</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', marginTop: 1 }}>
            Chrome extension — analyze any YouTube channel's revenue & competitors
          </div>
        </div>
        <div style={{
          padding: '6px 14px', borderRadius: 8,
          background: 'rgba(255,255,255,0.2)',
          fontSize: 12, fontWeight: 700,
          whiteSpace: 'nowrap',
        }}>
          Download
        </div>
      </a>

      {/* ── Row 3: Quick tools strip ─────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: '-.01em' }}>{t('dashboard.tools')}</h2>
          <span
            onClick={() => router.push('/tools')}
            onMouseEnter={() => setHov('all-tools')}
            onMouseLeave={() => setHov(null)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/tools'); } }}
            style={{
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              opacity: hov === 'all-tools' ? 1 : 0.5, transition: 'opacity .15s ease',
            }}
          >
            {t('dashboard.allTools')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
          {([
            { title: 'YouTube Downloader', href: '/tools/youtube-downloader', Icon: IconDownload, gradient: 'linear-gradient(135deg, #ef4444, #f87171)', badge: 'Free', badgeColor: '#10b981' },
            { title: t('dashboard.tool.mp3Converter'), href: '/tools/mp3-converter', Icon: IconMusic, gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', badge: 'Free', badgeColor: '#10b981' },
            { title: 'Video Compressor', href: '/tools/video-compressor', Icon: IconCompress, gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)', badge: 'Free', badgeColor: '#10b981' },
            { title: t('dashboard.tool.aiThumbnails'), href: '/thumbnails', Icon: IconImage, gradient: 'linear-gradient(135deg, #ec4899, #f472b6)', badge: 'Pro', badgeColor: '#8b5cf6' },
            { title: 'AI SEO', href: '/metadata', Icon: IconSearch, gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', badge: 'Pro', badgeColor: '#8b5cf6' },
            { title: t('dashboard.tool.shortsAnalytics'), href: '/shorts-analytics', Icon: IconChart, gradient: 'linear-gradient(135deg, #10b981, #34d399)', badge: 'Free', badgeColor: '#10b981' },
          ] as const).map((tool) => (
            <div
              key={tool.href}
              onClick={() => router.push(tool.href)}
              onMouseEnter={() => setHov(`qt-${tool.href}`)}
              onMouseLeave={() => setHov(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(tool.href); } }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                width: 80,
                minWidth: 72,
                padding: '10px 4px',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all .15s ease',
                transform: hov === `qt-${tool.href}` ? 'translateY(-1px)' : 'none',
                background: hov === `qt-${tool.href}` ? `${C.surface}` : 'transparent',
                flexShrink: 0,
              }}
            >
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: tool.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: hov === `qt-${tool.href}` ? '0 4px 12px rgba(0,0,0,.12)' : '0 1px 4px rgba(0,0,0,.06)',
                  transition: 'box-shadow .15s ease',
                }}>
                  <tool.Icon size={20} color="#fff" />
                </div>
                <span style={{
                  position: 'absolute', top: -4, right: -8,
                  fontSize: 9, fontWeight: 700, color: '#fff',
                  background: tool.badgeColor, borderRadius: 4, padding: '0px 4px',
                  lineHeight: '15px', letterSpacing: '.02em',
                }}>
                  {tool.badge}
                </span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, textAlign: 'center',
                lineHeight: 1.2, color: C.sub,
              }}>
                {tool.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Empty state illustration ──────────────────────────── */

function EmptyIllustration({ color, dimColor, label }: { color: string; dimColor: string; label: string }) {
  return (
    <svg width="160" height="130" viewBox="0 0 160 130" fill="none">
      {/* Film strip */}
      <rect x="30" y="20" width="100" height="70" rx="10" stroke={dimColor} strokeWidth="2" strokeDasharray="6 4" />
      <rect x="42" y="35" width="24" height="18" rx="4" fill={`${color}18`} stroke={color} strokeWidth="1.2" />
      <rect x="72" y="35" width="24" height="18" rx="4" fill={`${color}18`} stroke={color} strokeWidth="1.2" />
      <rect x="102" y="35" width="24" height="18" rx="4" fill={`${color}10`} stroke={dimColor} strokeWidth="1" strokeDasharray="3 3" />
      {/* Play button */}
      <circle cx="80" cy="78" r="12" fill={`${color}20`} stroke={color} strokeWidth="1.5" />
      <polygon points="76,72 88,78 76,84" fill={color} />
      {/* Plus badge */}
      <circle cx="120" cy="28" r="14" fill={color} />
      <line x1="120" y1="22" x2="120" y2="34" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="114" y1="28" x2="126" y2="28" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      {/* Sparkles */}
      <circle cx="25" cy="50" r="2" fill={`${color}40`} />
      <circle cx="138" cy="65" r="1.5" fill={`${color}30`} />
      <circle cx="45" cy="100" r="1.8" fill={`${color}25`} />
      <text x="80" y="118" textAnchor="middle" fill={dimColor} fontSize="10" fontWeight="500" fontFamily="inherit">
        {label}
      </text>
    </svg>
  );
}

/* ── Skeleton cards for grid loading ───────────────────── */

function ProjectCardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Skeleton height={140} style={{ borderRadius: '14px 14px 0 0' }} />
      <div style={{ padding: '14px 16px 16px' }}>
        <Skeleton height={16} width="70%" style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton height={12} width="40%" />
          <Skeleton height={24} width={80} rounded />
        </div>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div style={{ flex: '1 1 0', minWidth: 140 }}>
      <Skeleton height={90} style={{ borderRadius: 14 }} />
    </div>
  );
}

/* ── ProjectCard (memoized) ─────────────────────────────── */

interface ProjectCardItem {
  id: string;
  title: string;
  status: string;
  thumbnailUrl: string | null;
  updatedAt: string | Date;
  _count?: { scenes: number };
}

interface ProjectCardProps {
  project: ProjectCardItem;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  t: (key: string) => string;
  isDeleting: boolean;
  isRenaming: boolean;
  renameValue: string;
  renameRef: React.RefObject<HTMLInputElement | null>;
  deleteIsPending: boolean;
  onNavigate: (id: string) => void;
  onDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onRename: (id: string) => void;
  onStartRename: (id: string, title: string) => void;
  onCancelRename: () => void;
  onRenameChange: (val: string) => void;
  onDuplicate: (id: string) => void;
}

const ProjectCard = memo(function ProjectCard({
  project: p,
  C,
  t,
  isDeleting,
  isRenaming,
  renameValue,
  renameRef,
  deleteIsPending,
  onNavigate,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onRename,
  onStartRename,
  onCancelRename,
  onRenameChange,
  onDuplicate,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hovBtn, setHovBtn] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const stColor = STATUS_COLOR[p.status] ?? 'dim';
  const statusColor = C[stColor as keyof typeof C] ?? C.dim;
  const statusLabel = getStatusLabel(p.status, t);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: C.surface,
        border: `1px solid ${isHovered ? C.borderActive : C.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all .25s cubic-bezier(.4,0,.2,1)',
        transform: isHovered ? 'translateY(-3px)' : 'none',
        boxShadow: isHovered
          ? '0 8px 30px rgba(0,0,0,.15), 0 2px 8px rgba(0,0,0,.08)'
          : '0 1px 3px rgba(0,0,0,.04)',
        opacity: deleteIsPending && isDeleting ? 0.4 : 1,
        position: 'relative',
      }}
      onClick={() => {
        if (!isDeleting && !isRenaming) onNavigate(p.id);
      }}
    >
      {/* Thumbnail area */}
      <div style={{
        width: '100%',
        height: 140,
        background: `linear-gradient(135deg, ${C.card}, ${C.bg})`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {p.thumbnailUrl && !imgError ? (
          <Image
            src={p.thumbnailUrl}
            alt={p.title}
            fill
            onError={() => setImgError(true)}
            style={{
              objectFit: 'cover',
              transition: 'transform .4s cubic-bezier(.4,0,.2,1)',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 6,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: `${C.accent}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform .3s ease',
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            }}>
              <IconFilm size={24} color={C.dim} />
            </div>
          </div>
        )}

        {/* Status badge — top-right */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          padding: '4px 10px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.02em',
          background: `${statusColor}20`,
          color: statusColor,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: `1px solid ${statusColor}30`,
        }}>
          {statusLabel}
        </div>

        {/* Scene count badge — bottom-left */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          padding: '3px 8px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          background: 'rgba(0,0,0,.55)',
          color: '#e8e8f0',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}>
          {pluralRu(p._count?.scenes ?? 0, t('dashboard.scene.one'), t('dashboard.scene.few'), t('dashboard.scene.many'))}
        </div>

        {/* Hover overlay with play icon */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `rgba(0,0,0,${isHovered ? '.25' : '0'})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .25s ease',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'scale(1)' : 'scale(.7)',
            transition: 'all .25s cubic-bezier(.4,0,.2,1)',
            boxShadow: '0 4px 12px rgba(0,0,0,.2)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#111">
              <polygon points="6,3 21,12 6,21" />
            </svg>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Title / rename */}
        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            maxLength={100}
            aria-label={t('dashboard.renameProject')}
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={() => onRename(p.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRename(p.id);
              if (e.key === 'Escape') onCancelRename();
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: 14, fontWeight: 600,
              border: `1.5px solid ${C.accent}`,
              borderRadius: 8, padding: '5px 8px',
              background: C.card, color: C.text,
              fontFamily: 'inherit', width: '100%',
              marginBottom: 8,
            }}
          />
        ) : (
          <div style={{
            fontSize: 14, fontWeight: 600, marginBottom: 8,
            lineHeight: 1.4, letterSpacing: '-.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {p.title}
          </div>
        )}

        {/* Footer: date + actions */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, color: C.sub, fontWeight: 400 }}>
            {timeAgo(p.updatedAt)}
          </span>

          {/* Action buttons */}
          <div style={{
            display: 'flex', gap: 4, alignItems: 'center',
            opacity: isHovered || isDeleting ? 1 : 0,
            transition: 'opacity .2s ease',
          }} onClick={(e) => e.stopPropagation()}>
            {isDeleting ? (
              <>
                <span style={{
                  fontSize: 11, color: C.sub, fontWeight: 500,
                  maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  marginRight: 4,
                }}>
                  {t('dashboard.deleteConfirm')}
                </span>
                <button
                  onClick={() => onConfirmDelete(p.id)}
                  disabled={deleteIsPending}
                  style={{
                    padding: '6px 12px', borderRadius: 7, border: 'none',
                    background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                    minHeight: 32,
                  }}
                >
                  {deleteIsPending ? '...' : t('dashboard.yes')}
                </button>
                <button
                  onClick={() => onCancelDelete()}
                  style={{
                    padding: '6px 12px', borderRadius: 7,
                    border: `1px solid ${C.border}`, background: 'transparent',
                    color: C.sub, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all .15s',
                    minHeight: 32,
                  }}
                >
                  {t('dashboard.no')}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartRename(p.id, p.title);
                  }}
                  title={t('dashboard.rename')}
                  aria-label={`${t('dashboard.rename')} ${p.title}`}
                  onMouseEnter={() => setHovBtn(`rename-${p.id}`)}
                  onMouseLeave={() => setHovBtn(null)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: `1px solid ${hovBtn === `rename-${p.id}` ? C.borderActive : C.border}`,
                    background: hovBtn === `rename-${p.id}` ? C.card : 'transparent',
                    color: C.sub, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s ease',
                    /* Invisible touch target expansion for mobile */
                    position: 'relative',
                  }}
                >
                  <IconEdit size={14} color={C.sub} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(p.id);
                  }}
                  title={t('dashboard.duplicate')}
                  aria-label={`${t('dashboard.duplicate')} ${p.title}`}
                  onMouseEnter={() => setHovBtn(`dup-${p.id}`)}
                  onMouseLeave={() => setHovBtn(null)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: `1px solid ${hovBtn === `dup-${p.id}` ? C.borderActive : C.border}`,
                    background: hovBtn === `dup-${p.id}` ? C.card : 'transparent',
                    color: C.sub, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s ease',
                  }}
                >
                  <IconPlus size={14} color={C.sub} />
                </button>
                <ExportButton projectId={p.id} projectTitle={p.title} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(p.id);
                  }}
                  title={t('dashboard.deleteProject')}
                  aria-label={`${t('dashboard.deleteProject')} ${p.title}`}
                  onMouseEnter={() => setHovBtn(`delete-${p.id}`)}
                  onMouseLeave={() => setHovBtn(null)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: `1px solid ${hovBtn === `delete-${p.id}` ? '#ef444440' : C.border}`,
                    background: hovBtn === `delete-${p.id}` ? '#ef444412' : 'transparent',
                    color: hovBtn === `delete-${p.id}` ? '#ef4444' : C.sub,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s ease',
                  }}
                >
                  <IconTrash size={14} color={hovBtn === `delete-${p.id}` ? '#ef4444' : C.sub} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});


/* ── Referral Widget ────────────────────────────────── */

function ReferralWidget({
  C,
  t,
}: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  t: (key: string) => string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [hov, setHov] = useState(false);

  const myReferral = trpc.referral.getMyReferral.useQuery();
  const referralCode = myReferral.data?.code ?? null;
  const referralLink = referralCode ? `https://tubeforge.co?ref=${referralCode}` : '';

  const handleCopy = useCallback(async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = referralLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralLink]);

  if (myReferral.isLoading) return null;

  return (
    <div
      style={{
        marginBottom: 28,
        padding: 2,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #6366f1, #a855f7, #6366f1)',
        cursor: 'pointer',
        transition: 'all .15s ease',
        transform: hov ? 'translateY(-1px)' : 'none',
        boxShadow: hov ? '0 8px 24px rgba(99,102,241,.2)' : '0 2px 8px rgba(0,0,0,.05)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => router.push('/referral')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/referral'); } }}
    >
      <div style={{
        background: C.card,
        borderRadius: 14,
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="8" width="16" height="10" rx="2" stroke="#fff" strokeWidth="1.5" />
              <path d="M10 8V18" stroke="#fff" strokeWidth="1.5" />
              <path d="M2 11H18" stroke="#fff" strokeWidth="1.5" />
              <path d="M10 8C10 8 10 4 7 4C5.5 4 4 5 5 6.5C6 8 10 8 10 8Z" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10 8C10 8 10 4 13 4C14.5 4 16 5 15 6.5C14 8 10 8 10 8Z" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-.01em' }}>
              {t('dashboard.referralWidget.title')}
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
              {t('dashboard.referralWidget.desc')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {referralCode ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: 8,
                border: 'none',
                background: copied
                  ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all .2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {copied ? t('dashboard.referralWidget.copied') : t('dashboard.referralWidget.copy')}
            </button>
          ) : (
            <span style={{
              height: 36,
              padding: '0 14px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}>
              {t('dashboard.referralWidget.activate')}
            </span>
          )}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#6366f1',
              whiteSpace: 'nowrap',
            }}
          >
            {t('dashboard.referralWidget.goToReferral')}
            <span style={{ marginLeft: 4 }}>&rarr;</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard Component ──────────────────────────── */

export function Dashboard() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();

  /* ── Local state (initialized from URL params) ── */
  const [searchInput, setSearchInput] = useState(() => searchParams?.get('q') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams?.get('q') ?? '');
  const [statusFilter, setStatusFilter] = useState<'DRAFT' | 'RENDERING' | 'READY' | 'PUBLISHED' | undefined>(() => {
    const sp = searchParams?.get('status');
    if (sp === 'DRAFT' || sp === 'RENDERING' || sp === 'READY' || sp === 'PUBLISHED') return sp;
    return undefined;
  });
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>(() => {
    const sp = searchParams?.get('sort');
    if (sp === 'updatedAt' || sp === 'createdAt' || sp === 'title') return sp;
    return 'updatedAt';
  });
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef<HTMLInputElement>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  /* ── Auto-trigger checkout when arriving from pricing CTA ── */
  const initCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('initCheckout');
    if (plan === 'PRO' || plan === 'STUDIO') {
      window.history.replaceState({}, '', '/dashboard');
      initCheckout.mutate({ plan });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Show toast on successful plan upgrade ───── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      toast.success(t('billing.upgradeSuccess'));
      window.history.replaceState({}, '', '/dashboard');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Debounce search ──────────────────────────── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ── Sync filter state to URL ───────────────── */
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (statusFilter) params.set('status', statusFilter);
    if (sortBy !== 'updatedAt') params.set('sort', sortBy);
    const qs = params.toString();
    router.replace(`/dashboard${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [debouncedSearch, statusFilter, sortBy, router]);

  /* ── tRPC queries ─────────────────────────────── */
  const profile = trpc.user.getProfile.useQuery();
  const totalProjects = trpc.project.list.useQuery({ page: 1, limit: 1 });
  const projects = trpc.project.list.useQuery({
    search: debouncedSearch || undefined,
    status: statusFilter,
    sortBy,
    page,
    limit: 12,
  });

  /* ── tRPC mutations ───────────────────────────── */
  const createProject = trpc.project.create.useMutation({
    onSuccess: (project) => {
      toast.success(t('dashboard.projectCreated'));
      utils.project.list.invalidate();
      utils.user.getProfile.invalidate();
      router.push(`/editor?projectId=${project.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteProject = trpc.project.delete.useMutation({
    onSuccess: () => {
      toast.success(t('dashboard.projectDeleted'));
      setDeleteId(null);
      utils.project.list.invalidate();
      utils.user.getProfile.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
      setDeleteId(null);
    },
  });

  const renameProject = trpc.project.update.useMutation({
    onSuccess: () => {
      toast.success(t('dashboard.projectRenamed'));
      setRenameId(null);
      utils.project.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const duplicateProject = trpc.project.duplicate.useMutation({
    onSuccess: () => {
      toast.success(t('dashboard.projectDuplicated'));
      utils.project.list.invalidate();
      utils.user.getProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  /* ── Focus rename input ───────────────────────── */
  useEffect(() => {
    if (renameId && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [renameId]);

  /* ── Rename handler ───────────────────────────── */
  const handleRename = useCallback((id: string) => {
    const val = renameValue.trim();
    if (val && val.length <= 100) {
      renameProject.mutate({ id, title: val });
    } else {
      if (!val) toast.warning(t('dashboard.emptyName'));
      setRenameId(null);
    }
  }, [renameValue, renameProject, t]);

  /* ── Card callbacks (stable refs for memo) ──── */
  const handleNavigate = useCallback((id: string) => {
    router.push(`/editor?projectId=${id}`);
  }, [router]);

  const handleSetDeleteId = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const handleConfirmDelete = useCallback((id: string) => {
    deleteProject.mutate({ id });
  }, [deleteProject]);

  const handleCancelDelete = useCallback(() => {
    setDeleteId(null);
  }, []);

  const handleStartRename = useCallback((id: string, title: string) => {
    setRenameId(id);
    setRenameValue(title);
  }, []);

  const handleCancelRename = useCallback(() => {
    setRenameId(null);
  }, []);

  const handleRenameChange = useCallback((val: string) => {
    setRenameValue(val);
  }, []);

  const handleDuplicate = useCallback((id: string) => {
    duplicateProject.mutate({ id });
  }, [duplicateProject]);

  /* ── Compute stats ────────────────────────────── */
  const user = profile.data;
  const plan = user?.plan ?? 'FREE';
  const stats = useMemo(() => {
    const total = totalProjects.data?.total ?? user?._count?.projects ?? 0;
    // Count statuses from the unfiltered first-page query hint — for accurate stats
    // we rely on totalProjects (which has no filter). For status breakdown we check
    // the currently loaded items. Since the stats query only fetches 1 item, we use
    // the total count from profile for project count, and we cannot get per-status
    // counts without separate queries. Keep it simple and useful.
    return [
      {
        label: t('dashboard.totalProjects'),
        value: String(total),
        icon: IconFolder,
        gradient: `linear-gradient(135deg, ${C.accent}18, ${C.accent}08)`,
        iconColor: C.accent,
      },
      {
        label: t('dashboard.plan'),
        value: getPlanLabel(plan, t),
        icon: IconStar,
        gradient: `linear-gradient(135deg, ${C.purple}18, ${C.purple}08)`,
        iconColor: C.purple,
      },
      {
        label: t('dashboard.aiRequests'),
        value: String(user?.aiUsage ?? 0),
        icon: IconFilm,
        gradient: `linear-gradient(135deg, ${C.blue}18, ${C.blue}08)`,
        iconColor: C.blue,
      },
      {
        label: t('dashboard.channels'),
        value: String(user?.channels?.length ?? 0),
        icon: IconSend,
        gradient: `linear-gradient(135deg, ${C.green}18, ${C.green}08)`,
        iconColor: C.green,
      },
    ];
  }, [totalProjects.data?.total, user?._count?.projects, plan, user?.aiUsage, user?.channels?.length, C, t]);

  /* ── Error states ─────────────────────────────── */
  if (profile.isError) {
    const err = profile.error;
    return (
      <ErrorFallback
        error={err instanceof Error ? err : new Error((err as { message?: string })?.message ?? String(err))}
        reset={() => profile.refetch()}
      />
    );
  }
  if (projects.isError) {
    const err = projects.error;
    return (
      <ErrorFallback
        error={err instanceof Error ? err : new Error((err as { message?: string })?.message ?? String(err))}
        reset={() => projects.refetch()}
      />
    );
  }

  const hasFilters = !!(debouncedSearch || statusFilter);
  const isEmpty = !projects.data?.items?.length;
  const totalPages = projects.data?.pages ?? 1;

  return (
    <div className="tf-dash-container" style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 16px', boxSizing: 'border-box' }}>
      {/* ── Welcome Hero Section (Crayo-style) ───────── */}
      <WelcomeSection C={C} router={router} t={t} />

      {/* ── Header ──────────────────────────────────── */}
      <div className="tf-dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="tf-dash-heading" style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-.03em', lineHeight: 1.2 }}>
            {profile.isLoading ? <Skeleton width={260} height={34} /> : `${t('dashboard.hello')}, ${user?.name ?? t('dashboard.creator')}!`}
          </h1>
          <p style={{ color: C.sub, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            {profile.isLoading ? (
              <Skeleton width={160} height={16} style={{ marginTop: 4 }} />
            ) : (
              <>{t('dashboard.manageProjects')}</>
            )}
          </p>
        </div>
        <div className="tf-dash-header-actions" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            className="tf-dash-create-btn"
            data-tour="new-project"
            onClick={() => createProject.mutate({})}
            disabled={createProject.isPending}
            onMouseEnter={() => setHoveredBtn('create-main')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: hoveredBtn === 'create-main' ? C.accent : C.accent,
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '12px 24px', minHeight: 44, fontSize: 15, fontWeight: 700,
              cursor: createProject.isPending ? 'wait' : 'pointer',
              fontFamily: 'inherit', opacity: createProject.isPending ? 0.6 : 1,
              boxShadow: hoveredBtn === 'create-main'
                ? `0 6px 24px ${C.accent}44, 0 0 0 3px ${C.accent}20`
                : `0 4px 16px ${C.accent}33`,
              transition: 'all .25s cubic-bezier(.4,0,.2,1)',
              transform: hoveredBtn === 'create-main' ? 'translateY(-1px)' : 'none',
              letterSpacing: '-.01em',
              flexShrink: 0,
            }}
          >
            <IconPlus size={18} color="#fff" />
            {createProject.isPending ? t('dashboard.creating') : t('dashboard.newProject')}
          </button>
          <button
            className="tf-dash-import-btn"
            onClick={() => setImportOpen(true)}
            onMouseEnter={() => setHoveredBtn('import-main')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent',
              color: C.text, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: '12px 20px', minHeight: 44, fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .2s ease',
              boxShadow: hoveredBtn === 'import-main' ? `0 2px 8px rgba(0,0,0,.08)` : 'none',
              flexShrink: 0,
            }}
          >
            <IconUploadSmall size={16} color={C.sub} />
            {t('dashboard.importProject')}
          </button>
        </div>
      </div>
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />

      {/* ── Stat cards ──────────────────────────────── */}
      <div className="tf-dash-stat-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 28,
      }}>
        {profile.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((s, i) => {
              const StatIcon = s.icon;
              return (
                <div
                  key={i}
                  className="tf-stat-card"
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    padding: '16px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'default',
                    transition: 'box-shadow .25s ease, transform .25s ease, border-color .25s ease',
                    minWidth: 0,
                  }}
                >
                  {/* Gradient accent stripe */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${s.iconColor}, transparent)`,
                    opacity: 0.6,
                  }} />
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 10,
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: s.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <StatIcon size={18} color={s.iconColor} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 0 }}>
                    <div style={{
                      fontSize: 11, color: C.sub, marginBottom: 4, fontWeight: 500,
                      letterSpacing: '.02em', textTransform: 'uppercase',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {s.label}
                    </div>
                    <div className="tf-dash-stat-value" style={{
                      fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.2,
                      color: C.text,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {s.value}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* ── Referral Widget ──────────────────────────── */}
      <ReferralWidget C={C} t={t} />

      {/* ── Projects section ────────────────────────── */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {/* Toolbar */}
        <div className="tf-dash-toolbar" style={{
          padding: '18px 22px 16px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-.01em' }}>
              {t('dashboard.myProjects')}
            </h2>
            {projects.isRefetching && (
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: C.accent, animation: 'pulse 1s infinite',
              }} />
            )}
            {projects.data && !projects.isLoading && (
              <span style={{
                fontSize: 12, color: C.sub, fontWeight: 500,
                background: C.surface, padding: '2px 8px', borderRadius: 6,
              }}>
                {'total' in projects.data ? String(projects.data.total ?? '') : ''}
              </span>
            )}
          </div>

          <div className="tf-dash-toolbar-right" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                pointerEvents: 'none', display: 'flex', alignItems: 'center',
              }}>
                <IconSearch size={15} color={C.dim} />
              </div>
              <input
                className="tf-dash-search-input"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('dashboard.search')}
                aria-label={t('dashboard.searchProjects')}
                style={{
                  padding: '9px 14px 9px 32px',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  color: C.text,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  width: '100%',
                  maxWidth: 180,
                  transition: 'border-color .2s, box-shadow .2s',
                }}
              />
            </div>

            {/* Sort */}
            <select
              className="tf-dash-sort-select"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
              aria-label={t('dashboard.sortProjects')}
              style={{
                padding: '8px 10px',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                color: C.text,
                fontSize: 13,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {getSortOptions(t).map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Status filter pills */}
            <div className="tf-dash-filter-pills" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }} role="group" aria-label={t('dashboard.filterStatus')}>
              {getFilterOptions(t).map((f) => {
                const isActive = statusFilter === f.value;
                return (
                  <button
                    key={f.label}
                    onClick={() => { setStatusFilter(f.value); setPage(1); }}
                    aria-pressed={isActive}
                    onMouseEnter={() => setHoveredBtn(`filter-${f.label}`)}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 9999,
                      border: `1px solid ${isActive ? C.accent : C.border}`,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .2s ease',
                      background: isActive ? C.accentDim : (hoveredBtn === `filter-${f.label}` ? C.surface : 'transparent'),
                      color: isActive ? C.accent : C.sub,
                      whiteSpace: 'nowrap',
                      minHeight: 36,
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="tf-dash-content" style={{ padding: '20px 22px 24px' }}>
          {projects.isLoading ? (
            /* ── Skeleton grid ─────────────── */
            <div className="tf-dash-project-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
              gap: 16,
            }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  background: C.surface,
                  borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  overflow: 'hidden',
                }}>
                  <ProjectCardSkeleton />
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            /* ── Empty state ───────────────── */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
            }}>
              {hasFilters ? (
                <>
                  <div style={{ marginBottom: 16, opacity: 0.6 }}>
                    <IconSearch size={48} color={C.dim} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: C.text }}>
                    {t('dashboard.nothingFound')}
                  </h3>
                  <p style={{ color: C.sub, fontSize: 14, marginBottom: 20, maxWidth: 320, lineHeight: 1.5 }}>
                    {t('dashboard.tryChangingSearch')}
                  </p>
                  <button
                    onClick={() => { setSearchInput(''); setDebouncedSearch(''); setStatusFilter(undefined); setPage(1); }}
                    onMouseEnter={() => setHoveredBtn('reset')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      padding: '11px 28px',
                      borderRadius: 12,
                      background: hoveredBtn === 'reset' ? C.surface : 'transparent',
                      color: C.text,
                      border: `1px solid ${C.border}`,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .2s ease',
                    }}
                  >
                    {t('dashboard.resetFilters')}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <EmptyIllustration color={C.accent} dimColor={C.dim} label={t('dashboard.studioAwaits')} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: C.text, letterSpacing: '-.02em' }}>
                    {t('dashboard.createFirstProject')}
                  </h3>
                  <p style={{ color: C.sub, fontSize: 14, marginBottom: 24, maxWidth: 360, lineHeight: 1.6 }}>
                    {t('dashboard.createFirstDesc')}
                  </p>
                  <button
                    onClick={() => createProject.mutate({})}
                    disabled={createProject.isPending}
                    onMouseEnter={() => setHoveredBtn('create-empty')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '13px 32px',
                      borderRadius: 12,
                      background: C.accent,
                      color: '#fff',
                      border: 'none',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: createProject.isPending ? 'wait' : 'pointer',
                      fontFamily: 'inherit',
                      boxShadow: hoveredBtn === 'create-empty'
                        ? `0 8px 28px ${C.accent}44`
                        : `0 4px 16px ${C.accent}33`,
                      transition: 'all .25s cubic-bezier(.4,0,.2,1)',
                      transform: hoveredBtn === 'create-empty' ? 'translateY(-2px)' : 'none',
                      opacity: createProject.isPending ? 0.6 : 1,
                    }}
                  >
                    <IconPlus size={18} color="#fff" />
                    {createProject.isPending ? t('dashboard.creating') : t('dashboard.createProject')}
                  </button>
                </>
              )}
            </div>
          ) : (
            /* ── Project cards grid ────────── */
            <>
              <div className="tf-dash-project-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
                gap: 16,
              }}>
                {(projects.data?.items ?? []).map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    C={C}
                    t={t}
                    isDeleting={deleteId === p.id}
                    isRenaming={renameId === p.id}
                    renameValue={renameValue}
                    renameRef={renameRef}
                    deleteIsPending={deleteProject.isPending}
                    onNavigate={handleNavigate}
                    onDelete={handleSetDeleteId}
                    onConfirmDelete={handleConfirmDelete}
                    onCancelDelete={handleCancelDelete}
                    onRename={handleRename}
                    onStartRename={handleStartRename}
                    onCancelRename={handleCancelRename}
                    onRenameChange={handleRenameChange}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </div>

              {/* ── Pagination ─────────────────── */}
              {totalPages > 1 && (
                <nav
                  aria-label={t('dashboard.page')}
                  style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    gap: 6, paddingTop: 24, marginTop: 8,
                  }}
                >
                  {/* Prev button */}
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    aria-label={t('dashboard.prevPage')}
                    onMouseEnter={() => setHoveredBtn('page-prev')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      background: hoveredBtn === 'page-prev' && page > 1 ? C.surface : 'transparent',
                      color: page <= 1 ? C.dim : C.sub,
                      cursor: page <= 1 ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'inherit', transition: 'all .15s ease',
                      opacity: page <= 1 ? 0.4 : 1,
                    }}
                  >
                    <IconChevronLeft size={16} color={page <= 1 ? C.dim : C.sub} />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    // Smart pagination: show pages around current page
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    const isCurrent = page === pageNum;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        aria-label={`${t('dashboard.page')} ${pageNum}`}
                        aria-current={isCurrent ? 'page' : undefined}
                        onMouseEnter={() => setHoveredBtn(`page-${pageNum}`)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        style={{
                          width: 36, height: 36, borderRadius: 10,
                          border: `1px solid ${isCurrent ? C.accent : C.border}`,
                          fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all .2s ease',
                          background: isCurrent ? C.accent : (hoveredBtn === `page-${pageNum}` ? C.surface : 'transparent'),
                          color: isCurrent ? '#fff' : C.sub,
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Next button */}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    aria-label={t('dashboard.nextPage')}
                    onMouseEnter={() => setHoveredBtn('page-next')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      background: hoveredBtn === 'page-next' && page < totalPages ? C.surface : 'transparent',
                      color: page >= totalPages ? C.dim : C.sub,
                      cursor: page >= totalPages ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'inherit', transition: 'all .15s ease',
                      opacity: page >= totalPages ? 0.4 : 1,
                    }}
                  >
                    <IconChevronRight size={16} color={page >= totalPages ? C.dim : C.sub} />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
