'use client';

import { useState } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const EFFECTS = [
  { id: 'deep', label: 'Deep', icon: '🔊' },
  { id: 'chipmunk', label: 'Chipmunk', icon: '🐿' },
  { id: 'robot', label: 'Robot', icon: '🤖' },
  { id: 'echo', label: 'Echo', icon: '🔁' },
  { id: 'whisper', label: 'Whisper', icon: '🤫' },
  { id: 'monster', label: 'Monster', icon: '👹' },
  { id: 'female', label: 'Female', icon: '♀' },
  { id: 'male', label: 'Male', icon: '♂' },
  { id: 'child', label: 'Child', icon: '👶' },
  { id: 'alien', label: 'Alien', icon: '👽' },
  { id: 'celebrity', label: 'Celebrity', icon: '⭐' },
] as const;

export function VoiceChanger() {
  const C = useThemeStore((s) => s.theme);

  const [file, setFile] = useState<File | null>(null);
  const [effect, setEffect] = useState<string>('robot');
  const [pitch, setPitch] = useState(50);
  const [speed, setSpeed] = useState(50);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredEffect, setHoveredEffect] = useState<string | null>(null);
  const [recordHover, setRecordHover] = useState(false);
  const [downloadHover, setDownloadHover] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleApply = () => {
    setLoading(true);
    setDone(false);
    setTimeout(() => { setLoading(false); setDone(true); }, 2000);
  };

  return (
    <ToolPageShell
      title="Voice Changer"
      subtitle="Transform voices with fun effects and adjustments"
      gradient={['#d946ef', '#a855f7']}
    >
      {/* Upload OR Record */}
      {!file && !isRecording ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <UploadArea C={C} accept="audio/*,video/*" onFile={setFile} label="Drop audio or video file here or click to upload" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.dim, fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <button
            onClick={() => setIsRecording(true)}
            onMouseEnter={() => setRecordHover(true)}
            onMouseLeave={() => setRecordHover(false)}
            style={{
              padding: '16px 24px', borderRadius: 14,
              border: `1px solid ${C.border}`,
              background: recordHover ? C.surface : C.card,
              color: C.text, cursor: 'pointer', transition: 'all .2s',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10,
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 10,
              background: 'linear-gradient(135deg, #d946ef, #a855f7)',
            }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Record with Microphone</span>
          </button>
        </div>
      ) : isRecording && !file ? (
        /* Recording UI */
        <div style={{
          padding: 32, borderRadius: 14, border: `1px solid ${C.border}`,
          background: C.card, textAlign: 'center', marginBottom: 24,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 32, margin: '0 auto 16px',
            background: 'rgba(217,70,239,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 12,
              background: 'linear-gradient(135deg, #d946ef, #a855f7)',
            }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>Recording...</div>
          <div style={{ fontSize: 12, color: C.dim, marginBottom: 16 }}>Speak into your microphone</div>
          <button
            onClick={() => {
              setIsRecording(false);
              setFile(new File([], 'recording.wav', { type: 'audio/wav' }));
            }}
            style={{
              padding: '10px 24px', borderRadius: 10,
              border: 'none', background: '#ef4444', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Stop Recording
          </button>
        </div>
      ) : (
        <div>
          {/* File Info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12,
            border: `1px solid ${C.border}`, background: C.card, marginBottom: 24,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #d946ef, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{file!.name}</div>
              <div style={{ fontSize: 11, color: C.dim }}>{file!.size > 0 ? `${(file!.size / 1024 / 1024).toFixed(2)} MB` : 'Recorded audio'}</div>
            </div>
            <button
              onClick={() => { setFile(null); setDone(false); setIsRecording(false); }}
              style={{
                padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.surface, color: C.sub, fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Remove
            </button>
          </div>

          {/* Voice Effect Grid */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 10 }}>Voice Effects</label>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: 10,
            }}>
              {EFFECTS.map((fx) => (
                <button
                  key={fx.id}
                  onClick={() => setEffect(fx.id)}
                  onMouseEnter={() => setHoveredEffect(fx.id)}
                  onMouseLeave={() => setHoveredEffect(null)}
                  style={{
                    padding: '14px 8px', borderRadius: 12, textAlign: 'center',
                    border: effect === fx.id ? '2px solid #d946ef' : `1px solid ${C.border}`,
                    background: effect === fx.id
                      ? 'rgba(217,70,239,.1)'
                      : hoveredEffect === fx.id ? C.surface : C.card,
                    cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{fx.icon}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: effect === fx.id ? '#d946ef' : C.text,
                  }}>
                    {fx.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Pitch & Speed Sliders */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{
              padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Pitch</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>{pitch}%</span>
              </div>
              <input
                type="range" min={0} max={100} value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#d946ef' }}
              />
            </div>
            <div style={{
              padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Speed</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>{speed}%</span>
              </div>
              <input
                type="range" min={0} max={100} value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#a855f7' }}
              />
            </div>
          </div>

          {/* Audio Preview */}
          {done && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 16,
              borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, marginBottom: 24,
            }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  width: 40, height: 40, borderRadius: 20, border: 'none',
                  background: 'linear-gradient(135deg, #d946ef, #a855f7)',
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none">
                    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none">
                    <polygon points="5 3 19 12 5 21" />
                  </svg>
                )}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Preview</div>
                <div style={{
                  width: '100%', height: 4, borderRadius: 2, background: C.surface, marginTop: 6,
                }}>
                  <div style={{
                    width: isPlaying ? '60%' : '0%', height: '100%', borderRadius: 2,
                    background: 'linear-gradient(135deg, #d946ef, #a855f7)',
                    transition: 'width 2s linear',
                  }} />
                </div>
              </div>
              <span style={{ fontSize: 11, color: C.dim }}>0:04 / 0:12</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <ActionButton
              label="Apply Effect"
              gradient={['#d946ef', '#a855f7']}
              onClick={handleApply}
              loading={loading}
            />
            {done && (
              <button
                onClick={() => {}}
                onMouseEnter={() => setDownloadHover(true)}
                onMouseLeave={() => setDownloadHover(false)}
                style={{
                  padding: '12px 32px', borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: downloadHover ? C.surface : C.card,
                  color: C.text, fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </button>
            )}
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
