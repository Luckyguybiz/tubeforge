import { create } from 'zustand';
import { uid } from '@/lib/utils';
import { HistoryManager } from '@/lib/history';
import { CANVAS_W, CANVAS_H, CANVAS_DEFAULT_BG, CANVAS_DEFAULT_DRAW_COLOR, CANVAS_DEFAULT_DRAW_SIZE, CANVAS_ZOOM_MIN, CANVAS_ZOOM_MAX, STICKY_NOTE_COLOR, STICKY_NOTE_TEXT_COLOR } from '@/lib/constants';
import type { CanvasElement, AIResult } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Snapshot type — the slice of state tracked by undo/redo            */
/* ------------------------------------------------------------------ */
interface CanvasSnapshot {
  els: CanvasElement[];
  canvasBg: string;
}

/* ------------------------------------------------------------------ */
/*  Store interface                                                    */
/* ------------------------------------------------------------------ */
interface ThumbnailState {
  step: string;
  tool: string;
  els: CanvasElement[];
  selIds: string[];
  drag: { id: string; ox: number; oy: number } | null;
  resize: { id: string } | null;
  canvasBg: string;
  drawing: boolean;
  drawPts: { x: number; y: number }[];
  drawColor: string;
  drawSize: number;
  aiPrompt: string;
  aiResults: AIResult[];
  aiLoading: boolean;
  aiStyle: string;
  aiCount: number;

  // Undo/Redo — exposed counts for UI binding
  historyCount: number;
  futureCount: number;

  // Clipboard
  clipboard: CanvasElement[] | null;

  // Zoom/Pan
  zoom: number;
  panX: number;
  panY: number;

  // Left panel
  leftPanel: 'none' | 'uploads' | 'elements' | 'projects' | 'photos';

  // Canvas size
  canvasW: number;
  canvasH: number;

  // Snap guides
  guides: { x: number[]; y: number[] };

  // Shape sub-tool
  shapeSub: 'rect' | 'circle' | 'triangle' | 'star';

  // AI reference image
  aiReferenceImage: string | null;

  // Line preview
  linePreview: { x1: number; y1: number; x2: number; y2: number } | null;

  // Context menu
  contextMenu: { x: number; y: number; elId: string | null } | null;

  // View settings (Phase 1)
  showRulers: boolean;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  snapToElements: boolean;
  userGuides: { axis: 'x' | 'y'; pos: number }[];

  // Marquee selection (Phase 2)
  marquee: { x: number; y: number; w: number; h: number } | null;

  // Resize handle direction (Phase 2)
  resizeDir: string | null;

  // Copy/paste style (Phase 8)
  styleClipboard: Partial<CanvasElement> | null;

  // Phase 1-10 setters
  setShowRulers: (v: boolean) => void;
  setShowGrid: (v: boolean) => void;
  setGridSize: (v: number) => void;
  setSnapToGrid: (v: boolean) => void;
  setSnapToElements: (v: boolean) => void;
  addUserGuide: (axis: 'x' | 'y', pos: number) => void;
  removeUserGuide: (idx: number) => void;
  setMarquee: (m: { x: number; y: number; w: number; h: number } | null) => void;
  setResizeDir: (d: string | null) => void;

  // Lock/visibility (Phase 2)
  toggleLock: (id: string) => void;
  toggleVisible: (id: string) => void;

  // Copy/paste style (Phase 8)
  copyStyle: () => void;
  pasteStyle: () => void;

  // Move layer (Phase 2)
  moveLayer: (id: string, direction: 'up' | 'down') => void;

  // Magic resize (Phase 10)
  magicResize: (newW: number, newH: number) => void;

  // Basic setters
  setStep: (s: string) => void;
  setTool: (t: string) => void;
  setSelIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  setDrag: (d: { id: string; ox: number; oy: number } | null) => void;
  setResize: (r: { id: string } | null) => void;
  setCanvasBg: (c: string) => void;
  setDrawing: (d: boolean) => void;
  setDrawPts: (pts: { x: number; y: number }[] | ((prev: { x: number; y: number }[]) => { x: number; y: number }[])) => void;
  setDrawColor: (c: string) => void;
  setDrawSize: (s: number) => void;
  setAiPrompt: (p: string) => void;
  setAiResults: (r: AIResult[]) => void;
  setAiLoading: (l: boolean) => void;
  setAiStyle: (s: string) => void;
  setAiCount: (n: number) => void;
  setLeftPanel: (p: 'none' | 'uploads' | 'elements' | 'projects') => void;
  setShapeSub: (s: 'rect' | 'circle' | 'triangle' | 'star') => void;
  setAiReferenceImage: (url: string | null) => void;
  setLinePreview: (p: { x1: number; y1: number; x2: number; y2: number } | null) => void;
  setContextMenu: (m: { x: number; y: number; elId: string | null } | null) => void;

  // History
  pushHistory: () => void;
  /** Debounced push — collapses rapid calls (drag, resize) into one undo step */
  pushHistoryDebounced: () => void;
  undo: () => void;
  redo: () => void;

  // Clipboard
  copySelected: () => void;
  pasteClipboard: () => void;
  cutSelected: () => void;
  duplicateSelected: () => void;

  // Zoom
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;

  // Canvas size
  setCanvasSize: (w: number, h: number) => void;

  // Guides
  setGuides: (g: { x: number[]; y: number[] }) => void;

  // Element creators
  addText: () => void;
  addRect: () => void;
  addCircle: () => void;
  addImage: (dataUrl: string) => void;
  addPath: (path: string, color: string, strokeW: number) => void;
  addLine: (x1?: number, y1?: number, x2?: number, y2?: number) => void;
  addArrow: (x1?: number, y1?: number, x2?: number, y2?: number) => void;
  addStickyNote: (x?: number, y?: number) => void;
  addTable: (rows?: number, cols?: number, x?: number, y?: number) => void;
  addShape: (shapeType: string, x?: number, y?: number) => void;

  // Element operations
  updEl: (id: string, patch: Partial<CanvasElement>) => void;
  delEl: (id: string) => void;
  bringFront: (id: string) => void;
  sendBack: (id: string) => void;

  // Grouping
  groupSelected: () => void;
  ungroupSelected: () => void;

  // Backward-compatible selId setter
  setSelId: (id: string | null) => void;

  // Backward compat: raw arrays (derived from historyManager for code that reads them)
  history: CanvasElement[][];
  future: CanvasElement[][];

  // Save/Load
  loadFromProject: (thumbnailData: { els?: CanvasElement[]; canvasBg?: string; canvasW?: number; canvasH?: number } | null) => void;
  exportState: () => { els: CanvasElement[]; canvasBg: string; canvasW: number; canvasH: number };
}

/* ------------------------------------------------------------------ */
/*  History manager instance (lives outside the store)                 */
/* ------------------------------------------------------------------ */
const hm = new HistoryManager<CanvasSnapshot>({ maxHistory: 50 });

/** Helper to sync historyCount/futureCount after any history operation */
function histCounts() {
  return { historyCount: hm.undoCount, futureCount: hm.redoCount };
}

/** Build current snapshot from state */
function snap(s: { els: CanvasElement[]; canvasBg: string }): CanvasSnapshot {
  return { els: s.els, canvasBg: s.canvasBg };
}

export const useThumbnailStore = create<ThumbnailState>((set, get) => ({
  step: 'editor',
  tool: 'select',
  els: [],
  selIds: [],
  drag: null,
  resize: null,
  canvasBg: CANVAS_DEFAULT_BG,
  drawing: false,
  drawPts: [],
  drawColor: CANVAS_DEFAULT_DRAW_COLOR,
  drawSize: CANVAS_DEFAULT_DRAW_SIZE,
  aiPrompt: '',
  aiResults: [],
  aiLoading: false,
  aiStyle: 'realistic',
  aiCount: 4,

  // History counts
  historyCount: 0,
  futureCount: 0,

  // Backward-compat empty arrays (never actually stored; UI should use historyCount/futureCount)
  history: [],
  future: [],

  // Clipboard
  clipboard: null,

  // Zoom/Pan
  zoom: 1,
  panX: 0,
  panY: 0,

  // Left panel
  leftPanel: 'none',

  // Canvas size
  canvasW: CANVAS_W,
  canvasH: CANVAS_H,

  // Guides
  guides: { x: [], y: [] },

  // Shape sub
  shapeSub: 'rect',

  // AI reference
  aiReferenceImage: null,

  // Line preview
  linePreview: null,

  // Context menu
  contextMenu: null,

  // View settings (Phase 1)
  showRulers: false,
  showGrid: false,
  gridSize: 50,
  snapToGrid: false,
  snapToElements: true,
  userGuides: [],

  // Marquee (Phase 2)
  marquee: null,
  resizeDir: null,

  // Style clipboard (Phase 8)
  styleClipboard: null,

  // ===== Basic setters =====
  setStep: (s) => set({ step: s }),
  setTool: (t) => set({ tool: t }),
  setSelIds: (ids) => set({ selIds: ids }),
  addToSelection: (id) => set((s) => ({
    selIds: s.selIds.includes(id) ? s.selIds : [...s.selIds, id],
  })),
  setDrag: (d) => set({ drag: d }),
  setResize: (r) => set({ resize: r }),
  setCanvasBg: (c) => {
    get().pushHistory();
    set({ canvasBg: c, ...histCounts() });
  },
  setDrawing: (d) => set({ drawing: d }),
  setDrawPts: (pts) =>
    set((s) => ({
      drawPts: typeof pts === 'function' ? pts(s.drawPts) : pts,
    })),
  setDrawColor: (c) => set({ drawColor: c }),
  setDrawSize: (s) => set({ drawSize: s }),
  setAiPrompt: (p) => set({ aiPrompt: p }),
  setAiResults: (r) => set({ aiResults: r }),
  setAiLoading: (l) => set({ aiLoading: l }),
  setAiStyle: (s) => set({ aiStyle: s }),
  setAiCount: (n) => set({ aiCount: n }),
  setLeftPanel: (p) => set((s) => ({ leftPanel: s.leftPanel === p ? 'none' : p })),
  setShapeSub: (s) => set({ shapeSub: s }),
  setAiReferenceImage: (url) => set({ aiReferenceImage: url }),
  setLinePreview: (p) => set({ linePreview: p }),
  setContextMenu: (m) => set({ contextMenu: m }),

  // ===== Backward-compatible selId setter =====
  setSelId: (id) => set({ selIds: id ? [id] : [] }),

  // ===== History =====
  pushHistory: () => {
    const s = get();
    hm.push(snap(s));
    set(histCounts());
  },

  pushHistoryDebounced: () => {
    const s = get();
    hm.pushDebounced(snap(s), 300);
    set(histCounts());
  },

  undo: () => {
    const s = get();
    const prev = hm.undo(snap(s));
    if (!prev) return;
    set({
      els: prev.els,
      canvasBg: prev.canvasBg,
      selIds: [],
      ...histCounts(),
    });
  },

  redo: () => {
    const s = get();
    const next = hm.redo(snap(s));
    if (!next) return;
    set({
      els: next.els,
      canvasBg: next.canvasBg,
      selIds: [],
      ...histCounts(),
    });
  },

  // ===== Clipboard =====
  copySelected: () => {
    const { selIds, els } = get();
    const selected = els.filter((e) => selIds.includes(e.id));
    if (selected.length === 0) return;
    set({ clipboard: JSON.parse(JSON.stringify(selected)) });
  },

  pasteClipboard: () => {
    const { clipboard } = get();
    if (!clipboard || clipboard.length === 0) return;
    get().pushHistory();
    const copies = clipboard.map((e) => ({
      ...JSON.parse(JSON.stringify(e)),
      id: uid(),
      x: e.x + 20,
      y: e.y + 20,
    }));
    set((s) => ({
      els: [...s.els, ...copies],
      selIds: copies.map((c) => c.id),
    }));
  },

  cutSelected: () => {
    const { selIds, els } = get();
    const selected = els.filter((e) => selIds.includes(e.id));
    if (selected.length === 0) return;
    get().pushHistory();
    set({
      clipboard: JSON.parse(JSON.stringify(selected)),
      els: els.filter((e) => !selIds.includes(e.id)),
      selIds: [],
    });
  },

  duplicateSelected: () => {
    const { selIds, els } = get();
    const selected = els.filter((e) => selIds.includes(e.id));
    if (selected.length === 0) return;
    get().pushHistory();
    const copies = selected.map((e) => ({
      ...JSON.parse(JSON.stringify(e)),
      id: uid(),
      x: e.x + 20,
      y: e.y + 20,
    }));
    set((s) => ({
      els: [...s.els, ...copies],
      selIds: copies.map((c) => c.id),
    }));
  },

  // ===== Zoom =====
  setZoom: (z) => set({ zoom: Math.max(CANVAS_ZOOM_MIN, Math.min(CANVAS_ZOOM_MAX, z)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  zoomIn: () => set((s) => ({ zoom: Math.min(CANVAS_ZOOM_MAX, s.zoom + 0.1) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(CANVAS_ZOOM_MIN, s.zoom - 0.1) })),
  fitToScreen: () => set({ zoom: 1, panX: 0, panY: 0 }),

  // ===== Canvas size =====
  setCanvasSize: (w, h) => set({ canvasW: w, canvasH: h }),

  // ===== Guides =====
  setGuides: (g) => set({ guides: g }),

  // ===== Element creators =====
  addText: () => {
    get().pushHistory();
    const ne: CanvasElement = {
      id: uid(), type: 'text', x: 100 + Math.random() * 200, y: 100 + Math.random() * 200, w: 500, h: 80,
      text: 'New text', font: 'Instrument Sans', size: 64, bold: true, italic: false, color: '#ffffff',
      shadow: 'none', opacity: 1, bg: 'transparent', borderR: 0, rot: 0,
    };
    set((s) => ({ els: [...s.els, ne], selIds: [ne.id], tool: 'select' }));
  },

  addRect: () => {
    get().pushHistory();
    const ne: CanvasElement = {
      id: uid(), type: 'rect', x: 200 + Math.random() * 100, y: 150 + Math.random() * 100, w: 200, h: 120,
      color: '#ff2d55', opacity: 0.8, borderR: 8, border: 'none', rot: 0,
    };
    set((s) => ({ els: [...s.els, ne], selIds: [ne.id], tool: 'select' }));
  },

  addCircle: () => {
    get().pushHistory();
    const ne: CanvasElement = {
      id: uid(), type: 'circle', x: 300 + Math.random() * 100, y: 200 + Math.random() * 100, w: 120, h: 120,
      color: '#3a7bfd', opacity: 0.8, rot: 0,
    };
    set((s) => ({ els: [...s.els, ne], selIds: [ne.id], tool: 'select' }));
  },

  addImage: (dataUrl) => {
    const img = new Image();
    img.onload = () => {
      get().pushHistory();
      let w = img.width, h = img.height;
      const maxW = 400;
      if (w > maxW) { h = h * (maxW / w); w = maxW; }
      const ne: CanvasElement = { id: uid(), type: 'image', x: 100, y: 100, w, h, src: dataUrl, opacity: 1, borderR: 0, rot: 0 };
      set((s) => ({ els: [...s.els, ne], selIds: [ne.id], tool: 'select' }));
    };
    img.onerror = () => {
      console.error('[ThumbnailStore] Failed to load image');
    };
    img.src = dataUrl;
  },

  addPath: (path, color, strokeW) => {
    get().pushHistory();
    const { canvasW, canvasH } = get();
    const ne: CanvasElement = { id: uid(), type: 'path', x: 0, y: 0, w: canvasW, h: canvasH, path, color, strokeW, opacity: 1, rot: 0 };
    set((s) => ({ els: [...s.els, ne] }));
  },

  addLine: (x1, y1, x2, y2) => {
    get().pushHistory();
    const ne: CanvasElement = {
      id: uid(), type: 'line',
      x: x1 ?? 200, y: y1 ?? 200, w: 200, h: 0,
      x2: x2 ?? 400, y2: y2 ?? 200,
      strokeColor: '#ffffff', lineWidth: 2, dashStyle: 'solid',
      opacity: 1, rot: 0,
    };
    set((s) => ({ els: [...s.els, ne], selIds: [ne.id], tool: 'select' }));
  },

  addArrow: (x1, y1, x2, y2) => {
    get().pushHistory();
    const ne: CanvasElement = {
      id: uid(), type: 'arrow',
      x: x1 ?? 200, y: y1 ?? 200, w: 200, h: 0,
      x2: x2 ?? 400, y2: y2 ?? 200,
      strokeColor: '#ffffff', lineWidth: 2, arrowHead: 'end', dashStyle: 'solid',
      opacity: 1, rot: 0,
    };
    set((s) => ({ els: [...s.els, ne], selIds: [ne.id], tool: 'select' }));
  },

  addStickyNote: (x, y) => {
    get().pushHistory();
    const ne: CanvasElement = {
      id: uid(), type: 'stickyNote',
      x: x ?? 200 + Math.random() * 100, y: y ?? 150 + Math.random() * 100,
      w: 200, h: 150,
      noteColor: STICKY_NOTE_COLOR, noteText: 'Note',
      size: 14, opacity: 1, rot: 0,
    };
    set((s) => ({ els: [...s.els, ne], selIds: [ne.id], tool: 'select' }));
  },

  addTable: (rows = 3, cols = 3, x, y) => {
    get().pushHistory();
    const cellData = Array.from({ length: rows }, () => Array(cols).fill(''));
    const ne: CanvasElement = {
      id: uid(), type: 'table',
      x: x ?? 200 + Math.random() * 50, y: y ?? 150 + Math.random() * 50,
      w: cols * 100, h: rows * 36,
      rows, cols, cellData, cellHeight: 36,
      opacity: 1, rot: 0, strokeColor: 'rgba(255,255,255,.2)',
    };
    set((s) => ({ els: [...s.els, ne], selIds: [ne.id], tool: 'select' }));
  },

  addShape: (shapeType, x, y) => {
    const baseX = x ?? 200 + Math.random() * 100;
    const baseY = y ?? 150 + Math.random() * 100;
    if (shapeType === 'rect') { get().addRect(); return; }
    if (shapeType === 'circle') { get().addCircle(); return; }
    get().pushHistory();
    if (shapeType === 'triangle') {
      const w = 160, h = 140;
      const path = `M${baseX + w / 2} ${baseY} L${baseX + w} ${baseY + h} L${baseX} ${baseY + h} Z`;
      const ne: CanvasElement = {
        id: uid(), type: 'path', x: baseX, y: baseY, w, h,
        path, color: '#8b5cf6', opacity: 0.8, rot: 0,
      };
      set((s) => ({ els: [...s.els, ne], selIds: [ne.id], tool: 'select' }));
    } else if (shapeType === 'star') {
      const cx = baseX + 60, cy = baseY + 60, r = 60, ri = 25;
      let path = '';
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const radius = i % 2 === 0 ? r : ri;
        const px = cx + radius * Math.cos(a);
        const py = cy + radius * Math.sin(a);
        path += (i === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1) + ' ';
      }
      path += 'Z';
      const ne: CanvasElement = {
        id: uid(), type: 'path', x: baseX, y: baseY, w: 120, h: 120,
        path, color: '#f59e0b', opacity: 0.8, rot: 0,
      };
      set((s) => ({ els: [...s.els, ne], selIds: [ne.id], tool: 'select' }));
    }
  },

  // ===== Element operations =====
  updEl: (id, patch) => {
    set((s) => ({ els: s.els.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  },

  delEl: (id) => {
    get().pushHistory();
    set((s) => ({ els: s.els.filter((e) => e.id !== id), selIds: s.selIds.filter((sid) => sid !== id) }));
  },

  bringFront: (id) => {
    get().pushHistory();
    set((s) => {
      const el = s.els.find((e) => e.id === id);
      if (!el) return s;
      return { els: [...s.els.filter((e) => e.id !== id), el] };
    });
  },

  sendBack: (id) => {
    get().pushHistory();
    set((s) => {
      const el = s.els.find((e) => e.id === id);
      if (!el) return s;
      return { els: [el, ...s.els.filter((e) => e.id !== id)] };
    });
  },

  // ===== Grouping =====
  groupSelected: () => {
    const { selIds } = get();
    if (selIds.length < 2) return;
    get().pushHistory();
    const groupId = uid();
    set((s) => ({
      els: s.els.map((e) => selIds.includes(e.id) ? { ...e, groupId } : e),
    }));
  },

  ungroupSelected: () => {
    const { selIds, els } = get();
    if (selIds.length === 0) return;
    // Find all group IDs for selected elements
    const groupIds = new Set(els.filter((e) => selIds.includes(e.id) && e.groupId).map((e) => e.groupId!));
    if (groupIds.size === 0) return;
    get().pushHistory();
    set((s) => ({
      els: s.els.map((e) => e.groupId && groupIds.has(e.groupId) ? { ...e, groupId: undefined } : e),
    }));
  },

  // ===== View settings (Phase 1) =====
  setShowRulers: (v) => set({ showRulers: v }),
  setShowGrid: (v) => set({ showGrid: v }),
  setGridSize: (v) => set({ gridSize: v }),
  setSnapToGrid: (v) => set({ snapToGrid: v }),
  setSnapToElements: (v) => set({ snapToElements: v }),
  addUserGuide: (axis, pos) => set((s) => ({ userGuides: [...s.userGuides, { axis, pos }] })),
  removeUserGuide: (idx) => set((s) => ({ userGuides: s.userGuides.filter((_, i) => i !== idx) })),
  setMarquee: (m) => set({ marquee: m }),
  setResizeDir: (d) => set({ resizeDir: d }),

  // ===== Lock/visibility (Phase 2) =====
  toggleLock: (id) => {
    set((s) => ({ els: s.els.map((e) => e.id === id ? { ...e, locked: !e.locked } : e) }));
  },
  toggleVisible: (id) => {
    set((s) => ({ els: s.els.map((e) => e.id === id ? { ...e, visible: e.visible === false ? undefined : false } : e) }));
  },

  // ===== Move layer (Phase 2) =====
  moveLayer: (id, direction) => {
    get().pushHistory();
    set((s) => {
      const idx = s.els.findIndex((e) => e.id === id);
      if (idx === -1) return s;
      const newIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (newIdx < 0 || newIdx >= s.els.length) return s;
      const arr = [...s.els];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { els: arr };
    });
  },

  // ===== Copy/paste style (Phase 8) =====
  copyStyle: () => {
    const { selIds, els } = get();
    if (selIds.length !== 1) return;
    const el = els.find((e) => e.id === selIds[0]);
    if (!el) return;
    const { id, type, x, y, w, h, text, src, path, noteText, cellData, ...style } = el;
    set({ styleClipboard: style as Partial<CanvasElement> });
  },
  pasteStyle: () => {
    const { selIds, styleClipboard } = get();
    if (!styleClipboard || selIds.length === 0) return;
    get().pushHistory();
    set((s) => ({
      els: s.els.map((e) => selIds.includes(e.id) ? { ...e, ...styleClipboard } : e),
    }));
  },

  // ===== Magic resize (Phase 10) =====
  magicResize: (newW, newH) => {
    get().pushHistory();
    const { canvasW, canvasH } = get();
    const scaleX = newW / canvasW;
    const scaleY = newH / canvasH;
    set((s) => ({
      canvasW: newW,
      canvasH: newH,
      els: s.els.map((e) => ({
        ...e,
        x: Math.round(e.x * scaleX),
        y: Math.round(e.y * scaleY),
        w: Math.round(e.w * scaleX),
        h: Math.round(e.h * scaleY),
        size: e.size ? Math.round(e.size * Math.min(scaleX, scaleY)) : e.size,
        x2: e.x2 ? Math.round(e.x2 * scaleX) : e.x2,
        y2: e.y2 ? Math.round(e.y2 * scaleY) : e.y2,
      })),
    }));
  },

  // ===== Save/Load =====
  loadFromProject: (thumbnailData) => {
    if (!thumbnailData) return;
    hm.clear();
    set({
      els: thumbnailData.els || [],
      canvasBg: thumbnailData.canvasBg || '#0c0c14',
      canvasW: thumbnailData.canvasW || CANVAS_W,
      canvasH: thumbnailData.canvasH || CANVAS_H,
      selIds: [],
      ...histCounts(),
    });
  },

  exportState: () => {
    const s = get();
    return { els: s.els, canvasBg: s.canvasBg, canvasW: s.canvasW, canvasH: s.canvasH };
  },
}));
