'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useThemeStore } from '@/stores/useThemeStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { toast } from '@/stores/useNotificationStore';
import { Z_INDEX } from '@/lib/constants';

interface ToolBarProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isMobile?: boolean;
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
  qrCode: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="4" height="4"/><line x1="22" y1="14" x2="22" y2="22"/><line x1="14" y1="22" x2="22" y2="22"/><rect x="5" y="5" width="2" height="2"/><rect x="17" y="5" width="2" height="2"/><rect x="5" y="17" width="2" height="2"/></svg>,
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
  { id: 'templates', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, labelKey: 'thumbs.panel.templates' },
  { id: 'uploads', icon: TOOL_ICONS.uploads, labelKey: 'thumbs.panel.uploads' },
  { id: 'elements', icon: TOOL_ICONS.elements, labelKey: 'thumbs.panel.elements' },
  { id: 'stock', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>, labelKey: 'thumbs.panel.stock' },
  { id: 'aiBg', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/></svg>, labelKey: 'thumbs.panel.aiBg' },
  { id: 'aiText', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>, labelKey: 'thumbs.panel.aiText' },
  { id: 'projects', icon: TOOL_ICONS.projects, labelKey: 'thumbs.panel.projects' },
  { id: 'background', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M2 12h20"/><path d="M12 2v20"/></svg>, labelKey: 'thumbs.panel.background' },
  { id: 'textStyles', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>, labelKey: 'thumbs.panel.textStyles' },
  { id: 'creatorStyles', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>, labelKey: 'thumbs.panel.creatorStyles' },
];

// Submenus
const SHAPE_OPTIONS = [
  { id: 'rect', icon: SUB_ICONS.rect, labelKey: 'thumbs.shape.rect' },
  { id: 'circle', icon: SUB_ICONS.circle, labelKey: 'thumbs.shape.circle' },
  { id: 'triangle', icon: SUB_ICONS.triangle, labelKey: 'thumbs.shape.triangle' },
  { id: 'star', icon: SUB_ICONS.star, labelKey: 'thumbs.shape.star' },
  { id: 'pentagon', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l10 7.5-4 11.5H6L2 9.5z"/></svg>, labelKey: 'thumbs.shape.pentagon' },
  { id: 'hexagon', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l9 5v10l-9 5-9-5V7z"/></svg>, labelKey: 'thumbs.shape.hexagon' },
  { id: 'arrowShape', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8h12V4l8 8-8 8v-4H2z"/></svg>, labelKey: 'thumbs.shape.arrowShape' },
  { id: 'speechBubble', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>, labelKey: 'thumbs.shape.speechBubble' },
  { id: 'heart', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>, labelKey: 'thumbs.shape.heart' },
];

const LINE_OPTIONS = [
  { id: 'line', icon: SUB_ICONS.line, labelKey: 'thumbs.line.line' },
  { id: 'arrow', icon: SUB_ICONS.arrow, labelKey: 'thumbs.line.arrow' },
];

const INSERT_OPTIONS = [
  { id: 'stickyNote', icon: SUB_ICONS.stickyNote, labelKey: 'thumbs.insert.stickyNote' },
  { id: 'table', icon: SUB_ICONS.table, labelKey: 'thumbs.insert.table' },
  { id: 'qrCode', icon: SUB_ICONS.qrCode, labelKey: 'thumbs.insert.qrCode' },
  { id: 'image', icon: SUB_ICONS.image, labelKey: 'thumbs.insert.image' },
];

// Shortcut hints for toolbar tooltips
const TOOL_SHORTCUT_HINTS: Record<string, string> = {
  select: 'V',
  text: 'T',
  shapes: 'S',
  lines: 'L',
  insert: 'I',
  draw: 'D',
  eraser: 'E',
  templates: '',
  uploads: 'U',
  elements: '',
  stock: '',
  aiBg: '',
  aiText: '',
  projects: '',
  background: '',
  textStyles: '',
  creatorStyles: '',
};

export function ToolBar({ onFileChange, isMobile = false }: ToolBarProps) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const { tool, shapeSub, drawColor, drawSize, canvasBg, leftPanel, snapToGrid, snapToPixel, customGuidesCount } = useThumbnailStore(
    useShallow((s) => ({ tool: s.tool, shapeSub: s.shapeSub, drawColor: s.drawColor, drawSize: s.drawSize, canvasBg: s.canvasBg, leftPanel: s.leftPanel, snapToGrid: s.snapToGrid, snapToPixel: s.snapToPixel, customGuidesCount: s.customGuides.length }))
  );
  const { setTool, addText, addShape, setShapeSub, setDrawColor, setDrawSize, setCanvasBg, setLeftPanel, addTable, addStickyNote, addImage, setSnapToGrid, setSnapToPixel, addCustomGuide, clearCustomGuides } = useThumbnailStore.getState();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgColorRef = useRef<HTMLInputElement>(null);
  const [showShapes, setShowShapes] = useState(false);
  const [showLines, setShowLines] = useState(false);
  const [showInsert, setShowInsert] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showQrInput, setShowQrInput] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [tableHover, setTableHover] = useState({ r: 0, c: 0 });
  const [showABTestModal, setShowABTestModal] = useState(false);

  const closeAllSubmenus = useCallback(() => {
    setShowShapes(false);
    setShowLines(false);
    setShowInsert(false);
    setShowTablePicker(false);
    setShowQrInput(false);
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
    setShapeSub(shapeId as 'rect' | 'circle' | 'triangle' | 'star' | 'pentagon' | 'hexagon' | 'arrowShape' | 'speechBubble' | 'heart');
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
    if (insertId === 'qrCode') { setShowInsert(false); setShowQrInput(true); setQrUrl(''); return; }
    if (insertId === 'image') { fileInputRef.current?.click(); closeAllSubmenus(); return; }
  }, [closeAllSubmenus, addStickyNote]);

  const handleQrCodeInsert = useCallback(() => {
    const url = qrUrl.trim();
    if (!url) return;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    addImage(qrApiUrl);
    closeAllSubmenus();
  }, [qrUrl, closeAllSubmenus, addImage]);

  const handleTableSelect = useCallback((rows: number, cols: number) => {
    addTable(rows, cols);
    closeAllSubmenus();
  }, [closeAllSubmenus, addTable]);

  const renderToolButton = (td: ToolDef) => {
    const label = t(td.labelKey);
    const shortcutHint = TOOL_SHORTCUT_HINTS[td.id];
    const tooltipText = shortcutHint ? `${label} (${shortcutHint})` : label;
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
        aria-label={tooltipText}
        aria-pressed={tool === td.id}
        onClick={() => handleToolClick(td.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToolClick(td.id); } }}
        title={tooltipText}
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

  const divider = isMobile
    ? <div style={{ width: 1, height: 32, background: C.border, margin: '0 4px', opacity: 0.6, flexShrink: 0 }} />
    : <div style={{ width: 32, height: 1, background: C.border, margin: '4px auto', opacity: 0.6 }} />;

  // Popover style shared by all submenus
  const popoverBase: React.CSSProperties = isMobile ? {
    position: 'fixed',
    bottom: 64,
    left: '50%',
    transform: 'translateX(-50%)',
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: 8,
    zIndex: Z_INDEX.TOOLBAR_POPOVER,
    minWidth: 120,
    boxShadow: '0 8px 32px rgba(0,0,0,.25), 0 2px 8px rgba(0,0,0,.15)',
  } : {
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
    <div style={isMobile ? {
      width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '6px 8px',
      display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0, position: 'relative',
      overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' as const,
    } : {
      width: 56, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 6px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0, position: 'relative',
    }}>
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
      {!isMobile && <span style={{ fontSize: 8, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2, marginBottom: 2 }}>{t('thumbs.toolbar.panels')}</span>}

      {/* Panel toggles */}
      {PANEL_BUTTONS.map((p) => {
        const active = leftPanel === p.id;
        const pLabel = t(p.labelKey);
        const panelShortcut = TOOL_SHORTCUT_HINTS[p.id];
        const panelTooltip = panelShortcut ? `${pLabel} (${panelShortcut})` : pLabel;
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            aria-label={t('thumbs.toolbar.panelLabel') + pLabel}
            aria-pressed={active}
            onClick={() => setLeftPanel(p.id as 'uploads' | 'elements' | 'projects' | 'stock' | 'aiBg' | 'aiText' | 'templates' | 'background' | 'textStyles')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLeftPanel(p.id as 'uploads' | 'elements' | 'projects' | 'stock' | 'aiBg' | 'aiText' | 'templates' | 'background' | 'textStyles'); } }}
            title={panelTooltip}
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

      {/* Background color picker - always visible at bottom (hidden on mobile for space) */}
      <div style={isMobile ? {
        marginLeft: 'auto', padding: '4px 8px', borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0,
      } : {
        marginTop: 'auto', padding: '8px 4px 4px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      }}>
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
            background: canvasBg === 'transparent' ? 'repeating-conic-gradient(#808080 0% 25%, #b0b0b0 0% 50%) 0 0 / 8px 8px' : canvasBg,
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
          value={canvasBg === 'transparent' ? '#141414' : canvasBg}
          onChange={(e) => setCanvasBg(e.target.value)}
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        />
        <span style={{ fontSize: 8, color: C.dim, fontWeight: 600 }}>{t('thumbs.toolbar.bg')}</span>
      </div>

      {/* Snap to Grid toggle */}
      {!isMobile && divider}
      <div
        role="button"
        tabIndex={0}
        aria-label={t('thumbs.toolbar.snapToGrid')}
        aria-pressed={snapToGrid}
        onClick={() => {
          const next = !snapToGrid;
          setSnapToGrid(next);
          try { localStorage.setItem('tubeforge-snap-to-grid', JSON.stringify(next)); } catch {}
        }}
        title={t('thumbs.toolbar.snapToGrid')}
        style={{
          width: 44, height: 44, borderRadius: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          color: snapToGrid ? C.accent : C.sub,
          background: snapToGrid ? C.accentDim : 'transparent',
          border: `1px solid ${snapToGrid ? C.accent + '33' : 'transparent'}`,
          cursor: 'pointer', transition: 'all .15s',
        }}
        onMouseEnter={(e) => { if (!snapToGrid) (e.currentTarget as HTMLElement).style.background = C.surface; }}
        onMouseLeave={(e) => { if (!snapToGrid) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const next = !snapToGrid; setSnapToGrid(next); try { localStorage.setItem('tubeforge-snap-to-grid', JSON.stringify(next)); } catch {} } }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="15" y1="3" x2="15" y2="21"/>
        </svg>
        <span style={{ fontSize: 8, fontWeight: 600, lineHeight: 1, color: snapToGrid ? C.accent : C.dim }}>{t('thumbs.toolbar.grid')}</span>
      </div>

      {/* Snap to Pixel — round positions to whole numbers */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Snap to Pixel"
        aria-pressed={snapToPixel}
        onClick={() => {
          const next = !snapToPixel;
          setSnapToPixel(next);
          try { localStorage.setItem('tubeforge-snap-to-pixel', JSON.stringify(next)); } catch {}
        }}
        title="Snap to Pixel — round all positions to whole numbers"
        style={{
          width: 44, height: 44, borderRadius: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          color: snapToPixel ? C.accent : C.sub,
          background: snapToPixel ? C.accentDim : 'transparent',
          border: `1px solid ${snapToPixel ? C.accent + '33' : 'transparent'}`,
          cursor: 'pointer', transition: 'all .15s',
        }}
        onMouseEnter={(e) => { if (!snapToPixel) (e.currentTarget as HTMLElement).style.background = C.surface; }}
        onMouseLeave={(e) => { if (!snapToPixel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const next = !snapToPixel; setSnapToPixel(next); try { localStorage.setItem('tubeforge-snap-to-pixel', JSON.stringify(next)); } catch {} } }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        <span style={{ fontSize: 8, fontWeight: 600, lineHeight: 1, color: snapToPixel ? C.accent : C.dim }}>Pixel</span>
      </div>

      {/* Custom Guides — Add H/V guide buttons */}
      {!isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginTop: 2 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              onClick={() => addCustomGuide('h')}
              title={t('thumbs.toolbar.addHGuide')}
              aria-label={t('thumbs.toolbar.addHGuide')}
              style={{
                width: 21, height: 20, borderRadius: 5, border: `1px solid ${C.border}`,
                background: 'transparent', color: '#e040fb', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'all .12s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="2" y1="12" x2="22" y2="12"/></svg>
            </button>
            <button
              onClick={() => addCustomGuide('v')}
              title={t('thumbs.toolbar.addVGuide')}
              aria-label={t('thumbs.toolbar.addVGuide')}
              style={{
                width: 21, height: 20, borderRadius: 5, border: `1px solid ${C.border}`,
                background: 'transparent', color: '#e040fb', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'all .12s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/></svg>
            </button>
          </div>
          {customGuidesCount > 0 && (
            <button
              onClick={() => clearCustomGuides()}
              title={t('thumbs.toolbar.clearGuides')}
              aria-label={t('thumbs.toolbar.clearGuides')}
              style={{
                width: 44, height: 14, borderRadius: 4, border: 'none',
                background: 'transparent', color: '#e040fb', cursor: 'pointer',
                fontSize: 8, fontWeight: 600, padding: 0, fontFamily: 'inherit',
                transition: 'all .12s', opacity: 0.7,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7'; }}
            >
              {customGuidesCount} {t('thumbs.toolbar.guidesLabel')}  &times;
            </button>
          )}
          <span style={{ fontSize: 8, fontWeight: 600, lineHeight: 1, color: C.dim }}>{t('thumbs.toolbar.guides')}</span>
        </div>
      )}

      {/* Z4: Remove Background button (placeholder) */}
      {!isMobile && divider}
      <div
        role="button"
        tabIndex={0}
        aria-label={t('thumbs.removeBg.ariaLabel')}
        onClick={() => toast.info(t('thumbs.removeBg.comingSoon'))}
        title={t('thumbs.removeBg.ariaLabel')}
        style={{
          width: 44, height: 44, borderRadius: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          color: C.sub, background: 'transparent', cursor: 'pointer', transition: 'all .15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.49 9A9 9 0 1 0 5.64 5.64L1 10h6V4"/>
          <path d="M12 7v5l4 2"/>
        </svg>
        <span style={{ fontSize: 8, fontWeight: 600, lineHeight: 1, color: C.dim }}>{t('thumbs.removeBg.short')}</span>
      </div>

      {/* Z6: A/B Test button */}
      <div
        role="button"
        tabIndex={0}
        aria-label={t('thumbs.abTest.ariaLabel')}
        onClick={() => setShowABTestModal(true)}
        title={t('thumbs.abTest.ariaLabel')}
        style={{
          width: 44, height: 44, borderRadius: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          color: C.sub, background: 'transparent', cursor: 'pointer', transition: 'all .15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <path d="M12 2v4"/>
          <path d="M9 12h6"/>
          <path d="M12 9v6"/>
        </svg>
        <span style={{ fontSize: 8, fontWeight: 600, lineHeight: 1, color: C.dim }}>A/B</span>
      </div>

      {/* Z6: A/B Test Modal */}
      {showABTestModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="A/B Test"
          onKeyDown={(e) => { if (e.key === 'Escape') setShowABTestModal(false); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(8px)',
          }}
          onClick={() => setShowABTestModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
              padding: '32px 28px', width: 420, maxWidth: 'calc(100vw - 32px)',
              boxShadow: '0 20px 60px rgba(0,0,0,.4)', textAlign: 'center',
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
              background: `${C.orange}12`, border: `2px solid ${C.orange}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <path d="M12 2v4"/>
                <path d="M9 12h6"/>
                <path d="M12 9v6"/>
              </svg>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
              {t('thumbs.abTest.title')}
            </h3>
            <p style={{ fontSize: 13, color: C.sub, margin: '0 0 20px', lineHeight: 1.6 }}>
              {t('thumbs.abTest.description')}
            </p>

            <div style={{
              background: C.surface, borderRadius: 10, padding: 16,
              border: `1px solid ${C.border}`, marginBottom: 20, textAlign: 'left',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>{t('thumbs.abTest.howItWorks')}</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: C.sub, fontSize: 12, lineHeight: 1.8 }}>
                <li>{t('thumbs.abTest.step1')}</li>
                <li>{t('thumbs.abTest.step2')}</li>
                <li>{t('thumbs.abTest.step3')}</li>
                <li>{t('thumbs.abTest.step4')}</li>
              </ul>
            </div>

            <div style={{
              padding: '10px 14px', background: `${C.orange}08`, borderRadius: 8,
              border: `1px solid ${C.orange}20`, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 14 }}>&#9733;</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.orange }}>
                {t('thumbs.abTest.connectYouTube')}
              </span>
            </div>

            <div style={{
              padding: '8px 12px', background: C.bg, borderRadius: 8,
              border: `1px dashed ${C.border}`, marginBottom: 20,
              fontSize: 11, color: C.dim, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontWeight: 700, color: C.purple }}>PRO+</span>
              {t('thumbs.abTest.proRequired')}
            </div>

            <button
              onClick={() => setShowABTestModal(false)}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 10,
                border: `1px solid ${C.border}`, background: 'transparent',
                color: C.text, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t('thumbs.abTest.gotIt')}
            </button>
          </div>
        </div>
      )}

      {/* Shapes submenu popover */}
      {showShapes && (
        <div style={{ ...popoverBase, ...(isMobile ? {} : { top: 100 }), display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, minWidth: 160 }}>
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
        <div style={{ ...popoverBase, ...(isMobile ? {} : { top: 144 }), display: 'flex', flexDirection: 'column', gap: 2 }}>
          {LINE_OPTIONS.map((l) =>
            submenuItem(l.id, l.icon, t(l.labelKey), tool === l.id, () => handleLineClick(l.id))
          )}
        </div>
      )}

      {/* Insert submenu popover */}
      {showInsert && (
        <div style={{ ...popoverBase, ...(isMobile ? {} : { top: 188 }), display: 'flex', flexDirection: 'column', gap: 2 }}>
          {INSERT_OPTIONS.map((ins) =>
            submenuItem(ins.id, ins.icon, t(ins.labelKey), false, () => handleInsertClick(ins.id))
          )}
        </div>
      )}

      {/* Table size picker popover */}
      {showTablePicker && (
        <div style={{ ...popoverBase, ...(isMobile ? {} : { top: 188 }), padding: 14 }}>
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

      {/* QR Code URL input popover */}
      {showQrInput && (
        <div style={{ ...popoverBase, ...(isMobile ? {} : { top: 188 }), padding: 14, minWidth: 220 }}>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 8, fontWeight: 600 }}>
            {t('thumbs.insert.qrCodeUrl')}
          </div>
          <input
            type="url"
            value={qrUrl}
            onChange={(e) => setQrUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleQrCodeInsert(); } if (e.key === 'Escape') closeAllSubmenus(); }}
            placeholder="https://example.com"
            autoFocus
            style={{
              width: '100%', padding: '7px 10px', background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 8, color: C.text,
              fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box',
              outline: 'none', marginBottom: 8,
            }}
          />
          <button
            onClick={handleQrCodeInsert}
            disabled={!qrUrl.trim()}
            style={{
              width: '100%', padding: '7px 0', borderRadius: 8,
              border: 'none', background: qrUrl.trim() ? C.accent : C.surface,
              color: qrUrl.trim() ? '#fff' : C.dim, fontSize: 12,
              fontWeight: 600, cursor: qrUrl.trim() ? 'pointer' : 'default',
              fontFamily: 'inherit', transition: 'all .15s',
            }}
          >
            {t('thumbs.insert.qrCodeInsert')}
          </button>
        </div>
      )}
    </div>
  );
}
