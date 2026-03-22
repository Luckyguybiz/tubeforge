'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ═══════════════════════════════════════════════════════════════════════════
   AI Video Providers — referral links page
   ═══════════════════════════════════════════════════════════════════════════ */

interface Provider {
  id: string;
  name: string;
  logo: string;        // emoji or icon
  description: string;
  features: string[];
  url: string;         // referral link
  pricing: string;
  badge?: string;
  gradient: [string, string];
}

const PROVIDERS: Provider[] = [
  {
    id: 'runway',
    name: 'Runway ML',
    logo: '🎬',
    description: 'Industry-leading AI video generation. Gen-3 Alpha creates photorealistic videos from text or images.',
    features: ['Text to Video', 'Image to Video', 'Video to Video', 'Motion Brush', 'Lip Sync'],
    url: 'https://runwayml.com/?ref=tubeforge',
    pricing: 'From $12/mo • 625 credits',
    badge: 'Popular',
    gradient: ['#7c3aed', '#c026d3'],
  },
  {
    id: 'kling',
    name: 'Kling AI',
    logo: '🎥',
    description: 'Professional AI video with cinematic quality. Excellent motion consistency and character coherence.',
    features: ['1080p Video', 'Camera Control', 'Character Consistency', 'Up to 2 min', 'Lip Sync'],
    url: 'https://klingai.com/?ref=tubeforge',
    pricing: 'From $5.99/mo • 660 credits',
    badge: 'Best Value',
    gradient: ['#0891b2', '#0d9488'],
  },
  {
    id: 'pika',
    name: 'Pika',
    logo: '⚡',
    description: 'Fast and creative AI video generation with unique style effects and scene transformations.',
    features: ['Text to Video', 'Pikaffects', 'Scene Ingredients', 'Lip Sync', 'Extend Video'],
    url: 'https://pika.art/?ref=tubeforge',
    pricing: 'From $8/mo • 250 credits',
    gradient: ['#f59e0b', '#ef4444'],
  },
  {
    id: 'luma',
    name: 'Luma Dream Machine',
    logo: '🌙',
    description: 'High-quality video generation powered by Luma\'s multimodal AI. Great for cinematic scenes.',
    features: ['Text to Video', 'Image to Video', 'Keyframes', 'Camera Motion', '4K Upscale'],
    url: 'https://lumalabs.ai/dream-machine?ref=tubeforge',
    pricing: 'From $9.99/mo • 150 generations',
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: 'minimax',
    name: 'MiniMax (Hailuo)',
    logo: '🔮',
    description: 'Powerful Chinese AI video model with impressive quality and long video generation capabilities.',
    features: ['Text to Video', 'Image to Video', 'Long Videos', 'High Quality', 'Director Mode'],
    url: 'https://hailuoai.video/?ref=tubeforge',
    pricing: 'Free tier available • Pro from $9.99/mo',
    gradient: ['#ec4899', '#f43f5e'],
  },
  {
    id: 'veo',
    name: 'Google Veo 2',
    logo: '🌐',
    description: 'Google\'s latest AI video model. Available through Google AI Studio and Vertex AI.',
    features: ['Text to Video', 'Image to Video', '4K Output', 'Cinematic Quality', 'Long Duration'],
    url: 'https://aistudio.google.com/?ref=tubeforge',
    pricing: 'Free with Google account',
    badge: 'Free',
    gradient: ['#4285f4', '#34a853'],
  },
];

export function AiVideoGenerator() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

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
          {'🎬 ' + t('tools.aiVideo.title')}
        </h1>
        <p style={{
          fontSize: 15,
          color: C.sub,
          lineHeight: 1.6,
          maxWidth: 600,
          margin: '0 auto',
        }}>
          {t('tools.aiVideo.subtitle')}
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
        💡 {t('tools.aiVideo.tip')}
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
              top: 0,
              left: 0,
              right: 0,
              height: 3,
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
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})`,
                      color: '#fff',
                      letterSpacing: 0.3,
                    }}>
                      {p.badge}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
                  {p.pricing}
                </div>
              </div>
            </div>

            {/* Description */}
            <p style={{
              fontSize: 13,
              color: C.sub,
              lineHeight: 1.5,
              margin: '0 0 14px',
            }}>
              {p.description}
            </p>

            {/* Features */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.features.map((f, i) => (
                <span
                  key={i}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    background: `${p.gradient[0]}12`,
                    color: p.gradient[0],
                    border: `1px solid ${p.gradient[0]}20`,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>

            {/* CTA arrow */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              marginTop: 14,
              fontSize: 13,
              fontWeight: 600,
              color: C.accent,
              gap: 6,
            }}>
              {t('tools.aiVideo.visit')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </div>
          </a>
        ))}
      </div>

      {/* Bottom note */}
      <div style={{
        marginTop: 28,
        padding: '16px 20px',
        background: C.surface,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        fontSize: 13,
        color: C.dim,
        lineHeight: 1.6,
        textAlign: 'center',
      }}>
        {'⚙️ ' + t('tools.aiVideo.comingSoon')}
      </div>
    </div>
  );
}
