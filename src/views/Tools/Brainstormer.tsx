'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ═══════════════════════════════════════════════════════════════════════════
   Brainstormer / AI Assistants — referral links page
   ═══════════════════════════════════════════════════════════════════════════ */

interface Provider {
  id: string;
  name: string;
  logo: string;
  description: string;
  descriptionRu: string;
  features: string[];
  featuresRu: string[];
  url: string;
  pricing: string;
  pricingRu: string;
  badge?: string;
  gradient: [string, string];
}

const PROVIDERS: Provider[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    logo: '\uD83E\uDD16',
    description: 'The most popular AI assistant by OpenAI. Excellent for brainstorming video ideas, writing scripts, titles, and optimizing descriptions.',
    descriptionRu: '\u0421\u0430\u043C\u044B\u0439 \u043F\u043E\u043F\u0443\u043B\u044F\u0440\u043D\u044B\u0439 \u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u043E\u0442 OpenAI. \u041E\u0442\u043B\u0438\u0447\u043D\u043E \u043F\u043E\u0434\u0445\u043E\u0434\u0438\u0442 \u0434\u043B\u044F \u0431\u0440\u0435\u0439\u043D\u0441\u0442\u043E\u0440\u043C\u0438\u043D\u0433\u0430 \u0438\u0434\u0435\u0439, \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0435\u0432, \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u043E\u0432 \u0438 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0439.',
    features: ['GPT-4o', 'Image Generation', 'Web Browsing', 'Custom GPTs', 'Voice Mode'],
    featuresRu: ['GPT-4o', '\u0413\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0439', '\u041F\u043E\u0438\u0441\u043A \u0432 \u0432\u0435\u0431', '\u041A\u0430\u0441\u0442\u043E\u043C\u043D\u044B\u0435 GPT', '\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0439 \u0440\u0435\u0436\u0438\u043C'],
    url: 'https://chat.openai.com/?ref=tubeforge',
    pricing: 'Free tier \u2022 Plus from $20/mo',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444 \u2022 Plus \u043E\u0442 $20/\u043C\u0435\u0441',
    badge: 'Popular',
    gradient: ['#10b981', '#059669'],
  },
  {
    id: 'claude',
    name: 'Claude',
    logo: '\uD83E\uDDE0',
    description: 'Anthropic\'s powerful AI assistant. Excels at long-form content writing, detailed analysis, and creative brainstorming with nuanced understanding.',
    descriptionRu: '\u041C\u043E\u0449\u043D\u044B\u0439 \u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u043E\u0442 Anthropic. \u041E\u0442\u043B\u0438\u0447\u043D\u043E \u043F\u0438\u0448\u0435\u0442 \u0434\u043B\u0438\u043D\u043D\u044B\u0439 \u043A\u043E\u043D\u0442\u0435\u043D\u0442, \u0433\u043B\u0443\u0431\u043E\u043A\u0438\u0439 \u0430\u043D\u0430\u043B\u0438\u0437 \u0438 \u043A\u0440\u0435\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u0431\u0440\u0435\u0439\u043D\u0441\u0442\u043E\u0440\u043C\u0438\u043D\u0433.',
    features: ['200K Context', 'Long-Form Writing', 'Analysis', 'Coding', 'Vision'],
    featuresRu: ['200K \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442', '\u0414\u043B\u0438\u043D\u043D\u044B\u0435 \u0442\u0435\u043A\u0441\u0442\u044B', '\u0410\u043D\u0430\u043B\u0438\u0437', '\u041A\u043E\u0434\u0438\u043D\u0433', '\u0417\u0440\u0435\u043D\u0438\u0435'],
    url: 'https://claude.ai/?ref=tubeforge',
    pricing: 'Free tier \u2022 Pro from $20/mo',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444 \u2022 Pro \u043E\u0442 $20/\u043C\u0435\u0441',
    badge: 'Best for Writing',
    gradient: ['#d97706', '#f59e0b'],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    logo: '\u2728',
    description: 'Google\'s multimodal AI. Integrated with Google Workspace, excellent for research, brainstorming, and YouTube-specific insights.',
    descriptionRu: '\u041C\u0443\u043B\u044C\u0442\u0438\u043C\u043E\u0434\u0430\u043B\u044C\u043D\u044B\u0439 \u0418\u0418 \u043E\u0442 Google. \u0418\u043D\u0442\u0435\u0433\u0440\u0438\u0440\u043E\u0432\u0430\u043D \u0441 Google Workspace, \u043E\u0442\u043B\u0438\u0447\u043D\u043E \u043F\u043E\u0434\u0445\u043E\u0434\u0438\u0442 \u0434\u043B\u044F \u0438\u0441\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u0439 \u0438 YouTube.',
    features: ['Multimodal', 'Google Integration', 'Image Analysis', 'Long Context', 'Free Tier'],
    featuresRu: ['\u041C\u0443\u043B\u044C\u0442\u0438\u043C\u043E\u0434\u0430\u043B\u044C\u043D\u044B\u0439', '\u0418\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F Google', '\u0410\u043D\u0430\u043B\u0438\u0437 \u0438\u0437\u043E\u0431\u0440.', '\u0414\u043B\u0438\u043D\u043D\u044B\u0439 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442', '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439'],
    url: 'https://gemini.google.com/?ref=tubeforge',
    pricing: 'Free \u2022 Advanced from $19.99/mo',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E \u2022 Advanced \u043E\u0442 $19.99/\u043C\u0435\u0441',
    badge: 'Free',
    gradient: ['#4285f4', '#34a853'],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    logo: '\uD83D\uDD0D',
    description: 'AI-powered search engine for research. Combines AI reasoning with real-time web sources \u2014 perfect for trend research and fact-checking.',
    descriptionRu: '\u0418\u0418-\u043F\u043E\u0438\u0441\u043A\u043E\u0432\u0438\u043A \u0434\u043B\u044F \u0438\u0441\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u0439. \u0421\u043E\u0447\u0435\u0442\u0430\u0435\u0442 \u0418\u0418 \u0441 \u0440\u0435\u0430\u043B\u044C\u043D\u044B\u043C\u0438 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u0430\u043C\u0438 \u2014 \u0438\u0434\u0435\u0430\u043B\u044C\u043D\u043E \u0434\u043B\u044F \u0438\u0441\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u044F \u0442\u0440\u0435\u043D\u0434\u043E\u0432 \u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0444\u0430\u043A\u0442\u043E\u0432.',
    features: ['Real-Time Search', 'Source Citations', 'Pro Search', 'File Analysis', 'Collections'],
    featuresRu: ['\u041F\u043E\u0438\u0441\u043A \u0432 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u043C \u0432\u0440\u0435\u043C\u0435\u043D\u0438', '\u0426\u0438\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u043E\u0432', 'Pro \u043F\u043E\u0438\u0441\u043A', '\u0410\u043D\u0430\u043B\u0438\u0437 \u0444\u0430\u0439\u043B\u043E\u0432', '\u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u0438'],
    url: 'https://www.perplexity.ai/?ref=tubeforge',
    pricing: 'Free \u2022 Pro from $20/mo',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E \u2022 Pro \u043E\u0442 $20/\u043C\u0435\u0441',
    gradient: ['#6366f1', '#8b5cf6'],
  },
];

export function Brainstormer() {
  const C = useThemeStore((s) => s.theme);
  const { locale } = useLocaleStore();
  const isRu = locale === 'ru' || locale === 'kk';
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: '-0.02em' }}>
          {isRu ? '\uD83D\uDCA1 \u0418\u0418-\u0431\u0440\u0435\u0439\u043D\u0441\u0442\u043E\u0440\u043C\u0438\u043D\u0433' : '\uD83D\uDCA1 AI Brainstorming Tools'}
        </h1>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
          {isRu
            ? '\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u043E\u0432 \u0434\u043B\u044F \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u0438\u0434\u0435\u0439, \u043D\u0430\u043F\u0438\u0441\u0430\u043D\u0438\u044F \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0435\u0432, \u0438\u0441\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u044F \u0442\u0440\u0435\u043D\u0434\u043E\u0432 \u0438 \u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u0438 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430.'
            : 'Use AI assistants for idea generation, scriptwriting, trend research, and content optimization.'}
        </p>
      </div>

      <div style={{ padding: '14px 18px', background: `${C.blue}0a`, border: `1px solid ${C.blue}20`, borderRadius: 12, marginBottom: 28, fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
        {isRu
          ? '\uD83D\uDCA1 \u0421\u043E\u0432\u0435\u0442: ChatGPT \u2014 \u0443\u043D\u0438\u0432\u0435\u0440\u0441\u0430\u043B\u044C\u043D\u044B\u0439 \u0432\u044B\u0431\u043E\u0440. Claude \u2014 \u043B\u0443\u0447\u0448\u0438\u0439 \u0434\u043B\u044F \u0434\u043B\u0438\u043D\u043D\u044B\u0445 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0435\u0432. Perplexity \u2014 \u0434\u043B\u044F \u0438\u0441\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u044F \u0442\u0440\u0435\u043D\u0434\u043E\u0432 \u0441 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u0430\u043C\u0438. Gemini \u2014 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442 \u0441 Google.'
          : '\uD83D\uDCA1 Tip: ChatGPT is a universal choice. Claude excels at long-form scripts. Perplexity is best for trend research with citations. Gemini is free with Google integration.'}
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
                <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{isRu ? p.pricingRu : p.pricing}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.5, margin: '0 0 14px' }}>{isRu ? p.descriptionRu : p.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(isRu ? p.featuresRu : p.features).map((f, i) => (
                <span key={i} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${p.gradient[0]}12`, color: p.gradient[0], border: `1px solid ${p.gradient[0]}20` }}>{f}</span>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 14, fontSize: 13, fontWeight: 600, color: C.accent, gap: 6 }}>
              {isRu ? '\u041F\u0435\u0440\u0435\u0439\u0442\u0438' : 'Visit'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg>
            </div>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 28, padding: '16px 20px', background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 13, color: C.dim, lineHeight: 1.6, textAlign: 'center' }}>
        {isRu
          ? '\u2699\uFE0F \u041F\u043E\u043B\u043D\u0430\u044F \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F \u0431\u0440\u0435\u0439\u043D\u0441\u0442\u043E\u0440\u043C\u0438\u043D\u0433\u0430 \u0432 TubeForge \u2014 \u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0435. \u0421\u043B\u0435\u0434\u0438\u0442\u0435 \u0437\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F\u043C\u0438!'
          : '\u2699\uFE0F Full brainstorming integration inside TubeForge \u2014 coming soon. Stay tuned!'}
      </div>
    </div>
  );
}
