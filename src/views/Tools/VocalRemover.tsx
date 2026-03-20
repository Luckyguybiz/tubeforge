'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ═══════════════════════════════════════════════════════════════════════════
   Vocal Remover Providers — referral links page
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
    id: 'lalal',
    name: 'LALAL.AI',
    logo: '\uD83C\uDFB5',
    description: 'AI-powered vocal and instrumental separation with studio-grade quality. Supports stems for vocals, drums, bass, guitar, and more.',
    descriptionRu: '\u0420\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0432\u043E\u043A\u0430\u043B\u0430 \u0438 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u043D\u0430 \u0431\u0430\u0437\u0435 \u0418\u0418 \u0441\u0442\u0443\u0434\u0438\u0439\u043D\u043E\u0433\u043E \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0430. \u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 \u0441\u0442\u0435\u043C\u044B: \u0432\u043E\u043A\u0430\u043B, \u0431\u0430\u0440\u0430\u0431\u0430\u043D\u044B, \u0431\u0430\u0441, \u0433\u0438\u0442\u0430\u0440\u0430 \u0438 \u0434\u0440.',
    features: ['Vocal Removal', 'Stem Separation', 'Noise Cancellation', 'Batch Processing', 'API Access'],
    featuresRu: ['\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0432\u043E\u043A\u0430\u043B\u0430', '\u0420\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0441\u0442\u0435\u043C\u043E\u0432', '\u0428\u0443\u043C\u043E\u043F\u043E\u0434\u0430\u0432\u043B\u0435\u043D\u0438\u0435', '\u041F\u0430\u043A\u0435\u0442\u043D\u0430\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430', 'API \u0434\u043E\u0441\u0442\u0443\u043F'],
    url: 'https://www.lalal.ai/?ref=tubeforge',
    pricing: 'Free tier \u2022 From $15 for 90 min',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444 \u2022 \u041E\u0442 $15 \u0437\u0430 90 \u043C\u0438\u043D',
    badge: 'Best Quality',
    gradient: ['#d946ef', '#c026d3'],
  },
  {
    id: 'moises',
    name: 'Moises.ai',
    logo: '\uD83C\uDFA4',
    description: 'Music practice app with AI-powered audio separation. Perfect for musicians who want to isolate instruments or vocals for practice.',
    descriptionRu: '\u041F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u043C\u0443\u0437\u044B\u043A\u0430\u043D\u0442\u043E\u0432 \u0441 \u0418\u0418-\u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u0435\u043C \u0430\u0443\u0434\u0438\u043E. \u0418\u0434\u0435\u0430\u043B\u044C\u043D\u043E \u0434\u043B\u044F \u0438\u0437\u043E\u043B\u044F\u0446\u0438\u0438 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u0438\u043B\u0438 \u0432\u043E\u043A\u0430\u043B\u0430 \u0434\u043B\u044F \u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0438.',
    features: ['5-Stem Separation', 'Pitch Changer', 'Tempo Control', 'Chord Detection', 'Mobile App'],
    featuresRu: ['5-\u0441\u0442\u0435\u043C \u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u0435', '\u0421\u043C\u0435\u043D\u0430 \u0442\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438', '\u041A\u043E\u043D\u0442\u0440\u043E\u043B\u044C \u0442\u0435\u043C\u043F\u0430', '\u041E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0430\u043A\u043A\u043E\u0440\u0434\u043E\u0432', '\u041C\u043E\u0431. \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435'],
    url: 'https://moises.ai/?ref=tubeforge',
    pricing: 'Free tier \u2022 Premium from $3.99/mo',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444 \u2022 Premium \u043E\u0442 $3.99/\u043C\u0435\u0441',
    badge: 'Popular',
    gradient: ['#8b5cf6', '#6366f1'],
  },
  {
    id: 'phonicmind',
    name: 'PhonicMind',
    logo: '\uD83C\uDFB6',
    description: 'One of the first AI vocal removers. Specializes in creating high-quality karaoke tracks and acapellas from any song.',
    descriptionRu: '\u041E\u0434\u0438\u043D \u0438\u0437 \u043F\u0435\u0440\u0432\u044B\u0445 \u0418\u0418-\u0441\u0435\u0440\u0432\u0438\u0441\u043E\u0432 \u0434\u043B\u044F \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0432\u043E\u043A\u0430\u043B\u0430. \u0421\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u0443\u0435\u0442\u0441\u044F \u043D\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u043A\u0430\u0440\u0430\u043E\u043A\u0435 \u0438 \u0430\u043A\u0430\u043F\u0435\u043B\u043B \u0438\u0437 \u043B\u044E\u0431\u043E\u0439 \u043F\u0435\u0441\u043D\u0438.',
    features: ['Vocal Isolation', 'Karaoke Creation', 'Drums Separation', 'Bass Extraction', 'MP3/WAV Export'],
    featuresRu: ['\u0418\u0437\u043E\u043B\u044F\u0446\u0438\u044F \u0432\u043E\u043A\u0430\u043B\u0430', '\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043A\u0430\u0440\u0430\u043E\u043A\u0435', '\u041E\u0442\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0431\u0430\u0440\u0430\u0431\u0430\u043D\u043E\u0432', '\u042D\u043A\u0441\u0442\u0440\u0430\u043A\u0446\u0438\u044F \u0431\u0430\u0441\u0430', '\u042D\u043A\u0441\u043F\u043E\u0440\u0442 MP3/WAV'],
    url: 'https://phonicmind.com/?ref=tubeforge',
    pricing: 'From $6.99/mo \u2022 Pay-per-song available',
    pricingRu: '\u041E\u0442 $6.99/\u043C\u0435\u0441 \u2022 \u041E\u043F\u043B\u0430\u0442\u0430 \u0437\u0430 \u043F\u0435\u0441\u043D\u044E',
    gradient: ['#ec4899', '#f43f5e'],
  },
  {
    id: 'adobe-podcast',
    name: 'Adobe Podcast',
    logo: '\uD83C\uDF99\uFE0F',
    description: 'Adobe\'s free AI audio tool with vocal enhancement and noise removal. Great for podcasters and video creators needing clean audio.',
    descriptionRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0418\u0418-\u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442 Adobe \u0434\u043B\u044F \u0443\u043B\u0443\u0447\u0448\u0435\u043D\u0438\u044F \u0433\u043E\u043B\u043E\u0441\u0430 \u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0448\u0443\u043C\u0430. \u041E\u0442\u043B\u0438\u0447\u043D\u043E \u0434\u043B\u044F \u043F\u043E\u0434\u043A\u0430\u0441\u0442\u0435\u0440\u043E\u0432 \u0438 \u0432\u0438\u0434\u0435\u043E\u043C\u0435\u0439\u043A\u0435\u0440\u043E\u0432.',
    features: ['Enhance Speech', 'Remove Noise', 'Free to Use', 'Browser-Based', 'Studio Quality'],
    featuresRu: ['\u0423\u043B\u0443\u0447\u0448\u0435\u043D\u0438\u0435 \u0440\u0435\u0447\u0438', '\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0448\u0443\u043C\u0430', '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E', '\u0412 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435', '\u0421\u0442\u0443\u0434\u0438\u0439\u043D\u043E\u0435 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u043E'],
    url: 'https://podcast.adobe.com/?ref=tubeforge',
    pricing: 'Free with Adobe account',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E \u0441 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u043E\u043C Adobe',
    badge: 'Free',
    gradient: ['#f97316', '#ef4444'],
  },
];

export function VocalRemover() {
  const C = useThemeStore((s) => s.theme);
  const { locale } = useLocaleStore();
  const isRu = locale === 'ru' || locale === 'kk';
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: C.text,
          marginBottom: 8,
          letterSpacing: '-0.02em',
        }}>
          {isRu ? '\uD83C\uDFB5 \u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0432\u043E\u043A\u0430\u043B\u0430 \u0438\u0437 \u043C\u0443\u0437\u044B\u043A\u0438' : '\uD83C\uDFB5 AI Vocal Remover'}
        </h1>
        <p style={{
          fontSize: 15,
          color: C.sub,
          lineHeight: 1.6,
          maxWidth: 600,
          margin: '0 auto',
        }}>
          {isRu
            ? '\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0435\u0440\u0432\u0438\u0441 \u0434\u043B\u044F \u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u044F \u0432\u043E\u043A\u0430\u043B\u0430 \u0438 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E \u0418\u0418. \u0418\u0434\u0435\u0430\u043B\u044C\u043D\u043E \u0434\u043B\u044F \u043A\u0430\u0440\u0430\u043E\u043A\u0435, \u0440\u0435\u043C\u0438\u043A\u0441\u043E\u0432 \u0438 \u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0438.'
            : 'Choose a service for AI-powered vocal and instrumental separation. Perfect for karaoke, remixes, and music practice.'}
        </p>
      </div>

      {/* Tip box */}
      <div style={{
        padding: '14px 18px',
        background: `${C.blue}0a`,
        border: `1px solid ${C.blue}20`,
        borderRadius: 12,
        marginBottom: 28,
        fontSize: 13,
        color: C.sub,
        lineHeight: 1.6,
      }}>
        {isRu
          ? '\uD83D\uDCA1 \u0421\u043E\u0432\u0435\u0442: LALAL.AI \u0434\u0430\u0451\u0442 \u043B\u0443\u0447\u0448\u0435\u0435 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u043E \u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u044F. \u0414\u043B\u044F \u043C\u0443\u0437\u044B\u043A\u0430\u043D\u0442\u043E\u0432 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u043C Moises.ai (5-\u0441\u0442\u0435\u043C + \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0430\u043A\u043A\u043E\u0440\u0434\u043E\u0432). Adobe Podcast \u2014 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442 \u0434\u043B\u044F \u043E\u0447\u0438\u0441\u0442\u043A\u0438 \u0440\u0435\u0447\u0438.'
          : '\uD83D\uDCA1 Tip: LALAL.AI delivers the best separation quality. For musicians, we recommend Moises.ai (5-stem + chord detection). Adobe Podcast is a free option for speech cleanup.'}
      </div>

      {/* Provider cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16,
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
              display: 'block',
              textDecoration: 'none',
              padding: '20px',
              background: C.surface,
              border: `1px solid ${hoveredId === p.id ? C.accent : C.border}`,
              borderRadius: 16,
              transition: 'all 0.2s ease',
              transform: hoveredId === p.id ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredId === p.id ? `0 8px 24px ${C.accent}15` : 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Gradient top bar */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, ${p.gradient[0]}, ${p.gradient[1]})`,
            }} />

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{p.logo}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{p.name}</span>
                  {p.badge && (
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})`,
                      color: '#fff', letterSpacing: 0.3,
                    }}>
                      {p.badge}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
                  {isRu ? p.pricingRu : p.pricing}
                </div>
              </div>
            </div>

            {/* Description */}
            <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.5, margin: '0 0 14px' }}>
              {isRu ? p.descriptionRu : p.description}
            </p>

            {/* Features */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(isRu ? p.featuresRu : p.features).map((f, i) => (
                <span key={i} style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: `${p.gradient[0]}12`, color: p.gradient[0],
                  border: `1px solid ${p.gradient[0]}20`,
                }}>
                  {f}
                </span>
              ))}
            </div>

            {/* CTA arrow */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              marginTop: 14, fontSize: 13, fontWeight: 600, color: C.accent, gap: 6,
            }}>
              {isRu ? '\u041F\u0435\u0440\u0435\u0439\u0442\u0438' : 'Visit'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </div>
          </a>
        ))}
      </div>

      {/* Bottom note */}
      <div style={{
        marginTop: 28, padding: '16px 20px', background: C.surface, borderRadius: 12,
        border: `1px solid ${C.border}`, fontSize: 13, color: C.dim, lineHeight: 1.6, textAlign: 'center',
      }}>
        {isRu
          ? '\u2699\uFE0F \u041F\u043E\u043B\u043D\u0430\u044F \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0432\u043E\u043A\u0430\u043B\u0430 \u0432 TubeForge \u2014 \u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0435. \u0421\u043B\u0435\u0434\u0438\u0442\u0435 \u0437\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F\u043C\u0438!'
          : '\u2699\uFE0F Full vocal removal integration inside TubeForge \u2014 coming soon. Stay tuned!'}
      </div>
    </div>
  );
}
