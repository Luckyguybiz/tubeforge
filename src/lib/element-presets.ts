// Preset element definitions for the Elements panel

export interface ElementPreset {
  label: string;
  type: string;
  icon: string;
  props: Record<string, unknown>;
}

export const SHAPE_PRESETS: ElementPreset[] = [
  { label: 'Rectangle', type: 'rect', icon: '□', props: { w: 200, h: 120, color: '#ff2d55', borderR: 8, opacity: 0.8 } },
  { label: 'Circle', type: 'circle', icon: '○', props: { w: 120, h: 120, color: '#3a7bfd', opacity: 0.8 } },
  { label: 'Square', type: 'rect', icon: '■', props: { w: 120, h: 120, color: '#8b5cf6', borderR: 0, opacity: 0.8 } },
  { label: 'Rounded', type: 'rect', icon: '▢', props: { w: 180, h: 100, color: '#2dd4a0', borderR: 24, opacity: 0.8 } },
  { label: 'Triangle', type: 'triangle', icon: '△', props: { color: '#8b5cf6' } },
  { label: 'Star', type: 'star', icon: '☆', props: { color: '#f59e0b' } },
];

export const LINE_PRESETS: ElementPreset[] = [
  { label: 'Line', type: 'line', icon: '─', props: { strokeColor: '#ffffff', lineWidth: 2, dashStyle: 'solid' } },
  { label: 'Dashed', type: 'line', icon: '┄', props: { strokeColor: '#ffffff', lineWidth: 2, dashStyle: 'dashed' } },
  { label: 'Dotted', type: 'line', icon: '…', props: { strokeColor: '#ffffff', lineWidth: 2, dashStyle: 'dotted' } },
  { label: 'Arrow', type: 'arrow', icon: '→', props: { strokeColor: '#ffffff', lineWidth: 2, arrowHead: 'end' } },
  { label: 'Thick', type: 'line', icon: '━', props: { strokeColor: '#ffffff', lineWidth: 5, dashStyle: 'solid' } },
  { label: 'Colored', type: 'arrow', icon: '➜', props: { strokeColor: '#ff2d55', lineWidth: 3, arrowHead: 'end' } },
];

export const STICKER_PRESETS: ElementPreset[] = [
  { label: 'Note', type: 'stickyNote', icon: '📝', props: { noteColor: '#fef08a', noteText: 'Note', w: 200, h: 150 } },
  { label: 'Pink', type: 'stickyNote', icon: '📌', props: { noteColor: '#fecdd3', noteText: 'Note', w: 200, h: 150 } },
  { label: 'Blue', type: 'stickyNote', icon: '🔵', props: { noteColor: '#bfdbfe', noteText: 'Note', w: 200, h: 150 } },
  { label: 'Green', type: 'stickyNote', icon: '🟢', props: { noteColor: '#bbf7d0', noteText: 'Note', w: 200, h: 150 } },
  { label: 'Purple', type: 'stickyNote', icon: '🟣', props: { noteColor: '#e9d5ff', noteText: 'Note', w: 200, h: 150 } },
];

export const TABLE_PRESETS: ElementPreset[] = [
  { label: '2×2', type: 'table', icon: '⊞', props: { rows: 2, cols: 2 } },
  { label: '3×3', type: 'table', icon: '⊞', props: { rows: 3, cols: 3 } },
  { label: '4×4', type: 'table', icon: '⊞', props: { rows: 4, cols: 4 } },
  { label: '2×4', type: 'table', icon: '⊞', props: { rows: 2, cols: 4 } },
];

export const ICON_PRESETS: ElementPreset[] = [
  { label: 'Fire', type: 'text', icon: '🔥', props: { text: '🔥', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Arrow', type: 'text', icon: '➡️', props: { text: '➡️', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Exclaim', type: 'text', icon: '❗', props: { text: '❗', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Lightning', type: 'text', icon: '⚡', props: { text: '⚡', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Star', type: 'text', icon: '⭐', props: { text: '⭐', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Thumbs up', type: 'text', icon: '👍', props: { text: '👍', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Crown', type: 'text', icon: '👑', props: { text: '👑', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Money', type: 'text', icon: '💰', props: { text: '💰', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
];

export const COLOR_PRESETS = [
  '#ff0000', '#ff2d55', '#3a7bfd', '#ffff00', '#2dd4a0', '#8b5cf6',
  '#f59e0b', '#06b6d4', '#ec4899', '#ffffff', '#000000', '#6b7280',
];
