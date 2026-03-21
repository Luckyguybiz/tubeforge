'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';

/* ── Helpers ──────────────────────────────────────────────────── */

function fmt(n: unknown): string {
  if (n == null) return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return String(num);
}

function scoreColor(v: number): string {
  if (v >= 7) return '#22c55e';
  if (v >= 4) return '#eab308';
  return '#ef4444';
}

function pct(v: unknown, max = 10): string {
  const n = Number(v);
  if (Number.isNaN(n) || n <= 0) return '0%';
  return Math.min((n / max) * 100, 100) + '%';
}

/* ── Component ────────────────────────────────────────────────── */

export function YoutubeDownloader() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [data, setData] = useState<Record<string, any> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cardStyle: React.CSSProperties = {
    background: C?.surface ?? '#1a1a1a',
    border: `1px solid ${C?.border ?? '#333'}`,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  };
  const headerStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 12,
    color: C?.text ?? '#fff',
  };
  const textStyle: React.CSSProperties = { color: C?.sub ?? '#aaa', fontSize: 14, lineHeight: 1.6 };
  const gaugeBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const pillStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    background: isDark ? 'rgba(255,0,0,0.15)' : 'rgba(255,0,0,0.08)',
    color: '#ff0000',
    marginRight: 6,
    marginBottom: 6,
  };

  /* ── Fetch ─────────────────────────────────────────────────── */

  const analyze = useCallback(async () => {
    const trimmed = (url ?? '').trim();
    if (!trimmed) return;
    setError(null);
    setData(null);
    setLoading(true);
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
        throw new Error((body as Record<string, any>)?.error ?? `Ошибка ${res.status}`);
      }
      const json: Record<string, any> = await res.json();
      setData(json);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setError((err as Error)?.message ?? 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, [url]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch { /* clipboard blocked */ }
  }, []);

  /* ── Derived safe accessors ────────────────────────────────── */

  const stats = (data?.stats ?? {}) as Record<string, any>;
  const analysis = (data?.analysis ?? {}) as Record<string, any>;
  const shorts = (data?.shortsAnalysis ?? null) as Record<string, any> | null;
  const seo = (data?.seo ?? null) as Record<string, any> | null;
  const thumb = (data?.thumbnailAnalysis ?? null) as Record<string, any> | null;
  const engagement = (data?.engagement ?? null) as Record<string, any> | null;
  const strategy = (data?.strategy ?? null) as Record<string, any> | null;
  const competition = (data?.competition ?? null) as Record<string, any> | null;
  const structure = (analysis?.structure ?? []) as Record<string, any>[];
  const viralFactors = (analysis?.viralFactors ?? []) as string[];
  const tips = (analysis?.tips ?? []) as string[];

  /* ── Bar helper ────────────────────────────────────────────── */

  function Bar({ label, value, max = 10 }: { label: string; value: unknown; max?: number }) {
    const n = Number(value);
    const safe = Number.isNaN(n) ? 0 : n;
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ ...textStyle, fontSize: 13 }}>{label}</span>
          <span style={{ ...textStyle, fontSize: 13, fontWeight: 600 }}>{safe}/{max}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: gaugeBg }}>
          <div style={{ width: pct(safe, max), height: '100%', borderRadius: 4, background: scoreColor(safe), transition: 'width .4s' }} />
        </div>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────────── */

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      {/* Title */}
      <h2 style={{ fontSize: 26, fontWeight: 800, color: C?.text ?? '#fff', marginBottom: 4 }}>
        YouTube Анализатор
      </h2>
      <p style={{ ...textStyle, marginBottom: 20 }}>
        Вставьте ссылку на видео для полного анализа контента, SEO и вовлечённости
      </p>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') analyze(); }}
            placeholder="https://www.youtube.com/watch?v=..."
            style={{
              width: '100%',
              padding: '12px 48px 12px 14px',
              borderRadius: 10,
              border: `1px solid ${C?.border ?? '#333'}`,
              background: C?.surface ?? '#1a1a1a',
              color: C?.text ?? '#fff',
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handlePaste}
            title="Вставить"
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: C?.sub ?? '#aaa', fontSize: 18,
            }}
          >
            📋
          </button>
        </div>
        <button
          onClick={analyze}
          disabled={loading || !url.trim()}
          style={{
            padding: '12px 28px',
            borderRadius: 10,
            border: 'none',
            background: loading ? '#666' : 'linear-gradient(135deg, #ff0000, #cc0000)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            cursor: loading ? 'wait' : 'pointer',
            opacity: !url.trim() ? 0.5 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Загрузка...' : 'Анализировать'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ ...cardStyle, borderColor: '#ef4444', color: '#ef4444', fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, ...textStyle }}>
          Анализируем видео...
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────── */}
      {data && !loading && (
        <div>
          {/* Overall score */}
          {data?.overallScore != null && (
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C?.sub ?? '#aaa', marginBottom: 4 }}>Общий балл</div>
              <div style={{
                fontSize: 56, fontWeight: 900, lineHeight: 1,
                color: scoreColor(Number(data.overallScore) / 10),
              }}>
                {String(data.overallScore ?? '—')}
              </div>
              <div style={{ fontSize: 13, color: C?.sub ?? '#aaa' }}>/100</div>
            </div>
          )}

          {/* YouTube embed */}
          {data?.videoId && (
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{
                position: 'relative', width: '100%',
                paddingBottom: data?.isShorts ? '177.78%' : '56.25%',
              }}>
                <iframe
                  src={`https://www.youtube.com/embed/${String(data.videoId)}`}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Video info */}
          {data?.title && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {data?.thumbnail && (
                  <img
                    src={String(data.thumbnail)}
                    alt=""
                    style={{ width: 160, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: C?.text ?? '#fff', marginBottom: 6, lineHeight: 1.3 }}>
                    {String(data?.title ?? '')}
                  </h3>
                  <p style={{ ...textStyle, marginBottom: 4 }}>{String(data?.channel ?? '')}</p>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', ...textStyle, fontSize: 13 }}>
                    {stats?.views != null && <span>👁 {fmt(stats.views)}</span>}
                    {stats?.likes != null && <span>👍 {fmt(stats.likes)}</span>}
                    {stats?.comments != null && <span>💬 {fmt(stats.comments)}</span>}
                    {data?.duration && <span>⏱ {String(data.duration)}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {data?.categoryName && <span style={pillStyle}>{String(data.categoryName)}</span>}
                    {data?.isShorts && <span style={{ ...pillStyle, background: isDark ? 'rgba(168,85,247,0.2)' : 'rgba(168,85,247,0.1)', color: '#a855f7' }}>Shorts</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scores */}
          {(analysis?.hookScore != null || analysis?.titleScore != null) && (
            <div style={cardStyle}>
              <h4 style={headerStyle}>Оценки контента</h4>
              {analysis?.hookScore != null && <Bar label="Хук (вступление)" value={analysis.hookScore} />}
              {analysis?.titleScore != null && <Bar label="Заголовок" value={analysis.titleScore} />}
              {analysis?.estimatedCTR != null && (
                <div style={{ ...textStyle, fontSize: 13, marginTop: 4 }}>
                  Ожидаемый CTR: <b style={{ color: C?.text ?? '#fff' }}>{String(analysis.estimatedCTR)}</b>
                </div>
              )}
              {analysis?.engagementRate != null && (
                <div style={{ ...textStyle, fontSize: 13, marginTop: 2 }}>
                  Вовлечённость: <b style={{ color: C?.text ?? '#fff' }}>{String(analysis.engagementRate)}%</b>
                </div>
              )}
            </div>
          )}

          {/* Shorts analysis */}
          {shorts && data?.isShorts && (
            <div style={cardStyle}>
              <h4 style={headerStyle}>Shorts Анализ</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {shorts?.hookQuality != null && (
                  <span style={pillStyle}>Хук: {String(shorts.hookQuality)}</span>
                )}
                {shorts?.loopPotential != null && (
                  <span style={pillStyle}>Зацикливание: {String(shorts.loopPotential)}/10</span>
                )}
                {shorts?.shareability != null && (
                  <span style={pillStyle}>Виральность: {String(shorts.shareability)}/10</span>
                )}
                {shorts?.verticalOptimized != null && (
                  <span style={pillStyle}>{shorts.verticalOptimized ? '✅' : '❌'} Вертикальный формат</span>
                )}
              </div>
              {shorts?.optimalLength != null && (
                <p style={{ ...textStyle, fontSize: 13 }}>Оптимальная длина: {String(shorts.optimalLength)}</p>
              )}
              {shorts?.trendAlignment != null && (
                <p style={{ ...textStyle, fontSize: 13 }}>Тренды: {String(shorts.trendAlignment)}</p>
              )}
              {(((shorts?.tips ?? []) as string[]).length > 0) && (
                <div style={{ marginTop: 10 }}>
                  {((shorts?.tips ?? []) as string[]).map((t, i) => (
                    <p key={i} style={{ ...textStyle, fontSize: 13, marginBottom: 4 }}>💡 {String(t)}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEO */}
          {seo && (
            <div style={cardStyle}>
              <h4 style={headerStyle}>SEO анализ</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', ...textStyle, fontSize: 13 }}>
                {seo?.titleLength != null && (
                  <div>Длина заголовка: <b style={{ color: C?.text ?? '#fff' }}>{String(seo.titleLength)}</b> {seo?.optimalTitleRange ? `(${String(seo.optimalTitleRange)})` : ''}</div>
                )}
                {seo?.descriptionLength != null && (
                  <div>Длина описания: <b style={{ color: C?.text ?? '#fff' }}>{String(seo.descriptionLength)}</b></div>
                )}
                {seo?.tagsCount != null && (
                  <div>Тегов: <b style={{ color: C?.text ?? '#fff' }}>{String(seo.tagsCount)}</b></div>
                )}
                {seo?.languageDetected != null && (
                  <div>Язык: <b style={{ color: C?.text ?? '#fff' }}>{String(seo.languageDetected)}</b></div>
                )}
                {seo?.readabilityScore != null && (
                  <div>Читаемость: <b style={{ color: C?.text ?? '#fff' }}>{String(seo.readabilityScore)}/10</b></div>
                )}
                {seo?.searchOptimization != null && (
                  <div>Поисковая оптимизация: <b style={{ color: C?.text ?? '#fff' }}>{String(seo.searchOptimization)}</b></div>
                )}
              </div>
              {((seo?.titleKeywords ?? []) as string[]).length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C?.text ?? '#fff', marginBottom: 6 }}>Ключевые слова</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {((seo?.titleKeywords ?? []) as string[]).map((k, i) => (
                      <span key={i} style={pillStyle}>{String(k)}</span>
                    ))}
                  </div>
                </div>
              )}
              {((seo?.tags ?? []) as string[]).length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C?.text ?? '#fff', marginBottom: 6 }}>Теги</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {((seo?.tags ?? []) as string[]).map((t, i) => (
                      <span key={i} style={{ ...pillStyle, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: C?.sub ?? '#aaa' }}>{String(t)}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Engagement */}
          {engagement && (
            <div style={cardStyle}>
              <h4 style={headerStyle}>Вовлечённость</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', ...textStyle, fontSize: 13 }}>
                {engagement?.likeRate != null && <div>Like rate: <b style={{ color: C?.text ?? '#fff' }}>{String(engagement.likeRate)}%</b></div>}
                {engagement?.commentRate != null && <div>Comment rate: <b style={{ color: C?.text ?? '#fff' }}>{String(engagement.commentRate)}%</b></div>}
                {engagement?.viralCoefficient != null && <div>Виральность: <b style={{ color: C?.text ?? '#fff' }}>{String(engagement.viralCoefficient)}</b></div>}
                {engagement?.audienceRetentionEstimate != null && <div>Удержание: <b style={{ color: C?.text ?? '#fff' }}>{String(engagement.audienceRetentionEstimate)}</b></div>}
                {engagement?.benchmarkComparison != null && <div>Сравнение с нишей: <b style={{ color: C?.text ?? '#fff' }}>{String(engagement.benchmarkComparison)}</b></div>}
              </div>
            </div>
          )}

          {/* Strategy */}
          {strategy && (
            <div style={cardStyle}>
              <h4 style={headerStyle}>Стратегия</h4>
              <div style={{ ...textStyle, fontSize: 13 }}>
                {strategy?.bestPostingTime != null && <p style={{ marginBottom: 4 }}>Лучшее время публикации: <b style={{ color: C?.text ?? '#fff' }}>{String(strategy.bestPostingTime)}</b></p>}
                {strategy?.recommendedFrequency != null && <p style={{ marginBottom: 4 }}>Рекомендуемая частота: <b style={{ color: C?.text ?? '#fff' }}>{String(strategy.recommendedFrequency)}</b></p>}
                {strategy?.monetizationPotential != null && <p style={{ marginBottom: 4 }}>Потенциал монетизации: <b style={{ color: C?.text ?? '#fff' }}>{String(strategy.monetizationPotential)}</b></p>}
                {strategy?.audienceAge != null && <p style={{ marginBottom: 4 }}>Целевой возраст: <b style={{ color: C?.text ?? '#fff' }}>{String(strategy.audienceAge)}</b></p>}
              </div>
              {((strategy?.crossPlatformPotential ?? []) as string[]).length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {((strategy?.crossPlatformPotential ?? []) as string[]).map((p, i) => (
                    <span key={i} style={pillStyle}>{String(p)}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Competition */}
          {competition && (
            <div style={cardStyle}>
              <h4 style={headerStyle}>Конкуренция</h4>
              <div style={{ ...textStyle, fontSize: 13 }}>
                {competition?.nichePopularity != null && <p style={{ marginBottom: 4 }}>Популярность ниши: <b style={{ color: C?.text ?? '#fff' }}>{String(competition.nichePopularity)}</b></p>}
                {competition?.contentSaturation != null && <p style={{ marginBottom: 4 }}>Насыщенность контента: <b style={{ color: C?.text ?? '#fff' }}>{String(competition.contentSaturation)}</b></p>}
              </div>
              {((competition?.differentiationTips ?? []) as string[]).length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {((competition?.differentiationTips ?? []) as string[]).map((t, i) => (
                    <p key={i} style={{ ...textStyle, fontSize: 13, marginBottom: 4 }}>💡 {String(t)}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Structure */}
          {structure.length > 0 && (
            <div style={cardStyle}>
              <h4 style={headerStyle}>Структура видео</h4>
              {(structure ?? []).map((seg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{String(seg?.icon ?? '🎬')}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C?.text ?? '#fff' }}>{String(seg?.label ?? '')}</div>
                    <div style={{ ...textStyle, fontSize: 12 }}>{String(seg?.start ?? '')} — {String(seg?.end ?? '')}</div>
                  </div>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: String(seg?.color ?? '#666') }} />
                </div>
              ))}
            </div>
          )}

          {/* Viral factors */}
          {viralFactors.length > 0 && (
            <div style={cardStyle}>
              <h4 style={headerStyle}>Факторы виральности</h4>
              {(viralFactors ?? []).map((f, i) => (
                <p key={i} style={{ ...textStyle, fontSize: 13, marginBottom: 4 }}>✅ {String(f)}</p>
              ))}
            </div>
          )}

          {/* Tips */}
          {tips.length > 0 && (
            <div style={cardStyle}>
              <h4 style={headerStyle}>Рекомендации</h4>
              {(tips ?? []).map((t, i) => (
                <p key={i} style={{ ...textStyle, fontSize: 13, marginBottom: 6 }}>💡 {String(t)}</p>
              ))}
            </div>
          )}

          {/* Thumbnail analysis */}
          {thumb && (
            <div style={cardStyle}>
              <h4 style={headerStyle}>Превью</h4>
              <div style={{ ...textStyle, fontSize: 13 }}>
                {thumb?.hasCustomThumbnail != null && <p style={{ marginBottom: 4 }}>{thumb.hasCustomThumbnail ? '✅' : '❌'} Пользовательская превью</p>}
                {thumb?.resolution != null && <p style={{ marginBottom: 4 }}>Разрешение: {String(thumb.resolution)}</p>}
                {thumb?.aspectRatio != null && <p style={{ marginBottom: 4 }}>Соотношение сторон: {String(thumb.aspectRatio)}</p>}
              </div>
              {((thumb?.tips ?? []) as string[]).length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {((thumb?.tips ?? []) as string[]).map((t, i) => (
                    <p key={i} style={{ ...textStyle, fontSize: 13, marginBottom: 4 }}>💡 {String(t)}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Open on YouTube */}
          {data?.videoId && (
            <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
              <a
                href={`https://www.youtube.com/watch?v=${String(data.videoId)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '10px 24px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                Открыть на YouTube ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
