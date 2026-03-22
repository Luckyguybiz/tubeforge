'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useThemeStore } from '@/stores/useThemeStore';
import { HELP_ARTICLES, HELP_CATEGORIES, type HelpArticle } from '@/lib/help-articles';

type Category = HelpArticle['category'] | 'all';

export default function HelpPage() {
  const C = useThemeStore((s) => s.theme);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let articles = HELP_ARTICLES;
    if (activeCategory !== 'all') {
      articles = articles.filter((a) => a.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      articles = articles.filter(
        (a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q),
      );
    }
    return articles;
  }, [search, activeCategory]);

  const categories: { key: Category; label: string; icon?: string }[] = [
    { key: 'all', label: 'All' },
    ...Object.entries(HELP_CATEGORIES).map(([key, val]) => ({
      key: key as HelpArticle['category'],
      label: val.label,
      icon: val.icon,
    })),
  ];

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
            transition: 'color .2s',
          }}
        >
          &larr; Home
        </Link>
      </header>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '48px 24px 32px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
          Help Center
        </h1>
        <p style={{ color: C.sub, fontSize: 16, marginTop: 8, maxWidth: 480, margin: '8px auto 0' }}>
          Find answers to frequently asked questions or get in touch with us
        </p>
      </div>

      {/* Search */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px 24px' }}>
        <div style={{ position: 'relative' }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={C.dim}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px 14px 44px',
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              color: C.text,
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color .2s',
            }}
          />
        </div>
      </div>

      {/* Popular articles — shown when no search and 'all' category */}
      {!search.trim() && activeCategory === 'all' && (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 28px' }}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              margin: '0 0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>&#9733;</span> Popular Articles
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {HELP_ARTICLES.slice(0, 5).map((article) => {
              const catInfo = HELP_CATEGORIES[article.category];
              return (
                <button
                  key={article.id}
                  onClick={() => {
                    setExpandedId(article.id);
                    // scroll to articles section
                    document.getElementById('help-articles')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    padding: '14px 16px',
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: C.text,
                    transition: 'border-color .2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{catInfo.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{article.title}</span>
                  <span style={{ fontSize: 11, color: C.dim }}>{catInfo.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category pills */}
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '0 24px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
        }}
      >
        {categories.map((cat) => {
          const active = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: `1px solid ${active ? C.accent : C.border}`,
                background: active ? C.accentDim : 'transparent',
                color: active ? C.accent : C.sub,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all .2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Articles */}
      <div id="help-articles" style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 64px' }}>
        {/* Result count when filtering */}
        {(search.trim() || activeCategory !== 'all') && filtered.length > 0 && (
          <p style={{ fontSize: 13, color: C.dim, marginBottom: 12 }}>
            {filtered.length === 1
              ? '1 article found'
              : `${filtered.length} articles found`}
          </p>
        )}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: C.dim }}>
            <p style={{ fontSize: 18, fontWeight: 600 }}>Nothing found</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>Try changing your query or category</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((article) => {
              const expanded = expandedId === article.id;
              const catInfo = HELP_CATEGORIES[article.category];
              return (
                <div
                  key={article.id}
                  style={{
                    background: C.card,
                    border: `1px solid ${expanded ? C.borderActive : C.border}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'border-color .2s',
                  }}
                >
                  <button
                    onClick={() => setExpandedId(expanded ? null : article.id)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      textAlign: 'left',
                      color: C.text,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        flexShrink: 0,
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: C.accentDim,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {catInfo.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{article.title}</div>
                      <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
                        {catInfo.label}
                      </div>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={C.dim}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        flexShrink: 0,
                        transition: 'transform .2s',
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {expanded && (
                    <div
                      style={{
                        padding: '0 20px 20px',
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: C.sub,
                        whiteSpace: 'pre-line',
                        borderTop: `1px solid ${C.border}`,
                        paddingTop: 16,
                      }}
                    >
                      {article.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Contact CTA */}
        <div
          style={{
            marginTop: 48,
            textAlign: 'center',
            padding: '32px 24px',
            background: C.card,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Didn&apos;t find an answer?</p>
          <p style={{ color: C.sub, fontSize: 14, marginTop: 8 }}>
            Get in touch with our support team
          </p>
          <Link
            href="/contact"
            style={{
              display: 'inline-block',
              marginTop: 16,
              padding: '12px 28px',
              background: C.accent,
              color: '#fff',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity .2s',
            }}
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
