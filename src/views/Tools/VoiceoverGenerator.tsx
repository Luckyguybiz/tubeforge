'use client';

import { useState, useCallback } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#3b82f6', '#6366f1'];

const VOICES = [
  { id: 'dan', name: 'Dan', desc: 'Deep, authoritative', color: '#3b82f6' },
  { id: 'sara', name: 'Sara', desc: 'Warm, friendly', color: '#ec4899' },
  { id: 'mike', name: 'Mike', desc: 'Energetic, youthful', color: '#f59e0b' },
  { id: 'anna', name: 'Anna', desc: 'Calm, professional', color: '#8b5cf6' },
  { id: 'james', name: 'James', desc: 'British narrator', color: '#10b981' },
  { id: 'lisa', name: 'Lisa', desc: 'Soft, soothing', color: '#ef4444' },
  { id: 'alex', name: 'Alex', desc: 'Casual, upbeat', color: '#06b6d4' },
  { id: 'emma', name: 'Emma', desc: 'Clear, articulate', color: '#d946ef' },
  { id: 'ryan', name: 'Ryan', desc: 'Bold, cinematic', color: '#f97316' },
  { id: 'zoe', name: 'Zoe', desc: 'Playful, bright', color: '#14b8a6' },
];

const LANGUAGES = ['English', 'Russian', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Portuguese', 'Hindi', 'Arabic'];

export function VoiceoverGenerator() {
  const C = useThemeStore((s) => s.theme);
  const [script, setScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadHover, setDownloadHover] = useState(false);
  const [hoveredVoice, setHoveredVoice] = useState<string | null>(null);

  const handleGenerate = useCallback(() => {
    if (!script.trim() || loading) return;
    setGenerated(false);
    setIsPlaying(false);
    setLoading(true);
    setTimeout(() => { setLoading(false); setGenerated(true); }, 2500);
  }, [script, loading]);

  const handlePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleDownload = useCallback(() => {
    /* Simulate download action */
  }, []);

  // Generate deterministic waveform bars to avoid hydration issues
  const waveformBars = Array.from({ length: 40 }, (_, i) => {
    const h = 15 + Math.sin(i * 0.5) * 25 + ((i * 17 + 7) % 20);
    return h;
  });

  return (
    <ToolPageShell
      title="AI Voiceover Generator"
      subtitle="Generate realistic AI voiceovers from your scripts with customizable voices"
      gradient={GRADIENT}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Script input */}
          <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>Script</span>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Type your script here..."
              style={{
                width: '100%', minHeight: 140, padding: 14, borderRadius: 12,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.text, fontSize: 14, fontFamily: 'inherit',
                resize: 'vertical', outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: C.dim }}>{script.length} characters</span>
            </div>
          </div>

          {/* Language */}
          <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>Language</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none',
                cursor: 'pointer', transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            >
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Speed */}
          <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Speed</span>
              <span style={{ fontSize: 13, color: GRADIENT[0], fontWeight: 600 }}>{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range" min={0.5} max={2} step={0.1} value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              style={{ width: '100%', accentColor: GRADIENT[0], cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.dim, marginTop: 4 }}>
              <span>0.5x</span><span>1.0x</span><span>1.5x</span><span>2.0x</span>
            </div>
          </div>

          {/* Pitch */}
          <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Pitch</span>
              <span style={{ fontSize: 13, color: GRADIENT[0], fontWeight: 600 }}>{pitch > 0 ? '+' : ''}{pitch}</span>
            </div>
            <input
              type="range" min={-5} max={5} step={1} value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              style={{ width: '100%', accentColor: GRADIENT[0], cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.dim, marginTop: 4 }}>
              <span>-5</span><span>0</span><span>+5</span>
            </div>
          </div>

          <ActionButton label="Generate Voiceover" gradient={GRADIENT} onClick={handleGenerate} loading={loading} disabled={!script.trim()} />
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Voice selector */}
          <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 16 }}>Select Voice</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {VOICES.map((v) => {
                const isSelected = selectedVoice === v.id;
                const isHovered = hoveredVoice === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    onMouseEnter={() => setHoveredVoice(v.id)}
                    onMouseLeave={() => setHoveredVoice(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      borderRadius: 12,
                      border: `1px solid ${isSelected ? v.color : isHovered ? `${v.color}88` : C.border}`,
                      background: isSelected ? `${v.color}11` : isHovered ? `${v.color}08` : C.surface,
                      cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit', textAlign: 'left',
                      outline: 'none',
                    }}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${v.color}44`; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${v.color}, ${v.color}aa)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0,
                    }}>
                      {v.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v.name}</div>
                      <div style={{ fontSize: 11, color: C.dim }}>{v.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audio preview */}
          <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 16 }}>Audio Preview</span>
            <div style={{
              height: 80, borderRadius: 12, background: C.surface,
              border: `1px solid ${C.border}`, display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 3, padding: '0 20px',
            }}>
              {generated ? (
                waveformBars.map((h, i) => (
                  <div key={i} style={{
                    width: 3, borderRadius: 2,
                    height: `${h}%`,
                    background: `linear-gradient(180deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                    opacity: 0.7,
                    transition: 'height 0.3s ease',
                  }} />
                ))
              ) : (
                <span style={{ fontSize: 13, color: C.dim }}>Waveform will appear here</span>
              )}
            </div>
            {generated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
                <button
                  onClick={handlePlay}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                    border: 'none', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.2s ease', outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${GRADIENT[0]}44`; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {isPlaying ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: C.border }}>
                  <div style={{ width: isPlaying ? '35%' : '0%', height: '100%', borderRadius: 2, background: GRADIENT[0], transition: 'width 0.3s ease' }} />
                </div>
                <span style={{ fontSize: 12, color: C.dim }}>0:00 / 0:42</span>
              </div>
            )}
          </div>

          {/* Download */}
          {generated && (
            <button
              onClick={handleDownload}
              onMouseEnter={() => setDownloadHover(true)}
              onMouseLeave={() => setDownloadHover(false)}
              style={{
                padding: '14px 24px', borderRadius: 12,
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
              Download MP3
            </button>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
