'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ToolPageShell } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ── Types ─────────────────────────────────────────────────────── */

interface AnalysisResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  publishedAt: string | null;
  duration: string | null;
  isShorts?: boolean;
  overallScore?: number;
  categoryName?: string | null;
  stats: { views: number | null; likes: number | null; comments: number | null };
  analysis: {
    hookScore: number;
    titleScore: number;
    thumbnailPresent?: boolean;
    engagementRate: number;
    estimatedCTR: string;
    contentType: string;
    tips: string[];
    structure: { label: string; icon: string; start: string; end: string; color: string }[];
    viralFactors: string[];
  };
  shortsAnalysis?: {
    hookQuality: string;
    loopPotential: number;
    verticalOptimized: boolean;
    optimalLength: string;
    trendAlignment: string;
    shareability: number;
    tips: string[];
  };
  seo?: {
    titleLength: number;
    optimalTitleRange: string;
    titleKeywords: string[];
    descriptionLength: number | null;
    descriptionHasLinks: boolean;
    descriptionHasTimestamps: boolean;
    tagsCount: number;
    tags: string[];
    hashtagsInTitle: number;
    languageDetected: string;
    readabilityScore: number;
    searchOptimization: string;
  };
  thumbnailAnalysis?: {
    url: string;
    hasCustomThumbnail: boolean;
    resolution: string;
    aspectRatio: string;
    tips: string[];
  };
  engagement?: {
    likeToDislikeEstimate: string;
    commentRate: number;
    likeRate: number;
    viralCoefficient: string | null;
    benchmarkComparison: string;
    audienceRetentionEstimate: string;
  };
  strategy?: {
    bestPostingTime: string;
    recommendedFrequency: string;
    crossPlatformPotential: string[];
    monetizationPotential: string;
    audienceAge: string;
  };
  competition?: {
    nichePopularity: string;
    contentSaturation: string;
    differentiationTips: string[];
  };
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

function scoreColor100(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function badgeColor(value: string): string {
  const v = value?.toLowerCase() ?? '';
  if (['high', 'very_high', 'strong', 'excellent', 'good', 'above_average', 'growing'].includes(v)) return '#22c55e';
  if (['medium', 'moderate', 'average', 'stable'].includes(v)) return '#f59e0b';
  return '#ef4444';
}

function badgeLabel(value: string): string {
  const map: Record<string, string> = {
    very_high: 'Очень высокий',
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий',
    very_low: 'Очень низкий',
    strong: 'Сильный',
    moderate: 'Умеренный',
    weak: 'Слабый',
    excellent: 'Отлично',
    good: 'Хорошо',
    average: 'Средне',
    poor: 'Плохо',
    above_average: 'Выше среднего',
    below_average: 'Ниже среднего',
    growing: 'Растущий',
    saturated: 'Насыщенный',
    stable: 'Стабильный',
    oversaturated: 'Перенасыщенный',
  };
  return map[value?.toLowerCase() ?? ''] ?? value ?? '—';
}

/* ── No download options — pure analysis tool ── */

/* ── Score Gauge (0-10) ────────────────────────────────────────── */

function ScoreGauge({ value, label, color, bg }: {
  value: number; label: string; color: string; bg: string;
}) {
  const r = 32, c = 2 * Math.PI * r, p = (value / 10) * c;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke={bg} strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={`${p} ${c - p}`} strokeDashoffset={c / 4}
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        <text x="40" y="38" textAnchor="middle" dominantBaseline="central" fill={color}
          fontSize="18" fontWeight="700" fontFamily="inherit">{value}</text>
        <text x="40" y="52" textAnchor="middle" dominantBaseline="central" fill={bg}
          fontSize="10" fontFamily="inherit">/10</text>
      </svg>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

/* ── Overall Score Gauge (0-100) ───────────────────────────────── */

function OverallScoreGauge({ value, color, bg }: {
  value: number; color: string; bg: string;
}) {
  const r = 54, c = 2 * Math.PI * r, p = (value / 100) * c;
  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke={bg} strokeWidth="8" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round" strokeDasharray={`${p} ${c - p}`} strokeDashoffset={c / 4}
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x="70" y="64" textAnchor="middle" dominantBaseline="central" fill={color}
        fontSize="36" fontWeight="800" fontFamily="inherit">{value}</text>
      <text x="70" y="88" textAnchor="middle" dominantBaseline="central" fill={bg}
        fontSize="13" fontFamily="inherit">/100</text>
    </svg>
  );
}

/* ── Mini bar (for readability, title length etc) ──────────────── */

function MiniBar({ value, max, color, bg }: {
  value: number; max: number; color: string; bg: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ height: 8, borderRadius: 4, background: bg, flex: 1, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: color, transition: 'width 0.5s ease' }} />
    </div>
  );
}

/* ── Badge component ───────────────────────────────────────────── */

function Badge({ text, color, bg }: { text: string; color: string; bg?: string }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      color, background: bg ?? (color + '18'), display: 'inline-block', whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  );
}

/* ── Section card wrapper ──────────────────────────────────────── */

function SectionCard({ children, border, surface, borderColor }: {
  children: React.ReactNode; border?: string; surface: string; borderColor: string;
}) {
  return (
    <div style={{
      background: surface, border: `1px solid ${border ?? borderColor}`,
      borderRadius: 14, padding: 20,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ text, color, icon }: { text: string; color: string; icon?: string }) {
  return (
    <h4 style={{ fontSize: 15, fontWeight: 700, color, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      {text}
    </h4>
  );
}

/* ── Main Component ────────────────────────────────────────────── */

export function YoutubeDownloader() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const t = useLocaleStore((s) => s.t);

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [urlError, setUrlError] = useState('');
  const [fetchError, setFetchError] = useState('');

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const validateUrl = useCallback((value: string) => {
    if (!value.trim()) { setUrlError(''); return false; }
    if (!isValidYoutubeUrl(value)) { setUrlError(t('tools.ytdl.invalidUrl')); return false; }
    setUrlError('');
    return true;
  }, [t]);

  /* ── Analyze handler ────────────────────────────────────────── */
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
        setFetchError(res.status === 401 ? t('tools.ytdl.sessionExpired') : `${t('tools.ytdl.serverError')} (${res.status})`);
        return;
      }

      const data = await res.json();
      if (!res.ok) { setFetchError(data.error ?? t('tools.ytdl.fetchError')); return; }

      setAnalysis(data as AnalysisResult);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (controller.signal.aborted && abortRef.current === controller) {
          setFetchError(t('tools.ytdl.serverTimeout'));
        }
        return;
      }
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
    } catch { /* clipboard not available */ }
  };

  const thumbnailSrc = analysis?.thumbnail ?? null;
  const views = analysis?.stats?.views ?? 0;
  const likes = analysis?.stats?.likes ?? 0;
  const comments = analysis?.stats?.comments ?? 0;
  const engPct = views > 0 ? (((likes + comments) / views) * 100) : 0;
  const gaugeBg = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  const subtleBg = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)';

  /* ── Title length color ── */
  const titleLenColor = (len: number) => {
    if (len >= 40 && len <= 60) return '#22c55e';
    if (len >= 30 && len <= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <ToolPageShell
      title={t('tools.ytdl.title')}
      subtitle={t('tools.ytdl.subtitle')}
      gradient={['#ff0000', '#cc0000']}
    >
      {/* ── URL Input ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: C.surface, border: `1px solid ${urlError ? '#ef4444' : C.border}`,
        borderRadius: 12, padding: '0 14px', marginBottom: urlError || fetchError ? 8 : 20,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.dim}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <input
          value={url}
          onChange={(e) => { setUrl(e.target.value); setUrlError(''); setFetchError(''); setAnalysis(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }}
          placeholder={t('tools.ytdl.placeholder') || 'Insert YouTube link...'}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: C.text, fontSize: 15, padding: '14px 0', fontFamily: 'inherit',
          }}
        />
        {url && (
          <button onClick={() => { setUrl(''); setAnalysis(null); setUrlError(''); setFetchError(''); }}
            style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 18, padding: 4 }}>
            ×
          </button>
        )}
        <button onClick={handlePaste}
          style={{
            background: 'none', border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.sub, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            fontWeight: 500, whiteSpace: 'nowrap',
          }}>
          {t('tools.ytdl.paste') || 'Paste'}
        </button>
      </div>

      {/* Error messages */}
      {urlError && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 16px' }}>{urlError}</p>}
      {fetchError && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 16px' }}>{fetchError}</p>}

      {/* ── Analyze button ────────────────────────────── */}
      <button
        onClick={handleAnalyze}
        disabled={loading || !url.trim()}
        style={{
          width: '100%', maxWidth: 320, padding: '14px 32px',
          borderRadius: 12, border: 'none',
          background: loading || !url.trim()
            ? (isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)')
            : 'linear-gradient(135deg, #ff0000, #cc0000)',
          color: loading || !url.trim() ? C.dim : '#fff',
          fontSize: 16, fontWeight: 700, cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', transition: 'all .2s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {loading ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
            </svg>
            {t('tools.ytdl.analyzing') || 'Анализируем...'}
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {t('tools.ytdl.analyze') || 'Анализировать'}
          </>
        )}
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) {
          .yt-metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .yt-two-col { grid-template-columns: 1fr !important; }
          .yt-overall-banner { flex-direction: column !important; text-align: center; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════
          Analysis Results
         ══════════════════════════════════════════════════════ */}
      {analysis && (() => {
        // Safe defaults for all nested objects to prevent crashes
        const a = {
          ...analysis,
          analysis: analysis.analysis ?? { hookScore: 0, titleScore: 0, engagementRate: 0, estimatedCTR: 'medium', contentType: '', tips: [], structure: [], viralFactors: [] },
          stats: analysis.stats ?? { views: null, likes: null, comments: null },
          seo: analysis.seo ?? null,
          shortsAnalysis: analysis.shortsAnalysis ?? null,
          thumbnailAnalysis: analysis.thumbnailAnalysis ?? null,
          engagement: analysis.engagement ?? null,
          strategy: analysis.strategy ?? null,
          competition: analysis.competition ?? null,
        };
        return (
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ═══ 1. Overall Score Banner ═══════════════════════ */}
          {a.overallScore != null && (
            <SectionCard surface={C.surface} borderColor={C.border}>
              <div className="yt-overall-banner" style={{
                display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'center', flexWrap: 'wrap',
              }}>
                <OverallScoreGauge
                  value={a.overallScore}
                  color={scoreColor100(a.overallScore)}
                  bg={gaugeBg}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: C.text }}>
                    Общий балл анализа
                  </span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {a.categoryName && (
                      <Badge text={a.categoryName} color="#6366f1" />
                    )}
                    {a.isShorts && (
                      <Badge text="Shorts" color="#8b5cf6" />
                    )}
                    {a.analysis?.contentType && (
                      <Badge text={a.analysis.contentType} color={C.sub} />
                    )}
                  </div>
                  <span style={{ fontSize: 13, color: C.sub }}>
                    {a.overallScore >= 70
                      ? 'Отличный результат! Видео хорошо оптимизировано.'
                      : a.overallScore >= 40
                        ? 'Неплохо, но есть потенциал для улучшения.'
                        : 'Есть значительный потенциал для роста.'}
                  </span>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ═══ 2. Video Info Card ═══════════════════════════ */}
          <SectionCard surface={C.surface} borderColor={C.border}>
            <div style={{
              display: 'flex', gap: 16, flexWrap: 'wrap',
            }}>
              {thumbnailSrc && (
                <div style={{ width: 200, height: 112, borderRadius: 10, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnailSrc} alt={a.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {a.isShorts && (
                    <span style={{
                      position: 'absolute', top: 6, right: 6,
                      background: '#8b5cf6', color: '#fff', fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 6,
                    }}>
                      SHORTS
                    </span>
                  )}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 6px', lineHeight: 1.3 }}>
                  {a.title}
                </h3>
                <p style={{ fontSize: 13, color: C.sub, margin: '0 0 8px' }}>
                  {a.channel}{views > 0 ? ` · ${formatNumber(views)} просмотров` : ''}{a.publishedAt ? ` · ${a.publishedAt}` : ''}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {a.duration && (
                    <span style={{ fontSize: 12, color: C.dim, background: subtleBg, padding: '3px 8px', borderRadius: 6 }}>
                      {a.duration}
                    </span>
                  )}
                  {a.categoryName && (
                    <span style={{ fontSize: 12, color: '#6366f1', background: 'rgba(99,102,241,.1)', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                      {a.categoryName}
                    </span>
                  )}
                  {likes > 0 && (
                    <span style={{ fontSize: 12, color: C.dim, background: subtleBg, padding: '3px 8px', borderRadius: 6 }}>
                      {formatNumber(likes)} лайков
                    </span>
                  )}
                  {comments > 0 && (
                    <span style={{ fontSize: 12, color: C.dim, background: subtleBg, padding: '3px 8px', borderRadius: 6 }}>
                      {formatNumber(comments)} комментариев
                    </span>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ═══ 2b. Embedded YouTube Player ═══════════════════ */}
          <SectionCard surface={C.surface} borderColor={C.border}>
            <SectionHeader icon="▶️" text="Просмотр видео" color={C.text} />
            <div style={{
              position: 'relative', width: '100%', paddingBottom: a.isShorts ? '177.78%' : '56.25%',
              borderRadius: 12, overflow: 'hidden', maxWidth: a.isShorts ? 360 : '100%',
              margin: a.isShorts ? '0 auto' : undefined,
            }}>
              <iframe
                src={`https://www.youtube.com/embed/${a.videoId}?rel=0&modestbranding=1`}
                title={a.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  border: 'none', borderRadius: 12,
                }}
              />
            </div>
          </SectionCard>

          {/* ═══ 3. Key Metrics Grid (4 gauges) ═══════════════ */}
          <div className="yt-metrics-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
            padding: 20, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
          }}>
            <ScoreGauge value={a.analysis?.hookScore ?? 0} label="Хук" color={scoreColor(a.analysis?.hookScore ?? 0)} bg={gaugeBg} />
            <ScoreGauge value={a.analysis?.titleScore ?? 0} label="Заголовок" color={scoreColor(a.analysis?.titleScore ?? 0)} bg={gaugeBg} />
            <ScoreGauge
              value={a.analysis?.estimatedCTR === 'very_high' ? 10 : a.analysis?.estimatedCTR === 'high' ? 8 : a.analysis?.estimatedCTR === 'medium' ? 5 : 3}
              label="CTR"
              color={scoreColor(a.analysis?.estimatedCTR === 'very_high' ? 10 : a.analysis?.estimatedCTR === 'high' ? 8 : a.analysis?.estimatedCTR === 'medium' ? 5 : 3)}
              bg={gaugeBg}
            />
            <ScoreGauge value={Math.min(10, Math.round(engPct * 2))} label="Вовлечение" color={scoreColor(Math.min(10, Math.round(engPct * 2)))} bg={gaugeBg} />
          </div>

          {/* ═══ 4. Shorts Analysis ═══════════════════════════ */}
          {a.isShorts && a.shortsAnalysis && (
            <div style={{
              background: C.surface, border: `2px solid #8b5cf6`,
              borderRadius: 14, padding: 20,
            }}>
              <SectionHeader text="Анализ Shorts" color="#8b5cf6" icon="📱" />

              <div className="yt-metrics-grid" style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16,
              }}>
                {/* Hook Quality */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <Badge
                    text={badgeLabel(a.shortsAnalysis.hookQuality)}
                    color={badgeColor(a.shortsAnalysis.hookQuality)}
                  />
                  <span style={{ fontSize: 11, color: C.sub }}>Качество хука</span>
                </div>

                {/* Loop Potential */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <ScoreGauge
                    value={a.shortsAnalysis.loopPotential ?? 0}
                    label="Зацикливание"
                    color={scoreColor(a.shortsAnalysis.loopPotential ?? 0)}
                    bg={gaugeBg}
                  />
                </div>

                {/* Shareability */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <ScoreGauge
                    value={a.shortsAnalysis.shareability ?? 0}
                    label="Шеринг"
                    color={scoreColor(a.shortsAnalysis.shareability ?? 0)}
                    bg={gaugeBg}
                  />
                </div>

                {/* Vertical optimized */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  <span style={{
                    fontSize: 28,
                    color: a.shortsAnalysis.verticalOptimized ? '#22c55e' : '#ef4444',
                  }}>
                    {a.shortsAnalysis.verticalOptimized ? '✓' : '✗'}
                  </span>
                  <span style={{ fontSize: 11, color: C.sub, textAlign: 'center' }}>Вертикальный формат</span>
                </div>
              </div>

              {/* Extra info row */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {a.shortsAnalysis.optimalLength && (
                  <Badge text={`Опт. длина: ${a.shortsAnalysis.optimalLength}`} color="#8b5cf6" />
                )}
                {a.shortsAnalysis.trendAlignment && (
                  <Badge text={`Тренды: ${badgeLabel(a.shortsAnalysis.trendAlignment)}`} color={badgeColor(a.shortsAnalysis.trendAlignment)} />
                )}
              </div>

              {/* Shorts tips */}
              {a.shortsAnalysis.tips && a.shortsAnalysis.tips.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {a.shortsAnalysis.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: C.sub, lineHeight: 1.5 }}>
                      <span style={{ color: '#8b5cf6', fontSize: 14, flexShrink: 0 }}>▸</span> {tip}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ 5. SEO Analysis ══════════════════════════════ */}
          {a.seo && (
            <SectionCard surface={C.surface} borderColor={C.border}>
              <SectionHeader text="SEO-анализ" color={C.text} icon="🔍" />

              {/* Title length bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: C.sub }}>Длина заголовка</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: titleLenColor(a.seo.titleLength) }}>
                    {a.seo.titleLength} символов
                  </span>
                </div>
                <div style={{ position: 'relative', height: 10, borderRadius: 5, background: gaugeBg, overflow: 'hidden' }}>
                  {/* Optimal range indicator */}
                  <div style={{
                    position: 'absolute', left: '40%', width: '20%', height: '100%',
                    background: 'rgba(34,197,94,.15)', borderRadius: 5,
                  }} />
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, (a.seo.titleLength / 100) * 100)}%`,
                    borderRadius: 5,
                    background: titleLenColor(a.seo.titleLength),
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: C.dim }}>0</span>
                  <span style={{ fontSize: 10, color: '#22c55e' }}>Оптимально: {a.seo.optimalTitleRange || '40-60'}</span>
                  <span style={{ fontSize: 10, color: C.dim }}>100</span>
                </div>
              </div>

              {/* Keywords */}
              {a.seo.titleKeywords && a.seo.titleKeywords.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: C.sub, display: 'block', marginBottom: 6 }}>Ключевые слова заголовка</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {a.seo.titleKeywords.map((kw, i) => (
                      <Badge key={i} text={kw} color="#6366f1" />
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {a.seo.tags && a.seo.tags.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: C.sub, display: 'block', marginBottom: 6 }}>
                    Теги ({a.seo.tagsCount ?? a.seo.tags.length})
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {a.seo.tags.map((tag, i) => (
                      <Badge key={i} text={tag} color={C.sub} bg={subtleBg} />
                    ))}
                  </div>
                </div>
              )}

              {/* Info grid */}
              <div className="yt-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: subtleBg, borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: C.sub }}>Язык</span>
                  <Badge text={a.seo.languageDetected ?? '—'} color="#6366f1" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: subtleBg, borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: C.sub }}>Хэштеги в заголовке</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.seo.hashtagsInTitle ?? 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: subtleBg, borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: C.sub }}>Описание</span>
                  <span style={{ fontSize: 12, color: C.dim }}>
                    {a.seo.descriptionLength != null ? `${a.seo.descriptionLength} сим.` : '—'}
                    {a.seo.descriptionHasLinks ? ' · Ссылки ✓' : ''}
                    {a.seo.descriptionHasTimestamps ? ' · Таймкоды ✓' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: subtleBg, borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: C.sub }}>Поисковая оптимизация</span>
                  <Badge text={badgeLabel(a.seo.searchOptimization ?? '')} color={badgeColor(a.seo.searchOptimization ?? '')} />
                </div>
              </div>

              {/* Readability */}
              {a.seo.readabilityScore != null && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: C.sub }}>Читабельность</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: scoreColor(a.seo.readabilityScore) }}>
                      {a.seo.readabilityScore}/10
                    </span>
                  </div>
                  <MiniBar value={a.seo.readabilityScore} max={10} color={scoreColor(a.seo.readabilityScore)} bg={gaugeBg} />
                </div>
              )}
            </SectionCard>
          )}

          {/* ═══ 6. Thumbnail Analysis ════════════════════════ */}
          {a.thumbnailAnalysis && (
            <SectionCard surface={C.surface} borderColor={C.border}>
              <SectionHeader text="Анализ превью" color={C.text} icon="🖼️" />

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {a.thumbnailAnalysis.url && (
                  <div style={{ width: 200, height: 112, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.thumbnailAnalysis.url} alt="Thumbnail"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Badge
                      text={a.thumbnailAnalysis.hasCustomThumbnail ? 'Кастомное превью' : 'Автоматическое превью'}
                      color={a.thumbnailAnalysis.hasCustomThumbnail ? '#22c55e' : '#ef4444'}
                    />
                    {a.thumbnailAnalysis.resolution && (
                      <Badge text={a.thumbnailAnalysis.resolution} color={C.sub} bg={subtleBg} />
                    )}
                    {a.thumbnailAnalysis.aspectRatio && (
                      <Badge text={a.thumbnailAnalysis.aspectRatio} color={C.sub} bg={subtleBg} />
                    )}
                  </div>

                  {a.thumbnailAnalysis.tips && a.thumbnailAnalysis.tips.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {a.thumbnailAnalysis.tips.map((tip, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: C.sub, lineHeight: 1.5 }}>
                          <span style={{ color: '#f59e0b', flexShrink: 0 }}>●</span> {tip}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          )}

          {/* ═══ 7. Engagement Deep Dive ══════════════════════ */}
          {a.engagement && (
            <SectionCard surface={C.surface} borderColor={C.border}>
              <SectionHeader text="Глубокий анализ вовлечённости" color={C.text} icon="📊" />

              <div className="yt-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                <div style={{ padding: '10px 14px', background: subtleBg, borderRadius: 10 }}>
                  <span style={{ fontSize: 11, color: C.dim, display: 'block', marginBottom: 4 }}>Лайки (на 1000 просмотров)</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
                    {a.engagement.likeRate != null ? a.engagement.likeRate.toFixed(1) : '—'}
                  </span>
                </div>
                <div style={{ padding: '10px 14px', background: subtleBg, borderRadius: 10 }}>
                  <span style={{ fontSize: 11, color: C.dim, display: 'block', marginBottom: 4 }}>Комментарии (на 1000 просмотров)</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
                    {a.engagement.commentRate != null ? a.engagement.commentRate.toFixed(2) : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: subtleBg, borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: C.sub }}>Удержание аудитории</span>
                  <Badge text={badgeLabel(a.engagement.audienceRetentionEstimate ?? '')} color={badgeColor(a.engagement.audienceRetentionEstimate ?? '')} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: subtleBg, borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: C.sub }}>Сравнение с бенчмарком</span>
                  <Badge text={badgeLabel(a.engagement.benchmarkComparison ?? '')} color={badgeColor(a.engagement.benchmarkComparison ?? '')} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: subtleBg, borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: C.sub }}>Оценка лайк/дизлайк</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.engagement.likeToDislikeEstimate ?? '—'}</span>
                </div>
                {a.engagement.viralCoefficient && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: subtleBg, borderRadius: 10 }}>
                    <span style={{ fontSize: 13, color: C.sub }}>Вирусный коэффициент</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.engagement.viralCoefficient}</span>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* ═══ 8. Content Strategy ══════════════════════════ */}
          {a.strategy && (
            <SectionCard surface={C.surface} borderColor={C.border}>
              <SectionHeader text="Контент-стратегия" color={C.text} icon="🎯" />

              <div className="yt-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                <div style={{ padding: '10px 14px', background: subtleBg, borderRadius: 10 }}>
                  <span style={{ fontSize: 11, color: C.dim, display: 'block', marginBottom: 4 }}>Лучшее время публикации</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{a.strategy.bestPostingTime ?? '—'}</span>
                </div>
                <div style={{ padding: '10px 14px', background: subtleBg, borderRadius: 10 }}>
                  <span style={{ fontSize: 11, color: C.dim, display: 'block', marginBottom: 4 }}>Рекомендуемая частота</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{a.strategy.recommendedFrequency ?? '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: subtleBg, borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: C.sub }}>Монетизация</span>
                  <Badge text={badgeLabel(a.strategy.monetizationPotential ?? '')} color={badgeColor(a.strategy.monetizationPotential ?? '')} />
                </div>
                <div style={{ padding: '10px 14px', background: subtleBg, borderRadius: 10 }}>
                  <span style={{ fontSize: 11, color: C.dim, display: 'block', marginBottom: 4 }}>Целевой возраст</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{a.strategy.audienceAge ?? '—'}</span>
                </div>
              </div>

              {/* Cross-platform */}
              {a.strategy.crossPlatformPotential && a.strategy.crossPlatformPotential.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <span style={{ fontSize: 13, color: C.sub, display: 'block', marginBottom: 6 }}>Кроссплатформенный потенциал</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {a.strategy.crossPlatformPotential.map((platform, i) => (
                      <Badge key={i} text={platform} color="#6366f1" />
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          {/* ═══ 9. Competition Context ═══════════════════════ */}
          {a.competition && (
            <SectionCard surface={C.surface} borderColor={C.border}>
              <SectionHeader text="Конкурентный контекст" color={C.text} icon="⚔️" />

              <div className="yt-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: subtleBg, borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: C.sub }}>Популярность ниши</span>
                  <Badge text={badgeLabel(a.competition.nichePopularity ?? '')} color={badgeColor(a.competition.nichePopularity ?? '')} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: subtleBg, borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: C.sub }}>Насыщенность контента</span>
                  <Badge text={badgeLabel(a.competition.contentSaturation ?? '')} color={badgeColor(a.competition.contentSaturation ?? '')} />
                </div>
              </div>

              {a.competition.differentiationTips && a.competition.differentiationTips.length > 0 && (
                <div>
                  <span style={{ fontSize: 13, color: C.sub, display: 'block', marginBottom: 8 }}>Советы по дифференциации</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {a.competition.differentiationTips.map((tip, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: C.sub, lineHeight: 1.5 }}>
                        <span style={{ color: '#22c55e', fontSize: 14, flexShrink: 0 }}>▸</span> {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          {/* ═══ 10. Video Structure ═════════════════════════ */}
          {a.analysis?.structure && a.analysis.structure.length > 0 && (
            <SectionCard surface={C.surface} borderColor={C.border}>
              <SectionHeader text="Структура видео" color={C.text} icon="🎬" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {a.analysis.structure.map((seg, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{seg.icon}</span>
                    <div style={{
                      flex: 1, height: 32, borderRadius: 8, background: seg.color + '22',
                      display: 'flex', alignItems: 'center', padding: '0 12px',
                      border: `1px solid ${seg.color}44`,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: seg.color }}>{seg.label}</span>
                    </div>
                    <span style={{ fontSize: 12, color: C.dim, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {seg.start} – {seg.end}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ═══ 11. Viral Factors ═══════════════════════════ */}
          {a.analysis?.viralFactors && a.analysis.viralFactors.length > 0 && (
            <SectionCard surface={C.surface} borderColor={C.border}>
              <SectionHeader text="Вирусные факторы" color={C.text} icon="🚀" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {a.analysis.viralFactors.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: C.text }}>
                    <span style={{ color: '#22c55e', fontSize: 16 }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ═══ 12. Tips ════════════════════════════════════ */}
          {a.analysis?.tips && a.analysis.tips.length > 0 && (
            <SectionCard surface={C.surface} borderColor={C.border}>
              <SectionHeader text="Советы по улучшению" color={C.text} icon="💡" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {a.analysis.tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: C.sub, lineHeight: 1.5 }}>
                    <span style={{ color: '#f59e0b', fontSize: 16, flexShrink: 0 }}>💡</span> {tip}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ═══ 13. Open on YouTube ═════════════════════════ */}
          <a
            href={`https://www.youtube.com/watch?v=${a.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 12, border: `1px solid ${C.border}`,
              background: C.surface, color: C.text, fontSize: 14, fontWeight: 600,
              textDecoration: 'none', fontFamily: 'inherit', transition: 'all .15s ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Открыть на YouTube
          </a>
        </div>
        );
      })()}
    </ToolPageShell>
  );
}
