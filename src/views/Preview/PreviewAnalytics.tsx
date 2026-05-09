'use client';

import { useMemo, useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/Skeleton';

/* ── Helpers ────────────────────────────────────────────── */

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function shortDate(iso: string | Date): string {
  if (iso instanceof Date) iso = iso.toISOString();
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── KPI Card ───────────────────────────────────────────── */

function KPICard({
  icon,
  label,
  value,
  sub,
  color,
  C,
  isMobile,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  isMobile: boolean;
}) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: isMobile ? '14px 12px' : '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: isMobile ? 18 : 22 }}>{icon}</span>
        <span style={{ fontSize: isMobile ? 11 : 12, color: C.dim, fontWeight: 500, letterSpacing: '0.02em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {sub && (
        <span style={{ fontSize: 11, color: C.sub, fontWeight: 400 }}>{sub}</span>
      )}
    </div>
  );
}

/* ── Bar Chart (30-day activity) ────────────────────────── */

function ActivityChart({
  data,
  C,
  isMobile,
  t,
}: {
  data: Array<{ date: string; created: number; updated: number }>;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  isMobile: boolean;
  t: (key: string) => string;
}) {
  const maxVal = useMemo(
    () => Math.max(1, ...data.map((d) => d.created + d.updated)),
    [data],
  );

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: isMobile ? 14 : 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, color: C.text }}>
          {t('previewAnalytics.activityTitle')}
        </span>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.dim }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#6366f1', display: 'inline-block' }} />
            {t('previewAnalytics.created')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#22d3ee', display: 'inline-block' }} />
            {t('previewAnalytics.updated')}
          </span>
        </div>
      </div>

      {/* Chart area */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: isMobile ? 1 : 2,
          height: isMobile ? 100 : 140,
          width: '100%',
        }}
      >
        {data.map((d, i) => {
          const createdH = (d.created / maxVal) * 100;
          const updatedH = (d.updated / maxVal) * 100;
          const total = d.created + d.updated;
          return (
            <div
              key={d.date}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
                position: 'relative',
              }}
              title={`${shortDate(d.date)}: ${d.created} created, ${d.updated} updated`}
            >
              {total > 0 && (
                <>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: isMobile ? 6 : 10,
                      borderRadius: '3px 3px 0 0',
                      background: '#6366f1',
                      height: `${createdH}%`,
                      minHeight: d.created > 0 ? 2 : 0,
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <div
                    style={{
                      width: '100%',
                      maxWidth: isMobile ? 6 : 10,
                      background: '#22d3ee',
                      height: `${updatedH}%`,
                      minHeight: d.updated > 0 ? 2 : 0,
                      transition: 'height 0.3s ease',
                    }}
                  />
                </>
              )}
              {!total && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: isMobile ? 6 : 10,
                    height: 2,
                    background: C.border,
                    borderRadius: 1,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* X-axis labels (show every 5th) */}
      <div style={{ display: 'flex', marginTop: 6, gap: isMobile ? 1 : 2 }}>
        {data.map((d, i) => (
          <div key={d.date} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: C.dim }}>
            {i % (isMobile ? 7 : 5) === 0 ? shortDate(d.date) : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Status Breakdown Donut ─────────────────────────────── */

function StatusBreakdown({
  breakdown,
  C,
  isMobile,
  t,
}: {
  breakdown: Record<string, number>;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  isMobile: boolean;
  t: (key: string) => string;
}) {
  const items = [
    { key: 'DRAFT', label: t('previewAnalytics.statusDraft'), color: '#f59e0b' },
    { key: 'RENDERING', label: t('previewAnalytics.statusRendering'), color: '#3b82f6' },
    { key: 'READY', label: t('previewAnalytics.statusReady'), color: '#8b5cf6' },
    { key: 'PUBLISHED', label: t('previewAnalytics.statusPublished'), color: '#10b981' },
  ];

  const total = items.reduce((s, i) => s + (breakdown[i.key] ?? 0), 0);

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: isMobile ? 14 : 20,
      }}
    >
      <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, color: C.text, display: 'block', marginBottom: 14 }}>
        {t('previewAnalytics.statusTitle')}
      </span>

      {/* Horizontal bar */}
      <div
        style={{
          display: 'flex',
          height: 10,
          borderRadius: 5,
          overflow: 'hidden',
          background: C.border,
          marginBottom: 14,
        }}
      >
        {items.map((item) => {
          const count = breakdown[item.key] ?? 0;
          if (count === 0) return null;
          return (
            <div
              key={item.key}
              style={{
                width: `${(count / Math.max(total, 1)) * 100}%`,
                background: item.color,
                transition: 'width 0.4s ease',
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '8px 16px' }}>
        {items.map((item) => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: item.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, color: C.sub }}>{item.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, marginLeft: 'auto' }}>
              {breakdown[item.key] ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Publish History List ───────────────────────────────── */

function PublishHistory({
  C,
  isMobile,
  t,
}: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  isMobile: boolean;
  t: (key: string) => string;
}) {
  const { data, isLoading } = trpc.analytics.getPublishHistory.useQuery(
    { limit: 10 },
    { staleTime: 60_000 },
  );

  if (isLoading) return <Skeleton width="100%" height={120} />;
  if (!data?.items?.length) {
    return (
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: isMobile ? 14 : 20,
          textAlign: 'center',
          color: C.dim,
          fontSize: 13,
        }}
      >
        {t('previewAnalytics.noPublished')}
      </div>
    );
  }

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: isMobile ? 14 : 20,
      }}
    >
      <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, color: C.text, display: 'block', marginBottom: 14 }}>
        {t('previewAnalytics.publishHistory')}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.items.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 10,
              background: C.surface,
              border: `1px solid ${C.border}`,
            }}
          >
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt=""
                style={{ width: 48, height: 28, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 4,
                  background: C.border,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                🎬
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: C.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.title || 'Untitled'}
              </div>
              <div style={{ fontSize: 11, color: C.dim }}>
                {shortDate(item.updatedAt)} · {item._count.scenes} {t('previewAnalytics.scenes')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── AI Usage Gauge ─────────────────────────────────────── */

function AIUsageGauge({
  used,
  limit,
  plan,
  C,
  isMobile,
  t,
}: {
  used: number;
  limit: number;
  plan: string;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  isMobile: boolean;
  t: (key: string) => string;
}) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : Math.min((used / Math.max(limit, 1)) * 100, 100);
  const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#6366f1';

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: isMobile ? 14 : 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, color: C.text }}>
          {t('previewAnalytics.aiUsage')}
        </span>
        <span
          style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 6,
            background: C.surface,
            color: C.accent,
            fontWeight: 600,
            border: `1px solid ${C.border}`,
          }}
        >
          {plan}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{used}</span>
        <span style={{ fontSize: 13, color: C.dim }}>
          / {isUnlimited ? '∞' : limit}
        </span>
      </div>

      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: C.border,
          overflow: 'hidden',
        }}
      >
        {!isUnlimited && (
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: barColor,
              borderRadius: 4,
              transition: 'width 0.4s ease',
            }}
          />
        )}
        {isUnlimited && (
          <div
            style={{
              height: '100%',
              width: '100%',
              background: 'linear-gradient(90deg, #6366f1, #22d3ee)',
              borderRadius: 4,
              opacity: 0.5,
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */

export function PreviewAnalytics() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { data: overview, isLoading: loadingOverview } = trpc.analytics.getOverview.useQuery(undefined, {
    staleTime: 30_000,
  });

  const { data: activity, isLoading: loadingActivity } = trpc.analytics.getProjectActivity.useQuery(undefined, {
    staleTime: 60_000,
  });

  if (loadingOverview) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: isMobile ? '0 4px' : 0 }}>
        <Skeleton width="100%" height={120} />
        <Skeleton width="100%" height={200} />
        <Skeleton width="100%" height={150} />
      </div>
    );
  }

  const ov = overview ?? {
    totalProjects: 0,
    totalScenes: 0,
    weekProjects: 0,
    monthProjects: 0,
    totalDurationSeconds: 0,
    plan: 'FREE',
    aiUsage: 0,
    aiLimit: 5,
    statusBreakdown: { DRAFT: 0, RENDERING: 0, READY: 0, PUBLISHED: 0 },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }}>
      {/* KPI row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 8 : 12,
        }}
      >
        <KPICard
          icon="📁"
          label={t('previewAnalytics.totalProjects')}
          value={ov.totalProjects}
          sub={`${t('previewAnalytics.thisWeek')}: +${ov.weekProjects}`}
          color="#6366f1"
          C={C}
          isMobile={isMobile}
        />
        <KPICard
          icon="🎬"
          label={t('previewAnalytics.totalScenes')}
          value={ov.totalScenes}
          color="#22d3ee"
          C={C}
          isMobile={isMobile}
        />
        <KPICard
          icon="⏱"
          label={t('previewAnalytics.totalDuration')}
          value={fmtDuration(ov.totalDurationSeconds)}
          color="#8b5cf6"
          C={C}
          isMobile={isMobile}
        />
        <KPICard
          icon="📅"
          label={t('previewAnalytics.thisMonth')}
          value={ov.monthProjects}
          sub={t('previewAnalytics.projectsCreated')}
          color="#10b981"
          C={C}
          isMobile={isMobile}
        />
      </div>

      {/* Activity chart */}
      {activity && (
        <ActivityChart data={activity} C={C} isMobile={isMobile} t={t} />
      )}
      {loadingActivity && <Skeleton width="100%" height={180} />}

      {/* Row: Status breakdown + AI usage */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 14 : 16,
        }}
      >
        <StatusBreakdown
          breakdown={ov.statusBreakdown}
          C={C}
          isMobile={isMobile}
          t={t}
        />
        <AIUsageGauge
          used={ov.aiUsage}
          limit={ov.aiLimit}
          plan={ov.plan}
          C={C}
          isMobile={isMobile}
          t={t}
        />
      </div>

      {/* Publish history */}
      <PublishHistory C={C} isMobile={isMobile} t={t} />
    </div>
  );
}
