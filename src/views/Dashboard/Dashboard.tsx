'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorFallback } from '@/components/ui/ErrorFallback';
import { toast } from '@/stores/useNotificationStore';
import { getRecentActivity, type ActivityEntry } from '@/lib/activity-log';

/* ── Tool icon definitions (static, no i18n needed) ──── */

const TOP_TOOL_ICONS = [
  <svg key="ai" width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5H18l-3.5 2.5L16 15l-4-3-4 3 1.5-5L6 7.5h4.5z" /></svg>,
  <svg key="ve" width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5,3 19,12 5,21" /></svg>,
  <svg key="ds" width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
  <svg key="seo" width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  <svg key="va" width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  <svg key="an" width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 11-6.2-8.6" /><path d="M21 3v6h-6" /></svg>,
  <svg key="cp" width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
];

/* Static parts of top tools (no translated strings) */
const TOP_TOOL_META = [
  { titleKey: 'dashboard.tool.aiThumbnails', descKey: 'dashboard.tool.aiThumbnailsDesc', href: '/ai-thumbnails', from: '#6366f1', to: '#8b5cf6', badge: 'NEW' as const },
  { titleKey: 'dashboard.tool.videoEditor', descKey: 'dashboard.tool.videoEditorNavDesc', href: '/editor', from: '#3b82f6', to: '#06b6d4', badge: null },
  { titleKey: 'dashboard.tool.designStudio', descKey: 'dashboard.tool.designStudioDesc', href: '/thumbnails', from: '#f59e0b', to: '#f97316', badge: null },
  { titleKey: 'dashboard.tool.seoOptimizer', descKey: 'dashboard.tool.seoOptimizerDesc', href: '/preview?tab=seo', from: '#10b981', to: '#34d399', badge: null },
  { titleKey: 'dashboard.tool.videoAnalyzer', descKey: 'dashboard.tool.videoAnalyzerDesc', href: '/tools/youtube-downloader', from: '#14b8a6', to: '#22d3ee', badge: 'FREE' as const },
  { titleKey: 'dashboard.tool.analytics', descKey: 'dashboard.tool.analyticsDesc', href: '/analytics', from: '#8b5cf6', to: '#ec4899', badge: null },
  { titleKey: 'dashboard.tool.contentPlanner', descKey: 'dashboard.tool.publishPlanDesc', href: '/preview?tab=planner', from: '#f97316', to: '#ef4444', badge: null },
];

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

/* ── Activity icon helper ─────────────────────────────── */

function activityIcon(type: string, color: string) {
  switch (type) {
    case 'project_created':
      return (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case 'video_generated':
      return (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5,3 19,12 5,21" />
        </svg>
      );
    case 'project_exported':
      return (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      );
    default:
      return (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
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

/* ── TopChoiceCard component ──────────────────────────── */

function TopChoiceCard({
  title,
  desc,
  href,
  from,
  to,
  badge,
  icon,
  C,
}: {
  title: string;
  desc: string;
  href: string;
  from: string;
  to: string;
  badge: string | null;
  icon: React.ReactNode;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
}) {
  return (
    <Link
      href={href}
      className="tf-top-choice-card tf-top-choice-item"
      style={{
        width: 220,
        flexShrink: 0,
        borderRadius: 14,
        overflow: 'hidden',
        textDecoration: 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Visual area — gradient with icon */}
      <div style={{
        height: 160,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderRadius: '14px 14px 0 0',
      }}>
        {icon}
        {badge && (
          <span style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: badge === 'PRO' ? '#6366f1' : badge === 'NEW' ? '#84cc16' : '#22c55e',
            color: badge === 'PRO' ? '#fff' : '#000',
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
          }}>
            {badge}
          </span>
        )}
      </div>
      {/* Title + description */}
      <div style={{ padding: '12px 14px', background: C.card }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</span>
          <span style={{ color: C.dim }}>&rarr;</span>
        </div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>{desc}</div>
      </div>
    </Link>
  );
}

/* ── FreeToolChip component ───────────────────────────── */

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
      <span style={{
        fontSize: 14,
        fontWeight: 600,
        color: C.text,
      }}>
        {title}
      </span>
      <span style={{ color: C.dim, fontSize: 14 }}>&rarr;</span>
    </Link>
  );
}

/* ── Main Dashboard Component ──────────────────────────── */

export function Dashboard() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const freeToolsScrollRef = useRef<HTMLDivElement>(null);

  /* ── Recent activity ── */
  const [recentActivities, setRecentActivities] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    setRecentActivities(getRecentActivity(6));
  }, []);

  /* ── tRPC queries ─────────────────────────────── */
  const profile = trpc.user.getProfile.useQuery();

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

  /* ── Horizontal wheel scroll for free tools ──── */
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

  /* ── Error state ─────────────────────────────── */
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

  return (
    <div className="tf-dash-container" style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 16px', boxSizing: 'border-box' }}>

      {/* ── Welcome header ────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="tf-dash-heading" style={{
          fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 600, margin: '0 0 4px',
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
        marginBottom: 32, display: 'flex', gap: 32, alignItems: 'center',
        overflow: 'visible', boxSizing: 'border-box',
      }} className="tf-dash-showcase">
        {/* Left: headline + CTA */}
        <div style={{ flexShrink: 0, minWidth: 200 }} className="tf-dash-showcase-left">
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1.1, margin: 0 }}>
            {t('dashboard.hero.title1')}<br />
            <span style={{ color: C.accent }}>{t('dashboard.hero.title2')}</span>
          </h2>
          <p style={{ fontSize: 14, color: C.sub, marginTop: 12, maxWidth: 220, marginBottom: 0 }}>
            {t('dashboard.hero.subtitle')}
          </p>
          <Link href="/free-tools" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 20, padding: '10px 20px',
            background: C.accent, color: '#000',
            borderRadius: 10, fontSize: 13, fontWeight: 700,
            textDecoration: 'none',
          }}>
            {t('dashboard.hero.cta')} &#10022;
          </Link>
        </div>
        {/* Right: horizontal scroll of product cards */}
        <div style={{
          display: 'flex', gap: 14, overflowX: 'auto', flex: 1,
          scrollSnapType: 'x mandatory', padding: '8px 0',
          msOverflowStyle: 'none', scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch', touchAction: 'pan-x',
        }} className="tf-dash-showcase-scroll">
          {([
            { href: '/ai-thumbnails', titleKey: 'dashboard.tool.aiThumbnails', gradientFrom: '#6366f1', gradientTo: '#8b5cf6', badge: 'NEW', badgeColor: '#84cc16',
              icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5H18l-3.5 2.5L16 15l-4-3-4 3 1.5-5L6 7.5h4.5z" /></svg> },
            { href: '/editor', titleKey: 'dashboard.tool.videoEditor', gradientFrom: '#3b82f6', gradientTo: '#06b6d4', badge: null, badgeColor: '',
              icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5,3 19,12 5,21" /></svg> },
            { href: '/preview?tab=seo', titleKey: 'dashboard.tool.seoOptimizer', gradientFrom: '#10b981', gradientTo: '#34d399', badge: null, badgeColor: '',
              icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> },
            { href: '/thumbnails', titleKey: 'dashboard.tool.thumbnailEditor', gradientFrom: '#f59e0b', gradientTo: '#f97316', badge: null, badgeColor: '',
              icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg> },
            { href: '/free-tools', titleKey: 'dashboard.tool.freeToolsNav', gradientFrom: '#6366f1', gradientTo: '#ec4899', badge: 'FREE', badgeColor: '#22c55e',
              icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg> },
            { href: '/tools/youtube-downloader', titleKey: 'dashboard.tool.videoAnalyzer', gradientFrom: '#14b8a6', gradientTo: '#22d3ee', badge: 'FREE', badgeColor: '#22c55e',
              icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
          ] as const).map((product) => (
            <Link key={product.href} href={product.href} className="tf-dash-showcase-card tf-dash-product-card" style={{
              width: 180, flexShrink: 0, scrollSnapAlign: 'start',
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 14, overflow: 'hidden',
              textDecoration: 'none', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                height: 140, background: `linear-gradient(135deg, ${product.gradientFrom}, ${product.gradientTo})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                {product.icon}
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
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t(product.titleKey)}</span>
                <span style={{ color: C.dim, fontSize: 16 }}>&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Top Choice — horizontal scroll ────────── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <div>
            <h2 style={{
              fontSize: 22,
              fontWeight: 800,
              color: C.text,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
            }}>
              {t('dashboard.topChoice')}
            </h2>
            <p style={{
              fontSize: 13,
              color: C.sub,
              margin: '4px 0 0',
            }}>
              {t('dashboard.topChoiceDesc')}
            </p>
          </div>
          <Link href="/tools" style={{
            fontSize: 13,
            color: C.sub,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            {t('dashboard.seeAll')} <span>&rsaquo;</span>
          </Link>
        </div>
        <div
          onWheel={(e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              e.currentTarget.scrollLeft += e.deltaY;
              e.preventDefault();
            }
          }}
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            padding: '8px 0',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
          }}
          className="tf-top-choice-scroll"
        >
          {TOP_TOOL_META.map((tool, i) => (
            <TopChoiceCard
              key={tool.href}
              title={t(tool.titleKey)}
              desc={t(tool.descKey)}
              href={tool.href}
              from={tool.from}
              to={tool.to}
              badge={tool.badge}
              icon={TOP_TOOL_ICONS[i]}
              C={C}
            />
          ))}
        </div>
      </div>

      {/* ── Free YouTube Tools — horizontal scroll ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <h2 style={{
            fontSize: 22, fontWeight: 700, color: C.text,
            margin: 0, letterSpacing: '-.02em',
          }}>
            {t('dashboard.freeYoutubeTools')}
          </h2>
          <Link href="/free-tools" style={{
            fontSize: 13, fontWeight: 600, color: C.accent,
            textDecoration: 'none',
          }}>
            {t('dashboard.viewAll')} &rarr;
          </Link>
        </div>
        <div
          ref={freeToolsScrollRef}
          className="tf-free-tools-scroll"
          style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: 24,
            paddingTop: 8,
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
          }}
        >
          {FREE_TOOL_META.map((tool) => (
            <FreeToolChip
              key={tool.href}
              title={t(tool.titleKey)}
              href={tool.href}
              C={C}
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
    </div>
  );
}
