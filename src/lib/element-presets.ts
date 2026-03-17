// Preset element definitions for the Elements panel

export interface ElementPreset {
  label: string;
  type: string;
  icon: string;
  props: Record<string, unknown>;
}

export const SHAPE_PRESETS: ElementPreset[] = [
  { label: 'Прямоугольник', type: 'rect', icon: '□', props: { w: 200, h: 120, color: '#ff2d55', borderR: 8, opacity: 0.8 } },
  { label: 'Круг', type: 'circle', icon: '○', props: { w: 120, h: 120, color: '#3a7bfd', opacity: 0.8 } },
  { label: 'Квадрат', type: 'rect', icon: '■', props: { w: 120, h: 120, color: '#8b5cf6', borderR: 0, opacity: 0.8 } },
  { label: 'Скруглённый', type: 'rect', icon: '▢', props: { w: 180, h: 100, color: '#2dd4a0', borderR: 24, opacity: 0.8 } },
  { label: 'Треугольник', type: 'triangle', icon: '△', props: { color: '#8b5cf6' } },
  { label: 'Звезда', type: 'star', icon: '☆', props: { color: '#f59e0b' } },
];

export const LINE_PRESETS: ElementPreset[] = [
  { label: 'Линия', type: 'line', icon: '─', props: { strokeColor: '#ffffff', lineWidth: 2, dashStyle: 'solid' } },
  { label: 'Пунктир', type: 'line', icon: '┄', props: { strokeColor: '#ffffff', lineWidth: 2, dashStyle: 'dashed' } },
  { label: 'Точки', type: 'line', icon: '…', props: { strokeColor: '#ffffff', lineWidth: 2, dashStyle: 'dotted' } },
  { label: 'Стрелка', type: 'arrow', icon: '→', props: { strokeColor: '#ffffff', lineWidth: 2, arrowHead: 'end' } },
  { label: 'Толстая', type: 'line', icon: '━', props: { strokeColor: '#ffffff', lineWidth: 5, dashStyle: 'solid' } },
  { label: 'Цветная', type: 'arrow', icon: '➜', props: { strokeColor: '#ff2d55', lineWidth: 3, arrowHead: 'end' } },
];

export const STICKER_PRESETS: ElementPreset[] = [
  { label: 'Заметка', type: 'stickyNote', icon: '📝', props: { noteColor: '#fef08a', noteText: 'Заметка', w: 200, h: 150 } },
  { label: 'Розовая', type: 'stickyNote', icon: '📌', props: { noteColor: '#fecdd3', noteText: 'Заметка', w: 200, h: 150 } },
  { label: 'Голубая', type: 'stickyNote', icon: '🔵', props: { noteColor: '#bfdbfe', noteText: 'Заметка', w: 200, h: 150 } },
  { label: 'Зелёная', type: 'stickyNote', icon: '🟢', props: { noteColor: '#bbf7d0', noteText: 'Заметка', w: 200, h: 150 } },
  { label: 'Фиолетовая', type: 'stickyNote', icon: '🟣', props: { noteColor: '#e9d5ff', noteText: 'Заметка', w: 200, h: 150 } },
];

export const TABLE_PRESETS: ElementPreset[] = [
  { label: '2×2', type: 'table', icon: '⊞', props: { rows: 2, cols: 2 } },
  { label: '3×3', type: 'table', icon: '⊞', props: { rows: 3, cols: 3 } },
  { label: '4×4', type: 'table', icon: '⊞', props: { rows: 4, cols: 4 } },
  { label: '2×4', type: 'table', icon: '⊞', props: { rows: 2, cols: 4 } },
];

export const ICON_PRESETS: ElementPreset[] = [
  { label: 'Огонь', type: 'text', icon: '🔥', props: { text: '🔥', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Стрелка', type: 'text', icon: '➡️', props: { text: '➡️', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Восклиц.', type: 'text', icon: '❗', props: { text: '❗', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Молния', type: 'text', icon: '⚡', props: { text: '⚡', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Звезда', type: 'text', icon: '⭐', props: { text: '⭐', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Палец', type: 'text', icon: '👍', props: { text: '👍', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Корона', type: 'text', icon: '👑', props: { text: '👑', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Деньги', type: 'text', icon: '💰', props: { text: '💰', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
];

export const COLOR_PRESETS = [
  '#ff2d55', '#3a7bfd', '#2dd4a0', '#8b5cf6', '#f59e0b',
  '#06b6d4', '#ec4899', '#ffffff', '#000000', '#6b7280',
];
