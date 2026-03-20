'use client';

import Link from 'next/link';
import { useThemeStore } from '@/stores/useThemeStore';
import { CHANGELOG, type ChangelogEntry } from '@/lib/changelog';

const TYPE_CONFIG: Record<ChangelogEntry['type'], { label: string; color: string }> = {
  feature: { label: 'Новое', color: '#2dd4a0' },
  fix: { label: 'Исправление', color: '#ef4444' },
  improvement: { label: 'Улучшение', color: '#3a7bfd' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
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
          &larr; На главную
        </Link>
      </header>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '48px 24px 16px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
          Changelog
        </h1>
        <p style={{ color: C.sub, fontSize: 16, marginTop: 8 }}>
          Последние обновления и улучшения TubeForge
        </p>
      </div>

      {/* Timeline */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div style={{ position: 'relative' }}>
          {/* Vertical line */}
          <div
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
                  style={{
                    display: 'flex',
                    gap: 24,
                    paddingBottom: 32,
                    position: 'relative',
                  }}
                >
                  {/* Dot */}
                  <div
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
