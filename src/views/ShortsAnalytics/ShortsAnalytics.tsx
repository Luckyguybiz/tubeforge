'use client';

import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';

/* ── Types ───────────────────────────────────────────────────────── */

interface ShortItem {
  rank: number;
  videoId: string;
  title: string;
  views: number;
  viewsFormatted?: string;
  uploaded: string;
  channel: string;
  channelId?: string;
  channelAvatar?: string | null;
  thumbnail: string | null;
  duration?: number;
}

type Period = 'today' | 'yesterday' | '7d' | '28d' | '3m' | '6m' | '1y' | 'all';

interface Filters {
  country: string;
  category: string;
  showMusic: boolean;
  showKids: boolean;
  hideIndian: boolean;
  gameFilter: string;
}

/* ── Period config ───────────────────────────────────────────────── */

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'За сегодня' },
  { key: 'yesterday', label: 'За вчера' },
  { key: '7d', label: 'За 7 дней' },
  { key: '28d', label: 'За 28 дней' },
  { key: '3m', label: 'За 3 месяца' },
  { key: '6m', label: 'За 6 месяцев' },
  { key: '1y', label: 'За год' },
  { key: 'all', label: 'За всё время' },
];

const FREE_PERIOD: Period = '7d';

const COUNTRIES: { key: string; label: string }[] = [
  { key: '', label: 'Все' },
  { key: 'RU', label: 'Россия' },
  { key: 'US', label: 'США' },
  { key: 'KZ', label: 'Казахстан' },
  { key: 'IN', label: 'Индия' },
  { key: 'BR', label: 'Бразилия' },
  { key: 'DE', label: 'Германия' },
  { key: 'GB', label: 'Великобритания' },
  { key: 'FR', label: 'Франция' },
  { key: 'JP', label: 'Япония' },
  { key: 'KR', label: 'Корея' },
];

const CATEGORIES: { key: string; label: string }[] = [
  { key: '', label: 'Все' },
  { key: '1', label: 'Кино' },
  { key: '2', label: 'Авто' },
  { key: '10', label: 'Музыка' },
  { key: '15', label: 'Животные' },
  { key: '17', label: 'Спорт' },
  { key: '20', label: 'Игры' },
  { key: '22', label: 'Люди и блоги' },
  { key: '23', label: 'Юмор' },
  { key: '24', label: 'Развлечения' },
  { key: '25', label: 'Новости' },
  { key: '26', label: 'Хау-ту и стиль' },
  { key: '27', label: 'Образование' },
  { key: '28', label: 'Наука и технологии' },
];

const GAME_FILTERS: { key: string; label: string }[] = [
  { key: '', label: 'Все игры' },
  { key: 'minecraft', label: 'Minecraft' },
  { key: 'fortnite', label: 'Fortnite' },
  { key: 'roblox', label: 'Roblox' },
];

// Hindi/Devanagari script detection for "Hide Indian" filter
const INDIAN_PATTERN = /[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/;

/* ── Helpers ──────────────────────────────────────────────────────── */

function formatViews(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function getPeriodRange(period: Period): string {
  const now = new Date();
  const fmt = (d: Date) => d.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
  switch (period) {
    case 'today': return fmt(now);
    case 'yesterday': { const y = new Date(now); y.setDate(y.getDate() - 1); return fmt(y); }
    case '7d': { const d = new Date(now); d.setDate(d.getDate() - 7); return `${fmt(d)} - ${fmt(now)}`; }
    case '28d': { const d = new Date(now); d.setDate(d.getDate() - 28); return `${fmt(d)} - ${fmt(now)}`; }
    case '3m': { const d = new Date(now); d.setMonth(d.getMonth() - 3); return `${fmt(d)} - ${fmt(now)}`; }
    case '6m': { const d = new Date(now); d.setMonth(d.getMonth() - 6); return `${fmt(d)} - ${fmt(now)}`; }
    case '1y': { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return `${fmt(d)} - ${fmt(now)}`; }
    case 'all': return 'Всё время';
  }
}

/* ── Toggle switch ───────────────────────────────────────────────── */

const ToggleSwitch = memo(function ToggleSwitch({
  checked,
  onChange,
  label,
  isDark,
  accent,
  dim,
  sub,
  text,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  isDark: boolean;
  accent: string;
  dim: string;
  sub: string;
  text: string;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        cursor: 'pointer',
        fontSize: 13,
        color: sub,
        userSelect: 'none',
      }}
    >
      <span style={{ color: text, fontSize: 12.5, fontWeight: 450 }}>{label}</span>
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          background: checked ? accent : isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.12)',
          position: 'relative',
          transition: 'background .2s ease',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: checked ? '#fff' : dim,
            position: 'absolute',
            top: 2,
            left: checked ? 18 : 2,
            transition: 'left .2s ease, background .2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,.3)',
          }}
        />
      </div>
    </label>
  );
});

/* ── Skeleton row ────────────────────────────────────────────────── */

function SkeletonRow({ surface, card }: { surface: string; card: string }) {
  const shimmerStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(90deg, ${surface}, ${card}, ${surface})`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.8s linear infinite',
    borderRadius: 6,
  };
  return (
    <tr>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ width: 20, height: 16, ...shimmerStyle }} />
      </td>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 120, height: 68, borderRadius: 8, ...shimmerStyle, flexShrink: 0 }} />
          <div style={{ width: '60%', height: 14, ...shimmerStyle }} />
        </div>
      </td>
      <td style={{ padding: '12px 14px' }}><div style={{ width: 90, height: 14, ...shimmerStyle }} /></td>
      <td style={{ padding: '12px 14px' }}><div style={{ width: 80, height: 14, ...shimmerStyle }} /></td>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', ...shimmerStyle }} />
          <div style={{ width: 80, height: 14, ...shimmerStyle }} />
        </div>
      </td>
    </tr>
  );
}

/* ── Promo helpers ───────────────────────────────────────────────── */

function formatCountdown(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return 'Истёк';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}д ${hours % 24}ч`;
  }
  return `${hours}ч ${minutes}мин`;
}

function formatExpiry(expiresAt: number): string {
  return new Date(expiresAt).toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
}

/* ── Pro upgrade overlay (below row 10) ──────────────────────────── */

function UpgradeOverlay({
  isDark,
  accent,
  pink,
  surface,
  text,
  sub,
  bg,
  onPromoClick,
}: {
  isDark: boolean;
  accent: string;
  pink: string;
  surface: string;
  text: string;
  sub: string;
  bg: string;
  onPromoClick?: () => void;
}) {
  return (
    <tr>
      <td colSpan={5} style={{ padding: 0, position: 'relative', border: 'none' }}>
        {/* Gradient fade from content to overlay */}
        <div
          style={{
            position: 'relative',
            background: `linear-gradient(180deg, transparent 0%, ${isDark ? surface : bg} 30%)`,
            padding: '48px 24px 40px',
            textAlign: 'center',
          }}
        >
          {/* Lock icon */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: isDark
                ? 'rgba(255,255,255,.06)'
                : 'rgba(0,0,0,.04)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke={accent} strokeWidth="2" fill="none" />
              <path d="M7 11V7a5 5 0 0110 0v4" stroke={accent} strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: text,
              margin: '0 0 8px',
              letterSpacing: '-.02em',
            }}
          >
            Разблокируйте полный доступ
          </h3>

          <p
            style={{
              fontSize: 14,
              color: sub,
              margin: '0 0 24px',
              lineHeight: 1.6,
              maxWidth: 360,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Смотрите Топ-50 Shorts, все периоды и фильтры
          </p>

          {/* Upgrade button */}
          <a
            href="/billing"
            style={{
              display: 'inline-block',
              padding: '14px 36px',
              borderRadius: 12,
              background: `linear-gradient(135deg, ${accent}, ${pink})`,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: `0 4px 24px ${accent}40`,
              transition: 'transform .15s ease, box-shadow .15s ease',
              letterSpacing: '-.01em',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 28px ${accent}55`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${accent}40`;
            }}
          >
            Перейти на Pro — $9.99/мес
          </a>

          <p
            style={{
              fontSize: 12,
              color: sub,
              margin: '14px 0 0',
              opacity: 0.7,
            }}
          >
            или{' '}
            <a
              href="/settings"
              style={{ color: accent, textDecoration: 'none' }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.textDecoration = 'none'; }}
            >
              настройки
            </a>{' '}
            чтобы управлять подпиской
          </p>

          {onPromoClick && (
            <p
              style={{
                fontSize: 12,
                color: sub,
                margin: '10px 0 0',
                opacity: 0.7,
              }}
            >
              или{' '}
              <button
                type="button"
                onClick={onPromoClick}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: accent,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.textDecoration = 'none'; }}
              >
                введите промокод
              </button>
            </p>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ── Period upgrade tooltip ───────────────────────────────────────── */

function PeriodUpgradeTooltip({
  accent,
  pink,
  isDark,
}: {
  accent: string;
  pink: string;
  isDark: boolean;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        top: '100%',
        marginTop: 6,
        zIndex: 10,
        background: isDark ? '#1e1e24' : '#fff',
        border: `1px solid ${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}`,
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: isDark
          ? '0 8px 32px rgba(0,0,0,.5)'
          : '0 8px 32px rgba(0,0,0,.12)',
        whiteSpace: 'nowrap',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: isDark ? '#e8e8f0' : '#111' }}>
        Доступно в Pro
      </div>
      <a
        href="/billing"
        style={{
          display: 'inline-block',
          padding: '5px 14px',
          borderRadius: 6,
          background: `linear-gradient(135deg, ${accent}, ${pink})`,
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Обновить
      </a>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */

export const ShortsAnalytics = memo(function ShortsAnalytics() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);

  /* ── Subscription check ──────────────────────────── */
  const subscription = trpc.billing.getSubscription.useQuery();
  const plan = subscription.data?.plan ?? 'FREE';

  /* ── Promo code state ──────────────────────────── */
  const [promoInput, setPromoInput] = useState('');
  const [promoActive, setPromoActive] = useState(false);
  const [promoExpires, setPromoExpires] = useState<number | null>(null);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState('');
  const promoRef = useRef<HTMLDivElement>(null);
  const [, setPromoTick] = useState(0);

  // Check localStorage on mount for active promo
  useEffect(() => {
    const saved = localStorage.getItem('tf-promo');
    if (saved) {
      try {
        const { expiresAt, code: savedCode } = JSON.parse(saved);
        if (expiresAt > Date.now()) {
          setPromoActive(true);
          setPromoExpires(expiresAt);
          setPromoCode(savedCode ?? null);
        } else {
          localStorage.removeItem('tf-promo');
        }
      } catch { localStorage.removeItem('tf-promo'); }
    }
  }, []);

  // Update countdown every minute
  useEffect(() => {
    if (!promoExpires) return;
    const timer = setInterval(() => {
      if (Date.now() >= promoExpires) {
        setPromoActive(false);
        setPromoExpires(null);
        setPromoCode(null);
        localStorage.removeItem('tf-promo');
        clearInterval(timer);
      }
      // Force re-render for countdown
      setPromoTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, [promoExpires]);

  const isPro = plan === 'PRO' || plan === 'STUDIO' || promoActive;

  const handlePromoSubmit = useCallback(async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoSuccess('');
    try {
      const res = await fetch('/api/tools/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPromoError(json.error ?? 'Промокод не найден');
        return;
      }
      localStorage.setItem('tf-promo', JSON.stringify({ expiresAt: json.expiresAt, code: json.code }));
      setPromoActive(true);
      setPromoExpires(json.expiresAt);
      setPromoCode(json.code);
      setPromoSuccess(json.label);
      setPromoInput('');
      setShowPromoInput(false);
    } catch {
      setPromoError('Ошибка при проверке промокода');
    } finally {
      setPromoLoading(false);
    }
  }, [promoInput]);

  const handleOpenPromoFromOverlay = useCallback(() => {
    setShowPromoInput(true);
    setTimeout(() => {
      promoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const [period, setPeriod] = useState<Period>('7d');
  const [filters, setFilters] = useState<Filters>({
    country: '',
    category: '',
    showMusic: true,
    showKids: true,
    hideIndian: false,
    gameFilter: '',
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768,
  );

  const [data, setData] = useState<ShortItem[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Period upgrade tooltip
  const [periodTooltip, setPeriodTooltip] = useState<Period | null>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce ref for country/category changes
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch data from API
  const fetchData = useCallback(async (p: Period, country: string, category: string, pro: boolean, game?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period: p });
      if (country) params.set('country', country);
      if (category) params.set('category', category);
      if (game) params.set('game', game);
      if (!pro) params.set('limit', '10');

      const res = await fetch(`/api/tools/shorts-analytics?${params}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setIsMock(!!json.mock);
      setData(
        (json.shorts ?? []).map((s: ShortItem) => ({
          ...s,
          videoId: s.videoId ?? '',
          channelId: s.channelId ?? '',
          thumbnail: s.thumbnail ?? null,
        })),
      );
      if (json.error) {
        setError(json.error);
      }
    } catch (err) {
      console.error('[ShortsAnalytics] fetch error:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when period changes
  useEffect(() => {
    fetchData(period, filters.country, filters.category, isPro, filters.gameFilter);
  }, [period, isPro, fetchData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced fetch when country/category/game changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchData(period, filters.country, filters.category, isPro, filters.gameFilter);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters.country, filters.category, filters.gameFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePeriodChange = useCallback((p: Period) => {
    if (!isPro && p !== FREE_PERIOD) {
      // Show tooltip, auto-dismiss after 2.5s
      setPeriodTooltip(p);
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = setTimeout(() => setPeriodTooltip(null), 2500);
      return;
    }
    setPeriodTooltip(null);
    setPeriod(p);
  }, [isPro]);

  const handleClearFilters = useCallback(() => {
    setFilters({ country: '', category: '', showMusic: true, showKids: true, hideIndian: false, gameFilter: '' });
  }, []);

  const dateRange = useMemo(() => getPeriodRange(period), [period]);

  /* ── Styles ──────────────────────────────────────────── */

  const sidebarW = sidebarCollapsed ? 0 : 220;

  // Free users: show max 10 rows
  const FREE_ROW_LIMIT = 10;
  // Client-side filters: hide Indian content, game sub-filter
  const filteredData = useMemo(() => {
    let result = data;
    if (filters.hideIndian) {
      result = result.filter((item) => !INDIAN_PATTERN.test(item.title) && !INDIAN_PATTERN.test(item.channel));
    }
    if (filters.gameFilter) {
      const q = filters.gameFilter.toLowerCase();
      result = result.filter((item) => item.title.toLowerCase().includes(q) || item.channel.toLowerCase().includes(q));
    }
    // Re-rank after filtering
    return result.map((item, i) => ({ ...item, rank: i + 1 }));
  }, [data, filters.hideIndian, filters.gameFilter]);

  const visibleData = isPro ? filteredData : filteredData.slice(0, FREE_ROW_LIMIT);
  const showUpgradeOverlay = !isPro && data.length > 0;

  // Niche stats: total views + estimated earnings
  const SHORTS_RPM: Record<string, number> = {
    'minecraft': 0.07,
    'fortnite': 0.06,
    'roblox': 0.05,
    '': 0.04, // general Shorts RPM
  };

  const nicheStats = useMemo(() => {
    if (filteredData.length === 0) return null;
    const totalViews = filteredData.reduce((sum, item) => sum + (item.views || 0), 0);
    const rpm = SHORTS_RPM[filters.gameFilter] ?? 0.04;
    const estimatedEarnings = (totalViews / 1000) * rpm;
    return { totalViews, estimatedEarnings, rpm, count: filteredData.length };
  }, [filteredData, filters.gameFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, color: C.text, fontFamily: 'inherit' }}>
      {/* Shimmer animation keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ── Header ────────────────────────────────────────── */}
      <div
        style={{
          padding: '24px 28px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            {/* Shorts icon */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #ff0000, #ff4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L12 8L6 12V4Z" fill="#fff" />
              </svg>
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-.03em',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Shorts Аналитика
            </h1>

            {/* Mock data badge */}
            {isMock && !loading && (
              <div
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  background: isDark ? 'rgba(255,180,0,.15)' : 'rgba(255,180,0,.12)',
                  border: '1px solid rgba(255,180,0,.3)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: isDark ? '#ffb400' : '#b37a00',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Тестовые данные
              </div>
            )}

            {/* Free tier badge */}
            {!isPro && !subscription.isLoading && (
              <div
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)',
                  border: `1px solid ${C.border}`,
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.sub,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Бесплатный
              </div>
            )}
          </div>
          <p style={{ fontSize: 13, color: C.sub, margin: 0, lineHeight: 1.5 }}>
            Топ YouTube Shorts по просмотрам — находите тренды и вдохновение
          </p>
        </div>

        {/* Period badge */}
        <div
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)',
            border: `1px solid ${C.border}`,
            fontSize: 12,
            fontWeight: 500,
            color: C.sub,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {dateRange}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* ── Sidebar ──────────────────────────────────────── */}
        <div
          style={{
            width: sidebarW,
            flexShrink: 0,
            borderRight: sidebarCollapsed ? 'none' : `1px solid ${C.border}`,
            overflow: 'hidden',
            transition: 'width .25s ease',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {!sidebarCollapsed && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
              {/* Period selector */}
              <div style={{ padding: '0 12px', marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: C.dim,
                    textTransform: 'uppercase',
                    letterSpacing: '.08em',
                    marginBottom: 8,
                    padding: '0 4px',
                  }}
                >
                  Период
                </div>
                {PERIODS.map((p) => {
                  const isActive = period === p.key;
                  const isLocked = !isPro && p.key !== FREE_PERIOD;
                  return (
                    <div key={p.key} style={{ position: 'relative' }}>
                      <button
                        onClick={() => handlePeriodChange(p.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: 'none',
                          background: isActive
                            ? isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)'
                            : 'transparent',
                          color: isLocked
                            ? C.dim
                            : isActive ? C.text : C.sub,
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 400,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          borderLeft: isActive ? `3px solid ${C.accent}` : '3px solid transparent',
                          transition: 'all .15s ease',
                          marginBottom: 1,
                          opacity: isLocked ? 0.65 : 1,
                        }}
                      >
                        <span>{p.label}</span>
                        {isLocked && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                            <rect x="3" y="11" width="18" height="11" rx="2" stroke={C.dim} strokeWidth="2" fill="none" />
                            <path d="M7 11V7a5 5 0 0110 0v4" stroke={C.dim} strokeWidth="2" strokeLinecap="round" fill="none" />
                          </svg>
                        )}
                      </button>
                      {periodTooltip === p.key && (
                        <PeriodUpgradeTooltip accent={C.accent} pink={C.pink} isDark={isDark} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Filters panel */}
              <div style={{ padding: '0 12px' }}>
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 4px',
                    border: 'none',
                    borderTop: `1px solid ${C.border}`,
                    background: 'transparent',
                    color: C.text,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    letterSpacing: '.02em',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Фильтры
                    {!isPro && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.6 }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" stroke={C.dim} strokeWidth="2" fill="none" />
                        <path d="M7 11V7a5 5 0 0110 0v4" stroke={C.dim} strokeWidth="2" strokeLinecap="round" fill="none" />
                      </svg>
                    )}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    style={{
                      transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform .2s ease',
                    }}
                  >
                    <path d="M3 4.5L6 7.5L9 4.5" stroke={C.dim} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div
                  style={{
                    maxHeight: filtersOpen ? 500 : 0,
                    overflow: 'hidden',
                    transition: 'max-height .3s ease',
                  }}
                >
                  <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Free tier filter lock message */}
                    {!isPro && (
                      <div
                        style={{
                          fontSize: 11,
                          color: C.dim,
                          padding: '6px 8px',
                          borderRadius: 6,
                          background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)',
                          lineHeight: 1.4,
                        }}
                      >
                        Фильтры доступны в{' '}
                        <a
                          href="/billing"
                          style={{ color: C.accent, textDecoration: 'none', fontWeight: 600 }}
                        >
                          Pro
                        </a>
                      </div>
                    )}

                    {/* Country */}
                    <div style={!isPro ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
                      <label style={{ fontSize: 11, fontWeight: 500, color: C.dim, marginBottom: 4, display: 'block' }}>
                        Страна
                      </label>
                      <select
                        value={filters.country}
                        onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: 8,
                          border: `1px solid ${C.border}`,
                          background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)',
                          color: C.text,
                          fontSize: 12.5,
                          fontFamily: 'inherit',
                          outline: 'none',
                          cursor: isPro ? 'pointer' : 'not-allowed',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                        }}
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Category */}
                    <div style={!isPro ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
                      <label style={{ fontSize: 11, fontWeight: 500, color: C.dim, marginBottom: 4, display: 'block' }}>
                        Категория
                      </label>
                      <select
                        value={filters.category}
                        onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: 8,
                          border: `1px solid ${C.border}`,
                          background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)',
                          color: C.text,
                          fontSize: 12.5,
                          fontFamily: 'inherit',
                          outline: 'none',
                          cursor: isPro ? 'pointer' : 'not-allowed',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                        }}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Toggles */}
                    <ToggleSwitch
                      checked={filters.showMusic}
                      onChange={(v) => setFilters((f) => ({ ...f, showMusic: v }))}
                      label="Показать музыкальные каналы"
                      isDark={isDark}
                      accent={C.accent}
                      dim={C.dim}
                      sub={C.sub}
                      text={C.text}
                    />
                    <ToggleSwitch
                      checked={filters.showKids}
                      onChange={(v) => setFilters((f) => ({ ...f, showKids: v }))}
                      label="Показать детский контент"
                      isDark={isDark}
                      accent={C.accent}
                      dim={C.dim}
                      sub={C.sub}
                      text={C.text}
                    />
                    <ToggleSwitch
                      checked={filters.hideIndian}
                      onChange={(v) => setFilters((f) => ({ ...f, hideIndian: v }))}
                      label="Скрыть индийский контент"
                      isDark={isDark}
                      accent={C.accent}
                      dim={C.dim}
                      sub={C.sub}
                      text={C.text}
                    />

                    {/* Game sub-filter (shown when category = Gaming) */}
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 6 }}>
                        Игры
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {GAME_FILTERS.map((g) => (
                          <button
                            key={g.key}
                            onClick={() => setFilters((f) => ({ ...f, gameFilter: f.gameFilter === g.key ? '' : g.key }))}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 8,
                              border: `1px solid ${filters.gameFilter === g.key ? C.accent : C.border}`,
                              background: filters.gameFilter === g.key ? `${C.accent}15` : 'transparent',
                              color: filters.gameFilter === g.key ? C.accent : C.sub,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              transition: 'all .15s',
                            }}
                          >
                            {g.label}
                          </button>
                        ))}
                        <span style={{ fontSize: 10, color: C.dim, alignSelf: 'center', fontStyle: 'italic' }}>
                          скоро больше
                        </span>
                      </div>
                    </div>

                    {/* Clear */}
                    <button
                      onClick={handleClearFilters}
                      style={{
                        padding: '7px 0',
                        border: 'none',
                        background: 'transparent',
                        color: C.accent,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                      }}
                    >
                      Очистить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar toggle button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Показать фильтры' : 'Скрыть фильтры'}
          style={{
            position: 'absolute',
            left: sidebarW - 1,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 20,
            height: 40,
            borderRadius: '0 6px 6px 0',
            border: `1px solid ${C.border}`,
            borderLeft: 'none',
            background: C.surface,
            color: C.dim,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            transition: 'left .25s ease',
            padding: 0,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d={sidebarCollapsed ? 'M3 1L7 5L3 9' : 'M7 1L3 5L7 9'}
              stroke={C.dim}
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* ── Main table area ──────────────────────────────── */}
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          {/* Error banner */}
          {error && !loading && (
            <div
              style={{
                margin: '12px 14px 0',
                padding: '8px 14px',
                borderRadius: 8,
                background: isDark ? 'rgba(255,60,60,.1)' : 'rgba(255,60,60,.07)',
                border: '1px solid rgba(255,60,60,.2)',
                fontSize: 12,
                color: isDark ? '#ff8080' : '#cc3333',
              }}
            >
              {error}
            </div>
          )}

          {/* ── Promo active banner ──────────────────────── */}
          {promoActive && promoExpires && (
            <div
              style={{
                margin: '12px 14px 0',
                padding: '14px 18px',
                borderRadius: 12,
                background: isDark ? 'rgba(34,197,94,.08)' : 'rgba(34,197,94,.06)',
                border: `1px solid ${isDark ? 'rgba(34,197,94,.25)' : 'rgba(34,197,94,.2)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: isDark ? '#4ade80' : '#16a34a' }}>
                {'\u2728'} Промокод{promoCode ? ` ${promoCode}` : ''} активен
              </div>
              <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.5 }}>
                Полный доступ до {formatExpiry(promoExpires)}
              </div>
              <div style={{ fontSize: 12, color: isDark ? '#4ade80' : '#16a34a', fontWeight: 500 }}>
                Осталось: {formatCountdown(promoExpires)}
              </div>
            </div>
          )}

          {/* ── Promo code input banner ──────────────────── */}
          {!isPro && !promoActive && (
            <div
              ref={promoRef}
              style={{
                margin: '12px 14px 0',
                padding: '12px 18px',
                borderRadius: 12,
                background: C.surface,
                border: `1px solid ${C.border}`,
              }}
            >
              {!showPromoInput ? (
                <button
                  type="button"
                  onClick={() => setShowPromoInput(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: C.sub,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.text; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.sub; }}
                >
                  <span>{'\uD83C\uDF81'}</span>
                  <span>Есть промокод?</span>
                  <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 'auto' }}>нажмите чтобы ввести</span>
                </button>
              ) : (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{'\uD83C\uDF81'}</span> Введите промокод
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value); setPromoError(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handlePromoSubmit(); }}
                      placeholder="Например, SHORTS2026"
                      style={{
                        flex: 1,
                        padding: '9px 14px',
                        borderRadius: 8,
                        border: `1px solid ${promoError ? (isDark ? 'rgba(255,60,60,.4)' : 'rgba(255,60,60,.3)') : C.border}`,
                        background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)',
                        color: C.text,
                        fontSize: 13,
                        fontFamily: 'inherit',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handlePromoSubmit}
                      disabled={promoLoading || !promoInput.trim()}
                      style={{
                        padding: '9px 18px',
                        borderRadius: 8,
                        border: 'none',
                        background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: promoLoading || !promoInput.trim() ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                        opacity: promoLoading || !promoInput.trim() ? 0.6 : 1,
                        whiteSpace: 'nowrap',
                        transition: 'opacity .15s ease',
                      }}
                    >
                      {promoLoading ? '...' : 'Активировать'}
                    </button>
                  </div>
                  {promoError && (
                    <div style={{ fontSize: 12, color: isDark ? '#ff8080' : '#dc2626', marginTop: 8 }}>
                      {'\u26A0\uFE0F'} {promoError}
                    </div>
                  )}
                  {promoSuccess && (
                    <div style={{ fontSize: 12, color: isDark ? '#4ade80' : '#16a34a', marginTop: 8 }}>
                      {'\u2705'} {promoSuccess}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Niche Stats Banner ─────────────────────── */}
          {nicheStats && !loading && (
            <div style={{
              display: 'flex',
              gap: 12,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}>
              {/* Total Views */}
              <div style={{
                flex: 1,
                minWidth: 160,
                padding: '14px 18px',
                background: C.surface,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Просмотров в топе
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>
                  {nicheStats.totalViews >= 1_000_000_000
                    ? `${(nicheStats.totalViews / 1_000_000_000).toFixed(1)}B`
                    : nicheStats.totalViews >= 1_000_000
                      ? `${(nicheStats.totalViews / 1_000_000).toFixed(1)}M`
                      : nicheStats.totalViews.toLocaleString('ru-RU')}
                </div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
                  {nicheStats.count} видео в выборке
                </div>
              </div>

              {/* Estimated Earnings */}
              <div style={{
                flex: 1,
                minWidth: 160,
                padding: '14px 18px',
                background: C.surface,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Примерный заработок
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.blue }}>
                  ${nicheStats.estimatedEarnings >= 1000
                    ? `${(nicheStats.estimatedEarnings / 1000).toFixed(1)}K`
                    : Math.round(nicheStats.estimatedEarnings).toLocaleString('ru-RU')}
                </div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
                  RPM: ${nicheStats.rpm.toFixed(2)} (Shorts)
                </div>
              </div>

              {/* RPM Info */}
              <div style={{
                flex: 1,
                minWidth: 160,
                padding: '14px 18px',
                background: C.surface,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {filters.gameFilter ? filters.gameFilter.charAt(0).toUpperCase() + filters.gameFilter.slice(1) : 'Shorts'} RPM
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.accent }}>
                  ${nicheStats.rpm.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 2, lineHeight: 1.4 }}>
                  Shorts платят в 10-20x меньше чем горизонталка
                </div>
              </div>
            </div>
          )}

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: 700,
              fontFamily: 'inherit',
            }}
          >
            <thead>
              <tr
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  background: C.surface,
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {['#', 'Видео', 'Просмотры', '\u2248 Заработок', 'Загружено', 'Канал'].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 14px',
                      textAlign: i === 0 ? 'center' : 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.dim,
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      whiteSpace: 'nowrap',
                      borderBottom: `1px solid ${C.border}`,
                      background: C.surface,
                    }}
                  >
                    {h}
                    {h.includes('Заработок') && (
                      <span title="Приблизительная оценка на основе среднего RPM для Shorts. Реальный доход может отличаться." style={{ cursor: 'help', marginLeft: 4, opacity: 0.5 }}>ⓘ</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonRow key={i} surface={C.surface} card={C.card} />
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 14px', textAlign: 'center', color: C.sub, fontSize: 14 }}>
                    Нет данных для отображения
                  </td>
                </tr>
              ) : (
                <>
                  {visibleData.map((item, idx) => {
                    const isHovered = hoveredRow === item.rank;
                    const isEven = idx % 2 === 0;
                    return (
                      <tr
                        key={`${item.videoId}-${item.rank}`}
                        onMouseEnter={() => setHoveredRow(item.rank)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          background: isHovered
                            ? isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)'
                            : isEven
                              ? 'transparent'
                              : isDark ? 'rgba(255,255,255,.015)' : 'rgba(0,0,0,.015)',
                          transition: 'background .15s ease',
                        }}
                      >
                        {/* Rank */}
                        <td
                          style={{
                            padding: '12px 14px',
                            textAlign: 'center',
                            fontSize: 14,
                            fontWeight: 700,
                            color: item.rank <= 3 ? C.accent : C.sub,
                            width: 50,
                          }}
                        >
                          {item.rank}
                        </td>

                        {/* Video */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            {/* Thumbnail */}
                            {item.thumbnail ? (
                              isPro ? (
                                <a
                                  href={`https://youtube.com/shorts/${item.videoId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    width: 120,
                                    height: 68,
                                    borderRadius: 8,
                                    flexShrink: 0,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'block',
                                  }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    loading="lazy"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      borderRadius: 8,
                                      display: 'block',
                                    }}
                                  />
                                  {/* Shorts badge */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      bottom: 4,
                                      right: 4,
                                      padding: '2px 5px',
                                      borderRadius: 4,
                                      background: 'rgba(255,0,0,.85)',
                                      color: '#fff',
                                      fontSize: 8,
                                      fontWeight: 700,
                                      letterSpacing: '.03em',
                                    }}
                                  >
                                    SHORTS
                                  </div>
                                </a>
                              ) : (
                                <div
                                  style={{
                                    width: 120,
                                    height: 68,
                                    borderRadius: 8,
                                    flexShrink: 0,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'block',
                                  }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    loading="lazy"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      borderRadius: 8,
                                      display: 'block',
                                    }}
                                  />
                                  {/* Shorts badge */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      bottom: 4,
                                      right: 4,
                                      padding: '2px 5px',
                                      borderRadius: 4,
                                      background: 'rgba(255,0,0,.85)',
                                      color: '#fff',
                                      fontSize: 8,
                                      fontWeight: 700,
                                      letterSpacing: '.03em',
                                    }}
                                  >
                                    SHORTS
                                  </div>
                                </div>
                              )
                            ) : (
                              <div
                                style={{
                                  width: 120,
                                  height: 68,
                                  borderRadius: 8,
                                  background: `linear-gradient(135deg, ${C.card}, ${C.cardHover})`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  position: 'relative',
                                  overflow: 'hidden',
                                }}
                              >
                                {/* Play icon */}
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
                                  <path d="M8 5V19L19 12L8 5Z" fill={C.sub} />
                                </svg>
                                {/* Shorts badge */}
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: 4,
                                    right: 4,
                                    padding: '2px 5px',
                                    borderRadius: 4,
                                    background: 'rgba(255,0,0,.85)',
                                    color: '#fff',
                                    fontSize: 8,
                                    fontWeight: 700,
                                    letterSpacing: '.03em',
                                  }}
                                >
                                  SHORTS
                                </div>
                              </div>
                            )}

                            {/* Title - clickable only for Pro */}
                            {isPro ? (
                              <a
                                href={`https://youtube.com/shorts/${item.videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: 500,
                                  color: C.text,
                                  lineHeight: 1.4,
                                  maxWidth: 280,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  textDecoration: 'none',
                                }}
                                onMouseEnter={(e) => { (e.target as HTMLElement).style.textDecoration = 'underline'; }}
                                onMouseLeave={(e) => { (e.target as HTMLElement).style.textDecoration = 'none'; }}
                              >
                                {item.title}
                              </a>
                            ) : (
                              <span
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: 500,
                                  color: C.text,
                                  lineHeight: 1.4,
                                  maxWidth: 280,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {item.title}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Views */}
                        <td
                          style={{
                            padding: '12px 14px',
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: C.green,
                            whiteSpace: 'nowrap',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {formatViews(item.views)}
                        </td>

                        {/* Estimated Earnings */}
                        <td
                          style={{
                            padding: '12px 14px',
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: C.blue,
                            whiteSpace: 'nowrap',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {(() => {
                            const rpm = SHORTS_RPM[filters.gameFilter] ?? 0.04;
                            const earned = (item.views / 1000) * rpm;
                            if (earned >= 1000) return `~$${(earned / 1000).toFixed(1)}K`;
                            if (earned >= 1) return `~$${Math.round(earned)}`;
                            return `~$${earned.toFixed(2)}`;
                          })()}
                        </td>

                        {/* Uploaded */}
                        <td
                          style={{
                            padding: '12px 14px',
                            fontSize: 12.5,
                            color: C.sub,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.uploaded}
                        </td>

                        {/* Channel */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {/* Avatar placeholder */}
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#fff',
                                flexShrink: 0,
                              }}
                            >
                              {item.channel[0]}
                            </div>
                            {/* Channel name - clickable only for Pro */}
                            {isPro && item.channelId ? (
                              <a
                                href={`https://youtube.com/channel/${item.channelId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: 12.5,
                                  fontWeight: 500,
                                  color: C.text,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: 140,
                                  textDecoration: 'none',
                                }}
                                onMouseEnter={(e) => { (e.target as HTMLElement).style.textDecoration = 'underline'; }}
                                onMouseLeave={(e) => { (e.target as HTMLElement).style.textDecoration = 'none'; }}
                              >
                                {item.channel}
                              </a>
                            ) : (
                              <span
                                style={{
                                  fontSize: 12.5,
                                  fontWeight: 500,
                                  color: C.text,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: 140,
                                }}
                              >
                                {item.channel}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Upgrade overlay for free users */}
                  {showUpgradeOverlay && (
                    <UpgradeOverlay
                      isDark={isDark}
                      accent={C.accent}
                      pink={C.pink}
                      surface={C.surface}
                      text={C.text}
                      sub={C.sub}
                      bg={C.bg}
                      onPromoClick={handleOpenPromoFromOverlay}
                    />
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
