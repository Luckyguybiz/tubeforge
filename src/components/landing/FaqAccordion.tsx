'use client';

import { useState } from 'react';

const GRAY_100 = '#f3f4f6';
const GRAY_400 = '#9ca3af';
const GRAY_500 = '#6b7280';
const GRAY_900 = '#111827';
const WHITE = '#ffffff';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, i) => {
        const isOpen = openFaq === i;
        return (
          <div key={i} style={{ background: WHITE, borderRadius: 14, border: `1px solid ${isOpen ? 'rgba(99,102,241,0.3)' : GRAY_100}`, overflow: 'hidden', transition: 'border-color 0.2s ease' }}>
            <button
              onClick={() => toggleFaq(i)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
            >
              <span style={{ fontSize: 16, fontWeight: 600, color: GRAY_900 }}>{item.q}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GRAY_400} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.3s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div style={{ maxHeight: isOpen ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease, padding 0.3s ease', padding: isOpen ? '0 24px 20px' : '0 24px 0' }}>
              <p style={{ fontSize: 15, color: GRAY_500, lineHeight: 1.65, margin: 0 }}>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
