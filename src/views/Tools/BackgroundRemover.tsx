'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ═══════════════════════════════════════════════════════════════════════════
   Background Remover Providers — referral links page
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
    id: 'removebg',
    name: 'remove.bg',
    logo: '\u2702\uFE0F',
    description: 'The original AI background remover. Instant, precise results for people, products, animals, and more. API available for automation.',
    descriptionRu: '\u041E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u0418\u0418-\u0441\u0435\u0440\u0432\u0438\u0441 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0444\u043E\u043D\u0430. \u041C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u044B\u0435, \u0442\u043E\u0447\u043D\u044B\u0435 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B \u0434\u043B\u044F \u043B\u044E\u0434\u0435\u0439, \u0442\u043E\u0432\u0430\u0440\u043E\u0432, \u0436\u0438\u0432\u043E\u0442\u043D\u044B\u0445. API \u0434\u043B\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0437\u0430\u0446\u0438\u0438.',
    features: ['Instant Removal', 'HD Output', 'API Access', 'Batch Processing', 'Photoshop Plugin'],
    featuresRu: ['\u041C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u043E\u0435 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435', 'HD \u0432\u044B\u0445\u043E\u0434', 'API \u0434\u043E\u0441\u0442\u0443\u043F', '\u041F\u0430\u043A\u0435\u0442\u043D\u0430\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430', '\u041F\u043B\u0430\u0433\u0438\u043D Photoshop'],
    url: 'https://www.remove.bg/?ref=tubeforge',
    pricing: '1 free HD/wk \u2022 From $0.20/image',
    pricingRu: '1 \u0431\u0435\u0441\u043F\u043B. HD/\u043D\u0435\u0434 \u2022 \u041E\u0442 $0.20/\u0438\u0437\u043E\u0431\u0440.',
    badge: 'Popular',
    gradient: ['#8b5cf6', '#7c3aed'],
  },
  {
    id: 'photoroom',
    name: 'PhotoRoom',
    logo: '\uD83D\uDDBC\uFE0F',
    description: 'AI-powered photo editor for e-commerce and social media. Remove backgrounds, add shadows, and create professional product photos.',
    descriptionRu: '\u0418\u0418-\u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0444\u043E\u0442\u043E \u0434\u043B\u044F e-commerce \u0438 \u0441\u043E\u0446\u0441\u0435\u0442\u0435\u0439. \u0423\u0434\u0430\u043B\u044F\u0439\u0442\u0435 \u0444\u043E\u043D, \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0439\u0442\u0435 \u0442\u0435\u043D\u0438, \u0441\u043E\u0437\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u043F\u0440\u043E\u0444. \u0444\u043E\u0442\u043E \u0442\u043E\u0432\u0430\u0440\u043E\u0432.',
    features: ['AI Background', 'Product Photos', 'Magic Eraser', 'Templates', 'Mobile App'],
    featuresRu: ['\u0418\u0418-\u0444\u043E\u043D', '\u0424\u043E\u0442\u043E \u0442\u043E\u0432\u0430\u0440\u043E\u0432', '\u041C\u0430\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043B\u0430\u0441\u0442\u0438\u043A', '\u0428\u0430\u0431\u043B\u043E\u043D\u044B', '\u041C\u043E\u0431. \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435'],
    url: 'https://www.photoroom.com/?ref=tubeforge',
    pricing: 'Free tier \u2022 Pro from $9.99/mo',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444 \u2022 Pro \u043E\u0442 $9.99/\u043C\u0435\u0441',
    badge: 'Best for E-commerce',
    gradient: ['#06b6d4', '#0891b2'],
  },
  {
    id: 'canva',
    name: 'Canva',
    logo: '\uD83C\uDFA8',
    description: 'All-in-one design platform with powerful background remover built in. Perfect for creating thumbnails and social media graphics.',
    descriptionRu: '\u0423\u043D\u0438\u0432\u0435\u0440\u0441\u0430\u043B\u044C\u043D\u0430\u044F \u0434\u0438\u0437\u0430\u0439\u043D-\u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u0441 \u043C\u043E\u0449\u043D\u044B\u043C \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435\u043C \u0444\u043E\u043D\u0430. \u0418\u0434\u0435\u0430\u043B\u044C\u043D\u0430 \u0434\u043B\u044F \u043F\u0440\u0435\u0432\u044C\u044E \u0438 \u0433\u0440\u0430\u0444\u0438\u043A\u0438 \u0434\u043B\u044F \u0441\u043E\u0446\u0441\u0435\u0442\u0435\u0439.',
    features: ['BG Remover', 'Design Editor', 'Templates', 'Brand Kit', 'Team Collaboration'],
    featuresRu: ['\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0444\u043E\u043D\u0430', '\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440', '\u0428\u0430\u0431\u043B\u043E\u043D\u044B', '\u0411\u0440\u0435\u043D\u0434-\u043A\u0438\u0442', '\u041A\u043E\u043C\u0430\u043D\u0434\u043D\u0430\u044F \u0440\u0430\u0431\u043E\u0442\u0430'],
    url: 'https://www.canva.com/?ref=tubeforge',
    pricing: 'Free tier \u2022 Pro from $12.99/mo',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444 \u2022 Pro \u043E\u0442 $12.99/\u043C\u0435\u0441',
    gradient: ['#10b981', '#059669'],
  },
  {
    id: 'pixlr',
    name: 'Pixlr',
    logo: '\u2728',
    description: 'Free online photo editor with AI background removal. Lightweight, browser-based alternative with no software installation needed.',
    descriptionRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u043E\u043D\u043B\u0430\u0439\u043D-\u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0441 \u0418\u0418-\u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435\u043C \u0444\u043E\u043D\u0430. \u041B\u0451\u0433\u043A\u0430\u044F \u0430\u043B\u044C\u0442\u0435\u0440\u043D\u0430\u0442\u0438\u0432\u0430 \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435, \u0431\u0435\u0437 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 \u041F\u041E.',
    features: ['Free BG Remove', 'Photo Editor', 'AI Tools', 'Batch Edit', 'No Install'],
    featuresRu: ['\u0411\u0435\u0441\u043F\u043B. \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0444\u043E\u043D\u0430', '\u0424\u043E\u0442\u043E\u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440', '\u0418\u0418-\u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B', '\u041F\u0430\u043A\u0435\u0442\u043D\u0430\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430', '\u0411\u0435\u0437 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438'],
    url: 'https://pixlr.com/?ref=tubeforge',
    pricing: 'Free \u2022 Premium from $4.90/mo',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E \u2022 Premium \u043E\u0442 $4.90/\u043C\u0435\u0441',
    badge: 'Free',
    gradient: ['#3b82f6', '#2563eb'],
  },
];

export function BackgroundRemover() {
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
          {isRu ? '\u2702\uFE0F \u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0444\u043E\u043D\u0430 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0439' : '\u2702\uFE0F AI Background Remover'}
        </h1>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
          {isRu
            ? '\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0435\u0440\u0432\u0438\u0441 \u0434\u043B\u044F \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0444\u043E\u043D\u0430 \u0441 \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0439. \u041E\u0442\u043B\u0438\u0447\u043D\u043E \u0434\u043B\u044F \u043F\u0440\u0435\u0432\u044C\u044E, \u0442\u043E\u0432\u0430\u0440\u043D\u044B\u0445 \u0444\u043E\u0442\u043E \u0438 \u0434\u0438\u0437\u0430\u0439\u043D\u0430.'
            : 'Choose a service for AI background removal from images. Great for thumbnails, product photos, and design.'}
        </p>
      </div>

      {/* Tip box */}
      <div style={{
        padding: '14px 18px', background: `${C.blue}0a`, border: `1px solid ${C.blue}20`,
        borderRadius: 12, marginBottom: 28, fontSize: 13, color: C.sub, lineHeight: 1.6,
      }}>
        {isRu
          ? '\uD83D\uDCA1 \u0421\u043E\u0432\u0435\u0442: remove.bg \u2014 \u043B\u0443\u0447\u0448\u0438\u0439 \u0432\u044B\u0431\u043E\u0440 \u0434\u043B\u044F \u0431\u044B\u0441\u0442\u0440\u043E\u0433\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0444\u043E\u043D\u0430. PhotoRoom \u0438\u0434\u0435\u0430\u043B\u0435\u043D \u0434\u043B\u044F e-commerce. Canva \u043F\u043E\u0434\u0445\u043E\u0434\u0438\u0442, \u0435\u0441\u043B\u0438 \u043D\u0443\u0436\u0435\u043D \u043F\u043E\u043B\u043D\u044B\u0439 \u0434\u0438\u0437\u0430\u0439\u043D-\u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440.'
          : '\uD83D\uDCA1 Tip: remove.bg is best for quick background removal. PhotoRoom is ideal for e-commerce. Canva works great if you need a full design editor.'}
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
              {isRu ? '\u041F\u0435\u0440\u0435\u0439\u0442\u0438' : 'Visit'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg>
            </div>
          </a>
        ))}
      </div>

      {/* Bottom note */}
      <div style={{ marginTop: 28, padding: '16px 20px', background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 13, color: C.dim, lineHeight: 1.6, textAlign: 'center' }}>
        {isRu
          ? '\u2699\uFE0F \u041F\u043E\u043B\u043D\u0430\u044F \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0444\u043E\u043D\u0430 \u0432 TubeForge \u2014 \u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0435. \u0421\u043B\u0435\u0434\u0438\u0442\u0435 \u0437\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F\u043C\u0438!'
          : '\u2699\uFE0F Full background removal integration inside TubeForge \u2014 coming soon. Stay tuned!'}
      </div>
    </div>
  );
}
