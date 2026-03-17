import { describe, it, expect, vi, afterEach } from 'vitest';
import { uid, fmtTime, fmtDur, cn, pluralRu, timeAgo } from '@/lib/utils';

describe('uid', () => {
  it('should generate unique IDs', () => {
    const a = uid();
    const b = uid();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^id_/);
  });
});

describe('fmtTime', () => {
  it('should format seconds to M:SS', () => {
    expect(fmtTime(0)).toBe('0:00');
    expect(fmtTime(5)).toBe('0:05');
    expect(fmtTime(65)).toBe('1:05');
    expect(fmtTime(600)).toBe('10:00');
  });
});

describe('fmtDur', () => {
  it('returns seconds with "с" for < 60', () => {
    expect(fmtDur(0)).toBe('0с');
    expect(fmtDur(30)).toBe('30с');
    expect(fmtDur(59)).toBe('59с');
  });

  it('returns M:SS for >= 60', () => {
    expect(fmtDur(60)).toBe('1:00');
    expect(fmtDur(90)).toBe('1:30');
    expect(fmtDur(125)).toBe('2:05');
  });
});

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('a', 'b')).toBe('a b');
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });
});

describe('pluralRu', () => {
  const scene = (n: number) => pluralRu(n, 'сцена', 'сцены', 'сцен');

  it('returns "one" form for 1, 21, 31, etc.', () => {
    expect(scene(1)).toBe('1 сцена');
    expect(scene(21)).toBe('21 сцена');
    expect(scene(31)).toBe('31 сцена');
    expect(scene(101)).toBe('101 сцена');
  });

  it('returns "few" form for 2-4, 22-24, etc.', () => {
    expect(scene(2)).toBe('2 сцены');
    expect(scene(3)).toBe('3 сцены');
    expect(scene(4)).toBe('4 сцены');
    expect(scene(22)).toBe('22 сцены');
    expect(scene(34)).toBe('34 сцены');
  });

  it('returns "many" form for 5-20, 25-30, etc.', () => {
    expect(scene(0)).toBe('0 сцен');
    expect(scene(5)).toBe('5 сцен');
    expect(scene(10)).toBe('10 сцен');
    expect(scene(11)).toBe('11 сцен');
    expect(scene(12)).toBe('12 сцен');
    expect(scene(19)).toBe('19 сцен');
    expect(scene(20)).toBe('20 сцен');
    expect(scene(25)).toBe('25 сцен');
  });

  it('handles teens (11-14) as "many" form', () => {
    expect(scene(11)).toBe('11 сцен');
    expect(scene(12)).toBe('12 сцен');
    expect(scene(13)).toBe('13 сцен');
    expect(scene(14)).toBe('14 сцен');
    expect(scene(111)).toBe('111 сцен');
    expect(scene(212)).toBe('212 сцен');
  });

  it('handles negative numbers', () => {
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

describe('timeAgo', () => {
  afterEach(() => vi.useRealTimers());

  it('returns "только что" for < 1 min ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T12:00:30Z'));
    expect(timeAgo('2025-06-01T12:00:00Z')).toBe('только что');
  });

  it('returns minutes for < 1 hour ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T12:10:00Z'));
    expect(timeAgo('2025-06-01T12:00:00Z')).toBe('10 мин назад');
  });

  it('returns hours for < 24 hours ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T15:00:00Z'));
    expect(timeAgo('2025-06-01T12:00:00Z')).toBe('3 ч назад');
  });

  it('returns days for >= 24 hours ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-03T12:00:00Z'));
    expect(timeAgo('2025-06-01T12:00:00Z')).toBe('2 д назад');
  });

  it('accepts Date objects', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T12:05:00Z'));
    expect(timeAgo(new Date('2025-06-01T12:00:00Z'))).toBe('5 мин назад');
  });
});
