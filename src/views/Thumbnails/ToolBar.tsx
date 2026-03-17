'use client';

import { useState, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useThemeStore } from '@/stores/useThemeStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { Z_INDEX } from '@/lib/constants';

interface ToolBarProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ToolDef {
  id: string;
  icon: string;
  label: string;
}

// Group 1: Selection
const SELECTION_TOOLS: ToolDef[] = [
  { id: 'select', icon: '🖱', label: 'Выбрать' },
];

// Group 2: Creation (grouped Canva-style)
const CREATION_TOOLS: ToolDef[] = [
  { id: 'text', icon: 'T', label: 'Текст' },
  { id: 'shapes', icon: '◇', label: 'Фигуры' },
  { id: 'lines', icon: '╱', label: 'Линии' },
  { id: 'insert', icon: '＋', label: 'Вставить' },
];

// Group 3: Drawing
const DRAWING_TOOLS: ToolDef[] = [
  { id: 'draw', icon: '✎', label: 'Рисовать' },
];

// Panel buttons (visually distinct from tools)
const PANEL_BUTTONS: ToolDef[] = [
  { id: 'uploads', icon: '⬆', label: 'Загрузки' },
  { id: 'elements', icon: '✦', label: 'Элементы' },
  { id: 'projects', icon: '📁', label: 'Проекты' },
];

// Submenus
const SHAPE_OPTIONS = [
  { id: 'rect', icon: '□', label: 'Прямоуг.' },
  { id: 'circle', icon: '○', label: 'Круг' },
  { id: 'triangle', icon: '△', label: 'Треуголь.' },
  { id: 'star', icon: '☆', label: 'Звезда' },
];

const LINE_OPTIONS = [
  { id: 'line', icon: '─', label: 'Линия' },
  { id: 'arrow', icon: '→', label: 'Стрелка' },
];

const INSERT_OPTIONS = [
  { id: 'stickyNote', icon: '📝', label: 'Заметка' },
  { id: 'table', icon: '⊞', label: 'Таблица' },
  { id: 'image', icon: '🖼', label: 'Картинка' },
];

export function ToolBar({ onFileChange }: ToolBarProps) {
  const C = useThemeStore((s) => s.theme);
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

  const renderToolButton = (t: ToolDef) => {
    const active =
      tool === t.id ||
      (t.id === 'shapes' && showShapes) ||
      (t.id === 'lines' && (showLines || tool === 'line' || tool === 'arrow')) ||
      (t.id === 'insert' && (showInsert || showTablePicker));
    return (
      <div
        key={t.id}
        role="button"
        tabIndex={0}
        aria-label={t.label}
        aria-pressed={tool === t.id}
        onClick={() => handleToolClick(t.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToolClick(t.id); } }}
        title={t.label}
        style={{
          width: 48,
          height: 42,
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          color: active ? C.accent : C.text,
          opacity: active ? 1 : 0.7,
          background: active ? C.accentDim : 'transparent',
          cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        <span style={{ fontSize: 20 }}>{t.icon}</span>
        <span style={{ fontSize: 8, fontWeight: 600 }}>{t.label}</span>
      </div>
    );
  };

  const divider = <div style={{ width: 36, height: 1, background: C.border, margin: '4px 0' }} />;

  // Popover style shared by all submenus
  const popoverBase: React.CSSProperties = {
    position: 'absolute',
    left: 68,
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: 8,
    zIndex: Z_INDEX.TOOLBAR_POPOVER,
    minWidth: 120,
    boxShadow: '0 4px 20px rgba(0,0,0,.3)',
  };

  const submenuItem = (id: string, icon: string, label: string, isActive: boolean, onClick: () => void) => (
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
        gap: 8,
        cursor: 'pointer',
        background: isActive ? C.accentDim : 'transparent',
        color: isActive ? C.accent : C.sub,
        transition: 'all .12s',
      }}
    >
      <span style={{ fontSize: 18, width: 22, textAlign: 'center' }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
    </div>
  );

  return (
    <div style={{ width: 64, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0, position: 'relative' }}>
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
        <div style={{ padding: '6px 6px 2px', borderTop: `1px solid ${C.border}`, marginTop: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <button
            onClick={() => setTool(tool === 'eraser' ? 'draw' : 'eraser')}
            title={tool === 'eraser' ? 'Кисть' : 'Ластик'}
            style={{
              width: 36,
              height: 28,
              borderRadius: 6,
              border: `1px solid ${tool === 'eraser' ? C.accent + '55' : C.border}`,
              background: tool === 'eraser' ? C.accentDim : C.surface,
              color: tool === 'eraser' ? C.accent : C.sub,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {tool === 'eraser' ? '◻' : '✎'}
          </button>
          <input type="color" value={drawColor} aria-label="Цвет кисти" onChange={(e) => setDrawColor(e.target.value)} style={{ width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
          <input type="range" min={1} max={12} value={drawSize} aria-label="Толщина кисти" onChange={(e) => setDrawSize(+e.target.value)} style={{ width: 44, accentColor: '#888' }} title={'Толщина: ' + drawSize} />
        </div>
      )}

      {divider}

      {/* Panel label */}
      <span style={{ fontSize: 8, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '.03em', marginTop: 2, marginBottom: 2 }}>Панели</span>

      {/* Panel toggles (visually distinct: outlined style) */}
      {PANEL_BUTTONS.map((p) => {
        const active = leftPanel === p.id;
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            aria-label={`Панель: ${p.label}`}
            aria-pressed={active}
            onClick={() => setLeftPanel(p.id as 'uploads' | 'elements' | 'projects')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLeftPanel(p.id as 'uploads' | 'elements' | 'projects'); } }}
            title={p.label}
            style={{
              width: 48,
              height: 42,
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              fontSize: 14,
              color: active ? C.accent : C.text,
              opacity: active ? 1 : 0.5,
              background: 'transparent',
              border: `1px solid ${active ? C.accent + '44' : 'transparent'}`,
              cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            <span style={{ fontSize: 14 }}>{p.icon}</span>
            <span style={{ fontSize: 8, fontWeight: 600 }}>{p.label}</span>
          </div>
        );
      })}

      {/* Background color picker - always visible at bottom */}
      <div style={{ marginTop: 'auto', padding: '8px 6px 6px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <div
          role="button"
          tabIndex={0}
          aria-label="Цвет фона"
          onClick={() => bgColorRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bgColorRef.current?.click(); } }}
          title="Цвет фона"
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: canvasBg,
            border: `2px solid ${C.border}`,
            cursor: 'pointer',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)',
          }}
        />
        <input
          ref={bgColorRef}
          type="color"
          value={canvasBg}
          onChange={(e) => setCanvasBg(e.target.value)}
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        />
        <span style={{ fontSize: 8, color: C.sub, fontWeight: 600 }}>Фон</span>
      </div>

      {/* Shapes submenu popover */}
      {showShapes && (
        <div style={{ ...popoverBase, top: 100, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, minWidth: 140 }}>
          {SHAPE_OPTIONS.map((s) => (
            <div key={s.id} role="button" tabIndex={0} aria-label={s.label} onClick={() => handleShapeClick(s.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleShapeClick(s.id); } }} style={{ padding: '8px 6px', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', background: shapeSub === s.id ? C.accentDim : 'transparent', color: shapeSub === s.id ? C.accent : C.sub, transition: 'all .12s' }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Lines submenu popover */}
      {showLines && (
        <div style={{ ...popoverBase, top: 144, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {LINE_OPTIONS.map((l) =>
            submenuItem(l.id, l.icon, l.label, tool === l.id, () => handleLineClick(l.id))
          )}
        </div>
      )}

      {/* Insert submenu popover */}
      {showInsert && (
        <div style={{ ...popoverBase, top: 188, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {INSERT_OPTIONS.map((ins) =>
            submenuItem(ins.id, ins.icon, ins.label, false, () => handleInsertClick(ins.id))
          )}
        </div>
      )}

      {/* Table size picker popover */}
      {showTablePicker && (
        <div style={{ ...popoverBase, top: 188, padding: 12 }}>
          <div style={{ fontSize: 10, color: C.sub, marginBottom: 6, fontWeight: 600, textAlign: 'center' }}>
            {tableHover.r > 0 ? `${tableHover.r} × ${tableHover.c}` : 'Выберите размер'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 20px)', gap: 2 }}>
            {Array.from({ length: 25 }, (_, i) => {
              const r = Math.floor(i / 5) + 1, c = (i % 5) + 1;
              const isActive = r <= tableHover.r && c <= tableHover.c;
              return (
                <div key={i}
                  role="button"
                  tabIndex={0}
                  aria-label={`${r}×${c} таблица`}
                  onMouseEnter={() => setTableHover({ r, c })}
                  onClick={() => handleTableSelect(r, c)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTableSelect(r, c); } }}
                  style={{ width: 20, height: 20, borderRadius: 3, border: `1px solid ${isActive ? C.accent : C.border}`, background: isActive ? C.accentDim : C.surface, cursor: 'pointer', transition: 'all .1s' }} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
