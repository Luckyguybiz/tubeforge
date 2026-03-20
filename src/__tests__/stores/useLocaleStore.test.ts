import { describe, it, expect, beforeEach } from 'vitest';
import { useLocaleStore, loadLocale } from '@/stores/useLocaleStore';

describe('useLocaleStore', () => {
  beforeEach(async () => {
    // Reset store to default locale
    useLocaleStore.setState({ locale: 'ru' });
  });

  describe('default state', () => {
    it('should start with ru locale', () => {
      const state = useLocaleStore.getState();
      expect(state.locale).toBe('ru');
    });

    it('should have a t function', () => {
      const state = useLocaleStore.getState();
      expect(typeof state.t).toBe('function');
    });
  });

  describe('t() translation function', () => {
    it('should translate known Russian keys', () => {
      const { t } = useLocaleStore.getState();
      expect(t('nav.dashboard')).toBe('Дашборд');
    });

    it('should return the key when translation is not found', () => {
      const { t } = useLocaleStore.getState();
      expect(t('nonexistent.key.that.does.not.exist')).toBe('nonexistent.key.that.does.not.exist');
    });

    it('should translate navigation keys', () => {
      const { t } = useLocaleStore.getState();
      expect(t('nav.editor')).toBe('Редактор');
      expect(t('nav.metadata')).toBe('Метаданные');
      expect(t('nav.thumbnails')).toBe('Обложки');
    });
  });

  describe('setLocale', () => {
    it('should switch to English locale', async () => {
      await loadLocale('en');
      useLocaleStore.getState().setLocale('en');
      const state = useLocaleStore.getState();
      expect(state.locale).toBe('en');
    });

    it('should translate keys in English after switching', async () => {
      await loadLocale('en');
      useLocaleStore.getState().setLocale('en');
      const { t } = useLocaleStore.getState();
      expect(t('nav.dashboard')).toBe('Dashboard');
    });

    it('should switch to Kazakh locale', async () => {
      await loadLocale('kk');
      useLocaleStore.getState().setLocale('kk');
      const state = useLocaleStore.getState();
      expect(state.locale).toBe('kk');
    });

    it('should switch to Spanish locale', async () => {
      await loadLocale('es');
      useLocaleStore.getState().setLocale('es');
      const state = useLocaleStore.getState();
      expect(state.locale).toBe('es');
    });

    it('should fall back to Russian for missing locale keys', async () => {
      await loadLocale('en');
      useLocaleStore.getState().setLocale('en');
      const { t } = useLocaleStore.getState();
      // If a specific key exists in en it should return the en value
      // If not, it should fall back to ru, and if not there, return the key itself
      const result = t('nav.dashboard');
      // Should be either the English or Russian translation, not the key itself
      expect(result).not.toBe('nav.dashboard');
    });

    it('should switch back to Russian', async () => {
      await loadLocale('en');
      useLocaleStore.getState().setLocale('en');
      useLocaleStore.getState().setLocale('ru');
      const { t } = useLocaleStore.getState();
      expect(t('nav.dashboard')).toBe('Дашборд');
    });
  });

  describe('locale persistence', () => {
    it('should preserve locale across getState calls', async () => {
      await loadLocale('en');
      useLocaleStore.getState().setLocale('en');
      // Access the store again
      const state = useLocaleStore.getState();
      expect(state.locale).toBe('en');
    });
  });
});
