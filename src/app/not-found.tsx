'use client';

import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';

export default function NotFound() {
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
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        fontFamily: 'var(--font-sans), sans-serif',
      }}
    >
      <span style={{ fontSize: 64, fontWeight: 700, color: C.accent }}>404</span>
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>Страница не найдена</h2>
      <p style={{ color: C.sub, fontSize: 14 }}>
        Такой страницы не существует или она была удалена.
      </p>
      <button
        onClick={() => router.push('/dashboard')}
        style={{
          marginTop: 8,
          padding: '10px 24px',
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
        На главную
      </button>
    </div>
  );
}
