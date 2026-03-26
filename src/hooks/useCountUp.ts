'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number counting up from 0 to `end` over `duration` ms.
 * Uses requestAnimationFrame for smooth 60fps updates.
 */
export function useCountUp(end: number, duration = 800): number {
  const [value, setValue] = useState(0);
  const prevEnd = useRef(0);

  useEffect(() => {
    if (end === 0 || !isFinite(end)) {
      setValue(end);
      return;
    }

    const start = prevEnd.current;
    prevEnd.current = end;
    const diff = end - start;
    if (diff === 0) return;

    const startTime = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + diff * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  return value;
}
