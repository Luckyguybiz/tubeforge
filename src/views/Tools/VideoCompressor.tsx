'use client';

import { useState } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const PRESETS = [
  { id: 'low', label: 'Low', desc: 'Smaller file', ratio: 0.3 },
  { id: 'medium', label: 'Medium', desc: 'Balanced', ratio: 0.55 },
  { id: 'high', label: 'High', desc: 'Best quality', ratio: 0.8 },
] as const;

const RESOLUTIONS = ['Keep Original', '1080p', '720p', '480p'] as const;

export function VideoCompressor() {
  const C = useThemeStore((s) => s.theme);

  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<string>('medium');
  const [resolution, setResolution] = useState<(typeof RESOLUTIONS)[number]>('Keep Original');
  const [targetSize, setTargetSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  const [hoveredRes, setHoveredRes] = useState<string | null>(null);
  const [downloadHover, setDownloadHover] = useState(false);

  const originalSize = file ? file.size / 1024 / 1024 : 0;
  const activePreset = PRESETS.find((p) => p.id === preset);
  const estimatedSize = targetSize
    ? parseFloat(targetSize)
    : originalSize * (activePreset?.ratio ?? 0.55);

  const handleCompress = () => {
    setLoading(true);
    setProgress(0);
    setDone(false);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(iv); setLoading(false); setDone(true); return 100; }
        return p + Math.random() * 8;
      });
    }, 300);
  };

  return (
    <ToolPageShell
      title="Video Compressor"
      subtitle="Reduce video file size while maintaining quality"
      gradient={['#06b6d4', '#0ea5e9']}
    >
      {!file ? (
        <UploadArea C={C} accept="video/*" onFile={setFile} label="Drop video file here or click to upload" />
      ) : (
        <div>
          {/* File Info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12,
            border: `1px solid ${C.border}`, background: C.card, marginBottom: 24,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" /><polygon points="10 8 16 12 10 16" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{file.name}</div>
              <div style={{ fontSize: 11, color: C.dim }}>Original size: {originalSize.toFixed(2)} MB</div>
            </div>
            <button
              onClick={() => { setFile(null); setDone(false); setProgress(0); }}
              style={{
                padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.surface, color: C.sub, fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Remove
            </button>
          </div>

          {/* Compression Preset */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Compression Preset</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  onMouseEnter={() => setHoveredPreset(p.id)}
                  onMouseLeave={() => setHoveredPreset(null)}
                  style={{
                    padding: 16, borderRadius: 12, textAlign: 'center',
                    border: preset === p.id ? '2px solid #06b6d4' : `1px solid ${C.border}`,
                    background: preset === p.id ? 'rgba(6,182,212,.1)' : hoveredPreset === p.id ? C.surface : C.card,
                    cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: preset === p.id ? '#06b6d4' : C.text }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Target File Size */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Target File Size (optional)</label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '0 16px',
            }}>
              <input
                type="number"
                value={targetSize}
                onChange={(e) => setTargetSize(e.target.value)}
                placeholder="Leave empty for auto"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: C.text, fontSize: 14, padding: '12px 0', fontFamily: 'inherit',
                }}
              />
              <span style={{ fontSize: 13, color: C.dim, fontWeight: 600 }}>MB</span>
            </div>
          </div>

          {/* Resolution Selector */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Resolution</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {RESOLUTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setResolution(r)}
                  onMouseEnter={() => setHoveredRes(r)}
                  onMouseLeave={() => setHoveredRes(null)}
                  style={{
                    padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    border: resolution === r ? '2px solid #06b6d4' : `1px solid ${C.border}`,
                    background: resolution === r ? 'rgba(6,182,212,.1)' : hoveredRes === r ? C.surface : C.card,
                    color: resolution === r ? '#06b6d4' : C.text,
                    cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Output Size */}
          <div style={{
            padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card,
            marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, color: C.sub }}>Estimated output size</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#06b6d4' }}>{estimatedSize.toFixed(2)} MB</span>
          </div>

          {/* Progress Bar */}
          {loading && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.sub }}>Compressing...</span>
                <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>{Math.min(100, Math.round(progress))}%</span>
              </div>
              <div style={{ width: '100%', height: 8, borderRadius: 4, background: C.surface }}>
                <div style={{
                  width: `${Math.min(100, progress)}%`, height: '100%', borderRadius: 4,
                  background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', transition: 'width .3s',
                }} />
              </div>
            </div>
          )}

          {/* Before/After Size Comparison */}
          {done && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center',
              padding: 20, borderRadius: 14, border: `1px solid ${C.border}`, background: C.card,
              marginBottom: 24,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>Before</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{originalSize.toFixed(1)} MB</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 12 12 5 19 12" /><line x1="12" y1="5" x2="12" y2="19" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#06b6d4' }}>
                  {Math.round((1 - estimatedSize / originalSize) * 100)}% smaller
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>After</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#06b6d4' }}>{estimatedSize.toFixed(1)} MB</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <ActionButton
              label="Compress"
              gradient={['#06b6d4', '#0ea5e9']}
              onClick={handleCompress}
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
