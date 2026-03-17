'use client';

import { memo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';

export const Skeleton = memo(function Skeleton({
  width,
  height,
  rounded,
  style: extraStyle,
}: {
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  style?: React.CSSProperties;
}) {
  const C = useThemeStore((s) => s.theme);

  return (
    <div
      aria-hidden="true"
      role="presentation"
      style={{
        width: width ?? '100%',
        height: height ?? 20,
        borderRadius: rounded ? 12 : 8,
        backgroundImage: `linear-gradient(90deg, ${C.surface}, ${C.card}, ${C.surface})`,
        backgroundSize: '200% 100%',
        backgroundColor: C.surface,
        animation: 'shimmer 1.8s linear infinite',
        ...extraStyle,
      }}
    />
  );
});
