'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { HELP_ARTICLES, HELP_CATEGORIES, type HelpArticle } from '@/lib/help-articles';

type Category = HelpArticle['category'] | 'all';

export default function HelpPage() {
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
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ffffff',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Minimal nav */}
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

      {/* Hero */}
      <div className="tf-help-hero" style={{ textAlign: 'center', padding: '56px 24px 36px' }}>
        <h1
          style={{
            fontSize: 'clamp(28px, 6vw, 40px)',
            fontWeight: 600,
            margin: 0,
            letterSpacing: '-0.02em',
            color: '#ffffff',
          }}
        >
          Help Center
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 17,
            marginTop: 12,
            maxWidth: 480,
            margin: '12px auto 0',
            lineHeight: 1.5,
          }}
        >
          Find answers to frequently asked questions or get in touch with us
        </p>
      </div>

      {/* Search */}
      <div className="tf-help-search" style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px 32px' }}>
        <div style={{ position: 'relative' }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }}
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
              padding: '16px 20px 16px 50px',
              background: '#111111',
              border: '1px solid transparent',
              borderRadius: 24,
              color: '#ffffff',
              fontSize: 16,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color .2s, box-shadow .2s',
              height: 52,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Popular articles -- shown when no search and 'all' category */}
      {!search.trim() && activeCategory === 'all' && (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 36px' }}>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 600,
              margin: '0 0 16px',
              color: '#ffffff',
            }}
          >
            Popular Articles
          </h2>
          <div
            className="tf-help-popular"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {HELP_ARTICLES.slice(0, 5).map((article) => {
              const catInfo = HELP_CATEGORIES[article.category];
              return (
                <button
                  key={article.id}
                  onClick={() => {
                    setExpandedId(article.id);
                    document.getElementById('help-articles')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="popular-card"
                  style={{
                    padding: '18px 18px',
                    background: '#111111',
                    border: 'none',
                    borderRadius: 16,
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#ffffff',
                    transition: 'background .2s, transform .2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{catInfo.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{article.title}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{catInfo.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category pills */}
      <div
        className="tf-help-categories"
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '0 24px 28px',
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
                padding: '8px 20px',
                borderRadius: 20,
                border: 'none',
                background: active ? '#6366f1' : 'rgba(255,255,255,0.04)',
                color: active ? '#ffffff' : 'rgba(255,255,255,0.7)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all .2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {cat.icon && <span style={{ fontSize: 14 }}>{cat.icon}</span>}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Articles */}
      <div id="help-articles" className="tf-help-articles" style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Result count when filtering */}
        {(search.trim() || activeCategory !== 'all') && filtered.length > 0 && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
            {filtered.length === 1
              ? '1 article found'
              : `${filtered.length} articles found`}
          </p>
        )}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 0', color: 'rgba(255,255,255,0.5)' }}>
            <p style={{ fontSize: 20, fontWeight: 600, color: '#ffffff' }}>Nothing found</p>
            <p style={{ fontSize: 15, marginTop: 8 }}>Try changing your query or category</p>
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
                    background: expanded ? '#1a1a1a' : '#111111',
                    border: `1px solid ${expanded ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'all .2s',
                  }}
                >
                  <button
                    onClick={() => setExpandedId(expanded ? null : article.id)}
                    style={{
                      width: '100%',
                      padding: '18px 20px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      textAlign: 'left',
                      color: '#ffffff',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 18,
                        flexShrink: 0,
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: '#111111',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {catInfo.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{article.title}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                        {catInfo.label}
                      </div>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(255,255,255,0.3)"
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
                      className="tf-help-article-body"
                      style={{
                        padding: '0 20px 20px',
                        paddingLeft: 70,
                        fontSize: 15,
                        lineHeight: 1.7,
                        color: 'rgba(255,255,255,0.7)',
                        whiteSpace: 'pre-line',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
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
            marginTop: 56,
            textAlign: 'center',
            padding: '40px 28px',
            background: '#111111',
            borderRadius: 16,
          }}
        >
          <p style={{ fontSize: 20, fontWeight: 600, margin: 0, color: '#ffffff' }}>
            Didn&apos;t find an answer?
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 8 }}>
            Get in touch with our support team
          </p>
          <Link
            href="/contact"
            style={{
              display: 'inline-block',
              marginTop: 20,
              padding: '14px 32px',
              background: '#6366f1',
              color: '#fff',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity .2s',
            }}
          >
            Contact Support
          </Link>
        </div>
      </div>

      {/* Hover styles */}
      <style>{`
        .popular-card:hover {
          background: rgba(255,255,255,0.08) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
