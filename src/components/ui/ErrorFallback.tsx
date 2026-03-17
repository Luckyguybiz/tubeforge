'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';

function getSuggestions(error: Error): string[] {
  const msg = error.message?.toLowerCase() ?? '';
  const name = error.name?.toLowerCase() ?? '';

  // Auth / session errors
  if (msg.includes('unauthorized') || msg.includes('unauthenticated') || msg.includes('401') || msg.includes('403') || msg.includes('forbidden'))
    return ['Попробуйте войти заново', 'Возможно, сессия истекла', 'Проверьте, что у вас есть доступ к этому ресурсу'];

  // Rate limiting
  if (msg.includes('too_many_requests') || msg.includes('rate') || msg.includes('429'))
    return ['Подождите минуту и попробуйте снова', 'Вы отправили слишком много запросов'];

  // Not found
  if (msg.includes('not_found') || msg.includes('404'))
    return ['Проверьте URL', 'Возможно, ресурс был удалён'];

  // Server errors (5xx)
  if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504') || msg.includes('internal server') || msg.includes('bad gateway') || msg.includes('service unavailable'))
    return ['Ошибка на сервере — попробуйте обновить страницу через несколько секунд', 'Если ошибка повторяется, сервис может быть временно недоступен'];

  // Timeout errors
  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('aborted') || name.includes('abort'))
    return ['Запрос занял слишком много времени', 'Проверьте подключение к интернету и попробуйте снова'];

  // Network / fetch errors
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch') || msg.includes('err_connection') || msg.includes('offline'))
    return ['Проверьте подключение к интернету', 'Попробуйте обновить страницу', 'Убедитесь, что VPN или прокси не блокирует соединение'];

  // Chunk / lazy-load errors (common in Next.js)
  if (msg.includes('chunk') || msg.includes('loading chunk') || msg.includes('dynamically imported module'))
    return ['Приложение было обновлено — обновите страницу', 'Очистите кэш браузера, если ошибка повторяется'];

  // Storage errors
  if (msg.includes('quota') || msg.includes('storage') || msg.includes('localstorage'))
    return ['Хранилище браузера переполнено', 'Очистите данные сайта в настройках браузера'];

  // Generic fallback
  return ['Обновите страницу', 'Если проблема повторяется, напишите в поддержку'];
}

export function ErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset?: () => void;
}) {
  const C = useThemeStore((s) => s.theme);
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
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
        Что-то пошло не так
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
        Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернуться на главную.
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
            Подробности ошибки
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
          Рекомендации:
        </p>
        <ul
          style={{
            margin: 0,
            paddingLeft: 20,
            listStyleType: 'disc',
          }}
        >
          {getSuggestions(error).map((s, i) => (
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
      <div style={{ display: 'flex', gap: 10 }}>
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
            Попробовать снова
          </button>
        )}
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
          На главную
        </button>
      </div>
    </div>
  );
}
