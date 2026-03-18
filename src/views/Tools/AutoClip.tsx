'use client';

import { useState, useCallback } from 'react';
import { ToolPageShell, UploadArea, ActionButton, ResultPreview } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#6366f1', '#ec4899'];

const CLIP_LENGTHS = ['15s', '30s', '60s'] as const;
const PLATFORMS = ['YouTube Shorts', 'TikTok', 'Instagram Reels'] as const;
const DETECTION_MODES = ['Most engaging moments', 'Key points', 'Funny moments'] as const;

interface ClipResult {
  id: number;
  thumbnail: string;
  startTime: string;
  endTime: string;
  score: number;
  title: string;
}

export function AutoClip() {
  const C = useThemeStore((s) => s.theme);
  const [file, setFile] = useState<File | null>(null);
  const [numClips, setNumClips] = useState(3);
  const [clipLength, setClipLength] = useState<typeof CLIP_LENGTHS[number]>('30s');
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]>('YouTube Shorts');
  const [detection, setDetection] = useState<typeof DETECTION_MODES[number]>('Most engaging moments');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ClipResult[]>([]);
  const [previewingId, setPreviewingId] = useState<number | null>(null);

  const handleProcess = useCallback(() => {
    if (!file || loading) return;
    setLoading(true);
    setResults([]);
    setTimeout(() => {
      const mock: ClipResult[] = Array.from({ length: numClips }, (_, i) => ({
        id: i + 1,
        thumbnail: '',
        startTime: `00:${String((i + 1) * 2).padStart(2, '0')}:15`,
        endTime: `00:${String((i + 1) * 2).padStart(2, '0')}:${clipLength === '15s' ? '30' : clipLength === '30s' ? '45' : '75'}`,
        score: Math.round(70 + Math.random() * 25),
        title: `Clip ${i + 1} — ${detection}`,
      }));
      setResults(mock);
      setLoading(false);
    }, 2000);
  }, [file, loading, numClips, clipLength, detection]);

  const handleClipAction = useCallback((action: string, clipId: number) => {
    if (action === 'Preview') {
      setPreviewingId((prev) => (prev === clipId ? null : clipId));
    }
    // Download and Edit are no-ops in the demo but the button is interactive
  }, []);

  return (
    <ToolPageShell
      comingSoon
      title="AutoClip"
      subtitle="Transform long videos into viral clips using AI"
      gradient={GRADIENT}
      badge="AI"
      badgeColor="#6366f1"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 }}>
        {/* Left column: controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Upload */}
          {!file ? (
            <UploadArea
              C={C}
              accept="video/*"
              onFile={setFile}
              label="Drop your long video here"
            />
          ) : (
            <div style={{
              padding: 16, borderRadius: 12,
              border: `1px solid ${C.border}`, background: C.surface,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 10,
                background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                <p style={{ fontSize: 12, color: C.dim, margin: '2px 0 0' }}>
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              <button
                onClick={() => { setFile(null); setResults([]); setPreviewingId(null); }}
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

          {/* Number of clips */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
              Number of Clips
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setNumClips(n)}
                  style={{
                    width: 44, height: 44, borderRadius: 10,
                    border: numClips === n ? `2px solid ${GRADIENT[0]}` : `1px solid ${C.border}`,
                    background: numClips === n ? `${GRADIENT[0]}18` : C.card,
                    color: numClips === n ? GRADIENT[0] : C.text,
                    fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s ease', fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { if (numClips !== n) e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { if (numClips !== n) e.currentTarget.style.background = numClips === n ? `${GRADIENT[0]}18` : C.card; }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Clip length */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
              Clip Length
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {CLIP_LENGTHS.map((len) => (
                <button
                  key={len}
                  onClick={() => setClipLength(len)}
                  style={{
                    padding: '8px 20px', borderRadius: 10,
                    border: clipLength === len ? `2px solid ${GRADIENT[0]}` : `1px solid ${C.border}`,
                    background: clipLength === len ? `${GRADIENT[0]}18` : C.card,
                    color: clipLength === len ? GRADIENT[0] : C.text,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s ease', fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { if (clipLength !== len) e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { if (clipLength !== len) e.currentTarget.style.background = clipLength === len ? `${GRADIENT[0]}18` : C.card; }}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>

          {/* Platform target */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
              Platform Target
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  style={{
                    padding: '8px 16px', borderRadius: 10,
                    border: platform === p ? `2px solid ${GRADIENT[1]}` : `1px solid ${C.border}`,
                    background: platform === p ? `${GRADIENT[1]}18` : C.card,
                    color: platform === p ? GRADIENT[1] : C.text,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s ease', fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { if (platform !== p) e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { if (platform !== p) e.currentTarget.style.background = platform === p ? `${GRADIENT[1]}18` : C.card; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* AI detection options */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
              AI Detection Mode
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DETECTION_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDetection(mode)}
                  style={{
                    padding: '12px 16px', borderRadius: 10,
                    border: detection === mode ? `2px solid ${GRADIENT[0]}` : `1px solid ${C.border}`,
                    background: detection === mode ? `${GRADIENT[0]}12` : C.card,
                    color: detection === mode ? GRADIENT[0] : C.text,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s ease', fontFamily: 'inherit',
                    textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                  onMouseEnter={(e) => { if (detection !== mode) e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { if (detection !== mode) e.currentTarget.style.background = detection === mode ? `${GRADIENT[0]}12` : C.card; }}
                >
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: detection === mode ? `5px solid ${GRADIENT[0]}` : `2px solid ${C.dim}`,
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }} />
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Process button */}
          <ActionButton
            label={loading ? 'Processing...' : 'Process Video'}
            gradient={GRADIENT}
            onClick={handleProcess}
            disabled={!file}
            loading={loading}
          />
        </div>

        {/* Right column: results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
            Generated Clips
          </h3>

          {results.length === 0 ? (
            <ResultPreview C={C} label={loading ? 'Analyzing video for the best moments...' : 'Clips will appear here after processing'} />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
            }}>
              {results.map((clip) => (
                <div
                  key={clip.id}
                  style={{
                    borderRadius: 14,
                    border: previewingId === clip.id ? `2px solid ${GRADIENT[0]}` : `1px solid ${C.border}`,
                    background: C.card,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Thumbnail placeholder */}
                  <div style={{
                    width: '100%', height: 130,
                    background: `linear-gradient(135deg, ${C.surface}, ${C.bg})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" opacity={0.5}>
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    {/* Engagement score badge */}
                    <span style={{
                      position: 'absolute', top: 8, right: 8,
                      padding: '3px 8px', borderRadius: 8,
                      background: clip.score > 85 ? '#22c55e' : clip.score > 75 ? '#f59e0b' : '#ef4444',
                      color: '#fff', fontSize: 11, fontWeight: 700,
                    }}>
                      {clip.score}%
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ padding: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>
                      {clip.title}
                    </p>
                    <p style={{ fontSize: 11, color: C.dim, margin: '4px 0 10px' }}>
                      {clip.startTime} — {clip.endTime}
                    </p>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['Preview', 'Download', 'Edit'].map((action) => (
                        <button
                          key={action}
                          onClick={() => handleClipAction(action, clip.id)}
                          style={{
                            flex: 1, padding: '6px 0', borderRadius: 8,
                            border: action === 'Preview' && previewingId === clip.id
                              ? `1px solid ${GRADIENT[0]}`
                              : `1px solid ${C.border}`,
                            background: action === 'Preview' && previewingId === clip.id
                              ? `${GRADIENT[0]}18`
                              : C.surface,
                            color: action === 'Preview' && previewingId === clip.id
                              ? GRADIENT[0]
                              : C.text,
                            fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.2s ease', fontFamily: 'inherit',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = C.cardHover;
                            e.currentTarget.style.borderColor = GRADIENT[0];
                          }}
                          onMouseLeave={(e) => {
                            const isPreviewing = action === 'Preview' && previewingId === clip.id;
                            e.currentTarget.style.background = isPreviewing ? `${GRADIENT[0]}18` : C.surface;
                            e.currentTarget.style.borderColor = isPreviewing ? GRADIENT[0] : C.border;
                          }}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
