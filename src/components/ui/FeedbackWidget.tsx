'use client';

import { useState, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

type FeedbackType = 'bug' | 'feature' | 'question';

const FEEDBACK_TYPES: { key: FeedbackType; label: string; icon: string }[] = [
  { key: 'bug', label: 'Баг', icon: '\uD83D\uDC1B' },
  { key: 'feature', label: 'Идея', icon: '\uD83D\uDCA1' },
  { key: 'question', label: 'Вопрос', icon: '\u2753' },
];

export function FeedbackWidget() {
  const C = useThemeStore((s) => s.theme);
  const addToast = useNotificationStore((s) => s.addToast);

  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(() => {
    if (!text.trim()) {
      addToast('warning', 'Введите описание');
      return;
    }
    setSubmitting(true);

    const payload = {
      type: feedbackType,
      text: text.trim(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
    };

    console.info('[FeedbackWidget]', payload);

    setTimeout(() => {
      addToast('success', 'Спасибо! Мы ответим в течение 24 часов');
      setText('');
      setOpen(false);
      setSubmitting(false);
    }, 500);
  }, [feedbackType, text, addToast]);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Обратная связь"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: C.accent,
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 9990,
          transition: 'transform .2s, box-shadow .2s',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        {open ? '+' : '?'}
      </button>

      {/* Modal panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9991,
              background: 'transparent',
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: 'fixed',
              bottom: 84,
              right: 24,
              width: 340,
              maxWidth: 'calc(100vw - 48px)',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              zIndex: 9992,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px 12px',
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>Обратная связь</div>
              <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
                Сообщите о проблеме или предложите идею
              </div>
            </div>

            <div style={{ padding: '16px 20px 20px' }}>
              {/* Type selector */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {FEEDBACK_TYPES.map((ft) => {
                  const active = feedbackType === ft.key;
                  return (
                    <button
                      key={ft.key}
                      onClick={() => setFeedbackType(ft.key)}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        borderRadius: 10,
                        border: `1px solid ${active ? C.accent : C.border}`,
                        background: active ? C.accentDim : 'transparent',
                        color: active ? C.accent : C.sub,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all .15s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <span>{ft.icon}</span>
                      {ft.label}
                    </button>
                  );
                })}
              </div>

              {/* Text area */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  feedbackType === 'bug'
                    ? 'Опишите проблему...'
                    : feedbackType === 'feature'
                      ? 'Какую функцию вы хотели бы видеть?'
                      : 'Задайте ваш вопрос...'
                }
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  color: C.text,
                  fontSize: 13,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  transition: 'border-color .2s',
                }}
              />

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !text.trim()}
                style={{
                  width: '100%',
                  marginTop: 12,
                  padding: '12px',
                  background: C.accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: submitting || !text.trim() ? 'not-allowed' : 'pointer',
                  opacity: submitting || !text.trim() ? 0.5 : 1,
                  transition: 'opacity .2s',
                }}
              >
                {submitting ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
