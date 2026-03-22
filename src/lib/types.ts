export interface Theme {
  bg: string;
  surface: string;
  card: string;
  cardHover: string;
  border: string;
  borderActive: string;
  accent: string;
  accentDim: string;
  blue: string;
  green: string;
  purple: string;
  orange: string;
  cyan: string;
  pink: string;
  red: string;
  text: string;
  sub: string;
  dim: string;
  overlay: string;
  overlayLight: string;
}

export type ColorKey = 'accent' | 'blue' | 'purple' | 'green' | 'orange' | 'cyan' | 'pink';

export interface Model {
  id: string;
  name: string;
  desc: string;
  speed: string;
  icon: string;
}

export interface StatusInfo {
  l: string;
  c: string;
}

export interface NavItem {
  id: string;
  icon: string;
  label: string;
}

export interface StatItem {
  label: string;
  value: string;
  change: string;
  up: boolean;
}

export interface VideoItem {
  title: string;
  views: string;
  ctr: string;
  st: string;
}

export type TransitionType = 'none' | 'fade' | 'slide' | 'zoom';

export interface Scene {
  id: string;
  label: string;
  prompt: string;
  duration: number;
  status: string;
  ck: string;
  chars: string[];
  model: string;
  sf: string | null;
  ef: string | null;
  enh: boolean;
  snd: boolean;
  taskId?: string | null;
  videoUrl?: string | null;
  transition?: TransitionType;
  voiceoverUrl?: string | null;
  voiceoverStatus?: 'idle' | 'generating' | 'done' | 'error';
}

export interface Character {
  id: string;
  name: string;
  role: string;
  avatar: string;
  ck: string;
  desc: string;
}

/** Gradient definition for element fills */
export interface GradientDef {
  type: 'linear' | 'radial';
  angle?: number; // linear gradient angle in degrees
  stops: { offset: number; color: string }[];
}

/** Filter/effect definition for elements */
export interface ElementFilters {
  blur?: number;       // px (0-20)
  brightness?: number; // 0-200 (100 = normal)
  contrast?: number;   // 0-200 (100 = normal)
  saturate?: number;   // 0-200 (100 = normal)
  grayscale?: number;  // 0-100
  sepia?: number;      // 0-100
  hueRotate?: number;  // 0-360 degrees
}

/** Box shadow definition */
export interface ShadowDef {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'rect' | 'circle' | 'triangle' | 'star' | 'image' | 'path' | 'line' | 'arrow' | 'stickyNote' | 'table';
  x: number;
  y: number;
  w: number;
  h: number;
  // text
  text?: string;
  font?: string;
  size?: number;
  bold?: boolean;
  italic?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  shadow?: string;
  opacity?: number;
  bg?: string;
  borderR?: number;
  rot?: number;
  // image
  src?: string;
  // path
  path?: string;
  strokeW?: number;
  // rect border
  border?: string;
  // line / arrow
  x2?: number;
  y2?: number;
  strokeColor?: string;
  lineWidth?: number;
  arrowHead?: 'none' | 'end' | 'both';
  dashStyle?: 'solid' | 'dashed' | 'dotted';
  // sticky note
  noteColor?: string;
  noteText?: string;
  // table
  rows?: number;
  cols?: number;
  cellData?: string[][];
  cellWidths?: number[];
  cellHeight?: number;
  // grouping / locking
  locked?: boolean;
  groupId?: string;
  visible?: boolean;
  proportionLocked?: boolean;
  // ── Design Studio enhancements ──
  // Gradient fill (overrides solid color when set)
  gradient?: GradientDef;
  // Advanced typography
  letterSpacing?: number;   // px (-5 to 20)
  lineHeight?: number;      // multiplier (0.8 to 3.0)
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textOutline?: string;     // e.g. "2px #000000"
  textDecoration?: 'none' | 'underline' | 'line-through';
  // Filters/effects
  filters?: ElementFilters;
  // Box shadow (advanced)
  boxShadow?: ShadowDef;
  // Blend mode
  blendMode?: string;       // CSS mix-blend-mode values
  // Flip
  flipX?: boolean;
  flipY?: boolean;
}

export interface AIResult {
  id: string;
  label: string;
  url?: string;
}

export interface ToolItem {
  id: string;
  icon: string;
  label: string;
  action?: () => void;
}
