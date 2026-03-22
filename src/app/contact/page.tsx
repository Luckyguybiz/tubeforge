'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useNotificationStore } from '@/stores/useNotificationStore';

const SUBJECTS = [
  'Technical Support',
  'Billing Question',
  'Partnership',
  'Other',
] as const;

const RESPONSE_TIMES = [
  { plan: 'FREE', time: '48 hours', color: '#86868b' },
  { plan: 'PRO', time: '24 hours', color: '#007aff' },
  { plan: 'STUDIO', time: '4 hours', color: '#af52de' },
];

export default function ContactPage() {
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
    padding: '14px 16px',
    background: '#f5f5f7',
    border: '1px solid transparent',
    borderRadius: 12,
    color: '#1d1d1f',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .2s, box-shadow .2s',
    fontFamily: 'inherit',
    height: 48,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#86868b',
    marginBottom: 8,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        color: '#1d1d1f',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid #e5e5ea',
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
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            TF
          </div>
          <span style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f' }}>TubeForge</span>
        </Link>
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            color: '#6366f1',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          &larr; Home
        </Link>
      </header>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '56px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1
            style={{
              fontSize: 40,
              fontWeight: 600,
              margin: 0,
              letterSpacing: '-0.02em',
              color: '#1d1d1f',
            }}
          >
            Contact Us
          </h1>
          <p
            style={{
              color: '#86868b',
              fontSize: 17,
              textAlign: 'center',
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            We&apos;re always happy to help. Fill out the form or send us an email.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            gap: 48,
          }}
          className="tf-contact-grid"
        >
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              maxWidth: 560,
            }}
          >
            <div>
              <label style={labelStyle}>Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
                required
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,.08)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }}
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
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,.08)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                  appearance: 'auto',
                }}
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
                style={{ ...inputStyle, resize: 'vertical', height: 'auto' }}
                required
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,.08)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '14px 28px',
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                transition: 'opacity .2s',
                height: 48,
              }}
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>

          {/* Info sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Email */}
            <div
              style={{
                background: '#f5f5f7',
                borderRadius: 16,
                padding: '28px 24px',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#1d1d1f' }}>
                Contact Info
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#86868b', marginBottom: 4, fontWeight: 500 }}>
                    Email
                  </div>
                  <a
                    href="mailto:support@tubeforge.co"
                    style={{ color: '#6366f1', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}
                  >
                    support@tubeforge.co
                  </a>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#86868b', marginBottom: 4, fontWeight: 500 }}>
                    Telegram
                  </div>
                  <a
                    href="https://t.me/tubeforge_support"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#6366f1', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}
                  >
                    @tubeforge_support
                  </a>
                </div>
              </div>
            </div>

            {/* Office hours */}
            <div
              style={{
                background: '#f5f5f7',
                borderRadius: 16,
                padding: '28px 24px',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#1d1d1f' }}>
                Office Hours
              </div>
              <p style={{ fontSize: 15, color: '#3d3d42', margin: 0, lineHeight: 1.6 }}>
                Mon — Fri, 9:00 AM — 6:00 PM UTC
              </p>
              <p style={{ fontSize: 13, color: '#86868b', margin: '10px 0 0', lineHeight: 1.5 }}>
                On weekends and holidays, we process requests with a delay. For urgent matters, reach out via Telegram.
              </p>
            </div>

            {/* Response times */}
            <div
              style={{
                background: '#f5f5f7',
                borderRadius: 16,
                padding: '28px 24px',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 18, color: '#1d1d1f' }}>
                Response Time
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                        fontWeight: 600,
                        color: rt.color,
                        padding: '4px 12px',
                        borderRadius: 8,
                        background: rt.color === '#86868b' ? '#e5e5ea' : `${rt.color}12`,
                      }}
                    >
                      {rt.plan}
                    </span>
                    <span style={{ fontSize: 14, color: '#3d3d42', fontWeight: 500 }}>
                      up to {rt.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Help center link */}
            <div
              style={{
                background: '#f5f5f7',
                borderRadius: 16,
                padding: '28px 24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#1d1d1f' }}>
                Quick Answers
              </div>
              <p style={{ fontSize: 14, color: '#86868b', marginBottom: 16 }}>
                The answer might already be in the help center
              </p>
              <Link
                href="/help"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: '#ffffff',
                  border: '1px solid #e5e5ea',
                  borderRadius: 12,
                  color: '#1d1d1f',
                  fontSize: 14,
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
        a:hover {
          text-decoration: underline !important;
        }
        header a:hover {
          text-decoration: none !important;
        }
      `}</style>
    </div>
  );
}
