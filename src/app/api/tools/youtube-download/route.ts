import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const ytLog = createLogger('youtube-analyzer');

export const dynamic = 'force-dynamic';

/**
 * Extract a YouTube video ID from various URL formats.
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

/**
 * Detect if URL is a Shorts URL.
 */
function isShortsUrl(url: string): boolean {
  return /youtube\.com\/shorts\//.test(url);
}

interface OEmbedResponse {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
}

interface YouTubeDataAPISnippet {
  publishedAt?: string;
  title?: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  channelTitle?: string;
}

interface YouTubeDataAPIStats {
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
  subscriberCount?: string;
}

interface YouTubeDataAPIContentDetails {
  duration?: string;
}

interface YouTubeDataAPIItem {
  snippet?: YouTubeDataAPISnippet;
  statistics?: YouTubeDataAPIStats;
  contentDetails?: YouTubeDataAPIContentDetails;
}

interface YouTubeDataAPIResponse {
  items?: YouTubeDataAPIItem[];
}

/* ─── Category map: YouTube categoryId → Russian name ──────────────── */

const CATEGORY_MAP: Record<string, string> = {
  '1': 'Фильмы и анимация',
  '2': 'Авто',
  '10': 'Музыка',
  '15': 'Животные',
  '17': 'Спорт',
  '19': 'Путешествия и события',
  '20': 'Игры',
  '22': 'Люди и блоги',
  '23': 'Комедия',
  '24': 'Развлечения',
  '25': 'Новости',
  '26': 'DIY',
  '27': 'Образование',
  '28': 'Наука и технологии',
  '29': 'Активизм',
  '30': 'Кино и ТВ',
  '43': 'Шоу',
  '44': 'Трейлеры',
};

/* ─── Analysis helpers ──────────────────────────────────────────────── */

const POWER_WORDS_RU = [
  'секрет', 'лучший', 'топ', 'как', 'почему', 'ошибк', 'правда',
  'невероятн', 'шок', 'важн', 'идеальн', 'простой', 'быстр',
  'бесплатн', 'новый', 'первый',
];

const POWER_WORDS_EN = [
  'secret', 'best', 'top', 'how', 'why', 'mistake', 'truth',
  'incredible', 'shocking', 'important', 'perfect', 'simple', 'fast',
  'free', 'new', 'first', 'ultimate', 'amazing', 'hack', 'revealed',
];

const EMOTIONAL_WORDS_RU = [
  'ужас', 'невероятн', 'шок', 'слёзы', 'плач', 'смех', 'орать',
  'обалде', 'офиге', 'крут', 'жесть', 'угар', 'ржач', 'мега',
  'супер', 'бомб', 'огонь', 'безум', 'дико', 'нереальн',
];

const EMOTIONAL_WORDS_EN = [
  'omg', 'incredible', 'insane', 'crazy', 'hilarious', 'shocking',
  'unbelievable', 'epic', 'mind-blowing', 'amazing', 'jaw-dropping',
  'terrifying', 'heartwarming', 'emotional', 'devastating',
];

const HUMOR_MARKERS = [
  'лол', 'ржака', 'угар', 'прикол', 'смешно', 'юмор', 'хаха',
  'lol', 'rofl', 'lmao', 'funny', 'comedy', 'humor', 'meme',
  'мем', 'тикток', 'tiktok', 'пранк', 'prank',
];

function countEmojis(text: string): number {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu;
  return (text.match(emojiRegex) || []).length;
}

function hasNumbers(text: string): boolean {
  return /\d+/.test(text);
}

function hasQuestion(text: string): boolean {
  return /\?/.test(text) || /^(как|why|how|what|когда|where|зачем|почему)/i.test(text);
}

function capsRatio(text: string): number {
  const letters = text.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '');
  if (letters.length === 0) return 0;
  const upper = letters.replace(/[^A-ZА-ЯЁ]/g, '').length;
  return upper / letters.length;
}

function countPowerWords(title: string): number {
  const lower = title.toLowerCase();
  let count = 0;
  for (const word of [...POWER_WORDS_RU, ...POWER_WORDS_EN]) {
    if (lower.includes(word)) count++;
  }
  return count;
}

function countEmotionalWords(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const word of [...EMOTIONAL_WORDS_RU, ...EMOTIONAL_WORDS_EN]) {
    if (lower.includes(word)) count++;
  }
  return count;
}

function countHumorMarkers(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const word of HUMOR_MARKERS) {
    if (lower.includes(word)) count++;
  }
  return count;
}

/**
 * Calculate a hook score (1-10) based on title characteristics.
 */
function calculateHookScore(title: string): number {
  let score = 5;
  if (hasNumbers(title)) score += 1;
  if (hasQuestion(title)) score += 1;
  score += Math.min(countEmojis(title) * 0.5, 1);
  score += Math.min(countPowerWords(title) * 0.5, 2);
  if (capsRatio(title) > 0.5) score -= 1;
  if (title.length > 80) score -= 1;
  if (title.length < 20) score -= 1;
  return Math.max(1, Math.min(10, Math.round(score)));
}

/**
 * Calculate a title SEO score (1-10).
 */
function calculateTitleScore(title: string): number {
  let score = 5;
  if (title.length >= 40 && title.length <= 70) {
    score += 2;
  } else if (title.length >= 30 && title.length <= 80) {
    score += 1;
  } else {
    score -= 1;
  }
  if (hasNumbers(title)) score += 1;
  if (countPowerWords(title) >= 1) score += 1;
  if (/[|—–\-:]/.test(title)) score += 0.5;
  if (capsRatio(title) < 0.3) score += 0.5;
  return Math.max(1, Math.min(10, Math.round(score)));
}

/**
 * Estimate content type from title, tags, and description.
 */
function estimateContentType(
  title: string,
  tags?: string[],
  description?: string,
): string {
  const combined = [title, ...(tags ?? []), description ?? ''].join(' ').toLowerCase();

  if (/tutorial|урок|how to|как сделать|обучение|guide|гайд|learn|курс/.test(combined)) {
    return 'tutorial';
  }
  if (/review|обзор|распаковка|unboxing|тест|сравнение|comparison/.test(combined)) {
    return 'review';
  }
  if (/news|новост|breaking|срочно|update|обновлени/.test(combined)) {
    return 'news';
  }
  if (/vlog|влог|день из жизни|day in|routine|travel|путешестви/.test(combined)) {
    return 'vlog';
  }
  if (/podcast|подкаст|интервью|interview|разговор|беседа/.test(combined)) {
    return 'podcast';
  }
  if (/music|музык|clip|клип|song|песн|cover|кавер/.test(combined)) {
    return 'music';
  }
  if (/stream|стрим|live|прямой эфир|трансляция/.test(combined)) {
    return 'livestream';
  }
  if (/game|игр|gameplay|прохождение|minecraft|fortnite|gaming/.test(combined)) {
    return 'gaming';
  }

  return 'entertainment';
}

/**
 * Estimate CTR quality from title analysis.
 */
function estimateCTR(hookScore: number, titleScore: number): 'low' | 'medium' | 'high' | 'very_high' {
  const avg = (hookScore + titleScore) / 2;
  if (avg >= 8) return 'very_high';
  if (avg >= 6) return 'high';
  if (avg >= 4) return 'medium';
  return 'low';
}

/**
 * Parse ISO 8601 duration (PT5M30S) into total seconds.
 */
function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format seconds as "M:SS" string.
 */
function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

interface StructureSegment {
  label: string;
  icon: string;
  start: string;
  end: string;
  color: string;
}

/**
 * Estimate video structure based on total duration.
 * Returns an array of structured segment objects.
 */
function estimateStructure(durationISO?: string, isShort = false): StructureSegment[] {
  if (!durationISO) {
    return [
      { label: 'Нет данных', icon: '❓', start: '0:00', end: '0:00', color: '#9ca3af' },
    ];
  }

  const totalSec = parseDurationToSeconds(durationISO);
  if (totalSec === 0) {
    return [
      { label: 'Нет данных', icon: '❓', start: '0:00', end: '0:00', color: '#9ca3af' },
    ];
  }

  if (isShort || totalSec <= 60) {
    // Shorts structure
    const hookEnd = Math.min(2, totalSec * 0.07);
    const ctaStart = Math.max(hookEnd + 1, totalSec * 0.85);
    return [
      { label: 'Хук', icon: '\u26A1', start: fmtTime(0), end: fmtTime(hookEnd), color: '#ef4444' },
      { label: 'Контент', icon: '\uD83C\uDFAC', start: fmtTime(hookEnd), end: fmtTime(ctaStart), color: '#6366f1' },
      { label: 'CTA / Петля', icon: '\uD83D\uDD04', start: fmtTime(ctaStart), end: fmtTime(totalSec), color: '#22c55e' },
    ];
  }

  // Regular video structure
  const hookEnd = Math.min(5, totalSec * 0.02);
  const introEnd = Math.min(hookEnd + totalSec * 0.1, totalSec * 0.15);
  const outroStart = totalSec * 0.92;

  return [
    { label: 'Хук', icon: '\uD83C\uDFA3', start: fmtTime(0), end: fmtTime(hookEnd), color: '#ef4444' },
    { label: 'Вступление', icon: '\uD83D\uDCD6', start: fmtTime(hookEnd), end: fmtTime(introEnd), color: '#f59e0b' },
    { label: 'Основной контент', icon: '\uD83D\uDCDD', start: fmtTime(introEnd), end: fmtTime(outroStart), color: '#6366f1' },
    { label: 'Аутро', icon: '\uD83D\uDC4B', start: fmtTime(outroStart), end: fmtTime(totalSec), color: '#22c55e' },
  ];
}

/**
 * Generate actionable tips based on analysis data.
 */
function generateTips(
  title: string,
  hookScore: number,
  engagementRate: number,
  durationISO?: string,
  contentType?: string,
): string[] {
  const tips: string[] = [];
  const titleLen = title.length;
  const emojiCount = countEmojis(title);

  // Video-specific hook analysis
  if (hookScore >= 7) {
    tips.push(`Заголовок "${title.slice(0, 40)}.." имеет сильный хук (score ${hookScore}/10) — такие заголовки привлекают клики.`);
  } else if (hookScore >= 5) {
    tips.push(`Хук заголовка средний (${hookScore}/10). Для "${title.slice(0, 30)}.." попробуйте начать с числа или вопроса.`);
  } else {
    tips.push(`Хук заголовка слабый (${hookScore}/10). "${title.slice(0, 30)}.." не цепляет — добавьте интригу или конкретику.`);
  }

  // Video-specific length
  if (titleLen > 70) {
    tips.push(`Заголовок ${titleLen} символов — YouTube обрежет после 70. Сократите до ${titleLen - 70} символов.`);
  } else if (titleLen < 30) {
    tips.push(`Заголовок всего ${titleLen} символов — слишком коротко. Добавьте ключевые слова для SEO.`);
  }

  // Video-specific engagement
  if (engagementRate > 5) {
    tips.push(`Engagement rate ${engagementRate.toFixed(1)}% — выше среднего (3-5%). Аудитория активно реагирует на контент.`);
  } else if (engagementRate > 2) {
    tips.push(`Engagement rate ${engagementRate.toFixed(1)}% — в пределах нормы. Добавьте CTA в первые 30 секунд для роста.`);
  } else if (engagementRate > 0) {
    tips.push(`Engagement rate всего ${engagementRate.toFixed(1)}% — ниже среднего. Закрепите призыв к действию в комментариях.`);
  }

  // Video-specific duration
  if (durationISO) {
    const totalSec = parseDurationToSeconds(durationISO);
    const totalMin = totalSec / 60;
    const cat = contentType ?? 'entertainment';
    const optimalRanges: Record<string, [number, number]> = {
      tutorial: [8, 15], review: [8, 12], news: [5, 10], vlog: [10, 20],
      entertainment: [8, 15], podcast: [30, 60], gaming: [15, 30], music: [3, 5],
    };
    const range = optimalRanges[cat] ?? [8, 15];
    if (totalMin < range[0] && totalMin >= 1) {
      tips.push(`Видео ${Math.round(totalMin)} мин — короче оптимального для "${cat}" (${range[0]}-${range[1]} мин). Дольше = больше рекламы.`);
    } else if (totalMin > range[1]) {
      tips.push(`Видео ${Math.round(totalMin)} мин — длиннее оптимального для "${cat}" (${range[0]}-${range[1]} мин). Удержание может упасть.`);
    }
    if (totalMin < 1) {
      tips.push(`Длительность ${totalSec} сек — это Shorts-формат. Алгоритм Shorts отличается от обычного.`);
    }
  }

  // Video-specific emoji
  if (emojiCount === 0) {
    tips.push(`В заголовке нет эмодзи. 1-2 эмодзи повышают CTR на 5-10% в категории "${contentType ?? 'entertainment'}".`);
  } else if (emojiCount > 3) {
    tips.push(`В заголовке ${emojiCount} эмодзи — перебор. Оставьте 1-2 для профессионального вида.`);
  }

  return tips.slice(0, 6);
}

/**
 * Detect viral factors.
 */
function detectViralFactors(
  title: string,
  hookScore: number,
  titleScore: number,
  engagementRate: number,
  views?: number,
  tags?: string[],
): string[] {
  const factors: string[] = [];
  const fmtViews = views ? (views >= 1_000_000 ? (views / 1_000_000).toFixed(1) + 'M' : views >= 1_000 ? (views / 1_000).toFixed(0) + 'K' : String(views)) : null;

  if (views && views > 1_000_000) {
    factors.push(`${fmtViews} просмотров — видео попало в рекомендации YouTube`);
  } else if (views && views > 100_000) {
    factors.push(`${fmtViews} просмотров — хороший органический охват`);
  }
  if (hasNumbers(title)) {
    factors.push(`Число в заголовке "${title.match(/\d+/)?.[0] ?? ''}" повышает кликабельность`);
  }
  if (hasQuestion(title)) {
    factors.push('Вопрос в заголовке создаёт интригу и повышает CTR');
  }
  if (engagementRate > 5) {
    factors.push(`Engagement rate ${engagementRate.toFixed(1)}% — выше среднего, алгоритм продвигает`);
  }
  if (countEmojis(title) >= 1 && countEmojis(title) <= 2) {
    factors.push(`${countEmojis(title)} эмодзи в заголовке — оптимальное количество для привлечения внимания`);
  }
  if (tags && tags.length >= 5) {
    factors.push(`${tags.length} тегов — хорошая оптимизация для YouTube поиска`);
  }
  if (hookScore >= 8) {
    factors.push(`Хук ${hookScore}/10 — заголовок сильно цепляет`);
  }
  if (titleScore >= 8) {
    factors.push(`Title score ${titleScore}/10 — SEO-оптимизирован для поиска`);
  }

  return factors.slice(0, 5);
}

/* ─── NEW: Language detection ─────────────────────────────────────── */

function detectLanguage(text: string): 'ru' | 'en' | 'mixed' | 'other' {
  const cyrillic = (text.match(/[а-яёА-ЯЁ]/g) || []).length;
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  const total = cyrillic + latin;
  if (total === 0) return 'other';
  const cyrillicRatio = cyrillic / total;
  const latinRatio = latin / total;
  if (cyrillicRatio > 0.7) return 'ru';
  if (latinRatio > 0.7) return 'en';
  if (cyrillicRatio > 0.2 && latinRatio > 0.2) return 'mixed';
  return 'other';
}

/* ─── NEW: Readability score ──────────────────────────────────────── */

function calculateReadability(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 5;

  let score = 7; // baseline

  // Average word length penalty
  const avgWordLen = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  if (avgWordLen > 8) score -= 2;
  else if (avgWordLen > 6) score -= 1;
  else if (avgWordLen <= 4) score += 1;

  // Too many words in title = harder to read
  if (words.length > 12) score -= 1;
  if (words.length < 3) score -= 1;

  // Has separators (easier to scan)
  if (/[|—–\-:]/.test(text)) score += 1;

  // Excessive caps = harder to read
  if (capsRatio(text) > 0.5) score -= 1;

  return Math.max(1, Math.min(10, Math.round(score)));
}

/* ─── NEW: Extract keywords from title ────────────────────────────── */

function extractKeywords(title: string): string[] {
  const stopWords = new Set([
    'в', 'на', 'и', 'а', 'но', 'или', 'не', 'с', 'к', 'по', 'за', 'из', 'от', 'до', 'у', 'о', 'об',
    'для', 'это', 'что', 'как', 'все', 'мы', 'вы', 'он', 'она', 'они', 'я', 'ты', 'мой', 'твой',
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'and', 'or', 'but', 'not', 'so', 'if', 'than',
  ]);

  const words = title
    .toLowerCase()
    .replace(/[^\wа-яёА-ЯЁ\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Deduplicate
  return [...new Set(words)];
}

/* ─── NEW: Shorts analysis ────────────────────────────────────────── */

interface ShortsAnalysis {
  hookQuality: 'strong' | 'medium' | 'weak';
  loopPotential: number;
  verticalOptimized: boolean;
  optimalLength: string;
  trendAlignment: 'high' | 'medium' | 'low';
  shareability: number;
  tips: string[];
}

function analyzeShortsContent(
  title: string,
  durationSec: number,
  tags?: string[],
  description?: string,
): ShortsAnalysis {
  const combined = [title, ...(tags ?? []), description ?? ''].join(' ').toLowerCase();

  // Hook quality: first impression of the title
  const emotionalCount = countEmotionalWords(title);
  const powerCount = countPowerWords(title);
  const hookStrength = emotionalCount + powerCount + (hasQuestion(title) ? 1 : 0) + (hasNumbers(title) ? 1 : 0);
  const hookQuality: 'strong' | 'medium' | 'weak' =
    hookStrength >= 3 ? 'strong' : hookStrength >= 1 ? 'medium' : 'weak';

  // Loop potential: does title/description suggest a loop?
  const loopKeywords = ['петля', 'loop', 'повтор', 'repeat', 'снова', 'again', 'wait for it', 'подожди', 'конец'];
  let loopScore = 3; // baseline
  for (const kw of loopKeywords) {
    if (combined.includes(kw)) loopScore += 2;
  }
  // Short duration helps loops
  if (durationSec <= 15) loopScore += 2;
  else if (durationSec <= 30) loopScore += 1;
  // Emotional content loops better
  loopScore += Math.min(emotionalCount, 2);
  const loopPotential = Math.max(1, Math.min(10, loopScore));

  // Vertical optimized: Shorts are always vertical
  const verticalOptimized = true;

  // Optimal length advice
  const optimalLength = durationSec <= 30
    ? 'Shorts до 30с получают на 20% больше просмотров — ваша длина оптимальна!'
    : durationSec <= 45
      ? 'Shorts до 30с получают на 20% больше просмотров. Попробуйте сократить до 30с.'
      : 'Shorts до 30с получают на 20% больше просмотров. Ваше видео длинное для Shorts — рассмотрите сокращение.';

  // Trend alignment: check if title/tags hit common trending topics
  const trendingTopics = [
    'тренд', 'trend', 'viral', 'вирал', 'челлендж', 'challenge', 'тикток', 'tiktok',
    'рек', 'fyp', 'рекомендации', 'хайп', 'hype', 'shorts', 'reels',
    'мем', 'meme', 'satisfying', 'asmr', 'асмр', 'hack', 'лайфхак',
  ];
  let trendCount = 0;
  for (const t of trendingTopics) {
    if (combined.includes(t)) trendCount++;
  }
  const trendAlignment: 'high' | 'medium' | 'low' =
    trendCount >= 3 ? 'high' : trendCount >= 1 ? 'medium' : 'low';

  // Shareability: based on emotional words, humor markers, emojis
  let shareScore = 3;
  shareScore += Math.min(emotionalCount * 1.5, 3);
  shareScore += Math.min(countHumorMarkers(combined) * 1.5, 3);
  shareScore += Math.min(countEmojis(title) * 0.5, 1);
  if (hasQuestion(title)) shareScore += 0.5;
  const shareability = Math.max(1, Math.min(10, Math.round(shareScore)));

  // Shorts-specific tips
  const shortsTips: string[] = [];

  if (hookQuality === 'weak') {
    shortsTips.push('Первые 1-3 секунды решают всё в Shorts. Добавьте мощный визуальный или текстовый хук.');
  }
  if (durationSec > 30) {
    shortsTips.push('Shorts до 30 секунд получают на 20% больше просмотров. Сократите видео.');
  }
  if (loopPotential < 5) {
    shortsTips.push('Сделайте концовку, которая плавно переходит в начало — это увеличивает время просмотра.');
  }
  if (trendAlignment === 'low') {
    shortsTips.push('Используйте трендовые хештеги и звуки для попадания в рекомендации Shorts.');
  }
  if (shareability < 5) {
    shortsTips.push('Добавьте эмоциональный элемент или юмор — это повышает шансы на репосты.');
  }
  shortsTips.push('Добавьте текст на экран — 80% зрителей Shorts смотрят без звука.');
  shortsTips.push('Используйте вертикальный формат 9:16 для максимального охвата.');

  if (countEmojis(title) === 0) {
    shortsTips.push('Добавьте эмодзи в заголовок — в Shorts это особенно важно для привлечения внимания.');
  }

  return {
    hookQuality,
    loopPotential,
    verticalOptimized,
    optimalLength,
    trendAlignment,
    shareability,
    tips: shortsTips.slice(0, 6),
  };
}

/* ─── NEW: SEO analysis ───────────────────────────────────────────── */

interface SEOAnalysis {
  titleLength: { chars: number; optimal: string; status: 'short' | 'optimal' | 'long' };
  titleKeywords: string[];
  descriptionLength: number | null;
  descriptionHasLinks: boolean;
  descriptionHasTimestamps: boolean;
  tagsCount: number;
  tags: string[];
  hashtagsInTitle: number;
  languageDetected: 'ru' | 'en' | 'mixed' | 'other';
  readabilityScore: number;
  searchOptimization: 'strong' | 'medium' | 'weak';
}

function analyzeSEO(
  title: string,
  description?: string,
  tags?: string[],
): SEOAnalysis {
  const titleLen = title.length;
  const titleStatus: 'short' | 'optimal' | 'long' =
    titleLen < 30 ? 'short' : titleLen > 70 ? 'long' : 'optimal';

  const titleKeywords = extractKeywords(title);

  const descLen = description ? description.length : null;
  const descHasLinks = description ? /https?:\/\//.test(description) : false;
  const descHasTimestamps = description ? /\d{1,2}:\d{2}/.test(description) : false;

  const tagsList = tags ?? [];
  const tagsCount = tagsList.length;

  const hashtagsInTitle = (title.match(/#\w+/g) || []).length;

  const languageDetected = detectLanguage(title);
  const readabilityScore = calculateReadability(title);

  // Search optimization overall
  let seoPoints = 0;
  if (titleStatus === 'optimal') seoPoints += 2;
  else if (titleStatus !== 'long') seoPoints += 1;
  if (titleKeywords.length >= 3) seoPoints += 2;
  else if (titleKeywords.length >= 1) seoPoints += 1;
  if (tagsCount >= 5) seoPoints += 2;
  else if (tagsCount >= 1) seoPoints += 1;
  if (descLen && descLen > 200) seoPoints += 1;
  if (descHasLinks) seoPoints += 0.5;
  if (descHasTimestamps) seoPoints += 0.5;
  if (hashtagsInTitle >= 1 && hashtagsInTitle <= 3) seoPoints += 1;

  const searchOptimization: 'strong' | 'medium' | 'weak' =
    seoPoints >= 7 ? 'strong' : seoPoints >= 4 ? 'medium' : 'weak';

  return {
    titleLength: { chars: titleLen, optimal: '40-70 символов', status: titleStatus },
    titleKeywords,
    descriptionLength: descLen,
    descriptionHasLinks: descHasLinks,
    descriptionHasTimestamps: descHasTimestamps,
    tagsCount,
    tags: tagsList,
    hashtagsInTitle,
    languageDetected,
    readabilityScore,
    searchOptimization,
  };
}

/* ─── NEW: Thumbnail analysis ─────────────────────────────────────── */

interface ThumbnailAnalysis {
  url: string;
  hasCustomThumbnail: boolean;
  resolution: 'HD' | 'SD';
  aspectRatio: string;
  tips: string[];
}

async function analyzeThumbnail(
  videoId: string,
  oembedWidth: number,
  oembedHeight: number,
): Promise<ThumbnailAnalysis> {
  const maxresUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const hqUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  // Check if maxresdefault exists (indicates custom thumbnail)
  let hasCustomThumbnail = false;
  try {
    const res = await fetch(maxresUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
    hasCustomThumbnail = res.ok && res.status === 200;
  } catch {
    // If request fails, assume no custom thumbnail
  }

  const url = hasCustomThumbnail ? maxresUrl : hqUrl;
  const resolution: 'HD' | 'SD' = oembedWidth >= 1280 || hasCustomThumbnail ? 'HD' : 'SD';

  // Aspect ratio from oEmbed dimensions
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  let aspectRatio = '16:9';
  if (oembedWidth > 0 && oembedHeight > 0) {
    const d = gcd(oembedWidth, oembedHeight);
    aspectRatio = `${oembedWidth / d}:${oembedHeight / d}`;
  }

  const tips: string[] = [];
  if (!hasCustomThumbnail) {
    tips.push('Установите кастомный превью! Видео с кастомным превью получают на 30% больше кликов.');
  } else {
    tips.push('Отлично! У вас установлен кастомный превью.');
  }
  tips.push('Используйте крупные лица и яркие цвета — это повышает CTR.');
  tips.push('Добавьте 2-3 слова крупным шрифтом на превью для контекста.');
  tips.push('Избегайте мелких деталей — превью часто отображается в маленьком размере.');
  if (resolution === 'SD') {
    tips.push('Загрузите превью в высоком разрешении (1280x720 минимум).');
  }

  return {
    url,
    hasCustomThumbnail,
    resolution,
    aspectRatio,
    tips: tips.slice(0, 5),
  };
}

/* ─── NEW: Engagement deep dive ───────────────────────────────────── */

interface EngagementAnalysis {
  likeToDislikeEstimate: 'positive' | 'mixed' | 'negative';
  commentRate: number | null;
  likeRate: number | null;
  viralCoefficient: number | null;
  benchmarkComparison: 'above average' | 'average' | 'below average';
  audienceRetentionEstimate: 'high' | 'medium' | 'low';
}

function analyzeEngagement(
  views?: number,
  likes?: number,
  comments?: number,
  engagementRate?: number,
): EngagementAnalysis {
  // Like to dislike estimate: based on like/view ratio
  // Since YouTube removed dislikes, we estimate from like ratio
  let likeToDislikeEstimate: 'positive' | 'mixed' | 'negative' = 'mixed';
  if (views && views > 0 && likes !== undefined) {
    const likeRatio = likes / views;
    if (likeRatio > 0.04) likeToDislikeEstimate = 'positive';
    else if (likeRatio > 0.015) likeToDislikeEstimate = 'mixed';
    else likeToDislikeEstimate = 'negative';
  }

  // Comment rate: comments per 1000 views
  const commentRate = views && views > 0 && comments !== undefined
    ? Math.round((comments / views) * 10000) / 10
    : null;

  // Like rate: likes per 1000 views
  const likeRate = views && views > 0 && likes !== undefined
    ? Math.round((likes / views) * 10000) / 10
    : null;

  // Viral coefficient (views relative to typical — placeholder since we don't have subscriber count)
  const viralCoefficient = views && views > 0
    ? views > 1_000_000 ? Math.round(views / 100_000 * 10) / 10 : null
    : null;

  // Benchmark comparison: engagement rate vs typical YouTube average (2-5%)
  let benchmarkComparison: 'above average' | 'average' | 'below average' = 'average';
  if (engagementRate !== undefined) {
    if (engagementRate > 5) benchmarkComparison = 'above average';
    else if (engagementRate >= 2) benchmarkComparison = 'average';
    else benchmarkComparison = 'below average';
  }

  // Audience retention estimate: based on engagement signals
  let audienceRetentionEstimate: 'high' | 'medium' | 'low' = 'medium';
  if (engagementRate !== undefined) {
    if (engagementRate > 6) audienceRetentionEstimate = 'high';
    else if (engagementRate >= 2.5) audienceRetentionEstimate = 'medium';
    else audienceRetentionEstimate = 'low';
  }
  // High comment rate also indicates good retention
  if (commentRate !== null && commentRate > 5) {
    audienceRetentionEstimate = 'high';
  }

  return {
    likeToDislikeEstimate,
    commentRate,
    likeRate,
    viralCoefficient,
    benchmarkComparison,
    audienceRetentionEstimate,
  };
}

/* ─── NEW: Content strategy ───────────────────────────────────────── */

interface ContentStrategy {
  bestPostingTime: string;
  recommendedFrequency: string;
  crossPlatformPotential: string[];
  audienceAge: string;
}

function analyzeStrategy(
  contentType: string,
  categoryId?: string,
  isShort = false,
  durationSec = 0,
): ContentStrategy {
  // Best posting time by content type
  const postingTimes: Record<string, string> = {
    tutorial: 'Вторник-четверг, 10:00-12:00 (MSK) — рабочая аудитория ищет решения',
    review: 'Пятница-суббота, 14:00-18:00 (MSK) — люди планируют покупки',
    news: 'Утро 8:00-10:00 (MSK) — аудитория проверяет новости',
    vlog: 'Суббота-воскресенье, 12:00-16:00 (MSK) — время отдыха',
    entertainment: 'Пятница 18:00 - Воскресенье 22:00 (MSK) — пиковый досуг',
    podcast: 'Понедельник-среда, 7:00-9:00 (MSK) — дорога на работу',
    gaming: 'Ежедневно 16:00-22:00 (MSK) — после школы/работы',
    music: 'Пятница 12:00 (MSK) — новые релизы выходят в пятницу',
    livestream: 'Вечер 19:00-22:00 (MSK) — максимум онлайн зрителей',
  };

  const bestPostingTime = postingTimes[contentType] ?? postingTimes['entertainment']!;

  // Recommended frequency
  const frequencies: Record<string, string> = {
    tutorial: '1-2 видео в неделю — качество важнее количества',
    review: '2-3 видео в неделю — пока товар актуален',
    news: 'Ежедневно — новости устаревают быстро',
    vlog: '1-2 видео в неделю — регулярность удерживает аудиторию',
    entertainment: '2-3 видео в неделю — алгоритм любит регулярность',
    podcast: '1 выпуск в неделю — стандарт для подкастов',
    gaming: '3-5 видео в неделю — высокая конкуренция требует частого контента',
    music: '1-2 трека в месяц — фокус на качество продакшена',
    livestream: '2-3 стрима в неделю — регулярное расписание важно',
  };
  let recommendedFrequency = frequencies[contentType] ?? frequencies['entertainment']!;
  if (isShort) {
    recommendedFrequency = '1-3 Shorts в день — алгоритм Shorts вознаграждает частую публикацию';
  }

  // Cross-platform potential
  const crossPlatform: string[] = [];
  if (isShort || durationSec <= 60) {
    crossPlatform.push('TikTok', 'Instagram Reels', 'VK Клипы', 'Telegram');
  }
  if (contentType === 'podcast') {
    crossPlatform.push('Apple Podcasts', 'Spotify', 'Яндекс Музыка', 'Telegram');
  }
  if (contentType === 'tutorial' || contentType === 'review') {
    crossPlatform.push('Дзен', 'VC.ru', 'Habr', 'Telegram');
  }
  if (contentType === 'gaming') {
    crossPlatform.push('Twitch', 'VK Play Live', 'Discord');
  }
  if (crossPlatform.length === 0) {
    crossPlatform.push('Telegram', 'VK', 'Дзен');
  }

  // Audience age estimate based on content type
  const ageEstimates: Record<string, string> = {
    tutorial: '25-44 — профессионалы и студенты',
    review: '18-35 — покупатели и техно-энтузиасты',
    news: '25-54 — широкая взрослая аудитория',
    vlog: '18-34 — молодая аудитория',
    entertainment: '13-34 — молодая и подростковая аудитория',
    podcast: '25-44 — образованная аудитория',
    gaming: '13-24 — подростки и молодые взрослые',
    music: '16-34 — молодая аудитория',
    livestream: '16-34 — активные пользователи платформы',
  };

  const audienceAge = ageEstimates[contentType] ?? ageEstimates['entertainment']!;

  return {
    bestPostingTime,
    recommendedFrequency,
    crossPlatformPotential: [...new Set(crossPlatform)],
    audienceAge,
  };
}

/* ─── NEW: Competition context ────────────────────────────────────── */

interface CompetitionContext {
  nichePopularity: 'trending' | 'stable' | 'declining';
  contentSaturation: 'high' | 'medium' | 'low';
  differentiationTips: string[];
}

function analyzeCompetition(
  contentType: string,
  categoryId?: string,
  isShort = false,
): CompetitionContext {
  // Niche popularity estimates based on content type
  const trendingTypes = ['gaming', 'entertainment', 'tutorial'];
  const decliningTypes = ['news', 'music'];
  const nichePopularity: 'trending' | 'stable' | 'declining' =
    isShort ? 'trending' :
    trendingTypes.includes(contentType) ? 'trending' :
    decliningTypes.includes(contentType) ? 'stable' : // news/music are stable, not really declining on YT
    'stable';

  // Content saturation
  const highSaturation = ['gaming', 'entertainment', 'vlog', 'music'];
  const lowSaturation = ['podcast', 'tutorial'];
  const contentSaturation: 'high' | 'medium' | 'low' =
    highSaturation.includes(contentType) ? 'high' :
    lowSaturation.includes(contentType) ? 'low' :
    'medium';

  // Differentiation tips
  const tips: string[] = [];

  if (contentSaturation === 'high') {
    tips.push('Ниша перенасыщена — найдите уникальный угол или суб-нишу для выделения.');
    tips.push('Создайте серию видео с единым стилем — это формирует узнаваемый бренд.');
  }

  if (contentType === 'tutorial') {
    tips.push('Сфокусируйтесь на конкретных проблемах, а не общих темах — длинный хвост поиска.');
    tips.push('Добавляйте практические примеры и шаблоны — это увеличивает ценность контента.');
  } else if (contentType === 'review') {
    tips.push('Будьте честными в обзорах — доверие аудитории важнее спонсоров.');
    tips.push('Сравнивайте несколько продуктов — такие видео ранжируются лучше.');
  } else if (contentType === 'gaming') {
    tips.push('Играйте в новые релизы первыми — алгоритм продвигает свежий контент.');
    tips.push('Создавайте гайды и советы — они ищутся больше, чем летсплеи.');
  } else if (contentType === 'entertainment') {
    tips.push('Развивайте уникальный стиль монтажа — это ваш главный отличитель.');
    tips.push('Коллаборации с другими авторами помогут привлечь новую аудиторию.');
  } else {
    tips.push('Публикуйте регулярно по расписанию — это важнее частоты.');
    tips.push('Изучите топ-10 конкурентов и определите, чего не хватает в их контенте.');
  }

  if (isShort) {
    tips.push('В Shorts ключевой фактор — первые 2 секунды. Тестируйте разные хуки.');
  }

  tips.push('Отвечайте на каждый комментарий в первые 24 часа — это буст для алгоритма.');

  return {
    nichePopularity,
    contentSaturation,
    differentiationTips: tips.slice(0, 5),
  };
}

/* ─── NEW: Overall score calculation ──────────────────────────────── */

function calculateOverallScore(params: {
  hookScore: number;
  titleScore: number;
  engagementRate: number;
  hasCustomThumbnail: boolean;
  tagsCount: number;
  descriptionLength: number | null;
  readabilityScore: number;
  seoStrength: 'strong' | 'medium' | 'weak';
  isShort: boolean;
  durationSec: number;
  views?: number;
  likes?: number;
  comments?: number;
}): number {
  let score = 0;

  // Hook score contributes 15 points max
  score += (params.hookScore / 10) * 15;

  // Title SEO contributes 15 points max
  score += (params.titleScore / 10) * 15;

  // Engagement rate contributes 20 points max
  if (params.engagementRate > 0) {
    const engScore = Math.min(params.engagementRate / 8, 1); // 8% = perfect
    score += engScore * 20;
  } else {
    score += 10; // neutral if no data
  }

  // Custom thumbnail: 10 points
  score += params.hasCustomThumbnail ? 10 : 2;

  // Tags: 10 points max
  score += Math.min(params.tagsCount / 10, 1) * 10;

  // Description quality: 10 points max
  if (params.descriptionLength !== null) {
    if (params.descriptionLength > 500) score += 10;
    else if (params.descriptionLength > 200) score += 7;
    else if (params.descriptionLength > 50) score += 4;
    else score += 2;
  } else {
    score += 5; // neutral
  }

  // Readability: 10 points max
  score += (params.readabilityScore / 10) * 10;

  // SEO strength: 10 points max
  score += params.seoStrength === 'strong' ? 10 : params.seoStrength === 'medium' ? 6 : 3;

  return Math.max(1, Math.min(100, Math.round(score)));
}

/* ══════════════════════════════════════════════════════════════════════
 * GET /api/tools/youtube-analyzer?url=<youtube_url>
 *
 * Returns video metadata fetched via YouTube's free oEmbed endpoint.
 * ══════════════════════════════════════════════════════════════════════ */

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success: rlOk, reset } = await rateLimit({
    identifier: `yt-analyze-info:${session.user.id}`,
    limit: 15,
    window: 60,
  });
  if (!rlOk) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } },
    );
  }

  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing "url" query parameter' },
      { status: 400 },
    );
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: 'Invalid YouTube URL. Please provide a valid youtube.com or youtu.be link.' },
      { status: 400 },
    );
  }

  try {
    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;

    const oembedRes = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'TubeForge/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (!oembedRes.ok) {
      if (oembedRes.status === 401 || oembedRes.status === 403) {
        return NextResponse.json(
          { error: 'This video is private or restricted.' },
          { status: 403 },
        );
      }
      return NextResponse.json(
        { error: 'Video not found. Please check the URL and try again.' },
        { status: 404 },
      );
    }

    const data = (await oembedRes.json()) as OEmbedResponse;

    return NextResponse.json({
      videoId,
      title: data.title,
      channel: data.author_name,
      channelUrl: data.author_url,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      thumbnailHq: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      thumbnailMq: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      watchUrl: canonicalUrl,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'Request timed out. YouTube may be slow — please try again.'
        : 'Failed to fetch video information. Please try again later.';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/* ══════════════════════════════════════════════════════════════════════
 * POST /api/tools/youtube-analyzer
 *
 * Performs a comprehensive video analysis:
 *   - Fetches metadata via oEmbed (always available)
 *   - Enriches with YouTube Data API v3 stats if YOUTUBE_API_KEY is set
 *   - Calculates hook score, title SEO score, engagement rate
 *   - Detects Shorts and provides Shorts-specific analysis
 *   - Full SEO analysis, thumbnail analysis, engagement deep dive
 *   - Content strategy, competition context
 *   - Overall score (1-100)
 *   - All tips and labels in Russian
 *
 * Body: { url: string }
 * ══════════════════════════════════════════════════════════════════════ */

const analyzeSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success: rlOk, reset } = await rateLimit({
    identifier: `yt-analyze:${session.user.id}`,
    limit: 15,
    window: 60,
  });
  if (!rlOk) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = analyzeSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { url } = parsed.data;
  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: 'Invalid YouTube URL. Please provide a valid youtube.com or youtu.be link.' },
      { status: 400 },
    );
  }

  try {
    // ── Step 1: Fetch oEmbed data (always available, no API key needed) ──
    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;

    const oembedRes = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'TubeForge/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (!oembedRes.ok) {
      if (oembedRes.status === 401 || oembedRes.status === 403) {
        return NextResponse.json(
          { error: 'This video is private or restricted.' },
          { status: 403 },
        );
      }
      return NextResponse.json(
        { error: 'Video not found. Please check the URL and try again.' },
        { status: 404 },
      );
    }

    const oembed = (await oembedRes.json()) as OEmbedResponse;
    const title = oembed.title;
    const channel = oembed.author_name;

    // ── Step 2: Try YouTube Data API v3 for enriched data ────────────
    let publishedAt: string | undefined;
    let duration: string | undefined;
    let views: number | undefined;
    let likes: number | undefined;
    let comments: number | undefined;
    let tags: string[] | undefined;
    let categoryId: string | undefined;
    let description: string | undefined;
    let dataApiAvailable = false;
    let channelId: string | undefined;
    let subscriberCount: number | undefined;
    let channelVideoCount: number | undefined;
    let channelCreatedAt: string | undefined;
    let authorComments: { text: string; likeCount: number; publishedAt: string }[] = [];
    let topComments: { author: string; text: string; likeCount: number; publishedAt: string }[] = [];
    let defaultAudioLanguage: string | undefined;
    let licensedContent: boolean | undefined;

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (youtubeApiKey) {
      try {
        const dataApiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${youtubeApiKey}&part=snippet,statistics,contentDetails`;

        const dataRes = await fetch(dataApiUrl, {
          headers: { 'User-Agent': 'TubeForge/1.0' },
          signal: AbortSignal.timeout(8000),
        });

        if (dataRes.ok) {
          const dataJson = (await dataRes.json()) as YouTubeDataAPIResponse;
          const item = dataJson.items?.[0];

          if (item) {
            dataApiAvailable = true;
            publishedAt = item.snippet?.publishedAt;
            duration = item.contentDetails?.duration;
            description = item.snippet?.description;
            tags = item.snippet?.tags;
            categoryId = item.snippet?.categoryId;

            views = item.statistics?.viewCount ? parseInt(item.statistics.viewCount, 10) : undefined;
            likes = item.statistics?.likeCount ? parseInt(item.statistics.likeCount, 10) : undefined;
            comments = item.statistics?.commentCount ? parseInt(item.statistics.commentCount, 10) : undefined;
            channelId = (item.snippet as any)?.channelId;
            defaultAudioLanguage = (item.snippet as any)?.defaultAudioLanguage;
            licensedContent = (item.contentDetails as any)?.licensedContent;

            // Fetch channel info
            if (channelId && youtubeApiKey) {
              try {
                const chRes = await fetch(
                  `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&key=${youtubeApiKey}&part=snippet,statistics`,
                  { headers: { 'User-Agent': 'TubeForge/1.0' }, signal: AbortSignal.timeout(5000) },
                );
                if (chRes.ok) {
                  const chJson = await chRes.json();
                  const ch = (chJson as any).items?.[0];
                  if (ch) {
                    subscriberCount = ch.statistics?.subscriberCount ? parseInt(ch.statistics.subscriberCount, 10) : undefined;
                    channelVideoCount = ch.statistics?.videoCount ? parseInt(ch.statistics.videoCount, 10) : undefined;
                    channelCreatedAt = ch.snippet?.publishedAt;
                  }
                }
              } catch { /* channel fetch failed */ }
            }

            // Fetch top comments + author comments
            try {
              const cmRes = await fetch(
                `https://www.googleapis.com/youtube/v3/commentThreads?videoId=${videoId}&key=${youtubeApiKey}&part=snippet&maxResults=20&order=relevance`,
                { headers: { 'User-Agent': 'TubeForge/1.0' }, signal: AbortSignal.timeout(5000) },
              );
              if (cmRes.ok) {
                const cmJson = await cmRes.json();
                const threads = (cmJson as any).items ?? [];
                for (const thread of threads) {
                  const snip = thread?.snippet?.topLevelComment?.snippet;
                  if (!snip) continue;
                  const entry = {
                    author: snip.authorDisplayName ?? '',
                    text: (snip.textDisplay ?? '').slice(0, 300),
                    likeCount: snip.likeCount ?? 0,
                    publishedAt: snip.publishedAt ?? '',
                  };
                  if (snip.authorChannelId?.value === channelId) {
                    authorComments.push({ text: entry.text, likeCount: entry.likeCount, publishedAt: entry.publishedAt });
                  }
                  topComments.push(entry);
                }
                topComments = topComments.slice(0, 10);
                authorComments = authorComments.slice(0, 5);
              }
            } catch { /* comments fetch failed */ }
          }
        } else {
          ytLog.warn('YouTube Data API returned error', { status: dataRes.status });
        }
      } catch (err) {
        ytLog.warn('YouTube Data API request failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // ── Step 3: Detect Shorts ────────────────────────────────────────
    const durationSec = duration ? parseDurationToSeconds(duration) : 0;
    const isShort = isShortsUrl(url) || (durationSec > 0 && durationSec <= 60);

    // ── Step 4: Calculate core analysis scores ───────────────────────
    const hookScore = calculateHookScore(title);
    const titleScore = calculateTitleScore(title);

    // Engagement rate: (likes + comments) / views * 100
    let engagementRate = 0;
    if (views && views > 0) {
      engagementRate = Math.round(((likes ?? 0) + (comments ?? 0)) / views * 10000) / 100;
    }

    const estimatedCTR = estimateCTR(hookScore, titleScore);
    const contentType = estimateContentType(title, tags, description);
    const structure = estimateStructure(duration, isShort);
    const tips = generateTips(title, hookScore, engagementRate, duration, contentType);
    const viralFactors = detectViralFactors(title, hookScore, titleScore, engagementRate, views, tags);

    // ── Step 5: Shorts analysis ──────────────────────────────────────
    const shortsAnalysis = isShort
      ? analyzeShortsContent(title, durationSec, tags, description)
      : null;

    // ── Step 6: SEO analysis ─────────────────────────────────────────
    const seo = analyzeSEO(title, description, tags);

    // ── Step 7: Thumbnail analysis ───────────────────────────────────
    const thumbnailAnalysis = await analyzeThumbnail(
      videoId,
      oembed.thumbnail_width,
      oembed.thumbnail_height,
    );

    // ── Step 8: Engagement deep dive ─────────────────────────────────
    const engagement = analyzeEngagement(views, likes, comments, engagementRate);

    // ── Step 9: Content strategy ─────────────────────────────────────
    const strategy = analyzeStrategy(contentType, categoryId, isShort, durationSec);

    // ── Step 10: Competition context ─────────────────────────────────
    const competition = analyzeCompetition(contentType, categoryId, isShort);

    // ── Step 11: Category in Russian ─────────────────────────────────
    const categoryName = categoryId ? (CATEGORY_MAP[categoryId] ?? `Категория #${categoryId}`) : null;

    // ── Step 12: Overall score ───────────────────────────────────────
    const overallScore = calculateOverallScore({
      hookScore,
      titleScore,
      engagementRate,
      hasCustomThumbnail: thumbnailAnalysis.hasCustomThumbnail,
      tagsCount: seo.tagsCount,
      descriptionLength: seo.descriptionLength,
      readabilityScore: seo.readabilityScore,
      seoStrength: seo.searchOptimization,
      isShort,
      durationSec,
      views,
      likes,
      comments,
    });

    // ── Step 13: Build response ──────────────────────────────────────
    return NextResponse.json({
      // Core fields (kept from original)
      videoId,
      title,
      channel,
      thumbnail: thumbnailAnalysis.url,
      publishedAt: publishedAt ?? null,
      duration: duration ?? null,
      durationSeconds: durationSec || null,
      stats: {
        views: views ?? null,
        likes: likes ?? null,
        comments: comments ?? null,
      },

      // Core analysis (kept from original, enriched)
      analysis: {
        hookScore,
        titleScore,
        thumbnailPresent: true,
        engagementRate,
        estimatedCTR,
        contentType,
        tips,
        structure,
        viralFactors,
      },

      // NEW: Shorts detection & analysis
      isShorts: isShort,
      shortsAnalysis,

      // NEW: SEO deep dive
      seo,

      // NEW: Thumbnail analysis
      thumbnailAnalysis,

      // NEW: Engagement deep dive
      engagement,

      // NEW: Content strategy
      strategy,

      // NEW: Competition context
      competition,

      // NEW: Category in Russian
      categoryId: categoryId ?? null,
      categoryName,

      // NEW: Overall score (1-100)
      overallScore,

      // Channel info
      channelId: channelId ?? null,
      channelStats: channelId ? {
        subscribers: subscriberCount ?? null,
        totalVideos: channelVideoCount ?? null,
        createdAt: channelCreatedAt ?? null,
      } : null,
      authorComments: authorComments.length > 0 ? authorComments : null,
      topComments: topComments.length > 0 ? topComments : null,
      description: description ? description.slice(0, 2000) : null,
      defaultAudioLanguage: defaultAudioLanguage ?? null,
      licensedContent: licensedContent ?? null,

      // Meta
      dataApiAvailable,
    });
  } catch (err) {
    ytLog.error('Analysis error', { error: err instanceof Error ? err.message : String(err) });

    const message =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'Request timed out. YouTube may be slow — please try again.'
        : 'Failed to analyze video. Please try again later.';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
