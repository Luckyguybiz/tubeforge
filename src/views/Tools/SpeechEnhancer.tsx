'use client';

import { useState } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#10b981', '#06b6d4'];

export function SpeechEnhancer() {
  const C = useThemeStore((s) => s.theme);
  const [file, setFile] = useState<File | null>(null);
  const [noiseReduction, setNoiseReduction] = useState(70);
  const [echoRemoval, setEchoRemoval] = useState(true);
  const [volumeNorm, setVolumeNorm] = useState(true);
  const [clarityBoost, setClarityBoost] = useState(50);
  const [loading, setLoading] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const [downloadHover, setDownloadHover] = useState(false);

  const handleEnhance = () => {
    if (!file) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setEnhanced(true); }, 3000);
  };

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    width: 48, height: 26, borderRadius: 13, padding: 3,
    background: active ? GRADIENT[0] : C.border,
    border: 'none', cursor: 'pointer', transition: 'all .2s',
    display: 'flex', alignItems: active ? 'center' : 'center',
    justifyContent: active ? 'flex-end' : 'flex-start',
  });

  const WaveformPlaceholder = ({ label, color }: { label: string; color: string }) => (
    <div style={{
      flex: 1, padding: 20, borderRadius: 14,
      border: `1px solid ${C.border}`, background: C.card,
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>{label}</span>
      <div style={{
        height: 80, borderRadius: 10, background: C.surface,
        border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '0 16px',
      }}>
        {enhanced ? (
          Array.from({ length: 50 }).map((_, i) => (
            <div key={i} style={{
              width: 2, borderRadius: 2,
              height: `${10 + Math.sin(i * 0.4) * 20 + Math.random() * 25}%`,
              background: color,
              opacity: 0.6,
            }} />
          ))
        ) : (
          <span style={{ fontSize: 12, color: C.dim }}>No audio loaded</span>
        )}
      </div>
      {enhanced && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <button style={{
            width: 32, height: 32, borderRadius: '50%',
            background: color, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21" /></svg>
          </button>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: C.border }}>
            <div style={{ width: '0%', height: '100%', borderRadius: 2, background: color }} />
          </div>
          <span style={{ fontSize: 11, color: C.dim }}>0:00</span>
        </div>
      )}
    </div>
  );

  return (
    <ToolPageShell
      title="AI Speech Enhancer"
      subtitle="Remove noise, echo, and enhance clarity of any audio or video speech"
      gradient={GRADIENT}
      badge="New"
      badgeColor={GRADIENT[0]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Upload */}
        {!file ? (
          <UploadArea
            C={C}
            accept="audio/*,video/*"
            onFile={(f) => setFile(f)}
            label="Drop audio/video file here or click to upload"
          />
        ) : (
          <div style={{
            padding: 16, borderRadius: 14, border: `1px solid ${C.border}`, background: C.card,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `linear-gradient(135deg, ${GRADIENT[0]}22, ${GRADIENT[1]}22)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{file.name}</div>
              <div style={{ fontSize: 12, color: C.dim }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            <button
              onClick={() => { setFile(null); setEnhanced(false); }}
              style={{
                padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.surface, color: C.sub, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Remove
            </button>
          </div>
        )}

        {/* Enhancement Options */}
        <div style={{
          padding: 24, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, display: 'block', marginBottom: 20 }}>Enhancement Options</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Noise Reduction */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Noise Reduction</span>
                <span style={{ fontSize: 13, color: GRADIENT[0], fontWeight: 600 }}>{noiseReduction}%</span>
              </div>
              <input
                type="range" min={0} max={100} value={noiseReduction}
                onChange={(e) => setNoiseReduction(Number(e.target.value))}
                style={{ width: '100%', accentColor: GRADIENT[0] }}
              />
            </div>

            {/* Clarity Boost */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Clarity Boost</span>
                <span style={{ fontSize: 13, color: GRADIENT[0], fontWeight: 600 }}>{clarityBoost}%</span>
              </div>
              <input
                type="range" min={0} max={100} value={clarityBoost}
                onChange={(e) => setClarityBoost(Number(e.target.value))}
                style={{ width: '100%', accentColor: GRADIENT[0] }}
              />
            </div>

            {/* Echo Removal Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Echo Removal</span>
              <button onClick={() => setEchoRemoval(!echoRemoval)} style={toggleStyle(echoRemoval)}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'all .2s',
                }} />
              </button>
            </div>

            {/* Volume Normalization Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Volume Normalization</span>
              <button onClick={() => setVolumeNorm(!volumeNorm)} style={toggleStyle(volumeNorm)}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'all .2s',
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* Before / After Comparison */}
        <div style={{ display: 'flex', gap: 16 }}>
          <WaveformPlaceholder label="Before (Original)" color="#ef4444" />
          <WaveformPlaceholder label="After (Enhanced)" color={GRADIENT[0]} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ActionButton label="Enhance" gradient={GRADIENT} onClick={handleEnhance} loading={loading} disabled={!file} />
          {enhanced && (
            <button
              onMouseEnter={() => setDownloadHover(true)}
              onMouseLeave={() => setDownloadHover(false)}
              style={{
                padding: '12px 24px', borderRadius: 12,
                border: `1px solid ${C.border}`, background: downloadHover ? C.surface : C.card,
                color: C.text, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'all .2s', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Enhanced File
            </button>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
