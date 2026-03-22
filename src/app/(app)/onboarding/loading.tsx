'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Onboarding page skeleton: centered card with quiz steps */
export default function OnboardingLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div style={{ maxWidth: 520, margin: '60px auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '0 20px' }}>
      {/* Progress bar */}
      <Skeleton height={6} width="100%" />

      {/* Question card */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <Skeleton height={24} width="70%" />
        <Skeleton height={14} width="90%" />

        {/* Option buttons */}
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={48} width="100%" rounded />
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton height={38} width={100} rounded />
        <Skeleton height={38} width={100} rounded />
      </div>
    </div>
  );
}
