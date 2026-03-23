// @vitest-environment node
/**
 * Tests for the thumbnail templates library.
 *
 * Imports the actual THUMBNAIL_TEMPLATES and TEMPLATE_CATEGORIES from
 * src/lib/thumbnail-templates.ts and validates structure/integrity.
 */
import { describe, it, expect } from 'vitest';
import {
  THUMBNAIL_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type TemplateCategory,
  type ThumbnailTemplate,
} from '@/lib/thumbnail-templates';

/* ── Helper: filter templates by category (mirrors common UI usage) ── */

function getTemplatesByCategory(category: TemplateCategory): ThumbnailTemplate[] {
  return THUMBNAIL_TEMPLATES.filter((t) => t.category === category);
}

/* ── Tests ─────────────────────────────────────────────────────── */

describe('thumbnail templates', () => {
  it('has at least 20 templates', () => {
    expect(THUMBNAIL_TEMPLATES.length).toBeGreaterThanOrEqual(20);
  });

  it('all templates have required fields', () => {
    for (const tpl of THUMBNAIL_TEMPLATES) {
      expect(tpl.id).toBeDefined();
      expect(typeof tpl.id).toBe('string');
      expect(tpl.id.length).toBeGreaterThan(0);

      expect(tpl.name).toBeDefined();
      expect(typeof tpl.name).toBe('string');
      expect(tpl.name.length).toBeGreaterThan(0);

      expect(tpl.category).toBeDefined();
      expect(typeof tpl.category).toBe('string');

      expect(tpl.preview).toBeDefined();
      expect(tpl.preview.bg).toBeDefined();
      expect(tpl.preview.elements).toBeInstanceOf(Array);

      expect(tpl.canvasBg).toBeDefined();
      expect(typeof tpl.canvasBg).toBe('string');

      expect(tpl.elements).toBeDefined();
      expect(tpl.elements).toBeInstanceOf(Array);
      expect(tpl.elements.length).toBeGreaterThan(0);
    }
  });

  it('each template has valid category', () => {
    const validCategories = TEMPLATE_CATEGORIES.map((c) => c.id);

    for (const tpl of THUMBNAIL_TEMPLATES) {
      expect(validCategories).toContain(tpl.category);
    }
  });

  it('getTemplatesByCategory filters correctly', () => {
    const validCategories = TEMPLATE_CATEGORIES.map((c) => c.id);

    // Each category should return only templates of that category
    for (const cat of validCategories) {
      const filtered = getTemplatesByCategory(cat);
      for (const tpl of filtered) {
        expect(tpl.category).toBe(cat);
      }
    }

    // Gaming templates should exist
    const gaming = getTemplatesByCategory('gaming');
    expect(gaming.length).toBeGreaterThan(0);

    // All gaming templates should have category 'gaming'
    gaming.forEach((tpl) => expect(tpl.category).toBe('gaming'));

    // Filtering should return a subset
    expect(gaming.length).toBeLessThan(THUMBNAIL_TEMPLATES.length);
  });

  it('all template ids are unique', () => {
    const ids = THUMBNAIL_TEMPLATES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('TEMPLATE_CATEGORIES has all expected categories', () => {
    const categoryIds = TEMPLATE_CATEGORIES.map((c) => c.id);

    expect(categoryIds).toContain('gaming');
    expect(categoryIds).toContain('vlog');
    expect(categoryIds).toContain('tutorial');
    expect(categoryIds).toContain('review');
    expect(categoryIds).toContain('news');
    expect(categoryIds).toContain('minimal');
    expect(categoryIds).toContain('bold');
  });

  it('TEMPLATE_CATEGORIES entries have label and icon', () => {
    for (const cat of TEMPLATE_CATEGORIES) {
      expect(cat.id).toBeDefined();
      expect(cat.label).toBeDefined();
      expect(typeof cat.label).toBe('string');
      expect(cat.label.length).toBeGreaterThan(0);
      expect(cat.icon).toBeDefined();
      expect(typeof cat.icon).toBe('string');
    }
  });

  it('every category has at least one template', () => {
    const validCategories = TEMPLATE_CATEGORIES.map((c) => c.id);

    for (const cat of validCategories) {
      const filtered = getTemplatesByCategory(cat);
      expect(filtered.length).toBeGreaterThan(0);
    }
  });

  it('template elements have valid type field', () => {
    const validTypes = ['text', 'rect', 'circle', 'image', 'line'];

    for (const tpl of THUMBNAIL_TEMPLATES) {
      for (const el of tpl.elements) {
        expect(validTypes).toContain(el.type);
      }
    }
  });

  it('text elements have required text properties', () => {
    for (const tpl of THUMBNAIL_TEMPLATES) {
      for (const el of tpl.elements) {
        if (el.type === 'text') {
          expect(el.text).toBeDefined();
          expect(typeof el.text).toBe('string');
          expect(el.font).toBeDefined();
          expect(typeof el.font).toBe('string');
          expect(el.size).toBeDefined();
          expect(typeof el.size).toBe('number');
          expect(el.size).toBeGreaterThan(0);
        }
      }
    }
  });

  it('all elements have position and dimension fields', () => {
    for (const tpl of THUMBNAIL_TEMPLATES) {
      for (const el of tpl.elements) {
        expect(typeof el.x).toBe('number');
        expect(typeof el.y).toBe('number');
        expect(typeof el.w).toBe('number');
        expect(typeof el.h).toBe('number');
      }
    }
  });
});
