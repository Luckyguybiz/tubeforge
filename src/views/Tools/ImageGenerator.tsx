'use client';

import { useState } from 'react';
import { ToolPageShell, ActionButton, ResultPreview } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const MODELS = ['DALL-E 3', 'Stable Diffusion', 'Midjourney'];
const STYLES = ['Realistic', 'Anime', '3D', 'Digital Art', 'Oil Painting'];
const SIZES = ['1024x1024', '1792x1024', '1024x1792'];
const GRADIENT: [string, string] = ['#6366f1', '#8b5cf6'];

export function ImageGenerator() {
  const C = useThemeStore((s) => s.theme);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(MODELS[0]);
  const [style, setStyle] = useState(STYLES[0]);
  const [size, setSize] = useState(SIZES[0]);
  const [numImages, setNumImages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setGenerated(true);
    }, 2500);
  };

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: 10,
    border: `1px solid ${active ? GRADIENT[0] : C.border}`,
    background: active ? `${GRADIENT[0]}22` : C.card,
    color: active ? GRADIENT[0] : C.sub,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all .2s',
    fontFamily: 'inherit',
  });

  return (
    <ToolPageShell
      title="AI Image Generator"
      subtitle="Create stunning images from text descriptions using state-of-the-art AI models"
      gradient={GRADIENT}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Prompt area */}
          <div style={{
            padding: 20, borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.card,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Prompt</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${C.border}`, background: hoveredBtn === 'presets' ? C.surface : C.card,
                    color: C.sub, cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={() => setHoveredBtn('presets')}
                  onMouseLeave={() => setHoveredBtn(null)}
                >
                  View Presets
                </button>
                <button
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${GRADIENT[0]}55`, background: hoveredBtn === 'promptgen' ? `${GRADIENT[0]}22` : `${GRADIENT[0]}11`,
                    color: GRADIENT[0], cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={() => setHoveredBtn('promptgen')}
                  onMouseLeave={() => setHoveredBtn(null)}
                >
                  + Prompt Generator
                </button>
              </div>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create..."
              style={{
                width: '100%', minHeight: 120, padding: 14, borderRadius: 12,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.text, fontSize: 14, fontFamily: 'inherit',
                resize: 'vertical', outline: 'none',
              }}
            />
          </div>

          {/* Model selector */}
          <div style={{
            padding: 20, borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.card,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>Model</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MODELS.map((m) => (
                <button key={m} onClick={() => setModel(m)} style={pillStyle(model === m)}>{m}</button>
              ))}
            </div>
          </div>

          {/* Style selector */}
          <div style={{
            padding: 20, borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.card,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>Style</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STYLES.map((s) => (
                <button key={s} onClick={() => setStyle(s)} style={pillStyle(style === s)}>{s}</button>
              ))}
            </div>
          </div>

          {/* Size selector */}
          <div style={{
            padding: 20, borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.card,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>Size</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SIZES.map((s) => (
                <button key={s} onClick={() => setSize(s)} style={pillStyle(size === s)}>{s}</button>
              ))}
            </div>
          </div>

          {/* Number of images */}
          <div style={{
            padding: 20, borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.card,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>
              Number of Images: {numImages}
            </span>
            <input
              type="range" min={1} max={4} value={numImages}
              onChange={(e) => setNumImages(Number(e.target.value))}
              style={{ width: '100%', accentColor: GRADIENT[0] }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.dim, marginTop: 4 }}>
              <span>1</span><span>2</span><span>3</span><span>4</span>
            </div>
          </div>

          <ActionButton label="Generate" gradient={GRADIENT} onClick={handleGenerate} loading={loading} disabled={!prompt.trim()} />
        </div>

        {/* Right: Preview grid */}
        <div style={{
          padding: 24, borderRadius: 16,
          border: `1px solid ${C.border}`, background: C.card,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 16 }}>Generated Images</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 12,
                border: `1px solid ${C.border}`, background: C.surface,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative',
              }}>
                {generated && i < numImages ? (
                  <div style={{
                    width: '100%', height: '100%',
                    background: `linear-gradient(135deg, ${GRADIENT[0]}22, ${GRADIENT[1]}22)`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={GRADIENT[0]} strokeWidth="1.5" opacity={0.6}>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span style={{ fontSize: 11, color: GRADIENT[0], marginTop: 8, fontWeight: 600 }}>Image {i + 1}</span>
                  </div>
                ) : (
                  <>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" opacity={0.3}>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>{i < numImages ? 'Waiting...' : 'Slot'}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}
