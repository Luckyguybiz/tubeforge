'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';

/* ═══════════════════════════════════════════════════════════════════════════
   Brainstormer / AI Assistants — referral links page
   ═══════════════════════════════════════════════════════════════════════════ */

interface Provider {
  id: string;
  name: string;
  logo: string;
  description: string;
  features: string[];
  url: string;
  pricing: string;
  badge?: string;
  gradient: [string, string];
}

const PROVIDERS: Provider[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    logo: '\uD83E\uDD16',
    description: 'The most popular AI assistant by OpenAI. Excellent for brainstorming video ideas, writing scripts, titles, and optimizing descriptions.',
    features: ['GPT-4o', 'Image Generation', 'Web Browsing', 'Custom GPTs', 'Voice Mode'],
    url: 'https://chat.openai.com/?ref=tubeforge',
    pricing: 'Free tier \u2022 Plus from $20/mo',
    badge: 'Popular',
    gradient: ['#10b981', '#059669'],
  },
  {
    id: 'claude',
    name: 'Claude',
    logo: '\uD83E\uDDE0',
    description: 'Anthropic\'s powerful AI assistant. Excels at long-form content writing, detailed analysis, and creative brainstorming with nuanced understanding.',
    features: ['200K Context', 'Long-Form Writing', 'Analysis', 'Coding', 'Vision'],
    url: 'https://claude.ai/?ref=tubeforge',
    pricing: 'Free tier \u2022 Pro from $20/mo',
    badge: 'Best for Writing',
    gradient: ['#d97706', '#f59e0b'],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    logo: '\u2728',
    description: 'Google\'s multimodal AI. Integrated with Google Workspace, excellent for research, brainstorming, and YouTube-specific insights.',
    features: ['Multimodal', 'Google Integration', 'Image Analysis', 'Long Context', 'Free Tier'],
    url: 'https://gemini.google.com/?ref=tubeforge',
    pricing: 'Free \u2022 Advanced from $19.99/mo',
    badge: 'Free',
    gradient: ['#4285f4', '#34a853'],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    logo: '\uD83D\uDD0D',
    description: 'AI-powered search engine for research. Combines AI reasoning with real-time web sources \u2014 perfect for trend research and fact-checking.',
    features: ['Real-Time Search', 'Source Citations', 'Pro Search', 'File Analysis', 'Collections'],
    url: 'https://www.perplexity.ai/?ref=tubeforge',
    pricing: 'Free \u2022 Pro from $20/mo',
    gradient: ['#6366f1', '#8b5cf6'],
  },
];

export function Brainstormer() {
  const C = useThemeStore((s) => s.theme);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: '-0.02em' }}>
          '\uD83D\uDCA1 AI Brainstorming Tools'
        </h1>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
          'Use AI assistants for idea generation, scriptwriting, trend research, and content optimization.'
        </p>
      </div>

      <div style={{ padding: '14px 18px', background: `${C.blue}0a`, border: `1px solid ${C.blue}20`, borderRadius: 12, marginBottom: 28, fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
        '\uD83D\uDCA1 Tip: ChatGPT is a universal choice. Claude excels at long-form scripts. Perplexity is best for trend research with citations. Gemini is free with Google integration.'
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {PROVIDERS.map((p) => (
          <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
            onMouseEnter={() => setHoveredId(p.id)} onMouseLeave={() => setHoveredId(null)}
            style={{
              display: 'block', textDecoration: 'none', padding: '20px', background: C.surface,
              border: `1px solid ${hoveredId === p.id ? C.accent : C.border}`, borderRadius: 16,
              transition: 'all 0.2s ease', transform: hoveredId === p.id ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredId === p.id ? `0 8px 24px ${C.accent}15` : 'none',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${p.gradient[0]}, ${p.gradient[1]})` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{p.logo}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{p.name}</span>
                  {p.badge && (<span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})`, color: '#fff', letterSpacing: 0.3 }}>{p.badge}</span>)}
                </div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{p.pricing}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.5, margin: '0 0 14px' }}>{p.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(p.features).map((f, i) => (
                <span key={i} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${p.gradient[0]}12`, color: p.gradient[0], border: `1px solid ${p.gradient[0]}20` }}>{f}</span>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 14, fontSize: 13, fontWeight: 600, color: C.accent, gap: 6 }}>
              'Visit'
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg>
            </div>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 28, padding: '16px 20px', background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 13, color: C.dim, lineHeight: 1.6, textAlign: 'center' }}>
        '\u2699\uFE0F Full brainstorming integration inside TubeForge \u2014 coming soon. Stay tuned!'
      </div>
    </div>
  );
}
