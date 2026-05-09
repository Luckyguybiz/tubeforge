"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { trpc } from "@/lib/trpc";
import { toast } from "@/stores/useNotificationStore";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
  Search,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Target,
  Flame,
  Sparkles,
  Crown,
  ArrowUp,
  ArrowDown,
  Loader2,
  ChartBar,
  Globe,
} from "lucide-react";

/* ── Translate-with-fallback ───────────────────────────── */
function tx(t: (k: string) => string, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

/* ── Types ─────────────────────────────────────────────── */
type TabId = "overview" | "opportunities" | "rising";
type TrendPeriod = "today" | "week" | "month";

interface MainKeyword {
  keyword: string;
  searchVolume: number;
  competition: "low" | "medium" | "high";
  cpc: number;
  trend: "rising" | "stable" | "declining";
}
interface RelatedKeyword {
  keyword: string;
  searchVolume: number;
  competition: "low" | "medium" | "high";
  relevance: number;
}
interface LongTailKeyword {
  keyword: string;
  searchVolume: number;
  competition: "low" | "medium" | "high";
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
  opportunity: "high" | "medium";
}
interface SearchData {
  mainKeyword: MainKeyword;
  relatedKeywords: RelatedKeyword[];
  longTailKeywords: LongTailKeyword[];
  risingKeywords: RisingKeyword[];
  topOpportunities: OpportunityKeyword[];
}

/* ── Utils ─────────────────────────────────────────────── */
function fmtVol(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function compStyles(c: string): { dot: string; text: string; bg: string } {
  if (c === "low")
    return {
      dot: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    };
  if (c === "medium")
    return {
      dot: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    };
  return {
    dot: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
  };
}

/* ── Example queries (anti-силиконность) ───────────────── */
const EXAMPLE_QUERIES = [
  "minecraft tutorial",
  "react hooks 2026",
  "lo-fi hip hop",
  "tesla model 3 review",
  "cooking pasta recipes",
  "ai art prompts",
  "iphone 17 unboxing",
  "trip to japan",
];

/* ── Difficulty meter (visual competition bar) ─────────── */
function DifficultyMeter({ level }: { level: "low" | "medium" | "high" }) {
  const filled = level === "low" ? 1 : level === "medium" ? 2 : 3;
  const colors = ["bg-emerald-500", "bg-amber-500", "bg-rose-500"];
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "h-3 w-1 rounded-sm",
            i < filled ? colors[filled - 1] : "bg-muted",
          )}
        />
      ))}
    </span>
  );
}

/* ── Trend pill ────────────────────────────────────────── */
function TrendPill({ trend }: { trend: "rising" | "stable" | "declining" }) {
  if (trend === "rising")
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="size-3" />
        Rising
      </span>
    );
  if (trend === "declining")
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
        <TrendingDown className="size-3" />
        Declining
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
      Stable
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
export function KeywordsPage() {
  const t = useLocaleStore((s) => s.t);
  const { plan } = usePlanLimits();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [query, setQuery] = useState("");
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("month");
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Cycle placeholder examples */
  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % EXAMPLE_QUERIES.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const searchMut = trpc.keywords.search.useMutation({
    onSuccess: (data) => setSearchData(data as SearchData),
    onError: (err) => toast.error(err.message),
  });

  const trendingQuery = trpc.keywords.getTrending.useQuery(
    { period: trendPeriod },
    { refetchOnWindowFocus: false },
  );

  const handleSearch = useCallback(
    (q?: string) => {
      const trimmed = (q ?? query).trim();
      if (!trimmed) return;
      setQuery(trimmed);
      searchMut.mutate({ query: trimmed });
    },
    [query, searchMut],
  );

  const isLoading = searchMut.isPending;
  const trendingKws = trendingQuery.data?.keywords ?? [];
  const isFree = plan === "FREE";

  const tabs: { id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = useMemo(
    () => [
      { id: "overview", label: tx(t, "keywords.tab.overview", "Overview"), Icon: ChartBar },
      { id: "opportunities", label: tx(t, "keywords.tab.opportunities", "Opportunities"), Icon: Target },
      { id: "rising", label: tx(t, "keywords.tab.rising", "Rising"), Icon: Flame },
    ],
    [t],
  );

  const periodOptions: { id: TrendPeriod; label: string }[] = useMemo(
    () => [
      { id: "today", label: tx(t, "keywords.period.today", "Today") },
      { id: "week", label: tx(t, "keywords.period.week", "Week") },
      { id: "month", label: tx(t, "keywords.period.month", "Month") },
    ],
    [t],
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* ── Hero header ─────────────────────────────────── */}
      <header className="pt-6 pb-4 sm:pt-8">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-md shadow-brand-500/20">
            <Search className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {tx(t, "keywords.title", "Keyword Research")}
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground sm:text-sm">
              {tx(
                t,
                "keywords.subtitle",
                "Discover what creators in your niche are ranking for — volume, competition, trends.",
              )}
            </p>
          </div>
        </div>
      </header>

      {/* ── Search bar ─────────────────────────────────── */}
      <section className="mb-5">
        <div className="relative flex flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={tx(
                t,
                "keywords.searchPlaceholder",
                `Try "${EXAMPLE_QUERIES[placeholderIdx]}"…`,
              )}
              className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-[14px] text-foreground shadow-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-brand-500/40 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)] sm:h-14 sm:text-[15px]"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={isLoading || !query.trim()}
            className={cn(
              "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-6 text-[14px] font-bold text-white shadow-md shadow-brand-500/20 transition-all sm:h-14 sm:px-8 sm:text-[15px]",
              isLoading || !query.trim()
                ? "cursor-not-allowed opacity-60"
                : "hover:scale-[1.02]",
            )}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            {tx(t, "keywords.searchBtn", "Analyze")}
          </button>
        </div>

        {/* Example chips when empty */}
        {!searchData && !isLoading && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
            <span className="text-muted-foreground">
              {tx(t, "keywords.examples", "Try:")}
            </span>
            {EXAMPLE_QUERIES.slice(0, 4).map((q) => (
              <button
                key={q}
                onClick={() => handleSearch(q)}
                className="rounded-full border border-border bg-card px-2.5 py-0.5 text-muted-foreground transition-colors hover:border-brand-500/40 hover:bg-muted hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Tabs ───────────────────────────────────────── */}
      <section className="mb-5">
        <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all sm:px-4 sm:py-2",
                  active
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <tab.Icon className="size-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Main 2-pane content ────────────────────────── */}
      <div className="grid gap-5 pb-12 lg:grid-cols-[1fr_380px]">
        {/* ── Left: tab content ──────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {activeTab === "overview" && (
            <OverviewTab data={searchData} isLoading={isLoading} t={t} onSearchExample={handleSearch} />
          )}
          {activeTab === "opportunities" && (
            <OpportunitiesTab data={searchData} isLoading={isLoading} t={t} />
          )}
          {activeTab === "rising" && (
            <RisingTab data={searchData} isLoading={isLoading} t={t} />
          )}
        </div>

        {/* ── Right: trending sidebar ─────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
                <Flame className="size-4 text-orange-500" />
                {tx(t, "keywords.trending.title", "Trending now")}
              </h3>
              <Globe className="size-3.5 text-muted-foreground" />
            </div>

            {/* Period toggle */}
            <div className="mx-5 mt-3 flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
              {periodOptions.map((p) => {
                const active = trendPeriod === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setTrendPeriod(p.id)}
                    className={cn(
                      "flex-1 rounded-md px-2 py-1 text-[12px] font-semibold transition-colors",
                      active
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="px-2 pt-3 pb-2">
              {trendingQuery.isLoading ? (
                <div className="space-y-2 px-3 py-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} width="100%" height={28} rounded />
                  ))}
                </div>
              ) : trendingKws.length === 0 ? (
                <p className="px-5 py-8 text-center text-[13px] text-muted-foreground">
                  {tx(t, "keywords.trending.empty", "No trending data yet")}
                </p>
              ) : (
                <ol className="text-[13px]">
                  {(isFree ? trendingKws.slice(0, 5) : trendingKws).map((kw, i) => (
                    <li
                      key={kw.keyword}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
                    >
                      <span className="w-5 shrink-0 font-mono text-[11px] font-bold text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <button
                        onClick={() => handleSearch(kw.keyword)}
                        className="flex-1 truncate text-left font-medium text-foreground hover:text-brand-500"
                        title={kw.keyword}
                      >
                        {kw.keyword}
                      </button>
                      <span className="shrink-0 font-mono text-[12px] text-muted-foreground">
                        {fmtVol(kw.searchVolume)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-0.5 font-mono text-[11px] font-bold",
                          kw.volumeChange >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {kw.volumeChange >= 0 ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )}
                        {Math.abs(kw.volumeChange)}%
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* PRO upsell */}
            {isFree && trendingKws.length > 5 && (
              <div className="m-4 mt-2 rounded-xl border border-brand-500/20 bg-gradient-to-br from-brand-500/5 to-violet-500/5 p-4">
                <div className="flex items-start gap-2.5">
                  <Crown className="size-4 shrink-0 text-amber-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-foreground">
                      {tx(t, "keywords.trending.unlockTitle", "Unlock 50+ trends")}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      {tx(
                        t,
                        "keywords.trending.unlockDesc",
                        "Get full trending list, country filters & exports.",
                      )}
                    </p>
                  </div>
                </div>
                <Link
                  href="/billing"
                  prefetch
                  className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-violet-500 px-3 text-[12px] font-bold text-white shadow-sm transition-transform hover:scale-[1.02]"
                >
                  <Sparkles className="size-3" />
                  {tx(t, "keywords.trending.upgradePro", "Upgrade to Pro")}
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ── Overview Tab ──────────────────────────────────────── */
function OverviewTab({
  data,
  isLoading,
  t,
  onSearchExample,
}: {
  data: SearchData | null;
  isLoading: boolean;
  t: (k: string) => string;
  onSearchExample: (q: string) => void;
}) {
  if (isLoading) return <LoadingSkeleton />;
  if (!data) return <EmptyState t={t} onSearchExample={onSearchExample} />;

  const mk = data.mainKeyword;
  const cs = compStyles(mk.competition);

  return (
    <div>
      {/* Main keyword card with stats */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {tx(t, "keywords.overview.mainKeyword", "Main keyword")}
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {mk.keyword}
            </h2>
          </div>
          <TrendPill trend={mk.trend} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <StatBlock
            icon={<ChartBar className="size-4" />}
            label={tx(t, "keywords.stat.volume", "Search volume")}
            value={fmtVol(mk.searchVolume)}
            iconBg="bg-brand-500/10 text-brand-500"
          />
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              <span className={cn("flex size-7 items-center justify-center rounded-lg", cs.bg)}>
                <Target className={cn("size-4", cs.text)} />
              </span>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {tx(t, "keywords.stat.competition", "Competition")}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <DifficultyMeter level={mk.competition} />
              <span className={cn("font-mono text-[18px] font-bold capitalize", cs.text)}>
                {mk.competition}
              </span>
            </div>
          </div>
          <StatBlock
            icon={<Sparkles className="size-4" />}
            label={tx(t, "keywords.stat.cpc", "Avg CPC")}
            value={`$${mk.cpc.toFixed(2)}`}
            iconBg="bg-amber-500/10 text-amber-500"
          />
        </div>
      </div>

      {/* Related keywords */}
      <div className="mt-6">
        <h3 className="mb-3 flex items-baseline gap-2 text-[15px] font-bold text-foreground">
          {tx(t, "keywords.overview.related", "Related keywords")}
          <span className="font-mono text-[12px] font-normal text-muted-foreground">
            {data.relatedKeywords.length}
          </span>
        </h3>
        <KeywordTable
          rows={data.relatedKeywords}
          showRelevance
          t={t}
        />
      </div>

      {/* Long-tail keywords */}
      {data.longTailKeywords.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 flex items-baseline gap-2 text-[15px] font-bold text-foreground">
            {tx(t, "keywords.overview.longTail", "Long-tail keywords")}
            <span className="font-mono text-[12px] font-normal text-muted-foreground">
              {data.longTailKeywords.length}
            </span>
          </h3>
          <KeywordTable rows={data.longTailKeywords} t={t} />
        </div>
      )}
    </div>
  );
}

/* ── Opportunities Tab ────────────────────────────────── */
function OpportunitiesTab({
  data,
  isLoading,
  t,
}: {
  data: SearchData | null;
  isLoading: boolean;
  t: (k: string) => string;
}) {
  if (isLoading) return <LoadingSkeleton />;
  if (!data) return <EmptyState t={t} />;

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          {tx(t, "keywords.opportunities.title", "Best opportunities")}
        </h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {tx(
            t,
            "keywords.opportunities.desc",
            "High-volume keywords with low competition — your fastest path to ranking.",
          )}
        </p>
      </div>

      {data.topOpportunities.length === 0 ? (
        <p className="py-12 text-center text-[13px] text-muted-foreground">
          {tx(t, "keywords.opportunities.empty", "No opportunities for this keyword.")}
        </p>
      ) : (
        <div className="space-y-2">
          {data.topOpportunities.map((opp) => {
            const cs = compStyles(opp.competition);
            return (
              <div
                key={opp.keyword}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-brand-500/30 hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-foreground">
                    {opp.keyword}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ChartBar className="size-3" />
                    <span className="font-mono">{fmtVol(opp.searchVolume)}</span>
                    <span>{tx(t, "keywords.col.searches", "searches")}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", cs.bg, cs.text)}>
                    <DifficultyMeter level={opp.competition as "low" | "medium" | "high"} />
                    {opp.competition}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      opp.opportunity === "high"
                        ? "bg-emerald-500 text-white"
                        : "bg-amber-500 text-white",
                    )}
                  >
                    <Sparkles className="size-3" />
                    {opp.opportunity === "high"
                      ? tx(t, "keywords.opportunity.high", "High")
                      : tx(t, "keywords.opportunity.medium", "Medium")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Rising Tab ────────────────────────────────────────── */
function RisingTab({
  data,
  isLoading,
  t,
}: {
  data: SearchData | null;
  isLoading: boolean;
  t: (k: string) => string;
}) {
  if (isLoading) return <LoadingSkeleton />;
  if (!data) return <EmptyState t={t} />;

  return (
    <div>
      <div className="mb-5">
        <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
          <Flame className="size-5 text-orange-500" />
          {tx(t, "keywords.rising.title", "Rising keywords")}
        </h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {tx(
            t,
            "keywords.rising.desc",
            "Search volume trending up — get in early before competition catches on.",
          )}
        </p>
      </div>

      {data.risingKeywords.length === 0 ? (
        <p className="py-12 text-center text-[13px] text-muted-foreground">
          {tx(t, "keywords.rising.empty", "No rising keywords for this query.")}
        </p>
      ) : (
        <div className="space-y-1.5">
          {data.risingKeywords.map((rk) => (
            <div
              key={rk.keyword}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5"
            >
              <Flame className="size-3.5 shrink-0 text-orange-500" />
              <div className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground">
                {rk.keyword}
              </div>
              <span className="font-mono text-[12px] text-muted-foreground">
                {fmtVol(rk.searchVolume)}
              </span>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-0.5 rounded-md px-2 py-0.5 font-mono text-[11px] font-bold",
                  rk.volumeChange >= 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                )}
              >
                {rk.volumeChange >= 0 ? (
                  <ArrowUp className="size-3" />
                ) : (
                  <ArrowDown className="size-3" />
                )}
                {Math.abs(rk.volumeChange)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── StatBlock ─────────────────────────────────────────── */
function StatBlock({
  icon,
  label,
  value,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <span className={cn("flex size-7 items-center justify-center rounded-lg", iconBg)}>
          {icon}
        </span>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="mt-2 font-mono text-[18px] font-bold tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}

/* ── KeywordTable ──────────────────────────────────────── */
function KeywordTable({
  rows,
  showRelevance,
  t,
}: {
  rows: (RelatedKeyword | LongTailKeyword)[];
  showRelevance?: boolean;
  t: (k: string) => string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2 text-left">{tx(t, "keywords.col.keyword", "Keyword")}</th>
            <th className="px-3 py-2 text-right">{tx(t, "keywords.col.volume", "Volume")}</th>
            <th className="px-3 py-2 text-center">{tx(t, "keywords.col.competition", "Difficulty")}</th>
            {showRelevance && (
              <th className="px-3 py-2 text-right">{tx(t, "keywords.col.relevance", "Relevance")}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const cs = compStyles(row.competition);
            return (
              <tr
                key={row.keyword}
                className="border-b border-border last:border-0 hover:bg-muted/40"
              >
                <td className="truncate px-4 py-2.5 font-medium text-foreground">
                  {row.keyword}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                  {fmtVol(row.searchVolume)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-center gap-1.5">
                    <DifficultyMeter level={row.competition} />
                    <span className={cn("text-[11px] font-bold uppercase", cs.text)}>
                      {row.competition}
                    </span>
                  </div>
                </td>
                {showRelevance && "relevance" in row && (
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
                          style={{ width: `${row.relevance}%` }}
                        />
                      </div>
                      <span className="w-9 text-right font-mono text-[11px] text-muted-foreground">
                        {row.relevance}%
                      </span>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Empty state ───────────────────────────────────────── */
function EmptyState({
  t,
  onSearchExample,
}: {
  t: (k: string) => string;
  onSearchExample?: (q: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center sm:py-16">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-violet-500/15">
        <Search className="size-7 text-brand-500" />
      </div>
      <h3 className="mt-4 text-base font-bold text-foreground sm:text-lg">
        {tx(t, "keywords.empty.title", "Search for any keyword")}
      </h3>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
        {tx(
          t,
          "keywords.empty.desc",
          "Get search volume, competition, related keywords and trend data for any topic.",
        )}
      </p>
      {onSearchExample && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {EXAMPLE_QUERIES.slice(0, 3).map((q) => (
            <button
              key={q}
              onClick={() => onSearchExample(q)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:border-brand-500/40 hover:text-foreground"
            >
              <Search className="size-3" />
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Loading skeleton ──────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <Skeleton width="40%" height={20} />
        <div className="mt-2"><Skeleton width="60%" height={32} /></div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={68} rounded />
          ))}
        </div>
      </div>
      <Skeleton width="30%" height={18} />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} width="100%" height={36} rounded />
      ))}
    </div>
  );
}
