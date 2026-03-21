'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ToolPageShell } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ── Types ─────────────────────────────────────────────────────── */

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
  scores: { hook: number; title: number; ctr: number; engagement: number };
  structure: { label: string; icon: string; start: string; end: string; color: string }[];
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

/* ── No download options — pure analysis tool ── */

/* ── Score Gauge ────────────────────────────────────────────────── */

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
  const [thumbError, setThumbError] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const validateUrl = useCallback((value: string) => {
    if (!value.trim()) { setUrlError(''); return false; }
    if (!isValidYoutubeUrl(value)) { setUrlError(t('tools.ytdl.invalidUrl')); return false; }
    setUrlError('');
    return true;
  }, [t]);

  /* ── Download/Analyze handler ──────────────────────────────── */
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

  const thumbnailSrc = analysis ? (thumbError ? analysis.thumbnailMq : analysis.thumbnail) : null;
  const engPct = analysis && analysis.viewCount > 0
    ? (((analysis.likeCount + analysis.commentCount) / analysis.viewCount) * 100)
    : 0;

  return (
    <ToolPageShell
      title={t('tools.ytdl.title')}
      subtitle={t('tools.ytdl.subtitle')}
      gradient={['#6366f1', '#8b5cf6']}
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
            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ══════════════════════════════════════════════════════
          Analysis Results (shown after "download")
         ══════════════════════════════════════════════════════ */}
      {analysis && (
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Video info card ───────────────────────────── */}
          <div style={{
            display: 'flex', gap: 16, padding: 16,
            background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
            flexWrap: 'wrap',
          }}>
            {thumbnailSrc && (
              <div style={{ width: 200, height: 112, borderRadius: 10, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                <Image
                  src={thumbnailSrc} alt={analysis.title} fill
                  style={{ objectFit: 'cover' }}
                  onError={() => setThumbError(true)}
                  unoptimized
                />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 6px', lineHeight: 1.3 }}>
                {analysis.title}
              </h3>
              <p style={{ fontSize: 13, color: C.sub, margin: '0 0 8px' }}>
                {analysis.channel} · {formatNumber(analysis.viewCount)} views · {analysis.publishedAt}
              </p>
              {analysis.duration && (
                <span style={{ fontSize: 12, color: C.dim, background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)', padding: '3px 8px', borderRadius: 6 }}>
                  {analysis.duration}
                </span>
              )}
            </div>
          </div>

          {/* ── Scores ────────────────────────────────────── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
            padding: 20, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
          }}>
            <ScoreGauge value={analysis.scores.hook} label={t('tools.ytdl.hookScore') || 'Hook'} color={scoreColor(analysis.scores.hook)} bg={isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'} />
            <ScoreGauge value={analysis.scores.title} label={t('tools.ytdl.titleScore') || 'Title'} color={scoreColor(analysis.scores.title)} bg={isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'} />
            <ScoreGauge value={analysis.scores.ctr} label="CTR" color={scoreColor(analysis.scores.ctr)} bg={isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'} />
            <ScoreGauge value={Math.round(engPct * 10)} label={t('tools.ytdl.engagement') || 'Engagement'} color={scoreColor(Math.min(10, Math.round(engPct * 2)))} bg={isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'} />
          </div>

          {/* ── Video Structure ────────────────────────────── */}
          {analysis.structure.length > 0 && (
            <div style={{ padding: 20, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 14px' }}>
                {t('tools.ytdl.structure') || 'Video Structure'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analysis.structure.map((seg, i) => (
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
            </div>
          )}

          {/* ── Viral Factors ──────────────────────────────── */}
          {analysis.viralFactors.length > 0 && (
            <div style={{ padding: 20, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>
                {t('tools.ytdl.viralFactors') || 'Why This Video Works'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {analysis.viralFactors.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: C.text }}>
                    <span style={{ color: '#22c55e', fontSize: 16 }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tips ───────────────────────────────────────── */}
          {analysis.tips.length > 0 && (
            <div style={{ padding: 20, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>
                {t('tools.ytdl.tips') || 'Tips for Improvement'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {analysis.tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: C.sub, lineHeight: 1.5 }}>
                    <span style={{ color: '#f59e0b', fontSize: 16, flexShrink: 0 }}>💡</span> {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Open on YouTube ─────────────────────────────── */}
          <a
            href={analysis.watchUrl}
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
            {t('tools.ytdl.openOnYoutube') || 'Open on YouTube'}
          </a>
        </div>
      )}
    </ToolPageShell>
  );
}
