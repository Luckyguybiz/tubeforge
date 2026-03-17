'use client';

import { useState, memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useThemeStore } from '@/stores/useThemeStore';
import { STICKY_NOTE_PRESETS } from '@/lib/constants';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import type { CanvasElement, Theme } from '@/lib/types';
import { COLOR_PRESETS } from '@/lib/element-presets';

const FONT_SIZE_PRESETS = [16, 24, 32, 48, 64, 80, 96, 120];

const SHADOW_PRESETS = [
  { label: 'Нет', value: 'none' },
  { label: 'Лёгкая', value: '0 2px 8px rgba(0,0,0,.5)' },
  { label: 'Средняя', value: '0 2px 12px rgba(0,0,0,.6)' },
  { label: 'Сильная', value: '0 4px 20px rgba(0,0,0,.8)' },
  { label: 'Красная', value: '0 2px 16px rgba(255,45,85,.4)' },
  { label: 'Синяя', value: '0 2px 16px rgba(58,123,253,.4)' },
];

const BG_SWATCHES = [
  { value: 'transparent', title: 'Без фона' },
  { value: 'rgba(0,0,0,.5)', title: 'Тёмный' },
  { value: 'rgba(255,45,85,.15)', title: 'Красный' },
  { value: 'rgba(58,123,253,.15)', title: 'Синий' },
  { value: 'rgba(255,255,255,.15)', title: 'Светлый' },
];

interface PropertiesPanelProps {
  sel: CanvasElement | null;
}

export function PropertiesPanel({ sel }: PropertiesPanelProps) {
  const C = useThemeStore((s) => s.theme);
  const { els, selIds } = useThumbnailStore(
    useShallow((s) => ({ els: s.els, selIds: s.selIds }))
  );
  const { setSelId, updEl, delEl, bringFront, sendBack, pushHistory } = useThumbnailStore.getState();
  const selId = selIds.length > 0 ? selIds[selIds.length - 1] : null;
  const multiSel = selIds.length > 1;
  const selectedEls = els.filter((e) => selIds.includes(e.id));

  const inputStyle: React.CSSProperties = { width: '100%', padding: '5px 7px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, color: C.text, fontSize: 10, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: C.sub, marginBottom: 4, fontWeight: 600 };
  const btnSmall: React.CSSProperties = { padding: '4px', borderRadius: 5, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, fontSize: 9, cursor: 'pointer', fontFamily: 'inherit' };

  const batchUpdate = (patch: Partial<CanvasElement>) => {
    pushHistory();
    selIds.forEach((id) => updEl(id, patch));
  };

  // ===== Multi-select panel =====
  if (multiSel) {
    return (
      <div style={{ width: 260, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, flexShrink: 0, overflow: 'auto', maxHeight: 520 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          Свойства
        </div>
        <div style={{ fontSize: 11, color: C.sub, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ background: C.accent + '18', color: C.accent, padding: '1px 6px', borderRadius: 4, fontWeight: 600, fontSize: 10 }}>{selIds.length}</span> элементов выбрано
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Batch opacity */}
          <div>
            <div style={labelStyle}>Прозрачность</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="range" min={0} max={1} step={0.05} defaultValue={1} aria-label="Прозрачность" onChange={(e) => batchUpdate({ opacity: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} />
            </div>
          </div>

          {/* Alignment */}
          <div>
            <div style={labelStyle}>Выравнивание</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              <button onClick={() => { const minX = Math.min(...selectedEls.map((e) => e.x)); batchUpdate({}); selIds.forEach((id) => { const el = els.find((e) => e.id === id); if (el) updEl(id, { x: minX }); }); }} style={btnSmall} title="По левому краю" aria-label="Выровнять по левому краю">◀</button>
              <button onClick={() => { const avgX = selectedEls.reduce((s, e) => s + e.x + e.w / 2, 0) / selectedEls.length; selIds.forEach((id) => { const el = els.find((e) => e.id === id); if (el) updEl(id, { x: avgX - el.w / 2 }); }); }} style={btnSmall} title="По центру X" aria-label="Выровнять по центру горизонтально">⦿</button>
              <button onClick={() => { const maxR = Math.max(...selectedEls.map((e) => e.x + e.w)); selIds.forEach((id) => { const el = els.find((e) => e.id === id); if (el) updEl(id, { x: maxR - el.w }); }); }} style={btnSmall} title="По правому краю" aria-label="Выровнять по правому краю">▶</button>
              <button onClick={() => { const minY = Math.min(...selectedEls.map((e) => e.y)); selIds.forEach((id) => { updEl(id, { y: minY }); }); }} style={btnSmall} title="По верхнему краю" aria-label="Выровнять по верхнему краю">▲</button>
              <button onClick={() => { const avgY = selectedEls.reduce((s, e) => s + e.y + e.h / 2, 0) / selectedEls.length; selIds.forEach((id) => { const el = els.find((e) => e.id === id); if (el) updEl(id, { y: avgY - el.h / 2 }); }); }} style={btnSmall} title="По центру Y" aria-label="Выровнять по центру вертикально">⦿</button>
              <button onClick={() => { const maxB = Math.max(...selectedEls.map((e) => e.y + e.h)); selIds.forEach((id) => { const el = els.find((e) => e.id === id); if (el) updEl(id, { y: maxB - el.h }); }); }} style={btnSmall} title="По нижнему краю" aria-label="Выровнять по нижнему краю">▼</button>
            </div>
          </div>

          {/* Distribute */}
          <div>
            <div style={labelStyle}>Распределить</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => {
                const sorted = [...selectedEls].sort((a, b) => a.x - b.x);
                if (sorted.length < 3) return;
                const totalW = sorted.reduce((s, e) => s + e.w, 0);
                const span = sorted[sorted.length - 1].x + sorted[sorted.length - 1].w - sorted[0].x;
                const gap = (span - totalW) / (sorted.length - 1);
                let cx = sorted[0].x;
                sorted.forEach((el) => { updEl(el.id, { x: Math.round(cx) }); cx += el.w + gap; });
              }} style={{ ...btnSmall, flex: 1, fontSize: 9 }}>↔ Горизонт.</button>
              <button onClick={() => {
                const sorted = [...selectedEls].sort((a, b) => a.y - b.y);
                if (sorted.length < 3) return;
                const totalH = sorted.reduce((s, e) => s + e.h, 0);
                const span = sorted[sorted.length - 1].y + sorted[sorted.length - 1].h - sorted[0].y;
                const gap = (span - totalH) / (sorted.length - 1);
                let cy = sorted[0].y;
                sorted.forEach((el) => { updEl(el.id, { y: Math.round(cy) }); cy += el.h + gap; });
              }} style={{ ...btnSmall, flex: 1, fontSize: 9 }}>↕ Вертикал.</button>
            </div>
          </div>

          <button onClick={() => { pushHistory(); selIds.forEach((id) => delEl(id)); }} style={{ width: '100%', padding: '5px', borderRadius: 5, border: `1px solid ${C.accent}33`, background: 'transparent', color: C.accent, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: .6 }} aria-label="Удалить все выделенные элементы">✕ Удалить все</button>
        </div>

        <LayersPanel els={els} selId={selId} selIds={selIds} setSelId={setSelId} delEl={delEl} updEl={updEl} C={C} />
      </div>
    );
  }

  return (
    <div style={{ width: 260, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, flexShrink: 0, overflow: 'auto', maxHeight: 520 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        Свойства
      </div>
      {!sel && <div style={{ color: C.dim, fontSize: 12, textAlign: 'center', padding: '28px 0', lineHeight: 1.6 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }}><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>
        Выберите элемент<br />на холсте
      </div>}

      {sel && sel.type === 'text' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div><div style={labelStyle}>Текст</div><input value={sel.text ?? ''} onChange={(e) => updEl(sel.id, { text: e.target.value })} style={inputStyle} /></div>
          <div><div style={labelStyle}>Шрифт</div><select value={sel.font} onChange={(e) => updEl(sel.id, { font: e.target.value })} style={inputStyle}>
            <option value="Instrument Sans">Instrument Sans</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Impact">Impact</option><option value="Courier New">Courier New</option><option value="Verdana">Verdana</option>
          </select></div>
          {/* C6: Size with presets */}
          <div>
            <div style={labelStyle}>Размер</div>
            <div style={{ display: 'flex', gap: 3 }}>
              <input type="number" value={sel.size} onChange={(e) => updEl(sel.id, { size: +e.target.value })} min={8} max={200} style={{ ...inputStyle, flex: 1 }} />
              <select value={FONT_SIZE_PRESETS.includes(sel.size ?? 0) ? sel.size : ''} onChange={(e) => { if (e.target.value) updEl(sel.id, { size: +e.target.value }); }} style={{ ...inputStyle, width: 'auto', minWidth: 44, padding: '5px 2px' }}>
                <option value="" disabled>—</option>
                {FONT_SIZE_PRESETS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {/* C3: Color with HEX */}
          <ColorWithHex C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} label="Цвет" />
          <ColorPresets C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} />
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => updEl(sel.id, { bold: !sel.bold })} title="Жирный" style={{ flex: 1, padding: '5px', borderRadius: 5, border: `1px solid ${sel.bold ? C.blue + '55' : C.border}`, background: sel.bold ? C.blue + '14' : 'transparent', color: sel.bold ? C.blue : C.sub, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'serif' }}>B</button>
            <button onClick={() => updEl(sel.id, { italic: !sel.italic })} title="Курсив" style={{ flex: 1, padding: '5px', borderRadius: 5, border: `1px solid ${sel.italic ? C.blue + '55' : C.border}`, background: sel.italic ? C.blue + '14' : 'transparent', color: sel.italic ? C.blue : C.sub, fontSize: 11, fontStyle: 'italic', cursor: 'pointer', fontFamily: 'serif' }}>I</button>
          </div>
          {/* C4: Shadow with custom option */}
          <ShadowControl C={C} value={sel.shadow} onChange={(v) => updEl(sel.id, { shadow: v })} inputStyle={inputStyle} labelStyle={labelStyle} />
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          {/* C5: Bigger bg swatches with titles */}
          <div><div style={labelStyle}>Фон текста</div><div style={{ display: 'flex', gap: 4 }}>
            {BG_SWATCHES.map((bg) => (
              <div key={bg.value} role="button" tabIndex={0} aria-label={bg.title} onClick={() => updEl(sel.id, { bg: bg.value })} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); updEl(sel.id, { bg: bg.value }); } }} title={bg.title} style={{ width: 26, height: 26, borderRadius: 5, background: bg.value === 'transparent' ? 'repeating-conic-gradient(#888 0% 25%, #555 0% 50%) 0 0 / 8px 8px' : bg.value, border: `2px solid ${sel.bg === bg.value ? C.blue : C.border}`, cursor: 'pointer' }} />
            ))}
          </div></div>
          {/* C1: Position */}
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          {/* C2: Rotation */}
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} delEl={delEl} />
        </div>
      )}

      {sel && (sel.type === 'rect' || sel.type === 'circle' || sel.type === 'triangle' || sel.type === 'star') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ColorWithHex C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} label="Цвет" />
          <ColorPresets C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} />
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          {sel.type === 'rect' && <div><div style={labelStyle}>Скругление</div><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="range" min={0} max={60} value={sel.borderR} onChange={(e) => updEl(sel.id, { borderR: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} /><span style={{ fontSize: 9, color: C.dim, minWidth: 20, textAlign: 'right' }}>{sel.borderR}</span></div></div>}
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <SizeInputs C={C} w={sel.w} h={sel.h} proportionLocked={sel.proportionLocked} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} delEl={delEl} />
        </div>
      )}

      {sel && sel.type === 'image' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ width: '100%', aspectRatio: '16/9', background: C.surface, borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.border}` }}><img src={sel.src} alt="Превью изображения" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          <div><div style={labelStyle}>Скругление</div><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="range" min={0} max={60} value={sel.borderR} onChange={(e) => updEl(sel.id, { borderR: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} /><span style={{ fontSize: 9, color: C.dim, minWidth: 20, textAlign: 'right' }}>{sel.borderR}</span></div></div>
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <SizeInputs C={C} w={sel.w} h={sel.h} proportionLocked={sel.proportionLocked} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} delEl={delEl} />
        </div>
      )}

      {sel && sel.type === 'path' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: C.sub }}>Нарисованный элемент</div>
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} delEl={delEl} />
        </div>
      )}

      {/* Line / Arrow */}
      {sel && (sel.type === 'line' || sel.type === 'arrow') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}>{sel.type === 'arrow' ? 'Стрелка' : 'Линия'}</div>
          <ColorWithHex C={C} value={sel.strokeColor ?? '#ffffff'} onChange={(c) => updEl(sel.id, { strokeColor: c })} label="Цвет обводки" />
          <ColorPresets C={C} value={sel.strokeColor ?? '#ffffff'} onChange={(c) => updEl(sel.id, { strokeColor: c })} />
          <div><div style={labelStyle}>Толщина</div><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="range" min={1} max={12} value={sel.lineWidth ?? 2} onChange={(e) => updEl(sel.id, { lineWidth: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} /><span style={{ fontSize: 9, color: C.dim, minWidth: 16 }}>{sel.lineWidth ?? 2}</span></div></div>
          <div><div style={labelStyle}>Стиль</div>
            <div style={{ display: 'flex', gap: 3 }}>
              {(['solid', 'dashed', 'dotted'] as const).map((ds) => (
                <button key={ds} onClick={() => updEl(sel.id, { dashStyle: ds })} style={{ flex: 1, padding: '4px', borderRadius: 5, border: `1px solid ${sel.dashStyle === ds ? C.blue + '55' : C.border}`, background: sel.dashStyle === ds ? C.blue + '14' : 'transparent', color: sel.dashStyle === ds ? C.blue : C.sub, fontSize: 9, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {ds === 'solid' ? '━━' : ds === 'dashed' ? '┅┅' : '…'}
                </button>
              ))}
            </div>
          </div>
          {sel.type === 'arrow' && (
            <div><div style={labelStyle}>Наконечник</div>
              <div style={{ display: 'flex', gap: 3 }}>
                {(['end', 'both', 'none'] as const).map((ah) => (
                  <button key={ah} onClick={() => updEl(sel.id, { arrowHead: ah })} style={{ flex: 1, padding: '4px', borderRadius: 5, border: `1px solid ${sel.arrowHead === ah ? C.blue + '55' : C.border}`, background: sel.arrowHead === ah ? C.blue + '14' : 'transparent', color: sel.arrowHead === ah ? C.blue : C.sub, fontSize: 9, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {ah === 'end' ? '→' : ah === 'both' ? '↔' : '—'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} delEl={delEl} />
        </div>
      )}

      {/* Sticky Note */}
      {sel && sel.type === 'stickyNote' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}>Заметка</div>
          <div><div style={labelStyle}>Текст</div><textarea value={sel.noteText ?? ''} onChange={(e) => updEl(sel.id, { noteText: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
          <div><div style={labelStyle}>Цвет фона</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {STICKY_NOTE_PRESETS.map((nc) => (
                <div key={nc} role="button" tabIndex={0} aria-label={`Цвет заметки ${nc}`} onClick={() => updEl(sel.id, { noteColor: nc })} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); updEl(sel.id, { noteColor: nc }); } }} style={{ width: 26, height: 26, borderRadius: 6, background: nc, border: `2px solid ${sel.noteColor === nc ? C.blue : C.border}`, cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1 }}><div style={labelStyle}>Размер шрифта</div><input type="number" value={sel.size ?? 14} onChange={(e) => updEl(sel.id, { size: +e.target.value })} min={8} max={48} style={inputStyle} /></div>
          </div>
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <SizeInputs C={C} w={sel.w} h={sel.h} proportionLocked={sel.proportionLocked} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} delEl={delEl} />
        </div>
      )}

      {/* Table */}
      {sel && sel.type === 'table' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}>Таблица</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>Строки</div>
              <div style={{ display: 'flex', gap: 3 }}>
                <button onClick={() => { if ((sel.rows ?? 3) > 1) updEl(sel.id, { rows: (sel.rows ?? 3) - 1 }); }} title="Убрать строку" style={btnSmall}>−</button>
                <span style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600 }}>{sel.rows ?? 3}</span>
                <button onClick={() => updEl(sel.id, { rows: (sel.rows ?? 3) + 1 })} title="Добавить строку" style={btnSmall}>+</button>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>Столбцы</div>
              <div style={{ display: 'flex', gap: 3 }}>
                <button onClick={() => { if ((sel.cols ?? 3) > 1) updEl(sel.id, { cols: (sel.cols ?? 3) - 1 }); }} title="Убрать столбец" style={btnSmall}>−</button>
                <span style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600 }}>{sel.cols ?? 3}</span>
                <button onClick={() => updEl(sel.id, { cols: (sel.cols ?? 3) + 1 })} title="Добавить столбец" style={btnSmall}>+</button>
              </div>
            </div>
          </div>
          <ColorWithHex C={C} value={(sel.strokeColor ?? 'rgba(255,255,255,.2)').startsWith('rgba') ? '#ffffff' : sel.strokeColor ?? '#ffffff'} onChange={(c) => updEl(sel.id, { strokeColor: c })} label="Цвет границ" />
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <SizeInputs C={C} w={sel.w} h={sel.h} proportionLocked={sel.proportionLocked} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} delEl={delEl} />
        </div>
      )}

      <LayersPanel els={els} selId={selId} selIds={selIds} setSelId={setSelId} delEl={delEl} updEl={updEl} C={C} />
    </div>
  );
}

// ===== Sub-components =====

// C1: Position inputs
const PositionInputs = memo(function PositionInputs({ C, x, y, onChange, inputStyle, labelStyle }: { C: Theme; x: number; y: number; onChange: (p: Partial<CanvasElement>) => void; inputStyle: React.CSSProperties; labelStyle: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <div style={{ flex: 1 }}><div style={labelStyle}>X</div><input type="number" value={Math.round(x)} onChange={(e) => onChange({ x: +e.target.value })} style={inputStyle} /></div>
      <div style={{ flex: 1 }}><div style={labelStyle}>Y</div><input type="number" value={Math.round(y)} onChange={(e) => onChange({ y: +e.target.value })} style={inputStyle} /></div>
    </div>
  );
});

// C2: Rotation input (range + number + degree)
const RotationInput = memo(function RotationInput({ C, value, onChange, labelStyle, inputStyle }: { C: Theme; value: number | undefined; onChange: (v: number) => void; labelStyle: React.CSSProperties; inputStyle: React.CSSProperties }) {
  const rot = value ?? 0;
  return (
    <div>
      <div style={labelStyle}>Поворот</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input type="range" min={0} max={360} value={rot} onChange={(e) => onChange(+e.target.value)} style={{ flex: 1, accentColor: '#888' }} />
        <input type="number" value={rot} onChange={(e) => onChange(+e.target.value)} min={0} max={360} style={{ ...inputStyle, width: 44 }} />
        <span style={{ fontSize: 9, color: C.dim }}>°</span>
      </div>
    </div>
  );
});

// C3: Color picker with HEX text input
function ColorWithHex({ C, value, onChange, label }: { C: Theme; value: string | undefined; onChange: (c: string) => void; label?: string }) {
  const color = value ?? '#ffffff';
  let hexForPicker = color;
  if (color.startsWith('rgba') || color.startsWith('rgb')) hexForPicker = '#ffffff';
  return (
    <div>
      {label && <div style={{ fontSize: 11, color: C.sub, marginBottom: 4, fontWeight: 600 }}>{label}</div>}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <input type="color" value={hexForPicker} onChange={(e) => onChange(e.target.value)} style={{ width: 32, height: 28, border: `1px solid ${C.border}`, borderRadius: 6, padding: 1, cursor: 'pointer', background: C.surface, flexShrink: 0 }} />
        <input
          type="text"
          key={color}
          defaultValue={color.toUpperCase()}
          onBlur={(e) => {
            let v = e.target.value.trim();
            if (!v.startsWith('#')) v = '#' + v;
            if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v.toLowerCase());
            else e.target.value = color.toUpperCase();
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          style={{ flex: 1, padding: '4px 6px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, color: C.text, fontSize: 10, fontFamily: 'monospace', boxSizing: 'border-box' as const, outline: 'none' }}
        />
      </div>
    </div>
  );
}

// C4: Shadow control with presets and custom option
function ShadowControl({ C, value, onChange, inputStyle, labelStyle }: { C: Theme; value: string | undefined; onChange: (v: string) => void; inputStyle: React.CSSProperties; labelStyle: React.CSSProperties }) {
  const [showCustom, setShowCustom] = useState(false);
  const [cX, setCX] = useState(0);
  const [cY, setCY] = useState(2);
  const [cBlur, setCBlur] = useState(8);
  const [cColor, setCColor] = useState('#000000');
  const [cAlpha, setCAlpha] = useState(0.5);

  const parseShadow = (s: string) => {
    const defaults = { x: 0, y: 2, blur: 8, color: '#000000', alpha: 0.5 };
    if (s === 'none') { setCX(defaults.x); setCY(defaults.y); setCBlur(defaults.blur); setCColor(defaults.color); setCAlpha(defaults.alpha); return; }
    try {
      const m = s.match(/(-?\d+)(?:px)?\s+(-?\d+)(?:px)?\s+(\d+)(?:px)?\s+(.+)/);
      if (m) {
        setCX(parseInt(m[1])); setCY(parseInt(m[2])); setCBlur(parseInt(m[3]));
        const rgba = m[4].match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgba) {
          const [, r, g, b, a] = rgba;
          setCColor(`#${(+r).toString(16).padStart(2, '0')}${(+g).toString(16).padStart(2, '0')}${(+b).toString(16).padStart(2, '0')}`);
          setCAlpha(parseFloat(a ?? '1'));
        } else {
          setCColor(defaults.color); setCAlpha(defaults.alpha);
        }
      } else {
        setCX(defaults.x); setCY(defaults.y); setCBlur(defaults.blur); setCColor(defaults.color); setCAlpha(defaults.alpha);
      }
    } catch {
      // Use sensible defaults if parsing fails
      setCX(defaults.x); setCY(defaults.y); setCBlur(defaults.blur); setCColor(defaults.color); setCAlpha(defaults.alpha);
    }
  };

  const applyCustom = (x: number, y: number, blur: number, color: string, alpha: number) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    onChange(`${x}px ${y}px ${blur}px rgba(${r},${g},${b},${alpha})`);
  };

  const handleDropdown = (v: string) => {
    if (v === 'custom') { parseShadow(value ?? 'none'); setShowCustom(true); return; }
    setShowCustom(false);
    onChange(v);
  };

  return (
    <div>
      <div style={labelStyle}>Тень</div>
      <select value={showCustom ? 'custom' : (value ?? 'none')} onChange={(e) => handleDropdown(e.target.value)} style={inputStyle}>
        {SHADOW_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        <option value="custom">Настроить…</option>
      </select>
      {showCustom && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6, padding: 8, background: C.surface, borderRadius: 6, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: C.dim, marginBottom: 2 }}>X</div>
              <input type="number" value={cX} onChange={(e) => { setCX(+e.target.value); applyCustom(+e.target.value, cY, cBlur, cColor, cAlpha); }} style={{ ...inputStyle, fontSize: 9 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: C.dim, marginBottom: 2 }}>Y</div>
              <input type="number" value={cY} onChange={(e) => { setCY(+e.target.value); applyCustom(cX, +e.target.value, cBlur, cColor, cAlpha); }} style={{ ...inputStyle, fontSize: 9 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: C.dim, marginBottom: 2 }}>Размытие</div>
              <input type="number" value={cBlur} min={0} onChange={(e) => { setCBlur(+e.target.value); applyCustom(cX, cY, +e.target.value, cColor, cAlpha); }} style={{ ...inputStyle, fontSize: 9 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: C.dim, marginBottom: 2 }}>Цвет</div>
              <input type="color" value={cColor} onChange={(e) => { setCColor(e.target.value); applyCustom(cX, cY, cBlur, e.target.value, cAlpha); }} style={{ width: '100%', height: 26, border: `1px solid ${C.border}`, borderRadius: 4, padding: 1, cursor: 'pointer', background: C.surface }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: C.dim, marginBottom: 2 }}>Альфа</div>
              <input type="number" value={cAlpha} min={0} max={1} step={0.1} onChange={(e) => { setCAlpha(+e.target.value); applyCustom(cX, cY, cBlur, cColor, +e.target.value); }} style={{ ...inputStyle, fontSize: 9 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// C7: Neutral accent color for opacity slider
const OpacitySlider = memo(function OpacitySlider({ C, value, onChange }: { C: Theme; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 4, fontWeight: 600 }}>Прозрачность</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(+e.target.value)} style={{ flex: 1, accentColor: '#888' }} />
        <span style={{ fontSize: 9, color: C.dim, minWidth: 24, textAlign: 'right' }}>{Math.round(value * 100)}%</span>
      </div>
    </div>
  );
});

// C9: Size inputs with proportion lock
const SizeInputs = memo(function SizeInputs({ C, w, h, proportionLocked, onChange, inputStyle, labelStyle }: { C: Theme; w: number; h: number; proportionLocked?: boolean; onChange: (p: Partial<CanvasElement>) => void; inputStyle: React.CSSProperties; labelStyle: React.CSSProperties }) {
  const ratio = w / (h || 1);
  const handleW = (nw: number) => {
    if (proportionLocked) onChange({ w: nw, h: Math.round(nw / ratio) });
    else onChange({ w: nw });
  };
  const handleH = (nh: number) => {
    if (proportionLocked) onChange({ h: nh, w: Math.round(nh * ratio) });
    else onChange({ h: nh });
  };
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
      <div style={{ flex: 1 }}><div style={labelStyle}>Ширина</div><input type="number" value={Math.round(w)} onChange={(e) => handleW(+e.target.value)} style={inputStyle} /></div>
      <button
        onClick={() => onChange({ proportionLocked: !proportionLocked })}
        title={proportionLocked ? 'Разблокировать пропорции' : 'Заблокировать пропорции'}
        style={{
          width: 24, height: 28, borderRadius: 5,
          border: `1px solid ${proportionLocked ? C.blue + '55' : C.border}`,
          background: proportionLocked ? C.blue + '14' : 'transparent',
          color: proportionLocked ? C.blue : C.dim,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        {proportionLocked
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        }
      </button>
      <div style={{ flex: 1 }}><div style={labelStyle}>Высота</div><input type="number" value={Math.round(h)} onChange={(e) => handleH(+e.target.value)} style={inputStyle} /></div>
    </div>
  );
});

const OrderButtons = memo(function OrderButtons({ C, id, bringFront, sendBack, delEl }: { C: Theme; id: string; bringFront: (id: string) => void; sendBack: (id: string) => void; delEl: (id: string) => void }) {
  const orderBtnStyle: React.CSSProperties = { flex: 1, padding: '5px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all .12s' };
  const upIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>;
  const downIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
  const trashIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;
  return (
    <>
      <div style={{ display: 'flex', gap: 4, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
        <button onClick={() => bringFront(id)} style={orderBtnStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.borderColor = C.accent + '44'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
        >{upIcon} Вперёд</button>
        <button onClick={() => sendBack(id)} style={orderBtnStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.borderColor = C.accent + '44'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
        >{downIcon} Назад</button>
      </div>
      <button onClick={() => delEl(id)} style={{ width: '100%', padding: '6px', borderRadius: 6, border: `1px solid ${C.accent}22`, background: 'transparent', color: C.accent, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: .65, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all .12s' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.background = C.accent + '0a'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.65'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >{trashIcon} Удалить</button>
    </>
  );
});

const ColorPresets = memo(function ColorPresets({ C, value, onChange }: { C: Theme; value: string | undefined; onChange: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {COLOR_PRESETS.map((c) => (
        <div key={c} role="button" tabIndex={0} aria-label={`Цвет ${c}`} onClick={() => onChange(c)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(c); } }} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: `2px solid ${value === c ? C.blue : 'transparent'}`, cursor: 'pointer' }} />
      ))}
    </div>
  );
});

// Layer type SVG icons (clean, consistent 14x14)
const LAYER_ICONS: Record<string, React.ReactNode> = {
  text: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  rect: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
  circle: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>,
  triangle: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 22h20L12 2z"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  image: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  path: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
  line: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="19" x2="19" y2="5"/></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  stickyNote: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8.5L15.5 3z"/><polyline points="14 3 14 8 21 8"/></svg>,
  table: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
};

// Layer action SVG icons (14x14)
const EYE_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EYE_OFF_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const LOCK_ICON = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
const UNLOCK_ICON = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>;
const TRASH_ICON = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;

const LayersPanel = memo(function LayersPanel({ els, selId, selIds, setSelId, delEl, updEl, C }: {
  els: CanvasElement[];
  selId: string | null;
  selIds: string[];
  setSelId: (id: string | null) => void;
  delEl: (id: string) => void;
  updEl: (id: string, patch: Partial<CanvasElement>) => void;
  C: Theme;
}) {
  const nameMap: Record<string, string> = {
    text: '', rect: 'Прямоугольник', circle: 'Круг', triangle: 'Треугольник', star: 'Звезда', image: 'Картинка', path: 'Рисунок',
    line: 'Линия', arrow: 'Стрелка', stickyNote: 'Заметка', table: 'Таблица',
  };

  const actionBtn: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    flexShrink: 0,
    transition: 'all .12s',
  };

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>Слои</span>
        <span style={{ fontSize: 10, color: C.dim, fontWeight: 600, background: C.surface, padding: '1px 6px', borderRadius: 4 }}>{els.length}</span>
      </div>
      {[...els].reverse().map((el) => {
        const isSel = selIds.includes(el.id);
        return (
          <div key={el.id} role="button" tabIndex={0} aria-label={`Слой: ${nameMap[el.type] ?? el.type}`} aria-pressed={isSel} onClick={() => setSelId(el.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelId(el.id); } }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: 8, marginBottom: 2, background: isSel ? C.accentDim : 'transparent', border: `1px solid ${isSel ? C.accent + '33' : 'transparent'}`, cursor: 'pointer', transition: 'all .12s' }}
            onMouseEnter={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = C.surface; }}
            onMouseLeave={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, flexShrink: 0, color: isSel ? C.accent : C.dim, background: isSel ? C.accent + '14' : C.surface, borderRadius: 5 }}>
              {LAYER_ICONS[el.type] ?? LAYER_ICONS.rect}
            </span>
            <span style={{ flex: 1, fontSize: 11, fontWeight: isSel ? 600 : 500, color: isSel ? C.text : C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {el.type === 'text' ? (el.text ?? '').slice(0, 18) || 'Текст' : el.type === 'stickyNote' ? (el.noteText ?? '').slice(0, 18) : nameMap[el.type] ?? el.type}
            </span>
            {/* Visibility toggle */}
            <button onClick={(e) => { e.stopPropagation(); updEl(el.id, { visible: el.visible === false ? true : false }); }}
              style={{ ...actionBtn, color: el.visible === false ? C.dim : C.sub, opacity: el.visible === false ? 0.4 : 0.7 }}
              title={el.visible === false ? 'Показать' : 'Скрыть'}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.background = C.surface; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = el.visible === false ? '0.4' : '0.7'; (e.currentTarget as HTMLElement).style.background = 'none'; }}>
              {el.visible === false ? EYE_OFF_ICON : EYE_ICON}
            </button>
            {/* Lock toggle */}
            <button onClick={(e) => { e.stopPropagation(); updEl(el.id, { locked: !el.locked }); }}
              style={{ ...actionBtn, color: el.locked ? C.accent : C.dim, opacity: el.locked ? 0.9 : 0.5 }}
              title={el.locked ? 'Разблокировать' : 'Заблокировать'}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.background = C.surface; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = el.locked ? '0.9' : '0.5'; (e.currentTarget as HTMLElement).style.background = 'none'; }}>
              {el.locked ? LOCK_ICON : UNLOCK_ICON}
            </button>
            {/* Delete */}
            <button onClick={(e) => { e.stopPropagation(); delEl(el.id); }} title="Удалить слой"
              style={{ ...actionBtn, color: C.dim, opacity: 0.5 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.color = C.accent; (e.currentTarget as HTMLElement).style.background = C.surface; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.5'; (e.currentTarget as HTMLElement).style.color = C.dim; (e.currentTarget as HTMLElement).style.background = 'none'; }}>
              {TRASH_ICON}
            </button>
          </div>
        );
      })}
    </div>
  );
});
