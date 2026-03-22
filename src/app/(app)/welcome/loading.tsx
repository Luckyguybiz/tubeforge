'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';

/** Welcome / onboarding skeleton: centered card with steps */
export default function WelcomeLoading() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div
      style={{
        maxWidth: 560,
        margin: '40px auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}
    >
      {/* Logo / icon */}
      <Skeleton height={64} width={64} rounded />

      {/* Title + subtitle */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton height={28} width={240} style={{ margin: '0 auto' }} />
        <Skeleton height={14} width={320} style={{ margin: '0 auto' }} />
      </div>

      {/* Step cards */}
      <div
        style={{
          width: '100%',
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Skeleton height={40} width={40} rounded />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skeleton height={14} width={`${70 - i * 10}%`} />
              <Skeleton height={10} width={`${50 - i * 5}%`} />
            </div>
          </div>
        ))}
      </div>

      <Skeleton height={42} width={200} rounded />
    </div>
  );
}
