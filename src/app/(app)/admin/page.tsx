'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui';
import { toast } from '@/stores/useNotificationStore';

export default function AdminPage() {
  const C = useThemeStore((s) => s.theme);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'FREE' | 'PRO' | 'STUDIO' | undefined>();

  const profile = trpc.user.getProfile.useQuery();
  const stats = trpc.admin.getStats.useQuery(undefined, {
    enabled: profile.data?.role === 'ADMIN',
  });
  const users = trpc.admin.listUsers.useQuery(
    { page, limit: 20, search: search || undefined, planFilter },
    { enabled: profile.data?.role === 'ADMIN' }
  );
  const updateUser = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success('Пользователь обновлён');
      users.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (profile.isLoading) {
    return (
      <div>
        <Skeleton width="200px" height="28px" />
        <div style={{ marginTop: 12 }}><Skeleton width="300px" height="16px" /></div>
        <div style={{ display: 'flex', gap: 16, marginTop: 28 }}>
          {[1, 2, 3].map((i) => <div key={i} style={{ flex: 1 }}><Skeleton width="100%" height="110px" rounded /></div>)}
        </div>
        <div style={{ marginTop: 28 }}><Skeleton width="100%" height="300px" rounded /></div>
      </div>
    );
  }

  if (profile.data?.role !== 'ADMIN') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Доступ запрещён</h2>
        <p style={{ color: C.sub, fontSize: 14 }}>У вас нет прав администратора</p>
      </div>
    );
  }

  const statsCards = [
    { label: 'Пользователей', value: stats.data?.totalUsers ?? '—', color: C.blue },
    { label: 'Подписки', value: stats.data?.activeSubscriptions ?? '—', color: C.green },
    { label: 'ИИ-генераций', value: stats.data?.totalAIUsage ?? '—', color: C.purple },
  ];

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600,
    color: C.sub, textTransform: 'uppercase', letterSpacing: '.04em',
    borderBottom: `1px solid ${C.border}`,
  };
  const tdStyle: React.CSSProperties = {
    padding: '14px 16px', fontSize: 14, borderBottom: `1px solid ${C.border}`,
  };

  const planBg = (plan: string) =>
    plan === 'PRO' ? C.accentDim : plan === 'STUDIO' ? `${C.purple}18` : `${C.blue}18`;
  const planColor = (plan: string) =>
    plan === 'PRO' ? C.accent : plan === 'STUDIO' ? C.purple : C.blue;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Панель администратора</h1>
        <p style={{ color: C.sub, fontSize: 14 }}>Обзор платформы и управление пользователями</p>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
        {statsCards.map((stat) => (
          <div key={stat.label} style={{ flex: '1 1 220px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 500, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}>{stat.label}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: stat.color }}>{stats.isLoading ? '...' : stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Пользователи</h2>
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по имени или email..."
            aria-label="Поиск пользователей"
            style={{ marginLeft: 'auto', padding: '6px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: 'inherit', width: 220, outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 4 }} role="group" aria-label="Фильтр по плану">
            {(['ALL', 'FREE', 'PRO', 'STUDIO'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setPlanFilter(f === 'ALL' ? undefined : f as 'FREE' | 'PRO' | 'STUDIO'); setPage(1); }}
                aria-pressed={(f === 'ALL' && !planFilter) || planFilter === f}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  background: (f === 'ALL' && !planFilter) || planFilter === f ? C.accentDim : C.surface,
                  color: (f === 'ALL' && !planFilter) || planFilter === f ? C.accent : C.sub,
                }}
              >{f === 'ALL' ? 'Все' : f}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Имя</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>План</th>
                <th style={thStyle}>Роль</th>
                <th style={thStyle}>Проекты</th>
                <th style={thStyle}>Дата</th>
              </tr>
            </thead>
            <tbody>
              {users.isLoading ? (
                <tr><td colSpan={6} style={{ padding: 20 }}><Skeleton width="100%" height="200px" /></td></tr>
              ) : !users.data?.users.length ? (
                <tr><td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: C.sub, fontSize: 14 }}>
                  {search || planFilter ? 'Пользователи не найдены. Попробуйте изменить фильтры.' : 'Нет пользователей'}
                </td></tr>
              ) : users.data?.users.map((user) => (
                <tr key={user.id} className="sc-row" style={{ cursor: 'default' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${C.blue},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {(user.name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 500 }}>{user.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: C.sub }}>{user.email || '—'}</td>
                  <td style={tdStyle}>
                    <select
                      value={user.plan}
                      onChange={(e) => updateUser.mutate({ userId: user.id, plan: e.target.value as 'FREE' | 'PRO' | 'STUDIO' })}
                      aria-label={`Изменить план ${user.name || user.email}`}
                      style={{ padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: planBg(user.plan), color: planColor(user.plan), border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <option value="FREE">FREE</option>
                      <option value="PRO">PRO</option>
                      <option value="STUDIO">STUDIO</option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12, color: user.role === 'ADMIN' ? C.orange : C.sub, fontWeight: user.role === 'ADMIN' ? 600 : 400 }}>
                      {user.role === 'ADMIN' ? 'Админ' : 'Пользователь'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: C.sub }}>{user._count.projects}</td>
                  <td style={{ ...tdStyle, color: C.sub, fontSize: 12 }}>
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.data && users.data.pages > 1 && (
          <nav aria-label="Навигация по страницам" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'center', gap: 6 }}>
            {Array.from({ length: users.data.pages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                aria-label={`Страница ${i + 1}`}
                aria-current={page === i + 1 ? 'page' : undefined}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  background: page === i + 1 ? C.accent : 'transparent',
                  color: page === i + 1 ? '#fff' : C.sub,
                }}
              >{i + 1}</button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
