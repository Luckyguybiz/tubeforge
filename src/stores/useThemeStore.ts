import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dark, light } from '@/lib/constants';
import type { Theme } from '@/lib/types';


interface ThemeState {
  isDark: boolean;
  theme: Theme;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: true,
      theme: dark,
      toggle: () =>
        set((s) => ({
          isDark: !s.isDark,
          theme: s.isDark ? light : dark,
        })),
    }),
    {
      name: 'tubeforge-theme',
      partialize: (state) => ({ isDark: state.isDark }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.theme = state.isDark ? dark : light;
        }
      },
    }
  )
);

/**
 * Generic selector helper — subscribe to any slice of the theme store.
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
 * Селектор для получения конкретного цвета из текущей темы.
 * Рекомендуется использовать вместо `useThemeStore((s) => s.theme)`,
 * чтобы избежать лишних перерисовок компонентов при смене темы —
 * подписчик обновится только если значение конкретного цвета изменилось.
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
 * Селектор для получения текущего состояния тёмной темы.
 * Позволяет компонентам подписаться только на флаг isDark,
 * не перерисовываясь при изменении объекта theme.
 *
 * @example
 * ```tsx
 * const isDark = useIsDark();
 * ```
 */
export function useIsDark() {
  return useThemeStore((s) => s.isDark);
}
