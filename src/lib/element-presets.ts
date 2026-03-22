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
  { label: 'Rocket', type: 'text', icon: '🚀', props: { text: '🚀', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Check', type: 'text', icon: '✅', props: { text: '✅', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Cross', type: 'text', icon: '❌', props: { text: '❌', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Eye', type: 'text', icon: '👁️', props: { text: '👁️', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Heart', type: 'text', icon: '❤️', props: { text: '❤️', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Bell', type: 'text', icon: '🔔', props: { text: '🔔', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Camera', type: 'text', icon: '📷', props: { text: '📷', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Play', type: 'text', icon: '▶️', props: { text: '▶️', size: 64, bold: false, color: '#ffffff', bg: 'transparent' } },
];

/** Gradient shape presets — shapes with pre-applied gradients */
export const GRADIENT_SHAPE_PRESETS: ElementPreset[] = [
  { label: 'Sunset Rect', type: 'rect', icon: '🌅', props: { w: 200, h: 120, borderR: 12, opacity: 1, gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#f97316' }, { offset: 1, color: '#ec4899' }] } } },
  { label: 'Ocean Pill', type: 'rect', icon: '🌊', props: { w: 240, h: 60, borderR: 30, opacity: 1, gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#3b82f6' }] } } },
  { label: 'Neon Circle', type: 'circle', icon: '🟣', props: { w: 120, h: 120, opacity: 1, gradient: { type: 'radial', stops: [{ offset: 0, color: '#a855f7' }, { offset: 1, color: '#ec4899' }] } } },
  { label: 'Gold Badge', type: 'rect', icon: '🏅', props: { w: 160, h: 80, borderR: 8, opacity: 1, gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#eab308' }] } } },
  { label: 'Fire Bar', type: 'rect', icon: '🔥', props: { w: 300, h: 40, borderR: 20, opacity: 1, gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#ef4444' }, { offset: 1, color: '#f59e0b' }] } } },
  { label: 'Ice Blob', type: 'circle', icon: '❄️', props: { w: 160, h: 160, opacity: 0.8, gradient: { type: 'radial', stops: [{ offset: 0, color: '#67e8f9' }, { offset: 1, color: '#a78bfa' }] } } },
];

/** YouTube thumbnail text presets */
export const TEXT_STYLE_PRESETS: ElementPreset[] = [
  { label: 'Big Title', type: 'text', icon: 'Aa', props: { text: 'BIG TITLE', size: 96, bold: true, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 4, shadow: '0 4px 20px rgba(0,0,0,.8)' } },
  { label: 'Outlined', type: 'text', icon: 'O', props: { text: 'OUTLINED', size: 80, bold: true, color: '#ffffff', textOutline: '2px #000000', textTransform: 'uppercase', letterSpacing: 2 } },
  { label: 'Subtitle', type: 'text', icon: 'sub', props: { text: 'Subtitle text here', size: 32, bold: false, italic: true, color: '#94a3b8', letterSpacing: 1 } },
  { label: 'Badge Text', type: 'text', icon: '★', props: { text: 'NEW', size: 24, bold: true, color: '#ffffff', bg: '#ef4444', borderR: 6, textTransform: 'uppercase', letterSpacing: 2 } },
  { label: 'Gradient Text', type: 'text', icon: '🎨', props: { text: 'GRADIENT', size: 72, bold: true, color: '#ffffff', gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#f97316' }, { offset: 1, color: '#ec4899' }] }, textTransform: 'uppercase' } },
  { label: 'Clickbait', type: 'text', icon: '!', props: { text: 'YOU WON\'T BELIEVE THIS!', size: 56, bold: true, color: '#fef08a', shadow: '0 4px 16px rgba(0,0,0,.8)', textTransform: 'uppercase' } },
];

/** Complete thumbnail templates (multiple elements) */
export interface ThumbnailTemplate {
  label: string;
  thumbnail: string; // CSS gradient for preview
  canvasBg: string;
  canvasW: number;
  canvasH: number;
  elements: Array<{ type: string; props: Record<string, unknown> }>;
}

export const THUMBNAIL_TEMPLATES: ThumbnailTemplate[] = [
  {
    label: 'Bold Title',
    thumbnail: 'linear-gradient(135deg, #0f172a, #1e293b)',
    canvasBg: '#0f172a',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#0f172a' }, { offset: 1, color: '#1e1b4b' }] }, opacity: 1 } },
      { type: 'text', props: { x: 80, y: 200, w: 800, h: 120, text: 'YOUR TITLE HERE', size: 96, bold: true, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 4, shadow: '0 4px 20px rgba(0,0,0,.6)' } },
      { type: 'text', props: { x: 80, y: 340, w: 600, h: 50, text: 'Subtitle or description', size: 32, bold: false, color: '#94a3b8' } },
      { type: 'rect', props: { x: 80, y: 420, w: 180, h: 50, color: '#ef4444', borderR: 25, opacity: 1 } },
      { type: 'text', props: { x: 110, y: 428, w: 120, h: 36, text: 'WATCH NOW', size: 18, bold: true, color: '#ffffff', textAlign: 'center' } },
    ],
  },
  {
    label: 'Split Screen',
    thumbnail: 'linear-gradient(90deg, #ef4444, #3b82f6)',
    canvasBg: '#0a0a0a',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 640, h: 720, color: '#ef4444', opacity: 0.9 } },
      { type: 'rect', props: { x: 640, y: 0, w: 640, h: 720, color: '#3b82f6', opacity: 0.9 } },
      { type: 'text', props: { x: 100, y: 280, w: 440, h: 80, text: 'THIS', size: 96, bold: true, color: '#ffffff', textAlign: 'center' } },
      { type: 'text', props: { x: 740, y: 280, w: 440, h: 80, text: 'THAT', size: 96, bold: true, color: '#ffffff', textAlign: 'center' } },
      { type: 'text', props: { x: 540, y: 300, w: 200, h: 60, text: 'VS', size: 48, bold: true, color: '#fef08a', textAlign: 'center', bg: 'rgba(0,0,0,.6)', borderR: 30 } },
    ],
  },
  {
    label: 'Gradient Pop',
    thumbnail: 'linear-gradient(135deg, #a855f7, #ec4899)',
    canvasBg: '#0c0c14',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#7c3aed' }, { offset: 1, color: '#ec4899' }] }, opacity: 0.3 } },
      { type: 'circle', props: { x: 800, y: 100, w: 400, h: 400, gradient: { type: 'radial', stops: [{ offset: 0, color: '#a855f780' }, { offset: 1, color: '#ec489920' }] }, opacity: 0.6 } },
      { type: 'text', props: { x: 80, y: 180, w: 700, h: 140, text: 'AMAZING\nCONTENT', size: 80, bold: true, color: '#ffffff', letterSpacing: 3, textTransform: 'uppercase', shadow: '0 4px 20px rgba(0,0,0,.5)' } },
      { type: 'rect', props: { x: 80, y: 480, w: 200, h: 44, gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#f97316' }, { offset: 1, color: '#ef4444' }] }, borderR: 22, opacity: 1 } },
      { type: 'text', props: { x: 100, y: 490, w: 160, h: 28, text: 'SUBSCRIBE', size: 16, bold: true, color: '#ffffff', textAlign: 'center', letterSpacing: 2 } },
    ],
  },
  {
    label: 'Minimal Dark',
    thumbnail: 'linear-gradient(180deg, #111827, #1f2937)',
    canvasBg: '#111827',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 40, y: 40, w: 1200, h: 640, color: 'transparent', borderR: 16, border: '2px solid rgba(255,255,255,.1)', opacity: 1 } },
      { type: 'text', props: { x: 100, y: 260, w: 1080, h: 100, text: 'Clean & Minimal', size: 72, bold: true, color: '#f9fafb', textAlign: 'center', letterSpacing: 2 } },
      { type: 'text', props: { x: 100, y: 380, w: 1080, h: 40, text: 'Your subtitle goes here', size: 24, bold: false, color: '#6b7280', textAlign: 'center', letterSpacing: 1 } },
    ],
  },
  {
    label: 'YouTube Red',
    thumbnail: 'linear-gradient(135deg, #dc2626, #991b1b)',
    canvasBg: '#0a0a0a',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, gradient: { type: 'linear', angle: 160, stops: [{ offset: 0, color: '#dc262620' }, { offset: 1, color: '#0a0a0a' }] }, opacity: 1 } },
      { type: 'rect', props: { x: 60, y: 520, w: 300, h: 6, gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#dc2626' }, { offset: 1, color: '#f97316' }] }, borderR: 3, opacity: 1 } },
      { type: 'text', props: { x: 60, y: 200, w: 900, h: 140, text: 'HOW I MADE\n$10,000', size: 88, bold: true, color: '#ffffff', textTransform: 'uppercase', shadow: '0 4px 20px rgba(0,0,0,.5)' } },
      { type: 'text', props: { x: 60, y: 440, w: 500, h: 60, text: 'Step by step tutorial', size: 28, bold: false, color: '#9ca3af' } },
      { type: 'text', props: { x: 60, y: 550, w: 100, h: 30, text: 'NEW', size: 14, bold: true, color: '#ffffff', bg: '#dc2626', borderR: 4, textAlign: 'center', letterSpacing: 2 } },
    ],
  },
];

export const COLOR_PRESETS = [
  '#ff0000', '#ff2d55', '#3a7bfd', '#ffff00', '#2dd4a0', '#8b5cf6',
  '#f59e0b', '#06b6d4', '#ec4899', '#ffffff', '#000000', '#6b7280',
];
