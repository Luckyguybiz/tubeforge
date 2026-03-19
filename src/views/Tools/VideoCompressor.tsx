'use client';

import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const PRESETS = [
  { id: 'low', label: 'Низкое', desc: 'Маленький файл' },
  { id: 'medium', label: 'Среднее', desc: 'Баланс' },
  { id: 'high', label: 'Высокое', desc: 'Лучшее качество' },
] as const;

const RESOLUTIONS = [
  { label: 'Оригинал', value: 'original' },
  { label: '1080p', value: '1080p' },
  { label: '720p', value: '720p' },
  { label: '480p', value: '480p' },
] as const;

const FORMATS = [
  { label: 'MP4', value: 'mp4' },
  { label: 'WebM', value: 'webm' },
] as const;

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} МБ`;
  return `${(bytes / 1024).toFixed(1)} КБ`;
}

export function VideoCompressor() {
  const C = useThemeStore((s) => s.theme);

  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<string>('medium');
  const [resolution, setResolution] = useState<string>('original');
  const [format, setFormat] = useState<string>('mp4');
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedSize, setCompressedSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // FFmpeg state
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);

  // Hover states
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  const [hoveredRes, setHoveredRes] = useState<string | null>(null);
  const [hoveredFormat, setHoveredFormat] = useState<string | null>(null);
  const [downloadHover, setDownloadHover] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const originalSize = file ? file.size : 0;

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    setFfmpegLoading(true);
    setError(null);
    try {
      const ffmpeg = new FFmpeg();
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
      const fallbackURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';

      let loaded = false;
      for (const url of [baseURL, fallbackURL]) {
        try {
          await ffmpeg.load({
            coreURL: await toBlobURL(`${url}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${url}/ffmpeg-core.wasm`, 'application/wasm'),
          });
          loaded = true;
          break;
        } catch {
          continue;
        }
      }

      if (!loaded) {
        throw new Error('Не удалось загрузить модуль FFmpeg');
      }

      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
      return ffmpeg;
    } catch (err) {
      setError('Не удалось загрузить модуль обработки. Попробуйте обновить страницу.');
      ffmpegRef.current = null;
      throw err;
    } finally {
      setFfmpegLoading(false);
    }
  }, []);

  const handleCompress = useCallback(async () => {
    if (!file) return;
    setCompressing(true);
    setProgress(0);
    setDone(false);
    setCompressedBlob(null);
    setCompressedSize(0);
    setError(null);

    try {
      const ffmpeg = await loadFFmpeg();

      // Write input file
      const data = await fetchFile(file);
      await ffmpeg.writeFile('input.mp4', data);

      // Set progress handler
      const onProgress = ({ progress: p }: { progress: number; time: number }) => {
        setProgress(Math.round(p * 100));
      };
      ffmpeg.on('progress', onProgress);

      // Build FFmpeg command based on preset + resolution + format
      const args = ['-i', 'input.mp4'];

      // Resolution
      if (resolution === '1080p') args.push('-vf', 'scale=-2:1080');
      else if (resolution === '720p') args.push('-vf', 'scale=-2:720');
      else if (resolution === '480p') args.push('-vf', 'scale=-2:480');

      // Bitrate based on preset
      if (preset === 'low') {
        args.push('-b:v', '500k', '-b:a', '64k');
      } else if (preset === 'medium') {
        args.push('-b:v', '1500k', '-b:a', '128k');
      } else {
        args.push('-b:v', '3000k', '-b:a', '192k');
      }

      // Format
      const ext = format === 'webm' ? 'webm' : 'mp4';
      if (format === 'webm') {
        args.push('-c:v', 'libvpx-vp9', '-c:a', 'libopus');
      } else {
        // mp4 with h264
        args.push('-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac');
      }

      args.push(`output.${ext}`);

      const exitCode = await ffmpeg.exec(args);

      // Clean up listener
      ffmpeg.off('progress', onProgress);

      if (exitCode !== 0) {
        throw new Error(`FFmpeg завершился с кодом ${exitCode}`);
      }

      // Read output
      const output = await ffmpeg.readFile(`output.${ext}`);
      const mimeType = format === 'webm' ? 'video/webm' : 'video/mp4';
      const blob = output instanceof Uint8Array
        ? new Blob([new Uint8Array(output)], { type: mimeType })
        : new Blob([output as string], { type: mimeType });

      setCompressedBlob(blob);
      setCompressedSize(blob.size);
      setProgress(100);
      setDone(true);

      // Clean up virtual filesystem
      try { await ffmpeg.deleteFile('input.mp4'); } catch { /* noop */ }
      try { await ffmpeg.deleteFile(`output.${ext}`); } catch { /* noop */ }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Compression error:', err);
      setError(err instanceof Error ? err.message : 'Не удалось сжать видео');
    } finally {
      setCompressing(false);
    }
  }, [file, preset, resolution, format, loadFFmpeg]);

  const handleDownload = useCallback(() => {
    const blob = compressedBlob;
    if (!blob || !file) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const ext = format === 'webm' ? 'webm' : 'mp4';
    link.href = url;
    link.download = `${baseName}_compressed.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  }, [compressedBlob, file, format]);

  const handleReset = useCallback(() => {
    setFile(null);
    setDone(false);
    setProgress(0);
    setPreset('medium');
    setResolution('original');
    setFormat('mp4');
    setCompressedBlob(null);
    setCompressedSize(0);
    setError(null);
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
      setCompressedSize(0);
      setError(null);
    }
  }, []);

  const reductionPercent =
    originalSize > 0 && compressedSize > 0
      ? Math.round((1 - compressedSize / originalSize) * 100)
      : 0;

  return (
    <ToolPageShell
      title="Сжатие видео"
      subtitle="Уменьшите размер видеофайла с сохранением качества — сжатие через FFmpeg прямо в браузере"
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
                if (f) {
                  setFile(f);
                  setDone(false);
                  setProgress(0);
                  setCompressedBlob(null);
                  setCompressedSize(0);
                  setError(null);
                }
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
          <div style={{ marginBottom: 20 }}>
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

          {/* Format Selector */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Формат</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  onMouseEnter={() => setHoveredFormat(f.value)}
                  onMouseLeave={() => setHoveredFormat(null)}
                  style={{
                    padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    border: format === f.value ? '2px solid #06b6d4' : `1px solid ${C.border}`,
                    background: format === f.value ? 'rgba(6,182,212,.1)' : hoveredFormat === f.value ? C.surface : C.card,
                    color: format === f.value ? '#06b6d4' : C.text,
                    cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* FFmpeg Loading State */}
          {ffmpegLoading && (
            <div style={{
              padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card,
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                <circle cx="10" cy="10" r="8" stroke={C.border} strokeWidth="2" fill="none" />
                <path d="M10 2a8 8 0 015.66 2.34" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Загрузка модуля сжатия...</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Первая загрузка может занять 5-10 секунд</div>
              </div>
            </div>
          )}

          {/* FFmpeg Loaded Indicator */}
          {ffmpegLoaded && !ffmpegLoading && !compressing && !done && (
            <div style={{
              padding: 12, borderRadius: 12, border: '1px solid rgba(6,182,212,.3)', background: 'rgba(6,182,212,.06)',
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span style={{ fontSize: 12, color: '#06b6d4', fontWeight: 600 }}>Модуль FFmpeg загружен и готов к работе</span>
            </div>
          )}

          {/* Progress Bar */}
          {compressing && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.sub }}>
                  {ffmpegLoading ? 'Загрузка FFmpeg...' : 'Сжатие видео...'}
                </span>
                <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>{Math.min(100, progress)}%</span>
              </div>
              <div style={{ width: '100%', height: 8, borderRadius: 4, background: C.surface }}>
                <div style={{
                  width: `${Math.min(100, progress)}%`, height: '100%', borderRadius: 4,
                  background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              padding: 16, borderRadius: 12, border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)',
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span style={{ fontSize: 13, color: '#ef4444' }}>{error}</span>
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
                <span style={{ fontSize: 13, fontWeight: 700, color: reductionPercent > 0 ? '#06b6d4' : '#ef4444' }}>
                  {reductionPercent > 0
                    ? `${reductionPercent}% меньше`
                    : reductionPercent === 0
                      ? 'Без изменений'
                      : `${Math.abs(reductionPercent)}% больше`
                  }
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>После</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#06b6d4' }}>
                  {formatSize(compressedSize)}
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
              loading={compressing}
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

      {/* Keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ToolPageShell>
  );
}
