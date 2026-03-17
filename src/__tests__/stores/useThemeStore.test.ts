import { describe, it, expect } from 'vitest';
import { useThemeStore } from '@/stores/useThemeStore';

describe('useThemeStore', () => {
  it('should start with dark theme', () => {
    const state = useThemeStore.getState();
    expect(state.isDark).toBe(true);
    expect(state.theme.bg).toBe('#06060b');
  });

  it('should toggle to light theme', () => {
    useThemeStore.getState().toggle();
    const state = useThemeStore.getState();
    expect(state.isDark).toBe(false);
    expect(state.theme.bg).toBe('#f3f3f7');
  });

  it('should toggle back to dark', () => {
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().isDark).toBe(true);
  });
});
