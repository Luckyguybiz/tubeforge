'use client';

import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const BITRATES = ['128', '192', '256', '320'] as const;
const SAMPLE_RATES = ['44.1kHz', '48kHz'] as const;
const OUTPUT_FORMATS = ['mp3', 'wav', 'aac', 'ogg'] as const;
type OutputFormat = (typeof OUTPUT_FORMATS)[number];

const FORMAT_LABELS: Record<OutputFormat, string> = {
  mp3: 'MP3',
  wav: 'WAV',
  aac: 'AAC',
  ogg: 'OGG',
};

const MIME_MAP: Record<OutputFormat, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
};

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} МБ`;
  return `${(bytes / 1024).toFixed(1)} КБ`;
}

export function Mp3Converter() {
  const C = useThemeStore((s) => s.theme);

  const [file, setFile] = useState<File | null>(null);
  const [bitrate, setBitrate] = useState<(typeof BITRATES)[number]>('256');
  const [sampleRate, setSampleRate] = useState<(typeof SAMPLE_RATES)[number]>('44.1kHz');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('mp3');
  const [trimStart, setTrimStart] = useState('');
  const [trimEnd, setTrimEnd] = useState('');
  const [outputName, setOutputName] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedSize, setConvertedSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBitrate, setHoveredBitrate] = useState<string | null>(null);
  const [hoveredSample, setHoveredSample] = useState<string | null>(null);
  const [hoveredFormat, setHoveredFormat] = useState<string | null>(null);
  const [downloadHover, setDownloadHover] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FFmpeg state
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    setFfmpegLoading(true);
    setError(null);
    try {
      const ffmpeg = new FFmpeg();
      // Self-hosted files avoid COEP/CORS issues
      await ffmpeg.load({
        coreURL: '/ffmpeg/ffmpeg-core.js',
        wasmURL: '/ffmpeg/ffmpeg-core.wasm',
      });

      ffmpegRef.current = ffmpeg;
      return ffmpeg;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Не удалось загрузить модуль обработки: ${msg}`);
      ffmpegRef.current = null;
      throw err;
    } finally {
      setFfmpegLoading(false);
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setDone(false);
    setProgress(0);
    setConvertedBlob(null);
    setConvertedSize(0);
    setError(null);

    try {
      const ffmpeg = await loadFFmpeg();

      const inputExt = file.name.split('.').pop() || 'mp4';
      const inputName = `input.${inputExt}`;
      const outputName_ = `output.${outputFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const onProgress = ({ progress: p }: { progress: number; time: number }) => {
        setProgress(Math.round(p * 100));
      };
      ffmpeg.on('progress', onProgress);

      const sr = sampleRate === '48kHz' ? '48000' : '44100';
      const args = ['-i', inputName];

      // Trim args
      if (trimStart) {
        args.splice(0, 0, '-ss', trimStart);
      }
      if (trimEnd) {
        args.push('-to', trimEnd);
      }

      // Format-specific encoding
      switch (outputFormat) {
        case 'mp3':
          args.push('-vn', '-ar', sr, '-ab', `${bitrate}k`, '-f', 'mp3', outputName_);
          break;
        case 'wav':
          args.push('-vn', '-ar', sr, outputName_);
          break;
        case 'aac':
          args.push('-vn', '-ar', sr, '-ab', `${bitrate}k`, '-c:a', 'aac', outputName_);
          break;
        case 'ogg':
          args.push('-vn', '-ar', sr, '-ab', `${bitrate}k`, '-c:a', 'libvorbis', outputName_);
          break;
      }

      const exitCode = await ffmpeg.exec(args);
      ffmpeg.off('progress', onProgress);

      if (exitCode !== 0) {
        throw new Error(`FFmpeg завершился с кодом ${exitCode}`);
      }

      const output = await ffmpeg.readFile(outputName_);
      const rawBytes = output instanceof Uint8Array ? output : new TextEncoder().encode(output);
      const blob = new Blob([new Uint8Array(rawBytes) as BlobPart], { type: MIME_MAP[outputFormat] });

      setConvertedBlob(blob);
      setConvertedSize(blob.size);
      setProgress(100);
      setDone(true);

      // Clean up virtual filesystem
      try { await ffmpeg.deleteFile(inputName); } catch { /* noop */ }
      try { await ffmpeg.deleteFile(outputName_); } catch { /* noop */ }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Conversion error:', err);
      setError(err instanceof Error ? err.message : 'Не удалось конвертировать файл');
    } finally {
      setLoading(false);
    }
  }, [file, bitrate, sampleRate, outputFormat, trimStart, trimEnd, loadFFmpeg]);

  const handleDownload = useCallback(() => {
    if (!convertedBlob || !file) return;
    const url = URL.createObjectURL(convertedBlob);
    const link = document.createElement('a');
    const baseName = outputName || file.name.replace(/\.[^/.]+$/, '');
    link.href = url;
    link.download = `${baseName}.${outputFormat}`;
    link.click();
    URL.revokeObjectURL(url);
  }, [convertedBlob, file, outputName, outputFormat]);

  const handleReset = useCallback(() => {
    setFile(null);
    setDone(false);
    setOutputName('');
    setTrimStart('');
    setTrimEnd('');
    setConvertedBlob(null);
    setConvertedSize(0);
    setProgress(0);
    setError(null);
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
      setError(null);
    }
  }, []);

  /* Whether bitrate is relevant for the chosen format */
  const bitrateRelevant = outputFormat !== 'wav';

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
                if (f) { setFile(f); setDone(false); setConvertedBlob(null); setConvertedSize(0); setProgress(0); setError(null); }
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

          {/* Output Format Selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Формат</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {OUTPUT_FORMATS.map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setOutputFormat(fmt)}
                  onMouseEnter={() => setHoveredFormat(fmt)}
                  onMouseLeave={() => setHoveredFormat(null)}
                  style={{
                    padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    border: outputFormat === fmt ? '2px solid #10b981' : `1px solid ${C.border}`,
                    background: outputFormat === fmt ? 'rgba(16,185,129,.1)' : hoveredFormat === fmt ? C.surface : C.card,
                    color: outputFormat === fmt ? '#10b981' : C.text,
                    cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                  }}
                >
                  {FORMAT_LABELS[fmt]}
                </button>
              ))}
            </div>
          </div>

          {/* Bitrate Selector */}
          {bitrateRelevant && (
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
          )}

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
              <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>.{outputFormat}</span>
            </div>
          </div>

          {/* FFmpeg loading state */}
          {ffmpegLoading && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
              border: `1px solid ${C.border}`, background: C.surface, marginBottom: 16,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>
                Загрузка модуля конвертации...
              </span>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Progress bar */}
          {loading && !ffmpegLoading && (
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

          {/* Error state */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
              border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)', marginBottom: 16,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                {error}
              </span>
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
