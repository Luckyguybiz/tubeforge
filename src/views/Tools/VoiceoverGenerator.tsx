'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ═══════════════════════════════════════════════════════════════════════════
   Voiceover Generator Providers — referral links page
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
    id: 'elevenlabs',
    name: 'ElevenLabs',
    logo: '\uD83C\uDF99\uFE0F',
    description: 'Industry-leading text-to-speech with the most natural-sounding AI voices. Perfect for YouTube narration, audiobooks, and podcasts.',
    descriptionRu: '\u041B\u0438\u0434\u0435\u0440 \u0438\u043D\u0434\u0443\u0441\u0442\u0440\u0438\u0438 \u0442\u0435\u043A\u0441\u0442-\u0432-\u0440\u0435\u0447\u044C \u0441 \u0441\u0430\u043C\u044B\u043C\u0438 \u043D\u0430\u0442\u0443\u0440\u0430\u043B\u044C\u043D\u044B\u043C\u0438 \u0433\u043E\u043B\u043E\u0441\u0430\u043C\u0438. \u0418\u0434\u0435\u0430\u043B\u0435\u043D \u0434\u043B\u044F YouTube, \u0430\u0443\u0434\u0438\u043E\u043A\u043D\u0438\u0433 \u0438 \u043F\u043E\u0434\u043A\u0430\u0441\u0442\u043E\u0432.',
    features: ['29+ Languages', 'Voice Cloning', 'Voice Library', 'Emotion Control', 'API Access'],
    featuresRu: ['29+ \u044F\u0437\u044B\u043A\u043E\u0432', '\u041A\u043B\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0433\u043E\u043B\u043E\u0441\u0430', '\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u0433\u043E\u043B\u043E\u0441\u043E\u0432', '\u041A\u043E\u043D\u0442\u0440\u043E\u043B\u044C \u044D\u043C\u043E\u0446\u0438\u0439', 'API \u0434\u043E\u0441\u0442\u0443\u043F'],
    url: 'https://elevenlabs.io/?ref=tubeforge',
    pricing: 'Free tier \u2022 From $5/mo',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444 \u2022 \u041E\u0442 $5/\u043C\u0435\u0441',
    badge: 'Best Quality',
    gradient: ['#3b82f6', '#6366f1'],
  },
  {
    id: 'playht',
    name: 'PlayHT',
    logo: '\u25B6\uFE0F',
    description: 'Ultra-realistic AI voices with fine-grained control over speech style, tone, and pacing. Great for long-form content.',
    descriptionRu: '\u0421\u0432\u0435\u0440\u0445\u0440\u0435\u0430\u043B\u0438\u0441\u0442\u0438\u0447\u043D\u044B\u0435 \u0418\u0418-\u0433\u043E\u043B\u043E\u0441\u0430 \u0441 \u0442\u043E\u043D\u043A\u043E\u0439 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u043E\u0439 \u0441\u0442\u0438\u043B\u044F, \u0442\u043E\u043D\u0430 \u0438 \u0442\u0435\u043C\u043F\u0430. \u041E\u0442\u043B\u0438\u0447\u043D\u043E \u0434\u043B\u044F \u0434\u043B\u0438\u043D\u043D\u043E\u0433\u043E \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430.',
    features: ['800+ Voices', 'Voice Cloning', 'SSML Support', 'Podcast Hosting', 'WordPress Plugin'],
    featuresRu: ['800+ \u0433\u043E\u043B\u043E\u0441\u043E\u0432', '\u041A\u043B\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435', 'SSML \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430', '\u0425\u043E\u0441\u0442\u0438\u043D\u0433 \u043F\u043E\u0434\u043A\u0430\u0441\u0442\u043E\u0432', '\u041F\u043B\u0430\u0433\u0438\u043D WordPress'],
    url: 'https://play.ht/?ref=tubeforge',
    pricing: 'Free trial \u2022 From $29/mo',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u043F\u0440\u043E\u0431\u043D\u044B\u0439 \u2022 \u041E\u0442 $29/\u043C\u0435\u0441',
    gradient: ['#ec4899', '#f43f5e'],
  },
  {
    id: 'wellsaid',
    name: 'WellSaid Labs',
    logo: '\uD83D\uDDE3\uFE0F',
    description: 'Enterprise text-to-speech designed for professional video production. Studio-quality voices with fast turnaround times.',
    descriptionRu: '\u041F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442-\u0432-\u0440\u0435\u0447\u044C \u0434\u043B\u044F \u0432\u0438\u0434\u0435\u043E\u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0441\u0442\u0432\u0430. \u0421\u0442\u0443\u0434\u0438\u0439\u043D\u043E\u0435 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u043E \u0433\u043E\u043B\u043E\u0441\u043E\u0432 \u0441 \u0431\u044B\u0441\u0442\u0440\u043E\u0439 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0435\u0439.',
    features: ['Studio Quality', 'Team Workspace', 'Pronunciation Guide', 'SSML Editor', 'Commercial Rights'],
    featuresRu: ['\u0421\u0442\u0443\u0434\u0438\u0439\u043D\u043E\u0435 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u043E', '\u041A\u043E\u043C\u0430\u043D\u0434\u043D\u043E\u0435 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E', '\u0413\u0438\u0434 \u043F\u0440\u043E\u0438\u0437\u043D\u043E\u0448\u0435\u043D\u0438\u044F', 'SSML \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440', '\u041A\u043E\u043C\u043C. \u043F\u0440\u0430\u0432\u0430'],
    url: 'https://wellsaidlabs.com/?ref=tubeforge',
    pricing: 'From $44/mo \u2022 Enterprise plans',
    pricingRu: '\u041E\u0442 $44/\u043C\u0435\u0441 \u2022 \u041A\u043E\u0440\u043F. \u043F\u043B\u0430\u043D\u044B',
    gradient: ['#8b5cf6', '#7c3aed'],
  },
  {
    id: 'amazon-polly',
    name: 'Amazon Polly',
    logo: '\u2601\uFE0F',
    description: 'AWS cloud text-to-speech service with Neural TTS. Pay-per-use pricing, ideal for developers and high-volume needs.',
    descriptionRu: 'AWS \u043E\u0431\u043B\u0430\u0447\u043D\u044B\u0439 \u0441\u0435\u0440\u0432\u0438\u0441 \u0442\u0435\u043A\u0441\u0442-\u0432-\u0440\u0435\u0447\u044C \u0441 Neural TTS. \u041E\u043F\u043B\u0430\u0442\u0430 \u043F\u043E \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044E, \u0438\u0434\u0435\u0430\u043B\u044C\u043D\u043E \u0434\u043B\u044F \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A\u043E\u0432.',
    features: ['Neural TTS', '60+ Voices', 'SSML Support', 'Pay-Per-Use', 'AWS Integration'],
    featuresRu: ['Neural TTS', '60+ \u0433\u043E\u043B\u043E\u0441\u043E\u0432', 'SSML \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430', '\u041E\u043F\u043B\u0430\u0442\u0430 \u043F\u043E \u0438\u0441\u043F.', '\u0418\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F AWS'],
    url: 'https://aws.amazon.com/polly/?ref=tubeforge',
    pricing: 'Free tier \u2022 $4/1M chars (Neural)',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B. \u0442\u0430\u0440\u0438\u0444 \u2022 $4/1M \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432 (Neural)',
    badge: 'Developer',
    gradient: ['#f59e0b', '#f97316'],
  },
];

export function VoiceoverGenerator() {
  const C = useThemeStore((s) => s.theme);
  const { locale } = useLocaleStore();
  const isRu = locale === 'ru' || locale === 'kk';
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: '-0.02em' }}>
          {isRu ? '\uD83C\uDF99\uFE0F \u0418\u0418-\u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F \u043E\u0437\u0432\u0443\u0447\u043A\u0438' : '\uD83C\uDF99\uFE0F AI Voiceover Generator'}
        </h1>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
          {isRu
            ? '\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u0430 \u0434\u043B\u044F \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u043E\u0437\u0432\u0443\u0447\u043A\u0438 \u0438\u0437 \u0442\u0435\u043A\u0441\u0442\u0430. \u041A\u0430\u0436\u0434\u044B\u0439 \u0441\u0435\u0440\u0432\u0438\u0441 \u043F\u0440\u0435\u0434\u043B\u0430\u0433\u0430\u0435\u0442 \u0443\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u0433\u043E\u043B\u043E\u0441\u0430 \u0438 \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u0438.'
            : 'Choose a provider for AI text-to-speech voiceover. Each service offers unique voices and capabilities.'}
        </p>
      </div>

      <div style={{ padding: '14px 18px', background: `${C.blue}0a`, border: `1px solid ${C.blue}20`, borderRadius: 12, marginBottom: 28, fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
        {isRu
          ? '\uD83D\uDCA1 \u0421\u043E\u0432\u0435\u0442: ElevenLabs \u2014 \u043B\u0443\u0447\u0448\u0435\u0435 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u043E \u0434\u043B\u044F YouTube. PlayHT \u2014 \u0434\u043B\u044F \u0434\u043B\u0438\u043D\u043D\u043E\u0433\u043E \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430. Amazon Polly \u2014 \u0434\u043B\u044F \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A\u043E\u0432 \u0441 \u0432\u044B\u0441\u043E\u043A\u0438\u043C\u0438 \u043E\u0431\u044A\u0451\u043C\u0430\u043C\u0438.'
          : '\uD83D\uDCA1 Tip: ElevenLabs offers the best quality for YouTube. PlayHT is great for long-form content. Amazon Polly is ideal for developers with high-volume needs.'}
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
          ? '\u2699\uFE0F \u041F\u043E\u043B\u043D\u0430\u044F \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u043E\u0437\u0432\u0443\u0447\u043A\u0438 \u0432 TubeForge \u2014 \u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0435. \u0421\u043B\u0435\u0434\u0438\u0442\u0435 \u0437\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F\u043C\u0438!'
          : '\u2699\uFE0F Full voiceover generation integration inside TubeForge \u2014 coming soon. Stay tuned!'}
      </div>
    </div>
  );
}
