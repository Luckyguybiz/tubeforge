'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ═══════════════════════════════════════════════════════════════════════════
   Reddit Video Generator Providers — referral links page
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
    id: 'invideo-ai',
    name: 'InVideo AI',
    logo: '\ud83c\udfac',
    description: 'Create videos from text prompts with Reddit story format support. 5000+ templates and AI-powered editing for quick turnaround.',
    descriptionRu: '\u0421\u043e\u0437\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u0432\u0438\u0434\u0435\u043e \u0438\u0437 \u0442\u0435\u043a\u0441\u0442\u043e\u0432\u044b\u0445 \u043f\u0440\u043e\u043c\u043f\u0442\u043e\u0432 \u0432 \u0444\u043e\u0440\u043c\u0430\u0442\u0435 Reddit-\u0438\u0441\u0442\u043e\u0440\u0438\u0439. 5000+ \u0448\u0430\u0431\u043b\u043e\u043d\u043e\u0432 \u0438 \u0418\u0418-\u043c\u043e\u043d\u0442\u0430\u0436.',
    features: ['Text to Video', 'Reddit Format', '5000+ Templates', 'AI Editing', 'Free Tier'],
    featuresRu: ['\u0422\u0435\u043a\u0441\u0442 \u0432 \u0432\u0438\u0434\u0435\u043e', 'Reddit \u0444\u043e\u0440\u043c\u0430\u0442', '5000+ \u0448\u0430\u0431\u043b\u043e\u043d\u043e\u0432', '\u0418\u0418-\u043c\u043e\u043d\u0442\u0430\u0436', '\u0411\u0435\u0441\u043f\u043b. \u0442\u0430\u0440\u0438\u0444'],
    url: 'https://invideo.io/?ref=tubeforge',
    pricing: 'Free tier \u2022 From $25/mo',
    pricingRu: '\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0439 \u0442\u0430\u0440\u0438\u0444 \u2022 \u041e\u0442 $25/\u043c\u0435\u0441',
    badge: 'Best for Reddit',
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: 'pictory',
    name: 'Pictory',
    logo: '\ud83d\uddbc\ufe0f',
    description: 'Transform scripts and blog posts into engaging videos. Auto-summarize long content and create shareable video clips.',
    descriptionRu: '\u041f\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0439\u0442\u0435 \u0441\u043a\u0440\u0438\u043f\u0442\u044b \u0438 \u0441\u0442\u0430\u0442\u044c\u0438 \u0432 \u0443\u0432\u043b\u0435\u043a\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u0432\u0438\u0434\u0435\u043e. \u0410\u0432\u0442\u043e-\u0441\u0443\u043c\u043c\u0430\u0440\u0438\u0437\u0430\u0446\u0438\u044f \u0434\u043b\u0438\u043d\u043d\u043e\u0433\u043e \u043a\u043e\u043d\u0442\u0435\u043d\u0442\u0430 \u0438 \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u043a\u043b\u0438\u043f\u043e\u0432.',
    features: ['Script to Video', 'Auto-Summarize', 'Blog to Video', 'Captions', 'Brand Kit'],
    featuresRu: ['\u0421\u043a\u0440\u0438\u043f\u0442 \u0432 \u0432\u0438\u0434\u0435\u043e', '\u0410\u0432\u0442\u043e-\u0441\u0443\u043c\u043c\u0430\u0440\u0438\u0437\u0430\u0446\u0438\u044f', '\u0411\u043b\u043e\u0433 \u0432 \u0432\u0438\u0434\u0435\u043e', '\u0421\u0443\u0431\u0442\u0438\u0442\u0440\u044b', '\u0411\u0440\u0435\u043d\u0434-\u043a\u0438\u0442'],
    url: 'https://pictory.ai/?ref=tubeforge',
    pricing: 'From $19/mo',
    pricingRu: '\u041e\u0442 $19/\u043c\u0435\u0441',
    gradient: ['#ec4899', '#f43f5e'],
  },
  {
    id: 'fliki',
    name: 'Fliki',
    logo: '\ud83c\udfa5',
    description: 'Turn text into video with realistic AI voices. 2000+ voice options in 75+ languages for narrated video content.',
    descriptionRu: '\u041f\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0439\u0442\u0435 \u0442\u0435\u043a\u0441\u0442 \u0432 \u0432\u0438\u0434\u0435\u043e \u0441 \u0440\u0435\u0430\u043b\u0438\u0441\u0442\u0438\u0447\u043d\u044b\u043c\u0438 \u0418\u0418-\u0433\u043e\u043b\u043e\u0441\u0430\u043c\u0438. 2000+ \u0433\u043e\u043b\u043e\u0441\u043e\u0432 \u043d\u0430 75+ \u044f\u0437\u044b\u043a\u0430\u0445.',
    features: ['Text to Video', '2000+ Voices', '75+ Languages', 'AI Narration', 'Stock Media'],
    featuresRu: ['\u0422\u0435\u043a\u0441\u0442 \u0432 \u0432\u0438\u0434\u0435\u043e', '2000+ \u0433\u043e\u043b\u043e\u0441\u043e\u0432', '75+ \u044f\u0437\u044b\u043a\u043e\u0432', '\u0418\u0418-\u043e\u0437\u0432\u0443\u0447\u043a\u0430', '\u0421\u0442\u043e\u043a-\u043c\u0435\u0434\u0438\u0430'],
    url: 'https://fliki.ai/?ref=tubeforge',
    pricing: 'From $21/mo',
    pricingRu: '\u041e\u0442 $21/\u043c\u0435\u0441',
    gradient: ['#0891b2', '#0d9488'],
  },
  {
    id: 'synthesia',
    name: 'Synthesia',
    logo: '\ud83e\udd16',
    description: 'Create AI avatar videos with 140+ realistic avatars in 120+ languages. Perfect for talking-head content without filming.',
    descriptionRu: '\u0421\u043e\u0437\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u0432\u0438\u0434\u0435\u043e \u0441 \u0418\u0418-\u0430\u0432\u0430\u0442\u0430\u0440\u0430\u043c\u0438. 140+ \u0440\u0435\u0430\u043b\u0438\u0441\u0442\u0438\u0447\u043d\u044b\u0445 \u0430\u0432\u0430\u0442\u0430\u0440\u043e\u0432 \u043d\u0430 120+ \u044f\u0437\u044b\u043a\u0430\u0445. \u0411\u0435\u0437 \u0441\u044a\u0451\u043c\u043e\u043a.',
    features: ['AI Avatars', '140+ Characters', '120+ Languages', 'Custom Avatars', 'Templates'],
    featuresRu: ['\u0418\u0418-\u0430\u0432\u0430\u0442\u0430\u0440\u044b', '140+ \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0435\u0439', '120+ \u044f\u0437\u044b\u043a\u043e\u0432', '\u041a\u0430\u0441\u0442\u043e\u043c. \u0430\u0432\u0430\u0442\u0430\u0440\u044b', '\u0428\u0430\u0431\u043b\u043e\u043d\u044b'],
    url: 'https://www.synthesia.io/?ref=tubeforge',
    pricing: 'From $18/mo',
    pricingRu: '\u041e\u0442 $18/\u043c\u0435\u0441',
    badge: 'Popular',
    gradient: ['#7c3aed', '#c026d3'],
  },
  {
    id: 'steve-ai',
    name: 'Steve AI',
    logo: '\u2b50',
    description: 'Transform scripts into animated or live-action videos. Choose from multiple visual styles for engaging storytelling content.',
    descriptionRu: '\u041f\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0439\u0442\u0435 \u0441\u043a\u0440\u0438\u043f\u0442\u044b \u0432 \u0430\u043d\u0438\u043c\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0435 \u0438\u043b\u0438 \u043b\u0430\u0439\u0432-\u0432\u0438\u0434\u0435\u043e. \u041d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u0432\u0438\u0437\u0443\u0430\u043b\u044c\u043d\u044b\u0445 \u0441\u0442\u0438\u043b\u0435\u0439 \u0434\u043b\u044f \u0443\u0432\u043b\u0435\u043a\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0433\u043e \u043a\u043e\u043d\u0442\u0435\u043d\u0442\u0430.',
    features: ['Script to Animation', 'Live Action', 'Multiple Styles', 'AI Voiceover', 'Templates'],
    featuresRu: ['\u0421\u043a\u0440\u0438\u043f\u0442 \u0432 \u0430\u043d\u0438\u043c\u0430\u0446\u0438\u044e', '\u041b\u0430\u0439\u0432-\u0432\u0438\u0434\u0435\u043e', '\u041d\u0435\u0441\u043a. \u0441\u0442\u0438\u043b\u0435\u0439', '\u0418\u0418-\u043e\u0437\u0432\u0443\u0447\u043a\u0430', '\u0428\u0430\u0431\u043b\u043e\u043d\u044b'],
    url: 'https://www.steve.ai/?ref=tubeforge',
    pricing: 'From $20/mo',
    pricingRu: '\u041e\u0442 $20/\u043c\u0435\u0441',
    gradient: ['#f59e0b', '#ef4444'],
  },
];

export function RedditVideoGenerator() {
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
          {isRu ? '\ud83c\udfac \u0413\u0435\u043d\u0435\u0440\u0430\u0442\u043e\u0440 Reddit-\u0432\u0438\u0434\u0435\u043e' : '\ud83c\udfac Reddit Video Generator'}
        </h1>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
          {isRu
            ? '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0435\u0440\u0432\u0438\u0441 \u0434\u043b\u044f \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u044f Reddit-\u0432\u0438\u0434\u0435\u043e. \u041e\u0442\u043b\u0438\u0447\u043d\u043e \u0434\u043b\u044f \u0441\u0442\u043e\u0440\u0438\u0442\u0435\u043b\u043b\u0438\u043d\u0433\u0430, \u043e\u0437\u0432\u0443\u0447\u043a\u0438 \u0438 \u0432\u0438\u0440\u0430\u043b\u044c\u043d\u043e\u0433\u043e \u043a\u043e\u043d\u0442\u0435\u043d\u0442\u0430.'
            : 'Choose a service for Reddit video creation. Great for storytelling, narration, and viral content.'}
        </p>
      </div>

      {/* Tip box */}
      <div style={{
        padding: '14px 18px', background: `${C.blue}0a`, border: `1px solid ${C.blue}20`,
        borderRadius: 12, marginBottom: 28, fontSize: 13, color: C.sub, lineHeight: 1.6,
      }}>
        {isRu
          ? '\ud83d\udca1 \u0421\u043e\u0432\u0435\u0442: InVideo AI \u0434\u043b\u044f \u0444\u043e\u0440\u043c\u0430\u0442\u0430 Reddit-\u0438\u0441\u0442\u043e\u0440\u0438\u0439. Synthesia \u0434\u043b\u044f \u0432\u0438\u0434\u0435\u043e \u0441 \u0433\u043e\u0432\u043e\u0440\u044f\u0449\u0435\u0439 \u0433\u043e\u043b\u043e\u0432\u043e\u0439. Pictory \u0434\u043b\u044f \u043f\u0435\u0440\u0435\u0440\u0430\u0431\u043e\u0442\u043a\u0438 \u0441\u0442\u0430\u0442\u0435\u0439 \u0438 \u0431\u043b\u043e\u0433\u043e\u0432.'
          : '\ud83d\udca1 Tip: InVideo AI for Reddit story format. Synthesia for talking-head videos. Pictory for repurposing blog/article content.'}
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
          ? '\u2699\ufe0f \u041f\u043e\u043b\u043d\u0430\u044f \u0438\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044f \u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u0438 Reddit-\u0432\u0438\u0434\u0435\u043e \u0432 TubeForge \u2014 \u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0435. \u0421\u043b\u0435\u0434\u0438\u0442\u0435 \u0437\u0430 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f\u043c\u0438!'
          : '\u2699\ufe0f Full Reddit video generation integration inside TubeForge \u2014 coming soon. Stay tuned!'}
      </div>
    </div>
  );
}
