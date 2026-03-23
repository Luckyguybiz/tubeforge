'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { STICKY_NOTE_PRESETS } from '@/lib/constants';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import type { CanvasElement, Theme } from '@/lib/types';
import { COLOR_PRESETS } from '@/lib/element-presets';
import { FONT_LIBRARY, FONT_CATEGORIES, loadGoogleFont, preloadPopularFonts } from '@/lib/fonts';

const FONT_SIZE_PRESETS = [16, 24, 32, 48, 64, 80, 96, 120];

const SHADOW_PRESETS = [
  { labelKey: 'thumbs.props.shadowNone', value: 'none' },
  { labelKey: 'thumbs.props.shadowLight', value: '0 2px 8px rgba(0,0,0,.5)' },
  { labelKey: 'thumbs.props.shadowMedium', value: '0 2px 12px rgba(0,0,0,.6)' },
  { labelKey: 'thumbs.props.shadowStrong', value: '0 4px 20px rgba(0,0,0,.8)' },
  { labelKey: 'thumbs.props.shadowRed', value: '0 2px 16px rgba(255,45,85,.4)' },
  { labelKey: 'thumbs.props.shadowBlue', value: '0 2px 16px rgba(58,123,253,.4)' },
];

const BG_SWATCHES = [
  { value: 'transparent', titleKey: 'thumbs.props.bgNone' },
  { value: 'rgba(0,0,0,.5)', titleKey: 'thumbs.props.bgDark' },
  { value: 'rgba(255,45,85,.15)', titleKey: 'thumbs.props.bgRed' },
  { value: 'rgba(58,123,253,.15)', titleKey: 'thumbs.props.bgBlue' },
  { value: 'rgba(255,255,255,.15)', titleKey: 'thumbs.props.bgLight' },
];

interface PropertiesPanelProps {
  sel: CanvasElement | null;
}

export function PropertiesPanel({ sel }: PropertiesPanelProps) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
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
      <div style={{ width: '100%', maxWidth: 260, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, flexShrink: 0, overflow: 'auto', maxHeight: 520, boxSizing: 'border-box' as const }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          {t('thumbs.props.properties')}
        </div>
        <div style={{ fontSize: 11, color: C.sub, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ background: C.accent + '18', color: C.accent, padding: '1px 6px', borderRadius: 4, fontWeight: 600, fontSize: 10 }}>{selIds.length}</span> {t('thumbs.props.elementsSelected')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Batch opacity */}
          <div>
            <div style={labelStyle}>{t('thumbs.props.opacity')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="range" min={0} max={1} step={0.05} defaultValue={1} aria-label={t('thumbs.props.opacity')} onChange={(e) => batchUpdate({ opacity: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} />
            </div>
          </div>

          {/* Alignment */}
          <div>
            <div style={labelStyle}>{t('thumbs.props.alignment')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              <button onClick={() => { const minX = Math.min(...selectedEls.map((e) => e.x)); batchUpdate({}); selIds.forEach((id) => { const el = els.find((e) => e.id === id); if (el) updEl(id, { x: minX }); }); }} style={btnSmall} title={t('thumbs.props.alignLeft')} aria-label={t('thumbs.props.alignLeftLabel')}>◀</button>
              <button onClick={() => { const avgX = selectedEls.reduce((s, e) => s + e.x + e.w / 2, 0) / selectedEls.length; selIds.forEach((id) => { const el = els.find((e) => e.id === id); if (el) updEl(id, { x: avgX - el.w / 2 }); }); }} style={btnSmall} title={t('thumbs.props.alignCenterX')} aria-label={t('thumbs.props.alignCenterXLabel')}>⦿</button>
              <button onClick={() => { const maxR = Math.max(...selectedEls.map((e) => e.x + e.w)); selIds.forEach((id) => { const el = els.find((e) => e.id === id); if (el) updEl(id, { x: maxR - el.w }); }); }} style={btnSmall} title={t('thumbs.props.alignRight')} aria-label={t('thumbs.props.alignRightLabel')}>▶</button>
              <button onClick={() => { const minY = Math.min(...selectedEls.map((e) => e.y)); selIds.forEach((id) => { updEl(id, { y: minY }); }); }} style={btnSmall} title={t('thumbs.props.alignTop')} aria-label={t('thumbs.props.alignTopLabel')}>▲</button>
              <button onClick={() => { const avgY = selectedEls.reduce((s, e) => s + e.y + e.h / 2, 0) / selectedEls.length; selIds.forEach((id) => { const el = els.find((e) => e.id === id); if (el) updEl(id, { y: avgY - el.h / 2 }); }); }} style={btnSmall} title={t('thumbs.props.alignCenterY')} aria-label={t('thumbs.props.alignCenterYLabel')}>⦿</button>
              <button onClick={() => { const maxB = Math.max(...selectedEls.map((e) => e.y + e.h)); selIds.forEach((id) => { const el = els.find((e) => e.id === id); if (el) updEl(id, { y: maxB - el.h }); }); }} style={btnSmall} title={t('thumbs.props.alignBottom')} aria-label={t('thumbs.props.alignBottomLabel')}>▼</button>
            </div>
          </div>

          {/* Distribute */}
          <div>
            <div style={labelStyle}>{t('thumbs.props.distribute')}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => {
                const sorted = [...selectedEls].sort((a, b) => a.x - b.x);
                if (sorted.length < 3) return;
                const totalW = sorted.reduce((s, e) => s + e.w, 0);
                const span = sorted[sorted.length - 1].x + sorted[sorted.length - 1].w - sorted[0].x;
                const gap = (span - totalW) / (sorted.length - 1);
                let cx = sorted[0].x;
                sorted.forEach((el) => { updEl(el.id, { x: Math.round(cx) }); cx += el.w + gap; });
              }} style={{ ...btnSmall, flex: 1, fontSize: 9 }}>↔ {t('thumbs.props.distributeH')}</button>
              <button onClick={() => {
                const sorted = [...selectedEls].sort((a, b) => a.y - b.y);
                if (sorted.length < 3) return;
                const totalH = sorted.reduce((s, e) => s + e.h, 0);
                const span = sorted[sorted.length - 1].y + sorted[sorted.length - 1].h - sorted[0].y;
                const gap = (span - totalH) / (sorted.length - 1);
                let cy = sorted[0].y;
                sorted.forEach((el) => { updEl(el.id, { y: Math.round(cy) }); cy += el.h + gap; });
              }} style={{ ...btnSmall, flex: 1, fontSize: 9 }}>↕ {t('thumbs.props.distributeV')}</button>
            </div>
          </div>

          {/* Group / Ungroup */}
          <div style={{ display: 'flex', gap: 3 }}>
            <button onClick={() => useThumbnailStore.getState().groupSelected()} style={{ flex: 1, padding: '5px', borderRadius: 5, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Group (Ctrl+G)</button>
            <button onClick={() => useThumbnailStore.getState().ungroupSelected()} style={{ flex: 1, padding: '5px', borderRadius: 5, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Ungroup</button>
          </div>
          <button onClick={() => { pushHistory(); selIds.forEach((id) => delEl(id)); }} style={{ width: '100%', padding: '5px', borderRadius: 5, border: `1px solid ${C.accent}33`, background: 'transparent', color: C.accent, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: .6 }} aria-label={t('thumbs.props.deleteAllSelected')}>✕ {t('thumbs.props.deleteAll')}</button>
        </div>

        <LayersPanel els={els} selId={selId} selIds={selIds} setSelId={setSelId} delEl={delEl} updEl={updEl} C={C} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: 260, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, flexShrink: 0, overflow: 'auto', maxHeight: 520, boxSizing: 'border-box' as const }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        {t('thumbs.props.properties')}
      </div>
      {!sel && <div style={{ color: C.dim, fontSize: 12, textAlign: 'center', padding: '28px 0', lineHeight: 1.6 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }}><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>
        {t('thumbs.props.selectElement')}<br />{t('thumbs.props.onCanvas')}
      </div>}

      {sel && sel.type === 'text' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div><div style={labelStyle}>{t('thumbs.props.textLabel')}</div><input value={sel.text ?? ''} onChange={(e) => updEl(sel.id, { text: e.target.value })} style={inputStyle} /></div>
          <FontPicker C={C} value={sel.font ?? 'Inter'} onChange={(f) => updEl(sel.id, { font: f })} inputStyle={inputStyle} labelStyle={labelStyle} />
          {/* C6: Size with presets */}
          <div>
            <div style={labelStyle}>{t('thumbs.props.size')}</div>
            <div style={{ display: 'flex', gap: 3 }}>
              <input type="number" value={sel.size} onChange={(e) => updEl(sel.id, { size: +e.target.value })} min={8} max={200} style={{ ...inputStyle, flex: 1 }} />
              <select value={FONT_SIZE_PRESETS.includes(sel.size ?? 0) ? sel.size : ''} onChange={(e) => { if (e.target.value) updEl(sel.id, { size: +e.target.value }); }} style={{ ...inputStyle, width: 'auto', minWidth: 44, padding: '5px 2px' }}>
                <option value="" disabled>—</option>
                {FONT_SIZE_PRESETS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {/* C3: Color with HEX */}
          <ColorWithHex C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} label={t('thumbs.props.color')} />
          <ColorPresets C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} />
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => updEl(sel.id, { bold: !sel.bold })} title={t('thumbs.props.bold')} style={{ flex: 1, padding: '5px', borderRadius: 5, border: `1px solid ${sel.bold ? C.blue + '55' : C.border}`, background: sel.bold ? C.blue + '14' : 'transparent', color: sel.bold ? C.blue : C.sub, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'serif' }}>B</button>
            <button onClick={() => updEl(sel.id, { italic: !sel.italic })} title={t('thumbs.props.italic')} style={{ flex: 1, padding: '5px', borderRadius: 5, border: `1px solid ${sel.italic ? C.blue + '55' : C.border}`, background: sel.italic ? C.blue + '14' : 'transparent', color: sel.italic ? C.blue : C.sub, fontSize: 11, fontStyle: 'italic', cursor: 'pointer', fontFamily: 'serif' }}>I</button>
          </div>
          {/* Text alignment */}
          <div>
            <div style={labelStyle}>{t('thumbs.props.textAlign')}</div>
            <div style={{ display: 'flex', gap: 3 }}>
              {(['left', 'center', 'right'] as const).map((align) => {
                const isActive = (sel.textAlign ?? 'left') === align;
                return (
                  <button key={align} onClick={() => updEl(sel.id, { textAlign: align })} title={align} style={{ flex: 1, padding: '5px', borderRadius: 5, border: `1px solid ${isActive ? C.blue + '55' : C.border}`, background: isActive ? C.blue + '14' : 'transparent', color: isActive ? C.blue : C.sub, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {align === 'left' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>}
                    {align === 'center' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>}
                    {align === 'right' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>}
                  </button>
                );
              })}
            </div>
          </div>
          {/* C4: Shadow with custom option */}
          <ShadowControl C={C} value={sel.shadow} onChange={(v) => updEl(sel.id, { shadow: v })} inputStyle={inputStyle} labelStyle={labelStyle} />
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          {/* C5: Bigger bg swatches with titles */}
          <div><div style={labelStyle}>{t('thumbs.props.textBg')}</div><div style={{ display: 'flex', gap: 4 }}>
            {BG_SWATCHES.map((bg) => {
              const bgTitle = t(bg.titleKey);
              return (
              <div key={bg.value} role="button" tabIndex={0} aria-label={bgTitle} onClick={() => updEl(sel.id, { bg: bg.value })} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); updEl(sel.id, { bg: bg.value }); } }} title={bgTitle} style={{ width: 26, height: 26, borderRadius: 5, background: bg.value === 'transparent' ? 'repeating-conic-gradient(#888 0% 25%, #555 0% 50%) 0 0 / 8px 8px' : bg.value, border: `2px solid ${sel.bg === bg.value ? C.blue : C.border}`, cursor: 'pointer' }} />
              );
            })}
          </div></div>
          {/* Advanced Typography */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4 }}>
            <div style={{ ...labelStyle, fontSize: 10, opacity: 0.7 }}>Advanced Typography</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <div><div style={{ ...labelStyle, fontSize: 9 }}>Letter Spacing</div><input type="number" value={sel.letterSpacing ?? 0} onChange={(e) => updEl(sel.id, { letterSpacing: +e.target.value })} min={-5} max={20} step={0.5} style={inputStyle} /></div>
              <div><div style={{ ...labelStyle, fontSize: 9 }}>Line Height</div><input type="number" value={sel.lineHeight ?? 1.4} onChange={(e) => updEl(sel.id, { lineHeight: +e.target.value })} min={0.8} max={3} step={0.1} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
              {(['none', 'uppercase', 'capitalize'] as const).map((tt) => (
                <button key={tt} onClick={() => updEl(sel.id, { textTransform: tt })} style={{ ...btnSmall, flex: 1, background: (sel.textTransform ?? 'none') === tt ? C.blue + '14' : 'transparent', color: (sel.textTransform ?? 'none') === tt ? C.blue : C.sub, border: `1px solid ${(sel.textTransform ?? 'none') === tt ? C.blue + '55' : C.border}` }}>{tt === 'none' ? 'Aa' : tt === 'uppercase' ? 'AA' : 'Ab'}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
              <button onClick={() => updEl(sel.id, { textDecoration: sel.textDecoration === 'underline' ? 'none' : 'underline' })} style={{ ...btnSmall, flex: 1, textDecoration: 'underline', background: sel.textDecoration === 'underline' ? C.blue + '14' : 'transparent', color: sel.textDecoration === 'underline' ? C.blue : C.sub }}>U</button>
              <button onClick={() => updEl(sel.id, { textDecoration: sel.textDecoration === 'line-through' ? 'none' : 'line-through' })} style={{ ...btnSmall, flex: 1, textDecoration: 'line-through', background: sel.textDecoration === 'line-through' ? C.blue + '14' : 'transparent', color: sel.textDecoration === 'line-through' ? C.blue : C.sub }}>S</button>
              <button onClick={() => updEl(sel.id, { textOutline: sel.textOutline ? undefined : '1px #000000' })} style={{ ...btnSmall, flex: 1, WebkitTextStroke: '1px', background: sel.textOutline ? C.blue + '14' : 'transparent', color: sel.textOutline ? C.blue : C.sub }}>O</button>
            </div>
          </div>
          {/* Filters */}
          <FiltersPanel C={C} sel={sel} updEl={updEl} labelStyle={labelStyle} inputStyle={inputStyle} />
          {/* Flip & Blend */}
          <FlipAndBlendPanel C={C} sel={sel} updEl={updEl} labelStyle={labelStyle} inputStyle={inputStyle} btnSmall={btnSmall} />
          {/* C1: Position */}
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          {/* C2: Rotation */}
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} delEl={delEl} />
        </div>
      )}

      {sel && (sel.type === 'rect' || sel.type === 'circle' || sel.type === 'triangle' || sel.type === 'star') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ColorWithHex C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} label={t('thumbs.props.color')} />
          <ColorPresets C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} />
          {/* Gradient Fill */}
          <GradientPicker C={C} sel={sel} updEl={updEl} labelStyle={labelStyle} inputStyle={inputStyle} />
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          {sel.type === 'rect' && <div><div style={labelStyle}>{t('thumbs.props.rounding')}</div><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="range" min={0} max={60} value={sel.borderR} onChange={(e) => updEl(sel.id, { borderR: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} /><span style={{ fontSize: 9, color: C.dim, minWidth: 20, textAlign: 'right' }}>{sel.borderR}</span></div></div>}
          {/* Filters */}
          <FiltersPanel C={C} sel={sel} updEl={updEl} labelStyle={labelStyle} inputStyle={inputStyle} />
          {/* Flip & Blend */}
          <FlipAndBlendPanel C={C} sel={sel} updEl={updEl} labelStyle={labelStyle} inputStyle={inputStyle} btnSmall={btnSmall} />
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <SizeInputs C={C} w={sel.w} h={sel.h} proportionLocked={sel.proportionLocked} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} delEl={delEl} />
        </div>
      )}

      {sel && sel.type === 'image' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ width: '100%', aspectRatio: '16/9', background: C.surface, borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.border}` }}><img src={sel.src} alt={t('thumbs.props.previewImage')} decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          {/* Frame presets */}
          <div>
            <div style={labelStyle}>Frame</div>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {[
                { label: 'None', borderR: 0, border: undefined, boxShadow: undefined },
                { label: 'Round', borderR: 12, border: undefined, boxShadow: undefined },
                { label: 'Circle', borderR: 999, border: undefined, boxShadow: undefined },
                { label: 'Border', borderR: 0, border: '4px solid #ffffff', boxShadow: undefined },
                { label: 'Shadow', borderR: 8, border: undefined, boxShadow: { x: 0, y: 4, blur: 20, spread: 0, color: 'rgba(0,0,0,.5)' } },
                { label: 'Glow', borderR: 8, border: undefined, boxShadow: { x: 0, y: 0, blur: 30, spread: 4, color: 'rgba(59,130,246,.4)' } },
              ].map((frame) => (
                <button key={frame.label} onClick={() => updEl(sel.id, { borderR: frame.borderR, border: frame.border, boxShadow: frame.boxShadow as CanvasElement['boxShadow'] })} style={{ ...btnSmall, flex: '1 0 28%', fontSize: 8, padding: '4px 2px' }}>{frame.label}</button>
              ))}
            </div>
          </div>
          <div><div style={labelStyle}>{t('thumbs.props.rounding')}</div><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="range" min={0} max={60} value={sel.borderR} onChange={(e) => updEl(sel.id, { borderR: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} /><span style={{ fontSize: 9, color: C.dim, minWidth: 20, textAlign: 'right' }}>{sel.borderR}</span></div></div>
          {/* Filters — especially useful for images */}
          <FiltersPanel C={C} sel={sel} updEl={updEl} labelStyle={labelStyle} inputStyle={inputStyle} />
          {/* Flip & Blend */}
          <FlipAndBlendPanel C={C} sel={sel} updEl={updEl} labelStyle={labelStyle} inputStyle={inputStyle} btnSmall={btnSmall} />
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <SizeInputs C={C} w={sel.w} h={sel.h} proportionLocked={sel.proportionLocked} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} delEl={delEl} />
        </div>
      )}

      {sel && sel.type === 'path' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: C.sub }}>{t('thumbs.props.drawnElement')}</div>
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} delEl={delEl} />
        </div>
      )}

      {/* Line / Arrow */}
      {sel && (sel.type === 'line' || sel.type === 'arrow') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}>{sel.type === 'arrow' ? t('thumbs.props.arrowLabel') : t('thumbs.props.lineLabel')}</div>
          <ColorWithHex C={C} value={sel.strokeColor ?? '#ffffff'} onChange={(c) => updEl(sel.id, { strokeColor: c })} label={t('thumbs.props.strokeColor')} />
          <ColorPresets C={C} value={sel.strokeColor ?? '#ffffff'} onChange={(c) => updEl(sel.id, { strokeColor: c })} />
          <div><div style={labelStyle}>{t('thumbs.props.thickness')}</div><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="range" min={1} max={12} value={sel.lineWidth ?? 2} onChange={(e) => updEl(sel.id, { lineWidth: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} /><span style={{ fontSize: 9, color: C.dim, minWidth: 16 }}>{sel.lineWidth ?? 2}</span></div></div>
          <div><div style={labelStyle}>{t('thumbs.props.style')}</div>
            <div style={{ display: 'flex', gap: 3 }}>
              {(['solid', 'dashed', 'dotted'] as const).map((ds) => (
                <button key={ds} onClick={() => updEl(sel.id, { dashStyle: ds })} style={{ flex: 1, padding: '4px', borderRadius: 5, border: `1px solid ${sel.dashStyle === ds ? C.blue + '55' : C.border}`, background: sel.dashStyle === ds ? C.blue + '14' : 'transparent', color: sel.dashStyle === ds ? C.blue : C.sub, fontSize: 9, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {ds === 'solid' ? '━━' : ds === 'dashed' ? '┅┅' : '…'}
                </button>
              ))}
            </div>
          </div>
          {sel.type === 'arrow' && (
            <div><div style={labelStyle}>{t('thumbs.props.arrowHead')}</div>
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
          <div style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}>{t('thumbs.props.noteLabel')}</div>
          <div><div style={labelStyle}>{t('thumbs.props.textLabel')}</div><textarea value={sel.noteText ?? ''} onChange={(e) => updEl(sel.id, { noteText: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
          <div><div style={labelStyle}>{t('thumbs.props.noteBgColor')}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {STICKY_NOTE_PRESETS.map((nc) => (
                <div key={nc} role="button" tabIndex={0} aria-label={`${t('thumbs.props.noteColorLabel')} ${nc}`} onClick={() => updEl(sel.id, { noteColor: nc })} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); updEl(sel.id, { noteColor: nc }); } }} style={{ width: 26, height: 26, borderRadius: 6, background: nc, border: `2px solid ${sel.noteColor === nc ? C.blue : C.border}`, cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1 }}><div style={labelStyle}>{t('thumbs.props.fontSize')}</div><input type="number" value={sel.size ?? 14} onChange={(e) => updEl(sel.id, { size: +e.target.value })} min={8} max={48} style={inputStyle} /></div>
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
          <div style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}>{t('thumbs.props.tableLabel')}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>{t('thumbs.props.rows')}</div>
              <div style={{ display: 'flex', gap: 3 }}>
                <button onClick={() => { if ((sel.rows ?? 3) > 1) updEl(sel.id, { rows: (sel.rows ?? 3) - 1 }); }} title={t('thumbs.props.removeRow')} style={btnSmall}>−</button>
                <span style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600 }}>{sel.rows ?? 3}</span>
                <button onClick={() => updEl(sel.id, { rows: (sel.rows ?? 3) + 1 })} title={t('thumbs.props.addRow')} style={btnSmall}>+</button>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>{t('thumbs.props.columns')}</div>
              <div style={{ display: 'flex', gap: 3 }}>
                <button onClick={() => { if ((sel.cols ?? 3) > 1) updEl(sel.id, { cols: (sel.cols ?? 3) - 1 }); }} title={t('thumbs.props.removeCol')} style={btnSmall}>−</button>
                <span style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600 }}>{sel.cols ?? 3}</span>
                <button onClick={() => updEl(sel.id, { cols: (sel.cols ?? 3) + 1 })} title={t('thumbs.props.addCol')} style={btnSmall}>+</button>
              </div>
            </div>
          </div>
          <ColorWithHex C={C} value={(sel.strokeColor ?? 'rgba(255,255,255,.2)').startsWith('rgba') ? '#ffffff' : sel.strokeColor ?? '#ffffff'} onChange={(c) => updEl(sel.id, { strokeColor: c })} label={t('thumbs.props.borderColor')} />
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

// Font picker with Google Fonts grouped by category
const CATEGORY_LABELS: Record<string, string> = {
  'sans-serif': 'Sans Serif',
  'serif': 'Serif',
  'display': 'Display',
  'handwriting': 'Handwriting',
  'monospace': 'Monospace',
};

function FontPicker({ C, value, onChange, inputStyle, labelStyle }: { C: Theme; value: string; onChange: (f: string) => void; inputStyle: React.CSSProperties; labelStyle: React.CSSProperties }) {
  const t = useLocaleStore((s) => s.t);
  const [open, setOpen] = useState(false);

  // Preload popular fonts on first mount
  useEffect(() => { preloadPopularFonts(); }, []);

  const handleSelect = useCallback((family: string) => {
    const entry = FONT_LIBRARY.find((f) => f.family === family);
    if (entry) loadGoogleFont(family, entry.weights);
    onChange(family);
    setOpen(false);
  }, [onChange]);

  // Load selected font on mount if it's a Google Font
  useEffect(() => {
    const entry = FONT_LIBRARY.find((f) => f.family === value);
    if (entry) loadGoogleFont(value, entry.weights);
  }, [value]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={labelStyle}>{t('thumbs.props.font')}</div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          ...inputStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontFamily: value,
          textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            maxHeight: 260,
            overflowY: 'auto',
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,.35)',
            marginTop: 2,
            padding: 4,
          }}
        >
          {FONT_CATEGORIES.map((cat) => {
            const fonts = FONT_LIBRARY.filter((f) => f.category === cat);
            if (fonts.length === 0) return null;
            return (
              <div key={cat}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: 0.5, padding: '6px 6px 2px', userSelect: 'none' }}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </div>
                {fonts.map((f) => (
                  <button
                    key={f.family}
                    onClick={() => handleSelect(f.family)}
                    onMouseEnter={() => loadGoogleFont(f.family, f.weights)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 8px',
                      border: 'none',
                      borderRadius: 5,
                      background: value === f.family ? C.accentDim : 'transparent',
                      color: value === f.family ? C.accent : C.text,
                      fontFamily: f.family,
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background .1s',
                      boxSizing: 'border-box',
                    }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.family}</span>
                    {f.popular && (
                      <span style={{ fontSize: 8, color: C.accent, background: C.accent + '18', padding: '1px 4px', borderRadius: 3, fontWeight: 600, fontFamily: 'inherit', flexShrink: 0 }}>
                        HOT
                      </span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  const t = useLocaleStore((s) => s.t);
  const rot = value ?? 0;
  return (
    <div>
      <div style={labelStyle}>{t('thumbs.props.rotation')}</div>
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
  const t = useLocaleStore((s) => s.t);
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
      <div style={labelStyle}>{t('thumbs.props.shadow')}</div>
      <select value={showCustom ? 'custom' : (value ?? 'none')} onChange={(e) => handleDropdown(e.target.value)} style={inputStyle}>
        {SHADOW_PRESETS.map((p) => <option key={p.value} value={p.value}>{t(p.labelKey)}</option>)}
        <option value="custom">{t('thumbs.props.shadowCustom')}</option>
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
              <div style={{ fontSize: 9, color: C.dim, marginBottom: 2 }}>{t('thumbs.props.shadowBlur')}</div>
              <input type="number" value={cBlur} min={0} onChange={(e) => { setCBlur(+e.target.value); applyCustom(cX, cY, +e.target.value, cColor, cAlpha); }} style={{ ...inputStyle, fontSize: 9 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: C.dim, marginBottom: 2 }}>{t('thumbs.props.color')}</div>
              <input type="color" value={cColor} onChange={(e) => { setCColor(e.target.value); applyCustom(cX, cY, cBlur, e.target.value, cAlpha); }} style={{ width: '100%', height: 26, border: `1px solid ${C.border}`, borderRadius: 4, padding: 1, cursor: 'pointer', background: C.surface }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: C.dim, marginBottom: 2 }}>{t('thumbs.props.shadowAlpha')}</div>
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
  const t = useLocaleStore((s) => s.t);
  return (
    <div>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 4, fontWeight: 600 }}>{t('thumbs.props.opacity')}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(+e.target.value)} style={{ flex: 1, accentColor: '#888' }} />
        <span style={{ fontSize: 9, color: C.dim, minWidth: 24, textAlign: 'right' }}>{Math.round(value * 100)}%</span>
      </div>
    </div>
  );
});

// C9: Size inputs with proportion lock
const SizeInputs = memo(function SizeInputs({ C, w, h, proportionLocked, onChange, inputStyle, labelStyle }: { C: Theme; w: number; h: number; proportionLocked?: boolean; onChange: (p: Partial<CanvasElement>) => void; inputStyle: React.CSSProperties; labelStyle: React.CSSProperties }) {
  const t = useLocaleStore((s) => s.t);
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
      <div style={{ flex: 1 }}><div style={labelStyle}>{t('thumbs.props.width')}</div><input type="number" value={Math.round(w)} onChange={(e) => handleW(+e.target.value)} style={inputStyle} /></div>
      <button
        onClick={() => onChange({ proportionLocked: !proportionLocked })}
        title={proportionLocked ? t('thumbs.props.unlockProportions') : t('thumbs.props.lockProportions')}
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
      <div style={{ flex: 1 }}><div style={labelStyle}>{t('thumbs.props.height')}</div><input type="number" value={Math.round(h)} onChange={(e) => handleH(+e.target.value)} style={inputStyle} /></div>
    </div>
  );
});

/* ── Gradient Picker ───────────────────────────────────────── */

const GRADIENT_PRESETS = [
  { label: 'Sunset', stops: [{ offset: 0, color: '#f97316' }, { offset: 1, color: '#ec4899' }] },
  { label: 'Ocean', stops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#3b82f6' }] },
  { label: 'Forest', stops: [{ offset: 0, color: '#22c55e' }, { offset: 1, color: '#0ea5e9' }] },
  { label: 'Neon', stops: [{ offset: 0, color: '#a855f7' }, { offset: 1, color: '#ec4899' }] },
  { label: 'Fire', stops: [{ offset: 0, color: '#ef4444' }, { offset: 1, color: '#f59e0b' }] },
  { label: 'Night', stops: [{ offset: 0, color: '#1e293b' }, { offset: 1, color: '#7c3aed' }] },
  { label: 'Gold', stops: [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#eab308' }] },
  { label: 'Ice', stops: [{ offset: 0, color: '#67e8f9' }, { offset: 1, color: '#a78bfa' }] },
];

const GradientPicker = memo(function GradientPicker({ C, sel, updEl, labelStyle, inputStyle }: {
  C: Theme; sel: CanvasElement; updEl: (id: string, p: Partial<CanvasElement>) => void; labelStyle: React.CSSProperties; inputStyle: React.CSSProperties;
}) {
  const hasGradient = !!sel.gradient;
  return (
    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ ...labelStyle, marginBottom: 0 }}>Gradient Fill</div>
        <button
          onClick={() => {
            if (hasGradient) {
              updEl(sel.id, { gradient: undefined });
            } else {
              updEl(sel.id, { gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: sel.color ?? '#ff2d55' }, { offset: 1, color: '#3b82f6' }] } });
            }
          }}
          style={{ padding: '2px 8px', borderRadius: 4, border: `1px solid ${hasGradient ? '#3b82f655' : C.border}`, background: hasGradient ? '#3b82f614' : 'transparent', color: hasGradient ? '#3b82f6' : C.sub, fontSize: 9, cursor: 'pointer', fontFamily: 'inherit' }}
        >{hasGradient ? 'ON' : 'OFF'}</button>
      </div>
      {hasGradient && sel.gradient && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Presets */}
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {GRADIENT_PRESETS.map((p) => (
              <div key={p.label} title={p.label} onClick={() => updEl(sel.id, { gradient: { type: 'linear', angle: sel.gradient?.angle ?? 135, stops: p.stops } })}
                style={{ width: 22, height: 22, borderRadius: 4, background: `linear-gradient(135deg, ${p.stops[0].color}, ${p.stops[1].color})`, cursor: 'pointer', border: `1px solid ${C.border}` }} />
            ))}
          </div>
          {/* Angle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, color: C.dim, minWidth: 32 }}>Angle</span>
            <input type="range" min={0} max={360} value={sel.gradient.angle ?? 135} onChange={(e) => updEl(sel.id, { gradient: { ...sel.gradient!, angle: +e.target.value } })} style={{ flex: 1, accentColor: '#888' }} />
            <span style={{ fontSize: 9, color: C.dim, minWidth: 24, textAlign: 'right' }}>{sel.gradient.angle ?? 135}°</span>
          </div>
          {/* Stop colors */}
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: C.dim }}>Start</div>
              <input type="color" value={sel.gradient.stops[0]?.color ?? '#ff2d55'} onChange={(e) => { const stops = [...(sel.gradient?.stops ?? [])]; stops[0] = { ...stops[0], color: e.target.value }; updEl(sel.id, { gradient: { ...sel.gradient!, stops } }); }} style={{ width: '100%', height: 24, border: 'none', cursor: 'pointer', borderRadius: 3 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: C.dim }}>End</div>
              <input type="color" value={sel.gradient.stops[1]?.color ?? '#3b82f6'} onChange={(e) => { const stops = [...(sel.gradient?.stops ?? [])]; stops[1] = { ...stops[1], color: e.target.value }; updEl(sel.id, { gradient: { ...sel.gradient!, stops } }); }} style={{ width: '100%', height: 24, border: 'none', cursor: 'pointer', borderRadius: 3 }} />
            </div>
          </div>
          {/* Type toggle */}
          <div style={{ display: 'flex', gap: 3 }}>
            <button onClick={() => updEl(sel.id, { gradient: { ...sel.gradient!, type: 'linear' } })} style={{ flex: 1, padding: '3px', borderRadius: 4, border: `1px solid ${sel.gradient.type === 'linear' ? '#3b82f655' : C.border}`, background: sel.gradient.type === 'linear' ? '#3b82f614' : 'transparent', color: sel.gradient.type === 'linear' ? '#3b82f6' : C.sub, fontSize: 9, cursor: 'pointer', fontFamily: 'inherit' }}>Linear</button>
            <button onClick={() => updEl(sel.id, { gradient: { ...sel.gradient!, type: 'radial' } })} style={{ flex: 1, padding: '3px', borderRadius: 4, border: `1px solid ${sel.gradient.type === 'radial' ? '#3b82f655' : C.border}`, background: sel.gradient.type === 'radial' ? '#3b82f614' : 'transparent', color: sel.gradient.type === 'radial' ? '#3b82f6' : C.sub, fontSize: 9, cursor: 'pointer', fontFamily: 'inherit' }}>Radial</button>
          </div>
        </div>
      )}
    </div>
  );
});

/* ── Filters Panel ────────────────────────────────────────── */

const FiltersPanel = memo(function FiltersPanel({ C, sel, updEl, labelStyle }: {
  C: Theme; sel: CanvasElement; updEl: (id: string, p: Partial<CanvasElement>) => void; labelStyle: React.CSSProperties; inputStyle: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const f = sel.filters ?? {};
  const hasFilters = Object.values(f).some((v) => v !== undefined && v !== 0 && v !== 100);

  const updateFilter = (key: string, value: number) => {
    updEl(sel.id, { filters: { ...f, [key]: value } });
  };

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ ...labelStyle, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          Filters {hasFilters && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />}
        </div>
        <span style={{ fontSize: 10, color: C.dim }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {([
            { key: 'blur', label: 'Blur', min: 0, max: 20, def: 0, unit: 'px' },
            { key: 'brightness', label: 'Brightness', min: 0, max: 200, def: 100, unit: '%' },
            { key: 'contrast', label: 'Contrast', min: 0, max: 200, def: 100, unit: '%' },
            { key: 'saturate', label: 'Saturate', min: 0, max: 200, def: 100, unit: '%' },
            { key: 'grayscale', label: 'Grayscale', min: 0, max: 100, def: 0, unit: '%' },
            { key: 'sepia', label: 'Sepia', min: 0, max: 100, def: 0, unit: '%' },
            { key: 'hueRotate', label: 'Hue Rotate', min: 0, max: 360, def: 0, unit: '°' },
          ] as const).map(({ key, label, min, max, def, unit }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, color: C.dim, minWidth: 52 }}>{label}</span>
              <input type="range" min={min} max={max} value={(f as Record<string, number>)[key] ?? def} onChange={(e) => updateFilter(key, +e.target.value)} style={{ flex: 1, accentColor: '#888' }} />
              <span style={{ fontSize: 9, color: C.dim, minWidth: 28, textAlign: 'right' }}>{(f as Record<string, number>)[key] ?? def}{unit}</span>
            </div>
          ))}
          <button onClick={() => updEl(sel.id, { filters: undefined })} style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, fontSize: 9, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' }}>Reset All</button>
        </div>
      )}
    </div>
  );
});

/* ── Flip & Blend Mode Panel ──────────────────────────────── */

const BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'];

const FlipAndBlendPanel = memo(function FlipAndBlendPanel({ C, sel, updEl, labelStyle, inputStyle, btnSmall }: {
  C: Theme; sel: CanvasElement; updEl: (id: string, p: Partial<CanvasElement>) => void; labelStyle: React.CSSProperties; inputStyle: React.CSSProperties; btnSmall: React.CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Flip controls */}
      <div style={{ display: 'flex', gap: 3 }}>
        <button onClick={() => updEl(sel.id, { flipX: !sel.flipX })} style={{ ...btnSmall, flex: 1, background: sel.flipX ? '#3b82f614' : 'transparent', color: sel.flipX ? '#3b82f6' : C.sub, border: `1px solid ${sel.flipX ? '#3b82f655' : C.border}` }} title="Flip Horizontal">↔ Flip H</button>
        <button onClick={() => updEl(sel.id, { flipY: !sel.flipY })} style={{ ...btnSmall, flex: 1, background: sel.flipY ? '#3b82f614' : 'transparent', color: sel.flipY ? '#3b82f6' : C.sub, border: `1px solid ${sel.flipY ? '#3b82f655' : C.border}` }} title="Flip Vertical">↕ Flip V</button>
      </div>
      {/* Blend mode */}
      <div>
        <div style={{ ...labelStyle, fontSize: 9 }}>Blend Mode</div>
        <select value={sel.blendMode ?? 'normal'} onChange={(e) => updEl(sel.id, { blendMode: e.target.value })} style={{ ...inputStyle, fontSize: 9 }}>
          {BLEND_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </div>
  );
});

const OrderButtons = memo(function OrderButtons({ C, id, bringFront, sendBack, delEl }: { C: Theme; id: string; bringFront: (id: string) => void; sendBack: (id: string) => void; delEl: (id: string) => void }) {
  const t = useLocaleStore((s) => s.t);
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
        >{upIcon} {t('thumbs.props.forward')}</button>
        <button onClick={() => sendBack(id)} style={orderBtnStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.borderColor = C.accent + '44'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
        >{downIcon} {t('thumbs.props.backward')}</button>
      </div>
      <button onClick={() => delEl(id)} style={{ width: '100%', padding: '6px', borderRadius: 6, border: `1px solid ${C.accent}22`, background: 'transparent', color: C.accent, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: .65, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all .12s' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.background = C.accent + '0a'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.65'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >{trashIcon} {t('thumbs.props.delete')}</button>
    </>
  );
});

const ColorPresets = memo(function ColorPresets({ C, value, onChange }: { C: Theme; value: string | undefined; onChange: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {COLOR_PRESETS.map((c) => (
        <div key={c} role="button" tabIndex={0} aria-label={`${c}`} onClick={() => onChange(c)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(c); } }} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: `2px solid ${value === c ? C.blue : 'transparent'}`, cursor: 'pointer' }} />
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
  const t = useLocaleStore((s) => s.t);
  const nameMap: Record<string, string> = {
    text: '', rect: t('thumbs.layers.nameRect'), circle: t('thumbs.layers.nameCircle'), triangle: t('thumbs.layers.nameTriangle'), star: t('thumbs.layers.nameStar'), image: t('thumbs.layers.nameImage'), path: t('thumbs.layers.namePath'),
    line: t('thumbs.layers.nameLine'), arrow: t('thumbs.layers.nameArrow'), stickyNote: t('thumbs.layers.nameNote'), table: t('thumbs.layers.nameTable'),
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
        <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>{t('thumbs.layers.title')}</span>
        <span style={{ fontSize: 10, color: C.dim, fontWeight: 600, background: C.surface, padding: '1px 6px', borderRadius: 4 }}>{els.length}</span>
      </div>
      {[...els].reverse().map((el) => {
        const isSel = selIds.includes(el.id);
        return (
          <div key={el.id} role="button" tabIndex={0} aria-label={t('thumbs.layers.layerLabel') + (nameMap[el.type] ?? el.type)} aria-pressed={isSel} onClick={() => setSelId(el.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelId(el.id); } }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: 8, marginBottom: 2, background: isSel ? C.accentDim : 'transparent', border: `1px solid ${isSel ? C.accent + '33' : 'transparent'}`, cursor: 'pointer', transition: 'all .12s' }}
            onMouseEnter={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = C.surface; }}
            onMouseLeave={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, flexShrink: 0, color: isSel ? C.accent : C.dim, background: isSel ? C.accent + '14' : C.surface, borderRadius: 5 }}>
              {LAYER_ICONS[el.type] ?? LAYER_ICONS.rect}
            </span>
            <span style={{ flex: 1, fontSize: 11, fontWeight: isSel ? 600 : 500, color: isSel ? C.text : C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {el.type === 'text' ? (el.text ?? '').slice(0, 18) || t('thumbs.layers.nameText') : el.type === 'stickyNote' ? (el.noteText ?? '').slice(0, 18) : nameMap[el.type] ?? el.type}
            </span>
            {/* Visibility toggle */}
            <button onClick={(e) => { e.stopPropagation(); updEl(el.id, { visible: el.visible === false ? true : false }); }}
              style={{ ...actionBtn, color: el.visible === false ? C.dim : C.sub, opacity: el.visible === false ? 0.4 : 0.7 }}
              title={el.visible === false ? t('thumbs.layers.show') : t('thumbs.layers.hide')}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.background = C.surface; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = el.visible === false ? '0.4' : '0.7'; (e.currentTarget as HTMLElement).style.background = 'none'; }}>
              {el.visible === false ? EYE_OFF_ICON : EYE_ICON}
            </button>
            {/* Lock toggle */}
            <button onClick={(e) => { e.stopPropagation(); updEl(el.id, { locked: !el.locked }); }}
              style={{ ...actionBtn, color: el.locked ? C.accent : C.dim, opacity: el.locked ? 0.9 : 0.5 }}
              title={el.locked ? t('thumbs.layers.unlock') : t('thumbs.layers.lock')}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.background = C.surface; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = el.locked ? '0.9' : '0.5'; (e.currentTarget as HTMLElement).style.background = 'none'; }}>
              {el.locked ? LOCK_ICON : UNLOCK_ICON}
            </button>
            {/* Delete */}
            <button onClick={(e) => { e.stopPropagation(); delEl(el.id); }} title={t('thumbs.layers.deleteLayer')}
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
