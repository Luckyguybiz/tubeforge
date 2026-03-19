'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const QUALITY_VALUES = ['1080p', '720p', '480p', '360p', 'audio'] as const;
const QUALITY_LABELS: Record<(typeof QUALITY_VALUES)[number], string> = {
  '1080p': '1080p',
  '720p': '720p',
  '480p': '480p',
  '360p': '360p',
  audio: 'Только аудио',
};
const FORMATS = ['MP4', 'WebM', 'MP3'] as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B/s';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB/s';
  return (bytes / 1048576).toFixed(1) + ' MB/s';
}

function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '';
  if (seconds < 60) return `~${Math.ceil(seconds)}s`;
  return `~${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
}

interface VideoInfo {
  videoId: string;
  title: string;
  channel: string;
  channelUrl: string;
  thumbnail: string;
  thumbnailHq: string;
  thumbnailMq: string;
  watchUrl: string;
  formats: { quality: string; ext: string; label: string }[];
}


function isValidYoutubeUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?.*v=|shorts\/|embed\/|live\/)|youtu\.be\/)[\w-]+/.test(url.trim());
}

export function YoutubeDownloader() {
  const C = useThemeStore((s) => s.theme);

  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState<(typeof QUALITY_VALUES)[number]>('1080p');
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('MP4');
  const [loading, setLoading] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [done, setDone] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [hoveredQuality, setHoveredQuality] = useState<string | null>(null);
  const [hoveredFormat, setHoveredFormat] = useState<string | null>(null);
  const [pasteHover, setPasteHover] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [streamError, setStreamError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadEta, setDownloadEta] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // AbortController ref for cancelling in-flight fetch requests on unmount
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight requests on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ── Fetch video info from our API ──────────────────────────────
  const fetchVideoInfo = useCallback(async (videoUrl: string) => {
    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setFetchingInfo(true);
    setFetchError('');
    setVideoInfo(null);
    setThumbError(false);
    setDone(false);

    try {
      const res = await fetch(
        `/api/tools/youtube-download?url=${encodeURIComponent(videoUrl)}`,
        { signal: controller.signal },
      );

      // Check content-type BEFORE trying to parse JSON — API may return
      // HTML (e.g. redirect to login) which would crash res.json()
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        if (res.status === 401 || res.redirected) {
          setFetchError('Сессия истекла. Пожалуйста, обновите страницу.');
        } else {
          setFetchError(`Сервер вернул некорректный ответ (${res.status}). Попробуйте позже.`);
        }
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setFetchError(data.error ?? 'Не удалось загрузить информацию о видео');
        return;
      }

      setVideoInfo(data as VideoInfo);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('[YoutubeDownloader] fetchVideoInfo error:', err);
      setFetchError('Ошибка сети. Проверьте подключение к интернету.');
    } finally {
      setFetchingInfo(false);
    }
  }, []);

  // ── Auto-fetch when a valid URL is entered (debounced 600ms) ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!url.trim() || !isValidYoutubeUrl(url)) return;

    debounceRef.current = setTimeout(() => {
      fetchVideoInfo(url);
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [url, fetchVideoInfo]);

  // ── URL validation (immediate) ─────────────────────────────────
  const validateUrl = useCallback((value: string) => {
    if (!value.trim()) {
      setUrlError('');
      return false;
    }
    if (!isValidYoutubeUrl(value)) {
      setUrlError('Введите корректную ссылку YouTube');
      return false;
    }
    setUrlError('');
    return true;
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setUrlError('');
      setDone(false);
      // Validation + fetch will be triggered by useEffect
    } catch {
      /* clipboard not available */
    }
  };

  const clearUrl = () => {
    setUrl('');
    setVideoInfo(null);
    setUrlError('');
    setFetchError('');
    setDone(false);
    setThumbError(false);
    setStreamError('');
  };

  // ── Show toast helper ──────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  }, []);


  // ── Download handler ───────────────────────────────────────────
  const handleDownload = async () => {
    if (!url.trim() || !isValidYoutubeUrl(url)) {
      setUrlError('Введите корректную ссылку YouTube');
      return;
    }

    if (!videoInfo) {
      showToast('Подождите, пока загрузится информация о видео.');
      return;
    }

    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setDone(false);
    setStreamError('');
    setDownloadProgress(0);
    setDownloadEta(0);
    setDownloadSpeed(0);

    try {
      const isAudioOnly = quality === 'audio';
      const res = await fetch('/api/tools/youtube-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoInfo.videoId,
          quality,
          audioOnly: isAudioOnly,
        }),
        signal: controller.signal,
      });

      // Validate JSON response before parsing
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        if (res.status === 401 || res.redirected) {
          setStreamError('Сессия истекла. Пожалуйста, обновите страницу.');
        } else {
          setStreamError(`Сервер вернул некорректный ответ (${res.status}).`);
        }
        setDone(true);
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.downloadUrl) {
        setStreamError(data.error ?? 'Не удалось получить ссылку на скачивание');
        setDone(true);
        return;
      }

      // Stream the download to track real progress
      const downloadRes = await fetch(data.downloadUrl, { signal: controller.signal });
      if (!downloadRes.ok) {
        setStreamError('Не удалось скачать файл с сервера');
        setDone(true);
        return;
      }

      const contentLength = parseInt(downloadRes.headers.get('content-length') || '0', 10);
      const reader = downloadRes.body?.getReader();
      if (!reader) throw new Error('No reader');

      const chunks: BlobPart[] = [];
      let received = 0;
      const startTime = Date.now();

      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;
        chunks.push(value);
        received += value.length;

        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? received / elapsed : 0;
        const progress = contentLength > 0 ? received / contentLength : 0;
        const remaining = contentLength > 0 && speed > 0 ? (contentLength - received) / speed : 0;

        setDownloadProgress(Math.round(progress * 100));
        setDownloadEta(remaining);
        setDownloadSpeed(speed);
      }

      setDownloadProgress(100);

      // Combine chunks into a blob and trigger download
      const blob = new Blob(chunks);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${videoInfo.title || videoInfo.videoId || 'video'}.${isAudioOnly ? 'mp3' : 'mp4'}`;
      a.click();
      URL.revokeObjectURL(blobUrl);

      showToast('Скачивание завершено!');
      setDone(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setStreamError('Ошибка сети. Проверьте подключение к интернету.');
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  // Determine the thumbnail src (fall back to hq/mq if maxres fails)
  const thumbnailSrc = videoInfo
    ? thumbError
      ? videoInfo.thumbnailMq
      : videoInfo.thumbnail
    : null;

  return (
    <ToolPageShell
      title="Скачать видео с YouTube"
      subtitle="Скачивайте видео с YouTube в любом качестве и формате"
      gradient={['#ef4444', '#dc2626']}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            padding: '12px 24px',
            borderRadius: 12,
            background: C.card,
            border: `1px solid ${C.border}`,
            boxShadow: '0 8px 32px rgba(0,0,0,.25)',
            color: C.text,
            fontSize: 14,
            fontWeight: 600,
            maxWidth: 480,
            textAlign: 'center',
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* URL Input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: urlError || fetchError ? 8 : 24 }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: C.surface,
            border: `1px solid ${urlError ? '#ef4444' : C.border}`,
            borderRadius: 12,
            padding: '0 16px',
            gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={C.dim}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          <input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setUrlError('');
              setFetchError('');
              setDone(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                validateUrl(url);
              }
            }}
            onBlur={() => {
              if (url.trim()) validateUrl(url);
            }}
            placeholder="Вставьте ссылку YouTube..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: C.text,
              fontSize: 14,
              padding: '14px 0',
              fontFamily: 'inherit',
            }}
          />
          {/* Loading spinner inside input */}
          {fetchingInfo && (
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke={C.dim}
                strokeWidth="2"
                fill="none"
                opacity={0.3}
              />
              <path
                d="M8 2a6 6 0 014.47 2"
                stroke={C.text}
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          )}
          {url && !fetchingInfo && (
            <button
              onClick={clearUrl}
              aria-label="Clear URL"
              style={{
                background: 'none',
                border: 'none',
                color: C.dim,
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={handlePaste}
          onMouseEnter={() => setPasteHover(true)}
          onMouseLeave={() => setPasteHover(false)}
          style={{
            padding: '0 20px',
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            background: pasteHover ? C.surface : C.card,
            color: C.text,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Вставить
        </button>
      </div>

      {/* URL Error */}
      {urlError && (
        <div
          style={{
            fontSize: 12,
            color: '#ef4444',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {urlError}
        </div>
      )}

      {/* Fetch Error */}
      {fetchError && !urlError && (
        <div
          style={{
            fontSize: 12,
            color: '#f59e0b',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {fetchError}
        </div>
      )}

      {/* Video Info Preview - Real data from API */}
      {videoInfo && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            padding: 16,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            background: C.card,
            marginBottom: 24,
          }}
        >
          {/* Real Thumbnail */}
          <div
            style={{
              width: 200,
              height: 112,
              borderRadius: 10,
              background: C.surface,
              overflow: 'hidden',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            {thumbnailSrc ? (
              <img
                src={thumbnailSrc}
                alt={videoInfo.title}
                onError={() => setThumbError(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={C.dim}
                  strokeWidth="1.5"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <polygon points="10 8 16 12 10 16" fill={C.dim} stroke="none" />
                </svg>
              </div>
            )}
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 6,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: C.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {videoInfo.title}
            </div>
            <a
              href={videoInfo.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: C.sub,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              {videoInfo.channel}
            </a>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              {videoInfo.formats.slice(0, 3).map((f) => (
                <span
                  key={f.quality}
                  style={{
                    fontSize: 11,
                    color: C.dim,
                    background: C.surface,
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}
                >
                  {f.quality} {f.ext.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fetching Info Skeleton */}
      {fetchingInfo && !videoInfo && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            padding: 16,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            background: C.card,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 200,
              height: 112,
              borderRadius: 10,
              background: C.surface,
              flexShrink: 0,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: '80%',
                height: 16,
                borderRadius: 4,
                background: C.surface,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                width: '40%',
                height: 12,
                borderRadius: 4,
                background: C.surface,
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: '0.2s',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {[60, 50, 50].map((w, i) => (
                <div
                  key={i}
                  style={{
                    width: w,
                    height: 20,
                    borderRadius: 6,
                    background: C.surface,
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: `${0.1 * (i + 1)}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quality Selector */}
      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: C.sub,
            display: 'block',
            marginBottom: 8,
          }}
        >
          Качество
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUALITY_VALUES.map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              onMouseEnter={() => setHoveredQuality(q)}
              onMouseLeave={() => setHoveredQuality(null)}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                border: quality === q ? '2px solid #ef4444' : `1px solid ${C.border}`,
                background:
                  quality === q
                    ? 'rgba(239,68,68,.12)'
                    : hoveredQuality === q
                      ? C.surface
                      : C.card,
                color: quality === q ? '#ef4444' : C.text,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
              }}
            >
              {QUALITY_LABELS[q]}
            </button>
          ))}
        </div>
      </div>

      {/* Format Selector */}
      <div style={{ marginBottom: 28 }}>
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: C.sub,
            display: 'block',
            marginBottom: 8,
          }}
        >
          Формат
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {FORMATS.map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              onMouseEnter={() => setHoveredFormat(f)}
              onMouseLeave={() => setHoveredFormat(null)}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                border: format === f ? '2px solid #ef4444' : `1px solid ${C.border}`,
                background:
                  format === f
                    ? 'rgba(239,68,68,.12)'
                    : hoveredFormat === f
                      ? C.surface
                      : C.card,
                color: format === f ? '#ef4444' : C.text,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Progress / Loading State for Download */}
      {loading && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.sub }}>
              {downloadProgress > 0
                ? `Скачивание... ${downloadProgress}%`
                : 'Подготовка скачивания...'}
            </span>
            {downloadProgress > 0 && (
              <span style={{ fontSize: 12, color: C.dim }}>
                {formatBytes(downloadSpeed)}
                {downloadEta > 0 ? ` \u2022 ${formatEta(downloadEta)}` : ''}
              </span>
            )}
          </div>
          <div style={{ width: '100%', height: 8, borderRadius: 4, background: C.surface }}>
            <div
              style={{
                width: downloadProgress > 0 ? `${downloadProgress}%` : '60%',
                height: '100%',
                borderRadius: 4,
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                transition: downloadProgress > 0 ? 'width 0.3s ease' : undefined,
                animation: downloadProgress === 0 ? 'pulse 1s ease-in-out infinite' : undefined,
              }}
            />
          </div>
        </div>
      )}

      {/* Download success message */}
      {done && !loading && !streamError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(34,197,94,.3)',
            background: 'rgba(34,197,94,.06)',
            marginBottom: 20,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
              Скачивание завершено! Проверьте папку загрузок.
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
              Файл сохранён на ваш компьютер.
            </div>
          </div>
        </div>
      )}

      {/* Download error message */}
      {done && !loading && streamError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(239,68,68,.3)',
            background: 'rgba(239,68,68,.06)',
            marginBottom: 20,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>
              {streamError}
            </div>
            {videoInfo && (
              <a
                href={videoInfo.watchUrl || `https://www.youtube.com/watch?v=${videoInfo.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 4,
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: '#ff0000',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Открыть на YouTube
              </a>
            )}
          </div>
        </div>
      )}


      {/* Download Button */}
      <ActionButton
        label={
          fetchingInfo
            ? 'Загрузка информации...'
            : done
              ? 'Скачать снова'
              : videoInfo
                ? 'Скачать'
                : 'Скачать'
        }
        gradient={['#ef4444', '#dc2626']}
        onClick={handleDownload}
        disabled={!url.trim() || !!urlError || fetchingInfo}
        loading={loading}
      />

      {/* CSS Keyframes for skeleton pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ToolPageShell>
  );
}
