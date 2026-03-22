import { describe, it, expect, vi, afterEach } from 'vitest';
import { uid, fmtTime, fmtDur, cn, pluralRu, timeAgo } from '@/lib/utils';

/* ── uid ─────────────────────────────────────────────────────── */

describe('uid', () => {
  it('generates a string starting with "id_"', () => {
    expect(uid()).toMatch(/^id_/);
  });

  it('has correct length (id_ + 24 hex = 27 chars)', () => {
    const id = uid();
    expect(id.length).toBe(27);
  });

  it('generates unique IDs across multiple calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => uid()));
    expect(ids.size).toBe(50);
  });

  it('contains only id_ prefix followed by alphanumeric characters', () => {
    const id = uid();
    expect(id).toMatch(/^id_[a-z0-9]+$/);
  });
});

/* ── fmtTime ─────────────────────────────────────────────────── */

describe('fmtTime', () => {
  it('formats 0 seconds as "0:00"', () => {
    expect(fmtTime(0)).toBe('0:00');
  });

  it('formats 5 seconds as "0:05" (zero-padded)', () => {
    expect(fmtTime(5)).toBe('0:05');
  });

  it('formats 59 seconds as "0:59"', () => {
    expect(fmtTime(59)).toBe('0:59');
  });

  it('formats 60 seconds as "1:00"', () => {
    expect(fmtTime(60)).toBe('1:00');
  });

  it('formats 90 seconds as "1:30"', () => {
    expect(fmtTime(90)).toBe('1:30');
  });

  it('formats 3600 seconds as "60:00"', () => {
    expect(fmtTime(3600)).toBe('60:00');
  });

  it('formats 125 seconds as "2:05"', () => {
    expect(fmtTime(125)).toBe('2:05');
  });
});

/* ── fmtDur ──────────────────────────────────────────────────── */

describe('fmtDur', () => {
  it('uses seconds notation "s" for 0', () => {
    expect(fmtDur(0)).toBe('0s');
  });

  it('uses seconds notation for values under 60', () => {
    expect(fmtDur(1)).toBe('1s');
    expect(fmtDur(30)).toBe('30s');
    expect(fmtDur(59)).toBe('59s');
  });

  it('switches to time format at exactly 60', () => {
    expect(fmtDur(60)).toBe('1:00');
  });

  it('uses time format for values >= 60', () => {
    expect(fmtDur(90)).toBe('1:30');
    expect(fmtDur(125)).toBe('2:05');
    expect(fmtDur(600)).toBe('10:00');
  });
});

/* ── cn ──────────────────────────────────────────────────────── */

describe('cn', () => {
  it('merges multiple class name strings', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('filters out falsy values', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('');
  });

  it('handles undefined and null values', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });

  it('handles arrays of class names', () => {
    expect(cn(['a', 'b'])).toBe('a b');
  });
});

/* ── pluralRu ────────────────────────────────────────────────── */

describe('pluralRu', () => {
  const scene = (n: number) => pluralRu(n, 'сцена', 'сцены', 'сцен');

  it('returns "one" form for 1', () => {
    expect(scene(1)).toBe('1 сцена');
  });

  it('returns "few" form for 2', () => {
    expect(scene(2)).toBe('2 сцены');
  });

  it('returns "many" form for 5', () => {
    expect(scene(5)).toBe('5 сцен');
  });

  it('returns "many" form for 11 (teen exception)', () => {
    expect(scene(11)).toBe('11 сцен');
  });

  it('returns "many" form for 12, 13, 14 (teens)', () => {
    expect(scene(12)).toBe('12 сцен');
    expect(scene(13)).toBe('13 сцен');
    expect(scene(14)).toBe('14 сцен');
  });

  it('returns "one" form for 21, 31, 101', () => {
    expect(scene(21)).toBe('21 сцена');
    expect(scene(31)).toBe('31 сцена');
    expect(scene(101)).toBe('101 сцена');
  });

  it('returns "few" form for 22, 23, 24', () => {
    expect(scene(22)).toBe('22 сцены');
    expect(scene(23)).toBe('23 сцены');
    expect(scene(24)).toBe('24 сцены');
  });

  it('returns "many" form for 111, 212 (hundreds teens)', () => {
    expect(scene(111)).toBe('111 сцен');
    expect(scene(212)).toBe('212 сцен');
  });

  it('returns "many" form for 0', () => {
    expect(scene(0)).toBe('0 сцен');
  });

  it('handles negative numbers using absolute value for form selection', () => {
    expect(scene(-1)).toBe('-1 сцена');
    expect(scene(-5)).toBe('-5 сцен');
    expect(scene(-22)).toBe('-22 сцены');
  });

  it('works with different word sets', () => {
    const project = (n: number) => pluralRu(n, 'проект', 'проекта', 'проектов');
    expect(project(1)).toBe('1 проект');
    expect(project(3)).toBe('3 проекта');
    expect(project(7)).toBe('7 проектов');
  });
});

/* ── timeAgo ─────────────────────────────────────────────────── */

describe('timeAgo', () => {
  afterEach(() => vi.useRealTimers());

  it('returns "just now" for less than 1 minute ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T12:00:30Z'));
    expect(timeAgo('2025-06-01T12:00:00Z')).toBe('just now');
  });

  it('returns "just now" for 0 seconds ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T12:00:00Z'));
    expect(timeAgo('2025-06-01T12:00:00Z')).toBe('just now');
  });

  it('returns minutes for 1 minute ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T12:01:00Z'));
    expect(timeAgo('2025-06-01T12:00:00Z')).toBe('1m ago');
  });

  it('returns minutes for 59 minutes ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T12:59:00Z'));
    expect(timeAgo('2025-06-01T12:00:00Z')).toBe('59m ago');
  });

  it('returns hours for exactly 1 hour ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T13:00:00Z'));
    expect(timeAgo('2025-06-01T12:00:00Z')).toBe('1h ago');
  });

  it('returns hours for 23 hours ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-02T11:00:00Z'));
    expect(timeAgo('2025-06-01T12:00:00Z')).toBe('23h ago');
  });

  it('returns days for exactly 24 hours ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-02T12:00:00Z'));
    expect(timeAgo('2025-06-01T12:00:00Z')).toBe('1d ago');
  });

  it('returns days for multiple days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-08T12:00:00Z'));
    expect(timeAgo('2025-06-01T12:00:00Z')).toBe('7d ago');
  });

  it('accepts Date objects as input', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T12:05:00Z'));
    expect(timeAgo(new Date('2025-06-01T12:00:00Z'))).toBe('5m ago');
  });

  it('accepts ISO date strings as input', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T15:00:00Z'));
    expect(timeAgo('2025-06-01T12:00:00Z')).toBe('3h ago');
  });
});
