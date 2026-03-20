'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ═══════════════════════════════════════════════════════════════════════════
   Audio Enhancement Providers — referral links page
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
    id: 'adobe-podcast',
    name: 'Adobe Podcast',
    logo: '\ud83c\udf99\ufe0f',
    description: 'Free AI-powered audio enhancement. Removes background noise, improves speech clarity, and polishes recordings instantly.',
    descriptionRu: '\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e\u0435 \u0418\u0418-\u0443\u043b\u0443\u0447\u0448\u0435\u043d\u0438\u0435 \u0430\u0443\u0434\u0438\u043e. \u0423\u0434\u0430\u043b\u044f\u0435\u0442 \u0444\u043e\u043d\u043e\u0432\u044b\u0439 \u0448\u0443\u043c, \u0443\u043b\u0443\u0447\u0448\u0430\u0435\u0442 \u0447\u0451\u0442\u043a\u043e\u0441\u0442\u044c \u0440\u0435\u0447\u0438 \u0438 \u043f\u043e\u043b\u0438\u0440\u0443\u0435\u0442 \u0437\u0430\u043f\u0438\u0441\u0438 \u043c\u0433\u043d\u043e\u0432\u0435\u043d\u043d\u043e.',
    features: ['AI Enhancement', 'Noise Removal', 'Speech Clarity', 'Free', 'Browser-Based'],
    featuresRu: ['\u0418\u0418-\u0443\u043b\u0443\u0447\u0448\u0435\u043d\u0438\u0435', '\u0423\u0434\u0430\u043b\u0435\u043d\u0438\u0435 \u0448\u0443\u043c\u0430', '\u0427\u0451\u0442\u043a\u043e\u0441\u0442\u044c \u0440\u0435\u0447\u0438', '\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e', '\u0412 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435'],
    url: 'https://podcast.adobe.com/?ref=tubeforge',
    pricing: 'Free with Adobe',
    pricingRu: '\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e \u0441 Adobe',
    badge: 'Free',
    gradient: ['#f97316', '#ef4444'],
  },
  {
    id: 'auphonic',
    name: 'Auphonic',
    logo: '\ud83d\udd0a',
    description: 'Automatic audio post-production with loudness normalization, leveling, and noise reduction. Perfect for podcast producers.',
    descriptionRu: '\u0410\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u043f\u043e\u0441\u0442\u043f\u0440\u043e\u0434\u0430\u043a\u0448\u043d \u0430\u0443\u0434\u0438\u043e \u0441 \u043d\u043e\u0440\u043c\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u0435\u0439 \u0433\u0440\u043e\u043c\u043a\u043e\u0441\u0442\u0438, \u0432\u044b\u0440\u0430\u0432\u043d\u0438\u0432\u0430\u043d\u0438\u0435\u043c \u0438 \u0448\u0443\u043c\u043e\u043f\u043e\u0434\u0430\u0432\u043b\u0435\u043d\u0438\u0435\u043c. \u0418\u0434\u0435\u0430\u043b\u0435\u043d \u0434\u043b\u044f \u043f\u043e\u0434\u043a\u0430\u0441\u0442\u0435\u0440\u043e\u0432.',
    features: ['Auto Post-Production', 'Loudness Normalization', 'Noise Reduction', '2hrs Free/mo', 'Multi-Track'],
    featuresRu: ['\u0410\u0432\u0442\u043e-\u043f\u043e\u0441\u0442\u043f\u0440\u043e\u0434\u0430\u043a\u0448\u043d', '\u041d\u043e\u0440\u043c\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u044f \u0433\u0440\u043e\u043c\u043a.', '\u0428\u0443\u043c\u043e\u043f\u043e\u0434\u0430\u0432\u043b\u0435\u043d\u0438\u0435', '2 \u0447 \u0431\u0435\u0441\u043f\u043b./\u043c\u0435\u0441', '\u041c\u0443\u043b\u044c\u0442\u0438\u0442\u0440\u0435\u043a'],
    url: 'https://auphonic.com/?ref=tubeforge',
    pricing: '2hrs free/mo \u2022 From $11/mo',
    pricingRu: '2 \u0447 \u0431\u0435\u0441\u043f\u043b./\u043c\u0435\u0441 \u2022 \u041e\u0442 $11/\u043c\u0435\u0441',
    badge: 'Best for Podcasts',
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: 'izotope-rx',
    name: 'iZotope RX',
    logo: '\ud83c\udf9b\ufe0f',
    description: 'Professional audio repair suite. Industry-standard noise, hum, and click removal for studios and post-production facilities.',
    descriptionRu: '\u041f\u0440\u043e\u0444\u0435\u0441\u0441\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u044b\u0439 \u043d\u0430\u0431\u043e\u0440 \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f \u0430\u0443\u0434\u0438\u043e. \u0418\u043d\u0434\u0443\u0441\u0442\u0440\u0438\u0430\u043b\u044c\u043d\u044b\u0439 \u0441\u0442\u0430\u043d\u0434\u0430\u0440\u0442 \u0443\u0434\u0430\u043b\u0435\u043d\u0438\u044f \u0448\u0443\u043c\u0430, \u0433\u0443\u043b\u0430 \u0438 \u0449\u0435\u043b\u0447\u043a\u043e\u0432.',
    features: ['Pro Audio Repair', 'Noise Removal', 'Hum/Click Removal', 'Spectral Editor', 'DAW Plugin'],
    featuresRu: ['\u041f\u0440\u043e\u0444. \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435', '\u0423\u0434\u0430\u043b\u0435\u043d\u0438\u0435 \u0448\u0443\u043c\u0430', '\u0423\u0434\u0430\u043b. \u0433\u0443\u043b\u0430/\u0449\u0435\u043b\u0447\u043a\u043e\u0432', '\u0421\u043f\u0435\u043a\u0442\u0440. \u0440\u0435\u0434\u0430\u043a\u0442\u043e\u0440', 'DAW \u043f\u043b\u0430\u0433\u0438\u043d'],
    url: 'https://www.izotope.com/rx/?ref=tubeforge',
    pricing: 'From $129 one-time',
    pricingRu: '\u041e\u0442 $129 \u0435\u0434\u0438\u043d\u043e\u0440\u0430\u0437\u043e\u0432\u043e',
    gradient: ['#0891b2', '#0d9488'],
  },
  {
    id: 'descript',
    name: 'Descript',
    logo: '\ud83d\udcdd',
    description: 'Studio Sound AI for instant audio cleanup. Automatic filler word removal, green room feature, and text-based audio editing.',
    descriptionRu: 'Studio Sound AI \u0434\u043b\u044f \u043c\u0433\u043d\u043e\u0432\u0435\u043d\u043d\u043e\u0439 \u043e\u0447\u0438\u0441\u0442\u043a\u0438 \u0430\u0443\u0434\u0438\u043e. \u0410\u0432\u0442\u043e\u0443\u0434\u0430\u043b\u0435\u043d\u0438\u0435 \u0441\u043b\u043e\u0432-\u043f\u0430\u0440\u0430\u0437\u0438\u0442\u043e\u0432, \u0433\u0440\u0438\u043d-\u0440\u0443\u043c \u0438 \u0442\u0435\u043a\u0441\u0442\u043e\u0432\u043e\u0435 \u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435.',
    features: ['Studio Sound', 'Filler Removal', 'Green Room', 'Text Editing', 'Transcription'],
    featuresRu: ['Studio Sound', '\u0423\u0434\u0430\u043b. \u043f\u0430\u0440\u0430\u0437\u0438\u0442\u043e\u0432', '\u0413\u0440\u0438\u043d-\u0440\u0443\u043c', '\u0422\u0435\u043a\u0441\u0442. \u0440\u0435\u0434\u0430\u043a\u0442.', '\u0422\u0440\u0430\u043d\u0441\u043a\u0440\u0438\u043f\u0446\u0438\u044f'],
    url: 'https://www.descript.com/?ref=tubeforge',
    pricing: 'From $24/mo',
    pricingRu: '\u041e\u0442 $24/\u043c\u0435\u0441',
    gradient: ['#7c3aed', '#c026d3'],
  },
  {
    id: 'landr',
    name: 'LANDR',
    logo: '\ud83c\udfb5',
    description: 'AI-powered audio mastering with distribution and collaboration tools. One-stop shop for finishing and releasing your audio.',
    descriptionRu: '\u0418\u0418-\u043c\u0430\u0441\u0442\u0435\u0440\u0438\u043d\u0433 \u0430\u0443\u0434\u0438\u043e \u0441 \u0434\u0438\u0441\u0442\u0440\u0438\u0431\u044c\u044e\u0446\u0438\u0435\u0439 \u0438 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0430\u043c\u0438 \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u0447\u0435\u0441\u0442\u0432\u0430. \u0412\u0441\u0451 \u0434\u043b\u044f \u0444\u0438\u043d\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u0438 \u0438 \u0440\u0435\u043b\u0438\u0437\u0430.',
    features: ['AI Mastering', 'Distribution', 'Collaboration', 'Samples', 'Plugins'],
    featuresRu: ['\u0418\u0418-\u043c\u0430\u0441\u0442\u0435\u0440\u0438\u043d\u0433', '\u0414\u0438\u0441\u0442\u0440\u0438\u0431\u044c\u044e\u0446\u0438\u044f', '\u0421\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u0447\u0435\u0441\u0442\u0432\u043e', '\u0421\u044d\u043c\u043f\u043b\u044b', '\u041f\u043b\u0430\u0433\u0438\u043d\u044b'],
    url: 'https://www.landr.com/?ref=tubeforge',
    pricing: 'From $12.50/mo',
    pricingRu: '\u041e\u0442 $12.50/\u043c\u0435\u0441',
    gradient: ['#ec4899', '#f43f5e'],
  },
];

export function AudioBalancer() {
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
          {isRu ? '\ud83c\udf99\ufe0f \u0423\u043b\u0443\u0447\u0448\u0435\u043d\u0438\u0435 \u0430\u0443\u0434\u0438\u043e' : '\ud83c\udf99\ufe0f Audio Enhancement'}
        </h1>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
          {isRu
            ? '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0435\u0440\u0432\u0438\u0441 \u0434\u043b\u044f \u0443\u043b\u0443\u0447\u0448\u0435\u043d\u0438\u044f \u0430\u0443\u0434\u0438\u043e. \u041e\u0442\u043b\u0438\u0447\u043d\u043e \u0434\u043b\u044f \u043f\u043e\u0434\u043a\u0430\u0441\u0442\u043e\u0432, \u0432\u0438\u0434\u0435\u043e \u0438 \u043f\u0440\u043e\u0444\u0435\u0441\u0441\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u043e\u0433\u043e \u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0441\u0442\u0432\u0430.'
            : 'Choose a service for audio enhancement. Great for podcasts, video production, and professional audio work.'}
        </p>
      </div>

      {/* Tip box */}
      <div style={{
        padding: '14px 18px', background: `${C.blue}0a`, border: `1px solid ${C.blue}20`,
        borderRadius: 12, marginBottom: 28, fontSize: 13, color: C.sub, lineHeight: 1.6,
      }}>
        {isRu
          ? '\ud83d\udca1 \u0421\u043e\u0432\u0435\u0442: Adobe Podcast \u0434\u043b\u044f \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e\u0439 \u0431\u044b\u0441\u0442\u0440\u043e\u0439 \u043e\u0447\u0438\u0441\u0442\u043a\u0438. Auphonic \u0434\u043b\u044f \u043f\u0440\u043e\u0434\u0430\u043a\u0448\u043d\u0430 \u043f\u043e\u0434\u043a\u0430\u0441\u0442\u043e\u0432. iZotope RX \u0434\u043b\u044f \u043f\u0440\u043e\u0444\u0435\u0441\u0441\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u043e\u0439 \u0441\u0442\u0443\u0434\u0438\u0439\u043d\u043e\u0439 \u0440\u0430\u0431\u043e\u0442\u044b.'
          : '\ud83d\udca1 Tip: Adobe Podcast for free quick cleanup. Auphonic for podcast production. iZotope RX for professional studio work.'}
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
          ? '\u2699\ufe0f \u041f\u043e\u043b\u043d\u0430\u044f \u0438\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044f \u0443\u043b\u0443\u0447\u0448\u0435\u043d\u0438\u044f \u0430\u0443\u0434\u0438\u043e \u0432 TubeForge \u2014 \u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0435. \u0421\u043b\u0435\u0434\u0438\u0442\u0435 \u0437\u0430 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f\u043c\u0438!'
          : '\u2699\ufe0f Full audio enhancement integration inside TubeForge \u2014 coming soon. Stay tuned!'}
      </div>
    </div>
  );
}
