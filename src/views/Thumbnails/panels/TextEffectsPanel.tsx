'use client';

import { useCallback, useMemo } from 'react';

interface TextEffectsPanelProps {
  C: Record<string, string>;
  sel: { id: string; shadow?: string; textOutline?: string; color?: string; [key: string]: unknown };
  updEl: (id: string, patch: Record<string, unknown>) => void;
}

interface TextEffect {
  key: string;
  label: string;
  shadow: string;
  textOutline: string;
  color?: string;
}

const EFFECTS: TextEffect[] = [
  { key: 'none', label: 'None', shadow: '', textOutline: '' },
  {
    key: 'shadow',
    label: 'Shadow',
    shadow: '3px 3px 6px rgba(0,0,0,0.6)',
    textOutline: '',
  },
  {
    key: 'outline',
    label: 'Outline',
    shadow: '',
    textOutline: '2px #ffffff',
    color: 'transparent',
  },
  {
    key: 'neon',
    label: 'Neon',
    shadow: '0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #0fa, 0 0 82px #0fa, 0 0 92px #0fa',
    textOutline: '',
    color: '#ffffff',
  },
  {
    key: 'echo',
    label: 'Echo',
    shadow: '3px 3px 0 rgba(255,255,255,0.5), 6px 6px 0 rgba(255,255,255,0.3), 9px 9px 0 rgba(255,255,255,0.15)',
    textOutline: '',
  },
  {
    key: 'glitch',
    label: 'Glitch',
    shadow: '-3px 0 0 cyan, 3px 0 0 magenta, 0 -3px 0 yellow',
    textOutline: '',
  },
  {
    key: 'lift',
    label: 'Lift',
    shadow: '0 4px 8px rgba(0,0,0,0.5), 0 -1px 0 rgba(255,255,255,0.2)',
    textOutline: '',
  },
  {
    key: '3d',
    label: '3D',
    shadow: '1px 1px 0 #999, 2px 2px 0 #888, 3px 3px 0 #777, 4px 4px 0 #666, 5px 5px 0 #555, 6px 6px 4px rgba(0,0,0,0.4)',
    textOutline: '',
  },
  {
    key: 'retro',
    label: 'Retro',
    shadow: '2px 2px 0 #d4a574, 4px 4px 0 #c4956a, 6px 6px 0 #b48560',
    textOutline: '',
  },
  {
    key: 'fire',
    label: 'Fire',
    shadow: '0 0 4px #ff4500, 0 0 12px #ff6a00, 0 0 20px #ff8c00, 0 0 30px #ff4500',
    textOutline: '',
    color: '#ffe066',
  },
];

function detectActive(sel: TextEffectsPanelProps['sel']): string {
  const s = sel.shadow ?? '';
  const o = sel.textOutline ?? '';
  if (!s && !o) return 'none';
  for (const e of EFFECTS) {
    if (e.key === 'none') continue;
    if (e.shadow === s && e.textOutline === o) return e.key;
  }
  return '';
}

export function TextEffectsPanel({ C, sel, updEl }: TextEffectsPanelProps) {
  const active = useMemo(() => detectActive(sel), [sel]);

  const apply = useCallback(
    (effect: TextEffect) => {
      const patch: Record<string, unknown> = {
        shadow: effect.shadow,
        textOutline: effect.textOutline,
      };
      if (effect.color) patch.color = effect.color;
      else if (effect.key === 'none') {
        patch.color = sel.color === 'transparent' ? '#ffffff' : undefined;
        if (patch.color === undefined) delete patch.color;
      }
      updEl(sel.id, patch);
    },
    [sel.id, sel.color, updEl],
  );

  return (
    <div style={{ padding: '4px 0' }}>
      <h4
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.sub,
          textTransform: 'uppercase',
          letterSpacing: '.04em',
          marginBottom: 10,
        }}
      >
        Text Effects
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
        }}
      >
        {EFFECTS.map((effect) => {
          const isActive = active === effect.key;
          const previewStyle: React.CSSProperties = {
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1,
            color: effect.color ?? '#ffffff',
            textShadow: effect.shadow || 'none',
            WebkitTextStroke: effect.textOutline || 'unset',
            pointerEvents: 'none',
          };

          return (
            <button
              key={effect.key}
              type="button"
              title={effect.label}
              onClick={() => apply(effect)}
              style={{
                height: 60,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                background: C.surface,
                border: `2px solid ${isActive ? C.accent : C.border}`,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'border-color .15s',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.borderColor = C.accent;
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.borderColor = C.border;
              }}
            >
              <span style={previewStyle}>Aa</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: C.sub,
                  lineHeight: 1,
                }}
              >
                {effect.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
