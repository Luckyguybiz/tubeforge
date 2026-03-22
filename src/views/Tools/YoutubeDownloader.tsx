'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import type { Theme } from '@/lib/types';
import { useLocaleStore } from '@/stores/useLocaleStore';

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

interface AnalysisResult {
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
    channelName: string;
    titleLength: number;
    suggestions: string[];
  };
}

function isValidYoutubeUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?.*v=|shorts\/|embed\/|live\/)|youtu\.be\/)[\w-]+/.test(url.trim());
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
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
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
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
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            border: 'none',
            background: '#f5f5f7',
            marginBottom: 24,
          }}
        >
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
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
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
