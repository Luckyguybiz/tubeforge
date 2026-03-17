'use client';

/**
 * Next.js global error boundary — catches errors in the root layout itself.
 * Must include <html> and <body> tags since the root layout is broken.
 * Uses inline styles only (no theme store, which may itself be broken).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0c0c14',
          color: '#e8e8ed',
          fontFamily: "'Instrument Sans', system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: 'center', padding: 40, maxWidth: 480 }}>
          <span style={{ fontSize: 48 }}>{'\u26A0'}</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '16px 0 8px' }}>
            Что-то пошло не так
          </h1>
          <p style={{ color: '#9e9eaa', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
            Произошла критическая ошибка. Попробуйте обновить страницу.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p
              style={{
                color: '#ff6b6b',
                fontSize: 12,
                background: '#1c1c28',
                padding: '10px 16px',
                borderRadius: 8,
                marginBottom: 20,
                wordBreak: 'break-word',
              }}
            >
              {error.message}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                padding: '10px 24px',
                background: '#ff2d55',
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
            <button
              onClick={() => (window.location.href = '/')}
              style={{
                padding: '10px 24px',
                background: '#1c1c28',
                color: '#e8e8ed',
                border: '1px solid #2c2c3a',
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
      </body>
    </html>
  );
}
