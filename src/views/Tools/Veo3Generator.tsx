'use client';

import { useState, useCallback } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#ef4444', '#f97316'];
const DURATIONS = ['5s', '10s', '15s', '30s'];
const ASPECTS = ['16:9', '9:16', '1:1'];

const STYLE_PRESETS = [
  { id: 'cinematic', name: 'Cinematic', desc: 'Film-quality visuals', icon: '🎬', color: '#ef4444' },
  { id: 'animation', name: 'Animation', desc: '2D/3D animated style', icon: '✨', color: '#8b5cf6' },
  { id: 'documentary', name: 'Documentary', desc: 'Realistic footage', icon: '📹', color: '#10b981' },
  { id: 'musicvideo', name: 'Music Video', desc: 'Stylized & vibrant', icon: '🎵', color: '#f59e0b' },
];

const PROMPT_TEMPLATES = [
  'A serene mountain lake at golden hour with mist rising',
  'Drone shot over a neon-lit cyberpunk city at night',
  'Slow motion close-up of a butterfly emerging from a cocoon',
  'Timelapse of clouds rolling over a vast desert landscape',
];

export function Veo3Generator() {
  const C = useThemeStore((s) => s.theme);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('10s');
  const [aspect, setAspect] = useState('16:9');
  const [stylePreset, setStylePreset] = useState('cinematic');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  const [downloadHover, setDownloadHover] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || loading) return;
    setGenerated(false);
    setIsPlaying(false);
    setLoading(true);
    setTimeout(() => { setLoading(false); setGenerated(true); }, 3500);
  }, [prompt, loading]);

  const handlePromptGen = useCallback(() => {
    const template = PROMPT_TEMPLATES[Math.floor(Math.random() * PROMPT_TEMPLATES.length)];
    setPrompt(template);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleDownload = useCallback(() => {
    /* Simulate download */
  }, []);

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px', borderRadius: 10,
    border: `1px solid ${active ? GRADIENT[0] : C.border}`,
    background: active ? `${GRADIENT[0]}22` : C.card,
    color: active ? GRADIENT[0] : C.sub,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s ease', fontFamily: 'inherit',
    outline: 'none',
  });

  return (
    <ToolPageShell
      comingSoon
      title="AI Video Generator (VEO3)"
      subtitle="Generate stunning videos from text prompts using Google VEO3 technology"
      gradient={GRADIENT}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        {/* Left: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Prompt */}
          <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Text Prompt</span>
              <button
                onClick={handlePromptGen}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${GRADIENT[0]}55`,
                  background: hoveredBtn === 'promptgen' ? `${GRADIENT[0]}22` : `${GRADIENT[0]}11`,
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
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video you want to generate..."
              style={{
                width: '100%', minHeight: 120, padding: 14, borderRadius: 12,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.text, fontSize: 14, fontFamily: 'inherit',
                resize: 'vertical', outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: C.dim }}>{prompt.length} characters</span>
            </div>
          </div>

          {/* Duration */}
          <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>Duration</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {DURATIONS.map((d) => (
                <button key={d} onClick={() => setDuration(d)} style={pillStyle(duration === d)}>{d}</button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>Aspect Ratio</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {ASPECTS.map((a) => (
                <button key={a} onClick={() => setAspect(a)} style={pillStyle(aspect === a)}>{a}</button>
              ))}
            </div>
          </div>

          {/* Style Presets */}
          <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 14 }}>Style Preset</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {STYLE_PRESETS.map((sp) => {
                const isSelected = stylePreset === sp.id;
                const isHovered = hoveredPreset === sp.id;
                return (
                  <button
                    key={sp.id}
                    onClick={() => setStylePreset(sp.id)}
                    onMouseEnter={() => setHoveredPreset(sp.id)}
                    onMouseLeave={() => setHoveredPreset(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                      borderRadius: 12,
                      border: `1px solid ${isSelected ? sp.color : isHovered ? `${sp.color}88` : C.border}`,
                      background: isSelected ? `${sp.color}11` : isHovered ? `${sp.color}08` : C.surface,
                      cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit', textAlign: 'left',
                      outline: 'none',
                    }}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${sp.color}44`; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <span style={{ fontSize: 24 }}>{sp.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{sp.name}</div>
                      <div style={{ fontSize: 11, color: C.dim }}>{sp.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <ActionButton label="Generate Video" gradient={GRADIENT} onClick={handleGenerate} loading={loading} disabled={!prompt.trim()} />
        </div>

        {/* Right: Video Preview */}
        <div style={{
          padding: 24, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card,
          display: 'flex', flexDirection: 'column',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 16 }}>Video Preview</span>
          <div style={{
            flex: 1, minHeight: 400, borderRadius: 14,
            border: `1px solid ${C.border}`, background: C.surface,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <svg width="48" height="48" viewBox="0 0 48 48" style={{ animation: 'spin 1.5s linear infinite' }}>
                  <circle cx="24" cy="24" r="20" stroke={`${GRADIENT[0]}33`} strokeWidth="3" fill="none" />
                  <path d="M24 4a20 20 0 0114.14 5.86" stroke={GRADIENT[0]} strokeWidth="3" strokeLinecap="round" fill="none" />
                </svg>
                <span style={{ fontSize: 14, color: C.sub, fontWeight: 600 }}>Generating video...</span>
                <span style={{ fontSize: 12, color: C.dim }}>This may take a moment</span>
              </div>
            ) : generated ? (
              <>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(135deg, ${GRADIENT[0]}11, ${GRADIENT[1]}11)`,
                }} />
                <button
                  onClick={handlePlay}
                  style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 8px 24px ${GRADIENT[0]}44`,
                    transition: 'transform 0.2s ease', outline: 'none',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = `0 8px 24px ${GRADIENT[0]}44, 0 0 0 3px ${GRADIENT[0]}44`; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = `0 8px 24px ${GRADIENT[0]}44`; }}
                >
                  {isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>
                <span style={{ fontSize: 13, color: C.sub, marginTop: 16, fontWeight: 600 }}>
                  {isPlaying ? 'Playing...' : 'Video ready - click to play'}
                </span>
                <div style={{
                  position: 'absolute', bottom: 16, left: 16, right: 16,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 11, color: C.dim }}>0:00</span>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: C.border }}>
                    <div style={{ width: isPlaying ? '35%' : '0%', height: '100%', borderRadius: 2, background: GRADIENT[0], transition: 'width 0.3s ease' }} />
                  </div>
                  <span style={{ fontSize: 11, color: C.dim }}>0:{duration.replace('s', '').padStart(2, '0')}</span>
                </div>
              </>
            ) : (
              <>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.2" opacity={0.3}>
                  <rect x="2" y="2" width="20" height="20" rx="2.18" />
                  <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" />
                  <line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="7" x2="22" y2="7" />
                  <line x1="17" y1="17" x2="22" y2="17" />
                </svg>
                <span style={{ fontSize: 14, color: C.dim, marginTop: 12 }}>Video preview will appear here</span>
              </>
            )}
          </div>

          {/* Download button when generated */}
          {generated && (
            <button
              onClick={handleDownload}
              onMouseEnter={() => setDownloadHover(true)}
              onMouseLeave={() => setDownloadHover(false)}
              style={{
                marginTop: 16, padding: '12px 20px', borderRadius: 12,
                border: `1px solid ${C.border}`, background: downloadHover ? C.surface : C.card,
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
              Download Video (MP4)
            </button>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
