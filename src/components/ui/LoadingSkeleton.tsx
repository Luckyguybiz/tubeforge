'use client';

import { memo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';

type SkeletonVariant = 'card' | 'table-row' | 'text' | 'avatar' | 'button';

interface LoadingSkeletonProps {
  /** Predefined layout variant */
  variant?: SkeletonVariant;
  /** Custom width — overrides variant default */
  width?: string | number;
  /** Custom height — overrides variant default */
  height?: string | number;
  /** Number of items to render (useful for lists) */
  count?: number;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

/** Single shimmer block — used internally and can be composed. */
function ShimmerBlock({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
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
        borderRadius,
        backgroundImage: `linear-gradient(90deg, ${C.surface}, ${C.card}, ${C.surface})`,
        backgroundSize: '200% 100%',
        backgroundColor: C.surface,
        animation: 'shimmer 1.8s linear infinite',
        ...style,
      }}
    />
  );
}

/** Avatar skeleton — circular */
function AvatarSkeleton({ size, style }: { size?: number; style?: React.CSSProperties }) {
  const s = size ?? 40;
  return <ShimmerBlock width={s} height={s} borderRadius={s} style={{ flexShrink: 0, ...style }} />;
}

/** Text skeleton — one or more lines */
function TextSkeleton({ width, style }: { width?: string | number; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      <ShimmerBlock width={width ?? '100%'} height={14} borderRadius={6} />
      <ShimmerBlock width="75%" height={14} borderRadius={6} />
      <ShimmerBlock width="50%" height={14} borderRadius={6} />
    </div>
  );
}

/** Button skeleton */
function ButtonSkeleton({ width, height, style }: { width?: string | number; height?: string | number; style?: React.CSSProperties }) {
  return <ShimmerBlock width={width ?? 120} height={height ?? 40} borderRadius={10} style={style} />;
}

/** Card skeleton — mimics a project/content card */
function CardSkeleton({ style }: { style?: React.CSSProperties }) {
  const C = useThemeStore((s) => s.theme);
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 14,
        border: `1px solid ${C.border}`,
        background: C.card,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        ...style,
      }}
    >
      <ShimmerBlock width="100%" height={140} borderRadius={10} />
      <ShimmerBlock width="70%" height={16} borderRadius={6} />
      <ShimmerBlock width="40%" height={12} borderRadius={6} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <ShimmerBlock width={80} height={28} borderRadius={6} />
        <ShimmerBlock width={60} height={28} borderRadius={6} />
      </div>
    </div>
  );
}

/** Table row skeleton */
function TableRowSkeleton({ style }: { style?: React.CSSProperties }) {
  const C = useThemeStore((s) => s.theme);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 16px',
        borderBottom: `1px solid ${C.border}`,
        ...style,
      }}
    >
      <ShimmerBlock width={36} height={36} borderRadius={8} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <ShimmerBlock width="60%" height={14} borderRadius={6} />
        <ShimmerBlock width="35%" height={10} borderRadius={4} />
      </div>
      <ShimmerBlock width={64} height={24} borderRadius={6} style={{ flexShrink: 0 }} />
    </div>
  );
}

/**
 * Flexible loading skeleton component with predefined variants.
 *
 * @example
 * ```tsx
 * <LoadingSkeleton variant="card" count={3} />
 * <LoadingSkeleton variant="text" />
 * <LoadingSkeleton variant="avatar" width={64} height={64} />
 * <LoadingSkeleton variant="table-row" count={5} />
 * <LoadingSkeleton variant="button" />
 * ```
 */
export const LoadingSkeleton = memo(function LoadingSkeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  style,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  const renderSingle = (key: number) => {
    switch (variant) {
      case 'card':
        return <CardSkeleton key={key} style={style} />;
      case 'table-row':
        return <TableRowSkeleton key={key} style={style} />;
      case 'text':
        return <TextSkeleton key={key} width={width} style={style} />;
      case 'avatar':
        return (
          <AvatarSkeleton
            key={key}
            size={typeof width === 'number' ? width : typeof height === 'number' ? height : 40}
            style={style}
          />
        );
      case 'button':
        return <ButtonSkeleton key={key} width={width} height={height} style={style} />;
      default:
        return <ShimmerBlock key={key} width={width} height={height} style={style} />;
    }
  };

  if (count === 1) return renderSingle(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: variant === 'card' ? 16 : 0 }}>
      {items.map(renderSingle)}
    </div>
  );
});
