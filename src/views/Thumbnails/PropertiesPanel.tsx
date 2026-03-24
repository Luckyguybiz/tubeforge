'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { STICKY_NOTE_PRESETS } from '@/lib/constants';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import type { CanvasElement, Theme } from '@/lib/types';
import { COLOR_PRESETS } from '@/lib/element-presets';
import { FONT_LIBRARY, FONT_CATEGORIES, loadGoogleFont, preloadPopularFonts } from '@/lib/fonts';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

const FONT_SIZE_PRESETS = [16, 24, 32, 48, 64, 80, 96, 120];

const FONT_WEIGHT_PRESETS = [
  { label: 'Thin', value: 100 },
  { label: 'Light', value: 300 },
  { label: 'Regular', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'SemiBold', value: 600 },
  { label: 'Bold', value: 700 },
  { label: 'Black', value: 900 },
];

const BLEND_MODE_OPTIONS = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn',
] as const;

const IMAGE_FILTER_PRESETS = [
  { name: 'None', filters: {} as Record<string, number> },
  { name: 'Vintage', filters: { sepia: 40, brightness: 110, contrast: 90, saturate: 80 } },
  { name: 'B&W', filters: { grayscale: 100 } },
  { name: 'Cinematic', filters: { contrast: 120, saturate: 80, brightness: 95 } },
  { name: 'Warm', filters: { sepia: 15, saturate: 120, brightness: 105 } },
  { name: 'Cool', filters: { hueRotate: 180, saturate: 80 } },
  { name: 'Dramatic', filters: { contrast: 140, brightness: 90, saturate: 60 } },
  { name: 'HDR', filters: { contrast: 130, saturate: 130, brightness: 105 } },
];

const QUICK_SHADOW_PRESETS = [
  { name: 'None', shadow: null as null | { x: number; y: number; blur: number; color: string; alpha: number } },
  { name: 'Soft', shadow: { x: 2, y: 4, blur: 12, color: '#000000', alpha: 0.15 } },
  { name: 'Hard', shadow: { x: 4, y: 4, blur: 0, color: '#000000', alpha: 0.3 } },
  { name: 'Neon', shadow: { x: 0, y: 0, blur: 20, color: '#6366f1', alpha: 0.8 } },
  { name: '3D', shadow: { x: 6, y: 6, blur: 0, color: '#000000', alpha: 0.4 } },
  { name: 'Long', shadow: { x: 12, y: 12, blur: 2, color: '#000000', alpha: 0.2 } },
];

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

const GRADIENT_PRESETS: Array<{ name: string; from: string; to: string; mid?: string; angle: number }> = [
  { name: 'Fire', from: '#ff4500', to: '#ffd700', angle: 90 },
  { name: 'Ocean', from: '#0077b6', to: '#00b4d8', angle: 90 },
  { name: 'Sunset', from: '#ff6b35', to: '#f7c59f', angle: 90 },
  { name: 'Neon', from: '#7b2ff7', to: '#ff2eaf', angle: 90 },
  { name: 'Gold', from: '#f59e0b', to: '#fbbf24', angle: 90 },
  { name: 'Ice', from: '#023e8a', to: '#90e0ef', angle: 90 },
  { name: 'Forest', from: '#2d6a4f', to: '#95d5b2', angle: 90 },
  { name: 'Rainbow', from: '#ff0000', to: '#ff00ff', mid: '#00ff00', angle: 90 },
];

const PATTERN_OPTIONS: Array<{ value: CanvasElement['pattern']; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'dots', label: 'Dots' },
  { value: 'lines', label: 'Lines' },
  { value: 'grid', label: 'Grid' },
  { value: 'diagonal', label: 'Diagonal' },
  { value: 'chevron', label: 'Chevron' },
  { value: 'waves', label: 'Waves' },
];

interface PropertiesPanelProps {
  sel: CanvasElement | null;
}

export function PropertiesPanel({ sel }: PropertiesPanelProps) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const { els, selIds, canvasBg } = useThumbnailStore(
    useShallow((s) => ({ els: s.els, selIds: s.selIds, canvasBg: s.canvasBg }))
  );
  const { setSelId, updEl, delEl, bringFront, sendBack, moveUp, moveDown, pushHistory, flipHorizontal, flipVertical, replaceImage } = useThumbnailStore.getState();
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
          {/* AI Enhance Text */}
          <AIEnhanceTextButton C={C} sel={sel} updEl={updEl} pushHistory={pushHistory} />
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
          <ColorHarmony C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} />
          <ContrastChecker C={C} fg={sel.color} bg={canvasBg} />
          {/* Font Weight */}
          <div>
            <div style={labelStyle}>Weight</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="range" min={100} max={900} step={100} value={sel.fontWeight ?? (sel.bold ? 700 : 400)} onChange={(e) => { const w = +e.target.value; updEl(sel.id, { fontWeight: w, bold: w >= 700 }); }} style={{ flex: 1, accentColor: '#888' }} />
              <span style={{ fontSize: 9, color: C.dim, minWidth: 24, textAlign: 'right' }}>{sel.fontWeight ?? (sel.bold ? 700 : 400)}</span>
            </div>
            <div style={{ display: 'flex', gap: 2, marginTop: 3, flexWrap: 'wrap' }}>
              {FONT_WEIGHT_PRESETS.map((fw) => {
                const currentWeight = sel.fontWeight ?? (sel.bold ? 700 : 400);
                const isActive = currentWeight === fw.value;
                return <button key={fw.value} onClick={() => updEl(sel.id, { fontWeight: fw.value, bold: fw.value >= 700 })} style={{ padding: '2px 4px', borderRadius: 4, border: `1px solid ${isActive ? C.blue + '55' : C.border}`, background: isActive ? C.blue + '14' : 'transparent', color: isActive ? C.blue : C.dim, fontSize: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: fw.value }}>{fw.label}</button>;
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => updEl(sel.id, { italic: !sel.italic })} title={t('thumbs.props.italic')} style={{ flex: 1, padding: '5px', borderRadius: 5, border: `1px solid ${sel.italic ? C.blue + '55' : C.border}`, background: sel.italic ? C.blue + '14' : 'transparent', color: sel.italic ? C.blue : C.sub, fontSize: 11, fontStyle: 'italic', cursor: 'pointer', fontFamily: 'serif' }}>I</button>
            <button onClick={() => updEl(sel.id, { underline: !sel.underline })} title="Underline" style={{ flex: 1, padding: '5px', borderRadius: 5, border: `1px solid ${sel.underline ? C.blue + '55' : C.border}`, background: sel.underline ? C.blue + '14' : 'transparent', color: sel.underline ? C.blue : C.sub, fontSize: 11, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'serif' }}>U</button>
          </div>
          {/* Curved Text */}
          <div>
            <div style={labelStyle}>Curve</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="range" min={-100} max={100} step={1} value={sel.curveAmount ?? 0} onChange={(e) => updEl(sel.id, { curveAmount: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} />
              <span style={{ fontSize: 9, color: C.dim, minWidth: 24, textAlign: 'right' }}>{sel.curveAmount ?? 0}</span>
              {(sel.curveAmount ?? 0) !== 0 && (
                <button onClick={() => updEl(sel.id, { curveAmount: 0 })} style={{ padding: '2px 4px', borderRadius: 3, border: `1px solid ${C.border}`, background: 'transparent', color: C.dim, fontSize: 8, cursor: 'pointer', fontFamily: 'inherit' }}>Reset</button>
              )}
            </div>
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
              <InlineColorSwatch C={C} value={sel.textStroke ?? '#000000'} onChange={(c) => updEl(sel.id, { textStroke: c })} />
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
          {/* Position & Size */}
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <SizeInputs C={C} w={sel.w} h={sel.h} proportionLocked={sel.proportionLocked} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          {/* Rotation */}
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          {/* Blend Mode */}
          <BlendModeSelect C={C} value={sel.blendMode} onChange={(v) => updEl(sel.id, { blendMode: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          {/* Quick Shadow Presets */}
          <QuickShadowPresets C={C} value={sel.shapeShadow} onChange={(v) => updEl(sel.id, { shapeShadow: v })} labelStyle={labelStyle} />
          {/* Visual Effects */}
          <EffectsSection C={C} sel={sel} updEl={updEl} pushHistory={pushHistory} labelStyle={labelStyle} />
          {/* Flip */}
          <FlipButtons C={C} id={sel.id} flipX={sel.flipX} flipY={sel.flipY} flipHorizontal={flipHorizontal} flipVertical={flipVertical} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} moveUp={moveUp} moveDown={moveDown} delEl={delEl} />
        </div>
      )}

      {sel && (sel.type === 'rect' || sel.type === 'circle' || sel.type === 'triangle' || sel.type === 'star') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Fill mode: Solid / Pattern */}
          <div>
            <div style={labelStyle}>Fill</div>
            <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
              <button onClick={() => updEl(sel.id, { pattern: 'none' })} style={{ flex: 1, padding: '4px 0', borderRadius: 5, border: `1px solid ${(!sel.pattern || sel.pattern === 'none') ? C.accent : C.border}`, background: (!sel.pattern || sel.pattern === 'none') ? C.accent + '18' : 'transparent', color: (!sel.pattern || sel.pattern === 'none') ? C.accent : C.sub, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Solid</button>
              <button onClick={() => updEl(sel.id, { pattern: sel.pattern && sel.pattern !== 'none' ? sel.pattern : 'dots' })} style={{ flex: 1, padding: '4px 0', borderRadius: 5, border: `1px solid ${sel.pattern && sel.pattern !== 'none' ? C.accent : C.border}`, background: sel.pattern && sel.pattern !== 'none' ? C.accent + '18' : 'transparent', color: sel.pattern && sel.pattern !== 'none' ? C.accent : C.sub, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Pattern</button>
            </div>
          </div>
          <ColorWithHex C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} label={t('thumbs.props.color')} />
          <ColorPresets C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} />
          <ColorHarmony C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} />
          {/* Pattern picker */}
          {sel.pattern && sel.pattern !== 'none' && (
            <div>
              <div style={labelStyle}>Pattern Style</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, marginBottom: 6 }}>
                {PATTERN_OPTIONS.filter((p) => p.value !== 'none').map((p) => (
                  <button key={p.value} title={p.label} onClick={() => updEl(sel.id, { pattern: p.value })} style={{ width: '100%', height: 32, borderRadius: 5, border: `1px solid ${sel.pattern === p.value ? C.accent : C.border}`, background: sel.pattern === p.value ? C.accent + '18' : C.surface, cursor: 'pointer', padding: 0, position: 'relative', overflow: 'hidden' }}>
                    <svg width="100%" height="100%" viewBox="0 0 40 32">
                      <defs>
                        {p.value === 'dots' && <pattern id={`pp-${p.value}`} width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.5" fill={C.text} /></pattern>}
                        {p.value === 'lines' && <pattern id={`pp-${p.value}`} width="10" height="10" patternUnits="userSpaceOnUse"><line x1="0" y1="5" x2="10" y2="5" stroke={C.text} strokeWidth="0.8" /></pattern>}
                        {p.value === 'grid' && <pattern id={`pp-${p.value}`} width="10" height="10" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="10" stroke={C.text} strokeWidth="0.6" /><line x1="0" y1="0" x2="10" y2="0" stroke={C.text} strokeWidth="0.6" /></pattern>}
                        {p.value === 'diagonal' && <pattern id={`pp-${p.value}`} width="10" height="10" patternUnits="userSpaceOnUse"><line x1="0" y1="10" x2="10" y2="0" stroke={C.text} strokeWidth="0.8" /></pattern>}
                        {p.value === 'chevron' && <pattern id={`pp-${p.value}`} width="10" height="10" patternUnits="userSpaceOnUse"><polyline points="0,5 5,0 10,5" fill="none" stroke={C.text} strokeWidth="0.8" /><polyline points="0,10 5,5 10,10" fill="none" stroke={C.text} strokeWidth="0.8" /></pattern>}
                        {p.value === 'waves' && <pattern id={`pp-${p.value}`} width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0,5 Q2.5,0 5,5 T10,5" fill="none" stroke={C.text} strokeWidth="0.8" /></pattern>}
                      </defs>
                      <rect width="40" height="32" fill={`url(#pp-${p.value})`} />
                    </svg>
                    <span style={{ position: 'absolute', bottom: 1, left: 0, right: 0, fontSize: 7, color: C.dim, textAlign: 'center' }}>{p.label}</span>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, color: C.dim, marginBottom: 1 }}>Pattern Color</div>
                  <InlineColorSwatch C={C} value={sel.patternColor ?? '#ffffff'} onChange={(c) => updEl(sel.id, { patternColor: c })} width={32} height={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, color: C.dim, marginBottom: 1 }}>Size {sel.patternSize ?? 20}px</div>
                  <input type="range" min={10} max={50} value={sel.patternSize ?? 20} onChange={(e) => updEl(sel.id, { patternSize: +e.target.value })} style={{ width: '100%', accentColor: '#888' }} />
                </div>
              </div>
            </div>
          )}
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          {sel.type === 'rect' && <div><div style={labelStyle}>{t('thumbs.props.rounding')}</div><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="range" min={0} max={50} value={sel.borderR ?? 0} onChange={(e) => updEl(sel.id, { borderR: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} /><span style={{ fontSize: 9, color: C.dim, minWidth: 20, textAlign: 'right' }}>{sel.borderR ?? 0}px</span></div></div>}
          {/* Border color + width + dash style */}
          <div>
            <div style={labelStyle}>Border</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <InlineColorSwatch C={C} value={sel.borderColor ?? '#ffffff'} onChange={(c) => updEl(sel.id, { borderColor: c })} />
              <input type="range" min={0} max={12} step={1} value={sel.borderWidth ?? 0} onChange={(e) => updEl(sel.id, { borderWidth: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} />
              <span style={{ fontSize: 9, color: C.dim, minWidth: 20, textAlign: 'right' }}>{sel.borderWidth ?? 0}px</span>
            </div>
            {/* Border dash style */}
            {(sel.borderWidth ?? 0) > 0 && (
              <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                  <button key={style} onClick={() => updEl(sel.id, { borderDash: style })} style={{ flex: 1, padding: '3px 0', borderRadius: 4, border: `1px solid ${(sel.borderDash ?? 'solid') === style ? C.accent : C.border}`, background: (sel.borderDash ?? 'solid') === style ? C.accent + '18' : 'transparent', color: (sel.borderDash ?? 'solid') === style ? C.accent : C.sub, fontSize: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>{style}</button>
                ))}
              </div>
            )}
          </div>
          {/* Shape Shadow */}
          <ShapeShadowControl C={C} value={sel.shapeShadow} onChange={(v) => updEl(sel.id, { shapeShadow: v })} labelStyle={labelStyle} />
          {/* Quick Shadow Presets */}
          <QuickShadowPresets C={C} value={sel.shapeShadow} onChange={(v) => updEl(sel.id, { shapeShadow: v })} labelStyle={labelStyle} />
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <SizeInputs C={C} w={sel.w} h={sel.h} proportionLocked={sel.proportionLocked} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <LockAspectToggle C={C} value={sel.lockAspect} onChange={(v) => updEl(sel.id, { lockAspect: v })} />
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          {/* Blend Mode */}
          <BlendModeSelect C={C} value={sel.blendMode} onChange={(v) => updEl(sel.id, { blendMode: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          {/* Visual Effects */}
          <EffectsSection C={C} sel={sel} updEl={updEl} pushHistory={pushHistory} labelStyle={labelStyle} />
          {/* Flip */}
          <FlipButtons C={C} id={sel.id} flipX={sel.flipX} flipY={sel.flipY} flipHorizontal={flipHorizontal} flipVertical={flipVertical} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} moveUp={moveUp} moveDown={moveDown} delEl={delEl} />
        </div>
      )}

      {sel && sel.type === 'image' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ width: '100%', aspectRatio: '16/9', background: C.surface, borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.border}` }}><img src={sel.src} alt={t('thumbs.props.previewImage')} decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
          {/* Replace Image */}
          <button onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = () => {
              const file = input.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const result = ev.target?.result;
                if (typeof result === 'string') replaceImage(sel.id, result);
              };
              reader.readAsDataURL(file);
            };
            input.click();
          }} style={{ width: '100%', padding: '6px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Replace Image
          </button>
          {/* Extract Color Palette from Image */}
          <ImagePaletteExtractor C={C} src={sel.src} onApply={(c) => {
            // Apply extracted color: copy to clipboard and show toast, or apply to a selected text/shape
            navigator.clipboard?.writeText(c).catch(() => {});
            toast.success(`Copied ${c}`);
            addToRecentColors(c);
          }} labelStyle={labelStyle} />
          {/* Image Fit Mode */}
          <div>
            <div style={labelStyle}>Fit Mode</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
              {([
                { val: 'cover' as const, label: 'Cover', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l4-4 4 4 4-4 6 6"/></svg> },
                { val: 'contain' as const, label: 'Contain', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="6" y="6" width="12" height="12" rx="1"/></svg> },
                { val: 'fill' as const, label: 'Fill', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 3l18 18M3 21L21 3"/></svg> },
                { val: 'none' as const, label: 'None', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/></svg> },
              ] as const).map((fit) => {
                const isActive = (sel.objectFit ?? 'cover') === fit.val;
                return (
                  <button key={fit.val} onClick={() => updEl(sel.id, { objectFit: fit.val })} title={fit.label} style={{ padding: '5px 2px', borderRadius: 5, border: `1px solid ${isActive ? C.blue + '55' : C.border}`, background: isActive ? C.blue + '14' : 'transparent', color: isActive ? C.blue : C.sub, fontSize: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    {fit.icon}
                    <span>{fit.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* AI Remove Background */}
          <AIRemoveBackgroundButton C={C} sel={sel} updEl={updEl} pushHistory={pushHistory} />
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          <div><div style={labelStyle}>{t('thumbs.props.rounding')}</div><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="range" min={0} max={60} value={sel.borderR ?? 0} onChange={(e) => updEl(sel.id, { borderR: +e.target.value })} style={{ flex: 1, accentColor: '#888' }} /><span style={{ fontSize: 9, color: C.dim, minWidth: 20, textAlign: 'right' }}>{sel.borderR ?? 0}</span></div></div>
          {/* Image Shadow */}
          <ShapeShadowControl C={C} value={sel.shapeShadow} onChange={(v) => updEl(sel.id, { shapeShadow: v })} labelStyle={labelStyle} />
          {/* Quick Shadow Presets */}
          <QuickShadowPresets C={C} value={sel.shapeShadow} onChange={(v) => updEl(sel.id, { shapeShadow: v })} labelStyle={labelStyle} />
          {/* Image Filter Presets */}
          <ImageFilterPresets C={C} sel={sel} updEl={updEl} labelStyle={labelStyle} />
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <SizeInputs C={C} w={sel.w} h={sel.h} proportionLocked={sel.proportionLocked} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <LockAspectToggle C={C} value={sel.lockAspect ?? true} onChange={(v) => updEl(sel.id, { lockAspect: v })} />
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          {/* Blend Mode */}
          <BlendModeSelect C={C} value={sel.blendMode} onChange={(v) => updEl(sel.id, { blendMode: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          {/* Visual Effects */}
          <EffectsSection C={C} sel={sel} updEl={updEl} pushHistory={pushHistory} labelStyle={labelStyle} />
          {/* Crop */}
          <CropControl C={C} sel={sel} updEl={updEl} pushHistory={pushHistory} />
          {/* Flip */}
          <FlipButtons C={C} id={sel.id} flipX={sel.flipX} flipY={sel.flipY} flipHorizontal={flipHorizontal} flipVertical={flipVertical} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} moveUp={moveUp} moveDown={moveDown} delEl={delEl} />
        </div>
      )}

      {sel && sel.type === 'path' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: C.sub }}>{t('thumbs.props.drawnElement')}</div>
          <ColorWithHex C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} label={t('thumbs.props.color')} />
          <ColorPresets C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} />
          <ColorHarmony C={C} value={sel.color} onChange={(c) => updEl(sel.id, { color: c })} />
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <SizeInputs C={C} w={sel.w} h={sel.h} proportionLocked={sel.proportionLocked} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          <FlipButtons C={C} id={sel.id} flipX={sel.flipX} flipY={sel.flipY} flipHorizontal={flipHorizontal} flipVertical={flipVertical} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} moveUp={moveUp} moveDown={moveDown} delEl={delEl} />
        </div>
      )}

      {/* Line / Arrow */}
      {sel && (sel.type === 'line' || sel.type === 'arrow') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}>{sel.type === 'arrow' ? t('thumbs.props.arrowLabel') : t('thumbs.props.lineLabel')}</div>
          <ColorWithHex C={C} value={sel.strokeColor ?? '#ffffff'} onChange={(c) => updEl(sel.id, { strokeColor: c })} label={t('thumbs.props.strokeColor')} />
          <ColorPresets C={C} value={sel.strokeColor ?? '#ffffff'} onChange={(c) => updEl(sel.id, { strokeColor: c })} />
          <ColorHarmony C={C} value={sel.strokeColor ?? '#ffffff'} onChange={(c) => updEl(sel.id, { strokeColor: c })} />
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
          <SizeInputs C={C} w={sel.w} h={sel.h} proportionLocked={sel.proportionLocked} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          <FlipButtons C={C} id={sel.id} flipX={sel.flipX} flipY={sel.flipY} flipHorizontal={flipHorizontal} flipVertical={flipVertical} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} moveUp={moveUp} moveDown={moveDown} delEl={delEl} />
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
          <FlipButtons C={C} id={sel.id} flipX={sel.flipX} flipY={sel.flipY} flipHorizontal={flipHorizontal} flipVertical={flipVertical} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} moveUp={moveUp} moveDown={moveDown} delEl={delEl} />
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
          {/* Header row toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => updEl(sel.id, { headerRow: !sel.headerRow })}
              style={{
                ...btnSmall,
                padding: '4px 8px',
                background: sel.headerRow ? C.accentDim : 'transparent',
                color: sel.headerRow ? C.accent : C.sub,
                border: `1px solid ${sel.headerRow ? C.accent + '55' : C.border}`,
              }}
            >
              {sel.headerRow ? '✓' : ''} {t('thumbs.props.headerRow')}
            </button>
          </div>
          {/* Header color (only when header row enabled) */}
          {sel.headerRow && (
            <ColorWithHex C={C} value={sel.headerColor ?? '#3a7bfd'} onChange={(c) => updEl(sel.id, { headerColor: c })} label={t('thumbs.props.headerColor')} />
          )}
          {/* Cell background color */}
          <ColorWithHex C={C} value={sel.tableCellBg ?? 'transparent'} onChange={(c) => updEl(sel.id, { tableCellBg: c })} label={t('thumbs.props.cellBg')} />
          {/* Table border color */}
          <ColorWithHex C={C} value={sel.tableBorderColor ?? ((sel.strokeColor ?? 'rgba(255,255,255,.2)').startsWith('rgba') ? '#ffffff' : sel.strokeColor ?? '#ffffff')} onChange={(c) => updEl(sel.id, { tableBorderColor: c, strokeColor: c })} label={t('thumbs.props.borderColor')} />
          <OpacitySlider C={C} value={sel.opacity ?? 1} onChange={(v) => updEl(sel.id, { opacity: v })} />
          <PositionInputs C={C} x={sel.x} y={sel.y} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <SizeInputs C={C} w={sel.w} h={sel.h} proportionLocked={sel.proportionLocked} onChange={(p) => updEl(sel.id, p)} inputStyle={inputStyle} labelStyle={labelStyle} />
          <RotationInput C={C} value={sel.rot} onChange={(v) => updEl(sel.id, { rot: v })} labelStyle={labelStyle} inputStyle={inputStyle} />
          <FlipButtons C={C} id={sel.id} flipX={sel.flipX} flipY={sel.flipY} flipHorizontal={flipHorizontal} flipVertical={flipVertical} />
          <OrderButtons C={C} id={sel.id} bringFront={bringFront} sendBack={sendBack} moveUp={moveUp} moveDown={moveDown} delEl={delEl} />
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

const RECENT_FONTS_KEY = 'tubeforge-recent-fonts';
const MAX_RECENT_FONTS = 5;

function getRecentFonts(): string[] {
  try {
    const saved = localStorage.getItem(RECENT_FONTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [];
}

function addRecentFont(family: string): void {
  try {
    const recent = getRecentFonts().filter((f) => f !== family);
    recent.unshift(family);
    localStorage.setItem(RECENT_FONTS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT_FONTS)));
  } catch { /* ignore */ }
}

function FontPicker({ C, value, onChange, inputStyle, labelStyle }: { C: Theme; value: string; onChange: (f: string) => void; inputStyle: React.CSSProperties; labelStyle: React.CSSProperties }) {
  const t = useLocaleStore((s) => s.t);
  const [open, setOpen] = useState(false);
  const [fontSearch, setFontSearch] = useState('');
  const [recentFonts, setRecentFonts] = useState<string[]>([]);

  // Load recent fonts on mount
  useEffect(() => { setRecentFonts(getRecentFonts()); }, []);

  // Preload popular fonts on first mount
  useEffect(() => { preloadPopularFonts(); }, []);

  const handleSelect = useCallback((family: string) => {
    const entry = FONT_LIBRARY.find((f) => f.family === family);
    if (entry) loadGoogleFont(family, entry.weights);
    addRecentFont(family);
    setRecentFonts(getRecentFonts());
    onChange(family);
    setOpen(false);
    setFontSearch('');
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
          {/* Font search */}
          <input
            type="text"
            placeholder="Search fonts..."
            value={fontSearch}
            onChange={(e) => setFontSearch(e.target.value)}
            autoFocus
            style={{
              width: '100%', padding: '5px 8px', background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 5, color: C.text, fontSize: 10, fontFamily: 'inherit', boxSizing: 'border-box',
              outline: 'none', marginBottom: 4, position: 'sticky', top: 0, zIndex: 1,
            }}
          />
          {/* Recent Fonts */}
          {recentFonts.length > 0 && !fontSearch && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: 0.5, padding: '6px 6px 2px', userSelect: 'none' }}>
                Recent
              </div>
              {recentFonts.map((family) => {
                const entry = FONT_LIBRARY.find((f) => f.family === family);
                return (
                  <button
                    key={`recent-${family}`}
                    onClick={() => handleSelect(family)}
                    onMouseEnter={() => { if (entry) loadGoogleFont(family, entry.weights); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
                      border: 'none', borderRadius: 5, background: value === family ? C.accentDim : 'transparent',
                      color: value === family ? C.accent : C.text, fontFamily: family, fontSize: 12, cursor: 'pointer',
                      textAlign: 'left', transition: 'background .1s', boxSizing: 'border-box',
                    }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{family}</span>
                    <span style={{ fontSize: 8, color: C.orange, background: C.orange + '18', padding: '1px 4px', borderRadius: 3, fontWeight: 600, fontFamily: 'inherit', flexShrink: 0 }}>RECENT</span>
                  </button>
                );
              })}
              <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
            </div>
          )}
          {FONT_CATEGORIES.map((cat) => {
            const searchLower = fontSearch.toLowerCase();
            const fonts = FONT_LIBRARY.filter((f) => f.category === cat && f.family.toLowerCase().includes(searchLower));
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

// C3: Color picker with HEX text input, presets, recent colors, and eyedropper
const COLOR_PICKER_PRESETS = [
  '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b',
];

async function pickColorFromScreen(): Promise<string | null> {
  if (!('EyeDropper' in window)) return null;
  try {
    const dropper = new (window as any).EyeDropper();
    const result = await dropper.open();
    return result.sRGBHex as string;
  } catch {
    return null;
  }
}

function addToRecentColors(color: string) {
  try {
    const stored = JSON.parse(localStorage.getItem('tf-recent-colors') || '[]') as string[];
    const filtered = stored.filter((c: string) => c !== color);
    const updated = [color, ...filtered].slice(0, 12);
    localStorage.setItem('tf-recent-colors', JSON.stringify(updated));
    return updated;
  } catch {
    return [color];
  }
}

function ColorPicker({ C, value, onChange, label }: { C: Theme; value: string | undefined; onChange: (c: string) => void; label?: string }) {
  const color = value ?? '#ffffff';
  let hexForPicker = color;
  if (color.startsWith('rgba') || color.startsWith('rgb')) hexForPicker = '#ffffff';
  const [showPicker, setShowPicker] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('tf-recent-colors') || '[]'); } catch { return []; }
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  const handleChange = (c: string) => {
    onChange(c);
  };

  const handleCommitColor = (c: string) => {
    onChange(c);
    const updated = addToRecentColors(c);
    setRecent(updated);
  };

  const handleEyeDropper = async () => {
    const picked = await pickColorFromScreen();
    if (picked) {
      handleCommitColor(picked);
    }
  };

  return (
    <div ref={pickerRef} style={{ position: 'relative' }}>
      {label && <div style={{ fontSize: 11, color: C.sub, marginBottom: 4, fontWeight: 600 }}>{label}</div>}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {/* Color swatch button */}
        <button onClick={() => setShowPicker(!showPicker)} style={{
          width: 32, height: 28, borderRadius: 6, background: color,
          border: `2px solid ${C.border}`, cursor: 'pointer', flexShrink: 0, padding: 0,
        }} aria-label="Open color picker" />
        {/* Hex input inline */}
        <input
          type="text"
          key={color}
          defaultValue={color.toUpperCase()}
          onBlur={(e) => {
            let v = e.target.value.trim();
            if (!v.startsWith('#')) v = '#' + v;
            if (/^#[0-9a-fA-F]{6}$/.test(v)) handleCommitColor(v.toLowerCase());
            else e.target.value = color.toUpperCase();
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          style={{ flex: 1, padding: '4px 6px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, color: C.text, fontSize: 10, fontFamily: 'monospace', boxSizing: 'border-box' as const, outline: 'none' }}
        />
        {/* Eyedropper button */}
        {'EyeDropper' in (typeof window !== 'undefined' ? window : {}) && (
          <button onClick={handleEyeDropper} title="Pick color from screen" style={{
            width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface,
            color: C.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22l1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="M14.5 5.5l4 4"/><path d="M18.5 1.5a2.121 2.121 0 013 3L16 10l-4-4 5.5-5.5z"/></svg>
          </button>
        )}
      </div>

      {showPicker && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, width: 210, boxShadow: '0 8px 32px rgba(0,0,0,.25)' }}>
          {/* Native color input (full width) */}
          <input type="color" value={hexForPicker} onChange={(e) => handleChange(e.target.value)} onBlur={(e) => { const v = (e.target as HTMLInputElement).value; addToRecentColors(v); setRecent(addToRecentColors(v)); }} style={{ width: '100%', height: 32, border: `1px solid ${C.border}`, borderRadius: 6, padding: 1, cursor: 'pointer', background: C.surface }} />

          {/* Hex text input */}
          <input
            type="text"
            key={color + '-popup'}
            defaultValue={color.toUpperCase()}
            onBlur={(e) => {
              let v = e.target.value.trim();
              if (!v.startsWith('#')) v = '#' + v;
              if (/^#[0-9a-fA-F]{6}$/.test(v)) handleCommitColor(v.toLowerCase());
              else e.target.value = color.toUpperCase();
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            style={{ width: '100%', marginTop: 8, padding: '6px 8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12, fontFamily: 'monospace', boxSizing: 'border-box' as const, outline: 'none' }}
          />

          {/* Preset swatches */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, marginTop: 8 }}>
            {COLOR_PICKER_PRESETS.map((c) => (
              <button key={c} onClick={() => handleCommitColor(c)} style={{
                width: 26, height: 26, borderRadius: 4, background: c,
                border: color === c ? '2px solid #fff' : `1px solid ${C.border}`,
                cursor: 'pointer', padding: 0,
              }} aria-label={`Color ${c}`} />
            ))}
          </div>

          {/* Recent colors */}
          {recent.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 8, marginBottom: 4 }}>Recent</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {recent.slice(0, 6).map((c) => (
                  <button key={c} onClick={() => handleChange(c)} style={{
                    width: 26, height: 26, borderRadius: 4, background: c,
                    border: color === c ? '2px solid #fff' : `1px solid ${C.border}`,
                    cursor: 'pointer', padding: 0,
                  }} aria-label={`Recent color ${c}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Backward-compatible alias
function ColorWithHex(props: { C: Theme; value: string | undefined; onChange: (c: string) => void; label?: string }) {
  return <ColorPicker {...props} />;
}

// Compact inline color swatch with popover picker (replaces raw <input type="color">)
function InlineColorSwatch({ C, value, onChange, width = 28, height = 24 }: { C: Theme; value: string; onChange: (c: string) => void; width?: number; height?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('tf-recent-colors') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleCommit = (c: string) => {
    onChange(c);
    const updated = addToRecentColors(c);
    setRecent(updated);
  };

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(!open)} style={{
        width, height, borderRadius: 5, background: value,
        border: `1px solid ${C.border}`, cursor: 'pointer', padding: 0,
      }} aria-label="Pick color" />
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 4, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, width: 190, boxShadow: '0 8px 32px rgba(0,0,0,.25)' }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} onBlur={(e) => { handleCommit((e.target as HTMLInputElement).value); }} style={{ width: '100%', height: 28, border: `1px solid ${C.border}`, borderRadius: 5, padding: 1, cursor: 'pointer', background: C.surface }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3, marginTop: 6 }}>
            {COLOR_PICKER_PRESETS.map((c) => (
              <button key={c} onClick={() => handleCommit(c)} style={{
                width: 24, height: 24, borderRadius: 3, background: c,
                border: value === c ? '2px solid #fff' : `1px solid ${C.border}`,
                cursor: 'pointer', padding: 0,
              }} />
            ))}
          </div>
          {recent.length > 0 && (
            <>
              <div style={{ fontSize: 9, color: C.dim, marginTop: 6, marginBottom: 3 }}>Recent</div>
              <div style={{ display: 'flex', gap: 3 }}>
                {recent.slice(0, 6).map((c) => (
                  <button key={c} onClick={() => onChange(c)} style={{
                    width: 24, height: 24, borderRadius: 3, background: c,
                    border: `1px solid ${C.border}`, cursor: 'pointer', padding: 0,
                  }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
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
              <InlineColorSwatch C={C} value={cColor} onChange={(c) => { setCColor(c); applyCustom(cX, cY, cBlur, c, cAlpha); }} width={32} height={26} />
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
  const t = useLocaleStore((s) => s.t);
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
        <span>{t('thumbs.shadow')}</span>
        <button onClick={() => { if (enabled) onChange(undefined); else { apply(offX, offY, blur, color, alpha); } }} style={{ background: 'none', border: 'none', color: enabled ? C.blue : C.dim, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '1px 4px' }}>{enabled ? t('ui.on') : t('ui.off')}</button>
      </div>
      {enabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 6, background: C.surface, borderRadius: 6, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: C.dim, marginBottom: 1 }}>X</div><input type="range" min={-20} max={20} value={offX} onChange={(e) => { setOffX(+e.target.value); apply(+e.target.value, offY, blur, color, alpha); }} style={{ width: '100%', accentColor: '#888' }} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: C.dim, marginBottom: 1 }}>Y</div><input type="range" min={-20} max={20} value={offY} onChange={(e) => { setOffY(+e.target.value); apply(offX, +e.target.value, blur, color, alpha); }} style={{ width: '100%', accentColor: '#888' }} /></div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: C.dim, marginBottom: 1 }}>Blur</div><input type="range" min={0} max={40} value={blur} onChange={(e) => { setBlur(+e.target.value); apply(offX, offY, +e.target.value, color, alpha); }} style={{ width: '100%', accentColor: '#888' }} /></div>
            <InlineColorSwatch C={C} value={color} onChange={(c) => { setColor(c); apply(offX, offY, blur, c, alpha); }} width={24} height={24} />
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
  const t = useLocaleStore((s) => s.t);
  const [expanded, setExpanded] = useState(false);
  const hasImageFilters = !!((sel.grayscale !== undefined && sel.grayscale > 0) || (sel.sepia !== undefined && sel.sepia > 0) || (sel.hueRotate !== undefined && sel.hueRotate > 0) || (sel.saturate !== undefined && sel.saturate !== 100) || sel.invert);
  const hasEffects = !!(sel.textGradient || sel.glow || (sel.blur && sel.blur > 0) || (sel.brightness !== undefined && sel.brightness !== 100) || (sel.contrast !== undefined && sel.contrast !== 100) || hasImageFilters);
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
          {expanded ? t('ui.hide') : hasEffects ? t('ui.on') : t('ui.off')}
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
                  {sel.textGradient ? t('ui.on') : t('ui.off')}
                </button>
              </div>
              {sel.textGradient && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Gradient preview bar */}
                  <div style={{ width: '100%', height: 12, borderRadius: 4, background: `linear-gradient(${sel.textGradient.angle}deg, ${sel.textGradient.from}${sel.textGradient.mid ? `, ${sel.textGradient.mid}` : ''}, ${sel.textGradient.to})`, border: `1px solid ${C.border}` }} />
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 8, color: C.dim, marginBottom: 1 }}>From</div>
                      <InlineColorSwatch C={C} value={sel.textGradient.from} onChange={(c) => updEl(sel.id, { textGradient: { ...sel.textGradient!, from: c } })} width={32} height={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 8, color: C.dim, marginBottom: 1 }}>Mid</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <InlineColorSwatch C={C} value={sel.textGradient.mid ?? '#888888'} onChange={(c) => updEl(sel.id, { textGradient: { ...sel.textGradient!, mid: c } })} width={sel.textGradient.mid ? 26 : 26} height={22} />
                        {sel.textGradient.mid ? (
                          <button onClick={() => updEl(sel.id, { textGradient: { ...sel.textGradient!, mid: undefined } })} style={{ background: 'none', border: 'none', color: C.dim, fontSize: 10, cursor: 'pointer', padding: 0, lineHeight: 1 }} title="Remove middle color">&times;</button>
                        ) : (
                          <button onClick={() => updEl(sel.id, { textGradient: { ...sel.textGradient!, mid: '#888888' } })} style={{ background: 'none', border: 'none', color: C.dim, fontSize: 8, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }} title="Add middle color">+</button>
                        )}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 8, color: C.dim, marginBottom: 1 }}>To</div>
                      <InlineColorSwatch C={C} value={sel.textGradient.to} onChange={(c) => updEl(sel.id, { textGradient: { ...sel.textGradient!, to: c } })} width={32} height={22} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8, color: C.dim, marginBottom: 1 }}>Angle</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input type="range" min={0} max={360} value={sel.textGradient.angle} onChange={(e) => updEl(sel.id, { textGradient: { ...sel.textGradient!, angle: +e.target.value } })} style={{ flex: 1, accentColor: '#888' }} />
                      <span style={{ fontSize: 8, color: C.dim, minWidth: 24, textAlign: 'right' }}>{sel.textGradient.angle}deg</span>
                    </div>
                  </div>
                  {/* Gradient Presets */}
                  <div>
                    <div style={{ fontSize: 8, color: C.dim, marginBottom: 3 }}>Presets</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
                      {GRADIENT_PRESETS.map((p) => (
                        <button key={p.name} title={p.name} onClick={() => { pushHistory(); updEl(sel.id, { textGradient: { from: p.from, to: p.to, mid: p.mid, angle: p.angle } }); }} style={{ width: '100%', height: 20, borderRadius: 4, border: `1px solid ${C.border}`, background: `linear-gradient(${p.angle}deg, ${p.from}${p.mid ? `, ${p.mid}` : ''}, ${p.to})`, cursor: 'pointer', padding: 0 }} />
                      ))}
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
                {sel.glow ? t('ui.on') : t('ui.off')}
              </button>
            </div>
            {sel.glow && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <InlineColorSwatch C={C} value={sel.glow.color} onChange={(c) => updEl(sel.id, { glow: { ...sel.glow!, color: c } })} width={24} height={22} />
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

          {/* Image Filters (images only) */}
          {isImage && (
            <>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 6, marginTop: 2 }}>
                <span style={{ fontSize: 9, color: C.sub, fontWeight: 600 }}>Filters</span>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: C.sub, fontWeight: 600 }}>Grayscale</span>
                  <span style={{ fontSize: 8, color: C.dim }}>{sel.grayscale ?? 0}%</span>
                </div>
                <input type="range" min={0} max={100} value={sel.grayscale ?? 0} onChange={(e) => updEl(sel.id, { grayscale: +e.target.value })} style={{ width: '100%', accentColor: '#888' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: C.sub, fontWeight: 600 }}>Sepia</span>
                  <span style={{ fontSize: 8, color: C.dim }}>{sel.sepia ?? 0}%</span>
                </div>
                <input type="range" min={0} max={100} value={sel.sepia ?? 0} onChange={(e) => updEl(sel.id, { sepia: +e.target.value })} style={{ width: '100%', accentColor: '#888' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: C.sub, fontWeight: 600 }}>Hue Rotate</span>
                  <span style={{ fontSize: 8, color: C.dim }}>{sel.hueRotate ?? 0}deg</span>
                </div>
                <input type="range" min={0} max={360} value={sel.hueRotate ?? 0} onChange={(e) => updEl(sel.id, { hueRotate: +e.target.value })} style={{ width: '100%', accentColor: '#888' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: C.sub, fontWeight: 600 }}>Saturate</span>
                  <span style={{ fontSize: 8, color: C.dim }}>{sel.saturate ?? 100}%</span>
                </div>
                <input type="range" min={0} max={200} value={sel.saturate ?? 100} onChange={(e) => updEl(sel.id, { saturate: +e.target.value })} style={{ width: '100%', accentColor: '#888' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, color: C.sub, fontWeight: 600 }}>Invert</span>
                <button
                  onClick={() => updEl(sel.id, { invert: !sel.invert })}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: sel.invert ? C.accent : C.dim,
                    fontSize: 8,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    padding: '1px 4px',
                  }}
                >
                  {sel.invert ? t('ui.on') : t('ui.off')}
                </button>
              </div>
            </>
          )}

          {/* Reset all effects button */}
          {hasEffects && (
            <button
              onClick={() => {
                pushHistory();
                updEl(sel.id, { textGradient: undefined, glow: undefined, blur: undefined, brightness: undefined, contrast: undefined, grayscale: undefined, sepia: undefined, hueRotate: undefined, saturate: undefined, invert: undefined });
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


// Blend Mode dropdown
function BlendModeSelect({ C, value, onChange, labelStyle, inputStyle }: { C: Theme; value: string | undefined; onChange: (v: string) => void; labelStyle: React.CSSProperties; inputStyle: React.CSSProperties }) {
  return (
    <div>
      <div style={labelStyle}>Blend Mode</div>
      <select
        value={value ?? 'normal'}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      >
        {BLEND_MODE_OPTIONS.map((mode) => (
          <option key={mode} value={mode}>{mode.charAt(0).toUpperCase() + mode.slice(1).replace(/-/g, ' ')}</option>
        ))}
      </select>
    </div>
  );
}

// Quick Shadow Presets
function QuickShadowPresets({ C, value, onChange, labelStyle }: { C: Theme; value: string | undefined; onChange: (v: string | undefined) => void; labelStyle: React.CSSProperties }) {
  const buildShadow = (preset: typeof QUICK_SHADOW_PRESETS[number]) => {
    if (!preset.shadow) return undefined;
    const { x, y, blur, color, alpha } = preset.shadow;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${x}px ${y}px ${blur}px rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <div>
      <div style={labelStyle}>Shadow Presets</div>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {QUICK_SHADOW_PRESETS.map((preset) => {
          const shadowVal = buildShadow(preset);
          const isActive = (!value || value === 'none') ? !preset.shadow : value === shadowVal;
          return (
            <button
              key={preset.name}
              onClick={() => onChange(shadowVal)}
              style={{
                padding: '3px 6px',
                borderRadius: 4,
                border: `1px solid ${isActive ? C.blue + '55' : C.border}`,
                background: isActive ? C.blue + '14' : 'transparent',
                color: isActive ? C.blue : C.dim,
                fontSize: 8,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {preset.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Image Filter Presets (1-click)
function ImageFilterPresets({ C, sel, updEl, labelStyle }: { C: Theme; sel: CanvasElement; updEl: (id: string, patch: Partial<CanvasElement>) => void; labelStyle: React.CSSProperties }) {
  const applyFilter = (filters: Record<string, number | undefined>) => {
    updEl(sel.id, {
      grayscale: filters.grayscale ?? 0,
      sepia: filters.sepia ?? 0,
      hueRotate: filters.hueRotate ?? 0,
      saturate: filters.saturate ?? 100,
      brightness: filters.brightness ?? 100,
      contrast: filters.contrast ?? 100,
    });
  };

  return (
    <div>
      <div style={labelStyle}>Filters</div>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {IMAGE_FILTER_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => applyFilter(preset.filters as Record<string, number | undefined>)}
            style={{
              padding: '3px 6px',
              borderRadius: 4,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.sub,
              fontSize: 8,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .1s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.accent; (e.currentTarget as HTMLElement).style.color = C.accent; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.sub; }}
          >
            {preset.name}
          </button>
        ))}
      </div>
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

// Flip Horizontal / Vertical buttons
const FlipButtons = memo(function FlipButtons({ C, id, flipX, flipY, flipHorizontal, flipVertical }: { C: Theme; id: string; flipX?: boolean; flipY?: boolean; flipHorizontal: (id: string) => void; flipVertical: (id: string) => void }) {
  const flipBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '5px',
    borderRadius: 6,
    border: `1px solid ${active ? C.blue + '55' : C.border}`,
    background: active ? C.blue + '14' : 'transparent',
    color: active ? C.blue : C.sub,
    fontSize: 9,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    transition: 'all .12s',
  });
  return (
    <div>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 4, fontWeight: 600 }}>Flip</div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => flipHorizontal(id)} style={flipBtnStyle(!!flipX)} title="Flip Horizontal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><polyline points="6 8 2 12 6 16"/><polyline points="18 8 22 12 18 16"/></svg>
          Horizontal
        </button>
        <button onClick={() => flipVertical(id)} style={flipBtnStyle(!!flipY)} title="Flip Vertical">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="8 6 12 2 16 6"/><polyline points="8 18 12 22 16 18"/></svg>
          Vertical
        </button>
      </div>
    </div>
  );
});

// Crop control (slider-based for images)
function CropControl({ C, sel, updEl, pushHistory }: { C: Theme; sel: CanvasElement; updEl: (id: string, patch: Partial<CanvasElement>) => void; pushHistory: () => void }) {
  const t = useLocaleStore((s) => s.t);
  const hasCrop = (sel.cropW !== undefined && sel.cropW < 1) || (sel.cropH !== undefined && sel.cropH < 1) || (sel.cropX !== undefined && sel.cropX > 0) || (sel.cropY !== undefined && sel.cropY > 0);
  const [expanded, setExpanded] = useState(false);
  const cropX = sel.cropX ?? 0;
  const cropY = sel.cropY ?? 0;
  const cropW = sel.cropW ?? 1;
  const cropH = sel.cropH ?? 1;

  const handleChange = (patch: Partial<CanvasElement>) => {
    updEl(sel.id, patch);
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 4, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.13 1L6 16a2 2 0 002 2h15"/><path d="M1 6.13L16 6a2 2 0 012 2v15"/></svg>
          Crop
        </span>
        <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', color: hasCrop ? C.accent : C.dim, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '1px 4px', display: 'flex', alignItems: 'center', gap: 2 }}>
          {expanded ? t('ui.hide') : hasCrop ? t('ui.on') : t('ui.off')}
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 6, background: C.surface, borderRadius: 6, border: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize: 9, color: C.dim, marginBottom: 1, display: 'flex', justifyContent: 'space-between' }}><span>Offset X</span><span>{Math.round(cropX * 100)}%</span></div>
            <input type="range" min={0} max={0.9} step={0.01} value={cropX} onChange={(e) => handleChange({ cropX: +e.target.value })} style={{ width: '100%', accentColor: '#888' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: C.dim, marginBottom: 1, display: 'flex', justifyContent: 'space-between' }}><span>Offset Y</span><span>{Math.round(cropY * 100)}%</span></div>
            <input type="range" min={0} max={0.9} step={0.01} value={cropY} onChange={(e) => handleChange({ cropY: +e.target.value })} style={{ width: '100%', accentColor: '#888' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: C.dim, marginBottom: 1, display: 'flex', justifyContent: 'space-between' }}><span>Width</span><span>{Math.round(cropW * 100)}%</span></div>
            <input type="range" min={0.1} max={1} step={0.01} value={cropW} onChange={(e) => handleChange({ cropW: +e.target.value })} style={{ width: '100%', accentColor: '#888' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: C.dim, marginBottom: 1, display: 'flex', justifyContent: 'space-between' }}><span>Height</span><span>{Math.round(cropH * 100)}%</span></div>
            <input type="range" min={0.1} max={1} step={0.01} value={cropH} onChange={(e) => handleChange({ cropH: +e.target.value })} style={{ width: '100%', accentColor: '#888' }} />
          </div>
          {hasCrop && (
            <button
              onClick={() => { pushHistory(); updEl(sel.id, { cropX: 0, cropY: 0, cropW: 1, cropH: 1 }); }}
              style={{ width: '100%', padding: '4px', borderRadius: 4, border: `1px solid ${C.accent}33`, background: 'transparent', color: C.accent, fontSize: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: 0.7 }}
            >
              Reset Crop
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Lock aspect ratio toggle
const LockAspectToggle = memo(function LockAspectToggle({ C, value, onChange }: { C: Theme; value?: boolean; onChange: (v: boolean) => void }) {
  const locked = value ?? false;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: -2 }}>
      <button
        onClick={() => onChange(!locked)}
        title={locked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 5,
          border: `1px solid ${locked ? C.blue + '55' : C.border}`,
          background: locked ? C.blue + '14' : 'transparent',
          color: locked ? C.blue : C.dim,
          fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {locked
          ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>
        }
        {locked ? 'Aspect locked' : 'Lock aspect'}
      </button>
    </div>
  );
});

const OrderButtons = memo(function OrderButtons({ C, id, bringFront, sendBack, moveUp, moveDown, delEl }: { C: Theme; id: string; bringFront: (id: string) => void; sendBack: (id: string) => void; moveUp: (id: string) => void; moveDown: (id: string) => void; delEl: (id: string) => void }) {
  const t = useLocaleStore((s) => s.t);
  const orderBtnStyle: React.CSSProperties = { flex: 1, padding: '5px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all .12s' };
  const orderSmallBtnStyle: React.CSSProperties = { ...orderBtnStyle, fontSize: 9, padding: '4px' };
  const upIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>;
  const downIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
  const doubleUpIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>;
  const doubleDownIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/></svg>;
  const trashIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;
  const hoverOn = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.borderColor = C.accent + '44'; };
  const hoverOff = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = C.border; };
  return (
    <>
      <div style={{ display: 'flex', gap: 4, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
        <button onClick={() => moveUp(id)} title="Move Up (Ctrl+])" style={orderSmallBtnStyle} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>{upIcon}</button>
        <button onClick={() => moveDown(id)} title="Move Down (Ctrl+[)" style={orderSmallBtnStyle} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>{downIcon}</button>
        <button onClick={() => bringFront(id)} title="Move to Top" style={orderSmallBtnStyle} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>{doubleUpIcon}</button>
        <button onClick={() => sendBack(id)} title="Move to Bottom" style={orderSmallBtnStyle} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>{doubleDownIcon}</button>
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
  const [layerSearch, setLayerSearch] = useState('');
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
  const searchLower = layerSearch.toLowerCase().trim();
  const matchingIds = searchLower
    ? new Set(
        els
          .filter((el) => {
            const name = getDisplayName(el).toLowerCase();
            const type = el.type.toLowerCase();
            return name.includes(searchLower) || type.includes(searchLower);
          })
          .map((el) => el.id)
      )
    : null;
  const filteredEls = matchingIds ? reversedEls.filter((el) => matchingIds.has(el.id)) : reversedEls;

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>{t('thumbs.layers.title')}</span>
        <span style={{ fontSize: 10, color: C.dim, fontWeight: 600, background: C.surface, padding: '1px 6px', borderRadius: 4 }}>{els.length}</span>
      </div>
      {/* Layer search input */}
      {els.length > 3 && (
        <div style={{ position: 'relative', marginBottom: 6 }}>
          <input
            type="text"
            value={layerSearch}
            onChange={(e) => setLayerSearch(e.target.value)}
            placeholder={t('thumbs.layers.searchPlaceholder')}
            aria-label={t('thumbs.layers.searchPlaceholder')}
            style={{
              width: '100%',
              fontSize: 11,
              fontWeight: 500,
              color: C.text,
              background: C.surface,
              border: `1px solid ${layerSearch ? C.accent + '55' : C.border}`,
              borderRadius: 6,
              padding: '5px 26px 5px 8px',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color .15s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.accent + '88'; }}
            onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = layerSearch ? C.accent + '55' : C.border; }}
          />
          {/* Search icon or clear button */}
          {layerSearch ? (
            <button
              onClick={() => setLayerSearch('')}
              title={t('thumbs.layers.clearSearch')}
              aria-label={t('thumbs.layers.clearSearch')}
              style={{
                position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                width: 18, height: 18, borderRadius: 4, border: 'none',
                background: 'transparent', color: C.sub, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontFamily: 'inherit', padding: 0,
              }}
            >
              &times;
            </button>
          ) : (
            <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: C.dim, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
          )}
        </div>
      )}
      {searchLower && filteredEls.length === 0 && (
        <div style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, color: C.dim }}>{t('thumbs.layers.noResults')}</div>
      )}
      {filteredEls.map((el) => {
        const isSel = selIds.includes(el.id);
        const isRenaming = renamingId === el.id;
        const isDragOver = dragOverId === el.id && dragId !== el.id;
        const isSearchMatch = matchingIds !== null && matchingIds.has(el.id);
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
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: 8, marginBottom: 2, background: isSel ? C.accentDim : (isSearchMatch && !isSel ? '#e040fb0c' : 'transparent'), border: `1px solid ${isDragOver ? C.accent : isSel ? C.accent + '33' : (isSearchMatch && !isSel ? '#e040fb22' : 'transparent')}`, cursor: isRenaming ? 'text' : 'pointer', transition: 'all .12s', opacity: dragId === el.id ? 0.4 : 1 }}
            onMouseEnter={(e) => { if (!isSel && !dragId) (e.currentTarget as HTMLElement).style.background = C.surface; }}
            onMouseLeave={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {/* Layer thumbnail preview */}
            {el.type === 'image' && el.src ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, flexShrink: 0, borderRadius: 4, overflow: 'hidden', background: C.surface, border: `1px solid ${isSel ? C.accent + '44' : C.border}` }}>
                <img src={el.src} alt="" style={{ width: 24, height: 24, objectFit: 'cover' }} />
              </span>
            ) : (el.type === 'rect' || el.type === 'circle' || el.type === 'triangle' || el.type === 'star') ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, flexShrink: 0, borderRadius: el.type === 'circle' ? '50%' : 4, background: el.bg && el.bg !== 'transparent' ? el.bg : (el.color ?? C.accent), border: `1px solid ${isSel ? C.accent + '44' : C.border}` }}>
                <span style={{ color: isSel ? '#fff' : C.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(0.65)' }}>{LAYER_ICONS[el.type] ?? LAYER_ICONS.rect}</span>
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, flexShrink: 0, color: isSel ? C.accent : C.dim, background: isSel ? C.accent + '14' : C.surface, borderRadius: 5 }}>
                {LAYER_ICONS[el.type] ?? LAYER_ICONS.rect}
              </span>
            )}
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
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 11, fontWeight: isSel ? 600 : 500, color: isSel ? C.text : C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getDisplayName(el)}
                </span>
                {el.type === 'text' && el.text && (
                  <span style={{ display: 'block', fontSize: 9, color: C.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                    {el.text.slice(0, 20)}{el.text.length > 20 ? '...' : ''}
                  </span>
                )}
              </div>
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


/** AI Enhance Text Button — suggests improved, more viral text for thumbnails */
function AIEnhanceTextButton({ C, sel, updEl, pushHistory }: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  sel: CanvasElement;
  updEl: (id: string, patch: Partial<CanvasElement>) => void;
  pushHistory: () => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const enhanceMutation = trpc.ai.enhanceText.useMutation({
    onSuccess: (data) => {
      if (data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      } else {
        toast.info('No suggestions generated');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to enhance text');
    },
  });

  const handleEnhance = () => {
    if (!sel.text?.trim()) {
      toast.info('Enter some text first');
      return;
    }
    setOpen(true);
    enhanceMutation.mutate({ text: sel.text });
  };

  const applySuggestion = (newText: string) => {
    pushHistory();
    updEl(sel.id, { text: newText });
    setOpen(false);
    setSuggestions([]);
    toast.success('Text updated');
  };

  return (
    <div>
      <button
        onClick={handleEnhance}
        disabled={enhanceMutation.isPending}
        style={{
          width: '100%',
          padding: '6px 10px',
          borderRadius: 6,
          border: `1px solid ${C.accent}33`,
          background: `linear-gradient(135deg, ${C.accent}12, ${C.pink ?? C.accent}12)`,
          color: C.accent,
          fontSize: 10,
          fontWeight: 700,
          cursor: enhanceMutation.isPending ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          opacity: enhanceMutation.isPending ? 0.7 : 1,
          transition: 'all .15s',
        }}
      >
        {enhanceMutation.isPending ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round" /></svg>
            Enhancing...
          </span>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Enhance with AI
          </>
        )}
      </button>
      {open && suggestions.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => applySuggestion(s)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 5,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.text,
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'all .12s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.accent + '14'; (e.currentTarget as HTMLElement).style.borderColor = C.accent + '55'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => { setOpen(false); setSuggestions([]); }}
            style={{ padding: '3px', background: 'none', border: 'none', color: C.dim, fontSize: 9, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

/** AI Remove Background Button — uses fal.ai BiRefNet to remove image backgrounds */
function AIRemoveBackgroundButton({ C, sel, updEl, pushHistory }: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  sel: CanvasElement;
  updEl: (id: string, patch: Partial<CanvasElement>) => void;
  pushHistory: () => void;
}) {
  const removeBgMutation = trpc.ai.removeBackground.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        pushHistory();
        updEl(sel.id, { src: data.url });
        toast.success('Background removed');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to remove background');
    },
  });

  const handleRemoveBg = () => {
    if (!sel.src) {
      toast.info('No image source');
      return;
    }
    removeBgMutation.mutate({ imageUrl: sel.src });
  };

  return (
    <button
      onClick={handleRemoveBg}
      disabled={removeBgMutation.isPending}
      style={{
        width: '100%',
        padding: '6px 10px',
        borderRadius: 6,
        border: `1px solid ${C.accent}33`,
        background: `linear-gradient(135deg, ${C.accent}12, ${C.pink ?? C.accent}12)`,
        color: C.accent,
        fontSize: 10,
        fontWeight: 700,
        cursor: removeBgMutation.isPending ? 'wait' : 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        opacity: removeBgMutation.isPending ? 0.7 : 1,
        transition: 'all .15s',
      }}
    >
      {removeBgMutation.isPending ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round" /></svg>
          Removing...
        </span>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 3l18 18"/></svg>
          Remove Background
        </>
      )}
    </button>
  );
}

// ============================================================
// Color Harmony — show complementary/analogous/triadic/split colors
// ============================================================

function hexToHsl(hex: string): [number, number, number] {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, color))).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function getHarmonyColors(hex: string): { complementary: string; analogous: string[]; triadic: string[]; split: string[] } {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return { complementary: hex, analogous: [hex, hex], triadic: [hex, hex], split: [hex, hex] };
  const [h, s, l] = hexToHsl(hex);
  return {
    complementary: hslToHex(h + 180, s, l),
    analogous: [hslToHex(h - 30, s, l), hslToHex(h + 30, s, l)],
    triadic: [hslToHex(h + 120, s, l), hslToHex(h + 240, s, l)],
    split: [hslToHex(h + 150, s, l), hslToHex(h + 210, s, l)],
  };
}

const ColorHarmony = memo(function ColorHarmony({ C, value, onChange }: { C: Theme; value: string | undefined; onChange: (c: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const color = value ?? '#ffffff';
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return null;
  const harmony = getHarmonyColors(color);

  const swatchStyle = (c: string): React.CSSProperties => ({
    width: 20, height: 20, borderRadius: 4, background: c,
    border: `1.5px solid ${C.border}`, cursor: 'pointer', padding: 0, flexShrink: 0,
  });

  const groupLabel: React.CSSProperties = { fontSize: 8, color: C.dim, minWidth: 56, textAlign: 'right' as const, flexShrink: 0 };

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill={C.sub} opacity="0.3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
        <span style={{ fontSize: 10, color: C.sub, fontWeight: 600, flex: 1, textAlign: 'left' }}>Color Harmony</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {expanded && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {/* Complementary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={groupLabel}>Compl.</span>
            <button onClick={() => onChange(harmony.complementary)} style={swatchStyle(harmony.complementary)} title={`Complementary: ${harmony.complementary}`} />
          </div>
          {/* Analogous */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={groupLabel}>Analogous</span>
            {harmony.analogous.map((c, i) => <button key={i} onClick={() => onChange(c)} style={swatchStyle(c)} title={`Analogous: ${c}`} />)}
          </div>
          {/* Triadic */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={groupLabel}>Triadic</span>
            {harmony.triadic.map((c, i) => <button key={i} onClick={() => onChange(c)} style={swatchStyle(c)} title={`Triadic: ${c}`} />)}
          </div>
          {/* Split Compl */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={groupLabel}>Split</span>
            {harmony.split.map((c, i) => <button key={i} onClick={() => onChange(c)} style={swatchStyle(c)} title={`Split complementary: ${c}`} />)}
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================================
// WCAG Contrast Checker — for text vs background
// ============================================================

function hexToLinearChannel(val: number): number {
  const srgb = val / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return 0;
  const r = hexToLinearChannel(parseInt(hex.slice(1, 3), 16));
  const g = hexToLinearChannel(parseInt(hex.slice(3, 5), 16));
  const b = hexToLinearChannel(parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const ContrastChecker = memo(function ContrastChecker({ C, fg, bg }: { C: Theme; fg: string | undefined; bg: string }) {
  const fgColor = fg ?? '#ffffff';
  if (!/^#[0-9a-fA-F]{6}$/.test(fgColor) || !/^#[0-9a-fA-F]{6}$/.test(bg)) return null;

  const ratio = getContrastRatio(fgColor, bg);
  const ratioStr = ratio.toFixed(1);
  const passAAA = ratio >= 7;
  const passAA = ratio >= 4.5;
  const passAALarge = ratio >= 3;

  let badge: string;
  let badgeColor: string;
  if (passAAA) { badge = `AAA ${ratioStr}:1`; badgeColor = '#22c55e'; }
  else if (passAA) { badge = `AA ${ratioStr}:1`; badgeColor = '#22c55e'; }
  else if (passAALarge) { badge = `AA-lg ${ratioStr}:1`; badgeColor = '#f59e0b'; }
  else { badge = `Low ${ratioStr}:1`; badgeColor = '#ef4444'; }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      <span style={{ fontSize: 9, color: C.dim }}>Contrast</span>
      <span style={{ fontSize: 9, fontWeight: 700, color: badgeColor, background: badgeColor + '18', padding: '1px 6px', borderRadius: 4 }}>{badge}</span>
      {/* Preview: small AA text sample */}
      <span style={{ fontSize: 9, color: fgColor, background: bg, padding: '1px 4px', borderRadius: 3, border: `1px solid ${C.border}`, fontWeight: 600, lineHeight: 1 }}>Aa</span>
    </div>
  );
});

// ============================================================
// Image Palette Extractor — extract dominant colors from an image
// ============================================================

function extractPaletteFromImage(src: string, numColors: number = 6): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 64; // sample at low res for speed
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve([]); return; }
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      // Simple median-cut-lite: collect all pixels, quantize, find most common
      const buckets = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        // Quantize to reduce color space (shift right 4 bits = 16 levels per channel)
        const r = (data[i] >> 4) << 4;
        const g = (data[i + 1] >> 4) << 4;
        const b = (data[i + 2] >> 4) << 4;
        const a = data[i + 3];
        if (a < 128) continue; // skip transparent pixels
        const key = `${r},${g},${b}`;
        buckets.set(key, (buckets.get(key) || 0) + 1);
      }

      // Sort by frequency, take top N, convert to hex
      const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
      const colors: string[] = [];
      for (const [key] of sorted) {
        if (colors.length >= numColors) break;
        const [r, g, b] = key.split(',').map(Number);
        const hex = '#' + [r, g, b].map((v) => Math.min(255, v).toString(16).padStart(2, '0')).join('');
        // Ensure minimum distance from existing picks (avoid near-duplicates)
        const tooClose = colors.some((existing) => {
          const [er, eg, eb] = [parseInt(existing.slice(1, 3), 16), parseInt(existing.slice(3, 5), 16), parseInt(existing.slice(5, 7), 16)];
          return Math.abs(r - er) + Math.abs(g - eg) + Math.abs(b - eb) < 60;
        });
        if (!tooClose) colors.push(hex);
      }
      resolve(colors);
    };
    img.onerror = () => resolve([]);
    img.src = src;
  });
}

function ImagePaletteExtractor({ C, src, onApply, labelStyle }: { C: Theme; src: string | undefined; onApply: (color: string) => void; labelStyle: React.CSSProperties }) {
  const [palette, setPalette] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const lastSrc = useRef<string | undefined>(undefined);

  // Reset when image changes
  useEffect(() => {
    if (src !== lastSrc.current) {
      setPalette([]);
      setExtracted(false);
      lastSrc.current = src;
    }
  }, [src]);

  const handleExtract = async () => {
    if (!src) return;
    setLoading(true);
    try {
      const colors = await extractPaletteFromImage(src, 6);
      setPalette(colors);
      setExtracted(true);
    } catch {
      setPalette([]);
    }
    setLoading(false);
  };

  if (!src) return null;

  return (
    <div>
      <div style={labelStyle}>Color Palette</div>
      {!extracted ? (
        <button onClick={handleExtract} disabled={loading} style={{
          width: '100%', padding: '5px', borderRadius: 5,
          border: `1px solid ${C.accent}33`,
          background: `linear-gradient(135deg, ${C.accent}08, ${C.accent}14)`,
          color: C.accent, fontSize: 9, fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          opacity: loading ? 0.6 : 1,
        }}>
          {loading ? (
            <svg width="12" height="12" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          )}
          Extract from Image
        </button>
      ) : palette.length > 0 ? (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {palette.map((c, i) => (
            <button key={i} onClick={() => onApply(c)} title={c} style={{
              width: 26, height: 26, borderRadius: 5, background: c,
              border: `1.5px solid ${C.border}`, cursor: 'pointer', padding: 0,
              transition: 'transform .1s',
            }} onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'scale(1.15)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }} />
          ))}
          <button onClick={handleExtract} title="Re-extract" style={{
            width: 26, height: 26, borderRadius: 5, border: `1px dashed ${C.border}`,
            background: 'transparent', color: C.dim, cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          </button>
        </div>
      ) : (
        <div style={{ fontSize: 9, color: C.dim, padding: '4px 0' }}>No distinct colors found.</div>
      )}
    </div>
  );
}
