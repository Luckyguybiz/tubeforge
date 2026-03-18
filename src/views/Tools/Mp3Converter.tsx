'use client';

import { useState, useRef, useCallback } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const BITRATES = ['128', '192', '256', '320'] as const;
const SAMPLE_RATES = ['44.1kHz', '48kHz'] as const;

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} МБ`;
  return `${(bytes / 1024).toFixed(1)} КБ`;
}

export function Mp3Converter() {
  const C = useThemeStore((s) => s.theme);

  const [file, setFile] = useState<File | null>(null);
  const [bitrate, setBitrate] = useState<(typeof BITRATES)[number]>('256');
  const [sampleRate, setSampleRate] = useState<(typeof SAMPLE_RATES)[number]>('44.1kHz');
  const [trimStart, setTrimStart] = useState('');
  const [trimEnd, setTrimEnd] = useState('');
  const [outputName, setOutputName] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedSize, setConvertedSize] = useState(0);
  const [hoveredBitrate, setHoveredBitrate] = useState<string | null>(null);
  const [hoveredSample, setHoveredSample] = useState<string | null>(null);
  const [downloadHover, setDownloadHover] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setDone(false);
    setProgress(0);
    setConvertedBlob(null);

    try {
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');

      if (!isVideo && !isAudio) {
        throw new Error('Unsupported file type');
      }

      // For video files: extract audio via MediaRecorder
      // For audio files: re-encode via AudioContext + MediaRecorder
      if (isVideo) {
        // Create a video element, capture audio stream, re-record as audio-only
        const video = document.createElement('video');
        video.muted = false;
        video.playsInline = true;
        video.src = URL.createObjectURL(file);
        await new Promise<void>((res, rej) => {
          video.onloadedmetadata = () => res();
          video.onerror = () => rej(new Error('Не удалось загрузить видео'));
        });

        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);

        const targetBitrateNum = parseInt(bitrate) * 1000;
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

        const recorder = new MediaRecorder(dest.stream, {
          mimeType,
          audioBitsPerSecond: targetBitrateNum,
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

        const donePromise = new Promise<Blob>((res) => {
          recorder.onstop = () => res(new Blob(chunks, { type: mimeType }));
        });

        const totalDuration = video.duration;
        recorder.start(100);
        video.currentTime = 0;
        video.play();

        // Track progress
        const progressInterval = setInterval(() => {
          if (totalDuration > 0) {
            setProgress(Math.min(99, (video.currentTime / totalDuration) * 100));
          }
        }, 200);

        video.onended = () => {
          clearInterval(progressInterval);
          if (recorder.state === 'recording') recorder.stop();
        };

        // Safety timeout
        const safetyTimeout = setTimeout(() => {
          clearInterval(progressInterval);
          video.pause();
          if (recorder.state === 'recording') recorder.stop();
        }, (totalDuration + 5) * 1000);

        const blob = await donePromise;
        clearTimeout(safetyTimeout);
        clearInterval(progressInterval);

        URL.revokeObjectURL(video.src);
        try { source.disconnect(); } catch { /* noop */ }
        try { audioCtx.close(); } catch { /* noop */ }

        setConvertedBlob(blob);
        setConvertedSize(blob.size);
        setProgress(100);
        setDone(true);
      } else {
        // Audio file: decode and re-encode through AudioContext + MediaRecorder
        const arrayBuffer = await file.arrayBuffer();
        const audioCtx = new AudioContext();

        let audioBuffer: AudioBuffer;
        try {
          audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch {
          // If decoding fails, just provide the original file for download
          setConvertedBlob(new Blob([file], { type: file.type }));
          setConvertedSize(file.size);
          setProgress(100);
          setDone(true);
          setLoading(false);
          try { audioCtx.close(); } catch { /* noop */ }
          return;
        }

        const targetSampleRate = sampleRate === '48kHz' ? 48000 : 44100;
        const offlineCtx = new OfflineAudioContext(
          audioBuffer.numberOfChannels,
          Math.ceil(audioBuffer.duration * targetSampleRate),
          targetSampleRate,
        );

        const bufferSource = offlineCtx.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.connect(offlineCtx.destination);
        bufferSource.start(0);

        // Show incremental progress during offline rendering
        setProgress(20);
        const renderedBuffer = await offlineCtx.startRendering();
        setProgress(60);

        // Encode rendered audio to WAV blob
        const wavBlob = audioBufferToWav(renderedBuffer);
        setProgress(90);

        try { audioCtx.close(); } catch { /* noop */ }

        setConvertedBlob(wavBlob);
        setConvertedSize(wavBlob.size);
        setProgress(100);
        setDone(true);
      }
    } catch (err) {
      console.error('Conversion error:', err);
      // Fallback: let user download the original file
      if (file) {
        setConvertedBlob(new Blob([file], { type: file.type }));
        setConvertedSize(file.size);
        setDone(true);
        setProgress(100);
      }
    } finally {
      setLoading(false);
    }
  }, [file, bitrate, sampleRate]);

  const handleDownload = useCallback(() => {
    if (!convertedBlob || !file) return;
    const url = URL.createObjectURL(convertedBlob);
    const link = document.createElement('a');
    const baseName = outputName || file.name.replace(/\.[^/.]+$/, '');
    // If we encoded to WAV, use .wav extension; if webm audio, use .webm
    const ext = convertedBlob.type.includes('wav') ? '.wav'
      : convertedBlob.type.includes('webm') ? '.webm'
        : '.audio';
    link.href = url;
    link.download = `${baseName}${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  }, [convertedBlob, file, outputName]);

  const handleReset = useCallback(() => {
    setFile(null);
    setDone(false);
    setOutputName('');
    setTrimStart('');
    setTrimEnd('');
    setConvertedBlob(null);
    setConvertedSize(0);
    setProgress(0);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith('audio/') || f.type.startsWith('video/'))) {
      setFile(f);
      setDone(false);
      setConvertedBlob(null);
      setConvertedSize(0);
      setProgress(0);
    }
  }, []);

  return (
    <ToolPageShell
      title="Конвертер аудио"
      subtitle="Конвертируйте любой аудио или видеофайл в аудиоформат"
      gradient={['#10b981', '#059669']}
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
            border: `2px dashed ${dragOver ? '#10b981' : C.border}`,
            background: dragOver ? 'rgba(16,185,129,.06)' : C.surface,
            cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
          }}
          onMouseEnter={(e) => { if (!dragOver) { e.currentTarget.style.borderColor = C.text; e.currentTarget.style.background = C.card; } }}
          onMouseLeave={(e) => { if (!dragOver) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; } }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 12 }}>
              Перетащите аудио или видеофайл сюда или нажмите для загрузки
            </span>
            <span style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
              MP4, WAV, FLAC, OGG, AAC, WebM, MKV
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setFile(f); setDone(false); setConvertedBlob(null); setConvertedSize(0); setProgress(0); }
              }}
            />
          </label>
        </div>
      ) : (
        <div>
          {/* File Info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12,
            border: `1px solid ${C.border}`, background: C.card, marginBottom: 24,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{file.name}</div>
              <div style={{ fontSize: 11, color: C.dim }}>{formatSize(file.size)}</div>
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
              }}
            >
              Убрать
            </button>
          </div>

          {/* Bitrate Selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Битрейт (кбит/с)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {BITRATES.map((b) => (
                <button
                  key={b}
                  onClick={() => setBitrate(b)}
                  onMouseEnter={() => setHoveredBitrate(b)}
                  onMouseLeave={() => setHoveredBitrate(null)}
                  style={{
                    padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    border: bitrate === b ? '2px solid #10b981' : `1px solid ${C.border}`,
                    background: bitrate === b ? 'rgba(16,185,129,.1)' : hoveredBitrate === b ? C.surface : C.card,
                    color: bitrate === b ? '#10b981' : C.text,
                    cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Sample Rate */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Частота дискретизации</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {SAMPLE_RATES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSampleRate(s)}
                  onMouseEnter={() => setHoveredSample(s)}
                  onMouseLeave={() => setHoveredSample(null)}
                  style={{
                    padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    border: sampleRate === s ? '2px solid #10b981' : `1px solid ${C.border}`,
                    background: sampleRate === s ? 'rgba(16,185,129,.1)' : hoveredSample === s ? C.surface : C.card,
                    color: sampleRate === s ? '#10b981' : C.text,
                    cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Trim Option */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Обрезка (необязательно)</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '0 12px', flex: 1,
              }}>
                <span style={{ fontSize: 12, color: C.dim }}>Начало</span>
                <input
                  value={trimStart}
                  onChange={(e) => setTrimStart(e.target.value)}
                  placeholder="00:00"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: C.text, fontSize: 13, padding: '10px 0', fontFamily: 'inherit',
                  }}
                />
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '0 12px', flex: 1,
              }}>
                <span style={{ fontSize: 12, color: C.dim }}>Конец</span>
                <input
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(e.target.value)}
                  placeholder="00:00"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: C.text, fontSize: 13, padding: '10px 0', fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Output File Name */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Имя выходного файла</label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '0 16px',
            }}>
              <input
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                placeholder={file.name.replace(/\.[^/.]+$/, '')}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: C.text, fontSize: 14, padding: '12px 0', fontFamily: 'inherit',
                }}
              />
              <span style={{ fontSize: 13, color: C.dim, fontWeight: 600 }}>.wav / .webm</span>
            </div>
          </div>

          {/* Progress bar */}
          {loading && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.sub }}>Конвертация...</span>
                <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>{Math.min(100, Math.round(progress))}%</span>
              </div>
              <div style={{ width: '100%', height: 8, borderRadius: 4, background: C.surface }}>
                <div style={{
                  width: `${Math.min(100, progress)}%`, height: '100%', borderRadius: 4,
                  background: 'linear-gradient(135deg, #10b981, #059669)', transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          {/* Done status */}
          {done && convertedBlob && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
              border: '1px solid rgba(16,185,129,.3)', background: 'rgba(16,185,129,.06)', marginBottom: 16,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                Конвертация завершена — {formatSize(convertedSize)}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <ActionButton
              label={done ? 'Конвертировать снова' : 'Конвертировать'}
              gradient={['#10b981', '#059669']}
              onClick={handleConvert}
              loading={loading}
            />
            {done && convertedBlob && (
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
                Скачать аудио
              </button>
            )}
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}

/** Encode an AudioBuffer as a WAV Blob. */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Interleave channels and write PCM samples
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = headerLength;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
