'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

type BgOption = 'transparent' | 'solid' | 'gradient' | 'blur' | 'custom';

const BG_OPTIONS: { id: BgOption; label: string; icon: string }[] = [
  { id: 'transparent', label: 'Transparent', icon: '\u25FB' },
  { id: 'solid', label: 'Solid Color', icon: '\u25FC' },
  { id: 'gradient', label: 'Gradient', icon: '\u25E7' },
  { id: 'blur', label: 'Blur', icon: '\u25C9' },
  { id: 'custom', label: 'Custom Image', icon: '\u25EB' },
];

/* ─── helpers ────────────────────────────────────────────────────── */

/** Euclidean distance in RGB space */
function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/** Sample corner pixels to estimate the dominant background color */
function estimateBgColor(data: Uint8ClampedArray, w: number, h: number): [number, number, number] {
  const sampleSize = Math.max(1, Math.floor(Math.min(w, h) * 0.05));
  const corners: [number, number][] = [];

  // top-left, top-right, bottom-left, bottom-right
  for (let y = 0; y < sampleSize; y++) {
    for (let x = 0; x < sampleSize; x++) {
      corners.push([x, y]);
      corners.push([w - 1 - x, y]);
      corners.push([x, h - 1 - y]);
      corners.push([w - 1 - x, h - 1 - y]);
    }
  }

  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (const [x, y] of corners) {
    const i = (y * w + x) * 4;
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
    count++;
  }
  return [Math.round(rSum / count), Math.round(gSum / count), Math.round(bSum / count)];
}

/** Apply box-blur on the alpha channel only (in-place). radius is the half-width. */
function blurAlpha(data: Uint8ClampedArray, w: number, h: number, radius: number): void {
  if (radius < 1) return;
  const len = w * h;
  const alphas = new Float32Array(len);
  const buf = new Float32Array(len);

  // extract alpha
  for (let i = 0; i < len; i++) alphas[i] = data[i * 4 + 3];

  // horizontal pass
  for (let y = 0; y < h; y++) {
    let sum = 0;
    const rowOff = y * w;
    // init window
    for (let x = 0; x <= radius && x < w; x++) sum += alphas[rowOff + x];
    for (let x = 0; x < w; x++) {
      const left = x - radius - 1;
      const right = x + radius;
      if (right < w) sum += alphas[rowOff + right];
      if (left >= 0) sum -= alphas[rowOff + left];
      const span = Math.min(right, w - 1) - Math.max(left + 1, 0) + 1;
      buf[rowOff + x] = sum / span;
    }
  }

  // vertical pass
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = 0; y <= radius && y < h; y++) sum += buf[y * w + x];
    for (let y = 0; y < h; y++) {
      const top = y - radius - 1;
      const bot = y + radius;
      if (bot < h) sum += buf[bot * w + x];
      if (top >= 0) sum -= buf[top * w + x];
      const span = Math.min(bot, h - 1) - Math.max(top + 1, 0) + 1;
      alphas[y * w + x] = sum / span;
    }
  }

  // write back
  for (let i = 0; i < len; i++) data[i * 4 + 3] = Math.round(alphas[i]);
}

/** Hex to RGB */
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* ─── main processing ─────────────────────────────────────────── */

interface ProcessResult {
  /** Data URL of the processed (transparent background) image */
  transparentDataUrl: string;
  /** Data URL of the final composited image (with replacement bg) */
  resultDataUrl: string;
  /** Data URL of the original loaded image */
  originalDataUrl: string;
}

function processImage(
  img: HTMLImageElement,
  bgOption: BgOption,
  solidColor: string,
  edgeSmoothing: number,
  onProgress: (pct: number) => void,
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    try {
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      // --- draw original ---
      const origCanvas = document.createElement('canvas');
      origCanvas.width = w;
      origCanvas.height = h;
      const origCtx = origCanvas.getContext('2d', { willReadFrequently: true });
      if (!origCtx) { reject(new Error('\u041E\u0448\u0438\u0431\u043A\u0430: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C canvas-\u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442')); return; }
      origCtx.drawImage(img, 0, 0);
      const originalDataUrl = origCanvas.toDataURL('image/png');

      onProgress(10);

      const srcData = origCtx.getImageData(0, 0, w, h);
      const pixels = srcData.data;

      // --- estimate bg color ---
      const [bgR, bgG, bgB] = estimateBgColor(pixels, w, h);

      onProgress(20);

      // --- create alpha mask ---
      // edgeSmoothing 0..100  -->  threshold 15..80 (lower smoothing = tighter threshold)
      const baseThreshold = 15 + (100 - edgeSmoothing) * 0.65;
      // feather range for soft edges
      const featherRange = 10 + edgeSmoothing * 0.4;

      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = w;
      resultCanvas.height = h;
      const resultCtx = resultCanvas.getContext('2d', { willReadFrequently: true });
      if (!resultCtx) { reject(new Error('\u041E\u0448\u0438\u0431\u043A\u0430: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C canvas-\u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442')); return; }
      resultCtx.drawImage(img, 0, 0);
      const resultImgData = resultCtx.getImageData(0, 0, w, h);
      const rd = resultImgData.data;

      const totalPixels = w * h;
      for (let i = 0; i < totalPixels; i++) {
        const off = i * 4;
        const dist = colorDist(rd[off], rd[off + 1], rd[off + 2], bgR, bgG, bgB);

        if (dist < baseThreshold) {
          // definitely background
          rd[off + 3] = 0;
        } else if (dist < baseThreshold + featherRange) {
          // feather zone -- partial transparency
          const alpha = ((dist - baseThreshold) / featherRange) * 255;
          rd[off + 3] = Math.round(Math.min(255, alpha));
        }
        // else keep original alpha

        // report progress every ~10%
        if (i % Math.floor(totalPixels / 8) === 0) {
          onProgress(20 + Math.round((i / totalPixels) * 50));
        }
      }

      onProgress(75);

      // --- edge smoothing via alpha-channel blur ---
      const blurRadius = Math.round(edgeSmoothing / 25); // 0..4
      if (blurRadius > 0) {
        blurAlpha(rd, w, h, blurRadius);
      }

      resultCtx.putImageData(resultImgData, 0, 0);
      const transparentDataUrl = resultCanvas.toDataURL('image/png');

      onProgress(85);

      // --- compose replacement background ---
      const compCanvas = document.createElement('canvas');
      compCanvas.width = w;
      compCanvas.height = h;
      const compCtx = compCanvas.getContext('2d');
      if (!compCtx) { reject(new Error('\u041E\u0448\u0438\u0431\u043A\u0430: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C canvas-\u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442')); return; }

      if (bgOption === 'solid') {
        compCtx.fillStyle = solidColor;
        compCtx.fillRect(0, 0, w, h);
      } else if (bgOption === 'gradient') {
        const grad = compCtx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#8b5cf6');
        grad.addColorStop(1, '#3b82f6');
        compCtx.fillStyle = grad;
        compCtx.fillRect(0, 0, w, h);
      } else if (bgOption === 'blur') {
        // draw blurred original as background
        compCtx.filter = 'blur(20px)';
        compCtx.drawImage(img, -20, -20, w + 40, h + 40);
        compCtx.filter = 'none';
      }
      // transparent / custom: leave blank (transparent)

      // draw foreground on top
      compCtx.drawImage(resultCanvas, 0, 0);

      const resultDataUrl = bgOption === 'transparent'
        ? transparentDataUrl
        : compCanvas.toDataURL('image/png');

      onProgress(100);

      resolve({ transparentDataUrl, resultDataUrl, originalDataUrl });
    } catch (err) {
      reject(err);
    }
  });
}

/* ─── component ───────────────────────────────────────────────── */

export function BackgroundRemover() {
  const C = useThemeStore((s) => s.theme);

  const [file, setFile] = useState<File | null>(null);
  const [bgOption, setBgOption] = useState<BgOption>('transparent');
  const [solidColor, setSolidColor] = useState('#ffffff');
  const [edgeSmoothing, setEdgeSmoothing] = useState(50);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBg, setHoveredBg] = useState<string | null>(null);
  const [downloadHover, setDownloadHover] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const splitRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvas result data URLs
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [transparentUrl, setTransparentUrl] = useState<string | null>(null);

  // Load original preview when file is selected
  useEffect(() => {
    if (!file) { setOriginalUrl(null); return; }
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleRemove = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setDone(false);
    setError(null);
    setProgress(0);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const objectUrl = URL.createObjectURL(file);

      await new Promise<void>((resolveLoad, rejectLoad) => {
        img.onload = () => resolveLoad();
        img.onerror = () => rejectLoad(new Error('\u041E\u0448\u0438\u0431\u043A\u0430: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u043E\u0439 \u0444\u0430\u0439\u043B.'));
        img.src = objectUrl;
      });

      // Use requestAnimationFrame to allow UI to update between heavy processing
      const result = await new Promise<ProcessResult>((resolveProcess, rejectProcess) => {
        requestAnimationFrame(() => {
          processImage(img, bgOption, solidColor, edgeSmoothing, setProgress)
            .then(resolveProcess)
            .catch(rejectProcess);
        });
      });

      URL.revokeObjectURL(objectUrl);
      setOriginalUrl(result.originalDataUrl);
      setResultUrl(result.resultDataUrl);
      setTransparentUrl(result.transparentDataUrl);
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [file, bgOption, solidColor, edgeSmoothing]);

  const handleDownload = useCallback(() => {
    const url = resultUrl || transparentUrl;
    if (!url || !file) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `nobg_${file.name.replace(/\.[^/.]+$/, '')}.png`;
    link.click();
  }, [resultUrl, transparentUrl, file]);

  const handleReset = () => {
    setFile(null);
    setDone(false);
    setError(null);
    setSplitPos(50);
    setBgOption('transparent');
    setEdgeSmoothing(50);
    setOriginalUrl(null);
    setResultUrl(null);
    setTransparentUrl(null);
    setProgress(0);
  };

  const handleSplitDrag = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPos(Math.max(5, Math.min(95, pos)));
  }, [isDragging]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setDone(false);
      setError(null);
      setResultUrl(null);
      setTransparentUrl(null);
    }
  }, []);

  // Checkerboard pattern for transparent bg
  const checkerBg = `repeating-conic-gradient(${C.surface} 0% 25%, ${C.card} 0% 50%) 0 0 / 16px 16px`;

  return (
    <ToolPageShell
      title="Background Remover"
      subtitle="Remove and replace image backgrounds with AI precision"
      gradient={['#8b5cf6', '#7c3aed']}
    >
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
        >
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', borderRadius: 16,
            border: `2px dashed ${dragOver ? '#8b5cf6' : C.border}`,
            background: dragOver ? 'rgba(139,92,246,.06)' : C.surface,
            cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 12 }}>
              Drop image here or click to upload
            </span>
            <span style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
              JPG, PNG, WebP
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setFile(f); setDone(false); setError(null); setResultUrl(null); setTransparentUrl(null); }
              }}
            />
          </label>
        </div>
      ) : (
        <div>
          {/* File info bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12,
            border: `1px solid ${C.border}`, background: C.card, marginBottom: 16,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: 11, color: C.dim }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            <button
              onClick={handleReset}
              onMouseEnter={() => setRemoveHover(true)}
              onMouseLeave={() => setRemoveHover(false)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: removeHover ? C.surface : C.card,
                color: C.sub, fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
                minHeight: 44, flexShrink: 0,
              }}
            >
              Remove
            </button>
          </div>

          {/* Before/After Split View */}
          <div
            ref={splitRef}
            style={{
              position: 'relative', borderRadius: 14, overflow: 'hidden',
              border: `1px solid ${C.border}`, marginBottom: 24,
              height: 'auto', minHeight: 200, maxHeight: '60vh',
              aspectRatio: '16/10',
              cursor: isDragging ? 'col-resize' : 'default',
              userSelect: 'none',
            }}
            onMouseMove={handleSplitDrag}
            onMouseDown={(e) => {
              // Only start dragging if near the split line
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
              if (Math.abs(mouseX - splitPos) < 5) {
                setIsDragging(true);
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            {/* Before side */}
            <div style={{
              position: 'absolute', inset: 0,
              background: C.surface,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {originalUrl ? (
                <img
                  src={originalUrl}
                  alt="Original"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" opacity={0.5}>
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 8 }}>Original</div>
                </div>
              )}
            </div>
            {/* After side (clipped) */}
            <div style={{
              position: 'absolute', inset: 0,
              clipPath: `inset(0 ${100 - splitPos}% 0 0)`,
              background: done && bgOption === 'transparent' ? checkerBg : done ? C.surface : C.card,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: isDragging ? 'none' : 'clip-path 0.1s ease',
            }}>
              {done && resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Result"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" opacity={0.5}>
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 8 }}>Result</div>
                </div>
              )}
            </div>
            {/* Split handle */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${splitPos}%`, transform: 'translateX(-50%)',
              width: 4, background: '#8b5cf6', cursor: 'col-resize',
              zIndex: 2,
            }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 28, height: 28, borderRadius: 14,
                background: '#8b5cf6', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,.2)',
                transition: 'transform 0.2s ease',
              }}
                onMouseDown={(e) => { e.stopPropagation(); setIsDragging(true); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="8 4 4 8 8 12" /><polyline points="16 4 20 8 16 12" />
                </svg>
              </div>
            </div>
            {/* Labels */}
            <div style={{ position: 'absolute', top: 12, left: 12, fontSize: 11, fontWeight: 700, color: C.dim, background: C.card, padding: '2px 8px', borderRadius: 6, zIndex: 1 }}>Before</div>
            <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 700, color: '#8b5cf6', background: C.card, padding: '2px 8px', borderRadius: 6, zIndex: 1 }}>After</div>
          </div>

          {/* Background Replacement Options */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Background Replacement</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {BG_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setBgOption(opt.id)}
                  onMouseEnter={() => setHoveredBg(opt.id)}
                  onMouseLeave={() => setHoveredBg(null)}
                  style={{
                    padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    border: bgOption === opt.id ? '2px solid #8b5cf6' : `1px solid ${C.border}`,
                    background: bgOption === opt.id ? 'rgba(139,92,246,.1)' : hoveredBg === opt.id ? C.surface : C.card,
                    color: bgOption === opt.id ? '#8b5cf6' : C.text,
                    cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6,
                    minHeight: 44,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker for Solid Color option */}
          {bgOption === 'solid' && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: 16,
              borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, marginBottom: 20,
            }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>Color</label>
              <input
                type="color"
                value={solidColor}
                onChange={(e) => setSolidColor(e.target.value)}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`,
                  cursor: 'pointer', padding: 2,
                }}
              />
              <span style={{ fontSize: 13, color: C.dim, fontFamily: 'monospace' }}>{solidColor}</span>
            </div>
          )}

          {/* Edge Smoothing */}
          <div style={{
            padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, marginBottom: 28,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Edge Smoothing</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>{edgeSmoothing}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={edgeSmoothing}
              onChange={(e) => setEdgeSmoothing(Number(e.target.value))}
              aria-label="Edge smoothing"
              style={{ width: '100%', accentColor: '#8b5cf6' }}
            />
          </div>

          {/* Progress indicator */}
          {loading && (
            <div style={{
              padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, marginBottom: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{'\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F...'}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#8b5cf6' }}>{progress}%</span>
              </div>
              <div style={{
                width: '100%', height: 6, borderRadius: 3, background: C.surface, overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress}%`, height: '100%', borderRadius: 3,
                  background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
                  transition: 'width 0.3s ease',
                }} />
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
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, wordBreak: 'break-word', minWidth: 0 }}>{error}</span>
            </div>
          )}

          {/* Done status */}
          {done && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
              border: '1px solid rgba(139,92,246,.3)', background: 'rgba(139,92,246,.06)', marginBottom: 16,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{'\u0424\u043E\u043D \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D'}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <ActionButton
              label={done ? 'Remove Again' : 'Remove Background'}
              gradient={['#8b5cf6', '#7c3aed']}
              onClick={handleRemove}
              loading={loading}
            />
            {done && (
              <button
                onClick={handleDownload}
                onMouseEnter={() => setDownloadHover(true)}
                onMouseLeave={() => setDownloadHover(false)}
                style={{
                  padding: '12px 24px', borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: downloadHover ? C.surface : C.card,
                  color: C.text, fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 8,
                  minHeight: 44,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PNG
              </button>
            )}
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
