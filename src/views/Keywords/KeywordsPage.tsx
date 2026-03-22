'use client';

import { useState, useCallback, useMemo } from 'react';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { Skeleton } from '@/components/ui/Skeleton';

/* ── Types ────────────────────────────────────────────────────────── */

type TabId = 'overview' | 'opportunities' | 'rising';
type TrendPeriod = 'today' | 'week' | 'month';

interface MainKeyword {
  keyword: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
  cpc: number;
  trend: 'rising' | 'stable' | 'declining';
}

interface RelatedKeyword {
  keyword: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
  relevance: number;
}

interface LongTailKeyword {
  keyword: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
}

interface RisingKeyword {
  keyword: string;
  searchVolume: number;
  volumeChange: number;
}

interface OpportunityKeyword {
  keyword: string;
  searchVolume: number;
  competition: string;
  opportunity: 'high' | 'medium';
}

interface SearchData {
  mainKeyword: MainKeyword;
  relatedKeywords: RelatedKeyword[];
  longTailKeywords: LongTailKeyword[];
  risingKeywords: RisingKeyword[];
  topOpportunities: OpportunityKeyword[];
}

/* ── Formatters ───────────────────────────────────────────────────── */

function fmtVol(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function compColor(c: string): string {
  if (c === 'low') return '#22c55e';
  if (c === 'medium') return '#eab308';
  return '#ef4444';
}

function trendIcon(t: string): string {
  if (t === 'rising') return '\u2191';
  if (t === 'declining') return '\u2193';
  return '\u2192';
}

function trendColor(t: string): string {
  if (t === 'rising') return '#22c55e';
  if (t === 'declining') return '#ef4444';
  return '#eab308';
}

/* ── Component ────────────────────────────────────────────────────── */

export function KeywordsPage() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const t = useLocaleStore((s) => s.t);
  const { plan } = usePlanLimits();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [query, setQuery] = useState('');
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('month');
  const [searchData, setSearchData] = useState<SearchData | null>(null);

  const searchMut = trpc.keywords.search.useMutation({
    onSuccess: (data) => {
      setSearchData(data as SearchData);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const trendingQuery = trpc.keywords.getTrending.useQuery(
    { period: trendPeriod },
    { refetchOnWindowFocus: false },
  );

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    searchMut.mutate({ query: trimmed });
  }, [query, searchMut]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch],
  );

  const tabs: { id: TabId; label: string }[] = useMemo(
    () => [
      { id: 'overview', label: t('keywords.tab.overview') },
      { id: 'opportunities', label: t('keywords.tab.opportunities') },
      { id: 'rising', label: t('keywords.tab.rising') },
    ],
    [t],
  );

  const periodOptions: { id: TrendPeriod; label: string }[] = useMemo(
    () => [
      { id: 'today', label: t('keywords.period.today') },
      { id: 'week', label: t('keywords.period.week') },
      { id: 'month', label: t('keywords.period.month') },
    ],
    [t],
  );

  const isLoading = searchMut.isPending;
  const trendingKws = trendingQuery.data?.keywords ?? [];
  const isFree = plan === 'FREE';

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 4px' }}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            color: C.text,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            margin: 0,
          }}
        >
          {t('keywords.title')}
        </h1>
        <p
          style={{
            color: C.sub,
            fontSize: 14,
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          {t('keywords.subtitle')}
        </p>
      </div>

      {/* ── Search bar ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            flex: 1,
            position: 'relative',
          }}
        >
          {/* Search icon */}
          <div
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: C.dim,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('keywords.searchPlaceholder')}
            style={{
              width: '100%',
              height: 52,
              padding: '0 16px 0 44px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              color: C.text,
              fontSize: 15,
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.15s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          style={{
            height: 52,
            padding: '0 28px',
            background: isLoading ? C.dim : C.accent,
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: isLoading || !query.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !query.trim() ? 0.6 : 1,
            transition: 'opacity 0.15s, transform 0.1s',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {isLoading ? (
            <span
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                border: '2px solid rgba(255,255,255,.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8H14M9 3L14 8L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {t('keywords.searchBtn')}
        </button>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 24,
          padding: 4,
          background: C.surface,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          width: 'fit-content',
        }}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: active ? C.accent : 'transparent',
                color: active ? '#fff' : C.sub,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Content area ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* ── Left panel: Search results ──────────────────────────── */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
            minHeight: 400,
          }}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              data={searchData}
              isLoading={isLoading}
              C={C}
              isDark={isDark}
              t={t}
            />
          )}
          {activeTab === 'opportunities' && (
            <OpportunitiesTab
              data={searchData}
              isLoading={isLoading}
              C={C}
              isDark={isDark}
              t={t}
            />
          )}
          {activeTab === 'rising' && (
            <RisingTab
              data={searchData}
              isLoading={isLoading}
              C={C}
              isDark={isDark}
              t={t}
            />
          )}
        </div>

        {/* ── Right panel: Trending ───────────────────────────────── */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                color: C.text,
                fontSize: 16,
                fontWeight: 700,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {t('keywords.trending.title')}
            </h3>
          </div>

          {/* Period toggle */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              marginBottom: 16,
              padding: 3,
              background: C.surface,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
            }}
          >
            {periodOptions.map((p) => {
              const active = trendPeriod === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setTrendPeriod(p.id)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: 'none',
                    background: active ? C.accent : 'transparent',
                    color: active ? '#fff' : C.sub,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Trending list */}
          {trendingQuery.isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Skeleton width="55%" height={16} />
                  <Skeleton width="20%" height={14} />
                  <Skeleton width="20%" height={14} />
                </div>
              ))}
            </div>
          ) : trendingKws.length === 0 ? (
            <p style={{ color: C.dim, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              {t('keywords.trending.empty')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Header row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 90px',
                  gap: 8,
                  padding: '0 0 8px',
                  borderBottom: `1px solid ${C.border}`,
                  marginBottom: 4,
                }}
              >
                <span style={{ color: C.dim, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  {t('keywords.col.keyword')}
                </span>
                <span style={{ color: C.dim, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'right' }}>
                  {t('keywords.col.volume')}
                </span>
                <span style={{ color: C.dim, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'right' }}>
                  {t('keywords.col.change')}
                </span>
              </div>
              {(isFree ? trendingKws.slice(0, 5) : trendingKws).map((kw, i) => (
                <div
                  key={kw.keyword}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 90px',
                    gap: 8,
                    padding: '10px 0',
                    background: i % 2 === 0 ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') : 'transparent',
                    borderRadius: 6,
                  }}
                >
                  <span
                    style={{
                      color: C.text,
                      fontSize: 13,
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      paddingLeft: 6,
                    }}
                  >
                    {kw.keyword}
                  </span>
                  <span style={{ color: C.sub, fontSize: 13, textAlign: 'right' }}>
                    {fmtVol(kw.searchVolume)}
                  </span>
                  <span
                    style={{
                      color: kw.volumeChange >= 0 ? '#22c55e' : '#ef4444',
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: 'right',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 3,
                      paddingRight: 6,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d={kw.volumeChange >= 0 ? 'M5 1L9 6H1L5 1Z' : 'M5 9L1 4H9L5 9Z'}
                        fill="currentColor"
                      />
                    </svg>
                    {kw.volumeChange >= 0 ? '+' : ''}{kw.volumeChange}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* PRO upsell */}
          {isFree && trendingKws.length > 5 && (
            <div
              style={{
                marginTop: 16,
                padding: '14px 16px',
                background: `linear-gradient(135deg, ${C.accent}15, ${C.purple}15)`,
                borderRadius: 10,
                border: `1px solid ${C.accent}30`,
                textAlign: 'center',
              }}
            >
              <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>
                {t('keywords.trending.unlockTitle')}
              </p>
              <p style={{ color: C.sub, fontSize: 12, margin: '0 0 10px' }}>
                {t('keywords.trending.unlockDesc')}
              </p>
              <button
                onClick={() => (window.location.href = '/billing')}
                style={{
                  padding: '8px 20px',
                  background: C.accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
              >
                {t('keywords.trending.upgradePro')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spin keyframe (injected inline) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Overview Tab ─────────────────────────────────────────────────── */

function OverviewTab({
  data,
  isLoading,
  C,
  isDark,
  t,
}: {
  data: SearchData | null;
  isLoading: boolean;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  isDark: boolean;
  t: (k: string) => string;
}) {
  if (isLoading) return <LoadingSkeleton />;
  if (!data) return <EmptyState C={C} t={t} />;

  const mk = data.mainKeyword;

  return (
    <div>
      {/* Main keyword card */}
      <div
        style={{
          padding: 20,
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          borderRadius: 12,
          marginBottom: 20,
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <h3 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              {mk.keyword}
            </h3>
            <span style={{ color: C.sub, fontSize: 12, marginTop: 4, display: 'inline-block' }}>
              {t('keywords.overview.mainKeyword')}
            </span>
          </div>
          <span
            style={{
              color: trendColor(mk.trend),
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 6,
              background: `${trendColor(mk.trend)}15`,
            }}
          >
            {trendIcon(mk.trend)} {mk.trend}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <StatBlock label={t('keywords.stat.volume')} value={fmtVol(mk.searchVolume)} C={C} />
          <StatBlock label={t('keywords.stat.competition')} value={mk.competition} color={compColor(mk.competition)} C={C} />
          <StatBlock label={t('keywords.stat.cpc')} value={`$${mk.cpc.toFixed(2)}`} C={C} />
        </div>
      </div>

      {/* Related keywords */}
      <h4 style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.01em' }}>
        {t('keywords.overview.related')} ({data.relatedKeywords.length})
      </h4>
      <KeywordTable
        columns={[
          { key: 'keyword', label: t('keywords.col.keyword'), flex: 2 },
          { key: 'searchVolume', label: t('keywords.col.volume'), flex: 1, align: 'right', format: (v: number) => fmtVol(v) },
          { key: 'competition', label: t('keywords.col.competition'), flex: 1, align: 'center', render: (v: string) => (
            <span style={{ color: compColor(v), fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{v}</span>
          )},
          { key: 'relevance', label: t('keywords.col.relevance'), flex: 1, align: 'right', render: (v: number) => (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border, overflow: 'hidden' }}>
                <div style={{ width: `${v}%`, height: '100%', borderRadius: 2, background: C.accent }} />
              </div>
              <span style={{ fontSize: 12 }}>{v}%</span>
            </div>
          )},
        ]}
        rows={data.relatedKeywords}
        C={C}
        isDark={isDark}
      />

      {/* Long-tail keywords */}
      {data.longTailKeywords.length > 0 && (
        <>
          <h4 style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: '24px 0 12px', letterSpacing: '-0.01em' }}>
            {t('keywords.overview.longTail')} ({data.longTailKeywords.length})
          </h4>
          <KeywordTable
            columns={[
              { key: 'keyword', label: t('keywords.col.keyword'), flex: 2 },
              { key: 'searchVolume', label: t('keywords.col.volume'), flex: 1, align: 'right', format: (v: number) => fmtVol(v) },
              { key: 'competition', label: t('keywords.col.competition'), flex: 1, align: 'center', render: (v: string) => (
                <span style={{ color: compColor(v), fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{v}</span>
              )},
            ]}
            rows={data.longTailKeywords}
            C={C}
            isDark={isDark}
          />
        </>
      )}
    </div>
  );
}

/* ── Opportunities Tab ────────────────────────────────────────────── */

function OpportunitiesTab({
  data,
  isLoading,
  C,
  isDark,
  t,
}: {
  data: SearchData | null;
  isLoading: boolean;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  isDark: boolean;
  t: (k: string) => string;
}) {
  if (isLoading) return <LoadingSkeleton />;
  if (!data) return <EmptyState C={C} t={t} />;

  return (
    <div>
      <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
        {t('keywords.opportunities.title')}
      </h3>
      <p style={{ color: C.sub, fontSize: 13, margin: '0 0 20px' }}>
        {t('keywords.opportunities.desc')}
      </p>

      {data.topOpportunities.length === 0 ? (
        <p style={{ color: C.dim, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
          {t('keywords.opportunities.empty')}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.topOpportunities.map((opp, i) => (
            <div
              key={opp.keyword}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                background: i % 2 === 0 ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') : 'transparent',
                borderRadius: 10,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: C.text, fontSize: 14, fontWeight: 600, display: 'block' }}>
                  {opp.keyword}
                </span>
                <span style={{ color: C.sub, fontSize: 12, marginTop: 2, display: 'block' }}>
                  {fmtVol(opp.searchVolume)} {t('keywords.col.searches')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span
                  style={{
                    color: compColor(opp.competition),
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: `${compColor(opp.competition)}15`,
                  }}
                >
                  {opp.competition}
                </span>
                <span
                  style={{
                    color: opp.opportunity === 'high' ? '#22c55e' : '#eab308',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: opp.opportunity === 'high' ? 'rgba(34,197,94,.12)' : 'rgba(234,179,8,.12)',
                    letterSpacing: '.03em',
                  }}
                >
                  {opp.opportunity === 'high' ? t('keywords.opportunity.high') : t('keywords.opportunity.medium')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Rising Tab ───────────────────────────────────────────────────── */

function RisingTab({
  data,
  isLoading,
  C,
  isDark,
  t,
}: {
  data: SearchData | null;
  isLoading: boolean;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  isDark: boolean;
  t: (k: string) => string;
}) {
  if (isLoading) return <LoadingSkeleton />;
  if (!data) return <EmptyState C={C} t={t} />;

  return (
    <div>
      <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
        {t('keywords.rising.title')}
      </h3>
      <p style={{ color: C.sub, fontSize: 13, margin: '0 0 20px' }}>
        {t('keywords.rising.desc')}
      </p>

      {data.risingKeywords.length === 0 ? (
        <p style={{ color: C.dim, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
          {t('keywords.rising.empty')}
        </p>
      ) : (
        <KeywordTable
          columns={[
            { key: 'keyword', label: t('keywords.col.keyword'), flex: 2 },
            { key: 'searchVolume', label: t('keywords.col.volume'), flex: 1, align: 'right', format: (v: number) => fmtVol(v) },
            { key: 'volumeChange', label: t('keywords.col.change'), flex: 1, align: 'right', render: (v: number) => (
              <span
                style={{
                  color: v >= 0 ? '#22c55e' : '#ef4444',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 3,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d={v >= 0 ? 'M5 1L9 6H1L5 1Z' : 'M5 9L1 4H9L5 9Z'}
                    fill="currentColor"
                  />
                </svg>
                {v >= 0 ? '+' : ''}{v}%
              </span>
            )},
          ]}
          rows={data.risingKeywords}
          C={C}
          isDark={isDark}
        />
      )}
    </div>
  );
}

/* ── Shared: StatBlock ────────────────────────────────────────────── */

function StatBlock({
  label,
  value,
  color,
  C,
}: {
  label: string;
  value: string;
  color?: string;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
}) {
  return (
    <div>
      <span style={{ color: C.dim, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {label}
      </span>
      <p style={{ color: color ?? C.text, fontSize: 22, fontWeight: 700, margin: '4px 0 0', letterSpacing: '-0.02em' }}>
        {value}
      </p>
    </div>
  );
}

/* ── Shared: KeywordTable ─────────────────────────────────────────── */

interface ColumnDef {
  key: string;
  label: string;
  flex: number;
  align?: 'left' | 'center' | 'right';
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  format?: (v: any) => string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  render?: (v: any) => React.ReactNode;
}

function KeywordTable({
  columns,
  rows,
  C,
  isDark,
}: {
  columns: ColumnDef[];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  rows: Record<string, any>[];
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  isDark: boolean;
}) {
  return (
    <div style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 8, padding: '0 8px 8px', borderBottom: `1px solid ${C.border}` }}>
        {columns.map((col) => (
          <span
            key={col.key}
            style={{
              flex: col.flex,
              color: C.dim,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '.05em',
              textAlign: col.align ?? 'left',
            }}
          >
            {col.label}
          </span>
        ))}
      </div>
      {/* Rows */}
      {rows.map((row, i) => (
        <div
          key={row.keyword ?? i}
          style={{
            display: 'flex',
            gap: 8,
            padding: '10px 8px',
            background: i % 2 === 0 ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') : 'transparent',
            borderRadius: 6,
          }}
        >
          {columns.map((col) => {
            const val = row[col.key];
            return (
              <span
                key={col.key}
                style={{
                  flex: col.flex,
                  color: C.text,
                  fontSize: 13,
                  textAlign: col.align ?? 'left',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                }}
              >
                {col.render ? col.render(val) : col.format ? col.format(val) : String(val)}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────────────── */

function EmptyState({
  C,
  t,
}: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  t: (k: string) => string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
      }}
    >
      {/* Decorative icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: `linear-gradient(135deg, ${C.accent}15, ${C.purple}15)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="14" cy="14" r="9" stroke={C.accent} strokeWidth="2.5" opacity="0.6" />
          <path d="M21 21L28 28" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <path d="M10 14H18" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          <path d="M14 10V18" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      </div>
      <h3 style={{ color: C.text, fontSize: 17, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
        {t('keywords.empty.title')}
      </h3>
      <p style={{ color: C.sub, fontSize: 13, maxWidth: 320, lineHeight: 1.6 }}>
        {t('keywords.empty.desc')}
      </p>
    </div>
  );
}

/* ── Loading skeleton ─────────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Main keyword skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 20 }}>
        <Skeleton height={24} width="40%" />
        <Skeleton height={14} width="25%" />
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <Skeleton height={48} width="30%" />
          <Skeleton height={48} width="30%" />
          <Skeleton height={48} width="30%" />
        </div>
      </div>
      {/* Table skeleton */}
      <Skeleton height={16} width="30%" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 10 }}>
          <Skeleton height={16} width="50%" />
          <Skeleton height={16} width="20%" />
          <Skeleton height={16} width="15%" />
          <Skeleton height={16} width="15%" />
        </div>
      ))}
    </div>
  );
}
