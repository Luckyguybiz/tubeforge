'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ═══════════════════════════════════════════════════════════════════════════
   Voice Changer Providers — referral links page
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
    id: 'voicemod',
    name: 'Voicemod',
    logo: '\uD83C\uDFAD',
    description: 'Real-time voice changer with soundboard effects. Free tier available, perfect for gaming and streaming.',
    descriptionRu: '\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0433\u043E\u043B\u043E\u0441\u0430 \u0432 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u043C \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u0441 \u0437\u0432\u0443\u043A\u043E\u0432\u044B\u043C\u0438 \u044D\u0444\u0444\u0435\u043A\u0442\u0430\u043C\u0438. \u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444, \u0438\u0434\u0435\u0430\u043B\u044C\u043D\u043E \u0434\u043B\u044F \u0438\u0433\u0440 \u0438 \u0441\u0442\u0440\u0438\u043C\u043E\u0432.',
    features: ['Real-Time', 'Soundboard', 'Free Tier', 'Streaming Integration', 'Custom Voices'],
    featuresRu: ['\u0420\u0435\u0430\u043B\u044C\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F', '\u0417\u0432\u0443\u043A\u043E\u0432\u0430\u044F \u043F\u0430\u043D\u0435\u043B\u044C', '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444', '\u0418\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F \u0441\u0442\u0440\u0438\u043C\u043E\u0432', '\u041A\u0430\u0441\u0442\u043E\u043C\u043D\u044B\u0435 \u0433\u043E\u043B\u043E\u0441\u0430'],
    url: 'https://www.voicemod.net/?ref=tubeforge',
    pricing: 'Free tier \u2022 From $4.50/mo',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444 \u2022 \u041E\u0442 $4.50/\u043C\u0435\u0441',
    badge: 'Popular',
    gradient: ['#7c3aed', '#c026d3'],
  },
  {
    id: 'murf',
    name: 'Murf.ai',
    logo: '\uD83D\uDDE3\uFE0F',
    description: 'AI voice generator with 120+ studio-quality voices. Perfect for professional narration and voiceover projects.',
    descriptionRu: '\u0418\u0418-\u0433\u0435\u043D\u0435\u0440\u0430\u0442\u043E\u0440 \u0433\u043E\u043B\u043E\u0441\u0430 \u0441 120+ \u0433\u043E\u043B\u043E\u0441\u0430\u043C\u0438 \u0441\u0442\u0443\u0434\u0438\u0439\u043D\u043E\u0433\u043E \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0430. \u0418\u0434\u0435\u0430\u043B\u044C\u043D\u043E \u0434\u043B\u044F \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0439 \u043E\u0437\u0432\u0443\u0447\u043A\u0438.',
    features: ['120+ Voices', 'Studio Quality', 'Script Editor', 'Team Access', 'Commercial License'],
    featuresRu: ['120+ \u0433\u043E\u043B\u043E\u0441\u043E\u0432', '\u0421\u0442\u0443\u0434\u0438\u0439\u043D\u043E\u0435 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u043E', '\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0441\u043A\u0440\u0438\u043F\u0442\u043E\u0432', '\u041A\u043E\u043C\u0430\u043D\u0434\u043D\u044B\u0439 \u0434\u043E\u0441\u0442\u0443\u043F', '\u041A\u043E\u043C\u043C. \u043B\u0438\u0446\u0435\u043D\u0437\u0438\u044F'],
    url: 'https://murf.ai/?ref=tubeforge',
    pricing: 'Free trial \u2022 From $19/mo',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u043F\u0440\u043E\u0431\u043D\u044B\u0439 \u2022 \u041E\u0442 $19/\u043C\u0435\u0441',
    badge: 'Best Quality',
    gradient: ['#0891b2', '#0d9488'],
  },
  {
    id: 'resemble',
    name: 'Resemble.ai',
    logo: '\uD83D\uDD0A',
    description: 'AI voice cloning platform with custom voice creation and full API access. Build unique voice experiences.',
    descriptionRu: '\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u043A\u043B\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0433\u043E\u043B\u043E\u0441\u0430 \u043D\u0430 \u0418\u0418 \u0441 \u043A\u0430\u0441\u0442\u043E\u043C\u043D\u044B\u043C\u0438 \u0433\u043E\u043B\u043E\u0441\u0430\u043C\u0438 \u0438 API \u0434\u043E\u0441\u0442\u0443\u043F\u043E\u043C. \u0421\u043E\u0437\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u0443\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u044B\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u044F.',
    features: ['Voice Cloning', 'Custom Voices', 'API Access', 'Emotion Control', 'Real-Time'],
    featuresRu: ['\u041A\u043B\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0433\u043E\u043B\u043E\u0441\u0430', '\u041A\u0430\u0441\u0442\u043E\u043C\u043D\u044B\u0435 \u0433\u043E\u043B\u043E\u0441\u0430', 'API \u0434\u043E\u0441\u0442\u0443\u043F', '\u041A\u043E\u043D\u0442\u0440\u043E\u043B\u044C \u044D\u043C\u043E\u0446\u0438\u0439', '\u0420\u0435\u0430\u043B\u044C\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F'],
    url: 'https://www.resemble.ai/?ref=tubeforge',
    pricing: 'From $0.006/sec \u2022 Custom plans',
    pricingRu: '\u041E\u0442 $0.006/\u0441\u0435\u043A \u2022 \u0418\u043D\u0434\u0438\u0432. \u043F\u043B\u0430\u043D\u044B',
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    logo: '\uD83C\uDF99\uFE0F',
    description: 'Most realistic AI voices with multilingual support. Free tier available with powerful API for developers.',
    descriptionRu: '\u0421\u0430\u043C\u044B\u0435 \u0440\u0435\u0430\u043B\u0438\u0441\u0442\u0438\u0447\u043D\u044B\u0435 \u0418\u0418-\u0433\u043E\u043B\u043E\u0441\u0430 \u0441 \u043C\u043D\u043E\u0433\u043E\u044F\u0437\u044B\u0447\u043D\u043E\u0439 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u043E\u0439. \u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444 \u0438 \u043C\u043E\u0449\u043D\u044B\u0439 API \u0434\u043B\u044F \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A\u043E\u0432.',
    features: ['Realistic Voices', 'Multilingual', 'Voice Cloning', 'API Access', 'Free Tier'],
    featuresRu: ['\u0420\u0435\u0430\u043B\u0438\u0441\u0442\u0438\u0447\u043D\u044B\u0435 \u0433\u043E\u043B\u043E\u0441\u0430', '\u041C\u043D\u043E\u0433\u043E\u044F\u0437\u044B\u0447\u043D\u043E\u0441\u0442\u044C', '\u041A\u043B\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0433\u043E\u043B\u043E\u0441\u0430', 'API \u0434\u043E\u0441\u0442\u0443\u043F', '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444'],
    url: 'https://elevenlabs.io/?ref=tubeforge',
    pricing: 'Free tier \u2022 From $5/mo',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444 \u2022 \u041E\u0442 $5/\u043C\u0435\u0441',
    badge: 'Trending',
    gradient: ['#f59e0b', '#ef4444'],
  },
];

export function VoiceChanger() {
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
          {isRu ? '\uD83C\uDFAD \u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0433\u043E\u043B\u043E\u0441\u0430' : '\uD83C\uDFAD Voice Changer'}
        </h1>
        <p style={{
          fontSize: 15,
          color: C.sub,
          lineHeight: 1.6,
          maxWidth: 600,
          margin: '0 auto',
        }}>
          {isRu
            ? '\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0435\u0440\u0432\u0438\u0441 \u0434\u043B\u044F \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0438\u043B\u0438 \u043A\u043B\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0433\u043E\u043B\u043E\u0441\u0430. \u0414\u043B\u044F \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430, \u0438\u0433\u0440, \u0441\u0442\u0440\u0438\u043C\u043E\u0432 \u0438 \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0439 \u043E\u0437\u0432\u0443\u0447\u043A\u0438.'
            : 'Choose a voice changing or cloning service. For content creation, gaming, streaming, and professional voiceover.'}
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
          ? '\uD83D\uDCA1 \u0421\u043E\u0432\u0435\u0442: ElevenLabs \u0434\u043B\u044F \u0441\u0430\u043C\u044B\u0445 \u0440\u0435\u0430\u043B\u0438\u0441\u0442\u0438\u0447\u043D\u044B\u0445 \u0433\u043E\u043B\u043E\u0441\u043E\u0432, Voicemod \u0434\u043B\u044F \u0438\u0433\u0440/\u0441\u0442\u0440\u0438\u043C\u043E\u0432 \u0432 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u043C \u0432\u0440\u0435\u043C\u0435\u043D\u0438. Murf.ai \u0434\u043B\u044F \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0439 \u043E\u0437\u0432\u0443\u0447\u043A\u0438.'
          : '\uD83D\uDCA1 Tip: ElevenLabs for most realistic voices, Voicemod for real-time gaming/streaming. Murf.ai for professional narration.'}
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
          ? '\u2699\uFE0F \u041F\u043E\u043B\u043D\u0430\u044F \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0433\u043E\u043B\u043E\u0441\u0430 \u0432 TubeForge \u2014 \u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0435. \u0421\u043B\u0435\u0434\u0438\u0442\u0435 \u0437\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F\u043C\u0438!'
          : '\u2699\uFE0F Full voice changer integration inside TubeForge \u2014 coming soon. Stay tuned!'}
      </div>
    </div>
  );
}
