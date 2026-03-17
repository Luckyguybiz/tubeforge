'use client';

import { useState } from 'react';

/**
 * Next.js global error boundary -- catches errors in the root layout itself.
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
  const [showDetails, setShowDetails] = useState(false);

  /* Hardcoded dark colors since theme store may be broken */
  const bg = '#06060b';
  const surface = '#0c0c14';
  const card = '#111119';
  const border = '#1e1e2e';
  const text = '#e8e8f0';
  const sub = '#7c7c96';
  const dim = '#44445a';
  const accent = '#ff2d55';
  const pink = '#ec4899';

  return (
    <html lang="ru">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Ошибка | TubeForge</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bg,
          color: text,
          fontFamily: "'Instrument Sans', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            maxWidth: 520,
            width: '100%',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${accent}18, ${pink}18)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${accent}25, ${pink}25)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}
            >
              {'\uD83D\uDCA5'}
            </div>
          </div>

          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: '0 0 10px',
              letterSpacing: '-0.02em',
            }}
          >
            Критическая ошибка
          </h1>

          <p
            style={{
              color: sub,
              fontSize: 15,
              lineHeight: 1.6,
              margin: '0 0 28px',
            }}
          >
            Произошла серьёзная ошибка приложения. Попробуйте обновить страницу.
          </p>

          {/* Collapsible error details */}
          {error.message && (
            <div style={{ marginBottom: 28 }}>
              <button
                onClick={() => setShowDetails(!showDetails)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: dim,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 8px',
                  borderRadius: 6,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    transform: showDetails ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s',
                    fontSize: 10,
                  }}
                >
                  {'\u25B6'}
                </span>
                Подробности ошибки
              </button>
              {showDetails && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '12px 16px',
                    background: surface,
                    border: `1px solid ${border}`,
                    borderRadius: 10,
                    textAlign: 'left',
                  }}
                >
                  <code
                    style={{
                      color: accent,
                      fontSize: 12,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                    }}
                  >
                    {error.message}
                  </code>
                  {error.digest && (
                    <div style={{ marginTop: 8, color: dim, fontSize: 11 }}>
                      Digest: {error.digest}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                padding: '12px 28px',
                background: accent,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                boxShadow: `0 2px 16px ${accent}33`,
              }}
            >
              Попробовать снова
            </button>
            <button
              onClick={() => (window.location.href = '/dashboard')}
              style={{
                padding: '12px 24px',
                background: card,
                color: text,
                border: `1px solid ${border}`,
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 14,
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
