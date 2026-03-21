'use client';

import { useState, useCallback } from 'react';

/* ── Colors (dark-only, matching the server page) ─────────────────── */
const C = {
  bg: '#0d0d18',
  border: '#2a2a44',
  text: '#e8e8f0',
  sub: '#8b8b9e',
  dim: '#55556a',
  blue: '#3a7bfd',
  purple: '#8b5cf6',
};

type Language = 'curl' | 'javascript' | 'python';

const LANG_LABELS: Record<Language, string> = {
  curl: 'cURL',
  javascript: 'JavaScript',
  python: 'Python',
};

interface CodeExamplesProps {
  examples: Record<Language, string>;
}

export function CodeExamples({ examples }: CodeExamplesProps) {
  const [active, setActive] = useState<Language>('curl');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(examples[active]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [active, examples]);

  return (
    <div style={{ margin: '12px 0 20px' }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          background: C.bg,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          border: `1px solid ${C.border}`,
          borderBottom: 'none',
          overflow: 'hidden',
        }}
      >
        {(['curl', 'javascript', 'python'] as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => setActive(lang)}
            style={{
              padding: '8px 16px',
              background: active === lang ? `${C.purple}14` : 'transparent',
              border: 'none',
              borderBottom: active === lang ? `2px solid ${C.purple}` : '2px solid transparent',
              color: active === lang ? C.text : C.dim,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .15s',
            }}
          >
            {LANG_LABELS[lang]}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={handleCopy}
          style={{
            padding: '6px 12px',
            marginRight: 8,
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            color: copied ? C.blue : C.dim,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all .15s',
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code block */}
      <pre
        style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderTop: 'none',
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
          padding: '16px 20px',
          fontSize: 13,
          lineHeight: 1.7,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          color: C.text,
          overflow: 'auto',
          whiteSpace: 'pre',
          margin: 0,
        }}
      >
        {examples[active]}
      </pre>
    </div>
  );
}
