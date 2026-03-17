'use client';
import { useState, useEffect, useCallback, memo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { NAV } from '@/lib/constants';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ── Nav grouping ────────────────────────────────────────────── */

interface NavItemDef {
  id: string;
  icon: string | React.ReactNode;
  labelKey: string;
}

interface NavGroup {
  labelKey: string;
  items: NavItemDef[];
}

const BillingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <rect x="2" y="4" width="16" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 8H18" stroke="currentColor" strokeWidth="1.5" />
    <rect x="4" y="11" width="5" height="2" rx="1" fill="currentColor" opacity=".5" />
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const COLLAPSE_PAGES = ['thumbnails'];

const NAV_CREATION: NavItemDef[] = NAV.map((n) => ({
  id: n.id,
  icon: n.icon,
  labelKey: `nav.${n.id}`,
}));

const buildNavGroups = (plan: string, role: string): NavGroup[] => {
  const groups: NavGroup[] = [
    { labelKey: 'sidebar.creation', items: NAV_CREATION },
  ];

  const systemItems: NavItemDef[] = [
    { id: 'settings', icon: '⚙', labelKey: 'nav.settings' },
    { id: 'billing', icon: 'billing-svg', labelKey: 'nav.billing' },
  ];

  if (plan === 'STUDIO') {
    systemItems.splice(0, 0, { id: 'team', icon: '👥', labelKey: 'nav.team' });
  }

  if (role === 'ADMIN') {
    systemItems.push({ id: 'admin', icon: '⚖', labelKey: 'nav.admin' });
  }

  groups.push({ labelKey: 'sidebar.system', items: systemItems });

  return groups;
};

/* ── Component ───────────────────────────────────────────────── */

export const Sidebar = memo(function Sidebar() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const current = pathname.split('/').filter(Boolean)[0] || 'dashboard';

  /* ── Collapse state ──────────────────────────────── */
  const shouldAutoCollapse = COLLAPSE_PAGES.includes(current);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tf-sidebar');
      if (stored !== null) return stored === '1';
    }
    return shouldAutoCollapse;
  });

  useEffect(() => {
    localStorage.setItem('tf-sidebar', collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('tf-sidebar') === null) {
      setCollapsed(shouldAutoCollapse);
    }
  }, [shouldAutoCollapse]);

  /* ── User info ───────────────────────────────────── */
  const userName = session?.user?.name ?? t('common.user');
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const plan = session?.user?.plan ?? 'FREE';
  const planLabel = (
    { FREE: t('common.free'), PRO: t('common.pro'), STUDIO: t('common.studio') } as Record<string, string>
  )[plan] ?? plan;
  const role = session?.user?.role ?? 'USER';

  /* ── Nav groups (memoized) ───────────────────────── */
  const navGroups = buildNavGroups(plan, role);

  /* ── Sizing ──────────────────────────────────────── */
  const W = collapsed ? 64 : 220;

  /* ── Styles ──────────────────────────────────────── */
  const navBtnStyle = useCallback(
    (id: string): React.CSSProperties => ({
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: collapsed ? 0 : 10,
      padding: collapsed ? '9px 0' : '8px 12px',
      borderRadius: 8,
      border: 'none',
      background: current === id ? C.accentDim : 'transparent',
      color: current === id ? C.accent : C.sub,
      fontSize: 13,
      fontWeight: current === id ? 600 : 400,
      cursor: 'pointer',
      textAlign: 'left',
      marginBottom: 1,
      fontFamily: 'inherit',
      justifyContent: collapsed ? 'center' : 'flex-start',
      transition: 'all .15s ease',
    }),
    [collapsed, current, C.accentDim, C.accent, C.sub],
  );

  /* ── Search bar click → open TopBar search ───────── */
  const handleSearchClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent('tubeforge:open-search'));
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      style={{
        width: W,
        borderRight: `1px solid ${C.border}`,
        background: C.surface,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width .2s ease',
      }}
    >
      {/* ── Header ─────────────────────────────────── */}
      <div
        style={{
          padding: collapsed ? '14px 0 10px' : '14px 14px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: `linear-gradient(135deg,${C.accent},${C.pink})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          TF
        </div>
        {!collapsed && (
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
        )}
      </div>

      {/* ── Search bar ──────────────────────────────── */}
      <div style={{ padding: collapsed ? '0 8px 4px' : '0 12px 4px' }}>
        <button
          onClick={handleSearchClick}
          title={t('sidebar.searchLabel')}
          aria-label={t('sidebar.searchLabel')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: collapsed ? '7px 0' : '7px 10px',
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.bg,
            color: C.dim,
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'all .15s ease',
          }}
        >
          <SearchIcon />
          {!collapsed && (
            <>
              <span style={{ flex: 1, textAlign: 'left' }}>{t('sidebar.search')}</span>
              <kbd
                style={{
                  fontSize: 10,
                  color: C.dim,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  padding: '1px 5px',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                }}
              >
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* ── Collapse toggle ─────────────────────────── */}
      <div
        style={{
          padding: collapsed ? '0 8px 6px' : '0 12px 6px',
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-end',
        }}
      >
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          aria-label={collapsed ? t('sidebar.expandLabel') : t('sidebar.collapseLabel')}
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            background: 'transparent',
            color: C.dim,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all .15s ease',
          }}
        >
          {collapsed ? '▸' : '◂'}
        </button>
      </div>

      {/* ── Navigation groups ──────────────────────── */}
      <div
        style={{
          flex: 1,
          padding: collapsed ? '0 6px' : '0 10px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {navGroups.map((group, gi) => (
          <div key={group.labelKey} style={{ marginBottom: 6 }}>
            {/* Group label */}
            {!collapsed && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: C.dim,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  padding: '8px 12px 4px',
                }}
              >
                {t(group.labelKey)}
              </div>
            )}
            {collapsed && gi > 0 && (
              <div
                style={{
                  height: 1,
                  background: C.border,
                  margin: '6px 4px',
                }}
              />
            )}

            {/* Group items */}
            {group.items.map((item) => {
              const label = t(item.labelKey);
              const isBilling = item.icon === 'billing-svg';
              return (
                <button
                  key={item.id}
                  aria-current={current === item.id ? 'page' : undefined}
                  onClick={() => router.push(`/${item.id}`)}
                  title={collapsed ? label : undefined}
                  style={navBtnStyle(item.id)}
                >
                  <span
                    style={{
                      fontSize: 16,
                      width: collapsed ? 'auto' : 20,
                      textAlign: 'center',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isBilling ? <BillingIcon /> : item.icon}
                  </span>
                  {!collapsed && label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Upgrade banner (FREE only) ─────────────── */}
      {plan === 'FREE' && !collapsed && (
        <div
          style={{
            margin: '0 10px 8px',
            padding: '12px 14px',
            borderRadius: 10,
            background: `linear-gradient(135deg, ${C.accent}18, ${C.pink}18)`,
            border: `1px solid ${C.accent}22`,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: C.accent,
              marginBottom: 4,
            }}
          >
            ✦ {t('sidebar.upgrade')}
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.sub,
              lineHeight: 1.4,
              marginBottom: 8,
            }}
          >
            {t('sidebar.upgradeDesc')}
          </div>
          <button
            onClick={() => router.push('/billing')}
            style={{
              width: '100%',
              padding: '7px 0',
              borderRadius: 7,
              border: 'none',
              background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'opacity .15s ease',
            }}
          >
            {t('sidebar.upgradeCta')}
          </button>
        </div>
      )}

      {/* ── User panel ──────────────────────────────── */}
      <div
        style={{
          padding: collapsed ? '10px 6px' : '10px 12px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexDirection: collapsed ? 'column' : 'row',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `linear-gradient(135deg,${C.blue},${C.purple})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: C.text,
              }}
            >
              {userName}
            </div>
            <div style={{ fontSize: 10, color: C.dim }}>
              {planLabel} план
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          title={t('sidebar.logout')}
          aria-label={t('sidebar.logoutLabel')}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            background: 'transparent',
            color: C.dim,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all .15s ease',
          }}
        >
          ⏻
        </button>
      </div>
    </nav>
  );
});
