'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import type { CanvasSnapshot } from '@/stores/useThumbnailStore';
import type { CanvasElement } from '@/lib/types';
import { Z_INDEX } from '@/lib/constants';
import { AIGeneratorView } from './AIGenerator';
import { ToolBar } from './ToolBar';
import { PropertiesPanel } from './PropertiesPanel';
import { LeftSidebar } from './LeftSidebar';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { OnlineUsers } from '@/components/ui/OnlineUsers';
import { CollaborationCursors } from '@/components/ui/CollaborationCursors';
import { useCanvasKeyboard } from '@/hooks/useCanvasKeyboard';
import { useUndoHint } from '@/hooks/useUndoHint';
import { useCollaboration, useCollaborationCursor } from '@/hooks/useCollaboration';
import { CANVAS_SAVE_DEBOUNCE_MS, STICKY_NOTE_COLOR, STICKY_NOTE_TEXT_COLOR } from '@/lib/constants';
import { toast } from '@/stores/useNotificationStore';

export function ThumbnailEditor({ projectId }: { projectId: string | null }) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const { step, tool, els, selIds, canvasBg, canvasBgImage, canvasBgGradient, drawing, drawPts, drawColor, drawSize, canvasW, canvasH, linePreview, guides, customGuides, zoom, panX, panY, contextMenu, resize, drag, historyCount, futureCount, snapToGrid } = useThumbnailStore(
    useShallow((s) => ({
      step: s.step, tool: s.tool, els: s.els, selIds: s.selIds, canvasBg: s.canvasBg,
      canvasBgImage: s.canvasBgImage,
      canvasBgGradient: s.canvasBgGradient,
      drawing: s.drawing, drawPts: s.drawPts, drawColor: s.drawColor, drawSize: s.drawSize,
      canvasW: s.canvasW, canvasH: s.canvasH, linePreview: s.linePreview, guides: s.guides,
      customGuides: s.customGuides,
      zoom: s.zoom, panX: s.panX, panY: s.panY, contextMenu: s.contextMenu, resize: s.resize,
      drag: s.drag, historyCount: s.historyCount, futureCount: s.futureCount,
      snapToGrid: s.snapToGrid,
    }))
  );
  const store = useThumbnailStore.getState;
  const SIZE_PRESETS = useMemo(() => getSizePresets(t), [t]);
  useCanvasKeyboard();
  useUndoHint(historyCount);
  const selId = selIds.length > 0 ? selIds[selIds.length - 1] : null;
  const sel = useMemo(() => els.find((e) => e.id === selId), [els, selId]);
  const loadedRef = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePropsOpen, setMobilePropsOpen] = useState(false);
  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'webp'>('png');
  const [exportSizeMode, setExportSizeMode] = useState<'original' | '2x' | 'custom'>('original');
  const [exportCustomW, setExportCustomW] = useState(canvasW);
  const [exportCustomH, setExportCustomH] = useState(canvasH);
  const [exportQuality, setExportQuality] = useState(85);
  const [isCopying, setIsCopying] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [thumbnailStatus, setThumbnailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [selRect, setSelRect] = useState<{ x: number; y: number; x2: number; y2: number } | null>(null);
  const [showYouTubePreview, setShowYouTubePreview] = useState(false);
  const [youtubePreviewUrl, setYoutubePreviewUrl] = useState<string | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  // Measurement tooltip — track mouse position during drag/resize
  const [measureTooltip, setMeasureTooltip] = useState<{ mx: number; my: number; ex: number; ey: number; ew: number; eh: number } | null>(null);
  // Smart resize canvas dialog
  const [resizeDialog, setResizeDialog] = useState<{ w: number; h: number } | null>(null);
  // Duplicate as new size dialog
  const [showDuplicateAs, setShowDuplicateAs] = useState(false);
  // Smart spacing guides — equal-distance indicators between elements during drag
  const [spacingGuides, setSpacingGuides] = useState<{ axis: 'h' | 'v'; x: number; y: number; length: number; gap: number }[]>([]);
  // Element info overlay on hover (without selection)
  const [hoverInfo, setHoverInfo] = useState<{ mx: number; my: number; name: string; type: string; w: number; h: number; x: number; y: number } | null>(null);

  // Element entrance animations — track recently added element IDs
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());
  const prevElsCountRef = useRef(0);
  // Selection highlight animation — track recently selected element IDs
  const [recentlySelected, setRecentlySelected] = useState<Set<string>>(new Set());
  const prevSelIdsRef = useRef<string[]>([]);
  // Smooth zoom — only for button clicks, not scroll wheel
  const smoothZoomRef = useRef(false);
  // Auto-save: last saved timestamp for relative time display
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [saveFlashActive, setSaveFlashActive] = useState(false);
  const [, setTimeTick] = useState(0);

  // Responsive check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Listen for "?" shortcut from useCanvasKeyboard
  useEffect(() => {
    const handler = () => setShowShortcutsHelp((v) => !v);
    window.addEventListener('tubeforge:toggle-shortcuts-help', handler);
    return () => window.removeEventListener('tubeforge:toggle-shortcuts-help', handler);
  }, []);

  // Track newly added elements for entrance animation
  useEffect(() => {
    if (prevElsCountRef.current > 0 && els.length > prevElsCountRef.current) {
      const prevIds = new Set(els.slice(0, prevElsCountRef.current).map((e) => e.id));
      const newIds = els.filter((e) => !prevIds.has(e.id)).map((e) => e.id);
      if (newIds.length > 0) {
        setRecentlyAdded((prev) => { const next = new Set(prev); newIds.forEach((id) => next.add(id)); return next; });
        setTimeout(() => {
          setRecentlyAdded((prev) => { const next = new Set(prev); newIds.forEach((id) => next.delete(id)); return next; });
        }, 300);
      }
    }
    prevElsCountRef.current = els.length;
  }, [els.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track selection changes for highlight flash animation
  useEffect(() => {
    const newlySelected = selIds.filter((id) => !prevSelIdsRef.current.includes(id));
    if (newlySelected.length > 0) {
      setRecentlySelected((prev) => { const next = new Set(prev); newlySelected.forEach((id) => next.add(id)); return next; });
      setTimeout(() => {
        setRecentlySelected((prev) => { const next = new Set(prev); newlySelected.forEach((id) => next.delete(id)); return next; });
      }, 200);
    }
    prevSelIdsRef.current = selIds;
  }, [selIds]);

  // Live-updating "saved X ago" timer — tick every 10 seconds
  useEffect(() => {
    if (!lastSavedAt) return;
    const interval = setInterval(() => setTimeTick((n) => n + 1), 10000);
    return () => clearInterval(interval);
  }, [lastSavedAt]);

  // Ctrl+S manual save handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!projectId) return;
        window.dispatchEvent(new CustomEvent('tubeforge:manual-save'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [projectId]);

  // Load snap-to-grid preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tubeforge-snap-to-grid');
      if (saved !== null) store().setSnapToGrid(JSON.parse(saved));
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time collaboration
  useCollaboration(projectId);
  useCollaborationCursor(canvasAreaRef);

  useEffect(() => { loadedRef.current = false; }, [projectId]);

  const project = trpc.project.getById.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  // When no projectId, initialize with empty canvas so the editor is usable standalone
  useEffect(() => {
    if (!projectId && !loadedRef.current) {
      store().loadFromProject({ els: [], canvasBg: '#0c0c14' });
      loadedRef.current = true;
    }
  }, [projectId, store]);

  useEffect(() => {
    if (project.data && !loadedRef.current) {
      store().loadFromProject(project.data.thumbnailData as { els?: CanvasElement[]; canvasBg?: string; canvasW?: number; canvasH?: number } | null);
      loadedRef.current = true;
    }
  }, [project.data, store]);

  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const savedFingerprintRef = useRef<string>('');
  const [autoSaveState, setAutoSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveCanvas = trpc.project.update.useMutation({
    onSuccess: () => { savedFingerprintRef.current = currentFingerprint; setAutoSaveState('saved'); setLastSavedAt(Date.now()); setSaveFlashActive(true); setTimeout(() => setSaveFlashActive(false), 600); },
    onError: (err) => { setAutoSaveState('unsaved'); if (process.env.NODE_ENV === 'development') console.error('[ThumbnailEditor] Auto-save failed:', err.message); },
  });
  // Lightweight fingerprint instead of JSON.stringify(els) on every render
  const elsFingerprint = useMemo(
    () => els.reduce((h, e) => h + e.id + e.x + e.y + e.w + e.h + (e.color ?? '') + (e.text ?? '') + (e.opacity ?? 1) + (e.textAlign ?? '') + (e.letterSpacing ?? 0) + (e.lineHeight ?? 0) + (e.textTransform ?? '') + (e.textStroke ?? '') + (e.textStrokeWidth ?? 0) + (e.shapeShadow ?? '') + (e.name ?? '') + (e.visible ?? true) + (e.locked ?? false) + (e.groupId ?? '') + (e.blur ?? 0) + (e.brightness ?? 100) + (e.contrast ?? 100) + (e.glow ? `${e.glow.color}${e.glow.blur}` : '') + (e.textGradient ? `${e.textGradient.from}${e.textGradient.to}${e.textGradient.mid ?? ''}${e.textGradient.angle}` : '') + (e.underline ?? false) + (e.borderColor ?? '') + (e.borderWidth ?? 0) + (e.rot ?? 0) + (e.grayscale ?? 0) + (e.sepia ?? 0) + (e.hueRotate ?? 0) + (e.saturate ?? 100) + (e.invert ?? false) + (e.fontWeight ?? 400) + (e.curveAmount ?? 0) + (e.blendMode ?? '') + (e.pattern ?? '') + (e.patternColor ?? '') + (e.patternSize ?? 0) + (e.borderDash ?? '') + (e.objectFit ?? '') + (e.src ?? ''), ''),
    [els],
  );
  const currentFingerprint = elsFingerprint + canvasBg + canvasW + canvasH + (canvasBgGradient ? `${canvasBgGradient.from}${canvasBgGradient.to}${canvasBgGradient.angle}${canvasBgGradient.type}` : '');
  useEffect(() => {
    if (!loadedRef.current || !projectId) return;
    // Mark as unsaved when fingerprint changes from last saved state
    if (currentFingerprint !== savedFingerprintRef.current) {
      setAutoSaveState('unsaved');
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setAutoSaveState('saving');
      saveCanvas.mutate({ id: projectId, thumbnailData: store().exportState() as unknown as Record<string, string | number | boolean | null> });
    }, CANVAS_SAVE_DEBOUNCE_MS);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [elsFingerprint, canvasBg, canvasBgGradient, canvasW, canvasH]); // eslint-disable-line react-hooks/exhaustive-deps
  // Initialize saved fingerprint on first load
  useEffect(() => {
    if (loadedRef.current && projectId) {
      savedFingerprintRef.current = currentFingerprint;
      setAutoSaveState('saved');
    }
  }, [loadedRef.current && projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual save (Ctrl+S) listener
  useEffect(() => {
    const handler = () => {
      if (!projectId || !loadedRef.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setAutoSaveState('saving');
      saveCanvas.mutate({ id: projectId, thumbnailData: store().exportState() as unknown as Record<string, string | number | boolean | null> });
    };
    window.addEventListener('tubeforge:manual-save', handler);
    return () => window.removeEventListener('tubeforge:manual-save', handler);
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper: format relative time for auto-save indicator
  const formatSavedAgo = useCallback((ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }, []);

  // Ctrl+Scroll zoom — instant (no smooth transition)
  const onWheelZoom = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    smoothZoomRef.current = false;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const s = store();
    s.setZoom(s.zoom + delta);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = canvasWrapperRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheelZoom, { passive: false });
    return () => el.removeEventListener('wheel', onWheelZoom);
  }, [onWheelZoom]);

  // Middle mouse pan — stable callbacks via refs
  const onMiddleDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 1) return;
    e.preventDefault();
    isPanning.current = true;
    const s = store();
    panStart.current = { x: e.clientX, y: e.clientY, px: s.panX, py: s.panY };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const onMiddleMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    store().setPan(panStart.current.px + dx, panStart.current.py + dy);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const onMiddleUp = useCallback(() => { isPanning.current = false; }, []);

  if (step === 'ai') return <AIGeneratorView projectId={projectId} />;
  if (project.isLoading && projectId) return (
    <div>
      <Skeleton width="220px" height="28px" />
      <div style={{ marginTop: 8 }}><Skeleton width="340px" height="16px" /></div>
      <div style={{ marginTop: 24 }}><Skeleton width="100%" height="400px" rounded /></div>
    </div>
  );
  if (project.error && projectId) return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <p style={{ color: C.accent, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t('thumbs.editor.loadError')}</p>
      <p style={{ color: C.sub, fontSize: 12, marginBottom: 16 }}>{project.error.message}</p>
      <button onClick={() => project.refetch()} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{t('thumbs.editor.retry')}</button>
    </div>
  );

  const getCanvasCoords = (e: React.MouseEvent<HTMLDivElement | SVGElement> | React.TouchEvent<HTMLDivElement>) => {
    const target = (e.currentTarget as HTMLElement).closest('[data-canvas]') as HTMLElement ?? e.currentTarget;
    const rect = target.getBoundingClientRect();
    const sx = canvasW / rect.width;
    const sy = canvasH / rect.height;
    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? (e as React.TouchEvent).changedTouches[0]?.clientX ?? 0) : e.clientX;
    const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? (e as React.TouchEvent).changedTouches[0]?.clientY ?? 0) : e.clientY;
    return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
  };

  const onCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setHoverInfo(null); // Clear hover info on any click
    const { x, y } = getCanvasCoords(e);
    if (tool === 'draw') { store().setDrawing(true); store().setDrawPts([{ x, y }]); return; }
    if (tool === 'line' || tool === 'arrow') { store().setLinePreview({ x1: x, y1: y, x2: x, y2: y }); return; }
    if (tool === 'stickyNote') { store().addStickyNote(x - 100, y - 75); return; }
    if (tool === 'eraser') {
      const hit = hitTestElement(els, x, y);
      if (hit) store().delEl(hit.id);
      return;
    }
    if (tool !== 'select') return;
    const clicked = hitTestElement(els, x, y);
    if (clicked) {
      e.shiftKey ? store().addToSelection(clicked.id) : store().setSelId(clicked.id);
      store().pushHistoryDebounced(); // batch drag into one undo step
      store().setDrag({ id: clicked.id, ox: x - clicked.x, oy: y - clicked.y });
    } else {
      // Start selection rectangle on empty canvas
      store().setSelId(null);
      setSelRect({ x, y, x2: x, y2: y });
    }
  };

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { x, y } = getCanvasCoords(e);
    if (drawing && tool === 'draw') { store().setDrawPts((p) => [...p, { x, y }]); return; }
    if (linePreview && (tool === 'line' || tool === 'arrow')) { store().setLinePreview({ ...linePreview, x2: x, y2: y }); return; }
    // Update selection rectangle
    if (selRect && tool === 'select') { setSelRect({ ...selRect, x2: x, y2: y }); return; }
    const curResize = store().resize;
    if (curResize) {
      const el = els.find((e) => e.id === curResize.id);
      if (!el) return;
      let nw = x - el.x, nh = y - el.y;
      if (nw < 20) nw = 20; if (nh < 20) nh = 20;
      // Lock aspect ratio: default true for images, false for others
      const shouldLock = el.lockAspect ?? (el.type === 'image');
      if (shouldLock && el.w > 0 && el.h > 0) {
        const ratio = el.w / el.h;
        // Use the dominant axis (larger delta) to drive the other
        const dw = Math.abs(nw - el.w);
        const dh = Math.abs(nh - el.h);
        if (dw >= dh) { nh = Math.round(nw / ratio); }
        else { nw = Math.round(nh * ratio); }
        if (nw < 20) { nw = 20; nh = Math.round(20 / ratio); }
        if (nh < 20) { nh = 20; nw = Math.round(20 * ratio); }
      }
      store().updEl(curResize.id, { w: Math.round(nw), h: Math.round(nh) });
      setMeasureTooltip({ mx: e.clientX, my: e.clientY, ex: Math.round(el.x), ey: Math.round(el.y), ew: Math.round(nw), eh: Math.round(nh) });
      return;
    }
    const curDrag = store().drag;
    if (!curDrag) {
      setMeasureTooltip(null);
      // Element info overlay on hover (only when not dragging/resizing/drawing and tool is select)
      if (tool === 'select' && !drawing && !selRect) {
        const hovered = hitTestElement(els, x, y);
        if (hovered && !selIds.includes(hovered.id)) {
          const nameMap: Record<string, string> = { text: 'Text', rect: 'Rectangle', circle: 'Circle', triangle: 'Triangle', star: 'Star', image: 'Image', path: 'Path', line: 'Line', arrow: 'Arrow', stickyNote: 'Note', table: 'Table' };
          setHoverInfo({ mx: e.clientX, my: e.clientY, name: hovered.name || nameMap[hovered.type] || hovered.type, type: hovered.type, w: Math.round(hovered.w), h: Math.round(hovered.h), x: Math.round(hovered.x), y: Math.round(hovered.y) });
        } else {
          setHoverInfo(null);
        }
      } else {
        setHoverInfo(null);
      }
      return;
    }
    let nx = Math.round(x - curDrag.ox), ny = Math.round(y - curDrag.oy);
    // Snap to grid (20px)
    const GRID_SIZE = 20;
    const isSnapGrid = store().snapToGrid;
    if (isSnapGrid) {
      nx = Math.round(nx / GRID_SIZE) * GRID_SIZE;
      ny = Math.round(ny / GRID_SIZE) * GRID_SIZE;
    }
    // Snap guides
    const dragEl = els.find((e) => e.id === curDrag.id);
    if (dragEl) {
      const SNAP = 5;
      const snapThreshold = SNAP / zoom;
      const gx: number[] = [], gy: number[] = [];
      const dCx = nx + dragEl.w / 2, dCy = ny + dragEl.h / 2;
      const dR = nx + dragEl.w, dB = ny + dragEl.h;
      // Canvas center guides
      const ccx = canvasW / 2, ccy = canvasH / 2;
      if (Math.abs(dCx - ccx) < snapThreshold) { nx = ccx - dragEl.w / 2; gx.push(ccx); }
      if (Math.abs(dCy - ccy) < snapThreshold) { ny = ccy - dragEl.h / 2; gy.push(ccy); }
      for (const other of els) {
        if (other.id === curDrag.id || other.type === 'line' || other.type === 'arrow' || other.type === 'path') continue;
        const oCx = other.x + other.w / 2, oCy = other.y + other.h / 2;
        // Left edge -> left/right edge
        if (Math.abs(nx - other.x) < snapThreshold) { nx = other.x; gx.push(other.x); }
        if (Math.abs(nx - (other.x + other.w)) < snapThreshold) { nx = other.x + other.w; gx.push(other.x + other.w); }
        // Right edge -> left/right edge
        if (Math.abs(dR - other.x) < snapThreshold) { nx = other.x - dragEl.w; gx.push(other.x); }
        if (Math.abs(dR - (other.x + other.w)) < snapThreshold) { nx = other.x + other.w - dragEl.w; gx.push(other.x + other.w); }
        // Center -> center
        if (Math.abs(dCx - oCx) < snapThreshold) { nx = oCx - dragEl.w / 2; gx.push(oCx); }
        // Top edge -> top/bottom edge
        if (Math.abs(ny - other.y) < snapThreshold) { ny = other.y; gy.push(other.y); }
        if (Math.abs(ny - (other.y + other.h)) < snapThreshold) { ny = other.y + other.h; gy.push(other.y + other.h); }
        // Bottom edge -> top/bottom edge
        if (Math.abs(dB - other.y) < snapThreshold) { ny = other.y - dragEl.h; gy.push(other.y); }
        if (Math.abs(dB - (other.y + other.h)) < snapThreshold) { ny = other.y + other.h - dragEl.h; gy.push(other.y + other.h); }
        // Center Y -> center Y
        if (Math.abs(dCy - oCy) < snapThreshold) { ny = oCy - dragEl.h / 2; gy.push(oCy); }
      }
      // Snap to custom user-placed guides
      const cGuides = store().customGuides;
      for (const cg of cGuides) {
        if (cg.type === 'v') {
          // Vertical guide — snap left/right/center X
          if (Math.abs(nx - cg.position) < snapThreshold) { nx = cg.position; gx.push(cg.position); }
          if (Math.abs(dR - cg.position) < snapThreshold) { nx = cg.position - dragEl.w; gx.push(cg.position); }
          if (Math.abs(dCx - cg.position) < snapThreshold) { nx = cg.position - dragEl.w / 2; gx.push(cg.position); }
        } else {
          // Horizontal guide — snap top/bottom/center Y
          if (Math.abs(ny - cg.position) < snapThreshold) { ny = cg.position; gy.push(cg.position); }
          if (Math.abs(dB - cg.position) < snapThreshold) { ny = cg.position - dragEl.h; gy.push(cg.position); }
          if (Math.abs(dCy - cg.position) < snapThreshold) { ny = cg.position - dragEl.h / 2; gy.push(cg.position); }
        }
      }
      store().setGuides({ x: [...new Set(gx)], y: [...new Set(gy)] });

      // --- Smart spacing guides (equal-distance indicators) ---
      const SPACING_THRESH = 3;
      const others = els.filter((o) => o.id !== curDrag.id && o.type !== 'line' && o.type !== 'arrow' && o.type !== 'path' && o.visible !== false);
      const dragL = nx, dragR = nx + dragEl.w, dragT = ny, dragB = ny + dragEl.h;
      const newSpacing: { axis: 'h' | 'v'; x: number; y: number; length: number; gap: number }[] = [];

      // Horizontal spacing: find pairs of elements with matching gaps on the horizontal axis
      const hSorted = [...others, { ...dragEl, x: nx, y: ny }].sort((a, b) => a.x - b.x);
      for (let i = 0; i < hSorted.length - 2; i++) {
        for (let j = i + 1; j < hSorted.length - 1; j++) {
          const gapIJ = hSorted[j].x - (hSorted[i].x + hSorted[i].w);
          if (gapIJ < 5) continue;
          for (let k = j + 1; k < hSorted.length; k++) {
            const gapJK = hSorted[k].x - (hSorted[j].x + hSorted[j].w);
            if (Math.abs(gapIJ - gapJK) < SPACING_THRESH) {
              const involves = hSorted[i].id === curDrag.id || hSorted[j].id === curDrag.id || hSorted[k].id === curDrag.id;
              if (involves) {
                const midY1 = Math.max(hSorted[i].y, hSorted[j].y);
                const botY1 = Math.min(hSorted[i].y + hSorted[i].h, hSorted[j].y + hSorted[j].h);
                const cy1 = (midY1 + botY1) / 2;
                newSpacing.push({ axis: 'h', x: hSorted[i].x + hSorted[i].w, y: cy1, length: gapIJ, gap: Math.round(gapIJ) });
                const midY2 = Math.max(hSorted[j].y, hSorted[k].y);
                const botY2 = Math.min(hSorted[j].y + hSorted[j].h, hSorted[k].y + hSorted[k].h);
                const cy2 = (midY2 + botY2) / 2;
                newSpacing.push({ axis: 'h', x: hSorted[j].x + hSorted[j].w, y: cy2, length: gapJK, gap: Math.round(gapJK) });
              }
            }
          }
        }
      }
      // Vertical spacing: find pairs of elements with matching gaps on the vertical axis
      const vSorted = [...others, { ...dragEl, x: nx, y: ny }].sort((a, b) => a.y - b.y);
      for (let i = 0; i < vSorted.length - 2; i++) {
        for (let j = i + 1; j < vSorted.length - 1; j++) {
          const gapIJ = vSorted[j].y - (vSorted[i].y + vSorted[i].h);
          if (gapIJ < 5) continue;
          for (let k = j + 1; k < vSorted.length; k++) {
            const gapJK = vSorted[k].y - (vSorted[j].y + vSorted[j].h);
            if (Math.abs(gapIJ - gapJK) < SPACING_THRESH) {
              const involves = vSorted[i].id === curDrag.id || vSorted[j].id === curDrag.id || vSorted[k].id === curDrag.id;
              if (involves) {
                const midX1 = Math.max(vSorted[i].x, vSorted[j].x);
                const rX1 = Math.min(vSorted[i].x + vSorted[i].w, vSorted[j].x + vSorted[j].w);
                const cx1 = (midX1 + rX1) / 2;
                newSpacing.push({ axis: 'v', x: cx1, y: vSorted[i].y + vSorted[i].h, length: gapIJ, gap: Math.round(gapIJ) });
                const midX2 = Math.max(vSorted[j].x, vSorted[k].x);
                const rX2 = Math.min(vSorted[j].x + vSorted[j].w, vSorted[k].x + vSorted[k].w);
                const cx2 = (midX2 + rX2) / 2;
                newSpacing.push({ axis: 'v', x: cx2, y: vSorted[j].y + vSorted[j].h, length: gapJK, gap: Math.round(gapJK) });
              }
            }
          }
        }
      }
      setSpacingGuides(newSpacing);
    }
    store().updEl(curDrag.id, { x: nx, y: ny });
    // Show measurement tooltip during drag
    const updatedEl = store().els.find((e) => e.id === curDrag.id);
    if (updatedEl) {
      setMeasureTooltip({ mx: e.clientX, my: e.clientY, ex: nx, ey: ny, ew: Math.round(updatedEl.w), eh: Math.round(updatedEl.h) });
    }
  };

  const onCanvasMouseUp = () => {
    if (drawing && drawPts.length > 1) {
      const path = drawPts.map((p, i) => i === 0 ? ('M' + p.x + ' ' + p.y) : ('L' + p.x + ' ' + p.y)).join(' ');
      store().addPath(path, drawColor, drawSize);
    }
    if (linePreview && (tool === 'line' || tool === 'arrow')) {
      const dx = Math.abs(linePreview.x2 - linePreview.x1), dy = Math.abs(linePreview.y2 - linePreview.y1);
      if (dx > 5 || dy > 5) {
        tool === 'line' ? store().addLine(linePreview.x1, linePreview.y1, linePreview.x2, linePreview.y2)
          : store().addArrow(linePreview.x1, linePreview.y1, linePreview.x2, linePreview.y2);
      }
      store().setLinePreview(null);
    }
    // Finalize selection rectangle -- select all elements within bounds
    if (selRect) {
      const rx = Math.min(selRect.x, selRect.x2);
      const ry = Math.min(selRect.y, selRect.y2);
      const rw = Math.abs(selRect.x2 - selRect.x);
      const rh = Math.abs(selRect.y2 - selRect.y);
      if (rw > 3 || rh > 3) {
        const insideIds = els.filter((el) => {
          if (el.visible === false || el.locked) return false;
          return el.x + el.w > rx && el.x < rx + rw && el.y + el.h > ry && el.y < ry + rh;
        }).map((el) => el.id);
        if (insideIds.length > 0) store().setSelIds(insideIds);
      }
      setSelRect(null);
    }
    store().setDrawing(false); store().setDrawPts([]); store().setDrag(null); store().setResize(null); store().setGuides({ x: [], y: [] }); setMeasureTooltip(null); setSpacingGuides([]);
  };

  // ===== Touch event handlers for mobile support =====
  const onCanvasTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return; // ignore multi-touch (pinch zoom etc.)
    const { x, y } = getCanvasCoords(e);
    if (tool === 'draw') { store().setDrawing(true); store().setDrawPts([{ x, y }]); return; }
    if (tool === 'line' || tool === 'arrow') { store().setLinePreview({ x1: x, y1: y, x2: x, y2: y }); return; }
    if (tool === 'stickyNote') { store().addStickyNote(x - 100, y - 75); return; }
    if (tool === 'eraser') {
      const hit = hitTestElement(els, x, y);
      if (hit) store().delEl(hit.id);
      return;
    }
    if (tool !== 'select') return;
    const clicked = hitTestElement(els, x, y);
    if (clicked) {
      store().setSelId(clicked.id);
      store().pushHistoryDebounced();
      store().setDrag({ id: clicked.id, ox: x - clicked.x, oy: y - clicked.y });
    } else { store().setSelId(null); }
  };

  const onCanvasTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const { x, y } = getCanvasCoords(e);
    if (drawing && tool === 'draw') { e.preventDefault(); store().setDrawPts((p) => [...p, { x, y }]); return; }
    if (linePreview && (tool === 'line' || tool === 'arrow')) { e.preventDefault(); store().setLinePreview({ ...linePreview, x2: x, y2: y }); return; }
    const curResize = store().resize;
    if (curResize) {
      e.preventDefault();
      const el = els.find((e) => e.id === curResize.id);
      if (!el) return;
      let nw = x - el.x, nh = y - el.y;
      if (nw < 20) nw = 20; if (nh < 20) nh = 20;
      const shouldLock = el.lockAspect ?? (el.type === 'image');
      if (shouldLock && el.w > 0 && el.h > 0) {
        const ratio = el.w / el.h;
        const dw = Math.abs(nw - el.w);
        const dh = Math.abs(nh - el.h);
        if (dw >= dh) { nh = Math.round(nw / ratio); }
        else { nw = Math.round(nh * ratio); }
        if (nw < 20) { nw = 20; nh = Math.round(20 / ratio); }
        if (nh < 20) { nh = 20; nw = Math.round(20 * ratio); }
      }
      store().updEl(curResize.id, { w: Math.round(nw), h: Math.round(nh) });
      return;
    }
    const curDrag = store().drag;
    if (!curDrag) return;
    e.preventDefault();
    const nx = Math.round(x - curDrag.ox), ny = Math.round(y - curDrag.oy);
    store().updEl(curDrag.id, { x: nx, y: ny });
  };

  const onCanvasTouchEnd = () => {
    onCanvasMouseUp();
  };

  // ===== Export formats & presets =====
  const EXPORT_FORMATS = useMemo(() => [
    { id: 'png' as const, label: 'PNG', mime: 'image/png' as const, ext: '.png', quality: 1 },
    { id: 'jpg' as const, label: 'JPG', mime: 'image/jpeg' as const, ext: '.jpg', quality: 0.85 },
    { id: 'webp' as const, label: 'WebP', mime: 'image/webp' as const, ext: '.webp', quality: 0.9 },
  ], []);

  const EXPORT_PRESETS = useMemo(() => [
    { id: 'youtube', label: t('thumbs.export.presetYoutube'), w: 1280, h: 720, format: 'jpg' as const, quality: 85 },
    { id: 'shorts', label: t('thumbs.export.presetShorts'), w: 1080, h: 1920, format: 'png' as const, quality: 100 },
    { id: 'instagram', label: t('thumbs.export.presetInstagram'), w: 1080, h: 1080, format: 'png' as const, quality: 100 },
    { id: 'twitter', label: t('thumbs.export.presetTwitter'), w: 1500, h: 500, format: 'jpg' as const, quality: 85 },
  ], [t]);

  const getExportSize = useCallback((): { w: number; h: number } => {
    if (exportSizeMode === '2x') return { w: canvasW * 2, h: canvasH * 2 };
    if (exportSizeMode === 'custom') return { w: exportCustomW, h: exportCustomH };
    return { w: canvasW, h: canvasH };
  }, [exportSizeMode, canvasW, canvasH, exportCustomW, exportCustomH]);

  const getExportMime = useCallback((): { mime: string; ext: string; quality: number } => {
    const fmt = EXPORT_FORMATS.find((f) => f.id === exportFormat) ?? EXPORT_FORMATS[0];
    const q = exportFormat === 'png' ? 1 : exportQuality / 100;
    return { mime: fmt.mime, ext: fmt.ext, quality: q };
  }, [exportFormat, exportQuality, EXPORT_FORMATS]);

  const applyExportPreset = useCallback((preset: { w: number; h: number; format: 'png' | 'jpg' | 'webp'; quality: number }) => {
    setExportFormat(preset.format);
    setExportSizeMode('custom');
    setExportCustomW(preset.w);
    setExportCustomH(preset.h);
    setExportQuality(preset.quality);
  }, []);

  // ===== Core canvas renderer (reusable for all export paths) =====
  const renderToCanvas = useCallback((targetW: number, targetH: number): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    canvas.width = targetW; canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.reject(new Error('Failed to create canvas 2D context'));
    const scaleX = targetW / canvasW;
    const scaleY = targetH / canvasH;
    ctx.scale(scaleX, scaleY);
    ctx.fillStyle = canvasBg; ctx.fillRect(0, 0, canvasW, canvasH);

    // Draw gradient background if set
    const bgGrad = useThumbnailStore.getState().canvasBgGradient;
    if (bgGrad && !useThumbnailStore.getState().canvasBgImage) {
      let gradient: CanvasGradient;
      if (bgGrad.type === 'radial') {
        gradient = ctx.createRadialGradient(canvasW / 2, canvasH / 2, 0, canvasW / 2, canvasH / 2, Math.max(canvasW, canvasH) / 2);
      } else {
        const angleRad = (bgGrad.angle - 90) * Math.PI / 180;
        const cx = canvasW / 2, cy = canvasH / 2;
        const len = Math.max(canvasW, canvasH);
        gradient = ctx.createLinearGradient(
          cx - Math.cos(angleRad) * len / 2, cy - Math.sin(angleRad) * len / 2,
          cx + Math.cos(angleRad) * len / 2, cy + Math.sin(angleRad) * len / 2,
        );
      }
      gradient.addColorStop(0, bgGrad.from);
      gradient.addColorStop(1, bgGrad.to);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    // Draw background image if set
    const bgImageUrl = useThumbnailStore.getState().canvasBgImage;
    const bgImagePromise = bgImageUrl ? new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = bgImageUrl;
    }) : Promise.resolve(null);

    const imgCache = new Map<string, HTMLImageElement>();
    const imageEls = els.filter((el) => el.type === 'image' && el.src && el.visible !== false);
    const imagePromises = imageEls.map((el) => new Promise<void>((resolve) => {
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => { imgCache.set(el.id, img); resolve(); };
      img.onerror = () => resolve();
      img.src = el.src!;
    }));

    return Promise.all([...imagePromises, bgImagePromise]).then((results) => {
      const bgImg = results[results.length - 1] as HTMLImageElement | null;
      if (bgImg) { ctx.drawImage(bgImg, 0, 0, canvasW, canvasH); }
      for (const el of els) {
        if (el.visible === false) continue;
        ctx.globalAlpha = el.opacity ?? 1;
        const rot = el.rot ?? 0;
        const needsTransform = rot !== 0 || el.flipX || el.flipY;
        if (needsTransform) {
          const cx = el.x + el.w / 2, cy = el.y + el.h / 2;
          ctx.save();
          ctx.translate(cx, cy);
          if (rot !== 0) ctx.rotate((rot * Math.PI) / 180);
          if (el.flipX || el.flipY) ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
          ctx.translate(-cx, -cy);
        }
        if (el.glow) { ctx.shadowColor = el.glow.color; ctx.shadowBlur = el.glow.blur; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }
        const filterParts: string[] = [];
        if (el.blur && el.blur > 0) filterParts.push(`blur(${el.blur}px)`);
        if (el.brightness !== undefined && el.brightness !== 100) filterParts.push(`brightness(${el.brightness / 100})`);
        if (el.contrast !== undefined && el.contrast !== 100) filterParts.push(`contrast(${el.contrast / 100})`);
        if (el.grayscale !== undefined && el.grayscale > 0) filterParts.push(`grayscale(${el.grayscale}%)`);
        if (el.sepia !== undefined && el.sepia > 0) filterParts.push(`sepia(${el.sepia}%)`);
        if (el.hueRotate !== undefined && el.hueRotate > 0) filterParts.push(`hue-rotate(${el.hueRotate}deg)`);
        if (el.saturate !== undefined && el.saturate !== 100) filterParts.push(`saturate(${el.saturate}%)`);
        if (el.invert) filterParts.push('invert(100%)');
        if (filterParts.length > 0) ctx.filter = filterParts.join(' ');
        if (el.shapeShadow && el.shapeShadow !== 'none' && (el.type === 'rect' || el.type === 'circle' || el.type === 'image')) {
          try { const sp = el.shapeShadow.match(/([\d.-]+)/g); if (sp && sp.length >= 3) { ctx.shadowOffsetX = parseFloat(sp[0]); ctx.shadowOffsetY = parseFloat(sp[1]); ctx.shadowBlur = parseFloat(sp[2]); ctx.shadowColor = el.shapeShadow.match(/rgba?\([^)]+\)/)?.[0] || 'rgba(0,0,0,.4)'; } } catch { /* skip */ }
        }
        if (el.type === 'rect') {
          ctx.fillStyle = el.color ?? '#fff';
          if ((el.borderR ?? 0) > 0) { const r = el.borderR!; ctx.beginPath(); ctx.moveTo(el.x + r, el.y); ctx.lineTo(el.x + el.w - r, el.y); ctx.quadraticCurveTo(el.x + el.w, el.y, el.x + el.w, el.y + r); ctx.lineTo(el.x + el.w, el.y + el.h - r); ctx.quadraticCurveTo(el.x + el.w, el.y + el.h, el.x + el.w - r, el.y + el.h); ctx.lineTo(el.x + r, el.y + el.h); ctx.quadraticCurveTo(el.x, el.y + el.h, el.x, el.y + el.h - r); ctx.lineTo(el.x, el.y + r); ctx.quadraticCurveTo(el.x, el.y, el.x + r, el.y); ctx.closePath(); ctx.fill(); }
          else { ctx.fillRect(el.x, el.y, el.w, el.h); }
          // Border stroke
          if ((el.borderWidth ?? 0) > 0) { ctx.strokeStyle = el.borderColor ?? '#fff'; ctx.lineWidth = el.borderWidth!; if ((el.borderR ?? 0) > 0) { ctx.stroke(); } else { ctx.strokeRect(el.x, el.y, el.w, el.h); } }
          ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowBlur = 0;
        } else if (el.type === 'circle') {
          ctx.fillStyle = el.color ?? '#fff'; ctx.beginPath(); ctx.ellipse(el.x + el.w / 2, el.y + el.h / 2, el.w / 2, el.h / 2, 0, 0, Math.PI * 2); ctx.fill();
          if ((el.borderWidth ?? 0) > 0) { ctx.strokeStyle = el.borderColor ?? '#fff'; ctx.lineWidth = el.borderWidth!; ctx.stroke(); }
          ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowBlur = 0;
        } else if (el.type === 'text') {
          let displayText = el.text ?? '';
          if (el.textTransform === 'uppercase') displayText = displayText.toUpperCase();
          else if (el.textTransform === 'lowercase') displayText = displayText.toLowerCase();
          else if (el.textTransform === 'capitalize') displayText = displayText.replace(/\b\w/g, (c) => c.toUpperCase());
          ctx.font = (el.italic ? 'italic ' : '') + (el.fontWeight ?? (el.bold ? 700 : 400)) + ' ' + (el.size ?? 32) + 'px ' + (el.font ?? 'sans-serif');
          ctx.textAlign = el.textAlign ?? 'left';
          if (el.shadow && el.shadow !== 'none') { try { const parts = el.shadow.match(/([\d.-]+)/g); if (parts && parts.length >= 3) { ctx.shadowOffsetX = parseFloat(parts[0]); ctx.shadowOffsetY = parseFloat(parts[1]); ctx.shadowBlur = parseFloat(parts[2]); ctx.shadowColor = el.shadow.match(/rgba?\([^)]+\)/)?.[0] || 'rgba(0,0,0,.5)'; } else { ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 4; ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,0,0,0.3)'; } } catch { ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 4; ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,0,0,0.3)'; } }
          const textX = el.textAlign === 'center' ? el.x + el.w / 2 : el.textAlign === 'right' ? el.x + el.w - 8 : el.x + 8;
          if ((el.textStrokeWidth ?? 0) > 0) { ctx.strokeStyle = el.textStroke ?? '#000'; ctx.lineWidth = el.textStrokeWidth ?? 0; ctx.strokeText(displayText, textX, el.y + (el.size ?? 32)); }
          ctx.fillStyle = el.color ?? '#fff';
          if ((el.letterSpacing ?? 0) !== 0 && displayText.length < 100) {
            const ls = el.letterSpacing ?? 0; let curX = textX;
            for (const ch of displayText) { ctx.fillText(ch, curX, el.y + (el.size ?? 32)); curX += ctx.measureText(ch).width + ls; }
          } else { ctx.fillText(displayText, textX, el.y + (el.size ?? 32)); }
          // Underline
          if (el.underline) {
            const tw = ctx.measureText(displayText).width;
            const underlineY = el.y + (el.size ?? 32) + 3;
            const ulStartX = el.textAlign === 'center' ? textX - tw / 2 : el.textAlign === 'right' ? textX - tw : textX;
            ctx.strokeStyle = el.color ?? '#fff'; ctx.lineWidth = Math.max(1, (el.size ?? 32) / 20); ctx.beginPath(); ctx.moveTo(ulStartX, underlineY); ctx.lineTo(ulStartX + tw, underlineY); ctx.stroke();
          }
          ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowBlur = 0; ctx.textAlign = 'left';
        } else if (el.type === 'path') {
          ctx.strokeStyle = el.color ?? '#fff'; ctx.lineWidth = el.strokeW ?? 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(new Path2D(el.path ?? ''));
        } else if (el.type === 'image') {
          const img = imgCache.get(el.id);
          if (img) {
            const hasCrop = (el.cropW !== undefined && el.cropW < 1) || (el.cropH !== undefined && el.cropH < 1) || (el.cropX !== undefined && el.cropX > 0) || (el.cropY !== undefined && el.cropY > 0);
            if (hasCrop) {
              const sx = (el.cropX ?? 0) * img.naturalWidth;
              const sy = (el.cropY ?? 0) * img.naturalHeight;
              const sw = (el.cropW ?? 1) * img.naturalWidth;
              const sh = (el.cropH ?? 1) * img.naturalHeight;
              ctx.drawImage(img, sx, sy, sw, sh, el.x, el.y, el.w, el.h);
            } else {
              ctx.drawImage(img, el.x, el.y, el.w, el.h);
            }
          }
        } else if (el.type === 'line' || el.type === 'arrow') {
          ctx.strokeStyle = el.strokeColor ?? '#fff'; ctx.lineWidth = el.lineWidth ?? 2; ctx.lineCap = 'round';
          ctx.setLineDash(el.dashStyle === 'dashed' ? [8, 4] : el.dashStyle === 'dotted' ? [2, 4] : []);
          ctx.beginPath(); ctx.moveTo(el.x, el.y); ctx.lineTo(el.x2 ?? el.x, el.y2 ?? el.y); ctx.stroke();
          if (el.type === 'arrow' && el.arrowHead !== 'none') {
            const ax = el.x2 ?? el.x, ay = el.y2 ?? el.y, angle = Math.atan2(ay - el.y, ax - el.x), hs = 12;
            ctx.fillStyle = el.strokeColor ?? '#fff'; ctx.beginPath(); ctx.moveTo(ax, ay);
            ctx.lineTo(ax - hs * Math.cos(angle - Math.PI / 6), ay - hs * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(ax - hs * Math.cos(angle + Math.PI / 6), ay - hs * Math.sin(angle + Math.PI / 6));
            ctx.closePath(); ctx.fill();
          }
          ctx.setLineDash([]);
        } else if (el.type === 'stickyNote') {
          ctx.fillStyle = el.noteColor ?? STICKY_NOTE_COLOR; ctx.shadowColor = 'rgba(0,0,0,.15)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
          ctx.fillRect(el.x, el.y, el.w, el.h); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
          ctx.fillStyle = STICKY_NOTE_TEXT_COLOR; ctx.font = `${el.size ?? 14}px sans-serif`;
          (el.noteText ?? t('thumbs.editor.noteDefault')).split('\n').forEach((line, i) => ctx.fillText(line, el.x + 10, el.y + 20 + i * ((el.size ?? 14) + 4)));
        } else if (el.type === 'table') {
          const rows = el.rows ?? 3, cols = el.cols ?? 3, cw = el.w / cols, ch = el.h / rows;
          const borderColor = el.tableBorderColor ?? el.strokeColor ?? 'rgba(255,255,255,.2)';
          // Draw cell backgrounds
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const cellColor = el.cellColors?.[r]?.[c];
              const isHeader = el.headerRow && r === 0;
              const bgColor = cellColor ?? (isHeader ? (el.headerColor ?? '#3a7bfd') : el.tableCellBg);
              if (bgColor && bgColor !== 'transparent') {
                ctx.fillStyle = bgColor;
                ctx.fillRect(el.x + c * cw, el.y + r * ch, cw, ch);
              }
            }
          }
          // Draw grid lines
          ctx.strokeStyle = borderColor; ctx.lineWidth = 1;
          for (let r = 0; r <= rows; r++) { ctx.beginPath(); ctx.moveTo(el.x, el.y + r * ch); ctx.lineTo(el.x + el.w, el.y + r * ch); ctx.stroke(); }
          for (let c = 0; c <= cols; c++) { ctx.beginPath(); ctx.moveTo(el.x + c * cw, el.y); ctx.lineTo(el.x + c * cw, el.y + el.h); ctx.stroke(); }
          // Draw cell text
          for (let r = 0; r < rows; r++) {
            const isHeader = el.headerRow && r === 0;
            ctx.fillStyle = isHeader ? '#fff' : '#fff';
            ctx.font = isHeader ? 'bold 11px sans-serif' : '10px sans-serif';
            for (let c = 0; c < cols; c++) {
              const txt = el.cellData?.[r]?.[c] ?? '';
              if (txt) ctx.fillText(txt, el.x + c * cw + 4, el.y + r * ch + 14, cw - 8);
            }
          }
        }
        ctx.filter = 'none'; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        if (needsTransform) { ctx.restore(); }
        ctx.globalAlpha = 1;
      }
      return canvas;
    });
  }, [els, canvasW, canvasH, canvasBg, canvasBgGradient, t]);

  // ===== Download =====
  const downloadCanvas = useCallback((format?: 'png' | 'jpg' | 'webp', overrideW?: number, overrideH?: number, overrideQ?: number) => {
    const fmt = format ?? exportFormat;
    const { w: ew, h: eh } = overrideW && overrideH ? { w: overrideW, h: overrideH } : getExportSize();
    const fmtInfo = EXPORT_FORMATS.find((f) => f.id === fmt) ?? EXPORT_FORMATS[0];
    const quality = fmt === 'png' ? 1 : (overrideQ !== undefined ? overrideQ / 100 : exportQuality / 100);
    setIsDownloading(true);
    renderToCanvas(ew, eh).then((canvas) => {
      const link = document.createElement('a');
      link.download = `thumbnail${fmtInfo.ext}`;
      link.href = canvas.toDataURL(fmtInfo.mime, quality);
      link.click();
    }).catch((err) => {
      if (process.env.NODE_ENV === 'development') console.error('[ThumbnailEditor] Download failed:', err);
    }).finally(() => { setIsDownloading(false); });
  }, [exportFormat, getExportSize, exportQuality, EXPORT_FORMATS, renderToCanvas]);

  /** Copy thumbnail to clipboard */
  const copyToClipboard = useCallback(async () => {
    setIsCopying(true); setCopyStatus('idle');
    try {
      const { w, h } = getExportSize();
      const canvas = await renderToCanvas(w, h);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Blob creation failed')), 'image/png');
      });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopyStatus('success'); setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('[ThumbnailEditor] Copy failed:', err);
      setCopyStatus('error'); setTimeout(() => setCopyStatus('idle'), 2000);
    } finally { setIsCopying(false); }
  }, [getExportSize, renderToCanvas]);

  /** Save to media library via /api/upload */
  const saveToLibrary = useCallback(async () => {
    setIsSavingToLibrary(true); setSaveStatus('idle');
    try {
      const { w, h } = getExportSize();
      const { mime, ext, quality } = getExportMime();
      const canvas = await renderToCanvas(w, h);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Blob creation failed')), mime, quality);
      });
      const formData = new FormData();
      formData.append('file', new File([blob], `thumbnail${ext}`, { type: mime }));
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      setSaveStatus('success'); setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('[ThumbnailEditor] Save to library failed:', err);
      setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 2000);
    } finally { setIsSavingToLibrary(false); }
  }, [getExportSize, getExportMime, renderToCanvas]);

  /** Set as project thumbnail */
  const setProjectThumbnail = trpc.project.update.useMutation({
    onSuccess: () => { setThumbnailStatus('success'); setTimeout(() => setThumbnailStatus('idle'), 2000); },
    onError: () => { setThumbnailStatus('error'); setTimeout(() => setThumbnailStatus('idle'), 2000); },
  });
  const handleSetProjectThumbnail = useCallback(async () => {
    if (!projectId) return;
    try {
      const canvas = await renderToCanvas(canvasW, canvasH);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setProjectThumbnail.mutate({ id: projectId, thumbnailUrl: dataUrl });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('[ThumbnailEditor] Set thumbnail failed:', err);
      setThumbnailStatus('error'); setTimeout(() => setThumbnailStatus('idle'), 2000);
    }
  }, [projectId, canvasW, canvasH, renderToCanvas, setProjectThumbnail]);

  // ===== Rotation handler =====
  const startRotation = (el: CanvasElement, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    store().pushHistoryDebounced();
    const canvasEl = canvasAreaRef.current;
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const sx = canvasW / rect.width;
    const sy = canvasH / rect.height;
    const cx = el.x + el.w / 2;
    const cy = el.y + el.h / 2;
    const onMove = (ev: MouseEvent) => {
      const mx = (ev.clientX - rect.left) * sx;
      const my = (ev.clientY - rect.top) * sy;
      const angle = Math.atan2(my - cy, mx - cx) * 180 / Math.PI + 90;
      store().updEl(el.id, { rot: Math.round(((angle % 360) + 360) % 360) });
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // ===== Effects helper =====
  const getEffectStyles = (el: CanvasElement): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    const filters: string[] = [];
    if (el.glow) {
      filters.push(`drop-shadow(0 0 ${el.glow.blur}px ${el.glow.color})`);
    }
    if (el.blur && el.blur > 0) {
      filters.push(`blur(${el.blur}px)`);
    }
    if (el.brightness !== undefined && el.brightness !== 100) {
      filters.push(`brightness(${el.brightness / 100})`);
    }
    if (el.contrast !== undefined && el.contrast !== 100) {
      filters.push(`contrast(${el.contrast / 100})`);
    }
    // Image filters
    if (el.grayscale !== undefined && el.grayscale > 0) {
      filters.push(`grayscale(${el.grayscale}%)`);
    }
    if (el.sepia !== undefined && el.sepia > 0) {
      filters.push(`sepia(${el.sepia}%)`);
    }
    if (el.hueRotate !== undefined && el.hueRotate > 0) {
      filters.push(`hue-rotate(${el.hueRotate}deg)`);
    }
    if (el.saturate !== undefined && el.saturate !== 100) {
      filters.push(`saturate(${el.saturate}%)`);
    }
    if (el.invert) {
      filters.push('invert(100%)');
    }
    if (filters.length > 0) {
      styles.filter = filters.join(' ');
    }
    return styles;
  };

  const getTextGradientStyles = (el: CanvasElement): React.CSSProperties => {
    if (!el.textGradient) return {};
    const midStop = el.textGradient.mid ? `, ${el.textGradient.mid}` : '';
    return {
      background: `linear-gradient(${el.textGradient.angle}deg, ${el.textGradient.from}${midStop}, ${el.textGradient.to})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    };
  };

  /** Generate SVG pattern defs + fill for shape pattern fills */
  const getPatternDefs = (el: CanvasElement, patternId: string): React.ReactNode => {
    if (!el.pattern || el.pattern === 'none') return null;
    const size = el.patternSize ?? 20;
    const pColor = el.patternColor ?? '#ffffff';
    switch (el.pattern) {
      case 'dots':
        return (
          <pattern id={patternId} width={size} height={size} patternUnits="userSpaceOnUse">
            <circle cx={size / 2} cy={size / 2} r={size * 0.15} fill={pColor} />
          </pattern>
        );
      case 'lines':
        return (
          <pattern id={patternId} width={size} height={size} patternUnits="userSpaceOnUse">
            <line x1={0} y1={size / 2} x2={size} y2={size / 2} stroke={pColor} strokeWidth={size * 0.08} />
          </pattern>
        );
      case 'grid':
        return (
          <pattern id={patternId} width={size} height={size} patternUnits="userSpaceOnUse">
            <line x1={0} y1={0} x2={0} y2={size} stroke={pColor} strokeWidth={size * 0.06} />
            <line x1={0} y1={0} x2={size} y2={0} stroke={pColor} strokeWidth={size * 0.06} />
          </pattern>
        );
      case 'diagonal':
        return (
          <pattern id={patternId} width={size} height={size} patternUnits="userSpaceOnUse">
            <line x1={0} y1={size} x2={size} y2={0} stroke={pColor} strokeWidth={size * 0.08} />
          </pattern>
        );
      case 'chevron': {
        const mid = size / 2;
        return (
          <pattern id={patternId} width={size} height={size} patternUnits="userSpaceOnUse">
            <polyline points={`0,${mid} ${mid},0 ${size},${mid}`} fill="none" stroke={pColor} strokeWidth={size * 0.08} />
            <polyline points={`0,${size} ${mid},${mid} ${size},${size}`} fill="none" stroke={pColor} strokeWidth={size * 0.08} />
          </pattern>
        );
      }
      case 'waves': {
        const mid = size / 2;
        return (
          <pattern id={patternId} width={size} height={size} patternUnits="userSpaceOnUse">
            <path d={`M0,${mid} Q${size * 0.25},0 ${mid},${mid} T${size},${mid}`} fill="none" stroke={pColor} strokeWidth={size * 0.08} />
          </pattern>
        );
      }
      default:
        return null;
    }
  };

  /** Get border dash CSS for shapes */
  const getShapeBorderStyle = (el: CanvasElement, isSel: boolean): string => {
    if (isSel) return `2px dashed ${C.accent}88`;
    if (!el.borderWidth || el.borderWidth <= 0) return el.border ?? 'none';
    const style = el.borderDash === 'dashed' ? 'dashed' : el.borderDash === 'dotted' ? 'dotted' : 'solid';
    return `${el.borderWidth}px ${style} ${el.borderColor ?? '#fff'}`;
  };

  /** Build CSS transform string including rotation and flip */
  const buildTransform = (el: CanvasElement): string | undefined => {
    const parts: string[] = [];
    if (el.rot) parts.push(`rotate(${el.rot}deg)`);
    if (el.flipX) parts.push('scaleX(-1)');
    if (el.flipY) parts.push('scaleY(-1)');
    return parts.length > 0 ? parts.join(' ') : undefined;
  };

  // ===== Render element =====
  const renderElement = (el: CanvasElement) => {
    if (el.visible === false) return null;
    const isSel = selIds.includes(el.id);
    // Entrance animation for newly added elements
    const isNewEl = recentlyAdded.has(el.id);
    const entranceAnim: React.CSSProperties = isNewEl ? { animation: 'elementAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' } : {};
    // Selection highlight flash animation
    const isNewSel = recentlySelected.has(el.id);
    const selectionFlashAnim: React.CSSProperties = isNewSel ? { animation: 'selectionFlash 0.2s ease-out' } : {};
    // 8-dot resize handles + rotation handle
    const handleDotStyle = (cursor: string, pos: React.CSSProperties): React.CSSProperties => ({
      position: 'absolute', width: 8, height: 8, background: '#fff', border: `1.5px solid ${C.accent}`, borderRadius: '50%', cursor, zIndex: 5, ...pos,
    });
    const resizeHandles = isSel && (
      <>
        {/* Rotation handle */}
        <div onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); startRotation(el, e); }}
          style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', width: 14, height: 14, background: '#fff', border: `1.5px solid ${C.accent}`, borderRadius: '50%', cursor: 'grab', zIndex: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
        </div>
        {/* Rotation connector line */}
        <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', width: 1, height: 16, background: C.accent, opacity: 0.5, zIndex: 4, pointerEvents: 'none' }} />
        {/* 8 resize dots */}
        <div onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); store().pushHistoryDebounced(); store().setResize({ id: el.id }); }}
          style={handleDotStyle('nwse-resize', { bottom: -4, right: -4 })} />
        <div onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); store().pushHistoryDebounced(); store().setResize({ id: el.id }); }}
          style={handleDotStyle('nw-resize', { top: -4, left: -4 })} />
        <div onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); store().pushHistoryDebounced(); store().setResize({ id: el.id }); }}
          style={handleDotStyle('ne-resize', { top: -4, right: -4 })} />
        <div onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); store().pushHistoryDebounced(); store().setResize({ id: el.id }); }}
          style={handleDotStyle('sw-resize', { bottom: -4, left: -4 })} />
        <div onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); store().pushHistoryDebounced(); store().setResize({ id: el.id }); }}
          style={handleDotStyle('n-resize', { top: -4, left: '50%', transform: 'translateX(-50%)' })} />
        <div onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); store().pushHistoryDebounced(); store().setResize({ id: el.id }); }}
          style={handleDotStyle('s-resize', { bottom: -4, left: '50%', transform: 'translateX(-50%)' })} />
        <div onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); store().pushHistoryDebounced(); store().setResize({ id: el.id }); }}
          style={handleDotStyle('w-resize', { top: '50%', left: -4, transform: 'translateY(-50%)' })} />
        <div onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); store().pushHistoryDebounced(); store().setResize({ id: el.id }); }}
          style={handleDotStyle('e-resize', { top: '50%', right: -4, transform: 'translateY(-50%)' })} />
      </>
    );
    const deleteHandle = isSel && (
      <div
        title={t('thumbs.editor.deleteTitle')}
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); store().delEl(el.id); }}
        style={{ position: 'absolute', top: -10, right: -10, width: 20, height: 20, background: '#e53935', borderRadius: '50%', cursor: 'pointer', zIndex: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1, boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}
      >&times;</div>
    );
    const elDrag = (e: React.MouseEvent) => {
      e.stopPropagation(); store().setSelId(el.id);
      store().pushHistoryDebounced(); // batch drag into one undo step
      const rect = (e.currentTarget as HTMLElement).closest('[data-canvas]')?.getBoundingClientRect() ?? (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
      const sx = canvasW / rect.width;
      const sy = canvasH / rect.height;
      store().setDrag({ id: el.id, ox: (e.clientX - rect.left) * sx - el.x, oy: (e.clientY - rect.top) * sy - el.y });
    };

    if (el.type === 'text') {
      const effectStyles = getEffectStyles(el);
      const gradientStyles = getTextGradientStyles(el);
      const isEditingText = isSel && document.activeElement?.getAttribute('data-text-el') === el.id;
      const resolvedFontWeight = el.fontWeight ?? (el.bold ? 700 : 400);
      const hasCurve = el.curveAmount && el.curveAmount !== 0;
      const textStyle: React.CSSProperties = {
        position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', minHeight: el.h / canvasH * 100 + '%',
        fontSize: hasCurve ? undefined : `clamp(8px,${(el.size ?? 32) / canvasW * 100}vw,${(el.size ?? 32) * 0.8}px)`,
        fontWeight: hasCurve ? undefined : resolvedFontWeight, fontStyle: hasCurve ? undefined : (el.italic ? 'italic' : 'normal'), fontFamily: hasCurve ? undefined : el.font, color: hasCurve ? undefined : (el.textGradient ? undefined : el.color), textAlign: hasCurve ? undefined : (el.textAlign ?? 'left'),
        textDecoration: hasCurve ? undefined : (el.underline ? 'underline' : 'none'),
        textShadow: hasCurve ? undefined : (el.shadow !== 'none' ? el.shadow : 'none'), opacity: el.opacity, background: hasCurve ? undefined : (el.textGradient ? undefined : el.bg), borderRadius: el.borderR,
        padding: hasCurve ? undefined : '4px 8px', whiteSpace: hasCurve ? undefined : 'pre-wrap', wordBreak: hasCurve ? undefined : 'break-word',
        border: isSel ? `2px dashed ${C.accent}88` : '2px solid transparent', cursor: isEditingText ? 'text' : 'move', boxSizing: 'border-box', outline: 'none',
        transform: buildTransform(el),
        letterSpacing: (!hasCurve && el.letterSpacing) ? `${el.letterSpacing}px` : undefined,
        lineHeight: (!hasCurve && el.lineHeight) ? `${el.lineHeight}` : undefined,
        textTransform: (!hasCurve && el.textTransform && el.textTransform !== 'none') ? el.textTransform : undefined,
        WebkitTextStroke: (!hasCurve && (el.textStrokeWidth ?? 0) > 0) ? `${el.textStrokeWidth}px ${el.textStroke ?? '#000'}` : undefined,
        mixBlendMode: (el.blendMode && el.blendMode !== 'normal') ? el.blendMode as React.CSSProperties['mixBlendMode'] : undefined,
        ...effectStyles,
        ...(hasCurve ? {} : gradientStyles),
      };

      // Curved text rendering via SVG textPath
      if (hasCurve) {
        const curveDir = el.curveAmount! > 0;
        const absAmount = Math.abs(el.curveAmount!);
        const svgW = el.w;
        const svgH = el.h;
        const qY = curveDir ? svgH - (absAmount / 100) * svgH : (absAmount / 100) * svgH;
        const startY = curveDir ? svgH : 0;
        const endY = startY;
        const pathD = `M 0,${startY} Q ${svgW / 2},${qY} ${svgW},${endY}`;
        const svgFontSize = Math.min((el.size ?? 32), svgH * 0.8);
        return (
          <div key={el.id} data-text-el={el.id} style={{ ...textStyle, ...entranceAnim, ...selectionFlashAnim }}
            onMouseDown={(e) => {
              if (!isSel) { e.stopPropagation(); store().setSelId(el.id); return; }
              elDrag(e);
            }}
            onDoubleClick={(e) => { e.stopPropagation(); }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: 'visible' }}>
              <defs>
                <path id={`curve-${el.id}`} d={pathD} fill="none" />
              </defs>
              <text
                fill={el.color ?? '#fff'}
                fontSize={svgFontSize}
                fontWeight={resolvedFontWeight}
                fontStyle={el.italic ? 'italic' : 'normal'}
                fontFamily={el.font ?? 'sans-serif'}
                textDecoration={el.underline ? 'underline' : undefined}
                letterSpacing={el.letterSpacing ?? undefined}
              >
                <textPath href={`#curve-${el.id}`} startOffset="50%" textAnchor="middle">
                  {el.text}
                </textPath>
              </text>
            </svg>
            {resizeHandles}{deleteHandle}
          </div>
        );
      }

      return (
        <div key={el.id} data-text-el={el.id} style={{ ...textStyle, ...entranceAnim, ...selectionFlashAnim }}
          contentEditable={false} suppressContentEditableWarning
          onBlur={(e) => store().updEl(el.id, { text: (e.target as HTMLElement).innerText })}
          onMouseDown={(e) => {
            // If already in edit mode (contentEditable=true), let cursor work
            if ((e.currentTarget as HTMLElement).contentEditable === 'true') return;
            if (!isSel) { e.stopPropagation(); store().setSelId(el.id); return; }
            elDrag(e);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            const target = e.currentTarget as HTMLElement;
            target.contentEditable = 'true';
            target.focus();
            // Place cursor at end
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(target);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }}>
          {el.text}{resizeHandles}{deleteHandle}
        </div>
      );
    }

    if (el.type === 'rect') {
      const shapeBorder = getShapeBorderStyle(el, isSel);
      const hasPattern = el.pattern && el.pattern !== 'none';
      const patternId = `pattern-${el.id}`;
      return (
        <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', background: hasPattern ? undefined : el.color, opacity: el.opacity, borderRadius: el.borderR, border: shapeBorder, cursor: 'move', boxSizing: 'border-box', transform: buildTransform(el), boxShadow: el.shapeShadow && el.shapeShadow !== 'none' ? el.shapeShadow : undefined, mixBlendMode: (el.blendMode && el.blendMode !== 'normal') ? el.blendMode as React.CSSProperties['mixBlendMode'] : undefined, overflow: 'hidden', ...getEffectStyles(el), ...entranceAnim, ...selectionFlashAnim }}
          onMouseDown={elDrag}>
          {hasPattern && (
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, borderRadius: el.borderR }}>
              <defs>{getPatternDefs(el, patternId)}</defs>
              <rect width="100%" height="100%" fill={el.color ?? '#6366f1'} />
              <rect width="100%" height="100%" fill={`url(#${patternId})`} />
            </svg>
          )}
          {resizeHandles}{deleteHandle}
        </div>
      );
    }

    if (el.type === 'circle') {
      const shapeBorder = getShapeBorderStyle(el, isSel);
      const hasPattern = el.pattern && el.pattern !== 'none';
      const patternId = `pattern-${el.id}`;
      return (
        <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', background: hasPattern ? undefined : el.color, opacity: el.opacity, borderRadius: '50%', border: shapeBorder, cursor: 'move', boxSizing: 'border-box', transform: buildTransform(el), boxShadow: el.shapeShadow && el.shapeShadow !== 'none' ? el.shapeShadow : undefined, mixBlendMode: (el.blendMode && el.blendMode !== 'normal') ? el.blendMode as React.CSSProperties['mixBlendMode'] : undefined, overflow: 'hidden', ...getEffectStyles(el), ...entranceAnim, ...selectionFlashAnim }}
          onMouseDown={elDrag}>
          {hasPattern && (
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <defs>{getPatternDefs(el, patternId)}</defs>
              <rect width="100%" height="100%" fill={el.color ?? '#6366f1'} />
              <rect width="100%" height="100%" fill={`url(#${patternId})`} />
            </svg>
          )}
          {resizeHandles}{deleteHandle}
        </div>
      );
    }

    if (el.type === 'image') {
      const imgEffects = getEffectStyles(el);
      const hasCrop = (el.cropW !== undefined && el.cropW < 1) || (el.cropH !== undefined && el.cropH < 1) || (el.cropX !== undefined && el.cropX > 0) || (el.cropY !== undefined && el.cropY > 0);
      const cropX = el.cropX ?? 0;
      const cropY = el.cropY ?? 0;
      const cropW = el.cropW ?? 1;
      const cropH = el.cropH ?? 1;
      const fitMode = el.objectFit ?? 'cover';
      return (
        <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', border: isSel ? `2px dashed ${C.accent}88` : 'none', cursor: 'move', boxSizing: 'border-box', transform: buildTransform(el), boxShadow: el.shapeShadow && el.shapeShadow !== 'none' ? el.shapeShadow : undefined, overflow: hasCrop ? 'hidden' : (fitMode === 'none' ? 'visible' : 'hidden'), mixBlendMode: (el.blendMode && el.blendMode !== 'normal') ? el.blendMode as React.CSSProperties['mixBlendMode'] : undefined, ...entranceAnim, ...selectionFlashAnim }}
          onMouseDown={elDrag}
          onDoubleClick={(e) => {
            e.stopPropagation();
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = () => {
              const file = input.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const result = ev.target?.result;
                if (typeof result === 'string') store().replaceImage(el.id, result);
              };
              reader.readAsDataURL(file);
            };
            input.click();
          }}>
          <img src={el.src} alt={t('thumbs.editor.imageAlt')} loading="lazy" decoding="async" style={{
            width: hasCrop ? `${100 / cropW}%` : '100%',
            height: hasCrop ? `${100 / cropH}%` : '100%',
            objectFit: fitMode,
            opacity: el.opacity,
            borderRadius: el.borderR,
            pointerEvents: 'none',
            marginLeft: hasCrop ? `${-cropX / cropW * 100}%` : undefined,
            marginTop: hasCrop ? `${-cropY / cropH * 100}%` : undefined,
            ...imgEffects,
          }} />
          {resizeHandles}{deleteHandle}
        </div>
      );
    }

    if (el.type === 'path') return (
      <svg key={el.id} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox={`0 0 ${canvasW} ${canvasH}`}>
        <path d={el.path} fill="none" stroke={el.color} strokeWidth={el.strokeW} strokeLinecap="round" strokeLinejoin="round" opacity={el.opacity} />
        {/* Invisible wider hit area for selection */}
        <path d={el.path} fill="none" stroke="transparent" strokeWidth={Math.max((el.strokeW ?? 3) + 10, 14)} strokeLinecap="round" strokeLinejoin="round"
          style={{ pointerEvents: 'stroke', cursor: isSel ? 'move' : 'pointer' }}
          onMouseDown={(e) => { e.stopPropagation(); store().setSelId(el.id); }} />
        {isSel && deleteHandle && (
          <foreignObject x={el.x + el.w - 10} y={el.y - 10} width={20} height={20}>
            {deleteHandle}
          </foreignObject>
        )}
      </svg>
    );

    if (el.type === 'line' || el.type === 'arrow') return (
      <svg key={el.id} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox={`0 0 ${canvasW} ${canvasH}`}>
        <line x1={el.x} y1={el.y} x2={el.x2 ?? el.x} y2={el.y2 ?? el.y}
          stroke={el.strokeColor ?? '#fff'} strokeWidth={el.lineWidth ?? 2}
          strokeDasharray={el.dashStyle === 'dashed' ? '8,4' : el.dashStyle === 'dotted' ? '2,4' : 'none'}
          opacity={el.opacity ?? 1} />
        {el.type === 'arrow' && el.arrowHead !== 'none' && (() => {
          const ax = el.x2 ?? el.x, ay = el.y2 ?? el.y, angle = Math.atan2(ay - el.y, ax - el.x), hs = 12;
          return <polygon points={`${ax},${ay} ${ax - hs * Math.cos(angle - Math.PI / 6)},${ay - hs * Math.sin(angle - Math.PI / 6)} ${ax - hs * Math.cos(angle + Math.PI / 6)},${ay - hs * Math.sin(angle + Math.PI / 6)}`} fill={el.strokeColor ?? '#fff'} opacity={el.opacity ?? 1} />;
        })()}
        <line x1={el.x} y1={el.y} x2={el.x2 ?? el.x} y2={el.y2 ?? el.y} stroke="transparent" strokeWidth={12}
          style={{ pointerEvents: 'stroke', cursor: 'move' }}
          onMouseDown={(e) => { e.stopPropagation(); store().setSelId(el.id); }} />
        {isSel && <>
          <circle cx={el.x} cy={el.y} r={5} fill={C.accent} style={{ pointerEvents: 'auto', cursor: 'crosshair' }} />
          <circle cx={el.x2 ?? el.x} cy={el.y2 ?? el.y} r={5} fill={C.accent} style={{ pointerEvents: 'auto', cursor: 'crosshair' }} />
        </>}
      </svg>
    );

    if (el.type === 'stickyNote') return (
      <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', background: el.noteColor ?? STICKY_NOTE_COLOR, borderRadius: 4, padding: '8px 10px', boxShadow: '2px 2px 8px rgba(0,0,0,.15)', fontSize: `clamp(8px,${(el.size ?? 14) / canvasW * 100}vw,${(el.size ?? 14)}px)`, color: STICKY_NOTE_TEXT_COLOR, fontFamily: 'sans-serif', border: isSel ? `2px dashed ${C.accent}88` : 'none', cursor: 'move', boxSizing: 'border-box', overflow: 'hidden', opacity: el.opacity ?? 1, transform: buildTransform(el), ...entranceAnim, ...selectionFlashAnim }}
        contentEditable={isSel} suppressContentEditableWarning
        onBlur={(e) => store().updEl(el.id, { noteText: (e.target as HTMLElement).innerText })}
        onMouseDown={elDrag}
        onDoubleClick={(e) => { e.stopPropagation(); (e.currentTarget as HTMLElement).focus(); }}>
        {el.noteText ?? t('thumbs.editor.noteDefault')}{resizeHandles}{deleteHandle}
      </div>
    );

    if (el.type === 'table') {
      const rows = el.rows ?? 3, cols = el.cols ?? 3;
      const borderColor = el.tableBorderColor ?? el.strokeColor ?? 'rgba(255,255,255,.2)';
      return (
        <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', display: 'grid', gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: `repeat(${cols}, 1fr)`, border: `1px solid ${isSel ? C.accent + '88' : borderColor}`, cursor: 'move', boxSizing: 'border-box', opacity: el.opacity ?? 1, transform: buildTransform(el), ...entranceAnim, ...selectionFlashAnim }}
          onMouseDown={elDrag}>
          {Array.from({ length: rows * cols }, (_, i) => {
            const r = Math.floor(i / cols), c = i % cols;
            const isHeader = el.headerRow && r === 0;
            const cellColor = el.cellColors?.[r]?.[c];
            const bgColor = cellColor ?? (isHeader ? (el.headerColor ?? '#3a7bfd') : (el.tableCellBg ?? 'transparent'));
            return (
              <div key={i} contentEditable={isSel} suppressContentEditableWarning
                style={{
                  border: `1px solid ${borderColor}`,
                  padding: '2px 4px',
                  fontSize: isHeader ? 11 : 10,
                  fontWeight: isHeader ? 700 : 400,
                  color: '#fff',
                  outline: 'none',
                  overflow: 'hidden',
                  background: bgColor,
                  cursor: isSel ? 'text' : 'move',
                }}
                onBlur={(ev) => {
                  const data: string[][] = JSON.parse(JSON.stringify(el.cellData ?? Array.from({ length: rows }, () => Array(cols).fill(''))));
                  if (!data[r]) data[r] = Array(cols).fill('');
                  data[r][c] = (ev.target as HTMLElement).innerText;
                  store().updEl(el.id, { cellData: data });
                }}
                onDoubleClick={(ev) => { ev.stopPropagation(); (ev.currentTarget as HTMLElement).focus(); }}>
                {el.cellData?.[r]?.[c] ?? ''}
              </div>
            );
          })}
          {resizeHandles}{deleteHandle}
        </div>
      );
    }
    return null;
  };

  const captureCanvas = (): string | null => {
    // Try to capture the visible canvas element first (includes everything rendered)
    const visibleCanvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (visibleCanvas && visibleCanvas.width > 0) {
      try { return visibleCanvas.toDataURL('image/png'); } catch { /* tainted canvas, fall through */ }
    }
    // Fallback: render manually (non-image elements only; images require async loading)
    const canvas = document.createElement('canvas');
    canvas.width = canvasW; canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = canvasBg; ctx.fillRect(0, 0, canvasW, canvasH);
    // Gradient background in fallback capture
    const capGrad = useThumbnailStore.getState().canvasBgGradient;
    if (capGrad && !useThumbnailStore.getState().canvasBgImage) {
      let gradient: CanvasGradient;
      if (capGrad.type === 'radial') {
        gradient = ctx.createRadialGradient(canvasW / 2, canvasH / 2, 0, canvasW / 2, canvasH / 2, Math.max(canvasW, canvasH) / 2);
      } else {
        const angleRad = (capGrad.angle - 90) * Math.PI / 180;
        const cx = canvasW / 2, cy = canvasH / 2, len = Math.max(canvasW, canvasH);
        gradient = ctx.createLinearGradient(cx - Math.cos(angleRad) * len / 2, cy - Math.sin(angleRad) * len / 2, cx + Math.cos(angleRad) * len / 2, cy + Math.sin(angleRad) * len / 2);
      }
      gradient.addColorStop(0, capGrad.from);
      gradient.addColorStop(1, capGrad.to);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }
    for (const el of els) {
      if (el.visible === false) continue;
      ctx.globalAlpha = el.opacity ?? 1;
      if (el.type === 'rect') {
        ctx.fillStyle = el.color ?? '#fff'; ctx.fillRect(el.x, el.y, el.w, el.h);
      } else if (el.type === 'circle') {
        ctx.fillStyle = el.color ?? '#fff'; ctx.beginPath(); ctx.ellipse(el.x + el.w / 2, el.y + el.h / 2, el.w / 2, el.h / 2, 0, 0, Math.PI * 2); ctx.fill();
      } else if (el.type === 'text') {
        ctx.fillStyle = el.color ?? '#fff'; ctx.font = (el.italic ? 'italic ' : '') + (el.fontWeight ?? (el.bold ? 700 : 400)) + ' ' + (el.size ?? 32) + 'px ' + (el.font ?? 'sans-serif');
        ctx.textAlign = el.textAlign ?? 'left';
        const stx = el.textAlign === 'center' ? el.x + el.w / 2 : el.textAlign === 'right' ? el.x + el.w - 8 : el.x + 8;
        ctx.fillText(el.text ?? '', stx, el.y + (el.size ?? 32)); ctx.textAlign = 'left';
      } else if (el.type === 'path') {
        ctx.strokeStyle = el.color ?? '#fff'; ctx.lineWidth = el.strokeW ?? 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(new Path2D(el.path ?? ''));
      }
      // Note: images are skipped in sync capture since they require async loading.
      // The downloadCanvas() function handles images correctly via Promise.all.
      ctx.globalAlpha = 1;
    }
    return canvas.toDataURL('image/png');
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (ev) => { const result = ev.target?.result; if (typeof result === 'string') store().addImage(result); };
    reader.onerror = () => { if (process.env.NODE_ENV === 'development') console.error('[ThumbnailEditor] Failed to read file:', file.name); };
    reader.readAsDataURL(file); e.target.value = '';
  };

  // D8: Context menu
  const onCanvasContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const hitEl = hitTestElement(els, x, y);
    store().setContextMenu({ x: e.clientX, y: e.clientY, elId: hitEl?.id ?? null });
    if (hitEl) store().setSelId(hitEl.id);
  };

  const onCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
  const onCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const { x, y } = (() => {
      const target = (e.currentTarget as HTMLElement).closest('[data-canvas]') as HTMLElement ?? e.currentTarget;
      const rect = target.getBoundingClientRect();
      const sx = canvasW / rect.width;
      const sy = canvasH / rect.height;
      return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
    })();
    // Asset image drop
    const assetUrl = e.dataTransfer.getData('application/x-tubeforge-asset');
    if (assetUrl) { store().addImage(assetUrl); return; }
    // Preset element drop
    const presetJson = e.dataTransfer.getData('application/x-tubeforge-preset');
    if (presetJson) {
      try {
        const preset = JSON.parse(presetJson);
        if (preset.type === 'rect' || preset.type === 'circle' || preset.type === 'triangle' || preset.type === 'star') {
          store().addShape(preset.type, x, y);
        } else if (preset.type === 'line') { store().addLine(x, y, x + 200, y); }
        else if (preset.type === 'arrow') { store().addArrow(x, y, x + 200, y); }
        else if (preset.type === 'stickyNote') { store().addStickyNote(x, y); }
        else if (preset.type === 'table') { store().addTable(preset.props?.rows ?? 3, preset.props?.cols ?? 3, x, y); }
      } catch { /* invalid JSON */ }
      return;
    }
    // Fallback: file drop from OS
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => { const result = ev.target?.result; if (typeof result === 'string') store().addImage(result); };
        reader.onerror = () => { if (process.env.NODE_ENV === 'development') console.error('[ThumbnailEditor] Failed to read dropped file:', file.name); };
        reader.readAsDataURL(file);
      });
    }
  };

  // ===== SVG icons for header buttons =====
  const undoIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>;
  const redoIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
  const downloadIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
  const cameraIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
  const sparkleIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
  const zoomOutIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>;
  const zoomInIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>;
  const fitIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>;
  const chevronIcon = <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;

  // Shared button styles to reduce duplication
  const headerBtn: React.CSSProperties = { padding: isMobile ? '10px 12px' : '7px 12px', minHeight: isMobile ? 44 : 'auto', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .15s', whiteSpace: 'nowrap' as const, flexShrink: 0 };
  const dropdownPanel: React.CSSProperties = { position: 'absolute', top: '100%', right: 0, marginTop: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 6, zIndex: Z_INDEX.TOOLBAR_POPOVER, boxShadow: '0 8px 32px rgba(0,0,0,.25), 0 2px 8px rgba(0,0,0,.15)' };
  const menuItem: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: C.text, transition: 'background .1s' };

  return (
    <div className="tf-thumb-editor-root">
      <div className="tf-thumb-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 10 : 16, flexWrap: 'wrap', gap: isMobile ? 8 : 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, margin: '0' }}>{t('thumbs.editor.title')}</h2>
            {project.data?.title && <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>— {project.data.title}</span>}
            {projectId && (
              <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 4, transition: 'color .3s', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {autoSaveState === 'saving' ? (
                  <span style={{ color: C.orange, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.orange, display: 'inline-block', animation: 'pulse 1s ease-in-out infinite' }} />
                    {t('thumbs.editor.saving')}
                  </span>
                ) : autoSaveState === 'unsaved' ? (
                  <span style={{ color: C.red, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.red, display: 'inline-block' }} />
                    {t('thumbs.editor.unsaved')}
                  </span>
                ) : (
                  <span style={{ color: C.green, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 6, transition: 'background 0.6s ease', background: saveFlashActive ? 'rgba(34,197,94,0.15)' : 'transparent' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, display: 'inline-block', transition: 'transform 0.3s ease', transform: saveFlashActive ? 'scale(1.3)' : 'scale(1)' }} />
                    {lastSavedAt ? `Saved ${formatSavedAgo(lastSavedAt)}` : t('thumbs.editor.saved')}
                  </span>
                )}
                {autoSaveState === 'unsaved' && (
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('tubeforge:manual-save'))}
                    title="Save Now (Ctrl+S)"
                    style={{ fontSize: 10, fontWeight: 600, color: C.accent, background: 'transparent', border: `1px solid ${C.accent}44`, borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', marginLeft: 2 }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.accent + '15'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >Save Now</button>
                )}
              </span>
            )}
          </div>
          <p style={{ color: C.sub, fontSize: 13, margin: '4px 0 0' }}>{t('thumbs.editor.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', overflowX: isMobile ? 'auto' : 'visible', flexShrink: 0, maxWidth: '100%', WebkitOverflowScrolling: 'touch' as const }}>
          {!isMobile && <OnlineUsers />}
          <div style={{ width: 1, height: 20, background: C.border, margin: '0 2px' }} />
          <button onClick={() => store().undo()} disabled={historyCount === 0} title={`${t('thumbs.editor.undoTitle')} (Ctrl+Z)${historyCount > 0 ? ` — ${historyCount}` : ''}`} style={{ ...headerBtn, padding: '7px 8px', color: historyCount === 0 ? C.dim : C.sub, cursor: historyCount === 0 ? 'default' : 'pointer', opacity: historyCount === 0 ? 0.3 : 1, display: 'inline-flex', alignItems: 'center', gap: 3 }}>{undoIcon}{historyCount > 0 && <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.7 }}>({historyCount})</span>}</button>
          <button onClick={() => store().redo()} disabled={futureCount === 0} title={`${t('thumbs.editor.redoTitle')} (Ctrl+Shift+Z)${futureCount > 0 ? ` — ${futureCount}` : ''}`} style={{ ...headerBtn, padding: '7px 8px', color: futureCount === 0 ? C.dim : C.sub, cursor: futureCount === 0 ? 'default' : 'pointer', opacity: futureCount === 0 ? 0.3 : 1, display: 'inline-flex', alignItems: 'center', gap: 3 }}>{redoIcon}{futureCount > 0 && <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.7 }}>({futureCount})</span>}</button>
          <div style={{ width: 1, height: 20, background: C.border, margin: '0 2px' }} />
          {/* Size presets */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowSizeMenu(!showSizeMenu); setShowDownloadMenu(false); }} title={t('thumbs.editor.canvasSizeTitle')} style={{ ...headerBtn, padding: '7px 12px', fontSize: 11 }}>
              {canvasW}x{canvasH} {chevronIcon}
            </button>
            {showSizeMenu && (
              <div style={{ ...dropdownPanel, minWidth: 200 }}>
                {SIZE_PRESETS.map((p) => (
                  <div key={p.label} role="menuitem" tabIndex={0} aria-label={`${p.label} ${p.w}×${p.h}`} onClick={() => {
                    if (canvasW === p.w && canvasH === p.h) { setShowSizeMenu(false); return; }
                    if (els.length > 0) { setResizeDialog({ w: p.w, h: p.h }); setShowSizeMenu(false); }
                    else { store().setCanvasSize(p.w, p.h); setShowSizeMenu(false); }
                  }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (canvasW === p.w && canvasH === p.h) { setShowSizeMenu(false); return; } if (els.length > 0) { setResizeDialog({ w: p.w, h: p.h }); setShowSizeMenu(false); } else { store().setCanvasSize(p.w, p.h); setShowSizeMenu(false); } } }}
                    style={{ ...menuItem, color: canvasW === p.w && canvasH === p.h ? C.accent : C.text, background: canvasW === p.w && canvasH === p.h ? C.accentDim : 'transparent' }}
                    onMouseEnter={(e) => { if (canvasW !== p.w || canvasH !== p.h) (e.currentTarget as HTMLElement).style.background = C.surface; }}
                    onMouseLeave={(e) => { if (canvasW !== p.w || canvasH !== p.h) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <span>{p.label}</span>
                    <span style={{ fontSize: 10, color: C.dim }}>{p.w}×{p.h}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Duplicate as new size */}
          <button onClick={() => { setShowDuplicateAs(!showDuplicateAs); setShowSizeMenu(false); setShowDownloadMenu(false); }} title="Duplicate design at a different size" style={{ ...headerBtn, padding: '7px 10px', fontSize: 11 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            Duplicate as...
          </button>
          {/* Export button */}
          <button onClick={() => { setShowExportModal(true); setShowSizeMenu(false); setShowDownloadMenu(false); }} title={t('thumbs.editor.downloadTitle')} style={{ ...headerBtn, padding: '7px 14px' }}>{downloadIcon} {t('thumbs.export.title')}</button>
          {/* YouTube Preview button */}
          <button onClick={() => { renderToCanvas(canvasW, canvasH).then((cvs) => { setYoutubePreviewUrl(cvs.toDataURL('image/png')); setShowYouTubePreview(true); }).catch(() => { const fallback = captureCanvas(); if (fallback) { setYoutubePreviewUrl(fallback); setShowYouTubePreview(true); } }); }} title="Preview on YouTube" style={{ ...headerBtn, padding: '7px 12px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Preview
          </button>
          {/* History panel toggle */}
          {historyCount > 0 && (
            <button onClick={() => setShowHistoryPanel(!showHistoryPanel)} title={t('thumbs.export.history')} style={{ ...headerBtn, padding: '7px 8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.7 }}>({historyCount})</span>
            </button>
          )}
          {/* Keyboard shortcuts help */}
          <button onClick={() => setShowShortcutsHelp(true)} title="Keyboard Shortcuts (?)" style={{ ...headerBtn, padding: '7px 8px', fontSize: 13, fontWeight: 700, minWidth: 30 }}>?</button>
          <div style={{ width: 1, height: 20, background: C.border, margin: '0 2px' }} />
          {/* AI reference + AI generate */}
          <button onClick={() => { const img = captureCanvas(); if (img) { store().setAiReferenceImage(img); store().setStep('ai'); } }} style={{ ...headerBtn, padding: '7px 12px' }}>{cameraIcon} {t('thumbs.editor.byPhoto')}</button>
          <button onClick={() => store().setStep('ai')} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg,${C.accent},${C.pink})`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${C.accent}33`, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .15s' }}>{sparkleIcon} {t('thumbs.editor.aiGeneration')}</button>
        </div>
      </div>
      <div className="tf-thumb-editor" style={{ gap: isMobile ? 8 : 12 }}>
        {/* On mobile: toolbar is horizontal at top */}
        <ToolBar onFileChange={onFileChange} isMobile={isMobile} />
        {!isMobile && <div className="tf-thumb-left"><LeftSidebar /></div>}
        <div className="tf-thumb-canvas-area" style={{ gap: 0 }}>
        {/* Quick Actions Toolbar */}
        {!isMobile && selIds.length > 0 && (
          <QuickActionsBar C={C} selIds={selIds} />
        )}
        <ErrorBoundary>
        <div ref={canvasWrapperRef} style={{ flex: 1, position: 'relative', minWidth: 0, overflow: 'hidden', borderRadius: isMobile ? 8 : 12, border: `1px solid ${C.border}`, background: C.bg, width: '100%', maxWidth: '100%' }}
          onMouseDown={onMiddleDown} onMouseMove={onMiddleMove} onMouseUp={onMiddleUp} onMouseLeave={onMiddleUp}>
          {/* D5: Removed redundant canvas size overlay — info is in top bar button */}
          <div style={{ transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`, transformOrigin: 'center center', transition: isPanning.current ? 'none' : smoothZoomRef.current ? 'transform .15s ease-out' : 'none' }}>
            <div ref={canvasAreaRef} data-canvas data-canvas-w={canvasW} data-canvas-h={canvasH} onMouseDown={onCanvasMouseDown} onMouseMove={onCanvasMouseMove} onMouseUp={onCanvasMouseUp} onMouseLeave={onCanvasMouseUp} onTouchStart={onCanvasTouchStart} onTouchMove={onCanvasTouchMove} onTouchEnd={onCanvasTouchEnd} onContextMenu={onCanvasContextMenu} onDragOver={onCanvasDragOver} onDrop={onCanvasDrop}
              style={{ width: '100%', aspectRatio: `${canvasW}/${canvasH}`, background: canvasBgImage ? canvasBg : canvasBgGradient ? (canvasBgGradient.type === 'linear' ? `linear-gradient(${canvasBgGradient.angle}deg, ${canvasBgGradient.from}, ${canvasBgGradient.to})` : `radial-gradient(circle, ${canvasBgGradient.from}, ${canvasBgGradient.to})`) : canvasBg, position: 'relative', overflow: 'hidden', cursor: tool === 'draw' || tool === 'line' || tool === 'arrow' ? 'crosshair' : tool === 'eraser' ? 'not-allowed' : isPanning.current ? 'grabbing' : 'default', userSelect: 'none', transition: 'background 0.3s ease' }}>
            {/* AI Background Image — rendered behind all elements */}
            {canvasBgImage && (
              <img src={canvasBgImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', zIndex: 0 }} />
            )}
            {els.map(renderElement)}
            {/* Collaboration cursors overlay */}
            <CollaborationCursors canvasW={canvasW} canvasH={canvasH} containerW={canvasAreaRef.current?.clientWidth ?? canvasW} containerH={canvasAreaRef.current?.clientHeight ?? canvasH} />
            {drawing && drawPts.length > 1 && (
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox={`0 0 ${canvasW} ${canvasH}`}>
                <path d={drawPts.map((p, i) => i === 0 ? ('M' + p.x + ' ' + p.y) : ('L' + p.x + ' ' + p.y)).join(' ')} fill="none" stroke={drawColor} strokeWidth={drawSize} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {linePreview && (
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox={`0 0 ${canvasW} ${canvasH}`}>
                <line x1={linePreview.x1} y1={linePreview.y1} x2={linePreview.x2} y2={linePreview.y2} stroke={C.accent} strokeWidth={2} strokeDasharray="6,3" opacity={0.7} />
                {tool === 'arrow' && (() => {
                  const ax = linePreview.x2, ay = linePreview.y2, angle = Math.atan2(ay - linePreview.y1, ax - linePreview.x1), hs = 12;
                  return <polygon points={`${ax},${ay} ${ax - hs * Math.cos(angle - Math.PI / 6)},${ay - hs * Math.sin(angle - Math.PI / 6)} ${ax - hs * Math.cos(angle + Math.PI / 6)},${ay - hs * Math.sin(angle + Math.PI / 6)}`} fill={C.accent} opacity={0.7} />;
                })()}
              </svg>
            )}
            {/* Smart alignment guides (purple) */}
            {guides.x.map((gx, i) => <div key={`gx-${i}`} style={{ position: 'absolute', left: gx / canvasW * 100 + '%', top: 0, bottom: 0, width: 1, background: '#6366f1', opacity: 0.85, pointerEvents: 'none', zIndex: Z_INDEX.GUIDES }} />)}
            {guides.y.map((gy, i) => <div key={`gy-${i}`} style={{ position: 'absolute', top: gy / canvasH * 100 + '%', left: 0, right: 0, height: 1, background: '#6366f1', opacity: 0.85, pointerEvents: 'none', zIndex: Z_INDEX.GUIDES }} />)}
            {/* Custom user-placed guides (magenta, draggable) */}
            {customGuides.map((cg) => (
              <CustomGuideLineView
                key={cg.id}
                guide={cg}
                canvasW={canvasW}
                canvasH={canvasH}
                zoom={zoom}
                C={C}
              />
            ))}
            {/* Smart spacing guides — equal distance indicators */}
            {spacingGuides.map((sg, i) => (
              <div key={`sg-${i}`} style={{ position: 'absolute', pointerEvents: 'none', zIndex: Z_INDEX.GUIDES, ...(sg.axis === 'h' ? { left: sg.x / canvasW * 100 + '%', top: sg.y / canvasH * 100 + '%', width: sg.length / canvasW * 100 + '%', height: 0, borderTop: '1px dashed #f59e0b', transform: 'translateY(-0.5px)' } : { left: sg.x / canvasW * 100 + '%', top: sg.y / canvasH * 100 + '%', height: sg.length / canvasH * 100 + '%', width: 0, borderLeft: '1px dashed #f59e0b', transform: 'translateX(-0.5px)' }) }}>
                <span style={{ position: 'absolute', ...(sg.axis === 'h' ? { top: -16, left: '50%', transform: 'translateX(-50%)' } : { left: 6, top: '50%', transform: 'translateY(-50%)' }), background: '#f59e0b', color: '#000', fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3, whiteSpace: 'nowrap', lineHeight: '14px', fontFamily: "'JetBrains Mono', monospace" }}>{sg.gap}px</span>
              </div>
            ))}
            {/* Snap-to-grid overlay */}
            {snapToGrid && (
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} viewBox={`0 0 ${canvasW} ${canvasH}`} preserveAspectRatio="none">
                <defs>
                  <pattern id="snapGrid20" width={20} height={20} patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width={canvasW} height={canvasH} fill="url(#snapGrid20)" />
              </svg>
            )}
            {/* Selection rectangle */}
            {selRect && (() => {
              const rx = Math.min(selRect.x, selRect.x2);
              const ry = Math.min(selRect.y, selRect.y2);
              const rw = Math.abs(selRect.x2 - selRect.x);
              const rh = Math.abs(selRect.y2 - selRect.y);
              return <div style={{ position: 'absolute', left: rx / canvasW * 100 + '%', top: ry / canvasH * 100 + '%', width: rw / canvasW * 100 + '%', height: rh / canvasH * 100 + '%', border: `1.5px dashed ${C.accent}`, background: C.accent + '10', pointerEvents: 'none', zIndex: Z_INDEX.GUIDES }} />;
            })()}
          </div>
          </div>
          {/* Floating zoom controls */}
          <div title={t('thumbs.editor.zoomHint')} style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 2, background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '4px 6px', zIndex: Z_INDEX.ZOOM_CONTROLS, boxShadow: '0 2px 12px rgba(0,0,0,.15)' }}>
            <button onClick={() => { smoothZoomRef.current = true; store().zoomOut(); }} title={`${t('thumbs.editor.zoomOut')} (Ctrl+-)`} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: C.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.color = C.text; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.sub; }}
            >{zoomOutIcon}</button>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.sub, minWidth: 44, textAlign: 'center', userSelect: 'none' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => { smoothZoomRef.current = true; store().zoomIn(); }} title={`${t('thumbs.editor.zoomIn')} (Ctrl++)`} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: C.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.color = C.text; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.sub; }}
            >{zoomInIcon}</button>
            <div style={{ width: 1, height: 16, background: C.border, margin: '0 2px' }} />
            <button onClick={() => { smoothZoomRef.current = true; store().fitToScreen(); }} title={`${t('thumbs.editor.fitToScreen')} (Ctrl+0)`} style={{ padding: '4px 8px', height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: C.sub, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, transition: 'all .12s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.color = C.text; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.sub; }}
            >{fitIcon} {t('thumbs.editor.fitLabel')}</button>
            {selIds.length > 0 && (
              <>
                <div style={{ width: 1, height: 16, background: C.border, margin: '0 2px' }} />
                <button onClick={() => { smoothZoomRef.current = true; store().zoomToSelection(); }} title="Zoom to Selection (Ctrl+1)" style={{ padding: '4px 8px', height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: C.sub, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, transition: 'all .12s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.color = C.text; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.sub; }}
                ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="1" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="1" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="23" y2="12"/></svg> Sel</button>
              </>
            )}
          </div>
        </div>
        </ErrorBoundary>
        </div>
        {/* D8: Context menu */}
        {contextMenu && (
          <ContextMenuOverlay
            contextMenu={contextMenu}
            els={els}
            C={C}
            t={t}
          />
        )}
        {/* Measurement tooltip during drag/resize */}
        {measureTooltip && (
          <div style={{
            position: 'fixed',
            left: measureTooltip.mx + 16,
            top: measureTooltip.my + 16,
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            pointerEvents: 'none',
            zIndex: 9999,
            whiteSpace: 'nowrap',
            lineHeight: 1.5,
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <div>{measureTooltip.ex}, {measureTooltip.ey}</div>
            <div style={{ color: 'rgba(255,255,255,0.65)' }}>{measureTooltip.ew} x {measureTooltip.eh}</div>
          </div>
        )}
        {/* Element info overlay on hover */}
        {hoverInfo && !drag && !resize && (
          <div style={{
            position: 'fixed',
            left: hoverInfo.mx + 14,
            top: hoverInfo.my - 50,
            background: 'rgba(0,0,0,0.78)',
            color: '#fff',
            padding: '5px 8px',
            borderRadius: 6,
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            pointerEvents: 'none',
            zIndex: 9998,
            whiteSpace: 'nowrap',
            lineHeight: 1.5,
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(6px)',
          }}>
            <div style={{ fontWeight: 600, color: '#a5b4fc', fontSize: 10 }}>{hoverInfo.type.charAt(0).toUpperCase() + hoverInfo.type.slice(1)}: {hoverInfo.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.55)' }}>{hoverInfo.w} x {hoverInfo.h} &middot; ({hoverInfo.x}, {hoverInfo.y})</div>
          </div>
        )}
        {/* ===== Export Modal ===== */}
        {showExportModal && (
          <div onClick={() => setShowExportModal(false)} style={{ position: 'fixed', inset: 0, zIndex: Z_INDEX.MODAL_BACKDROP, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, minWidth: isMobile ? '90vw' : 420, maxWidth: isMobile ? '95vw' : 480, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 16px 64px rgba(0,0,0,.4)', color: C.text }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{t('thumbs.export.title')}</h3>
                <button onClick={() => setShowExportModal(false)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontFamily: 'inherit' }}>&times;</button>
              </div>

              {/* Format selector */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>{t('thumbs.export.format')}</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {EXPORT_FORMATS.map((fmt) => (
                    <button key={fmt.id} onClick={() => setExportFormat(fmt.id)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${exportFormat === fmt.id ? C.accent : C.border}`, background: exportFormat === fmt.id ? C.accentDim : 'transparent', color: exportFormat === fmt.id ? C.accent : C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                      <div>{fmt.label}</div>
                      <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>
                        {fmt.id === 'png' ? t('thumbs.export.pngDesc') : fmt.id === 'jpg' ? t('thumbs.export.jpgDesc') : t('thumbs.export.webpDesc')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size selector */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>{t('thumbs.export.size')}</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {([
                    { id: 'original' as const, label: `${t('thumbs.export.original')} (${canvasW}x${canvasH})` },
                    { id: '2x' as const, label: `${t('thumbs.export.retina')} (${canvasW * 2}x${canvasH * 2})` },
                    { id: 'custom' as const, label: t('thumbs.export.custom') },
                  ]).map((opt) => (
                    <button key={opt.id} onClick={() => setExportSizeMode(opt.id)} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: `1px solid ${exportSizeMode === opt.id ? C.accent : C.border}`, background: exportSizeMode === opt.id ? C.accentDim : 'transparent', color: exportSizeMode === opt.id ? C.accent : C.text, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {exportSizeMode === 'custom' && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ fontSize: 11, color: C.sub }}>{t('thumbs.export.width')}</label>
                    <input type="number" value={exportCustomW} onChange={(e) => setExportCustomW(Math.max(1, Number(e.target.value)))} style={{ width: 80, padding: '4px 8px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
                    <span style={{ color: C.dim, fontSize: 12 }}>x</span>
                    <label style={{ fontSize: 11, color: C.sub }}>{t('thumbs.export.height')}</label>
                    <input type="number" value={exportCustomH} onChange={(e) => setExportCustomH(Math.max(1, Number(e.target.value)))} style={{ width: 80, padding: '4px 8px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                )}
              </div>

              {/* Quality slider (JPG/WebP only) */}
              {exportFormat !== 'png' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>{t('thumbs.export.quality')} — {exportQuality}%</label>
                  <input type="range" min={10} max={100} value={exportQuality} onChange={(e) => setExportQuality(Number(e.target.value))} style={{ width: '100%', accentColor: C.accent, height: 4, cursor: 'pointer' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.dim, marginTop: 2 }}><span>10%</span><span>100%</span></div>
                </div>
              )}

              {/* Quick Presets */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>{t('thumbs.export.presets')}</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {EXPORT_PRESETS.map((p) => (
                    <button key={p.id} onClick={() => applyExportPreset(p)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                      {p.label}
                      <span style={{ fontSize: 9, color: C.dim, marginLeft: 4 }}>{p.w}x{p.h}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {/* Copy to clipboard */}
                <button onClick={copyToClipboard} disabled={isCopying} style={{ flex: 1, minWidth: 100, padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: copyStatus === 'success' ? C.green + '22' : copyStatus === 'error' ? C.accent + '22' : C.surface, color: copyStatus === 'success' ? C.green : copyStatus === 'error' ? C.accent : C.text, fontSize: 12, fontWeight: 600, cursor: isCopying ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s', opacity: isCopying ? 0.6 : 1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  {copyStatus === 'success' ? t('thumbs.export.copied') : copyStatus === 'error' ? t('thumbs.export.copyFailed') : t('thumbs.export.copy')}
                </button>
                {/* Save to library */}
                <button onClick={saveToLibrary} disabled={isSavingToLibrary} style={{ flex: 1, minWidth: 100, padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: saveStatus === 'success' ? C.green + '22' : saveStatus === 'error' ? C.accent + '22' : C.surface, color: saveStatus === 'success' ? C.green : saveStatus === 'error' ? C.accent : C.text, fontSize: 12, fontWeight: 600, cursor: isSavingToLibrary ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s', opacity: isSavingToLibrary ? 0.6 : 1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  {saveStatus === 'success' ? t('thumbs.export.saved') : saveStatus === 'error' ? t('thumbs.export.saveFailed') : isSavingToLibrary ? t('thumbs.export.saving') : t('thumbs.export.save')}
                </button>
                {/* Download */}
                <button onClick={() => { downloadCanvas(); setShowExportModal(false); }} disabled={isDownloading} style={{ flex: 1, minWidth: 100, padding: '10px 14px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.accent},${C.pink})`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: isDownloading ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s', boxShadow: `0 4px 16px ${C.accent}33`, opacity: isDownloading ? 0.6 : 1 }}>
                  {downloadIcon}
                  {isDownloading ? t('thumbs.export.downloading') : t('thumbs.export.download')}
                </button>
              </div>

              {/* Use as project thumbnail */}
              {projectId && (
                <button onClick={handleSetProjectThumbnail} disabled={setProjectThumbnail.isPending} style={{ width: '100%', marginTop: 10, padding: '8px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: thumbnailStatus === 'success' ? C.green + '22' : thumbnailStatus === 'error' ? C.accent + '22' : 'transparent', color: thumbnailStatus === 'success' ? C.green : thumbnailStatus === 'error' ? C.accent : C.sub, fontSize: 11, fontWeight: 600, cursor: setProjectThumbnail.isPending ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  {thumbnailStatus === 'success' ? t('thumbs.export.thumbnailSet') : thumbnailStatus === 'error' ? t('thumbs.export.thumbnailFailed') : t('thumbs.export.setThumbnail')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===== History Panel ===== */}
        {showHistoryPanel && (
          <div onClick={() => setShowHistoryPanel(false)} style={{ position: 'fixed', inset: 0, zIndex: Z_INDEX.MODAL_BACKDROP, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, minWidth: isMobile ? '90vw' : 360, maxWidth: isMobile ? '95vw' : 440, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 16px 64px rgba(0,0,0,.4)', color: C.text }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{t('thumbs.export.history')}</h3>
                <button onClick={() => setShowHistoryPanel(false)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontFamily: 'inherit' }}>&times;</button>
              </div>
              <HistorySnapshots
                C={C}
                t={t}
                canvasW={canvasW}
                canvasH={canvasH}
                onRestore={(snap: CanvasSnapshot) => { store().restoreSnapshot(snap); setShowHistoryPanel(false); }}
              />
            </div>
          </div>
        )}

        {/* ===== Keyboard Shortcuts Help Modal ===== */}
        {showShortcutsHelp && (
          <EditorShortcutsHelpModal C={C} onClose={() => setShowShortcutsHelp(false)} />
        )}

        {/* ===== YouTube Preview Overlay ===== */}
        {showYouTubePreview && youtubePreviewUrl && (
          <YouTubePreviewOverlay thumbnailDataUrl={youtubePreviewUrl} onClose={() => { setShowYouTubePreview(false); setYoutubePreviewUrl(null); }} />
        )}

        {/* On mobile: collapsible properties drawer */}
        {isMobile ? (
          <>
            {sel && (
              <button
                onClick={() => setMobilePropsOpen(!mobilePropsOpen)}
                style={{
                  position: 'fixed',
                  bottom: mobilePropsOpen ? 'auto' : 16,
                  right: 16,
                  top: mobilePropsOpen ? 'auto' : 'auto',
                  zIndex: Z_INDEX.TOOLBAR_POPOVER,
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  color: C.accent,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(0,0,0,.25)',
                  fontFamily: 'inherit',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              </button>
            )}
            {mobilePropsOpen && (
              <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: Z_INDEX.MODAL_BACKDROP,
                background: 'rgba(0,0,0,.4)',
              }} onClick={() => setMobilePropsOpen(false)}>
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderBottom: 'none',
                    padding: 14,
                    WebkitOverflowScrolling: 'touch' as const,
                  }}
                >
                  <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border, margin: '0 auto 12px' }} />
                  <PropertiesPanel sel={sel ?? null} />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="tf-thumb-right"><PropertiesPanel sel={sel ?? null} /></div>
        )}
        {/* Mobile left sidebar as bottom sheet */}
        {isMobile && <LeftSidebar isMobile={isMobile} />}
      </div>
      {/* Smart Resize Canvas Dialog */}
      {resizeDialog && (
        <div onClick={() => setResizeDialog(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: Z_INDEX.MODAL_BACKDROP, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, minWidth: 340, maxWidth: 420, boxShadow: '0 12px 40px rgba(0,0,0,.4)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: C.text }}>Resize Canvas</h3>
            <p style={{ fontSize: 12, color: C.sub, marginBottom: 16 }}>
              {canvasW}x{canvasH} &rarr; {resizeDialog.w}x{resizeDialog.h}
            </p>
            <p style={{ fontSize: 11, color: C.dim, marginBottom: 16 }}>
              Your design has {els.length} element{els.length !== 1 ? 's' : ''}. How should they be handled?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => { store().setCanvasSizeWithScale(resizeDialog.w, resizeDialog.h, true); setResizeDialog(null); toast.success('Canvas resized — elements scaled'); }} style={{ width: '100%', padding: '10px 16px', borderRadius: 8, border: `1px solid ${C.blue}44`, background: C.blue + '14', color: C.blue, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Scale all elements</div>
                <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 400 }}>Proportionally resize and reposition everything</div>
              </button>
              <button onClick={() => { store().setCanvasSizeWithScale(resizeDialog.w, resizeDialog.h, false); setResizeDialog(null); toast.info('Canvas resized — elements unchanged'); }} style={{ width: '100%', padding: '10px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Keep positions</div>
                <div style={{ fontSize: 10, color: C.dim, fontWeight: 400 }}>Just change the canvas, elements stay where they are</div>
              </button>
              <button onClick={() => setResizeDialog(null)} style={{ width: '100%', padding: '8px 16px', borderRadius: 8, border: 'none', background: 'transparent', color: C.dim, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Duplicate as New Size Dialog */}
      {showDuplicateAs && (
        <div onClick={() => setShowDuplicateAs(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: Z_INDEX.MODAL_BACKDROP, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, minWidth: 340, maxWidth: 420, boxShadow: '0 12px 40px rgba(0,0,0,.4)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: C.text }}>Duplicate as New Size</h3>
            <p style={{ fontSize: 12, color: C.sub, marginBottom: 16 }}>
              Create a copy of this design at a different size. All elements will be scaled proportionally.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SIZE_PRESETS.filter((p) => !(p.w === canvasW && p.h === canvasH)).map((p) => (
                <button key={p.label} onClick={() => {
                  const sx = p.w / canvasW;
                  const sy = p.h / canvasH;
                  const scaledEls = els.map((el) => ({
                    ...el,
                    x: Math.round(el.x * sx),
                    y: Math.round(el.y * sy),
                    w: Math.round(el.w * sx),
                    h: Math.round(el.h * sy),
                    ...(el.size ? { size: Math.round(el.size * Math.min(sx, sy)) } : {}),
                  }));
                  store().pushHistory();
                  store().loadFromProject({
                    els: scaledEls,
                    canvasBg: canvasBg,
                    canvasBgImage: store().canvasBgImage,
                    canvasBgGradient: canvasBgGradient,
                    canvasW: p.w,
                    canvasH: p.h,
                  });
                  setShowDuplicateAs(false);
                  toast.success(`Duplicated as ${p.label} (${p.w}x${p.h})`);
                }} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background .1s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  <span>{p.label}</span>
                  <span style={{ fontSize: 10, color: C.dim }}>{p.w}x{p.h}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowDuplicateAs(false)} style={{ width: '100%', padding: '8px 16px', borderRadius: 8, border: 'none', background: 'transparent', color: C.dim, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getSizePresets(t: (key: string) => string) {
  return [
    { label: t('thumbs.editor.sizeYoutube'), w: 1280, h: 720 },
    { label: 'YouTube Shorts', w: 1080, h: 1920 },
    { label: t('thumbs.editor.sizeInstagramPost'), w: 1080, h: 1080 },
    { label: t('thumbs.editor.sizeInstagramStory'), w: 1080, h: 1920 },
    { label: 'Twitter Post', w: 1200, h: 675 },
    { label: t('thumbs.editor.sizeTwitterBanner'), w: 1500, h: 500 },
    { label: t('thumbs.editor.sizeFacebookCover'), w: 820, h: 312 },
    { label: 'HD 1920x1080', w: 1920, h: 1080 },
  ];
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1, dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** Find the topmost element at canvas point (x, y). Iterates back-to-front. */
function hitTestElement(els: CanvasElement[], x: number, y: number): CanvasElement | null {
  for (let i = els.length - 1; i >= 0; i--) {
    const el = els[i];
    if (el.visible === false || el.locked) continue;
    if ((el.type === 'line' || el.type === 'arrow') && distToSegment(x, y, el.x, el.y, el.x2 ?? el.x, el.y2 ?? el.y) < 10) return el;
    if (el.type !== 'line' && el.type !== 'arrow' && x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + el.h) return el;
  }
  return null;
}

/** Quick Actions Toolbar — shown when elements are selected */
function QuickActionsBar({ C, selIds }: { C: ReturnType<typeof useThemeStore.getState>['theme']; selIds: string[] }) {
  const store = useThumbnailStore.getState;
  const hasGroup = selIds.length > 1;
  const [batchColor, setBatchColor] = useState('#ffffff');
  const [batchOpacity, setBatchOpacity] = useState(100);
  const btnStyle: React.CSSProperties = { height: 30, padding: '0 8px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'all .12s', whiteSpace: 'nowrap' };
  const sepStyle: React.CSSProperties = { width: 1, height: 20, background: C.border, margin: '0 2px', flexShrink: 0 };
  const hover = (e: React.MouseEvent, on: boolean) => {
    (e.currentTarget as HTMLElement).style.background = on ? C.surface : 'transparent';
    (e.currentTarget as HTMLElement).style.color = on ? C.text : C.sub;
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 6, flexWrap: 'wrap' }}>
      {/* Duplicate */}
      <button onClick={() => store().duplicateSelected()} title="Duplicate (Ctrl+D)" style={btnStyle} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        Duplicate
      </button>
      {/* Delete */}
      <button onClick={() => store().delSelected()} title="Delete" style={{ ...btnStyle, color: C.accent + 'aa' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.accent + '0a'; (e.currentTarget as HTMLElement).style.color = C.accent; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.accent + 'aa'; }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        Delete
      </button>
      <div style={sepStyle} />
      {/* Layer ordering */}
      {selIds.length === 1 && (
        <>
          <button onClick={() => store().moveUp(selIds[0])} title="Move Up (Ctrl+])" style={btnStyle} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button onClick={() => store().moveDown(selIds[0])} title="Move Down (Ctrl+[)" style={btnStyle} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button onClick={() => store().bringFront(selIds[0])} title="Move to Top" style={btnStyle} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>
          </button>
          <button onClick={() => store().sendBack(selIds[0])} title="Move to Bottom" style={btnStyle} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/></svg>
          </button>
          <div style={sepStyle} />
        </>
      )}
      {/* Batch operations — shown when multiple elements selected */}
      {hasGroup && (
        <>
          {/* Batch color */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 9, color: C.dim, fontWeight: 600 }}>Color</label>
            <input type="color" value={batchColor} onChange={(e) => { setBatchColor(e.target.value); store().batchUpdateSelected({ color: e.target.value }); }} title="Batch color change" style={{ width: 24, height: 24, border: `1px solid ${C.border}`, borderRadius: 4, padding: 0, cursor: 'pointer', background: 'transparent' }} />
          </div>
          {/* Batch opacity */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 9, color: C.dim, fontWeight: 600 }}>Opacity</label>
            <input type="range" min={0} max={100} value={batchOpacity} onChange={(e) => { const v = Number(e.target.value); setBatchOpacity(v); store().batchUpdateSelected({ opacity: v / 100 }); }} title="Batch opacity" style={{ width: 60, height: 4, accentColor: C.accent, cursor: 'pointer' }} />
            <span style={{ fontSize: 9, color: C.dim, minWidth: 24 }}>{batchOpacity}%</span>
          </div>
          {/* Batch resize */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <label style={{ fontSize: 9, color: C.dim, fontWeight: 600, marginRight: 2 }}>Scale</label>
            {[50, 100, 150, 200].map((pct) => (
              <button key={pct} onClick={() => store().batchResizeSelected(pct)} title={`Scale to ${pct}%`} style={{ ...btnStyle, padding: '0 5px', fontSize: 9 }} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
                {pct}%
              </button>
            ))}
          </div>
          <div style={sepStyle} />
        </>
      )}
      {/* Group / Ungroup */}
      {hasGroup && (
        <>
          <button onClick={() => store().groupSelected()} title="Group (Ctrl+G)" style={btnStyle} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/><path d="M10 6h4m-4 12h4M6 10v4m12-4v4"/></svg>
            Group
          </button>
          <button onClick={() => store().ungroupSelected()} title="Ungroup" style={btnStyle} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
            Ungroup
          </button>
          <div style={sepStyle} />
        </>
      )}
      {/* Align */}
      <button onClick={() => store().alignSelected('left')} title="Align Left" style={{ ...btnStyle, padding: '0 5px' }} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="3" x2="3" y2="21"/><rect x="7" y="6" width="14" height="4" rx="1"/><rect x="7" y="14" width="10" height="4" rx="1"/></svg>
      </button>
      <button onClick={() => store().alignSelected('centerX')} title="Align Center H" style={{ ...btnStyle, padding: '0 5px' }} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="3" x2="12" y2="21"/><rect x="5" y="6" width="14" height="4" rx="1"/><rect x="7" y="14" width="10" height="4" rx="1"/></svg>
      </button>
      <button onClick={() => store().alignSelected('right')} title="Align Right" style={{ ...btnStyle, padding: '0 5px' }} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="21" y1="3" x2="21" y2="21"/><rect x="3" y="6" width="14" height="4" rx="1"/><rect x="7" y="14" width="10" height="4" rx="1"/></svg>
      </button>
      <button onClick={() => store().alignSelected('top')} title="Align Top" style={{ ...btnStyle, padding: '0 5px' }} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="3" x2="21" y2="3"/><rect x="6" y="7" width="4" height="14" rx="1"/><rect x="14" y="7" width="4" height="10" rx="1"/></svg>
      </button>
      <button onClick={() => store().alignSelected('centerY')} title="Align Center V" style={{ ...btnStyle, padding: '0 5px' }} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="7" width="4" height="10" rx="1"/></svg>
      </button>
      <button onClick={() => store().alignSelected('bottom')} title="Align Bottom" style={{ ...btnStyle, padding: '0 5px' }} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="21" x2="21" y2="21"/><rect x="6" y="3" width="4" height="14" rx="1"/><rect x="14" y="7" width="4" height="10" rx="1"/></svg>
      </button>
      {hasGroup && (
        <>
          <div style={sepStyle} />
          <button onClick={() => store().distributeSelected('horizontal')} title="Distribute Horizontal" style={btnStyle} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="3" x2="3" y2="21"/><line x1="21" y1="3" x2="21" y2="21"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>
            H
          </button>
          <button onClick={() => store().distributeSelected('vertical')} title="Distribute Vertical" style={btnStyle} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="3" x2="21" y2="3"/><line x1="3" y1="21" x2="21" y2="21"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>
            V
          </button>
        </>
      )}
      {/* AI Auto Arrange */}
      <div style={sepStyle} />
      <AutoArrangeButton C={C} btnStyle={btnStyle} hover={hover} />
    </div>
  );
}

/** AI Auto Arrange Button — sends elements to GPT for optimized layout */
function AutoArrangeButton({ C, btnStyle, hover }: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  btnStyle: React.CSSProperties;
  hover: (e: React.MouseEvent, on: boolean) => void;
}) {
  const [isArranging, setIsArranging] = useState(false);

  const autoLayoutMutation = trpc.ai.autoLayout.useMutation({
    onSuccess: (data) => {
      if (data.positions.length > 0) {
        const s = useThumbnailStore.getState();
        s.pushHistory();
        data.positions.forEach((pos) => {
          const el = s.els.find((e) => e.id === pos.id);
          if (el) {
            s.updEl(pos.id, { x: pos.x, y: pos.y, w: pos.w, h: pos.h });
          }
        });
        toast.success('Layout optimized');
      } else {
        toast.info('No layout suggestions');
      }
      setIsArranging(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Auto layout failed');
      setIsArranging(false);
    },
  });

  const handleAutoArrange = () => {
    const s = useThumbnailStore.getState();
    const { els, canvasW, canvasH } = s;
    if (els.length === 0) {
      toast.info('Add some elements first');
      return;
    }
    setIsArranging(true);
    autoLayoutMutation.mutate({
      elements: els.map((el) => ({
        id: el.id,
        type: el.type,
        x: el.x,
        y: el.y,
        w: el.w,
        h: el.h,
        text: el.text,
      })),
      canvasW,
      canvasH,
    });
  };

  return (
    <button
      onClick={handleAutoArrange}
      disabled={isArranging}
      title="AI Auto Arrange"
      style={{
        ...btnStyle,
        border: `1px solid ${C.accent}33`,
        color: C.accent,
        opacity: isArranging ? 0.6 : 1,
        cursor: isArranging ? 'wait' : 'pointer',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.accent + '0a'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {isArranging ? (
        <svg width="13" height="13" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round" /></svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      )}
      Auto Arrange
    </button>
  );
}

/** YouTube Preview Overlay — shows thumbnail in YouTube search/suggested mockup */
function YouTubePreviewOverlay({ thumbnailDataUrl, onClose }: { thumbnailDataUrl: string; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, width: '90%', cursor: 'default' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>YouTube Preview</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontFamily: 'inherit' }}>&times;</button>
        </div>

        {/* YouTube search result mockup */}
        <div style={{ marginBottom: 12, padding: 4, background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingLeft: 12 }}>Search Result</div>
          <div style={{ display: 'flex', gap: 12, padding: 12, background: '#0f0f0f', borderRadius: 12 }}>
            <img src={thumbnailDataUrl} alt="Thumbnail preview" style={{ width: 360, height: 202, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>Your Video Title Here</div>
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>Your Channel &bull; 1.2K views &bull; 2 hours ago</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 12, background: '#333' }} />
                <span style={{ fontSize: 11, color: '#888' }}>Your Channel</span>
              </div>
              <div style={{ fontSize: 12, color: '#777', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>This is a sample video description that would appear in YouTube search results. Your thumbnail is shown at the left.</div>
            </div>
          </div>
        </div>

        {/* YouTube suggested video sidebar mockup */}
        <div style={{ marginBottom: 12, padding: 4, background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingLeft: 12 }}>Suggested Video (Sidebar)</div>
          <div style={{ display: 'flex', gap: 8, padding: 12, background: '#0f0f0f', borderRadius: 12 }}>
            <img src={thumbnailDataUrl} alt="Thumbnail preview" style={{ width: 168, height: 94, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#fff', lineHeight: 1.3, marginBottom: 4 }}>Your Video Title</div>
              <div style={{ fontSize: 11, color: '#aaa' }}>Channel &bull; 500 views</div>
            </div>
          </div>
        </div>

        {/* YouTube home feed card mockup */}
        <div style={{ padding: 4, background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingLeft: 12 }}>Home Feed Card</div>
          <div style={{ maxWidth: 360, padding: 12, background: '#0f0f0f', borderRadius: 12 }}>
            <img src={thumbnailDataUrl} alt="Thumbnail preview" style={{ width: '100%', aspectRatio: '16/9', borderRadius: 8, objectFit: 'cover', marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: '#333', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#fff', lineHeight: 1.3, marginBottom: 4 }}>Your Video Title Here</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>Your Channel</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>1.2K views &bull; 2 hours ago</div>
              </div>
            </div>
          </div>
        </div>

        <button onClick={onClose} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, background: '#333', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'background .15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#444'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#333'; }}
        >Close Preview</button>
      </div>
    </div>
  );
}

/** Custom guide line — draggable magenta guide rendered on the canvas */
function CustomGuideLineView({ guide, canvasW, canvasH, zoom, C }: {
  guide: { id: string; type: 'h' | 'v'; position: number };
  canvasW: number;
  canvasH: number;
  zoom: number;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
}) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ clientVal: 0, pos: 0 });
  const guideRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragging(true);
    startRef.current = {
      clientVal: guide.type === 'h' ? e.clientY : e.clientX,
      pos: guide.position,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [guide.type, guide.position]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const delta = guide.type === 'h'
      ? (e.clientY - startRef.current.clientVal) / zoom
      : (e.clientX - startRef.current.clientVal) / zoom;
    const newPos = Math.round(startRef.current.pos + delta);
    const max = guide.type === 'h' ? canvasH : canvasW;
    const clamped = Math.max(0, Math.min(max, newPos));
    useThumbnailStore.getState().moveCustomGuide(guide.id, clamped);
  }, [dragging, guide.type, guide.id, zoom, canvasW, canvasH]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    setDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    useThumbnailStore.getState().removeCustomGuide(guide.id);
  }, [guide.id]);

  const isH = guide.type === 'h';

  return (
    <div
      ref={guideRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
      title={`${isH ? 'H' : 'V'} Guide @ ${guide.position}px — drag to move, double-click to remove`}
      style={{
        position: 'absolute',
        zIndex: Z_INDEX.GUIDES + 1,
        ...(isH
          ? {
              top: (guide.position / canvasH) * 100 + '%',
              left: 0,
              right: 0,
              height: 0,
              borderTop: `1.5px ${dragging ? 'solid' : 'dashed'} #e040fb`,
              cursor: 'ns-resize',
              padding: '3px 0',
              transform: 'translateY(-3.5px)',
            }
          : {
              left: (guide.position / canvasW) * 100 + '%',
              top: 0,
              bottom: 0,
              width: 0,
              borderLeft: `1.5px ${dragging ? 'solid' : 'dashed'} #e040fb`,
              cursor: 'ew-resize',
              padding: '0 3px',
              transform: 'translateX(-3.5px)',
            }),
        pointerEvents: 'auto',
      }}
    >
      {/* Position label */}
      <span style={{
        position: 'absolute',
        ...(isH
          ? { left: 4, top: -14 }
          : { top: 4, left: 4 }),
        background: '#e040fb',
        color: '#000',
        fontSize: 9,
        fontWeight: 700,
        padding: '1px 4px',
        borderRadius: 3,
        whiteSpace: 'nowrap',
        lineHeight: '14px',
        fontFamily: "'JetBrains Mono', monospace",
        pointerEvents: 'none',
        opacity: dragging ? 1 : 0.7,
      }}>
        {guide.position}px
      </span>
    </div>
  );
}

/** History Snapshots -- renders mini-thumbnails of recent history states */
function HistorySnapshots({ C, t, canvasW, canvasH, onRestore }: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  t: (key: string) => string;
  canvasW: number;
  canvasH: number;
  onRestore: (snapshot: CanvasSnapshot) => void;
}) {
  const snapshots = useThumbnailStore.getState().getRecentSnapshots(5);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    snapshots.forEach((snap, idx) => {
      const cvs = canvasRefs.current[idx];
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      if (!ctx) return;
      const thumbW = 120;
      const thumbH = Math.round(thumbW * (canvasH / canvasW));
      cvs.width = thumbW;
      cvs.height = thumbH;
      const sx = thumbW / canvasW;
      const sy = thumbH / canvasH;
      ctx.scale(sx, sy);
      ctx.fillStyle = snap.canvasBg;
      ctx.fillRect(0, 0, canvasW, canvasH);
      for (const el of snap.els) {
        if (el.visible === false) continue;
        ctx.globalAlpha = el.opacity ?? 1;
        if (el.type === 'rect') {
          ctx.fillStyle = el.color ?? '#fff'; ctx.fillRect(el.x, el.y, el.w, el.h);
        } else if (el.type === 'circle') {
          ctx.fillStyle = el.color ?? '#fff'; ctx.beginPath(); ctx.ellipse(el.x + el.w / 2, el.y + el.h / 2, el.w / 2, el.h / 2, 0, 0, Math.PI * 2); ctx.fill();
        } else if (el.type === 'text') {
          ctx.fillStyle = el.color ?? '#fff'; ctx.font = (el.fontWeight ?? (el.bold ? 700 : 400)) + ' ' + (el.size ?? 32) + 'px ' + (el.font ?? 'sans-serif');
          const stx = el.textAlign === 'center' ? el.x + el.w / 2 : el.textAlign === 'right' ? el.x + el.w - 8 : el.x + 8;
          ctx.textAlign = el.textAlign ?? 'left';
          ctx.fillText(el.text ?? '', stx, el.y + (el.size ?? 32)); ctx.textAlign = 'left';
        } else if (el.type === 'path') {
          ctx.strokeStyle = el.color ?? '#fff'; ctx.lineWidth = el.strokeW ?? 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(new Path2D(el.path ?? ''));
        }
        ctx.globalAlpha = 1;
      }
    });
  }, [snapshots, canvasW, canvasH]);

  if (snapshots.length === 0) {
    return <div style={{ padding: 16, textAlign: 'center', color: C.dim, fontSize: 12 }}>{t('thumbs.export.historyEmpty')}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {snapshots.map((snap, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 8, border: `1px solid ${C.border}`, cursor: 'pointer', transition: 'all .12s' }}
          onClick={() => onRestore(snap)}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.borderColor = C.accent; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
          <canvas
            ref={(el) => { canvasRefs.current[idx] = el; }}
            style={{ borderRadius: 4, flexShrink: 0, width: 120, height: Math.round(120 * (canvasH / canvasW)) }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>Version {snapshots.length - idx}</div>
            <div style={{ fontSize: 10, color: C.dim }}>{snap.els.length} {snap.els.length === 1 ? 'element' : 'elements'}</div>
            <div style={{ fontSize: 9, color: C.accent, marginTop: 4 }}>{t('thumbs.export.restoreVersion')}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== Keyboard Shortcuts Help Modal (Editor-specific) =====
const EDITOR_SHORTCUTS = [
  { category: 'General', items: [
    { keys: 'Ctrl+Z', action: 'Undo' },
    { keys: 'Ctrl+Shift+Z', action: 'Redo' },
    { keys: 'Ctrl+S', action: 'Save' },
    { keys: 'Ctrl+A', action: 'Select all' },
    { keys: 'Delete', action: 'Delete selected' },
    { keys: 'Escape', action: 'Deselect' },
    { keys: '?', action: 'Show shortcuts' },
  ]},
  { category: 'Elements', items: [
    { keys: 'Ctrl+D', action: 'Duplicate' },
    { keys: 'Ctrl+G', action: 'Group' },
    { keys: 'Ctrl+Shift+G', action: 'Ungroup' },
    { keys: 'Ctrl+C', action: 'Copy' },
    { keys: 'Ctrl+V', action: 'Paste' },
    { keys: 'Ctrl+X', action: 'Cut' },
  ]},
  { category: 'View', items: [
    { keys: 'Ctrl++', action: 'Zoom in' },
    { keys: 'Ctrl+-', action: 'Zoom out' },
    { keys: 'Ctrl+0', action: 'Fit to screen' },
    { keys: '+/-', action: 'Zoom in/out' },
  ]},
  { category: 'Layers', items: [
    { keys: 'Ctrl+]', action: 'Bring forward' },
    { keys: 'Ctrl+[', action: 'Send backward' },
    { keys: 'Arrow keys', action: 'Nudge 1px' },
    { keys: 'Shift+Arrow', action: 'Nudge 10px' },
  ]},
];

function EditorShortcutsHelpModal({ C, onClose }: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Editor keyboard shortcuts"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 0,
          width: 'calc(100vw - 40px)',
          maxWidth: 600,
          maxHeight: '85vh',
          boxShadow: '0 24px 64px rgba(0,0,0,.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h8" />
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: 'transparent', color: C.sub,
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontFamily: 'inherit',
            }}
          >&times;</button>
        </div>

        {/* Content -- 2-column layout */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 20,
          }}>
            {EDITOR_SHORTCUTS.map((group) => (
              <div key={group.category}>
                <div style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.08em', color: C.accent,
                  marginBottom: 8, paddingBottom: 6,
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  {group.category}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {group.items.map((sc) => (
                    <div
                      key={sc.keys}
                      style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 4px', borderRadius: 6,
                      }}
                    >
                      <span style={{ fontSize: 12, color: C.text, fontWeight: 450 }}>{sc.action}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        {sc.keys.split('+').map((k, i) => (
                          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            {i > 0 && <span style={{ fontSize: 10, color: C.dim, fontWeight: 600 }}>+</span>}
                            <kbd style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              minWidth: 24, height: 22, padding: '0 6px',
                              borderRadius: 5, background: 'rgba(255,255,255,.06)',
                              border: '1px solid rgba(255,255,255,.1)',
                              color: C.text, fontSize: 10, fontWeight: 600,
                              fontFamily: "'JetBrains Mono', monospace",
                              lineHeight: 1, whiteSpace: 'nowrap',
                              boxShadow: '0 1px 2px rgba(0,0,0,.1)',
                            }}>{k.trim()}</kbd>
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, color: C.dim }}>Press</span>
          <kbd style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 22, height: 22, padding: '0 6px', borderRadius: 5,
            background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
            color: C.sub, fontSize: 11, fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
          }}>?</kbd>
          <span style={{ fontSize: 11, color: C.dim }}>or</span>
          <kbd style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 22, height: 22, padding: '0 6px', borderRadius: 5,
            background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
            color: C.sub, fontSize: 11, fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
          }}>Esc</kbd>
          <span style={{ fontSize: 11, color: C.dim }}>to close</span>
        </div>
      </div>
    </div>
  );
}

// ===== Context Menu Overlay (right-click) =====
function ContextMenuOverlay({ contextMenu, els, C, t }: {
  contextMenu: { x: number; y: number; elId: string | null };
  els: CanvasElement[];
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  t: (key: string) => string;
}) {
  const store = useThumbnailStore.getState;
  const targetEl = contextMenu.elId ? els.find((e) => e.id === contextMenu.elId) : null;

  const ctxItemStyle: React.CSSProperties = {
    padding: '7px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    color: C.text,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    outline: 'none',
  };

  const ctxSep: React.CSSProperties = {
    height: 1,
    background: C.border,
    margin: '3px 8px',
  };

  const hover = (e: React.MouseEvent | React.FocusEvent, on: boolean) => {
    (e.currentTarget as HTMLElement).style.background = on ? C.surface : 'transparent';
  };

  type CtxItem = {
    label: string;
    icon: React.ReactElement;
    shortcut?: string;
    action: () => void;
    danger?: boolean;
  } | 'separator';

  // Build menu items depending on whether we right-clicked an element or empty canvas
  const items: CtxItem[] = contextMenu.elId ? [
    { label: t('thumbs.editor.cut') || 'Cut', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>, shortcut: 'Ctrl+X', action: () => store().cutSelected() },
    { label: t('thumbs.editor.copy') || 'Copy', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>, shortcut: 'Ctrl+C', action: () => store().copySelected() },
    { label: t('thumbs.editor.paste') || 'Paste', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>, shortcut: 'Ctrl+V', action: () => store().pasteClipboard() },
    { label: t('thumbs.editor.duplicate'), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>, shortcut: 'Ctrl+D', action: () => store().duplicateSelected() },
    // Replace Image — only shown for image elements
    ...(targetEl?.type === 'image' ? [
      'separator' as const,
      { label: 'Replace Image', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>, shortcut: 'Dbl-click', action: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result;
            if (typeof result === 'string' && contextMenu.elId) store().replaceImage(contextMenu.elId, result);
          };
          reader.readAsDataURL(file);
        };
        input.click();
      } } as CtxItem,
    ] : []),
    'separator' as const,
    { label: 'Copy Style', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 16V7a2 2 0 00-2-2H9m-4 5v9a2 2 0 002 2h9a2 2 0 002-2v-1"/><path d="M2 12l3-3 3 3"/><path d="M5 9v8"/></svg>, shortcut: 'Alt+C', action: () => store().copyStyle() },
    { label: 'Paste Style', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 16V7a2 2 0 00-2-2H9m-4 5v9a2 2 0 002 2h9a2 2 0 002-2v-1"/><path d="M2 17l3 3 3-3"/><path d="M5 20v-8"/></svg>, shortcut: 'Alt+V', action: () => store().pasteStyle() },
    'separator' as const,
    { label: t('thumbs.editor.bringForward'), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>, shortcut: 'Ctrl+]', action: () => { if (contextMenu.elId) store().bringFront(contextMenu.elId); } },
    { label: t('thumbs.editor.sendBackward'), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/></svg>, shortcut: 'Ctrl+[', action: () => { if (contextMenu.elId) store().sendBack(contextMenu.elId); } },
    'separator' as const,
    { label: targetEl?.locked ? 'Unlock' : 'Lock', icon: targetEl?.locked ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>, action: () => { if (contextMenu.elId) store().updEl(contextMenu.elId, { locked: !targetEl?.locked }); } },
    { label: targetEl?.visible === false ? 'Show' : 'Hide', icon: targetEl?.visible === false ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>, action: () => { if (contextMenu.elId) store().updEl(contextMenu.elId, { visible: targetEl?.visible === false ? true : false }); } },
    'separator' as const,
    { label: t('thumbs.editor.delete'), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>, shortcut: 'Del', action: () => { if (contextMenu.elId) store().delEl(contextMenu.elId); }, danger: true },
  ] : [
    // Empty canvas context menu
    { label: t('thumbs.editor.paste') || 'Paste', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>, shortcut: 'Ctrl+V', action: () => store().pasteClipboard() },
    { label: 'Select All', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>, shortcut: 'Ctrl+A', action: () => store().setSelIds(store().els.map((el) => el.id)) },
    'separator' as const,
    { label: 'Add Text', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>, action: () => store().addText() },
    { label: 'Add Rectangle', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>, action: () => store().addRect() },
    { label: 'Add Circle', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>, action: () => store().addCircle() },
    'separator' as const,
    { label: 'Canvas Settings', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>, action: () => store().setLeftPanel('background') },
  ];

  // Calculate menu height for positioning
  const itemCount = items.filter((it) => it !== 'separator').length;
  const sepCount = items.filter((it) => it === 'separator').length;
  const estimatedHeight = itemCount * 32 + sepCount * 7 + 8;

  return (
    <div
      onClick={() => store().setContextMenu(null)}
      style={{ position: 'fixed', inset: 0, zIndex: Z_INDEX.MODAL_BACKDROP }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="menu"
        onKeyDown={(e) => {
          if (e.key === 'Escape') store().setContextMenu(null);
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const menuItems = (e.currentTarget as HTMLElement).querySelectorAll('[role="menuitem"]');
            const focused = document.activeElement;
            const idx = Array.from(menuItems).indexOf(focused as Element);
            const next = e.key === 'ArrowDown' ? (idx + 1) % menuItems.length : (idx - 1 + menuItems.length) % menuItems.length;
            (menuItems[next] as HTMLElement).focus();
          }
        }}
        style={{
          position: 'fixed',
          left: Math.min(contextMenu.x, window.innerWidth - 210),
          top: Math.min(contextMenu.y, window.innerHeight - estimatedHeight),
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 4,
          minWidth: 200,
          boxShadow: '0 4px 24px rgba(0,0,0,.4)',
          zIndex: Z_INDEX.CONTEXT_MENU,
        }}
      >
        {items.map((item, i) => {
          if (item === 'separator') return <div key={`sep-${i}`} style={ctxSep} />;
          const it = item;
          return (
            <div
              key={it.label}
              role="menuitem"
              tabIndex={-1}
              ref={i === 0 ? (el) => el?.focus() : undefined}
              onClick={() => { it.action(); store().setContextMenu(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); it.action(); store().setContextMenu(null); } }}
              style={{
                ...ctxItemStyle,
                color: it.danger ? C.accent : C.text,
              }}
              onMouseEnter={(e) => hover(e, true)}
              onMouseLeave={(e) => hover(e, false)}
              onFocus={(e) => hover(e, true)}
              onBlur={(e) => hover(e, false)}
            >
              <span style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.icon}</span>
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.shortcut && <span style={{ fontSize: 9, color: C.dim, fontFamily: "'JetBrains Mono', monospace" }}>{it.shortcut}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
