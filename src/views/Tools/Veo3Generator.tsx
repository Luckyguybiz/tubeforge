'use client';

import { useState } from 'react';
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

export function Veo3Generator() {
  const C = useThemeStore((s) => s.theme);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('10s');
  const [aspect, setAspect] = useState('16:9');
  const [stylePreset, setStylePreset] = useState('cinematic');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setGenerated(true); }, 3500);
  };

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px', borderRadius: 10,
    border: `1px solid ${active ? GRADIENT[0] : C.border}`,
    background: active ? `${GRADIENT[0]}22` : C.card,
    color: active ? GRADIENT[0] : C.sub,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    transition: 'all .2s', fontFamily: 'inherit',
  });

  return (
    <ToolPageShell
      title="AI Video Generator (VEO3)"
      subtitle="Generate stunning videos from text prompts using Google VEO3 technology"
      gradient={GRADIENT}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Prompt */}
          <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Text Prompt</span>
              <button
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${GRADIENT[0]}55`,
                  background: hoveredBtn === 'promptgen' ? `${GRADIENT[0]}22` : `${GRADIENT[0]}11`,
                  color: GRADIENT[0], cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
                }}
                onMouseEnter={() => setHoveredBtn('promptgen')}
                onMouseLeave={() => setHoveredBtn(null)}
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
              }}
            />
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {STYLE_PRESETS.map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => setStylePreset(sp.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                    borderRadius: 12, border: `1px solid ${stylePreset === sp.id ? sp.color : C.border}`,
                    background: stylePreset === sp.id ? `${sp.color}11` : C.surface,
                    cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{sp.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{sp.name}</div>
                    <div style={{ fontSize: 11, color: C.dim }}>{sp.desc}</div>
                  </div>
                </button>
              ))}
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
                <button style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 8px 24px ${GRADIENT[0]}44`,
                  transition: 'transform .2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>
                <span style={{ fontSize: 13, color: C.sub, marginTop: 16, fontWeight: 600 }}>Video ready - click to play</span>
                <div style={{
                  position: 'absolute', bottom: 16, left: 16, right: 16,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 11, color: C.dim }}>0:00</span>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: C.border }}>
                    <div style={{ width: '0%', height: '100%', borderRadius: 2, background: GRADIENT[0] }} />
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
        </div>
      </div>
    </ToolPageShell>
  );
}
