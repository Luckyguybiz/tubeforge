'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { FFmpegClient, readFileAsUint8Array } from '@/lib/ffmpeg';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

const FORMATS = [
  { label: 'MP4', value: 'mp4' },
  { label: 'WebM', value: 'webm' },
] as const;

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} ${useLocaleStore.getState().t('tools.sizeMB')}`;
  return `${(bytes / 1024).toFixed(1)} ${useLocaleStore.getState().t('tools.sizeKB')}`;
}

export function VideoCompressor() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  const PRESETS = [
    { id: 'low', label: t('tools.compressor.presetLow'), desc: t('tools.compressor.presetLowDesc') },
    { id: 'medium', label: t('tools.compressor.presetMedium'), desc: t('tools.compressor.presetMediumDesc') },
    { id: 'high', label: t('tools.compressor.presetHigh'), desc: t('tools.compressor.presetHighDesc') },
  ] as const;

  const RESOLUTIONS = [
    { label: t('tools.compressor.resOriginal'), value: 'original' },
    { label: '1080p', value: '1080p' },
    { label: '720p', value: '720p' },
    { label: '480p', value: '480p' },
  ] as const;

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
  const ffmpegRef = useRef<FFmpegClient | null>(null);
  const activeProgressCbRef = useRef<((p: { progress: number; time: number }) => void) | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);

  // Cleanup FFmpeg worker on unmount
  useEffect(() => {
    return () => {
      if (ffmpegRef.current && activeProgressCbRef.current) {
        ffmpegRef.current.off('progress', activeProgressCbRef.current);
        activeProgressCbRef.current = null;
      }
      if (ffmpegRef.current) {
        ffmpegRef.current.terminate();
        ffmpegRef.current = null;
      }
    };
  }, []);

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
      const ffmpeg = new FFmpegClient();
      await ffmpeg.load();
      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
      return ffmpeg;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`${t('tools.compressor.loadModuleError')}: ${msg}`);
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
      // WASM has limited memory — reject files > 200 MB
      if (file.size > 200 * 1024 * 1024) {
        throw new Error(t('tools.compressor.fileTooBig'));
      }

      const ffmpeg = await loadFFmpeg();

      // Write input file with actual extension for correct format detection
      const inputExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const inputName = `input.${inputExt}`;
      const data = await readFileAsUint8Array(file);
      await ffmpeg.writeFile(inputName, data);

      // Set progress handler
      const onProgress = ({ progress: p }: { progress: number; time: number }) => {
        setProgress(Math.round(p * 100));
      };
      activeProgressCbRef.current = onProgress;
      ffmpeg.on('progress', onProgress);

      // Build FFmpeg command based on preset + resolution + format
      const args = ['-i', inputName];

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

      // Format & codecs
      const ext = format === 'webm' ? 'webm' : 'mp4';
      if (format === 'webm') {
        // VP8 + Vorbis — VP9 crashes WASM with memory overflow
        args.push('-c:v', 'libvpx', '-deadline', 'realtime', '-cpu-used', '8', '-c:a', 'libvorbis');
      } else {
        // H.264 + AAC — ultrafast uses less WASM memory
        args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac');
      }

      // Prevent "already exists. Overwrite?" prompt
      args.push('-y', `output.${ext}`);

      const exitCode = await ffmpeg.exec(args);

      // Clean up listener
      ffmpeg.off('progress', onProgress);
      activeProgressCbRef.current = null;

      if (exitCode !== 0) {
        throw new Error(`${t('tools.compressor.ffmpegExitCode')} ${exitCode}`);
      }

      // Read output
      const output = await ffmpeg.readFile(`output.${ext}`);
      const mimeType = format === 'webm' ? 'video/webm' : 'video/mp4';
      const blob = new Blob([new Uint8Array(output) as BlobPart], { type: mimeType });

      setCompressedBlob(blob);
      setCompressedSize(blob.size);
      setProgress(100);
      setDone(true);

      // Clean up virtual filesystem
      try { await ffmpeg.deleteFile(inputName); } catch { /* noop */ }
      try { await ffmpeg.deleteFile(`output.${ext}`); } catch { /* noop */ }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Compression error:', err);
      setError(err instanceof Error ? err.message : t('tools.compressor.compressError'));
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
      title={t('tools.compressor.title')}
      subtitle={t('tools.compressor.subtitle')}
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
              {t('tools.compressor.dropLabel')}
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
            border: `1px solid ${C.border}`, background: C.card, marginBottom: 24, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" /><polygon points="10 8 16 12 10 16" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: 11, color: C.dim, wordBreak: 'break-word' }}>{t('tools.compressor.originalSize')}: {formatSize(originalSize)}</div>
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
              {t('tools.remove')}
            </button>
          </div>

          {/* Compression Preset */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>{t('tools.compressor.preset')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
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
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>{t('tools.compressor.resolution')}</label>
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
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>{t('tools.compressor.format')}</label>
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
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t('tools.compressor.loadingModule')}</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{t('tools.compressor.firstLoadHint')}</div>
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
              <span style={{ fontSize: 12, color: '#06b6d4', fontWeight: 600 }}>{t('tools.compressor.ffmpegReady')}</span>
            </div>
          )}

          {/* Progress Bar */}
          {compressing && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.sub }}>
                  {ffmpegLoading ? t('tools.compressor.loadingFFmpeg') : t('tools.compressor.compressing')}
                </span>
                <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>{Math.min(100, progress)}%</span>
              </div>
              <div role="progressbar" aria-valuenow={Math.min(100, progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Compression progress" style={{ width: '100%', height: 8, borderRadius: 4, background: C.surface }}>
                <div style={{
                  width: `${Math.min(100, progress)}%`, height: '100%', borderRadius: 4,
                  background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div role="alert" style={{
              padding: 16, borderRadius: 12, border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)',
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span style={{ fontSize: 13, color: '#ef4444', wordBreak: 'break-word', minWidth: 0 }}>{error}</span>
            </div>
          )}

          {/* Before/After Size Comparison */}
          {done && compressedBlob && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'center',
              padding: 16, borderRadius: 14, border: `1px solid ${C.border}`, background: C.card,
              marginBottom: 24,
            }}>
              <div style={{ textAlign: 'center', flex: '1 1 120px', minWidth: 100 }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>{t('tools.compressor.before')}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{formatSize(originalSize)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 12 12 5 19 12" /><line x1="12" y1="5" x2="12" y2="19" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: reductionPercent > 0 ? '#06b6d4' : '#ef4444' }}>
                  {reductionPercent > 0
                    ? `${reductionPercent}% ${t('tools.compressor.smaller')}`
                    : reductionPercent === 0
                      ? t('tools.compressor.noChange')
                      : `${Math.abs(reductionPercent)}% ${t('tools.compressor.larger')}`
                  }
                </span>
              </div>
              <div style={{ textAlign: 'center', flex: '1 1 120px', minWidth: 100 }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>{t('tools.compressor.after')}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#06b6d4' }}>
                  {formatSize(compressedSize)}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <ActionButton
              label={done ? t('tools.compressor.compressAgain') : t('tools.compressor.compress')}
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
                  minHeight: 44,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t('tools.download')}
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
