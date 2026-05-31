import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dark, light } from '@/lib/constants';
import type { Theme } from '@/lib/types';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeState {
  mode: ThemeMode;
  /** Resolved actual theme -- always dark or light (never system) */
  isDark: boolean;
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  /** Legacy toggle: cycles dark -> light -> system -> dark */
  toggle: () => void;
}

/** Resolve system preference to dark/light */
function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Resolve a mode to isDark boolean */
function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'system') return getSystemPrefersDark();
  return mode === 'dark';
}

/**
 * Sync resolved theme to DOM attributes + body inline style.
 *
 * BugHunt 2026-05-19: Theme toggle previously only updated JS state (zustand
 * store) — useThemeStore.theme. But Tailwind classes like `text-foreground`
 * and `bg-card` resolve via CSS vars defined in globals.css under
 * `[data-theme="light"]` selector. Without this DOM sync, JS state and
 * CSS vars desynced after every toggle → headings became invisible on light
 * theme (text-foreground stayed dark-mode-white).
 *
 * Also writes body inline bg/color for FOUC-free initial paint (matches
 * the inline script in src/app/layout.tsx that runs before hydration).
 */
function syncThemeToDOM(isDark: boolean): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  if (document.body) {
    document.body.style.backgroundColor = isDark ? '#0a0a0a' : '#f5f5f7';
    document.body.style.color = isDark ? '#ffffff' : '#1a1a1a';
  }
}

const CYCLE: ThemeMode[] = ['dark', 'light', 'system'];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      isDark: true,
      theme: dark,
      setMode: (mode) => {
        const resolved = resolveIsDark(mode);
        syncThemeToDOM(resolved);
        set({ mode, isDark: resolved, theme: resolved ? dark : light });
      },
      toggle: () => {
        const current = get().mode;
        const idx = CYCLE.indexOf(current);
        const next = CYCLE[(idx + 1) % CYCLE.length]!;
        const resolved = resolveIsDark(next);
        syncThemeToDOM(resolved);
        set({ mode: next, isDark: resolved, theme: resolved ? dark : light });
      },
    }),
    {
      name: 'tubeforge-theme',
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = resolveIsDark(state.mode);
          syncThemeToDOM(resolved);
          state.isDark = resolved;
          state.theme = resolved ? dark : light;
        }
      },
    }
  )
);

// Listen for system preference changes and update if in 'system' mode
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    const { mode } = useThemeStore.getState();
    if (mode === 'system') {
      const resolved = getSystemPrefersDark();
      syncThemeToDOM(resolved);
      useThemeStore.setState({
        isDark: resolved,
        theme: resolved ? dark : light,
      });
    }
  };
  if (mql.addEventListener) {
    mql.addEventListener('change', handler);
  } else if (mql.addListener) {
    mql.addListener(handler);
  }
}

/**
 * Generic selector helper -- subscribe to any slice of the theme store.
 * Components re-render only when the selected value changes (shallow equality).
 *
 * @example
 * ```tsx
 * const isDark = useThemeValue((s) => s.isDark);
 * const bg = useThemeValue((s) => s.theme.bg);
 * ```
 */
export const useThemeValue = <T>(selector: (state: ThemeState) => T): T =>
  useThemeStore(selector);

/**
 * Selector for a specific color from the current theme.
 * Prefer this over `useThemeStore((s) => s.theme)` to avoid
 * unnecessary re-renders -- the subscriber only updates if
 * the specific color value changes.
 *
 * @example
 * ```tsx
 * const bg = useThemeColor('bg');
 * const accent = useThemeColor('accent');
 * ```
 */
export function useThemeColor<K extends keyof Theme>(key: K) {
  return useThemeStore((s) => s.theme[key]);
}

/**
 * Selector for the current dark-mode boolean.
 * Subscribes only to isDark, not the full theme object.
 *
 * @example
 * ```tsx
 * const isDark = useIsDark();
 * ```
 */
export function useIsDark() {
  return useThemeStore((s) => s.isDark);
}
