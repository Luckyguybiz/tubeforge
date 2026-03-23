import type { Theme, Model, StatusInfo, NavItem, VideoItem, ColorKey } from './types';

export const dark: Theme = {
  bg: '#0a0a0a',           // Primary dark bg (near-black)
  surface: '#141414',       // Slightly elevated surface
  card: '#1a1a1a',          // Card backgrounds
  cardHover: '#222222',     // Card hover state
  border: 'rgba(255,255,255,0.08)',     // Subtle borders
  borderActive: 'rgba(255,255,255,0.16)', // Active borders
  accent: '#6366f1',        // Indigo accent (keep TubeForge brand)
  accentDim: 'rgba(99,102,241,0.1)',
  blue: '#3b82f6',
  green: '#10b981',
  purple: '#8b5cf6',
  orange: '#f59e0b',
  cyan: '#06b6d4',
  pink: '#ec4899',
  red: '#ef4444',
  text: '#ffffff',          // Pure white text
  sub: 'rgba(255,255,255,0.5)',  // 50% white for secondary
  dim: 'rgba(255,255,255,0.2)',  // 20% white for disabled
  overlay: 'rgba(0,0,0,0.6)',
  overlayLight: 'rgba(0,0,0,0.8)',
};

export const light: Theme = {
  bg: '#f5f5f7',
  surface: '#ffffff',
  card: '#ffffff',
  cardHover: '#f0f0f5',
  border: '#e5e5ea',
  borderActive: '#d1d1d6',
  accent: '#6366f1',
  accentDim: 'rgba(99,102,241,.07)',
  blue: '#007aff',
  green: '#34c759',
  purple: '#af52de',
  orange: '#ff9500',
  cyan: '#5ac8fa',
  pink: '#ff2d55',
  red: '#ff3b30',
  text: '#1d1d1f',
  sub: '#86868b',
  dim: '#aeaeb2',
  overlay: 'rgba(255,255,255,.75)',
  overlayLight: 'rgba(255,255,255,.85)',
};

export const PK: ColorKey[] = ['accent', 'blue', 'purple', 'green', 'orange', 'cyan', 'pink'];

export const MODELS: Model[] = [
  { id: 'turbo', name: 'Turbo', desc: 'Fast', speed: '~10s', icon: '⚡' },
  { id: 'standard', name: 'Standard', desc: 'Balanced', speed: '~30s', icon: '◆' },
  { id: 'pro', name: 'Pro', desc: 'Max quality', speed: '~60s', icon: '✦' },
  { id: 'cinematic', name: 'Cinematic', desc: 'Cinema effects', speed: '~90s', icon: '🎬' },
];

export const STATUS: Record<string, StatusInfo> = {
  empty: { l: 'Empty', c: 'dim' },
  editing: { l: 'Draft', c: 'blue' },
  generating: { l: 'Generating…', c: 'orange' },
  ready: { l: 'Ready', c: 'green' },
  error: { l: 'Error', c: 'accent' },
};

export const NAV: NavItem[] = [
  { id: 'dashboard', icon: '◉', label: 'Dashboard' },
  { id: 'editor', icon: '▶', label: 'Editor' },
  { id: 'metadata', icon: '✎', label: 'Metadata' },
  { id: 'thumbnails', icon: '◫', label: 'Thumbnails' },
  { id: 'preview', icon: '◎', label: 'Preview' },
];

export const VIDEOS: VideoItem[] = [
  { title: 'How AI Will Change YouTube in 2026', views: '142K', ctr: '8.2%', st: 'live' },
  { title: 'Top 10 AI Tools for Content', views: '89K', ctr: '7.1%', st: 'live' },
  { title: 'Secrets of Viral Thumbnails', views: '—', ctr: '—', st: 'draft' },
];

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

/* ── Canvas defaults ──────────────────────────────── */

export const CANVAS_DEFAULT_BG = '#141414';
export const CANVAS_DEFAULT_DRAW_COLOR = '#6366f1';
export const CANVAS_DEFAULT_DRAW_SIZE = 3;
export const CANVAS_ZOOM_MIN = 0.25;
export const CANVAS_ZOOM_MAX = 3;
export const STICKY_NOTE_COLOR = '#fef08a';
export const STICKY_NOTE_TEXT_COLOR = '#1a1a2e';
export const STICKY_NOTE_PRESETS = ['#fef08a', '#fecdd3', '#bfdbfe', '#bbf7d0', '#e9d5ff', '#fed7aa'] as const;

/* ── Upload limits ────────────────────────────────── */

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

/* ── Error messages ───────────────────────────────── */

export const RATE_LIMIT_ERROR = 'Too many requests. Please try again in a minute.';

/* ── Timing constants (ms) ──────────────────────────── */

/** Generation timeout — mark scene as error if still generating */
export const GENERATION_TIMEOUT_MS = 120_000;
/** Debounce delay for auto-saving scene edits to server */
export const SCENE_SAVE_DEBOUNCE_MS = 500;
/** Debounce delay for canvas thumbnail save */
export const CANVAS_SAVE_DEBOUNCE_MS = 1_000;
/** Delay before resetting save status badge from "saved" to "idle" */
export const SAVE_STATUS_RESET_MS = 2_000;
/** Debounce delay for dashboard search input */
export const SEARCH_DEBOUNCE_MS = 300;

/* ── Z-Index layers ────────────────────────────────── */

export const Z_INDEX = {
  CANVAS_ELEMENT: 1,
  GUIDES: 50,
  ZOOM_CONTROLS: 20,
  TOOLBAR_POPOVER: 100,
  MODAL_BACKDROP: 999,
  CONTEXT_MENU: 1000,
  DROPDOWN: 1100,
  TOAST: 9999,
  SKIP_LINK: 9999,
  ONBOARDING_OVERLAY: 10000,
  ONBOARDING_SPOTLIGHT: 10001,
} as const;

/* ── Plan limits (single source of truth) ────────── */

export const PLAN_LIMITS = {
  FREE: {
    projects: 3,
    aiGenerations: 5,
    scenes: 10,
    teamMembers: 0,
    storageMB: 500,
    storageBytes: 500 * 1024 * 1024,
    ttsGenerations: 3,
    videoTranslations: 1,
    aiThumbnails: 3,
    aiThumbnailMultiGen: 1,
    facesLimit: 3,
    maxVideoLengthSec: 60,
  },
  PRO: {
    projects: 25,
    aiGenerations: 100,
    scenes: 50,
    teamMembers: 0,
    storageMB: 5120,
    storageBytes: 5 * 1024 * 1024 * 1024,
    ttsGenerations: 50,
    videoTranslations: 20,
    aiThumbnails: 100,
    aiThumbnailMultiGen: 2,
    facesLimit: 10,
    maxVideoLengthSec: 600,
  },
  STUDIO: {
    projects: Infinity,
    aiGenerations: Infinity,
    scenes: 200,
    teamMembers: 10,
    storageMB: 51200,
    storageBytes: 50 * 1024 * 1024 * 1024,
    ttsGenerations: 200,
    videoTranslations: 100,
    aiThumbnails: Infinity,
    aiThumbnailMultiGen: 3,
    facesLimit: 20,
    maxVideoLengthSec: 1800,
  },
} as const;

type PlanName = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as PlanName] ?? PLAN_LIMITS.FREE;
}

/* ── AI Thumbnail Generator limits (per day) ─── */

export const AI_THUMBNAIL_LIMITS = {
  /** Max thumbnail generations per day */
  dailyGenerations: { FREE: 3, PRO: 100, STUDIO: Infinity },
  /** Max images per single generation request */
  multiGen: { FREE: 1, PRO: 2, STUDIO: 3 },
  /** Max saved face photos */
  faces: { FREE: 3, PRO: 10, STUDIO: 20 },
  /** Max edits per day (FREE gets 1 total, PRO+ unlimited) */
  dailyEdits: { FREE: 1, PRO: Infinity, STUDIO: Infinity },
  /** Idea suggestion rate limit per day */
  dailySuggestions: { FREE: 3, PRO: 20, STUDIO: 20 },
} as const;

export function getAiThumbnailLimit(
  limitKey: keyof typeof AI_THUMBNAIL_LIMITS,
  plan: string,
): number {
  const limits = AI_THUMBNAIL_LIMITS[limitKey];
  return limits[plan as PlanName] ?? limits.FREE;
}

/* ── API endpoint base URLs ─────────────────────────── */

export const API_ENDPOINTS = {
  OPENAI_IMAGES: 'https://api.openai.com/v1/images/generations',
  OPENAI_CHAT: 'https://api.openai.com/v1/chat/completions',
  ANTHROPIC_MESSAGES: 'https://api.anthropic.com/v1/messages',
  RUNWAY_VIDEO: 'https://api.runwayml.com/v1/image_to_video',
  GOOGLE_OAUTH_TOKEN: 'https://oauth2.googleapis.com/token',
  YOUTUBE_CHANNELS: 'https://www.googleapis.com/youtube/v3/channels',
  YOUTUBE_SEARCH: 'https://www.googleapis.com/youtube/v3/search',
  YOUTUBE_VIDEOS: 'https://www.googleapis.com/youtube/v3/videos',
  YOUTUBE_ANALYTICS: 'https://youtubeanalytics.googleapis.com/v2/reports',
  YOUTUBE_UPLOAD: 'https://www.googleapis.com/upload/youtube/v3/videos',
  RUNWAY_TASKS: 'https://api.runwayml.com/v1/tasks',
} as const;
