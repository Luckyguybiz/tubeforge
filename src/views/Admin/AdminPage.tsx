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

/* ── CSV Download Helper ──────────────────────────── */

function downloadCsv(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]!);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = String(row[h] ?? '');
        // Escape values containing commas, quotes, or newlines
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
  const [activeTab, setActiveTab] = useState<'users' | 'referrals' | 'analytics' | 'revenue' | 'health' | 'audit' | 'email'>('users');

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
    { page, limit: 20, search: searchDebounced || undefined, planFilter, sortBy, sortDir },
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

  const updateUserRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success('Role updated');
      users.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success('User deleted');
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
  const funnelData = trpc.admin.getFunnel.useQuery(undefined, { enabled: isAdmin && activeTab === 'analytics' });

  // Revenue dashboard data
  const revenueOverview = trpc.admin.getRevenueOverview.useQuery(undefined, { enabled: isAdmin && activeTab === 'revenue' });

  // User analytics data
  const userAnalytics = trpc.admin.getUserAnalytics.useQuery(undefined, { enabled: isAdmin && activeTab === 'analytics' });

  // System health data
  const systemHealth = trpc.admin.getSystemHealth.useQuery(undefined, {
    enabled: isAdmin && activeTab === 'health',
    refetchInterval: activeTab === 'health' ? 15000 : false,
  });

  // Audit log data
  const [auditPage, setAuditPage] = useState(1);
  const auditLog = trpc.admin.getAuditLog.useQuery(
    { page: auditPage, limit: 15 },
    { enabled: isAdmin && activeTab === 'audit' },
  );

  // Bulk email mutation
  const sendBulkEmail = trpc.admin.sendBulkEmail.useMutation({
    onSuccess: (data) => toast.success(data.message),
    onError: (err) => toast.error(err.message),
  });

  // Admin actions
  const suspendUser = trpc.admin.suspendUser.useMutation({
    onSuccess: () => { toast.success('User suspended'); users.refetch(); stats.refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const grantTrial = trpc.admin.grantTrial.useMutation({
    onSuccess: () => { toast.success('Trial granted'); users.refetch(); stats.refetch(); },
    onError: (err) => toast.error(err.message),
  });

  // CSV export state
  const [isExportingUsers, setIsExportingUsers] = useState(false);
  const [isExportingAudit, setIsExportingAudit] = useState(false);
  const exportUsersQuery = trpc.admin.exportUsers.useQuery(
    { planFilter, search: searchDebounced || undefined },
    { enabled: false },
  );
  const exportAuditQuery = trpc.admin.exportAuditLog.useQuery(undefined, { enabled: false });

  const handleExportUsers = useCallback(async () => {
    setIsExportingUsers(true);
    try {
      const result = await exportUsersQuery.refetch();
      if (result.data && result.data.length > 0) {
        downloadCsv(result.data, `users_export_${new Date().toISOString().slice(0, 10)}.csv`);
        toast.success(`Exported ${result.data.length} users`);
      } else {
        toast.error('No users to export');
      }
    } catch {
      toast.error('Failed to export users');
    } finally {
      setIsExportingUsers(false);
    }
  }, [exportUsersQuery]);

  const handleExportAudit = useCallback(async () => {
    setIsExportingAudit(true);
    try {
      const result = await exportAuditQuery.refetch();
      if (result.data && result.data.length > 0) {
        downloadCsv(result.data, `audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
        toast.success(`Exported ${result.data.length} audit entries`);
      } else {
        toast.error('No audit entries to export');
      }
    } catch {
      toast.error('Failed to export audit log');
    } finally {
      setIsExportingAudit(false);
    }
  }, [exportAuditQuery]);

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
      label: 'Revenue (MRR)',
      value: stats.data?.estimatedMrr != null ? `$${stats.data.estimatedMrr.toFixed(2)}` : undefined,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      color: C.green,
      sub: stats.data ? `${stats.data.activeSubscriptions} paid subscribers` : null,
      valueIsString: true,
    },
    {
      label: t('admin.stat.subscriptions'),
      value: stats.data?.activeSubscriptions,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
      color: C.purple,
      sub: stats.data ? `PRO + Studio` : null,
    },
    {
      label: 'New Users Today',
      value: stats.data?.newUsersToday,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      ),
      color: C.orange,
      sub: stats.data ? `${t('admin.stat.aiGen')} ${stats.data.totalAIUsage}` : null,
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
    <div style={{ maxWidth: 1200, width: '100%', padding: '0 16px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
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
      <div className="tf-admin-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: 16, marginBottom: 32 }}>
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
            <div style={{ fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>
              {stats.isLoading ? (
                <Skeleton width="60px" height="32px" />
              ) : (
                typeof stat.value === 'string' ? stat.value : (stat.value ?? 0).toLocaleString()
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
      <div className="tf-admin-tabs" style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }} role="tablist">
        {([['users', 'Users'], ['revenue', 'Revenue'], ['analytics', 'Analytics'], ['health', 'System'], ['audit', 'Audit Log'], ['email', 'Email'], ['referrals', 'Referrals']] as const).map(([key, label]) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '8px 20px',
                minHeight: 44,
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
      {activeTab === 'users' && <div className="tf-admin-table-wrap" style={{
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
                width: '100%',
                maxWidth: 240,
                outline: 'none',
                transition: 'border-color .15s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.borderActive; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            />
          </div>

          {/* Plan Filter */}
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }} role="group" aria-label={t('admin.filterByPlan')}>
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
                    minHeight: 36,
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

          {/* Export CSV */}
          <button
            onClick={handleExportUsers}
            disabled={isExportingUsers}
            title="Export users as CSV"
            style={{
              padding: '5px 14px',
              minHeight: 36,
              borderRadius: 6,
              border: `1px solid ${C.green}`,
              fontSize: 11,
              fontWeight: 700,
              cursor: isExportingUsers ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              background: `${C.green}14`,
              color: C.green,
              opacity: isExportingUsers ? 0.5 : 1,
              transition: 'all .15s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {isExportingUsers ? 'Exporting...' : 'Export CSV'}
          </button>
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
                    currentUserId={profile.data?.id ?? ''}
                    expanded={expandedUserId === user.id}
                    onToggle={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                    onUpdatePlan={(plan) => updateUser.mutate({ userId: user.id, plan })}
                    isPending={updateUser.isPending}
                    onSuspend={() => suspendUser.mutate({ userId: user.id })}
                    onGrantTrial={(plan) => grantTrial.mutate({ userId: user.id, plan })}
                    isSuspending={suspendUser.isPending}
                    isGranting={grantTrial.isPending}
                    onUpdateRole={(role) => updateUserRole.mutate({ userId: user.id, role })}
                    isUpdatingRole={updateUserRole.isPending}
                    onDelete={() => {
                      if (window.confirm(`Are you sure you want to delete user ${user.email || user.name || user.id}?`)) {
                        deleteUser.mutate({ userId: user.id });
                      }
                    }}
                    isDeleting={deleteUser.isPending}
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
          userAnalytics={userAnalytics}
          funnelData={funnelData}
        />
      )}

      {/* ── Revenue Dashboard (O1) ──────────────────── */}
      {activeTab === 'revenue' && (
        <RevenueDashboard C={C} revenueOverview={revenueOverview} />
      )}

      {/* ── System Health (O4) ───────────────────────── */}
      {activeTab === 'health' && (
        <SystemHealthPanel C={C} systemHealth={systemHealth} />
      )}

      {/* ── Audit Log (O5) ──────────────────────────── */}
      {activeTab === 'audit' && (
        <AuditLogPanel C={C} auditLog={auditLog} auditPage={auditPage} setAuditPage={setAuditPage} onExport={handleExportAudit} isExporting={isExportingAudit} />
      )}

      {/* ── Bulk Email (O6) ─────────────────────────── */}
      {activeTab === 'email' && (
        <BulkEmailPanel C={C} sendBulkEmail={sendBulkEmail} />
      )}

      {/* ── Recent Activity ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: 16 }}>
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
  currentUserId: string;
  expanded: boolean;
  onToggle: () => void;
  onUpdatePlan: (plan: 'FREE' | 'PRO' | 'STUDIO') => void;
  isPending: boolean;
  onSuspend: () => void;
  onGrantTrial: (plan: 'PRO' | 'STUDIO') => void;
  isSuspending: boolean;
  isGranting: boolean;
  onUpdateRole: (role: 'USER' | 'ADMIN') => void;
  isUpdatingRole: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}

function UserRow({ user, C, tdBase, currentUserId, expanded, onToggle, onUpdatePlan, isPending, onSuspend, onGrantTrial, isSuspending, isGranting, onUpdateRole, isUpdatingRole, onDelete, isDeleting }: UserRowProps) {
  const t = useLocaleStore((s) => s.t);
  const isSelf = user.id === currentUserId;
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

        {/* Role */}
        <td style={tdBase}>
          {isSelf ? (
            <RoleBadge role={user.role} C={C} />
          ) : (
            <select
              value={user.role}
              onChange={(e) => {
                e.stopPropagation();
                onUpdateRole(e.target.value as 'USER' | 'ADMIN');
              }}
              onClick={(e) => e.stopPropagation()}
              disabled={isUpdatingRole}
              aria-label={`Change role for ${user.name || user.email}`}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                background: user.role === 'ADMIN' ? `${C.orange}18` : `${C.dim}18`,
                color: user.role === 'ADMIN' ? C.orange : C.sub,
                border: `1px solid ${user.role === 'ADMIN' ? C.orange + '40' : C.border}`,
                cursor: isUpdatingRole ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                outline: 'none',
                opacity: isUpdatingRole ? 0.6 : 1,
              }}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          )}
        </td>

        {/* Projects Count */}
        <td style={{ ...tdBase, color: C.sub, fontWeight: 600, textAlign: 'center' }}>
          {user._count.projects}
        </td>

        {/* Joined Date */}
        <td style={{ ...tdBase, color: C.dim, fontSize: 12 }}>
          {new Date(user.createdAt).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </td>

        {/* Actions */}
        <td style={{ ...tdBase, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {/* Delete button — hidden for self */}
            {!isSelf && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                disabled={isDeleting}
                aria-label={`Delete user ${user.name || user.email}`}
                title="Delete user"
                style={{
                  width: 26, height: 26,
                  borderRadius: 6,
                  border: `1px solid ${C.red}40`,
                  background: `${C.red}10`,
                  color: C.red,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  opacity: isDeleting ? 0.5 : 1,
                  transition: 'opacity .15s, background .15s',
                  fontFamily: 'inherit',
                  padding: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
            {/* Expand chevron */}
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
          </div>
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

              {/* Admin actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {user.plan !== 'FREE' && (
                  <button
                    disabled={isSuspending}
                    onClick={(e) => { e.stopPropagation(); onSuspend(); }}
                    style={{
                      padding: '5px 12px', borderRadius: 6, border: `1px solid ${C.red}`,
                      fontSize: 11, fontWeight: 700, cursor: isSuspending ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', background: `${C.red}14`, color: C.red,
                      opacity: isSuspending ? 0.5 : 1, transition: 'opacity .15s',
                    }}
                  >
                    Suspend
                  </button>
                )}
                {user.plan === 'FREE' && (
                  <button
                    disabled={isGranting}
                    onClick={(e) => { e.stopPropagation(); onGrantTrial('PRO'); }}
                    style={{
                      padding: '5px 12px', borderRadius: 6, border: `1px solid ${C.green}`,
                      fontSize: 11, fontWeight: 700, cursor: isGranting ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', background: `${C.green}14`, color: C.green,
                      opacity: isGranting ? 0.5 : 1, transition: 'opacity .15s',
                    }}
                  >
                    Grant PRO Trial
                  </button>
                )}
                {!isSelf && (
                  <button
                    disabled={isDeleting}
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    style={{
                      padding: '5px 12px', borderRadius: 6, border: `1px solid ${C.red}`,
                      fontSize: 11, fontWeight: 700, cursor: isDeleting ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', background: `${C.red}14`, color: C.red,
                      opacity: isDeleting ? 0.5 : 1, transition: 'opacity .15s',
                    }}
                  >
                    Delete User
                  </button>
                )}
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
    <div style={{ maxWidth: 1200, width: '100%', padding: '0 16px', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 32 }}>
        <Skeleton width="280px" height="28px" />
        <div style={{ marginTop: 8 }}><Skeleton width="360px" height="16px" /></div>
      </div>

      {/* Stats cards skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: 16, marginBottom: 32 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: 16 }}>
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
  FREE: '#6b7280',
  Free: '#6b7280',
  PRO: '#3b82f6',
  Pro: '#3b82f6',
  STUDIO: '#8b5cf6',
  Studio: '#8b5cf6',
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userAnalytics?: { data?: any; isLoading: boolean };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  funnelData?: { data?: any[]; isLoading: boolean };
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
  userAnalytics,
  funnelData,
}: AnalyticsDashboardProps) {
  const totalRevenue = revenueStats.data?.reduce((sum, r) => sum + (r.revenue ?? r.total ?? 0), 0) ?? 0;
  const ua = userAnalytics?.data;

  const summaryCards = [
    { label: 'Total Users', value: totalUsers.toLocaleString('en-US'), color: C.blue },
    { label: 'Paid Users', value: paidUsers.toLocaleString('en-US'), color: C.green },
    { label: 'Revenue (6mo)', value: `$${totalRevenue.toFixed(2)}`, color: C.accent },
    { label: 'Active (7d)', value: (Array.isArray(activeUsers.data) ? activeUsers.data.reduce((sum: number, d: { active?: number }) => sum + (d.active ?? 0), 0) : activeUsers.data?.count ?? 0).toLocaleString('en-US'), color: C.purple },
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 14 }}>
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

      {/* ── User Analytics (O2) ──────────────────────── */}
      {ua && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: 14 }}>
          {/* New users cards */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 22px',
          }}>
            <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 12 }}>
              New Users
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { label: 'Today', value: ua.newToday, color: C.green },
                { label: 'This Week', value: ua.newThisWeek, color: C.blue },
                { label: 'This Month', value: ua.newThisMonth, color: C.purple },
              ].map((item) => (
                <div key={item.label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Plan distribution */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 22px',
          }}>
            <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 12 }}>
              Plan Distribution
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Free', value: ua.planDistribution.free, color: '#6b7280' },
                { label: 'Pro', value: ua.planDistribution.pro, color: C.accent },
                { label: 'Studio', value: ua.planDistribution.studio, color: C.purple },
              ].map((item) => (
                <div key={item.label} style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <span style={{ color: item.color }}>{item.label}</span>
                    <span style={{ color: C.text }}>{item.value}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: `${item.color}18` }}>
                    <div style={{
                      height: 6, borderRadius: 3, background: item.color,
                      width: `${totalUsers > 0 ? (item.value / totalUsers) * 100 : 0}%`,
                      transition: 'width .3s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top users by AI usage */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 22px',
            gridColumn: ua.topByAI.length > 0 ? '1 / -1' : undefined,
          }}>
            <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 12 }}>
              Top 5 Users by AI Usage
            </div>
            {ua.topByAI.length === 0 ? (
              <div style={{ color: C.dim, fontSize: 13, padding: '16px 0', textAlign: 'center' }}>No AI usage data yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 10, color: C.dim, fontWeight: 600, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>#</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 10, color: C.dim, fontWeight: 600, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 10, color: C.dim, fontWeight: 600, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 10, color: C.dim, fontWeight: 600, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>Plan</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontSize: 10, color: C.dim, fontWeight: 600, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>AI Uses</th>
                  </tr>
                </thead>
                <tbody>
                  {ua.topByAI.map((u: { id: string; name: string | null; email: string | null; plan: string; aiUsage: number }, i: number) => (
                    <tr key={u.id}>
                      <td style={{ padding: '8px', fontSize: 12, color: C.dim, borderBottom: `1px solid ${C.border}` }}>{i + 1}</td>
                      <td style={{ padding: '8px', fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>{u.name || '---'}</td>
                      <td style={{ padding: '8px', fontSize: 12, color: C.sub, borderBottom: `1px solid ${C.border}` }}>{u.email || '---'}</td>
                      <td style={{ padding: '8px', borderBottom: `1px solid ${C.border}` }}><PlanBadge plan={u.plan} C={C} /></td>
                      <td style={{ padding: '8px', fontSize: 13, fontWeight: 700, textAlign: 'right', color: C.accent, borderBottom: `1px solid ${C.border}` }}>{u.aiUsage.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Charts grid ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 16 }}>
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

      {/* ── Conversion Funnel ──────────────────────── */}
      {funnelData && (
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: '20px 24px',
          overflow: 'hidden',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>
            Conversion Funnel
          </div>
          {funnelData.isLoading ? (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontSize: 13 }}>
              Loading funnel data...
            </div>
          ) : !funnelData.data?.length ? (
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontSize: 13 }}>
              No data available
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {funnelData.data.map((step: { step: string; count: number }, i: number) => {
                const maxCount = funnelData.data![0]?.count || 1;
                const pct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
                const conversionFromPrev = i > 0 && funnelData.data![i - 1]!.count > 0
                  ? ((step.count / funnelData.data![i - 1]!.count) * 100).toFixed(1)
                  : null;
                return (
                  <div key={step.step}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: C.text }}>{step.step}</span>
                      <span style={{ color: C.sub }}>
                        {step.count.toLocaleString('en-US')}
                        {conversionFromPrev && (
                          <span style={{ marginLeft: 8, color: C.dim, fontSize: 11 }}>
                            ({conversionFromPrev}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{
                      height: 8,
                      borderRadius: 4,
                      background: `${C.border}`,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: 4,
                        background: i === 0 ? C.blue : i === 1 ? C.purple : i === 2 ? C.orange : C.green,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
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
                dataKey="month"
                tick={{ fill: C.dim, fontSize: 11 }}
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
              />
              <Line
                type="monotone"
                dataKey="users"
                name="New Users"
                stroke={C.accent}
                strokeWidth={2.5}
                dot={{ fill: C.accent, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: C.accent, strokeWidth: 2, stroke: C.card }}
              />
              <Line
                type="monotone"
                dataKey="projects"
                name="New Projects"
                stroke={C.blue}
                strokeWidth={2}
                dot={{ fill: C.blue, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: C.blue, strokeWidth: 2, stroke: C.card }}
              />
              <Legend
                verticalAlign="bottom"
                formatter={(value: string) => (
                  <span style={{ color: C.sub, fontSize: 12, fontWeight: 500 }}>{value}</span>
                )}
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
                dataKey="value"
                nameKey="name"
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
                    key={entry.name}
                    fill={entry.color ?? PLAN_COLORS[entry.name] ?? C.dim}
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
                formatter={(value, name) => [`$${Number(value).toFixed(2)}`, String(name)]}
              />
              <Bar dataKey="revenue" name="Revenue" fill={C.green} radius={[6, 6, 0, 0]} maxBarSize={48} />
              <Bar dataKey="payouts" name="Payouts" fill={C.orange} radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}

/* ── Revenue Dashboard (O1) ─────────────────────── */

interface RevenueDashboardProps {
  C: Theme;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  revenueOverview: { data?: any; isLoading: boolean; isError: boolean };
}

function RevenueDashboard({ C, revenueOverview }: RevenueDashboardProps) {
  const d = revenueOverview.data;

  if (revenueOverview.isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: 16, marginBottom: 32 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 24px' }}>
            <Skeleton width="80px" height="12px" />
            <div style={{ marginTop: 14 }}><Skeleton width="100px" height="32px" /></div>
            <div style={{ marginTop: 8 }}><Skeleton width="120px" height="14px" /></div>
          </div>
        ))}
      </div>
    );
  }

  if (revenueOverview.isError || !d) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '40px 24px', textAlign: 'center', marginBottom: 32 }}>
        <div style={{ color: C.dim, fontSize: 14 }}>Failed to load revenue data</div>
      </div>
    );
  }

  const cards = [
    {
      label: 'MRR',
      value: `$${d.mrr.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      sub: d.mrrChange !== 0 ? `${d.mrrChange > 0 ? '+' : ''}${d.mrrChange}% vs last month` : 'No change',
      color: C.green,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: 'Active Subscriptions',
      value: d.activeSubscriptions.toString(),
      sub: `${d.proCount} PRO + ${d.studioCount} Studio`,
      color: C.blue,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
    {
      label: 'Total Users',
      value: d.totalUsers.toLocaleString('en-US'),
      sub: `${d.activeSubscriptions > 0 ? ((d.activeSubscriptions / d.totalUsers) * 100).toFixed(1) : '0'}% paid`,
      color: C.purple,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        </svg>
      ),
    },
    {
      label: 'Churn Rate',
      value: d.churnRate !== null ? `${d.churnRate}%` : '\u2014',
      sub: d.churnRate !== null ? 'Monthly churn estimate' : 'Insufficient data',
      color: C.orange,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 16 }}>
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
              padding: '22px 24px', position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 80, height: 80,
              background: `radial-gradient(circle at 100% 0%, ${card.color}15, transparent 70%)`,
              pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                {card.label}
              </span>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: `${card.color}14`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color,
              }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 12, color: C.dim, marginTop: 6, fontWeight: 500 }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── System Health Panel (O4) ───────────────────── */

interface SystemHealthPanelProps {
  C: Theme;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  systemHealth: { data?: any; isLoading: boolean; isError: boolean };
}

function SystemHealthPanel({ C, systemHealth }: SystemHealthPanelProps) {
  const d = systemHealth.data;

  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hrs = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  }

  if (systemHealth.isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 16, marginBottom: 32 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 24px' }}>
            <Skeleton width="100px" height="14px" />
            <div style={{ marginTop: 12 }}><Skeleton width="140px" height="28px" /></div>
          </div>
        ))}
      </div>
    );
  }

  if (systemHealth.isError || !d) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '40px 24px', textAlign: 'center', marginBottom: 32 }}>
        <div style={{ color: C.red, fontSize: 14, fontWeight: 600 }}>System health check failed</div>
        <div style={{ color: C.dim, fontSize: 12, marginTop: 4 }}>Unable to reach health endpoint</div>
      </div>
    );
  }

  const statusColor = d.status === 'ok' ? C.green : C.orange;

  const items = [
    {
      label: 'Status',
      value: d.status.toUpperCase(),
      color: statusColor,
      detail: `DB latency: ${d.db.latencyMs}ms`,
    },
    {
      label: 'Memory (Heap)',
      value: `${d.memory.heapMB} MB`,
      color: d.memory.heapMB > 512 ? C.orange : C.green,
      detail: `RSS: ${d.memory.rssMB} MB`,
    },
    {
      label: 'Uptime',
      value: formatUptime(d.uptime),
      color: C.blue,
      detail: `Node ${d.nodeVersion}`,
    },
    {
      label: 'Database',
      value: d.db.ok ? 'Connected' : 'Disconnected',
      color: d.db.ok ? C.green : C.red,
      detail: `${d.counts.users} users, ${d.counts.projects} projects`,
    },
  ];

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 16 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
              padding: '22px 24px', position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 80, height: 80,
              background: `radial-gradient(circle at 100% 0%, ${item.color}15, transparent 70%)`,
              pointerEvents: 'none',
            }} />
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 12 }}>
              {item.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: item.color,
                display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{item.value}</span>
            </div>
            <div style={{ fontSize: 12, color: C.dim, fontWeight: 500 }}>{item.detail}</div>
          </div>
        ))}
      </div>

      {/* Rate limiter status placeholder */}
      <div style={{
        marginTop: 16, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ fontSize: 12, color: C.dim }}>
          Rate limiter: active (60 req/min admin, 30 req/min users)
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.dim }}>
          Auto-refreshes every 15s
        </span>
      </div>
    </div>
  );
}

/* ── Audit Log Panel (O5) ───────────────────────── */

interface AuditLogPanelProps {
  C: Theme;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auditLog: { data?: { logs: any[]; total: number; page: number; pages: number }; isLoading: boolean; isError: boolean };
  auditPage: number;
  setAuditPage: (page: number) => void;
  onExport: () => void;
  isExporting: boolean;
}

function AuditLogPanel({ C, auditLog, auditPage, setAuditPage, onExport, isExporting }: AuditLogPanelProps) {
  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 600,
    color: C.sub, textTransform: 'uppercase', letterSpacing: '.05em',
    borderBottom: `2px solid ${C.border}`,
  };
  const tdStyle: React.CSSProperties = {
    padding: '10px 14px', fontSize: 12, borderBottom: `1px solid ${C.border}`,
  };

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
      overflow: 'hidden', marginBottom: 32,
    }}>
      <div style={{
        padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Audit Log</h2>
        {auditLog.data && (
          <span style={{ fontSize: 12, color: C.dim, marginLeft: 4 }}>{auditLog.data.total} entries</span>
        )}
        <button
          onClick={onExport}
          disabled={isExporting}
          title="Export audit log as CSV"
          style={{
            marginLeft: 'auto',
            padding: '5px 14px',
            borderRadius: 6,
            border: `1px solid ${C.green}`,
            fontSize: 11,
            fontWeight: 700,
            cursor: isExporting ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            background: `${C.green}14`,
            color: C.green,
            opacity: isExporting ? 0.5 : 1,
            transition: 'all .15s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {auditLog.isLoading ? (
        <div style={{ padding: '20px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <Skeleton width="120px" height="14px" />
              <Skeleton width="80px" height="14px" />
              <Skeleton width="100px" height="14px" />
              <Skeleton width="80px" height="14px" />
            </div>
          ))}
        </div>
      ) : auditLog.isError ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ color: C.dim, fontSize: 13 }}>
            Audit log table not yet available. Run the database migration to enable audit logging.
          </div>
        </div>
      ) : !auditLog.data?.logs.length ? (
        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ color: C.dim, fontSize: 14 }}>No audit log entries yet</div>
          <div style={{ color: C.dim, fontSize: 12, marginTop: 4 }}>Admin actions will appear here once performed</div>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Action</th>
                  <th style={thStyle}>User ID</th>
                  <th style={thStyle}>Target</th>
                  <th style={thStyle}>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.data.logs.map((log: { id: string; createdAt: string; action: string; userId: string | null; target: string | null; metadata: Record<string, unknown> | null }) => (
                  <tr key={log.id}>
                    <td style={{ ...tdStyle, color: C.dim, whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                        background: `${C.accent}14`, color: C.accent,
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: C.dim }}>
                      {log.userId ? `${log.userId.slice(0, 10)}...` : '\u2014'}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: C.sub }}>
                      {log.target ? (log.target.length > 16 ? `${log.target.slice(0, 14)}...` : log.target) : '\u2014'}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 11, color: C.dim, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.metadata ? JSON.stringify(log.metadata).slice(0, 60) : '\u2014'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {auditLog.data.pages > 1 && (
            <div style={{
              padding: '12px 20px', borderTop: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12, color: C.dim }}>
                Page {auditLog.data.page} of {auditLog.data.pages}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setAuditPage(Math.max(1, auditPage - 1))}
                  disabled={auditPage <= 1}
                  style={{
                    padding: '5px 12px', borderRadius: 6, border: `1px solid ${C.border}`,
                    fontSize: 12, fontWeight: 600, cursor: auditPage <= 1 ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', background: 'transparent', color: auditPage <= 1 ? C.dim : C.text,
                    opacity: auditPage <= 1 ? 0.5 : 1,
                  }}
                >
                  Prev
                </button>
                <button
                  onClick={() => setAuditPage(Math.min(auditLog.data!.pages, auditPage + 1))}
                  disabled={auditPage >= auditLog.data.pages}
                  style={{
                    padding: '5px 12px', borderRadius: 6, border: `1px solid ${C.border}`,
                    fontSize: 12, fontWeight: 600, cursor: auditPage >= auditLog.data.pages ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', background: 'transparent', color: auditPage >= auditLog.data.pages ? C.dim : C.text,
                    opacity: auditPage >= auditLog.data.pages ? 0.5 : 1,
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Bulk Email Panel (O6) ──────────────────────── */

interface BulkEmailPanelProps {
  C: Theme;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendBulkEmail: { mutate: (input: any) => void; isPending: boolean };
}

function BulkEmailPanel({ C, sendBulkEmail }: BulkEmailPanelProps) {
  const [planFilter, setPlanFilter] = useState<'ALL' | 'FREE' | 'PRO' | 'STUDIO'>('ALL');
  const [template, setTemplate] = useState<'welcome' | 'feature_update' | 'promo' | 'maintenance'>('feature_update');
  const [subject, setSubject] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const TEMPLATE_LABELS: Record<string, string> = {
    welcome: 'Welcome / Onboarding',
    feature_update: 'Feature Update',
    promo: 'Promotional Offer',
    maintenance: 'Maintenance Notice',
  };

  const canSend = subject.trim().length > 0;

  const inputStyle: React.CSSProperties = {
    padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
    background: C.surface, color: C.text, fontSize: 13, fontFamily: 'inherit',
    outline: 'none', width: '100%', boxSizing: 'border-box',
    transition: 'border-color .15s',
  };

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
      overflow: 'hidden', marginBottom: 32,
    }}>
      <div style={{
        padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Bulk Email</h2>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
          background: `${C.orange}14`, color: C.orange, marginLeft: 8,
        }}>
          STUB
        </span>
      </div>

      <div style={{ padding: '24px 20px', maxWidth: 560 }}>
        {/* Plan Filter */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 6 }}>
            Recipients (by plan)
          </label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(['ALL', 'FREE', 'PRO', 'STUDIO'] as const).map((f) => {
              const active = planFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setPlanFilter(f)}
                  style={{
                    padding: '6px 14px', borderRadius: 6, border: `1px solid ${active ? C.accent : C.border}`,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    background: active ? C.accentDim : 'transparent', color: active ? C.accent : C.sub,
                    transition: 'all .15s',
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Template */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 6 }}>
            Template
          </label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as typeof template)}
            style={{
              ...inputStyle, cursor: 'pointer', maxWidth: 300,
            }}
          >
            {Object.entries(TEMPLATE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 6 }}>
            Subject Line
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject..."
            maxLength={200}
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.borderActive; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
          />
          <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{subject.length}/200</div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div style={{
            marginBottom: 20, padding: '16px', borderRadius: 10,
            border: `1px dashed ${C.border}`, background: C.surface,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: 'uppercase', marginBottom: 8 }}>Preview</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>
              Subject: {subject || '(empty)'}
            </div>
            <div style={{ fontSize: 12, color: C.sub }}>
              Template: {TEMPLATE_LABELS[template]} | Recipients: {planFilter} plan users
            </div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 8, fontStyle: 'italic' }}>
              Actual email delivery is not yet wired. This will validate and log the request.
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '8px 18px', borderRadius: 8, border: `1px solid ${C.border}`,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              background: 'transparent', color: C.sub, transition: 'all .15s',
            }}
          >
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            disabled={!canSend || sendBulkEmail.isPending}
            onClick={() => {
              if (!canSend) return;
              sendBulkEmail.mutate({ planFilter, template, subject: subject.trim() });
            }}
            style={{
              padding: '8px 22px', borderRadius: 8, border: 'none',
              fontSize: 13, fontWeight: 700, cursor: !canSend || sendBulkEmail.isPending ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', background: canSend ? C.accent : C.dim,
              color: '#fff', opacity: !canSend || sendBulkEmail.isPending ? 0.5 : 1,
              transition: 'opacity .15s',
            }}
          >
            {sendBulkEmail.isPending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
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
