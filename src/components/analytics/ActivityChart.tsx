'use client';

import { useState, useEffect, memo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface ActivityDataPoint {
  date: string;
  created: number;
  updated: number;
}

interface ActivityChartProps {
  data: ActivityDataPoint[];
  /** Title shown above the chart */
  title?: string;
}

/**
 * Recharts is ~200KB — lazy-load it only when this component renders.
 */
let rechartsCache: typeof import('recharts') | null = null;

export const ActivityChart = memo(function ActivityChart({
  data,
  title = 'Project Activity',
}: ActivityChartProps) {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const [recharts, setRecharts] = useState(rechartsCache);

  useEffect(() => {
    if (rechartsCache) return;
    let cancelled = false;
    import('recharts').then((mod) => {
      rechartsCache = mod;
      if (!cancelled) setRecharts(mod);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: C.dim,
          fontSize: 13,
        }}
      >
        No activity data
      </div>
    );
  }

  if (!recharts) {
    return (
      <div
        style={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: C.dim,
          fontSize: 13,
        }}
      >
        Loading chart...
      </div>
    );
  }

  const {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
  } = recharts;

  // Format dates for display: "Mar 15"
  const formattedData = data.map((d) => ({
    ...d,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div>
      {title && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.text,
            marginBottom: 16,
            letterSpacing: '-.01em',
          }}
        >
          {title}
        </div>
      )}
      <ErrorBoundary
        fallback={
          <div
            style={{
              height: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.dim,
              fontSize: 13,
            }}
          >
            Chart rendering error
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.accent} stopOpacity={0.25} />
                <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradUpdated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.blue} stopOpacity={0.2} />
                <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? 'rgba(255,255,255,.04)' : C.border}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: C.dim, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: C.dim, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: isDark ? C.card : C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                fontSize: 12,
                color: C.text,
                boxShadow: '0 8px 24px rgba(0,0,0,.2)',
              }}
              labelStyle={{ color: C.sub, fontWeight: 600, marginBottom: 4 }}
            />
            <Area
              type="monotone"
              dataKey="created"
              stroke={C.accent}
              strokeWidth={2}
              fill="url(#gradCreated)"
              dot={false}
              activeDot={{ r: 4, fill: C.accent, strokeWidth: 0 }}
              name="Created"
            />
            <Area
              type="monotone"
              dataKey="updated"
              stroke={C.blue}
              strokeWidth={2}
              fill="url(#gradUpdated)"
              dot={false}
              activeDot={{ r: 4, fill: C.blue, strokeWidth: 0 }}
              name="Updated"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ErrorBoundary>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          justifyContent: 'center',
          marginTop: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: C.accent,
            }}
          />
          <span style={{ fontSize: 11, color: C.sub, fontWeight: 500 }}>
            Created
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: C.blue,
            }}
          />
          <span style={{ fontSize: 11, color: C.sub, fontWeight: 500 }}>
            Updated
          </span>
        </div>
      </div>
    </div>
  );
});
