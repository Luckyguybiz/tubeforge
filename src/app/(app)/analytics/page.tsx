'use client';

import { Suspense, useState, useCallback, lazy } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

/* ── Lazy-loaded tab content ───────────────────────────────────────── */

const ShortsAnalytics = lazy(() =>
  import('@/views/ShortsAnalytics/ShortsAnalytics').then((m) => ({
    default: m.ShortsAnalytics,
  })),
);

const TiktokAnalytics = lazy(() =>
  import('@/views/TiktokAnalytics/TiktokAnalytics').then((m) => ({
    default: m.TiktokAnalytics,
  })),
);

/* ── Tab definitions ───────────────────────────────────────────────── */

type Tab = 'shorts' | 'tiktok';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'shorts',
    label: 'YouTube Shorts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <rect x="7" y="2" width="6" height="16" rx="3" fill="currentColor" opacity=".85" />
        <path d="M8.5 8L12.5 10.5L8.5 13V8Z" fill="#000" opacity=".7" />
      </svg>
    ),
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path
          d="M14.5 2C14.5 2 14.5 5.5 18 6V9C16.5 9 15 8.2 14.5 7.5V13.5C14.5 16.5 12 18.5 9.5 18.5C7 18.5 4.5 16.5 4.5 13.5C4.5 10.5 7 8.5 9.5 9V12C8.5 12 7.5 12.8 7.5 13.5C7.5 14.5 8.5 15.5 9.5 15.5C10.5 15.5 11.5 14.5 11.5 13.5V2H14.5Z"
          fill="currentColor"
          opacity=".85"
        />
      </svg>
    ),
  },
];

/* ── Inner component (uses useSearchParams) ────────────────────────── */

function AnalyticsInner() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = (searchParams.get('tab') as Tab) || 'shorts';
  const [activeTab, setActiveTab] = useState<Tab>(
    TABS.some((t) => t.key === initialTab) ? initialTab : 'shorts',
  );

  const switchTab = useCallback(
    (tab: Tab) => {
      setActiveTab(tab);
      router.replace(`/analytics?tab=${tab}`, { scroll: false });
    },
    [router],
  );

  return (
    <div
      className="tf-analytics-container"
      style={{
        padding: '32px 36px',
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: C.text,
            letterSpacing: '-.04em',
            margin: 0,
          }}
        >
          Analytics
        </h1>
        <p
          style={{
            fontSize: 13.5,
            color: C.sub,
            margin: '6px 0 0',
            fontWeight: 450,
          }}
        >
          Trending content insights for YouTube Shorts and TikTok
        </p>
      </div>

      {/* ── Tab Switcher ────────────────────────────────────────────── */}
      <div
        className="tf-analytics-tabs"
        style={{
          display: 'flex',
          gap: 8,
          padding: 4,
          background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)',
          borderRadius: 14,
          width: 'fit-content',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 22px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13.5,
                fontWeight: isActive ? 650 : 500,
                color: isActive ? '#fff' : C.sub,
                background: isActive
                  ? `linear-gradient(135deg, ${C.accent}, ${isDark ? 'rgba(139,92,246,0.85)' : 'rgba(99,60,200,0.9)'})`
                  : 'transparent',
                boxShadow: isActive
                  ? `0 2px 12px ${isDark ? 'rgba(139,92,246,.25)' : 'rgba(99,60,200,.2)'}`
                  : 'none',
                transition: 'all .2s ease',
                letterSpacing: '-.01em',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: isActive ? '#fff' : C.dim,
                }}
              >
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────── */}
      <div
        className="tf-analytics-content"
        style={{
          borderRadius: 16,
          background: isDark
            ? `linear-gradient(135deg, ${C.card}, rgba(17,17,25,.9))`
            : C.card,
          border: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : C.border}`,
          overflow: 'hidden',
          minHeight: 400,
        }}
      >
        <ErrorBoundary>
          <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
            {activeTab === 'shorts' ? <ShortsAnalytics /> : <TiktokAnalytics />}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

/* ── Page wrapper (Suspense boundary for useSearchParams) ──────────── */

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
      <AnalyticsInner />
    </Suspense>
  );
}
