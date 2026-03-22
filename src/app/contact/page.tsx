'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useThemeStore } from '@/stores/useThemeStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

const SUBJECTS = [
  'Technical Support',
  'Billing Question',
  'Partnership',
  'Other',
] as const;

const RESPONSE_TIMES = [
  { plan: 'FREE', time: '48 hours', color: '#6b6b82' },
  { plan: 'PRO', time: '24 hours', color: '#3a7bfd' },
  { plan: 'STUDIO', time: '4 hours', color: '#8b5cf6' },
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
      addToast('warning', 'Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    // For now — log and show toast
    console.info('[Contact Form]', { name, email, subject, message });
    setTimeout(() => {
      addToast('success', 'Thank you! We will respond within 24 hours');
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
          &larr; Home
        </Link>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 64px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', textAlign: 'center' }}>
          Contact Us
        </h1>
        <p style={{ color: C.sub, fontSize: 16, textAlign: 'center', marginTop: 8 }}>
          We&apos;re always happy to help. Fill out the form or send us an email.
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
              <label style={labelStyle}>Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
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
              <label style={labelStyle}>Subject</label>
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
              <label style={labelStyle}>Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question..."
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
              {submitting ? 'Sending...' : 'Send'}
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
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Contact Info</div>
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
                Office Hours
              </div>
              <p style={{ fontSize: 14, color: C.sub, margin: 0, lineHeight: 1.6 }}>
                Mon — Fri, 9:00 AM — 6:00 PM UTC
              </p>
              <p style={{ fontSize: 12, color: C.dim, margin: '8px 0 0', lineHeight: 1.5 }}>
                On weekends and holidays, we process requests with a delay. For urgent matters, reach out via Telegram.
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
                Response Time
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
                      up to {rt.time}
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
                Quick Answers
              </div>
              <p style={{ fontSize: 13, color: C.sub, marginBottom: 12 }}>
                The answer might already be in the help center
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
                Help Center &rarr;
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
