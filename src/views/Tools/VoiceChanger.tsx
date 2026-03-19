'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
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
  const [playProgress, setPlayProgress] = useState(0);
  const [hoveredEffect, setHoveredEffect] = useState<string | null>(null);
  const [recordHover, setRecordHover] = useState(false);
  const [downloadHover, setDownloadHover] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleApply = () => {
    setLoading(true);
    setDone(false);
    setIsPlaying(false);
    setPlayProgress(0);
    setTimeout(() => { setLoading(false); setDone(true); }, 2000);
  };

  const handleDownload = () => {
    if (!file) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = `${effect}_${file.name}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleReset = () => {
    setFile(null);
    setDone(false);
    setIsRecording(false);
    setIsPlaying(false);
    setPlayProgress(0);
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      setPlayProgress(0);
    }
  };

  // Simulate playback progress
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setPlayProgress((p) => {
          if (p >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return p + 2;
        });
      }, 120);
    } else {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith('audio/') || f.type.startsWith('video/'))) {
      setFile(f);
      setDone(false);
    }
  }, []);

  return (
    <ToolPageShell
      comingSoon
      title="Voice Changer"
      subtitle="Transform voices with fun effects and adjustments"
      gradient={['#d946ef', '#a855f7']}
    >
      {/* Upload OR Record */}
      {!file && !isRecording ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
          >
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '48px 24px', borderRadius: 16,
              border: `2px dashed ${dragOver ? '#d946ef' : C.border}`,
              background: dragOver ? 'rgba(217,70,239,.06)' : C.surface,
              cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 12 }}>
                Drop audio or video file here or click to upload
              </span>
              <span style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
                MP3, WAV, FLAC, MP4, WebM
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); setDone(false); }
                }}
              />
            </label>
          </div>
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
              color: C.text, cursor: 'pointer', transition: 'all 0.2s ease',
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
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => {
                setIsRecording(false);
                setFile(new File([], 'recording.wav', { type: 'audio/wav' }));
              }}
              style={{
                padding: '10px 24px', borderRadius: 10,
                border: 'none', background: '#ef4444', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
              }}
            >
              Stop Recording
            </button>
            <button
              onClick={() => setIsRecording(false)}
              style={{
                padding: '10px 24px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.card, color: C.sub,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
              }}
            >
              Cancel
            </button>
          </div>
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
              onClick={handleReset}
              onMouseEnter={() => setRemoveHover(true)}
              onMouseLeave={() => setRemoveHover(false)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: removeHover ? C.surface : C.card,
                color: C.sub, fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
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
                  onClick={() => { setEffect(fx.id); setDone(false); }}
                  onMouseEnter={() => setHoveredEffect(fx.id)}
                  onMouseLeave={() => setHoveredEffect(null)}
                  style={{
                    padding: '14px 8px', borderRadius: 12, textAlign: 'center',
                    border: effect === fx.id ? '2px solid #d946ef' : `1px solid ${C.border}`,
                    background: effect === fx.id
                      ? 'rgba(217,70,239,.1)'
                      : hoveredEffect === fx.id ? C.surface : C.card,
                    cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    transform: effect === fx.id ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: effect === fx.id ? '0 4px 12px rgba(217,70,239,.15)' : 'none',
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
                aria-label="Voice pitch"
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
                aria-label="Voice speed"
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
                onClick={togglePlay}
                style={{
                  width: 40, height: 40, borderRadius: 20, border: 'none',
                  background: 'linear-gradient(135deg, #d946ef, #a855f7)',
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  transform: isPlaying ? 'scale(0.95)' : 'scale(1)',
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
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${playProgress}%`, height: '100%', borderRadius: 2,
                    background: 'linear-gradient(135deg, #d946ef, #a855f7)',
                    transition: isPlaying ? 'width 0.12s linear' : 'none',
                  }} />
                </div>
              </div>
              <span style={{ fontSize: 11, color: C.dim }}>
                {`0:${String(Math.floor(playProgress / 100 * 12)).padStart(2, '0')} / 0:12`}
              </span>
            </div>
          )}

          {/* Done status */}
          {done && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
              border: '1px solid rgba(217,70,239,.3)', background: 'rgba(217,70,239,.06)', marginBottom: 16,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Effect applied successfully</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <ActionButton
              label={done ? 'Re-apply Effect' : 'Apply Effect'}
              gradient={['#d946ef', '#a855f7']}
              onClick={handleApply}
              loading={loading}
            />
            {done && (
              <button
                onClick={handleDownload}
                onMouseEnter={() => setDownloadHover(true)}
                onMouseLeave={() => setDownloadHover(false)}
                style={{
                  padding: '12px 32px', borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: downloadHover ? C.surface : C.card,
                  color: C.text, fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
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
