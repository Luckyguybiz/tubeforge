'use client';
import { useState } from 'react';

const PRODUCTS = [
  {
    id: 'thumbnails',
    label: 'AI Thumbnails',
    icon: '\u{1F3A8}',
    title: 'Create Viral Thumbnails with AI',
    desc: 'Describe your idea, choose a style, and get professional YouTube thumbnails in seconds. Includes CTR score analysis and title suggestions.',
    href: '/ai-thumbnails',
    mockup: 'thumbnails',
  },
  {
    id: 'editor',
    label: 'Video Editor',
    icon: '\u{1F3AC}',
    title: 'AI-Powered Video Creation',
    desc: 'Scene-based video editor with 24+ animation presets. Upload an image, choose a style, and generate animated content for YouTube and TikTok.',
    href: '/editor',
    mockup: 'editor',
  },
  {
    id: 'seo',
    label: 'SEO Tools',
    icon: '\u{1F50D}',
    title: 'Optimize Your YouTube SEO',
    desc: "AI-powered title, description, and tag optimizer. Analyze any video's SEO score and get actionable improvement suggestions.",
    href: '/preview?tab=seo',
    mockup: 'seo',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '\u{1F4CA}',
    title: 'YouTube & TikTok Analytics',
    desc: 'Track your Shorts and TikTok performance. View engagement metrics, trending content, and growth insights.',
    href: '/analytics',
    mockup: 'analytics',
  },
  {
    id: 'free-tools',
    label: 'Free Tools',
    icon: '\u{1F6E0}',
    title: '10+ Free YouTube Tools',
    desc: 'Title generator, tag generator, description writer, money calculator, and more. All free, no signup required.',
    href: '/free-tools',
    mockup: 'free',
  },
];

export function ProductDemo() {
  const [active, setActive] = useState(0);
  const product = PRODUCTS[active];

  return (
    <section style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 8 }}>
        One Platform for Everything YouTube
      </h2>
      <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 40 }}>
        Everything you need to create, optimize, and grow your channel
      </p>

      {/* Tab pills -- horizontal scroll on mobile */}
      <div className="product-demo-tabs" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {PRODUCTS.map((p, i) => (
          <button key={p.id} onClick={() => setActive(i)} style={{
            padding: '10px 20px', borderRadius: 10,
            border: active === i ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
            background: active === i ? 'rgba(99,102,241,0.1)' : 'transparent',
            color: active === i ? '#818cf8' : 'rgba(255,255,255,0.5)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            <span>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>

      {/* Mockup area */}
      <div className="product-demo-card" style={{
        background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20, padding: 32, display: 'flex', gap: 32,
        alignItems: 'center', minHeight: 400,
        transition: 'all 0.3s ease',
      }}>
        {/* Left: mockup visual */}
        <div style={{
          flex: 1, aspectRatio: '16/10', borderRadius: 14,
          background: 'linear-gradient(135deg, #6366f120, #8b5cf620)',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          minWidth: 0,
        }}>
          {/* Placeholder for future video/screenshot */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{product.icon}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
              Interactive demo coming soon
            </div>
          </div>
        </div>

        {/* Right: description */}
        <div className="product-demo-desc" style={{ flex: 1, maxWidth: 400 }}>
          <h3 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            {product.title}
          </h3>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 24 }}>
            {product.desc}
          </p>
          <a href={product.href} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 28px', borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            color: '#fff', fontSize: 14, fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
            transition: 'all 0.2s ease',
          }}>
            Try it Free &rarr;
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .product-demo-tabs {
            flex-wrap: nowrap !important;
            justify-content: flex-start !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding-bottom: 4px;
          }
          .product-demo-tabs::-webkit-scrollbar { display: none; }
          .product-demo-card {
            flex-direction: column !important;
            padding: 20px !important;
            min-height: auto !important;
          }
          .product-demo-card > div:first-child {
            width: 100% !important;
            aspect-ratio: 16/10;
          }
          .product-demo-desc {
            max-width: 100% !important;
            text-align: center;
          }
          .product-demo-desc a {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
}
