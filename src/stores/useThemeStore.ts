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
