/**
 * Shared health-score & heatmap computation.
 *
 * Moved out of AutopilotPage.tsx so Atlas (server-side) and the page
 * (client-side via a thin TRPC procedure) share one source of truth.
 * Both ingest the same UploadJob shape.
 */

interface RawJob {
  status: string;
  scheduledAt?: Date | string | null;
  createdAt: Date | string;
  completedAt?: Date | string | null;
}

export interface HealthScore {
  score: number;
  breakdown: { success: number; coverage: number; reliability: number };
}

/** Composite 0-100 health across success / coverage / reliability. */
export function computeHealthScore(jobs: RawJob[]): HealthScore {
  if (jobs.length === 0) {
    return { score: 50, breakdown: { success: 0, coverage: 0, reliability: 0 } };
  }
  const total = jobs.length;
  const completed = jobs.filter((j) => j.status === 'COMPLETED').length;
  const failed = jobs.filter((j) => j.status === 'FAILED' || j.status === 'CANCELLED').length;
  const success = total > 0 ? (completed / total) * 100 : 0;
  const reliability = total > 0 ? Math.max(0, 100 - (failed / total) * 100) : 100;

  const fourteenDaysAgo = Date.now() - 14 * 24 * 3600_000;
  const recentDays = new Set<string>();
  for (const j of jobs) {
    const ts = new Date(j.scheduledAt ?? j.createdAt).getTime();
    if (ts < fourteenDaysAgo) continue;
    recentDays.add(new Date(ts).toISOString().slice(0, 10));
  }
  const coverage = (recentDays.size / 14) * 100;

  const score = Math.round(success * 0.45 + coverage * 0.35 + reliability * 0.2);
  return {
    score,
    breakdown: {
      success: Math.round(success),
      coverage: Math.round(coverage),
      reliability: Math.round(reliability),
    },
  };
}

/**
 * Aggregate jobs into a per-day map { 'YYYY-MM-DD': { count, success } }
 * across a date range. Used by Atlas's get_heatmap tool to give Claude
 * a compact view of cadence.
 */
export interface HeatmapEntry {
  date: string;
  count: number;
  succeeded: number;
  failed: number;
}

export function aggregateHeatmap(jobs: RawJob[]): HeatmapEntry[] {
  const map = new Map<string, HeatmapEntry>();
  for (const j of jobs) {
    const day = new Date(j.scheduledAt ?? j.createdAt).toISOString().slice(0, 10);
    let entry = map.get(day);
    if (!entry) {
      entry = { date: day, count: 0, succeeded: 0, failed: 0 };
      map.set(day, entry);
    }
    entry.count++;
    if (j.status === 'COMPLETED') entry.succeeded++;
    else if (j.status === 'FAILED' || j.status === 'CANCELLED') entry.failed++;
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function isoDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 24 * 3600_000);
  return d.toISOString();
}
