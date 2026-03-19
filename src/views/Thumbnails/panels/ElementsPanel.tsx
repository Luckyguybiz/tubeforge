'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { STICKY_NOTE_COLOR } from '@/lib/constants';
import {
  SHAPE_PRESETS,
  LINE_PRESETS,
  STICKER_PRESETS,
  TABLE_PRESETS,
  ICON_PRESETS,
  type ElementPreset,
} from '@/lib/element-presets';

interface SectionProps {
  title: string;
  presets: ElementPreset[];
  onAdd: (preset: ElementPreset) => void;
  cols?: number;
}

function PresetSection({ title, presets, onAdd, cols = 3 }: SectionProps) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  const handleDragStart = (e: React.DragEvent, preset: ElementPreset) => {
    e.dataTransfer.setData('application/x-tubeforge-preset', JSON.stringify(preset));
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <h4 style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>
        {title}
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
        {presets.map((preset, i) => (
          <div
            key={`${preset.type}-${i}`}
            role="button"
            tabIndex={0}
            aria-label={t('thumbs.elements.addLabel') + preset.label}
            draggable
            onDragStart={(e) => handleDragStart(e, preset)}
            onClick={() => onAdd(preset)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAdd(preset); } }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '10px 4px 8px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.surface,
              cursor: 'pointer',
              transition: 'all .12s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = C.accent;
              (e.currentTarget as HTMLElement).style.background = C.accentDim;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = C.border;
              (e.currentTarget as HTMLElement).style.background = C.surface;
            }}
          >
            <span style={{ fontSize: 20 }}>{preset.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: C.sub, textAlign: 'center', lineHeight: 1.2 }}>
              {preset.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ElementsPanel() {
  const t = useLocaleStore((s) => s.t);
  // Only actions needed — use getState() to avoid subscribing to store changes
  const getStore = () => useThumbnailStore.getState();

  const addPreset = (preset: ElementPreset) => {
    const { type, props } = preset;
    const store = getStore();

    if (type === 'text') {
      store.addText();
      const els = useThumbnailStore.getState().els;
      const last = els[els.length - 1];
      if (last) {
        store.updEl(last.id, props as Partial<import('@/lib/types').CanvasElement>);
      }
      return;
    }

    if (type === 'rect') {
      store.pushHistory();
      const ne = {
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
        type: 'rect' as const,
        x: 200 + Math.random() * 100,
        y: 150 + Math.random() * 100,
        w: (props.w as number) ?? 200,
        h: (props.h as number) ?? 120,
        color: (props.color as string) ?? '#ff2d55',
        opacity: (props.opacity as number) ?? 0.8,
        borderR: (props.borderR as number) ?? 8,
        rot: 0,
      };
      store.updEl('__noop__', {}); // trigger nothing; we'll use the addShape approach
      store.addShape('rect', ne.x, ne.y);
      return;
    }

    if (type === 'circle') {
      store.addShape('circle');
      return;
    }

    if (type === 'triangle') {
      store.addShape('triangle');
      return;
    }

    if (type === 'star') {
      store.addShape('star');
      return;
    }

    if (type === 'line') {
      store.addLine();
      // Apply preset props
      const els = useThumbnailStore.getState().els;
      const last = els[els.length - 1];
      if (last) {
        store.updEl(last.id, {
          strokeColor: (props.strokeColor as string) ?? '#ffffff',
          lineWidth: (props.lineWidth as number) ?? 2,
          dashStyle: (props.dashStyle as 'solid' | 'dashed' | 'dotted') ?? 'solid',
        });
      }
      return;
    }

    if (type === 'arrow') {
      store.addArrow();
      const els = useThumbnailStore.getState().els;
      const last = els[els.length - 1];
      if (last) {
        store.updEl(last.id, {
          strokeColor: (props.strokeColor as string) ?? '#ffffff',
          lineWidth: (props.lineWidth as number) ?? 2,
          arrowHead: (props.arrowHead as 'end' | 'both' | 'none') ?? 'end',
        });
      }
      return;
    }

    if (type === 'stickyNote') {
      store.addStickyNote();
      const els = useThumbnailStore.getState().els;
      const last = els[els.length - 1];
      if (last) {
        store.updEl(last.id, {
          noteColor: (props.noteColor as string) ?? STICKY_NOTE_COLOR,
          noteText: (props.noteText as string) ?? t('thumbs.insert.stickyNote'),
          w: (props.w as number) ?? 200,
          h: (props.h as number) ?? 150,
        });
      }
      return;
    }

    if (type === 'table') {
      store.addTable(
        (props.rows as number) ?? 3,
        (props.cols as number) ?? 3,
      );
      return;
    }
  };

  return (
    <div>
      <PresetSection title={t('thumbs.elements.shapes')} presets={SHAPE_PRESETS} onAdd={addPreset} />
      <PresetSection title={t('thumbs.elements.linesArrows')} presets={LINE_PRESETS} onAdd={addPreset} />
      <PresetSection title={t('thumbs.elements.iconsEmoji')} presets={ICON_PRESETS} onAdd={addPreset} cols={4} />
      <PresetSection title={t('thumbs.elements.stickers')} presets={STICKER_PRESETS} onAdd={addPreset} cols={2} />
      <PresetSection title={t('thumbs.elements.tables')} presets={TABLE_PRESETS} onAdd={addPreset} cols={2} />
    </div>
  );
}
