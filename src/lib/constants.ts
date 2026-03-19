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
  sub: '#7c7c96',
  dim: '#44445a',
  overlay: 'rgba(0,0,0,.4)',
  overlayLight: 'rgba(0,0,0,.5)',
};

export const light: Theme = {
  bg: '#f3f3f7',
  surface: '#ffffff',
  card: '#eeeef3',
  cardHover: '#e4e4ec',
  border: '#d4d4de',
  borderActive: '#c0c0ce',
  accent: '#e8243c',
  accentDim: 'rgba(232,36,60,.07)',
  blue: '#2563eb',
  green: '#16a34a',
  purple: '#7c3aed',
  orange: '#d97706',
  cyan: '#0891b2',
  pink: '#db2777',
  red: '#dc2626',
  text: '#1a1a2e',
  sub: '#6b6b82',
  dim: '#9e9eb4',
  overlay: 'rgba(255,255,255,.7)',
  overlayLight: 'rgba(255,255,255,.8)',
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
  { id: 'dashboard', icon: '◉', label: 'Дашборд' },
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
  { keys: 'Ctrl+Z', label: 'Отменить', key: 'Ctrl+Z', description: 'Undo last action', category: 'editing' },
  { keys: 'Ctrl+Shift+Z', label: 'Повторить', key: 'Ctrl+Shift+Z', description: 'Redo last undone action', category: 'editing' },
  { keys: 'Ctrl+S', label: 'Сохранить', key: 'Ctrl+S', description: 'Save current project', category: 'general' },
  { keys: 'Ctrl+D', label: 'Дублировать', key: 'Ctrl+D', description: 'Duplicate selected element', category: 'editing' },
  { keys: 'Delete', label: 'Удалить', key: 'Delete', description: 'Remove selected element', category: 'editing' },
  { keys: 'Ctrl+C', label: 'Копировать', key: 'Ctrl+C', description: 'Copy selected element', category: 'editing' },
  { keys: 'Ctrl+V', label: 'Вставить', key: 'Ctrl+V', description: 'Paste from clipboard', category: 'editing' },
  { keys: 'Ctrl+X', label: 'Вырезать', key: 'Ctrl+X', description: 'Cut selected element', category: 'editing' },
  { keys: 'Ctrl+A', label: 'Выделить все', key: 'Ctrl+A', description: 'Select all elements', category: 'editing' },
  { keys: 'Ctrl+Enter', label: 'Генерировать', key: 'Ctrl+Enter', description: 'Start AI generation', category: 'general' },
  { keys: 'Ctrl+K', label: 'Поиск', key: 'Ctrl+K', description: 'Open search', category: 'navigation' },
  { keys: 'Escape', label: 'Снять выделение', key: 'Escape', description: 'Deselect / close menu', category: 'navigation' },
  { keys: '?', label: 'Горячие клавиши', key: '?', description: 'Show keyboard shortcuts help', category: 'navigation' },
] as const;

export const SHORTCUT_CATEGORIES: Record<string, string> = {
  editing: 'Редактирование',
  general: 'Общие',
  navigation: 'Навигация',
};

/* ── Upload limits ────────────────────────────────── */

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

/* ── Error messages ───────────────────────────────── */

export const RATE_LIMIT_ERROR = 'Слишком много запросов. Попробуйте через минуту.';

/* ── Timing constants (ms) ──────────────────────────── */

/** Generation timeout — mark scene as error if still generating */
export const GENERATION_TIMEOUT_MS = 30_000;
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
