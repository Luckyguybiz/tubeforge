'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/** Log error details to structured console output for server-side collection */
function logErrorToConsole(error: Error): void {
  try {
    const entry = {
      level: 'error',
      module: 'error-boundary',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      data: {
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
    };
    console.error(JSON.stringify(entry));
  } catch {
    // Never let logging itself throw
  }
}

function getSuggestions(error: Error, t: (key: string) => string): string[] {
  const msg = error.message?.toLowerCase() ?? '';
  const name = error.name?.toLowerCase() ?? '';

  // Auth / session errors
  if (msg.includes('unauthorized') || msg.includes('unauthenticated') || msg.includes('401') || msg.includes('403') || msg.includes('forbidden'))
    return [t('error.auth.relogin'), t('error.auth.sessionExpired'), t('error.auth.checkAccess')];

  // Rate limiting
  if (msg.includes('too_many_requests') || msg.includes('rate') || msg.includes('429'))
    return [t('error.rate.wait'), t('error.rate.tooMany')];

  // Not found
  if (msg.includes('not_found') || msg.includes('404'))
    return [t('error.notFound.checkUrl'), t('error.notFound.deleted')];

  // Server errors (5xx)
  if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504') || msg.includes('internal server') || msg.includes('bad gateway') || msg.includes('service unavailable'))
    return [t('error.server.retry'), t('error.server.unavailable')];

  // Timeout errors
  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('aborted') || name.includes('abort'))
    return [t('error.timeout.tooLong'), t('error.timeout.checkConnection')];

  // Network / fetch errors
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch') || msg.includes('err_connection') || msg.includes('offline'))
    return [t('error.network.checkInternet'), t('error.network.refresh'), t('error.network.vpn')];

  // Chunk / lazy-load errors (common in Next.js)
  if (msg.includes('chunk') || msg.includes('loading chunk') || msg.includes('dynamically imported module'))
    return [t('error.chunk.updated'), t('error.chunk.clearCache')];

  // Storage errors
  if (msg.includes('quota') || msg.includes('storage') || msg.includes('localstorage'))
    return [t('error.storage.full'), t('error.storage.clear')];

  // Generic fallback
  return [t('error.generic.refresh'), t('error.generic.contact')];
}

export function ErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset?: () => void;
}) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  // Log error on mount
  useEffect(() => {
    logErrorToConsole(error);
  }, [error]);

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        padding: '60px 24px',
        minHeight: 400,
        textAlign: 'center',
      }}
    >
      {/* Decorative error icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: `linear-gradient(135deg, ${C.accent}18, ${C.orange}18)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${C.accent}25, ${C.orange}25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
          }}
        >
          {'\u26A0\uFE0F'}
        </div>
      </div>

      <h2
        style={{
          color: C.text,
          fontSize: 22,
          fontWeight: 700,
          margin: '0 0 8px',
          letterSpacing: '-0.02em',
        }}
      >
        {t('error.title')}
      </h2>

      <p
        style={{
          color: C.sub,
          fontSize: 14,
          lineHeight: 1.6,
          margin: '0 0 24px',
          maxWidth: 400,
        }}
      >
        {t('error.description')}
      </p>

      {/* Error details - collapsible */}
      {error.message && (
        <div style={{ marginBottom: 24, width: '100%', maxWidth: 480 }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
            aria-controls="error-details"
            style={{
              background: 'none',
              border: 'none',
              color: C.dim,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              margin: '0 auto',
              padding: '4px 8px',
              borderRadius: 6,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.sub)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.dim)}
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
            {t('error.details')}
          </button>
          {showDetails && (
            <div
              id="error-details"
              style={{
                marginTop: 8,
                padding: '12px 16px',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                textAlign: 'left',
              }}
            >
              <code
                style={{
                  color: C.accent,
                  fontSize: 12,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                }}
              >
                {error.message}
              </code>
            </div>
          )}
        </div>
      )}

      {/* Recovery suggestions */}
      <div
        style={{
          marginBottom: 24,
          width: '100%',
          maxWidth: 480,
          textAlign: 'left',
        }}
      >
        <p
          style={{
            color: C.sub,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          {t('error.suggestions')}
        </p>
        <ul
          style={{
            margin: 0,
            paddingLeft: 20,
            listStyleType: 'disc',
          }}
        >
          {getSuggestions(error, t).map((s, i) => (
            <li
              key={i}
              style={{
                color: C.sub,
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {reset && (
          <button
            onClick={reset}
            style={{
              padding: '11px 24px',
              background: C.accent,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              boxShadow: `0 2px 12px ${C.accent}33`,
              transition: 'transform 0.1s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = `0 4px 20px ${C.accent}44`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 2px 12px ${C.accent}33`;
            }}
          >
            {t('error.tryAgain')}
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '11px 24px',
            background: C.surface,
            color: C.text,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 13,
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
          {t('error.reloadPage')}
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '11px 24px',
            background: C.surface,
            color: C.text,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 13,
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
          {t('error.goHome')}
        </button>
      </div>

      {/* Report this issue */}
      <a
        href={`mailto:support@tubeforge.co?subject=${encodeURIComponent('Bug Report: ' + (error.name || 'Error'))}&body=${encodeURIComponent('Error: ' + (error.message || 'Unknown error') + '\nURL: ' + (typeof window !== 'undefined' ? window.location.href : '') + '\nTime: ' + new Date().toISOString())}`}
        style={{
          marginTop: 16,
          color: C.dim,
          fontSize: 12,
          textDecoration: 'none',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = C.sub)}
        onMouseLeave={(e) => (e.currentTarget.style.color = C.dim)}
      >
        {t('error.reportIssue')}
      </a>
    </div>
  );
}
