'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ── Helpers ──────────────────────────────────────────────────── */

function fmt(n: unknown): string {
  if (n == null) return '\u2014';
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return String(num);
}

function gaugeColor(v: number): string {
  if (v >= 8) return '#22c55e';
  if (v >= 5) return '#f59e0b';
  return '#ef4444';
}

function safeStr(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if ('chars' in obj) return String(obj.chars);
    if ('level' in obj && 'reason' in obj) return `${String(obj.level)} \u2014 ${String(obj.reason)}`;
    if ('level' in obj) return String(obj.level);
    return JSON.stringify(v);
  }
  return String(v);
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ── Circular Gauge (SVG) ─────────────────────────────────────── */

function CircleGauge({ value, label, max = 10 }: { value: number; label: string; max?: number }) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const r = 40;
  const stroke = 6;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dashOffset = circ * (1 - pct);
  const color = gaugeColor(value);
  const trackColor = C?.border ?? 'rgba(0,0,0,0.08)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: '1 1 0' }}>
      <div style={{ position: 'relative', width: 96, height: 96 }}>
        <svg width={96} height={96} viewBox="0 0 96 96">
          <circle cx={48} cy={48} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
          <circle
            cx={48} cy={48} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 48 48)"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</span>
          <span style={{ fontSize: 10, color: C?.dim ?? '#999', marginTop: 2 }}>/{max}</span>
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: C?.sub ?? '#888', letterSpacing: '0.01em', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

/* ── Stat Cell ────────────────────────────────────────────────── */

function StatCell({ label, value }: { label: string; value: string }) {
  const C = useThemeStore((s) => s.theme);
  return (
    <div style={{ flex: '1 1 0', minWidth: 100 }}>
      <div style={{ fontSize: 11, color: C?.dim ?? '#aaa', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C?.text ?? '#111', letterSpacing: '-0.01em' }}>{value}</div>
    </div>
  );
}

/* ── Component ────────────────────────────────────────────────── */

export function YoutubeDownloader() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const t = useLocaleStore((s) => s.t);
  const router = useRouter();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, any> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const accent = '#7c5cfc';

  const card: React.CSSProperties = {
    background: C?.surface ?? '#fff',
    border: `1px solid ${C?.border ?? '#eee'}`,
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
  };
  const sectionTitle: React.CSSProperties = {
    fontSize: 14, fontWeight: 700, color: C?.text ?? '#111',
    marginBottom: 16, letterSpacing: '-0.01em',
  };
  const sub: React.CSSProperties = { color: C?.sub ?? '#888', fontSize: 13, lineHeight: 1.6 };
  const pill: React.CSSProperties = {
    display: 'inline-block', padding: '4px 12px', borderRadius: 20,
    fontSize: 12, fontWeight: 600,
    background: isDark ? 'rgba(124,92,252,0.12)' : 'rgba(124,92,252,0.08)',
    color: accent, marginRight: 6, marginBottom: 6,
  };

  /* ── Fetch ─────────────────────────────────────────────────── */

  const analyze = useCallback(async () => {
    const trimmed = (url ?? '').trim();
    if (!trimmed) return;
    setError(null); setData(null); setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/tools/youtube-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as Record<string, any>)?.error ?? `${t('youtubeAnalyzer.error')} ${res.status}`);
      }
      setData(await res.json());
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setError((err as Error)?.message ?? t('youtubeAnalyzer.unknownError'));
    } finally { setLoading(false); }
  }, [url, t]);

  const handlePaste = useCallback(async () => {
    try { const clip = await navigator.clipboard.readText(); if (clip) setUrl(clip); } catch {}
  }, []);

  /* ── Derived ────────────────────────────────────────────────── */

  const stats = (data?.stats ?? {}) as Record<string, any>;
  const analysis = (data?.analysis ?? {}) as Record<string, any>;
  const seo = (data?.seo ?? null) as Record<string, any> | null;
  const engagement = (data?.engagement ?? null) as Record<string, any> | null;
  const strategy = (data?.strategy ?? null) as Record<string, any> | null;
  const competition = (data?.competition ?? null) as Record<string, any> | null;
  const shorts = (data?.shortsAnalysis ?? null) as Record<string, any> | null;
  const thumb = (data?.thumbnailAnalysis ?? null) as Record<string, any> | null;
  const structure = (analysis?.structure ?? []) as Record<string, any>[];
  const viralFactors = (analysis?.viralFactors ?? []) as string[];
  const channelStats = data?.channelStats as Record<string, any> | null;
  const authorComments = (data?.authorComments ?? []) as { text: string; likeCount: number; publishedAt: string }[];
  const topComments = (data?.topComments ?? []) as { author: string; text: string; likeCount: number; publishedAt: string }[];
  const videoDescription = data?.description as string | null;

  /* ── Render ─────────────────────────────────────────────────── */

  return (
    <div style={{ width: '100%', padding: '0 0 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingTop: 8 }}>
        <button
          onClick={() => { if (window.history.length > 1) { router.back(); } else { router.push('/tools'); } }}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: `1px solid ${C?.border ?? '#eee'}`, background: C?.surface ?? '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: C?.text ?? '#111', flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${accent}, #a78bfa)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: C?.text ?? '#111', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
            {t('youtubeAnalyzer.title')}
          </h1>
          <p style={{ fontSize: 12, color: C?.dim ?? '#999', margin: 0, marginTop: 2 }}>
            {t('youtubeAnalyzer.subtitle')}
          </p>
        </div>
      </div>

      {/* URL Input */}
      <div style={{ ...card, padding: 0, marginBottom: 0, maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C?.dim ?? '#aaa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          <input
            type="text" value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') analyze(); }}
            placeholder="https://www.youtube.com/watch?v=..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', color: C?.text ?? '#111',
              fontSize: 14, fontFamily: 'inherit',
            }}
          />
          {url && (
            <button onClick={() => setUrl('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C?.dim ?? '#aaa', padding: 4, lineHeight: 1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
            </button>
          )}
          <button onClick={handlePaste} style={{
            padding: '6px 14px', borderRadius: 8,
            border: `1px solid ${C?.border ?? '#eee'}`, background: C?.bg ?? '#fafafa',
            color: C?.text ?? '#111', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}>{t('youtubeAnalyzer.paste')}</button>
        </div>
      </div>

      {/* Analyze Button */}
      <button
        onClick={analyze} disabled={loading || !url.trim()}
        style={{
          maxWidth: 720, width: '100%', marginTop: 12, marginBottom: 28, padding: '14px 0',
          borderRadius: 14, border: 'none',
          background: loading ? (isDark ? '#444' : '#ccc') : `linear-gradient(135deg, ${accent}, #a78bfa)`,
          color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
          cursor: loading ? 'wait' : 'pointer', opacity: !url.trim() ? 0.5 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {loading ? (
          <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeDasharray="56" strokeDashoffset="14"/></svg>{t('youtubeAnalyzer.analyzing')}</>
        ) : (
          <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>{t('youtubeAnalyzer.analyze')}</>
        )}
      </button>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Error */}
      {error && (
        <div style={{ ...card, borderColor: '#fca5a5', background: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2', color: '#dc2626', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────── */}
      {data && !loading && (
        <>
          {/* Video Info + Gauges Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {/* Video Card */}
            {data?.title && (
              <div style={{ ...card, marginBottom: 0, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {data?.thumbnail && (
                  <img src={String(data.thumbnail)} alt=""
                    style={{ width: 120, height: 90, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: C?.text ?? '#111', lineHeight: 1.4, margin: 0, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {String(data.title)}
                  </h3>
                  <div style={{ ...sub, fontSize: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <span>{String(data?.channel ?? '')}</span>
                    <span style={{ color: C?.dim ?? '#bbb' }}>{'\u00B7'}</span>
                    <span>{fmt(stats.views)} views</span>
                    {data?.publishedAt && <><span style={{ color: C?.dim ?? '#bbb' }}>{'\u00B7'}</span><span>{String(data.publishedAt).slice(0, 10)}</span></>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {data?.duration && <span style={{ ...pill, background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', color: C?.sub ?? '#666' }}>{String(data.duration)}</span>}
                    {data?.categoryName && <span style={pill}>{String(data.categoryName)}</span>}
                    {data?.isShorts && <span style={{ ...pill, background: isDark ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.08)', color: '#a855f7' }}>Shorts</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Gauges Card */}
            {(analysis?.hookScore != null || analysis?.titleScore != null) && (
              <div style={{ ...card, marginBottom: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '24px 12px' }}>
                {analysis?.hookScore != null && <CircleGauge value={Number(analysis.hookScore)} label={t('youtubeAnalyzer.hook')} />}
                {analysis?.titleScore != null && <CircleGauge value={Number(analysis.titleScore)} label={t('youtubeAnalyzer.titleScore')} />}
                {analysis?.estimatedCTR != null && (
                  <CircleGauge value={analysis.estimatedCTR === 'high' ? 8 : analysis.estimatedCTR === 'medium' ? 5 : 3} label="CTR" />
                )}
                {analysis?.engagementRate != null && (
                  <CircleGauge value={Math.min(Math.round(Number(analysis.engagementRate)), 10)} label={t('youtubeAnalyzer.engagement')} />
                )}
              </div>
            )}
          </div>

          {/* Three-column stats grid */}
          <div style={{ display: 'grid', gap: 12, marginBottom: 12, gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {/* Engagement */}
            {engagement && (
              <div style={card}>
                <h4 style={sectionTitle}>{t('youtubeAnalyzer.engagement')}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {engagement?.likeRate != null && <StatCell label="Like rate" value={`${String(engagement.likeRate)}%`} />}
                  {engagement?.commentRate != null && <StatCell label="Comment rate" value={`${String(engagement.commentRate)}%`} />}
                  {engagement?.viralCoefficient != null && <StatCell label={t('youtubeAnalyzer.virality')} value={String(engagement.viralCoefficient)} />}
                  {engagement?.audienceRetentionEstimate != null && <StatCell label={t('youtubeAnalyzer.retention')} value={String(engagement.audienceRetentionEstimate)} />}
                  {engagement?.benchmarkComparison != null && <StatCell label={t('youtubeAnalyzer.comparison')} value={String(engagement.benchmarkComparison)} />}
                </div>
              </div>
            )}

            {/* SEO */}
            {seo && (
              <div style={card}>
                <h4 style={sectionTitle}>SEO</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {seo?.titleLength != null && <StatCell label={t('youtubeAnalyzer.titleScore')} value={`${safeStr(seo.titleLength)} ${t('youtubeAnalyzer.chars')}`} />}
                  {seo?.descriptionLength != null && <StatCell label={t('youtubeAnalyzer.seoDescription')} value={`${String(seo.descriptionLength)} ${t('youtubeAnalyzer.chars')}`} />}
                  {seo?.tagsCount != null && <StatCell label={t('youtubeAnalyzer.tagsCount')} value={String(seo.tagsCount)} />}
                  {seo?.readabilityScore != null && <StatCell label={t('youtubeAnalyzer.readability')} value={`${String(seo.readabilityScore)}/10`} />}
                  {seo?.languageDetected != null && <StatCell label={t('youtubeAnalyzer.language')} value={String(seo.languageDetected)} />}
                  {seo?.searchOptimization != null && <StatCell label={t('youtubeAnalyzer.searchOpt')} value={String(seo.searchOptimization)} />}
                </div>
              </div>
            )}

            {/* Strategy */}
            {strategy && (
              <div style={card}>
                <h4 style={sectionTitle}>{t('youtubeAnalyzer.strategy')}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {strategy?.bestPostingTime != null && <StatCell label={t('youtubeAnalyzer.bestTime')} value={String(strategy.bestPostingTime)} />}
                  {strategy?.recommendedFrequency != null && <StatCell label={t('youtubeAnalyzer.frequency')} value={String(strategy.recommendedFrequency)} />}
  
                  {strategy?.audienceAge != null && <StatCell label={t('youtubeAnalyzer.audience')} value={String(strategy.audienceAge)} />}
                </div>
                {((strategy?.crossPlatformPotential ?? []) as string[]).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
                    {((strategy.crossPlatformPotential) as string[]).map((p, i) => (
                      <span key={i} style={pill}>{String(p)}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Two-column row: Keywords + Competition */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {/* Keywords / Tags */}
            {seo && (((seo?.titleKeywords ?? []) as string[]).length > 0 || ((seo?.tags ?? []) as string[]).length > 0) && (
              <div style={card}>
                <h4 style={sectionTitle}>{t('youtubeAnalyzer.keywordsAndTags')}</h4>
                {((seo?.titleKeywords ?? []) as string[]).length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: C?.dim ?? '#aaa', marginBottom: 8, fontWeight: 500 }}>{t('youtubeAnalyzer.fromTitle')}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {((seo.titleKeywords) as string[]).map((k, i) => <span key={i} style={pill}>{String(k)}</span>)}
                    </div>
                  </div>
                )}
                {((seo?.tags ?? []) as string[]).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: C?.dim ?? '#aaa', marginBottom: 8, fontWeight: 500 }}>{t('youtubeAnalyzer.videoTags')}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {((seo.tags) as string[]).map((t, i) => (
                        <span key={i} style={{ ...pill, background: isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6', color: C?.sub ?? '#666' }}>{String(t)}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Competition */}
            {competition && (
              <div style={card}>
                <h4 style={sectionTitle}>{t('youtubeAnalyzer.competition')}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {competition?.nichePopularity != null && <StatCell label={t('youtubeAnalyzer.nichePopularity')} value={String(competition.nichePopularity)} />}
                  {competition?.contentSaturation != null && <StatCell label={t('youtubeAnalyzer.saturation')} value={String(competition.contentSaturation)} />}
                </div>
              </div>
            )}
          </div>

          {/* Viral Factors + Structure Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {/* Viral Factors */}
            {viralFactors.length > 0 && (
              <div style={card}>
                <h4 style={sectionTitle}>{t('youtubeAnalyzer.successFactors')}</h4>
                {viralFactors.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#22c55e" style={{ marginTop: 2, flexShrink: 0 }}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span style={{ ...sub, fontSize: 13 }}>{String(f)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Structure */}
            {structure.length > 0 && (
              <div style={card}>
                <h4 style={sectionTitle}>{t('youtubeAnalyzer.videoStructure')}</h4>
                {structure.map((seg, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
                    borderBottom: i < structure.length - 1 ? `1px solid ${C?.border ?? '#eee'}` : 'none',
                  }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{String(seg?.icon ?? '\uD83C\uDFAC')}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C?.text ?? '#111' }}>{String(seg?.label ?? '')}</div>
                      <div style={{ fontSize: 11, color: C?.dim ?? '#aaa' }}>{String(seg?.start ?? '')} \u2014 {String(seg?.end ?? '')}</div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: String(seg?.color ?? accent), flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shorts section */}
          {shorts && data?.isShorts && (
            <div style={card}>
              <h4 style={sectionTitle}>Shorts</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {shorts?.hookQuality != null && <StatCell label={t('youtubeAnalyzer.hook')} value={String(shorts.hookQuality)} />}
                {shorts?.loopPotential != null && <StatCell label={t('youtubeAnalyzer.looping')} value={`${String(shorts.loopPotential)}/10`} />}
                {shorts?.shareability != null && <StatCell label={t('youtubeAnalyzer.shareability')} value={`${String(shorts.shareability)}/10`} />}
                {shorts?.verticalOptimized != null && <StatCell label={t('youtubeAnalyzer.vertical')} value={shorts.verticalOptimized ? `\u2705 ${t('youtubeAnalyzer.yes')}` : `\u274C ${t('youtubeAnalyzer.no')}`} />}
                {shorts?.optimalLength != null && <StatCell label={t('youtubeAnalyzer.optimalLength')} value={String(shorts.optimalLength)} />}
                {shorts?.trendAlignment != null && <StatCell label={t('youtubeAnalyzer.trends')} value={String(shorts.trendAlignment)} />}
              </div>
            </div>
          )}

          {/* Thumbnail */}
          {thumb && !data?.isShorts && (
            <div style={card}>
              <h4 style={sectionTitle}>{t('youtubeAnalyzer.thumbnail')}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {thumb?.hasCustomThumbnail != null && <StatCell label={t('youtubeAnalyzer.customThumb')} value={thumb.hasCustomThumbnail ? `\u2705 ${t('youtubeAnalyzer.yes')}` : `\u274C ${t('youtubeAnalyzer.no')}`} />}
                {thumb?.resolution != null && <StatCell label={t('youtubeAnalyzer.resolution')} value={String(thumb.resolution)} />}
                {thumb?.aspectRatio != null && <StatCell label={t('youtubeAnalyzer.aspectRatio')} value={String(thumb.aspectRatio)} />}
              </div>
            </div>
          )}

          {/* Channel Info */}
          {channelStats && (
            <div style={card}>
              <h4 style={sectionTitle}>{t('youtubeAnalyzer.channel')}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <StatCell label={t('youtubeAnalyzer.subscribers')} value={fmt(channelStats.subscribers)} />
                <StatCell label={t('youtubeAnalyzer.videosOnChannel')} value={fmt(channelStats.totalVideos)} />
                {channelStats.createdAt && <StatCell label={t('youtubeAnalyzer.channelCreated')} value={String(channelStats.createdAt).slice(0, 10)} />}
              </div>
            </div>
          )}

          {/* Description */}
          {videoDescription && (
            <div style={card}>
              <h4 style={sectionTitle}>{t('youtubeAnalyzer.videoDescription')}</h4>
              <pre style={{ ...sub, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, maxHeight: 200, overflow: 'auto', fontFamily: 'inherit' }}>
                {videoDescription}
              </pre>
            </div>
          )}

          {/* Author Comments */}
          {authorComments.length > 0 && (
            <div style={card}>
              <h4 style={sectionTitle}>{t('youtubeAnalyzer.authorComments')}</h4>
              {authorComments.map((c, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < authorComments.length - 1 ? `1px solid ${C?.border ?? '#eee'}` : 'none' }}>
                  <div style={{ ...sub, fontSize: 13 }}>{c.text.replace(/<[^>]*>/g, '')}</div>
                  <div style={{ fontSize: 11, color: C?.dim ?? '#aaa', marginTop: 4, display: 'flex', gap: 12 }}>
                    <span>{String(c.publishedAt).slice(0, 10)}</span>
                    {c.likeCount > 0 && <span>{String.fromCharCode(0x1F44D)} {c.likeCount}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Top Comments */}
          {topComments.length > 0 && (
            <div style={card}>
              <h4 style={sectionTitle}>{t('youtubeAnalyzer.topComments')}</h4>
              {topComments.map((c, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < topComments.length - 1 ? `1px solid ${C?.border ?? '#eee'}` : 'none' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C?.text ?? '#111', marginBottom: 4 }}>{c.author}</div>
                  <div style={{ ...sub, fontSize: 13 }}>{c.text.replace(/<[^>]*>/g, '')}</div>
                  <div style={{ fontSize: 11, color: C?.dim ?? '#aaa', marginTop: 4, display: 'flex', gap: 12 }}>
                    <span>{String(c.publishedAt).slice(0, 10)}</span>
                    {c.likeCount > 0 && <span>{String.fromCharCode(0x1F44D)} {c.likeCount}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Disclosure + YouTube branding (required by YouTube API TOS) */}
          <div style={{ ...card, background: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="24" height="17" viewBox="0 0 159 110" fill="none"><path d="M154 17.5c-1.8-6.7-7.1-12-13.8-13.8C128 0 78.8 0 78.8 0S29.5 0 17.3 3.7C10.6 5.5 5.3 10.8 3.5 17.5 0 29.7 0 55 0 55s0 25.3 3.5 37.5c1.8 6.7 7.1 12 13.8 13.8C29.5 110 78.8 110 78.8 110s49.2 0 61.5-3.7c6.7-1.8 12-7.1 13.8-13.8C157.5 80.3 157.5 55 157.5 55s0-25.3-3.5-37.5z" fill="#FF0000"/><path d="M63 79.5L104 55 63 30.5v49z" fill="#fff"/></svg>
              <span style={{ fontSize: 11, color: C?.dim ?? '#999' }}>
                {'\u0414\u0430\u043D\u043D\u044B\u0435 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u044B \u0447\u0435\u0440\u0435\u0437 YouTube Data API. \u041E\u0446\u0435\u043D\u043A\u0438 (\u0445\u0443\u043A, CTR, \u0432\u043E\u0432\u043B\u0435\u0447\u0451\u043D\u043D\u043E\u0441\u0442\u044C) \u2014 \u0440\u0430\u0441\u0447\u0451\u0442\u044B TubeForge, \u043D\u0435 \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u044B\u0435 \u043C\u0435\u0442\u0440\u0438\u043A\u0438 YouTube.'}
              </span>
            </div>
            {data?.videoId && (
              <a
                href={`https://www.youtube.com/watch?v=${String(data.videoId)}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                  padding: '8px 16px', borderRadius: 8,
                  background: '#ff0000', color: '#fff',
                  fontWeight: 600, fontSize: 12, textDecoration: 'none', fontFamily: 'inherit',
                }}
              >
                <svg width="14" height="10" viewBox="0 0 159 110" fill="none"><path d="M154 17.5c-1.8-6.7-7.1-12-13.8-13.8C128 0 78.8 0 78.8 0S29.5 0 17.3 3.7C10.6 5.5 5.3 10.8 3.5 17.5 0 29.7 0 55 0 55s0 25.3 3.5 37.5c1.8 6.7 7.1 12 13.8 13.8C29.5 110 78.8 110 78.8 110s49.2 0 61.5-3.7c6.7-1.8 12-7.1 13.8-13.8C157.5 80.3 157.5 55 157.5 55s0-25.3-3.5-37.5z" fill="#fff"/><path d="M63 79.5L104 55 63 30.5v49z" fill="#ff0000"/></svg>
                {'\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043D\u0430 YouTube'}
              </a>
            )}
          </div>

          {/* Responsive */}
          <style>{`
            @media(max-width:900px){
              .yt-grid-3{grid-template-columns:1fr 1fr!important}
            }
            @media(max-width:600px){
              .yt-grid-3,.yt-grid-2{grid-template-columns:1fr!important}
            }
          `}</style>
        </>
      )}
    </div>
  );
}
