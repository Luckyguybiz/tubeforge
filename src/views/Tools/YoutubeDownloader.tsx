'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ── Types ─────────────────────────────────────────────────────── */

interface AnalysisScores {
  hook: number;
  title: number;
  ctr: number;
  engagement: number;
}

interface VideoSegment {
  label: string;
  icon: string;
  start: string;
  end: string;
  color: string;
}

interface AnalysisResult {
  videoId: string;
  title: string;
  channel: string;
  channelUrl: string;
  thumbnail: string;
  thumbnailHq: string;
  thumbnailMq: string;
  watchUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  duration: string;
  scores: AnalysisScores;
  structure: VideoSegment[];
  viralFactors: string[];
  tips: string[];
}

/* ── Helpers ───────────────────────────────────────────────────── */

function isValidYoutubeUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?.*v=|shorts\/|embed\/|live\/)|youtu\.be\/)[\w-]+/.test(url.trim());
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function scoreColor(score: number): string {
  if (score >= 8) return '#22c55e';
  if (score >= 5) return '#f59e0b';
  return '#ef4444';
}

/* ── Circular Score Gauge (SVG) ────────────────────────────────── */

function ScoreGauge({ value, max, label, color, C }: {
  value: number;
  max: number;
  label: string;
  color: string;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
}) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / max) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={80} height={80} viewBox="0 0 80 80">
        {/* Background circle */}
        <circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke={C.surface}
          strokeWidth="6"
        />
        {/* Progress circle */}
        <circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeDashoffset={circumference / 4}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        {/* Value text */}
        <text
          x="40" y="38"
          textAnchor="middle"
          dominantBaseline="central"
          fill={C.text}
          fontSize="18"
          fontWeight="700"
          fontFamily="inherit"
        >
          {typeof value === 'number' && max === 10 ? value : value + '%'}
        </text>
        {max === 10 && (
          <text
            x="40" y="52"
            textAnchor="middle"
            dominantBaseline="central"
            fill={C.dim}
            fontSize="10"
            fontFamily="inherit"
          >
            /10
          </text>
        )}
      </svg>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>{label}</span>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────── */

export function YoutubeDownloader() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [urlError, setUrlError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [pasteHover, setPasteHover] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  /* ── URL validation ──────────────────────────────────────────── */
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

  /* ── Analyze handler ─────────────────────────────────────────── */
  const handleAnalyze = async () => {
    if (!url.trim() || !isValidYoutubeUrl(url)) {
      setUrlError(t('tools.ytdl.invalidUrl'));
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setAnalysis(null);
    setFetchError('');
    setThumbError(false);

    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch('/api/tools/youtube-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

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

      setAnalysis(data as AnalysisResult);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (controller.signal.aborted && abortRef.current === controller) {
          setFetchError(t('tools.ytdl.serverTimeout'));
        }
        return;
      }
      console.error('[YoutubeAnalyzer] analyze error:', err);
      setFetchError(t('tools.ytdl.networkError'));
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setUrlError('');
      setAnalysis(null);
      setFetchError('');
    } catch {
      /* clipboard not available */
    }
  };

  const clearUrl = () => {
    setUrl('');
    setAnalysis(null);
    setUrlError('');
    setFetchError('');
    setThumbError(false);
  };

  const thumbnailSrc = analysis
    ? thumbError
      ? analysis.thumbnailMq
      : analysis.thumbnail
    : null;

  const engagementPct = analysis
    ? analysis.viewCount > 0
      ? (((analysis.likeCount + analysis.commentCount) / analysis.viewCount) * 100)
      : 0
    : 0;

  return (
    <ToolPageShell
      title={t('tools.ytdl.title')}
      subtitle={t('tools.ytdl.subtitle')}
      gradient={['#6366f1', '#8b5cf6']}
    >
      {/* URL Input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: urlError || fetchError ? 8 : 24, flexWrap: 'wrap' }}>
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
          {/* Search / magnifying glass icon */}
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
              if (e.key === 'Enter') handleAnalyze();
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
          {/* Loading spinner */}
          {loading && (
            <svg
              width="18" height="18" viewBox="0 0 16 16"
              style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
            >
              <circle cx="8" cy="8" r="6" stroke={C.dim} strokeWidth="2" fill="none" opacity={0.3} />
              <path d="M8 2a6 6 0 014.47 2" stroke={C.text} strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          )}
          {url && !loading && (
            <button
              onClick={clearUrl}
              aria-label="Clear URL"
              style={{
                background: 'none', border: 'none', color: C.dim,
                cursor: 'pointer', padding: 4, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
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
            padding: '0 20px', minHeight: 44, borderRadius: 12,
            border: `1px solid ${C.border}`,
            background: pasteHover ? C.surface : C.card,
            color: C.text, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            transition: 'all 0.2s ease', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          {t('tools.ytdl.paste')}
        </button>
      </div>

      {/* URL Error */}
      {urlError && (
        <div role="alert" style={{ fontSize: 12, color: '#ef4444', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {urlError}
        </div>
      )}

      {/* Fetch Error */}
      {fetchError && !urlError && (
        <div style={{ fontSize: 12, color: '#f59e0b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {fetchError}
        </div>
      )}

      {/* Analyze Button */}
      {!analysis && (
        <ActionButton
          label={loading ? t('tools.ytdl.analyzing') : t('tools.ytdl.analyze')}
          gradient={['#6366f1', '#8b5cf6']}
          onClick={handleAnalyze}
          disabled={!url.trim() || !!urlError}
          loading={loading}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════
          ANALYSIS RESULTS
          ═══════════════════════════════════════════════════════════ */}
      {analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Video Info Card ─────────────────────────────────── */}
          <div
            style={{
              display: 'flex', gap: 16, padding: 16, borderRadius: 14,
              border: `1px solid ${C.border}`, background: C.card, flexWrap: 'wrap',
            }}
          >
            {/* Thumbnail */}
            <div style={{
              width: 200, maxWidth: '100%', height: 112, borderRadius: 10,
              background: C.surface, overflow: 'hidden', flexShrink: 0, position: 'relative',
            }}>
              {thumbnailSrc ? (
                <Image
                  src={thumbnailSrc}
                  alt={analysis.title}
                  width={200} height={112}
                  onError={() => setThumbError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  unoptimized
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <polygon points="10 8 16 12 10 16" fill={C.dim} stroke="none" />
                  </svg>
                </div>
              )}
            </div>

            {/* Meta info */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              justifyContent: 'center', gap: 6, minWidth: 0, flexBasis: 200,
            }}>
              <div style={{
                fontSize: 15, fontWeight: 700, color: C.text,
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word' as const,
              }}>
                {analysis.title}
              </div>
              <div style={{ fontSize: 12, color: C.sub, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <a
                  href={analysis.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: C.sub, textDecoration: 'none', fontWeight: 600 }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                >
                  {analysis.channel}
                </a>
                <span style={{ color: C.dim }}>•</span>
                <span>{formatNumber(analysis.viewCount)} views</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap', fontSize: 11, color: C.dim }}>
                {analysis.publishedAt && (
                  <span style={{ background: C.surface, padding: '3px 8px', borderRadius: 6 }}>
                    {analysis.publishedAt}
                  </span>
                )}
                {analysis.duration && (
                  <span style={{ background: C.surface, padding: '3px 8px', borderRadius: 6 }}>
                    {analysis.duration}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Scores Section ─────────────────────────────────── */}
          <div
            style={{
              padding: 20, borderRadius: 14,
              border: `1px solid ${C.border}`, background: C.card,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('tools.ytdl.scores')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
              <ScoreGauge
                value={analysis.scores.hook}
                max={10}
                label={t('tools.ytdl.hookScore')}
                color={scoreColor(analysis.scores.hook)}
                C={C}
              />
              <ScoreGauge
                value={analysis.scores.title}
                max={10}
                label={t('tools.ytdl.titleScore')}
                color={scoreColor(analysis.scores.title)}
                C={C}
              />
              <ScoreGauge
                value={analysis.scores.ctr}
                max={10}
                label={t('tools.ytdl.ctr')}
                color={scoreColor(analysis.scores.ctr)}
                C={C}
              />
              <ScoreGauge
                value={Math.round(engagementPct * 10) / 10}
                max={10}
                label={t('tools.ytdl.engagement')}
                color={engagementPct >= 3.5 ? '#22c55e' : engagementPct >= 1.5 ? '#f59e0b' : '#ef4444'}
                C={C}
              />
            </div>
          </div>

          {/* ── Video Structure Timeline ───────────────────────── */}
          {analysis.structure && analysis.structure.length > 0 && (
            <div
              style={{
                padding: 20, borderRadius: 14,
                border: `1px solid ${C.border}`, background: C.card,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('tools.ytdl.structure')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {analysis.structure.map((seg, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px',
                      borderLeft: `3px solid ${seg.color}`,
                      background: i % 2 === 0 ? 'transparent' : `${C.surface}44`,
                      borderRadius: i === 0 ? '8px 8px 0 0' : i === analysis.structure.length - 1 ? '0 0 8px 8px' : 0,
                    }}
                  >
                    <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{seg.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>{seg.label}</span>
                    <span style={{ fontSize: 12, color: C.dim, fontFamily: 'monospace' }}>
                      {seg.start} - {seg.end}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Why This Video Works ───────────────────────────── */}
          {analysis.viralFactors && analysis.viralFactors.length > 0 && (
            <div
              style={{
                padding: 20, borderRadius: 14,
                border: `1px solid ${C.border}`, background: C.card,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('tools.ytdl.viralFactors')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analysis.viralFactors.map((factor, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tips for Improvement ───────────────────────────── */}
          {analysis.tips && analysis.tips.length > 0 && (
            <div
              style={{
                padding: 20, borderRadius: 14,
                border: `1px solid ${C.border}`, background: C.card,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('tools.ytdl.tips')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analysis.tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                    <span style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Open on YouTube + Analyze Again ────────────────── */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href={analysis.watchUrl || `https://www.youtube.com/watch?v=${analysis.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 12,
                background: '#ff0000', color: '#fff',
                fontSize: 14, fontWeight: 600, textDecoration: 'none',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.5 6.2a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 00.5 6.2 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.8 3.02 3.02 0 002.12 2.14c1.88.56 9.38.56 9.38.56s7.5 0 9.38-.56a3.02 3.02 0 002.12-2.14A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
              </svg>
              {t('tools.ytdl.openOnYoutube')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
            <ActionButton
              label={t('tools.ytdl.analyze')}
              gradient={['#6366f1', '#8b5cf6']}
              onClick={() => {
                setAnalysis(null);
                setUrl('');
              }}
              disabled={false}
              loading={false}
            />
          </div>
        </div>
      )}

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
