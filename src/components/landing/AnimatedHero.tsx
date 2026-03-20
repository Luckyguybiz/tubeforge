'use client';

import { useState, useEffect, type ReactNode } from 'react';

interface AnimatedHeroProps {
  children: ReactNode;
}

/**
 * Client wrapper that triggers a fade-in entrance animation for the hero section.
 * Applies opacity + translateY transition after a short delay.
 */
export function AnimatedHero({ children }: AnimatedHeroProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '0 24px',
        position: 'relative',
        zIndex: 1,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.8s cubic-bezier(.4,0,.2,1), transform 0.8s cubic-bezier(.4,0,.2,1)',
      }}
    >
      {children}
    </div>
  );
}
