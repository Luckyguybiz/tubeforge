"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { trpc } from "@/lib/trpc";
import { toast } from "@/stores/useNotificationStore";
import { cn } from "@/lib/utils";
import {
  Clock,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  PlayCircle as YoutubeIcon,
  ExternalLink,
  RefreshCw,
  Filter,
  Plus,
  Image as ImageIcon,
  ArrowRight,
} from "lucide-react";

/* ── i18n with fallback ─────────────────────────────────────────────── */
function tx(t: (k: string) => string, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

/* ── Job status types ───────────────────────────────────────────────── */
type JobStatus = "all" | "queued" | "uploading" | "scheduled" | "completed" | "failed";

interface JobEntry {
  id: string;
  title: string;
  thumbnailUrl?: string;
  channelTitle?: string;
  channelThumbnail?: string;
  status: Exclude<JobStatus, "all">;
  uploadProgress?: number;       // 0-100 when uploading
  scheduledAt?: string;          // ISO when scheduled
  completedAt?: string;          // ISO when completed
  createdAt: string;             // ISO
  youtubeVideoId?: string;
  youtubeUrl?: string;
  errorMessage?: string;
  webhookDelivered?: boolean;
  webhookFailed?: boolean;
}

const STATUS_CONFIG: Record<
  Exclude<JobStatus, "all">,
  { label: string; dot: string; badge: string; text: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  queued: {
    label: "Queued",
    dot: "bg-slate-400",
    badge: "bg-slate-500/10 border-slate-500/20",
    text: "text-slate-600 dark:text-slate-300",
    Icon: Clock,
  },
  scheduled: {
    label: "Scheduled",
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    Icon: Calendar,
  },
  uploading: {
    label: "Uploading",
    dot: "bg-blue-500",
    badge: "bg-blue-500/10 border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    Icon: Loader2,
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    Icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    dot: "bg-rose-500",
    badge: "bg-rose-500/10 border-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    Icon: AlertCircle,
  },
};

/* ── Read jobs from localStorage (Phase 1 stub) ──────────────────────
   Phase 2 swaps this for trpc.uploadJobs.list. The shape JobEntry is the
   same in both cases, so this component is forward-compatible.
   ──────────────────────────────────────────────────────────────────── */
function readJobsFromHistory(): JobEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("tf-publish-history");
    if (!raw) return [];
    const parsed: Array<{
      title: string;
      url: string;
      publishedAt: string;
      scheduled?: boolean;
      thumbnailUrl?: string;
    }> = JSON.parse(raw);
    return parsed.map((p, i) => ({
      id: `local-${i}-${p.publishedAt}`,
      title: p.title,
      thumbnailUrl: p.thumbnailUrl,
      status: p.scheduled ? "scheduled" : "completed",
      createdAt: p.publishedAt,
      completedAt: p.scheduled ? undefined : p.publishedAt,
      scheduledAt: p.scheduled ? p.publishedAt : undefined,
      youtubeUrl: p.url,
    }));
  } catch {
    return [];
  }
}

/* ── Relative time formatter ─────────────────────────────────────────── */
function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* ── Date grouping for timeline ──────────────────────────────────────── */
function dayKey(iso: string): string {
  const d = new Date(iso);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function dayLabel(key: string, t: (k: string) => string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (key === today) return tx(t, "publishJobs.today", "Today");
  if (key === yesterday) return tx(t, "publishJobs.yesterday", "Yesterday");
  return new Date(key).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ════════════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════════════ */

export function JobsPage() {
  const t = useLocaleStore((s) => s.t);
  const [activeFilter, setActiveFilter] = useState<JobStatus>("all");

  // Read ?highlight=<jobId> query param so a freshly-created job (after
  // /publish redirect) gets a ring-pulse for ~5s to draw the eye.
  const searchParams = useSearchParams();
  const highlightJobId = searchParams.get("highlight");
  const [activeHighlight, setActiveHighlight] = useState<string | null>(highlightJobId);
  useEffect(() => {
    if (!highlightJobId) return;
    setActiveHighlight(highlightJobId);
    const ttl = setTimeout(() => setActiveHighlight(null), 5_000);
    return () => clearTimeout(ttl);
  }, [highlightJobId]);

  // Live data from server. Polls every 4s when any job is in active
  // state (QUEUED/UPLOADING) so users see worker progress in real-time
  // without manual refresh. Idle when nothing's active to avoid
  // polling tax.
  //
  // Implemented via TanStack Query's native `refetchInterval` rather
  // than a manual setInterval — the latter recreates the timer on
  // every render (TRPC's query object is a new reference each render),
  // which churned the timer 100s of times per minute. Native interval
  // tears down cleanly when the query unmounts or `enabled` flips.
  const jobsQuery = trpc.uploadJobs.list.useQuery(
    { limit: 50 },
    {
      refetchOnWindowFocus: true,
      refetchInterval: (query) => {
        const items = query.state.data?.items ?? [];
        const hasActive = items.some(
          (j: { status: string }) => j.status === "QUEUED" || j.status === "UPLOADING",
        );
        return hasActive ? 4_000 : false;
      },
    },
  );

  // Map server UploadJob shape → JobEntry consumed by UI components.
  // Server enum is uppercase (QUEUED), UI uses lowercase ("queued").
  // scheduledAt presence on a QUEUED job → render as "scheduled".
  const jobs: JobEntry[] = useMemo(() => {
    const items = jobsQuery.data?.items ?? [];
    return items.map((j) => {
      const isScheduled = j.status === "QUEUED" && !!j.scheduledAt;
      const lower = (s: string): Exclude<JobStatus, "all"> => {
        const map: Record<string, Exclude<JobStatus, "all">> = {
          QUEUED: "queued",
          UPLOADING: "uploading",
          COMPLETED: "completed",
          FAILED: "failed",
          CANCELLED: "failed", // surface cancelled under "failed" filter for simplicity
        };
        return map[s] ?? "queued";
      };
      return {
        id: j.id,
        title: j.title,
        thumbnailUrl: j.thumbnailUrl ?? undefined,
        channelTitle: j.channel?.title,
        channelThumbnail: j.channel?.thumbnail ?? undefined,
        status: isScheduled ? "scheduled" : lower(j.status),
        uploadProgress: j.uploadProgress,
        scheduledAt: j.scheduledAt ? new Date(j.scheduledAt).toISOString() : undefined,
        completedAt: j.completedAt ? new Date(j.completedAt).toISOString() : undefined,
        createdAt: new Date(j.createdAt).toISOString(),
        youtubeVideoId: j.youtubeVideoId ?? undefined,
        youtubeUrl: j.youtubeVideoId ? `https://youtube.com/watch?v=${j.youtubeVideoId}` : undefined,
        errorMessage: j.errorMessage ?? undefined,
        webhookDelivered: j.webhookDelivered,
        webhookFailed: j.webhookFailed,
      };
    });
  }, [jobsQuery.data]);

  const isLoading = jobsQuery.isLoading;

  const refresh = useCallback(() => {
    void jobsQuery.refetch();
  }, [jobsQuery]);

  // Mutations for row actions
  const cancelMut = trpc.uploadJobs.cancel.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "publishJobs.cancelled", "Job cancelled"));
      void jobsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const retryMut = trpc.uploadJobs.retry.useMutation({
    onSuccess: () => {
      toast.success(tx(t, "publishJobs.retried", "Re-queued for retry"));
      void jobsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  /* ── Filter + group ─────────────────────────────────────────────── */
  const counts = useMemo(() => {
    const c: Record<JobStatus, number> = {
      all: jobs.length,
      queued: 0,
      uploading: 0,
      scheduled: 0,
      completed: 0,
      failed: 0,
    };
    for (const j of jobs) c[j.status]++;
    return c;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (activeFilter === "all") return jobs;
    return jobs.filter((j) => j.status === activeFilter);
  }, [jobs, activeFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, JobEntry[]>();
    // Order jobs: scheduled future first (asc), then completed by createdAt desc
    const sorted = [...filteredJobs].sort((a, b) => {
      if (a.status === "scheduled" && b.status !== "scheduled") return -1;
      if (b.status === "scheduled" && a.status !== "scheduled") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    for (const j of sorted) {
      const k = dayKey(j.scheduledAt ?? j.createdAt);
      const arr = map.get(k) ?? [];
      arr.push(j);
      map.set(k, arr);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filteredJobs]);

  const filters: { key: JobStatus; label: string }[] = [
    { key: "all", label: tx(t, "publishJobs.filter.all", "All") },
    { key: "scheduled", label: tx(t, "publishJobs.filter.scheduled", "Scheduled") },
    { key: "uploading", label: tx(t, "publishJobs.filter.uploading", "Uploading") },
    { key: "queued", label: tx(t, "publishJobs.filter.queued", "Queued") },
    { key: "completed", label: tx(t, "publishJobs.filter.completed", "Completed") },
    { key: "failed", label: tx(t, "publishJobs.filter.failed", "Failed") },
  ];

  // Build a short summary string for screen readers. Updates when counts
  // change, so SR users hear "2 uploading, 1 scheduled, 12 completed"
  // rather than nothing as jobs progress through the worker.
  const a11ySummary = useMemo(() => {
    const parts: string[] = [];
    if (counts.uploading) parts.push(`${counts.uploading} uploading`);
    if (counts.queued) parts.push(`${counts.queued} queued`);
    if (counts.scheduled) parts.push(`${counts.scheduled} scheduled`);
    if (counts.completed) parts.push(`${counts.completed} completed`);
    if (counts.failed) parts.push(`${counts.failed} failed`);
    return parts.join(", ");
  }, [counts]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      {/* SR-only live region. Polite (not assertive) so it doesn't
          interrupt a current announcement. Re-announces only when the
          summary string changes — i.e., on real status transitions. */}
      <div role="status" aria-live="polite" className="sr-only">
        {a11ySummary}
      </div>
      {/* Header */}
      <header className="pt-6 pb-4 sm:pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-md shadow-brand-500/20">
              <Clock className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {tx(t, "publishJobs.title", "Publishing jobs")}
              </h1>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {tx(
                  t,
                  "publishJobs.subtitle",
                  "Track every video you've sent to YouTube — queued, scheduled, live or failed.",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={refresh}
              disabled={jobsQuery.isFetching}
              aria-busy={jobsQuery.isFetching}
              className="tf-focusable inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[13px] font-semibold text-foreground transition-colors hover:border-brand-500/40 hover:text-brand-500 disabled:cursor-wait disabled:opacity-60"
              aria-label="Refresh"
            >
              <RefreshCw className={cn("size-4", jobsQuery.isFetching && "animate-spin")} />
              {tx(t, "publishJobs.refresh", "Refresh")}
            </button>
            <Link
              href="/publish"
              prefetch
              className="tf-focusable inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-4 text-[13px] font-bold text-white shadow-sm shadow-brand-500/20 transition-all hover:scale-[1.02] hover:shadow-md hover:shadow-brand-500/30"
            >
              <Plus className="size-4" />
              {tx(t, "publishJobs.newJob", "New publish")}
            </Link>
          </div>
        </div>
      </header>

      {/* Filter chips — mobile gets scroll-snap + edge-fade hint */}
      <section className="mb-5">
        <div className="tf-snap-x tf-scrollbar-hidden tf-fade-edge-right -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {filters.map((f) => {
            const active = activeFilter === f.key;
            const count = counts[f.key];
            const isStatus = f.key !== "all";
            // Ping the dot only when the filter targets a status that
            // ACTUALLY has live items right now — not just because the
            // user clicked the filter. Avoids fake "uploading" signal.
            const dotPulse = isStatus && count > 0 && (f.key === "uploading" || f.key === "queued");
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                aria-pressed={active}
                className={cn(
                  "tf-focusable group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold transition-all duration-200 ease-out sm:h-8 sm:py-1.5",
                  active
                    ? "bg-foreground text-background shadow-sm scale-[1.02]"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground hover:-translate-y-px",
                )}
              >
                {isStatus && (
                  <span
                    className={cn(
                      "relative size-1.5 rounded-full transition-colors",
                      STATUS_CONFIG[f.key as Exclude<JobStatus, "all">].dot,
                    )}
                  >
                    {dotPulse && (
                      <span
                        className={cn(
                          "absolute inset-0 -m-0.5 rounded-full opacity-60 animate-ping",
                          STATUS_CONFIG[f.key as Exclude<JobStatus, "all">].dot,
                        )}
                      />
                    )}
                  </span>
                )}
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 font-mono text-[10px] transition-colors",
                    active ? "bg-background/15 text-background" : "bg-muted-foreground/15 text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Content */}
      {isLoading ? (
        <div className="tf-stagger-in space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-border bg-muted/30"
            />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          activeFilter={activeFilter}
          hasAnyJobs={jobs.length > 0}
          t={t}
        />
      ) : (
        <div key={activeFilter} className="space-y-6 pb-16">
          {grouped.map(([day, dayJobs], gi) => (
            <section
              key={day}
              style={{ animationDelay: `${gi * 40}ms` }}
              className="tf-content-reveal"
            >
              <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {dayLabel(day, t)}
              </h2>
              <div className="tf-stagger-in space-y-2">
                {dayJobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    t={t}
                    highlighted={activeHighlight === job.id}
                    onCancel={() => cancelMut.mutate({ jobId: job.id })}
                    onRetry={() => retryMut.mutate({ jobId: job.id })}
                    isCancelling={cancelMut.isPending && cancelMut.variables?.jobId === job.id}
                    isRetrying={retryMut.isPending && retryMut.variables?.jobId === job.id}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════════════════════ */

function JobRow({
  job,
  t,
  highlighted,
  onCancel,
  onRetry,
  isCancelling,
  isRetrying,
}: {
  job: JobEntry;
  t: (k: string) => string;
  highlighted?: boolean;
  onCancel?: () => void;
  onRetry?: () => void;
  isCancelling?: boolean;
  isRetrying?: boolean;
}) {
  const cfg = STATUS_CONFIG[job.status];
  const Icon = cfg.Icon;
  const isActive = job.status === "uploading" || job.status === "queued";
  return (
    <div
      className={cn(
        "group/row relative flex items-center gap-2.5 overflow-hidden rounded-2xl border bg-card p-2.5 shadow-sm transition-all duration-200 ease-out sm:gap-3 sm:p-3",
        "hover:-translate-y-0.5 hover:shadow-md hover:border-brand-500/30",
        highlighted
          ? "border-brand-500/60 shadow-md shadow-brand-500/15 tf-row-highlight"
          : "border-border",
      )}
    >
      {/* Thumbnail — smaller on mobile to leave room for title */}
      <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-24">
        {job.thumbnailUrl ? (
          <img
            src={job.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // Thumbnail 404'd (video deleted/privatized) — hide the img
              // so the placeholder ImageIcon sibling shows through. The
              // empty bg-muted container stays the same size, no layout
              // shift.
              e.currentTarget.style.display = "none";
              const ph = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (ph) ph.style.display = "flex";
            }}
            className="size-full object-cover transition-transform duration-300 group-hover/row:scale-105"
          />
        ) : null}
        <div
          className="flex size-full items-center justify-center"
          style={{ display: job.thumbnailUrl ? "none" : "flex" }}
        >
          <ImageIcon className="size-5 text-muted-foreground/40" />
        </div>{job.thumbnailUrl ? null : null}
        {job.status === "uploading" && typeof job.uploadProgress === "number" && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div
              className="relative h-full bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500 bg-[length:200%_100%] transition-[width] duration-500 ease-out tf-progress-shimmer"
              style={{ width: `${job.uploadProgress}%` }}
            />
          </div>
        )}
        {isActive && (
          <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-blue-500/30 tf-pulse-soft" />
        )}
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="line-clamp-1 text-[14px] font-semibold text-foreground">
            {job.title || tx(t, "publishJobs.untitled", "Untitled")}
          </h3>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {job.channelTitle && (
            <span className="inline-flex items-center gap-1">
              {job.channelThumbnail ? (
                <img
                  src={job.channelThumbnail}
                  alt={job.channelTitle}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                  className="size-3.5 rounded-full"
                />
              ) : (
                <YoutubeIcon className="size-3 text-red-500" />
              )}
              <span className="truncate max-w-[200px]">{job.channelTitle}</span>
            </span>
          )}
          {job.status === "scheduled" && job.scheduledAt && (
            <span className="inline-flex items-center gap-1 font-mono">
              <Calendar className="size-3" />
              {new Date(job.scheduledAt).toLocaleString()}
            </span>
          )}
          {job.completedAt && (
            <span className="inline-flex items-center gap-1 font-mono">
              <Clock className="size-3" />
              {relativeTime(job.completedAt)}
            </span>
          )}
          {job.errorMessage && (
            <span className="inline-flex items-center gap-1 font-mono text-rose-500">
              <AlertCircle className="size-3" />
              {job.errorMessage.slice(0, 60)}
            </span>
          )}
          {job.status === "completed" && job.webhookDelivered && (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              webhook ✓
            </span>
          )}
          {job.webhookFailed && (
            <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 text-[10px] font-bold text-rose-500">
              webhook ✗
            </span>
          )}
        </div>
      </div>

      {/* Status badge — icon-only with dot on mobile, full label on sm+ */}
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors sm:px-2 sm:py-0.5",
          cfg.badge,
          cfg.text,
        )}
        aria-label={cfg.label}
        title={cfg.label}
      >
        {isActive && (
          <span className="relative inline-flex size-1.5">
            <span
              className={cn("absolute inset-0 rounded-full opacity-75 animate-ping", cfg.dot)}
              aria-hidden
            />
            <span className={cn("relative size-1.5 rounded-full", cfg.dot)} aria-hidden />
          </span>
        )}
        <Icon className={cn("size-3", job.status === "uploading" && "animate-spin")} />
        <span className="hidden sm:inline">{cfg.label}</span>
      </span>

      {/* Actions — size-10 on mobile (40px touch target), size-8 desktop */}
      <div className="flex shrink-0 items-center gap-1">
        {job.status === "completed" && job.youtubeUrl && (
          <a
            href={job.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tf-focusable inline-flex size-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:scale-110 hover:border-brand-500/40 hover:text-brand-500 hover:shadow-sm sm:size-8"
            title={tx(t, "publishJobs.openYt", "Open on YouTube")}
            aria-label={tx(t, "publishJobs.openYt", "Open on YouTube")}
          >
            <ExternalLink className="size-4 sm:size-3.5" />
          </a>
        )}
        {(job.status === "queued" || job.status === "scheduled") && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isCancelling}
            className="tf-focusable inline-flex size-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:scale-110 hover:border-rose-500/40 hover:text-rose-500 disabled:cursor-wait disabled:opacity-60 sm:size-8"
            title={tx(t, "publishJobs.cancel", "Cancel")}
            aria-label={tx(t, "publishJobs.cancel", "Cancel")}
          >
            {isCancelling ? <Loader2 className="size-4 animate-spin sm:size-3.5" /> : <AlertCircle className="size-4 sm:size-3.5" />}
          </button>
        )}
        {job.status === "failed" && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="tf-focusable inline-flex size-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:scale-110 hover:rotate-180 hover:border-brand-500/40 hover:text-brand-500 disabled:cursor-wait disabled:opacity-60 sm:size-8"
            style={{ transitionDuration: "260ms" }}
            title={tx(t, "publishJobs.retry", "Retry")}
            aria-label={tx(t, "publishJobs.retry", "Retry")}
          >
            {isRetrying ? <Loader2 className="size-4 animate-spin sm:size-3.5" /> : <RefreshCw className="size-4 sm:size-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  activeFilter,
  hasAnyJobs,
  t,
}: {
  activeFilter: JobStatus;
  hasAnyJobs: boolean;
  t: (k: string) => string;
}) {
  if (hasAnyJobs && activeFilter !== "all") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
        <Filter className="mx-auto size-7 text-muted-foreground/50" />
        <h3 className="mt-3 text-[15px] font-bold text-foreground">
          {tx(t, "publishJobs.empty.filteredTitle", "No jobs match this filter")}
        </h3>
        <p className="mt-1 text-[12px] text-muted-foreground">
          {tx(t, "publishJobs.empty.filteredDesc", "Try a different status or clear the filter.")}
        </p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 text-brand-500">
        <Rocket className="size-7" />
      </div>
      <h3 className="mt-4 text-[18px] font-bold text-foreground">
        {tx(t, "publishJobs.empty.title", "No publishing jobs yet")}
      </h3>
      <p className="mt-2 max-w-xs mx-auto text-[13px] leading-relaxed text-muted-foreground">
        {tx(
          t,
          "publishJobs.empty.desc",
          "Publish your first video to YouTube. Schedule, set privacy, monitor progress — all in one place.",
        )}
      </p>
      <Link
        href="/publish"
        prefetch
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-5 text-[14px] font-bold text-white shadow-md shadow-brand-500/20 hover:scale-[1.02] transition-transform"
      >
        <Rocket className="size-4" />
        {tx(t, "publishJobs.empty.cta", "Publish a video")}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
