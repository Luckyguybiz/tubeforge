'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const CookieConsent = dynamic(
  () => import('@/components/ui/CookieConsent').then((m) => ({ default: m.CookieConsent })),
  { ssr: false },
);

/**
 * Client wrapper for the lazy-loaded CookieConsent component.
 * Needed because `next/dynamic` with `ssr: false` requires a Client Component.
 */
export function ClientCookieConsent() {
  return (
    <ErrorBoundary>
      <CookieConsent />
    </ErrorBoundary>
  );
}
