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
  { plan: 'FREE', time: '48 hours', color: 'rgba(255,255,255,0.5)' },
  { plan: 'PRO', time: '24 hours', color: '#007aff' },
  { plan: 'STUDIO', time: '4 hours', color: '#af52de' },
];

export default function ContactPage() {
  const addToast = useNotificationStore((s) => s.addToast);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      addToast('warning', 'Please fill in all required fields');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      addToast('warning', 'Please enter a valid email address');
      return;
    }
    if (message.trim().length < 10) {
      addToast('warning', 'Message must be at least 10 characters');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject,
          message: message.trim(),
          website,
        }),
      });
      if (res.status === 429) {
        addToast('warning', 'Too many submissions. Please try again later.');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Something went wrong' }));
        addToast('error', data.error || 'Failed to send message');
        return;
      }
      setSubmittedEmail(email.trim());
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject(SUBJECTS[0]);
      setMessage('');
      setWebsite('');
    } catch {
      addToast('error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: '#111111',
    border: '1px solid transparent',
    borderRadius: 12,
    color: '#ffffff',
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
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ffffff',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
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
          <span style={{ fontSize: 17, fontWeight: 600, color: '#ffffff' }}>TubeForge</span>
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
              color: '#ffffff',
            }}
          >
            Contact Us
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.5)',
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
          {/* Form / Success state */}
          {submitted ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
                maxWidth: 560,
                padding: '48px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(34,197,94,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: '#ffffff' }}>
                Message Sent
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6, maxWidth: 400 }}>
                Thank you for reaching out. We&apos;ll respond within 24 hours.
                Check your inbox at <strong style={{ color: '#ffffff' }}>{submittedEmail}</strong> for our reply.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                style={{
                  marginTop: 8,
                  padding: '12px 28px',
                  background: '#111111',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background .2s',
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
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
                maxLength={200}
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
                maxLength={320}
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
                maxLength={5000}
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
            {/* Honeypot field -- hidden from real users, bots tend to fill it */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
              <label htmlFor="tf-website">Website</label>
              <input
                type="text"
                id="tf-website"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
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
          )}

          {/* Info sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Email */}
            <div
              style={{
                background: '#111111',
                borderRadius: 16,
                padding: '28px 24px',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#ffffff' }}>
                Contact Info
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 500 }}>
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
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 500 }}>
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
                background: '#111111',
                borderRadius: 16,
                padding: '28px 24px',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#ffffff' }}>
                Office Hours
              </div>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6 }}>
                Mon — Fri, 9:00 AM — 6:00 PM UTC
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '10px 0 0', lineHeight: 1.5 }}>
                On weekends and holidays, we process requests with a delay. For urgent matters, reach out via Telegram.
              </p>
            </div>

            {/* Response times */}
            <div
              style={{
                background: '#111111',
                borderRadius: 16,
                padding: '28px 24px',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 18, color: '#ffffff' }}>
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
                        background: rt.color === 'rgba(255,255,255,0.5)' ? 'rgba(255,255,255,0.08)' : `${rt.color}12`,
                      }}
                    >
                      {rt.plan}
                    </span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                      up to {rt.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Help center link */}
            <div
              style={{
                background: '#111111',
                borderRadius: 16,
                padding: '28px 24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#ffffff' }}>
                Quick Answers
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
                The answer might already be in the help center
              </p>
              <Link
                href="/help"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: '#0a0a0a',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  color: '#ffffff',
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
