'use client';

import { useState, useCallback } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#3b82f6', '#06b6d4'];

const ASPECT_RATIOS = [
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '1:1', value: '1:1' },
  { label: '4:3', value: '4:3' },
  { label: 'Free', value: 'free' },
] as const;

interface StitchClip {
  id: number;
  name: string;
  start: string;
  end: string;
}

export function CutCrop() {
  const C = useThemeStore((s) => s.theme);
  const [file, setFile] = useState<File | null>(null);
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:30');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [scrubberPos, setScrubberPos] = useState(30);
  const [stitchMode, setStitchMode] = useState(false);
  const [clips, setClips] = useState<StitchClip[]>([]);
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const addClip = useCallback(() => {
    setClips((prev) => [
      ...prev,
      { id: Date.now(), name: `Clip ${prev.length + 1}`, start: startTime, end: endTime },
    ]);
  }, [startTime, endTime]);

  const removeClip = useCallback((id: number) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleExport = useCallback(() => {
    if (loading) return;
    setLoading(true);
    setExported(false);
    setTimeout(() => {
      setLoading(false);
      setExported(true);
    }, 2000);
  }, [loading]);

  /* Crop overlay dimensions for visual preview */
  const getCropOverlay = () => {
    switch (aspectRatio) {
      case '9:16': return { width: '33%', height: '100%' };
      case '1:1': return { width: '56%', height: '100%' };
      case '4:3': return { width: '75%', height: '100%' };
      case 'free': return { width: '80%', height: '70%' };
      default: return { width: '100%', height: '100%' };
    }
  };

  const overlay = getCropOverlay();

  return (
    <ToolPageShell
      title="Cut & Crop"
      subtitle="Trim, crop, and stitch video clips with precision"
      gradient={GRADIENT}
    >
      {!file ? (
        <UploadArea
          C={C}
          accept="video/*"
          onFile={setFile}
          label="Drop your video file here"
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24 }}>
          {/* Left: Preview + Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Video preview */}
            <div style={{
              width: '100%', aspectRatio: '16/9', borderRadius: 14,
              background: '#000', position: 'relative', overflow: 'hidden',
              border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Placeholder video area */}
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" opacity={0.4}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>

              {/* Crop overlay */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: overlay.width, height: overlay.height,
                border: '2px dashed rgba(255,255,255,0.6)',
                borderRadius: 4,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                pointerEvents: 'none',
                transition: 'all 0.3s ease',
              }} />

              {/* File name */}
              <span style={{
                position: 'absolute', bottom: 10, left: 12,
                color: '#fff', fontSize: 11, opacity: 0.7,
                background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 6,
                maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {file.name}
              </span>
            </div>

            {/* Timeline scrubber */}
            <div style={{
              padding: '12px 16px', borderRadius: 12,
              background: C.surface, border: `1px solid ${C.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: `1px solid ${C.border}`, background: C.card,
                    color: C.text, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
                >
                  {isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>
                <span style={{ fontSize: 12, color: C.sub, fontFamily: 'monospace' }}>
                  {startTime}
                </span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: C.sub, fontFamily: 'monospace' }}>
                  {endTime}
                </span>
              </div>

              {/* Scrubber bar */}
              <div
                style={{
                  width: '100%', height: 8, borderRadius: 4,
                  background: C.border, position: 'relative', cursor: 'pointer',
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                  setScrubberPos(Math.max(0, Math.min(100, pct)));
                }}
              >
                {/* Selected range */}
                <div style={{
                  position: 'absolute', left: '10%', width: '60%',
                  height: '100%', borderRadius: 4,
                  background: `linear-gradient(90deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                  opacity: 0.6,
                  transition: 'width 0.1s ease',
                }} />
                {/* Scrubber handle */}
                <div style={{
                  position: 'absolute', left: `${scrubberPos}%`,
                  top: '50%', transform: 'translate(-50%, -50%)',
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#fff', border: `2px solid ${GRADIENT[0]}`,
                  boxShadow: `0 2px 6px ${GRADIENT[0]}44`,
                  transition: 'box-shadow 0.2s ease',
                }} />
              </div>

              {/* Trim frame indicators */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: 8, fontSize: 10, color: C.dim,
              }}>
                {Array.from({ length: 11 }, (_, i) => (
                  <span key={i}>|</span>
                ))}
              </div>
            </div>

            {/* Export success feedback */}
            {exported && (
              <div style={{
                padding: 14, borderRadius: 10,
                background: '#22c55e12', border: '1px solid #22c55e33',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
                  Video exported successfully!
                </span>
              </div>
            )}

            {/* Stitch clips list */}
            {stitchMode && clips.length > 0 && (
              <div style={{
                padding: 16, borderRadius: 12,
                background: C.surface, border: `1px solid ${C.border}`,
              }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 10px' }}>
                  Stitch Clips ({clips.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {clips.map((clip, idx) => (
                    <div key={clip.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8,
                      background: C.card, border: `1px solid ${C.border}`,
                      transition: 'all 0.2s ease',
                    }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                        color: '#fff', fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{clip.name}</span>
                      <span style={{ fontSize: 11, color: C.dim, fontFamily: 'monospace', flexShrink: 0 }}>
                        {clip.start} — {clip.end}
                      </span>
                      <button
                        onClick={() => removeClip(clip.id)}
                        style={{
                          background: 'none', border: 'none', color: C.dim,
                          cursor: 'pointer', fontSize: 16, padding: 2,
                          transition: 'all 0.2s ease', flexShrink: 0,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = C.dim; }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Time inputs */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
                Start Time
              </label>
              <input
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="HH:MM:SS"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.card,
                  color: C.text, fontSize: 14, fontFamily: 'monospace',
                  boxSizing: 'border-box', outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
                End Time
              </label>
              <input
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="HH:MM:SS"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.card,
                  color: C.text, fontSize: 14, fontFamily: 'monospace',
                  boxSizing: 'border-box', outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              />
            </div>

            {/* Aspect ratio */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
                Crop Ratio
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setAspectRatio(r.value)}
                    style={{
                      padding: '10px 0', borderRadius: 10,
                      border: aspectRatio === r.value ? `2px solid ${GRADIENT[0]}` : `1px solid ${C.border}`,
                      background: aspectRatio === r.value ? `${GRADIENT[0]}18` : C.card,
                      color: aspectRatio === r.value ? GRADIENT[0] : C.text,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s ease', fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => { if (aspectRatio !== r.value) e.currentTarget.style.background = C.cardHover; }}
                    onMouseLeave={(e) => { if (aspectRatio !== r.value) e.currentTarget.style.background = aspectRatio === r.value ? `${GRADIENT[0]}18` : C.card; }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stitch mode toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 10,
              background: C.card, border: `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Stitch Mode</span>
              <button
                onClick={() => setStitchMode(!stitchMode)}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none',
                  background: stitchMode
                    ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                    : C.border,
                  cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: 3, left: stitchMode ? 23 : 3,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff', transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>

            {stitchMode && (
              <button
                onClick={addClip}
                style={{
                  padding: '10px 0', borderRadius: 10,
                  border: `1px dashed ${GRADIENT[0]}`,
                  background: `${GRADIENT[0]}08`, color: GRADIENT[0],
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s ease', fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${GRADIENT[0]}18`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${GRADIENT[0]}08`; }}
              >
                + Add Current Selection as Clip
              </button>
            )}

            {/* Remove file */}
            <button
              onClick={() => { setFile(null); setClips([]); setExported(false); setIsPlaying(false); }}
              style={{
                padding: '8px 0', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.card,
                color: C.dim, fontSize: 12, cursor: 'pointer',
                transition: 'all 0.2s ease', fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.color = C.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.dim; }}
            >
              Remove Video
            </button>

            {/* Export button */}
            <ActionButton
              label={loading ? 'Exporting...' : 'Export Video'}
              gradient={GRADIENT}
              onClick={handleExport}
              disabled={!file}
              loading={loading}
            />
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
