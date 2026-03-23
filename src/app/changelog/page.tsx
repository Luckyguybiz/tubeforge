'use client';

import Link from 'next/link';
import { useThemeStore } from '@/stores/useThemeStore';
import { CHANGELOG, type ChangelogEntry } from '@/lib/changelog';

const TYPE_CONFIG: Record<ChangelogEntry['type'], { label: string; color: string }> = {
  feature: { label: 'New', color: '#2dd4a0' },
  fix: { label: 'Fix', color: '#ef4444' },
  improvement: { label: 'Improvement', color: '#3a7bfd' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ChangelogPage() {
  const C = useThemeStore((s) => s.theme);

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

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '48px 24px 16px' }}>
        <h1 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
          Changelog
        </h1>
        <p style={{ color: C.sub, fontSize: 16, marginTop: 8 }}>
          Latest updates and improvements to TubeForge
        </p>
      </div>

      {/* Timeline */}
      <div className="tf-changelog-container" style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div className="tf-changelog-timeline" style={{ position: 'relative' }}>
          {/* Vertical line */}
          <div
            className="tf-changelog-line"
            style={{
              position: 'absolute',
              left: 15,
              top: 8,
              bottom: 8,
              width: 2,
              background: C.border,
              borderRadius: 1,
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {CHANGELOG.map((entry, i) => {
              const cfg = TYPE_CONFIG[entry.type];
              return (
                <div
                  key={`${entry.date}-${i}`}
                  className="tf-changelog-entry"
                  style={{
                    display: 'flex',
                    gap: 24,
                    paddingBottom: 32,
                    position: 'relative',
                  }}
                >
                  {/* Dot */}
                  <div
                    className="tf-changelog-dot"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: C.card,
                      border: `2px solid ${cfg.color}`,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: cfg.color,
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        flexWrap: 'wrap',
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: cfg.color,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: `${cfg.color}15`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: 13, color: C.dim }}>
                        {formatDate(entry.date)}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        margin: '4px 0 6px',
                      }}
                    >
                      {entry.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.65,
                        color: C.sub,
                        margin: 0,
                      }}
                    >
                      {entry.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
