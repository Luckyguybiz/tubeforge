'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';

/* ═══════════════════════════════════════════════════════════════════════════
   Audio Enhancement Providers — referral links page
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
    id: 'adobe-podcast',
    name: 'Adobe Podcast',
    logo: '\ud83c\udf99\ufe0f',
    description: 'Free AI-powered audio enhancement. Removes background noise, improves speech clarity, and polishes recordings instantly.',
    features: ['AI Enhancement', 'Noise Removal', 'Speech Clarity', 'Free', 'Browser-Based'],
    url: 'https://podcast.adobe.com/?ref=tubeforge',
    pricing: 'Free with Adobe',
    badge: 'Free',
    gradient: ['#f97316', '#ef4444'],
  },
  {
    id: 'auphonic',
    name: 'Auphonic',
    logo: '\ud83d\udd0a',
    description: 'Automatic audio post-production with loudness normalization, leveling, and noise reduction. Perfect for podcast producers.',
    features: ['Auto Post-Production', 'Loudness Normalization', 'Noise Reduction', '2hrs Free/mo', 'Multi-Track'],
    url: 'https://auphonic.com/?ref=tubeforge',
    pricing: '2hrs free/mo \u2022 From $11/mo',
    badge: 'Best for Podcasts',
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: 'izotope-rx',
    name: 'iZotope RX',
    logo: '\ud83c\udf9b\ufe0f',
    description: 'Professional audio repair suite. Industry-standard noise, hum, and click removal for studios and post-production facilities.',
    features: ['Pro Audio Repair', 'Noise Removal', 'Hum/Click Removal', 'Spectral Editor', 'DAW Plugin'],
    url: 'https://www.izotope.com/rx/?ref=tubeforge',
    pricing: 'From $129 one-time',
    gradient: ['#0891b2', '#0d9488'],
  },
  {
    id: 'descript',
    name: 'Descript',
    logo: '\ud83d\udcdd',
    description: 'Studio Sound AI for instant audio cleanup. Automatic filler word removal, green room feature, and text-based audio editing.',
    features: ['Studio Sound', 'Filler Removal', 'Green Room', 'Text Editing', 'Transcription'],
    url: 'https://www.descript.com/?ref=tubeforge',
    pricing: 'From $24/mo',
    gradient: ['#7c3aed', '#c026d3'],
  },
  {
    id: 'landr',
    name: 'LANDR',
    logo: '\ud83c\udfb5',
    description: 'AI-powered audio mastering with distribution and collaboration tools. One-stop shop for finishing and releasing your audio.',
    features: ['AI Mastering', 'Distribution', 'Collaboration', 'Samples', 'Plugins'],
    url: 'https://www.landr.com/?ref=tubeforge',
    pricing: 'From $12.50/mo',
    gradient: ['#ec4899', '#f43f5e'],
  },
];

export function AudioBalancer() {
  const C = useThemeStore((s) => s.theme);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: '-0.02em',
        }}>
          '\ud83c\udf99\ufe0f Audio Enhancement'
        </h1>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
          'Choose a service for audio enhancement. Great for podcasts, video production, and professional audio work.'
        </p>
      </div>

      {/* Tip box */}
      <div style={{
        padding: '14px 18px', background: `${C.blue}0a`, border: `1px solid ${C.blue}20`,
        borderRadius: 12, marginBottom: 28, fontSize: 13, color: C.sub, lineHeight: 1.6,
      }}>
        '\ud83d\udca1 Tip: Adobe Podcast for free quick cleanup. Auphonic for podcast production. iZotope RX for professional studio work.'
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

      {/* Bottom note */}
      <div style={{ marginTop: 28, padding: '16px 20px', background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 13, color: C.dim, lineHeight: 1.6, textAlign: 'center' }}>
        '\u2699\ufe0f Full audio enhancement integration inside TubeForge \u2014 coming soon. Stay tuned!'
      </div>
    </div>
  );
}
