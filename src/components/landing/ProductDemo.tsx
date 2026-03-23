'use client';
import { useState, useRef, useEffect } from 'react';

/* ── Mockup Components ─────────────────────────────────────────── */

function ThumbnailsMockup() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0e0e14', borderRadius: 14, overflow: 'hidden' }}>
      {/* Left panel */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '35%', background: '#141420', borderRight: '1px solid rgba(255,255,255,0.06)', padding: 16, display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: '60%', height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.12)', marginBottom: 12 }} />
        <div style={{ width: '100%', height: 56, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12, padding: 10 }}>
          <div style={{ width: '90%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', marginBottom: 6 }} />
          <div style={{ width: '60%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)' }} />
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Style</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {['Realistic', 'Anime', '3D', 'Comic'].map(s => (
            <div key={s} style={{
              padding: '4px 10px', borderRadius: 12,
              background: s === 'Realistic' ? '#6366f120' : 'rgba(255,255,255,0.04)',
              border: s === 'Realistic' ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.06)',
              fontSize: 10, color: s === 'Realistic' ? '#818cf8' : 'rgba(255,255,255,0.4)',
            }}>{s}</div>
          ))}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Aspect Ratio</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {['16:9', '1:1', '4:3'].map(r => (
            <div key={r} style={{
              padding: '3px 8px', borderRadius: 6,
              background: r === '16:9' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
              border: r === '16:9' ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.06)',
              fontSize: 9, color: r === '16:9' ? '#818cf8' : 'rgba(255,255,255,0.35)',
            }}>{r}</div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', width: '100%', height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 600, boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          Generate
        </div>
      </div>
      {/* Right panel — preview grid */}
      <div style={{ position: 'absolute', left: '35%', top: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', padding: 16, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: '#22c55e' }} />
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>Generated Results</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1 }}>
          {[
            'linear-gradient(135deg, #1a1a2e, #16213e)',
            'linear-gradient(135deg, #1e1e3f, #2d1b69)',
            'linear-gradient(135deg, #0f2027, #203a43)',
            'linear-gradient(135deg, #1a0530, #2d1b4e)',
          ].map((bg, i) => (
            <div key={i} style={{
              borderRadius: 8, background: bg, border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ width: '60%', height: '40%', borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
              {i === 0 && (
                <div style={{ position: 'absolute', top: 4, right: 4, padding: '2px 6px', borderRadius: 4, background: '#22c55e20', border: '1px solid #22c55e40', fontSize: 8, color: '#4ade80' }}>CTR 8.2%</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditorMockup() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0e0e14', borderRadius: 14, overflow: 'hidden' }}>
      {/* Top toolbar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 32, background: '#141420', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444' }} />
        <div style={{ width: 8, height: 8, borderRadius: 4, background: '#eab308' }} />
        <div style={{ width: 8, height: 8, borderRadius: 4, background: '#22c55e' }} />
        <div style={{ marginLeft: 12, fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Scene Editor</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {['Cut', 'Trim', 'Export'].map(b => (
            <div key={b} style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>{b}</div>
          ))}
        </div>
      </div>
      {/* Left panel — scenes */}
      <div style={{ position: 'absolute', left: 0, top: 32, bottom: 48, width: '28%', background: '#111118', borderRight: '1px solid rgba(255,255,255,0.06)', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Scenes</div>
        {[1, 2, 3, 4].map(n => (
          <div key={n} style={{
            height: 40, borderRadius: 6,
            background: n === 1 ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
            border: n === 1 ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', padding: '0 8px', gap: 6,
          }}>
            <div style={{ width: 28, height: 20, borderRadius: 3, background: n === 1 ? 'linear-gradient(135deg,#1a1a2e,#16213e)' : 'rgba(255,255,255,0.04)' }} />
            <div>
              <div style={{ width: 40, height: 5, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginBottom: 3 }} />
              <div style={{ width: 24, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }} />
            </div>
          </div>
        ))}
      </div>
      {/* Center — video preview */}
      <div style={{ position: 'absolute', left: '28%', top: 32, right: '25%', bottom: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 10, background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Play button */}
          <div style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
            <div style={{ width: 0, height: 0, borderLeft: '10px solid rgba(255,255,255,0.6)', borderTop: '6px solid transparent', borderBottom: '6px solid transparent', marginLeft: 2 }} />
          </div>
          <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>0:04</div>
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
              <div style={{ width: '35%', height: '100%', borderRadius: 2, background: '#6366f1' }} />
            </div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>0:12</div>
          </div>
        </div>
      </div>
      {/* Right panel — effects */}
      <div style={{ position: 'absolute', right: 0, top: 32, bottom: 48, width: '25%', background: '#111118', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: 10 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Animation</div>
        {['Zoom In', 'Ken Burns', 'Slide L', 'Fade'].map((e, i) => (
          <div key={e} style={{
            marginBottom: 6, padding: '5px 8px', borderRadius: 6,
            background: i === 1 ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
            border: i === 1 ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.04)',
            fontSize: 9, color: i === 1 ? '#818cf8' : 'rgba(255,255,255,0.35)',
          }}>{e}</div>
        ))}
      </div>
      {/* Bottom timeline */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: '#0a0a12', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 4 }}>
        {[1, 2, 3, 4, 5, 6].map(n => (
          <div key={n} style={{
            flex: 1, height: 28, borderRadius: 4,
            background: n <= 2 ? 'rgba(99,102,241,0.15)' : n <= 4 ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.04)',
          }} />
        ))}
      </div>
    </div>
  );
}

function SeoMockup() {
  const scores = [
    { label: 'Title', score: 92, color: '#22c55e' },
    { label: 'Description', score: 78, color: '#eab308' },
    { label: 'Tags', score: 65, color: '#f97316' },
    { label: 'Engagement', score: 88, color: '#22c55e' },
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: '#0e0e14', borderRadius: 14, overflow: 'hidden', padding: 20, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff' }}>S</div>
        <div>
          <div style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>SEO Analyzer</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>Paste a video URL to analyze</div>
        </div>
        <div style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 9, color: '#4ade80' }}>Score: 81/100</div>
      </div>
      {/* Title input */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Video Title</div>
        <div style={{ width: '100%', height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>10 AI Tools That Will Change Your Life in 2026</div>
        </div>
      </div>
      {/* Description input */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Description</div>
        <div style={{ width: '100%', height: 48, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: 10 }}>
          <div style={{ width: '95%', height: 5, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 5 }} />
          <div style={{ width: '80%', height: 5, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginBottom: 5 }} />
          <div style={{ width: '60%', height: 5, borderRadius: 2, background: 'rgba(255,255,255,0.04)' }} />
        </div>
      </div>
      {/* Score bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {scores.map(s => (
          <div key={s.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
              <div style={{ fontSize: 9, color: s.color, fontWeight: 600 }}>{s.score}%</div>
            </div>
            <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ width: `${s.score}%`, height: '100%', borderRadius: 3, background: s.color, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  const barHeights = [45, 62, 38, 78, 55, 90, 72, 85, 60, 48, 95, 68];
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return (
    <div style={{ width: '100%', height: '100%', background: '#0e0e14', borderRadius: 14, overflow: 'hidden', padding: 20, display: 'flex', flexDirection: 'column' }}>
      {/* Top stats row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Views', value: '12.4K', change: '+14%', color: '#22c55e' },
          { label: 'Subs', value: '892', change: '+8%', color: '#22c55e' },
          { label: 'CTR', value: '6.8%', change: '-0.3%', color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 8, color: s.color }}>{s.change}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Chart area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Monthly Views</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Views', 'Subs'].map((t, i) => (
              <div key={t} style={{
                padding: '2px 8px', borderRadius: 4,
                background: i === 0 ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                fontSize: 8, color: i === 0 ? '#818cf8' : 'rgba(255,255,255,0.3)',
              }}>{t}</div>
            ))}
          </div>
        </div>
        {/* Bars */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 4, paddingBottom: 16, position: 'relative' }}>
          {/* Horizontal grid lines */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, bottom: `${16 + (i * 33)}%`, height: 1, background: 'rgba(255,255,255,0.04)' }} />
          ))}
          {barHeights.map((h, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '80%', height: `${h}%`, borderRadius: 3,
                background: i === barHeights.length - 3 ? 'linear-gradient(to top, #6366f1, #818cf8)' : 'rgba(99,102,241,0.25)',
                transition: 'height 0.4s ease',
              }} />
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', position: 'absolute', bottom: 0 }}>{labels[i]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FreeToolsMockup() {
  const tools = [
    { name: 'Title Gen', icon: 'Tt', color: '#6366f1' },
    { name: 'Tag Gen', icon: '#', color: '#8b5cf6' },
    { name: 'Desc Writer', icon: 'Dc', color: '#a855f7' },
    { name: 'Money Calc', icon: '$', color: '#22c55e' },
    { name: 'Hashtags', icon: 'H#', color: '#ec4899' },
    { name: 'Embed Gen', icon: '</>', color: '#f97316' },
    { name: 'Thumb DL', icon: 'Th', color: '#14b8a6' },
    { name: 'Channel ID', icon: 'ID', color: '#eab308' },
    { name: 'Banner Gen', icon: 'Bn', color: '#ef4444' },
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: '#0e0e14', borderRadius: 14, overflow: 'hidden', padding: 20, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Free YouTube Tools</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>No signup required</div>
        </div>
        <div style={{ height: 24, width: 120, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Search tools...</div>
        </div>
      </div>
      {/* Tool grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, flex: 1 }}>
        {tools.map(t => (
          <div key={t.name} style={{
            borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: 8, transition: 'background 0.2s',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `${t.color}18`, border: `1px solid ${t.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: t.color,
            }}>{t.icon}</div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>{t.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const MOCKUP_MAP: Record<string, () => React.JSX.Element> = {
  thumbnails: ThumbnailsMockup,
  editor: EditorMockup,
  seo: SeoMockup,
  analytics: AnalyticsMockup,
  free: FreeToolsMockup,
};

/* ── Product Data ──────────────────────────────────────────────── */

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

/* ── Main Component ────────────────────────────────────────────── */

export function ProductDemo() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const product = PRODUCTS[active];

  const switchTab = (i: number) => {
    if (i === active) return;
    setVisible(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActive(i);
      setVisible(true);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const MockupComponent = MOCKUP_MAP[product.mockup];

  return (
    <section style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 8 }}>
        One Platform for Everything YouTube
      </h2>
      <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 40 }}>
        Everything you need to create, optimize, and grow your channel
      </p>

      {/* Tab pills */}
      <div className="product-demo-tabs" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {PRODUCTS.map((p, i) => (
          <button key={p.id} onClick={() => switchTab(i)} style={{
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
        background: 'linear-gradient(145deg, #141420, #1a1a28)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20, padding: 32, display: 'flex', gap: 32,
        alignItems: 'center', minHeight: 400,
        boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        transition: 'all 0.3s ease',
      }}>
        {/* Left: mockup visual */}
        <div style={{
          flex: 1, aspectRatio: '16/10', borderRadius: 14,
          background: '#0e0e14',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          position: 'relative', overflow: 'hidden',
          minWidth: 0,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}>
          {MockupComponent && <MockupComponent />}
        </div>

        {/* Right: description */}
        <div className="product-demo-desc" style={{
          flex: 1, maxWidth: 400,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}>
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
