'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

/* ── Constants ─────────────────────────────────────────────── */

const GRADIENT: [string, string] = ['#d946ef', '#c026d3'];
const VOCAL_COLOR = '#ec4899';
const INSTRUMENTAL_COLOR = '#d946ef';

/* ── WAV Encoder ───────────────────────────────────────────── */

function audioBufferToWavBlob(buf: AudioBuffer): Blob {
  const numCh = buf.numberOfChannels;
  const sr = buf.sampleRate;
  const len = buf.length;
  const bytesPerSample = 2;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = len * blockAlign;
  const headerSize = 44;
  const ab = new ArrayBuffer(headerSize + dataSize);
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

/* ── Waveform extraction helper ────────────────────────────── */

function extractWaveformBars(buffer: AudioBuffer, barCount: number): number[] {
  // Mix all channels to mono for visualization
  const data = buffer.getChannelData(0);
  const bars: number[] = [];
  const chunkSize = Math.floor(data.length / barCount);
  for (let b = 0; b < barCount; b++) {
    let sum = 0;
    const start = b * chunkSize;
    const end = Math.min(start + chunkSize, data.length);
    for (let i = start; i < end; i++) {
      sum += Math.abs(data[i]);
    }
    bars.push(sum / (end - start));
  }
  // Normalize to [0, 1]
  const max = Math.max(...bars, 0.001);
  return bars.map((v) => v / max);
}

/* ── Mid-Side separation (sample-level processing) ─────────── */

interface SeparationResult {
  vocals: AudioBuffer;
  instrumental: AudioBuffer;
}

function separateVocals(sourceBuffer: AudioBuffer): SeparationResult {
  const sampleRate = sourceBuffer.sampleRate;
  const length = sourceBuffer.length;

  const left = sourceBuffer.getChannelData(0);
  const right = sourceBuffer.numberOfChannels >= 2
    ? sourceBuffer.getChannelData(1)
    : left;

  // Create mono AudioBuffers for vocals and instrumental
  const audioCtx = new OfflineAudioContext(1, length, sampleRate);

  // Vocals = Mid = (L + R) / 2  (center-panned content)
  const vocalsBuffer = audioCtx.createBuffer(1, length, sampleRate);
  const vocalsData = vocalsBuffer.getChannelData(0);

  // Instrumental = Side = (L - R) / 2  (side content, removes center)
  const instrumentalBuffer = audioCtx.createBuffer(1, length, sampleRate);
  const instrumentalData = instrumentalBuffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    vocalsData[i] = (left[i] + right[i]) / 2;
    instrumentalData[i] = (left[i] - right[i]) / 2;
  }

  return { vocals: vocalsBuffer, instrumental: instrumentalBuffer };
}

/* ── Format helpers ────────────────────────────────────────── */

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ── Component ─────────────────────────────────────────────── */

export function VocalRemover() {
  const C = useThemeStore((s) => s.theme);

  // File & decode state
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);
  const dragCounter = useRef(0);

  // Decoded source buffer
  const decodedBufferRef = useRef<AudioBuffer | null>(null);
  const [sourceWaveform, setSourceWaveform] = useState<number[]>([]);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioSampleRate, setAudioSampleRate] = useState<number | null>(null);
  const [audioChannels, setAudioChannels] = useState<number | null>(null);

  // Separation results
  const [separated, setSeparated] = useState(false);
  const vocalsBufferRef = useRef<AudioBuffer | null>(null);
  const instrumentalBufferRef = useRef<AudioBuffer | null>(null);
  const [vocalsWaveform, setVocalsWaveform] = useState<number[]>([]);
  const [instrumentalWaveform, setInstrumentalWaveform] = useState<number[]>([]);

  // Playback state
  const [playingTrack, setPlayingTrack] = useState<'vocals' | 'instrumental' | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const playStartRef = useRef(0);
  const playRafRef = useRef<number | null>(null);

  // Download hover
  const [hoveredDl, setHoveredDl] = useState<string | null>(null);

  /* ── Decode uploaded file & extract waveform ────────────── */

  const decodeAndVisualize = useCallback(async (audioFile: File) => {
    setError(null);
    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      await audioCtx.close();

      decodedBufferRef.current = audioBuffer;
      setAudioDuration(audioBuffer.duration);
      setAudioSampleRate(audioBuffer.sampleRate);
      setAudioChannels(audioBuffer.numberOfChannels);
      setSourceWaveform(extractWaveformBars(audioBuffer, 80));
    } catch {
      setError('Failed to decode audio file. Try a different format (MP3, WAV, FLAC).');
      setFile(null);
    }
  }, []);

  useEffect(() => {
    if (file) {
      decodeAndVisualize(file);
    } else {
      setSourceWaveform([]);
      decodedBufferRef.current = null;
      setAudioDuration(null);
      setAudioSampleRate(null);
      setAudioChannels(null);
    }
  }, [file, decodeAndVisualize]);

  /* ── Stop playback ──────────────────────────────────────── */

  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch { /* already stopped */ }
      sourceNodeRef.current = null;
    }
    if (playRafRef.current) {
      cancelAnimationFrame(playRafRef.current);
      playRafRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setPlayingTrack(null);
    setPlayProgress(0);
  }, []);

  /* ── Separate vocals & instrumental ─────────────────────── */

  const handleSeparate = useCallback(async () => {
    if (!decodedBufferRef.current || loading) return;

    stopPlayback();
    setSeparated(false);
    setVocalsWaveform([]);
    setInstrumentalWaveform([]);
    vocalsBufferRef.current = null;
    instrumentalBufferRef.current = null;
    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      const srcBuffer = decodedBufferRef.current;

      // Check if audio is mono — separation requires stereo
      if (srcBuffer.numberOfChannels < 2) {
        setError('Vocal removal requires a stereo audio file. Mono files cannot be separated using the mid-side technique.');
        setLoading(false);
        return;
      }

      // Simulate progress for UX (actual processing is fast for sample-level ops)
      const progressTimer = setInterval(() => {
        setProgress((prev) => Math.min(prev + 8, 85));
      }, 50);

      // Use a microtask delay so the UI can render progress
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = separateVocals(srcBuffer);

      clearInterval(progressTimer);
      setProgress(90);

      // Extract waveforms
      const vocalBars = extractWaveformBars(result.vocals, 60);
      const instrumentalBars = extractWaveformBars(result.instrumental, 60);

      setProgress(95);

      vocalsBufferRef.current = result.vocals;
      instrumentalBufferRef.current = result.instrumental;
      setVocalsWaveform(vocalBars);
      setInstrumentalWaveform(instrumentalBars);

      setProgress(100);
      setSeparated(true);
    } catch {
      setError('An error occurred during separation. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loading, stopPlayback]);

  /* ── Play track ─────────────────────────────────────────── */

  const togglePlay = useCallback((track: 'vocals' | 'instrumental') => {
    // If already playing this track, stop
    if (playingTrack === track) {
      stopPlayback();
      return;
    }

    // Stop any existing playback first
    stopPlayback();

    const buffer = track === 'vocals'
      ? vocalsBufferRef.current
      : instrumentalBufferRef.current;
    if (!buffer) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    sourceNodeRef.current = source;

    setPlayingTrack(track);
    playStartRef.current = ctx.currentTime;

    const duration = buffer.duration;

    const animateProgress = () => {
      if (!audioCtxRef.current) return;
      const elapsed = audioCtxRef.current.currentTime - playStartRef.current;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setPlayProgress(pct);
      if (pct < 100) {
        playRafRef.current = requestAnimationFrame(animateProgress);
      }
    };
    playRafRef.current = requestAnimationFrame(animateProgress);

    source.onended = () => {
      stopPlayback();
    };
  }, [playingTrack, stopPlayback]);

  /* ── Download ───────────────────────────────────────────── */

  const handleDownload = useCallback((track: 'vocals' | 'instrumental') => {
    const buffer = track === 'vocals'
      ? vocalsBufferRef.current
      : instrumentalBufferRef.current;
    if (!buffer || !file) return;

    const wavBlob = audioBufferToWavBlob(buffer);
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track}_${baseName}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  }, [file]);

  /* ── Reset / remove file ────────────────────────────────── */

  const handleRemove = useCallback(() => {
    stopPlayback();
    setFile(null);
    setSeparated(false);
    setError(null);
    setProgress(0);
    setSourceWaveform([]);
    setVocalsWaveform([]);
    setInstrumentalWaveform([]);
    decodedBufferRef.current = null;
    vocalsBufferRef.current = null;
    instrumentalBufferRef.current = null;
  }, [stopPlayback]);

  /* ── Handle file selection ──────────────────────────────── */

  const handleFileSet = useCallback((f: File) => {
    stopPlayback();
    setFile(f);
    setSeparated(false);
    setError(null);
    setProgress(0);
    setVocalsWaveform([]);
    setInstrumentalWaveform([]);
    vocalsBufferRef.current = null;
    instrumentalBufferRef.current = null;
  }, [stopPlayback]);

  /* ── Cleanup on unmount ─────────────────────────────────── */

  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch { /* */ }
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
      if (playRafRef.current) {
        cancelAnimationFrame(playRafRef.current);
      }
    };
  }, []);

  /* ── Waveform bar renderer ──────────────────────────────── */

  const renderWaveformBars = (bars: number[], color: string, placeholder?: string) => {
    if (bars.length === 0) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: C.dim, fontSize: 12,
        }}>
          {placeholder ?? 'No data'}
        </div>
      );
    }
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2, height: '100%',
        padding: '0 12px',
      }}>
        {bars.map((v, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(6, v * 100)}%`,
              background: color,
              borderRadius: 2,
              opacity: 0.7,
              minWidth: 2,
              transition: 'height 0.3s ease',
            }}
          />
        ))}
      </div>
    );
  };

  /* ── Track Card component ───────────────────────────────── */

  const TrackCard = ({ trackId, label, color, icon, bars }: {
    trackId: 'vocals' | 'instrumental';
    label: string;
    color: string;
    icon: React.ReactNode;
    bars: number[];
  }) => {
    const isPlaying = playingTrack === trackId;
    const buffer = trackId === 'vocals'
      ? vocalsBufferRef.current
      : instrumentalBufferRef.current;
    const duration = buffer?.duration ?? 0;
    const currentTime = isPlaying ? (playProgress / 100) * duration : 0;

    return (
      <div style={{
        flex: 1, minWidth: 280, padding: 20, borderRadius: 16,
        border: `1px solid ${C.border}`, background: C.card,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14, flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${color}22`, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {icon}
            </div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text, display: 'block' }}>{label}</span>
              <span style={{ fontSize: 11, color: C.dim }}>{formatDuration(duration)}</span>
            </div>
          </div>
          <button
            onClick={() => handleDownload(trackId)}
            onMouseEnter={() => setHoveredDl(trackId)}
            onMouseLeave={() => setHoveredDl(null)}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: `1px solid ${hoveredDl === trackId ? color : C.border}`,
              background: hoveredDl === trackId ? `${color}11` : C.surface,
              color: hoveredDl === trackId ? color : C.sub,
              cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6, outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${color}44`; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download WAV
          </button>
        </div>

        {/* Waveform */}
        <div style={{
          height: 80, borderRadius: 12, background: C.surface,
          border: `1px solid ${C.border}`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 2, padding: '0 4px',
        }}>
          {renderWaveformBars(bars, color)}
        </div>

        {/* Play controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <button
            onClick={() => togglePlay(trackId)}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            aria-label={isPlaying ? `Pause ${label}` : `Play ${label}`}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: color, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.2s ease', outline: 'none',
              flexShrink: 0,
            }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${color}44`; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            {isPlaying ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21" /></svg>
            )}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{
              width: '100%', height: 4, borderRadius: 2, background: C.border,
              overflow: 'hidden',
            }}>
              <div style={{
                width: isPlaying ? `${playProgress}%` : '0%',
                height: '100%', borderRadius: 2, background: color,
                transition: isPlaying ? 'width 0.05s linear' : 'none',
              }} />
            </div>
          </div>
          <span style={{ fontSize: 11, color: C.dim, minWidth: 80, textAlign: 'right' }}>
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>
        </div>
      </div>
    );
  };

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <ToolPageShell
      title="AI Vocal Remover"
      subtitle="Separate vocals and instrumentals from any stereo audio track"
      gradient={GRADIENT}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Error banner */}
        {error && (
          <div role="alert" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
            border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{error}</span>
          </div>
        )}

        {/* Upload area */}
        {!file ? (
          <div
            onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragOver(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              dragCounter.current = 0;
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f && f.type.startsWith('audio/')) handleFileSet(f);
            }}
            style={{
              borderRadius: 16,
              border: dragOver ? `2px solid ${GRADIENT[0]}` : undefined,
              background: dragOver ? `${GRADIENT[0]}08` : undefined,
              transition: 'all 0.2s ease',
            }}
          >
            <UploadArea
              C={C}
              accept=".mp3,.wav,.flac,audio/*"
              onFile={handleFileSet}
              label="Drop your audio file here or click to upload"
            />
          </div>
        ) : (
          <>
            {/* File info card */}
            <div style={{
              padding: 16, borderRadius: 14, border: `1px solid ${C.border}`, background: C.card,
              display: 'flex', alignItems: 'center', gap: 14,
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                <div style={{ fontSize: 12, color: C.dim }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                  {audioDuration != null && ` \u2022 ${formatDuration(audioDuration)}`}
                  {audioSampleRate != null && ` \u2022 ${audioSampleRate} Hz`}
                  {audioChannels != null && ` \u2022 ${audioChannels === 1 ? 'Mono' : 'Stereo'}`}
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
                Remove
              </button>
            </div>

            {/* Source waveform */}
            <div style={{
              borderRadius: 14, border: `1px solid ${C.border}`, background: C.card,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: GRADIENT[0] }}>Original Waveform</span>
              </div>
              <div style={{
                height: 64, background: C.surface, padding: '8px 0',
              }}>
                {renderWaveformBars(sourceWaveform, GRADIENT[0], 'Decoding audio...')}
              </div>
            </div>

            {/* How it works info */}
            <div style={{
              padding: 16, borderRadius: 14, border: `1px solid ${GRADIENT[0]}30`,
              background: `linear-gradient(135deg, ${GRADIENT[0]}08, ${GRADIENT[1]}08)`,
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Mid-Side Separation</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                  Uses phase inversion to extract center-panned vocals (Mid) and side-panned instrumentals (Side) from stereo audio. Works best with professionally mixed stereo tracks.
                </div>
              </div>
            </div>

            {/* Separate button */}
            <ActionButton
              label={separated ? 'Re-separate' : 'Separate Vocals'}
              gradient={GRADIENT}
              onClick={handleSeparate}
              loading={loading}
              disabled={sourceWaveform.length === 0}
            />

            {/* Progress bar during processing */}
            {loading && (
              <div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', marginBottom: 6,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>Separating vocals and instrumentals...</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>{progress}%</span>
                </div>
                <div style={{
                  width: '100%', height: 6, borderRadius: 3,
                  background: C.surface, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${progress}%`, height: '100%', borderRadius: 3,
                    background: `linear-gradient(90deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Success banner */}
            {separated && !loading && (
              <div role="status" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
                border: `1px solid ${GRADIENT[0]}30`, background: `${GRADIENT[0]}08`,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Separation complete! Listen to and download your tracks below.</span>
              </div>
            )}

            {/* Output Tracks */}
            {separated && !loading && (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <TrackCard
                  trackId="vocals"
                  label="Vocals"
                  color={VOCAL_COLOR}
                  bars={vocalsWaveform}
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={VOCAL_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                      <path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  }
                />
                <TrackCard
                  trackId="instrumental"
                  label="Instrumental"
                  color={INSTRUMENTAL_COLOR}
                  bars={instrumentalWaveform}
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={INSTRUMENTAL_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                    </svg>
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </ToolPageShell>
  );
}
