'use client';

import { useState, useEffect, useMemo, type ComponentType } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface AnalyticsChartProps {
  data: Array<{ day: string; views: number; subscribers: number; watchTime: number }>;
  metric: 'views' | 'subscribers' | 'watchTime';
}

function getMetricLabels(t: (key: string) => string): Record<string, string> {
  return {
    views: t('chart.views'),
    subscribers: t('chart.subscribers'),
    watchTime: t('chart.watchTime'),
  };
}

/**
 * Recharts is ~200KB — lazy-load it only when this component actually renders.
 */
let rechartsCache: typeof import('recharts') | null = null;

export function AnalyticsChart({ data, metric }: AnalyticsChartProps) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const METRIC_LABELS = useMemo(() => getMetricLabels(t), [t]);
  const [recharts, setRecharts] = useState(rechartsCache);

  useEffect(() => {
    if (rechartsCache) return;
    let cancelled = false;
    import('recharts').then((mod) => {
      rechartsCache = mod;
      if (!cancelled) setRecharts(mod);
    });
    return () => { cancelled = true; };
  }, []);

  if (!data || data.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontSize: 13 }}>
        {t('chart.noData')}
      </div>
    );
  }

  if (!recharts) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontSize: 13 }}>
        {t('chart.loading')}
      </div>
    );
  }

  const { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } = recharts;

  return (
    <div aria-label={`${t('chart.ariaLabel')}: ${METRIC_LABELS[metric]}`}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 12 }}>
        {METRIC_LABELS[metric]}
      </div>
      <ErrorBoundary
        fallback={
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontSize: 13 }}>
            {t('chart.error')}
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}`} />
            <XAxis
              dataKey="day"
              tick={{ fill: C.dim, fontSize: 10 }}
              axisLine={{ stroke: C.border }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: C.dim, fontSize: 10 }}
              axisLine={{ stroke: C.border }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 12,
                color: C.text,
              }}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={C.accent}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: C.accent }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ErrorBoundary>
    </div>
  );
}
