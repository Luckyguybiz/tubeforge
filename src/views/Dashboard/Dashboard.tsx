'use client';

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import Image from 'next/image';
import Link from 'next/link';
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
import { logActivity, getRecentActivity, type ActivityEntry } from '@/lib/activity-log';

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

function IconUploadSmall({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
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

/* ── Empty state illustration ──────────────────────────── */

function EmptyIllustration({ color, dimColor, label }: { color: string; dimColor: string; label: string }) {
  return (
    <svg width="160" height="130" viewBox="0 0 160 130" fill="none">
      <rect x="30" y="20" width="100" height="70" rx="10" stroke={dimColor} strokeWidth="2" strokeDasharray="6 4" />
      <rect x="42" y="35" width="24" height="18" rx="4" fill={`${color}18`} stroke={color} strokeWidth="1.2" />
      <rect x="72" y="35" width="24" height="18" rx="4" fill={`${color}18`} stroke={color} strokeWidth="1.2" />
      <rect x="102" y="35" width="24" height="18" rx="4" fill={`${color}10`} stroke={dimColor} strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="80" cy="78" r="12" fill={`${color}20`} stroke={color} strokeWidth="1.5" />
      <polygon points="76,72 88,78 76,84" fill={color} />
      <circle cx="120" cy="28" r="14" fill={color} />
      <line x1="120" y1="22" x2="120" y2="34" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="114" y1="28" x2="126" y2="28" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
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
        border: `1px solid ${C.border}`,
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
            background: selected ? C.accent : C.border,
            border: `2px solid ${selected ? C.accent : C.borderActive}`,
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
        background: C.surface,
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
              background: C.surface,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform .3s ease',
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            }}>
              <IconFilm size={24} color={C.dim} />
            </div>
          </div>
        )}

        {/* Status badge */}
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

        {/* Scene count badge */}
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
                    background: C.red, color: C.text, fontSize: 12, fontWeight: 600,
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
                    background: hovBtn === `rename-${p.id}` ? C.border : 'transparent',
                    color: C.sub, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s ease',
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
                    background: hovBtn === `dup-${p.id}` ? C.border : 'transparent',
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
                    background: hovBtn === `share-${p.id}` ? C.border : 'transparent',
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
        border: `1px solid ${C.border}`,
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
              background: hov === 'blank' ? `${C.accent}06` : C.surface,
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
                background: !categoryFilter ? `${C.accent}12` : C.surface,
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
                    background: isActive ? `${info.color}12` : C.surface,
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
                    background: hov === tpl.id ? `${C.accent}04` : C.surface,
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

                  <div style={{
                    fontSize: 12, color: C.sub, lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                  }}>
                    {isRu ? tpl.description : tpl.descriptionEn}
                  </div>

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


/* ── Main Dashboard Component ──────────────────────────── */

export function Dashboard() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const locale = useLocaleStore((s) => s.locale);
  const isRuLocale = locale === 'ru' || locale === 'kk';
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();

  /* ── Local state ── */
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
  const [_recentActivities, setRecentActivities] = useState<ActivityEntry[]>([]);
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

  /* ── Plan limits for stat pills ──────────────── */
  const { plan: currentPlan, projectCount, aiCount, limits } = usePlanLimits();

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

  /* ── Compute stats for pills ───────────────────── */
  const user = profile.data;
  const plan = user?.plan ?? 'FREE';

  const statPills = useMemo(() => {
    const total = totalProjects.data?.total ?? user?._count?.projects ?? 0;
    const maxProjects = isFinite(limits.projects) ? `/${limits.projects}` : '';
    const maxAi = isFinite(limits.ai) ? `/${limits.ai}` : '';
    return [
      { value: `${total}${maxProjects}`, label: t('dashboard.totalProjects') },
      { value: `${aiCount}${maxAi}`, label: t('dashboard.aiRequests') },
      { value: getPlanLabel(plan, t), label: t('dashboard.plan') },
    ];
  }, [totalProjects.data?.total, user?._count?.projects, plan, aiCount, limits, t]);

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

      {/* ── Welcome header ────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="tf-dash-heading" style={{
          fontSize: 26, fontWeight: 600, margin: '0 0 4px',
          letterSpacing: '-.02em', lineHeight: 1.2, color: C.text,
        }}>
          {profile.isLoading
            ? <Skeleton width={260} height={34} />
            : `${t('dashboard.hello')}, ${user?.name ?? t('dashboard.creator')}`
          }
        </h1>
        <p style={{ color: C.sub, fontSize: 14, margin: 0, lineHeight: 1.5, fontWeight: 400 }}>
          {profile.isLoading
            ? <Skeleton width={160} height={16} style={{ marginTop: 4 }} />
            : t('dashboard.manageProjects')
          }
        </p>
      </div>

      {/* ── Product showcase: "What will you create today?" ── */}
      <div style={{
        background: C.surface, borderRadius: 16, padding: 32,
        marginBottom: 24, display: 'flex', gap: 32, alignItems: 'center',
        overflow: 'hidden',
      }} className="tf-dash-showcase">
        {/* Left: headline + CTA */}
        <div style={{ flexShrink: 0, minWidth: 200 }} className="tf-dash-showcase-left">
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1.1, margin: 0 }}>
            WHAT WILL YOU<br />
            <span style={{ color: C.accent }}>CREATE TODAY?</span>
          </h2>
          <p style={{ fontSize: 14, color: C.sub, marginTop: 12, maxWidth: 220, marginBottom: 0 }}>
            AI-powered tools for YouTube creators
          </p>
          <Link href="/free-tools" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 20, padding: '10px 20px',
            background: C.accent, color: '#000',
            borderRadius: 10, fontSize: 13, fontWeight: 700,
            textDecoration: 'none',
          }}>
            Explore all tools &#10022;
          </Link>
        </div>
        {/* Right: horizontal scroll of product cards — wheel scrolls horizontally */}
        <div
          onWheel={(e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              e.currentTarget.scrollLeft += e.deltaY;
              e.preventDefault();
            }
          }}
          style={{
            display: 'flex', gap: 14, overflowX: 'auto', flex: 1,
            scrollSnapType: 'x mandatory', paddingBottom: 4,
          }}
          className="tf-dash-showcase-scroll"
        >
          {([
            { href: '/ai-thumbnails', title: 'AI Thumbnails', gradientFrom: '#6366f1', gradientTo: '#8b5cf6', badge: 'NEW', badgeColor: '#84cc16',
              icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5H18l-3.5 2.5L16 15l-4-3-4 3 1.5-5L6 7.5h4.5z" /></svg> },
            { href: '/editor', title: 'Video Editor', gradientFrom: '#3b82f6', gradientTo: '#06b6d4', badge: null, badgeColor: '',
              icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5,3 19,12 5,21" /></svg> },
            { href: '/preview?tab=seo', title: 'SEO Optimizer', gradientFrom: '#10b981', gradientTo: '#34d399', badge: null, badgeColor: '',
              icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> },
            { href: '/thumbnails', title: 'Thumbnail Editor', gradientFrom: '#f59e0b', gradientTo: '#f97316', badge: null, badgeColor: '',
              icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg> },
            { href: '/free-tools', title: 'Free Tools', gradientFrom: '#6366f1', gradientTo: '#ec4899', badge: 'FREE', badgeColor: '#22c55e',
              icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg> },
            { href: '/tools/youtube-downloader', title: 'Video Analyzer', gradientFrom: '#14b8a6', gradientTo: '#22d3ee', badge: 'FREE', badgeColor: '#22c55e',
              icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
          ] as const).map((product) => (
            <Link key={product.href} href={product.href} className="tf-dash-showcase-card" style={{
              width: 240, flexShrink: 0, scrollSnapAlign: 'start',
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 14, overflow: 'hidden',
              textDecoration: 'none', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                height: 180, background: `linear-gradient(135deg, ${product.gradientFrom}, ${product.gradientTo})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                {product.icon}
                {/* Video placeholder — replace with real video later */}
                <div style={{
                  position: 'absolute', bottom: 10, right: 10,
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
                </div>
                {product.badge && (
                  <span style={{
                    position: 'absolute', top: 8, right: 8,
                    background: product.badgeColor, color: '#000',
                    fontSize: 10, fontWeight: 700, padding: '2px 8px',
                    borderRadius: 6, letterSpacing: '.03em',
                  }}>
                    {product.badge}
                  </span>
                )}
              </div>
              <div style={{
                padding: '12px 14px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{product.title}</span>
                <span style={{ color: C.dim, fontSize: 16 }}>&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Action bar: 3 buttons ─────────────────── */}
      <div className="tf-dash-header-actions" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          className="tf-dash-create-btn"
          data-tour="new-project"
          onClick={() => setTemplateModalOpen(true)}
          disabled={createProject.isPending}
          onMouseEnter={() => setHoveredBtn('act-new')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: C.card,
            color: C.text,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: '0 20px', height: 44, fontSize: 14, fontWeight: 600,
            cursor: createProject.isPending ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            opacity: createProject.isPending ? 0.6 : 1,
            transition: 'all .2s cubic-bezier(.4,0,.2,1)',
            transform: hoveredBtn === 'act-new' ? 'translateY(-1px)' : 'none',
            boxShadow: hoveredBtn === 'act-new' ? '0 4px 16px rgba(0,0,0,.3)' : 'none',
            letterSpacing: '-.01em',
            flexShrink: 0,
          }}
        >
          <IconPlus size={16} color="#fff" />
          {createProject.isPending ? t('dashboard.creating') : t('dashboard.newProject')}
        </button>
        <button
          onClick={() => setTemplateModalOpen(true)}
          onMouseEnter={() => setHoveredBtn('act-tpl')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: C.card,
            color: C.text,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: '0 20px', height: 44, fontSize: 14, fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all .2s cubic-bezier(.4,0,.2,1)',
            transform: hoveredBtn === 'act-tpl' ? 'translateY(-1px)' : 'none',
            boxShadow: hoveredBtn === 'act-tpl' ? '0 4px 16px rgba(0,0,0,.3)' : 'none',
            flexShrink: 0,
          }}
        >
          <IconLayout size={16} color={C.sub} />
          {t('dashboard.fromTemplate')}
        </button>
        <button
          className="tf-dash-import-btn"
          onClick={() => setImportOpen(true)}
          onMouseEnter={() => setHoveredBtn('act-import')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: C.card,
            color: C.text,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: '0 20px', height: 44, fontSize: 14, fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all .2s cubic-bezier(.4,0,.2,1)',
            transform: hoveredBtn === 'act-import' ? 'translateY(-1px)' : 'none',
            boxShadow: hoveredBtn === 'act-import' ? '0 4px 16px rgba(0,0,0,.3)' : 'none',
            flexShrink: 0,
          }}
        >
          <IconUploadSmall size={16} color={C.sub} />
          {t('dashboard.importProject')}
        </button>
      </div>
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />

      {/* ── Stat pills (inline) ───────────────────── */}
      <div className="tf-dash-stat-grid" style={{
        display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap',
      }}>
        {profile.isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} width={100} height={36} style={{ borderRadius: 10 }} />
            ))
          : statPills.map((s, i) => (
              <div
                key={i}
                className="tf-stat-card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '8px 14px',
                  cursor: 'default',
                }}
              >
                <span style={{
                  fontSize: 14, fontWeight: 700, color: C.text,
                  letterSpacing: '-.01em',
                }}>
                  {s.value}
                </span>
                <span style={{
                  fontSize: 12, color: C.sub, fontWeight: 400,
                }}>
                  {s.label}
                </span>
              </div>
            ))
        }
        {/* Upgrade pill for free users */}
        {!profile.isLoading && currentPlan === 'FREE' && (
          <button
            onClick={() => router.push('/billing')}
            onMouseEnter={() => setHoveredBtn('upgrade-pill')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: `${C.accent}10`,
              border: `1px solid ${C.accent}30`,
              borderRadius: 10,
              padding: '8px 14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .2s ease',
              transform: hoveredBtn === 'upgrade-pill' ? 'translateY(-1px)' : 'none',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>
              {t('dashboard.upgradeCta')}
            </span>
          </button>
        )}
      </div>

      {/* ── Onboarding Checklist (new users only) ─── */}
      <OnboardingChecklist />

      {/* ── Projects section ────────────────────────── */}
      <div style={{
        background: C.card,
        borderRadius: 14,
        overflow: 'hidden',
        border: `1px solid ${C.border}`,
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
            {/* Sort */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
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
              <button
                onClick={() => { setSortOrder((prev) => prev === 'desc' ? 'asc' : 'desc'); setPage(1); }}
                aria-label={sortOrder === 'desc' ? t('dashboard.sortDesc') : t('dashboard.sortAsc')}
                title={sortOrder === 'desc' ? t('dashboard.sortDesc') : t('dashboard.sortAsc')}
                onMouseEnter={() => setHoveredBtn('sort-dir')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: hoveredBtn === 'sort-dir' ? C.border : 'transparent',
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
                      background: isActive ? `${C.accent}12` : C.surface,
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
              gap: 16,
            }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  background: C.card,
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: `1px solid ${C.border}`,
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
                      borderRadius: 10,
                      background: hoveredBtn === 'reset' ? C.border : 'transparent',
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
                      color: C.text,
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
                              background: hoveredBtn === `tpl-${tpl.id}` ? C.surface : C.card,
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
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
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    aria-label={t('dashboard.prevPage')}
                    onMouseEnter={() => setHoveredBtn('page-prev')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      background: hoveredBtn === 'page-prev' && page > 1 ? C.border : 'transparent',
                      color: page <= 1 ? C.dim : C.sub,
                      cursor: page <= 1 ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'inherit', transition: 'all .15s ease',
                      opacity: page <= 1 ? 0.4 : 1,
                    }}
                  >
                    <IconChevronLeft size={16} color={page <= 1 ? C.dim : C.sub} />
                  </button>

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
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
                          background: isCurrent ? C.accent : (hoveredBtn === `page-${pageNum}` ? C.border : 'transparent'),
                          color: isCurrent ? '#fff' : C.sub,
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    aria-label={t('dashboard.nextPage')}
                    onMouseEnter={() => setHoveredBtn('page-next')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      background: hoveredBtn === 'page-next' && page < totalPages ? C.border : 'transparent',
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
          border: `1px solid ${C.border}`,
          zIndex: 1000,
          fontFamily: 'inherit',
        }}>
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
              color: C.text,
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
