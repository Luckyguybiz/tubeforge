'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useThemeStore } from '@/stores/useThemeStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

const SUBJECTS = [
  'Техническая поддержка',
  'Вопрос по оплате',
  'Партнёрство',
  'Другое',
] as const;

const RESPONSE_TIMES = [
  { plan: 'FREE', time: '48 часов', color: '#6b6b82' },
  { plan: 'PRO', time: '24 часа', color: '#3a7bfd' },
  { plan: 'STUDIO', time: '4 часа', color: '#8b5cf6' },
];

export default function ContactPage() {
  const C = useThemeStore((s) => s.theme);
  const addToast = useNotificationStore((s) => s.addToast);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      addToast('warning', 'Заполните все обязательные поля');
      return;
    }
    setSubmitting(true);
    // For now — log and show toast
    console.info('[Contact Form]', { name, email, subject, message });
    setTimeout(() => {
      addToast('success', 'Спасибо! Мы ответим в течение 24 часов');
      setName('');
      setEmail('');
      setSubject(SUBJECTS[0]);
      setMessage('');
      setSubmitting(false);
    }, 600);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.text,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .2s',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: C.sub,
    marginBottom: 6,
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      {/* Header */}
      <header
        style={{
          borderBottom: `1px solid ${C.border}`,
          background: C.surface,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            TF
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>TubeForge</span>
        </Link>
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            color: C.sub,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          &larr; На главную
        </Link>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 64px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', textAlign: 'center' }}>
          Свяжитесь с нами
        </h1>
        <p style={{ color: C.sub, fontSize: 16, textAlign: 'center', marginTop: 8 }}>
          Мы всегда рады помочь. Заполните форму или напишите на email.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 32,
            marginTop: 40,
          }}
          className="tf-contact-grid"
        >
          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={labelStyle}>Имя *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Тема</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Сообщение *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Опишите ваш вопрос..."
                rows={6}
                style={{ ...inputStyle, resize: 'vertical' }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '14px 28px',
                background: C.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                transition: 'opacity .2s',
              }}
            >
              {submitting ? 'Отправка...' : 'Отправить'}
            </button>
          </form>

          {/* Info sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Email */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '24px',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Контакты</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Email</div>
                  <a
                    href="mailto:support@tubeforge.co"
                    style={{ color: C.accent, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                  >
                    support@tubeforge.co
                  </a>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Telegram</div>
                  <a
                    href="https://t.me/tubeforge_support"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: C.accent, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                  >
                    @tubeforge_support
                  </a>
                </div>
              </div>
            </div>

            {/* Office hours */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '24px',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                Часы работы
              </div>
              <p style={{ fontSize: 14, color: C.sub, margin: 0, lineHeight: 1.6 }}>
                Пн — Пт, 9:00 — 18:00 UTC
              </p>
              <p style={{ fontSize: 12, color: C.dim, margin: '8px 0 0', lineHeight: 1.5 }}>
                В выходные и праздники мы обрабатываем запросы с задержкой. Срочные вопросы — пишите в Telegram.
              </p>
            </div>

            {/* Response times */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '24px',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
                Время ответа
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {RESPONSE_TIMES.map((rt) => (
                  <div
                    key={rt.plan}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: rt.color,
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: `${rt.color}15`,
                      }}
                    >
                      {rt.plan}
                    </span>
                    <span style={{ fontSize: 14, color: C.sub, fontWeight: 500 }}>
                      до {rt.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Help center link */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                Быстрые ответы
              </div>
              <p style={{ fontSize: 13, color: C.sub, marginBottom: 12 }}>
                Возможно, ответ уже есть в центре помощи
              </p>
              <Link
                href="/help"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  color: C.text,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'border-color .2s',
                }}
              >
                Центр помощи &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .tf-contact-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
