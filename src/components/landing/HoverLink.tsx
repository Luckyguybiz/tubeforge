'use client';

import type { CSSProperties, ReactNode } from 'react';

interface HoverLinkProps {
  href: string;
  children: ReactNode;
  style?: CSSProperties;
  hoverColor?: string;
  resetColor?: string;
  ariaLabel?: string;
}

/**
 * Thin client wrapper for anchor tags that need hover color changes.
 */
export function HoverLink({
  href,
  children,
  style,
  hoverColor,
  resetColor,
  ariaLabel,
}: HoverLinkProps) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      style={style}
      onMouseEnter={(e) => {
        if (hoverColor) e.currentTarget.style.color = hoverColor;
      }}
      onMouseLeave={(e) => {
        if (resetColor) e.currentTarget.style.color = resetColor;
      }}
    >
      {children}
    </a>
  );
}
