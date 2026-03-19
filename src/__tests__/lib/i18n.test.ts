import { describe, it, expect } from 'vitest';
import ru from '@/locales/ru.json';
import en from '@/locales/en.json';

// Since i18n.ts is a side-effect-heavy module (initializes i18next),
// we test the locale files directly and configuration requirements.

describe('Locale files structure', () => {
  const ruKeys = Object.keys(ru).sort();
  const enKeys = Object.keys(en).sort();

  it('both locales should have the same top-level sections', () => {
    expect(ruKeys).toEqual(enKeys);
  });

  it('should have required sections', () => {
    const required = ['nav', 'dashboard', 'metadata', 'thumbnails', 'editor', 'preview', 'auth', 'pricing', 'settings', 'uploads', 'common'];
    for (const section of required) {
      expect(ruKeys).toContain(section);
      expect(enKeys).toContain(section);
    }
  });

  it('each section should have matching keys between locales', () => {
    for (const section of ruKeys) {
      const ruSection = (ru as Record<string, Record<string, string>>)[section];
      const enSection = (en as Record<string, Record<string, string>>)[section];
      const ruSectionKeys = Object.keys(ruSection).sort();
      const enSectionKeys = Object.keys(enSection).sort();
      expect(ruSectionKeys).toEqual(enSectionKeys);
    }
  });

  it('no empty translation values in Russian locale', () => {
    for (const section of Object.values(ru as Record<string, Record<string, string>>)) {
      for (const [key, value] of Object.entries(section)) {
        expect(value.length, `ru key "${key}" is empty`).toBeGreaterThan(0);
      }
    }
  });

  it('no empty translation values in English locale', () => {
    for (const section of Object.values(en as Record<string, Record<string, string>>)) {
      for (const [key, value] of Object.entries(section)) {
        expect(value.length, `en key "${key}" is empty`).toBeGreaterThan(0);
      }
    }
  });
});

describe('Russian locale content', () => {
  it('nav section should have all navigation items', () => {
    const nav = (ru as Record<string, Record<string, string>>).nav;
    expect(nav.dashboard).toBe('Дашборд');
    expect(nav.editor).toBe('Редактор');
    expect(nav.metadata).toBe('Метаданные');
    expect(nav.thumbnails).toBe('Обложки');
    expect(nav.preview).toBe('Превью');
  });

  it('common section should have essential UI strings', () => {
    const common = (ru as Record<string, Record<string, string>>).common;
    expect(common.save).toBeTruthy();
    expect(common.cancel).toBeTruthy();
    expect(common.delete).toBeTruthy();
    expect(common.loading).toBeTruthy();
    expect(common.error).toBeTruthy();
  });
});

describe('English locale content', () => {
  it('nav section should have all navigation items', () => {
    const nav = (en as Record<string, Record<string, string>>).nav;
    expect(nav.dashboard).toBe('Dashboard');
    expect(nav.editor).toBe('Editor');
    expect(nav.metadata).toBe('Metadata');
    expect(nav.thumbnails).toBe('Thumbnails');
    expect(nav.preview).toBe('Preview');
  });

  it('common section should have essential UI strings', () => {
    const common = (en as Record<string, Record<string, string>>).common;
    expect(common.save).toBe('Save');
    expect(common.cancel).toBe('Cancel');
    expect(common.delete).toBe('Delete');
    expect(common.loading).toBe('Loading...');
    expect(common.error).toBe('Error');
  });
});

describe('Locale consistency checks', () => {
  it('no values should be identical between ru and en (catch untranslated)', () => {
    // Some values like "Pro", "Studio", "CTR" may be the same — allow those
    const allowedSame = new Set(['Pro', 'Studio', 'CTR', 'Free', 'YouTube', '/мес', '/mo']);
    let identicalCount = 0;
    const totalCount = { value: 0 };

    for (const section of Object.keys(ru as Record<string, Record<string, string>>)) {
      const ruSection = (ru as Record<string, Record<string, string>>)[section];
      const enSection = (en as Record<string, Record<string, string>>)[section];
      for (const key of Object.keys(ruSection)) {
        totalCount.value++;
        if (ruSection[key] === enSection[key] && !allowedSame.has(ruSection[key])) {
          identicalCount++;
        }
      }
    }

    // Less than 15% of translations should be identical (some values like proper nouns, URLs are intentionally the same)
    expect(identicalCount / totalCount.value).toBeLessThan(0.15);
  });

  it('all string values should be trimmed (no leading/trailing whitespace)', () => {
    for (const section of Object.values(ru as Record<string, Record<string, string>>)) {
      for (const [key, value] of Object.entries(section)) {
        expect(value, `ru "${key}" has whitespace`).toBe(value.trim());
      }
    }
    for (const section of Object.values(en as Record<string, Record<string, string>>)) {
      for (const [key, value] of Object.entries(section)) {
        expect(value, `en "${key}" has whitespace`).toBe(value.trim());
      }
    }
  });
});
