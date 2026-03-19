'use client';

import { memo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import type { Theme } from '@/lib/types';

interface StatCardProps {
  /** Card label / title */
  label: string;
  /** Main display value */
  value: string | number;
  /** Optional description / subtext */
  description?: string;
  /** Trend percentage — positive = up, negative = down, 0 = neutral */
  trend?: number;
  /** Icon render function receiving theme color */
  icon?: (color: string) => React.ReactNode;
  /** Theme color key for the accent color */
  colorKey?: keyof Theme;
}

export const StatCard = memo(function StatCard({
  label,
  value,
  description,
  trend,
  icon,
  colorKey = 'accent',
}: StatCardProps) {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);

  const accentColor = C[colorKey] ?? C.accent;
  const trendUp = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;
  const trendColor = trendUp ? C.green : trendDown ? C.red : C.dim;

  return (
    <div
      style={{
        flex: '1 1 220px',
        minWidth: 200,
        padding: '20px 22px',
        borderRadius: 16,
        background: isDark
          ? `linear-gradient(135deg, ${C.card}, rgba(17,17,25,.9))`
          : C.card,
        border: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : C.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'all .2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle gradient accent in top-right */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: accentColor,
          opacity: 0.04,
          pointerEvents: 'none',
        }}
      />

      {/* Header row: icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: isDark
                ? `${accentColor}15`
                : `${accentColor}10`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon(accentColor)}
          </div>
        )}
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 500,
            color: C.sub,
            letterSpacing: '.02em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      </div>

      {/* Value row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: C.text,
            letterSpacing: '-.03em',
            lineHeight: 1,
          }}
        >
          {value}
        </span>

        {/* Trend arrow */}
        {trend !== undefined && trend !== 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 12,
              fontWeight: 600,
              color: trendColor,
              padding: '2px 7px',
              borderRadius: 6,
              background: `${trendColor}12`,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d={trendUp ? 'M5 2L8 6H2L5 2Z' : 'M5 8L2 4H8L5 8Z'}
                fill={trendColor}
              />
            </svg>
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <span
          style={{
            fontSize: 12,
            color: C.dim,
            lineHeight: 1.4,
          }}
        >
          {description}
        </span>
      )}
    </div>
  );
});
