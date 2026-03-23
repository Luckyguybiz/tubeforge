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
      <div style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, flexShrink: 0, boxSizing: 'border-box' as const }}>
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

          <button onClick={() => { pushHistory(); selIds.forEach((id) => delEl(id)); }} style={{ width: '100%', padding: '5px', borderRadius: 5, border: `1px solid ${C.accent}33`, background: 'transparent', color: C.accent, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: .6 }} aria-label={t('thumbs.props.deleteAllSelected')}>✕ {t('thumbs.props.deleteAll')}</button>
        </div>

        <LayersPanel els={els} selId={selId} selIds={selIds} setSelId={setSelId} delEl={delEl} updEl={updEl} C={C} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, flexShrink: 0, boxSizing: 'border-box' as const }}>
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
          {/* Font size slider + presets */}
          <div>
            <div style={labelStyle}>{t('thumbs.props.size')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="range" min={12} max={200} value={sel.size ?? 32} onChange={(e) => updEl(sel.id, { size: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} />
              <input type="number" value={sel.size ?? 32} onChange={(e) => updEl(sel.id, { size: +e.target.value })} min={8} max={200} style={{ ...inputStyle, width: 48 }} />
            </div>
            <div style={{ display: 'flex', gap: 2, marginTop: 4, flexWrap: 'wrap' }}>
              {FONT_SIZE_PRESETS.map((s) => <button key={s} onClick={() => updEl(sel.id, { size: s })} style={{ padding: '2px 5px', borderRadius: 4, border: `1px solid ${sel.size === s ? C.blue + '55' : C.border}`, background: sel.size === s ? C.blue + '14' : 'transparent', color: sel.size === s ? C.blue : C.dim, fontSize: 9, cursor: 'pointer', fontFamily: 'inherit' }}>{s}</button>)}
            </div>
          </div>
          {/* Color with HEX + presets */}
          <ColorWithHex C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} label={t('thumbs.props.color')} />
          <ColorPresets C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} />
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => updEl(sel.id, { bold: !sel.bold })} title={t('thumbs.props.bold')} style={{ flex: 1, padding: '5px', borderRadius: 5, border: `1px solid ${sel.bold ? C.blue + '55' : C.border}`, background: sel.bold ? C.blue + '14' : 'transparent', color: sel.bold ? C.blue : C.sub, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'serif' }}>B</button>
            <button onClick={() => updEl(sel.id, { italic: !sel.italic })} title={t('thumbs.props.italic')} style={{ flex: 1, padding: '5px', borderRadius: 5, border: `1px solid ${sel.italic ? C.blue + '55' : C.border}`, background: sel.italic ? C.blue + '14' : 'transparent', color: sel.italic ? C.blue : C.sub, fontSize: 11, fontStyle: 'italic', cursor: 'pointer', fontFamily: 'serif' }}>I</button>
            <button onClick={() => updEl(sel.id, { underline: !sel.underline })} title="Underline" style={{ flex: 1, padding: '5px', borderRadius: 5, border: `1px solid ${sel.underline ? C.blue + '55' : C.border}`, background: sel.underline ? C.blue + '14' : 'transparent', color: sel.underline ? C.blue : C.sub, fontSize: 11, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'serif' }}>U</button>
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
          {/* Text Transform */}
          <div>
            <div style={labelStyle}>Transform</div>
            <div style={{ display: 'flex', gap: 3 }}>
              {([{ val: 'none' as const, label: 'Aa' }, { val: 'uppercase' as const, label: 'AA' }, { val: 'lowercase' as const, label: 'aa' }, { val: 'capitalize' as const, label: 'Aa.' }]).map((tt) => {
                const isActive = (sel.textTransform ?? 'none') === tt.val;
                return <button key={tt.val} onClick={() => updEl(sel.id, { textTransform: tt.val })} title={tt.val} style={{ flex: 1, padding: '4px', borderRadius: 5, border: `1px solid ${isActive ? C.blue + '55' : C.border}`, background: isActive ? C.blue + '14' : 'transparent', color: isActive ? C.blue : C.sub, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{tt.label}</button>;
              })}
            </div>
          </div>
          {/* Letter Spacing */}
          <div>
            <div style={labelStyle}>Letter Spacing</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="range" min={-5} max={20} step={0.5} value={sel.letterSpacing ?? 0} onChange={(e) => updEl(sel.id, { letterSpacing: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} />
              <span style={{ fontSize: 9, color: C.dim, minWidth: 24, textAlign: 'right' }}>{sel.letterSpacing ?? 0}px</span>
            </div>
          </div>
          {/* Line Height */}
          <div>
            <div style={labelStyle}>Line Height</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="range" min={0.8} max={3.0} step={0.1} value={sel.lineHeight ?? 1.2} onChange={(e) => updEl(sel.id, { lineHeight: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} />
              <span style={{ fontSize: 9, color: C.dim, minWidth: 24, textAlign: 'right' }}>{(sel.lineHeight ?? 1.2).toFixed(1)}</span>
            </div>
          </div>
          {/* Text Outline/Stroke */}
          <div>
            <div style={labelStyle}>Text Stroke</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="color" value={sel.textStroke ?? '#000000'} onChange={(e) => updEl(sel.id, { textStroke: e.target.value })} style={{ width: 28, height: 24, border: `1px solid ${C.border}`, borderRadius: 5, padding: 1, cursor: 'pointer', background: C.surface, flexShrink: 0 }} />
              <input type="range" min={0} max={8} step={0.5} value={sel.textStrokeWidth ?? 0} onChange={(e) => updEl(sel.id, { textStrokeWidth: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} />
              <span style={{ fontSize: 9, color: C.dim, minWidth: 20, textAlign: 'right' }}>{sel.textStrokeWidth ?? 0}</span>
            </div>
          </div>
          {/* Shadow with custom option */}
          <ShadowControl C={C} value={sel.shadow} onChange={(v) => updEl(sel.id, { shadow: v })} inputStyle={inputStyle} labelStyle={labelStyle} />
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          {/* Text background swatches */}
          <div><div style={labelStyle}>{t('thumbs.props.textBg')}</div><div style={{ display: 'flex', gap: 4 }}>
            {BG_SWATCHES.map((bg) => {
              const bgTitle = t(bg.titleKey);
              return (
              <div key={bg.value} role="button" tabIndex={0} aria-label={bgTitle} onClick={() => updEl(sel.id, { bg: bg.value })} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); updEl(sel.id, { bg: bg.value }); } }} title={bgTitle} style={{ width: 26, height: 26, borderRadius: 5, background: bg.value === 'transparent' ? 'repeating-conic-gradient(#888 0% 25%, #555 0% 50%) 0 0 / 8px 8px' : bg.value, border: `2px solid ${sel.bg === bg.value ? C.blue : C.border}`, cursor: 'pointer' }} />
              );
            })}
          </div></div>
          {/* Position */}
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          {/* Rotation */}
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          {/* Visual Effects */}
          <EffectsSection C={C} sel={sel} updEl={updEl} pushHistory={pushHistory} labelStyle={labelStyle} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} delEl={delEl} />
        </div>
      )}

      {sel && (sel.type === 'rect' || sel.type === 'circle' || sel.type === 'triangle' || sel.type === 'star') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ColorWithHex C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} label={t('thumbs.props.color')} />
          <ColorPresets C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} />
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          {sel.type === 'rect' && <div><div style={labelStyle}>{t('thumbs.props.rounding')}</div><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="range" min={0} max={50} value={sel.borderR ?? 0} onChange={(e) => updEl(sel.id, { borderR: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} /><span style={{ fontSize: 9, color: C.dim, minWidth: 20, textAlign: 'right' }}>{sel.borderR ?? 0}px</span></div></div>}
          {/* Border color + width */}
          <div>
            <div style={labelStyle}>Border</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="color" value={sel.borderColor ?? '#ffffff'} onChange={(e) => updEl(sel.id, { borderColor: e.target.value })} style={{ width: 28, height: 24, border: `1px solid ${C.border}`, borderRadius: 5, padding: 1, cursor: 'pointer', background: C.surface, flexShrink: 0 }} />
              <input type="range" min={0} max={12} step={1} value={sel.borderWidth ?? 0} onChange={(e) => updEl(sel.id, { borderWidth: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} />
              <span style={{ fontSize: 9, color: C.dim, minWidth: 20, textAlign: 'right' }}>{sel.borderWidth ?? 0}px</span>
            </div>
          </div>
          {/* Shape Shadow */}
          <ShapeShadowControl C={C} value={sel.shapeShadow} onChange={(v) => updEl(sel.id, { shapeShadow: v })} labelStyle={labelStyle} />
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <SizeInputs C={C} w={sel.w} h={sel.h} proportionLocked={sel.proportionLocked} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          {/* Visual Effects */}
          <EffectsSection C={C} sel={sel} updEl={updEl} pushHistory={pushHistory} labelStyle={labelStyle} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} delEl={delEl} />
        </div>
      )}

      {sel && sel.type === 'image' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ width: '100%', aspectRatio: '16/9', background: C.surface, borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.border}` }}><img src={sel.src} alt={t('thumbs.props.previewImage')} decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          <div><div style={labelStyle}>{t('thumbs.props.rounding')}</div><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="range" min={0} max={60} value={sel.borderR ?? 0} onChange={(e) => updEl(sel.id, { borderR: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} /><span style={{ fontSize: 9, color: C.dim, minWidth: 20, textAlign: 'right' }}>{sel.borderR ?? 0}</span></div></div>
          {/* Image Shadow */}
          <ShapeShadowControl C={C} value={sel.shapeShadow} onChange={(v) => updEl(sel.id, { shapeShadow: v })} labelStyle={labelStyle} />
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <SizeInputs C={C} w={sel.w} h={sel.h} proportionLocked={sel.proportionLocked} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          {/* Visual Effects */}
          <EffectsSection C={C} sel={sel} updEl={updEl} pushHistory={pushHistory} labelStyle={labelStyle} />
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

// Shape shadow control (toggle + offset + blur + color)
function ShapeShadowControl({ C, value, onChange, labelStyle }: { C: Theme; value: string | undefined; onChange: (v: string | undefined) => void; labelStyle: React.CSSProperties }) {
  const enabled = !!value && value !== 'none';
  const [offX, setOffX] = useState(4);
  const [offY, setOffY] = useState(4);
  const [blur, setBlur] = useState(12);
  const [color, setColor] = useState('#000000');
  const [alpha, setAlpha] = useState(0.4);

  useEffect(() => {
    if (value && value !== 'none') {
      try {
        const m = value.match(/([\d.-]+)px\s+([\d.-]+)px\s+([\d.-]+)px\s+rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]*)\)/);
        if (m) {
          setOffX(parseFloat(m[1])); setOffY(parseFloat(m[2])); setBlur(parseFloat(m[3]));
          const r = parseInt(m[4]), g = parseInt(m[5]), b = parseInt(m[6]);
          setColor(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
          setAlpha(m[7] ? parseFloat(m[7]) : 1);
        }
      } catch { /* use defaults */ }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = (x: number, y: number, b: number, c: string, a: number) => {
    const hex = c.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const bv = parseInt(hex.substring(4, 6), 16) || 0;
    onChange(`${x}px ${y}px ${b}px rgba(${r},${g},${bv},${a})`);
  };

  return (
    <div>
      <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Shadow</span>
        <button onClick={() => { if (enabled) onChange(undefined); else { apply(offX, offY, blur, color, alpha); } }} style={{ background: 'none', border: 'none', color: enabled ? C.blue : C.dim, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '1px 4px' }}>{enabled ? 'ON' : 'OFF'}</button>
      </div>
      {enabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 6, background: C.surface, borderRadius: 6, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: C.dim, marginBottom: 1 }}>X</div><input type="range" min={-20} max={20} value={offX} onChange={(e) => { setOffX(+e.target.value); apply(+e.target.value, offY, blur, color, alpha); }} style={{ width: '100%', accentColor: '#888' }} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: C.dim, marginBottom: 1 }}>Y</div><input type="range" min={-20} max={20} value={offY} onChange={(e) => { setOffY(+e.target.value); apply(offX, +e.target.value, blur, color, alpha); }} style={{ width: '100%', accentColor: '#888' }} /></div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: C.dim, marginBottom: 1 }}>Blur</div><input type="range" min={0} max={40} value={blur} onChange={(e) => { setBlur(+e.target.value); apply(offX, offY, +e.target.value, color, alpha); }} style={{ width: '100%', accentColor: '#888' }} /></div>
            <input type="color" value={color} onChange={(e) => { setColor(e.target.value); apply(offX, offY, blur, e.target.value, alpha); }} style={{ width: 24, height: 24, border: `1px solid ${C.border}`, borderRadius: 4, padding: 1, cursor: 'pointer', background: C.surface, flexShrink: 0 }} />
          </div>
        </div>
      )}
    </div>
  );
}

// C8b: Visual Effects section
function EffectsSection({ C, sel, updEl, pushHistory, labelStyle }: {
  C: Theme;
  sel: CanvasElement;
  updEl: (id: string, patch: Partial<CanvasElement>) => void;
  pushHistory: () => void;
  labelStyle: React.CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasEffects = !!(sel.textGradient || sel.glow || (sel.blur && sel.blur > 0) || (sel.brightness !== undefined && sel.brightness !== 100) || (sel.contrast !== undefined && sel.contrast !== 100));
  const isText = sel.type === 'text';
  const isImage = sel.type === 'image';

  return (
    <div>
      <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          Effects
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: hasEffects ? C.accent : C.dim,
            fontSize: 9,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: '1px 4px',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {expanded ? 'HIDE' : hasEffects ? 'ON' : 'OFF'}
          <svg
            width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 6, marginTop: 4, background: C.surface, borderRadius: 6, border: `1px solid ${C.border}` }}>
          {/* Text Gradient (text elements only) */}
          {isText && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: C.sub, fontWeight: 600 }}>Gradient Text</span>
                <button
                  onClick={() => {
                    pushHistory();
                    if (sel.textGradient) updEl(sel.id, { textGradient: undefined });
                    else updEl(sel.id, { textGradient: { from: '#6366f1', to: '#ec4899', angle: 90 } });
                  }}
                  style={{ background: 'none', border: 'none', color: sel.textGradient ? C.accent : C.dim, fontSize: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '1px 4px' }}
                >
                  {sel.textGradient ? 'ON' : 'OFF'}
                </button>
              </div>
              {sel.textGradient && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 8, color: C.dim, marginBottom: 1 }}>From</div>
                      <input type="color" value={sel.textGradient.from} onChange={(e) => updEl(sel.id, { textGradient: { ...sel.textGradient!, from: e.target.value } })} style={{ width: '100%', height: 22, border: `1px solid ${C.border}`, borderRadius: 4, padding: 1, cursor: 'pointer', background: C.surface }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 8, color: C.dim, marginBottom: 1 }}>To</div>
                      <input type="color" value={sel.textGradient.to} onChange={(e) => updEl(sel.id, { textGradient: { ...sel.textGradient!, to: e.target.value } })} style={{ width: '100%', height: 22, border: `1px solid ${C.border}`, borderRadius: 4, padding: 1, cursor: 'pointer', background: C.surface }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8, color: C.dim, marginBottom: 1 }}>Angle</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input type="range" min={0} max={360} value={sel.textGradient.angle} onChange={(e) => updEl(sel.id, { textGradient: { ...sel.textGradient!, angle: +e.target.value } })} style={{ flex: 1, accentColor: '#888' }} />
                      <span style={{ fontSize: 8, color: C.dim, minWidth: 24, textAlign: 'right' }}>{sel.textGradient.angle}deg</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Glow effect */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: C.sub, fontWeight: 600 }}>Glow</span>
              <button
                onClick={() => {
                  pushHistory();
                  if (sel.glow) updEl(sel.id, { glow: undefined });
                  else updEl(sel.id, { glow: { color: '#6366f1', blur: 10, spread: 0 } });
                }}
                style={{ background: 'none', border: 'none', color: sel.glow ? C.accent : C.dim, fontSize: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '1px 4px' }}
              >
                {sel.glow ? 'ON' : 'OFF'}
              </button>
            </div>
            {sel.glow && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input type="color" value={sel.glow.color} onChange={(e) => updEl(sel.id, { glow: { ...sel.glow!, color: e.target.value } })} style={{ width: 24, height: 22, border: `1px solid ${C.border}`, borderRadius: 4, padding: 1, cursor: 'pointer', background: C.surface, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, color: C.dim, marginBottom: 1 }}>Blur</div>
                    <input type="range" min={0} max={40} value={sel.glow.blur} onChange={(e) => updEl(sel.id, { glow: { ...sel.glow!, blur: +e.target.value } })} style={{ width: '100%', accentColor: '#888' }} />
                  </div>
                  <span style={{ fontSize: 8, color: C.dim, minWidth: 16 }}>{sel.glow.blur}</span>
                </div>
              </div>
            )}
          </div>

          {/* Blur effect */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: C.sub, fontWeight: 600 }}>Blur</span>
              <span style={{ fontSize: 8, color: C.dim }}>{sel.blur ?? 0}px</span>
            </div>
            <input type="range" min={0} max={20} step={0.5} value={sel.blur ?? 0} onChange={(e) => updEl(sel.id, { blur: +e.target.value })} style={{ width: '100%', accentColor: '#888' }} />
          </div>

          {/* Brightness / Contrast (images only) */}
          {isImage && (
            <>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: C.sub, fontWeight: 600 }}>Brightness</span>
                  <span style={{ fontSize: 8, color: C.dim }}>{sel.brightness ?? 100}%</span>
                </div>
                <input type="range" min={50} max={150} value={sel.brightness ?? 100} onChange={(e) => updEl(sel.id, { brightness: +e.target.value })} style={{ width: '100%', accentColor: '#888' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: C.sub, fontWeight: 600 }}>Contrast</span>
                  <span style={{ fontSize: 8, color: C.dim }}>{sel.contrast ?? 100}%</span>
                </div>
                <input type="range" min={50} max={150} value={sel.contrast ?? 100} onChange={(e) => updEl(sel.id, { contrast: +e.target.value })} style={{ width: '100%', accentColor: '#888' }} />
              </div>
            </>
          )}

          {/* Reset all effects button */}
          {hasEffects && (
            <button
              onClick={() => {
                pushHistory();
                updEl(sel.id, { textGradient: undefined, glow: undefined, blur: undefined, brightness: undefined, contrast: undefined });
              }}
              style={{
                width: '100%',
                padding: '4px',
                borderRadius: 4,
                border: `1px solid ${C.accent}33`,
                background: 'transparent',
                color: C.accent,
                fontSize: 8,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                opacity: 0.7,
              }}
            >
              Reset All Effects
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const { moveLayer } = useThumbnailStore.getState();

  const nameMap: Record<string, string> = {
    text: '', rect: t('thumbs.layers.nameRect'), circle: t('thumbs.layers.nameCircle'), triangle: t('thumbs.layers.nameTriangle'), star: t('thumbs.layers.nameStar'), image: t('thumbs.layers.nameImage'), path: t('thumbs.layers.namePath'),
    line: t('thumbs.layers.nameLine'), arrow: t('thumbs.layers.nameArrow'), stickyNote: t('thumbs.layers.nameNote'), table: t('thumbs.layers.nameTable'),
  };

  const getDisplayName = (el: CanvasElement) => {
    if (el.name) return el.name;
    if (el.type === 'text') return (el.text ?? '').slice(0, 18) || t('thumbs.layers.nameText');
    if (el.type === 'stickyNote') return (el.noteText ?? '').slice(0, 18);
    return nameMap[el.type] ?? el.type;
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

  const reversedEls = [...els].reverse();

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>{t('thumbs.layers.title')}</span>
        <span style={{ fontSize: 10, color: C.dim, fontWeight: 600, background: C.surface, padding: '1px 6px', borderRadius: 4 }}>{els.length}</span>
      </div>
      {reversedEls.map((el) => {
        const isSel = selIds.includes(el.id);
        const isRenaming = renamingId === el.id;
        const isDragOver = dragOverId === el.id && dragId !== el.id;
        return (
          <div key={el.id}
            draggable={!isRenaming}
            onDragStart={(e) => { setDragId(el.id); e.dataTransfer.effectAllowed = 'move'; }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverId(el.id); }}
            onDragLeave={() => { if (dragOverId === el.id) setDragOverId(null); }}
            onDrop={(e) => { e.preventDefault(); if (dragId && dragId !== el.id) { const newIdx = els.length - 1 - reversedEls.indexOf(el); moveLayer(dragId, newIdx); } setDragId(null); setDragOverId(null); }}
            onDragEnd={() => { setDragId(null); setDragOverId(null); }}
            role="button" tabIndex={0} aria-label={t('thumbs.layers.layerLabel') + getDisplayName(el)} aria-pressed={isSel}
            onClick={() => { if (!isRenaming) setSelId(el.id); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelId(el.id); } }}
            onDoubleClick={(e) => { e.stopPropagation(); setRenamingId(el.id); setRenameVal(el.name || getDisplayName(el)); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: 8, marginBottom: 2, background: isSel ? C.accentDim : 'transparent', border: `1px solid ${isDragOver ? C.accent : isSel ? C.accent + '33' : 'transparent'}`, cursor: isRenaming ? 'text' : 'pointer', transition: 'all .12s', opacity: dragId === el.id ? 0.4 : 1 }}
            onMouseEnter={(e) => { if (!isSel && !dragId) (e.currentTarget as HTMLElement).style.background = C.surface; }}
            onMouseLeave={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, flexShrink: 0, color: isSel ? C.accent : C.dim, background: isSel ? C.accent + '14' : C.surface, borderRadius: 5 }}>
              {LAYER_ICONS[el.type] ?? LAYER_ICONS.rect}
            </span>
            {isRenaming ? (
              <input
                autoFocus
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                onBlur={() => { updEl(el.id, { name: renameVal || undefined }); setRenamingId(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { updEl(el.id, { name: renameVal || undefined }); setRenamingId(null); } if (e.key === 'Escape') setRenamingId(null); }}
                onClick={(e) => e.stopPropagation()}
                style={{ flex: 1, fontSize: 11, fontWeight: 500, color: C.text, background: C.surface, border: `1px solid ${C.blue}`, borderRadius: 4, padding: '1px 4px', outline: 'none', fontFamily: 'inherit', minWidth: 0 }}
              />
            ) : (
              <span style={{ flex: 1, fontSize: 11, fontWeight: isSel ? 600 : 500, color: isSel ? C.text : C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getDisplayName(el)}
              </span>
            )}
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
