'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/stores/useNotificationStore';
import type { Theme } from '@/lib/types';

/**
 * Recharts is ~200KB — lazy-load it only when charts are rendered.
 */
let rechartsCache: typeof import('recharts') | null = null;

function useRecharts() {
  const [mod, setMod] = useState(rechartsCache);
  useEffect(() => {
    if (rechartsCache) return;
    let cancelled = false;
    import('recharts').then((m) => {
      rechartsCache = m;
      if (!cancelled) setMod(m);
    });
    return () => { cancelled = true; };
  }, []);
  return mod;
}

/* ── Helpers ─────────────────────────────────────── */

type SortKey = 'createdAt' | 'name' | 'plan' | 'role';
type SortDir = 'asc' | 'desc';

function initials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function relativeTime(date: Date | string, t: (key: string) => string, locale: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t('admin.time.justNow');
  if (mins < 60) return `${mins} ${t('admin.time.minAgo')}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${t('admin.time.hrsAgo')}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${t('admin.time.daysAgo')}`;
  const loc = locale === 'ru' ? 'ru-RU' : locale === 'kk' ? 'kk-KZ' : locale === 'es' ? 'es-ES' : 'en-US';
  return d.toLocaleDateString(loc, { day: 'numeric', month: 'short' });
}

const PLAN_LABELS: Record<string, string> = { FREE: 'Free', PRO: 'Pro', STUDIO: 'Studio' };
function getRoleLabels(t: (key: string) => string): Record<string, string> {
  return { USER: t('admin.role.user'), ADMIN: t('admin.role.admin') };
}
function getStatusLabels(t: (key: string) => string): Record<string, string> {
  return {
    DRAFT: t('admin.status.draft'),
    RENDERING: t('admin.status.rendering'),
    READY: t('admin.status.ready'),
    PUBLISHED: t('admin.status.published'),
  };
}

/* ── Main Page ───────────────────────────────────── */

export function AdminPage() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const locale = useLocaleStore((s) => s.locale);
  const ROLE_LABELS = useMemo(() => getRoleLabels(t), [t]);
  const STATUS_LABELS = useMemo(() => getStatusLabels(t), [t]);
  const recharts = useRecharts();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [planFilter, setPlanFilter] = useState<'FREE' | 'PRO' | 'STUDIO' | undefined>();
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'referrals' | 'analytics'>('users');

  // Debounced search
  const searchTimer = useMemo(() => ({ id: null as ReturnType<typeof setTimeout> | null }), []);
  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchTimer.id) clearTimeout(searchTimer.id);
      searchTimer.id = setTimeout(() => {
        setSearchDebounced(value);
        setPage(1);
      }, 300);
    },
    [searchTimer],
  );

  const profile = trpc.user.getProfile.useQuery();
  const isAdmin = profile.data?.role === 'ADMIN';

  const stats = trpc.admin.getStats.useQuery(undefined, { enabled: isAdmin });
  const activity = trpc.admin.recentActivity.useQuery(undefined, { enabled: isAdmin });
  const users = trpc.admin.listUsers.useQuery(
    { page, limit: 15, search: searchDebounced || undefined, planFilter, sortBy, sortDir },
    { enabled: isAdmin, placeholderData: (prev) => prev },
  );

  const updateUser = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success(t('admin.userUpdated'));
      users.refetch();
      stats.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const referralStats = trpc.admin.referralStats.useQuery(undefined, { enabled: isAdmin && activeTab === 'referrals' });
  const createPayout = trpc.admin.createPayout.useMutation({
    onSuccess: () => {
      toast.success(t('admin.payoutRecorded'));
      referralStats.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Analytics data
  const growthStats = trpc.admin.getGrowthStats.useQuery(undefined, { enabled: isAdmin && activeTab === 'analytics' });
  const revenueStats = trpc.admin.getRevenueStats.useQuery(undefined, { enabled: isAdmin && activeTab === 'analytics' });
  const planDistribution = trpc.admin.getPlanDistribution.useQuery(undefined, { enabled: isAdmin && activeTab === 'analytics' });
  const activeUsers = trpc.admin.getActiveUsers.useQuery(undefined, { enabled: isAdmin && activeTab === 'analytics' });

  /* ── Loading state ─────────────────────────────── */

  if (profile.isLoading) {
    return <LoadingSkeleton C={C} />;
  }

  /* ── Access denied ─────────────────────────────── */

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 480, gap: 8 }}>
        <div
          style={{
            width: 72, height: 72, borderRadius: 20,
            background: `${C.accent}12`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 8,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{t('admin.accessDenied')}</h2>
        <p style={{ color: C.sub, fontSize: 14, maxWidth: 300, textAlign: 'center', lineHeight: 1.5 }}>
          {t('admin.noPermission')}
        </p>
      </div>
    );
  }

  /* ── Sort handler ──────────────────────────────── */

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir(key === 'createdAt' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const sortArrow = (key: SortKey) => {
    if (sortBy !== key) return '';
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  };

  /* ── Stats cards data ──────────────────────────── */

  const statsCards = [
    {
      label: t('admin.stat.users'),
      value: stats.data?.totalUsers,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      color: C.blue,
      sub: stats.data ? `+${stats.data.usersThisWeek} ${t('admin.stat.thisWeek')}` : null,
    },
    {
      label: t('admin.stat.projects'),
      value: stats.data?.totalProjects,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
      color: C.purple,
      sub: stats.data ? `+${stats.data.projectsThisWeek} ${t('admin.stat.thisWeek')}` : null,
    },
    {
      label: t('admin.stat.subscriptions'),
      value: stats.data?.activeSubscriptions,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
      color: C.green,
      sub: stats.data ? `PRO + Studio` : null,
    },
    {
      label: t('admin.stat.videosToday'),
      value: stats.data?.videosToday,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
      color: C.orange,
      sub: `${t('admin.stat.aiGen')} ${stats.data?.totalAIUsage ?? '..'}`,
    },
  ];

  /* ── Styles ────────────────────────────────────── */

  const thBase: React.CSSProperties = {
    textAlign: 'left',
    padding: '12px 14px',
    fontSize: 11,
    fontWeight: 600,
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: '.05em',
    borderBottom: `2px solid ${C.border}`,
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };

  const thSortable: React.CSSProperties = {
    ...thBase,
    cursor: 'pointer',
  };

  const tdBase: React.CSSProperties = {
    padding: '12px 14px',
    fontSize: 13,
    borderBottom: `1px solid ${C.border}`,
    whiteSpace: 'nowrap',
  };

  /* ── Render ────────────────────────────────────── */

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{t('admin.title')}</h1>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
            background: `${C.accent}15`, color: C.accent, letterSpacing: '.03em',
          }}>
            ADMIN
          </span>
        </div>
        <p style={{ color: C.sub, fontSize: 14, margin: 0 }}>
          {t('admin.subtitle')}
        </p>
      </div>

      {/* ── Stats Cards ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: '22px 24px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle gradient accent */}
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 80, height: 80,
              background: `radial-gradient(circle at 100% 0%, ${stat.color}15, transparent 70%)`,
              borderRadius: '0 16px 0 0',
              pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{
                fontSize: 12, color: C.sub, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '.04em',
              }}>
                {stat.label}
              </span>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${stat.color}14`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: stat.color,
              }}>
                {stat.icon}
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>
              {stats.isLoading ? (
                <Skeleton width="60px" height="32px" />
              ) : (
                (stat.value ?? 0).toLocaleString('ru-RU')
              )}
            </div>
            {stat.sub && (
              <div style={{ fontSize: 12, color: C.dim, marginTop: 6, fontWeight: 500 }}>
                {stats.isLoading ? <Skeleton width="100px" height="14px" /> : stat.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Tab Switcher ───────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }} role="tablist">
        {([['users', 'Users'], ['referrals', 'Referrals'], ['analytics', 'Analytics']] as const).map(([key, label]) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: `1px solid ${active ? C.accent : C.border}`,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: active ? C.accentDim : 'transparent',
                color: active ? C.accent : C.sub,
                transition: 'all .15s',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Users Table Section ────────────────────── */}
      {activeTab === 'users' && <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 16, overflow: 'hidden', marginBottom: 32,
      }}>
        {/* Toolbar */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, marginRight: 'auto' }}>
            {t('admin.usersTitle')}
            {users.data && (
              <span style={{ fontWeight: 400, fontSize: 13, color: C.dim, marginLeft: 8 }}>
                {users.data.total}
              </span>
            )}
          </h2>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('admin.searchPlaceholder')}
              aria-label={t('admin.searchLabel')}
              style={{
                padding: '7px 12px 7px 30px',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.text,
                fontSize: 13,
                fontFamily: 'inherit',
                width: 240,
                outline: 'none',
                transition: 'border-color .15s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.borderActive; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            />
          </div>

          {/* Plan Filter */}
          <div style={{ display: 'flex', gap: 3 }} role="group" aria-label={t('admin.filterByPlan')}>
            {(['ALL', 'FREE', 'PRO', 'STUDIO'] as const).map((f) => {
              const active = (f === 'ALL' && !planFilter) || planFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => {
                    setPlanFilter(f === 'ALL' ? undefined : f as 'FREE' | 'PRO' | 'STUDIO');
                    setPage(1);
                  }}
                  aria-pressed={active}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: `1px solid ${active ? C.accent : C.border}`,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: active ? C.accentDim : 'transparent',
                    color: active ? C.accent : C.sub,
                    transition: 'all .15s',
                  }}
                >
                  {f === 'ALL' ? t('admin.filterAll') : f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
            <thead>
              <tr>
                <th style={{ ...thBase, width: 44, padding: '12px 0 12px 16px' }}></th>
                <th style={thSortable} onClick={() => handleSort('name')}>
                  {t('admin.colName')}{sortArrow('name')}
                </th>
                <th style={thBase}>Email</th>
                <th style={thSortable} onClick={() => handleSort('plan')}>
                  {t('admin.colPlan')}{sortArrow('plan')}
                </th>
                <th style={thSortable} onClick={() => handleSort('role')}>
                  {t('admin.colRole')}{sortArrow('role')}
                </th>
                <th style={thBase}>{t('admin.colProjects')}</th>
                <th style={thSortable} onClick={() => handleSort('createdAt')}>
                  {t('admin.colRegistration')}{sortArrow('createdAt')}
                </th>
                <th style={{ ...thBase, textAlign: 'center' }}>{t('admin.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td style={{ ...tdBase, padding: '14px 0 14px 16px' }}>
                      <Skeleton width="32px" height="32px" rounded />
                    </td>
                    <td style={tdBase}><Skeleton width="120px" height="16px" /></td>
                    <td style={tdBase}><Skeleton width="160px" height="16px" /></td>
                    <td style={tdBase}><Skeleton width="56px" height="22px" rounded /></td>
                    <td style={tdBase}><Skeleton width="80px" height="16px" /></td>
                    <td style={tdBase}><Skeleton width="28px" height="16px" /></td>
                    <td style={tdBase}><Skeleton width="72px" height="16px" /></td>
                    <td style={{ ...tdBase, textAlign: 'center' }}><Skeleton width="24px" height="24px" style={{ margin: '0 auto' }} /></td>
                  </tr>
                ))
              ) : !users.data?.users.length ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center' }}>
                    <div style={{ color: C.dim, fontSize: 32, marginBottom: 8 }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                    </div>
                    <div style={{ color: C.sub, fontSize: 14, fontWeight: 500 }}>
                      {search || planFilter
                        ? t('admin.noUsersFound')
                        : t('admin.noUsers')}
                    </div>
                  </td>
                </tr>
              ) : (
                users.data.users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    C={C}
                    tdBase={tdBase}
                    expanded={expandedUserId === user.id}
                    onToggle={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                    onUpdatePlan={(plan) => updateUser.mutate({ userId: user.id, plan })}
                    isPending={updateUser.isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {users.data && users.data.pages > 1 && (
          <div style={{
            padding: '14px 20px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, color: C.dim }}>
              {t('admin.page')} {users.data.page} {t('admin.of')} {users.data.pages} ({users.data.total} {t('admin.total')})
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label={t('admin.prevPage')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  background: 'transparent',
                  color: page <= 1 ? C.dim : C.text,
                  opacity: page <= 1 ? 0.5 : 1,
                  transition: 'opacity .15s',
                }}
              >
                {t('admin.prev')}
              </button>

              {/* Page numbers */}
              {generatePageNumbers(page, users.data.pages).map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} style={{ padding: '6px 4px', fontSize: 12, color: C.dim }}>
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    aria-label={`${t('admin.pageNum')} ${p}`}
                    aria-current={page === p ? 'page' : undefined}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: `1px solid ${page === p ? C.accent : C.border}`,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      background: page === p ? C.accent : 'transparent',
                      color: page === p ? '#fff' : C.sub,
                      transition: 'all .15s',
                    }}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                onClick={() => setPage((p) => Math.min(users.data!.pages, p + 1))}
                disabled={page >= users.data.pages}
                aria-label={t('admin.nextPage')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: page >= users.data.pages ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  background: 'transparent',
                  color: page >= users.data.pages ? C.dim : C.text,
                  opacity: page >= users.data.pages ? 0.5 : 1,
                  transition: 'opacity .15s',
                }}
              >
                {t('admin.next')}
              </button>
            </div>
          </div>
        )}
      </div>}

      {/* ── Referrals Section ──────────────────────── */}
      {activeTab === 'referrals' && (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 16, overflow: 'hidden', marginBottom: 32,
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Referral Payouts</h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={thBase}>Name</th>
                  <th style={thBase}>Email</th>
                  <th style={thBase}>Code</th>
                  <th style={{ ...thBase, textAlign: 'right' }}>Total Earned</th>
                  <th style={{ ...thBase, textAlign: 'right' }}>Already Paid</th>
                  <th style={{ ...thBase, textAlign: 'right' }}>Pending</th>
                  <th style={{ ...thBase, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {referralStats.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td style={tdBase}><Skeleton width="100px" height="16px" /></td>
                      <td style={tdBase}><Skeleton width="140px" height="16px" /></td>
                      <td style={tdBase}><Skeleton width="80px" height="16px" /></td>
                      <td style={tdBase}><Skeleton width="60px" height="16px" /></td>
                      <td style={tdBase}><Skeleton width="60px" height="16px" /></td>
                      <td style={tdBase}><Skeleton width="60px" height="16px" /></td>
                      <td style={{ ...tdBase, textAlign: 'center' }}><Skeleton width="80px" height="28px" /></td>
                    </tr>
                  ))
                ) : !referralStats.data?.length ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: C.dim, fontSize: 14 }}>
                      No referrers with earnings yet
                    </td>
                  </tr>
                ) : (
                  referralStats.data.map((r) => (
                    <tr key={r.id}>
                      <td style={{ ...tdBase, fontWeight: 600 }}>{r.name || '---'}</td>
                      <td style={{ ...tdBase, color: C.sub, fontSize: 12 }}>{r.email || '---'}</td>
                      <td style={tdBase}>
                        <code style={{
                          fontSize: 11, background: `${C.accent}12`, color: C.accent,
                          padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                        }}>
                          {r.referralCode || '---'}
                        </code>
                      </td>
                      <td style={{ ...tdBase, textAlign: 'right', fontWeight: 600 }}>
                        ${r.referralEarnings.toFixed(2)}
                      </td>
                      <td style={{ ...tdBase, textAlign: 'right', color: C.green, fontWeight: 600 }}>
                        ${r.totalPaid.toFixed(2)}
                      </td>
                      <td style={{ ...tdBase, textAlign: 'right', fontWeight: 700, color: r.pending > 0 ? C.orange : C.dim }}>
                        ${r.pending.toFixed(2)}
                      </td>
                      <td style={{ ...tdBase, textAlign: 'center' }}>
                        {r.pending > 0 ? (
                          <button
                            disabled={createPayout.isPending}
                            onClick={() => createPayout.mutate({ userId: r.id, amount: r.pending, note: `Payout $${r.pending.toFixed(2)}` })}
                            style={{
                              padding: '5px 14px',
                              borderRadius: 6,
                              border: `1px solid ${C.green}`,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: createPayout.isPending ? 'not-allowed' : 'pointer',
                              fontFamily: 'inherit',
                              background: `${C.green}18`,
                              color: C.green,
                              opacity: createPayout.isPending ? 0.5 : 1,
                              transition: 'opacity .15s',
                            }}
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: C.dim }}>Paid</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Analytics Section ────────────────────────── */}
      {activeTab === 'analytics' && (
        <AnalyticsDashboard
          C={C}
          recharts={recharts}
          growthStats={growthStats}
          revenueStats={revenueStats}
          planDistribution={planDistribution}
          activeUsers={activeUsers}
          totalUsers={stats.data?.totalUsers ?? 0}
          paidUsers={stats.data?.activeSubscriptions ?? 0}
        />
      )}

      {/* ── Recent Activity ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {/* Recent Registrations */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 16, overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{t('admin.newUsers')}</h3>
          </div>
          <div style={{ padding: '4px 0' }}>
            {activity.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Skeleton width="28px" height="28px" rounded />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="110px" height="14px" />
                    <Skeleton width="80px" height="11px" style={{ marginTop: 4 }} />
                  </div>
                </div>
              ))
            ) : !activity.data?.recentUsers.length ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: C.dim, fontSize: 13 }}>
                {t('admin.noData')}
              </div>
            ) : (
              activity.data.recentUsers.map((u) => (
                <div
                  key={u.id}
                  style={{
                    padding: '10px 20px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <UserAvatar image={u.image} name={u.name} size={28} C={C} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.name || u.email || t('admin.noName')}
                    </div>
                    <div style={{ fontSize: 11, color: C.dim }}>{relativeTime(u.createdAt, t, locale)}</div>
                  </div>
                  <PlanBadge plan={u.plan} C={C} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 16, overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{t('admin.recentProjects')}</h3>
          </div>
          <div style={{ padding: '4px 0' }}>
            {activity.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Skeleton width="28px" height="28px" rounded />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="140px" height="14px" />
                    <Skeleton width="90px" height="11px" style={{ marginTop: 4 }} />
                  </div>
                </div>
              ))
            ) : !activity.data?.recentProjects.length ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: C.dim, fontSize: 13 }}>
                {t('admin.noProjects')}
              </div>
            ) : (
              activity.data.recentProjects.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '10px 20px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <UserAvatar image={p.user.image} name={p.user.name} size={28} C={C} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: 11, color: C.dim }}>
                      {p.user.name || t('admin.noName')} &middot; {relativeTime(p.createdAt, t, locale)}
                    </div>
                  </div>
                  <StatusBadge status={p.status} C={C} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────── */

function UserAvatar({ image, name, size, C }: { image?: string | null | undefined; name?: string | null | undefined; size: number; C: Theme }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name || ''}
        loading="lazy"
        style={{
          width: size, height: size, borderRadius: size >= 32 ? 10 : 8,
          objectFit: 'cover', flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size >= 32 ? 10 : 8,
      background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size >= 32 ? 12 : 10,
      fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {initials(name ?? null)}
    </div>
  );
}

function PlanBadge({ plan, C }: { plan: string; C: Theme }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    FREE: { bg: `${C.blue}18`, fg: C.blue },
    PRO: { bg: C.accentDim, fg: C.accent },
    STUDIO: { bg: `${C.purple}18`, fg: C.purple },
  };
  const c = colors[plan] ?? colors.FREE;
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      background: c.bg,
      color: c.fg,
      letterSpacing: '.02em',
    }}>
      {PLAN_LABELS[plan] ?? plan}
    </span>
  );
}

function RoleBadge({ role, C }: { role: string; C: Theme }) {
  const t = useLocaleStore((s) => s.t);
  const isAdmin = role === 'ADMIN';
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: isAdmin ? 700 : 500,
      background: isAdmin ? `${C.orange}18` : `${C.dim}18`,
      color: isAdmin ? C.orange : C.sub,
      letterSpacing: '.01em',
    }}>
      {getRoleLabels(t)[role] ?? role}
    </span>
  );
}

function StatusBadge({ status, C }: { status: string; C: Theme }) {
  const t = useLocaleStore((s) => s.t);
  const colors: Record<string, string> = {
    DRAFT: C.dim,
    RENDERING: C.orange,
    READY: C.green,
    PUBLISHED: C.blue,
  };
  const color = colors[status] ?? C.dim;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 6,
      fontSize: 11, fontWeight: 600,
      background: `${color}18`, color,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: color, flexShrink: 0,
      }} />
      {getStatusLabels(t)[status] ?? status}
    </span>
  );
}

/* ── User Row ────────────────────────────────────── */

interface UserRowProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    plan: string;
    role: string;
    aiUsage: number;
    createdAt: Date | string;
    _count: { projects: number };
  };
  C: Theme;
  tdBase: React.CSSProperties;
  expanded: boolean;
  onToggle: () => void;
  onUpdatePlan: (plan: 'FREE' | 'PRO' | 'STUDIO') => void;
  isPending: boolean;
}

function UserRow({ user, C, tdBase, expanded, onToggle, onUpdatePlan, isPending }: UserRowProps) {
  const t = useLocaleStore((s) => s.t);
  return (
    <>
      <tr
        style={{
          cursor: 'pointer',
          background: expanded ? `${C.accent}06` : 'transparent',
          transition: 'background .12s',
        }}
        onClick={onToggle}
      >
        {/* Avatar */}
        <td style={{ ...tdBase, padding: '10px 0 10px 16px', width: 44 }}>
          <UserAvatar image={user.image} name={user.name} size={32} C={C} />
        </td>

        {/* Name */}
        <td style={{ ...tdBase, fontWeight: 600 }}>
          {user.name || '---'}
        </td>

        {/* Email */}
        <td style={{ ...tdBase, color: C.sub, fontSize: 12 }}>
          {user.email || '---'}
        </td>

        {/* Plan Badge */}
        <td style={tdBase}>
          <PlanBadge plan={user.plan} C={C} />
        </td>

        {/* Role Badge */}
        <td style={tdBase}>
          <RoleBadge role={user.role} C={C} />
        </td>

        {/* Projects Count */}
        <td style={{ ...tdBase, color: C.sub, fontWeight: 600, textAlign: 'center' }}>
          {user._count.projects}
        </td>

        {/* Joined Date */}
        <td style={{ ...tdBase, color: C.dim, fontSize: 12 }}>
          {new Date(user.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </td>

        {/* Expand */}
        <td style={{ ...tdBase, textAlign: 'center' }}>
          <span style={{
            display: 'inline-block',
            color: C.dim,
            fontSize: 16,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform .2s ease',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </td>
      </tr>

      {/* Expanded Actions Row */}
      {expanded && (
        <tr>
          <td colSpan={8} style={{
            padding: '16px 20px',
            background: `${C.surface}`,
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
            }}>
              {/* Plan change */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>{t('admin.planLabel')}</label>
                <select
                  value={user.plan}
                  onChange={(e) => {
                    e.stopPropagation();
                    onUpdatePlan(e.target.value as 'FREE' | 'PRO' | 'STUDIO');
                  }}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isPending}
                  aria-label={`${t('admin.changePlanFor')} ${user.name || user.email}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    background: C.card,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    outline: 'none',
                    opacity: isPending ? 0.6 : 1,
                  }}
                >
                  <option value="FREE">Free</option>
                  <option value="PRO">Pro</option>
                  <option value="STUDIO">Studio</option>
                </select>
              </div>

              {/* Meta info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
                <span style={{ fontSize: 11, color: C.dim }}>
                  {t('admin.aiGenLabel')} <strong style={{ color: C.sub }}>{user.aiUsage}</strong>
                </span>
                <span style={{ fontSize: 11, color: C.dim }}>
                  ID: <code style={{ fontSize: 10, color: C.dim, background: C.card, padding: '1px 6px', borderRadius: 4 }}>
                    {user.id.slice(0, 12)}...
                  </code>
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Loading Skeleton ────────────────────────────── */

function LoadingSkeleton({ C }: { C: Theme }) {
  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: 32 }}>
        <Skeleton width="280px" height="28px" />
        <div style={{ marginTop: 8 }}><Skeleton width="360px" height="16px" /></div>
      </div>

      {/* Stats cards skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: '22px 24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <Skeleton width="80px" height="12px" />
              <Skeleton width="36px" height="36px" rounded />
            </div>
            <Skeleton width="80px" height="32px" />
            <div style={{ marginTop: 8 }}><Skeleton width="100px" height="14px" /></div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 16, overflow: 'hidden', marginBottom: 32,
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Skeleton width="120px" height="20px" />
          <div style={{ flex: 1 }} />
          <Skeleton width="200px" height="32px" rounded />
          <Skeleton width="180px" height="32px" rounded />
        </div>
        <div style={{ padding: '12px 20px' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
              <Skeleton width="32px" height="32px" rounded />
              <Skeleton width="120px" height="14px" />
              <Skeleton width="160px" height="14px" />
              <Skeleton width="56px" height="22px" rounded />
              <Skeleton width="72px" height="14px" />
              <div style={{ flex: 1 }} />
              <Skeleton width="80px" height="14px" />
            </div>
          ))}
        </div>
      </div>

      {/* Activity skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {[1, 2].map((i) => (
          <div key={i} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
              <Skeleton width="160px" height="16px" />
            </div>
            {[1, 2, 3, 4].map((j) => (
              <div key={j} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.border}` }}>
                <Skeleton width="28px" height="28px" rounded />
                <div style={{ flex: 1 }}>
                  <Skeleton width="120px" height="13px" />
                  <Skeleton width="80px" height="11px" style={{ marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Analytics Dashboard ─────────────────────────── */

const PLAN_COLORS: Record<string, string> = {
  FREE: '#3b82f6',
  PRO: '#f43f5e',
  STUDIO: '#8b5cf6',
};

interface AnalyticsDashboardProps {
  C: Theme;
  recharts: typeof import('recharts') | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  growthStats: { data?: any[]; isLoading: boolean };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  revenueStats: { data?: any[]; isLoading: boolean };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  planDistribution: { data?: any[]; isLoading: boolean };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeUsers: { data?: any; isLoading: boolean };
  totalUsers: number;
  paidUsers: number;
}

function AnalyticsDashboard({
  C,
  recharts,
  growthStats,
  revenueStats,
  planDistribution,
  activeUsers,
  totalUsers,
  paidUsers,
}: AnalyticsDashboardProps) {
  const totalRevenue = revenueStats.data?.reduce((sum, r) => sum + r.total, 0) ?? 0;

  const summaryCards = [
    { label: 'Total Users', value: totalUsers.toLocaleString('en-US'), color: C.blue },
    { label: 'Paid Users', value: paidUsers.toLocaleString('en-US'), color: C.green },
    { label: 'Revenue (12mo)', value: `$${totalRevenue.toFixed(2)}`, color: C.accent },
    { label: 'Active (7d)', value: activeUsers.data?.count?.toLocaleString('en-US') ?? '...', color: C.purple },
  ];

  const chartCardStyle: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: '20px 24px',
    overflow: 'hidden',
  };

  const chartTitleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: C.text,
    marginBottom: 16,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
      {/* ── Summary stat cards ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {summaryCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: '20px 22px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 60, height: 60,
              background: `radial-gradient(circle at 100% 0%, ${card.color}18, transparent 70%)`,
              pointerEvents: 'none',
            }} />
            <div style={{
              fontSize: 11, color: C.sub, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8,
            }}>
              {card.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts grid ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {!recharts ? (
          /* Recharts still loading — show skeleton placeholders for all 3 charts */
          <>
            <div style={{ ...chartCardStyle, gridColumn: '1 / -1' }}>
              <div style={chartTitleStyle}>User Growth (Last 30 Days)</div>
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontSize: 13 }}>
                Loading charts...
              </div>
            </div>
            <div style={chartCardStyle}>
              <div style={chartTitleStyle}>Plan Distribution</div>
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontSize: 13 }}>
                Loading charts...
              </div>
            </div>
            <div style={chartCardStyle}>
              <div style={chartTitleStyle}>Revenue by Month</div>
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontSize: 13 }}>
                Loading charts...
              </div>
            </div>
          </>
        ) : (
          /* Recharts loaded — render all 3 charts */
          <AdminCharts
            recharts={recharts}
            C={C}
            chartCardStyle={chartCardStyle}
            chartTitleStyle={chartTitleStyle}
            growthStats={growthStats}
            planDistribution={planDistribution}
            revenueStats={revenueStats}
          />
        )}
      </div>
    </div>
  );
}

/* ── Admin Charts (rendered once recharts is loaded) ── */

interface AdminChartsProps {
  recharts: typeof import('recharts');
  C: Theme;
  chartCardStyle: React.CSSProperties;
  chartTitleStyle: React.CSSProperties;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  growthStats: { data?: any[]; isLoading: boolean };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  planDistribution: { data?: any[]; isLoading: boolean };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  revenueStats: { data?: any[]; isLoading: boolean };
}

function AdminCharts({ recharts: rc, C, chartCardStyle, chartTitleStyle, growthStats, planDistribution, revenueStats }: AdminChartsProps) {
  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip: RTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } = rc;

  return (
    <>
      {/* Line chart: User Growth */}
      <div style={{ ...chartCardStyle, gridColumn: '1 / -1' }}>
        <div style={chartTitleStyle}>User Growth (Last 30 Days)</div>
        {growthStats.isLoading ? (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton width="100%" height="240px" />
          </div>
        ) : !growthStats.data?.length ? (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontSize: 13 }}>
            No signup data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={growthStats.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}`} />
              <XAxis
                dataKey="day"
                tick={{ fill: C.dim, fontSize: 11 }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                stroke={C.border}
              />
              <YAxis tick={{ fill: C.dim, fontSize: 11 }} stroke={C.border} allowDecimals={false} />
              <RTooltip
                contentStyle={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  fontSize: 12,
                  color: C.text,
                  boxShadow: '0 4px 16px rgba(0,0,0,.15)',
                }}
                labelFormatter={(v) => {
                  const d = new Date(String(v));
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="New Users"
                stroke={C.accent}
                strokeWidth={2.5}
                dot={{ fill: C.accent, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: C.accent, strokeWidth: 2, stroke: C.card }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie chart: Plan Distribution */}
      <div style={chartCardStyle}>
        <div style={chartTitleStyle}>Plan Distribution</div>
        {planDistribution.isLoading ? (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton width="200px" height="200px" rounded />
          </div>
        ) : !planDistribution.data?.length ? (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontSize: 13 }}>
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={planDistribution.data}
                dataKey="count"
                nameKey="plan"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                paddingAngle={3}
                label={(props: { name?: string; value?: number }) => `${props.name ?? ''}: ${props.value ?? ''}`}
                labelLine={{ stroke: C.dim, strokeWidth: 1 }}
              >
                {planDistribution.data.map((entry) => (
                  <Cell
                    key={entry.plan}
                    fill={PLAN_COLORS[entry.plan] ?? C.dim}
                    stroke="none"
                  />
                ))}
              </Pie>
              <RTooltip
                contentStyle={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  fontSize: 12,
                  color: C.text,
                  boxShadow: '0 4px 16px rgba(0,0,0,.15)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                formatter={(value: string) => (
                  <span style={{ color: C.sub, fontSize: 12, fontWeight: 500 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar chart: Revenue by Month */}
      <div style={chartCardStyle}>
        <div style={chartTitleStyle}>Revenue by Month</div>
        {revenueStats.isLoading ? (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton width="100%" height="240px" />
          </div>
        ) : !revenueStats.data?.length ? (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontSize: 13 }}>
            No revenue data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueStats.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}`} />
              <XAxis
                dataKey="month"
                tick={{ fill: C.dim, fontSize: 11 }}
                tickFormatter={(v: string) => {
                  const d = new Date(v + '-01');
                  return d.toLocaleDateString('en-US', { month: 'short' });
                }}
                stroke={C.border}
              />
              <YAxis
                tick={{ fill: C.dim, fontSize: 11 }}
                stroke={C.border}
                tickFormatter={(v: number) => `$${v}`}
              />
              <RTooltip
                contentStyle={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  fontSize: 12,
                  color: C.text,
                  boxShadow: '0 4px 16px rgba(0,0,0,.15)',
                }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                labelFormatter={(v) => {
                  const d = new Date(String(v) + '-01');
                  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                }}
              />
              <Bar dataKey="total" name="Revenue" fill={C.green} radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}

/* ── Pagination Helper ───────────────────────────── */

function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [];

  // Always show first page
  pages.push(1);

  if (current > 3) pages.push('...');

  // Show pages around current
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('...');

  // Always show last page
  pages.push(total);

  return pages;
}
