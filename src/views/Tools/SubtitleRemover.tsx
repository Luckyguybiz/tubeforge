'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#ef4444', '#f97316'];

/* ─── types ──────────────────────────────────────────────────── */

interface MaskRegion {
  id: string;
  x: number;      // % of video width
  y: number;      // % of video height
  width: number;  // % of video width
  height: number; // % of video height
}

type RemovalMethod = 'blur' | 'color' | 'pixelate';

const REMOVAL_METHODS: { id: RemovalMethod; label: string; desc: string }[] = [
  { id: 'blur', label: 'Blur', desc: 'Gaussian blur over region' },
  { id: 'pixelate', label: 'Pixelate', desc: 'Mosaic pixelation effect' },
  { id: 'color', label: 'Color Fill', desc: 'Fill with surrounding color' },
];

/* ─── image processing helpers ───────────────────────────────── */

function boxBlur(imageData: ImageData, radius: number): ImageData {
  const { width, height, data } = imageData;
  const out = new Uint8ClampedArray(data);
  const kSize = radius * 2 + 1;

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let kx = -radius; kx <= radius; kx++) {
        const sx = Math.min(Math.max(x + kx, 0), width - 1);
        const idx = (y * width + sx) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        a += data[idx + 3];
        count++;
      }
      const idx = (y * width + x) * 4;
      out[idx] = r / count;
      out[idx + 1] = g / count;
      out[idx + 2] = b / count;
      out[idx + 3] = a / count;
    }
  }

  // Vertical pass on the horizontal result
  const out2 = new Uint8ClampedArray(out);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let ky = -radius; ky <= radius; ky++) {
        const sy = Math.min(Math.max(y + ky, 0), height - 1);
        const idx = (sy * width + x) * 4;
        r += out[idx];
        g += out[idx + 1];
        b += out[idx + 2];
        a += out[idx + 3];
        count++;
      }
      const idx = (y * width + x) * 4;
      out2[idx] = r / count;
      out2[idx + 1] = g / count;
      out2[idx + 2] = b / count;
      out2[idx + 3] = a / count;
    }
  }

  // Multi-pass for stronger blur
  const result = new ImageData(new Uint8ClampedArray(out2), width, height);
  return result;
}

function pixelate(imageData: ImageData, blockSize: number): ImageData {
  const { width, height, data } = imageData;
  const out = new Uint8ClampedArray(data);

  for (let by = 0; by < height; by += blockSize) {
    for (let bx = 0; bx < width; bx += blockSize) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      const bw = Math.min(blockSize, width - bx);
      const bh = Math.min(blockSize, height - by);

      for (let y = by; y < by + bh; y++) {
        for (let x = bx; x < bx + bw; x++) {
          const idx = (y * width + x) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          a += data[idx + 3];
          count++;
        }
      }

      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      a = Math.round(a / count);

      for (let y = by; y < by + bh; y++) {
        for (let x = bx; x < bx + bw; x++) {
          const idx = (y * width + x) * 4;
          out[idx] = r;
          out[idx + 1] = g;
          out[idx + 2] = b;
          out[idx + 3] = a;
        }
      }
    }
  }

  return new ImageData(out, width, height);
}

function sampleSurrounding(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  videoWidth: number, videoHeight: number,
): string {
  const samplePoints: [number, number][] = [];
  const margin = 4;

  // Sample pixels around the region border
  for (let i = 0; i < 20; i++) {
    // Top edge
    const tx = Math.min(Math.max(x + Math.round((w / 20) * i), 0), videoWidth - 1);
    const topY = Math.max(y - margin, 0);
    samplePoints.push([tx, topY]);
    // Bottom edge
    const botY = Math.min(y + h + margin, videoHeight - 1);
    samplePoints.push([tx, botY]);
    // Left edge
    const ty = Math.min(Math.max(y + Math.round((h / 20) * i), 0), videoHeight - 1);
    const leftX = Math.max(x - margin, 0);
    samplePoints.push([leftX, ty]);
    // Right edge
    const rightX = Math.min(x + w + margin, videoWidth - 1);
    samplePoints.push([rightX, ty]);
  }

  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (const [sx, sy] of samplePoints) {
    if (sx >= 0 && sx < videoWidth && sy >= 0 && sy < videoHeight) {
      const pixel = ctx.getImageData(sx, sy, 1, 1).data;
      rSum += pixel[0];
      gSum += pixel[1];
      bSum += pixel[2];
      count++;
    }
  }

  if (count === 0) return 'rgb(0,0,0)';
  return `rgb(${Math.round(rSum / count)},${Math.round(gSum / count)},${Math.round(bSum / count)})`;
}

function applyRemoval(
  ctx: CanvasRenderingContext2D,
  regions: MaskRegion[],
  method: RemovalMethod,
  videoWidth: number,
  videoHeight: number,
  blurStrength: number,
  pixelSize: number,
) {
  for (const region of regions) {
    const x = Math.round((region.x / 100) * videoWidth);
    const y = Math.round((region.y / 100) * videoHeight);
    const w = Math.round((region.width / 100) * videoWidth);
    const h = Math.round((region.height / 100) * videoHeight);

    if (w <= 0 || h <= 0) continue;

    const cx = Math.max(0, Math.min(x, videoWidth));
    const cy = Math.max(0, Math.min(y, videoHeight));
    const cw = Math.min(w, videoWidth - cx);
    const ch = Math.min(h, videoHeight - cy);

    if (cw <= 0 || ch <= 0) continue;

    if (method === 'blur') {
      const imageData = ctx.getImageData(cx, cy, cw, ch);
      // Multiple blur passes for stronger effect
      let blurred = imageData;
      const passes = Math.max(1, Math.ceil(blurStrength / 5));
      for (let i = 0; i < passes; i++) {
        blurred = boxBlur(blurred, Math.max(2, Math.floor(blurStrength / passes)));
      }
      ctx.putImageData(blurred, cx, cy);
    } else if (method === 'pixelate') {
      const imageData = ctx.getImageData(cx, cy, cw, ch);
      const pixelated = pixelate(imageData, Math.max(2, pixelSize));
      ctx.putImageData(pixelated, cx, cy);
    } else if (method === 'color') {
      const color = sampleSurrounding(ctx, cx, cy, cw, ch, videoWidth, videoHeight);
      ctx.fillStyle = color;
      ctx.fillRect(cx, cy, cw, ch);
    }
  }
}

/* ─── component ──────────────────────────────────────────────── */

export function SubtitleRemover() {
  const C = useThemeStore((s) => s.theme);

  // File and video state
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Region drawing state
  const [regions, setRegions] = useState<MaskRegion[]>([]);
  const [drawingRegion, setDrawingRegion] = useState<{ startX: number; startY: number } | null>(null);
  const [currentRegion, setCurrentRegion] = useState<MaskRegion | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  // Processing options
  const [method, setMethod] = useState<RemovalMethod>('blur');
  const [blurStrength, setBlurStrength] = useState(12);
  const [pixelSize, setPixelSize] = useState(10);

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exported, setExported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewActive, setPreviewActive] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const downloadUrlRef = useRef<string | null>(null);

  // Create video URL when file changes
  useEffect(() => {
    if (!file) {
      setVideoUrl(null);
      setVideoReady(false);
      setRegions([]);
      setExported(false);
      setError(null);
      setPreviewActive(false);
      if (downloadUrlRef.current) {
        URL.revokeObjectURL(downloadUrlRef.current);
        downloadUrlRef.current = null;
      }
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Draw preview frame loop
  const drawPreviewFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused && !previewActive) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    if (regions.length > 0) {
      applyRemoval(ctx, regions, method, video.videoWidth, video.videoHeight, blurStrength, pixelSize);
    }

    animFrameRef.current = requestAnimationFrame(drawPreviewFrame);
  }, [regions, method, blurStrength, pixelSize, previewActive]);

  // Start/stop preview loop
  useEffect(() => {
    if (previewActive && videoReady) {
      animFrameRef.current = requestAnimationFrame(drawPreviewFrame);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [previewActive, videoReady, drawPreviewFrame]);

  // Video event handlers
  const handleVideoLoaded = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setVideoDimensions({ w: video.videoWidth, h: video.videoHeight });
    setVideoReady(true);

    // Set canvas dimensions
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Draw initial frame
    const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(video, 0, 0);
    }
  }, []);

  // Toggle preview
  const togglePreview = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (previewActive) {
      video.pause();
      setPreviewActive(false);
    } else {
      video.play().catch(() => {/* ignore autoplay block */});
      setPreviewActive(true);
    }
  }, [previewActive]);

  // Refresh single frame preview (when not playing)
  const refreshPreview = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    if (regions.length > 0) {
      applyRemoval(ctx, regions, method, video.videoWidth, video.videoHeight, blurStrength, pixelSize);
    }
  }, [regions, method, blurStrength, pixelSize]);

  // Refresh preview when options change
  useEffect(() => {
    if (videoReady && !previewActive) {
      refreshPreview();
    }
  }, [regions, method, blurStrength, pixelSize, videoReady, previewActive, refreshPreview]);

  // Mouse handlers for drawing regions
  const getRelativePosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const overlay = overlayRef.current;
    if (!overlay) return null;
    const rect = overlay.getBoundingClientRect();

    let clientX: number, clientY: number;
    if ('touches' in e) {
      const touch = e.touches[0] || (e as React.TouchEvent).changedTouches[0];
      if (!touch) return null;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }, []);

  const handleDrawStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Don't start drawing if clicking on existing region close button
    const target = e.target as HTMLElement;
    if (target.dataset?.regionClose) return;

    const pos = getRelativePosition(e);
    if (!pos) return;
    setDrawingRegion({ startX: pos.x, startY: pos.y });
    setSelectedRegionId(null);
    setCurrentRegion({
      id: `region-${Date.now()}`,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
    });
  }, [getRelativePosition]);

  const handleDrawMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRegion) return;
    const pos = getRelativePosition(e);
    if (!pos) return;

    const x = Math.min(drawingRegion.startX, pos.x);
    const y = Math.min(drawingRegion.startY, pos.y);
    const width = Math.abs(pos.x - drawingRegion.startX);
    const height = Math.abs(pos.y - drawingRegion.startY);

    setCurrentRegion((prev) =>
      prev ? { ...prev, x, y, width, height } : null,
    );
  }, [drawingRegion, getRelativePosition]);

  const handleDrawEnd = useCallback(() => {
    if (!drawingRegion || !currentRegion) {
      setDrawingRegion(null);
      setCurrentRegion(null);
      return;
    }

    // Only add if region has meaningful size
    if (currentRegion.width > 1 && currentRegion.height > 1) {
      setRegions((prev) => [...prev, currentRegion]);
    }

    setDrawingRegion(null);
    setCurrentRegion(null);
  }, [drawingRegion, currentRegion]);

  const removeRegion = useCallback((id: string) => {
    setRegions((prev) => prev.filter((r) => r.id !== id));
    if (selectedRegionId === id) setSelectedRegionId(null);
  }, [selectedRegionId]);

  const clearAllRegions = useCallback(() => {
    setRegions([]);
    setSelectedRegionId(null);
  }, []);

  // Export processed video using MediaRecorder
  const handleExport = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || regions.length === 0) return;

    setProcessing(true);
    setProgress(0);
    setExported(false);
    setError(null);

    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }

    try {
      // Setup canvas stream
      const stream = canvas.captureStream(30);

      // Try to capture audio from video
      let hasAudio = false;
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);
        const audioTrack = dest.stream.getAudioTracks()[0];
        if (audioTrack) {
          stream.addTrack(audioTrack);
          hasAudio = true;
        }
      } catch {
        // Audio capture not supported or no audio track; continue without audio
      }

      // Determine supported MIME type
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
      let mimeType = '';
      for (const mt of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mt)) {
          mimeType = mt;
          break;
        }
      }

      if (!mimeType) {
        throw new Error('No supported video recording format found in this browser.');
      }

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5_000_000,
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      const recordingDone = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      recorder.start(100); // Collect data every 100ms

      // Play video from start and draw processed frames
      video.currentTime = 0;
      await new Promise<void>((r) => {
        video.onseeked = () => r();
      });

      const duration = video.duration;
      video.playbackRate = 1;
      await video.play();

      // Monitor progress
      const progressInterval = setInterval(() => {
        if (video.currentTime > 0 && duration > 0) {
          setProgress(Math.min(99, Math.round((video.currentTime / duration) * 100)));
        }
      }, 200);

      // Draw frames during playback
      const drawLoop = () => {
        if (video.ended || video.paused) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          applyRemoval(ctx, regions, method, video.videoWidth, video.videoHeight, blurStrength, pixelSize);
        }
        requestAnimationFrame(drawLoop);
      };
      requestAnimationFrame(drawLoop);

      // Wait for video to end
      await new Promise<void>((resolve) => {
        video.onended = () => resolve();
        // Safety timeout: 5 minutes max
        setTimeout(() => {
          if (!video.ended) {
            video.pause();
            resolve();
          }
        }, 300_000);
      });

      clearInterval(progressInterval);

      // Stop recording
      recorder.stop();
      await recordingDone;

      // Create download blob
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      downloadUrlRef.current = url;

      setProgress(100);
      setExported(true);
      video.pause();
      video.currentTime = 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during export.');
    } finally {
      setProcessing(false);
      mediaRecorderRef.current = null;
    }
  }, [regions, method, blurStrength, pixelSize]);

  const handleDownload = useCallback(() => {
    if (!downloadUrlRef.current || !file) return;
    const a = document.createElement('a');
    a.href = downloadUrlRef.current;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_cleaned.webm`;
    a.click();
  }, [file]);

  const handleReset = useCallback(() => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
    setFile(null);
    setVideoUrl(null);
    setVideoReady(false);
    setRegions([]);
    setExported(false);
    setError(null);
    setPreviewActive(false);
    setProgress(0);
    setProcessing(false);
    setSelectedRegionId(null);
  }, []);

  return (
    <ToolPageShell
      title="Subtitle & Watermark Remover"
      subtitle="Remove hardcoded subtitles and watermarks from videos using region masking"
      gradient={GRADIENT}
      badge="VIDEO"
      badgeColor="#ef4444"
    >
      {!file ? (
        /* ── Upload state ────────────────────────────────────── */
        <UploadArea
          C={C}
          accept="video/*"
          onFile={setFile}
          label="Drop your video file here"
        />
      ) : (
        /* ── Main working UI ─────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* File info bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12,
            border: `1px solid ${C.border}`, background: C.card, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', wordBreak: 'break-word' }}>{file.name}</p>
              <p style={{ fontSize: 11, color: C.dim, margin: '2px 0 0' }}>
                {(file.size / (1024 * 1024)).toFixed(1)} MB
                {videoDimensions.w > 0 && ` \u2022 ${videoDimensions.w}\u00D7${videoDimensions.h}`}
              </p>
            </div>
            <button
              onClick={handleReset}
              aria-label="Remove video file"
              style={{
                padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.card, color: C.sub, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
                minHeight: 44, flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = GRADIENT[0]; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.sub; }}
            >
              Remove
            </button>
          </div>

          {/* Two column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>

            {/* ── Left: Video preview with overlay ─────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>
                  Video Preview
                </h3>
                <span style={{ fontSize: 11, color: C.dim }}>
                  Draw rectangles over areas to remove
                </span>
              </div>

              {/* Video + canvas + overlay container */}
              <div style={{
                position: 'relative', borderRadius: 14, overflow: 'hidden',
                border: `1px solid ${C.border}`, background: '#000',
                aspectRatio: videoDimensions.w > 0 ? `${videoDimensions.w}/${videoDimensions.h}` : '16/9',
              }}>
                {/* Hidden video for source */}
                <video
                  ref={videoRef}
                  src={videoUrl ?? undefined}
                  onLoadedMetadata={handleVideoLoaded}
                  style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
                  crossOrigin="anonymous"
                  playsInline
                  muted
                  preload="auto"
                />

                {/* Canvas showing processed output */}
                <canvas
                  ref={canvasRef}
                  style={{
                    width: '100%', height: '100%',
                    display: 'block',
                    objectFit: 'contain',
                  }}
                />

                {/* Interactive overlay for drawing regions */}
                <div
                  ref={overlayRef}
                  style={{
                    position: 'absolute', inset: 0,
                    cursor: 'crosshair',
                    touchAction: 'none',
                  }}
                  onMouseDown={handleDrawStart}
                  onMouseMove={handleDrawMove}
                  onMouseUp={handleDrawEnd}
                  onMouseLeave={handleDrawEnd}
                  onTouchStart={handleDrawStart}
                  onTouchMove={handleDrawMove}
                  onTouchEnd={handleDrawEnd}
                >
                  {/* Existing regions */}
                  {regions.map((r) => (
                    <div
                      key={r.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedRegionId(r.id); }}
                      style={{
                        position: 'absolute',
                        left: `${r.x}%`,
                        top: `${r.y}%`,
                        width: `${r.width}%`,
                        height: `${r.height}%`,
                        border: `2px ${selectedRegionId === r.id ? 'solid' : 'dashed'} ${GRADIENT[0]}`,
                        background: `${GRADIENT[0]}15`,
                        borderRadius: 2,
                        boxSizing: 'border-box',
                        transition: 'border 0.15s ease',
                      }}
                    >
                      {/* Delete button */}
                      <button
                        data-region-close="true"
                        onClick={(e) => { e.stopPropagation(); removeRegion(r.id); }}
                        style={{
                          position: 'absolute', top: -8, right: -8,
                          width: 18, height: 18, borderRadius: '50%',
                          background: GRADIENT[0], border: 'none',
                          color: '#fff', fontSize: 11, fontWeight: 700,
                          cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          lineHeight: 1, padding: 0,
                          zIndex: 10,
                        }}
                      >
                        &times;
                      </button>
                      {/* Region label */}
                      <span style={{
                        position: 'absolute', top: 2, left: 4,
                        fontSize: 9, fontWeight: 700, color: GRADIENT[0],
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        pointerEvents: 'none',
                      }}>
                        Region {regions.indexOf(r) + 1}
                      </span>
                    </div>
                  ))}

                  {/* Currently drawing region */}
                  {currentRegion && currentRegion.width > 0 && currentRegion.height > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${currentRegion.x}%`,
                        top: `${currentRegion.y}%`,
                        width: `${currentRegion.width}%`,
                        height: `${currentRegion.height}%`,
                        border: `2px solid ${GRADIENT[1]}`,
                        background: `${GRADIENT[1]}20`,
                        borderRadius: 2,
                        boxSizing: 'border-box',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </div>

                {/* Play/Pause overlay button */}
                {videoReady && !processing && (
                  <button
                    onClick={togglePreview}
                    aria-label={previewActive ? 'Pause preview' : 'Play preview'}
                    style={{
                      position: 'absolute', bottom: 10, left: 10,
                      width: 44, height: 44, borderRadius: 8,
                      background: 'rgba(0,0,0,0.6)', border: 'none',
                      color: '#fff', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backdropFilter: 'blur(4px)',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.8)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; }}
                  >
                    {previewActive ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="none">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="none">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Regions count badge */}
                {regions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    padding: '3px 10px', borderRadius: 20,
                    background: GRADIENT[0], color: '#fff',
                    fontSize: 10, fontWeight: 700,
                  }}>
                    {regions.length} region{regions.length !== 1 ? 's' : ''}
                  </div>
                )}

                {/* Loading overlay during export */}
                {processing && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 12,
                    backdropFilter: 'blur(2px)',
                  }}>
                    <svg width="32" height="32" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,.3)" strokeWidth="2" fill="none" />
                      <path d="M8 2a6 6 0 014.47 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </svg>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                      Exporting... {progress}%
                    </span>
                    <div style={{
                      width: '60%', height: 4, borderRadius: 2,
                      background: 'rgba(255,255,255,0.2)', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${progress}%`, height: '100%', borderRadius: 2,
                        background: `linear-gradient(90deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                )}

                {/* Hint when no regions */}
                {videoReady && regions.length === 0 && !drawingRegion && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}>
                    <div style={{
                      padding: '10px 20px', borderRadius: 10,
                      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    }}>
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, opacity: 0.8 }}>
                        Click and drag to select a region
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Region list */}
              {regions.length > 0 && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
                }}>
                  {regions.map((r, i) => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRegionId(r.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 12px', borderRadius: 8,
                        border: `1px solid ${selectedRegionId === r.id ? GRADIENT[0] : C.border}`,
                        background: selectedRegionId === r.id ? `${GRADIENT[0]}12` : C.card,
                        cursor: 'pointer', fontSize: 11, fontWeight: 600, color: C.text,
                        transition: 'all 0.15s ease', minHeight: 44,
                      }}
                    >
                      <span style={{
                        width: 8, height: 8, borderRadius: 2,
                        background: GRADIENT[0], flexShrink: 0,
                      }} />
                      Region {i + 1}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeRegion(r.id); }}
                        style={{
                          background: 'none', border: 'none', color: C.dim,
                          cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1,
                          fontFamily: 'inherit', marginLeft: 2,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = GRADIENT[0]; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = C.dim; }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={clearAllRegions}
                    style={{
                      padding: '8px 12px', borderRadius: 8,
                      border: `1px solid ${C.border}`, background: C.card,
                      color: C.dim, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.15s ease', minHeight: 44,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = GRADIENT[0]; e.currentTarget.style.borderColor = GRADIENT[0]; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.dim; e.currentTarget.style.borderColor = C.border; }}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* ── Right: Controls ────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Removal method */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
                  Removal Method
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {REMOVAL_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      style={{
                        padding: '12px 16px', borderRadius: 10,
                        border: method === m.id ? `2px solid ${GRADIENT[0]}` : `1px solid ${C.border}`,
                        background: method === m.id ? `${GRADIENT[0]}12` : C.card,
                        color: C.text, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.2s ease',
                        fontFamily: 'inherit', textAlign: 'left',
                        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                        gap: 4, minHeight: 44,
                      }}
                      onMouseEnter={(e) => { if (method !== m.id) e.currentTarget.style.background = C.cardHover; }}
                      onMouseLeave={(e) => { if (method !== m.id) e.currentTarget.style.background = method === m.id ? `${GRADIENT[0]}12` : C.card; }}
                    >
                      <span style={{ color: method === m.id ? GRADIENT[0] : C.text }}>{m.label}</span>
                      <span style={{ fontSize: 11, color: C.dim, fontWeight: 500 }}>{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Blur strength slider */}
              {method === 'blur' && (
                <div style={{
                  padding: 16, borderRadius: 12,
                  border: `1px solid ${C.border}`, background: C.card,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Blur Strength</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>{blurStrength}</span>
                  </div>
                  <input
                    type="range" min={2} max={30} value={blurStrength}
                    onChange={(e) => setBlurStrength(Number(e.target.value))}
                    aria-label="Blur strength"
                    style={{ width: '100%', accentColor: GRADIENT[0] }}
                  />
                </div>
              )}

              {/* Pixel size slider */}
              {method === 'pixelate' && (
                <div style={{
                  padding: 16, borderRadius: 12,
                  border: `1px solid ${C.border}`, background: C.card,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Pixel Size</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>{pixelSize}px</span>
                  </div>
                  <input
                    type="range" min={4} max={40} value={pixelSize}
                    onChange={(e) => setPixelSize(Number(e.target.value))}
                    aria-label="Pixel block size"
                    style={{ width: '100%', accentColor: GRADIENT[0] }}
                  />
                </div>
              )}

              {/* How it works info */}
              <div style={{
                padding: 14, borderRadius: 12,
                background: `${GRADIENT[0]}08`, border: `1px solid ${GRADIENT[0]}20`,
              }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: GRADIENT[0], margin: '0 0 6px' }}>
                  How it works
                </p>
                <ol style={{ fontSize: 11, color: C.sub, margin: 0, paddingLeft: 16, lineHeight: 1.7 }}>
                  <li>Draw rectangles over subtitle/watermark areas</li>
                  <li>Choose a removal method (blur, pixelate, or color fill)</li>
                  <li>Preview the effect in real-time</li>
                  <li>Click &quot;Export Video&quot; to process and download</li>
                </ol>
              </div>

              {/* Error message */}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
                  border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text, wordBreak: 'break-word', minWidth: 0 }}>{error}</span>
                </div>
              )}

              {/* Success message */}
              {exported && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
                  border: '1px solid #22c55e33', background: '#22c55e0a',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>
                    Video exported successfully! Click Download below.
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ActionButton
                  label={processing ? `Exporting... ${progress}%` : 'Export Video'}
                  gradient={GRADIENT}
                  onClick={handleExport}
                  disabled={regions.length === 0 || !videoReady}
                  loading={processing}
                />

                {exported && downloadUrlRef.current && (
                  <button
                    onClick={handleDownload}
                    style={{
                      padding: '12px 0', borderRadius: 12,
                      border: `1px solid ${C.border}`,
                      background: C.card, color: C.text,
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.2s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      width: '100%', minHeight: 44, wordBreak: 'break-word',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download Cleaned Video
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
