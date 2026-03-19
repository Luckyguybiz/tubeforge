'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useThemeStore } from '@/stores/useThemeStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { Z_INDEX } from '@/lib/constants';

interface ToolBarProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ToolDef {
  id: string;
  icon: React.ReactElement;
  labelKey: string;
}

// ===== Clean SVG Icons =====
const TOOL_ICONS: Record<string, React.ReactElement> = {
  select: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>,
  text: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  shapes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
  lines: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="19" x2="19" y2="5"/></svg>,
  insert: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  draw: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
  uploads: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  elements: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  projects: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  eraser: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7L3 16l9-9 8 8-4 4z"/><path d="M7 20l-4-4"/><line x1="15" y1="4" x2="20" y2="9"/></svg>,
  brush: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
};

// Submenu SVG icons
const SUB_ICONS: Record<string, React.ReactElement> = {
  rect: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
  circle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>,
  triangle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 22h20L12 2z"/></svg>,
  star: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  line: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="19" x2="19" y2="5"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  stickyNote: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8.5L15.5 3z"/><polyline points="14 3 14 8 21 8"/></svg>,
  table: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
  image: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
};

// Group 1: Selection
const SELECTION_TOOLS: ToolDef[] = [
  { id: 'select', icon: TOOL_ICONS.select, labelKey: 'thumbs.tool.select' },
];

// Group 2: Creation (grouped Canva-style)
const CREATION_TOOLS: ToolDef[] = [
  { id: 'text', icon: TOOL_ICONS.text, labelKey: 'thumbs.tool.text' },
  { id: 'shapes', icon: TOOL_ICONS.shapes, labelKey: 'thumbs.tool.shapes' },
  { id: 'lines', icon: TOOL_ICONS.lines, labelKey: 'thumbs.tool.lines' },
  { id: 'insert', icon: TOOL_ICONS.insert, labelKey: 'thumbs.tool.insert' },
];

// Group 3: Drawing
const DRAWING_TOOLS: ToolDef[] = [
  { id: 'draw', icon: TOOL_ICONS.draw, labelKey: 'thumbs.tool.draw' },
];

// Panel buttons (visually distinct from tools)
const PANEL_BUTTONS: ToolDef[] = [
  { id: 'uploads', icon: TOOL_ICONS.uploads, labelKey: 'thumbs.panel.uploads' },
  { id: 'elements', icon: TOOL_ICONS.elements, labelKey: 'thumbs.panel.elements' },
  { id: 'projects', icon: TOOL_ICONS.projects, labelKey: 'thumbs.panel.projects' },
];

// Submenus
const SHAPE_OPTIONS = [
  { id: 'rect', icon: SUB_ICONS.rect, labelKey: 'thumbs.shape.rect' },
  { id: 'circle', icon: SUB_ICONS.circle, labelKey: 'thumbs.shape.circle' },
  { id: 'triangle', icon: SUB_ICONS.triangle, labelKey: 'thumbs.shape.triangle' },
  { id: 'star', icon: SUB_ICONS.star, labelKey: 'thumbs.shape.star' },
];

const LINE_OPTIONS = [
  { id: 'line', icon: SUB_ICONS.line, labelKey: 'thumbs.line.line' },
  { id: 'arrow', icon: SUB_ICONS.arrow, labelKey: 'thumbs.line.arrow' },
];

const INSERT_OPTIONS = [
  { id: 'stickyNote', icon: SUB_ICONS.stickyNote, labelKey: 'thumbs.insert.stickyNote' },
  { id: 'table', icon: SUB_ICONS.table, labelKey: 'thumbs.insert.table' },
  { id: 'image', icon: SUB_ICONS.image, labelKey: 'thumbs.insert.image' },
];

export function ToolBar({ onFileChange }: ToolBarProps) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const { tool, shapeSub, drawColor, drawSize, canvasBg, leftPanel } = useThumbnailStore(
    useShallow((s) => ({ tool: s.tool, shapeSub: s.shapeSub, drawColor: s.drawColor, drawSize: s.drawSize, canvasBg: s.canvasBg, leftPanel: s.leftPanel }))
  );
  const { setTool, addText, addShape, setShapeSub, setDrawColor, setDrawSize, setCanvasBg, setLeftPanel, addTable, addStickyNote } = useThumbnailStore.getState();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgColorRef = useRef<HTMLInputElement>(null);
  const [showShapes, setShowShapes] = useState(false);
  const [showLines, setShowLines] = useState(false);
  const [showInsert, setShowInsert] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tableHover, setTableHover] = useState({ r: 0, c: 0 });

  const closeAllSubmenus = useCallback(() => {
    setShowShapes(false);
    setShowLines(false);
    setShowInsert(false);
    setShowTablePicker(false);
  }, []);

  const handleToolClick = useCallback((id: string) => {
    if (id === 'text') { closeAllSubmenus(); addText(); return; }
    if (id === 'shapes') { setShowShapes((prev) => { const next = !prev; if (next) { setShowLines(false); setShowInsert(false); setShowTablePicker(false); } return next; }); return; }
    if (id === 'lines') { setShowLines((prev) => { const next = !prev; if (next) { setShowShapes(false); setShowInsert(false); setShowTablePicker(false); } return next; }); return; }
    if (id === 'insert') { setShowInsert((prev) => { const next = !prev; if (next) { setShowShapes(false); setShowLines(false); setShowTablePicker(false); } return next; }); return; }
    closeAllSubmenus();
    setTool(id);
  }, [closeAllSubmenus, addText, setTool]);

  const handleShapeClick = useCallback((shapeId: string) => {
    setShapeSub(shapeId as 'rect' | 'circle' | 'triangle' | 'star');
    addShape(shapeId);
    closeAllSubmenus();
  }, [closeAllSubmenus, setShapeSub, addShape]);

  const handleLineClick = useCallback((lineId: string) => {
    setTool(lineId); // 'line' or 'arrow'
    closeAllSubmenus();
  }, [closeAllSubmenus, setTool]);

  const handleInsertClick = useCallback((insertId: string) => {
    if (insertId === 'stickyNote') { addStickyNote(); closeAllSubmenus(); return; }
    if (insertId === 'table') { setShowInsert(false); setShowTablePicker(true); return; }
    if (insertId === 'image') { fileInputRef.current?.click(); closeAllSubmenus(); return; }
  }, [closeAllSubmenus, addStickyNote]);

  const handleTableSelect = useCallback((rows: number, cols: number) => {
    addTable(rows, cols);
    closeAllSubmenus();
  }, [closeAllSubmenus, addTable]);

  const renderToolButton = (td: ToolDef) => {
    const label = t(td.labelKey);
    const active =
      tool === td.id ||
      (td.id === 'shapes' && showShapes) ||
      (td.id === 'lines' && (showLines || tool === 'line' || tool === 'arrow')) ||
      (td.id === 'insert' && (showInsert || showTablePicker));
    return (
      <div
        key={td.id}
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-pressed={tool === td.id}
        onClick={() => handleToolClick(td.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToolClick(td.id); } }}
        title={label}
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          color: active ? C.accent : C.sub,
          background: active ? C.accentDim : 'transparent',
          cursor: 'pointer',
          transition: 'all .15s',
        }}
        onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = C.surface; }}
        onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>{td.icon}</span>
        <span style={{ fontSize: 9, fontWeight: 600, lineHeight: 1, color: active ? C.accent : C.dim }}>{label}</span>
      </div>
    );
  };

  const divider = <div style={{ width: 32, height: 1, background: C.border, margin: '4px auto', opacity: 0.6 }} />;

  // Popover style shared by all submenus
  const popoverBase: React.CSSProperties = {
    position: 'absolute',
    left: 62,
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: 8,
    zIndex: Z_INDEX.TOOLBAR_POPOVER,
    minWidth: 120,
    boxShadow: '0 8px 32px rgba(0,0,0,.25), 0 2px 8px rgba(0,0,0,.15)',
  };

  const submenuItem = (id: string, icon: React.ReactElement, label: string, isActive: boolean, onClick: () => void) => (
    <div
      key={id}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      style={{
        padding: '8px 10px',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        background: isActive ? C.accentDim : 'transparent',
        color: isActive ? C.accent : C.sub,
        transition: 'all .12s',
      }}
      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = C.surface; }}
      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
    </div>
  );

  return (
    <div style={{ width: 56, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0, position: 'relative' }}>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />

      {/* Group 1: Selection */}
      {SELECTION_TOOLS.map(renderToolButton)}

      {divider}

      {/* Group 2: Creation (4 grouped buttons) */}
      {CREATION_TOOLS.map(renderToolButton)}

      {divider}

      {/* Group 3: Drawing */}
      {DRAWING_TOOLS.map(renderToolButton)}

      {/* Draw options (eraser toggle, color, size) */}
      {(tool === 'draw' || tool === 'eraser') && (
        <div style={{ padding: '6px 4px 2px', borderTop: `1px solid ${C.border}`, marginTop: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <button
            onClick={() => setTool(tool === 'eraser' ? 'draw' : 'eraser')}
            title={tool === 'eraser' ? t('thumbs.toolbar.brush') : t('thumbs.toolbar.eraser')}
            style={{
              width: 34,
              height: 30,
              borderRadius: 7,
              border: `1px solid ${tool === 'eraser' ? C.accent + '55' : C.border}`,
              background: tool === 'eraser' ? C.accentDim : C.surface,
              color: tool === 'eraser' ? C.accent : C.sub,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {tool === 'eraser' ? TOOL_ICONS.eraser : TOOL_ICONS.brush}
          </button>
          <input type="color" value={drawColor} aria-label={t('thumbs.toolbar.brushColor')} onChange={(e) => setDrawColor(e.target.value)} style={{ width: 30, height: 30, border: `2px solid ${C.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', padding: 0 }} />
          <input type="range" min={1} max={12} value={drawSize} aria-label={t('thumbs.toolbar.brushSize')} onChange={(e) => setDrawSize(+e.target.value)} style={{ width: 40, accentColor: C.accent }} title={t('thumbs.toolbar.sizeValue') + drawSize} />
        </div>
      )}

      {divider}

      {/* Panel label */}
      <span style={{ fontSize: 8, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2, marginBottom: 2 }}>{t('thumbs.toolbar.panels')}</span>

      {/* Panel toggles */}
      {PANEL_BUTTONS.map((p) => {
        const active = leftPanel === p.id;
        const pLabel = t(p.labelKey);
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            aria-label={t('thumbs.toolbar.panelLabel') + pLabel}
            aria-pressed={active}
            onClick={() => setLeftPanel(p.id as 'uploads' | 'elements' | 'projects')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLeftPanel(p.id as 'uploads' | 'elements' | 'projects'); } }}
            title={pLabel}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              color: active ? C.accent : C.sub,
              background: active ? C.accentDim : 'transparent',
              border: `1px solid ${active ? C.accent + '33' : 'transparent'}`,
              cursor: 'pointer',
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = C.surface; }}
            onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>{p.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 600, lineHeight: 1, color: active ? C.accent : C.dim }}>{pLabel}</span>
          </div>
        );
      })}

      {/* Background color picker - always visible at bottom */}
      <div style={{ marginTop: 'auto', padding: '8px 4px 4px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div
          role="button"
          tabIndex={0}
          aria-label={t('thumbs.toolbar.bgColor')}
          onClick={() => bgColorRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bgColorRef.current?.click(); } }}
          title={t('thumbs.toolbar.bgColor')}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: canvasBg,
            border: `2px solid ${C.border}`,
            cursor: 'pointer',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)',
            transition: 'border-color .15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.accent; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
        />
        <input
          ref={bgColorRef}
          type="color"
          value={canvasBg}
          onChange={(e) => setCanvasBg(e.target.value)}
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        />
        <span style={{ fontSize: 8, color: C.dim, fontWeight: 600 }}>{t('thumbs.toolbar.bg')}</span>
      </div>

      {/* Shapes submenu popover */}
      {showShapes && (
        <div style={{ ...popoverBase, top: 100, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, minWidth: 160 }}>
          {SHAPE_OPTIONS.map((s) => {
            const sLabel = t(s.labelKey);
            return (
            <div key={s.id} role="button" tabIndex={0} aria-label={sLabel} onClick={() => handleShapeClick(s.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleShapeClick(s.id); } }}
              style={{ padding: '10px 6px', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', background: shapeSub === s.id ? C.accentDim : 'transparent', color: shapeSub === s.id ? C.accent : C.sub, transition: 'all .12s' }}
              onMouseEnter={(e) => { if (shapeSub !== s.id) (e.currentTarget as HTMLElement).style.background = C.surface; }}
              onMouseLeave={(e) => { if (shapeSub !== s.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>{s.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600 }}>{sLabel}</span>
            </div>
            );
          })}
        </div>
      )}

      {/* Lines submenu popover */}
      {showLines && (
        <div style={{ ...popoverBase, top: 144, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {LINE_OPTIONS.map((l) =>
            submenuItem(l.id, l.icon, t(l.labelKey), tool === l.id, () => handleLineClick(l.id))
          )}
        </div>
      )}

      {/* Insert submenu popover */}
      {showInsert && (
        <div style={{ ...popoverBase, top: 188, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {INSERT_OPTIONS.map((ins) =>
            submenuItem(ins.id, ins.icon, t(ins.labelKey), false, () => handleInsertClick(ins.id))
          )}
        </div>
      )}

      {/* Table size picker popover */}
      {showTablePicker && (
        <div style={{ ...popoverBase, top: 188, padding: 14 }}>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 8, fontWeight: 600, textAlign: 'center' }}>
            {tableHover.r > 0 ? `${tableHover.r} x ${tableHover.c}` : t('thumbs.toolbar.selectSize')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 22px)', gap: 3, justifyContent: 'center' }}>
            {Array.from({ length: 25 }, (_, i) => {
              const r = Math.floor(i / 5) + 1, c = (i % 5) + 1;
              const isActive = r <= tableHover.r && c <= tableHover.c;
              return (
                <div key={i}
                  role="button"
                  tabIndex={0}
                  aria-label={`${r}x${c} ${t('thumbs.toolbar.table')}`}
                  onMouseEnter={() => setTableHover({ r, c })}
                  onClick={() => handleTableSelect(r, c)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTableSelect(r, c); } }}
                  style={{ width: 22, height: 22, borderRadius: 4, border: `1.5px solid ${isActive ? C.accent : C.border}`, background: isActive ? C.accentDim : C.surface, cursor: 'pointer', transition: 'all .1s' }} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
