import { describe, it, expect } from 'vitest';
import {
  CANVAS_W, CANVAS_H,
  CANVAS_DEFAULT_BG, CANVAS_DEFAULT_DRAW_COLOR, CANVAS_DEFAULT_DRAW_SIZE,
  CANVAS_ZOOM_MIN, CANVAS_ZOOM_MAX,
  STICKY_NOTE_COLOR, STICKY_NOTE_TEXT_COLOR, STICKY_NOTE_PRESETS,
  MAX_UPLOAD_SIZE,
  RATE_LIMIT_ERROR,
  GENERATION_TIMEOUT_MS, SCENE_SAVE_DEBOUNCE_MS, CANVAS_SAVE_DEBOUNCE_MS,
  SAVE_STATUS_RESET_MS, SEARCH_DEBOUNCE_MS,
  API_ENDPOINTS,
  Z_INDEX,
} from '@/lib/constants';

describe('Canvas dimension constants', () => {
  it('should have standard YouTube thumbnail dimensions', () => {
    expect(CANVAS_W).toBe(1280);
    expect(CANVAS_H).toBe(720);
    expect(CANVAS_W / CANVAS_H).toBeCloseTo(16 / 9, 1);
  });
});

describe('Canvas default constants', () => {
  it('should have valid hex color for background', () => {
    expect(CANVAS_DEFAULT_BG).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('should have valid hex color for draw color', () => {
    expect(CANVAS_DEFAULT_DRAW_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('should have reasonable draw size default', () => {
    expect(CANVAS_DEFAULT_DRAW_SIZE).toBeGreaterThanOrEqual(1);
    expect(CANVAS_DEFAULT_DRAW_SIZE).toBeLessThanOrEqual(12);
  });

  it('should have valid zoom range', () => {
    expect(CANVAS_ZOOM_MIN).toBeGreaterThan(0);
    expect(CANVAS_ZOOM_MAX).toBeGreaterThan(CANVAS_ZOOM_MIN);
    expect(CANVAS_ZOOM_MIN).toBeLessThanOrEqual(1);
    expect(CANVAS_ZOOM_MAX).toBeGreaterThanOrEqual(1);
  });
});

describe('Sticky note constants', () => {
  it('should have valid hex colors', () => {
    expect(STICKY_NOTE_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
    expect(STICKY_NOTE_TEXT_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('should have distinct background and text colors', () => {
    expect(STICKY_NOTE_COLOR).not.toBe(STICKY_NOTE_TEXT_COLOR);
  });

  it('should have preset colors that include the default', () => {
    expect(STICKY_NOTE_PRESETS).toContain(STICKY_NOTE_COLOR);
  });

  it('should have at least 4 preset colors', () => {
    expect(STICKY_NOTE_PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it('all presets should be valid hex colors', () => {
    for (const c of STICKY_NOTE_PRESETS) {
      expect(c).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('Upload constants', () => {
  it('should have a 10MB upload limit', () => {
    expect(MAX_UPLOAD_SIZE).toBe(10 * 1024 * 1024);
  });
});

describe('Error message constants', () => {
  it('should have non-empty rate limit error message', () => {
    expect(RATE_LIMIT_ERROR).toBeTruthy();
    expect(typeof RATE_LIMIT_ERROR).toBe('string');
    expect(RATE_LIMIT_ERROR.length).toBeGreaterThan(10);
  });
});

describe('Timing constants', () => {
  it('should have positive values', () => {
    expect(GENERATION_TIMEOUT_MS).toBeGreaterThan(0);
    expect(SCENE_SAVE_DEBOUNCE_MS).toBeGreaterThan(0);
    expect(CANVAS_SAVE_DEBOUNCE_MS).toBeGreaterThan(0);
    expect(SAVE_STATUS_RESET_MS).toBeGreaterThan(0);
    expect(SEARCH_DEBOUNCE_MS).toBeGreaterThan(0);
  });

  it('should have save debounce less than timeout', () => {
    expect(SCENE_SAVE_DEBOUNCE_MS).toBeLessThan(GENERATION_TIMEOUT_MS);
    expect(CANVAS_SAVE_DEBOUNCE_MS).toBeLessThan(GENERATION_TIMEOUT_MS);
  });
});

describe('API endpoint constants', () => {
  it('should have all required endpoint keys', () => {
    const requiredKeys = [
      'OPENAI_IMAGES', 'OPENAI_CHAT', 'ANTHROPIC_MESSAGES',
      'RUNWAY_VIDEO', 'GOOGLE_OAUTH_TOKEN',
      'YOUTUBE_CHANNELS', 'YOUTUBE_SEARCH', 'YOUTUBE_VIDEOS',
      'YOUTUBE_ANALYTICS', 'YOUTUBE_UPLOAD', 'RUNWAY_TASKS',
    ];
    for (const key of requiredKeys) {
      expect(API_ENDPOINTS).toHaveProperty(key);
    }
  });

  it('should have all endpoints as valid HTTPS URLs', () => {
    for (const [, url] of Object.entries(API_ENDPOINTS)) {
      expect(url).toMatch(/^https:\/\//);
    }
  });
});

describe('Z-Index constants', () => {
  it('should have all required layer keys', () => {
    const requiredKeys = [
      'CANVAS_ELEMENT', 'GUIDES', 'ZOOM_CONTROLS', 'TOOLBAR_POPOVER',
      'MODAL_BACKDROP', 'CONTEXT_MENU', 'TOAST', 'SKIP_LINK',
      'ONBOARDING_OVERLAY', 'ONBOARDING_SPOTLIGHT',
    ];
    for (const key of requiredKeys) {
      expect(Z_INDEX).toHaveProperty(key);
    }
  });

  it('should have all values as positive numbers', () => {
    for (const [, val] of Object.entries(Z_INDEX)) {
      expect(typeof val).toBe('number');
      expect(val).toBeGreaterThan(0);
    }
  });

  it('should have correct stacking order (lower layers < higher layers)', () => {
    expect(Z_INDEX.CANVAS_ELEMENT).toBeLessThan(Z_INDEX.GUIDES);
    expect(Z_INDEX.GUIDES).toBeLessThan(Z_INDEX.TOOLBAR_POPOVER);
    expect(Z_INDEX.TOOLBAR_POPOVER).toBeLessThan(Z_INDEX.MODAL_BACKDROP);
    expect(Z_INDEX.MODAL_BACKDROP).toBeLessThan(Z_INDEX.CONTEXT_MENU);
    expect(Z_INDEX.CONTEXT_MENU).toBeLessThan(Z_INDEX.TOAST);
    expect(Z_INDEX.TOAST).toBeLessThanOrEqual(Z_INDEX.ONBOARDING_OVERLAY);
  });
});
