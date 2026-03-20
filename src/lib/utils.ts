import { clsx, type ClassValue } from 'clsx';

/**
 * Generate a cryptographically secure unique ID suitable for filenames.
 * Uses crypto.getRandomValues() instead of Math.random() for security.
 */
export const uid = () => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return 'id_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

/** Short duration: "5с" for ≤59s, "1:30" for ≥60s */
export const fmtDur = (s: number) => (s < 60 ? `${s}с` : fmtTime(s));

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Russian plural forms helper.
 * Usage: pluralRu(5, 'сцена', 'сцены', 'сцен') → "5 сцен"
 */
export function pluralRu(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ${few}`;
  return `${n} ${many}`;
}

/**
 * Human-readable relative time in Russian.
 * "только что", "5 мин назад", "3 ч назад", "2 д назад"
 */
export function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  const days = Math.floor(hrs / 24);
  return `${days} д назад`;
}
