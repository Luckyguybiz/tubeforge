'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface AnalyticsChartProps {
  data: Array<{ day: string; views: number; subscribers: number; watchTime: number }>;
  metric: 'views' | 'subscribers' | 'watchTime';
}

const METRIC_LABELS: Record<string, string> = {
  views: 'Просмотры',
  subscribers: 'Подписчики',
  watchTime: 'Время просмотра (мин)',
};

export function AnalyticsChart({ data, metric }: AnalyticsChartProps) {
  const C = useThemeStore((s) => s.theme);

  if (!data || data.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontSize: 13 }}>
        Нет данных аналитики
      </div>
    );
  }

  return (
    <div aria-label={`Аналитика: ${METRIC_LABELS[metric]}`}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 12 }}>
        {METRIC_LABELS[metric]}
      </div>
      <ErrorBoundary
        fallback={
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontSize: 13 }}>
            Ошибка отображения графика
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
