'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { createLogger } from '@/lib/logger';

const log = createLogger('web-vitals');

/**
 * Captures Core Web Vitals (CLS, LCP, FID/INP, FCP, TTFB).
 * Logs all metrics via the structured logger in both dev and production.
 * In production, also sends metrics via sendBeacon for server-side collection.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    log.info('Web vital', { name: metric.name, value: metric.value, rating: metric.rating });

    // In production, also send to analytics endpoint via sendBeacon (fire-and-forget)
    if (process.env.NODE_ENV === 'production' && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/vitals', JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      }));
    }
  });

  return null;
}
