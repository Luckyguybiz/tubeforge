/**
 * Slot picking for the autopost planner. Pure functions: no DB, no clock.
 *
 * Same model as the mobile app (src/core/schedule/slots.ts in autopost-app):
 * channel slot times, weekdays, a daily ceiling and a minimum gap between
 * posts. The difference is that slot times live in the channel time zone.
 */
import { DAY, MINUTE, localDayStart, slotToMinutes, zonedTime, localParts } from './time';

export interface Rules {
  /** 'HH:mm' wall-clock times in `timezone`. */
  slotTimes: string[];
  /** 0 = Monday ... 6 = Sunday. */
  weekdays: number[];
  postsPerDay: number;
  minGapMinutes: number;
  timezone: string;
}

export type SlotReason = 'nearest' | 'cap_moved' | 'weekday_moved' | 'gap_moved' | 'paused_moved';

export interface SlotContext {
  rules: Rules;
  /** Hard ceiling per day kept by channel protection. */
  dailyCap: number;
  /** Times already taken by this channel. */
  occupied: Date[];
  pausedUntil?: Date | null;
  /** Minimum time before a slot, minutes. */
  leadMinutes?: number;
}

export interface SlotSuggestion {
  at: Date;
  reason: SlotReason;
}

export const HORIZON_DAYS = 60;
export const DEFAULT_LEAD_MINUTES = 15;

export function effectivePerDay(rules: Rules, dailyCap: number): number {
  return Math.max(0, Math.min(rules.postsPerDay, dailyCap, rules.slotTimes.length));
}

function sortedSlots(rules: Rules): number[] {
  return rules.slotTimes
    .map(slotToMinutes)
    .filter((m): m is number => m != null)
    .sort((a, b) => a - b);
}

export function nextFreeSlots(ctx: SlotContext, from: Date, count: number): SlotSuggestion[] {
  const { rules, dailyCap } = ctx;
  const out: SlotSuggestion[] = [];
  const perDay = effectivePerDay(rules, dailyCap);
  const slots = sortedSlots(rules);
  if (perDay <= 0 || slots.length === 0 || rules.weekdays.length === 0 || count <= 0) return out;

  const tz = rules.timezone;
  const lead = (ctx.leadMinutes ?? DEFAULT_LEAD_MINUTES) * MINUTE;
  const gap = Math.max(0, rules.minGapMinutes) * MINUTE;
  const taken = ctx.occupied.map((d) => d.getTime());
  const pausedMs = ctx.pausedUntil ? ctx.pausedUntil.getTime() : 0;
  const earliest = Math.max(from.getTime() + lead, pausedMs);
  const pausedPush = pausedMs > from.getTime() + lead;

  let reason: SlotReason = pausedPush ? 'paused_moved' : 'nearest';
  const base = localParts(from, tz);

  for (let i = 0; i < HORIZON_DAYS && out.length < count; i++) {
    const { start, end, weekday } = localDayStart(from, tz, i);
    if (!rules.weekdays.includes(weekday)) {
      if (out.length === 0 && reason === 'nearest') reason = 'weekday_moved';
      continue;
    }
    let usedToday = taken.filter((t) => t >= start.getTime() && t < end.getTime()).length;
    if (usedToday >= perDay) {
      if (out.length === 0 && reason === 'nearest') reason = 'cap_moved';
      continue;
    }
    for (const minutes of slots) {
      if (out.length >= count || usedToday >= perDay) break;
      const at = zonedTime(tz, base.year, base.month, base.day + i, minutes);
      const t = at.getTime();
      if (t < earliest) continue;
      if (taken.some((x) => Math.abs(x - t) < Math.max(gap, MINUTE))) {
        if (out.length === 0 && reason === 'nearest') reason = 'gap_moved';
        continue;
      }
      out.push({ at, reason: out.length === 0 ? reason : 'nearest' });
      taken.push(t);
      usedToday++;
    }
    if (out.length === 0 && usedToday >= perDay && reason === 'nearest') reason = 'cap_moved';
  }
  return out;
}

export type ManualTimeProblem = 'past' | 'too_soon' | 'gap' | 'cap' | 'paused' | 'horizon';

/** Can a video go out exactly at `at`? Returns the reason it cannot, or null. */
export function checkManualTime(ctx: SlotContext, at: Date, now: Date): ManualTimeProblem | null {
  const t = at.getTime();
  if (Number.isNaN(t) || t <= now.getTime()) return 'past';
  if (t < now.getTime() + (ctx.leadMinutes ?? DEFAULT_LEAD_MINUTES) * MINUTE) return 'too_soon';
  if (t > now.getTime() + 366 * DAY) return 'horizon';
  if (ctx.pausedUntil && t < ctx.pausedUntil.getTime()) return 'paused';
  const gap = Math.max(0, ctx.rules.minGapMinutes) * MINUTE;
  const taken = ctx.occupied.map((d) => d.getTime());
  if (gap > 0 && taken.some((x) => Math.abs(x - t) < gap)) return 'gap';
  const { start, end } = localDayStart(at, ctx.rules.timezone, 0);
  const usedThatDay = taken.filter((x) => x >= start.getTime() && x < end.getTime()).length;
  if (usedThatDay >= Math.min(ctx.dailyCap, 24)) return 'cap';
  return null;
}

/** How many of `occupied` fall on the local day of `at`. */
export function usedOnDay(occupied: Date[], at: Date, tz: string): number {
  const { start, end } = localDayStart(at, tz, 0);
  return occupied.filter((d) => d.getTime() >= start.getTime() && d.getTime() < end.getTime()).length;
}
