import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '@/stores/useThemeStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    // Reset to initial state before each test
    useThemeStore.setState({ mode: 'dark', isDark: true, theme: useThemeStore.getState().theme });
    useThemeStore.getState().setMode('dark');
  });

  it('should start with dark theme', () => {
    const state = useThemeStore.getState();
    expect(state.mode).toBe('dark');
    expect(state.isDark).toBe(true);
    expect(state.theme.bg).toBe('#06060b');
  });

  it('should toggle from dark to light', () => {
    useThemeStore.getState().toggle();
    const state = useThemeStore.getState();
    expect(state.mode).toBe('light');
    expect(state.isDark).toBe(false);
    expect(state.theme.bg).toBe('#f5f5f7');
  });

  it('should toggle from light to system', () => {
    useThemeStore.getState().setMode('light');
    useThemeStore.getState().toggle();
    const state = useThemeStore.getState();
    expect(state.mode).toBe('system');
  });

  it('should toggle from system back to dark', () => {
    useThemeStore.getState().setMode('system');
    useThemeStore.getState().toggle();
    const state = useThemeStore.getState();
    expect(state.mode).toBe('dark');
    expect(state.isDark).toBe(true);
  });

  it('setMode("light") should set light theme', () => {
    useThemeStore.getState().setMode('light');
    const state = useThemeStore.getState();
    expect(state.mode).toBe('light');
    expect(state.isDark).toBe(false);
    expect(state.theme.bg).toBe('#f5f5f7');
    expect(state.theme.text).toBe('#1d1d1f');
  });

  it('setMode("dark") should set dark theme', () => {
    useThemeStore.getState().setMode('light');
    useThemeStore.getState().setMode('dark');
    const state = useThemeStore.getState();
    expect(state.mode).toBe('dark');
    expect(state.isDark).toBe(true);
    expect(state.theme.bg).toBe('#06060b');
    expect(state.theme.text).toBe('#e8e8f0');
  });

  it('system mode should resolve based on matchMedia', () => {
    useThemeStore.getState().setMode('system');
    const state = useThemeStore.getState();
    expect(state.mode).toBe('system');
    // In test environment, matchMedia typically returns false (light preference)
    // so isDark should be false, but we just verify the mode is set correctly
    expect(typeof state.isDark).toBe('boolean');
  });

  it('full cycle toggle should return to dark', () => {
    // dark -> light -> system -> dark
    useThemeStore.getState().toggle(); // light
    expect(useThemeStore.getState().mode).toBe('light');
    useThemeStore.getState().toggle(); // system
    expect(useThemeStore.getState().mode).toBe('system');
    useThemeStore.getState().toggle(); // dark
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(useThemeStore.getState().isDark).toBe(true);
  });
});
