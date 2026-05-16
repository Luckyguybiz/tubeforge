"use client";

/**
 * /publish/calendar — month-grid view of scheduled & completed uploads.
 *
 * Complements /publish/jobs (timeline) with a calendar workspace where
 * the user can see at-a-glance which days have content lined up vs
 * empty days that need filling. Click a day → see jobs for that day in
 * a side drawer; click a job → row actions (cancel, retry, open YT).
 *
 * Data: trpc.uploadJobs.byMonth — single query per month, 500-item cap
 * (plenty for any realistic creator's month). Polled every 12s while
 * any job in view is active.
 *
 * Mobile (<sm): the month grid becomes a vertical "agenda" with each
 * day a row showing the day name + count chip + first 2 jobs.
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  PlayCircle as YoutubeIcon,
  ExternalLink,
  Image as ImageIcon,
  X,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";

function tx(t: (k: string) => string, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

/* ── Status mapping ──────────────────────────────────────────────── */
type CalStatus = "queued" | "uploading" | "scheduled" | "completed" | "failed";

const STATUS_TINT: Record<CalStatus, { dot: string; bg: string; text: string }> = {
  scheduled: { dot: "bg-amber-500",   bg: "bg-amber-500/15",   text: "text-amber-600 dark:text-amber-400" },
  uploading: { dot: "bg-blue-500",    bg: "bg-blue-500/15",    text: "text-blue-600 dark:text-blue-400" },
  queued:    { dot: "bg-slate-400",   bg: "bg-slate-500/15",   text: "text-slate-600 dark:text-slate-300" },
  completed: { dot: "bg-emerald-500", bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400" },
  failed:    { dot: "bg-rose-500",    bg: "bg-rose-500/15",    text: "text-rose-600 dark:text-rose-400" },
};

function mapStatus(s: string, scheduledAt: Date | string | null): CalStatus {
  if (s === "QUEUED" && scheduledAt) return "scheduled";
  if (s === "UPLOADING") return "uploading";
  if (s === "COMPLETED") return "completed";
  if (s === "FAILED" || s === "CANCELLED") return "failed";
  return "queued";
}

interface CalJob {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  status: CalStatus;
  uploadProgress: number;
  youtubeVideoId: string | null;
  scheduledAt: string | null;
  createdAt: string;
  completedAt: string | null;
  channelTitle: string | null;
  channelThumbnail: string | null;
}

/* ── Date helpers ────────────────────────────────────────────────── */
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}
function dayKey(d: Date | string): string {
  const dd = typeof d === "string" ? new Date(d) : d;
  return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`;
}
function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function isToday(d: Date): boolean {
  const t = new Date();
  return dayKey(d) === dayKey(t);
}
function monthLabel(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

/* Build a 6×7 grid of dates centered on `month`. Some cells leak into
 * previous/next month for visual completeness. */
function buildMonthGrid(month: Date): Date[] {
  const start = startOfMonth(month);
  const startWeekday = (start.getDay() + 6) % 7; // Monday=0
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startWeekday);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const WEEKDAY_FALLBACK: Record<(typeof WEEKDAY_KEYS)[number], string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

/* ════════════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════════════ */

export function CalendarPage() {
  const t = useLocaleStore((s) => s.t);
  const locale = useLocaleStore((s) => s.locale);

  const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const from = startOfMonth(cursor);
  const to = endOfMonth(cursor);

  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);

  // Fetch — polls when anything's active so live progress shows on the
  // calendar cells without manual refresh.
  const monthQuery = trpc.uploadJobs.byMonth.useQuery(
    { from: from.toISOString(), to: to.toISOString() },
    {
      refetchOnWindowFocus: true,
      refetchInterval: (q) => {
        const items = q.state.data?.items ?? [];
        const active = items.some(
          (j: { status: string }) => j.status === "QUEUED" || j.status === "UPLOADING",
        );
        return active ? 12_000 : false;
      },
    },
  );

  const jobs: CalJob[] = useMemo(() => {
    const items = monthQuery.data?.items ?? [];
    return items.map((j) => ({
      id: j.id,
      title: j.title,
      thumbnailUrl: j.thumbnailUrl ?? null,
      status: mapStatus(j.status, j.scheduledAt),
      uploadProgress: j.uploadProgress ?? 0,
      youtubeVideoId: j.youtubeVideoId,
      scheduledAt: j.scheduledAt ? new Date(j.scheduledAt).toISOString() : null,
      createdAt: new Date(j.createdAt).toISOString(),
      completedAt: j.completedAt ? new Date(j.completedAt).toISOString() : null,
      channelTitle: j.channel?.title ?? null,
      channelThumbnail: j.channel?.thumbnail ?? null,
    }));
  }, [monthQuery.data]);

  // Group jobs by day key (YYYY-MM-DD).
  const byDay = useMemo(() => {
    const map = new Map<string, CalJob[]>();
    for (const j of jobs) {
      const k = dayKey(j.scheduledAt ?? j.createdAt);
      const arr = map.get(k) ?? [];
      arr.push(j);
      map.set(k, arr);
    }
    return map;
  }, [jobs]);

  // Month stats for the sticky header summary.
  const stats = useMemo(() => {
    const s = { total: 0, scheduled: 0, completed: 0, failed: 0, active: 0 };
    for (const j of jobs) {
      s.total++;
      if (j.status === "scheduled") s.scheduled++;
      else if (j.status === "completed") s.completed++;
      else if (j.status === "failed") s.failed++;
      else s.active++;
    }
    return s;
  }, [jobs]);

  // Days with NO content scheduled in the current month — surface as a
  // "gap" count that gently nudges the user to fill empty slots.
  const emptyDaysInMonth = useMemo(() => {
    let empty = 0;
    let monthDays = 0;
    const today = new Date();
    for (const d of grid) {
      if (!isSameMonth(d, cursor)) continue;
      // Only count from today onwards — past empty days aren't fillable.
      if (d < new Date(today.getFullYear(), today.getMonth(), today.getDate())) continue;
      monthDays++;
      const k = dayKey(d);
      if (!byDay.has(k)) empty++;
    }
    return { empty, considered: monthDays };
  }, [grid, byDay, cursor]);

  const goPrev = useCallback(() => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
    setSelectedDay(null);
  }, []);
  const goNext = useCallback(() => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
    setSelectedDay(null);
  }, []);
  const goToday = useCallback(() => {
    setCursor(startOfMonth(new Date()));
    setSelectedDay(dayKey(new Date()));
  }, []);

  // Keyboard nav: ← → for prev/next month, T for today, Esc closes drawer.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "t" || e.key === "T") goToday();
      else if (e.key === "Escape" && selectedDay) setSelectedDay(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext, goToday, selectedDay]);

  const selectedDayJobs = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      {/* SR live region for month/stats changes. */}
      <div role="status" aria-live="polite" className="sr-only">
        {`${monthLabel(cursor, locale)}: ${stats.total} jobs, ${stats.scheduled} scheduled, ${stats.completed} completed, ${stats.failed} failed`}
      </div>

      {/* Header */}
      <header className="pt-6 pb-4 sm:pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-md shadow-brand-500/20 tf-hero-float">
              <Calendar className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {tx(t, "publishCal.title", "Publishing calendar")}
              </h1>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {tx(
                  t,
                  "publishCal.subtitle",
                  "Plan, schedule and review your YouTube uploads month-by-month.",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            <Link
              href="/publish/jobs"
              prefetch
              className="tf-focusable inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[13px] font-semibold text-foreground transition-colors hover:border-brand-500/40 hover:text-brand-500"
              title={tx(t, "publishCal.timelineView", "Switch to timeline view")}
            >
              <ListIcon className="size-4" />
              <span className="hidden sm:inline">{tx(t, "publishCal.timeline", "Timeline")}</span>
            </Link>
            <Link
              href="/publish"
              prefetch
              className="tf-focusable inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-4 text-[13px] font-bold text-white shadow-sm shadow-brand-500/20 transition-all hover:scale-[1.02] hover:shadow-md hover:shadow-brand-500/30"
            >
              <Plus className="size-4" />
              {tx(t, "publishCal.newJob", "New publish")}
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="tf-snap-x tf-scrollbar-hidden -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <StatPill label={tx(t, "publishCal.statTotal", "Total")} value={stats.total} dot="bg-foreground" />
          <StatPill label={tx(t, "publishCal.statScheduled", "Scheduled")} value={stats.scheduled} dot={STATUS_TINT.scheduled.dot} />
          <StatPill label={tx(t, "publishCal.statActive", "Active")} value={stats.active} dot={STATUS_TINT.uploading.dot} pulse={stats.active > 0} />
          <StatPill label={tx(t, "publishCal.statCompleted", "Completed")} value={stats.completed} dot={STATUS_TINT.completed.dot} />
          <StatPill label={tx(t, "publishCal.statFailed", "Failed")} value={stats.failed} dot={STATUS_TINT.failed.dot} tone={stats.failed > 0 ? "rose" : "muted"} />
          {emptyDaysInMonth.empty > 0 && (
            <StatPill
              label={tx(t, "publishCal.statEmpty", "Empty days ahead")}
              value={emptyDaysInMonth.empty}
              dot="bg-muted-foreground/50"
              tone="amber"
            />
          )}
        </div>
      </header>

      {/* Month switcher */}
      <div className="mt-2 mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            aria-label={tx(t, "publishCal.prev", "Previous month")}
            className="tf-focusable inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:-translate-x-0.5 hover:border-brand-500/40 hover:text-brand-500 sm:size-9"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="tf-focusable inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[13px] font-semibold text-foreground transition-colors hover:border-brand-500/40 hover:text-brand-500 sm:h-9"
          >
            {tx(t, "publishCal.today", "Today")}
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label={tx(t, "publishCal.next", "Next month")}
            className="tf-focusable inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:translate-x-0.5 hover:border-brand-500/40 hover:text-brand-500 sm:size-9"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <h2 className="text-lg font-bold text-foreground sm:text-xl" aria-live="polite">
          {monthLabel(cursor, locale)}
        </h2>
        <span className="hidden sm:block text-[11px] font-mono text-muted-foreground">
          ← →  ·  T
        </span>
      </div>

      {/* Calendar grid (desktop) + agenda list (mobile) */}
      {monthQuery.isLoading ? (
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="aspect-[5/4] animate-pulse rounded-lg border border-border bg-muted/30" />
          ))}
        </div>
      ) : (
        <>
          {/* Desktop / tablet grid */}
          <div className="hidden sm:block">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1.5 pb-1.5">
              {WEEKDAY_KEYS.map((k) => (
                <div
                  key={k}
                  className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {tx(t, `publishCal.weekday.${k}`, WEEKDAY_FALLBACK[k])}
                </div>
              ))}
            </div>
            {/* Day cells */}
            <div className="tf-content-reveal grid grid-cols-7 gap-1.5">
              {grid.map((d, i) => {
                const k = dayKey(d);
                const dayJobs = byDay.get(k) ?? [];
                const inMonth = isSameMonth(d, cursor);
                const today = isToday(d);
                const isSelected = selectedDay === k;
                return (
                  <DayCell
                    key={k + i}
                    date={d}
                    jobs={dayJobs}
                    inMonth={inMonth}
                    isToday={today}
                    isSelected={isSelected}
                    onClick={() => setSelectedDay(isSelected ? null : k)}
                  />
                );
              })}
            </div>
          </div>

          {/* Mobile agenda */}
          <div className="sm:hidden tf-stagger-in space-y-1.5">
            {grid
              .filter((d) => isSameMonth(d, cursor))
              .map((d) => {
                const k = dayKey(d);
                const dayJobs = byDay.get(k) ?? [];
                return (
                  <AgendaRow
                    key={k}
                    date={d}
                    jobs={dayJobs}
                    isToday={isToday(d)}
                    isSelected={selectedDay === k}
                    onClick={() => setSelectedDay(selectedDay === k ? null : k)}
                  />
                );
              })}
          </div>
        </>
      )}

      {/* Day drawer */}
      {selectedDay && (
        <DayDrawer
          dayKey={selectedDay}
          jobs={selectedDayJobs}
          onClose={() => setSelectedDay(null)}
          t={t}
        />
      )}

      <div className="h-16" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════════════════════ */

function StatPill({
  label,
  value,
  dot,
  tone = "default",
  pulse = false,
}: {
  label: string;
  value: number;
  dot: string;
  tone?: "default" | "rose" | "amber" | "muted";
  pulse?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-xl border bg-card px-3 py-2 transition-colors sm:py-1.5",
        tone === "rose" && "border-rose-500/30 bg-rose-500/5",
        tone === "amber" && "border-amber-500/30 bg-amber-500/5",
        tone === "default" && "border-border",
        tone === "muted" && "border-border",
      )}
    >
      <span className="relative inline-flex size-1.5">
        <span className={cn("relative size-1.5 rounded-full", dot)} />
        {pulse && (
          <span className={cn("absolute inset-0 rounded-full opacity-75 animate-ping", dot)} aria-hidden />
        )}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-[13px] font-bold text-foreground">{value}</span>
    </div>
  );
}

function DayCell({
  date,
  jobs,
  inMonth,
  isToday,
  isSelected,
  onClick,
}: {
  date: Date;
  jobs: CalJob[];
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hasContent = jobs.length > 0;
  // Composite border color: red wins if any failed, brand if any active,
  // emerald if any completed, amber if scheduled, else default.
  const accent =
    jobs.some((j) => j.status === "failed") ? "rose"
    : jobs.some((j) => j.status === "uploading") ? "blue"
    : jobs.some((j) => j.status === "completed") ? "emerald"
    : jobs.some((j) => j.status === "scheduled") ? "amber"
    : "neutral";

  const accentClasses: Record<typeof accent, string> = {
    rose: "border-rose-500/40 bg-rose-500/5",
    blue: "border-blue-500/40 bg-blue-500/5",
    emerald: "border-emerald-500/30 bg-emerald-500/5",
    amber: "border-amber-500/40 bg-amber-500/5",
    neutral: "border-border bg-card",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${date.toDateString()} — ${jobs.length} jobs`}
      className={cn(
        "tf-focusable group/cell relative flex aspect-[5/4] flex-col gap-1 rounded-lg border p-1.5 text-left transition-all duration-150",
        "hover:-translate-y-0.5 hover:shadow-sm",
        accentClasses[accent],
        !inMonth && "opacity-40",
        isSelected && "ring-2 ring-brand-500/60",
        isToday && "shadow-md shadow-brand-500/10",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-[12px] font-bold leading-none",
            isToday ? "text-brand-500" : "text-foreground",
          )}
        >
          {date.getDate()}
        </span>
        {hasContent && (
          <span className="font-mono text-[10px] font-bold text-muted-foreground">
            {jobs.length}
          </span>
        )}
      </div>
      {/* Up to 3 status dots so the cell hints at composition without
          loading thumbnails (cell is tiny). */}
      <div className="mt-auto flex flex-wrap items-center gap-0.5">
        {jobs.slice(0, 3).map((j) => (
          <span
            key={j.id}
            className={cn("size-1.5 rounded-full", STATUS_TINT[j.status].dot)}
            aria-hidden
          />
        ))}
        {jobs.length > 3 && (
          <span className="ml-0.5 text-[9px] font-mono text-muted-foreground">+{jobs.length - 3}</span>
        )}
      </div>
      {isToday && (
        <span className="absolute right-1 top-1 size-1 rounded-full bg-brand-500 tf-pulse-soft" aria-hidden />
      )}
    </button>
  );
}

function AgendaRow({
  date,
  jobs,
  isToday,
  isSelected,
  onClick,
}: {
  date: Date;
  jobs: CalJob[];
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "tf-focusable flex w-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left transition-all",
        "hover:border-brand-500/30 hover:shadow-sm active:scale-[0.995]",
        isToday ? "border-brand-500/40" : "border-border",
        isSelected && "ring-2 ring-brand-500/60",
      )}
    >
      <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-muted">
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", isToday ? "text-brand-500" : "text-muted-foreground")}>
          {date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3)}
        </span>
        <span className={cn("text-[15px] font-bold leading-none", isToday ? "text-brand-500" : "text-foreground")}>
          {date.getDate()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        {jobs.length === 0 ? (
          <span className="text-[12px] italic text-muted-foreground">No jobs</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {jobs.slice(0, 3).map((j) => (
              <span
                key={j.id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                  STATUS_TINT[j.status].bg,
                  STATUS_TINT[j.status].text,
                )}
              >
                <span className={cn("size-1 rounded-full", STATUS_TINT[j.status].dot)} />
                {j.title.slice(0, 22)}
                {j.title.length > 22 && "…"}
              </span>
            ))}
            {jobs.length > 3 && (
              <span className="font-mono text-[10px] text-muted-foreground">+{jobs.length - 3}</span>
            )}
          </div>
        )}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function DayDrawer({
  dayKey,
  jobs,
  onClose,
  t,
}: {
  dayKey: string;
  jobs: CalJob[];
  onClose: () => void;
  t: (k: string) => string;
}) {
  const date = new Date(dayKey);
  const formattedDate = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/60 p-0 backdrop-blur-sm tf-overlay-enter sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Jobs for ${formattedDate}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="tf-modal-enter relative w-full overflow-hidden rounded-t-2xl border-t border-border bg-card shadow-2xl sm:max-w-lg sm:rounded-2xl sm:border"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-[15px] font-bold text-foreground">
              {formattedDate}
            </h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tf-focusable flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-all hover:rotate-90 hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-3 py-3 sm:max-h-96">
          {jobs.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Calendar className="size-5" />
              </div>
              <p className="text-[13px] font-semibold text-foreground">
                {tx(t, "publishCal.dayEmpty", "No jobs on this day")}
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {tx(t, "publishCal.dayEmptyHint", "Schedule a publish for this date from the publish page.")}
              </p>
              <Link
                href="/publish"
                prefetch
                className="tf-focusable mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-3 text-[12px] font-bold text-white transition-all hover:bg-brand-600 hover:scale-[1.02]"
              >
                <Plus className="size-3.5" />
                {tx(t, "publishCal.newJob", "New publish")}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : (
            <ul className="tf-stagger-in space-y-2">
              {jobs.map((j) => (
                <DrawerJobItem key={j.id} job={j} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function DrawerJobItem({ job }: { job: CalJob }) {
  const tint = STATUS_TINT[job.status];
  const time = job.scheduledAt ?? job.createdAt;
  const timeStr = new Date(time).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li className="group/item flex items-center gap-3 rounded-xl border border-border bg-background p-2.5 transition-all hover:border-brand-500/30 hover:shadow-sm">
      <div className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {job.thumbnailUrl ? (
          <img
            src={job.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(e) => (e.currentTarget.style.display = "none")}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-4 text-muted-foreground/40" />
          </div>
        )}
        {job.status === "uploading" && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/40">
            <div className="h-full bg-blue-500 tf-progress-shimmer" style={{ width: `${job.uploadProgress}%` }} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-[13px] font-semibold text-foreground">
          {job.title || "Untitled"}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
          <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold", tint.bg, tint.text)}>
            <span className={cn("size-1 rounded-full", tint.dot)} />
            {job.status}
          </span>
          <span className="font-mono text-muted-foreground">{timeStr}</span>
          {job.channelTitle && (
            <span className="flex items-center gap-1 truncate text-muted-foreground">
              <YoutubeIcon className="size-2.5 text-red-500" />
              <span className="truncate">{job.channelTitle}</span>
            </span>
          )}
        </div>
      </div>
      {job.youtubeVideoId && (
        <a
          href={`https://youtube.com/watch?v=${job.youtubeVideoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="tf-focusable flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:border-brand-500/40 hover:text-brand-500"
          title="Open on YouTube"
          aria-label="Open on YouTube"
        >
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </li>
  );
}
