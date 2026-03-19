'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

/* ──────────────────────────── types & constants ──────────────────────────── */

type EffectId = 'deep' | 'chipmunk' | 'robot' | 'echo' | 'custom';

interface EffectDef {
  id: EffectId;
  label: string;
  icon: string;
  /** semitones offset (ignored for robot/echo/custom) */
  semitones?: number;
}

const EFFECTS: EffectDef[] = [
  { id: 'deep',     label: 'Deep Voice',  icon: '\uD83D\uDD0A', semitones: -4 },
  { id: 'chipmunk', label: 'Chipmunk',    icon: '\uD83D\uDC3F\uFE0F', semitones: 6 },
  { id: 'robot',    label: 'Robot',        icon: '\uD83E\uDD16' },
  { id: 'echo',     label: 'Echo',         icon: '\uD83D\uDD01' },
  { id: 'custom',   label: 'Custom Pitch', icon: '\uD83C\uDFDA\uFE0F' },
];

/** Convert semitones to playback rate: rate = 2^(semitones/12) */
function semitonesToRate(semitones: number): number {
  return Math.pow(2, semitones / 12);
}

/** Encode an AudioBuffer into a WAV Blob */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  const numSamples = buffer.length;
  const dataLength = numSamples * numChannels * (bitsPerSample / 8);
  const headerLength = 44;
  const arrayBuffer = new ArrayBuffer(headerLength + dataLength);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const val = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, val, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/** Draw waveform from AudioBuffer onto a canvas */
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
    ctx.fillRect(x, mid + min * mid, 1, (max - min) * mid);
  }
}

/* ──────────────── Apply effect chain via OfflineAudioContext ──────────────── */

async function applyEffect(
  sourceBuffer: AudioBuffer,
  effectId: EffectId,
  customSemitones: number,
): Promise<AudioBuffer> {
  const semitones =
    effectId === 'custom'
      ? customSemitones
      : effectId === 'deep'
        ? -4
        : effectId === 'chipmunk'
          ? 6
          : 0;

  const rate = semitonesToRate(semitones);

  // For pitch shifting we modify playbackRate — the output length changes.
  const outputLength = Math.ceil(sourceBuffer.length / rate);
  const sampleRate = sourceBuffer.sampleRate;
  const numChannels = sourceBuffer.numberOfChannels;

  const offline = new OfflineAudioContext(numChannels, outputLength, sampleRate);

  const src = offline.createBufferSource();
  src.buffer = sourceBuffer;
  src.playbackRate.value = rate;

  let lastNode: AudioNode = src;

  // Robot: waveshaper distortion + ring modulation with a low-frequency oscillator
  if (effectId === 'robot') {
    // Ring modulation with 50 Hz sine
    const osc = offline.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 50;
    const modGain = offline.createGain();
    modGain.gain.value = 0;
    osc.connect(modGain.gain);
    osc.start(0);

    lastNode.connect(modGain);
    lastNode = modGain;

    // Add a WaveShaperNode for subtle distortion
    const shaper = offline.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
    }
    shaper.curve = curve;
    shaper.oversample = '4x';
    lastNode.connect(shaper);
    lastNode = shaper;
  }

  // Echo: delay + feedback
  if (effectId === 'echo') {
    // We need a longer buffer for the echo tail
    const echoTime = 0.35;
    const feedback = 0.45;
    const echoLength = outputLength + Math.ceil(sampleRate * echoTime * 4);

    const offlineEcho = new OfflineAudioContext(numChannels, echoLength, sampleRate);
    const srcE = offlineEcho.createBufferSource();
    srcE.buffer = sourceBuffer;
    srcE.playbackRate.value = rate;

    const delay = offlineEcho.createDelay(2);
    delay.delayTime.value = echoTime;
    const fbGain = offlineEcho.createGain();
    fbGain.gain.value = feedback;
    const dryGain = offlineEcho.createGain();
    dryGain.gain.value = 1.0;
    const wetGain = offlineEcho.createGain();
    wetGain.gain.value = 0.6;

    srcE.connect(dryGain);
    dryGain.connect(offlineEcho.destination);

    srcE.connect(delay);
    delay.connect(fbGain);
    fbGain.connect(delay); // feedback loop
    delay.connect(wetGain);
    wetGain.connect(offlineEcho.destination);

    srcE.start(0);
    return offlineEcho.startRendering();
  }

  lastNode.connect(offline.destination);
  src.start(0);

  return offline.startRendering();
}

/* ─────────────────── Build live preview chain on AudioContext ─────────────── */

function buildLiveChain(
  ctx: AudioContext,
  sourceBuffer: AudioBuffer,
  effectId: EffectId,
  customSemitones: number,
): { source: AudioBufferSourceNode; stop: () => void } {
  const semitones =
    effectId === 'custom'
      ? customSemitones
      : effectId === 'deep'
        ? -4
        : effectId === 'chipmunk'
          ? 6
          : 0;
  const rate = semitonesToRate(semitones);

  const src = ctx.createBufferSource();
  src.buffer = sourceBuffer;
  src.playbackRate.value = rate;

  let lastNode: AudioNode = src;

  if (effectId === 'robot') {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 50;
    const modGain = ctx.createGain();
    modGain.gain.value = 0;
    osc.connect(modGain.gain);
    osc.start(0);
    lastNode.connect(modGain);
    lastNode = modGain;

    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
    }
    shaper.curve = curve;
    shaper.oversample = '4x';
    lastNode.connect(shaper);
    lastNode = shaper;
  }

  if (effectId === 'echo') {
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.35;
    const fbGain = ctx.createGain();
    fbGain.gain.value = 0.45;
    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.6;

    lastNode.connect(ctx.destination); // dry
    lastNode.connect(delay);
    delay.connect(fbGain);
    fbGain.connect(delay);
    delay.connect(wetGain);
    wetGain.connect(ctx.destination);

    src.start(0);
    return {
      source: src,
      stop: () => {
        try { src.stop(); } catch { /* already stopped */ }
      },
    };
  }

  lastNode.connect(ctx.destination);
  src.start(0);

  return {
    source: src,
    stop: () => {
      try { src.stop(); } catch { /* already stopped */ }
    },
  };
}

/* ═══════════════════════════ COMPONENT ═══════════════════════════════════ */

export function VoiceChanger() {
  const C = useThemeStore((s) => s.theme);

  // --- state ---
  const [file, setFile] = useState<File | null>(null);
  const [effect, setEffect] = useState<EffectId>('deep');
  const [customSemitones, setCustomSemitones] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedBuffer, setProcessedBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [hoveredEffect, setHoveredEffect] = useState<string | null>(null);
  const [recordHover, setRecordHover] = useState(false);
  const [downloadHover, setDownloadHover] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // --- refs ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceBufferRef = useRef<AudioBuffer | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const liveChainRef = useRef<{ source: AudioBufferSourceNode; stop: () => void } | null>(null);
  const playRafRef = useRef<number | null>(null);
  const playStartRef = useRef(0);
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

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
        // draw source waveform
        requestAnimationFrame(() => {
          if (waveCanvasRef.current && sourceBufferRef.current) {
            drawWaveform(waveCanvasRef.current, sourceBufferRef.current, '#d946ef', C.surface);
          }
        });
      } catch {
        if (!cancelled) {
          setError('\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0434\u0435\u043A\u043E\u0434\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0430\u0443\u0434\u0438\u043E \u0444\u0430\u0439\u043B. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u043E\u0439 \u0444\u043E\u0440\u043C\u0430\u0442.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [file, C.surface]);

  /* ── Redraw source waveform if theme changes ────────── */
  useEffect(() => {
    if (waveCanvasRef.current && sourceBufferRef.current) {
      drawWaveform(waveCanvasRef.current, sourceBufferRef.current, '#d946ef', C.surface);
    }
  }, [C.surface]);

  /* ── Redraw processed waveform when processedBuffer or theme changes ── */
  useEffect(() => {
    if (processedCanvasRef.current && processedBuffer) {
      drawWaveform(processedCanvasRef.current, processedBuffer, '#a855f7', C.surface);
    }
  }, [processedBuffer, C.surface]);

  /* ── Apply effect ──────────────────────────────────────── */
  const handleApply = useCallback(async () => {
    if (!sourceBufferRef.current) {
      setError('\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0430\u0443\u0434\u0438\u043E \u0444\u0430\u0439\u043B.');
      return;
    }
    setLoading(true);
    setError(null);
    setProcessedBuffer(null);
    stopPreview();
    try {
      const result = await applyEffect(sourceBufferRef.current, effect, customSemitones);
      setProcessedBuffer(result);
    } catch {
      setError('\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435 \u0430\u0443\u0434\u0438\u043E. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.');
    } finally {
      setLoading(false);
    }
  }, [effect, customSemitones]);

  /* ── Live preview playback ─────────────────────────────── */
  const stopPreview = useCallback(() => {
    if (liveChainRef.current) {
      liveChainRef.current.stop();
      liveChainRef.current = null;
    }
    if (playRafRef.current) {
      cancelAnimationFrame(playRafRef.current);
      playRafRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
    setPlayProgress(0);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopPreview();
      return;
    }

    const buf = processedBuffer ?? sourceBufferRef.current;
    if (!buf) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // If we have a processed buffer, play it directly. Otherwise play with live effects.
    let duration: number;
    if (processedBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = processedBuffer;
      src.connect(ctx.destination);
      src.start(0);
      duration = processedBuffer.duration;
      liveChainRef.current = { source: src, stop: () => { try { src.stop(); } catch {} } };
      src.onended = () => { stopPreview(); };
    } else {
      const chain = buildLiveChain(ctx, buf, effect, customSemitones);
      liveChainRef.current = chain;
      const rate = semitonesToRate(
        effect === 'custom' ? customSemitones : effect === 'deep' ? -4 : effect === 'chipmunk' ? 6 : 0,
      );
      duration = buf.duration / rate;
      chain.source.onended = () => { stopPreview(); };
    }

    setIsPlaying(true);
    playStartRef.current = ctx.currentTime;

    const animateProgress = () => {
      if (!audioCtxRef.current) return;
      const elapsed = audioCtxRef.current.currentTime - playStartRef.current;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setPlayProgress(pct);

      // Redraw waveform with progress
      const canvas = processedBuffer ? processedCanvasRef.current : waveCanvasRef.current;
      const drawBuf = processedBuffer ?? sourceBufferRef.current;
      if (canvas && drawBuf) {
        drawWaveform(canvas, drawBuf, processedBuffer ? '#a855f7' : '#d946ef', C.surface, pct / 100, '#d946ef');
      }

      if (pct < 100) {
        playRafRef.current = requestAnimationFrame(animateProgress);
      }
    };
    playRafRef.current = requestAnimationFrame(animateProgress);
  }, [isPlaying, processedBuffer, effect, customSemitones, stopPreview, C.surface]);

  /* ── Download processed audio as WAV ──────────────────── */
  const handleDownload = useCallback(() => {
    if (!processedBuffer) return;
    const wav = audioBufferToWav(processedBuffer);
    const url = URL.createObjectURL(wav);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file?.name ? file.name.replace(/\.[^.]+$/, '') : 'audio';
    a.download = `${effect}_${baseName}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  }, [processedBuffer, file, effect]);

  /* ── Reset ─────────────────────────────────────────────── */
  const handleReset = useCallback(() => {
    stopPreview();
    setFile(null);
    setProcessedBuffer(null);
    setError(null);
    setIsRecording(false);
    setPlayProgress(0);
    sourceBufferRef.current = null;
  }, [stopPreview]);

  /* ── Record from microphone ────────────────────────────── */
  const startRecording = useCallback(async () => {
    setIsRecording(true);
    setError(null);
    recordedChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const recorded = new File([blob], 'recording.webm', { type: 'audio/webm' });
        setFile(recorded);
        setIsRecording(false);
      };
      recorder.start();
    } catch {
      setError('\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0434\u043E\u0441\u0442\u0443\u043F \u043A \u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D\u0443. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430.');
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  /* ── File drop ─────────────────────────────────────────── */
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith('audio/') || f.type.startsWith('video/'))) {
      setFile(f);
      setProcessedBuffer(null);
      setError(null);
    }
  }, []);

  /* ── Cleanup on unmount ────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (liveChainRef.current) liveChainRef.current.stop();
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
    };
  }, []);

  /* ── Format duration helper ────────────────────────────── */
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const sourceDuration = sourceBufferRef.current?.duration ?? 0;
  const processedDuration = processedBuffer?.duration ?? 0;

  /* ═══════════════════════════ RENDER ═══════════════════════════════════ */

  return (
    <ToolPageShell
      title="Voice Changer"
      subtitle="Transform voices with fun effects and adjustments"
      gradient={['#d946ef', '#a855f7']}
    >
      {/* ── Error banner ── */}
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

      {/* ── Upload OR Record ── */}
      {!file && !isRecording ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
          >
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '48px 24px', borderRadius: 16,
              border: `2px dashed ${dragOver ? '#d946ef' : C.border}`,
              background: dragOver ? 'rgba(217,70,239,.06)' : C.surface,
              cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 12 }}>
                Drop audio or video file here or click to upload
              </span>
              <span style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
                MP3, WAV, FLAC, MP4, WebM
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); setProcessedBuffer(null); setError(null); }
                }}
              />
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.dim, fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <button
            onClick={startRecording}
            onMouseEnter={() => setRecordHover(true)}
            onMouseLeave={() => setRecordHover(false)}
            style={{
              padding: '16px 24px', borderRadius: 14,
              border: `1px solid ${C.border}`,
              background: recordHover ? C.surface : C.card,
              color: C.text, cursor: 'pointer', transition: 'all 0.2s ease',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10, minHeight: 44,
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 10,
              background: 'linear-gradient(135deg, #d946ef, #a855f7)',
            }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Record with Microphone</span>
          </button>
        </div>
      ) : isRecording && !file ? (
        /* ── Recording UI ── */
        <div style={{
          padding: 16, borderRadius: 14, border: `1px solid ${C.border}`,
          background: C.card, textAlign: 'center', marginBottom: 24,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 32, margin: '0 auto 16px',
            background: 'rgba(217,70,239,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 12,
              background: 'linear-gradient(135deg, #d946ef, #a855f7)',
            }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>Recording...</div>
          <div style={{ fontSize: 12, color: C.dim, marginBottom: 16 }}>Speak into your microphone</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={stopRecording}
              style={{
                padding: '10px 24px', borderRadius: 10,
                border: 'none', background: '#ef4444', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
                minHeight: 44,
              }}
            >
              Stop Recording
            </button>
            <button
              onClick={() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                  mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
                  mediaRecorderRef.current = null;
                }
                setIsRecording(false);
              }}
              style={{
                padding: '10px 24px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.card, color: C.sub,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
                minHeight: 44,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* ── File Info ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12,
            border: `1px solid ${C.border}`, background: C.card, marginBottom: 16, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #d946ef, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file!.name}</div>
              <div style={{ fontSize: 11, color: C.dim, wordBreak: 'break-word' }}>
                {file!.size > 0 ? `${(file!.size / 1024 / 1024).toFixed(2)} MB` : 'Recorded audio'}
                {sourceDuration > 0 && ` \u2022 ${formatTime(sourceDuration)}`}
              </div>
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
                flexShrink: 0, minHeight: 44,
              }}
            >
              Remove
            </button>
          </div>

          {/* ── Source waveform ── */}
          <div style={{
            marginBottom: 16, padding: 16, borderRadius: 12,
            border: `1px solid ${C.border}`, background: C.card,
          }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 10 }}>
              Original Waveform
            </label>
            <canvas
              ref={waveCanvasRef}
              width={800}
              height={80}
              style={{ width: '100%', height: 80, borderRadius: 8, display: 'block' }}
            />
          </div>

          {/* ── Voice Effect Grid ── */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 10 }}>Voice Effects</label>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: 10,
            }}>
              {EFFECTS.map((fx) => (
                <button
                  key={fx.id}
                  onClick={() => { setEffect(fx.id); setProcessedBuffer(null); }}
                  onMouseEnter={() => setHoveredEffect(fx.id)}
                  onMouseLeave={() => setHoveredEffect(null)}
                  style={{
                    padding: '14px 8px', borderRadius: 12, textAlign: 'center',
                    border: effect === fx.id ? '2px solid #d946ef' : `1px solid ${C.border}`,
                    background: effect === fx.id
                      ? 'rgba(217,70,239,.1)'
                      : hoveredEffect === fx.id ? C.surface : C.card,
                    cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    transform: effect === fx.id ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: effect === fx.id ? '0 4px 12px rgba(217,70,239,.15)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{fx.icon}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: effect === fx.id ? '#d946ef' : C.text,
                  }}>
                    {fx.label}
                  </span>
                  {fx.semitones !== undefined && (
                    <span style={{ fontSize: 9, color: C.dim }}>
                      {fx.semitones > 0 ? '+' : ''}{fx.semitones} st
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Custom Pitch Slider (shown for custom, or always visible) ── */}
          <div style={{
            marginBottom: 24, padding: 16, borderRadius: 12,
            border: `1px solid ${C.border}`, background: C.card,
            opacity: effect === 'custom' ? 1 : 0.5,
            transition: 'opacity 0.2s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Custom Pitch</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#d946ef' }}>
                {customSemitones > 0 ? '+' : ''}{customSemitones} semitones
              </span>
            </div>
            <input
              type="range"
              min={-12}
              max={12}
              step={1}
              value={customSemitones}
              onChange={(e) => {
                setCustomSemitones(Number(e.target.value));
                if (effect === 'custom') setProcessedBuffer(null);
              }}
              onMouseDown={() => { if (effect !== 'custom') setEffect('custom'); }}
              aria-label="Custom pitch in semitones"
              style={{ width: '100%', accentColor: '#d946ef' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: C.dim }}>-12 st (low)</span>
              <span style={{ fontSize: 10, color: C.dim }}>0</span>
              <span style={{ fontSize: 10, color: C.dim }}>+12 st (high)</span>
            </div>
          </div>

          {/* ── Processed waveform + Preview ── */}
          {processedBuffer && (
            <div style={{
              marginBottom: 16, padding: 16, borderRadius: 12,
              border: `1px solid ${C.border}`, background: C.card,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>
                  Processed Waveform
                </label>
                <span style={{ fontSize: 11, color: C.dim }}>
                  {formatTime(processedDuration)}
                </span>
              </div>
              <canvas
                ref={processedCanvasRef}
                width={800}
                height={80}
                style={{ width: '100%', height: 80, borderRadius: 8, display: 'block', marginBottom: 12 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={togglePlay}
                  style={{
                    width: 44, height: 44, borderRadius: 22, border: 'none',
                    background: 'linear-gradient(135deg, #d946ef, #a855f7)',
                    color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease', flexShrink: 0,
                    transform: isPlaying ? 'scale(0.95)' : 'scale(1)',
                  }}
                >
                  {isPlaying ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none">
                      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none">
                      <polygon points="5 3 19 12 5 21" />
                    </svg>
                  )}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '100%', height: 4, borderRadius: 2, background: C.surface,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${playProgress}%`, height: '100%', borderRadius: 2,
                      background: 'linear-gradient(135deg, #d946ef, #a855f7)',
                      transition: isPlaying ? 'width 0.05s linear' : 'none',
                    }} />
                  </div>
                </div>
                <span style={{ fontSize: 11, color: C.dim, minWidth: 70, textAlign: 'right' }}>
                  {formatTime((playProgress / 100) * processedDuration)} / {formatTime(processedDuration)}
                </span>
              </div>
            </div>
          )}

          {/* ── Live preview button (before applying) ── */}
          {!processedBuffer && sourceBufferRef.current && (
            <div style={{
              marginBottom: 16, padding: 16, borderRadius: 12,
              border: `1px solid ${C.border}`, background: C.card,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={togglePlay}
                  style={{
                    width: 44, height: 44, borderRadius: 22, border: 'none',
                    background: 'linear-gradient(135deg, #d946ef, #a855f7)',
                    color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease', flexShrink: 0,
                    transform: isPlaying ? 'scale(0.95)' : 'scale(1)',
                  }}
                >
                  {isPlaying ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none">
                      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none">
                      <polygon points="5 3 19 12 5 21" />
                    </svg>
                  )}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                    Live Preview
                  </div>
                  <div style={{ fontSize: 11, color: C.dim, wordBreak: 'break-word' }}>
                    Listen with current effect before applying
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Success status ── */}
          {processedBuffer && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
              border: '1px solid rgba(217,70,239,.3)', background: 'rgba(217,70,239,.06)', marginBottom: 16,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, wordBreak: 'break-word' }}>Effect applied successfully</span>
            </div>
          )}

          {/* ── Action Buttons ── */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <ActionButton
              label={processedBuffer ? 'Re-apply Effect' : 'Apply Effect'}
              gradient={['#d946ef', '#a855f7']}
              onClick={handleApply}
              loading={loading}
              disabled={!sourceBufferRef.current}
            />
            {processedBuffer && (
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
                  minHeight: 44,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download WAV
              </button>
            )}
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
