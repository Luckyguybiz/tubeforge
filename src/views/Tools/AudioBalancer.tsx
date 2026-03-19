'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ── WAV Encoder ─────────────────────────────────────────────── */

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = 2; // always stereo output
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numFrames = buffer.length;
  const dataSize = numFrames * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // Helper to write ASCII string
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, totalSize - 8, true); // file size - 8
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);           // sub-chunk size (16 for PCM)
  view.setUint16(20, 1, true);            // audio format (1 = PCM)
  view.setUint16(22, numChannels, true);   // num channels
  view.setUint32(24, sampleRate, true);    // sample rate
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);    // block align
  view.setUint16(34, bitsPerSample, true); // bits per sample

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Get channel data (handle mono source by duplicating)
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels >= 2 ? buffer.getChannelData(1) : left;

  // Write interleaved 16-bit PCM samples
  let offset = headerSize;
  for (let i = 0; i < numFrames; i++) {
    // Clamp to [-1, 1] then scale to 16-bit signed integer range
    const clampL = Math.max(-1, Math.min(1, left[i]));
    const clampR = Math.max(-1, Math.min(1, right[i]));
    view.setInt16(offset, clampL < 0 ? clampL * 0x8000 : clampL * 0x7FFF, true);
    offset += 2;
    view.setInt16(offset, clampR < 0 ? clampR * 0x8000 : clampR * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/* ── Component ───────────────────────────────────────────────── */

export function AudioBalancer() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  const [file, setFile] = useState<File | null>(null);
  const [balance, setBalance] = useState(0); // -100 to 100
  const [leftVolume, setLeftVolume] = useState(80);
  const [rightVolume, setRightVolume] = useState(80);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); // 0–100
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadHover, setDownloadHover] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Real waveform data extracted from the uploaded file
  const [waveformLeft, setWaveformLeft] = useState<number[]>([]);
  const [waveformRight, setWaveformRight] = useState<number[]>([]);

  // Audio duration & sample rate from decoded buffer
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioSampleRate, setAudioSampleRate] = useState<number | null>(null);
  const [audioChannels, setAudioChannels] = useState<number | null>(null);

  // Processed blob for download
  const processedBlobRef = useRef<Blob | null>(null);

  // Decoded AudioBuffer for processing
  const decodedBufferRef = useRef<AudioBuffer | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Downsample waveform to ~80 bars per channel
      const barCount = 80;
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.numberOfChannels >= 2
        ? audioBuffer.getChannelData(1)
        : left;

      const barsL: number[] = [];
      const barsR: number[] = [];
      const chunkSize = Math.floor(left.length / barCount);

      for (let b = 0; b < barCount; b++) {
        let sumL = 0;
        let sumR = 0;
        const start = b * chunkSize;
        const end = Math.min(start + chunkSize, left.length);
        for (let i = start; i < end; i++) {
          sumL += Math.abs(left[i]);
          sumR += Math.abs(right[i]);
        }
        const count = end - start;
        barsL.push(sumL / count);
        barsR.push(sumR / count);
      }

      // Normalize to [0, 1]
      const maxL = Math.max(...barsL, 0.001);
      const maxR = Math.max(...barsR, 0.001);
      setWaveformLeft(barsL.map((v) => v / maxL));
      setWaveformRight(barsR.map((v) => v / maxR));
    } catch {
      setError(t('tools.balancer.decodeError'));
      setFile(null);
    }
  }, [t]);

  // Trigger decode whenever a new file is set
  useEffect(() => {
    if (file) {
      decodeAndVisualize(file);
    } else {
      setWaveformLeft([]);
      setWaveformRight([]);
      decodedBufferRef.current = null;
      setAudioDuration(null);
      setAudioSampleRate(null);
      setAudioChannels(null);
    }
  }, [file, decodeAndVisualize]);

  /* ── Real balance + volume processing ───────────────────── */

  const handleBalance = useCallback(async () => {
    if (!decodedBufferRef.current) {
      setError(t('tools.balancer.notDecoded'));
      return;
    }

    setLoading(true);
    setDone(false);
    setError(null);
    setProgress(0);
    processedBlobRef.current = null;

    try {
      const srcBuffer = decodedBufferRef.current;
      const sampleRate = srcBuffer.sampleRate;
      const length = srcBuffer.length;

      // OfflineAudioContext always renders 2 channels (stereo output)
      const offCtx = new OfflineAudioContext(2, length, sampleRate);

      // Source node
      const source = offCtx.createBufferSource();
      source.buffer = srcBuffer;

      // Channel splitter (to separate L/R from source)
      const splitter = offCtx.createChannelSplitter(2);

      // Gain nodes for each channel (volume control)
      const gainL = offCtx.createGain();
      const gainR = offCtx.createGain();

      // Convert balance (-100..100) into per-channel gain multipliers
      // Balance = -100  =>  L full, R silent
      // Balance =  0    =>  equal
      // Balance =  100  =>  L silent, R full
      const balanceNorm = balance / 100; // -1..1
      const balGainL = balanceNorm <= 0 ? 1 : 1 - balanceNorm;
      const balGainR = balanceNorm >= 0 ? 1 : 1 + balanceNorm;

      gainL.gain.value = (leftVolume / 100) * balGainL;
      gainR.gain.value = (rightVolume / 100) * balGainR;

      // Channel merger to combine back to stereo
      const merger = offCtx.createChannelMerger(2);

      // Wire: source -> splitter -> gains -> merger -> destination
      source.connect(splitter);
      splitter.connect(gainL, 0);  // left out of splitter
      splitter.connect(gainR, 1);  // right out of splitter
      gainL.connect(merger, 0, 0); // gainL -> merger input 0
      gainR.connect(merger, 0, 1); // gainR -> merger input 1
      merger.connect(offCtx.destination);

      source.start(0);

      // Simulate progress since OfflineAudioContext doesn't expose it natively
      const estimatedMs = Math.max(200, (length / sampleRate) * 100);
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, estimatedMs / 20);

      const renderedBuffer = await offCtx.startRendering();

      clearInterval(progressInterval);
      setProgress(95);

      // Encode to WAV
      const wavBlob = audioBufferToWavBlob(renderedBuffer);
      processedBlobRef.current = wavBlob;

      setProgress(100);
      setDone(true);
    } catch {
      setError(t('tools.balancer.processError'));
    } finally {
      setLoading(false);
    }
  }, [balance, leftVolume, rightVolume, t]);

  /* ── Download processed WAV ─────────────────────────────── */

  const handleDownload = useCallback(() => {
    const blob = processedBlobRef.current;
    if (!blob || !file) return;
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `balanced_${baseName}.wav`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [file]);

  /* ── Reset ──────────────────────────────────────────────── */

  const handleReset = () => {
    setFile(null);
    setDone(false);
    setError(null);
    setBalance(0);
    setLeftVolume(80);
    setRightVolume(80);
    setProgress(0);
    processedBlobRef.current = null;
    decodedBufferRef.current = null;
  };

  /* ── File drop ──────────────────────────────────────────── */

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('audio/')) {
      setFile(f);
      setDone(false);
      setError(null);
      processedBlobRef.current = null;
    }
  }, []);

  /* ── Waveform renderer (real data) ──────────────────────── */

  const renderWaveform = (channel: 'left' | 'right') => {
    const color = channel === 'left' ? '#3b82f6' : '#6366f1';
    const vol = channel === 'left' ? leftVolume : rightVolume;
    const data = channel === 'left' ? waveformLeft : waveformRight;

    // Fallback while decoding
    if (data.length === 0) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 48, padding: '0 12px', color: C.dim, fontSize: 12,
        }}>
          {t('tools.balancer.decoding')}
        </div>
      );
    }

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2, height: 48,
        padding: '0 12px',
      }}>
        {data.map((v, i) => {
          const h = v * (vol / 100);
          return (
            <div
              key={i}
              style={{
                flex: 1, height: `${Math.max(8, h * 100)}%`,
                background: color, borderRadius: 2, opacity: 0.7,
                minWidth: 2, transition: 'height 0.3s ease',
              }}
            />
          );
        })}
      </div>
    );
  };

  /* ── Format helpers ─────────────────────────────────────── */

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <ToolPageShell
      title={t('tools.balancer.title')}
      subtitle={t('tools.balancer.subtitle')}
      gradient={['#3b82f6', '#6366f1']}
    >
      {/* Upload */}
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
        >
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', borderRadius: 16,
            border: `2px dashed ${dragOver ? '#3b82f6' : C.border}`,
            background: dragOver ? 'rgba(59,130,246,.06)' : C.surface,
            cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 12 }}>
              {t('tools.balancer.dropLabel')}
            </span>
            <span style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
              {t('tools.balancer.dropFormats')}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setFile(f); setDone(false); setError(null); processedBlobRef.current = null; }
              }}
            />
          </label>
        </div>
      ) : (
        <div>
          {/* File info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12,
            border: `1px solid ${C.border}`, background: C.card, marginBottom: 24, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: 11, color: C.dim, wordBreak: 'break-word' }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
                {audioDuration != null && ` \u2022 ${formatDuration(audioDuration)}`}
                {audioSampleRate != null && ` \u2022 ${audioSampleRate} Hz`}
                {audioChannels != null && ` \u2022 ${audioChannels === 1 ? 'Mono' : 'Stereo'}`}
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
              {t('tools.balancer.remove')}
            </button>
          </div>

          {/* Waveform Display */}
          <div style={{
            borderRadius: 14, border: `1px solid ${C.border}`, background: C.card,
            overflow: 'hidden', marginBottom: 24,
          }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>{t('tools.balancer.leftChannel')}</span>
            </div>
            <div style={{ padding: '8px 0', background: C.surface }}>
              {renderWaveform('left')}
            </div>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6366f1' }}>{t('tools.balancer.rightChannel')}</span>
            </div>
            <div style={{ padding: '8px 0', background: C.surface }}>
              {renderWaveform('right')}
            </div>
          </div>

          {/* Balance Slider */}
          <div style={{
            padding: 20, borderRadius: 14, border: `1px solid ${C.border}`,
            background: C.card, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t('tools.balancer.stereoBalance')}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: balance < 0 ? '#3b82f6' : balance > 0 ? '#6366f1' : C.sub }}>
                {balance === 0 ? t('tools.balancer.center') : balance < 0 ? `${t('tools.balancer.left')} ${Math.abs(balance)}%` : `${t('tools.balancer.right')} ${balance}%`}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>L</span>
              <input
                type="range" min={-100} max={100} value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                aria-label="Stereo balance"
                style={{ flex: 1, accentColor: '#3b82f6' }}
              />
              <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>R</span>
            </div>
          </div>

          {/* Channel Volume Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
            <div style={{
              padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#3b82f6' }}>{t('tools.balancer.leftVolume')}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>{leftVolume}%</span>
              </div>
              <input
                type="range" min={0} max={100} value={leftVolume}
                onChange={(e) => setLeftVolume(Number(e.target.value))}
                aria-label="Left channel volume"
                style={{ width: '100%', accentColor: '#3b82f6' }}
              />
            </div>
            <div style={{
              padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#6366f1' }}>{t('tools.balancer.rightVolume')}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>{rightVolume}%</span>
              </div>
              <input
                type="range" min={0} max={100} value={rightVolume}
                onChange={(e) => setRightVolume(Number(e.target.value))}
                aria-label="Right channel volume"
                style={{ width: '100%', accentColor: '#6366f1' }}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div role="alert" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
              border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)', marginBottom: 16,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, wordBreak: 'break-word', minWidth: 0 }}>{error}</span>
            </div>
          )}

          {/* Progress bar during processing */}
          {loading && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginBottom: 6,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>{t('tools.balancer.processing')}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>{progress}%</span>
              </div>
              <div style={{
                width: '100%', height: 6, borderRadius: 3,
                background: C.surface, overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress}%`, height: '100%', borderRadius: 3,
                  background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          {/* Done status */}
          {done && (
            <div role="status" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
              border: '1px solid rgba(59,130,246,.3)', background: 'rgba(59,130,246,.06)', marginBottom: 16,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, wordBreak: 'break-word' }}>{t('tools.balancer.success')}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <ActionButton
              label={done ? t('tools.balancer.rebalance') : t('tools.balancer.balance')}
              gradient={['#3b82f6', '#6366f1']}
              onClick={handleBalance}
              loading={loading}
              disabled={waveformLeft.length === 0}
            />
            {done && (
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
                {t('tools.balancer.download')}
              </button>
            )}
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
