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
  // ── Additional templates ────────────────────────────────────
  {
    label: 'Gaming',
    thumbnail: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
    canvasBg: '#0c0c14',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#0c0c14' }, { offset: 1, color: '#1a103d' }] }, opacity: 1 } },
      { type: 'rect', props: { x: 0, y: 600, w: 1280, h: 120, gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#7c3aed' }, { offset: 1, color: '#06b6d4' }] }, opacity: 0.8 } },
      { type: 'text', props: { x: 60, y: 150, w: 900, h: 120, text: 'EPIC GAMEPLAY', size: 96, bold: true, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 6, shadow: '0 0 30px rgba(124,58,237,.5)' } },
      { type: 'text', props: { x: 60, y: 290, w: 600, h: 60, text: 'SEASON 5 UPDATE', size: 36, bold: true, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: 3 } },
      { type: 'text', props: { x: 60, y: 630, w: 400, h: 50, text: 'LIKE & SUBSCRIBE', size: 24, bold: true, color: '#ffffff', letterSpacing: 2 } },
    ],
  },
  {
    label: 'Tutorial',
    thumbnail: 'linear-gradient(135deg, #059669, #0d9488)',
    canvasBg: '#0f172a',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, color: '#0f172a', opacity: 1 } },
      { type: 'rect', props: { x: 0, y: 0, w: 8, h: 720, color: '#059669', opacity: 1 } },
      { type: 'text', props: { x: 60, y: 80, w: 300, h: 36, text: 'TUTORIAL', size: 18, bold: true, color: '#059669', letterSpacing: 4, textTransform: 'uppercase' } },
      { type: 'rect', props: { x: 60, y: 130, w: 80, h: 4, color: '#059669', opacity: 1 } },
      { type: 'text', props: { x: 60, y: 170, w: 900, h: 160, text: 'How to Build\nYour First App', size: 72, bold: true, color: '#f8fafc', lineHeight: 1.2 } },
      { type: 'text', props: { x: 60, y: 380, w: 600, h: 40, text: 'Complete beginner guide • 2026', size: 22, bold: false, color: '#64748b' } },
      { type: 'rect', props: { x: 60, y: 460, w: 160, h: 44, gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#059669' }, { offset: 1, color: '#0d9488' }] }, borderR: 8, opacity: 1 } },
      { type: 'text', props: { x: 80, y: 470, w: 120, h: 28, text: 'STEP 1', size: 16, bold: true, color: '#ffffff', textAlign: 'center' } },
    ],
  },
  {
    label: 'Reaction',
    thumbnail: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    canvasBg: '#0a0a0a',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, gradient: { type: 'radial', stops: [{ offset: 0, color: '#1a1a2e' }, { offset: 1, color: '#0a0a0a' }] }, opacity: 1 } },
      { type: 'text', props: { x: 40, y: 60, w: 1200, h: 200, text: 'I CAN\'T\nBELIEVE THIS!', size: 110, bold: true, color: '#fef08a', textTransform: 'uppercase', shadow: '0 4px 30px rgba(239,68,68,.5)', textAlign: 'center', letterSpacing: 3 } },
      { type: 'text', props: { x: 40, y: 550, w: 1200, h: 60, text: 'WAIT UNTIL THE END...', size: 32, bold: true, color: '#f97316', textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase' } },
      { type: 'circle', props: { x: 520, y: 340, w: 240, h: 240, gradient: { type: 'radial', stops: [{ offset: 0, color: '#ef444440' }, { offset: 1, color: '#ef444400' }] }, opacity: 0.6 } },
    ],
  },
  {
    label: 'Before/After',
    thumbnail: 'linear-gradient(90deg, #374151, #f59e0b)',
    canvasBg: '#111827',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 640, h: 720, color: '#1f2937', opacity: 1 } },
      { type: 'rect', props: { x: 640, y: 0, w: 640, h: 720, gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#f59e0b20' }, { offset: 1, color: '#111827' }] }, opacity: 1 } },
      { type: 'text', props: { x: 160, y: 300, w: 320, h: 80, text: 'BEFORE', size: 48, bold: true, color: '#6b7280', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 4 } },
      { type: 'text', props: { x: 800, y: 300, w: 320, h: 80, text: 'AFTER', size: 48, bold: true, color: '#f59e0b', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 4 } },
      { type: 'rect', props: { x: 636, y: 0, w: 8, h: 720, color: '#ffffff', opacity: 0.3 } },
      { type: 'text', props: { x: 610, y: 330, w: 60, h: 40, text: 'VS', size: 20, bold: true, color: '#ffffff', textAlign: 'center', bg: '#f59e0b', borderR: 20 } },
    ],
  },
  {
    label: 'Listicle',
    thumbnail: 'linear-gradient(135deg, #1e40af, #7c3aed)',
    canvasBg: '#0f172a',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, gradient: { type: 'linear', angle: 160, stops: [{ offset: 0, color: '#1e40af15' }, { offset: 1, color: '#0f172a' }] }, opacity: 1 } },
      { type: 'text', props: { x: 60, y: 80, w: 240, h: 200, text: '10', size: 180, bold: true, color: '#3b82f6', shadow: '0 0 40px rgba(59,130,246,.3)' } },
      { type: 'text', props: { x: 60, y: 300, w: 800, h: 120, text: 'MISTAKES\nBEGINNERS MAKE', size: 64, bold: true, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 3 } },
      { type: 'rect', props: { x: 60, y: 480, w: 200, h: 44, gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#7c3aed' }] }, borderR: 22, opacity: 1 } },
      { type: 'text', props: { x: 80, y: 490, w: 160, h: 28, text: '#3 IS CRAZY', size: 14, bold: true, color: '#ffffff', textAlign: 'center' } },
    ],
  },
  {
    label: 'Vlog',
    thumbnail: 'linear-gradient(135deg, #ec4899, #f97316)',
    canvasBg: '#0a0a0a',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#ec489920' }, { offset: 1, color: '#0a0a0a' }] }, opacity: 1 } },
      { type: 'text', props: { x: 60, y: 100, w: 500, h: 50, text: 'DAILY VLOG #47', size: 28, bold: true, color: '#ec4899', letterSpacing: 3, textTransform: 'uppercase' } },
      { type: 'text', props: { x: 60, y: 200, w: 800, h: 180, text: 'A Day in\nMy Life', size: 88, bold: true, color: '#ffffff', lineHeight: 1.1 } },
      { type: 'rect', props: { x: 60, y: 520, w: 140, h: 40, gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#ec4899' }, { offset: 1, color: '#f97316' }] }, borderR: 20, opacity: 1 } },
      { type: 'text', props: { x: 80, y: 528, w: 100, h: 28, text: 'NEW', size: 14, bold: true, color: '#ffffff', textAlign: 'center', letterSpacing: 2 } },
    ],
  },
  {
    label: 'Tech Review',
    thumbnail: 'linear-gradient(135deg, #18181b, #3f3f46)',
    canvasBg: '#09090b',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, gradient: { type: 'linear', angle: 180, stops: [{ offset: 0, color: '#18181b' }, { offset: 1, color: '#09090b' }] }, opacity: 1 } },
      { type: 'rect', props: { x: 0, y: 680, w: 1280, h: 40, gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#3b82f6' }, { offset: 0.5, color: '#8b5cf6' }, { offset: 1, color: '#ec4899' }] }, opacity: 1 } },
      { type: 'text', props: { x: 60, y: 80, w: 400, h: 36, text: 'HONEST REVIEW', size: 18, bold: true, color: '#a1a1aa', letterSpacing: 4, textTransform: 'uppercase' } },
      { type: 'text', props: { x: 60, y: 160, w: 900, h: 160, text: 'iPhone 17 Pro\nMax', size: 84, bold: true, color: '#fafafa', lineHeight: 1.1 } },
      { type: 'text', props: { x: 60, y: 400, w: 300, h: 80, text: '★★★★☆', size: 48, color: '#f59e0b' } },
      { type: 'text', props: { x: 60, y: 500, w: 400, h: 40, text: 'Worth the upgrade?', size: 24, bold: false, color: '#71717a' } },
    ],
  },
  {
    label: 'Podcast',
    thumbnail: 'linear-gradient(135deg, #7c2d12, #dc2626)',
    canvasBg: '#0c0a09',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, gradient: { type: 'radial', stops: [{ offset: 0, color: '#1c1917' }, { offset: 1, color: '#0c0a09' }] }, opacity: 1 } },
      { type: 'circle', props: { x: 480, y: 200, w: 320, h: 320, gradient: { type: 'radial', stops: [{ offset: 0, color: '#dc262640' }, { offset: 1, color: '#dc262600' }] }, opacity: 0.6 } },
      { type: 'text', props: { x: 40, y: 40, w: 200, h: 30, text: 'PODCAST', size: 14, bold: true, color: '#dc2626', letterSpacing: 4 } },
      { type: 'text', props: { x: 40, y: 200, w: 800, h: 160, text: 'The Truth About\nSuccess', size: 76, bold: true, color: '#fafaf9', lineHeight: 1.15 } },
      { type: 'text', props: { x: 40, y: 440, w: 600, h: 40, text: 'EP. 124 • Guest: John Doe', size: 22, bold: false, color: '#a8a29e' } },
      { type: 'rect', props: { x: 40, y: 520, w: 120, h: 40, color: '#dc2626', borderR: 20, opacity: 1 } },
      { type: 'text', props: { x: 55, y: 528, w: 90, h: 28, text: 'LISTEN', size: 13, bold: true, color: '#ffffff', textAlign: 'center', letterSpacing: 2 } },
    ],
  },
  {
    label: 'Cooking',
    thumbnail: 'linear-gradient(135deg, #f97316, #eab308)',
    canvasBg: '#1a1a0e',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, gradient: { type: 'linear', angle: 180, stops: [{ offset: 0, color: '#1a1a0e' }, { offset: 1, color: '#0a0a06' }] }, opacity: 1 } },
      { type: 'text', props: { x: 60, y: 80, w: 200, h: 40, text: 'RECIPE', size: 16, bold: true, color: '#f97316', letterSpacing: 4 } },
      { type: 'text', props: { x: 60, y: 160, w: 800, h: 160, text: 'Perfect\nHomemade Pasta', size: 80, bold: true, color: '#fefce8', lineHeight: 1.15 } },
      { type: 'rect', props: { x: 60, y: 400, w: 100, h: 36, color: '#f9731620', borderR: 18, opacity: 1, border: '1px solid #f9731650' } },
      { type: 'text', props: { x: 72, y: 408, w: 76, h: 24, text: '30 MIN', size: 12, bold: true, color: '#f97316', textAlign: 'center' } },
      { type: 'rect', props: { x: 180, y: 400, w: 80, h: 36, color: '#eab30820', borderR: 18, opacity: 1, border: '1px solid #eab30850' } },
      { type: 'text', props: { x: 192, y: 408, w: 56, h: 24, text: 'EASY', size: 12, bold: true, color: '#eab308', textAlign: 'center' } },
    ],
  },
  {
    label: 'Fitness',
    thumbnail: 'linear-gradient(135deg, #16a34a, #22c55e)',
    canvasBg: '#052e16',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, gradient: { type: 'linear', angle: 160, stops: [{ offset: 0, color: '#052e16' }, { offset: 1, color: '#022c22' }] }, opacity: 1 } },
      { type: 'rect', props: { x: 0, y: 0, w: 6, h: 720, gradient: { type: 'linear', angle: 180, stops: [{ offset: 0, color: '#22c55e' }, { offset: 1, color: '#16a34a' }] }, opacity: 1 } },
      { type: 'text', props: { x: 60, y: 100, w: 900, h: 200, text: '30 DAY\nCHALLENGE', size: 100, bold: true, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 5, shadow: '0 4px 20px rgba(0,0,0,.4)' } },
      { type: 'text', props: { x: 60, y: 350, w: 600, h: 50, text: 'Transform your body at home', size: 28, bold: false, color: '#86efac' } },
      { type: 'rect', props: { x: 60, y: 450, w: 200, h: 50, gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#16a34a' }, { offset: 1, color: '#22c55e' }] }, borderR: 25, opacity: 1 } },
      { type: 'text', props: { x: 80, y: 460, w: 160, h: 34, text: 'START NOW', size: 16, bold: true, color: '#ffffff', textAlign: 'center', letterSpacing: 2 } },
    ],
  },
  {
    label: 'Music',
    thumbnail: 'linear-gradient(135deg, #581c87, #be185d)',
    canvasBg: '#0a0118',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, gradient: { type: 'radial', stops: [{ offset: 0, color: '#1e0536' }, { offset: 1, color: '#0a0118' }] }, opacity: 1 } },
      { type: 'circle', props: { x: 400, y: 100, w: 500, h: 500, gradient: { type: 'radial', stops: [{ offset: 0, color: '#7c3aed30' }, { offset: 1, color: '#7c3aed00' }] }, opacity: 0.5 } },
      { type: 'text', props: { x: 60, y: 200, w: 800, h: 140, text: 'NEW SINGLE\nOUT NOW', size: 80, bold: true, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 4, shadow: '0 0 40px rgba(168,85,247,.4)' } },
      { type: 'text', props: { x: 60, y: 420, w: 400, h: 40, text: 'Official Music Video', size: 24, bold: false, color: '#c084fc' } },
      { type: 'rect', props: { x: 60, y: 500, w: 60, h: 60, gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#a855f7' }, { offset: 1, color: '#ec4899' }] }, borderR: 30, opacity: 1 } },
      { type: 'text', props: { x: 72, y: 516, w: 36, h: 30, text: '▶', size: 24, color: '#ffffff', textAlign: 'center' } },
    ],
  },
  {
    label: 'Business',
    thumbnail: 'linear-gradient(135deg, #1e3a5f, #0f766e)',
    canvasBg: '#0c1524',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#0c1524' }, { offset: 1, color: '#0d1b2a' }] }, opacity: 1 } },
      { type: 'rect', props: { x: 0, y: 660, w: 1280, h: 60, gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#0f766e' }, { offset: 1, color: '#0891b2' }] }, opacity: 0.8 } },
      { type: 'text', props: { x: 80, y: 140, w: 800, h: 120, text: '5 Passive Income\nStreams in 2026', size: 64, bold: true, color: '#f0fdfa', lineHeight: 1.2 } },
      { type: 'text', props: { x: 80, y: 340, w: 600, h: 40, text: 'Financial freedom roadmap', size: 24, bold: false, color: '#5eead4' } },
      { type: 'rect', props: { x: 80, y: 420, w: 180, h: 44, color: '#0f766e', borderR: 8, opacity: 1 } },
      { type: 'text', props: { x: 100, y: 430, w: 140, h: 28, text: 'WATCH FREE', size: 14, bold: true, color: '#ffffff', textAlign: 'center', letterSpacing: 1 } },
    ],
  },
  {
    label: 'Travel',
    thumbnail: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
    canvasBg: '#0c1929',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, gradient: { type: 'linear', angle: 180, stops: [{ offset: 0, color: '#0369a1' }, { offset: 0.5, color: '#0c4a6e20' }, { offset: 1, color: '#0c1929' }] }, opacity: 1 } },
      { type: 'text', props: { x: 60, y: 80, w: 300, h: 36, text: 'TRAVEL GUIDE', size: 16, bold: true, color: '#38bdf8', letterSpacing: 4, textTransform: 'uppercase' } },
      { type: 'text', props: { x: 60, y: 180, w: 800, h: 180, text: 'Exploring\nJapan', size: 96, bold: true, color: '#ffffff', lineHeight: 1.1 } },
      { type: 'text', props: { x: 60, y: 440, w: 500, h: 40, text: 'Hidden gems & local food', size: 24, bold: false, color: '#7dd3fc' } },
    ],
  },
  {
    label: 'Horror/Mystery',
    thumbnail: 'linear-gradient(180deg, #0a0a0a, #450a0a)',
    canvasBg: '#0a0a0a',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, gradient: { type: 'radial', stops: [{ offset: 0, color: '#1c1917' }, { offset: 1, color: '#0a0a0a' }] }, opacity: 1 } },
      { type: 'text', props: { x: 40, y: 200, w: 1200, h: 160, text: 'DON\'T WATCH\nTHIS ALONE', size: 90, bold: true, color: '#dc2626', textAlign: 'center', textTransform: 'uppercase', shadow: '0 0 40px rgba(220,38,38,.4)', letterSpacing: 3 } },
      { type: 'text', props: { x: 40, y: 460, w: 1200, h: 50, text: 'True story • Based on real events', size: 22, bold: false, color: '#57534e', textAlign: 'center' } },
      { type: 'rect', props: { x: 0, y: 700, w: 1280, h: 20, gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#dc2626' }, { offset: 0.5, color: '#450a0a' }, { offset: 1, color: '#dc2626' }] }, opacity: 0.5 } },
    ],
  },
  {
    label: 'Education',
    thumbnail: 'linear-gradient(135deg, #1d4ed8, #6366f1)',
    canvasBg: '#0f172a',
    canvasW: 1280, canvasH: 720,
    elements: [
      { type: 'rect', props: { x: 0, y: 0, w: 1280, h: 720, color: '#0f172a', opacity: 1 } },
      { type: 'rect', props: { x: 40, y: 40, w: 1200, h: 640, color: 'transparent', borderR: 20, opacity: 1, border: '2px solid rgba(99,102,241,.2)' } },
      { type: 'text', props: { x: 100, y: 100, w: 200, h: 40, text: 'EXPLAINED', size: 16, bold: true, color: '#818cf8', letterSpacing: 4 } },
      { type: 'text', props: { x: 100, y: 200, w: 800, h: 160, text: 'Quantum\nComputing', size: 84, bold: true, color: '#e0e7ff', lineHeight: 1.15 } },
      { type: 'text', props: { x: 100, y: 420, w: 600, h: 40, text: 'In 10 minutes or less', size: 24, bold: false, color: '#6366f1' } },
      { type: 'circle', props: { x: 900, y: 150, w: 250, h: 250, gradient: { type: 'radial', stops: [{ offset: 0, color: '#6366f130' }, { offset: 1, color: '#6366f100' }] }, opacity: 0.5 } },
    ],
  },
];

/** SVG path presets for badges, banners, speech bubbles */
export const BADGE_PRESETS: ElementPreset[] = [
  { label: 'Subscribe', type: 'rect', icon: '🔔', props: { w: 200, h: 50, color: '#ef4444', borderR: 8, opacity: 1 } },
  { label: 'NEW Badge', type: 'rect', icon: '🆕', props: { w: 80, h: 32, color: '#22c55e', borderR: 6, opacity: 1 } },
  { label: 'HOT Badge', type: 'rect', icon: '🔥', props: { w: 80, h: 32, gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#ef4444' }, { offset: 1, color: '#f97316' }] }, borderR: 6, opacity: 1 } },
  { label: 'Pill Tag', type: 'rect', icon: '💊', props: { w: 120, h: 36, color: '#3b82f6', borderR: 18, opacity: 1 } },
  { label: 'Circle Tag', type: 'circle', icon: '⭕', props: { w: 80, h: 80, gradient: { type: 'radial', stops: [{ offset: 0, color: '#ef4444' }, { offset: 1, color: '#dc2626' }] }, opacity: 1 } },
  { label: 'Banner', type: 'rect', icon: '🏷️', props: { w: 300, h: 60, gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#f97316' }, { offset: 1, color: '#ef4444' }] }, borderR: 0, opacity: 1 } },
  { label: 'Ribbon', type: 'rect', icon: '🎗️', props: { w: 200, h: 40, gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#eab308' }, { offset: 1, color: '#f59e0b' }] }, borderR: 0, opacity: 1 } },
  { label: 'Price Tag', type: 'rect', icon: '💲', props: { w: 120, h: 50, color: '#16a34a', borderR: 8, opacity: 1 } },
];

/** Background presets for the canvas */
export interface BackgroundPreset {
  label: string;
  value: string; // CSS background value
  preview: string; // CSS for preview swatch
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  // Solid colors
  { label: 'Dark Navy', value: '#0f172a', preview: '#0f172a' },
  { label: 'Pure Black', value: '#000000', preview: '#000000' },
  { label: 'Dark Gray', value: '#1a1a1a', preview: '#1a1a1a' },
  { label: 'Slate', value: '#1e293b', preview: '#1e293b' },
  { label: 'Midnight', value: '#0c0c14', preview: '#0c0c14' },
  { label: 'White', value: '#ffffff', preview: '#ffffff' },
  // Gradients (stored as bg color + a gradient overlay element gets created)
  { label: 'Sunset', value: 'gradient:135:#f97316:#ec4899', preview: 'linear-gradient(135deg, #f97316, #ec4899)' },
  { label: 'Ocean', value: 'gradient:135:#06b6d4:#3b82f6', preview: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
  { label: 'Forest', value: 'gradient:135:#059669:#0d9488', preview: 'linear-gradient(135deg, #059669, #0d9488)' },
  { label: 'Neon', value: 'gradient:135:#a855f7:#ec4899', preview: 'linear-gradient(135deg, #a855f7, #ec4899)' },
  { label: 'Fire', value: 'gradient:135:#ef4444:#f59e0b', preview: 'linear-gradient(135deg, #ef4444, #f59e0b)' },
  { label: 'Night', value: 'gradient:135:#1e293b:#7c3aed', preview: 'linear-gradient(135deg, #1e293b, #7c3aed)' },
  { label: 'Gold', value: 'gradient:135:#f59e0b:#eab308', preview: 'linear-gradient(135deg, #f59e0b, #eab308)' },
  { label: 'Ice', value: 'gradient:135:#67e8f9:#a78bfa', preview: 'linear-gradient(135deg, #67e8f9, #a78bfa)' },
  { label: 'Blood', value: 'gradient:180:#dc2626:#450a0a', preview: 'linear-gradient(180deg, #dc2626, #450a0a)' },
  { label: 'Cyber', value: 'gradient:135:#06b6d4:#7c3aed', preview: 'linear-gradient(135deg, #06b6d4, #7c3aed)' },
];

export const COLOR_PRESETS = [
  '#ff0000', '#ff2d55', '#3a7bfd', '#ffff00', '#2dd4a0', '#8b5cf6',
  '#f59e0b', '#06b6d4', '#ec4899', '#ffffff', '#000000', '#6b7280',
];
