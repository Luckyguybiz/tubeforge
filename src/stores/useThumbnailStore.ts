import { create } from 'zustand';
import { uid } from '@/lib/utils';
import { HistoryManager } from '@/lib/history';
import { CANVAS_W, CANVAS_H, CANVAS_DEFAULT_BG, CANVAS_DEFAULT_DRAW_COLOR, CANVAS_DEFAULT_DRAW_SIZE, CANVAS_ZOOM_MIN, CANVAS_ZOOM_MAX, STICKY_NOTE_COLOR, STICKY_NOTE_TEXT_COLOR } from '@/lib/constants';
import { SHAPE_PATHS } from '@/lib/element-presets';
import type { CanvasElement, AIResult } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Snapshot type — the slice of state tracked by undo/redo            */
/* ------------------------------------------------------------------ */
export interface CanvasSnapshot {
  els: CanvasElement[];
  canvasBg: string;
  canvasBgGradient?: { from: string; to: string; angle: number; type: 'linear' | 'radial' } | null;
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
  leftPanel: 'none' | 'uploads' | 'elements' | 'projects' | 'stock' | 'aiBg' | 'aiText' | 'templates' | 'background' | 'textStyles' | 'creatorStyles';

  // Canvas background image (AI-generated or from stock)
  canvasBgImage: string | null;

  // Canvas background gradient
  canvasBgGradient: { from: string; to: string; angle: number; type: 'linear' | 'radial' } | null;

  // Canvas size
  canvasW: number;
  canvasH: number;

  // Snap guides (auto-generated during drag)
  guides: { x: number[]; y: number[] };

  // Custom user-placed guides (magenta, draggable)
  customGuides: Array<{ id: string; type: 'h' | 'v'; position: number }>;

  // Snap to grid
  snapToGrid: boolean;

  // Snap to pixel (round positions to integers)
  snapToPixel: boolean;

  // Shape sub-tool
  shapeSub: 'rect' | 'circle' | 'triangle' | 'star' | 'pentagon' | 'hexagon' | 'arrowShape' | 'speechBubble' | 'heart';

  // AI reference image
  aiReferenceImage: string | null;

  // Line preview
  linePreview: { x1: number; y1: number; x2: number; y2: number } | null;

  // Context menu (x/y = screen coords, canvasX/canvasY = canvas-space coords for paste-at-position)
  contextMenu: { x: number; y: number; canvasX: number; canvasY: number; elId: string | null } | null;

  // Project colors — last 12 colors used, auto-populated
  projectColors: string[];

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
  setLeftPanel: (p: 'none' | 'uploads' | 'elements' | 'projects' | 'stock' | 'aiBg' | 'aiText' | 'templates' | 'background' | 'textStyles' | 'creatorStyles') => void;
  setSnapToGrid: (v: boolean) => void;
  setSnapToPixel: (v: boolean) => void;
  setCanvasBgImage: (url: string | null) => void;
  setCanvasBgGradient: (g: { from: string; to: string; angle: number; type: 'linear' | 'radial' } | null) => void;
  setShapeSub: (s: 'rect' | 'circle' | 'triangle' | 'star' | 'pentagon' | 'hexagon' | 'arrowShape' | 'speechBubble' | 'heart') => void;
  setAiReferenceImage: (url: string | null) => void;
  setLinePreview: (p: { x1: number; y1: number; x2: number; y2: number } | null) => void;
  setContextMenu: (m: { x: number; y: number; canvasX: number; canvasY: number; elId: string | null } | null) => void;

  // History
  pushHistory: () => void;
  /** Debounced push — collapses rapid calls (drag, resize) into one undo step */
  pushHistoryDebounced: () => void;
  undo: () => void;
  redo: () => void;
  /** Get last N history snapshots (newest first) for visual history panel */
  getRecentSnapshots: (count: number) => CanvasSnapshot[];
  /** Restore a specific snapshot from history */
  restoreSnapshot: (snapshot: CanvasSnapshot) => void;

  // Clipboard
  copySelected: () => void;
  pasteClipboard: () => void;
  /** Paste at original position (same X, Y as copied element) */
  pasteInPlace: () => void;
  /** Paste clipboard elements centered at a specific canvas position */
  pasteAtPosition: (canvasX: number, canvasY: number) => void;
  cutSelected: () => void;
  duplicateSelected: () => void;

  // Select Similar
  /** Select all elements matching criteria relative to a target element */
  selectSimilar: (targetId: string, by: 'type' | 'color' | 'font') => void;

  // Zoom
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
  /** Zoom to fit selected elements with padding */
  zoomToSelection: () => void;

  // Canvas size
  setCanvasSize: (w: number, h: number) => void;
  /** Resize canvas and optionally scale all elements proportionally */
  setCanvasSizeWithScale: (w: number, h: number, scaleElements: boolean) => void;

  // Guides
  setGuides: (g: { x: number[]; y: number[] }) => void;

  // Custom user-placed guides
  addCustomGuide: (type: 'h' | 'v') => void;
  removeCustomGuide: (id: string) => void;
  moveCustomGuide: (id: string, position: number) => void;
  clearCustomGuides: () => void;

  // Element creators
  addText: () => void;
  addTextPreset: (preset: Partial<CanvasElement>) => void;
  addRect: () => void;
  addCircle: () => void;
  addImage: (dataUrl: string) => void;
  addPath: (path: string, color: string, strokeW: number) => void;
  addLine: (x1?: number, y1?: number, x2?: number, y2?: number) => void;
  addArrow: (x1?: number, y1?: number, x2?: number, y2?: number) => void;
  addStickyNote: (x?: number, y?: number) => void;
  addTable: (rows?: number, cols?: number, x?: number, y?: number) => void;
  addShape: (shapeType: string, x?: number, y?: number) => void;

  // Image replace
  replaceImage: (id: string, dataUrl: string) => void;

  // Element operations
  updEl: (id: string, patch: Partial<CanvasElement>) => void;
  delEl: (id: string) => void;
  delSelected: () => void;
  bringFront: (id: string) => void;
  sendBack: (id: string) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  moveLayer: (id: string, newIndex: number) => void;
  renameElement: (id: string, name: string) => void;

  // Alignment helpers (for quick-action toolbar)
  alignSelected: (alignment: 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom') => void;
  distributeSelected: (axis: 'horizontal' | 'vertical') => void;
  groupSelected: () => void;
  ungroupSelected: () => void;

  // Batch operations (multi-select)
  batchUpdateSelected: (patch: Partial<CanvasElement>) => void;
  batchResizeSelected: (scalePct: number) => void;

  // Flip/Mirror
  flipHorizontal: (id: string) => void;
  flipVertical: (id: string) => void;

  // Backward-compatible selId setter
  setSelId: (id: string | null) => void;

  // Backward compat: raw arrays (derived from historyManager for code that reads them)
  history: CanvasElement[][];
  future: CanvasElement[][];

  // Copy/Paste Style
  copiedStyle: Partial<CanvasElement> | null;
  copyStyle: () => void;
  pasteStyle: () => void;

  // Project colors
  addProjectColor: (color: string) => void;

  // Save/Load
  loadFromProject: (thumbnailData: { els?: CanvasElement[]; canvasBg?: string; canvasBgImage?: string | null; canvasBgGradient?: { from: string; to: string; angle: number; type: 'linear' | 'radial' } | null; canvasW?: number; canvasH?: number; projectColors?: string[] } | null) => void;
  exportState: () => { els: CanvasElement[]; canvasBg: string; canvasBgImage: string | null; canvasBgGradient: { from: string; to: string; angle: number; type: 'linear' | 'radial' } | null; canvasW: number; canvasH: number; projectColors: string[] };

  // Templates
  applyTemplate: (elements: Omit<CanvasElement, 'id'>[], bg: string) => void;
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
function snap(s: { els: CanvasElement[]; canvasBg: string; canvasBgGradient?: { from: string; to: string; angle: number; type: 'linear' | 'radial' } | null }): CanvasSnapshot {
  return { els: s.els, canvasBg: s.canvasBg, canvasBgGradient: s.canvasBgGradient ?? null };
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

  // Copy/Paste Style
  copiedStyle: null,

  // Zoom/Pan
  zoom: 1,
  panX: 0,
  panY: 0,

  // Left panel
  leftPanel: 'none',

  // Canvas background image
  canvasBgImage: null,

  // Canvas background gradient
  canvasBgGradient: null,

  // Canvas size
  canvasW: CANVAS_W,
  canvasH: CANVAS_H,

  // Guides
  guides: { x: [], y: [] },

  // Custom user-placed guides
  customGuides: [],

  // Snap to grid
  snapToGrid: false,

  // Snap to pixel
  snapToPixel: false,

  // Shape sub
  shapeSub: 'rect',

  // AI reference
  aiReferenceImage: null,

  // Line preview
  linePreview: null,

  // Context menu
  contextMenu: null,

  // Project colors
  projectColors: [],

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
  setSnapToGrid: (v) => set({ snapToGrid: v }),
  setSnapToPixel: (v) => set({ snapToPixel: v }),
  setCanvasBgImage: (url) => set({ canvasBgImage: url }),
  setCanvasBgGradient: (g) => {
    get().pushHistory();
    set({ canvasBgGradient: g, ...histCounts() });
  },
  setShapeSub: (s) => set({ shapeSub: s }),
  setAiReferenceImage: (url) => set({ aiReferenceImage: url }),
  setLinePreview: (p) => set({ linePreview: p }),
  setContextMenu: (m) => set({ contextMenu: m }),

  // ===== Flip/Mirror =====
  flipHorizontal: (id) => {
    get().pushHistory();
    set((s) => ({
      els: s.els.map((e) => (e.id === id ? { ...e, flipX: !e.flipX } : e)),
    }));
  },

  flipVertical: (id) => {
    get().pushHistory();
    set((s) => ({
      els: s.els.map((e) => (e.id === id ? { ...e, flipY: !e.flipY } : e)),
    }));
  },

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
      canvasBgGradient: prev.canvasBgGradient ?? null,
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
      canvasBgGradient: next.canvasBgGradient ?? null,
      selIds: [],
      ...histCounts(),
    });
  },

  getRecentSnapshots: (count: number) => {
    return hm.getRecentSnapshots(count);
  },

  restoreSnapshot: (snapshot: CanvasSnapshot) => {
    const s = get();
    hm.push(snap(s));
    set({
      els: snapshot.els,
      canvasBg: snapshot.canvasBg,
      canvasBgGradient: snapshot.canvasBgGradient ?? null,
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
      x: e.x + 10,
      y: e.y + 10,
    }));
    set((s) => ({
      els: [...s.els, ...copies],
      selIds: copies.map((c) => c.id),
    }));
  },

  // ===== Paste In Place =====
  pasteInPlace: () => {
    const { clipboard } = get();
    if (!clipboard || clipboard.length === 0) return;
    get().pushHistory();
    const copies = clipboard.map((e) => ({
      ...JSON.parse(JSON.stringify(e)),
      id: uid(),
      // Keep original position — no offset
    }));
    set((s) => ({
      els: [...s.els, ...copies],
      selIds: copies.map((c) => c.id),
    }));
  },

  // ===== Paste At Position (right-click paste) =====
  pasteAtPosition: (canvasX: number, canvasY: number) => {
    const { clipboard } = get();
    if (!clipboard || clipboard.length === 0) return;
    get().pushHistory();
    // Calculate the bounding box center of clipboard elements
    const minX = Math.min(...clipboard.map((e) => e.x));
    const minY = Math.min(...clipboard.map((e) => e.y));
    const maxX = Math.max(...clipboard.map((e) => e.x + e.w));
    const maxY = Math.max(...clipboard.map((e) => e.y + e.h));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const dx = canvasX - centerX;
    const dy = canvasY - centerY;
    const copies = clipboard.map((e) => ({
      ...JSON.parse(JSON.stringify(e)),
      id: uid(),
      x: e.x + dx,
      y: e.y + dy,
    }));
    set((s) => ({
      els: [...s.els, ...copies],
      selIds: copies.map((c) => c.id),
    }));
  },

  // ===== Select Similar =====
  selectSimilar: (targetId: string, by: 'type' | 'color' | 'font') => {
    const { els } = get();
    const target = els.find((e) => e.id === targetId);
    if (!target) return;
    let matchIds: string[];
    switch (by) {
      case 'type':
        matchIds = els.filter((e) => e.type === target.type).map((e) => e.id);
        break;
      case 'color':
        matchIds = els.filter((e) => {
          // Compare primary color: text color for text, bg/noteColor for shapes, border for shapes
          const tColor = target.type === 'text' ? target.color : (target.bg ?? target.noteColor ?? target.color);
          const eColor = e.type === 'text' ? e.color : (e.bg ?? e.noteColor ?? e.color);
          return tColor && eColor && tColor.toLowerCase() === eColor.toLowerCase();
        }).map((e) => e.id);
        break;
      case 'font':
        matchIds = els.filter((e) => e.type === 'text' && target.type === 'text' && (e.font ?? 'Inter') === (target.font ?? 'Inter')).map((e) => e.id);
        break;
      default:
        matchIds = [targetId];
    }
    set({ selIds: matchIds });
  },

  // ===== Copy/Paste Style =====
  copyStyle: () => {
    const { selIds, els } = get();
    if (selIds.length === 0) return;
    const el = els.find((e) => e.id === selIds[selIds.length - 1]);
    if (!el) return;
    // Extract only visual/style properties
    const style: Partial<CanvasElement> = {};
    if (el.color !== undefined) style.color = el.color;
    if (el.size !== undefined) style.size = el.size;
    if (el.font !== undefined) style.font = el.font;
    if (el.fontWeight !== undefined) style.fontWeight = el.fontWeight;
    if (el.bold !== undefined) style.bold = el.bold;
    if (el.italic !== undefined) style.italic = el.italic;
    if (el.underline !== undefined) style.underline = el.underline;
    if (el.textAlign !== undefined) style.textAlign = el.textAlign;
    if (el.opacity !== undefined) style.opacity = el.opacity;
    if (el.borderColor !== undefined) style.borderColor = el.borderColor;
    if (el.borderWidth !== undefined) style.borderWidth = el.borderWidth;
    if (el.borderR !== undefined) style.borderR = el.borderR;
    if (el.shadow !== undefined) style.shadow = el.shadow;
    if (el.glow !== undefined) style.glow = el.glow;
    if (el.blur !== undefined) style.blur = el.blur;
    if (el.textGradient !== undefined) style.textGradient = el.textGradient;
    if (el.textStroke !== undefined) style.textStroke = el.textStroke;
    if (el.textStrokeWidth !== undefined) style.textStrokeWidth = el.textStrokeWidth;
    if (el.textStrokes !== undefined) style.textStrokes = el.textStrokes;
    if (el.pulse !== undefined) style.pulse = el.pulse;
    if (el.letterSpacing !== undefined) style.letterSpacing = el.letterSpacing;
    if (el.lineHeight !== undefined) style.lineHeight = el.lineHeight;
    if (el.blendMode !== undefined) style.blendMode = el.blendMode;
    if (el.shapeShadow !== undefined) style.shapeShadow = el.shapeShadow;
    if (el.pattern !== undefined) style.pattern = el.pattern;
    if (el.patternColor !== undefined) style.patternColor = el.patternColor;
    if (el.patternSize !== undefined) style.patternSize = el.patternSize;
    if (el.borderDash !== undefined) style.borderDash = el.borderDash;
    if (el.shapeGradient !== undefined) style.shapeGradient = el.shapeGradient;
    if (el.clipMask !== undefined) style.clipMask = el.clipMask;
    if (el.arrowStartStyle !== undefined) style.arrowStartStyle = el.arrowStartStyle;
    if (el.arrowEndStyle !== undefined) style.arrowEndStyle = el.arrowEndStyle;
    if (el.arrowHeadSize !== undefined) style.arrowHeadSize = el.arrowHeadSize;
    set({ copiedStyle: JSON.parse(JSON.stringify(style)) });
  },

  pasteStyle: () => {
    const { copiedStyle, selIds, els } = get();
    if (!copiedStyle || selIds.length === 0) return;
    get().pushHistory();
    // Text-specific properties that should not be applied to non-text elements
    const textOnlyKeys = new Set<string>(['size', 'font', 'fontWeight', 'bold', 'italic', 'underline', 'textAlign', 'textGradient', 'textStroke', 'textStrokeWidth', 'textStrokes', 'letterSpacing', 'lineHeight']);
    const textTypes = new Set(['text', 'stickyNote']);
    set((s) => ({
      els: s.els.map((el) => {
        if (!selIds.includes(el.id)) return el;
        const patch: Partial<CanvasElement> = {};
        for (const [key, value] of Object.entries(copiedStyle)) {
          // Skip text-only properties for non-text elements
          if (textOnlyKeys.has(key) && !textTypes.has(el.type)) continue;
          (patch as Record<string, unknown>)[key] = value;
        }
        return { ...el, ...patch };
      }),
    }));
  },

  // ===== Project Colors =====
  addProjectColor: (color: string) => {
    const normalized = color.toLowerCase();
    set((s) => {
      const filtered = s.projectColors.filter((c) => c !== normalized);
      return { projectColors: [normalized, ...filtered].slice(0, 12) };
    });
  },

  // ===== Zoom =====
  setZoom: (z) => set({ zoom: Math.max(CANVAS_ZOOM_MIN, Math.min(CANVAS_ZOOM_MAX, z)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  zoomIn: () => set((s) => ({ zoom: Math.min(CANVAS_ZOOM_MAX, s.zoom + 0.1) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(CANVAS_ZOOM_MIN, s.zoom - 0.1) })),
  fitToScreen: () => set({ zoom: 1, panX: 0, panY: 0 }),
  zoomToSelection: () => {
    const s = get();
    const selected = s.els.filter((e) => s.selIds.includes(e.id));
    if (selected.length === 0) return;
    const minX = Math.min(...selected.map((e) => e.x));
    const minY = Math.min(...selected.map((e) => e.y));
    const maxX = Math.max(...selected.map((e) => e.x + e.w));
    const maxY = Math.max(...selected.map((e) => e.y + e.h));
    const bw = maxX - minX;
    const bh = maxY - minY;
    if (bw < 1 || bh < 1) return;
    const PAD = 80;
    const zoomX = s.canvasW / (bw + PAD * 2);
    const zoomY = s.canvasH / (bh + PAD * 2);
    const newZoom = Math.min(Math.max(Math.min(zoomX, zoomY), CANVAS_ZOOM_MIN), CANVAS_ZOOM_MAX);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const panXVal = (s.canvasW / 2 - cx) * (newZoom > 1 ? 0.5 : 1);
    const panYVal = (s.canvasH / 2 - cy) * (newZoom > 1 ? 0.5 : 1);
    set({ zoom: newZoom, panX: panXVal, panY: panYVal });
  },

  // ===== Canvas size =====
  setCanvasSize: (w, h) => {
    const s = get();
    const oldW = s.canvasW;
    const oldH = s.canvasH;
    // Apply pin constraints: maintain distance from pinned edges
    const pinnedEls = s.els.filter((el) => el.pin && (el.pin.top || el.pin.right || el.pin.bottom || el.pin.left));
    if (pinnedEls.length > 0 && (w !== oldW || h !== oldH)) {
      const updatedEls = s.els.map((el) => {
        if (!el.pin) return el;
        let newX = el.x, newY = el.y;
        if (el.pin.right && !el.pin.left) {
          const distFromRight = oldW - (el.x + el.w);
          newX = w - el.w - distFromRight;
        }
        if (el.pin.bottom && !el.pin.top) {
          const distFromBottom = oldH - (el.y + el.h);
          newY = h - el.h - distFromBottom;
        }
        // If pinned both sides, stretch width/height
        let newW = el.w, newH = el.h;
        if (el.pin.left && el.pin.right) {
          const distFromLeft = el.x;
          const distFromRight = oldW - (el.x + el.w);
          newX = distFromLeft;
          newW = w - distFromLeft - distFromRight;
        }
        if (el.pin.top && el.pin.bottom) {
          const distFromTop = el.y;
          const distFromBottom = oldH - (el.y + el.h);
          newY = distFromTop;
          newH = h - distFromTop - distFromBottom;
        }
        return { ...el, x: Math.round(newX), y: Math.round(newY), w: Math.max(10, Math.round(newW)), h: Math.max(10, Math.round(newH)) };
      });
      set({ canvasW: w, canvasH: h, els: updatedEls });
    } else {
      set({ canvasW: w, canvasH: h });
    }
  },

  setCanvasSizeWithScale: (w, h, scaleElements) => {
    const s = get();
    get().pushHistory();
    const oldW = s.canvasW;
    const oldH = s.canvasH;
    if (scaleElements) {
      const sx = w / oldW;
      const sy = h / oldH;
      set({
        canvasW: w,
        canvasH: h,
        els: s.els.map((el) => ({
          ...el,
          x: Math.round(el.x * sx),
          y: Math.round(el.y * sy),
          w: Math.round(el.w * sx),
          h: Math.round(el.h * sy),
          ...(el.size ? { size: Math.round(el.size * Math.min(sx, sy)) } : {}),
        })),
        ...histCounts(),
      });
    } else {
      // When not scaling, still respect pin constraints
      const pinnedEls = s.els.filter((el) => el.pin && (el.pin.top || el.pin.right || el.pin.bottom || el.pin.left));
      if (pinnedEls.length > 0) {
        const updatedEls = s.els.map((el) => {
          if (!el.pin) return el;
          let newX = el.x, newY = el.y;
          if (el.pin.right && !el.pin.left) {
            const distFromRight = oldW - (el.x + el.w);
            newX = w - el.w - distFromRight;
          }
          if (el.pin.bottom && !el.pin.top) {
            const distFromBottom = oldH - (el.y + el.h);
            newY = h - el.h - distFromBottom;
          }
          let newW = el.w, newH = el.h;
          if (el.pin.left && el.pin.right) {
            const distFromLeft = el.x;
            const distFromRight = oldW - (el.x + el.w);
            newX = distFromLeft;
            newW = w - distFromLeft - distFromRight;
          }
          if (el.pin.top && el.pin.bottom) {
            const distFromTop = el.y;
            const distFromBottom = oldH - (el.y + el.h);
            newY = distFromTop;
            newH = h - distFromTop - distFromBottom;
          }
          return { ...el, x: Math.round(newX), y: Math.round(newY), w: Math.max(10, Math.round(newW)), h: Math.max(10, Math.round(newH)) };
        });
        set({ canvasW: w, canvasH: h, els: updatedEls, ...histCounts() });
      } else {
        set({ canvasW: w, canvasH: h, ...histCounts() });
      }
    }
  },

  // ===== Guides =====
  setGuides: (g) => set({ guides: g }),

  // ===== Custom user-placed guides =====
  addCustomGuide: (type) => {
    const s = get();
    const position = type === 'h' ? Math.round(s.canvasH / 2) : Math.round(s.canvasW / 2);
    const guide = { id: uid(), type, position };
    set({ customGuides: [...s.customGuides, guide] });
  },

  removeCustomGuide: (id) => {
    set((s) => ({ customGuides: s.customGuides.filter((g) => g.id !== id) }));
  },

  moveCustomGuide: (id, position) => {
    set((s) => ({
      customGuides: s.customGuides.map((g) => (g.id === id ? { ...g, position } : g)),
    }));
  },

  clearCustomGuides: () => set({ customGuides: [] }),

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

  addTextPreset: (preset) => {
    get().pushHistory();
    const ne: CanvasElement = {
      id: uid(), type: 'text',
      x: 100 + Math.random() * 200, y: 100 + Math.random() * 200,
      w: 500, h: 100,
      text: preset.text ?? 'Sample Text',
      font: preset.font ?? 'Inter',
      size: preset.size ?? 64,
      bold: preset.bold ?? true,
      italic: false,
      color: preset.color ?? '#ffffff',
      shadow: preset.shadow ?? 'none',
      opacity: 1,
      bg: 'transparent',
      borderR: 0,
      rot: 0,
      letterSpacing: preset.letterSpacing,
      textTransform: preset.textTransform,
      textStroke: preset.textStroke,
      textStrokeWidth: preset.textStrokeWidth,
      textStrokes: preset.textStrokes,
      textGradient: preset.textGradient,
      glow: preset.glow,
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
    } else {
      // Generic shape from SHAPE_PATHS (pentagon, hexagon, arrow, speechBubble, heart)
      const pathKey = shapeType === 'arrowShape' ? 'arrow' : shapeType;
      const templatePath = SHAPE_PATHS[pathKey];
      if (templatePath) {
        const w = 160, h = 140;
        // Convert normalized 0-100 path to absolute coordinates
        const absPath = templatePath.replace(/(\d+\.?\d*)/g, (match, _num, offset) => {
          // Determine if this is an x or y coordinate by counting preceding numbers
          const before = templatePath.slice(0, offset);
          const numsBefore = before.match(/\d+\.?\d*/g)?.length ?? 0;
          // Even index = x coord, odd = y coord (within each command pair)
          const isY = numsBefore % 2 === 1;
          const val = parseFloat(match);
          return isY ? (baseY + (val / 100) * h).toFixed(1) : (baseX + (val / 100) * w).toFixed(1);
        });
        const colorMap: Record<string, string> = {
          pentagon: '#06b6d4', hexagon: '#ec4899', arrowShape: '#3a7bfd', speechBubble: '#2dd4a0', heart: '#ff2d55',
        };
        const ne: CanvasElement = {
          id: uid(), type: 'path', x: baseX, y: baseY, w, h,
          path: absPath, color: colorMap[shapeType] ?? '#ffffff', opacity: 0.8, rot: 0,
        };
        set((s) => ({ els: [...s.els, ne], selIds: [ne.id], tool: 'select' }));
      }
    }
  },

  // ===== Image replace — keeps position/size/effects =====
  replaceImage: (id, dataUrl) => {
    get().pushHistory();
    set((s) => ({
      els: s.els.map((e) => (e.id === id ? { ...e, src: dataUrl } : e)),
    }));
  },

  // ===== Element operations =====
  updEl: (id, patch) => {
    set((s) => ({ els: s.els.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  },

  delEl: (id) => {
    get().pushHistory();
    set((s) => ({ els: s.els.filter((e) => e.id !== id), selIds: s.selIds.filter((sid) => sid !== id) }));
  },

  delSelected: () => {
    const { selIds, els } = get();
    if (selIds.length === 0) return;
    get().pushHistory();
    const idSet = new Set(selIds);
    set({ els: els.filter((e) => !idSet.has(e.id)), selIds: [] });
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

  moveUp: (id) => {
    get().pushHistory();
    set((s) => {
      const arr = [...s.els];
      const idx = arr.findIndex((e) => e.id === id);
      if (idx === -1 || idx >= arr.length - 1) return s;
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return { els: arr };
    });
  },

  moveDown: (id) => {
    get().pushHistory();
    set((s) => {
      const arr = [...s.els];
      const idx = arr.findIndex((e) => e.id === id);
      if (idx <= 0) return s;
      [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
      return { els: arr };
    });
  },

  moveLayer: (id, newIndex) => {
    get().pushHistory();
    set((s) => {
      const arr = [...s.els];
      const oldIdx = arr.findIndex((e) => e.id === id);
      if (oldIdx === -1) return s;
      const [moved] = arr.splice(oldIdx, 1);
      arr.splice(Math.max(0, Math.min(arr.length, newIndex)), 0, moved);
      return { els: arr };
    });
  },

  renameElement: (id, name) => {
    set((s) => ({ els: s.els.map((e) => (e.id === id ? { ...e, name } : e)) }));
  },

  alignSelected: (alignment) => {
    const { selIds, els, canvasW, canvasH } = get();
    const selected = els.filter((e) => selIds.includes(e.id));
    if (selected.length === 0) return;
    get().pushHistory();
    if (selected.length === 1) {
      // Align to canvas
      const el = selected[0];
      const patch: Partial<CanvasElement> = {};
      if (alignment === 'left') patch.x = 0;
      else if (alignment === 'centerX') patch.x = (canvasW - el.w) / 2;
      else if (alignment === 'right') patch.x = canvasW - el.w;
      else if (alignment === 'top') patch.y = 0;
      else if (alignment === 'centerY') patch.y = (canvasH - el.h) / 2;
      else if (alignment === 'bottom') patch.y = canvasH - el.h;
      get().updEl(el.id, patch);
    } else {
      // Align to selection bounds
      if (alignment === 'left') { const minX = Math.min(...selected.map((e) => e.x)); selIds.forEach((id) => get().updEl(id, { x: minX })); }
      else if (alignment === 'centerX') { const avgX = selected.reduce((s, e) => s + e.x + e.w / 2, 0) / selected.length; selIds.forEach((id) => { const el = els.find((e) => e.id === id); if (el) get().updEl(id, { x: avgX - el.w / 2 }); }); }
      else if (alignment === 'right') { const maxR = Math.max(...selected.map((e) => e.x + e.w)); selIds.forEach((id) => { const el = els.find((e) => e.id === id); if (el) get().updEl(id, { x: maxR - el.w }); }); }
      else if (alignment === 'top') { const minY = Math.min(...selected.map((e) => e.y)); selIds.forEach((id) => get().updEl(id, { y: minY })); }
      else if (alignment === 'centerY') { const avgY = selected.reduce((s, e) => s + e.y + e.h / 2, 0) / selected.length; selIds.forEach((id) => { const el = els.find((e) => e.id === id); if (el) get().updEl(id, { y: avgY - el.h / 2 }); }); }
      else if (alignment === 'bottom') { const maxB = Math.max(...selected.map((e) => e.y + e.h)); selIds.forEach((id) => { const el = els.find((e) => e.id === id); if (el) get().updEl(id, { y: maxB - el.h }); }); }
    }
  },

  distributeSelected: (axis) => {
    const { selIds, els } = get();
    const selected = els.filter((e) => selIds.includes(e.id));
    if (selected.length < 3) return;
    get().pushHistory();
    if (axis === 'horizontal') {
      const sorted = [...selected].sort((a, b) => a.x - b.x);
      const totalW = sorted.reduce((s, e) => s + e.w, 0);
      const span = sorted[sorted.length - 1].x + sorted[sorted.length - 1].w - sorted[0].x;
      const gap = (span - totalW) / (sorted.length - 1);
      let cx = sorted[0].x;
      sorted.forEach((el) => { get().updEl(el.id, { x: Math.round(cx) }); cx += el.w + gap; });
    } else {
      const sorted = [...selected].sort((a, b) => a.y - b.y);
      const totalH = sorted.reduce((s, e) => s + e.h, 0);
      const span = sorted[sorted.length - 1].y + sorted[sorted.length - 1].h - sorted[0].y;
      const gap = (span - totalH) / (sorted.length - 1);
      let cy = sorted[0].y;
      sorted.forEach((el) => { get().updEl(el.id, { y: Math.round(cy) }); cy += el.h + gap; });
    }
  },

  groupSelected: () => {
    const { selIds } = get();
    if (selIds.length < 2) return;
    get().pushHistory();
    const gid = uid();
    set((s) => ({
      els: s.els.map((e) => selIds.includes(e.id) ? { ...e, groupId: gid } : e),
    }));
  },

  ungroupSelected: () => {
    const { selIds, els } = get();
    if (selIds.length === 0) return;
    const groupIds = new Set(els.filter((e) => selIds.includes(e.id) && e.groupId).map((e) => e.groupId!));
    if (groupIds.size === 0) return;
    get().pushHistory();
    set((s) => ({
      els: s.els.map((e) => groupIds.has(e.groupId ?? '') ? { ...e, groupId: undefined } : e),
    }));
  },

  // ===== Batch operations (multi-select) =====
  batchUpdateSelected: (patch) => {
    const { selIds } = get();
    if (selIds.length === 0) return;
    get().pushHistory();
    const idSet = new Set(selIds);
    set((s) => ({
      els: s.els.map((e) => idSet.has(e.id) ? { ...e, ...patch } : e),
    }));
  },

  batchResizeSelected: (scalePct) => {
    const { selIds, els } = get();
    if (selIds.length === 0) return;
    get().pushHistory();
    const scale = scalePct / 100;
    const selected = els.filter((e) => selIds.includes(e.id));
    // Calculate selection bounding box center for scale-from-center
    const minX = Math.min(...selected.map((e) => e.x));
    const minY = Math.min(...selected.map((e) => e.y));
    const maxX = Math.max(...selected.map((e) => e.x + e.w));
    const maxY = Math.max(...selected.map((e) => e.y + e.h));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const idSet = new Set(selIds);
    set((s) => ({
      els: s.els.map((e) => {
        if (!idSet.has(e.id)) return e;
        const newW = Math.round(e.w * scale);
        const newH = Math.round(e.h * scale);
        const newX = Math.round(cx + (e.x - cx) * scale);
        const newY = Math.round(cy + (e.y - cy) * scale);
        return { ...e, x: newX, y: newY, w: newW, h: newH };
      }),
    }));
  },

  // ===== Save/Load =====
  loadFromProject: (thumbnailData) => {
    if (!thumbnailData) return;
    hm.clear();
    set({
      els: thumbnailData.els || [],
      canvasBg: thumbnailData.canvasBg || '#0c0c14',
      canvasBgImage: thumbnailData.canvasBgImage ?? null,
      canvasBgGradient: thumbnailData.canvasBgGradient ?? null,
      canvasW: thumbnailData.canvasW || CANVAS_W,
      canvasH: thumbnailData.canvasH || CANVAS_H,
      projectColors: thumbnailData.projectColors ?? [],
      selIds: [],
      ...histCounts(),
    });
  },

  exportState: () => {
    const s = get();
    return { els: s.els, canvasBg: s.canvasBg, canvasBgImage: s.canvasBgImage, canvasBgGradient: s.canvasBgGradient, canvasW: s.canvasW, canvasH: s.canvasH, projectColors: s.projectColors };
  },

  // ===== Templates =====
  applyTemplate: (elements, bg) => {
    get().pushHistory();
    const newEls: CanvasElement[] = elements.map((el) => ({
      ...el,
      id: uid(),
    } as CanvasElement));
    set({
      els: newEls,
      canvasBg: bg,
      selIds: [],
      ...histCounts(),
    });
  },
}));
