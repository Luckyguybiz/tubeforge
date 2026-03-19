'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useThemeStore } from '@/stores/useThemeStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import type { CanvasElement } from '@/lib/types';
import { Z_INDEX } from '@/lib/constants';
import { AIGeneratorView } from './AIGenerator';
import { ToolBar } from './ToolBar';
import { PropertiesPanel } from './PropertiesPanel';
import { LeftSidebar } from './LeftSidebar';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProjectPicker } from '@/components/ui/ProjectPicker';
import { useCanvasKeyboard } from '@/hooks/useCanvasKeyboard';
import { CANVAS_SAVE_DEBOUNCE_MS, STICKY_NOTE_COLOR, STICKY_NOTE_TEXT_COLOR } from '@/lib/constants';

export function ThumbnailEditor({ projectId }: { projectId: string | null }) {
  const C = useThemeStore((s) => s.theme);
  const { step, tool, els, selIds, canvasBg, drawing, drawPts, drawColor, drawSize, canvasW, canvasH, linePreview, guides, zoom, panX, panY, contextMenu, resize, drag, history, future } = useThumbnailStore(
    useShallow((s) => ({
      step: s.step, tool: s.tool, els: s.els, selIds: s.selIds, canvasBg: s.canvasBg,
      drawing: s.drawing, drawPts: s.drawPts, drawColor: s.drawColor, drawSize: s.drawSize,
      canvasW: s.canvasW, canvasH: s.canvasH, linePreview: s.linePreview, guides: s.guides,
      zoom: s.zoom, panX: s.panX, panY: s.panY, contextMenu: s.contextMenu, resize: s.resize,
      drag: s.drag, history: s.history, future: s.future,
    }))
  );
  const store = useThumbnailStore.getState;
  useCanvasKeyboard();
  const selId = selIds.length > 0 ? selIds[selIds.length - 1] : null;
  const sel = useMemo(() => els.find((e) => e.id === selId), [els, selId]);
  const loadedRef = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  useEffect(() => { loadedRef.current = false; }, [projectId]);

  const project = trpc.project.getById.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  useEffect(() => {
    if (project.data && !loadedRef.current) {
      store().loadFromProject(project.data.thumbnailData as { els?: CanvasElement[]; canvasBg?: string; canvasW?: number; canvasH?: number } | null);
      loadedRef.current = true;
    }
  }, [project.data, store]);

  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saveCanvas = trpc.project.update.useMutation({
    onError: (err) => { if (process.env.NODE_ENV === 'development') console.error('[ThumbnailEditor] Auto-save failed:', err.message); },
  });
  // Lightweight fingerprint instead of JSON.stringify(els) on every render
  const elsFingerprint = useMemo(
    () => els.reduce((h, e) => h + e.id + e.x + e.y + e.w + e.h + (e.color ?? '') + (e.text ?? '') + (e.opacity ?? 1), ''),
    [els],
  );
  useEffect(() => {
    if (!loadedRef.current || !projectId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveCanvas.mutate({ id: projectId, thumbnailData: store().exportState() });
    }, CANVAS_SAVE_DEBOUNCE_MS);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [elsFingerprint, canvasBg, canvasW, canvasH]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ctrl+Scroll zoom
  const onWheelZoom = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
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
  if (!projectId) return <ProjectPicker target="/thumbnails" title="Редактор обложек" />;
  if (project.isLoading) return (
    <div>
      <Skeleton width="220px" height="28px" />
      <div style={{ marginTop: 8 }}><Skeleton width="340px" height="16px" /></div>
      <div style={{ marginTop: 24 }}><Skeleton width="100%" height="400px" rounded /></div>
    </div>
  );

  const getCanvasCoords = (e: React.MouseEvent<HTMLDivElement | SVGElement>) => {
    const target = (e.currentTarget as HTMLElement).closest('[data-canvas]') as HTMLElement ?? e.currentTarget;
    const rect = target.getBoundingClientRect();
    const sx = canvasW / rect.width;
    const sy = canvasH / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };

  const onCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
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
      store().setDrag({ id: clicked.id, ox: x - clicked.x, oy: y - clicked.y });
    } else { store().setSelId(null); }
  };

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { x, y } = getCanvasCoords(e);
    if (drawing && tool === 'draw') { store().setDrawPts((p) => [...p, { x, y }]); return; }
    if (linePreview && (tool === 'line' || tool === 'arrow')) { store().setLinePreview({ ...linePreview, x2: x, y2: y }); return; }
    const curResize = store().resize;
    if (curResize) {
      const el = els.find((e) => e.id === curResize.id);
      if (!el) return;
      let nw = x - el.x, nh = y - el.y;
      if (nw < 20) nw = 20; if (nh < 20) nh = 20;
      store().updEl(curResize.id, { w: Math.round(nw), h: Math.round(nh) });
      return;
    }
    const curDrag = store().drag;
    if (!curDrag) return;
    let nx = Math.round(x - curDrag.ox), ny = Math.round(y - curDrag.oy);
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
        // Left edge → left/right edge
        if (Math.abs(nx - other.x) < snapThreshold) { nx = other.x; gx.push(other.x); }
        if (Math.abs(nx - (other.x + other.w)) < snapThreshold) { nx = other.x + other.w; gx.push(other.x + other.w); }
        // Right edge → left/right edge
        if (Math.abs(dR - other.x) < snapThreshold) { nx = other.x - dragEl.w; gx.push(other.x); }
        if (Math.abs(dR - (other.x + other.w)) < snapThreshold) { nx = other.x + other.w - dragEl.w; gx.push(other.x + other.w); }
        // Center → center
        if (Math.abs(dCx - oCx) < snapThreshold) { nx = oCx - dragEl.w / 2; gx.push(oCx); }
        // Top edge → top/bottom edge
        if (Math.abs(ny - other.y) < snapThreshold) { ny = other.y; gy.push(other.y); }
        if (Math.abs(ny - (other.y + other.h)) < snapThreshold) { ny = other.y + other.h; gy.push(other.y + other.h); }
        // Bottom edge → top/bottom edge
        if (Math.abs(dB - other.y) < snapThreshold) { ny = other.y - dragEl.h; gy.push(other.y); }
        if (Math.abs(dB - (other.y + other.h)) < snapThreshold) { ny = other.y + other.h - dragEl.h; gy.push(other.y + other.h); }
        // Center Y → center Y
        if (Math.abs(dCy - oCy) < snapThreshold) { ny = oCy - dragEl.h / 2; gy.push(oCy); }
      }
      store().setGuides({ x: [...new Set(gx)], y: [...new Set(gy)] });
    }
    store().updEl(curDrag.id, { x: nx, y: ny });
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
    store().setDrawing(false); store().setDrawPts([]); store().setDrag(null); store().setResize(null); store().setGuides({ x: [], y: [] });
  };

  // ===== Download =====
  const downloadCanvas = (format: 'png' | 'jpg' | 'pdf' = 'png') => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasW; canvas.height = canvasH;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = canvasBg; ctx.fillRect(0, 0, canvasW, canvasH);

    // Preload all images first so we can draw elements in correct z-order
    const imgCache = new Map<string, HTMLImageElement>();
    const imageEls = els.filter((el) => el.type === 'image' && el.src && el.visible !== false);
    const imagePromises = imageEls.map((el) => new Promise<void>((resolve) => {
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => { imgCache.set(el.id, img); resolve(); };
      img.onerror = () => resolve();
      img.src = el.src!;
    }));

    Promise.all(imagePromises).then(() => {
      // Draw all elements in order (correct z-layering)
      for (const el of els) {
        if (el.visible === false) continue;
        ctx.globalAlpha = el.opacity ?? 1;
        if (el.type === 'rect') {
          ctx.fillStyle = el.color ?? '#fff';
          if ((el.borderR ?? 0) > 0) { const r = el.borderR!; ctx.beginPath(); ctx.moveTo(el.x + r, el.y); ctx.lineTo(el.x + el.w - r, el.y); ctx.quadraticCurveTo(el.x + el.w, el.y, el.x + el.w, el.y + r); ctx.lineTo(el.x + el.w, el.y + el.h - r); ctx.quadraticCurveTo(el.x + el.w, el.y + el.h, el.x + el.w - r, el.y + el.h); ctx.lineTo(el.x + r, el.y + el.h); ctx.quadraticCurveTo(el.x, el.y + el.h, el.x, el.y + el.h - r); ctx.lineTo(el.x, el.y + r); ctx.quadraticCurveTo(el.x, el.y, el.x + r, el.y); ctx.closePath(); ctx.fill(); }
          else { ctx.fillRect(el.x, el.y, el.w, el.h); }
        } else if (el.type === 'circle') {
          ctx.fillStyle = el.color ?? '#fff'; ctx.beginPath(); ctx.ellipse(el.x + el.w / 2, el.y + el.h / 2, el.w / 2, el.h / 2, 0, 0, Math.PI * 2); ctx.fill();
        } else if (el.type === 'text') {
          ctx.fillStyle = el.color ?? '#fff'; ctx.font = (el.bold ? 'bold ' : '') + (el.italic ? 'italic ' : '') + (el.size ?? 32) + 'px ' + (el.font ?? 'sans-serif');
          if (el.shadow && el.shadow !== 'none') { try { const parts = el.shadow.match(/([\d.-]+)/g); if (parts && parts.length >= 3) { ctx.shadowOffsetX = parseFloat(parts[0]); ctx.shadowOffsetY = parseFloat(parts[1]); ctx.shadowBlur = parseFloat(parts[2]); ctx.shadowColor = el.shadow.match(/rgba?\([^)]+\)/)?.[0] || 'rgba(0,0,0,.5)'; } else { ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 4; ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,0,0,0.3)'; } } catch { ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 4; ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,0,0,0.3)'; } }
          ctx.fillText(el.text ?? '', el.x + 8, el.y + (el.size ?? 32)); ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowBlur = 0;
        } else if (el.type === 'path') {
          ctx.strokeStyle = el.color ?? '#fff'; ctx.lineWidth = el.strokeW ?? 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(new Path2D(el.path ?? ''));
        } else if (el.type === 'image') {
          const img = imgCache.get(el.id);
          if (img) { ctx.drawImage(img, el.x, el.y, el.w, el.h); }
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
          (el.noteText ?? 'Заметка').split('\n').forEach((line, i) => ctx.fillText(line, el.x + 10, el.y + 20 + i * ((el.size ?? 14) + 4)));
        } else if (el.type === 'table') {
          const rows = el.rows ?? 3, cols = el.cols ?? 3, cw = el.w / cols, ch = el.h / rows;
          ctx.strokeStyle = el.strokeColor ?? 'rgba(255,255,255,.2)'; ctx.lineWidth = 1;
          for (let r = 0; r <= rows; r++) { ctx.beginPath(); ctx.moveTo(el.x, el.y + r * ch); ctx.lineTo(el.x + el.w, el.y + r * ch); ctx.stroke(); }
          for (let c = 0; c <= cols; c++) { ctx.beginPath(); ctx.moveTo(el.x + c * cw, el.y); ctx.lineTo(el.x + c * cw, el.y + el.h); ctx.stroke(); }
          ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif';
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const t = el.cellData?.[r]?.[c] ?? ''; if (t) ctx.fillText(t, el.x + c * cw + 4, el.y + r * ch + 14, cw - 8); }
        }
        ctx.globalAlpha = 1;
      }
    }).then(async () => {
      if (format === 'pdf') {
        try {
          const { default: jsPDF } = await import('jspdf');
          const orientation = canvasW >= canvasH ? 'landscape' : 'portrait';
          const pdf = new jsPDF({ orientation, unit: 'px', format: [canvasW, canvasH] });
          const imgData = canvas.toDataURL('image/jpeg', 0.92);
          pdf.addImage(imgData, 'JPEG', 0, 0, canvasW, canvasH);
          pdf.save('thumbnail.pdf');
        } catch {
          // Fallback if jspdf not installed - download as PNG
          const link = document.createElement('a');
          link.download = 'thumbnail.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
        return;
      }
      const link = document.createElement('a');
      link.download = format === 'jpg' ? 'thumbnail.jpg' : 'thumbnail.png';
      link.href = format === 'jpg' ? canvas.toDataURL('image/jpeg', 0.92) : canvas.toDataURL('image/png');
      link.click();
    }).catch((err) => {
      if (process.env.NODE_ENV === 'development') console.error('[ThumbnailEditor] Download failed:', err);
    });
  };

  // ===== Render element =====
  const renderElement = (el: CanvasElement) => {
    if (el.visible === false) return null;
    const isSel = selIds.includes(el.id);
    const resizeHandle = isSel && (
      <div onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); store().setResize({ id: el.id }); }}
        style={{ position: 'absolute', bottom: -4, right: -4, width: 10, height: 10, background: C.accent, borderRadius: 2, cursor: 'nwse-resize', zIndex: 5 }} />
    );
    const deleteHandle = isSel && (
      <div
        title="Удалить"
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); store().pushHistory(); store().delEl(el.id); }}
        style={{ position: 'absolute', top: -10, right: -10, width: 20, height: 20, background: '#e53935', borderRadius: '50%', cursor: 'pointer', zIndex: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1, boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}
      >&times;</div>
    );
    const elDrag = (e: React.MouseEvent) => {
      e.stopPropagation(); store().setSelId(el.id);
      const rect = (e.currentTarget as HTMLElement).closest('[data-canvas]')?.getBoundingClientRect() ?? (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
      const sx = canvasW / rect.width;
      const sy = canvasH / rect.height;
      store().setDrag({ id: el.id, ox: (e.clientX - rect.left) * sx - el.x, oy: (e.clientY - rect.top) * sy - el.y });
    };

    if (el.type === 'text') return (
      <div key={el.id} data-text-el={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', minHeight: el.h / canvasH * 100 + '%', fontSize: `clamp(8px,${(el.size ?? 32) / canvasW * 100}vw,${(el.size ?? 32) * 0.8}px)`, fontWeight: el.bold ? 'bold' : 'normal', fontStyle: el.italic ? 'italic' : 'normal', fontFamily: el.font, color: el.color, textShadow: el.shadow !== 'none' ? el.shadow : 'none', opacity: el.opacity, background: el.bg, borderRadius: el.borderR, padding: '4px 8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', border: isSel ? `2px dashed ${C.accent}88` : '2px solid transparent', cursor: 'move', boxSizing: 'border-box', outline: 'none', transform: el.rot ? `rotate(${el.rot}deg)` : undefined }}
        contentEditable={isSel} suppressContentEditableWarning
        onBlur={(e) => store().updEl(el.id, { text: (e.target as HTMLElement).innerText })}
        onMouseDown={(e) => {
          if (!isSel) { e.stopPropagation(); store().setSelId(el.id); return; }
          // When already selected, set up drag (single-click moves, double-click edits text)
          elDrag(e);
        }}
        onDoubleClick={(e) => {
          // Focus the contentEditable on double-click for text editing
          e.stopPropagation();
          (e.currentTarget as HTMLElement).focus();
        }}>
        {el.text}{resizeHandle}{deleteHandle}
      </div>
    );

    if (el.type === 'rect') return (
      <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', background: el.color, opacity: el.opacity, borderRadius: el.borderR, border: isSel ? `2px dashed ${C.accent}88` : 'none', cursor: 'move', boxSizing: 'border-box', transform: el.rot ? `rotate(${el.rot}deg)` : undefined }}
        onMouseDown={elDrag}>{resizeHandle}{deleteHandle}</div>
    );

    if (el.type === 'circle') return (
      <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', background: el.color, opacity: el.opacity, borderRadius: '50%', border: isSel ? `2px dashed ${C.accent}88` : 'none', cursor: 'move', boxSizing: 'border-box', transform: el.rot ? `rotate(${el.rot}deg)` : undefined }}
        onMouseDown={elDrag}>{resizeHandle}{deleteHandle}</div>
    );

    if (el.type === 'image') return (
      <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', border: isSel ? `2px dashed ${C.accent}88` : 'none', cursor: 'move', boxSizing: 'border-box', transform: el.rot ? `rotate(${el.rot}deg)` : undefined }}
        onMouseDown={elDrag}>
        <img src={el.src} alt="Изображение" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: el.opacity, borderRadius: el.borderR, pointerEvents: 'none' }} />
        {resizeHandle}{deleteHandle}
      </div>
    );

    if (el.type === 'path') return (
      <svg key={el.id} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox={`0 0 ${canvasW} ${canvasH}`}>
        <path d={el.path} fill="none" stroke={el.color} strokeWidth={el.strokeW} strokeLinecap="round" strokeLinejoin="round" opacity={el.opacity} />
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
      <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', background: el.noteColor ?? STICKY_NOTE_COLOR, borderRadius: 4, padding: '8px 10px', boxShadow: '2px 2px 8px rgba(0,0,0,.15)', fontSize: `clamp(8px,${(el.size ?? 14) / canvasW * 100}vw,${(el.size ?? 14)}px)`, color: STICKY_NOTE_TEXT_COLOR, fontFamily: 'sans-serif', border: isSel ? `2px dashed ${C.accent}88` : 'none', cursor: 'move', boxSizing: 'border-box', overflow: 'hidden', opacity: el.opacity ?? 1, transform: el.rot ? `rotate(${el.rot}deg)` : undefined }}
        contentEditable={isSel} suppressContentEditableWarning
        onBlur={(e) => store().updEl(el.id, { noteText: (e.target as HTMLElement).innerText })}
        onMouseDown={elDrag}
        onDoubleClick={(e) => { e.stopPropagation(); (e.currentTarget as HTMLElement).focus(); }}>
        {el.noteText ?? 'Заметка'}{resizeHandle}{deleteHandle}
      </div>
    );

    if (el.type === 'table') {
      const rows = el.rows ?? 3, cols = el.cols ?? 3;
      return (
        <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', display: 'grid', gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: `repeat(${cols}, 1fr)`, border: `1px solid ${isSel ? C.accent + '88' : el.strokeColor ?? 'rgba(255,255,255,.2)'}`, cursor: 'move', boxSizing: 'border-box', opacity: el.opacity ?? 1, transform: el.rot ? `rotate(${el.rot}deg)` : undefined }}
          onMouseDown={elDrag}>
          {Array.from({ length: rows * cols }, (_, i) => {
            const r = Math.floor(i / cols), c = i % cols;
            return (
              <div key={i} contentEditable={isSel} suppressContentEditableWarning
                style={{ border: `1px solid ${el.strokeColor ?? 'rgba(255,255,255,.15)'}`, padding: '2px 4px', fontSize: 10, color: '#fff', outline: 'none', overflow: 'hidden' }}
                onBlur={(ev) => {
                  const data = JSON.parse(JSON.stringify(el.cellData ?? Array.from({ length: rows }, () => Array(cols).fill(''))));
                  if (!data[r]) data[r] = Array(cols).fill('');
                  data[r][c] = (ev.target as HTMLElement).innerText;
                  store().updEl(el.id, { cellData: data });
                }}>
                {el.cellData?.[r]?.[c] ?? ''}
              </div>
            );
          })}
          {resizeHandle}{deleteHandle}
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
    // Fallback: render manually
    const canvas = document.createElement('canvas');
    canvas.width = canvasW; canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = canvasBg; ctx.fillRect(0, 0, canvasW, canvasH);
    for (const el of els) {
      if (el.visible === false) continue;
      ctx.globalAlpha = el.opacity ?? 1;
      if (el.type === 'rect') {
        ctx.fillStyle = el.color ?? '#fff'; ctx.fillRect(el.x, el.y, el.w, el.h);
      } else if (el.type === 'circle') {
        ctx.fillStyle = el.color ?? '#fff'; ctx.beginPath(); ctx.ellipse(el.x + el.w / 2, el.y + el.h / 2, el.w / 2, el.h / 2, 0, 0, Math.PI * 2); ctx.fill();
      } else if (el.type === 'text') {
        ctx.fillStyle = el.color ?? '#fff'; ctx.font = (el.bold ? 'bold ' : '') + (el.italic ? 'italic ' : '') + (el.size ?? 32) + 'px ' + (el.font ?? 'sans-serif');
        ctx.fillText(el.text ?? '', el.x + 8, el.y + (el.size ?? 32));
      } else if (el.type === 'image' && el.src) {
        // Draw loaded images
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = el.src;
        try { ctx.drawImage(img, el.x, el.y, el.w, el.h); } catch { /* skip if not loaded */ }
      }
      ctx.globalAlpha = 1;
    }
    return canvas.toDataURL('image/png');
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => store().addImage(ev.target!.result as string);
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
        reader.onload = (ev) => store().addImage(ev.target!.result as string);
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
  const headerBtn: React.CSSProperties = { padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .15s' };
  const dropdownPanel: React.CSSProperties = { position: 'absolute', top: '100%', right: 0, marginTop: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 6, zIndex: Z_INDEX.TOOLBAR_POPOVER, boxShadow: '0 8px 32px rgba(0,0,0,.25), 0 2px 8px rgba(0,0,0,.15)' };
  const menuItem: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: C.text, transition: 'background .1s' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0' }}>Редактор обложек</h2>
            {project.data?.title && <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>— {project.data.title}</span>}
            <span style={{ fontSize: 11, color: saveCanvas.isPending ? C.accent : C.dim, fontWeight: 500, marginLeft: 4, transition: 'color .3s', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {saveCanvas.isPending ? (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Сохраняется...</>
              ) : (
                <span style={{ color: C.green, display: 'inline-flex', alignItems: 'center', gap: 3 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Сохранено</span>
              )}
            </span>
          </div>
          <p style={{ color: C.sub, fontSize: 13, margin: '4px 0 0' }}>Создайте обложку как в Canva или перейдите к ИИ-генерации</p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => store().undo()} disabled={history.length === 0} title="Отменить (Ctrl+Z)" style={{ ...headerBtn, padding: '7px 8px', color: history.length === 0 ? C.dim : C.sub, cursor: history.length === 0 ? 'default' : 'pointer', opacity: history.length === 0 ? 0.3 : 1 }}>{undoIcon}</button>
          <button onClick={() => store().redo()} disabled={future.length === 0} title="Повторить (Ctrl+Y)" style={{ ...headerBtn, padding: '7px 8px', color: future.length === 0 ? C.dim : C.sub, cursor: future.length === 0 ? 'default' : 'pointer', opacity: future.length === 0 ? 0.3 : 1 }}>{redoIcon}</button>
          <div style={{ width: 1, height: 20, background: C.border, margin: '0 2px' }} />
          {/* Size presets */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowSizeMenu(!showSizeMenu); setShowDownloadMenu(false); }} title="Размер холста" style={{ ...headerBtn, padding: '7px 12px', fontSize: 11 }}>
              {canvasW}x{canvasH} {chevronIcon}
            </button>
            {showSizeMenu && (
              <div style={{ ...dropdownPanel, minWidth: 200 }}>
                {SIZE_PRESETS.map((p) => (
                  <div key={p.label} role="menuitem" tabIndex={0} aria-label={`${p.label} ${p.w}×${p.h}`} onClick={() => { store().setCanvasSize(p.w, p.h); setShowSizeMenu(false); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); store().setCanvasSize(p.w, p.h); setShowSizeMenu(false); } }}
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
          {/* Download dropdown */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowDownloadMenu(!showDownloadMenu); setShowSizeMenu(false); }} title="Скачать обложку" style={{ ...headerBtn, padding: '7px 14px' }}>{downloadIcon} Скачать {chevronIcon}</button>
            {showDownloadMenu && (
              <div style={{ ...dropdownPanel, minWidth: 140 }}>
                {[{ label: 'PNG', format: 'png' as const, desc: 'Без потерь' }, { label: 'JPG', format: 'jpg' as const, desc: 'Сжатый' }, { label: 'PDF', format: 'pdf' as const, desc: 'Документ' }].map((opt) => (
                  <div key={opt.format} role="menuitem" tabIndex={0} aria-label={`Скачать ${opt.label}`} onClick={() => { downloadCanvas(opt.format); setShowDownloadMenu(false); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); downloadCanvas(opt.format); setShowDownloadMenu(false); } }}
                    style={menuItem}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <span style={{ fontWeight: 600 }}>{opt.label}</span>
                    <span style={{ fontSize: 10, color: C.dim }}>{opt.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ width: 1, height: 20, background: C.border, margin: '0 2px' }} />
          {/* AI reference + AI generate */}
          <button onClick={() => { const img = captureCanvas(); if (img) { store().setAiReferenceImage(img); store().setStep('ai'); } }} style={{ ...headerBtn, padding: '7px 12px' }}>{cameraIcon} По фото</button>
          <button onClick={() => store().setStep('ai')} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg,${C.accent},${C.pink})`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${C.accent}33`, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .15s' }}>{sparkleIcon} ИИ-генерация</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <ToolBar onFileChange={onFileChange} />
        <LeftSidebar />
        <div ref={canvasWrapperRef} style={{ flex: 1, position: 'relative', minWidth: 0, overflow: 'hidden', borderRadius: 12, border: `1px solid ${C.border}`, background: C.bg }}
          onMouseDown={onMiddleDown} onMouseMove={onMiddleMove} onMouseUp={onMiddleUp} onMouseLeave={onMiddleUp}>
          {/* D5: Removed redundant canvas size overlay — info is in top bar button */}
          <div style={{ transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`, transformOrigin: 'center center', transition: isPanning.current ? 'none' : 'transform .1s ease-out' }}>
            <div data-canvas onMouseDown={onCanvasMouseDown} onMouseMove={onCanvasMouseMove} onMouseUp={onCanvasMouseUp} onMouseLeave={onCanvasMouseUp} onContextMenu={onCanvasContextMenu} onDragOver={onCanvasDragOver} onDrop={onCanvasDrop}
              style={{ width: '100%', aspectRatio: `${canvasW}/${canvasH}`, background: canvasBg, position: 'relative', overflow: 'hidden', cursor: tool === 'draw' || tool === 'line' || tool === 'arrow' ? 'crosshair' : tool === 'eraser' ? 'not-allowed' : isPanning.current ? 'grabbing' : 'default', userSelect: 'none' }}>
            {els.map(renderElement)}
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
            {guides.x.map((gx, i) => <div key={`gx-${i}`} style={{ position: 'absolute', left: gx / canvasW * 100 + '%', top: 0, bottom: 0, width: 1.5, background: C.accent, opacity: 0.7, pointerEvents: 'none', zIndex: Z_INDEX.GUIDES }} />)}
            {guides.y.map((gy, i) => <div key={`gy-${i}`} style={{ position: 'absolute', top: gy / canvasH * 100 + '%', left: 0, right: 0, height: 1.5, background: C.accent, opacity: 0.7, pointerEvents: 'none', zIndex: Z_INDEX.GUIDES }} />)}
          </div>
          </div>
          {/* Floating zoom controls */}
          <div title="Ctrl+Scroll для зума" style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 2, background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '4px 6px', zIndex: Z_INDEX.ZOOM_CONTROLS, boxShadow: '0 2px 12px rgba(0,0,0,.15)' }}>
            <button onClick={() => store().zoomOut()} title="Уменьшить (Ctrl+-)" style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: C.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.color = C.text; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.sub; }}
            >{zoomOutIcon}</button>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.sub, minWidth: 44, textAlign: 'center', userSelect: 'none' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => store().zoomIn()} title="Увеличить (Ctrl++)" style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: C.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.color = C.text; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.sub; }}
            >{zoomInIcon}</button>
            <div style={{ width: 1, height: 16, background: C.border, margin: '0 2px' }} />
            <button onClick={() => store().fitToScreen()} title="Вместить (Ctrl+0)" style={{ padding: '4px 8px', height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: C.sub, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, transition: 'all .12s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.color = C.text; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.sub; }}
            >{fitIcon} По размеру</button>
          </div>
        </div>
        {/* D8: Context menu */}
        {contextMenu && (
          <div
            onClick={() => store().setContextMenu(null)}
            style={{ position: 'fixed', inset: 0, zIndex: Z_INDEX.MODAL_BACKDROP }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                left: Math.min(contextMenu.x, window.innerWidth - 180),
                top: Math.min(contextMenu.y, window.innerHeight - 180),
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: 4,
                minWidth: 160,
                boxShadow: '0 4px 20px rgba(0,0,0,.35)',
                zIndex: Z_INDEX.CONTEXT_MENU,
              }}
            >
              {contextMenu.elId ? (
                <div role="menu" onKeyDown={(e) => {
                  if (e.key === 'Escape') store().setContextMenu(null);
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const items = (e.currentTarget as HTMLElement).querySelectorAll('[role="menuitem"]');
                    const focused = document.activeElement;
                    const idx = Array.from(items).indexOf(focused as Element);
                    const next = e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
                    (items[next] as HTMLElement).focus();
                  }
                }}>
                  {[
                    { label: 'Дублировать', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>, shortcut: 'Ctrl+D', action: () => store().duplicateSelected() },
                    { label: 'На передний план', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>, shortcut: 'Ctrl+]', action: () => store().bringFront(store().contextMenu!.elId!) },
                    { label: 'На задний план', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>, shortcut: 'Ctrl+[', action: () => store().sendBack(store().contextMenu!.elId!) },
                    { label: 'Удалить', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>, shortcut: 'Del', action: () => store().delEl(store().contextMenu!.elId!), danger: true },
                  ].map((item, i) => (
                    <div
                      key={item.label}
                      role="menuitem"
                      tabIndex={-1}
                      ref={i === 0 ? (el) => el?.focus() : undefined}
                      onClick={() => { item.action(); store().setContextMenu(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.action(); store().setContextMenu(null); } }}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        color: (item as { danger?: boolean }).danger ? C.accent : C.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        outline: 'none',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      onFocus={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; }}
                      onBlur={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <span style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <span style={{ fontSize: 9, color: C.dim, fontFamily: "'JetBrains Mono', monospace" }}>{item.shortcut}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '8px 12px', fontSize: 11, color: C.dim }}>Нет элемента</div>
              )}
            </div>
          </div>
        )}
        <PropertiesPanel sel={sel ?? null} />
      </div>
    </div>
  );
}

const SIZE_PRESETS = [
  { label: 'YouTube Обложка', w: 1280, h: 720 },
  { label: 'Instagram Пост', w: 1080, h: 1080 },
  { label: 'Instagram Сторис', w: 1080, h: 1920 },
  { label: 'Facebook Обложка', w: 820, h: 312 },
  { label: 'Twitter Баннер', w: 1500, h: 500 },
  { label: 'HD 1920×1080', w: 1920, h: 1080 },
];

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
