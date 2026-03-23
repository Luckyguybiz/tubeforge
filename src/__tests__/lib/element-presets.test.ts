import { describe, it, expect } from 'vitest';
import {
  SHAPE_PRESETS,
  LINE_PRESETS,
  STICKER_PRESETS,
  TABLE_PRESETS,
  ICON_PRESETS,
  COLOR_PRESETS,
} from '@/lib/element-presets';
import type { ElementPreset } from '@/lib/element-presets';

function validatePreset(preset: ElementPreset) {
  expect(typeof preset.label).toBe('string');
  expect(preset.label.length).toBeGreaterThan(0);
  expect(typeof preset.type).toBe('string');
  expect(preset.type.length).toBeGreaterThan(0);
  expect(typeof preset.icon).toBe('string');
  expect(preset.icon.length).toBeGreaterThan(0);
  expect(typeof preset.props).toBe('object');
  expect(preset.props).not.toBeNull();
}

describe('Shape presets', () => {
  it('should have at least 4 shapes', () => {
    expect(SHAPE_PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it('all shapes should have valid structure', () => {
    for (const preset of SHAPE_PRESETS) {
      validatePreset(preset);
    }
  });

  it('shape types should be valid canvas types', () => {
    const validTypes = ['rect', 'circle', 'triangle', 'star', 'path'];
    for (const preset of SHAPE_PRESETS) {
      expect(validTypes).toContain(preset.type);
    }
  });

  it('shapes with width/height should have positive values', () => {
    for (const preset of SHAPE_PRESETS) {
      if (preset.props.w) expect(Number(preset.props.w)).toBeGreaterThan(0);
      if (preset.props.h) expect(Number(preset.props.h)).toBeGreaterThan(0);
    }
  });
});

describe('Line presets', () => {
  it('should have at least 3 line types', () => {
    expect(LINE_PRESETS.length).toBeGreaterThanOrEqual(3);
  });

  it('all lines should have valid structure', () => {
    for (const preset of LINE_PRESETS) {
      validatePreset(preset);
    }
  });

  it('line types should be "line" or "arrow"', () => {
    for (const preset of LINE_PRESETS) {
      expect(['line', 'arrow']).toContain(preset.type);
    }
  });

  it('all lines should have positive line width', () => {
    for (const preset of LINE_PRESETS) {
      expect(Number(preset.props.lineWidth)).toBeGreaterThan(0);
    }
  });

  it('should include both solid and dashed styles', () => {
    const styles = LINE_PRESETS.map((p) => p.props.dashStyle).filter(Boolean);
    expect(styles).toContain('solid');
    expect(styles).toContain('dashed');
  });
});

describe('Sticker presets', () => {
  it('should have at least 3 stickers', () => {
    expect(STICKER_PRESETS.length).toBeGreaterThanOrEqual(3);
  });

  it('all stickers should be stickyNote type', () => {
    for (const preset of STICKER_PRESETS) {
      expect(preset.type).toBe('stickyNote');
    }
  });

  it('all stickers should have noteColor as valid hex', () => {
    for (const preset of STICKER_PRESETS) {
      expect(String(preset.props.noteColor)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('all stickers should have dimensions', () => {
    for (const preset of STICKER_PRESETS) {
      expect(Number(preset.props.w)).toBeGreaterThan(0);
      expect(Number(preset.props.h)).toBeGreaterThan(0);
    }
  });
});

describe('Table presets', () => {
  it('should have at least 3 table sizes', () => {
    expect(TABLE_PRESETS.length).toBeGreaterThanOrEqual(3);
  });

  it('all tables should have positive rows and cols', () => {
    for (const preset of TABLE_PRESETS) {
      expect(Number(preset.props.rows)).toBeGreaterThanOrEqual(2);
      expect(Number(preset.props.cols)).toBeGreaterThanOrEqual(2);
    }
  });

  it('labels should match row×col dimensions', () => {
    for (const preset of TABLE_PRESETS) {
      const expected = `${preset.props.rows}\u00D7${preset.props.cols}`;
      expect(preset.label).toBe(expected);
    }
  });
});

describe('Icon presets', () => {
  it('should have at least 6 icons', () => {
    expect(ICON_PRESETS.length).toBeGreaterThanOrEqual(6);
  });

  it('all icons should be text type for emoji rendering', () => {
    for (const preset of ICON_PRESETS) {
      expect(preset.type).toBe('text');
    }
  });

  it('all icons should have a size property', () => {
    for (const preset of ICON_PRESETS) {
      expect(Number(preset.props.size)).toBeGreaterThan(0);
    }
  });
});

describe('Color presets', () => {
  it('should have at least 8 colors', () => {
    expect(COLOR_PRESETS.length).toBeGreaterThanOrEqual(8);
  });

  it('all colors should be valid hex', () => {
    for (const color of COLOR_PRESETS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('should include black and white', () => {
    expect(COLOR_PRESETS).toContain('#ffffff');
    expect(COLOR_PRESETS).toContain('#000000');
  });

  it('should have no duplicates', () => {
    const unique = new Set(COLOR_PRESETS);
    expect(unique.size).toBe(COLOR_PRESETS.length);
  });
});
