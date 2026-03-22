'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';

/* ═══════════════════════════════════════════════════════════════════════════
   AI Video Generation Providers — referral links page
   ═══════════════════════════════════════════════════════════════════════════ */

interface StylePreset {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
}

const STYLE_PRESETS: StylePreset[] = [
  { id: 'cinematic', name: 'Cinematic', desc: 'Film-quality dramatic scenes', icon: '\uD83C\uDFAC', color: '#7c3aed' },
  { id: 'anime', name: 'Anime', desc: 'Japanese animation aesthetic', icon: '\u2728', color: '#ec4899' },
  { id: 'gaming', name: 'Gaming / Minecraft', desc: 'Pixel-art game world aesthetic', icon: '\uD83C\uDFAE', color: '#4CAF50' },
  { id: 'vlog', name: 'Vlog / Talking Head', desc: 'Natural creator-style footage', icon: '\uD83D\uDCF7', color: '#0891b2' },
  { id: 'explainer', name: 'Explainer', desc: 'Motion graphics & infographics', icon: '\uD83D\uDCA1', color: '#f59e0b' },
  { id: 'nature', name: 'Nature / Drone', desc: 'Aerial & landscape cinematography', icon: '\uD83C\uDF3F', color: '#16a34a' },
];

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
    id: 'google-veo',
    name: 'Google Veo 2',
    logo: '\ud83c\udf10',
    description: 'Google\'s latest AI video generation model. Produces stunning 4K output with realistic motion and physics understanding.',
    features: ['4K Output', 'Realistic Motion', 'Free Access', 'Text to Video', 'Google AI'],
    url: 'https://deepmind.google/technologies/veo/?ref=tubeforge',
    pricing: 'Free with Google',
    badge: 'Free',
    gradient: ['#4285f4', '#34a853'],
  },
  {
    id: 'runway-ml',
    name: 'Runway ML',
    logo: '\ud83c\udfac',
    description: 'Gen-3 Alpha model for photorealistic AI video generation. Industry-leading quality with precise control over motion and style.',
    features: ['Gen-3 Alpha', 'Photorealistic', 'Motion Control', 'Style Transfer', 'Image to Video'],
    url: 'https://runwayml.com/?ref=tubeforge',
    pricing: 'From $12/mo',
    badge: 'Best Quality',
    gradient: ['#7c3aed', '#c026d3'],
  },
  {
    id: 'kling-ai',
    name: 'Kling AI',
    logo: '\ud83c\udfa5',
    description: 'Cinematic quality AI video with advanced camera control. Excellent value for creators who need professional-looking results.',
    features: ['Cinematic Quality', 'Camera Control', 'Great Value', 'Long Clips', 'Fast Rendering'],
    url: 'https://klingai.com/?ref=tubeforge',
    pricing: 'From $5.99/mo',
    badge: 'Best Value',
    gradient: ['#0891b2', '#0d9488'],
  },
  {
    id: 'pika',
    name: 'Pika',
    logo: '\u26a1',
    description: 'Creative AI video effects and scene transformations. Unique artistic capabilities for eye-catching short-form content.',
    features: ['Creative Effects', 'Scene Transform', 'Artistic Styles', 'Quick Generate', 'Lip Sync'],
    url: 'https://pika.art/?ref=tubeforge',
    pricing: 'From $8/mo',
    gradient: ['#f59e0b', '#ef4444'],
  },
  {
    id: 'sora',
    name: 'Sora',
    logo: '\ud83c\udf00',
    description: 'OpenAI\'s video generation model. Creates 1080p videos of complex scenes with multiple characters and accurate physics.',
    features: ['1080p Output', 'Complex Scenes', 'Multi-Character', 'Physics Accurate', 'ChatGPT Plus'],
    url: 'https://openai.com/sora/?ref=tubeforge',
    pricing: 'ChatGPT Plus',
    badge: 'New',
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: 'luma-dream',
    name: 'Luma Dream Machine',
    logo: '\ud83c\udf19',
    description: 'Multimodal AI video generation with keyframe control and 4K upscaling. Create cinematic videos from text, images, or video references.',
    features: ['Multimodal AI', 'Keyframes', '4K Upscale', 'Image to Video', 'Camera Motion'],
    url: 'https://lumalabs.ai/dream-machine/?ref=tubeforge',
    pricing: 'From $9.99/mo',
    gradient: ['#ec4899', '#f43f5e'],
  },
];

export function Veo3Generator() {
  const C = useThemeStore((s) => s.theme);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: '-0.02em',
        }}>
          '\ud83c\udfac AI Video Generation'
        </h1>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
          'Choose an AI service for video generation. From free models to professional-grade tools.'
        </p>
      </div>

      {/* Style Presets */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 12 }}>
          '\uD83C\uDFA8 Style Presets'
        </h2>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8,
        }}>
          {STYLE_PRESETS.map((sp) => {
            const active = activePreset === sp.id;
            return (
              <button
                key={sp.id}
                onClick={() => setActivePreset(active ? null : sp.id)}
                style={{
                  padding: '8px 14px', borderRadius: 10,
                  border: `1.5px solid ${active ? sp.color : C.border}`,
                  background: active ? `${sp.color}15` : C.surface,
                  color: active ? sp.color : C.sub,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s ease', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                  outline: 'none',
                }}
              >
                <span style={{ fontSize: 16 }}>{sp.icon}</span>
                <span>{sp.name}</span>
              </button>
            );
          })}
        </div>
        {activePreset && (
          <div style={{
            marginTop: 10, padding: '10px 14px', borderRadius: 8,
            background: `${STYLE_PRESETS.find((s) => s.id === activePreset)?.color ?? C.accent}0a`,
            border: `1px solid ${STYLE_PRESETS.find((s) => s.id === activePreset)?.color ?? C.accent}20`,
            fontSize: 13, color: C.sub,
          }}>
            {STYLE_PRESETS.find((s) => s.id === activePreset)?.desc}
            {' \u2014 '}
            'try any provider below for this style.'
          </div>
        )}
      </div>

      {/* Tip box */}
      <div style={{
        padding: '14px 18px', background: `${C.blue}0a`, border: `1px solid ${C.blue}20`,
        borderRadius: 12, marginBottom: 28, fontSize: 13, color: C.sub, lineHeight: 1.6,
      }}>
        '\ud83d\udca1 Tip: Google Veo 2 for free start. Runway ML for best quality. Kling AI for best value. Sora via ChatGPT Plus.'
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
        '\u2699\ufe0f Full AI video generation integration inside TubeForge \u2014 coming soon. Stay tuned!'
      </div>
    </div>
  );
}
