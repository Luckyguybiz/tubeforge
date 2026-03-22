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
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { trackEvent } from '@/lib/analytics-events';
import { TEMPLATES, TEMPLATE_CATEGORIES, CATEGORY_INFO, type ProjectTemplate, type TemplateCategory } from '@/lib/templates';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { ActivityStreak } from '@/components/dashboard/ActivityStreak';
import { UsageMilestones } from '@/components/dashboard/UsageMilestones';
import { logActivity, getRecentActivity, type ActivityEntry, type ActivityType } from '@/lib/activity-log';

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

function IconShareLink({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
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

function IconTranslate({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8l6 0" /><path d="M4 6l8 0" /><path d="M8 6v-1a2 2 0 0 1 2-2h0" />
      <path d="M4 12c1.5-2 3.5-3.5 6-4" /><path d="M10 12c-1.5-2-3.5-3.5-6-4" />
      <path d="M13 15l3.5-7 3.5 7" /><path d="M14 18l1.5-3h5l1.5 3" /><path d="M15 17h4" />
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

function IconSortAsc({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function IconSortDesc({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

function IconClock({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconLayout({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

/* ── Activity type to locale key mapping ─────────────── */

const ACTIVITY_LABEL_MAP: Record<ActivityType, string> = {
  project_created: 'dashboard.activity.projectCreated',
  project_deleted: 'dashboard.activity.projectDeleted',
  project_renamed: 'dashboard.activity.projectRenamed',
  project_duplicated: 'dashboard.activity.projectDuplicated',
  video_generated: 'dashboard.activity.videoGenerated',
  project_exported: 'dashboard.activity.projectExported',
  project_imported: 'dashboard.activity.projectImported',
};

/* ── Recent Activity Feed ────────────────────────────── */

function RecentActivityFeed({
  C,
  t,
  activities,
}: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  t: (key: string) => string;
  activities: ActivityEntry[];
}) {
  if (activities.length === 0) {
    return (
      <div style={{
        background: C.card,
        borderRadius: 12,
        padding: '20px 22px',
        marginBottom: 20,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: C.text }}>
          {t('dashboard.recentActivityTitle')}
        </h3>
        <p style={{ color: C.sub, fontSize: 13, margin: 0 }}>
          {t('dashboard.noRecentActivity')}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: C.card,
      borderRadius: 12,
      padding: '20px 22px',
      marginBottom: 20,
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px', color: C.text }}>
        {t('dashboard.recentActivityTitle')}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activities.map((a) => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 0',
            borderBottom: `1px solid ${C.border}22`,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `${C.accent}14`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconClock size={14} color={C.accent} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t(ACTIVITY_LABEL_MAP[a.type] ?? 'dashboard.activity.projectCreated')}
              </div>
              <div style={{ fontSize: 12, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.label}
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.dim, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {timeAgo(new Date(a.timestamp))}
            </div>
          </div>
        ))}
      </div>
    </div>
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
      <div className="tf-dash-welcome-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
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
            height: 76,
            background: C.card,
            borderRadius: 14,
            padding: '0 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            transition: 'all .2s cubic-bezier(.4,0,.2,1)',
            transform: hov === 'ac-0' ? 'translateY(-2px)' : 'none',
            boxShadow: hov === 'ac-0'
              ? '0 8px 24px rgba(0,0,0,.4)'
              : 'none',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${C.accent}14`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <IconPlay size={18} color={C.accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text, letterSpacing: '-.01em' }}>{t('dashboard.videoEditor')}</div>
            <div style={{ fontSize: 13, color: C.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('dashboard.videoEditorDesc')}</div>
          </div>
          <IconArrowRight size={14} color={C.dim} />
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
            height: 76,
            background: C.card,
            borderRadius: 14,
            padding: '0 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            transition: 'all .2s cubic-bezier(.4,0,.2,1)',
            transform: hov === 'ac-1' ? 'translateY(-2px)' : 'none',
            boxShadow: hov === 'ac-1'
              ? '0 8px 24px rgba(0,0,0,.4)'
              : 'none',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${C.purple}14`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <IconSparkles size={18} color={C.purple} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text, letterSpacing: '-.01em' }}>{t('dashboard.aiGeneration')}</div>
            <div style={{ fontSize: 13, color: C.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('dashboard.aiGenerationDesc')}</div>
          </div>
          <IconArrowRight size={14} color={C.dim} />
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
            height: 76,
            background: C.card,
            borderRadius: 14,
            padding: '0 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            transition: 'all .2s cubic-bezier(.4,0,.2,1)',
            transform: hov === 'ac-2' ? 'translateY(-2px)' : 'none',
            boxShadow: hov === 'ac-2'
              ? '0 8px 24px rgba(0,0,0,.4)'
              : 'none',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${C.green}14`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <IconWrench size={18} color={C.green} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: C.text, letterSpacing: '-.01em' }}>{t('dashboard.freeTools')}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, color: C.green,
                background: `${C.green}12`, borderRadius: 10, padding: '1px 7px',
                lineHeight: '16px', letterSpacing: '.02em',
              }}>FREE</span>
            </div>
            <div style={{ fontSize: 13, color: C.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('dashboard.freeToolsDesc')}</div>
          </div>
          <IconArrowRight size={14} color={C.dim} />
        </div>
      </div>

      {/* ── Row 2: Two featured tool cards ────────────────── */}
      <div className="tf-dash-featured-row" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
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
            minHeight: 170,
            borderRadius: 14,
            background: C.card,
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            transition: 'all .2s cubic-bezier(.4,0,.2,1)',
            transform: hov === 'ft-0' ? 'translateY(-2px)' : 'none',
            boxShadow: hov === 'ft-0'
              ? '0 8px 24px rgba(0,0,0,.4)'
              : 'none',
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${C.purple}14`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <IconScissors size={18} color={C.purple} />
              </div>
              <span style={{ fontSize: 17, fontWeight: 600, color: C.text, letterSpacing: '-.01em' }}>AutoClip</span>
              <span style={{
                fontSize: 10, fontWeight: 600, color: C.purple,
                background: `${C.purple}12`, borderRadius: 10, padding: '1px 8px',
                lineHeight: '16px',
              }}>Pro</span>
            </div>
            <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.5 }}>
              {t('dashboard.autoClipDesc')}
            </div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 13, fontWeight: 600, color: C.accent,
            opacity: hov === 'ft-0' ? 1 : 0.7, transition: 'opacity .15s ease',
            marginTop: 14,
          }}>
            {t('dashboard.tryIt')} <IconArrowRight size={13} color={C.accent} />
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
            minHeight: 170,
            borderRadius: 14,
            background: C.card,
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            transition: 'all .2s cubic-bezier(.4,0,.2,1)',
            transform: hov === 'ft-1' ? 'translateY(-2px)' : 'none',
            boxShadow: hov === 'ft-1'
              ? '0 8px 24px rgba(0,0,0,.4)'
              : 'none',
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${C.green}14`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <IconScissors size={18} color={C.green} />
              </div>
              <span style={{ fontSize: 17, fontWeight: 600, color: C.text, letterSpacing: '-.01em' }}>Cut & Crop</span>
              <span style={{
                fontSize: 10, fontWeight: 600, color: C.green,
                background: `${C.green}12`, borderRadius: 10, padding: '1px 8px',
                lineHeight: '16px',
              }}>{t('common.free')}</span>
            </div>
            <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.5 }}>
              {t('dashboard.cutCropDesc')}
            </div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 13, fontWeight: 600, color: C.accent,
            opacity: hov === 'ft-1' ? 1 : 0.7, transition: 'opacity .15s ease',
            marginTop: 14,
          }}>
            {t('dashboard.tryIt')} <IconArrowRight size={13} color={C.accent} />
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
          padding: '16px 20px',
          marginBottom: 20,
          borderRadius: 14,
          background: C.card,
          border: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
          transition: 'all .2s cubic-bezier(.4,0,.2,1)',
          transform: hov === 'cl-ext' ? 'translateY(-2px)' : 'none',
          boxShadow: hov === 'cl-ext'
            ? '0 8px 24px rgba(0,0,0,.4)'
            : 'none',
          textDecoration: 'none',
          color: C.text,
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${C.blue}10`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            <path d="M8 11h6" strokeWidth="1.5"/><path d="M11 8v6" strokeWidth="1.5"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.01em', color: C.text }}>ChannelLens</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 1 }}>
            Chrome extension — analyze any YouTube channel's revenue & competitors
          </div>
        </div>
        <div style={{
          padding: '6px 14px', borderRadius: 10,
          background: C.bg,
          border: `1px solid ${C.border}`,
          fontSize: 12, fontWeight: 600,
          whiteSpace: 'nowrap',
          color: C.text,
        }}>
          Download
        </div>
      </a>

      {/* ── Row 3: Quick tools strip ─────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, letterSpacing: '-.01em', color: C.text }}>{t('dashboard.tools')}</h2>
          <span
            onClick={() => router.push('/tools')}
            onMouseEnter={() => setHov('all-tools')}
            onMouseLeave={() => setHov(null)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/tools'); } }}
            style={{
              fontSize: 13, fontWeight: 500, cursor: 'pointer', color: C.accent,
              opacity: hov === 'all-tools' ? 1 : 0.8, transition: 'opacity .15s ease',
            }}
          >
            {t('dashboard.allTools')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
          {([
            { title: 'Video Analyzer', href: '/tools/youtube-downloader', Icon: IconSearch, iconColor: C.accent, badge: 'Free', badgeColor: C.green },
            { title: t('dashboard.tool.mp3Converter'), href: '/tools/mp3-converter', Icon: IconMusic, iconColor: C.orange, badge: 'Free', badgeColor: C.green },
            { title: 'Video Compressor', href: '/tools/video-compressor', Icon: IconCompress, iconColor: C.cyan, badge: 'Free', badgeColor: C.green },
            { title: t('dashboard.tool.aiThumbnails'), href: '/thumbnails', Icon: IconImage, iconColor: C.pink, badge: 'Pro', badgeColor: C.purple },
            { title: 'AI SEO', href: '/metadata', Icon: IconSearch, iconColor: C.purple, badge: 'Pro', badgeColor: C.purple },
            { title: t('dashboard.tool.shortsAnalytics'), href: '/shorts-analytics', Icon: IconChart, iconColor: C.green, badge: 'Free', badgeColor: C.green },
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
                transition: 'all .2s cubic-bezier(.4,0,.2,1)',
                transform: hov === `qt-${tool.href}` ? 'translateY(-2px)' : 'none',
                background: hov === `qt-${tool.href}` ? C.bg : 'transparent',
                flexShrink: 0,
              }}
            >
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${tool.iconColor}10`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'none',
                  transition: 'all .15s ease',
                }}>
                  <tool.Icon size={20} color={tool.iconColor} />
                </div>
                <span style={{
                  position: 'absolute', top: -4, right: -8,
                  fontSize: 9, fontWeight: 600, color: tool.badgeColor,
                  background: `${tool.badgeColor}12`, borderRadius: 10, padding: '0px 5px',
                  lineHeight: '15px', letterSpacing: '.02em',
                }}>
                  {tool.badge}
                </span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 500, textAlign: 'center',
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
  selected: boolean;
  selectMode: boolean;
  onNavigate: (id: string) => void;
  onDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onRename: (id: string) => void;
  onStartRename: (id: string, title: string) => void;
  onCancelRename: () => void;
  onRenameChange: (val: string) => void;
  onDuplicate: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onShare: (id: string) => void;
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
  selected,
  selectMode,
  onNavigate,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onRename,
  onStartRename,
  onCancelRename,
  onRenameChange,
  onDuplicate,
  onToggleSelect,
  onShare,
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
        background: C.card,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all .25s cubic-bezier(.4,0,.2,1)',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        boxShadow: isHovered
          ? '0 8px 24px rgba(0,0,0,.4)'
          : 'none',
        border: '1px solid rgba(255,255,255,0.06)',
        opacity: deleteIsPending && isDeleting ? 0.4 : 1,
        position: 'relative',
      }}
      onClick={() => {
        if (selectMode) { onToggleSelect(p.id); return; }
        if (!isDeleting && !isRenaming) onNavigate(p.id);
      }}
    >
      {/* Selection checkbox */}
      {(selectMode || isHovered) && !isDeleting && !isRenaming && (
        <div
          onClick={(e) => { e.stopPropagation(); onToggleSelect(p.id); }}
          style={{
            position: 'absolute', top: 10, left: 10, zIndex: 3,
            width: 24, height: 24, borderRadius: 6,
            background: selected ? C.accent : C.surface,
            border: `2px solid ${selected ? C.accent : C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all .15s ease',
            boxShadow: '0 1px 4px rgba(0,0,0,.3)',
          }}
        >
          {selected && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}

      {/* Thumbnail area */}
      <div style={{
        height: 140,
        background: C.bg,
        borderRadius: 10,
        position: 'relative',
        overflow: 'hidden',
        margin: '8px 8px 0',
        width: 'calc(100% - 16px)',
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
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '.01em',
          background: `${statusColor}14`,
          color: statusColor,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
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
            background: C.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'scale(1)' : 'scale(.7)',
            transition: 'all .25s cubic-bezier(.4,0,.2,1)',
            boxShadow: '0 4px 12px rgba(0,0,0,.4)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
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
            fontSize: 14, fontWeight: 600, marginBottom: 8, color: C.text,
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
                    background: C.red, color: '#fff', fontSize: 12, fontWeight: 600,
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(p.id);
                  }}
                  title={t('dashboard.share')}
                  aria-label={`${t('dashboard.share')} ${p.title}`}
                  onMouseEnter={() => setHovBtn(`share-${p.id}`)}
                  onMouseLeave={() => setHovBtn(null)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: `1px solid ${hovBtn === `share-${p.id}` ? C.borderActive : C.border}`,
                    background: hovBtn === `share-${p.id}` ? C.card : 'transparent',
                    color: C.sub, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s ease',
                  }}
                >
                  <IconShareLink size={14} color={C.sub} />
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
                    border: `1px solid ${hovBtn === `delete-${p.id}` ? `${C.red}40` : C.border}`,
                    background: hovBtn === `delete-${p.id}` ? `${C.red}12` : 'transparent',
                    color: hovBtn === `delete-${p.id}` ? C.red : C.sub,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s ease',
                  }}
                >
                  <IconTrash size={14} color={hovBtn === `delete-${p.id}` ? C.red : C.sub} />
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
        borderRadius: 12,
        background: C.card,
        border: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
        transition: 'all .2s cubic-bezier(.4,0,.2,1)',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov
          ? '0 8px 24px rgba(0,0,0,.4)'
          : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => router.push('/referral')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/referral'); } }}
    >
      <div style={{
        background: 'transparent',
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
            background: `${C.accent}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="8" width="16" height="10" rx="2" stroke={C.accent} strokeWidth="1.5" />
              <path d="M10 8V18" stroke={C.accent} strokeWidth="1.5" />
              <path d="M2 11H18" stroke={C.accent} strokeWidth="1.5" />
              <path d="M10 8C10 8 10 4 7 4C5.5 4 4 5 5 6.5C6 8 10 8 10 8Z" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10 8C10 8 10 4 13 4C14.5 4 16 5 15 6.5C14 8 10 8 10 8Z" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, letterSpacing: '-.01em' }}>
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
                borderRadius: 10,
                border: `1px solid ${copied ? C.green : C.accent}`,
                background: copied ? `${C.green}10` : `${C.accent}10`,
                color: copied ? C.green : C.accent,
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
              borderRadius: 10,
              background: `${C.accent}10`,
              border: `1px solid ${C.accent}`,
              color: C.accent,
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
              color: C.accent,
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

/* ── Plan Usage Widget ──────────────────────────────────── */

function DashboardUsageBar({
  label,
  used,
  total,
  C,
  isDark,
}: {
  label: string;
  used: number;
  total: number;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  isDark: boolean;
}) {
  const isInfinite = !isFinite(total);
  const pct = isInfinite ? 0 : total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const barColor = pct > 90 ? C.red : pct > 60 ? C.orange : C.green;
  const displayTotal = isInfinite ? '\u221E' : String(total);

  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: C.sub }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{used}/{displayTotal}</span>
      </div>
      <div style={{
        height: 6,
        borderRadius: 3,
        background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          borderRadius: 3,
          width: isInfinite ? '0%' : `${pct}%`,
          background: barColor,
          transition: 'width .4s ease',
        }} />
      </div>
    </div>
  );
}

function PlanUsageWidget({
  C,
  t,
}: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  t: (key: string) => string;
}) {
  const isDark = useThemeStore((s) => s.isDark);
  const router = useRouter();
  const { plan, projectCount, aiCount, limits, isLoading } = usePlanLimits();

  if (isLoading) return null;

  const planLabel = getPlanLabel(plan, t);

  return (
    <div style={{
      background: C.card,
      borderRadius: 12,
      padding: '20px 22px',
      marginBottom: 20,
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{t('dashboard.yourPlan')}</span>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: plan === 'FREE' ? C.sub : C.accent,
            padding: '3px 10px',
            borderRadius: 20,
            background: plan === 'FREE' ? C.bg : `${C.accent}10`,
            letterSpacing: '.02em',
          }}>
            {planLabel}
          </span>
        </div>
        {plan === 'FREE' && (
          <button
            onClick={() => router.push('/billing')}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              border: `1px solid ${C.accent}`,
              background: `${C.accent}10`,
              color: C.accent,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .2s ease',
              boxShadow: 'none',
            }}
          >
            {t('dashboard.upgradeCta')}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <DashboardUsageBar
          label={t('dashboard.usageProjects')}
          used={projectCount}
          total={limits.projects}
          C={C}
          isDark={isDark}
        />
        <DashboardUsageBar
          label={t('dashboard.usageAi')}
          used={aiCount}
          total={limits.ai}
          C={C}
          isDark={isDark}
        />
      </div>
    </div>
  );
}

/* ── Project Templates (imported from src/lib/templates.ts) ── */

/* ── Template Picker Modal ─────────────────────────────── */

function TemplatePickerModal({
  open,
  onClose,
  C,
  t,
}: {
  open: boolean;
  onClose: () => void;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  t: (key: string) => string;
}) {
  const utils = trpc.useUtils();
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const isRu = locale === 'ru' || locale === 'kk';
  const [hov, setHov] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const createProject = trpc.project.create.useMutation({
    onSuccess: (project) => {
      trackEvent('project_create', { source: 'template_modal' });
      toast.success(t('dashboard.projectCreated'));
      utils.project.list.invalidate();
      utils.user.getProfile.invalidate();
      onClose();
      router.push(`/editor?projectId=${project.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const importProject = trpc.project.import.useMutation({
    onSuccess: (result) => {
      trackEvent('project_create', { source: 'template', template: result.id });
      toast.success(t('dashboard.projectCreated'));
      utils.project.list.invalidate();
      utils.user.getProfile.invalidate();
      onClose();
      router.push(`/editor?projectId=${result.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const isCreating = createProject.isPending || importProject.isPending;

  const handleSelectBlank = () => {
    if (isCreating) return;
    createProject.mutate({});
  };

  const handleSelectTemplate = (template: ProjectTemplate) => {
    if (isCreating) return;
    importProject.mutate({
      formatVersion: 1,
      project: {
        title: isRu ? template.name : template.nameEn,
        tags: [template.id, template.category],
      },
      scenes: template.scenes.map((s, i) => ({
        label: s.label,
        prompt: s.prompt,
        duration: s.duration,
        order: i,
        model: 'standard' as const,
      })),
    });
  };

  const filteredTemplates = categoryFilter
    ? TEMPLATES.filter((tpl) => tpl.category === categoryFilter)
    : TEMPLATES;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => { if (!isCreating) onClose(); }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 999,
        }}
      />

      {/* Modal */}
      <div role="dialog" aria-modal="true" aria-label={t('dashboard.newProject')} style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: C.card,
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.06)',
        width: '92%', maxWidth: 720,
        maxHeight: '88dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '0 24px 80px rgba(0,0,0,.5), 0 8px 24px rgba(0,0,0,.3)',
        fontFamily: 'var(--font-sans), sans-serif',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px 0',
          flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0, letterSpacing: '-.01em', color: C.text }}>
            {t('dashboard.newProject')}
          </h2>
          <button
            onClick={() => { if (!isCreating) onClose(); }}
            disabled={isCreating}
            style={{
              background: 'none', border: 'none',
              color: C.sub, cursor: isCreating ? 'not-allowed' : 'pointer',
              padding: 4, display: 'flex', borderRadius: 6,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '12px 22px 0', flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: C.sub, margin: '0 0 14px', lineHeight: 1.5 }}>
            {t('dashboard.templatePickerDesc')}
          </p>

          {/* Blank project */}
          <div
            onClick={handleSelectBlank}
            onMouseEnter={() => setHov('blank')}
            onMouseLeave={() => setHov(null)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectBlank(); } }}
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              border: `1px solid ${hov === 'blank' ? C.accent : C.border}`,
              background: hov === 'blank' ? `${C.accent}06` : C.bg,
              cursor: isCreating ? 'wait' : 'pointer',
              transition: 'all .15s ease',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              opacity: isCreating ? 0.6 : 1,
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 11,
              background: `${C.accent}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 20,
            }}>
              <IconPlus size={22} color={C.accent} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                {t('dashboard.blankProject')}
              </div>
              <div style={{ fontSize: 12, color: C.sub }}>
                {t('dashboard.blankProjectDesc')}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '14px 0',
          }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('dashboard.orTemplate')}
            </span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* Category filter pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            <button
              onClick={() => setCategoryFilter(null)}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                border: 'none',
                background: !categoryFilter ? `${C.accent}12` : C.bg,
                color: !categoryFilter ? C.accent : C.sub,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all .15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {t('dashboard.templateAll')}
            </button>
            {TEMPLATE_CATEGORIES.map((cat) => {
              const info = CATEGORY_INFO[cat];
              const isActive = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(isActive ? null : cat)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 20,
                    border: 'none',
                    background: isActive ? `${info.color}12` : C.bg,
                    color: isActive ? info.color : C.sub,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all .15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isRu ? info.name : info.nameEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable template grid */}
        <div style={{ overflowY: 'auto', padding: '0 22px 22px', flex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
            gap: 10,
          }}>
            {filteredTemplates.map((tpl) => {
              const catInfo = CATEGORY_INFO[tpl.category];
              return (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  onMouseEnter={() => setHov(tpl.id)}
                  onMouseLeave={() => setHov(null)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectTemplate(tpl); } }}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: `1px solid ${hov === tpl.id ? C.accent : C.border}`,
                    background: hov === tpl.id ? `${C.accent}04` : C.bg,
                    cursor: isCreating ? 'wait' : 'pointer',
                    transition: 'all .2s cubic-bezier(.4,0,.2,1)',
                    transform: hov === tpl.id ? 'translateY(-1px)' : 'none',
                    boxShadow: hov === tpl.id
                      ? '0 4px 12px rgba(0,0,0,.3)'
                      : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    opacity: isCreating ? 0.6 : 1,
                  }}
                >
                  {/* Top row: icon + name + category badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: C.card,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, fontSize: 18,
                    }}>
                      {tpl.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>
                        {isRu ? tpl.name : tpl.nameEn}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{
                    fontSize: 12, color: C.sub, lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                  }}>
                    {isRu ? tpl.description : tpl.descriptionEn}
                  </div>

                  {/* Bottom row: category badge + scene count */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: catInfo.color,
                      background: `${catInfo.color}12`,
                      padding: '2px 8px', borderRadius: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '.5px',
                      whiteSpace: 'nowrap',
                    }}>
                      {isRu ? catInfo.name : catInfo.nameEn}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: C.dim,
                      whiteSpace: 'nowrap',
                    }}>
                      {tpl.sceneCount} {isRu
                        ? t('dashboard.scene.one')
                        : t('dashboard.scene.other')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '24px 0',
              color: C.dim, fontSize: 13,
            }}>
              {t('dashboard.noTemplates')}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Publishing History Widget ──────────────────────────── */

interface PublishHistoryEntry {
  platform: string;
  title: string;
  url: string;
  publishedAt: string;
  scheduled?: boolean;
}

function PublishHistoryWidget({
  C,
  t,
}: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  t: (key: string) => string;
}) {
  const [entries, setEntries] = useState<PublishHistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tf-publish-history');
      if (raw) {
        const parsed = JSON.parse(raw) as PublishHistoryEntry[];
        setEntries(parsed.slice(0, 5));
      }
    } catch { /* localStorage unavailable */ }
  }, []);

  if (entries.length === 0) return null;

  return (
    <div style={{
      background: C.card,
      borderRadius: 12,
      padding: '20px 22px',
      marginBottom: 20,
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{t('dashboard.recentlyPublished')}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((entry, i) => {
          const date = new Date(entry.publishedAt);
          const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          return (
            <div
              key={`${entry.publishedAt}-${i}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                background: C.bg,
                transition: 'all .15s',
              }}
            >
              {/* Platform icon */}
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: entry.platform === 'YouTube' ? '#ff000015' : `${C.accent}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {entry.platform === 'YouTube' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff0000">
                    <path d="M23.5 6.19a3 3 0 00-2.11-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.39.56A3 3 0 00.5 6.19 31 31 0 000 12a31 31 0 00.5 5.81 3 3 0 002.11 2.13c1.89.56 9.39.56 9.39.56s7.5 0 9.39-.56a3 3 0 002.11-2.13A31 31 0 0024 12a31 31 0 00-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                )}
              </div>

              {/* Title + date */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: C.text,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {entry.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.dim, marginTop: 2 }}>
                  <span>{entry.platform}</span>
                  <span>&#183;</span>
                  <span>{dateStr}</span>
                  {entry.scheduled && (
                    <>
                      <span>&#183;</span>
                      <span style={{ color: C.orange }}>{t('dashboard.scheduled')}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Link button */}
              {entry.url && (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: '5px 12px', borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    background: 'transparent', color: C.sub,
                    fontSize: 11, fontWeight: 600, textDecoration: 'none',
                    transition: 'all .15s', flexShrink: 0,
                  }}
                >
                  {t('dashboard.openLink')}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Dashboard Component ──────────────────────────── */

export function Dashboard() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const locale = useLocaleStore((s) => s.locale);
  const isRuLocale = locale === 'ru' || locale === 'kk';
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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    const sp = searchParams?.get('order');
    if (sp === 'asc' || sp === 'desc') return sp;
    return 'desc';
  });
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef<HTMLInputElement>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [recentActivities, setRecentActivities] = useState<ActivityEntry[]>([]);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

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

  /* ── Load recent activity from localStorage ── */
  useEffect(() => {
    setRecentActivities(getRecentActivity(5));
  }, []);

  const refreshActivities = useCallback(() => {
    setRecentActivities(getRecentActivity(5));
  }, []);

  /* ── Sync filter state to URL ───────────────── */
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (statusFilter) params.set('status', statusFilter);
    if (sortBy !== 'updatedAt') params.set('sort', sortBy);
    if (sortOrder !== 'desc') params.set('order', sortOrder);
    const qs = params.toString();
    router.replace(`/dashboard${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [debouncedSearch, statusFilter, sortBy, sortOrder, router]);

  /* ── tRPC queries ─────────────────────────────── */
  const profile = trpc.user.getProfile.useQuery();
  const totalProjects = trpc.project.list.useQuery({ page: 1, limit: 1 });
  const projects = trpc.project.list.useQuery({
    search: debouncedSearch || undefined,
    status: statusFilter,
    sortBy,
    sortOrder,
    page,
    limit: 12,
  });

  /* ── tRPC mutations ───────────────────────────── */
  const createProject = trpc.project.create.useMutation({
    onSuccess: (project) => {
      trackEvent('project_create', { source: 'dashboard' });
      toast.success(t('dashboard.projectCreated'));
      logActivity('project_created', project.title ?? t('dashboard.newProject'));
      refreshActivities();
      utils.project.list.invalidate();
      utils.user.getProfile.invalidate();
      router.push(`/editor?projectId=${project.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteProject = trpc.project.delete.useMutation({
    onSuccess: () => {
      toast.success(t('dashboard.projectDeleted'));
      logActivity('project_deleted', '');
      refreshActivities();
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
      logActivity('project_renamed', renameValue.trim());
      refreshActivities();
      setRenameId(null);
      utils.project.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const duplicateProject = trpc.project.duplicate.useMutation({
    onSuccess: () => {
      toast.success(t('dashboard.projectDuplicated'));
      logActivity('project_duplicated', '');
      refreshActivities();
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

  const togglePublic = trpc.project.togglePublic.useMutation({
    onSuccess: (data) => {
      if (data.isPublic) {
        const url = `${window.location.origin}/share/${data.id}`;
        navigator.clipboard.writeText(url).catch(() => {});
        toast.success(t('dashboard.shareEnabled'));
      } else {
        toast.success(t('dashboard.shareDisabled'));
      }
      utils.project.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleShare = useCallback((id: string) => {
    togglePublic.mutate({ id });
  }, [togglePublic]);

  /* ── Bulk selection handlers ─────────────────── */
  const selectMode = selectedIds.size > 0;

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = (projects.data?.items ?? []).map((p) => p.id);
    setSelectedIds((prev) => {
      if (prev.size === allIds.length) return new Set();
      return new Set(allIds);
    });
  }, [projects.data?.items]);

  const handleCancelSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        await deleteProject.mutateAsync({ id });
      }
      toast.success(t('dashboard.bulkDeleted'));
      setSelectedIds(new Set());
      utils.project.list.invalidate();
      utils.user.getProfile.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('dashboard.bulkDeleteError'));
    } finally {
      setBulkDeleting(false);
    }
  }, [selectedIds, deleteProject, t, utils]);

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
        iconColor: C.accent,
      },
      {
        label: t('dashboard.plan'),
        value: getPlanLabel(plan, t),
        icon: IconStar,
        iconColor: C.purple,
      },
      {
        label: t('dashboard.aiRequests'),
        value: String(user?.aiUsage ?? 0),
        icon: IconFilm,
        iconColor: C.blue,
      },
      {
        label: t('dashboard.channels'),
        value: String(user?.channels?.length ?? 0),
        icon: IconSend,
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

      {/* ── Onboarding Checklist ─────────────────────── */}
      <OnboardingChecklist />

      {/* ── Activity Streak ──────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <ActivityStreak />
      </div>

      {/* ── Usage Milestones (floating toast) ────────── */}
      <UsageMilestones />

      {/* ── Header ──────────────────────────────────── */}
      <div className="tf-dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="tf-dash-heading" style={{ fontSize: 26, fontWeight: 600, margin: '0 0 4px', letterSpacing: '-.02em', lineHeight: 1.2, color: C.text }}>
            {profile.isLoading ? <Skeleton width={260} height={34} /> : `${t('dashboard.hello')}, ${user?.name ?? t('dashboard.creator')}!`}
          </h1>
          <p style={{ color: C.sub, fontSize: 14, margin: 0, lineHeight: 1.5, fontWeight: 400 }}>
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
            onClick={() => setTemplateModalOpen(true)}
            disabled={createProject.isPending}
            onMouseEnter={() => setHoveredBtn('create-main')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: C.accent,
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '0 22px', height: 44, fontSize: 14, fontWeight: 600,
              cursor: createProject.isPending ? 'wait' : 'pointer',
              fontFamily: 'inherit', opacity: createProject.isPending ? 0.6 : 1,
              boxShadow: 'none',
              transition: 'all .2s cubic-bezier(.4,0,.2,1)',
              transform: hoveredBtn === 'create-main' ? 'translateY(-1px)' : 'none',
              letterSpacing: '-.01em',
              flexShrink: 0,
            }}
          >
            <IconPlus size={16} color="#fff" />
            {createProject.isPending ? t('dashboard.creating') : t('dashboard.newProject')}
          </button>
          <button
            className="tf-dash-import-btn"
            onClick={() => setImportOpen(true)}
            onMouseEnter={() => setHoveredBtn('import-main')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: C.card,
              color: C.text, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
              padding: '0 18px', height: 44, fontSize: 14, fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .2s ease',
              boxShadow: 'none',
              flexShrink: 0,
            }}
          >
            <IconUploadSmall size={16} color={C.sub} />
            {t('dashboard.importProject')}
          </button>
        </div>
      </div>
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />

      {/* ── Quick Actions Bar ────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap',
      }}>
        <button
          onClick={() => createProject.mutate({ title: t('dashboard.newProject') })}
          disabled={createProject.isPending}
          onMouseEnter={() => setHoveredBtn('qa-new')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 10,
            border: `1px solid ${hoveredBtn === 'qa-new' ? C.borderActive : 'rgba(255,255,255,0.08)'}`,
            background: hoveredBtn === 'qa-new' ? C.surface : C.card,
            color: C.text, fontSize: 13, fontWeight: 500,
            cursor: createProject.isPending ? 'wait' : 'pointer',
            fontFamily: 'inherit', transition: 'all .15s ease',
            opacity: createProject.isPending ? 0.6 : 1,
          }}
        >
          <IconPlus size={15} color={C.sub} />
          {t('dashboard.newProject')}
        </button>
        <button
          onClick={() => setImportOpen(true)}
          onMouseEnter={() => setHoveredBtn('qa-import')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 10,
            border: `1px solid ${hoveredBtn === 'qa-import' ? C.borderActive : 'rgba(255,255,255,0.08)'}`,
            background: hoveredBtn === 'qa-import' ? C.surface : C.card,
            color: C.text, fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all .15s ease',
          }}
        >
          <IconUploadSmall size={15} color={C.sub} />
          {t('dashboard.importProject')}
        </button>
        <button
          onClick={() => setTemplateModalOpen(true)}
          onMouseEnter={() => setHoveredBtn('qa-template')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 10,
            border: `1px solid ${hoveredBtn === 'qa-template' ? C.borderActive : 'rgba(255,255,255,0.08)'}`,
            background: hoveredBtn === 'qa-template' ? C.surface : C.card,
            color: C.text, fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all .15s ease',
          }}
        >
          <IconLayout size={15} color={C.sub} />
          {t('dashboard.fromTemplate')}
        </button>
        <button
          onClick={() => router.push('/tools/video-translator')}
          onMouseEnter={() => setHoveredBtn('qa-translator')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 10,
            border: `1px solid ${hoveredBtn === 'qa-translator' ? C.borderActive : 'rgba(255,255,255,0.08)'}`,
            background: hoveredBtn === 'qa-translator' ? C.surface : C.card,
            color: C.text, fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all .15s ease',
          }}
        >
          <IconTranslate size={15} color={C.sub} />
          Video Translator
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#fff',
            padding: '1px 6px', borderRadius: 4,
            background: C.purple,
            letterSpacing: '.02em',
          }}>Pro</span>
        </button>
      </div>

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
                    borderRadius: 12,
                    padding: '18px 16px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'default',
                    transition: 'box-shadow .25s ease, transform .25s ease',
                    minWidth: 0,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: `${s.iconColor}14`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <StatIcon size={18} color={s.iconColor} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 0 }}>
                    <div className="tf-dash-stat-value" style={{
                      fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.2,
                      color: C.text, marginBottom: 4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {s.value}
                    </div>
                    <div style={{
                      fontSize: 12, color: C.sub, fontWeight: 400,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {s.label}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* ── Plan Usage Widget ─────────────────────────── */}
      <PlanUsageWidget C={C} t={t} />

      {/* ── Recent Activity Feed ────────────────────── */}
      <RecentActivityFeed C={C} t={t} activities={recentActivities} />

      {/* ── Referral Widget ──────────────────────────── */}
      <ReferralWidget C={C} t={t} />

      {/* ── Publishing History Widget ─────────────────── */}
      <PublishHistoryWidget C={C} t={t} />

      {/* ── Projects section ────────────────────────── */}
      <div style={{
        background: C.card,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Toolbar */}
        <div className="tf-dash-toolbar" style={{
          padding: '18px 22px 16px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0, letterSpacing: '-.01em', color: C.text }}>
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
                  padding: '0 14px 0 32px',
                  height: 44,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  color: C.text,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  width: '100%',
                  maxWidth: 200,
                  transition: 'border-color .2s, box-shadow .2s',
                }}
              />
            </div>

            {/* Sort */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <select
                className="tf-dash-sort-select"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
                aria-label={t('dashboard.sortProjects')}
                style={{
                  padding: '8px 10px',
                  background: C.bg,
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
              <button
                onClick={() => { setSortOrder((prev) => prev === 'desc' ? 'asc' : 'desc'); setPage(1); }}
                aria-label={sortOrder === 'desc' ? t('dashboard.sortDesc') : t('dashboard.sortAsc')}
                title={sortOrder === 'desc' ? t('dashboard.sortDesc') : t('dashboard.sortAsc')}
                onMouseEnter={() => setHoveredBtn('sort-dir')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: hoveredBtn === 'sort-dir' ? C.surface : 'transparent',
                  color: C.sub, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'inherit', transition: 'all .15s ease',
                  flexShrink: 0,
                }}
              >
                {sortOrder === 'desc'
                  ? <IconSortDesc size={15} color={C.sub} />
                  : <IconSortAsc size={15} color={C.sub} />
                }
              </button>
            </div>

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
                      padding: '7px 16px',
                      borderRadius: 20,
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .2s ease',
                      background: isActive ? `${C.accent}12` : (hoveredBtn === `filter-${f.label}` ? C.bg : C.bg),
                      color: isActive ? C.accent : C.sub,
                      whiteSpace: 'nowrap',
                      minHeight: 34,
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
                  background: C.card,
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.06)',
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
                  <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', color: C.text }}>
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
                  <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: C.text, letterSpacing: '-.02em' }}>
                    {t('dashboard.createFirstProject')}
                  </h3>
                  <p style={{ color: C.sub, fontSize: 14, marginBottom: 24, maxWidth: 360, lineHeight: 1.6, fontWeight: 400 }}>
                    {t('dashboard.createFirstDesc')}
                  </p>
                  <button
                    onClick={() => setTemplateModalOpen(true)}
                    disabled={createProject.isPending}
                    onMouseEnter={() => setHoveredBtn('create-empty')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '11px 28px',
                      borderRadius: 10,
                      background: C.accent,
                      color: '#fff',
                      border: 'none',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: createProject.isPending ? 'wait' : 'pointer',
                      fontFamily: 'inherit',
                      boxShadow: 'none',
                      transition: 'all .2s cubic-bezier(.4,0,.2,1)',
                      transform: hoveredBtn === 'create-empty' ? 'translateY(-1px)' : 'none',
                      opacity: createProject.isPending ? 0.6 : 1,
                    }}
                  >
                    <IconPlus size={18} color="#fff" />
                    {createProject.isPending ? t('dashboard.creating') : t('dashboard.createProject')}
                  </button>

                  {/* ── Template suggestions ── */}
                  <div style={{ marginTop: 32, width: '100%', maxWidth: 640 }}>
                    <p style={{ color: C.sub, fontSize: 13, fontWeight: 500, marginBottom: 14 }}>
                      {t('dashboard.emptyTemplateSuggestions')}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                      {TEMPLATES.slice(0, 3).map((tpl) => (
                          <div
                            key={tpl.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setTemplateModalOpen(true)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTemplateModalOpen(true); } }}
                            onMouseEnter={() => setHoveredBtn(`tpl-${tpl.id}`)}
                            onMouseLeave={() => setHoveredBtn(null)}
                            style={{
                              padding: '14px 16px',
                              borderRadius: 14,
                              border: `1px solid ${C.border}`,
                              background: hoveredBtn === `tpl-${tpl.id}` ? C.bg : C.card,
                              cursor: 'pointer',
                              transition: 'all .2s cubic-bezier(.4,0,.2,1)',
                              transform: hoveredBtn === `tpl-${tpl.id}` ? 'translateY(-1px)' : 'none',
                              boxShadow: hoveredBtn === `tpl-${tpl.id}` ? '0 4px 12px rgba(0,0,0,.3)' : 'none',
                              textAlign: 'left',
                            }}
                          >
                            <div style={{ fontSize: 20, marginBottom: 6 }}>{tpl.icon}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                              {isRuLocale ? tpl.name : tpl.nameEn}
                            </div>
                            <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.4 }}>
                              {tpl.sceneCount} {t('dashboard.scene.many')}
                            </div>
                          </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setTemplateModalOpen(true)}
                      onMouseEnter={() => setHoveredBtn('explore-tpl')}
                      onMouseLeave={() => setHoveredBtn(null)}
                      style={{
                        marginTop: 12,
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'transparent',
                        color: C.accent,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        opacity: hoveredBtn === 'explore-tpl' ? 1 : 0.8,
                        transition: 'opacity .15s ease',
                      }}
                    >
                      {t('dashboard.exploreTemplates')} →
                    </button>
                  </div>
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
                    selected={selectedIds.has(p.id)}
                    selectMode={selectMode}
                    onNavigate={handleNavigate}
                    onDelete={handleSetDeleteId}
                    onConfirmDelete={handleConfirmDelete}
                    onCancelDelete={handleCancelDelete}
                    onRename={handleRename}
                    onStartRename={handleStartRename}
                    onCancelRename={handleCancelRename}
                    onRenameChange={handleRenameChange}
                    onDuplicate={handleDuplicate}
                    onToggleSelect={handleToggleSelect}
                    onShare={handleShare}
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

      {/* ── Bulk selection floating toolbar ──────── */}
      {selectMode && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: C.card,
          borderRadius: 14,
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,.5), 0 2px 8px rgba(0,0,0,.3)',
          border: '1px solid rgba(255,255,255,0.08)',
          zIndex: 1000,
          fontFamily: 'inherit',
        }}>
          {/* Select all checkbox */}
          <button
            onClick={handleSelectAll}
            style={{
              width: 22, height: 22, borderRadius: 5,
              background: selectedIds.size === (projects.data?.items ?? []).length && selectedIds.size > 0 ? C.accent : 'transparent',
              border: `2px solid ${selectedIds.size === (projects.data?.items ?? []).length && selectedIds.size > 0 ? C.accent : C.dim}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all .15s ease', flexShrink: 0,
            }}
            title={t('dashboard.selectAll')}
          >
            {selectedIds.size === (projects.data?.items ?? []).length && selectedIds.size > 0 && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          <span style={{ fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>
            {t('dashboard.selected')}: {selectedIds.size}
          </span>

          <div style={{ width: 1, height: 24, background: C.border, flexShrink: 0 }} />

          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: C.red,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: bulkDeleting ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: bulkDeleting ? 0.6 : 1,
              transition: 'opacity .15s',
              whiteSpace: 'nowrap',
            }}
          >
            <IconTrash size={14} color="#fff" />
            {bulkDeleting ? '...' : t('dashboard.deleteProject')}
          </button>

          <button
            onClick={handleCancelSelection}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.sub,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .15s',
              whiteSpace: 'nowrap',
            }}
          >
            {t('dashboard.cancel')}
          </button>
        </div>
      )}

      {/* ── Template Picker Modal ────────────────── */}
      <TemplatePickerModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        C={C}
        t={t}
      />
    </div>
  );
}
