'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useThemeStore } from '@/stores/useThemeStore';
import { StatCard } from '@/components/analytics/StatCard';
import { ActivityChart } from '@/components/analytics/ActivityChart';
import { StatusChart } from '@/components/analytics/StatusChart';
import { ToolUsageChart } from '@/components/analytics/ToolUsageChart';
import { getToolUsageCounts } from '@/lib/toolUsageTracker';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

/** Format seconds into a human-readable duration string */
function formatDuration(totalSeconds: number): string {
  if (totalSeconds === 0) return '0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && hours === 0) parts.push(`${seconds}s`);
  return parts.join(' ') || '0s';
}

/* ── SVG Icons ──────────────────────────────────────────── */

const ProjectIcon = (c: string) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="2" width="7" height="8" rx="2" fill={c} opacity=".85" />
    <rect x="11" y="2" width="7" height="5" rx="2" fill={c} opacity=".5" />
    <rect x="2" y="12" width="7" height="6" rx="2" fill={c} opacity=".5" />
    <rect x="11" y="9" width="7" height="9" rx="2" fill={c} opacity=".85" />
  </svg>
);

const SceneIcon = (c: string) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M7 4L16 10L7 16V4Z" fill={c} opacity=".85" />
    <path d="M4 6V14" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity=".4" />
  </svg>
);

const AiIcon = (c: string) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7.5" stroke={c} strokeWidth="1.5" opacity=".5" />
    <circle cx="10" cy="10" r="3" fill={c} opacity=".85" />
    <circle cx="10" cy="10" r="5" stroke={c} strokeWidth=".5" opacity=".25" />
  </svg>
);

const ClockIcon = (c: string) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" stroke={c} strokeWidth="1.5" opacity=".5" />
    <path d="M10 5V10L13 13" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".85" />
  </svg>
);

export default function AnalyticsPage() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Gate: only PRO and STUDIO users
  const plan = session?.user?.plan ?? 'FREE';
  const isPaidPlan = plan === 'PRO' || plan === 'STUDIO';

  // Redirect FREE users
  useEffect(() => {
    if (status === 'authenticated' && !isPaidPlan) {
      router.replace('/billing');
    }
  }, [status, isPaidPlan, router]);

  // Fetch server data
  const overview = trpc.analytics.getOverview.useQuery(undefined, {
    enabled: isPaidPlan && status === 'authenticated',
    staleTime: 60_000,
  });

  const activity = trpc.analytics.getProjectActivity.useQuery(undefined, {
    enabled: isPaidPlan && status === 'authenticated',
    staleTime: 60_000,
  });

  // Tool usage from localStorage
  const [toolCounts, setToolCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    setToolCounts(getToolUsageCounts());
  }, []);

  const toolData = useMemo(
    () =>
      Object.entries(toolCounts)
        .map(([tool, count]) => ({ tool, count }))
        .filter((d) => d.count > 0),
    [toolCounts],
  );

  // Status chart data
  const statusData = useMemo(() => {
    const sb = overview.data?.statusBreakdown;
    if (!sb) return [];
    return [
      { name: 'Draft', value: sb.DRAFT, color: C.blue },
      { name: 'Rendering', value: sb.RENDERING, color: C.orange },
      { name: 'Ready', value: sb.READY, color: C.green },
      { name: 'Published', value: sb.PUBLISHED, color: C.purple },
    ];
  }, [overview.data?.statusBreakdown, C]);

  // Loading state
  if (status === 'loading' || (status === 'authenticated' && !isPaidPlan)) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          color: C.dim,
          fontSize: 14,
        }}
      >
        Loading...
      </div>
    );
  }

  const isLoading = overview.isLoading || activity.isLoading;
  const isError = overview.isError || activity.isError;
  const data = overview.data;

  return (
    <ErrorBoundary>
      <div
        style={{
          padding: '32px 36px',
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        {/* Header */}
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: C.text,
              letterSpacing: '-.04em',
              margin: 0,
            }}
          >
            Analytics
          </h1>
          <p
            style={{
              fontSize: 13.5,
              color: C.sub,
              margin: '6px 0 0',
              fontWeight: 450,
            }}
          >
            Your content creation statistics and activity overview
          </p>
        </div>

        {/* Error state */}
        {isError && !isLoading && (
          <div
            style={{
              padding: '32px 24px',
              borderRadius: 16,
              background: isDark
                ? 'rgba(255,60,60,.06)'
                : 'rgba(255,60,60,.04)',
              border: '1px solid rgba(255,60,60,.15)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 14, color: isDark ? '#ff8080' : '#cc3333', fontWeight: 500 }}>
              Failed to load analytics data
            </div>
            <div style={{ fontSize: 12.5, color: C.dim }}>
              {overview.error?.message || activity.error?.message || 'An unexpected error occurred'}
            </div>
            <button
              onClick={() => { overview.refetch(); activity.refetch(); }}
              style={{
                marginTop: 4,
                padding: '8px 20px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.text,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  flex: '1 1 220px',
                  minWidth: 200,
                  height: 120,
                  borderRadius: 16,
                  background: isDark
                    ? 'rgba(255,255,255,.03)'
                    : 'rgba(0,0,0,.03)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        )}

        {/* Stat Cards */}
        {data && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <StatCard
              label="Total Projects"
              value={data.totalProjects}
              description={`${data.weekProjects} this week, ${data.monthProjects} this month`}
              icon={ProjectIcon}
              colorKey="accent"
            />
            <StatCard
              label="Total Scenes"
              value={data.totalScenes}
              description={`${formatDuration(data.totalDurationSeconds)} total duration`}
              icon={SceneIcon}
              colorKey="blue"
            />
            <StatCard
              label="AI Requests"
              value={
                data.aiLimit === -1
                  ? `${data.aiUsage}`
                  : `${data.aiUsage} / ${data.aiLimit}`
              }
              description={
                data.aiLimit === -1
                  ? 'Unlimited (Studio)'
                  : `${Math.max(0, data.aiLimit - data.aiUsage)} remaining this month`
              }
              icon={AiIcon}
              colorKey="purple"
            />
            <StatCard
              label="Video Duration"
              value={formatDuration(data.totalDurationSeconds)}
              description={`Across ${data.totalScenes} scenes`}
              icon={ClockIcon}
              colorKey="green"
            />
          </div>
        )}

        {/* Charts Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
            gap: 20,
          }}
        >
          {/* Activity Chart */}
          <div
            style={{
              padding: '24px',
              borderRadius: 16,
              background: isDark
                ? `linear-gradient(135deg, ${C.card}, rgba(17,17,25,.9))`
                : C.card,
              border: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : C.border}`,
            }}
          >
            <ActivityChart
              data={activity.data ?? []}
              title="Project Activity (30 days)"
            />
          </div>

          {/* Status Donut Chart */}
          <div
            style={{
              padding: '24px',
              borderRadius: 16,
              background: isDark
                ? `linear-gradient(135deg, ${C.card}, rgba(17,17,25,.9))`
                : C.card,
              border: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : C.border}`,
            }}
          >
            <StatusChart data={statusData} title="Projects by Status" />
          </div>
        </div>

        {/* Tool Usage Chart */}
        <div
          style={{
            padding: '24px',
            borderRadius: 16,
            background: isDark
              ? `linear-gradient(135deg, ${C.card}, rgba(17,17,25,.9))`
              : C.card,
            border: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : C.border}`,
          }}
        >
          <ToolUsageChart data={toolData} title="Tool Usage Breakdown" />
        </div>

        {/* Pulse animation keyframes */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}
