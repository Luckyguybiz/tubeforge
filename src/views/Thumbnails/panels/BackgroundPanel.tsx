'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';

/* ------------------------------------------------------------------ */
/*  Gradient Presets                                                   */
/* ------------------------------------------------------------------ */
const BG_PRESETS: { name: string; from: string; to: string; angle: number }[] = [
  { name: 'Sunset', from: '#ff6b35', to: '#f7c59f', angle: 135 },
  { name: 'Ocean', from: '#0077b6', to: '#00b4d8', angle: 180 },
  { name: 'Forest', from: '#2d6a4f', to: '#95d5b2', angle: 135 },
  { name: 'Neon', from: '#7b2ff7', to: '#ff2eaf', angle: 90 },
  { name: 'Fire', from: '#e63946', to: '#f4a261', angle: 180 },
  { name: 'Ice', from: '#023e8a', to: '#90e0ef', angle: 135 },
  { name: 'Purple', from: '#6366f1', to: '#a855f7', angle: 135 },
  { name: 'Dark', from: '#1a1a2e', to: '#16213e', angle: 180 },
  { name: 'Gold', from: '#f59e0b', to: '#fbbf24', angle: 135 },
  { name: 'Rose', from: '#f43f5e', to: '#fb7185', angle: 135 },
  { name: 'Mint', from: '#10b981', to: '#6ee7b7', angle: 135 },
  { name: 'Space', from: '#0f0c29', to: '#302b63', angle: 180 },
];

const SOLID_PRESETS = [
  '#0c0c14', '#1a1a2e', '#ffffff', '#f8f9fa', '#000000',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6',
];

export function BackgroundPanel() {
  const C = useThemeStore((s) => s.theme);
  const canvasBg = useThumbnailStore((s) => s.canvasBg);
  const canvasBgGradient = useThumbnailStore((s) => s.canvasBgGradient);
  const setCanvasBg = useThumbnailStore((s) => s.setCanvasBg);
  const setCanvasBgGradient = useThumbnailStore((s) => s.setCanvasBgGradient);

  const [mode, setMode] = useState<'solid' | 'gradient'>(canvasBgGradient ? 'gradient' : 'solid');
  const [gradType, setGradType] = useState<'linear' | 'radial'>(canvasBgGradient?.type ?? 'linear');
  const [fromColor, setFromColor] = useState(canvasBgGradient?.from ?? '#6366f1');
  const [toColor, setToColor] = useState(canvasBgGradient?.to ?? '#ec4899');
  const [angle, setAngle] = useState(canvasBgGradient?.angle ?? 135);

  const labelStyle: React.CSSProperties = { fontSize: 10, color: C.sub, marginBottom: 4, fontWeight: 600 };
  const btnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '5px 0',
    borderRadius: 6,
    border: `1px solid ${active ? C.accent + '55' : C.border}`,
    background: active ? C.accent + '14' : 'transparent',
    color: active ? C.accent : C.sub,
    fontSize: 10,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  const applyGradient = (from: string, to: string, a: number, type: 'linear' | 'radial') => {
    setCanvasBgGradient({ from, to, angle: a, type });
  };

  const switchToSolid = () => {
    setMode('solid');
    setCanvasBgGradient(null);
  };

  const switchToGradient = () => {
    setMode('gradient');
    applyGradient(fromColor, toColor, angle, gradType);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 2 }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={switchToSolid} style={btnStyle(mode === 'solid')}>Solid</button>
        <button onClick={switchToGradient} style={btnStyle(mode === 'gradient')}>Gradient</button>
      </div>

      {/* Solid mode */}
      {mode === 'solid' && (
        <div>
          <div style={labelStyle}>Solid Color</div>
          <input
            type="color"
            value={canvasBg}
            onChange={(e) => setCanvasBg(e.target.value)}
            style={{ width: '100%', height: 32, border: `1px solid ${C.border}`, borderRadius: 6, padding: 2, cursor: 'pointer', background: C.surface }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 8 }}>
            {SOLID_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setCanvasBg(c)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 5,
                  background: c,
                  border: canvasBg === c && !canvasBgGradient ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                  cursor: 'pointer',
                  padding: 0,
                }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gradient mode */}
      {mode === 'gradient' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Type toggle */}
          <div>
            <div style={labelStyle}>Type</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => { setGradType('linear'); applyGradient(fromColor, toColor, angle, 'linear'); }}
                style={btnStyle(gradType === 'linear')}
              >Linear</button>
              <button
                onClick={() => { setGradType('radial'); applyGradient(fromColor, toColor, angle, 'radial'); }}
                style={btnStyle(gradType === 'radial')}
              >Radial</button>
            </div>
          </div>

          {/* From / To colors */}
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>From</div>
              <input
                type="color"
                value={fromColor}
                onChange={(e) => { setFromColor(e.target.value); applyGradient(e.target.value, toColor, angle, gradType); }}
                style={{ width: '100%', height: 28, border: `1px solid ${C.border}`, borderRadius: 5, padding: 1, cursor: 'pointer', background: C.surface }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>To</div>
              <input
                type="color"
                value={toColor}
                onChange={(e) => { setToColor(e.target.value); applyGradient(fromColor, e.target.value, angle, gradType); }}
                style={{ width: '100%', height: 28, border: `1px solid ${C.border}`, borderRadius: 5, padding: 1, cursor: 'pointer', background: C.surface }}
              />
            </div>
          </div>

          {/* Angle slider (linear only) */}
          {gradType === 'linear' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={labelStyle}>Angle</div>
                <span style={{ fontSize: 9, color: C.dim }}>{angle}deg</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={angle}
                onChange={(e) => { const a = +e.target.value; setAngle(a); applyGradient(fromColor, toColor, a, gradType); }}
                style={{ width: '100%', accentColor: C.accent }}
              />
            </div>
          )}

          {/* Preview */}
          <div style={{
            width: '100%',
            height: 40,
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: gradType === 'linear'
              ? `linear-gradient(${angle}deg, ${fromColor}, ${toColor})`
              : `radial-gradient(circle, ${fromColor}, ${toColor})`,
          }} />

          {/* Gradient Presets */}
          <div>
            <div style={labelStyle}>Presets</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {BG_PRESETS.map((p) => {
                const isActive = canvasBgGradient?.from === p.from && canvasBgGradient?.to === p.to;
                return (
                  <button
                    key={p.name}
                    onClick={() => {
                      setFromColor(p.from);
                      setToColor(p.to);
                      setAngle(p.angle);
                      applyGradient(p.from, p.to, p.angle, gradType);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                    title={p.name}
                  >
                    <div style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: 6,
                      background: `linear-gradient(${p.angle}deg, ${p.from}, ${p.to})`,
                      border: isActive ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                    }} />
                    <span style={{ fontSize: 8, color: C.dim, lineHeight: 1 }}>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
