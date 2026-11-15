/**
 * Time-zone math for the autopost planner.
 *
 * The server runs in UTC while channel slots are wall-clock times in the
 * channel's IANA time zone ('Asia/Almaty', 'Europe/Moscow', ...). These
 * helpers convert between the two with Intl only, no dependencies.
 */

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(tz, f);
  }
  return f;
}

/** True when `tz` is a time zone this runtime understands. */
export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || tz.length === 0 || tz.length > 64) return false;
  try {
    formatter(tz);
    return true;
  } catch {
    return false;
  }
}

export function safeTimeZone(tz: unknown): string {
  return isValidTimeZone(tz) ? tz : 'UTC';
}

export interface LocalParts {
  year: number;
  /** 0..11 */
  month: number;
  day: number;
  /** Minutes since local midnight. */
  minutes: number;
  /** 0 = Monday ... 6 = Sunday. */
  weekday: number;
}

/** Wall-clock parts of an instant in `tz`. */
export function localParts(at: Date, tz: string): LocalParts {
  const parts = formatter(tz).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const year = get('year');
  const month = get('month') - 1;
  const day = get('day');
  const weekday = (new Date(Date.UTC(year, month, day)).getUTCDay() + 6) % 7;
  return { year, month, day, minutes: (get('hour') % 24) * 60 + get('minute'), weekday };
}

/** Offset of `tz` from UTC at the instant `at`, in minutes (local minus UTC). */
export function offsetMinutes(at: Date, tz: string): number {
  const parts = formatter(tz).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / MINUTE);
}

/**
 * The instant when the wall clock in `tz` shows the given date and minute of
 * the day. `day` may overflow (32 = next month), like Date.UTC.
 * In a spring-forward gap the result lands just after the gap.
 */
export function zonedTime(tz: string, year: number, month: number, day: number, minutes: number): Date {
  const guess = Date.UTC(year, month, day, 0, minutes);
  const first = offsetMinutes(new Date(guess), tz);
  let t = guess - first * MINUTE;
  const second = offsetMinutes(new Date(t), tz);
  if (second !== first) t = guess - second * MINUTE;
  return new Date(t);
}

/** Local midnight of the day `offsetDays` after the local day of `at`. */
export function localDayStart(at: Date, tz: string, offsetDays = 0): { start: Date; end: Date; weekday: number } {
  const p = localParts(at, tz);
  const start = zonedTime(tz, p.year, p.month, p.day + offsetDays, 0);
  const end = zonedTime(tz, p.year, p.month, p.day + offsetDays + 1, 0);
  const weekday = (new Date(Date.UTC(p.year, p.month, p.day + offsetDays)).getUTCDay() + 6) % 7;
  return { start, end, weekday };
}

/** 'HH:mm' to minutes since midnight, or null for a malformed value. */
export function slotToMinutes(slot: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(slot);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Normalised 'HH:mm' or null. */
export function normaliseSlot(slot: string): string | null {
  const minutes = slotToMinutes(slot.trim());
  if (minutes == null) return null;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
