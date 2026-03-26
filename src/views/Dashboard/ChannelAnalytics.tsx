'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCountUp } from '@/hooks/useCountUp';

/* ── Lazy-load recharts ─────────────────────────────── */
let rechartsCache: typeof import('recharts') | null = null;

function useRecharts() {
  const [mod, setMod] = useState(rechartsCache);
  useEffect(() => {
    if (rechartsCache) return;
    import('recharts').then((m) => {
      rechartsCache = m;
      setMod(m);
    });
  }, []);
  return mod;
}

/* ── Helpers ─────────────────────────────────────────── */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

/* ── Tab definitions ─────────────────────────────────── */
const TAB_KEYS = ['all', 'optimization', 'research', 'analytics', 'achievements'] as const;
type Tab = (typeof TAB_KEYS)[number];

/* ── Mock keyword data (backend placeholder) ─────────── */
function generateTrendData() {
  const data: { date: string; volume: number }[] = [];
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    data.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      volume: Math.floor(800 + Math.random() * 600 + (29 - i) * 15),
    });
  }
  return data;
}

const MOCK_KEYWORD = {
  keyword: 'youtube automation 2026',
  searches: 14800,
  growth: 153,
  vph: 2400,
  trend: generateTrendData(),
  isPro: false, // Unlocked for testing
};

const MOCK_COMPETITORS = [
  { name: 'vidIQ', subscribers: '1.2M', avatar: null },
  { name: 'TubeBuddy', subscribers: '890K', avatar: null },
  { name: 'Creator Insider', subscribers: '2.1M', avatar: null },
  { name: 'Think Media', subscribers: '3.4M', avatar: null },
  { name: 'Channel Makers', subscribers: '720K', avatar: null },
];

/* ── Channel selector dropdown ───────────────────────── */
function ChannelSelector({
  channels,
  selectedId,
  onSelect,
  C,
  t,
}: {
  channels: Array<{ id: string; snippet: { title: string; thumbnails?: { default?: { url?: string } } } }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  t: (key: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const selected = channels.find((ch) => ch.id === selectedId);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', borderRadius: 12,
          background: C.card, border: `1px solid ${C.border}`,
          cursor: 'pointer', color: C.text, fontSize: 14, fontWeight: 600,
          minWidth: 220, transition: 'border-color .2s',
        }}
      >
        {selected?.snippet.thumbnails?.default?.url ? (
          <img
            src={selected.snippet.thumbnails.default.url}
            alt=""
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.surface }} />
        )}
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected?.snippet.title ?? t('channel.selectChannel')}
        </span>
        <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
          <path d="M3 5l3 3 3-3" stroke={C.sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
          overflow: 'hidden', zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,.3)',
        }}>
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => { onSelect(ch.id); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 16px', border: 'none', cursor: 'pointer',
                background: ch.id === selectedId ? C.surface : 'transparent',
                color: C.text, fontSize: 13, textAlign: 'left',
                transition: 'background .15s',
              }}
            >
              {ch.snippet.thumbnails?.default?.url ? (
                <img
                  src={ch.snippet.thumbnails.default.url}
                  alt=""
                  style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.surface }} />
              )}
              <span>{ch.snippet.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Animated stat number ───────────────────────────── */
function AnimatedStatValue({ value, color }: { value: number; color: string }) {
  const animated = useCountUp(value, 900);
  return (
    <span className="tf-count-up" style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: '-.03em', lineHeight: 1 }}>
      {formatNumber(animated)}
    </span>
  );
}

/* ── Progress bar stat card ──────────────────────────── */
function StatWidget({
  label,
  value,
  min,
  max,
  color,
  icon,
  C,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  color: string;
  icon: React.ReactNode;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
}) {
  const range = max - min || 1;
  const pct = Math.min(100, Math.max(0, ((value - min) / range) * 100));

  return (
    <div style={{
      flex: '1 1 280px', minWidth: 240, padding: '20px 24px', borderRadius: 16,
      background: C.card, border: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.sub, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          {label}
        </span>
      </div>
      <AnimatedStatValue value={value} color={C.text} />
      <div style={{ width: '100%', height: 6, borderRadius: 3, background: C.surface, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 3,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          transition: 'width .6s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.dim }}>
        <span>{formatNumber(min)}</span>
        <span>{formatNumber(max)}</span>
      </div>
    </div>
  );
}

/* ── Trending keyword card ───────────────────────────── */
function TrendingKeywordCard({
  data,
  C,
  recharts,
  t,
}: {
  data: typeof MOCK_KEYWORD;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  recharts: typeof import('recharts') | null;
  t: (key: string) => string;
}) {
  return (
    <div style={{
      borderRadius: 16, background: C.card, border: `1px solid ${C.border}`,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{data.keyword}</span>
            {data.isPro && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 6,
                background: `${C.accent}20`, color: C.accent,
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                {t('channel.unlock')}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: C.sub }}>
              {formatNumber(data.searches)} {t('channel.searches')}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 600, color: C.green,
              padding: '2px 8px', borderRadius: 6, background: `${C.green}15`,
            }}>
              +{data.growth}%
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: C.dim, textTransform: 'uppercase', fontWeight: 600 }}>VPH</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.blue, letterSpacing: '-.02em' }}>
            {formatNumber(data.vph)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding: '0 16px 16px', height: 200 }}>
        {recharts ? (
          <recharts.ResponsiveContainer width="100%" height="100%">
            <recharts.LineChart data={data.trend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <recharts.CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <recharts.XAxis
                dataKey="date"
                tick={{ fill: C.dim, fontSize: 10 }}
                stroke={C.border}
                interval="preserveStartEnd"
              />
              <recharts.YAxis
                tick={{ fill: C.dim, fontSize: 10 }}
                stroke={C.border}
                width={40}
              />
              <recharts.Tooltip
                contentStyle={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 10, fontSize: 12,
                }}
                labelStyle={{ color: C.sub }}
                itemStyle={{ color: C.text }}
              />
              <recharts.Line
                type="monotone"
                dataKey="volume"
                stroke={C.blue}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: C.blue }}
              />
            </recharts.LineChart>
          </recharts.ResponsiveContainer>
        ) : (
          <Skeleton width="100%" height="100%" />
        )}
      </div>
    </div>
  );
}

/* ── Competitors card ────────────────────────────────── */
function CompetitorsCard({
  competitors,
  C,
  t,
}: {
  competitors: typeof MOCK_COMPETITORS;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  t: (key: string) => string;
}) {
  return (
    <div style={{
      borderRadius: 16, background: C.card, border: `1px solid ${C.border}`,
      padding: '20px 24px',
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 16px' }}>
        {t('channel.suggestedCompetitors')}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {competitors.map((comp) => (
          <div
            key={comp.name}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 12,
              background: C.surface, transition: 'background .15s',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.accent}, ${C.blue})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {comp.name.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{comp.name}</div>
              <div style={{ fontSize: 11, color: C.sub }}>{comp.subscribers} {t('channel.subscribersLabel')}</div>
            </div>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main export ─────────────────────────────────────── */
export function ChannelAnalytics() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const recharts = useRecharts();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('all');

  /* ── Fetch channels ── */
  const channelsQuery = trpc.youtube.getChannels.useQuery(undefined, {
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const channels = channelsQuery.data ?? [];

  // Auto-select first channel
  useEffect(() => {
    if (!selectedChannel && channels.length > 0) {
      setSelectedChannel(channels[0].id);
    }
  }, [channels, selectedChannel]);

  /* ── Fetch analytics for selected channel ── */
  const analyticsQuery = trpc.youtube.getAnalytics.useQuery(
    { channelId: selectedChannel!, period: '28' },
    { enabled: !!selectedChannel, staleTime: 5 * 60 * 1000, retry: 1 },
  );

  /* ── Compute stats from analytics rows ── */
  const stats = useMemo(() => {
    const rows: number[][] = analyticsQuery.data?.rows ?? [];
    const selected = channels.find((ch: { id: string }) => ch.id === selectedChannel);
    const currentSubs = selected?.statistics?.subscriberCount
      ? parseInt(selected.statistics.subscriberCount)
      : 0;

    let totalViews = 0;
    let totalSubsGained = 0;
    const dailyViews: number[] = [];
    const dailySubs: number[] = [];

    for (const row of rows) {
      const views = row[1] ?? 0;
      const subsGained = row[2] ?? 0;
      totalViews += views;
      totalSubsGained += subsGained;
      dailyViews.push(views);
      dailySubs.push(subsGained);
    }

    const minViews = dailyViews.length > 0 ? Math.min(...dailyViews) * rows.length : 0;
    const maxViews = dailyViews.length > 0 ? Math.max(...dailyViews) * rows.length : totalViews + 1000;

    const subLow = Math.max(0, currentSubs - totalSubsGained);
    const subHigh = currentSubs + Math.floor(totalSubsGained * 0.2);

    return {
      subscribers: currentSubs,
      views: totalViews,
      viewsMin: minViews,
      viewsMax: Math.max(maxViews, totalViews + 1),
      subsMin: subLow,
      subsMax: Math.max(subHigh, currentSubs + 1),
    };
  }, [analyticsQuery.data, channels, selectedChannel]);

  /* ── Error state: show details + retry, not just "Connect" ── */
  if (channelsQuery.isError) {
    const isUnauthorized = channelsQuery.error?.data?.code === 'UNAUTHORIZED';
    return (
      <div style={{
        padding: '40px 24px', borderRadius: 16, background: C.card,
        border: `1px solid ${C.border}`, textAlign: 'center',
      }}>
        <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
          <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29.94 29.94 0 001 12a29.94 29.94 0 00.46 5.58A2.78 2.78 0 003.4 19.6C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29.94 29.94 0 0023 12a29.94 29.94 0 00-.46-5.58z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
        </svg>
        <p style={{ color: C.sub, fontSize: 14, margin: '0 0 4px' }}>
          {isUnauthorized ? t('channel.connectYoutube') : t('channel.failedToLoad')}
        </p>
        <p style={{ color: C.dim, fontSize: 12, margin: '0 0 16px' }}>
          {isUnauthorized
            ? t('channel.linkGoogleAccount')
            : (channelsQuery.error?.message || t('channel.apiUnavailable'))}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!isUnauthorized && (
            <button
              onClick={() => channelsQuery.refetch()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: C.accent, color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', transition: 'opacity .2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              {t('channel.retry')}
            </button>
          )}
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 10,
              border: isUnauthorized ? 'none' : `1px solid ${C.border}`,
              background: isUnauthorized ? C.accent : C.surface,
              color: isUnauthorized ? '#fff' : C.text,
              fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'opacity .2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            {isUnauthorized ? t('channel.connectYoutubeChannel') : t('channel.reconnectAccount')}
          </button>
        </div>
      </div>
    );
  }

  if (channelsQuery.isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton width={220} height={48} style={{ borderRadius: 12 }} />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Skeleton width="100%" height={140} style={{ borderRadius: 16, flex: '1 1 280px' }} />
          <Skeleton width="100%" height={140} style={{ borderRadius: 16, flex: '1 1 280px' }} />
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div style={{
        padding: '40px 24px', borderRadius: 16, background: C.card,
        border: `1px solid ${C.border}`, textAlign: 'center',
      }}>
        <p style={{ color: C.sub, fontSize: 14, margin: '0 0 4px' }}>{t('channel.noChannelsFound')}</p>
        <p style={{ color: C.dim, fontSize: 12, margin: '0 0 16px' }}>{t('channel.noChannelsHint')}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => channelsQuery.refetch()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: C.accent, color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'opacity .2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            {t('channel.retry')}
          </button>
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 10, border: `1px solid ${C.border}`,
              background: C.surface, color: C.text, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'opacity .2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            {t('channel.reconnectGoogle')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Channel selector ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-.02em' }}>
          {t('channel.title')}
        </h2>
        <ChannelSelector
          channels={channels}
          selectedId={selectedChannel}
          onSelect={setSelectedChannel}
          C={C}
          t={t}
        />
      </div>

      {/* ── Stat widgets ── */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatWidget
          label={t('channel.subscribers')}
          value={stats.subscribers}
          min={stats.subsMin}
          max={stats.subsMax}
          color={C.blue}
          icon={
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
          C={C}
        />
        <StatWidget
          label={t('channel.views')}
          value={stats.views}
          min={stats.viewsMin}
          max={stats.viewsMax}
          color={C.green}
          icon={
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          }
          C={C}
        />
      </div>

      {/* ── Filter tabs ── */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        {TAB_KEYS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 18px', borderRadius: 10, border: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              whiteSpace: 'nowrap', transition: 'all .2s',
              background: activeTab === tab ? C.accent : C.surface,
              color: activeTab === tab ? '#fff' : C.sub,
            }}
          >
            {t(`channel.tab.${tab}`)}
          </button>
        ))}
      </div>

      {/* ── Content based on tab ── */}
      {(activeTab === 'all' || activeTab === 'research') && (
        <TrendingKeywordCard data={MOCK_KEYWORD} C={C} recharts={recharts} t={t} />
      )}

      {(activeTab === 'all' || activeTab === 'analytics') && (
        <CompetitorsCard competitors={MOCK_COMPETITORS} C={C} t={t} />
      )}
    </div>
  );
}
