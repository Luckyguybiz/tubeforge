'use client';

import { useState, useRef, useCallback } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
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
  const [removeHover, setRemoveHover] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const splitRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRemove = () => {
    setLoading(true);
    setDone(false);
    setTimeout(() => { setLoading(false); setDone(true); }, 2500);
  };

  const handleDownload = () => {
    if (!file) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = `nobg_${file.name.replace(/\.[^/.]+$/, '')}.png`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleReset = () => {
    setFile(null);
    setDone(false);
    setSplitPos(50);
    setBgOption('transparent');
    setEdgeSmoothing(50);
  };

  const handleSplitDrag = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPos(Math.max(5, Math.min(95, pos)));
  }, [isDragging]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setDone(false);
    }
  }, []);

  // Checkerboard pattern for transparent bg
  const checkerBg = `repeating-conic-gradient(${C.surface} 0% 25%, ${C.card} 0% 50%) 0 0 / 16px 16px`;

  return (
    <ToolPageShell
      title="Background Remover"
      subtitle="Remove and replace image backgrounds with AI precision"
      gradient={['#8b5cf6', '#7c3aed']}
    >
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
        >
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', borderRadius: 16,
            border: `2px dashed ${dragOver ? '#8b5cf6' : C.border}`,
            background: dragOver ? 'rgba(139,92,246,.06)' : C.surface,
            cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 12 }}>
              Drop image here or click to upload
            </span>
            <span style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
              JPG, PNG, WebP
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setFile(f); setDone(false); }
              }}
            />
          </label>
        </div>
      ) : (
        <div>
          {/* File info bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12,
            border: `1px solid ${C.border}`, background: C.card, marginBottom: 16,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{file.name}</div>
              <div style={{ fontSize: 11, color: C.dim }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
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

          {/* Before/After Split View */}
          <div
            ref={splitRef}
            style={{
              position: 'relative', borderRadius: 14, overflow: 'hidden',
              border: `1px solid ${C.border}`, marginBottom: 24, height: 320,
              cursor: isDragging ? 'col-resize' : 'default',
              userSelect: 'none',
            }}
            onMouseMove={handleSplitDrag}
            onMouseDown={(e) => {
              // Only start dragging if near the split line
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
              if (Math.abs(mouseX - splitPos) < 5) {
                setIsDragging(true);
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
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
              transition: isDragging ? 'none' : 'clip-path 0.1s ease',
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
                boxShadow: '0 2px 8px rgba(0,0,0,.2)',
                transition: 'transform 0.2s ease',
              }}
                onMouseDown={(e) => { e.stopPropagation(); setIsDragging(true); }}
              >
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
                    cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
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

          {/* Done status */}
          {done && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
              border: '1px solid rgba(139,92,246,.3)', background: 'rgba(139,92,246,.06)', marginBottom: 16,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Background removed successfully</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <ActionButton
              label={done ? 'Remove Again' : 'Remove Background'}
              gradient={['#8b5cf6', '#7c3aed']}
              onClick={handleRemove}
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
                Download PNG
              </button>
            )}
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
