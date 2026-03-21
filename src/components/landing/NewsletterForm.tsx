'use client';

import React, { useState } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '14px 24px',
          borderRadius: 12,
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.2)',
          color: '#22c55e',
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Готово! Вы подписаны на обновления.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: 12,
        maxWidth: 480,
        margin: '0 auto',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
        placeholder="your@email.com"
        style={{
          flex: '1 1 260px',
          minWidth: 0,
          padding: '14px 20px',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
          color: '#ffffff',
          fontSize: 15,
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          padding: '14px 32px',
          borderRadius: 12,
          border: 'none',
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: status === 'loading' ? 'wait' : 'pointer',
          transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
          boxShadow: '0 4px 24px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          opacity: status === 'loading' ? 0.7 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {status === 'loading' ? 'Отправка...' : 'Подписаться'}
      </button>
      {status === 'error' && (
        <p style={{ width: '100%', textAlign: 'center', color: '#ef4444', fontSize: 13, margin: '4px 0 0' }}>
          Проверьте email и попробуйте ещё раз
        </p>
      )}
    </form>
  );
}
