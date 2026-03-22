'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import type { Theme } from '@/lib/types';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ── Types ─────────────────────────────────────────────────────────── */

interface VideoInfo {
  videoId: string;
  title: string;
  channel: string;
  channelUrl: string;
  thumbnail: string;
  thumbnailHq: string;
  thumbnailMq: string;
  watchUrl: string;
}

/** Full analysis result from YouTube Data API v3 */
interface FullAnalysisResult {
  videoId: string;
  title: string;
  channel: string;
  channelUrl: string;
  thumbnail: string;
  watchUrl: string;
  publishedAt: string;
  duration: string;
  durationFormatted: string;
  definition: string;
  hasCaptions: boolean;
  category: string;
  language: string;
  statistics: { views: number; likes: number; comments: number };
  description: string;
  tags: string[];
  isShorts: boolean;
  scores: {
    overall: number;
    title: number;
    description: number;
    tags: number;
    thumbnail: number;
    engagement: number;
    seo: number;
  };
  metrics: {
    likeRate: number;
    commentRate: number;
    viewsPerDay: number;
    estimatedCTR: 'high' | 'medium' | 'low';
    benchmarkComparison: 'above_average' | 'average' | 'below_average';
  };
  suggestions: string[];
  structure: {
    hasTimestamps: boolean;
    hasLinks: boolean;
    hasHashtags: boolean;
    hasCTA: boolean;
    descriptionLength: number;
  };
  apiSource: 'youtube-data-api-v3';
}

/** Fallback oEmbed-only result */
interface FallbackAnalysisResult {
  videoId: string;
  title: string;
  channel: string;
  channelUrl: string;
  thumbnail: string;
  watchUrl: string;
  analysis: {
    overall: number;
    titleOptimization: number;
    keywordUsage: number;
    engagementPotential: number;
    titleLength: number;
    suggestions: string[];
  };
  apiSource: 'oembed-fallback';
  note: string;
}

type AnalysisResult = FullAnalysisResult | FallbackAnalysisResult;

function isFullAnalysis(r: AnalysisResult): r is FullAnalysisResult {
  return r.apiSource === 'youtube-data-api-v3';
}

function isValidYoutubeUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?.*v=|shorts\/|embed\/|live\/)|youtu\.be\/)[\w-]+/.test(url.trim());
}

/* ── Helpers ───────────────────────────────────────────────────────── */

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

/* ── Circular Score Gauge ──────────────────────────────────────────── */

function CircularGauge({ score, label, size = 90 }: { score: number; label: string; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={5}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size > 80 ? 22 : 18,
            fontWeight: 800,
            color,
          }}
        >
          {score}
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#86868b', textAlign: 'center', lineHeight: 1.2 }}>
        {label}
      </span>
    </div>
  );
}

/* ── Score Bar (used in fallback view) ─────────────────────────────── */

function ScoreBar({ label, score, C }: { label: string; score: number; C: Theme }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(score) }}>{score}/100</span>
      </div>
      <div style={{ width: '100%', height: 8, borderRadius: 4, background: C.surface }}>
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            borderRadius: 4,
            background: scoreColor(score),
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────────────── */

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        flex: '1 1 140px',
        padding: '14px 16px',
        borderRadius: 14,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: '#f5f5f7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f' }}>{value}</div>
        <div style={{ fontSize: 11, color: '#86868b', fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: '#a1a1aa', fontWeight: 500, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── Structure Check Item ──────────────────────────────────────────── */

function CheckItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          background: checked ? '#22c55e' : '#e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 13, color: checked ? '#1d1d1f' : '#86868b', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

/* ── Loading Skeleton ──────────────────────────────────────────────── */

function AnalysisSkeleton() {
  const bar = (w: string, h: number, delay: string) => (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: h > 10 ? 12 : 6,
        background: '#e5e7eb',
        animation: 'pulse 1.5s ease-in-out infinite',
        animationDelay: delay,
      }}
    />
  );

  return (
    <div style={{ padding: 20, borderRadius: 16, background: '#f5f5f7', marginBottom: 24 }}>
      {/* Gauge skeleton */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#e5e7eb',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`,
              }}
            />
            {bar('60px', 10, `${i * 0.1}s`)}
          </div>
        ))}
      </div>
      {/* Stat cards skeleton */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ flex: '1 1 140px', padding: 14, borderRadius: 14, background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)' }}>
            {bar('60%', 18, `${i * 0.15}s`)}
            <div style={{ marginTop: 6 }}>{bar('40%', 10, `${i * 0.15}s`)}</div>
          </div>
        ))}
      </div>
      {/* Suggestions skeleton */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ marginBottom: 8 }}>{bar('100%', 40, `${i * 0.1}s`)}</div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
 * Main Component
 * ══════════════════════════════════════════════════════════════════════ */

export function YoutubeDownloader() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [urlError, setUrlError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [pasteHover, setPasteHover] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Fetch video info from our API
  const fetchVideoInfo = useCallback(async (videoUrl: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setFetchingInfo(true);
    setFetchError('');
    setVideoInfo(null);
    setAnalysis(null);

    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const res = await fetch(
        `/api/tools/youtube-download?url=${encodeURIComponent(videoUrl)}`,
        { signal: controller.signal },
      );

      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        if (res.status === 401 || res.redirected) {
          setFetchError(t('tools.ytdl.sessionExpired'));
        } else {
          setFetchError(`${t('tools.ytdl.serverError')} (${res.status})`);
        }
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setFetchError(data.error ?? t('tools.ytdl.fetchError'));
        return;
      }

      setVideoInfo(data as VideoInfo);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (controller.signal.aborted && abortRef.current === controller) {
          setFetchError(t('tools.ytdl.serverTimeout'));
        }
        return;
      }
      console.error('[VideoAnalyzer] fetchVideoInfo error:', err);
      setFetchError(t('tools.ytdl.networkError'));
    } finally {
      clearTimeout(timeout);
      setFetchingInfo(false);
    }
  }, [t]);

  // Auto-fetch when a valid URL is entered (debounced 600ms)
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

  const validateUrl = useCallback((value: string) => {
    if (!value.trim()) {
      setUrlError('');
      return false;
    }
    if (!isValidYoutubeUrl(value)) {
      setUrlError(t('tools.ytdl.invalidUrl'));
      return false;
    }
    setUrlError('');
    return true;
  }, [t]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setUrlError('');
      setAnalysis(null);
    } catch {
      /* clipboard not available */
    }
  };

  const clearUrl = () => {
    setUrl('');
    setVideoInfo(null);
    setUrlError('');
    setFetchError('');
    setAnalysis(null);
  };

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  }, []);

  // Analyze handler
  const handleAnalyze = async () => {
    if (!url.trim() || !isValidYoutubeUrl(url)) {
      setUrlError(t('tools.ytdl.invalidUrl'));
      return;
    }

    if (!videoInfo) {
      showToast(t('tools.ytdl.waitForInfo'));
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setAnalysis(null);

    const analysisTimeout = setTimeout(() => {
      if (!controller.signal.aborted) controller.abort();
    }, 30_000);

    try {
      const res = await fetch('/api/tools/youtube-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: videoInfo.videoId }),
        signal: controller.signal,
      });

      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        setFetchError(t('tools.ytdl.serverError'));
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setFetchError(data.error ?? t('tools.ytdl.fetchError'));
        return;
      }

      setAnalysis(data as AnalysisResult);
      showToast(t('tools.ytdl.analysisComplete'));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (controller.signal.aborted && abortRef.current === controller) {
          setFetchError(t('tools.ytdl.serverTimeout'));
        }
        return;
      }
      setFetchError(t('tools.ytdl.networkError'));
    } finally {
      clearTimeout(analysisTimeout);
      setLoading(false);
    }
  };

  /* ── SVG icon helpers ──────────────────────────────────────────── */
  const viewsIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
  const likesIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 00-6 0v4" /><path d="M3 15a2 2 0 002 2h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 001.414-.293L14 17h4a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
  const commentsIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
  const rateIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );

  return (
    <ToolPageShell
      title={t('tools.ytdl.title')}
      subtitle={t('tools.ytdl.subtitle')}
      gradient={['#6366f1', '#8b5cf6']}
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
      <div style={{ display: 'flex', gap: 8, marginBottom: urlError || fetchError ? 8 : 24, flexWrap: 'wrap' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            height: 44,
            background: '#f5f5f7',
            border: urlError ? '1px solid #ef4444' : 'none',
            borderRadius: 10,
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
              setAnalysis(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                validateUrl(url);
              }
            }}
            onBlur={() => {
              if (url.trim()) validateUrl(url);
            }}
            placeholder={t('tools.ytdl.placeholder')}
            aria-label="YouTube video URL"
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
          {fetchingInfo && (
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
            >
              <circle cx="8" cy="8" r="6" stroke={C.dim} strokeWidth="2" fill="none" opacity={0.3} />
              <path d="M8 2a6 6 0 014.47 2" stroke={C.text} strokeWidth="2" strokeLinecap="round" fill="none" />
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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
            height: 44,
            borderRadius: 10,
            border: 'none',
            background: pasteHover ? '#e8e8ed' : '#f5f5f7',
            color: '#1d1d1f',
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          {t('tools.ytdl.paste')}
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {fetchError}
        </div>
      )}

      {/* Video Info Preview */}
      {videoInfo && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            padding: 16,
            borderRadius: 16,
            border: 'none',
            background: '#f5f5f7',
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          {/* Embedded YouTube player */}
          <div
            style={{
              width: 320,
              maxWidth: '100%',
              aspectRatio: '16/9',
              borderRadius: 10,
              background: C.surface,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoInfo.videoId}`}
              title={videoInfo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 6,
              minWidth: 0,
              flexBasis: 200,
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
                wordBreak: 'break-word' as const,
              }}
            >
              {videoInfo.title}
            </div>
            <a
              href={videoInfo.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: C.sub, textDecoration: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              {videoInfo.channel}
            </a>

            {/* Show extra metadata when analysis is available */}
            {analysis && isFullAnalysis(analysis) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: '#ffffff',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#86868b',
                  }}
                >
                  {analysis.durationFormatted}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: '#ffffff',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#86868b',
                  }}
                >
                  {formatDate(analysis.publishedAt)}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: '#ffffff',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#86868b',
                    textTransform: 'uppercase',
                  }}
                >
                  {analysis.definition}
                </span>
                {analysis.hasCaptions && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: '#ffffff',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#22c55e',
                    }}
                  >
                    CC
                  </span>
                )}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: '#ffffff',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#86868b',
                  }}
                >
                  {analysis.category}
                </span>
                {analysis.isShorts && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: '#ef444415',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#ef4444',
                    }}
                  >
                    Shorts
                  </span>
                )}
              </div>
            )}
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
            borderRadius: 16,
            border: 'none',
            background: '#f5f5f7',
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 320,
              maxWidth: '100%',
              height: 180,
              borderRadius: 10,
              background: C.surface,
              flexShrink: 0,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: '80%', height: 16, borderRadius: 4, background: C.surface, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: '40%', height: 12, borderRadius: 4, background: C.surface, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }} />
          </div>
        </div>
      )}

      {/* Loading Skeleton while analyzing */}
      {loading && <AnalysisSkeleton />}

      {/* ── Full Analysis Results (YouTube Data API v3) ─────────── */}
      {analysis && isFullAnalysis(analysis) && (
        <>
          {/* Score Gauges */}
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: '#f5f5f7',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1d1d1f', marginBottom: 20, textAlign: 'center' }}>
              {t('tools.ytdl.overallScore')}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 20,
                flexWrap: 'wrap',
                marginBottom: 8,
              }}
            >
              <CircularGauge score={analysis.scores.overall} label="Overall" size={100} />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 16,
                flexWrap: 'wrap',
                marginTop: 20,
              }}
            >
              <CircularGauge score={analysis.scores.title} label={t('tools.ytdl.titleOptimization')} size={80} />
              <CircularGauge score={analysis.scores.description} label="Description" size={80} />
              <CircularGauge score={analysis.scores.tags} label="Tags" size={80} />
              <CircularGauge score={analysis.scores.thumbnail} label="Thumbnail" size={80} />
              <CircularGauge score={analysis.scores.engagement} label={t('tools.ytdl.engagementPotential')} size={80} />
              <CircularGauge score={analysis.scores.seo} label="SEO" size={80} />
            </div>
          </div>

          {/* Statistics Cards */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <StatCard
              icon={viewsIcon}
              label="Views"
              value={formatNumber(analysis.statistics.views)}
              sub={`${formatNumber(analysis.metrics.viewsPerDay)}/day`}
            />
            <StatCard
              icon={likesIcon}
              label="Likes"
              value={formatNumber(analysis.statistics.likes)}
              sub={`${analysis.metrics.likeRate}% rate`}
            />
            <StatCard
              icon={commentsIcon}
              label="Comments"
              value={formatNumber(analysis.statistics.comments)}
              sub={`${analysis.metrics.commentRate}% rate`}
            />
            <StatCard
              icon={rateIcon}
              label="Benchmark"
              value={
                analysis.metrics.benchmarkComparison === 'above_average'
                  ? 'Above Avg'
                  : analysis.metrics.benchmarkComparison === 'average'
                    ? 'Average'
                    : 'Below Avg'
              }
              sub={`CTR: ${analysis.metrics.estimatedCTR}`}
            />
          </div>

          {/* Description Analysis */}
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              background: '#f5f5f7',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1d1d1f', marginBottom: 12 }}>
              Description Analysis
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#86868b' }}>Length</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>{analysis.structure.descriptionLength} chars</span>
            </div>
            <CheckItem checked={analysis.structure.hasTimestamps} label="Has timestamps" />
            <CheckItem checked={analysis.structure.hasLinks} label="Has links" />
            <CheckItem checked={analysis.structure.hasHashtags} label="Has hashtags" />
            <CheckItem checked={analysis.structure.hasCTA} label="Has call-to-action" />
          </div>

          {/* Tags */}
          {analysis.tags.length > 0 && (
            <div
              style={{
                padding: 20,
                borderRadius: 16,
                background: '#f5f5f7',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1d1d1f', marginBottom: 12 }}>
                Tags ({analysis.tags.length})
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {analysis.tags.slice(0, 20).map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 8,
                      background: '#ffffff',
                      border: '1px solid rgba(0,0,0,0.06)',
                      fontSize: 12,
                      color: '#6366f1',
                      fontWeight: 500,
                    }}
                  >
                    {tag}
                  </span>
                ))}
                {analysis.tags.length > 20 && (
                  <span style={{ padding: '4px 10px', fontSize: 12, color: '#86868b', fontWeight: 500 }}>
                    +{analysis.tags.length - 20} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div
              style={{
                padding: 20,
                borderRadius: 16,
                background: '#f5f5f7',
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1d1d1f', marginBottom: 12 }}>
                {t('tools.ytdl.suggestions')}
              </div>
              {analysis.suggestions.map((s, i) => {
                // Positive suggestions (contains "excellent", "great", "above")
                const isPositive = /excellent|great|above|well-optimized/i.test(s);
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: '#ffffff',
                      marginBottom: 6,
                      fontSize: 13,
                      color: '#1d1d1f',
                      lineHeight: 1.5,
                      border: '1px solid rgba(0,0,0,0.04)',
                    }}
                  >
                    {isPositive ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    )}
                    {s}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Fallback Analysis Results (oEmbed only) ───────────── */}
      {analysis && !isFullAnalysis(analysis) && (
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            border: 'none',
            background: '#f5f5f7',
            marginBottom: 24,
          }}
        >
          {/* Note about limited analysis */}
          {'note' in analysis && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: '#fef3c7',
                marginBottom: 16,
                fontSize: 12,
                color: '#92400e',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {analysis.note}
            </div>
          )}

          {/* Overall Score */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 8 }}>
              {t('tools.ytdl.overallScore')}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: `4px solid ${scoreColor(analysis.analysis.overall)}`,
                fontSize: 28,
                fontWeight: 800,
                color: scoreColor(analysis.analysis.overall),
              }}
            >
              {analysis.analysis.overall}
            </div>
          </div>

          {/* Score Bars */}
          <ScoreBar label={t('tools.ytdl.titleOptimization')} score={analysis.analysis.titleOptimization} C={C} />
          <ScoreBar label={t('tools.ytdl.keywordUsage')} score={analysis.analysis.keywordUsage} C={C} />
          <ScoreBar label={t('tools.ytdl.engagementPotential')} score={analysis.analysis.engagementPotential} C={C} />

          {/* Title Length */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: C.sub }}>{t('tools.ytdl.titleLength')}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{analysis.analysis.titleLength} chars</span>
          </div>

          {/* Suggestions */}
          {analysis.analysis.suggestions.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>
                {t('tools.ytdl.suggestions')}
              </div>
              {analysis.analysis.suggestions.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: C.surface,
                    marginBottom: 6,
                    fontSize: 13,
                    color: C.text,
                    lineHeight: 1.5,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analyze Button */}
      <ActionButton
        label={
          fetchingInfo
            ? t('tools.ytdl.loadingInfo')
            : analysis
              ? t('tools.ytdl.analyzeAgain')
              : t('tools.ytdl.analyze')
        }
        gradient={['#6366f1', '#8b5cf6']}
        onClick={handleAnalyze}
        disabled={!url.trim() || !!urlError || fetchingInfo}
        loading={loading}
      />

      {/* CSS Keyframes */}
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
