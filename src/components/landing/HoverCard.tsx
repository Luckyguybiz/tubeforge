'use client';

import type { CSSProperties, ReactNode } from 'react';

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  hoverTransform?: string;
  hoverBoxShadow?: string;
  hoverBorderColor?: string;
  resetTransform?: string;
  resetBoxShadow?: string;
  resetBorderColor?: string;
}

/**
 * Thin client wrapper that adds onMouseEnter/onMouseLeave hover effects.
 * The children are server-rendered; only the hover behavior needs JS.
 */
export function HoverCard({
  children,
  className,
  style,
  hoverTransform = 'translateY(-4px)',
  hoverBoxShadow = '0 12px 40px rgba(0,0,0,0.06)',
  hoverBorderColor,
  resetTransform = 'translateY(0)',
  resetBoxShadow = 'none',
  resetBorderColor,
}: HoverCardProps) {
  return (
    <div
      className={className}
      style={style}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = hoverTransform;
        e.currentTarget.style.boxShadow = hoverBoxShadow;
        if (hoverBorderColor) e.currentTarget.style.borderColor = hoverBorderColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = resetTransform;
        e.currentTarget.style.boxShadow = resetBoxShadow;
        if (resetBorderColor) e.currentTarget.style.borderColor = resetBorderColor;
      }}
    >
      {children}
    </div>
  );
}
