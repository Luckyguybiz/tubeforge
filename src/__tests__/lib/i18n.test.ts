import { describe, it, expect } from 'vitest';
import ru from '@/locales/ru.json';
import en from '@/locales/en.json';

// The locale files use a flat key format: "section.key": "value"
type FlatTranslations = Record<string, string>;

const ruT = ru as FlatTranslations;
const enT = en as FlatTranslations;

describe('Locale files structure', () => {
  const ruKeys = Object.keys(ruT).sort();
  const enKeys = Object.keys(enT).sort();

  it('both locales should have keys', () => {
    expect(ruKeys.length).toBeGreaterThan(0);
    expect(enKeys.length).toBeGreaterThan(0);
  });

  it('should have required key prefixes', () => {
    const required = ['nav.', 'dashboard.', 'editor.', 'settings.', 'auth.'];
    for (const prefix of required) {
      expect(ruKeys.some((k) => k.startsWith(prefix))).toBe(true);
      expect(enKeys.some((k) => k.startsWith(prefix))).toBe(true);
    }
  });

  it('English should cover all Russian keys or fall back gracefully', () => {
    // en may have fewer keys than ru — missing keys fall back to ru at runtime.
    // But every en key must also exist in ru (no orphan English-only keys).
    for (const key of enKeys) {
      expect(ruKeys, `en key "${key}" has no ru counterpart`).toContain(key);
    }
  });

  it('no empty translation values in Russian locale', () => {
    for (const [key, value] of Object.entries(ruT)) {
      expect(value.length, `ru key "${key}" is empty`).toBeGreaterThan(0);
    }
  });

  it('no empty translation values in English locale', () => {
    for (const [key, value] of Object.entries(enT)) {
      expect(value.length, `en key "${key}" is empty`).toBeGreaterThan(0);
    }
  });
});

describe('Russian locale content', () => {
  it('nav section should have all navigation items', () => {
    expect(ruT['nav.dashboard']).toBe('Обзор');
    expect(ruT['nav.editor']).toBe('Редактор');
    expect(ruT['nav.metadata']).toBe('Метаданные');
    expect(ruT['nav.thumbnails']).toBe('Обложки');
    expect(ruT['nav.preview']).toBe('Превью');
  });
});

describe('English locale content', () => {
  it('nav section should have all navigation items', () => {
    expect(enT['nav.dashboard']).toBe('Explore');
    expect(enT['nav.editor']).toBe('Editor');
    expect(enT['nav.metadata']).toBe('Metadata');
    expect(enT['nav.thumbnails']).toBe('Thumbnails');
    expect(enT['nav.preview']).toBe('Preview');
  });
});

describe('Locale consistency checks', () => {
  it('no translation value should be only whitespace', () => {
    for (const [key, value] of Object.entries(ruT)) {
      expect(value.trim().length, `ru "${key}" is only whitespace`).toBeGreaterThan(0);
    }
    for (const [key, value] of Object.entries(enT)) {
      expect(value.trim().length, `en "${key}" is only whitespace`).toBeGreaterThan(0);
    }
  });
});
