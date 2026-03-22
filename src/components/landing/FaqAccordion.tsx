'use client';

import { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((item, i) => {
        const isOpen = openFaq === i;
        return (
          <div
            key={i}
            style={{
              borderTop: i === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setOpenFaq(prev => prev === i ? null : i)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '20px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 17, fontWeight: 600, color: '#ffffff' }}>{item.q}</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  flexShrink: 0,
                  transition: 'transform 0.3s ease',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div
              style={{
                maxHeight: isOpen ? 300 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.35s cubic-bezier(.4,0,.2,1), padding 0.35s cubic-bezier(.4,0,.2,1)',
                padding: isOpen ? '0 0 20px' : '0 0 0',
              }}
            >
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
