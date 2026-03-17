'use client';
import { useState, useEffect, memo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { NAV } from '@/lib/constants';
import { useThemeStore } from '@/stores/useThemeStore';

const COLLAPSE_PAGES = ['thumbnails'];

export const Sidebar = memo(function Sidebar() {
  const C = useThemeStore((s) => s.theme);
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

  useEffect(() => {
    localStorage.setItem('tf-sidebar', collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('tf-sidebar') === null) {
      setCollapsed(shouldAutoCollapse);
    }
  }, [shouldAutoCollapse]);

  const userName = session?.user?.name ?? 'Пользователь';
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const plan = session?.user?.plan ?? 'FREE';
  const planLabel = ({ FREE: 'Бесплатный', PRO: 'Pro', STUDIO: 'Studio' } as Record<string, string>)[plan] ?? plan;
  const role = session?.user?.role ?? 'USER';

  const W = collapsed ? 60 : 200;

  const navBtnStyle = (id: string): React.CSSProperties => ({
    width: '100%', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
    padding: collapsed ? '10px 0' : '9px 12px', borderRadius: 10, border: 'none',
    background: current === id ? C.accentDim : 'transparent',
    color: current === id ? C.accent : C.sub,
    fontSize: 14, fontWeight: current === id ? 600 : 400,
    cursor: 'pointer', textAlign: 'left', marginBottom: 2, fontFamily: 'inherit',
    justifyContent: collapsed ? 'center' : 'flex-start', transition: 'all .15s ease',
  });

  return (
    <nav aria-label="Main navigation" style={{ width: W, borderRight: `1px solid ${C.border}`, background: C.surface, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden', transition: 'width .2s ease' }}>
      {/* Header */}
      <div style={{ padding: collapsed ? '14px 0 18px' : '14px 14px 18px', display: 'flex', alignItems: 'center', gap: 8, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${C.accent},${C.pink})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>Y</div>
        {!collapsed && <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-.02em' }}>TubeForge</span>}
      </div>

      {/* Collapse toggle */}
      <div style={{ padding: collapsed ? '0 8px 6px' : '0 12px 6px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Развернуть' : 'Свернуть'}
          aria-label={collapsed ? 'Развернуть боковую панель' : 'Свернуть боковую панель'}
          style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.dim, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s ease' }}
        >
          {collapsed ? '▸' : '◂'}
        </button>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, padding: collapsed ? '0 6px' : '0 8px' }}>
        {NAV.map((n) => (
          <button key={n.id} aria-current={current === n.id ? 'page' : undefined} onClick={() => router.push(`/${n.id}`)} title={collapsed ? n.label : undefined} style={navBtnStyle(n.id)}>
            <span style={{ fontSize: 16, width: collapsed ? 'auto' : 20, textAlign: 'center', flexShrink: 0 }}>{n.icon}</span>
            {!collapsed && n.label}
          </button>
        ))}
        {plan === 'STUDIO' && (
          <button aria-current={current === 'team' ? 'page' : undefined} onClick={() => router.push('/team')} title={collapsed ? 'Команда' : undefined} style={navBtnStyle('team')}>
            <span style={{ fontSize: 16, width: collapsed ? 'auto' : 20, textAlign: 'center', flexShrink: 0 }}>&#128101;</span>
            {!collapsed && 'Команда'}
          </button>
        )}
        <div style={{ height: 1, background: C.border, margin: '8px 2px' }} />
        <button aria-current={current === 'settings' ? 'page' : undefined} onClick={() => router.push('/settings')} title={collapsed ? 'Настройки' : undefined} style={navBtnStyle('settings')}>
          <span style={{ fontSize: 16, width: collapsed ? 'auto' : 20, textAlign: 'center', flexShrink: 0 }}>&#9881;</span>
          {!collapsed && 'Настройки'}
        </button>
        {role === 'ADMIN' && (
          <button aria-current={current === 'admin' ? 'page' : undefined} onClick={() => router.push('/admin')} title={collapsed ? 'Админка' : undefined} style={navBtnStyle('admin')}>
            <span style={{ fontSize: 16, width: collapsed ? 'auto' : 20, textAlign: 'center', flexShrink: 0 }}>&#9878;</span>
            {!collapsed && 'Админка'}
          </button>
        )}
      </div>

      {/* User panel */}
      <div style={{ padding: collapsed ? '10px 6px' : '10px 12px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, justifyContent: collapsed ? 'center' : 'flex-start', flexDirection: collapsed ? 'column' : 'row' }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${C.blue},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
        {!collapsed && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
            <div style={{ fontSize: 10, color: C.dim }}>{planLabel} план</div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          title="Выйти"
          aria-label="Выйти из аккаунта"
          style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.dim, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s ease' }}
        >
          ⏻
        </button>
      </div>
    </nav>
  );
});
