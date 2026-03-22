'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ── LocalStorage streak tracking ─────────────────────── */

const LS_KEY = 'tf-streak';

interface StreakData {
  lastDate: string; // ISO date string YYYY-MM-DD
  count: number;
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function loadStreak(): StreakData | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StreakData;
  } catch {
    return null;
  }
}

function updateStreak(): number {
  const today = getTodayStr();
  const yesterday = getYesterdayStr();
  const existing = loadStreak();

  if (!existing) {
    // First visit ever
    const data: StreakData = { lastDate: today, count: 1 };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    return 1;
  }

  if (existing.lastDate === today) {
    // Already visited today
    return existing.count;
  }

  if (existing.lastDate === yesterday) {
    // Visited yesterday — increment streak
    const data: StreakData = { lastDate: today, count: existing.count + 1 };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    return data.count;
  }

  // Streak broken — reset to 1
  const data: StreakData = { lastDate: today, count: 1 };
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  return 1;
}

/* ── Component ─────────────────────────────────────────── */

export function ActivityStreak() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const count = updateStreak();
    setStreak(count);
  }, []);

  // Don't show if streak is less than 2 days
  if (streak < 2) return null;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 14px',
      borderRadius: 10,
      background: `${C.orange ?? '#f59e0b'}14`,
      border: `1px solid ${C.orange ?? '#f59e0b'}25`,
    }}>
      <span style={{ fontSize: 16 }}>{'\uD83D\uDD25'}</span>
      <span style={{
        fontSize: 13,
        fontWeight: 700,
        color: C.orange ?? '#f59e0b',
        letterSpacing: '-.01em',
      }}>
        {streak} {streak < 5 ? t('streak.daysShort') : t('streak.daysLong')} {t('streak.inARow')}
      </span>
    </div>
  );
}
