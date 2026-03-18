'use client';

import { useState, useCallback } from 'react';
import { ToolPageShell, UploadArea, ActionButton, ResultPreview } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#ef4444', '#f97316'];

const DETECTION_MODES = ['Auto-detect', 'Manual region select'] as const;
const QUALITY_LEVELS = [
  { key: 'fast', label: 'Fast', desc: '~30s processing' },
  { key: 'balanced', label: 'Balanced', desc: '~2min processing' },
  { key: 'high', label: 'High Quality', desc: '~5min processing' },
] as const;

export function SubtitleRemover() {
  const C = useThemeStore((s) => s.theme);
  const [file, setFile] = useState<File | null>(null);
  const [detectionMode, setDetectionMode] = useState<typeof DETECTION_MODES[number]>('Auto-detect');
  const [quality, setQuality] = useState<string>('balanced');
  const [loading, setLoading] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [splitPos, setSplitPos] = useState(50);

  const handleRemove = useCallback(() => {
    if (!file || loading) return;
    setLoading(true);
    setProcessed(false);
    setTimeout(() => {
      setLoading(false);
      setProcessed(true);
    }, 2500);
  }, [file, loading]);

  return (
    <ToolPageShell
      comingSoon
      title="AI Subtitle Remover"
      subtitle="Automatically detect and remove hardcoded subtitles from videos"
      gradient={GRADIENT}
      badge="AI"
      badgeColor="#ef4444"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        {/* Left column: controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Upload */}
          {!file ? (
            <UploadArea
              C={C}
              accept="video/*"
              onFile={setFile}
              label="Drop your video file here"
            />
          ) : (
            <div style={{
              padding: 14, borderRadius: 12,
              border: `1px solid ${C.border}`, background: C.surface,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                <p style={{ fontSize: 11, color: C.dim, margin: '2px 0 0' }}>
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              <button
                onClick={() => { setFile(null); setProcessed(false); }}
                style={{
                  background: 'none', border: 'none', color: C.dim,
                  cursor: 'pointer', fontSize: 18, padding: 4,
                  transition: 'all 0.2s ease', flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.dim; }}
              >
                &times;
              </button>
            </div>
          )}

          {/* Detection mode */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
              Detection Mode
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DETECTION_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDetectionMode(mode)}
                  style={{
                    padding: '12px 16px', borderRadius: 10,
                    border: detectionMode === mode ? `2px solid ${GRADIENT[0]}` : `1px solid ${C.border}`,
                    background: detectionMode === mode ? `${GRADIENT[0]}12` : C.card,
                    color: detectionMode === mode ? GRADIENT[0] : C.text,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s ease', fontFamily: 'inherit',
                    textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                  onMouseEnter={(e) => { if (detectionMode !== mode) e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { if (detectionMode !== mode) e.currentTarget.style.background = detectionMode === mode ? `${GRADIENT[0]}12` : C.card; }}
                >
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: detectionMode === mode ? `5px solid ${GRADIENT[0]}` : `2px solid ${C.dim}`,
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }} />
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Manual region hint */}
          {detectionMode === 'Manual region select' && (
            <div style={{
              padding: 12, borderRadius: 10,
              background: `${GRADIENT[1]}10`, border: `1px solid ${GRADIENT[1]}33`,
            }}>
              <p style={{ fontSize: 12, color: GRADIENT[1], margin: 0 }}>
                Draw a rectangle over the subtitle region in the preview area on the right to define the removal zone.
              </p>
            </div>
          )}

          {/* Removal quality */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
              Removal Quality
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {QUALITY_LEVELS.map((q) => (
                <button
                  key={q.key}
                  onClick={() => setQuality(q.key)}
                  style={{
                    padding: '12px 16px', borderRadius: 10,
                    border: quality === q.key ? `2px solid ${GRADIENT[0]}` : `1px solid ${C.border}`,
                    background: quality === q.key ? `${GRADIENT[0]}12` : C.card,
                    color: C.text, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    fontFamily: 'inherit', textAlign: 'left',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                  onMouseEnter={(e) => { if (quality !== q.key) e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { if (quality !== q.key) e.currentTarget.style.background = quality === q.key ? `${GRADIENT[0]}12` : C.card; }}
                >
                  <span style={{ color: quality === q.key ? GRADIENT[0] : C.text }}>{q.label}</span>
                  <span style={{ fontSize: 11, color: C.dim, fontWeight: 500 }}>{q.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Remove button */}
          <ActionButton
            label={loading ? 'Removing Subtitles...' : 'Remove Subtitles'}
            gradient={GRADIENT}
            onClick={handleRemove}
            disabled={!file}
            loading={loading}
          />

          {/* Download button (after processing) */}
          {processed && (
            <button
              style={{
                padding: '12px 0', borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: C.card, color: C.text,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Cleaned Video
            </button>
          )}
        </div>

        {/* Right column: preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>
            {processed ? 'Before / After Preview' : 'Preview'}
          </h3>

          {!file ? (
            <ResultPreview C={C} label="Upload a video to preview subtitle detection" />
          ) : !processed ? (
            <div style={{
              width: '100%', aspectRatio: '16/9', borderRadius: 14,
              background: '#000', position: 'relative', overflow: 'hidden',
              border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" opacity={0.3}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>

              {/* Simulated subtitle area */}
              <div style={{
                position: 'absolute', bottom: 20, left: '50%',
                transform: 'translateX(-50%)',
                padding: '6px 20px', borderRadius: 4,
                background: 'rgba(0,0,0,0.75)',
              }}>
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                  Sample subtitle text here
                </span>
              </div>

              {/* Detection region indicator */}
              {detectionMode === 'Auto-detect' && (
                <div style={{
                  position: 'absolute', bottom: 10, left: '10%', right: '10%',
                  height: 50, border: `2px dashed ${GRADIENT[0]}88`,
                  borderRadius: 4, background: `${GRADIENT[0]}08`,
                  transition: 'all 0.3s ease',
                }}>
                  <span style={{
                    position: 'absolute', top: -18, left: 0,
                    fontSize: 10, color: GRADIENT[0], fontWeight: 600,
                  }}>
                    Auto-detected region
                  </span>
                </div>
              )}

              {/* Loading overlay */}
              {loading && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                }}>
                  <svg width="32" height="32" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,.3)" strokeWidth="2" fill="none" />
                    <path d="M8 2a6 6 0 014.47 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Analyzing subtitles...</span>
                </div>
              )}
            </div>
          ) : (
            /* Before/After split view */
            <div style={{
              width: '100%', aspectRatio: '16/9', borderRadius: 14,
              background: '#000', position: 'relative', overflow: 'hidden',
              border: `1px solid ${C.border}`,
              cursor: 'col-resize',
            }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                setSplitPos(Math.max(10, Math.min(90, pct)));
              }}
            >
              {/* Before side (with subtitles) */}
              <div style={{
                position: 'absolute', inset: 0,
                width: `${splitPos}%`, overflow: 'hidden',
              }}>
                <div style={{
                  width: '100%', height: '100%',
                  background: 'linear-gradient(180deg, #111 0%, #1a1a2e 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" opacity={0.3}>
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                {/* Subtitle */}
                <div style={{
                  position: 'absolute', bottom: 20, left: '50%',
                  transform: 'translateX(-50%)', whiteSpace: 'nowrap',
                  padding: '4px 14px', background: 'rgba(0,0,0,0.75)', borderRadius: 4,
                }}>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Subtitle text</span>
                </div>
                {/* Before label */}
                <span style={{
                  position: 'absolute', top: 10, left: 10,
                  padding: '2px 8px', borderRadius: 6,
                  background: GRADIENT[0], color: '#fff',
                  fontSize: 10, fontWeight: 700,
                }}>
                  BEFORE
                </span>
              </div>

              {/* After side (clean) */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${splitPos}%`, right: 0, overflow: 'hidden',
              }}>
                <div style={{
                  width: '100%', height: '100%',
                  background: 'linear-gradient(180deg, #111 0%, #1a1a2e 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" opacity={0.3}>
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                {/* After label */}
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  padding: '2px 8px', borderRadius: 6,
                  background: '#22c55e', color: '#fff',
                  fontSize: 10, fontWeight: 700,
                }}>
                  AFTER
                </span>
              </div>

              {/* Split divider line */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${splitPos}%`, width: 3,
                background: '#fff', zIndex: 10,
                transition: 'left 0.05s ease',
              }}>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M8 4l-4 8 4 8" /><path d="M16 4l4 8-4 8" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Status info */}
          {processed && (
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
                Subtitles successfully removed! Drag the slider to compare.
              </span>
            </div>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
