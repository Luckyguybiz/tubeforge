'use client';

import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';

export function ErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset?: () => void;
}) {
  const C = useThemeStore((s) => s.theme);
  const router = useRouter();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 40,
        minHeight: 300,
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 48 }}>{'\u26A0'}</span>
      <h2 style={{ color: C.text, fontSize: 20, fontWeight: 600 }}>
        Что-то пошло не так
      </h2>
      {process.env.NODE_ENV === 'development' && (
        <p style={{ color: C.sub, fontSize: 13, maxWidth: 480 }}>
          {error.message}
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        {reset && (
          <button
            onClick={reset}
            style={{
              padding: '10px 20px',
              background: C.accent,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            Попробовать снова
          </button>
        )}
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '10px 20px',
            background: C.surface,
            color: C.text,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          На главную
        </button>
      </div>
    </div>
  );
}
