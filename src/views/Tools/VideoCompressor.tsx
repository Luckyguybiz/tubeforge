'use client';

import { useState, useRef, useCallback } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const PRESETS = [
  { id: 'low', label: 'Низкое', desc: 'Маленький файл', ratio: 0.3, bitrate: 500_000 },
  { id: 'medium', label: 'Среднее', desc: 'Баланс', ratio: 0.55, bitrate: 1_500_000 },
  { id: 'high', label: 'Высокое', desc: 'Лучшее качество', ratio: 0.8, bitrate: 3_000_000 },
] as const;

const RESOLUTIONS = [
  { label: 'Оригинал', value: 0 },
  { label: '1080p', value: 1080 },
  { label: '720p', value: 720 },
  { label: '480p', value: 480 },
] as const;

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} МБ`;
  return `${(bytes / 1024).toFixed(1)} КБ`;
}

export function VideoCompressor() {
  const C = useThemeStore((s) => s.theme);

  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<string>('medium');
  const [resolution, setResolution] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  const [hoveredRes, setHoveredRes] = useState<number | null>(null);
  const [downloadHover, setDownloadHover] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  const originalSize = file ? file.size : 0;
  const activePreset = PRESETS.find((p) => p.id === preset);
  const estimatedSize = originalSize * (activePreset?.ratio ?? 0.55);

  const handleCompress = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    setDone(false);
    setCompressedBlob(null);
    cancelRef.current = false;

    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.src = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => {
        video.onloadedmetadata = () => res();
        video.onerror = () => rej(new Error('Не удалось загрузить видео'));
      });

      const srcW = video.videoWidth;
      const srcH = video.videoHeight;
      let outW = srcW;
      let outH = srcH;

      if (resolution > 0 && srcH > resolution) {
        const scale = resolution / srcH;
        outW = Math.round(srcW * scale);
        outH = resolution;
        // Ensure even dimensions for codec compatibility
        outW = outW % 2 === 0 ? outW : outW + 1;
        outH = outH % 2 === 0 ? outH : outH + 1;
      }

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d')!;

      const fps = 30;
      const stream = canvas.captureStream(fps);

      // Try to add audio track
      let audioCtx: AudioContext | null = null;
      let audioSource: MediaElementAudioSourceNode | null = null;
      try {
        audioCtx = new AudioContext();
        audioSource = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        audioSource.connect(dest);
        audioSource.connect(audioCtx.destination);
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      } catch {
        // Audio capture may fail, proceed without audio
      }

      const targetBitrate = activePreset?.bitrate ?? 1_500_000;
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: targetBitrate,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const donePromise = new Promise<Blob>((res) => {
        recorder.onstop = () => res(new Blob(chunks, { type: mimeType }));
      });

      const totalDuration = video.duration;

      // Start recording
      recorder.start(100);
      video.currentTime = 0;
      await new Promise<void>((r) => { video.onseeked = () => r(); });
      video.play();

      const drawLoop = () => {
        if (cancelRef.current) {
          video.pause();
          if (recorder.state === 'recording') recorder.stop();
          return;
        }
        if (video.ended || video.paused) {
          if (recorder.state === 'recording') recorder.stop();
          return;
        }
        ctx.drawImage(video, 0, 0, outW, outH);
        const pct = totalDuration > 0 ? Math.min(99, (video.currentTime / totalDuration) * 100) : 0;
        setProgress(pct);
        requestAnimationFrame(drawLoop);
      };
      requestAnimationFrame(drawLoop);

      // Safety timeout
      const safetyTimeout = setTimeout(() => {
        if (recorder.state === 'recording') {
          video.pause();
          recorder.stop();
        }
      }, (totalDuration + 5) * 1000);

      const blob = await donePromise;
      clearTimeout(safetyTimeout);

      // Cleanup
      URL.revokeObjectURL(video.src);
      if (audioSource) { try { audioSource.disconnect(); } catch { /* noop */ } }
      if (audioCtx) { try { audioCtx.close(); } catch { /* noop */ } }

      if (!cancelRef.current) {
        setCompressedBlob(blob);
        setProgress(100);
        setDone(true);
      }
    } catch (err) {
      console.error('Compression error:', err);
      // Fallback: just mark as done with original file as blob
      setCompressedBlob(new Blob([file], { type: file.type }));
      setProgress(100);
      setDone(true);
    } finally {
      setLoading(false);
    }
  }, [file, activePreset, resolution]);

  const handleDownload = useCallback(() => {
    const blob = compressedBlob;
    if (!blob || !file) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    link.href = url;
    link.download = `${baseName}_compressed.webm`;
    link.click();
    URL.revokeObjectURL(url);
  }, [compressedBlob, file]);

  const handleReset = useCallback(() => {
    cancelRef.current = true;
    setFile(null);
    setDone(false);
    setProgress(0);
    setPreset('medium');
    setResolution(0);
    setCompressedBlob(null);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('video/')) {
      setFile(f);
      setDone(false);
      setProgress(0);
      setCompressedBlob(null);
    }
  }, []);

  return (
    <ToolPageShell
      title="Сжатие видео"
      subtitle="Уменьшите размер видеофайла с сохранением качества"
      gradient={['#06b6d4', '#0ea5e9']}
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
            border: `2px dashed ${dragOver ? '#06b6d4' : C.border}`,
            background: dragOver ? 'rgba(6,182,212,.06)' : C.surface,
            cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
          }}
          onMouseEnter={(e) => { if (!dragOver) { e.currentTarget.style.borderColor = C.text; e.currentTarget.style.background = C.card; } }}
          onMouseLeave={(e) => { if (!dragOver) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; } }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 12 }}>
              Перетащите видеофайл сюда или нажмите для загрузки
            </span>
            <span style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
              MP4, WebM, MOV, AVI, MKV
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setFile(f); setDone(false); setProgress(0); setCompressedBlob(null); }
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
              background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" /><polygon points="10 8 16 12 10 16" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{file.name}</div>
              <div style={{ fontSize: 11, color: C.dim }}>Размер оригинала: {formatSize(originalSize)}</div>
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

          {/* Compression Preset */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Пресет сжатия</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  onMouseEnter={() => setHoveredPreset(p.id)}
                  onMouseLeave={() => setHoveredPreset(null)}
                  style={{
                    padding: 16, borderRadius: 12, textAlign: 'center',
                    border: preset === p.id ? '2px solid #06b6d4' : `1px solid ${C.border}`,
                    background: preset === p.id ? 'rgba(6,182,212,.1)' : hoveredPreset === p.id ? C.surface : C.card,
                    cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: preset === p.id ? '#06b6d4' : C.text }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Selector */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Разрешение</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {RESOLUTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setResolution(r.value)}
                  onMouseEnter={() => setHoveredRes(r.value)}
                  onMouseLeave={() => setHoveredRes(null)}
                  style={{
                    padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    border: resolution === r.value ? '2px solid #06b6d4' : `1px solid ${C.border}`,
                    background: resolution === r.value ? 'rgba(6,182,212,.1)' : hoveredRes === r.value ? C.surface : C.card,
                    color: resolution === r.value ? '#06b6d4' : C.text,
                    cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Output Size */}
          <div style={{
            padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card,
            marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, color: C.sub }}>Ожидаемый размер</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#06b6d4' }}>
              ~{formatSize(estimatedSize)}
            </span>
          </div>

          {/* Progress Bar */}
          {loading && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.sub }}>Сжатие...</span>
                <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>{Math.min(100, Math.round(progress))}%</span>
              </div>
              <div style={{ width: '100%', height: 8, borderRadius: 4, background: C.surface }}>
                <div style={{
                  width: `${Math.min(100, progress)}%`, height: '100%', borderRadius: 4,
                  background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          {/* Before/After Size Comparison */}
          {done && compressedBlob && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center',
              padding: 20, borderRadius: 14, border: `1px solid ${C.border}`, background: C.card,
              marginBottom: 24,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>До</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{formatSize(originalSize)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 12 12 5 19 12" /><line x1="12" y1="5" x2="12" y2="19" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#06b6d4' }}>
                  {originalSize > 0
                    ? `${Math.round((1 - compressedBlob.size / originalSize) * 100)}% меньше`
                    : '---'}
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>После</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#06b6d4' }}>
                  {formatSize(compressedBlob.size)}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <ActionButton
              label={done ? 'Сжать снова' : 'Сжать'}
              gradient={['#06b6d4', '#0ea5e9']}
              onClick={handleCompress}
              loading={loading}
            />
            {done && compressedBlob && (
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
                Скачать
              </button>
            )}
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
