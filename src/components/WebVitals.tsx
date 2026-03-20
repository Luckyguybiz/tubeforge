'use client';

import { useReportWebVitals } from 'next/web-vitals';

/**
 * Captures Core Web Vitals (CLS, LCP, FID/INP, FCP, TTFB).
 * In development: logs to console. In production: silent (extend to send to analytics).
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[web-vital] ${metric.name}: ${Math.round(metric.value * 100) / 100}`, metric.rating ?? '');
    }
    // TODO: In production, send to analytics endpoint
    // e.g. navigator.sendBeacon('/api/vitals', JSON.stringify(metric));
  });

  return null;
}
