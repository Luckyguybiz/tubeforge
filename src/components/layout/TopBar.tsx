'use client';
import { memo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NAV } from '@/lib/constants';
import { useThemeStore } from '@/stores/useThemeStore';

/** Extra page labels not in NAV */
const PAGE_LABELS: Record<string, string> = {
  settings: 'Настройки',
  admin: 'Админка',
  team: 'Команда',
};

export const TopBar = memo(function TopBar() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const toggle = useThemeStore((s) => s.toggle);
  const pathname = usePathname();
  const router = useRouter();
  const current = pathname.split('/').filter(Boolean)[0] || 'dashboard';
  const isEditor = current === 'editor';

  const pageLabel = NAV.find((n) => n.id === current)?.label ?? PAGE_LABELS[current] ?? '';

  return (
    <div style={{ height: 44, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, background: C.surface, flexShrink: 0 }}>
      {isEditor && (
        <button title="Вернуться на дашборд" onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          ← Назад
        </button>
      )}
      {isEditor && <div style={{ height: 16, width: 1, background: C.border }} />}
      {isEditor && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: `linear-gradient(135deg,${C.accent},${C.pink})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>Y</div>
          <span style={{ fontWeight: 700, fontSize: 12 }}>Студия</span>
        </div>
      )}
      {!isEditor && pageLabel && (
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
          {pageLabel}
        </span>
      )}
      <div style={{ flex: 1 }} />
      <button title="Переключить тему" aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'} onClick={toggle} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isDark ? '☀️' : '🌙'}
      </button>
    </div>
  );
});
