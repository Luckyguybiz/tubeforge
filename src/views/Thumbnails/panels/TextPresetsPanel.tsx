'use client';

import { useState } from 'react';
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
  textGradient?: { from: string; to: string; mid?: string; angle: number };
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textShadow?: string;
  category: 'popular' | 'gaming' | 'minimalist' | 'retro' | 'neon';
}

const TEXT_PRESETS: TextPreset[] = [
  // Popular (original 10)
  { name: 'IMPACT BOLD', fontFamily: 'Impact', fontSize: 72, fontWeight: 900, color: '#ffffff', textStroke: '#000000', textStrokeWidth: 3, category: 'popular' },
  { name: 'NEON GLOW', fontFamily: 'Montserrat', fontSize: 64, fontWeight: 800, color: '#00ff88', glow: { color: '#00ff88', blur: 20, spread: 5 }, category: 'popular' },
  { name: 'FIRE TEXT', fontFamily: 'Oswald', fontSize: 68, fontWeight: 700, color: '#ff4500', textGradient: { from: '#ff4500', to: '#ffd700', angle: 180 }, category: 'popular' },
  { name: 'CLEAN WHITE', fontFamily: 'Inter', fontSize: 48, fontWeight: 700, color: '#ffffff', letterSpacing: 2, category: 'popular' },
  { name: 'YOUTUBE RED', fontFamily: 'Bebas Neue', fontSize: 80, fontWeight: 400, color: '#ff0000', textStroke: '#ffffff', textStrokeWidth: 2, category: 'popular' },
  { name: 'SHADOW TITLE', fontFamily: 'Montserrat', fontSize: 56, fontWeight: 800, color: '#ffffff', textShadow: '4px 4px 0px rgba(0,0,0,0.8)', category: 'popular' },
  { name: 'OUTLINE ONLY', fontFamily: 'Anton', fontSize: 72, fontWeight: 400, color: 'transparent', textStroke: '#ffffff', textStrokeWidth: 3, category: 'popular' },
  { name: 'GRADIENT PURPLE', fontFamily: 'Poppins', fontSize: 60, fontWeight: 700, color: '#8b5cf6', textGradient: { from: '#6366f1', to: '#ec4899', angle: 90 }, category: 'popular' },
  { name: 'COMIC STYLE', fontFamily: 'Permanent Marker', fontSize: 52, fontWeight: 400, color: '#ffff00', textStroke: '#000000', textStrokeWidth: 4, category: 'popular' },
  { name: 'MINIMAL', fontFamily: 'Inter', fontSize: 36, fontWeight: 300, color: '#ffffff', letterSpacing: 8, textTransform: 'uppercase', category: 'popular' },

  // Gaming (5)
  { name: 'RAGE MODE', fontFamily: 'Anton', fontSize: 80, fontWeight: 400, color: '#ff2222', textStroke: '#000000', textStrokeWidth: 4, textShadow: '0 0 20px rgba(255,0,0,0.6)', category: 'gaming' },
  { name: 'VICTORY', fontFamily: 'Oswald', fontSize: 72, fontWeight: 700, color: '#ffd700', textGradient: { from: '#ffd700', to: '#ff8c00', angle: 180 }, textStroke: '#000000', textStrokeWidth: 2, category: 'gaming' },
  { name: 'GLITCH', fontFamily: 'Bebas Neue', fontSize: 76, fontWeight: 400, color: '#00ffff', textShadow: '3px 0 #ff00ff, -3px 0 #00ff00', category: 'gaming' },
  { name: 'LEVEL UP', fontFamily: 'Montserrat', fontSize: 64, fontWeight: 900, color: '#00ff00', textStroke: '#003300', textStrokeWidth: 3, letterSpacing: 4, textTransform: 'uppercase', category: 'gaming' },
  { name: 'BOSS FIGHT', fontFamily: 'Impact', fontSize: 84, fontWeight: 900, color: '#ffffff', textGradient: { from: '#ff0000', to: '#990000', angle: 180 }, textStroke: '#000000', textStrokeWidth: 5, category: 'gaming' },

  // Minimalist (5)
  { name: 'whisper', fontFamily: 'Inter', fontSize: 32, fontWeight: 100, color: '#cccccc', letterSpacing: 12, textTransform: 'lowercase', category: 'minimalist' },
  { name: 'CLEAN SANS', fontFamily: 'Poppins', fontSize: 40, fontWeight: 500, color: '#ffffff', letterSpacing: 6, textTransform: 'uppercase', category: 'minimalist' },
  { name: 'Elegant', fontFamily: 'Playfair Display', fontSize: 48, fontWeight: 400, color: '#e8d5b7', letterSpacing: 3, category: 'minimalist' },
  { name: 'mono.type', fontFamily: 'Fira Code', fontSize: 32, fontWeight: 400, color: '#a0a0a0', letterSpacing: 2, category: 'minimalist' },
  { name: 'THIN LINE', fontFamily: 'Raleway', fontSize: 44, fontWeight: 100, color: '#ffffff', letterSpacing: 10, textTransform: 'uppercase', category: 'minimalist' },

  // Retro (5)
  { name: 'RETRO WAVE', fontFamily: 'Oswald', fontSize: 64, fontWeight: 700, color: '#ff6ec7', textGradient: { from: '#ff6ec7', to: '#7873f5', angle: 90 }, category: 'retro' },
  { name: 'VINTAGE', fontFamily: 'Playfair Display', fontSize: 56, fontWeight: 700, color: '#d4a574', textShadow: '2px 2px 0px #8b6914', category: 'retro' },
  { name: 'PIXEL POP', fontFamily: 'Bebas Neue', fontSize: 72, fontWeight: 400, color: '#ff4444', textStroke: '#ffffff', textStrokeWidth: 3, textShadow: '4px 4px 0 #000', category: 'retro' },
  { name: 'GROOVY', fontFamily: 'Pacifico', fontSize: 52, fontWeight: 400, color: '#ff8c00', textShadow: '3px 3px 0 #cc6600', category: 'retro' },
  { name: '80s CHROME', fontFamily: 'Montserrat', fontSize: 60, fontWeight: 800, color: '#c0c0c0', textGradient: { from: '#e8e8e8', to: '#888888', angle: 180 }, textStroke: '#444444', textStrokeWidth: 1, category: 'retro' },

  // Neon (5)
  { name: 'CYBER PINK', fontFamily: 'Montserrat', fontSize: 60, fontWeight: 700, color: '#ff69b4', glow: { color: '#ff69b4', blur: 25, spread: 8 }, category: 'neon' },
  { name: 'ELECTRIC BLUE', fontFamily: 'Oswald', fontSize: 64, fontWeight: 600, color: '#00d4ff', glow: { color: '#00d4ff', blur: 18, spread: 4 }, category: 'neon' },
  { name: 'TOXIC GREEN', fontFamily: 'Anton', fontSize: 68, fontWeight: 400, color: '#39ff14', glow: { color: '#39ff14', blur: 22, spread: 6 }, textTransform: 'uppercase', category: 'neon' },
  { name: 'SUNSET', fontFamily: 'Poppins', fontSize: 56, fontWeight: 700, color: '#ff6b35', glow: { color: '#ff6b35', blur: 15, spread: 3 }, textGradient: { from: '#ff6b35', to: '#f7c948', angle: 90 }, category: 'neon' },
  { name: 'ULTRAVIOLET', fontFamily: 'Bebas Neue', fontSize: 72, fontWeight: 400, color: '#bf00ff', glow: { color: '#bf00ff', blur: 30, spread: 10 }, category: 'neon' },
];

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'popular', label: 'Popular' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'minimalist', label: 'Minimalist' },
  { key: 'retro', label: 'Retro' },
  { key: 'neon', label: 'Neon' },
] as const;

function presetToCanvas(preset: TextPreset): Partial<CanvasElement> {
  return {
    text: preset.name,
    font: preset.fontFamily,
    size: preset.fontSize,
    fontWeight: preset.fontWeight,
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
    const midStop = preset.textGradient.mid ? `, ${preset.textGradient.mid}` : '';
    previewStyle.background = `linear-gradient(${preset.textGradient.angle}deg, ${preset.textGradient.from}${midStop}, ${preset.textGradient.to})`;
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
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handlePresetClick = (preset: TextPreset) => {
    addTextPreset(presetToCanvas(preset));
  };

  const filteredPresets = activeCategory === 'all'
    ? TEXT_PRESETS
    : TEXT_PRESETS.filter((p) => p.category === activeCategory);

  return (
    <div>
      <p style={{ fontSize: 11, color: C.sub, margin: '0 0 12px', lineHeight: 1.5 }}>
        {t('thumbs.textStyles.description')}
      </p>
      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 12, flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                padding: '3px 8px',
                borderRadius: 5,
                border: `1px solid ${isActive ? C.accent + '55' : C.border}`,
                background: isActive ? C.accent + '14' : 'transparent',
                color: isActive ? C.accent : C.sub,
                fontSize: 9,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all .12s',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}>
        {filteredPresets.map((preset) => (
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
