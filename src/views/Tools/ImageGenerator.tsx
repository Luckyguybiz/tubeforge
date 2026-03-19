'use client';

import { useState, useCallback, useMemo } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const MODELS = ['DALL-E 3', 'Stable Diffusion', 'Midjourney'];
const STYLES = ['Realistic', 'Anime', '3D', 'Digital Art', 'Oil Painting'];
const SIZES = ['1024x1024', '1792x1024', '1024x1792'];
const GRADIENT: [string, string] = ['#6366f1', '#8b5cf6'];

const PRESETS = [
  'A futuristic cityscape at sunset',
  'A cute robot holding flowers',
  'An underwater coral reef with bioluminescence',
  'A cozy cabin in a snowy mountain',
];

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
  const [showPresets, setShowPresets] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || loading) return;
    setGenerated(false);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setGenerated(true);
    }, 2500);
  }, [prompt, loading]);

  const handlePresetClick = useCallback((preset: string) => {
    setPrompt(preset);
    setShowPresets(false);
  }, []);

  const handlePromptGen = useCallback(() => {
    const templates = [
      `A ${style.toLowerCase()} style ${PRESETS[Math.floor(Math.random() * PRESETS.length)]}`,
    ];
    setPrompt(templates[0]);
  }, [style]);

  const pillStyle = useMemo(() => (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    minHeight: 44,
    borderRadius: 10,
    border: `1px solid ${active ? GRADIENT[0] : C.border}`,
    background: active ? `${GRADIENT[0]}22` : C.card,
    color: active ? GRADIENT[0] : C.sub,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
  }), [C.border, C.card, C.sub]);

  return (
    <ToolPageShell
      title="AI Image Generator"
      subtitle="Create stunning images from text descriptions using state-of-the-art AI models"
      gradient={GRADIENT}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Left: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Prompt area */}
          <div style={{
            padding: 16, borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.card,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Prompt</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${C.border}`, background: hoveredBtn === 'presets' ? C.surface : C.card,
                    color: C.sub, cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                    outline: 'none',
                  }}
                  onMouseEnter={() => setHoveredBtn('presets')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${GRADIENT[0]}44`; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  View Presets
                </button>
                <button
                  onClick={handlePromptGen}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${GRADIENT[0]}55`, background: hoveredBtn === 'promptgen' ? `${GRADIENT[0]}22` : `${GRADIENT[0]}11`,
                    color: GRADIENT[0], cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                    outline: 'none',
                  }}
                  onMouseEnter={() => setHoveredBtn('promptgen')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${GRADIENT[0]}44`; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  + Prompt Generator
                </button>
              </div>
            </div>
            {showPresets && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12,
                padding: 12, borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`,
              }}>
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetClick(preset)}
                    style={{
                      padding: '8px 12px', borderRadius: 8, border: 'none',
                      background: 'transparent', color: C.sub, fontSize: 13,
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                      transition: 'all 0.2s ease', outline: 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.text; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.sub; }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create..."
              style={{
                width: '100%', minHeight: 120, padding: 14, borderRadius: 12,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.text, fontSize: 14, fontFamily: 'inherit',
                resize: 'vertical', outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: C.dim }}>{prompt.length} characters</span>
            </div>
          </div>

          {/* Model selector */}
          <div style={{
            padding: 16, borderRadius: 16,
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
            padding: 16, borderRadius: 16,
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
            padding: 16, borderRadius: 16,
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
            padding: 16, borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.card,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>
              Number of Images: {numImages}
            </span>
            <input
              type="range" min={1} max={4} value={numImages}
              onChange={(e) => setNumImages(Number(e.target.value))}
              aria-label="Number of images"
              style={{ width: '100%', accentColor: GRADIENT[0], cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.dim, marginTop: 4 }}>
              <span>1</span><span>2</span><span>3</span><span>4</span>
            </div>
          </div>

          <ActionButton label="Generate" gradient={GRADIENT} onClick={handleGenerate} loading={loading} disabled={!prompt.trim()} />
        </div>

        {/* Right: Preview grid */}
        <div style={{
          padding: 16, borderRadius: 16,
          border: `1px solid ${C.border}`, background: C.card,
          minWidth: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 16 }}>Generated Images</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 12,
                border: `1px solid ${C.border}`, background: C.surface,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative',
                transition: 'all 0.2s ease',
              }}>
                {loading && i < numImages ? (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="32" height="32" viewBox="0 0 32 32" style={{ animation: 'spin 1.2s linear infinite' }}>
                      <circle cx="16" cy="16" r="12" stroke={`${GRADIENT[0]}33`} strokeWidth="2.5" fill="none" />
                      <path d="M16 4a12 12 0 018.49 3.51" stroke={GRADIENT[0]} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    </svg>
                    <span style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>Generating...</span>
                  </div>
                ) : generated && i < numImages ? (
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

          {/* Download generated images */}
          {generated && (
            <button
              onClick={() => {
                /* Simulate download action */
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
              style={{
                width: '100%', marginTop: 16, padding: '12px 20px', minHeight: 44, borderRadius: 12,
                border: `1px solid ${C.border}`, background: C.card,
                color: C.text, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s ease', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                outline: 'none',
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${GRADIENT[0]}44`; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download All Images
            </button>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
