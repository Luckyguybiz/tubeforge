'use client';
import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { Z_INDEX } from '@/lib/constants';

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
  'ai-thumbnails': (c, a) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <defs>
        <linearGradient id="aithumbs-g" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor={a ?? c} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <rect x="2" y="3" width="16" height="11" rx="2.5" fill={a ? 'url(#aithumbs-g)' : c} opacity=".25" />
      <rect x="3" y="4" width="14" height="9" rx="1.5" fill={c} opacity=".85" />
      <path d="M10 6.5L11.2 9.3L14 9.8L12 11.6L12.4 14.5L10 13.1L7.6 14.5L8 11.6L6 9.8L8.8 9.3L10 6.5Z" fill={c} opacity=".4" />
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
      label: t('sidebar.create'),
      items: [
        { id: 'ai-thumbnails', label: t('nav.aiThumbnails') },
        { id: 'dashboard', label: t('nav.dashboard') },
        { id: 'editor', label: t('nav.editor') },
        { id: 'preview', label: t('nav.publish') },
      ],
    },
    {
      label: t('sidebar.tools'),
      items: [
        { id: 'tools', label: t('nav.tools') },
        { id: 'thumbnails', label: t('nav.designStudio') },
        { id: 'analytics', label: t('nav.analytics') },
      ],
    },
    {
      label: t('sidebar.account'),
      items: [
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
  'ai-thumbnails': ['accent', 'purple'],
  thumbnails: ['orange', 'pink'],
  preview: ['green', 'cyan'],
  team: ['purple', 'pink'],
  settings: ['sub', 'dim'],
  billing: ['green', 'cyan'],
  referral: ['green', 'cyan'],
  admin: ['accent', 'orange'],
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
  const TC = useThemeStore((s) => s.theme);
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
          boxShadow: `0 4px 16px rgba(0,0,0,.3), 0 0 0 1px ${TC.border}`,
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
            borderLeft: `1px solid ${TC.border}`,
            borderBottom: `1px solid ${TC.border}`,
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
        height: 3,
        borderRadius: 2,
        background: C.border,
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
      ? C.purple
      : plan === 'PRO'
        ? C.accent
        : C.border;
  const planColor = plan === 'FREE' ? C.dim : '#fff';

  return (
    <div style={{
      margin: '0 12px 8px',
      padding: 14,
      borderRadius: 12,
      background: C.surface,
      border: `1px solid ${C.border}`,
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
            background: C.accent,
            color: C.text,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'opacity .15s ease',
            letterSpacing: '-.01em',
          }}
        >
          {t('sidebar.upgradePlan')}
        </button>
      )}
    </div>
  );
}

/* ── Profile Dropdown ─────────────────────────────────────────────── */

function ProfileDropdown({
  C,
  isDark,
  userName,
  userEmail,
  userId,
  plan,
  planLabel,
  planBadgeBg,
  planBadgeColor,
  collapsed,
  navigate,
  t,
  onClose,
}: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  isDark: boolean;
  userName: string;
  userEmail: string;
  userId: string;
  plan: string;
  planLabel: string;
  planBadgeBg: string;
  planBadgeColor: string;
  collapsed: boolean;
  navigate: (path: string) => void;
  t: (key: string) => string;
  onClose: () => void;
}) {
  const { remainingAI } = usePlanLimits();

  const menuItemStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 14px',
    border: 'none',
    background: 'transparent',
    color: C.text,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textAlign: 'left',
    borderRadius: 6,
    transition: 'background .12s ease',
    letterSpacing: '-.01em',
  };

  const handleItemHover = (e: React.MouseEvent<HTMLButtonElement>, entering: boolean) => {
    e.currentTarget.style.background = entering ? C.surface : 'transparent';
  };

  const handleClick = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: collapsed ? '50%' : 10,
        transform: collapsed ? 'translateX(-50%)' : 'none',
        marginBottom: 8,
        width: 220,
        background: isDark ? C.card : C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        boxShadow: isDark
          ? '0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04)'
          : '0 8px 32px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06)',
        zIndex: Z_INDEX.DROPDOWN,
        overflow: 'hidden',
        animation: 'none',
      }}
    >
      {/* User name + email */}
      <div style={{ padding: '14px 14px 10px' }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: C.text,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.3,
        }}>
          {userName}
        </div>
        {userEmail && (
          <div style={{
            fontSize: 11,
            color: C.sub,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: 2,
            lineHeight: 1.3,
          }}>
            {userEmail}
          </div>
        )}
        {/* Plan badge */}
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: planBadgeColor,
            padding: '2px 8px',
            borderRadius: 5,
            background: planBadgeBg,
            letterSpacing: '.02em',
          }}>
            {planLabel}
          </span>
        </div>
        {/* Credits remaining */}
        <div style={{
          marginTop: 8,
          fontSize: 11.5,
          fontWeight: 500,
          color: C.sub,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}>
          <span style={{ fontSize: 13 }}>{'\u26A1'}</span>
          {isFinite(remainingAI) ? `${remainingAI} ${t('sidebar.creditsRemaining')}` : `\u221E ${t('sidebar.creditsRemaining')}`}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: C.border, margin: '0 10px' }} />

      {/* Menu items */}
      <div style={{ padding: '6px 6px' }}>
        <button
          onClick={() => handleClick('settings')}
          onMouseEnter={(e) => handleItemHover(e, true)}
          onMouseLeave={(e) => handleItemHover(e, false)}
          style={menuItemStyle}
        >
          {icons.settings(C.sub)}
          {t('sidebar.manageAccount')}
        </button>

        <button
          onClick={() => handleClick(`profile/${userId}`)}
          onMouseEnter={(e) => handleItemHover(e, true)}
          onMouseLeave={(e) => handleItemHover(e, false)}
          style={menuItemStyle}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="7" r="3.5" stroke={C.sub} strokeWidth="1.5" opacity=".85" />
            <path d="M4 17C4 13.5 6.5 11 10 11C13.5 11 16 13.5 16 17" stroke={C.sub} strokeWidth="1.5" strokeLinecap="round" opacity=".7" />
          </svg>
          {t('sidebar.viewProfile')}
        </button>

        {plan === 'FREE' && (
          <button
            onClick={() => handleClick('billing')}
            onMouseEnter={(e) => handleItemHover(e, true)}
            onMouseLeave={(e) => handleItemHover(e, false)}
            style={{ ...menuItemStyle, color: C.accent, fontWeight: 600 }}
          >
            {icons.sparkle(C.accent)}
            {t('sidebar.upgradeToPro')}
          </button>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: C.border, margin: '0 10px' }} />

      {/* Sign out */}
      <div style={{ padding: '6px 6px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
            signOut({ callbackUrl: '/' });
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
            e.currentTarget.style.color = C.red;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = C.sub;
          }}
          style={{ ...menuItemStyle, color: C.sub }}
        >
          {icons.logout(C.red)}
          {t('sidebar.signOut')}
        </button>
      </div>
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
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  // Close profile dropdown on Escape
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [userMenuOpen]);

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

  const W = collapsed ? 64 : 220;

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
      ? C.purple
      : plan === 'PRO'
        ? C.accent
        : C.border;
  const planBadgeColor = plan === 'FREE' ? C.dim : '#fff';

  /* ── Nav button renderer ────────────────────────────── */
  const renderNavBtn = (item: NavItemDef) => {
    const { id, label } = item;
    const isActive = current === id;
    const isHovered = hoveredId === id;
    const showTooltip = collapsed && tooltipId === id;

    const iconColor = isActive
      ? '#6366f1'
      : isHovered
        ? C.sub
        : C.sub;

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
          height: 40,
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 10,
          padding: collapsed ? '0' : '0 12px',
          borderRadius: 10,
          border: 'none',
          background: isActive
            ? 'rgba(99,102,241,0.08)'
            : isHovered
              ? C.surface
              : 'transparent',
          color: isActive
            ? '#6366f1'
            : isHovered
              ? C.sub
              : C.sub,
          fontSize: 13.5,
          fontWeight: isActive ? 600 : 450,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'all .15s ease',
          letterSpacing: isActive ? '-.01em' : '0',
          overflow: 'visible',
        }}
      >
        {/* Active indicator bar */}
        {isActive && !collapsed && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 3,
              height: 20,
              borderRadius: 2,
              background: '#6366f1',
              transition: 'all .2s ease',
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
            background: 'transparent',
            transition: 'all .15s ease',
          }}
        >
          {icons[id]?.(iconColor) ?? null}
        </span>

        {!collapsed && (
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transition: 'color .15s ease',
              flex: 1,
            }}
          >
            {label}
          </span>
        )}

        {/* NEW badge for AI Thumbnails */}
        {id === 'ai-thumbnails' && !collapsed && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#6366f1',
              background: 'rgba(99,102,241,0.12)',
              padding: '2px 6px',
              borderRadius: 4,
              letterSpacing: 0.5,
              marginLeft: 'auto',
            }}
          >
            NEW
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
              background: '#6366f1',
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
          padding: '20px 12px 6px',
          fontSize: 10,
          fontWeight: 600,
          color: C.dim,
          textTransform: 'uppercase',
          letterSpacing: '2px',
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
        background: C.border,
        margin: '6px 10px',
      }}
    />
  );

  /* ── Filter visible groups ──────────────────────────── */
  const NAV_GROUPS = getNavGroups(t);
  const visibleGroups = NAV_GROUPS.map((group) => {
    const filteredItems = group.items.filter((item) => {
      if (item.id === 'admin' && role !== 'ADMIN') return false;
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
        borderRight: `1px solid ${C.border}`,
        background: C.bg,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        transition: 'width .3s cubic-bezier(.4,0,.2,1)',
        position: 'relative',
      }}
    >

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
              background: C.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
              color: C.text,
              flexShrink: 0,
              letterSpacing: '-.02em',
              transition: 'opacity .2s ease',
            }}
          >
            TF
          </div>
          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 17,
                  letterSpacing: '-.03em',
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
              e.currentTarget.style.background = C.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
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
              transition: 'all .2s ease',
              flexShrink: 0,
            }}
          >
            {icons.collapse(C.dim)}
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
              e.currentTarget.style.background = C.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
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
              transition: 'all .2s ease',
            }}
          >
            {icons.expand(C.dim)}
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
              background: C.surface,
              border: `1px solid ${C.border}`,
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
              e.currentTarget.style.background = C.border;
              e.currentTarget.style.borderColor = C.borderActive;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.surface;
              e.currentTarget.style.borderColor = C.border;
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
                background: C.surface,
                border: `1px solid ${C.border}`,
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
          scrollbarColor: `${C.border} transparent`,
        }}
      >
        {visibleGroups.map((group, gIndex) => (
          <div key={group.label}>
            {/* Group separator */}
            {gIndex > 0 && (collapsed ? renderCollapsedDivider() : null)}

            {/* Group label */}
            {renderSectionLabel(group.label)}

            {/* Group items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                background: C.accentDim,
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
          background: C.border,
          margin: collapsed ? '0 10px' : '0 14px',
        }}
      />

      {/* ── User Panel with Profile Dropdown ─────────────── */}
      <div
        ref={userMenuRef}
        style={{
          padding: collapsed ? '14px 8px' : '14px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexDirection: collapsed ? 'column' : 'row',
          position: 'relative',
          zIndex: Z_INDEX.DROPDOWN,
          cursor: 'pointer',
        }}
        onClick={() => setUserMenuOpen((v) => !v)}
      >
        {/* Avatar with status ring */}
        <div style={{ position: 'relative' }}>
          {/* Avatar */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: C.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: C.text,
              letterSpacing: '-.01em',
              flexShrink: 0,
            }}
          >
            {initials}
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
              border: `2px solid ${C.bg}`,
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
                }}
              >
                {planLabel}
              </span>
            </div>
          </div>
        )}

        {/* Chevron indicator (expanded only) */}
        {!collapsed && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            style={{
              flexShrink: 0,
              transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform .2s ease',
            }}
          >
            <path d="M3.5 5.5L7 9L10.5 5.5" stroke={C.dim} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}

        {/* ── Profile Dropdown ───────────────────────────── */}
        {userMenuOpen && (
          <ProfileDropdown
            C={C}
            isDark={isDark}
            userName={userName}
            userEmail={session?.user?.email ?? ''}
            userId={session?.user?.id ?? ''}
            plan={plan}
            planLabel={planLabel}
            planBadgeBg={planBadgeBg}
            planBadgeColor={planBadgeColor}
            collapsed={collapsed}
            navigate={navigate}
            t={t}
            onClose={() => setUserMenuOpen(false)}
          />
        )}
      </div>
    </nav>
  );
});
