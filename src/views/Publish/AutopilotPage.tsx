"use client";

/**
 * /publish/autopilot — Publishing autopilot dashboard.
 *
 * Conceptual cousin of luckyteam.space's /autopost brain panel — adapted
 * for TubeForge's single-channel publish-to-YouTube focus.
 *
 * Surfaces:
 *   - Autopilot status header with on/off toggle (stored locally —
 *     Phase 1 doesn't wire actual automation yet, this is the
 *     "ground truth" UI for when the worker grows scheduling rules).
 *   - Health score gauge based on real signals:
 *       • % jobs completed without retry (success rate)
 *       • % of last-14-days that have scheduled content (coverage)
 *       • failed-to-total ratio (reliability)
 *   - Time-slot heatmap: 24×7 grid of when this user's jobs run.
 *     Hotter cells = more posts at that hour/day, hints at the
 *     author's natural cadence.
 *   - Recommendations panel with actionable next steps derived from
 *     observed data ("3 empty days next week", "Tuesday 2pm has your
 *     best success rate", etc.).
 *   - Recent runs strip — last 12 worker outcomes as a sparkline.
 *   - Configuration card — time slots, channels, source preferences.
 *
 * All views are read-only against UploadJob data. The autopilot
 * level + schedule rules persist client-side as localStorage tokens
 * for now — server persistence happens in Phase 2 of this feature.
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { trpc } from "@/lib/trpc";
import { toast } from "@/stores/useNotificationStore";
import { cn } from "@/lib/utils";
import {
  Zap,
  Activity,
  Heart,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Power,
  RefreshCw,
  Lightbulb,
  Target,
} from "lucide-react";

function tx(t: (k: string) => string, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

/* ── Local persistence ───────────────────────────────────────────── */
const LS_KEY = "tf-autopilot-config";
type AutopilotConfig = {
  enabled: boolean;
  level: 0 | 1 | 2 | 3; // 0=off, 1=hints, 2=schedule, 3=full auto
  slots: { hour: number; days: number[] }[]; // weekly schedule
};
function loadConfig(): AutopilotConfig {
  if (typeof window === "undefined") {
    return { enabled: false, level: 0, slots: [] };
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { enabled: false, level: 0, slots: [] };
    const parsed = JSON.parse(raw);
    return {
      enabled: !!parsed.enabled,
      level: ([0, 1, 2, 3].includes(parsed.level) ? parsed.level : 0) as 0 | 1 | 2 | 3,
      slots: Array.isArray(parsed.slots) ? parsed.slots : [],
    };
  } catch {
    return { enabled: false, level: 0, slots: [] };
  }
}
function saveConfig(cfg: AutopilotConfig) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  } catch {
    /* localStorage unavailable */
  }
}

/* ════════════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════════════ */

export function AutopilotPage() {
  const t = useLocaleStore((s) => s.t);

  const [config, setConfig] = useState<AutopilotConfig>(() => loadConfig());
  useEffect(() => saveConfig(config), [config]);

  // Fetch jobs from the last 30 days for stats. byMonth would work for
  // a single month — but autopilot needs a rolling window, so we use
  // the regular list endpoint with a generous limit.
  const jobsQuery = trpc.uploadJobs.list.useQuery(
    { limit: 100 },
    { refetchOnWindowFocus: true },
  );

  type RawJob = {
    id: string;
    status: string;
    retryCount?: number;
    scheduledAt?: Date | string | null;
    createdAt: Date | string;
    completedAt?: Date | string | null;
  };
  const jobs = useMemo<RawJob[]>(() => jobsQuery.data?.items ?? [], [jobsQuery.data]);

  // ── Health score (0-100) ────────────────────────────────────────
  // Composite of 3 signals: completion rate, coverage, reliability.
  // Each capped at a target; weighted average. Zero jobs = 50 (neutral).
  const health = useMemo(() => {
    if (jobs.length === 0) return { score: 50, breakdown: { success: 0, coverage: 0, reliability: 0 } };
    const total = jobs.length;
    const completed = jobs.filter((j) => j.status === "COMPLETED").length;
    const failed = jobs.filter((j) => j.status === "FAILED" || j.status === "CANCELLED").length;
    const success = total > 0 ? (completed / total) * 100 : 0;
    const reliability = total > 0 ? Math.max(0, 100 - (failed / total) * 100) : 100;

    // Coverage: % of last 14 days with at least 1 job.
    const fourteenDaysAgo = Date.now() - 14 * 24 * 3600_000;
    const recentDays = new Set<string>();
    for (const j of jobs) {
      const ts = new Date(j.scheduledAt ?? j.createdAt).getTime();
      if (ts < fourteenDaysAgo) continue;
      recentDays.add(new Date(ts).toISOString().slice(0, 10));
    }
    const coverage = (recentDays.size / 14) * 100;

    const score = Math.round(success * 0.45 + coverage * 0.35 + reliability * 0.20);
    return { score, breakdown: { success: Math.round(success), coverage: Math.round(coverage), reliability: Math.round(reliability) } };
  }, [jobs]);

  // ── Heatmap (24h × 7d, normalized) ──────────────────────────────
  const heatmap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 0;
    for (const j of jobs) {
      const d = new Date(j.scheduledAt ?? j.createdAt);
      const day = (d.getDay() + 6) % 7; // Monday=0
      const hour = d.getHours();
      grid[day][hour]++;
      if (grid[day][hour] > max) max = grid[day][hour];
    }
    return { grid, max };
  }, [jobs]);

  // ── Recommendations ─────────────────────────────────────────────
  const recommendations = useMemo(() => {
    const rec: { id: string; severity: "info" | "warn" | "win"; title: string; body: string; Icon: React.ComponentType<{ className?: string }> }[] = [];

    // Coverage gap
    if (health.breakdown.coverage < 50) {
      rec.push({
        id: "coverage",
        severity: "warn",
        title: tx(t, "autopilot.rec.coverage.title", "Sparse posting cadence"),
        body: tx(
          t,
          "autopilot.rec.coverage.body",
          `Only ${health.breakdown.coverage}% of the last 14 days had a scheduled or queued post. Aim for daily content to keep the YouTube algorithm warm.`,
        ),
        Icon: Calendar,
      });
    }

    // Reliability gap
    if (health.breakdown.reliability < 90 && jobs.length > 5) {
      rec.push({
        id: "reliability",
        severity: "warn",
        title: tx(t, "autopilot.rec.reliability.title", "Failed uploads detected"),
        body: tx(
          t,
          "autopilot.rec.reliability.body",
          `${100 - health.breakdown.reliability}% of your jobs failed. Check the activity log for the root cause and re-auth your channel if tokens are stale.`,
        ),
        Icon: AlertCircle,
      });
    }

    // Best slot
    let bestDay = -1, bestHour = -1, bestCount = 0;
    heatmap.grid.forEach((row, d) =>
      row.forEach((c, h) => {
        if (c > bestCount) {
          bestCount = c;
          bestDay = d;
          bestHour = h;
        }
      }),
    );
    if (bestCount >= 2) {
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      rec.push({
        id: "best-slot",
        severity: "win",
        title: tx(t, "autopilot.rec.bestSlot.title", "Your busiest publishing window"),
        body: `${dayNames[bestDay]} @ ${String(bestHour).padStart(2, "0")}:00 — ${bestCount} jobs landed in this slot historically.`,
        Icon: TrendingUp,
      });
    }

    if (rec.length === 0) {
      rec.push({
        id: "all-good",
        severity: "win",
        title: tx(t, "autopilot.rec.allGood.title", "Healthy publishing cadence"),
        body: tx(t, "autopilot.rec.allGood.body", "No issues detected. Keep going."),
        Icon: CheckCircle2,
      });
    }

    return rec;
  }, [health, heatmap, jobs.length, t]);

  // ── Recent runs sparkline ───────────────────────────────────────
  const recentRuns = useMemo(() => {
    return jobs
      .filter((j) => j.status === "COMPLETED" || j.status === "FAILED" || j.status === "CANCELLED")
      .slice(0, 12)
      .reverse()
      .map((j) => ({
        id: j.id,
        ok: j.status === "COMPLETED",
        ts: new Date(j.completedAt ?? j.createdAt),
      }));
  }, [jobs]);

  const toggleEnabled = useCallback(() => {
    setConfig((c) => {
      const next = { ...c, enabled: !c.enabled };
      toast.success(
        next.enabled
          ? tx(t, "autopilot.enabledToast", "Autopilot enabled — monitoring active")
          : tx(t, "autopilot.disabledToast", "Autopilot paused"),
      );
      return next;
    });
  }, [t]);

  const setLevel = useCallback((lvl: 0 | 1 | 2 | 3) => {
    setConfig((c) => ({ ...c, level: lvl }));
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div role="status" aria-live="polite" className="sr-only">
        {`Autopilot ${config.enabled ? "enabled" : "paused"}, health score ${health.score} of 100`}
      </div>

      {/* Header */}
      <header className="pt-6 pb-4 sm:pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md tf-hero-float",
              config.enabled
                ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30"
                : "bg-gradient-to-br from-brand-500 to-violet-500 shadow-brand-500/20",
            )}>
              <Zap className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {tx(t, "autopilot.title", "Publishing autopilot")}
              </h1>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {tx(
                  t,
                  "autopilot.subtitle",
                  "Health, cadence and recommendations for your YouTube publishing flow.",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={toggleEnabled}
              aria-pressed={config.enabled}
              className={cn(
                "tf-focusable group/toggle inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-bold transition-all duration-200",
                config.enabled
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 hover:scale-[1.02] hover:shadow-lg"
                  : "border border-border bg-card text-foreground hover:border-brand-500/40 hover:text-brand-500",
              )}
            >
              <Power className="size-4" />
              {config.enabled ? tx(t, "autopilot.on", "On") : tx(t, "autopilot.off", "Off")}
            </button>
          </div>
        </div>
      </header>

      {/* Top row: health gauge + recent runs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Health gauge */}
        <section className="tf-content-reveal rounded-2xl border border-border bg-card p-5 shadow-sm md:col-span-1">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <Heart className="size-3 text-rose-500" />
            {tx(t, "autopilot.healthTitle", "Health score")}
          </div>
          <div className="mt-3 flex items-end gap-3">
            <span className={cn(
              "font-mono text-5xl font-bold leading-none",
              health.score >= 80 ? "text-emerald-500"
              : health.score >= 60 ? "text-amber-500"
              : "text-rose-500",
            )}>
              {health.score}
            </span>
            <span className="pb-1 text-[12px] font-semibold text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-4 space-y-2">
            <HealthBar label={tx(t, "autopilot.health.success", "Success rate")} value={health.breakdown.success} tone="emerald" />
            <HealthBar label={tx(t, "autopilot.health.coverage", "Coverage (14d)")} value={health.breakdown.coverage} tone="brand" />
            <HealthBar label={tx(t, "autopilot.health.reliability", "Reliability")} value={health.breakdown.reliability} tone="violet" />
          </div>
        </section>

        {/* Recent runs */}
        <section className="tf-content-reveal rounded-2xl border border-border bg-card p-5 shadow-sm md:col-span-2" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <Activity className="size-3 text-brand-500" />
              {tx(t, "autopilot.recentRuns", "Recent runs")}
            </div>
            <Link
              href="/publish/jobs"
              prefetch
              className="text-[11px] font-semibold text-brand-500 hover:underline"
            >
              {tx(t, "autopilot.viewAll", "View all")} →
            </Link>
          </div>
          {recentRuns.length === 0 ? (
            <div className="mt-6 flex items-center justify-center py-10 text-center">
              <div>
                <div className="mx-auto mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Sparkles className="size-5" />
                </div>
                <p className="text-[13px] font-semibold text-foreground">
                  {tx(t, "autopilot.noRuns", "No completed runs yet")}
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {tx(t, "autopilot.noRunsHint", "Publish a video to start collecting autopilot data.")}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <div className="flex items-end gap-1.5">
                {recentRuns.map((r) => (
                  <div
                    key={r.id}
                    className={cn(
                      "h-8 flex-1 rounded transition-colors hover:opacity-80",
                      r.ok ? "bg-emerald-500/70" : "bg-rose-500/70",
                    )}
                    title={`${r.ok ? "Completed" : "Failed"} — ${r.ts.toLocaleString()}`}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-mono">{recentRuns[0]?.ts.toLocaleDateString()}</span>
                <span className="font-mono">{recentRuns[recentRuns.length - 1]?.ts.toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Heatmap */}
      <section className="tf-content-reveal mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <Clock className="size-3 text-violet-500" />
          {tx(t, "autopilot.heatmapTitle", "Publishing heatmap")}
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            {jobs.length} {tx(t, "autopilot.heatmapJobs", "jobs analyzed")}
          </span>
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          {tx(t, "autopilot.heatmapDesc", "When you typically schedule or upload — hour × weekday density.")}
        </p>
        <div className="mt-4 overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex">
              <div className="w-9" />
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="flex-1 min-w-[14px] text-center font-mono text-[9px] text-muted-foreground">
                  {h % 3 === 0 ? h : ""}
                </div>
              ))}
            </div>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayLabel, d) => (
              <div key={dayLabel} className="mt-0.5 flex items-center">
                <span className="w-9 pr-1.5 text-right font-mono text-[10px] font-semibold text-muted-foreground">
                  {dayLabel}
                </span>
                {Array.from({ length: 24 }).map((_, h) => {
                  const c = heatmap.grid[d][h];
                  const intensity = heatmap.max > 0 ? c / heatmap.max : 0;
                  return (
                    <div
                      key={h}
                      className="flex-1 min-w-[14px] aspect-square rounded-[3px] transition-transform hover:scale-110"
                      style={{
                        marginRight: 2,
                        background:
                          c === 0
                            ? "rgba(120,120,120,0.08)"
                            : `rgba(99, 102, 241, ${0.15 + intensity * 0.65})`,
                      }}
                      title={c > 0 ? `${dayLabel} ${String(h).padStart(2, "0")}:00 — ${c} job${c > 1 ? "s" : ""}` : undefined}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommendations + Level */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <section className="tf-content-reveal rounded-2xl border border-border bg-card p-5 shadow-sm md:col-span-2" style={{ animationDelay: "180ms" }}>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="size-3 text-amber-500" />
            {tx(t, "autopilot.recsTitle", "Recommendations")}
          </div>
          <ul className="tf-stagger-in mt-3 space-y-2.5">
            {recommendations.map((r) => {
              const Icon = r.Icon;
              const toneStyles =
                r.severity === "win"
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500"
                  : r.severity === "warn"
                    ? "border-amber-500/30 bg-amber-500/5 text-amber-500"
                    : "border-brand-500/30 bg-brand-500/5 text-brand-500";
              return (
                <li
                  key={r.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3 transition-all hover:shadow-sm",
                    toneStyles,
                  )}
                >
                  <Icon className="mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-foreground">{r.title}</div>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{r.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Autopilot level selector */}
        <section className="tf-content-reveal rounded-2xl border border-border bg-card p-5 shadow-sm" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <Target className="size-3 text-brand-500" />
            {tx(t, "autopilot.levelTitle", "Autopilot level")}
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {tx(t, "autopilot.levelDesc", "How much TubeForge should automate for you.")}
          </p>
          <div className="mt-3 space-y-1.5">
            {([
              [0, tx(t, "autopilot.level0", "Off"),         tx(t, "autopilot.level0Desc", "Manual only.")],
              [1, tx(t, "autopilot.level1", "Hints"),       tx(t, "autopilot.level1Desc", "Show recommendations only.")],
              [2, tx(t, "autopilot.level2", "Schedule"),    tx(t, "autopilot.level2Desc", "Suggest scheduled publish times.")],
              [3, tx(t, "autopilot.level3", "Full auto"),   tx(t, "autopilot.level3Desc", "Auto-publish from upload queue (Phase 2).")],
            ] as const).map(([lvl, label, desc]) => {
              const active = config.level === lvl;
              const disabled = lvl === 3; // Phase 2
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => !disabled && setLevel(lvl as 0 | 1 | 2 | 3)}
                  aria-pressed={active}
                  disabled={disabled}
                  className={cn(
                    "tf-focusable group/lvl flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-all",
                    active
                      ? "border-brand-500 bg-brand-500/5 shadow-sm"
                      : "border-border hover:border-brand-500/40 hover:bg-muted",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                      active ? "border-brand-500 bg-brand-500" : "border-border",
                    )}
                  >
                    {active && <span className="size-1.5 rounded-full bg-white" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[13px] font-bold text-foreground">
                      {label}
                      {disabled && (
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          soon
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* CTA strip */}
      <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-between sm:items-center">
        <p className="text-[12px] text-muted-foreground">
          {tx(t, "autopilot.disclaimer", "Autopilot recommendations are based on your recent jobs and refresh on every visit.")}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => jobsQuery.refetch()}
            disabled={jobsQuery.isFetching}
            className="tf-focusable inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[13px] font-semibold text-foreground transition-colors hover:border-brand-500/40 hover:text-brand-500 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={cn("size-4", jobsQuery.isFetching && "animate-spin")} />
            <span className="hidden sm:inline">{tx(t, "autopilot.refresh", "Refresh")}</span>
          </button>
          <Link
            href="/publish/calendar"
            prefetch
            className="tf-focusable inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-4 text-[13px] font-bold text-white shadow-sm shadow-brand-500/20 transition-all hover:scale-[1.02] hover:shadow-md hover:shadow-brand-500/30"
          >
            <Calendar className="size-4" />
            {tx(t, "autopilot.openCalendar", "Open calendar")}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="h-12" />
    </div>
  );
}

function HealthBar({ label, value, tone }: { label: string; value: number; tone: "emerald" | "brand" | "violet" }) {
  const fill =
    tone === "emerald" ? "bg-emerald-500"
    : tone === "brand"  ? "bg-brand-500"
                        : "bg-violet-500";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-[width] duration-700 ease-out", fill)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
