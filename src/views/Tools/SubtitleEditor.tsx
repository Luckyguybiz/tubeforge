'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ═══════════════════════════════════════════════════════════════════════════
   Subtitle Editor Providers — referral links page
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
    id: 'capcut',
    name: 'CapCut',
    logo: '\uD83C\uDFAC',
    description: 'Free all-in-one video editor with powerful auto-captioning. AI generates accurate subtitles in 20+ languages with customizable styles.',
    descriptionRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0432\u0438\u0434\u0435\u043E\u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0441 \u043C\u043E\u0449\u043D\u044B\u043C \u0430\u0432\u0442\u043E-\u0441\u0443\u0431\u0442\u0438\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435\u043C. \u0418\u0418 \u0433\u0435\u043D\u0435\u0440\u0438\u0440\u0443\u0435\u0442 \u0442\u043E\u0447\u043D\u044B\u0435 \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u044B \u043D\u0430 20+ \u044F\u0437\u044B\u043A\u0430\u0445.',
    features: ['Auto-Captions', 'Style Templates', 'Free to Use', 'Mobile + Desktop', 'Export SRT'],
    featuresRu: ['\u0410\u0432\u0442\u043E-\u0441\u0443\u0431\u0442\u0438\u0442\u0440\u044B', '\u0428\u0430\u0431\u043B\u043E\u043D\u044B \u0441\u0442\u0438\u043B\u0435\u0439', '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E', '\u041C\u043E\u0431\u0438\u043B\u044C\u043D\u044B\u0439 + \u041F\u041A', '\u042D\u043A\u0441\u043F\u043E\u0440\u0442 SRT'],
    url: 'https://www.capcut.com/?ref=tubeforge',
    pricing: 'Free \u2022 Pro from $7.99/mo',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E \u2022 Pro \u043E\u0442 $7.99/\u043C\u0435\u0441',
    badge: 'Free',
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: 'descript',
    name: 'Descript',
    logo: '\u270F\uFE0F',
    description: 'Edit video and audio by editing text. AI-powered transcription with the ability to edit media as easily as a Google Doc.',
    descriptionRu: '\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u0443\u0439\u0442\u0435 \u0432\u0438\u0434\u0435\u043E \u0438 \u0430\u0443\u0434\u0438\u043E, \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u0443\u044F \u0442\u0435\u043A\u0441\u0442. \u0418\u0418-\u0442\u0440\u0430\u043D\u0441\u043A\u0440\u0438\u043F\u0446\u0438\u044F \u0441 \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435\u043C \u043A\u0430\u043A \u0432 Google Doc.',
    features: ['Text-Based Editing', 'AI Transcription', 'Screen Recording', 'Filler Word Removal', 'Collaboration'],
    featuresRu: ['\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0442\u0435\u043A\u0441\u0442\u043E\u043C', '\u0418\u0418-\u0442\u0440\u0430\u043D\u0441\u043A\u0440\u0438\u043F\u0446\u0438\u044F', '\u0417\u0430\u043F\u0438\u0441\u044C \u044D\u043A\u0440\u0430\u043D\u0430', '\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0441\u043B\u043E\u0432-\u043F\u0430\u0440\u0430\u0437\u0438\u0442\u043E\u0432', '\u041A\u043E\u043B\u043B\u0430\u0431\u043E\u0440\u0430\u0446\u0438\u044F'],
    url: 'https://www.descript.com/?ref=tubeforge',
    pricing: 'Free tier \u2022 From $24/mo',
    pricingRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444 \u2022 \u041E\u0442 $24/\u043C\u0435\u0441',
    badge: 'Popular',
    gradient: ['#10b981', '#059669'],
  },
  {
    id: 'happyscribe',
    name: 'Happy Scribe',
    logo: '\uD83D\uDE0A',
    description: 'Professional transcription and subtitle service with 99% accuracy. Supports 120+ languages with human proofreading option.',
    descriptionRu: '\u041F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u0435\u0440\u0432\u0438\u0441 \u0442\u0440\u0430\u043D\u0441\u043A\u0440\u0438\u043F\u0446\u0438\u0438 \u0438 \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u043E\u0432 \u0441 \u0442\u043E\u0447\u043D\u043E\u0441\u0442\u044C\u044E 99%. 120+ \u044F\u0437\u044B\u043A\u043E\u0432 \u0441 \u043E\u043F\u0446\u0438\u0435\u0439 \u0440\u0443\u0447\u043D\u043E\u0439 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438.',
    features: ['120+ Languages', '99% Accuracy', 'Human Proofing', 'SRT/VTT Export', 'API Access'],
    featuresRu: ['120+ \u044F\u0437\u044B\u043A\u043E\u0432', '99% \u0442\u043E\u0447\u043D\u043E\u0441\u0442\u044C', '\u0420\u0443\u0447\u043D\u0430\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430', '\u042D\u043A\u0441\u043F\u043E\u0440\u0442 SRT/VTT', 'API \u0434\u043E\u0441\u0442\u0443\u043F'],
    url: 'https://www.happyscribe.com/?ref=tubeforge',
    pricing: 'From $0.10/min (AI) \u2022 $1.70/min (human)',
    pricingRu: '\u041E\u0442 $0.10/\u043C\u0438\u043D (\u0418\u0418) \u2022 $1.70/\u043C\u0438\u043D (\u0447\u0435\u043B\u043E\u0432\u0435\u043A)',
    gradient: ['#f59e0b', '#f97316'],
  },
  {
    id: 'rev',
    name: 'Rev.com',
    logo: '\uD83D\uDCDD',
    description: 'Trusted by 170,000+ customers. Fast AI and human transcription with guaranteed accuracy for subtitles and captions.',
    descriptionRu: '\u0414\u043E\u0432\u0435\u0440\u044F\u044E\u0442 170,000+ \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432. \u0411\u044B\u0441\u0442\u0440\u0430\u044F \u0418\u0418 \u0438 \u0440\u0443\u0447\u043D\u0430\u044F \u0442\u0440\u0430\u043D\u0441\u043A\u0440\u0438\u043F\u0446\u0438\u044F \u0441 \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u0435\u0439 \u0442\u043E\u0447\u043D\u043E\u0441\u0442\u0438.',
    features: ['AI + Human', '99% Accuracy', 'Fast Turnaround', 'Captions/Subtitles', 'YouTube Integration'],
    featuresRu: ['\u0418\u0418 + \u0427\u0435\u043B\u043E\u0432\u0435\u043A', '99% \u0442\u043E\u0447\u043D\u043E\u0441\u0442\u044C', '\u0411\u044B\u0441\u0442\u0440\u0430\u044F \u043E\u0442\u0434\u0430\u0447\u0430', '\u0421\u0443\u0431\u0442\u0438\u0442\u0440\u044B', '\u0418\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F YouTube'],
    url: 'https://www.rev.com/?ref=tubeforge',
    pricing: 'From $0.25/min (AI) \u2022 $1.50/min (human)',
    pricingRu: '\u041E\u0442 $0.25/\u043C\u0438\u043D (\u0418\u0418) \u2022 $1.50/\u043C\u0438\u043D (\u0447\u0435\u043B\u043E\u0432\u0435\u043A)',
    badge: 'Trusted',
    gradient: ['#ef4444', '#dc2626'],
  },
];

export function SubtitleEditor() {
  const C = useThemeStore((s) => s.theme);
  const { locale } = useLocaleStore();
  const isRu = locale === 'ru' || locale === 'kk';
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: '-0.02em' }}>
          {isRu ? '\uD83D\uDCDD \u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u043E\u0432' : '\uD83D\uDCDD Subtitle Editor & Captioning'}
        </h1>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
          {isRu
            ? '\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0435\u0440\u0432\u0438\u0441 \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0438 \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u043E\u0432. \u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0442\u0440\u0430\u043D\u0441\u043A\u0440\u0438\u043F\u0446\u0438\u044F \u0438 \u0441\u0442\u0438\u043B\u0438\u0437\u0430\u0446\u0438\u044F.'
            : 'Choose a service for creating and editing subtitles. Automatic transcription, styling, and professional captioning.'}
        </p>
      </div>

      <div style={{ padding: '14px 18px', background: `${C.blue}0a`, border: `1px solid ${C.blue}20`, borderRadius: 12, marginBottom: 28, fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
        {isRu
          ? '\uD83D\uDCA1 \u0421\u043E\u0432\u0435\u0442: CapCut \u2014 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442 \u0441 \u0430\u0432\u0442\u043E-\u0441\u0443\u0431\u0442\u0438\u0442\u0440\u0430\u043C\u0438. Descript \u2014 \u0438\u043D\u043D\u043E\u0432\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u043D\u0430 \u0431\u0430\u0437\u0435 \u0442\u0435\u043A\u0441\u0442\u0430. Happy Scribe \u0438 Rev.com \u2014 \u0434\u043B\u044F \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0439 \u0442\u043E\u0447\u043D\u043E\u0441\u0442\u0438.'
          : '\uD83D\uDCA1 Tip: CapCut is a free option with auto-captions. Descript offers innovative text-based editing. Happy Scribe and Rev.com are best for professional accuracy.'}
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
          ? '\u2699\uFE0F \u041F\u043E\u043B\u043D\u0430\u044F \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430 \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u043E\u0432 \u0432 TubeForge \u2014 \u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0435. \u0421\u043B\u0435\u0434\u0438\u0442\u0435 \u0437\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F\u043C\u0438!'
          : '\u2699\uFE0F Full subtitle editor integration inside TubeForge \u2014 coming soon. Stay tuned!'}
      </div>
    </div>
  );
}
