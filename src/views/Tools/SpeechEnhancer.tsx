'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

const GRADIENT: [string, string] = ['#10b981', '#06b6d4'];

/* ──────────────────────────── helpers ──────────────────────────── */

/** Normalize an AudioBuffer so peak amplitude reaches -1dB (0.89) */
function normalizeBuffer(buffer: AudioBuffer): AudioBuffer {
  let peak = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      peak = Math.max(peak, Math.abs(data[i]));
    }
  }
  if (peak === 0) return buffer;
  const target = 0.89; // -1dB
  const gain = target / peak;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      data[i] *= gain;
    }
  }
  return buffer;
}

/** Encode an AudioBuffer to a WAV Blob */
function audioBufferToWavBlob(buf: AudioBuffer): Blob {
  const numCh = buf.numberOfChannels;
  const sr = buf.sampleRate;
  const len = buf.length;
  const bytesPerSample = 2;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = len * blockAlign;
  const ab = new ArrayBuffer(44 + dataSize);
  const dv = new DataView(ab);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  dv.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, numCh, true);
  dv.setUint32(24, sr, true);
  dv.setUint32(28, sr * blockAlign, true);
  dv.setUint16(32, blockAlign, true);
  dv.setUint16(34, 16, true);
  writeStr(36, 'data');
  dv.setUint32(40, dataSize, true);
  const channels: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) channels.push(buf.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      dv.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}

/** Draw a waveform from an AudioBuffer onto a canvas */
function drawWaveform(
  canvas: HTMLCanvasElement,
  buffer: AudioBuffer,
  color: string,
  bgColor: string,
  progressRatio?: number,
  progressColor?: string,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;
  const data = buffer.getChannelData(0);
  const step = Math.ceil(data.length / width);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  const mid = height / 2;

  for (let x = 0; x < width; x++) {
    let min = 1.0;
    let max = -1.0;
    const start = x * step;
    for (let j = 0; j < step && start + j < data.length; j++) {
      const val = data[start + j];
      if (val < min) min = val;
      if (val > max) max = val;
    }

    const isProgress = progressRatio !== undefined && x / width <= progressRatio;
    ctx.fillStyle = isProgress && progressColor ? progressColor : color;
    ctx.fillRect(x, mid + min * mid, 1, Math.max(1, (max - min) * mid));
  }
}

/** Process audio through the speech enhancement chain via OfflineAudioContext */
async function enhanceAudio(
  sourceBuffer: AudioBuffer,
  noiseReduction: number,
  clarityBoost: number,
  echoRemoval: boolean,
  volumeNorm: boolean,
): Promise<AudioBuffer> {
  const sampleRate = sourceBuffer.sampleRate;
  const numChannels = sourceBuffer.numberOfChannels;
  const length = sourceBuffer.length;

  const offline = new OfflineAudioContext(numChannels, length, sampleRate);

  const src = offline.createBufferSource();
  src.buffer = sourceBuffer;

  let lastNode: AudioNode = src;

  // Highpass filter: remove low-frequency rumble (noise reduction)
  const highpass = offline.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 60 + (noiseReduction / 100) * 200;
  highpass.Q.value = 0.7;
  lastNode.connect(highpass);
  lastNode = highpass;

  // Lowpass filter: remove high-frequency hiss (noise reduction)
  const lowpass = offline.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 12000 - (noiseReduction / 100) * 4000;
  lowpass.Q.value = 0.7;
  lastNode.connect(lowpass);
  lastNode = lowpass;

  // Peaking EQ: boost speech presence range for clarity
  if (clarityBoost > 0) {
    const peaking = offline.createBiquadFilter();
    peaking.type = 'peaking';
    peaking.frequency.value = 3000;
    peaking.gain.value = (clarityBoost / 100) * 12;
    peaking.Q.value = 1.5;
    lastNode.connect(peaking);
    lastNode = peaking;
  }

  // Compressor: tame dynamics (also helps with echo reduction by reducing reflections)
  if (echoRemoval) {
    const compressor = offline.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    lastNode.connect(compressor);
    lastNode = compressor;
  }

  lastNode.connect(offline.destination);
  src.start(0);

  let result = await offline.startRendering();

  // Post-process: volume normalization
  if (volumeNorm) {
    result = normalizeBuffer(result);
  }

  return result;
}

/** Format seconds as m:ss */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ═══════════════════════════ COMPONENT ═══════════════════════════════════ */

export function SpeechEnhancer() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  // --- state ---
  const [file, setFile] = useState<File | null>(null);
  const [noiseReduction, setNoiseReduction] = useState(70);
  const [echoRemoval, setEchoRemoval] = useState(true);
  const [volumeNorm, setVolumeNorm] = useState(true);
  const [clarityBoost, setClarityBoost] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancedBuffer, setEnhancedBuffer] = useState<AudioBuffer | null>(null);
  const [downloadHover, setDownloadHover] = useState(false);
  const [playingOriginal, setPlayingOriginal] = useState(false);
  const [playingEnhanced, setPlayingEnhanced] = useState(false);
  const [originalProgress, setOriginalProgress] = useState(0);
  const [enhancedProgress, setEnhancedProgress] = useState(0);
  const [removeHover, setRemoveHover] = useState(false);
  const dragCounter = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);

  // --- refs ---
  const sourceBufferRef = useRef<AudioBuffer | null>(null);
  const originalCtxRef = useRef<AudioContext | null>(null);
  const enhancedCtxRef = useRef<AudioContext | null>(null);
  const originalSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const enhancedSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const originalRafRef = useRef<number | null>(null);
  const enhancedRafRef = useRef<number | null>(null);
  const originalStartRef = useRef(0);
  const enhancedStartRef = useRef(0);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const enhancedCanvasRef = useRef<HTMLCanvasElement>(null);

  /* ── Decode uploaded file ─────────────────────────────── */
  useEffect(() => {
    if (!file || file.size === 0) {
      sourceBufferRef.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const arrayBuf = await file.arrayBuffer();
        const ctx = new AudioContext();
        const decoded = await ctx.decodeAudioData(arrayBuf);
        await ctx.close();
        if (cancelled) return;
        sourceBufferRef.current = decoded;
        // Draw original waveform
        requestAnimationFrame(() => {
          if (originalCanvasRef.current && sourceBufferRef.current) {
            drawWaveform(originalCanvasRef.current, sourceBufferRef.current, '#ef4444', C.surface);
          }
        });
      } catch {
        if (!cancelled) {
          setError(t('speechEnhancer.decodeError'));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [file, C.surface]);

  /* ── Redraw waveforms if theme changes ────────── */
  useEffect(() => {
    if (originalCanvasRef.current && sourceBufferRef.current) {
      drawWaveform(originalCanvasRef.current, sourceBufferRef.current, '#ef4444', C.surface);
    }
  }, [C.surface]);

  useEffect(() => {
    if (enhancedCanvasRef.current && enhancedBuffer) {
      drawWaveform(enhancedCanvasRef.current, enhancedBuffer, GRADIENT[0], C.surface);
    }
  }, [enhancedBuffer, C.surface]);

  /* ── Stop playback helpers ─────────────────────────────── */
  const stopOriginal = useCallback(() => {
    if (originalSourceRef.current) {
      try { originalSourceRef.current.stop(); } catch { /* already stopped */ }
      originalSourceRef.current = null;
    }
    if (originalRafRef.current) {
      cancelAnimationFrame(originalRafRef.current);
      originalRafRef.current = null;
    }
    if (originalCtxRef.current) {
      originalCtxRef.current.close().catch(() => {});
      originalCtxRef.current = null;
    }
    setPlayingOriginal(false);
    setOriginalProgress(0);
    // Redraw without progress
    if (originalCanvasRef.current && sourceBufferRef.current) {
      drawWaveform(originalCanvasRef.current, sourceBufferRef.current, '#ef4444',
        // We can't access C.surface here via closure at define-time but it's set via the effect
        originalCanvasRef.current.dataset.bg || 'transparent');
    }
  }, []);

  const stopEnhanced = useCallback(() => {
    if (enhancedSourceRef.current) {
      try { enhancedSourceRef.current.stop(); } catch { /* already stopped */ }
      enhancedSourceRef.current = null;
    }
    if (enhancedRafRef.current) {
      cancelAnimationFrame(enhancedRafRef.current);
      enhancedRafRef.current = null;
    }
    if (enhancedCtxRef.current) {
      enhancedCtxRef.current.close().catch(() => {});
      enhancedCtxRef.current = null;
    }
    setPlayingEnhanced(false);
    setEnhancedProgress(0);
    if (enhancedCanvasRef.current && enhancedBuffer) {
      drawWaveform(enhancedCanvasRef.current, enhancedBuffer, GRADIENT[0],
        enhancedCanvasRef.current.dataset.bg || 'transparent');
    }
  }, [enhancedBuffer]);

  /* ── Store bg color in canvas data attribute for stoppers ── */
  useEffect(() => {
    if (originalCanvasRef.current) originalCanvasRef.current.dataset.bg = C.surface;
    if (enhancedCanvasRef.current) enhancedCanvasRef.current.dataset.bg = C.surface;
  }, [C.surface]);

  /* ── Toggle original playback ─────────────────────────── */
  const toggleOriginal = useCallback(() => {
    if (playingOriginal) {
      stopOriginal();
      return;
    }
    const buf = sourceBufferRef.current;
    if (!buf) return;

    // Stop enhanced if playing
    stopEnhanced();

    const ctx = new AudioContext();
    originalCtxRef.current = ctx;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    originalSourceRef.current = src;

    setPlayingOriginal(true);
    originalStartRef.current = ctx.currentTime;

    const duration = buf.duration;

    const animate = () => {
      if (!originalCtxRef.current) return;
      const elapsed = originalCtxRef.current.currentTime - originalStartRef.current;
      const pct = Math.min(1, elapsed / duration);
      setOriginalProgress(pct);

      if (originalCanvasRef.current && sourceBufferRef.current) {
        drawWaveform(originalCanvasRef.current, sourceBufferRef.current, '#ef4444', C.surface, pct, GRADIENT[0]);
      }

      if (pct < 1) {
        originalRafRef.current = requestAnimationFrame(animate);
      }
    };
    originalRafRef.current = requestAnimationFrame(animate);

    src.onended = () => { stopOriginal(); };
  }, [playingOriginal, stopOriginal, stopEnhanced, C.surface]);

  /* ── Toggle enhanced playback ─────────────────────────── */
  const toggleEnhanced = useCallback(() => {
    if (playingEnhanced) {
      stopEnhanced();
      return;
    }
    if (!enhancedBuffer) return;

    // Stop original if playing
    stopOriginal();

    const ctx = new AudioContext();
    enhancedCtxRef.current = ctx;
    const src = ctx.createBufferSource();
    src.buffer = enhancedBuffer;
    src.connect(ctx.destination);
    src.start(0);
    enhancedSourceRef.current = src;

    setPlayingEnhanced(true);
    enhancedStartRef.current = ctx.currentTime;

    const duration = enhancedBuffer.duration;

    const animate = () => {
      if (!enhancedCtxRef.current) return;
      const elapsed = enhancedCtxRef.current.currentTime - enhancedStartRef.current;
      const pct = Math.min(1, elapsed / duration);
      setEnhancedProgress(pct);

      if (enhancedCanvasRef.current && enhancedBuffer) {
        drawWaveform(enhancedCanvasRef.current, enhancedBuffer, GRADIENT[0], C.surface, pct, '#06b6d4');
      }

      if (pct < 1) {
        enhancedRafRef.current = requestAnimationFrame(animate);
      }
    };
    enhancedRafRef.current = requestAnimationFrame(animate);

    src.onended = () => { stopEnhanced(); };
  }, [playingEnhanced, enhancedBuffer, stopEnhanced, stopOriginal, C.surface]);

  /* ── Enhance handler ─────────────────────────────────── */
  const handleEnhance = useCallback(async () => {
    if (!sourceBufferRef.current || loading) return;
    stopOriginal();
    stopEnhanced();
    setEnhancedBuffer(null);
    setError(null);
    setLoading(true);
    try {
      const result = await enhanceAudio(
        sourceBufferRef.current,
        noiseReduction,
        clarityBoost,
        echoRemoval,
        volumeNorm,
      );
      setEnhancedBuffer(result);
    } catch {
      setError(t('speechEnhancer.processError'));
    } finally {
      setLoading(false);
    }
  }, [loading, noiseReduction, clarityBoost, echoRemoval, volumeNorm, stopOriginal, stopEnhanced]);

  /* ── Download handler ──────────────────────────────────── */
  const handleDownload = useCallback(() => {
    if (!enhancedBuffer) return;
    const wav = audioBufferToWavBlob(enhancedBuffer);
    const url = URL.createObjectURL(wav);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file?.name ? file.name.replace(/\.[^.]+$/, '') : 'audio';
    a.download = `enhanced_${baseName}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  }, [enhancedBuffer, file]);

  /* ── File set / remove ─────────────────────────────────── */
  const handleFileSet = useCallback((f: File) => {
    stopOriginal();
    stopEnhanced();
    setFile(f);
    setEnhancedBuffer(null);
    setError(null);
  }, [stopOriginal, stopEnhanced]);

  const handleRemove = useCallback(() => {
    stopOriginal();
    stopEnhanced();
    setFile(null);
    setEnhancedBuffer(null);
    setError(null);
    sourceBufferRef.current = null;
  }, [stopOriginal, stopEnhanced]);

  /* ── Cleanup on unmount ────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (originalSourceRef.current) try { originalSourceRef.current.stop(); } catch { /* */ }
      if (enhancedSourceRef.current) try { enhancedSourceRef.current.stop(); } catch { /* */ }
      if (originalCtxRef.current) originalCtxRef.current.close().catch(() => {});
      if (enhancedCtxRef.current) enhancedCtxRef.current.close().catch(() => {});
      if (originalRafRef.current) cancelAnimationFrame(originalRafRef.current);
      if (enhancedRafRef.current) cancelAnimationFrame(enhancedRafRef.current);
    };
  }, []);

  /* ── Toggle style ─────────────────────────────────────── */
  const toggleStyle = (active: boolean): React.CSSProperties => ({
    width: 48, height: 26, borderRadius: 13, padding: 3,
    background: active ? GRADIENT[0] : C.border,
    border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
    display: 'flex', alignItems: 'center',
    justifyContent: active ? 'flex-end' : 'flex-start',
    outline: 'none', flexShrink: 0,
  });

  const sourceDuration = sourceBufferRef.current?.duration ?? 0;
  const enhancedDuration = enhancedBuffer?.duration ?? 0;
  const hasSource = sourceBufferRef.current !== null;

  /* ── Waveform + playback panel ─────────────────────────── */
  const WaveformPanel = ({ label, color, canvasRef, hasAudio, playing, onPlay, progress, duration: dur }: {
    label: string;
    color: string;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    hasAudio: boolean;
    playing: boolean;
    onPlay: () => void;
    progress: number;
    duration: number;
  }) => (
    <div style={{
      flex: 1, minWidth: 0, flexBasis: 280, padding: 16, borderRadius: 14,
      border: `1px solid ${C.border}`, background: C.card,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</span>
        {hasAudio && dur > 0 && (
          <span style={{ fontSize: 11, color: C.dim }}>{formatTime(dur)}</span>
        )}
      </div>
      <div style={{
        height: 80, borderRadius: 10, background: C.surface,
        border: `1px solid ${C.border}`,
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {hasAudio ? (
          <canvas
            ref={canvasRef}
            width={800}
            height={80}
            style={{ width: '100%', height: 80, display: 'block' }}
          />
        ) : (
          <span style={{ fontSize: 12, color: C.dim }}>No audio loaded</span>
        )}
      </div>
      {hasAudio && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <button
            onClick={onPlay}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: color, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.2s ease', outline: 'none',
              transform: playing ? 'scale(0.95)' : 'scale(1)',
              flexShrink: 0,
            }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${color}44`; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21" /></svg>
            )}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{
              width: '100%', height: 3, borderRadius: 2, background: C.border,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress * 100}%`, height: '100%', borderRadius: 2,
                background: color,
                transition: playing ? 'width 0.05s linear' : 'none',
              }} />
            </div>
          </div>
          <span style={{ fontSize: 11, color: C.dim, minWidth: 70, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
            {formatTime(progress * dur)} / {formatTime(dur)}
          </span>
        </div>
      )}
    </div>
  );

  /* ═══════════════════════════ RENDER ═══════════════════════════════════ */

  return (
    <ToolPageShell
      title={t('speechEnhancer.title')}
      subtitle={t('speechEnhancer.subtitle')}
      gradient={GRADIENT}
      badge="New"
      badgeColor={GRADIENT[0]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Error banner */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
            border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{error}</span>
          </div>
        )}

        {/* Upload */}
        {!file ? (
          <div
            onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragOver(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              dragCounter.current = 0;
              setIsDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f && (f.type.startsWith('audio/') || f.type.startsWith('video/'))) handleFileSet(f);
            }}
            style={{
              borderRadius: 16,
              border: isDragOver ? `2px solid ${GRADIENT[0]}` : undefined,
              background: isDragOver ? `${GRADIENT[0]}08` : undefined,
              transition: 'all 0.2s ease',
            }}
          >
            <UploadArea
              C={C}
              accept="audio/*,video/*"
              onFile={handleFileSet}
              label={t('speechEnhancer.uploadLabel')}
            />
          </div>
        ) : (
          <div style={{
            padding: 16, borderRadius: 14, border: `1px solid ${C.border}`, background: C.card,
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `linear-gradient(135deg, ${GRADIENT[0]}22, ${GRADIENT[1]}22)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0, flexBasis: 150 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', wordBreak: 'break-word' as const }}>{file.name}</div>
              <div style={{ fontSize: 12, color: C.dim }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
                {sourceDuration > 0 && ` \u2022 ${formatTime(sourceDuration)}`}
              </div>
            </div>
            <button
              onClick={handleRemove}
              onMouseEnter={() => setRemoveHover(true)}
              onMouseLeave={() => setRemoveHover(false)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: removeHover ? C.surface : C.card, color: C.sub, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
                outline: 'none', flexShrink: 0,
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${GRADIENT[0]}44`; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              {t('speechEnhancer.remove')}
            </button>
          </div>
        )}

        {/* Enhancement Options */}
        <div style={{
          padding: 16, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, display: 'block', marginBottom: 16 }}>{t('speechEnhancer.enhancementOptions')}</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {/* Noise Reduction */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t('speechEnhancer.noiseReduction')}</span>
                <span style={{ fontSize: 13, color: GRADIENT[0], fontWeight: 600 }}>{noiseReduction}%</span>
              </div>
              <input
                type="range" min={0} max={100} value={noiseReduction}
                onChange={(e) => setNoiseReduction(Number(e.target.value))}
                aria-label="Noise reduction"
                style={{ width: '100%', accentColor: GRADIENT[0], cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: C.dim }}>Highpass: {Math.round(60 + (noiseReduction / 100) * 200)} Hz</span>
                <span style={{ fontSize: 10, color: C.dim }}>Lowpass: {Math.round(12000 - (noiseReduction / 100) * 4000)} Hz</span>
              </div>
            </div>

            {/* Clarity Boost */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t('speechEnhancer.clarityBoost')}</span>
                <span style={{ fontSize: 13, color: GRADIENT[0], fontWeight: 600 }}>{clarityBoost}%</span>
              </div>
              <input
                type="range" min={0} max={100} value={clarityBoost}
                onChange={(e) => setClarityBoost(Number(e.target.value))}
                aria-label="Clarity boost"
                style={{ width: '100%', accentColor: GRADIENT[0], cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: C.dim }}>3 kHz peak: +{((clarityBoost / 100) * 12).toFixed(1)} dB</span>
              </div>
            </div>

            {/* Echo Removal Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block' }}>{t('speechEnhancer.echoRemoval')}</span>
                <span style={{ fontSize: 10, color: C.dim }}>{t('speechEnhancer.dynamicsCompressor')}</span>
              </div>
              <button
                onClick={() => setEchoRemoval(!echoRemoval)}
                style={toggleStyle(echoRemoval)}
                onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${GRADIENT[0]}44`; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'all 0.2s ease',
                }} />
              </button>
            </div>

            {/* Volume Normalization Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block' }}>{t('speechEnhancer.volumeNormalization')}</span>
                <span style={{ fontSize: 10, color: C.dim }}>{t('speechEnhancer.normalizeTo')}</span>
              </div>
              <button
                onClick={() => setVolumeNorm(!volumeNorm)}
                style={toggleStyle(volumeNorm)}
                onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${GRADIENT[0]}44`; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'all 0.2s ease',
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* Before / After Comparison */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <WaveformPanel
            label={t('speechEnhancer.before')}
            color="#ef4444"
            canvasRef={originalCanvasRef}
            hasAudio={hasSource}
            playing={playingOriginal}
            onPlay={toggleOriginal}
            progress={originalProgress}
            duration={sourceDuration}
          />
          <WaveformPanel
            label={t('speechEnhancer.after')}
            color={GRADIENT[0]}
            canvasRef={enhancedCanvasRef}
            hasAudio={enhancedBuffer !== null}
            playing={playingEnhanced}
            onPlay={toggleEnhanced}
            progress={enhancedProgress}
            duration={enhancedDuration}
          />
        </div>

        {/* Success status */}
        {enhancedBuffer && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
            border: `1px solid ${GRADIENT[0]}30`, background: `${GRADIENT[0]}08`,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t('speechEnhancer.success')}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <ActionButton
            label={loading ? t('speechEnhancer.enhancing') : enhancedBuffer ? t('speechEnhancer.reEnhance') : t('speechEnhancer.enhance')}
            gradient={GRADIENT}
            onClick={handleEnhance}
            loading={loading}
            disabled={!hasSource}
          />
          {enhancedBuffer && (
            <button
              onClick={handleDownload}
              onMouseEnter={() => setDownloadHover(true)}
              onMouseLeave={() => setDownloadHover(false)}
              style={{
                padding: '12px 24px', minHeight: 44, borderRadius: 12,
                border: `1px solid ${C.border}`, background: downloadHover ? C.surface : C.card,
                color: C.text, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s ease', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 8,
                outline: 'none',
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${GRADIENT[0]}44`; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t('speechEnhancer.download')}
            </button>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
