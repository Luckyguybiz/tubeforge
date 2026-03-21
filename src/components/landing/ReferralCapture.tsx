'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Invisible client component that captures `?ref=CODE` from the URL
 * and persists it to localStorage so it survives the signup flow.
 * Mounted on the landing page inside a <Suspense> boundary.
 */
export function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      const refCode = searchParams.get('ref');
      if (refCode) {
        localStorage.setItem('tf-ref', refCode);
      }
    } catch {
      /* localStorage unavailable */
    }
  }, [searchParams]);

  return null;
}
