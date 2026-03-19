'use client';

import { useState, useEffect, memo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface ToolUsageData {
  tool: string;
  count: number;
}

interface ToolUsageChartProps {
  data: ToolUsageData[];
  title?: string;
}

let rechartsCache: typeof import('recharts') | null = null;

export const ToolUsageChart = memo(function ToolUsageChart({
  data,
  title = 'Tool Usage',
}: ToolUsageChartProps) {
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: C.dim,
          fontSize: 13,
          gap: 8,
        }}
      >
        <span>No tool usage data yet</span>
        <span style={{ fontSize: 11, opacity: 0.7 }}>
          Start using tools to see your stats here
        </span>
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
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
  } = recharts;

  // Color palette for bars
  const COLORS = [C.accent, C.blue, C.purple, C.green, C.orange, C.cyan, C.pink];

  const coloredData = data
    .sort((a, b) => b.count - a.count)
    .map((d, i) => ({
      ...d,
      fill: COLORS[i % COLORS.length],
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
          <BarChart data={coloredData} layout="vertical" barSize={20}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? 'rgba(255,255,255,.04)' : C.border}
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: C.dim, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              dataKey="tool"
              type="category"
              tick={{ fill: C.sub, fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={120}
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
              formatter={(value) => [String(value ?? 0), 'Uses']}
              cursor={{
                fill: isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.03)',
                radius: 6,
              }}
            />
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              // Each bar uses its own fill from coloredData
              isAnimationActive={true}
              animationDuration={600}
            >
              {coloredData.map((entry, index) => {
                // We need the recharts Cell for individual bar colors
                const { Cell } = recharts;
                return <Cell key={`bar-${index}`} fill={entry.fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ErrorBoundary>
    </div>
  );
});
