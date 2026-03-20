'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

const QUALITY_VALUES = ['hd', 'sd', 'audio'] as const;
const FORMATS = ['MP4', 'MP3'] as const;

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
  title: string;
  author: string;
  authorUrl: string;
  thumbnail: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  originalUrl: string;
}

function isValidTiktokUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.|vm\.)?tiktok\.com\/(@[\w.-]+\/video\/\d+|[\w]+)/i.test(
    url.trim(),
  );
}

export function TiktokDownloader() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  const QUALITY_LABELS: Record<(typeof QUALITY_VALUES)[number], string> = {
    hd: t('tools.ttdl.qualityHd'),
    sd: t('tools.ttdl.qualitySd'),
    audio: t('tools.ttdl.audioOnly'),
  };

  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState<(typeof QUALITY_VALUES)[number]>('hd');
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('MP4');
  const [removeWatermark, setRemoveWatermark] = useState(true);
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

  // Fetch video info from our API
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

    // Auto-abort after 15 seconds to prevent hanging spinner
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const res = await fetch(
        `/api/tools/tiktok-download?url=${encodeURIComponent(videoUrl)}`,
        { signal: controller.signal },
      );

      // Check content-type BEFORE trying to parse JSON
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        if (res.status === 401 || res.redirected) {
          setFetchError(t('tools.ttdl.sessionExpired'));
        } else {
          setFetchError(`${t('tools.ttdl.serverError')} (${res.status})`);
        }
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setFetchError(data.error ?? t('tools.ttdl.fetchError'));
        return;
      }

      setVideoInfo(data as VideoInfo);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (controller.signal.aborted && abortRef.current === controller) {
          setFetchError(t('tools.ttdl.serverTimeout'));
        }
        return;
      }
      console.error('[TiktokDownloader] fetchVideoInfo error:', err);
      setFetchError(t('tools.ttdl.networkError'));
    } finally {
      clearTimeout(timeout);
      setFetchingInfo(false);
    }
  }, [t]);

  // Auto-fetch when a valid URL is entered (debounced 600ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!url.trim() || !isValidTiktokUrl(url)) return;

    debounceRef.current = setTimeout(() => {
      fetchVideoInfo(url);
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [url, fetchVideoInfo]);

  // URL validation (immediate)
  const validateUrl = useCallback(
    (value: string) => {
      if (!value.trim()) {
        setUrlError('');
        return false;
      }
      if (!isValidTiktokUrl(value)) {
        setUrlError(t('tools.ttdl.invalidUrl'));
        return false;
      }
      setUrlError('');
      return true;
    },
    [t],
  );

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

  // Show toast helper
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  }, []);

  // Download handler
  const handleDownload = async () => {
    if (!url.trim() || !isValidTiktokUrl(url)) {
      setUrlError(t('tools.ttdl.invalidUrl'));
      return;
    }

    if (!videoInfo) {
      showToast(t('tools.ttdl.waitForInfo'));
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

    // Timeout for the initial API call (not the download stream)
    const postTimeout = setTimeout(() => {
      if (!controller.signal.aborted) controller.abort();
    }, 20_000);

    try {
      const isAudioOnly = quality === 'audio' || format === 'MP3';
      const res = await fetch('/api/tools/tiktok-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: videoInfo.originalUrl,
          quality,
          audioOnly: isAudioOnly,
          removeWatermark,
        }),
        signal: controller.signal,
      });

      // POST succeeded -- clear the timeout before starting the long download
      clearTimeout(postTimeout);

      // Validate JSON response before parsing
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        if (res.status === 401 || res.redirected) {
          setStreamError(t('tools.ttdl.sessionExpired'));
        } else {
          setStreamError(`${t('tools.ttdl.serverError')} (${res.status})`);
        }
        setDone(true);
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.downloadUrl) {
        setStreamError(data.error ?? t('tools.ttdl.downloadLinkError'));
        setDone(true);
        return;
      }

      // Stream download through our server-side proxy to avoid Mixed Content / CORS issues
      const ext = isAudioOnly ? 'mp3' : 'mp4';
      const safeTitle = (videoInfo.title || 'tiktok-video')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .slice(0, 80);
      const fname = `${safeTitle}.${ext}`;
      const proxyUrl = `/api/tools/youtube-download/stream?url=${encodeURIComponent(data.downloadUrl)}&filename=${encodeURIComponent(fname)}`;

      const downloadRes = await fetch(proxyUrl, { signal: controller.signal });
      if (!downloadRes.ok) {
        // Try fallback: open download URL directly via anchor tag
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = fname;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(t('tools.ttdl.downloadComplete'));
        setDone(true);
        return;
      }

      const MAX_DOWNLOAD_SIZE = 500 * 1024 * 1024; // 500 MB safety limit
      const contentLength = parseInt(
        downloadRes.headers.get('content-length') || '0',
        10,
      );

      // Reject early if Content-Length already exceeds the limit
      if (contentLength > MAX_DOWNLOAD_SIZE) {
        setStreamError(t('tools.ttdl.fileTooLarge'));
        setDone(true);
        return;
      }

      const reader = downloadRes.body?.getReader();
      if (!reader) throw new Error('No reader');

      const chunks: BlobPart[] = [];
      let received = 0;
      const startTime = Date.now();

      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;
        received += value.length;

        // Abort if accumulated size exceeds the safety limit
        if (received > MAX_DOWNLOAD_SIZE) {
          reader.cancel();
          setStreamError(t('tools.ttdl.fileTooLarge'));
          setDone(true);
          return;
        }

        chunks.push(value);

        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? received / elapsed : 0;
        const progress = contentLength > 0 ? received / contentLength : 0;
        const remaining =
          contentLength > 0 && speed > 0
            ? (contentLength - received) / speed
            : 0;

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
      a.download = fname;
      a.click();
      URL.revokeObjectURL(blobUrl);

      showToast(t('tools.ttdl.downloadComplete'));
      setDone(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (controller.signal.aborted && abortRef.current === controller) {
          setStreamError(t('tools.ttdl.serverTimeout'));
          setDone(true);
        }
        return;
      }
      setStreamError(t('tools.ttdl.networkError'));
      setDone(true);
    } finally {
      clearTimeout(postTimeout);
      setLoading(false);
    }
  };

  return (
    <ToolPageShell
      title={t('tools.ttdl.title')}
      subtitle={t('tools.ttdl.subtitle')}
      gradient={['#000000', '#333333']}
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
            width: 'calc(100vw - 32px)',
            maxWidth: 480,
            textAlign: 'center',
            wordBreak: 'break-word' as const,
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* URL Input */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: urlError || fetchError ? 8 : 24,
          flexWrap: 'wrap',
        }}
      >
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
            placeholder={t('tools.ttdl.placeholder')}
            aria-label="TikTok video URL"
            aria-invalid={!!urlError || undefined}
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
              style={{
                animation: 'spin 1s linear infinite',
                flexShrink: 0,
              }}
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
            minHeight: 44,
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
            flexShrink: 0,
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
          {t('tools.ttdl.paste')}
        </button>
      </div>

      {/* URL Error */}
      {urlError && (
        <div
          role="alert"
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
            flexWrap: 'wrap',
          }}
        >
          {/* Thumbnail */}
          <div
            style={{
              width: 120,
              maxWidth: '100%',
              height: 160,
              borderRadius: 10,
              background: C.surface,
              overflow: 'hidden',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            {videoInfo.thumbnail && !thumbError ? (
              <Image
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                width={120}
                height={160}
                onError={() => setThumbError(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                unoptimized
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
                  <polygon
                    points="5 3 19 12 5 21"
                    fill={C.dim}
                    stroke="none"
                    opacity={0.3}
                  />
                  <polygon points="5 3 19 12 5 21" />
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
              flexBasis: 180,
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
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word' as const,
              }}
            >
              {videoInfo.title}
            </div>
            <a
              href={videoInfo.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: C.sub,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {videoInfo.author}
            </a>
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
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 120,
              maxWidth: '100%',
              height: 160,
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
                width: '60%',
                height: 14,
                borderRadius: 4,
                background: C.surface,
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: '0.15s',
              }}
            />
            <div
              style={{
                width: '40%',
                height: 12,
                borderRadius: 4,
                background: C.surface,
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: '0.3s',
              }}
            />
          </div>
        </div>
      )}

      {/* Options: Remove Watermark */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            background: C.card,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
              {t('tools.ttdl.removeWatermark')}
            </div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
              {t('tools.ttdl.removeWatermarkDesc')}
            </div>
          </div>
          <button
            onClick={() => setRemoveWatermark(!removeWatermark)}
            aria-label="Toggle remove watermark"
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: 'none',
              background: removeWatermark ? '#000' : C.surface,
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: removeWatermark ? '0 0 8px rgba(0,0,0,.3)' : 'none',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                background: '#fff',
                position: 'absolute',
                top: 3,
                left: removeWatermark ? 23 : 3,
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,.2)',
              }}
            />
          </button>
        </div>
      </div>

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
          {t('tools.ttdl.quality')}
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUALITY_VALUES.map((q) => (
            <button
              key={q}
              onClick={() => {
                setQuality(q);
                if (q === 'audio') setFormat('MP3');
                else if (format === 'MP3') setFormat('MP4');
              }}
              onMouseEnter={() => setHoveredQuality(q)}
              onMouseLeave={() => setHoveredQuality(null)}
              style={{
                padding: '8px 18px',
                minHeight: 44,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                border:
                  quality === q
                    ? '2px solid #000'
                    : `1px solid ${C.border}`,
                background:
                  quality === q
                    ? 'rgba(0,0,0,.1)'
                    : hoveredQuality === q
                      ? C.surface
                      : C.card,
                color: quality === q ? C.text : C.sub,
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
          {t('tools.ttdl.format')}
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FORMATS.map((f) => (
            <button
              key={f}
              onClick={() => {
                setFormat(f);
                if (f === 'MP3') setQuality('audio');
                else if (quality === 'audio') setQuality('hd');
              }}
              onMouseEnter={() => setHoveredFormat(f)}
              onMouseLeave={() => setHoveredFormat(null)}
              style={{
                padding: '8px 18px',
                minHeight: 44,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                border:
                  format === f
                    ? '2px solid #000'
                    : `1px solid ${C.border}`,
                background:
                  format === f
                    ? 'rgba(0,0,0,.1)'
                    : hoveredFormat === f
                      ? C.surface
                      : C.card,
                color: format === f ? C.text : C.sub,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
              }}
            >
              {f}
              {f === 'MP3' && (
                <span style={{ fontSize: 10, color: C.dim, marginLeft: 4 }}>
                  ({t('tools.ttdl.audioOnly')})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Progress / Loading State for Download */}
      {loading && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 12, color: C.sub }}>
              {downloadProgress > 0
                ? `${t('tools.ttdl.downloading')} ${downloadProgress}%`
                : t('tools.ttdl.preparing')}
            </span>
            {downloadProgress > 0 && (
              <span style={{ fontSize: 12, color: C.dim }}>
                {formatBytes(downloadSpeed)}
                {downloadEta > 0 ? ` \u2022 ${formatEta(downloadEta)}` : ''}
              </span>
            )}
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
              borderRadius: 4,
              background: C.surface,
            }}
          >
            <div
              style={{
                width: downloadProgress > 0 ? `${downloadProgress}%` : '60%',
                height: '100%',
                borderRadius: 4,
                background: 'linear-gradient(135deg, #000, #333)',
                transition:
                  downloadProgress > 0 ? 'width 0.3s ease' : undefined,
                animation:
                  downloadProgress === 0
                    ? 'pulse 1s ease-in-out infinite'
                    : undefined,
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
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, wordBreak: 'break-word' as const }}>
              {t('tools.ttdl.downloadDone')}
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
              {t('tools.ttdl.fileSaved')}
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
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.text,
                marginBottom: 4,
                wordBreak: 'break-word' as const,
              }}
            >
              {streamError}
            </div>
            {videoInfo && (
              <a
                href={videoInfo.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 4,
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: '#000',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                {t('tools.ttdl.openOnTikTok')}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Download Button */}
      <ActionButton
        label={
          fetchingInfo
            ? t('tools.ttdl.loadingInfo')
            : done
              ? t('tools.ttdl.downloadAgain')
              : t('tools.download')
        }
        gradient={['#000000', '#333333']}
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
