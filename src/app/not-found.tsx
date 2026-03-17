'use client';

import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';

const fallbackTheme = {
  bg: '#06060b',
  surface: '#0c0c14',
  card: '#111119',
  border: '#1e1e2e',
  borderActive: '#2e2e44',
  accent: '#ff2d55',
  purple: '#8b5cf6',
  pink: '#ec4899',
  text: '#e8e8f0',
  sub: '#7c7c96',
  dim: '#44445a',
};

export default function NotFound() {
  let C: typeof fallbackTheme;
  try {
    C = useThemeStore((s) => s.theme);
  } catch {
    C = fallbackTheme;
  }

  const router = useRouter();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        fontFamily: 'var(--font-sans), system-ui, sans-serif',
        padding: '40px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.accent}08, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '15%',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.purple}08, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Fun illustration */}
      <div
        style={{
          position: 'relative',
          marginBottom: 32,
        }}
      >
        {/* Planet / orbit decoration */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.surface}, ${C.card})`,
            border: `2px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: `0 8px 40px ${C.accent}10, inset 0 -4px 12px ${C.border}`,
          }}
        >
          <span style={{ fontSize: 56, lineHeight: 1, userSelect: 'none' }}>
            {'\uD83D\uDE35\u200D\uD83D\uDCAB'}
          </span>
        </div>
        {/* Orbiting satellite */}
        <div
          style={{
            position: 'absolute',
            top: -8,
            right: -12,
            fontSize: 28,
            animation: 'float 3s ease-in-out infinite',
          }}
        >
          {'\uD83D\uDE80'}
        </div>
        {/* Star accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: -16,
            fontSize: 20,
            opacity: 0.6,
            animation: 'float 2.5s ease-in-out infinite reverse',
          }}
        >
          {'\u2728'}
        </div>
      </div>

      {/* 404 number */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          marginBottom: 12,
        }}
      >
        404
      </div>

      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          margin: '0 0 10px',
          letterSpacing: '-0.02em',
        }}
      >
        Страница не найдена
      </h2>

      <p
        style={{
          color: C.sub,
          fontSize: 15,
          lineHeight: 1.6,
          textAlign: 'center',
          maxWidth: 380,
          margin: '0 0 32px',
        }}
      >
        Такой страницы не существует или она была удалена. Возможно, вы перешли по устаревшей ссылке.
      </p>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '12px 28px',
            background: C.accent,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'inherit',
            boxShadow: `0 2px 16px ${C.accent}33`,
            transition: 'transform 0.1s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = `0 4px 24px ${C.accent}44`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 2px 16px ${C.accent}33`;
          }}
        >
          Вернуться на главную
        </button>
        <button
          onClick={() => router.back()}
          style={{
            padding: '12px 24px',
            background: C.surface,
            color: C.text,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'inherit',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.borderActive;
            e.currentTarget.style.background = C.card;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.background = C.surface;
          }}
        >
          Назад
        </button>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
