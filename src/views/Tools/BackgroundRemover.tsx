'use client';

import { useState } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

type BgOption = 'transparent' | 'solid' | 'gradient' | 'blur' | 'custom';

const BG_OPTIONS: { id: BgOption; label: string; icon: string }[] = [
  { id: 'transparent', label: 'Transparent', icon: '◻' },
  { id: 'solid', label: 'Solid Color', icon: '◼' },
  { id: 'gradient', label: 'Gradient', icon: '◧' },
  { id: 'blur', label: 'Blur', icon: '◉' },
  { id: 'custom', label: 'Custom Image', icon: '◫' },
];

export function BackgroundRemover() {
  const C = useThemeStore((s) => s.theme);

  const [file, setFile] = useState<File | null>(null);
  const [bgOption, setBgOption] = useState<BgOption>('transparent');
  const [solidColor, setSolidColor] = useState('#ffffff');
  const [edgeSmoothing, setEdgeSmoothing] = useState(50);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hoveredBg, setHoveredBg] = useState<string | null>(null);
  const [downloadHover, setDownloadHover] = useState(false);
  const [splitPos, setSplitPos] = useState(50);

  const handleRemove = () => {
    setLoading(true);
    setDone(false);
    setTimeout(() => { setLoading(false); setDone(true); }, 2500);
  };

  // Checkerboard pattern for transparent bg
  const checkerBg = `repeating-conic-gradient(${C.surface} 0% 25%, ${C.card} 0% 50%) 0 0 / 16px 16px`;

  return (
    <ToolPageShell
      title="Background Remover"
      subtitle="Remove and replace image backgrounds with AI precision"
      gradient={['#8b5cf6', '#7c3aed']}
    >
      {!file ? (
        <UploadArea C={C} accept="image/*" onFile={setFile} label="Drop image here or click to upload" />
      ) : (
        <div>
          {/* Before/After Split View */}
          <div style={{
            position: 'relative', borderRadius: 14, overflow: 'hidden',
            border: `1px solid ${C.border}`, marginBottom: 24, height: 320,
            cursor: 'col-resize',
          }}
            onMouseMove={(e) => {
              if (e.buttons === 1) {
                const rect = e.currentTarget.getBoundingClientRect();
                setSplitPos(((e.clientX - rect.left) / rect.width) * 100);
              }
            }}
          >
            {/* Before side */}
            <div style={{
              position: 'absolute', inset: 0,
              background: C.surface,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ textAlign: 'center' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" opacity={0.5}>
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 8 }}>Original</div>
              </div>
            </div>
            {/* After side (clipped) */}
            <div style={{
              position: 'absolute', inset: 0,
              clipPath: `inset(0 ${100 - splitPos}% 0 0)`,
              background: done ? checkerBg : C.card,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ textAlign: 'center' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={done ? '#8b5cf6' : C.dim} strokeWidth="1.5" opacity={done ? 0.8 : 0.5}>
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
                <div style={{ fontSize: 12, color: done ? '#8b5cf6' : C.dim, marginTop: 8 }}>
                  {done ? 'Background Removed' : 'Result'}
                </div>
              </div>
            </div>
            {/* Split handle */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${splitPos}%`, transform: 'translateX(-50%)',
              width: 4, background: '#8b5cf6', cursor: 'col-resize',
              zIndex: 2,
            }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 28, height: 28, borderRadius: 14,
                background: '#8b5cf6', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="8 4 4 8 8 12" /><polyline points="16 4 20 8 16 12" />
                </svg>
              </div>
            </div>
            {/* Labels */}
            <div style={{ position: 'absolute', top: 12, left: 12, fontSize: 11, fontWeight: 700, color: C.dim, background: C.card, padding: '2px 8px', borderRadius: 6, zIndex: 1 }}>Before</div>
            <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 700, color: '#8b5cf6', background: C.card, padding: '2px 8px', borderRadius: 6, zIndex: 1 }}>After</div>
          </div>

          {/* Background Replacement Options */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Background Replacement</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {BG_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setBgOption(opt.id)}
                  onMouseEnter={() => setHoveredBg(opt.id)}
                  onMouseLeave={() => setHoveredBg(null)}
                  style={{
                    padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    border: bgOption === opt.id ? '2px solid #8b5cf6' : `1px solid ${C.border}`,
                    background: bgOption === opt.id ? 'rgba(139,92,246,.1)' : hoveredBg === opt.id ? C.surface : C.card,
                    color: bgOption === opt.id ? '#8b5cf6' : C.text,
                    cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker for Solid Color option */}
          {bgOption === 'solid' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 16,
              borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, marginBottom: 20,
            }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>Color</label>
              <input
                type="color"
                value={solidColor}
                onChange={(e) => setSolidColor(e.target.value)}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`,
                  cursor: 'pointer', padding: 2,
                }}
              />
              <span style={{ fontSize: 13, color: C.dim, fontFamily: 'monospace' }}>{solidColor}</span>
            </div>
          )}

          {/* Edge Smoothing */}
          <div style={{
            padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, marginBottom: 28,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Edge Smoothing</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>{edgeSmoothing}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={edgeSmoothing}
              onChange={(e) => setEdgeSmoothing(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#8b5cf6' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <ActionButton
              label="Remove Background"
              gradient={['#8b5cf6', '#7c3aed']}
              onClick={handleRemove}
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
                Download PNG
              </button>
            )}
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
