'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import type { CanvasElement } from '@/lib/types';

interface TextPreset {
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  textStroke?: string;
  textStrokeWidth?: number;
  glow?: { color: string; blur: number; spread: number };
  textGradient?: { from: string; to: string; angle: number };
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textShadow?: string;
}

const TEXT_PRESETS: TextPreset[] = [
  { name: 'IMPACT BOLD', fontFamily: 'Impact', fontSize: 72, fontWeight: 900, color: '#ffffff', textStroke: '#000000', textStrokeWidth: 3 },
  { name: 'NEON GLOW', fontFamily: 'Montserrat', fontSize: 64, fontWeight: 800, color: '#00ff88', glow: { color: '#00ff88', blur: 20, spread: 5 } },
  { name: 'FIRE TEXT', fontFamily: 'Oswald', fontSize: 68, fontWeight: 700, color: '#ff4500', textGradient: { from: '#ff4500', to: '#ffd700', angle: 180 } },
  { name: 'CLEAN WHITE', fontFamily: 'Inter', fontSize: 48, fontWeight: 700, color: '#ffffff', letterSpacing: 2 },
  { name: 'YOUTUBE RED', fontFamily: 'Bebas Neue', fontSize: 80, fontWeight: 400, color: '#ff0000', textStroke: '#ffffff', textStrokeWidth: 2 },
  { name: 'SHADOW TITLE', fontFamily: 'Montserrat', fontSize: 56, fontWeight: 800, color: '#ffffff', textShadow: '4px 4px 0px rgba(0,0,0,0.8)' },
  { name: 'OUTLINE ONLY', fontFamily: 'Anton', fontSize: 72, fontWeight: 400, color: 'transparent', textStroke: '#ffffff', textStrokeWidth: 3 },
  { name: 'GRADIENT PURPLE', fontFamily: 'Poppins', fontSize: 60, fontWeight: 700, color: '#8b5cf6', textGradient: { from: '#6366f1', to: '#ec4899', angle: 90 } },
  { name: 'COMIC STYLE', fontFamily: 'Permanent Marker', fontSize: 52, fontWeight: 400, color: '#ffff00', textStroke: '#000000', textStrokeWidth: 4 },
  { name: 'MINIMAL', fontFamily: 'Inter', fontSize: 36, fontWeight: 300, color: '#ffffff', letterSpacing: 8, textTransform: 'uppercase' },
];

function presetToCanvas(preset: TextPreset): Partial<CanvasElement> {
  return {
    text: preset.name,
    font: preset.fontFamily,
    size: preset.fontSize,
    bold: preset.fontWeight >= 700,
    color: preset.color,
    textStroke: preset.textStroke,
    textStrokeWidth: preset.textStrokeWidth,
    glow: preset.glow,
    textGradient: preset.textGradient,
    letterSpacing: preset.letterSpacing,
    textTransform: preset.textTransform,
    shadow: preset.textShadow ?? 'none',
  };
}

function PreviewCard({ preset, onClick }: { preset: TextPreset; onClick: () => void }) {
  const C = useThemeStore((s) => s.theme);

  // Build preview style
  const previewStyle: React.CSSProperties = {
    fontFamily: `"${preset.fontFamily}", sans-serif`,
    fontSize: Math.min(preset.fontSize * 0.3, 22),
    fontWeight: preset.fontWeight,
    color: preset.color === 'transparent' ? 'transparent' : preset.color,
    letterSpacing: preset.letterSpacing ? preset.letterSpacing * 0.4 : undefined,
    textTransform: preset.textTransform as React.CSSProperties['textTransform'],
    lineHeight: 1.2,
    textAlign: 'center' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    padding: '0 4px',
    width: '100%',
  };

  // Stroke effect via text-shadow or webkit
  if (preset.textStroke && preset.textStrokeWidth) {
    previewStyle.WebkitTextStroke = `${Math.max(1, preset.textStrokeWidth * 0.4)}px ${preset.textStroke}`;
  }

  // Text shadow
  if (preset.textShadow) {
    previewStyle.textShadow = preset.textShadow;
  }

  // Glow effect
  if (preset.glow) {
    previewStyle.textShadow = `0 0 ${preset.glow.blur * 0.5}px ${preset.glow.color}, 0 0 ${preset.glow.spread * 2}px ${preset.glow.color}`;
  }

  // Gradient text
  if (preset.textGradient) {
    previewStyle.background = `linear-gradient(${preset.textGradient.angle}deg, ${preset.textGradient.from}, ${preset.textGradient.to})`;
    previewStyle.WebkitBackgroundClip = 'text';
    previewStyle.WebkitTextFillColor = 'transparent';
    previewStyle.backgroundClip = 'text';
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Add ${preset.name} text style`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: '14px 8px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 64,
        transition: 'all .15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = C.accent;
        (e.currentTarget as HTMLElement).style.background = C.cardHover;
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = C.border;
        (e.currentTarget as HTMLElement).style.background = C.surface;
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    >
      <span style={previewStyle}>{preset.name}</span>
      <span style={{ fontSize: 9, color: C.dim, fontWeight: 500 }}>{preset.fontFamily}</span>
    </div>
  );
}

export function TextPresetsPanel() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const addTextPreset = useThumbnailStore.getState().addTextPreset;

  const handlePresetClick = (preset: TextPreset) => {
    addTextPreset(presetToCanvas(preset));
  };

  return (
    <div>
      <p style={{ fontSize: 11, color: C.sub, margin: '0 0 12px', lineHeight: 1.5 }}>
        {t('thumbs.textStyles.description')}
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}>
        {TEXT_PRESETS.map((preset) => (
          <PreviewCard
            key={preset.name}
            preset={preset}
            onClick={() => handlePresetClick(preset)}
          />
        ))}
      </div>
    </div>
  );
}
