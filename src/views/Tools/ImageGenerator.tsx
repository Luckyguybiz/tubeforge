'use client';

import { useState, useCallback, useMemo } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';

const STYLES: { label: string; value: 'realistic' | 'anime' | 'cinematic' | 'minimalist' | '3d' | 'popart' }[] = [
  { label: 'Realistic', value: 'realistic' },
  { label: 'Anime', value: 'anime' },
  { label: 'Cinematic', value: 'cinematic' },
  { label: 'Minimalist', value: 'minimalist' },
  { label: '3D', value: '3d' },
  { label: 'Pop Art', value: 'popart' },
];

const GRADIENT: [string, string] = ['#6366f1', '#8b5cf6'];

const PRESETS = [
  'A futuristic cityscape at sunset',
  'A cute robot holding flowers',
  'An underwater coral reef with bioluminescence',
  'A cozy cabin in a snowy mountain',
];

interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
}

export function ImageGenerator() {
  const C = useThemeStore((s) => s.theme);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<typeof STYLES[number]['value']>('realistic');
  const [showPresets, setShowPresets] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateMutation = trpc.ai.generateThumbnail.useMutation({
    onSuccess: (data) => {
      setImages((prev) => [...prev, ...data.images]);
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || generateMutation.isPending) return;
    setError(null);
    setImages([]);
    generateMutation.mutate({ prompt: prompt.trim(), style, count: 1 });
  }, [prompt, style, generateMutation]);

  const handlePresetClick = useCallback((preset: string) => {
    setPrompt(preset);
    setShowPresets(false);
  }, []);

  const handleDownload = useCallback(async (url: string, index: number) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `generated-image-${index + 1}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      /* download failed silently */
    }
  }, []);

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
      subtitle="Create stunning images from text descriptions using DALL-E 3"
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
              >
                Presets
              </button>
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
              maxLength={1000}
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
              <span style={{ fontSize: 12, color: C.dim }}>{prompt.length}/1000</span>
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
                <button key={s.value} onClick={() => setStyle(s.value)} style={pillStyle(style === s.value)}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div style={{
            padding: 12, borderRadius: 12,
            background: `${GRADIENT[0]}11`, border: `1px solid ${GRADIENT[0]}33`,
            fontSize: 12, color: C.sub, lineHeight: 1.5,
          }}>
            Powered by DALL-E 3. Each generation uses 1 AI credit and produces a single high-quality 1792x1024 image optimized for YouTube thumbnails.
          </div>

          {error && (
            <div style={{
              padding: 12, borderRadius: 12,
              background: '#ef444422', border: '1px solid #ef444455',
              fontSize: 13, color: '#ef4444',
            }}>
              {error}
            </div>
          )}

          <ActionButton label="Generate" gradient={GRADIENT} onClick={handleGenerate} loading={generateMutation.isPending} disabled={!prompt.trim()} />
        </div>

        {/* Right: Results */}
        <div style={{
          padding: 16, borderRadius: 16,
          border: `1px solid ${C.border}`, background: C.card,
          minWidth: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 16 }}>Generated Images</span>

          {generateMutation.isPending && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 48, gap: 12,
            }}>
              <svg width="40" height="40" viewBox="0 0 32 32" style={{ animation: 'spin 1.2s linear infinite' }}>
                <circle cx="16" cy="16" r="12" stroke={`${GRADIENT[0]}33`} strokeWidth="2.5" fill="none" />
                <path d="M16 4a12 12 0 018.49 3.51" stroke={GRADIENT[0]} strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
              <span style={{ fontSize: 13, color: C.sub }}>Generating with DALL-E 3...</span>
              <span style={{ fontSize: 11, color: C.dim }}>This may take 10-20 seconds</span>
            </div>
          )}

          {images.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {images.map((img, i) => (
                <div key={img.url} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{
                    borderRadius: 12, overflow: 'hidden',
                    border: `1px solid ${C.border}`,
                    position: 'relative',
                  }}>
                    <img
                      src={img.url}
                      alt={img.revisedPrompt ?? `Generated image ${i + 1}`}
                      style={{ width: '100%', display: 'block' }}
                    />
                  </div>
                  {img.revisedPrompt && (
                    <p style={{ fontSize: 11, color: C.dim, margin: 0, lineHeight: 1.4 }}>
                      {img.revisedPrompt}
                    </p>
                  )}
                  <button
                    onClick={() => handleDownload(img.url, i)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
                    style={{
                      padding: '10px 16px', minHeight: 40, borderRadius: 10,
                      border: `1px solid ${C.border}`, background: C.card,
                      color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s ease', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      outline: 'none',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}

          {!generateMutation.isPending && images.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 48, gap: 8,
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" opacity={0.3}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span style={{ fontSize: 13, color: C.dim }}>Your generated images will appear here</span>
            </div>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
