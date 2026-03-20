'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

interface HoverButtonProps {
  href: string;
  children: ReactNode;
  style?: CSSProperties;
  hoverTransform?: string;
  hoverBoxShadow?: string;
  hoverBackground?: string;
  resetTransform?: string;
  resetBoxShadow?: string;
  resetBackground?: string;
  /** Use anchor tag instead of Next Link (for hash links) */
  isAnchor?: boolean;
}

/**
 * Thin client wrapper for buttons/links that need hover style changes via JS.
 */
export function HoverButton({
  href,
  children,
  style,
  hoverTransform,
  hoverBoxShadow,
  hoverBackground,
  resetTransform,
  resetBoxShadow,
  resetBackground,
  isAnchor = false,
}: HoverButtonProps) {
  const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (hoverTransform) e.currentTarget.style.transform = hoverTransform;
    if (hoverBoxShadow) e.currentTarget.style.boxShadow = hoverBoxShadow;
    if (hoverBackground) e.currentTarget.style.background = hoverBackground;
  };
  const handleLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (resetTransform) e.currentTarget.style.transform = resetTransform;
    if (resetBoxShadow) e.currentTarget.style.boxShadow = resetBoxShadow;
    if (resetBackground) e.currentTarget.style.background = resetBackground;
  };

  if (isAnchor) {
    return (
      <a href={href} style={style} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} style={style} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
    </Link>
  );
}
