import type { Theme, Model, StatusInfo, NavItem, StatItem, VideoItem, ColorKey } from './types';

export const dark: Theme = {
  bg: '#06060b',
  surface: '#0c0c14',
  card: '#111119',
  cardHover: '#17171f',
  border: '#1e1e2e',
  borderActive: '#2e2e44',
  accent: '#ff2d55',
  accentDim: 'rgba(255,45,85,.1)',
  blue: '#3a7bfd',
  green: '#2dd4a0',
  purple: '#8b5cf6',
  orange: '#f59e0b',
  cyan: '#06b6d4',
  pink: '#ec4899',
  red: '#ef4444',
  text: '#e8e8f0',
  sub: '#8d8da6',
  dim: '#44445a',
  overlay: 'rgba(0,0,0,.4)',
  overlayLight: 'rgba(0,0,0,.5)',
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
  { id: 'turbo', name: 'Turbo (Быстрая)', desc: 'Быстро', speed: '~10с', icon: '⚡' },
  { id: 'standard', name: 'Standard (Стандарт)', desc: 'Баланс', speed: '~30с', icon: '◆' },
  { id: 'pro', name: 'Pro (Максимум)', desc: 'Макс. качество', speed: '~60с', icon: '✦' },
  { id: 'cinematic', name: 'Cinematic (Кино)', desc: 'Кино-эффекты', speed: '~90с', icon: '🎬' },
];

export const AVATARS = [
  '👨‍💻', '👩‍💻', '🤖', '👔', '👩‍🎨', '🧑‍🔬',
  '👨‍🚀', '🦸', '🧙', '👻', '🐱', '🎭',
];

export const STATUS: Record<string, StatusInfo> = {
  empty: { l: 'Пусто', c: 'dim' },
  editing: { l: 'Черновик', c: 'blue' },
  generating: { l: 'Генерация…', c: 'orange' },
  ready: { l: 'Готово', c: 'green' },
  error: { l: 'Ошибка', c: 'accent' },
};

export const NAV: NavItem[] = [
  { id: 'dashboard', icon: '◉', label: 'Главная' },
  { id: 'editor', icon: '▶', label: 'Редактор' },
  { id: 'metadata', icon: '✎', label: 'Метаданные' },
  { id: 'thumbnails', icon: '◫', label: 'Обложки' },
  { id: 'preview', icon: '◎', label: 'Превью' },
];

export const STATS: StatItem[] = [
  { label: 'Просмотры', value: '1.2M', change: '+12.4%', up: true },
  { label: 'Подписчики', value: '48.3K', change: '+2.1K', up: true },
  { label: 'Время просмотра', value: '86.4K ч', change: '+8.7%', up: true },
  { label: 'CTR', value: '6.8%', change: '-0.3%', up: false },
];

export const VIDEOS: VideoItem[] = [
  { title: 'Как ИИ изменит YouTube в 2026', views: '142K', ctr: '8.2%', st: 'live' },
  { title: 'Топ-10 нейросетей для контента', views: '89K', ctr: '7.1%', st: 'live' },
  { title: 'Секреты вирусных обложек', views: '—', ctr: '—', st: 'draft' },
];

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

/* ── Canvas defaults ──────────────────────────────── */

export const CANVAS_DEFAULT_BG = '#0c0c14';
export const CANVAS_DEFAULT_DRAW_COLOR = '#ff2d55';
export const CANVAS_DEFAULT_DRAW_SIZE = 3;
export const CANVAS_ZOOM_MIN = 0.25;
export const CANVAS_ZOOM_MAX = 3;
export const STICKY_NOTE_COLOR = '#fef08a';
export const STICKY_NOTE_TEXT_COLOR = '#1a1a2e';
export const STICKY_NOTE_PRESETS = ['#fef08a', '#fecdd3', '#bfdbfe', '#bbf7d0', '#e9d5ff', '#fed7aa'] as const;

/* ── Keyboard shortcuts ──────────────────────────── */

export const KEYBOARD_SHORTCUTS = [
  // Global / Navigation
  { keys: 'Ctrl+K', label: 'Поиск', key: 'Ctrl+K', description: 'Open search', category: 'navigation' },
  { keys: '/', label: 'Фокус поиск', key: '/', description: 'Focus search bar', category: 'navigation' },
  { keys: '?', label: 'Горячие клавиши', key: '?', description: 'Show keyboard shortcuts help', category: 'navigation' },
  { keys: 'Ctrl+/', label: 'Горячие клавиши', key: 'Ctrl+/', description: 'Show keyboard shortcuts help', category: 'navigation' },
  { keys: 'Escape', label: 'Закрыть / снять выделение', key: 'Escape', description: 'Close modal / deselect', category: 'navigation' },
  { keys: 'G then D', label: 'Перейти на главную', key: 'G then D', description: 'Navigate to Dashboard', category: 'navigation' },
  { keys: 'G then E', label: 'Перейти к Редактору', key: 'G then E', description: 'Navigate to Editor', category: 'navigation' },
  { keys: 'G then T', label: 'Перейти к Инструментам', key: 'G then T', description: 'Navigate to Tools', category: 'navigation' },
  { keys: 'G then B', label: 'Перейти к Биллингу', key: 'G then B', description: 'Navigate to Billing', category: 'navigation' },
  { keys: 'G then S', label: 'Перейти к Настройкам', key: 'G then S', description: 'Navigate to Settings', category: 'navigation' },
  // Editor / Editing
  { keys: 'Ctrl+Z', label: 'Отменить', key: 'Ctrl+Z', description: 'Undo last action', category: 'editing' },
  { keys: 'Ctrl+Shift+Z', label: 'Повторить', key: 'Ctrl+Shift+Z', description: 'Redo last undone action', category: 'editing' },
  { keys: 'Ctrl+S', label: 'Сохранить', key: 'Ctrl+S', description: 'Save current project', category: 'general' },
  { keys: 'Ctrl+D', label: 'Дублировать', key: 'Ctrl+D', description: 'Duplicate selected element', category: 'editing' },
  { keys: 'Delete', label: 'Удалить', key: 'Delete', description: 'Remove selected element', category: 'editing' },
  { keys: 'Ctrl+C', label: 'Копировать', key: 'Ctrl+C', description: 'Copy selected element', category: 'editing' },
  { keys: 'Ctrl+V', label: 'Вставить', key: 'Ctrl+V', description: 'Paste from clipboard', category: 'editing' },
  { keys: 'Ctrl+X', label: 'Вырезать', key: 'Ctrl+X', description: 'Cut selected element', category: 'editing' },
  { keys: 'Ctrl+A', label: 'Выделить все', key: 'Ctrl+A', description: 'Select all elements', category: 'editing' },
  { keys: 'Ctrl+=', label: 'Увеличить', key: 'Ctrl+=', description: 'Zoom in', category: 'editing' },
  { keys: 'Ctrl+-', label: 'Уменьшить', key: 'Ctrl+-', description: 'Zoom out', category: 'editing' },
  { keys: 'Ctrl+0', label: 'По размеру экрана', key: 'Ctrl+0', description: 'Fit to screen', category: 'editing' },
  // Tools
  { keys: 'Ctrl+Enter', label: 'Генерировать', key: 'Ctrl+Enter', description: 'Start AI generation', category: 'general' },
  { keys: 'Ctrl+]', label: 'На передний план', key: 'Ctrl+]', description: 'Bring to front', category: 'general' },
  { keys: 'Ctrl+[', label: 'На задний план', key: 'Ctrl+[', description: 'Send to back', category: 'general' },
] as const;

export const SHORTCUT_CATEGORIES: Record<string, string> = {
  navigation: 'Навигация',
  editing: 'Редактирование',
  general: 'Общие',
};

/* ── Upload limits ────────────────────────────────── */

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

/* ── Error messages ───────────────────────────────── */

export const RATE_LIMIT_ERROR = 'Слишком много запросов. Попробуйте через минуту.';

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
    aiGenerations: 5,      // per month
    scenes: 10,            // per project
    teamMembers: 0,        // no team on FREE
    storageMB: 500,        // 500 MB
    storageBytes: 500 * 1024 * 1024,
    videoTranslations: 1,      // 1 translation per month
    ttsGenerations: 3,         // 3 TTS voiceovers per month
    imageGenerations: 5,       // 5 AI images per month
    maxVideoLengthSec: 60,     // 1 min max video for translation
    youtubeAnalyses: 5,        // 5 analyses per day
  },
  PRO: {
    projects: 25,
    aiGenerations: 100,    // per month
    scenes: 50,            // per project
    teamMembers: 0,        // no team on PRO
    storageMB: 5120,       // 5 GB
    storageBytes: 5 * 1024 * 1024 * 1024,
    videoTranslations: 20,     // 20 translations per month
    ttsGenerations: 50,        // 50 TTS per month
    imageGenerations: 100,     // 100 AI images per month
    maxVideoLengthSec: 600,    // 10 min max video
    youtubeAnalyses: 50,       // 50 analyses per day
  },
  STUDIO: {
    projects: Infinity,
    aiGenerations: Infinity,
    scenes: 200,           // per project
    teamMembers: 10,       // 10 team members
    storageMB: 51200,      // 50 GB
    storageBytes: 50 * 1024 * 1024 * 1024,
    videoTranslations: 100,    // 100 translations per month
    ttsGenerations: 200,       // 200 TTS per month
    imageGenerations: Infinity,
    maxVideoLengthSec: 1800,   // 30 min max video
    youtubeAnalyses: Infinity, // unlimited analyses per day
  },
};

export type PlanName = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as PlanName] ?? PLAN_LIMITS.FREE;
}

export type ToolLimitKey = 'videoTranslations' | 'ttsGenerations' | 'youtubeAnalyses' | 'imageGenerations';

export function getToolLimit(plan: string, tool: ToolLimitKey): number {
  return getPlanLimits(plan)[tool];
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
