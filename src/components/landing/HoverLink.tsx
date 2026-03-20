'use client';

import type { CSSProperties, ReactNode } from 'react';

interface HoverLinkProps {
  href: string;
  children: ReactNode;
  style?: CSSProperties;
  hoverColor?: string;
  resetColor?: string;
  ariaLabel?: string;
  target?: string;
  rel?: string;
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
  target,
  rel,
}: HoverLinkProps) {
  const isExternal = href.startsWith('http') || href.startsWith('mailto:');
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      style={style}
      target={target ?? (isExternal ? '_blank' : undefined)}
      rel={rel ?? (isExternal ? 'noopener noreferrer' : undefined)}
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
