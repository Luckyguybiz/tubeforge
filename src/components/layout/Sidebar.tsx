'use client';
import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { usePlanLimits } from '@/hooks/usePlanLimits';

const COLLAPSE_PAGES = ['thumbnails'];

/* ── SVG Icons (20x20 viewBox) ────────────────────────────────────── */

const icons: Record<string, (color: string, accent?: string) => React.ReactNode> = {
  dashboard: (c, a) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <defs>
        <linearGradient id="dash-g" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor={a ?? c} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="7" height="8" rx="2" fill={a ? 'url(#dash-g)' : c} opacity=".85" />
      <rect x="11" y="2" width="7" height="5" rx="2" fill={c} opacity=".5" />
      <rect x="2" y="12" width="7" height="6" rx="2" fill={c} opacity=".5" />
      <rect x="11" y="9" width="7" height="9" rx="2" fill={a ? 'url(#dash-g)' : c} opacity=".85" />
    </svg>
  ),
  editor: (c) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M7 4L16 10L7 16V4Z" fill={c} opacity=".85" />
      <path d="M4 6V14" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity=".4" />
    </svg>
  ),
  metadata: (c) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M13.5 3.5L16.5 6.5L7 16H4V13L13.5 3.5Z" fill={c} opacity=".85" />
      <path d="M4 17.5H16" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity=".5" />
    </svg>
  ),
  thumbnails: (c) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="16" height="11" rx="2.5" fill={c} opacity=".25" />
      <rect x="3" y="4" width="14" height="9" rx="1.5" fill={c} opacity=".85" />
      <circle cx="7" cy="8" r="2" fill={c} opacity=".35" />
      <path d="M5 12L8 9L11 12L13 10L17 13H3L5 12Z" fill={c} opacity=".4" />
      <rect x="5" y="16" width="10" height="1.5" rx=".75" fill={c} opacity=".3" />
    </svg>
  ),
  preview: (c) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke={c} strokeWidth="1.5" opacity=".5" />
      <circle cx="10" cy="10" r="3" fill={c} opacity=".85" />
      <circle cx="10" cy="10" r="5" stroke={c} strokeWidth=".5" opacity=".25" />
    </svg>
  ),
  team: (c) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="8" cy="6" r="3" fill={c} opacity=".85" />
      <path d="M3 16C3 13 5 11 8 11C11 11 13 13 13 16" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity=".7" />
      <circle cx="14" cy="7" r="2" fill={c} opacity=".5" />
      <path d="M13.5 11.5C15.5 11.5 17 13 17 15" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity=".4" />
    </svg>
  ),
  settings: (c) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3" stroke={c} strokeWidth="1.5" opacity=".85" />
      <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.66 4.34L14.24 5.76M5.76 14.24L4.34 15.66M15.66 15.66L14.24 14.24M5.76 5.76L4.34 4.34" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity=".5" />
    </svg>
  ),
  admin: (c) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L3 6V10C3 14.4 6 17.5 10 18.5C14 17.5 17 14.4 17 10V6L10 2Z" fill={c} opacity=".25" />
      <path d="M10 3.5L4.5 6.75V10C4.5 13.7 7 16.2 10 17C13 16.2 15.5 13.7 15.5 10V6.75L10 3.5Z" stroke={c} strokeWidth="1.2" opacity=".85" />
      <path d="M7.5 10L9.5 12L13 8" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".85" />
    </svg>
  ),
  logout: (c) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 2H3.5C2.67 2 2 2.67 2 3.5V12.5C2 13.33 2.67 14 3.5 14H6" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11 11L14 8L11 5" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 8H14" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  collapse: (c) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8L10 13" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  expand: (c) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 3L11 8L6 13" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  sparkle: (c) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill={c} />
    </svg>
  ),
  search: (c) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke={c} strokeWidth="1.3" />
      <path d="M10.5 10.5L14 14" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  tools: (c) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="2" fill={c} opacity=".85" />
      <rect x="11" y="2" width="7" height="7" rx="2" fill={c} opacity=".5" />
      <rect x="2" y="11" width="7" height="7" rx="2" fill={c} opacity=".5" />
      <rect x="11" y="11" width="7" height="7" rx="2" fill={c} opacity=".35" />
    </svg>
  ),
  billing: (c) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="4" width="16" height="12" rx="2.5" stroke={c} strokeWidth="1.5" opacity=".85" />
      <path d="M2 8H18" stroke={c} strokeWidth="1.5" opacity=".5" />
      <rect x="4.5" y="11" width="5" height="2" rx="1" fill={c} opacity=".4" />
    </svg>
  ),
  referral: (c, a) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <defs>
        <linearGradient id="ref-g" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor={a ?? c} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <rect x="2" y="8" width="16" height="10" rx="2" stroke={a ? 'url(#ref-g)' : c} strokeWidth="1.5" opacity=".85" />
      <path d="M10 8V18" stroke={c} strokeWidth="1.3" opacity=".5" />
      <path d="M2 11H18" stroke={c} strokeWidth="1.3" opacity=".5" />
      <path d="M10 8C10 8 10 4 7 4C5.5 4 4 5 5 6.5C6 8 10 8 10 8Z" stroke={c} strokeWidth="1.3" strokeLinecap="round" opacity=".85" />
      <path d="M10 8C10 8 10 4 13 4C14.5 4 16 5 15 6.5C14 8 10 8 10 8Z" stroke={c} strokeWidth="1.3" strokeLinecap="round" opacity=".85" />
    </svg>
  ),
  'shorts-analytics': (c, a) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <defs>
        <linearGradient id="shorts-g" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor={a ?? c} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <rect x="7" y="2" width="6" height="16" rx="3" fill={a ? 'url(#shorts-g)' : c} opacity=".85" />
      <path d="M8.5 8L12.5 10.5L8.5 13V8Z" fill={c === '#fff' ? '#000' : '#fff'} opacity=".9" />
      <path d="M2 14L5 10L8 12" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity=".45" />
      <path d="M12 11L15 7L18 9" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity=".45" />
    </svg>
  ),
  'tiktok-analytics': (_c, _a) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <defs>
        <linearGradient id="tiktok-g" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00f2ea" />
          <stop offset="1" stopColor="#ff0050" />
        </linearGradient>
      </defs>
      <path d="M10 3V13" stroke="url(#tiktok-g)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="7.5" cy="13.5" r="3" stroke="url(#tiktok-g)" strokeWidth="1.5" fill="none" />
      <path d="M10 5C10 5 12 5 14 7C16 9 17 9 17 9" stroke="url(#tiktok-g)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M2 16L5 12L8 14" stroke="#00f2ea" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity=".5" />
      <path d="M12 14L15 10L18 12" stroke="#ff0050" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity=".5" />
    </svg>
  ),
  media: (c, a) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <defs>
        <linearGradient id="media-g" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor={a ?? c} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <rect x="2" y="3" width="16" height="14" rx="2.5" stroke={a ? 'url(#media-g)' : c} strokeWidth="1.5" opacity=".85" />
      <circle cx="7" cy="9" r="2" fill={c} opacity=".5" />
      <path d="M4 15L7 11L10 14L13 10L18 15" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity=".6" />
    </svg>
  ),
  brand: (c, a) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <defs>
        <linearGradient id="brand-g" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor={a ?? c} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <circle cx="10" cy="10" r="7.5" stroke={a ? 'url(#brand-g)' : c} strokeWidth="1.5" opacity=".85" />
      <circle cx="8" cy="8" r="2" fill={c} opacity=".6" />
      <circle cx="12" cy="8" r="2" fill={c} opacity=".4" />
      <circle cx="10" cy="12" r="2" fill={c} opacity=".5" />
    </svg>
  ),
  blog: (c) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="2" width="14" height="16" rx="2.5" stroke={c} strokeWidth="1.5" opacity=".85" />
      <path d="M6.5 6H13.5" stroke={c} strokeWidth="1.3" strokeLinecap="round" opacity=".7" />
      <path d="M6.5 9.5H13.5" stroke={c} strokeWidth="1.3" strokeLinecap="round" opacity=".5" />
      <path d="M6.5 13H10.5" stroke={c} strokeWidth="1.3" strokeLinecap="round" opacity=".35" />
    </svg>
  ),
  analytics: (c, a) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <defs>
        <linearGradient id="analytics-g" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor={a ?? c} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <rect x="2" y="12" width="3" height="6" rx="1" fill={a ? 'url(#analytics-g)' : c} opacity=".6" />
      <rect x="7" y="8" width="3" height="10" rx="1" fill={a ? 'url(#analytics-g)' : c} opacity=".75" />
      <rect x="12" y="4" width="3" height="14" rx="1" fill={a ? 'url(#analytics-g)' : c} opacity=".85" />
      <path d="M3 11L8 7L13 3L18 5" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity=".4" />
      <circle cx="18" cy="5" r="1.5" fill={c} opacity=".5" />
    </svg>
  ),
  gear: (c) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="2" stroke={c} strokeWidth="1.2" />
      <path d="M7 1.5V3M7 11V12.5M12.5 7H11M3 7H1.5M10.9 3.1L9.8 4.2M4.2 9.8L3.1 10.9M10.9 10.9L9.8 9.8M4.2 4.2L3.1 3.1" stroke={c} strokeWidth="1" strokeLinecap="round" />
    </svg>
  ),
};

/* ── Navigation groups + items ─────────────────────────────────────── */

interface NavItemDef {
  id: string;
  label: string;
  iconColor?: string; // theme color key override for gradient
}

interface NavGroup {
  label: string;
  labelCollapsed?: string;
  items: NavItemDef[];
  condition?: (plan: string, role: string) => boolean;
}

function getNavGroups(t: (key: string) => string): NavGroup[] {
  return [
    {
      label: t('sidebar.creation'),
      items: [
        { id: 'dashboard', label: t('nav.dashboard') },
        { id: 'editor', label: t('nav.editor') },
        { id: 'metadata', label: t('nav.metadata') },
      ],
    },
    {
      label: t('sidebar.tools'),
      items: [
        { id: 'tools', label: t('nav.tools') },
        { id: 'thumbnails', label: t('nav.thumbnails') },
        { id: 'preview', label: t('nav.preview') },
        { id: 'media', label: t('nav.media') },
        { id: 'brand', label: t('nav.brand') },
        { id: 'shorts-analytics', label: t('nav.shortsAnalytics') },
        { id: 'tiktok-analytics', label: t('nav.tiktokAnalytics') },
        { id: 'analytics', label: t('nav.analytics') },
      ],
    },
    {
      label: t('sidebar.team'),
      items: [
        { id: 'team', label: t('nav.team') },
      ],
      condition: (plan) => plan === 'STUDIO',
    },
    {
      label: t('sidebar.system'),
      items: [
        { id: 'blog', label: t('nav.blog') },
        { id: 'referral', label: t('nav.referral') },
        { id: 'settings', label: t('nav.settings') },
        { id: 'billing', label: t('nav.billing') },
        { id: 'admin', label: t('nav.admin') },
      ],
    },
  ];
}

/* ── Icon-to-gradient mapping ──────────────────────────────────────── */

const ICON_GRADIENTS: Record<string, [string, string]> = {
  dashboard: ['accent', 'pink'],
  editor: ['blue', 'cyan'],
  metadata: ['purple', 'blue'],
  tools: ['accent', 'purple'],
  thumbnails: ['orange', 'pink'],
  preview: ['green', 'cyan'],
  team: ['purple', 'pink'],
  settings: ['sub', 'dim'],
  billing: ['green', 'cyan'],
  referral: ['green', 'cyan'],
  admin: ['accent', 'orange'],
  'shorts-analytics': ['green', 'cyan'],
  'tiktok-analytics': ['cyan', 'pink'],
  analytics: ['cyan', 'purple'],
  blog: ['blue', 'purple'],
  media: ['blue', 'purple'],
  brand: ['pink', 'orange'],
};

/* ── Tooltip Component ─────────────────────────────────────────────── */

const Tooltip = memo(function Tooltip({
  label,
  children,
  show,
}: {
  label: string;
  children: React.ReactNode;
  show: boolean;
}) {
  if (!show) return <>{children}</>;
  return (
    <div style={{ position: 'relative' }}>
      {children}
      <div
        role="tooltip"
        style={{
          position: 'absolute',
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: 12,
          padding: '6px 12px',
          borderRadius: 8,
          background: 'rgba(20,20,30,.95)',
          color: '#e8e8f0',
          fontSize: 12,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.06)',
          backdropFilter: 'blur(12px)',
          letterSpacing: '-.01em',
        }}
      >
        {label}
        {/* Tooltip arrow */}
        <div
          style={{
            position: 'absolute',
            left: -4,
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)',
            width: 8,
            height: 8,
            background: 'rgba(20,20,30,.95)',
            borderLeft: '1px solid rgba(255,255,255,.06)',
            borderBottom: '1px solid rgba(255,255,255,.06)',
          }}
        />
      </div>
    </div>
  );
});

/* ── Usage Progress Widget ────────────────────────────────────────── */

function UsageProgressBar({
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
  const barColor = pct > 90 ? '#ef4444' : pct > 60 ? '#eab308' : isDark ? '#22c55e' : C.accent;
  const displayTotal = isInfinite ? '\u221E' : String(total);

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: C.sub }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{used}/{displayTotal}</span>
      </div>
      <div style={{
        height: 4,
        borderRadius: 2,
        background: isDark ? 'rgba(255,255,255,.06)' : '#e5e5ea',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          borderRadius: 2,
          width: isInfinite ? '0%' : `${pct}%`,
          background: barColor,
          transition: 'width .4s ease, background .3s ease',
        }} />
      </div>
    </div>
  );
}

function SidebarUsageWidget({
  C,
  isDark,
  t,
  navigate,
}: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  isDark: boolean;
  t: (key: string) => string;
  navigate: (path: string) => void;
}) {
  const { plan, projectCount, aiCount, limits, isLoading } = usePlanLimits();

  if (isLoading) return null;

  const planLabel = ({ FREE: t('common.free'), PRO: t('common.pro'), STUDIO: t('common.studio') } as Record<string, string>)[plan] ?? plan;
  const planBg =
    plan === 'STUDIO'
      ? `linear-gradient(135deg, ${C.purple}, ${C.blue})`
      : plan === 'PRO'
        ? `linear-gradient(135deg, ${C.accent}, ${C.pink})`
        : isDark
          ? 'rgba(255,255,255,.06)'
          : 'rgba(0,0,0,.05)';
  const planColor = plan === 'FREE' ? C.dim : '#fff';

  return (
    <div style={{
      margin: '0 12px 8px',
      padding: 14,
      borderRadius: 14,
      background: isDark ? 'rgba(255,255,255,.02)' : '#f5f5f7',
      border: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : '#e5e5ea'}`,
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Plan badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: planColor,
          padding: '2px 8px',
          borderRadius: 5,
          background: planBg,
          letterSpacing: '.02em',
        }}>
          {planLabel}
        </span>
      </div>

      {/* Progress bars */}
      <UsageProgressBar
        label={t('sidebar.usageProjects')}
        used={projectCount}
        total={limits.projects}
        C={C}
        isDark={isDark}
      />
      <UsageProgressBar
        label={t('sidebar.usageAi')}
        used={aiCount}
        total={limits.ai}
        C={C}
        isDark={isDark}
      />

      {/* Upgrade button for FREE users */}
      {plan === 'FREE' && (
        <button
          onClick={() => navigate('billing')}
          style={{
            width: '100%',
            padding: '7px 12px',
            marginTop: 6,
            borderRadius: 8,
            border: 'none',
            background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all .2s ease',
            letterSpacing: '-.01em',
          }}
        >
          {t('sidebar.upgradePlan')}
        </button>
      )}
    </div>
  );
}

/* ── Sidebar Component ─────────────────────────────────────────────── */

export const Sidebar = memo(function Sidebar() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const t = useLocaleStore((s) => s.t);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const current = pathname.split('/').filter(Boolean)[0] || 'dashboard';

  const shouldAutoCollapse = COLLAPSE_PAGES.includes(current);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tf-sidebar');
      if (stored !== null) return stored === '1';
    }
    return shouldAutoCollapse;
  });

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipId, setTooltipId] = useState<string | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('tf-sidebar', collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('tf-sidebar') === null) {
      setCollapsed(shouldAutoCollapse);
    }
  }, [shouldAutoCollapse]);

  const userName = session?.user?.name ?? t('common.user');
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const plan = session?.user?.plan ?? 'FREE';
  const planLabel = ({ FREE: t('common.free'), PRO: t('common.pro'), STUDIO: t('common.studio') } as Record<string, string>)[plan] ?? plan;
  const role = session?.user?.role ?? 'USER';

  const W = collapsed ? 68 : 240;

  const navigate = useCallback(
    (path: string) => {
      router.push(`/${path}`);
    },
    [router],
  );

  /* ── Hover handlers with tooltip delay ───────────────── */
  const handleMouseEnter = useCallback(
    (id: string) => {
      setHoveredId(id);
      if (collapsed) {
        tooltipTimer.current = setTimeout(() => setTooltipId(id), 200);
      }
    },
    [collapsed],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
    setTooltipId(null);
    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
      tooltipTimer.current = null;
    }
  }, []);

  /* ── Plan badge color ───────────────────────────────── */
  const planBadgeBg =
    plan === 'STUDIO'
      ? `linear-gradient(135deg, ${C.purple}, ${C.blue})`
      : plan === 'PRO'
        ? `linear-gradient(135deg, ${C.accent}, ${C.pink})`
        : isDark
          ? 'rgba(255,255,255,.06)'
          : 'rgba(0,0,0,.05)';
  const planBadgeColor = plan === 'FREE' ? C.dim : '#fff';

  /* ── Nav button renderer ────────────────────────────── */
  const renderNavBtn = (item: NavItemDef) => {
    const { id, label } = item;
    const isActive = current === id;
    const isHovered = hoveredId === id;
    const showTooltip = collapsed && tooltipId === id;

    // Gradient icon colors
    const gradientKeys = ICON_GRADIENTS[id] ?? ['sub', 'dim'];
    const iconColor = isActive
      ? C[gradientKeys[0] as keyof typeof C]
      : isHovered
        ? isDark ? C.text : '#1d1d1f'
        : isDark ? C.sub : '#86868b';
    const iconAccent = isActive
      ? C[gradientKeys[1] as keyof typeof C]
      : undefined;

    // data-tour markers for onboarding spotlight
    const tourId = id === 'tools' ? 'tools-section' : id === 'billing' ? 'billing-section' : undefined;

    const btn = (
      <button
        key={id}
        className="tf-mobile-nav-item"
        aria-current={isActive ? 'page' : undefined}
        data-tour={tourId}
        onClick={() => navigate(id)}
        onMouseEnter={() => handleMouseEnter(id)}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 12,
          padding: collapsed ? '10px 0' : '9px 14px',
          borderRadius: 10,
          border: 'none',
          background: isActive
            ? isDark
              ? `linear-gradient(135deg, rgba(255,45,85,.10), rgba(139,92,246,.06))`
              : '#f0f0ff'
            : isHovered
              ? isDark
                ? 'rgba(255,255,255,.05)'
                : '#f5f5f7'
              : 'transparent',
          color: isActive
            ? isDark ? C.text : C.accent
            : isHovered
              ? isDark ? C.text : '#1d1d1f'
              : isDark ? C.sub : '#86868b',
          fontSize: 13.5,
          fontWeight: isActive ? 600 : 450,
          cursor: 'pointer',
          textAlign: 'left',
          marginBottom: 1,
          fontFamily: 'inherit',
          justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'all .2s cubic-bezier(.4,0,.2,1)',
          letterSpacing: isActive ? '-.01em' : '0',
          transform: isHovered && !isActive ? 'translateX(2px)' : 'translateX(0)',
          overflow: 'visible',
        }}
      >
        {/* Active indicator bar */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              left: collapsed ? '50%' : -1,
              ...(collapsed
                ? {
                    bottom: -1,
                    width: 20,
                    height: 3,
                    transform: 'translateX(-50%)',
                    borderRadius: '3px 3px 0 0',
                  }
                : {
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 22,
                    borderRadius: '0 4px 4px 0',
                  }),
              background: isDark
                ? `linear-gradient(${collapsed ? '90deg' : '180deg'}, ${C.accent}, ${C.pink})`
                : C.accent,
              transition: 'all .25s cubic-bezier(.4,0,.2,1)',
              borderRadius: isDark ? undefined : 4,
              boxShadow: isDark ? `0 0 8px ${C.accent}44` : 'none',
            }}
          />
        )}

        {/* Icon container */}
        <span
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            borderRadius: 8,
            background: isActive
              ? isDark
                ? 'rgba(255,255,255,.06)'
                : 'transparent'
              : 'transparent',
            transition: 'all .2s cubic-bezier(.4,0,.2,1)',
            transform: isActive ? 'scale(1.02)' : isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {icons[id]?.(iconColor, iconAccent) ?? null}
        </span>

        {!collapsed && (
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transition: 'color .15s ease',
            }}
          >
            {label}
          </span>
        )}

        {/* Active dot for collapsed state */}
        {isActive && collapsed && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: C.accent,
              boxShadow: `0 0 6px ${C.accent}88`,
            }}
          />
        )}
      </button>
    );

    return (
      <Tooltip key={id} label={label} show={showTooltip}>
        {btn}
      </Tooltip>
    );
  };

  /* ── Section label renderer ─────────────────────────── */
  const renderSectionLabel = (label: string) => {
    if (collapsed) return null;
    return (
      <div
        style={{
          padding: '16px 14px 6px',
          fontSize: isDark ? 10.5 : 11,
          fontWeight: 600,
          color: isDark ? C.dim : '#aeaeb2',
          textTransform: 'uppercase',
          letterSpacing: isDark ? '.1em' : '1.5px',
          userSelect: 'none',
        }}
      >
        {label}
      </div>
    );
  };

  /* ── Section divider for collapsed mode ─────────────── */
  const renderCollapsedDivider = () => (
    <div
      style={{
        height: 1,
        background: isDark
          ? `linear-gradient(90deg, transparent, ${C.border}, transparent)`
          : '#e5e5ea',
        margin: '6px 10px',
      }}
    />
  );

  /* ── Filter visible groups ──────────────────────────── */
  const NAV_GROUPS = getNavGroups(t);
  const visibleGroups = NAV_GROUPS.map((group) => {
    const filteredItems = group.items.filter((item) => {
      if (item.id === 'admin' && role !== 'ADMIN') return false;
      if (item.id === 'analytics' && plan !== 'PRO' && plan !== 'STUDIO') return false;
      return true;
    });
    if (group.condition && !group.condition(plan, role)) return null;
    if (filteredItems.length === 0) return null;
    return { ...group, items: filteredItems };
  }).filter(Boolean) as NavGroup[];

  return (
    <nav
      aria-label="Main navigation"
      style={{
        width: W,
        height: '100%',
        borderRight: isDark ? `1px solid rgba(255,255,255,.06)` : `1px solid #e5e5ea`,
        background: isDark
          ? `linear-gradient(180deg, rgba(14,14,22,.98) 0%, rgba(8,8,14,.99) 100%)`
          : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        transition: 'width .3s cubic-bezier(.4,0,.2,1)',
        position: 'relative',
        backdropFilter: isDark ? 'blur(20px)' : undefined,
      }}
    >
      {/* ── Top gradient accent line (dark mode only) ──────── */}
      {isDark && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${C.accent}, ${C.pink}, ${C.purple}, ${C.blue})`,
            opacity: 0.7,
          }}
        />
      )}

      {/* ── Subtle background noise/pattern (dark mode only) ── */}
      {isDark && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 20% 0%, rgba(255,45,85,.03) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(139,92,246,.03) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ── Header / Brand ───────────────────────────────── */}
      <div
        style={{
          padding: collapsed ? '20px 0 12px' : '20px 18px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          justifyContent: collapsed ? 'center' : 'space-between',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
          }}
          onClick={() => navigate('dashboard')}
        >
          {/* Logo mark */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
              color: '#fff',
              flexShrink: 0,
              boxShadow: `0 4px 12px ${C.accent}33, 0 0 0 1px rgba(255,255,255,.1) inset`,
              letterSpacing: '-.02em',
              transition: 'transform .2s ease, box-shadow .2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 6px 20px ${C.accent}44, 0 0 0 1px rgba(255,255,255,.15) inset`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${C.accent}33, 0 0 0 1px rgba(255,255,255,.1) inset`;
            }}
          >
            TF
          </div>
          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 17,
                  letterSpacing: '-.04em',
                  color: C.text,
                  lineHeight: 1.2,
                }}
              >
                TubeForge
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: C.dim,
                  letterSpacing: '.04em',
                }}
              >
                Creator Studio
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            title={t('sidebar.collapse')}
            aria-label={t('sidebar.collapseLabel')}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.08)' : '#f5f5f7';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.03)' : 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: 'none',
              background: isDark ? 'rgba(255,255,255,.03)' : 'transparent',
              color: isDark ? C.dim : '#86868b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all .2s ease',
              flexShrink: 0,
            }}
          >
            {icons.collapse(isDark ? C.dim : '#86868b')}
          </button>
        )}
      </div>

      {/* ── Collapsed expand button ──────────────────────── */}
      {collapsed && (
        <div style={{ padding: '0 0 4px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setCollapsed(false)}
            title={t('sidebar.expand')}
            aria-label={t('sidebar.expandLabel')}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.08)' : '#f5f5f7';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.03)' : 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: 'none',
              background: isDark ? 'rgba(255,255,255,.03)' : 'transparent',
              color: isDark ? C.dim : '#86868b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all .2s ease',
            }}
          >
            {icons.expand(isDark ? C.dim : '#86868b')}
          </button>
        </div>
      )}

      {/* ── Quick search trigger (expanded only) ─────────── */}
      {!collapsed && (
        <div style={{ padding: '4px 14px 8px', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 10,
              background: isDark ? 'rgba(255,255,255,.03)' : '#f5f5f7',
              border: `1px solid ${isDark ? 'rgba(255,255,255,.05)' : '#e5e5ea'}`,
              cursor: 'pointer',
              transition: 'all .2s ease',
            }}
            onClick={() => {
              // Use custom event to reliably open TopBar search
              window.dispatchEvent(new CustomEvent('tubeforge:open-search'));
            }}
            role="button"
            tabIndex={0}
            aria-label={t('sidebar.searchLabel')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('tubeforge:open-search'));
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.06)' : '#ececee';
              e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,.1)' : '#d1d1d6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.03)' : '#f5f5f7';
              e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,.05)' : '#e5e5ea';
            }}
          >
            {icons.search(C.dim)}
            <span
              style={{
                fontSize: 12.5,
                color: C.dim,
                flex: 1,
                userSelect: 'none',
              }}
            >
              {t('sidebar.search')}
            </span>
            <kbd
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: C.dim,
                padding: '2px 6px',
                borderRadius: 5,
                background: isDark ? 'rgba(255,255,255,.05)' : '#ececee',
                border: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : '#d1d1d6'}`,
                fontFamily: 'inherit',
                lineHeight: 1.2,
              }}
            >
              /
            </kbd>
          </div>
        </div>
      )}

      {/* ── Navigation Groups ────────────────────────────── */}
      <div
        className="tf-sidebar-nav"
        style={{
          flex: 1,
          minHeight: 0,
          padding: collapsed ? '4px 8px' : '0 10px',
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          zIndex: 1,
          scrollbarWidth: 'thin',
          scrollbarColor: `${isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)'} transparent`,
        }}
      >
        {visibleGroups.map((group, gIndex) => (
          <div key={group.label}>
            {/* Group separator */}
            {gIndex > 0 && (collapsed ? renderCollapsedDivider() : null)}

            {/* Group label */}
            {renderSectionLabel(group.label)}

            {/* Group items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {group.items.map((item) => renderNavBtn(item))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Usage Progress Widget (expanded only) ─────────── */}
      {!collapsed && (
        <SidebarUsageWidget C={C} isDark={isDark} t={t} navigate={navigate} />
      )}

      {/* Collapsed upgrade hint */}
      {plan === 'FREE' && collapsed && (
        <Tooltip label={t('sidebar.upgrade')} show={hoveredId === '_upgrade'}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '0 0 8px',
            }}
          >
            <button
              onClick={() => navigate('billing')}
              onMouseEnter={() => handleMouseEnter('_upgrade')}
              onMouseLeave={handleMouseLeave}
              aria-label={t('sidebar.upgradePlan')}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: 'none',
                background: `linear-gradient(135deg, ${C.accent}22, ${C.pink}22)`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all .2s ease',
              }}
            >
              {icons.sparkle(C.accent)}
            </button>
          </div>
        </Tooltip>
      )}

      {/* ── Divider above user panel ─────────────────────── */}
      <div
        style={{
          height: 1,
          background: isDark
            ? `linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent)`
            : '#e5e5ea',
          margin: collapsed ? '0 10px' : '0 14px',
        }}
      />

      {/* ── User Panel ───────────────────────────────────── */}
      <div
        style={{
          padding: collapsed ? '14px 8px' : '14px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexDirection: collapsed ? 'column' : 'row',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Avatar with status ring */}
        <div
          style={{
            position: 'relative',
            cursor: 'pointer',
          }}
          onClick={() => collapsed && setUserMenuOpen(!userMenuOpen)}
        >
          {/* Outer ring */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              padding: 2,
              background:
                plan === 'STUDIO'
                  ? `linear-gradient(135deg, ${C.purple}, ${C.blue})`
                  : plan === 'PRO'
                    ? `linear-gradient(135deg, ${C.accent}, ${C.pink})`
                    : `linear-gradient(135deg, ${isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)'}, ${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)'})`,
              flexShrink: 0,
              transition: 'all .2s ease',
            }}
          >
            {/* Inner avatar */}
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 10,
                background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '-.01em',
                boxShadow: isDark ? undefined : '0 2px 8px rgba(0,0,0,.1)',
              }}
            >
              {initials}
            </div>
          </div>

          {/* Online status dot */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: C.green,
              border: `2.5px solid ${isDark ? 'rgba(14,14,22,.98)' : C.surface}`,
              boxShadow: `0 0 6px ${C.green}66`,
            }}
          />
        </div>

        {/* User info (expanded only) */}
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: C.text,
                maxWidth: 130,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-.01em',
                lineHeight: 1.3,
              }}
            >
              {userName}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 3,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: planBadgeColor,
                  padding: '2px 7px',
                  borderRadius: 5,
                  background: planBadgeBg,
                  letterSpacing: '.02em',
                  lineHeight: 1.3,
                  ...(plan !== 'FREE'
                    ? {
                        boxShadow:
                          plan === 'STUDIO'
                            ? `0 2px 6px ${C.purple}33`
                            : `0 2px 6px ${C.accent}33`,
                      }
                    : {}),
                }}
              >
                {planLabel}
              </span>
            </div>
          </div>
        )}

        {/* Settings + Logout actions */}
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Settings gear */}
            <button
              onClick={() => navigate('settings')}
              title={t('sidebar.settingsLabel')}
              aria-label={t('sidebar.settingsLabel')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark
                  ? 'rgba(255,255,255,.08)'
                  : '#f5f5f7';
                e.currentTarget.style.transform = 'rotate(30deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: C.dim,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all .3s cubic-bezier(.4,0,.2,1)',
                flexShrink: 0,
              }}
            >
              {icons.gear(C.dim)}
            </button>

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              title={t('sidebar.logout')}
              aria-label={t('sidebar.logoutLabel')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark
                  ? 'rgba(255,45,85,.12)'
                  : '#fff0f1';
                e.currentTarget.style.color = C.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = isDark ? C.dim : '#86868b';
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: C.dim,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all .2s ease',
              }}
            >
              {icons.logout(C.dim)}
            </button>
          </div>
        )}

        {/* Collapsed user actions */}
        {collapsed && (
          <Tooltip label={t('sidebar.logout')} show={hoveredId === '_logout'}>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              onMouseEnter={() => handleMouseEnter('_logout')}
              onMouseLeave={handleMouseLeave}
              aria-label={t('sidebar.logoutLabel')}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: C.dim,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all .2s ease',
              }}
            >
              {icons.logout(C.dim)}
            </button>
          </Tooltip>
        )}
      </div>
    </nav>
  );
});
