'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

/* ─── types ──────────────────────────────────────────────────────── */

interface FaceSelection {
  cx: number; // center x (ratio 0..1 of image)
  cy: number; // center y (ratio 0..1 of image)
  rx: number; // horizontal radius (ratio)
  ry: number; // vertical radius (ratio)
}

interface Placement {
  x: number;  // center x on target (ratio 0..1)
  y: number;  // center y on target (ratio 0..1)
  scale: number;
  rotation: number; // radians
}

type DragMode = 'none' | 'move-selection' | 'resize-selection' | 'move-face' | 'resize-face' | 'rotate-face';

/* ─── canvas helpers ─────────────────────────────────────────────── */

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

/** Extract the face region from source as an offscreen canvas with elliptical alpha mask and feathered edges. */
function extractFace(
  sourceImg: HTMLImageElement,
  sel: FaceSelection,
  feather: number, // 0..100
): HTMLCanvasElement {
  const sw = sourceImg.naturalWidth;
  const sh = sourceImg.naturalHeight;
  const cx = sel.cx * sw;
  const cy = sel.cy * sh;
  const rx = sel.rx * sw;
  const ry = sel.ry * sh;

  // output canvas sized to bounding box of the ellipse
  const w = Math.ceil(rx * 2);
  const h = Math.ceil(ry * 2);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  // Draw the source region
  ctx.drawImage(sourceImg, cx - rx, cy - ry, w, h, 0, 0, w, h);

  // Apply elliptical alpha mask with feathered edge
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const featherFraction = 0.05 + (feather / 100) * 0.45; // 5% to 50% of radius is feather zone

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const idx = (py * w + px) * 4;
      // normalized distance from center of ellipse (1.0 = on ellipse edge)
      const nx = (px - w / 2) / (w / 2);
      const ny = (py - h / 2) / (h / 2);
      const dist = Math.sqrt(nx * nx + ny * ny);

      if (dist > 1.0) {
        // outside ellipse
        d[idx + 3] = 0;
      } else if (dist > 1.0 - featherFraction) {
        // feather zone
        const alpha = (1.0 - dist) / featherFraction;
        d[idx + 3] = Math.round(d[idx + 3] * Math.max(0, Math.min(1, alpha)));
      }
      // else: keep original alpha
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/** Compute average RGB from an ImageData (only considering pixels with alpha > 128). */
function avgColor(data: ImageData): [number, number, number] {
  const d = data.data;
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] > 128) {
      r += d[i];
      g += d[i + 1];
      b += d[i + 2];
      count++;
    }
  }
  if (count === 0) return [128, 128, 128];
  return [r / count, g / count, b / count];
}

/** Color-match the face canvas to a target sample area. Adjusts per-channel gain + offset. */
function colorMatchFace(
  faceCanvas: HTMLCanvasElement,
  targetImg: HTMLImageElement,
  placement: Placement,
): HTMLCanvasElement {
  const w = faceCanvas.width;
  const h = faceCanvas.height;

  // Get face color stats
  const faceCtx = faceCanvas.getContext('2d', { willReadFrequently: true });
  if (!faceCtx) return faceCanvas;
  const faceData = faceCtx.getImageData(0, 0, w, h);
  const [fR, fG, fB] = avgColor(faceData);

  // Sample target area around placement
  const tw = targetImg.naturalWidth;
  const th = targetImg.naturalHeight;
  const sampleSize = Math.max(50, Math.min(w, h));
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleSize;
  sampleCanvas.height = sampleSize;
  const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  if (!sCtx) return faceCanvas;

  const sx = placement.x * tw - sampleSize / 2;
  const sy = placement.y * th - sampleSize / 2;
  sCtx.drawImage(targetImg, sx, sy, sampleSize, sampleSize, 0, 0, sampleSize, sampleSize);
  const targetData = sCtx.getImageData(0, 0, sampleSize, sampleSize);
  const [tR, tG, tB] = avgColor(targetData);

  // Compute per-channel gain
  const gainR = fR > 1 ? tR / fR : 1;
  const gainG = fG > 1 ? tG / fG : 1;
  const gainB = fB > 1 ? tB / fB : 1;

  // Apply to face
  const result = document.createElement('canvas');
  result.width = w;
  result.height = h;
  const rCtx = result.getContext('2d', { willReadFrequently: true });
  if (!rCtx) return faceCanvas;

  rCtx.drawImage(faceCanvas, 0, 0);
  const rData = rCtx.getImageData(0, 0, w, h);
  const rd = rData.data;

  // Blend 50% toward target color (subtle correction, not full replacement)
  const blend = 0.5;
  for (let i = 0; i < rd.length; i += 4) {
    if (rd[i + 3] > 0) {
      rd[i]     = Math.min(255, Math.round(rd[i]     * (1 - blend + blend * gainR)));
      rd[i + 1] = Math.min(255, Math.round(rd[i + 1] * (1 - blend + blend * gainG)));
      rd[i + 2] = Math.min(255, Math.round(rd[i + 2] * (1 - blend + blend * gainB)));
    }
  }

  rCtx.putImageData(rData, 0, 0);
  return result;
}

/** Composite the face onto the target, producing a final data URL. */
function compositeFace(
  targetImg: HTMLImageElement,
  faceCanvas: HTMLCanvasElement,
  placement: Placement,
  blendStrength: number, // 0..100
): string {
  const tw = targetImg.naturalWidth;
  const th = targetImg.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Draw target
  ctx.drawImage(targetImg, 0, 0);

  // Draw face with placement
  const px = placement.x * tw;
  const py = placement.y * th;
  const fw = faceCanvas.width * placement.scale;
  const fh = faceCanvas.height * placement.scale;

  ctx.save();
  ctx.globalAlpha = blendStrength / 100;
  ctx.translate(px, py);
  ctx.rotate(placement.rotation);
  ctx.drawImage(faceCanvas, -fw / 2, -fh / 2, fw, fh);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

/* ─── sub-components ─────────────────────────────────────────────── */

/** Canvas that shows the source image with a draggable/resizable elliptical selection. */
function SourceSelector({
  imgSrc,
  selection,
  onSelectionChange,
  accentColor,
  theme: C,
}: {
  imgSrc: string;
  selection: FaceSelection;
  onSelectionChange: (s: FaceSelection) => void;
  accentColor: string;
  theme: ReturnType<typeof useThemeStore.getState>['theme'];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const dragStart = useRef<{ mx: number; my: number; sel: FaceSelection }>({
    mx: 0, my: 0, sel: selection,
  });

  const getRelativePos = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { rx: 0, ry: 0 };
    return {
      rx: (clientX - rect.left) / rect.width,
      ry: (clientY - rect.top) / rect.height,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const pos = getRelativePos(e.clientX, e.clientY);
    dragStart.current = { mx: pos.rx, my: pos.ry, sel: { ...selection } };
    setDragMode(mode);
  }, [selection, getRelativePos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragMode === 'none') return;
    const pos = getRelativePos(e.clientX, e.clientY);
    const dx = pos.rx - dragStart.current.mx;
    const dy = pos.ry - dragStart.current.my;
    const s = dragStart.current.sel;

    if (dragMode === 'move-selection') {
      onSelectionChange({
        ...s,
        cx: Math.max(s.rx, Math.min(1 - s.rx, s.cx + dx)),
        cy: Math.max(s.ry, Math.min(1 - s.ry, s.cy + dy)),
      });
    } else if (dragMode === 'resize-selection') {
      const newRx = Math.max(0.03, Math.min(0.5, s.rx + dx));
      const newRy = Math.max(0.03, Math.min(0.5, s.ry + dy));
      onSelectionChange({ ...s, rx: newRx, ry: newRy });
    }
  }, [dragMode, getRelativePos, onSelectionChange]);

  const handlePointerUp = useCallback(() => {
    setDragMode('none');
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        border: `1px solid ${C.border}`,
        cursor: dragMode === 'move-selection' ? 'grabbing' : 'default',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <img
        src={imgSrc}
        alt="Source face"
        draggable={false}
        style={{ width: '100%', display: 'block' }}
      />
      {/* Dimmed overlay outside selection */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        maskImage: `radial-gradient(ellipse ${selection.rx * 100}% ${selection.ry * 100}% at ${selection.cx * 100}% ${selection.cy * 100}%, transparent 98%, black 100%)`,
        WebkitMaskImage: `radial-gradient(ellipse ${selection.rx * 100}% ${selection.ry * 100}% at ${selection.cx * 100}% ${selection.cy * 100}%, transparent 98%, black 100%)`,
        pointerEvents: 'none',
      }} />
      {/* Selection ellipse border */}
      <div
        style={{
          position: 'absolute',
          left: `${(selection.cx - selection.rx) * 100}%`,
          top: `${(selection.cy - selection.ry) * 100}%`,
          width: `${selection.rx * 200}%`,
          height: `${selection.ry * 200}%`,
          border: `2px dashed ${accentColor}`,
          borderRadius: '50%',
          cursor: 'grab',
          boxSizing: 'border-box',
        }}
        onPointerDown={(e) => handlePointerDown(e, 'move-selection')}
      />
      {/* Resize handle (bottom-right of ellipse) */}
      <div
        style={{
          position: 'absolute',
          left: `${(selection.cx + selection.rx) * 100 - 1}%`,
          top: `${(selection.cy + selection.ry) * 100 - 1}%`,
          width: 14,
          height: 14,
          borderRadius: 7,
          background: accentColor,
          border: '2px solid #fff',
          cursor: 'nwse-resize',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 2px 6px rgba(0,0,0,.3)',
          zIndex: 2,
        }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-selection')}
      />
      {/* Center crosshair */}
      <div
        style={{
          position: 'absolute',
          left: `${selection.cx * 100}%`,
          top: `${selection.cy * 100}%`,
          width: 12,
          height: 12,
          borderRadius: 6,
          border: `2px solid ${accentColor}`,
          background: 'rgba(255,255,255,0.6)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </div>
  );
}

/** Canvas showing the target image with a draggable, resizable face overlay. */
function TargetCompositor({
  targetSrc,
  faceSrc,
  placement,
  onPlacementChange,
  accentColor,
  theme: C,
}: {
  targetSrc: string;
  faceSrc: string | null;
  placement: Placement;
  onPlacementChange: (p: Placement) => void;
  accentColor: string;
  theme: ReturnType<typeof useThemeStore.getState>['theme'];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const dragStart = useRef<{ mx: number; my: number; placement: Placement }>({
    mx: 0, my: 0, placement,
  });

  const getRelativePos = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { rx: 0, ry: 0 };
    return {
      rx: (clientX - rect.left) / rect.width,
      ry: (clientY - rect.top) / rect.height,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const pos = getRelativePos(e.clientX, e.clientY);
    dragStart.current = { mx: pos.rx, my: pos.ry, placement: { ...placement } };
    setDragMode(mode);
  }, [placement, getRelativePos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragMode === 'none') return;
    const pos = getRelativePos(e.clientX, e.clientY);
    const dx = pos.rx - dragStart.current.mx;
    const dy = pos.ry - dragStart.current.my;
    const p = dragStart.current.placement;

    if (dragMode === 'move-face') {
      onPlacementChange({
        ...p,
        x: Math.max(0, Math.min(1, p.x + dx)),
        y: Math.max(0, Math.min(1, p.y + dy)),
      });
    } else if (dragMode === 'resize-face') {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const sign = dx + dy > 0 ? 1 : -1;
      onPlacementChange({
        ...p,
        scale: Math.max(0.1, Math.min(5, p.scale + sign * dist * 3)),
      });
    } else if (dragMode === 'rotate-face') {
      const angle = Math.atan2(
        pos.ry - p.y,
        pos.rx - p.x,
      );
      const startAngle = Math.atan2(
        dragStart.current.my - p.y,
        dragStart.current.mx - p.x,
      );
      onPlacementChange({
        ...p,
        rotation: p.rotation + (angle - startAngle),
      });
    }
  }, [dragMode, getRelativePos, onPlacementChange]);

  const handlePointerUp = useCallback(() => {
    setDragMode('none');
  }, []);

  // Face overlay size (base = 120px displayed, scaled)
  const faceDisplaySize = 120 * placement.scale;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        border: `1px solid ${C.border}`,
        cursor: dragMode === 'move-face' ? 'grabbing' : 'default',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <img
        src={targetSrc}
        alt="Target image"
        draggable={false}
        style={{ width: '100%', display: 'block' }}
      />
      {faceSrc && (
        <div
          style={{
            position: 'absolute',
            left: `${placement.x * 100}%`,
            top: `${placement.y * 100}%`,
            transform: `translate(-50%, -50%) rotate(${placement.rotation}rad)`,
            width: faceDisplaySize,
            height: faceDisplaySize,
            pointerEvents: 'none',
          }}
        >
          {/* The face image */}
          <img
            src={faceSrc}
            alt="Face overlay"
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '50%',
              pointerEvents: 'auto',
              cursor: 'grab',
              opacity: 0.85,
            }}
            onPointerDown={(e) => handlePointerDown(e, 'move-face')}
          />
          {/* Outline ring */}
          <div
            style={{
              position: 'absolute',
              inset: -2,
              border: `2px dashed ${accentColor}`,
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
          {/* Resize handle (bottom-right) */}
          <div
            style={{
              position: 'absolute',
              right: -6,
              bottom: -6,
              width: 14,
              height: 14,
              borderRadius: 7,
              background: accentColor,
              border: '2px solid #fff',
              cursor: 'nwse-resize',
              boxShadow: '0 2px 6px rgba(0,0,0,.3)',
              pointerEvents: 'auto',
              zIndex: 3,
            }}
            onPointerDown={(e) => handlePointerDown(e, 'resize-face')}
          />
          {/* Rotate handle (top-right) */}
          <div
            style={{
              position: 'absolute',
              right: -6,
              top: -6,
              width: 14,
              height: 14,
              borderRadius: 7,
              background: '#fff',
              border: `2px solid ${accentColor}`,
              cursor: 'crosshair',
              boxShadow: '0 2px 6px rgba(0,0,0,.3)',
              pointerEvents: 'auto',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPointerDown={(e) => handlePointerDown(e, 'rotate-face')}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="3" strokeLinecap="round">
              <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── toggle switch ──────────────────────────────────────────────── */

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  accentColor,
  theme: C,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  accentColor: string;
  theme: ReturnType<typeof useThemeStore.getState>['theme'];
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 16, borderRadius: 12, border: `1px solid ${C.border}`,
      background: C.card, transition: 'all 0.2s ease',
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</div>
        <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none',
          background: checked ? accentColor : C.surface,
          cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease',
          boxShadow: checked ? `0 0 8px ${accentColor}55` : 'none',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: 9, background: '#fff',
          position: 'absolute', top: 3,
          left: checked ? 23 : 3,
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        }} />
      </button>
    </div>
  );
}

/* ─── slider control ─────────────────────────────────────────────── */

function SliderControl({
  label,
  value,
  min,
  max,
  onChange,
  unit,
  accentColor,
  theme: C,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit?: string;
  accentColor: string;
  theme: ReturnType<typeof useThemeStore.getState>['theme'];
}) {
  return (
    <div style={{
      padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>{value}{unit ?? '%'}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        style={{ width: '100%', accentColor }}
      />
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────── */

export function FaceSwap() {
  const C = useThemeStore((s) => s.theme);
  const ACCENT = '#f97316';
  const GRADIENT: [string, string] = ['#f97316', '#ef4444'];

  // File state
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  // Image URLs
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  // Face selection on source
  const [selection, setSelection] = useState<FaceSelection>({ cx: 0.5, cy: 0.4, rx: 0.2, ry: 0.25 });

  // Placement on target
  const [placement, setPlacement] = useState<Placement>({ x: 0.5, y: 0.4, scale: 1, rotation: 0 });

  // Preview of extracted face
  const [facePreviewUrl, setFacePreviewUrl] = useState<string | null>(null);

  // Settings
  const [blendStrength, setBlendStrength] = useState(90);
  const [featherEdge, setFeatherEdge] = useState(50);
  const [colorCorrection, setColorCorrection] = useState(true);

  // Processing state
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Before/after split view
  const [splitPos, setSplitPos] = useState(50);
  const [isSplitDragging, setIsSplitDragging] = useState(false);

  // Drag-over states for uploads
  const [sourceDragOver, setSourceDragOver] = useState(false);
  const [targetDragOver, setTargetDragOver] = useState(false);

  // Hover states
  const [downloadHover, setDownloadHover] = useState(false);

  // Load source URL
  useEffect(() => {
    if (!sourceFile) { setSourceUrl(null); return; }
    const url = URL.createObjectURL(sourceFile);
    setSourceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [sourceFile]);

  // Load target URL
  useEffect(() => {
    if (!targetFile) { setTargetUrl(null); return; }
    const url = URL.createObjectURL(targetFile);
    setTargetUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [targetFile]);

  // Update face preview when selection or feather changes
  useEffect(() => {
    if (!sourceFile) { setFacePreviewUrl(null); return; }
    let cancelled = false;

    loadImageFromFile(sourceFile).then((img) => {
      if (cancelled) return;
      const faceCanvas = extractFace(img, selection, featherEdge);
      const url = faceCanvas.toDataURL('image/png');
      setFacePreviewUrl(url);
    }).catch(() => {
      // ignore
    });

    return () => { cancelled = true; };
  }, [sourceFile, selection, featherEdge]);

  // Process face swap
  const handleSwap = useCallback(async () => {
    if (!sourceFile || !targetFile) return;
    setLoading(true);
    setDone(false);
    setError(null);
    setResultUrl(null);

    try {
      const [sourceImg, targetImg] = await Promise.all([
        loadImageFromFile(sourceFile),
        loadImageFromFile(targetFile),
      ]);

      // Use requestAnimationFrame to let UI update
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      // Extract face with feathered edges
      let faceCanvas = extractFace(sourceImg, selection, featherEdge);

      // Apply color correction if enabled
      if (colorCorrection) {
        faceCanvas = colorMatchFace(faceCanvas, targetImg, placement);
      }

      // Composite onto target
      const dataUrl = compositeFace(targetImg, faceCanvas, placement, blendStrength);

      if (!dataUrl) {
        throw new Error('Failed to create composite image');
      }

      setResultUrl(dataUrl);
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred during face swap';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [sourceFile, targetFile, selection, placement, blendStrength, featherEdge, colorCorrection]);

  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    const name = targetFile ? targetFile.name.replace(/\.[^/.]+$/, '') : 'faceswap';
    link.download = `faceswap_${name}.png`;
    link.click();
  }, [resultUrl, targetFile]);

  const handleSourceDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setSourceDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) {
      setSourceFile(f);
      setDone(false);
      setResultUrl(null);
      setError(null);
    }
  }, []);

  const handleTargetDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setTargetDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) {
      setTargetFile(f);
      setDone(false);
      setResultUrl(null);
      setError(null);
    }
  }, []);

  const handleSplitDrag = useCallback((e: React.MouseEvent) => {
    if (!isSplitDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPos(Math.max(5, Math.min(95, pos)));
  }, [isSplitDragging]);

  const handleResetSource = () => {
    setSourceFile(null);
    setFacePreviewUrl(null);
    setDone(false);
    setResultUrl(null);
    setError(null);
    setSelection({ cx: 0.5, cy: 0.4, rx: 0.2, ry: 0.25 });
  };

  const handleResetTarget = () => {
    setTargetFile(null);
    setDone(false);
    setResultUrl(null);
    setError(null);
    setPlacement({ x: 0.5, y: 0.4, scale: 1, rotation: 0 });
  };

  return (
    <ToolPageShell
      title="Face Swap"
      subtitle="Composite faces between images with Canvas blending and color correction"
      gradient={GRADIENT}
    >
      {/* Two Upload Areas Side by Side */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
        {/* Source Face Upload */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>
            Source Face
          </label>
          {!sourceFile || !sourceUrl ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setSourceDragOver(true); }}
              onDragLeave={() => setSourceDragOver(false)}
              onDrop={handleSourceDrop}
            >
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '48px 16px', borderRadius: 14,
                border: `2px dashed ${sourceDragOver ? ACCENT : C.border}`,
                background: sourceDragOver ? 'rgba(249,115,22,.06)' : C.surface,
                cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
                minHeight: 220,
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text, marginTop: 12 }}>Upload source face</span>
                <span style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Select the face area after upload</span>
                <span style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>JPG, PNG, WebP</span>
                <input
                  ref={sourceInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.type.startsWith('image/')) {
                      setSourceFile(f);
                      setDone(false);
                      setResultUrl(null);
                      setError(null);
                    }
                    if (e.target) e.target.value = '';
                  }}
                />
              </label>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <SourceSelector
                imgSrc={sourceUrl}
                selection={selection}
                onSelectionChange={setSelection}
                accentColor={ACCENT}
                theme={C}
              />
              <button
                onClick={handleResetSource}
                aria-label="Remove source image"
                style={{
                  position: 'absolute', top: 8, right: 8, zIndex: 5,
                  width: 28, height: 28, borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  background: C.card, color: C.dim, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div style={{
                marginTop: 8, fontSize: 11, color: C.dim, textAlign: 'center',
              }}>
                Drag the ellipse to select face area. Drag corner handle to resize.
              </div>
            </div>
          )}
        </div>

        {/* Arrow */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          paddingTop: 28,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </div>

        {/* Target Image Upload */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>
            Target Image
          </label>
          {!targetFile || !targetUrl ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setTargetDragOver(true); }}
              onDragLeave={() => setTargetDragOver(false)}
              onDrop={handleTargetDrop}
            >
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '48px 16px', borderRadius: 14,
                border: `2px dashed ${targetDragOver ? '#ef4444' : C.border}`,
                background: targetDragOver ? 'rgba(239,68,68,.06)' : C.surface,
                cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
                minHeight: 220,
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text, marginTop: 12 }}>Upload target image</span>
                <span style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Position the face on this image</span>
                <span style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>JPG, PNG, WebP</span>
                <input
                  ref={targetInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.type.startsWith('image/')) {
                      setTargetFile(f);
                      setDone(false);
                      setResultUrl(null);
                      setError(null);
                    }
                    if (e.target) e.target.value = '';
                  }}
                />
              </label>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <TargetCompositor
                targetSrc={targetUrl}
                faceSrc={facePreviewUrl}
                placement={placement}
                onPlacementChange={setPlacement}
                accentColor={ACCENT}
                theme={C}
              />
              <button
                onClick={handleResetTarget}
                aria-label="Remove target image"
                style={{
                  position: 'absolute', top: 8, right: 8, zIndex: 5,
                  width: 28, height: 28, borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  background: C.card, color: C.dim, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div style={{
                marginTop: 8, fontSize: 11, color: C.dim, textAlign: 'center',
              }}>
                Drag face to position. Bottom-right handle to resize. Top-right handle to rotate.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        <SliderControl
          label="Blend Strength"
          value={blendStrength}
          min={10}
          max={100}
          onChange={setBlendStrength}
          accentColor={ACCENT}
          theme={C}
        />
        <SliderControl
          label="Feather Edge"
          value={featherEdge}
          min={0}
          max={100}
          onChange={(v) => { setFeatherEdge(v); setDone(false); }}
          accentColor={ACCENT}
          theme={C}
        />
        <ToggleSwitch
          checked={colorCorrection}
          onChange={(v) => { setColorCorrection(v); setDone(false); }}
          label="Color Correction"
          description="Match face color tones to the target image"
          accentColor={ACCENT}
          theme={C}
        />
      </div>

      {/* Before/After Split View (shown when result is ready) */}
      {done && resultUrl && targetUrl && (
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>
            Before / After
          </label>
          <div
            style={{
              position: 'relative', borderRadius: 14, overflow: 'hidden',
              border: `1px solid ${C.border}`, height: 360,
              cursor: isSplitDragging ? 'col-resize' : 'default',
              userSelect: 'none',
            }}
            onMouseMove={handleSplitDrag}
            onMouseDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
              if (Math.abs(mouseX - splitPos) < 5) {
                setIsSplitDragging(true);
              }
            }}
            onMouseUp={() => setIsSplitDragging(false)}
            onMouseLeave={() => setIsSplitDragging(false)}
          >
            {/* Before side (original target) */}
            <div style={{
              position: 'absolute', inset: 0, background: C.surface,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img
                src={targetUrl}
                alt="Original target"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
              />
            </div>
            {/* After side (result) */}
            <div style={{
              position: 'absolute', inset: 0,
              clipPath: `inset(0 ${100 - splitPos}% 0 0)`,
              background: C.surface,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: isSplitDragging ? 'none' : 'clip-path 0.1s ease',
            }}>
              <img
                src={resultUrl}
                alt="Face swap result"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
              />
            </div>
            {/* Split handle */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${splitPos}%`, transform: 'translateX(-50%)',
              width: 4, background: ACCENT, cursor: 'col-resize',
              zIndex: 2,
            }}>
              <div
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 28, height: 28, borderRadius: 14,
                  background: ACCENT, border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,.2)',
                }}
                onMouseDown={(e) => { e.stopPropagation(); setIsSplitDragging(true); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="8 4 4 8 8 12" /><polyline points="16 4 20 8 16 12" />
                </svg>
              </div>
            </div>
            {/* Labels */}
            <div style={{
              position: 'absolute', top: 12, left: 12, fontSize: 11, fontWeight: 700,
              color: C.dim, background: C.card, padding: '2px 8px', borderRadius: 6, zIndex: 1,
            }}>Before</div>
            <div style={{
              position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 700,
              color: ACCENT, background: C.card, padding: '2px 8px', borderRadius: 6, zIndex: 1,
            }}>After</div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
          border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)', marginBottom: 16,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{error}</span>
        </div>
      )}

      {/* Done status */}
      {done && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
          border: `1px solid rgba(249,115,22,.3)`, background: 'rgba(249,115,22,.06)', marginBottom: 16,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Face swap completed successfully</span>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <ActionButton
          label={done ? 'Swap Again' : 'Swap Faces'}
          gradient={GRADIENT}
          onClick={handleSwap}
          disabled={!sourceFile || !targetFile}
          loading={loading}
        />
        {done && resultUrl && (
          <button
            onClick={handleDownload}
            onMouseEnter={() => setDownloadHover(true)}
            onMouseLeave={() => setDownloadHover(false)}
            style={{
              padding: '12px 32px', borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: downloadHover ? C.surface : C.card,
              color: C.text, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PNG
          </button>
        )}
      </div>

      {/* Ethical Disclaimer */}
      <div style={{
        padding: 14, borderRadius: 10,
        background: 'rgba(249,115,22,.06)',
        border: '1px solid rgba(249,115,22,.2)',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>Ethical Usage Disclaimer</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.5 }}>
            This tool is intended for entertainment and creative purposes only. Do not use face swap
            technology to create misleading, harmful, or non-consensual content. Misuse may violate
            laws and regulations. Always obtain consent before using someone&apos;s likeness.
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}
