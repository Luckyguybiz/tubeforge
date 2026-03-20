'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ═══════════════════════════════════════════════════════════════════════════
   AI Content Creator Providers — referral links page
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
    id: 'jasper',
    name: 'Jasper',
    logo: '\u270d\ufe0f',
    description: 'AI copywriting platform with brand voice control. 50+ content templates for marketing, ads, blogs, and social media.',
    descriptionRu: '\u0418\u0418-\u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430 \u043a\u043e\u043f\u0438\u0440\u0430\u0439\u0442\u0438\u043d\u0433\u0430 \u0441 \u0443\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435\u043c \u0433\u043e\u043b\u043e\u0441\u043e\u043c \u0431\u0440\u0435\u043d\u0434\u0430. 50+ \u0448\u0430\u0431\u043b\u043e\u043d\u043e\u0432 \u0434\u043b\u044f \u043c\u0430\u0440\u043a\u0435\u0442\u0438\u043d\u0433\u0430, \u0440\u0435\u043a\u043b\u0430\u043c\u044b, \u0431\u043b\u043e\u0433\u043e\u0432 \u0438 \u0441\u043e\u0446\u0441\u0435\u0442\u0435\u0439.',
    features: ['AI Copywriting', 'Brand Voice', '50+ Templates', 'Marketing Tools', 'Team Collaboration'],
    featuresRu: ['\u0418\u0418-\u043a\u043e\u043f\u0438\u0440\u0430\u0439\u0442\u0438\u043d\u0433', '\u0413\u043e\u043b\u043e\u0441 \u0431\u0440\u0435\u043d\u0434\u0430', '50+ \u0448\u0430\u0431\u043b\u043e\u043d\u043e\u0432', '\u041c\u0430\u0440\u043a\u0435\u0442\u0438\u043d\u0433', '\u041a\u043e\u043c\u0430\u043d\u0434\u043d\u0430\u044f \u0440\u0430\u0431\u043e\u0442\u0430'],
    url: 'https://www.jasper.ai/?ref=tubeforge',
    pricing: 'From $39/mo',
    pricingRu: '\u041e\u0442 $39/\u043c\u0435\u0441',
    badge: 'Popular',
    gradient: ['#7c3aed', '#c026d3'],
  },
  {
    id: 'copyai',
    name: 'Copy.ai',
    logo: '\ud83d\udccb',
    description: 'AI content generation with automated workflows. Free tier available for getting started with AI-powered writing.',
    descriptionRu: '\u0418\u0418-\u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u043a\u043e\u043d\u0442\u0435\u043d\u0442\u0430 \u0441 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u043c\u0438 \u0432\u043e\u0440\u043a\u0444\u043b\u043e\u0443. \u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0439 \u0442\u0430\u0440\u0438\u0444 \u0434\u043b\u044f \u043d\u0430\u0447\u0430\u043b\u0430 \u0440\u0430\u0431\u043e\u0442\u044b \u0441 \u0418\u0418-\u043f\u0438\u0441\u044c\u043c\u043e\u043c.',
    features: ['AI Generation', 'Workflows', 'Free Tier', 'Chat Interface', 'API Access'],
    featuresRu: ['\u0418\u0418-\u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f', '\u0412\u043e\u0440\u043a\u0444\u043b\u043e\u0443', '\u0411\u0435\u0441\u043f\u043b. \u0442\u0430\u0440\u0438\u0444', '\u0427\u0430\u0442-\u0438\u043d\u0442\u0435\u0440\u0444\u0435\u0439\u0441', 'API \u0434\u043e\u0441\u0442\u0443\u043f'],
    url: 'https://www.copy.ai/?ref=tubeforge',
    pricing: 'Free tier \u2022 From $36/mo',
    pricingRu: '\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0439 \u0442\u0430\u0440\u0438\u0444 \u2022 \u041e\u0442 $36/\u043c\u0435\u0441',
    gradient: ['#0891b2', '#0d9488'],
  },
  {
    id: 'writesonic',
    name: 'Writesonic',
    logo: '\u26a1',
    description: 'AI writer with built-in image generation and SEO optimization. Free tier available for content creators on a budget.',
    descriptionRu: '\u0418\u0418-\u043f\u0438\u0441\u0430\u0442\u0435\u043b\u044c \u0441 \u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u0435\u0439 \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0439 \u0438 SEO-\u043e\u043f\u0442\u0438\u043c\u0438\u0437\u0430\u0446\u0438\u0435\u0439. \u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0439 \u0442\u0430\u0440\u0438\u0444 \u0434\u043b\u044f \u0441\u043e\u0437\u0434\u0430\u0442\u0435\u043b\u0435\u0439 \u043a\u043e\u043d\u0442\u0435\u043d\u0442\u0430.',
    features: ['AI Writer', 'Image Gen', 'SEO Tools', 'Free Tier', 'Blog Generator'],
    featuresRu: ['\u0418\u0418-\u043f\u0438\u0441\u0430\u0442\u0435\u043b\u044c', '\u0413\u0435\u043d. \u0438\u0437\u043e\u0431\u0440.', 'SEO \u0438\u043d\u0441\u0442\u0440.', '\u0411\u0435\u0441\u043f\u043b. \u0442\u0430\u0440\u0438\u0444', '\u0413\u0435\u043d. \u0431\u043b\u043e\u0433\u043e\u0432'],
    url: 'https://writesonic.com/?ref=tubeforge',
    pricing: 'Free tier \u2022 From $16/mo',
    pricingRu: '\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0439 \u0442\u0430\u0440\u0438\u0444 \u2022 \u041e\u0442 $16/\u043c\u0435\u0441',
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: 'canva-ai',
    name: 'Canva AI',
    logo: '\ud83c\udfa8',
    description: 'All-in-one design platform with AI content tools. Magic Write for text, templates for any format, and seamless design integration.',
    descriptionRu: '\u0423\u043d\u0438\u0432\u0435\u0440\u0441\u0430\u043b\u044c\u043d\u0430\u044f \u0434\u0438\u0437\u0430\u0439\u043d-\u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430 \u0441 \u0418\u0418-\u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0430\u043c\u0438. Magic Write \u0434\u043b\u044f \u0442\u0435\u043a\u0441\u0442\u0430, \u0448\u0430\u0431\u043b\u043e\u043d\u044b \u0438 \u0438\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044f \u0434\u0438\u0437\u0430\u0439\u043d\u0430.',
    features: ['Magic Write', 'Design + AI', 'Templates', 'Free Tier', 'Brand Kit'],
    featuresRu: ['Magic Write', '\u0414\u0438\u0437\u0430\u0439\u043d + \u0418\u0418', '\u0428\u0430\u0431\u043b\u043e\u043d\u044b', '\u0411\u0435\u0441\u043f\u043b. \u0442\u0430\u0440\u0438\u0444', '\u0411\u0440\u0435\u043d\u0434-\u043a\u0438\u0442'],
    url: 'https://www.canva.com/?ref=tubeforge',
    pricing: 'Free tier \u2022 Pro from $12.99/mo',
    pricingRu: '\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0439 \u0442\u0430\u0440\u0438\u0444 \u2022 Pro \u043e\u0442 $12.99/\u043c\u0435\u0441',
    badge: 'Best for Design',
    gradient: ['#ec4899', '#f43f5e'],
  },
  {
    id: 'notion-ai',
    name: 'Notion AI',
    logo: '\ud83d\udcd3',
    description: 'AI writing assistant built into your workspace. Summaries, translations, brainstorming, and content drafting — all inside Notion.',
    descriptionRu: '\u0418\u0418-\u043f\u043e\u043c\u043e\u0449\u043d\u0438\u043a \u043f\u0438\u0441\u044c\u043c\u0430 \u0432\u0441\u0442\u0440\u043e\u0435\u043d\u043d\u044b\u0439 \u0432 \u0440\u0430\u0431\u043e\u0447\u0435\u0435 \u043f\u0440\u043e\u0441\u0442\u0440\u0430\u043d\u0441\u0442\u0432\u043e. \u0420\u0435\u0437\u044e\u043c\u0435, \u043f\u0435\u0440\u0435\u0432\u043e\u0434\u044b, \u0431\u0440\u0435\u0439\u043d\u0448\u0442\u043e\u0440\u043c \u0438 \u0447\u0435\u0440\u043d\u043e\u0432\u0438\u043a\u0438 \u2014 \u0432\u0441\u0451 \u0432 Notion.',
    features: ['AI Writing', 'Summaries', 'Translations', 'Workspace', 'Brainstorming'],
    featuresRu: ['\u0418\u0418-\u043f\u0438\u0441\u044c\u043c\u043e', '\u0420\u0435\u0437\u044e\u043c\u0435', '\u041f\u0435\u0440\u0435\u0432\u043e\u0434\u044b', '\u0420\u0430\u0431. \u043f\u0440\u043e\u0441\u0442\u0440.', '\u0411\u0440\u0435\u0439\u043d\u0448\u0442\u043e\u0440\u043c'],
    url: 'https://www.notion.so/product/ai/?ref=tubeforge',
    pricing: 'From $10/mo add-on',
    pricingRu: '\u041e\u0442 $10/\u043c\u0435\u0441 \u0434\u043e\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435',
    gradient: ['#f59e0b', '#ef4444'],
  },
];

export function AiCreator() {
  const C = useThemeStore((s) => s.theme);
  const { locale } = useLocaleStore();
  const isRu = locale === 'ru' || locale === 'kk';
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: '-0.02em',
        }}>
          {isRu ? '\u270d\ufe0f \u0418\u0418-\u0441\u043e\u0437\u0434\u0430\u0442\u0435\u043b\u044c \u043a\u043e\u043d\u0442\u0435\u043d\u0442\u0430' : '\u270d\ufe0f AI Content Creator'}
        </h1>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
          {isRu
            ? '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0418\u0418-\u0441\u0435\u0440\u0432\u0438\u0441 \u0434\u043b\u044f \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u044f \u043a\u043e\u043d\u0442\u0435\u043d\u0442\u0430. \u041e\u0442\u043b\u0438\u0447\u043d\u043e \u0434\u043b\u044f \u043c\u0430\u0440\u043a\u0435\u0442\u0438\u043d\u0433\u0430, \u0431\u043b\u043e\u0433\u043e\u0432 \u0438 \u0441\u043e\u0446\u0441\u0435\u0442\u0435\u0439.'
            : 'Choose an AI service for content creation. Great for marketing, blogs, and social media.'}
        </p>
      </div>

      {/* Tip box */}
      <div style={{
        padding: '14px 18px', background: `${C.blue}0a`, border: `1px solid ${C.blue}20`,
        borderRadius: 12, marginBottom: 28, fontSize: 13, color: C.sub, lineHeight: 1.6,
      }}>
        {isRu
          ? '\ud83d\udca1 \u0421\u043e\u0432\u0435\u0442: Jasper \u0434\u043b\u044f \u043c\u0430\u0440\u043a\u0435\u0442\u0438\u043d\u0433\u043e\u0432\u044b\u0445 \u0442\u0435\u043a\u0441\u0442\u043e\u0432. Canva AI \u0434\u043b\u044f \u0434\u0438\u0437\u0430\u0439\u043d\u0430 + \u0442\u0435\u043a\u0441\u0442\u0430. Writesonic \u0434\u043b\u044f \u0431\u043b\u043e\u0433\u043e\u0432 \u0438 SEO-\u043a\u043e\u043d\u0442\u0435\u043d\u0442\u0430.'
          : '\ud83d\udca1 Tip: Jasper for marketing copy. Canva AI for design + text. Writesonic for blog/SEO content.'}
      </div>

      {/* Provider cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16,
      }}>
        {PROVIDERS.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId(null)}
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
                  {p.badge && (
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})`, color: '#fff', letterSpacing: 0.3 }}>
                      {p.badge}
                    </span>
                  )}
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
              {isRu ? '\u041f\u0435\u0440\u0435\u0439\u0442\u0438' : 'Visit'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg>
            </div>
          </a>
        ))}
      </div>

      {/* Bottom note */}
      <div style={{ marginTop: 28, padding: '16px 20px', background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 13, color: C.dim, lineHeight: 1.6, textAlign: 'center' }}>
        {isRu
          ? '\u2699\ufe0f \u041f\u043e\u043b\u043d\u0430\u044f \u0438\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044f \u0418\u0418-\u0441\u043e\u0437\u0434\u0430\u043d\u0438\u044f \u043a\u043e\u043d\u0442\u0435\u043d\u0442\u0430 \u0432 TubeForge \u2014 \u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0435. \u0421\u043b\u0435\u0434\u0438\u0442\u0435 \u0437\u0430 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f\u043c\u0438!'
          : '\u2699\ufe0f Full AI content creation integration inside TubeForge \u2014 coming soon. Stay tuned!'}
      </div>
    </div>
  );
}
