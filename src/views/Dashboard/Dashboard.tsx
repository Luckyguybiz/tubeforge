'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorFallback } from '@/components/ui/ErrorFallback';
import { toast } from '@/stores/useNotificationStore';
import { getRecentActivity, type ActivityEntry } from '@/lib/activity-log';
import { ChannelAnalytics } from './ChannelAnalytics';
import { DashboardUpgradeModal } from '@/components/ui/DashboardUpgradeModal';

/* ================================================================
   NEON & LOCKED STATE CSS
   ================================================================ */

const NEON_CSS = `
@keyframes tfNeonPulse {
  0%, 100% { box-shadow: 0 0 8px var(--tf-neon, rgba(99,102,241,0.4)), 0 0 24px var(--tf-neon-soft, rgba(99,102,241,0.15)); }
  50% { box-shadow: 0 0 16px var(--tf-neon, rgba(99,102,241,0.6)), 0 0 40px var(--tf-neon-soft, rgba(99,102,241,0.3)), 0 0 60px var(--tf-neon-dim, rgba(99,102,241,0.08)); }
}
@keyframes tfLockFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes tfBannerGlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes tfBarGrow {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
.tf-neon-active {
  animation: tfNeonPulse 3s ease-in-out infinite;
  transition: transform 0.2s ease;
}
.tf-neon-active:hover { transform: translateY(-2px); }
.tf-feat-card {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.tf-feat-card:not(.tf-feat-locked):hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.3);
}
.tf-feat-locked { cursor: pointer; }
.tf-feat-locked:hover { transform: translateY(-2px); }
.tf-lock-icon { animation: tfLockFloat 2s ease-in-out infinite; }
.tf-banner-glow { background-size: 200% 200%; animation: tfBannerGlow 6s ease infinite; }
`;

/* ================================================================
   FEATURE CARD DEFINITIONS
   ================================================================ */

const FEATURE_CARDS = [
  {
    key: 'aiThumbnails',
    titleKey: 'dashboard.tool.aiThumbnails',
    descKey: 'dashboard.tool.aiThumbnailsDesc',
    href: '/ai-thumbnails',
    from: '#6366f1', to: '#8b5cf6',
    badge: 'NEW' as string | null,
    requiresYoutube: false,
  },
  {
    key: 'videoEditor',
    titleKey: 'dashboard.tool.videoEditor',
    descKey: 'dashboard.tool.videoEditorNavDesc',
    href: '/editor',
    from: '#3b82f6', to: '#06b6d4',
    badge: null as string | null,
    requiresYoutube: false,
  },
  {
    key: 'seoOptimizer',
    titleKey: 'dashboard.tool.seoOptimizer',
    descKey: 'dashboard.tool.seoOptimizerDesc',
    href: '/preview?tab=seo',
    from: '#10b981', to: '#34d399',
    badge: null as string | null,
    requiresYoutube: false,
  },
  {
    key: 'contentPlanner',
    titleKey: 'dashboard.tool.contentPlanner',
    descKey: 'dashboard.tool.publishPlanDesc',
    href: '/preview?tab=planner',
    from: '#f97316', to: '#ef4444',
    badge: null as string | null,
    requiresYoutube: false,
  },
  {
    key: 'designStudio',
    titleKey: 'dashboard.tool.designStudio',
    descKey: 'dashboard.tool.designStudioDesc',
    href: '/thumbnails',
    from: '#f59e0b', to: '#f97316',
    badge: null as string | null,
    requiresYoutube: false,
  },
];

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  analytics: (
    <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 11-6.2-8.6" /><path d="M21 3v6h-6" />
    </svg>
  ),
  aiThumbnails: (
    <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5H18l-3.5 2.5L16 15l-4-3-4 3 1.5-5L6 7.5h4.5z" />
    </svg>
  ),
  videoEditor: (
    <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  ),
  seoOptimizer: (
    <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  contentPlanner: (
    <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  designStudio: (
    <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
};

const FREE_TOOL_META = [
  { titleKey: 'dashboard.tool.titleGenerator', href: '/free-tools/title-generator' },
  { titleKey: 'dashboard.tool.descriptionGenerator', href: '/free-tools/description-generator' },
  { titleKey: 'dashboard.tool.tagGenerator', href: '/free-tools/tag-generator' },
  { titleKey: 'dashboard.tool.scriptGenerator', href: '/free-tools/script-generator' },
  { titleKey: 'dashboard.tool.channelNameGenerator', href: '/free-tools/channel-name-generator' },
  { titleKey: 'dashboard.tool.videoIdeas', href: '/free-tools/video-ideas' },
  { titleKey: 'dashboard.tool.characterCounter', href: '/free-tools/character-counter' },
  { titleKey: 'dashboard.tool.moneyCalculator', href: '/tools/youtube-money-calculator' },
  { titleKey: 'dashboard.tool.thumbnailChecker', href: '/tools/youtube-thumbnail-size' },
];

/* Mock bar heights for locked analytics preview */
const MOCK_BARS = [55, 72, 48, 88, 64, 80, 52, 92, 68, 85, 44, 76, 60, 95];

/* ================================================================
   HELPERS
   ================================================================ */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

function activityIcon(type: string, color: string) {
  switch (type) {
    case 'project_created':
      return (<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
    case 'video_generated':
      return (<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5,3 19,12 5,21" /></svg>);
    case 'project_exported':
      return (<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>);
    default:
      return (<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>);
  }
}

function activityLabel(type: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    project_created: t('dashboard.activity.projectCreated'),
    project_deleted: t('dashboard.activity.projectDeleted'),
    project_renamed: t('dashboard.activity.projectRenamed'),
    project_duplicated: t('dashboard.activity.projectDuplicated'),
    video_generated: t('dashboard.activity.videoGenerated'),
    project_exported: t('dashboard.activity.projectExported'),
    project_imported: t('dashboard.activity.projectImported'),
  };
  return map[type] ?? type;
}

function timeAgoShort(ts: number, t: (key: string) => string): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('dashboard.time.justNow');
  if (mins < 60) return t('dashboard.time.minutesAgo').replace('{n}', String(mins));
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('dashboard.time.hoursAgo').replace('{n}', String(hrs));
  const days = Math.floor(hrs / 24);
  if (days < 30) return t('dashboard.time.daysAgo').replace('{n}', String(days));
  return t('dashboard.time.monthsAgo').replace('{n}', String(Math.floor(days / 30)));
}

/* ================================================================
   SUB-COMPONENTS
   ================================================================ */

/* ── Frosted-glass lock overlay ── */
function LockedOverlay({
  C,
  label,
  onClick,
}: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  label: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(10, 10, 10, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 'inherit',
        zIndex: 2,
        cursor: 'pointer',
      }}
    >
      <div className="tf-lock-icon" style={{
        width: 48, height: 48, borderRadius: 14,
        background: `linear-gradient(135deg, ${C.accent}25, ${C.purple}25)`,
        border: `1px solid ${C.accent}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>
      <span style={{
        fontSize: 12, fontWeight: 700, color: C.accent,
        letterSpacing: '.04em', textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
}

/* ── Connection banner ── */
function ConnectionBanner({
  C,
  t,
  onConnect,
}: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  t: (key: string) => string;
  onConnect: () => void;
}) {
  return (
    <div
      className="tf-banner-glow tf-dash-connect-banner"
      style={{
        background: `linear-gradient(135deg, ${C.accent}12, ${C.purple}12, ${C.blue}12, ${C.accent}12)`,
        border: `1px solid ${C.accent}30`,
        borderRadius: 18,
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        marginBottom: 28,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `${C.accent}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29.94 29.94 0 001 12a29.94 29.94 0 00.46 5.58A2.78 2.78 0 003.4 19.6C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29.94 29.94 0 0023 12a29.94 29.94 0 00-.46-5.58z" />
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
            </svg>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
            {t('dashboard.connectBanner.title')}
          </h3>
        </div>
        <p style={{ fontSize: 13, color: C.sub, margin: '0 0 0 52px', lineHeight: 1.5 }}>
          {t('dashboard.connectBanner.desc')}
        </p>
      </div>
      <button
        onClick={onConnect}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 28px', borderRadius: 12,
          background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
          color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 700,
          transition: 'opacity 0.2s, transform 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1.02)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fillOpacity=".9" />
          <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fillOpacity=".7" />
          <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fillOpacity=".5" />
          <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fillOpacity=".6" />
        </svg>
        {t('dashboard.connectBanner.cta')}
      </button>
    </div>
  );
}

/* ── Locked analytics preview (mock stats + chart) ── */
function LockedAnalyticsPreview({
  C,
  connectLabel,
  onConnect,
}: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  connectLabel: string;
  onConnect: () => void;
}) {
  return (
    <div style={{
      position: 'relative', borderRadius: 18, overflow: 'hidden',
      marginBottom: 32, border: `1px solid ${C.border}`,
    }}>
      {/* Simulated analytics content behind the overlay */}
      <div style={{ padding: 24, background: C.card }}>
        {/* Mock quick stats */}
        <div style={{
          display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap',
        }}>
          {[
            { label: 'Subscribers', value: '12.5K', color: '#3b82f6' },
            { label: 'Views', value: '145K', color: '#10b981' },
            { label: 'Videos', value: '89', color: '#f97316' },
          ].map((stat) => (
            <div key={stat.label} style={{
              flex: '1 1 160px', padding: '18px 20px', borderRadius: 14,
              background: C.surface, border: `1px solid ${C.border}`,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: C.dim,
                textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10,
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: 26, fontWeight: 800, color: C.text,
                letterSpacing: '-.03em', filter: 'blur(5px)', userSelect: 'none',
              }}>
                {stat.value}
              </div>
              <div style={{
                marginTop: 10, height: 4, borderRadius: 2, background: C.border,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: '65%', height: '100%', borderRadius: 2,
                  background: `linear-gradient(90deg, ${stat.color}, ${stat.color}99)`,
                  filter: 'blur(2px)',
                }} />
              </div>
            </div>
          ))}
        </div>
        {/* Mock chart */}
        <div style={{
          height: 180, borderRadius: 14, background: C.surface,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          gap: 8, padding: '20px 24px', overflow: 'hidden',
        }}>
          {MOCK_BARS.map((h, i) => (
            <div key={i} style={{
              flex: 1, maxWidth: 24, height: `${h}%`,
              borderRadius: '4px 4px 0 0',
              background: `linear-gradient(180deg, ${C.accent}, ${C.purple}88)`,
              opacity: 0.4,
              filter: 'blur(2px)',
              transformOrigin: 'bottom',
              animation: `tfBarGrow 0.6s ease-out ${i * 0.05}s both`,
            }} />
          ))}
        </div>
      </div>
      {/* Full overlay */}
      <LockedOverlay C={C} label={connectLabel} onClick={onConnect} />
    </div>
  );
}

/* ── Feature grid card ── */
function FeatureGridCard({
  title,
  desc,
  href,
  from,
  to,
  badge,
  icon,
  locked,
  connectLabel,
  C,
  onConnect,
}: {
  title: string;
  desc: string;
  href: string;
  from: string;
  to: string;
  badge: string | null;
  icon: React.ReactNode;
  locked: boolean;
  connectLabel: string;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  onConnect: () => void;
}) {
  const inner = (
    <div
      className={`tf-feat-card ${locked ? 'tf-feat-locked' : ''}`}
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        background: C.card,
        border: `1px solid ${locked ? C.border : from + '30'}`,
        height: '100%',
      }}
    >
      {/* Gradient header */}
      <div style={{
        height: 110,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        opacity: locked ? 0.5 : 1,
      }}>
        {icon}
        {badge && (
          <span style={{
            position: 'absolute', top: 10, right: 10,
            background: badge === 'PRO' ? '#6366f1' : badge === 'NEW' ? '#84cc16' : '#22c55e',
            color: badge === 'PRO' ? '#fff' : '#000',
            fontSize: 10, fontWeight: 700,
            padding: '3px 8px', borderRadius: 6,
          }}>
            {badge}
          </span>
        )}
      </div>
      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</span>
          {!locked && <span style={{ color: C.dim, fontSize: 16 }}>&rarr;</span>}
        </div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.4 }}>{desc}</div>
      </div>
      {/* Lock overlay */}
      {locked && <LockedOverlay C={C} label={connectLabel} onClick={onConnect} />}
    </div>
  );

  if (locked) {
    return <div onClick={onConnect} style={{ cursor: 'pointer' }}>{inner}</div>;
  }

  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      {inner}
    </Link>
  );
}

/* ── Free tool chip ── */
function FreeToolChip({
  title,
  href,
  C,
}: {
  title: string;
  href: string;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        scrollSnapAlign: 'start',
        padding: '14px 20px',
        borderRadius: 14,
        background: hovered ? C.surface : C.card,
        border: `1px solid ${hovered ? C.accent : C.border}`,
        textDecoration: 'none',
        transition: 'all .2s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 6px 20px rgba(0,0,0,.15)' : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</span>
      <span style={{ color: C.dim, fontSize: 14 }}>&rarr;</span>
    </Link>
  );
}

/* ================================================================
   MAIN DASHBOARD COMPONENT
   ================================================================ */

export function Dashboard() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const freeToolsScrollRef = useRef<HTMLDivElement>(null);

  /* ── Recent activity ── */
  const [recentActivities, setRecentActivities] = useState<ActivityEntry[]>([]);
  useEffect(() => { setRecentActivities(getRecentActivity(6)); }, []);

  /* ── tRPC queries ── */
  const profile = trpc.user.getProfile.useQuery();

  /* ── Channel connection check ── */
  // Primary source: channels already synced to DB (from profile query)
  const profileChannels = profile.data?.channels ?? [];

  // Secondary: live sync from YouTube API.
  // Only run if user already has channels in DB — avoids spurious 401s
  // when user has not connected Google OAuth yet.
  const channelsQuery = trpc.youtube.getChannels.useQuery(undefined, {
    retry: 1,
    staleTime: 5 * 60 * 1000,
    enabled: profileChannels.length > 0,
  });

  const apiChannels = channelsQuery.data ?? [];
  // Connected if DB has channels OR API returned channels
  const isConnected = profileChannels.length > 0 || (channelsQuery.isSuccess && apiChannels.length > 0);
  const isCheckingConnection = profile.isLoading || (channelsQuery.isLoading && profileChannels.length === 0);

  /* ── Refetch profile when channel sync succeeds (updates DB channels) ── */
  const prevSyncSuccess = useRef(false);
  useEffect(() => {
    if (channelsQuery.isSuccess && apiChannels.length > 0 && !prevSyncSuccess.current) {
      prevSyncSuccess.current = true;
      profile.refetch();
    }
  }, [channelsQuery.isSuccess, apiChannels.length, profile]);

  /* ── Show error toast when YouTube API fails ── */
  useEffect(() => {
    if (channelsQuery.isError && !isConnected) {
      const msg = channelsQuery.error?.message || 'Failed to load YouTube channels';
      toast.error(msg);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelsQuery.isError]);

  /* ── Connect handler ── */
  const handleConnect = useCallback(() => {
    signIn('google', { callbackUrl: '/dashboard' });
  }, []);

  /* ── Auto-trigger checkout from pricing CTA ── */
  const initCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
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

  /* ── Show toast on successful upgrade ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      toast.success(t('billing.upgradeSuccess'));
      window.history.replaceState({}, '', '/dashboard');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Horizontal wheel scroll for free tools ── */
  const handleFreeToolsWheel = useCallback((e: WheelEvent) => {
    if (!freeToolsScrollRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      freeToolsScrollRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  useEffect(() => {
    const el = freeToolsScrollRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleFreeToolsWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleFreeToolsWheel);
  }, [handleFreeToolsWheel]);

  /* ── Error state ── */
  if (profile.isError) {
    const err = profile.error;
    return (
      <ErrorFallback
        error={err instanceof Error ? err : new Error((err as { message?: string })?.message ?? String(err))}
        reset={() => profile.refetch()}
      />
    );
  }

  const user = profile.data;
  const connectLabel = t('dashboard.locked.connect');

  return (
    <div className="tf-dash-container" style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 16px', boxSizing: 'border-box', overflow: 'hidden' }}>
      <style>{NEON_CSS}</style>

      {/* ── Upgrade popup for free users ── */}
      {/* Upgrade popup disabled for testing */}

      {/* ── Welcome header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="tf-dash-heading" style={{
          fontSize: 'clamp(18px, 4vw, 26px)', fontWeight: 600, margin: '0 0 4px',
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

      {/* ── Connection banner (shown when not connected) ── */}
      {!isConnected && !isCheckingConnection && (
        <ConnectionBanner C={C} t={t} onConnect={handleConnect} />
      )}
      {isCheckingConnection && (
        <Skeleton width="100%" height={100} style={{ borderRadius: 18, marginBottom: 28 }} />
      )}

      {/* ── Channel Analytics (when connected) with neon glow ── */}
      {isConnected && (
        <div style={{ position: 'relative', marginBottom: 32 }}>
          {/* Neon glow backdrop */}
          <div style={{
            position: 'absolute', inset: -2,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${C.accent}10, ${C.purple}10, ${C.blue}10)`,
            filter: 'blur(24px)',
            zIndex: 0,
            pointerEvents: 'none',
          }} />
          <div
            className="tf-neon-active"
            style={{
              position: 'relative', zIndex: 1,
              borderRadius: 18,
              border: `1px solid ${C.accent}25`,
              padding: 2,
              '--tf-neon': `${C.accent}50`,
              '--tf-neon-soft': `${C.accent}20`,
              '--tf-neon-dim': `${C.accent}08`,
            } as React.CSSProperties}
          >
            <div style={{ borderRadius: 16, overflow: 'hidden' }}>
              <ChannelAnalytics />
            </div>
          </div>
        </div>
      )}

      {/* ── Locked analytics preview — disabled for testing ── */}
      {isCheckingConnection && (
        <Skeleton width="100%" height={320} style={{ borderRadius: 18, marginBottom: 32 }} />
      )}

      {/* ── Feature grid: "Your Tools" ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 18,
        }}>
          <div>
            <h2 style={{
              fontSize: 22, fontWeight: 800, color: C.text,
              margin: 0, letterSpacing: '-.02em', textTransform: 'uppercase',
            }}>
              {t('dashboard.yourTools')}
            </h2>
            <p style={{ fontSize: 13, color: C.sub, margin: '4px 0 0' }}>
              {t('dashboard.yourToolsDesc')}
            </p>
          </div>
          <Link href="/tools" style={{
            fontSize: 13, color: C.sub, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {t('dashboard.seeAll')} <span>&rsaquo;</span>
          </Link>
        </div>
        <div className="tf-dash-feature-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
          gap: 16,
        }}>
          {FEATURE_CARDS.map((feature) => (
            <FeatureGridCard
              key={feature.key}
              title={t(feature.titleKey)}
              desc={t(feature.descKey)}
              href={feature.href}
              from={feature.from}
              to={feature.to}
              badge={feature.badge}
              icon={FEATURE_ICONS[feature.key]}
              locked={feature.requiresYoutube && !isConnected && !isCheckingConnection}
              connectLabel={connectLabel}
              C={C}
              onConnect={handleConnect}
            />
          ))}
        </div>
      </div>

      {/* ── Recent History (conditional) ─────────── */}
      {recentActivities.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <h2 style={{
              fontSize: 22, fontWeight: 700, color: C.text,
              margin: 0, letterSpacing: '-.02em',
            }}>
              {t('dashboard.recentHistory')}
            </h2>
          </div>
          <div className="tf-history-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
            gap: 10,
          }}>
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: C.surface,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {activityIcon(activity.type, C.accent)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: C.text,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {activityLabel(activity.type, t)}
                  </div>
                  {activity.label && (
                    <div style={{
                      fontSize: 12, color: C.sub, marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {activity.label}
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: 11, color: C.dim, fontWeight: 500,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {timeAgoShort(activity.timestamp, t)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upgrade modal for new FREE users ──────── */}
      {user && <DashboardUpgradeModal userPlan={user.plan} />}
    </div>
  );
}
