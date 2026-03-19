'use client';

import { useState, useEffect, memo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface StatusChartProps {
  data: StatusData[];
  title?: string;
}

let rechartsCache: typeof import('recharts') | null = null;

export const StatusChart = memo(function StatusChart({
  data,
  title = 'Projects by Status',
}: StatusChartProps) {
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

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
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
        No projects yet
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

  const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } = recharts;

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
              height: 260,
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          {/* Donut */}
          <div style={{ position: 'relative', width: 200, height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.filter((d) => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data
                    .filter((d) => d.value > 0)
                    .map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: isDark ? C.card : C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    fontSize: 12,
                    color: C.text,
                    boxShadow: '0 8px 24px rgba(0,0,0,.2)',
                  }}
                  formatter={(value) => [String(value ?? 0), 'Projects']}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: C.text,
                  lineHeight: 1,
                  letterSpacing: '-.03em',
                }}
              >
                {total}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: C.dim,
                  fontWeight: 500,
                  marginTop: 2,
                }}
              >
                Total
              </div>
            </div>
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              flex: 1,
              minWidth: 120,
            }}
          >
            {data.map((entry) => (
              <div
                key={entry.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: entry.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12.5,
                    color: C.sub,
                    fontWeight: 500,
                    flex: 1,
                  }}
                >
                  {entry.name}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: C.text,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {entry.value}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: C.dim,
                    fontWeight: 500,
                    minWidth: 32,
                    textAlign: 'right',
                  }}
                >
                  {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
});
