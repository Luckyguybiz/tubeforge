'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { toast } from '@/stores/useNotificationStore';
import { loadGoogleFont } from '@/lib/fonts';

interface CreatorStyle {
  name: string;
  colors: [string, string];
  font: string;
  textSize: number;
  textStroke: number;
}

const CREATOR_STYLES: CreatorStyle[] = [
  { name: 'MrBeast Style', colors: ['#ff0000', '#ffff00'], font: 'Impact', textSize: 80, textStroke: 3 },
  { name: 'MKBHD Style', colors: ['#1a1a1a', '#ffffff'], font: 'Inter', textSize: 48, textStroke: 0 },
  { name: 'Veritasium Style', colors: ['#0a0a0a', '#00b4d8'], font: 'Montserrat', textSize: 56, textStroke: 0 },
  { name: 'Linus Tech Tips', colors: ['#f59e0b', '#1a1a1a'], font: 'Oswald', textSize: 64, textStroke: 2 },
  { name: 'PewDiePie Style', colors: ['#ff0000', '#000000'], font: 'Bebas Neue', textSize: 72, textStroke: 4 },
];

export function CreatorStylesPanel() {
  const C = useThemeStore((s) => s.theme);

  const applyStyle = (style: CreatorStyle) => {
    const store = useThumbnailStore.getState();
    const { selIds, els } = store;

    // Load the Google font
    loadGoogleFont(style.font);

    // If text elements are selected, apply style to them
    const selectedTextEls = els.filter((el) => selIds.includes(el.id) && el.type === 'text');
    if (selectedTextEls.length > 0) {
      store.pushHistory();
      selectedTextEls.forEach((el) => {
        store.updEl(el.id, {
          font: style.font,
          size: style.textSize,
          color: style.colors[1],
          bold: true,
          textStroke: style.colors[0],
          textStrokeWidth: style.textStroke,
        });
      });
      // Apply background color
      store.setCanvasBg(style.colors[0]);
      toast.success(`Applied ${style.name}`);
      return;
    }

    // If no text selected, apply to canvas background + create a new styled text element
    store.pushHistory();
    store.setCanvasBg(style.colors[0]);
    store.addText();
    const newEls = useThumbnailStore.getState().els;
    const lastEl = newEls[newEls.length - 1];
    if (lastEl) {
      store.updEl(lastEl.id, {
        text: 'YOUR TEXT',
        font: style.font,
        size: style.textSize,
        color: style.colors[1],
        bold: true,
        textStroke: style.colors[0] === '#1a1a1a' || style.colors[0] === '#0a0a0a' ? '#ffffff' : style.colors[0],
        textStrokeWidth: style.textStroke,
        x: 100,
        y: 200,
        w: 600,
        h: style.textSize + 20,
      });
    }
    toast.success(`Applied ${style.name}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 11, color: C.sub, margin: 0, lineHeight: 1.5 }}>
        Apply popular YouTube creator styles to your thumbnail. Select a text element first, or click to create one.
      </p>

      {CREATOR_STYLES.map((style) => (
        <button
          key={style.name}
          onClick={() => applyStyle(style)}
          style={{
            width: '100%',
            padding: 0,
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: 'inherit',
            overflow: 'hidden',
            transition: 'all .15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.accent + '55'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.01)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          {/* Preview */}
          <div style={{
            width: '100%',
            aspectRatio: '16/9',
            background: style.colors[0],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <span style={{
              fontFamily: style.font + ', sans-serif',
              fontSize: Math.min(style.textSize * 0.4, 32),
              fontWeight: 800,
              color: style.colors[1],
              textTransform: 'uppercase',
              WebkitTextStroke: style.textStroke > 0 ? `${Math.max(style.textStroke * 0.3, 1)}px ${style.colors[0] === '#1a1a1a' || style.colors[0] === '#0a0a0a' ? '#ffffff' : style.colors[0]}` : undefined,
              letterSpacing: 1,
            }}>
              SAMPLE TEXT
            </span>
          </div>
          {/* Label */}
          <div style={{
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: C.surface,
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{style.name}</div>
              <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>
                {style.font} / {style.textSize}px{style.textStroke > 0 ? ` / ${style.textStroke}px stroke` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, background: style.colors[0], border: '1px solid rgba(255,255,255,0.1)' }} />
              <div style={{ width: 16, height: 16, borderRadius: 3, background: style.colors[1], border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
