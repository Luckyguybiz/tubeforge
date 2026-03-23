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
  { label: 'Pentagon', type: 'pentagon', icon: '⬠', props: { color: '#06b6d4' } },
  { label: 'Hexagon', type: 'hexagon', icon: '⬡', props: { color: '#ec4899' } },
  { label: 'Arrow', type: 'arrowShape', icon: '➧', props: { color: '#3a7bfd' } },
  { label: 'Speech', type: 'speechBubble', icon: '💬', props: { color: '#2dd4a0' } },
  { label: 'Heart', type: 'heart', icon: '♥', props: { color: '#ff2d55' } },
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

// ===== Phase 4 — Arrow presets =====
export const ARROW_PRESETS: ElementPreset[] = [
  { label: 'Straight', type: 'arrow', icon: '→', props: { strokeColor: '#ffffff', lineWidth: 3, arrowHead: 'end', dashStyle: 'solid' } },
  { label: 'Curved', type: 'arrow', icon: '↪', props: { strokeColor: '#ffffff', lineWidth: 3, arrowHead: 'end', dashStyle: 'solid' } },
  { label: 'Dotted', type: 'arrow', icon: '⇢', props: { strokeColor: '#ffffff', lineWidth: 3, arrowHead: 'end', dashStyle: 'dotted' } },
  { label: 'Thick', type: 'arrow', icon: '➤', props: { strokeColor: '#ffffff', lineWidth: 6, arrowHead: 'end', dashStyle: 'solid' } },
  { label: 'Neon', type: 'arrow', icon: '⇨', props: { strokeColor: '#00ff88', lineWidth: 4, arrowHead: 'end', dashStyle: 'solid' } },
  { label: 'Hand-drawn', type: 'arrow', icon: '➝', props: { strokeColor: '#ff2d55', lineWidth: 3, arrowHead: 'end', dashStyle: 'dashed' } },
];

// ===== Phase 4 — Badge presets =====
export const BADGE_PRESETS: ElementPreset[] = [
  { label: 'NEW', type: 'text', icon: '🆕', props: { text: 'NEW', size: 36, bold: true, color: '#ffffff', bg: '#ff2d55', borderR: 8 } },
  { label: 'FREE', type: 'text', icon: '🆓', props: { text: 'FREE', size: 36, bold: true, color: '#ffffff', bg: '#2dd4a0', borderR: 8 } },
  { label: '#1', type: 'text', icon: '🥇', props: { text: '#1', size: 48, bold: true, color: '#ffffff', bg: '#f59e0b', borderR: 12 } },
  { label: 'HOT', type: 'text', icon: '🔥', props: { text: 'HOT', size: 36, bold: true, color: '#ffffff', bg: '#ff4500', borderR: 8 } },
  { label: 'VS', type: 'text', icon: '⚔️', props: { text: 'VS', size: 48, bold: true, color: '#ffffff', bg: '#8b5cf6', borderR: 24 } },
  { label: '5 Stars', type: 'text', icon: '⭐', props: { text: '★★★★★', size: 32, bold: false, color: '#f59e0b', bg: 'transparent' } },
];

// ===== Phase 4 — Emoji presets (popular for thumbnails) =====
export const EMOJI_PRESETS: ElementPreset[] = [
  { label: 'Fire', type: 'text', icon: '🔥', props: { text: '🔥', size: 72, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Shocked', type: 'text', icon: '😱', props: { text: '😱', size: 72, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Money', type: 'text', icon: '💰', props: { text: '💰', size: 72, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Gaming', type: 'text', icon: '🎮', props: { text: '🎮', size: 72, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Phone', type: 'text', icon: '📱', props: { text: '📱', size: 72, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Eyes', type: 'text', icon: '👀', props: { text: '👀', size: 72, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Alert', type: 'text', icon: '❗', props: { text: '❗', size: 72, bold: false, color: '#ffffff', bg: 'transparent' } },
  { label: 'Check', type: 'text', icon: '✅', props: { text: '✅', size: 72, bold: false, color: '#ffffff', bg: 'transparent' } },
];

// ===== Phase 4 — Divider presets =====
export const DIVIDER_PRESETS: ElementPreset[] = [
  { label: 'H-Line', type: 'line', icon: '─', props: { strokeColor: '#ffffff', lineWidth: 2, dashStyle: 'solid' } },
  { label: 'V-Line', type: 'line', icon: '│', props: { strokeColor: '#ffffff', lineWidth: 2, dashStyle: 'solid' } },
  { label: 'Dashed', type: 'line', icon: '┈', props: { strokeColor: '#ffffff', lineWidth: 2, dashStyle: 'dashed' } },
  { label: 'Thick', type: 'line', icon: '━', props: { strokeColor: '#ffffff', lineWidth: 5, dashStyle: 'solid' } },
  { label: 'Colored', type: 'line', icon: '▬', props: { strokeColor: '#ff2d55', lineWidth: 3, dashStyle: 'solid' } },
  { label: 'Gradient', type: 'line', icon: '═', props: { strokeColor: '#8b5cf6', lineWidth: 4, dashStyle: 'solid' } },
];

// ===== Phase 4 — Frame presets =====
export const FRAME_PRESETS: ElementPreset[] = [
  { label: 'Circle', type: 'circle', icon: '◯', props: { w: 200, h: 200, color: 'transparent', opacity: 1, border: '3px solid #ffffff' } },
  { label: 'Rounded', type: 'rect', icon: '▢', props: { w: 200, h: 200, color: 'transparent', opacity: 1, borderR: 20, border: '3px solid #ffffff' } },
  { label: 'Phone', type: 'rect', icon: '📱', props: { w: 120, h: 240, color: '#1a1a2e', opacity: 1, borderR: 16, border: '3px solid #333' } },
  { label: 'Laptop', type: 'rect', icon: '💻', props: { w: 280, h: 180, color: '#1a1a2e', opacity: 1, borderR: 8, border: '3px solid #555' } },
  { label: 'Square', type: 'rect', icon: '◻', props: { w: 200, h: 200, color: 'transparent', opacity: 1, borderR: 0, border: '3px solid #f59e0b' } },
  { label: 'Neon', type: 'rect', icon: '✨', props: { w: 200, h: 200, color: 'transparent', opacity: 1, borderR: 12, border: '3px solid #00ff88' } },
];

// ===== Shape SVG path definitions (normalized to 0-100 viewBox) =====
export const SHAPE_PATHS: Record<string, string> = {
  pentagon: 'M50,0 L100,38 L81,100 L19,100 L0,38 Z',
  hexagon: 'M50,0 L93,25 L93,75 L50,100 L7,75 L7,25 Z',
  arrow: 'M0,30 L60,30 L60,0 L100,50 L60,100 L60,70 L0,70 Z',
  speechBubble: 'M10,0 L90,0 Q100,0 100,10 L100,70 Q100,80 90,80 L30,80 L15,100 L20,80 L10,80 Q0,80 0,70 L0,10 Q0,0 10,0 Z',
  heart: 'M50,90 L10,50 Q0,35 15,20 Q30,5 50,25 Q70,5 85,20 Q100,35 90,50 Z',
};

export const COLOR_PRESETS = [
  '#ff0000', '#ff2d55', '#3a7bfd', '#ffff00', '#2dd4a0', '#8b5cf6',
  '#f59e0b', '#06b6d4', '#ec4899', '#ffffff', '#000000', '#6b7280',
];
