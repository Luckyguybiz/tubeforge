// @vitest-environment node
/**
 * Autopost planner math: time zones, slot picking, manual time checks.
 */
import { describe, expect, it } from 'vitest';
import { localDayStart, localParts, normaliseSlot, offsetMinutes, safeTimeZone, zonedTime } from '@/lib/autopost/time';
import { checkManualTime, nextFreeSlots, type Rules } from '@/lib/autopost/slots';

const almaty: Rules = {
  slotTimes: ['12:00', '18:00'],
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  postsPerDay: 2,
  minGapMinutes: 120,
  timezone: 'Asia/Almaty',
};

describe('time zones', () => {
  it('converts a wall-clock time to UTC', () => {
    // Almaty is UTC+5 since March 2024.
    expect(zonedTime('Asia/Almaty', 2026, 10, 16, 12 * 60).toISOString()).toBe('2026-11-16T07:00:00.000Z');
    expect(zonedTime('Europe/Moscow', 2026, 10, 16, 0).toISOString()).toBe('2026-11-15T21:00:00.000Z');
  });

  it('handles daylight saving switches', () => {
    // Berlin: CET in January (UTC+1), CEST in July (UTC+2).
    expect(zonedTime('Europe/Berlin', 2026, 0, 10, 9 * 60).toISOString()).toBe('2026-01-10T08:00:00.000Z');
    expect(zonedTime('Europe/Berlin', 2026, 6, 10, 9 * 60).toISOString()).toBe('2026-07-10T07:00:00.000Z');
    expect(offsetMinutes(new Date('2026-07-10T07:00:00Z'), 'Europe/Berlin')).toBe(120);
  });

  it('reports local parts and weekday (0 = Monday)', () => {
    // 2026-11-15 20:30 UTC is Monday 01:30 in Almaty.
    const p = localParts(new Date('2026-11-15T20:30:00Z'), 'Asia/Almaty');
    expect(p).toMatchObject({ year: 2026, month: 10, day: 16, minutes: 90, weekday: 0 });
    const day = localDayStart(new Date('2026-11-15T20:30:00Z'), 'Asia/Almaty');
    expect(day.start.toISOString()).toBe('2026-11-15T19:00:00.000Z');
    expect(day.end.toISOString()).toBe('2026-11-16T19:00:00.000Z');
  });

  it('falls back to UTC for an unknown zone and normalises slots', () => {
    expect(safeTimeZone('Mars/Olympus')).toBe('UTC');
    expect(normaliseSlot('9:05')).toBe('09:05');
    expect(normaliseSlot('24:00')).toBeNull();
    expect(normaliseSlot('abc')).toBeNull();
  });
});

describe('nextFreeSlots', () => {
  const now = new Date('2026-11-16T05:00:00Z'); // 10:00 in Almaty, Monday

  it('takes the nearest slot of the channel zone', () => {
    const [first, second] = nextFreeSlots({ rules: almaty, dailyCap: 10, occupied: [] }, now, 2);
    expect(first.at.toISOString()).toBe('2026-11-16T07:00:00.000Z');
    expect(first.reason).toBe('nearest');
    expect(second.at.toISOString()).toBe('2026-11-16T13:00:00.000Z');
  });

  it('moves past a full day and says why', () => {
    const occupied = [new Date('2026-11-16T07:00:00Z'), new Date('2026-11-16T13:00:00Z')];
    const [slot] = nextFreeSlots({ rules: almaty, dailyCap: 10, occupied }, now, 1);
    expect(slot.at.toISOString()).toBe('2026-11-17T07:00:00.000Z');
    expect(slot.reason).toBe('cap_moved');
  });

  it('respects weekdays, gaps and the pause', () => {
    const weekend: Rules = { ...almaty, weekdays: [5, 6] };
    const [w] = nextFreeSlots({ rules: weekend, dailyCap: 10, occupied: [] }, now, 1);
    expect(w.at.toISOString()).toBe('2026-11-21T07:00:00.000Z'); // Saturday
    expect(w.reason).toBe('weekday_moved');

    const [g] = nextFreeSlots({ rules: almaty, dailyCap: 10, occupied: [new Date('2026-11-16T07:30:00Z')] }, now, 1);
    expect(g.at.toISOString()).toBe('2026-11-16T13:00:00.000Z');
    expect(g.reason).toBe('gap_moved');

    const pausedUntil = new Date('2026-11-18T00:00:00Z');
    const [p] = nextFreeSlots({ rules: almaty, dailyCap: 10, occupied: [], pausedUntil }, now, 1);
    expect(p.at.toISOString()).toBe('2026-11-18T07:00:00.000Z');
    expect(p.reason).toBe('paused_moved');
  });

  it('keeps the protection ceiling and returns nothing without slots', () => {
    const many: Rules = { ...almaty, slotTimes: ['12:00', '14:00', '16:00', '18:00'], postsPerDay: 4 };
    const slots = nextFreeSlots({ rules: many, dailyCap: 2, occupied: [] }, now, 3);
    expect(slots.map((s) => s.at.toISOString())).toEqual([
      '2026-11-16T07:00:00.000Z',
      '2026-11-16T09:00:00.000Z',
      '2026-11-17T07:00:00.000Z',
    ]);
    expect(nextFreeSlots({ rules: { ...almaty, slotTimes: [] }, dailyCap: 10, occupied: [] }, now, 1)).toEqual([]);
  });
});

describe('checkManualTime', () => {
  const now = new Date('2026-11-16T05:00:00Z');
  const ctx = { rules: almaty, dailyCap: 2, occupied: [new Date('2026-11-17T07:00:00Z'), new Date('2026-11-17T13:00:00Z')] };

  it('accepts a free time and explains refusals', () => {
    expect(checkManualTime(ctx, new Date('2026-11-16T10:00:00Z'), now)).toBeNull();
    expect(checkManualTime(ctx, new Date('2026-11-16T04:00:00Z'), now)).toBe('past');
    expect(checkManualTime(ctx, new Date('2026-11-16T05:05:00Z'), now)).toBe('too_soon');
    expect(checkManualTime(ctx, new Date('2026-11-17T08:00:00Z'), now)).toBe('gap');
    expect(checkManualTime(ctx, new Date('2026-11-17T17:00:00Z'), now)).toBe('cap');
    expect(checkManualTime({ ...ctx, pausedUntil: new Date('2026-11-20T00:00:00Z') }, new Date('2026-11-19T10:00:00Z'), now)).toBe(
      'paused',
    );
    expect(checkManualTime(ctx, new Date('2028-01-01T00:00:00Z'), now)).toBe('horizon');
  });
});
