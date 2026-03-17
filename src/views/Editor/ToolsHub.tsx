'use client';

import { useState, useMemo, useCallback, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import type { Theme } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════════
   TOOL DEFINITIONS
   ═══════════════════════════════════════════════════════════════════ */

type ToolCategory = 'all' | 'creation' | 'optimization' | 'audio' | 'publishing';

interface ToolDef {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: ToolCategory;
  route?: string;
  available: boolean;
  badge?: string;
  gradient: [string, string];
}

const TOOLS: ToolDef[] = [
  {
    id: 'video',
    name: 'Видео генерация',
    subtitle: 'ИИ · Runway ML',
    description: 'Создайте видео из текстовых промптов с помощью Runway ML Gen-3 Alpha. Управляйте сценами, моделями и эффектами.',
    category: 'creation',
    route: '/editor',
    available: true,
    badge: 'Популярное',
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: 'thumbnails',
    name: 'Редактор обложек',
    subtitle: 'Canvas · DALL-E 3',
    description: 'Полнофункциональный canvas-редактор как в Canva. Текст, фигуры, изображения, ИИ-генерация обложек.',
    category: 'creation',
    route: '/thumbnails',
    available: true,
    gradient: ['#ec4899', '#f43f5e'],
  },
  {
    id: 'metadata',
    name: 'SEO Метаданные',
    subtitle: 'ИИ · Claude',
    description: 'Оптимизируйте название, описание и теги видео. ИИ анализирует тренды и генерирует SEO-контент.',
    category: 'optimization',
    route: '/metadata',
    available: true,
    gradient: ['#14b8a6', '#06b6d4'],
  },
  {
    id: 'preview',
    name: 'Превью и публикация',
    subtitle: 'YouTube · Публикация',
    description: 'Проверьте финальный результат и загрузите видео напрямую на YouTube. Планирование публикаций.',
    category: 'publishing',
    route: '/preview',
    available: true,
    gradient: ['#f59e0b', '#f97316'],
  },
  {
    id: 'scenario',
    name: 'Сценарий с ИИ',
    subtitle: 'ИИ · GPT-4o',
    description: 'Напишите профессиональный сценарий для видео с помощью ИИ. Структура, тайминги, подсказки для съёмки.',
    category: 'creation',
    available: false,
    gradient: ['#8b5cf6', '#a78bfa'],
  },
  {
    id: 'voice',
    name: 'Voice Changer',
    subtitle: 'Аудио · ИИ',
    description: 'Измените голос в любом аудио или видео файле. Клонирование голоса, эффекты, мультиязычная озвучка.',
    category: 'audio',
    available: false,
    gradient: ['#3b82f6', '#6366f1'],
  },
  {
    id: 'subtitles',
    name: 'AI Субтитры',
    subtitle: 'Whisper · Авто',
    description: 'Автоматическая генерация субтитров с помощью Whisper. Поддержка 50+ языков, стилизация, экспорт SRT.',
    category: 'audio',
    available: false,
    gradient: ['#10b981', '#34d399'],
  },
  {
    id: 'montage',
    name: 'Монтаж видео',
    subtitle: 'Редактор · Таймлайн',
    description: 'Склеивайте, обрезайте и монтируйте видео на таймлайне. Переходы, эффекты, цветокоррекция.',
    category: 'creation',
    available: false,
    gradient: ['#ef4444', '#f97316'],
  },
  {
    id: 'translate',
    name: 'Автоперевод',
    subtitle: 'ИИ · Мультиязычный',
    description: 'Автоматический перевод видео на 30+ языков. Дубляж, субтитры, локализация контента.',
    category: 'audio',
    available: false,
    gradient: ['#06b6d4', '#0ea5e9'],
  },
  {
    id: 'music',
    name: 'Музыка и звуки',
    subtitle: 'ИИ · Генерация',
    description: 'Генерация фоновой музыки и звуковых эффектов для видео. Настройка настроения, жанра, темпа.',
    category: 'audio',
    available: false,
    gradient: ['#d946ef', '#c026d3'],
  },
  {
    id: 'analytics',
    name: 'Аналитика YouTube',
    subtitle: 'YouTube · Data API',
    description: 'Детальная аналитика канала: просмотры, подписчики, CTR, удержание. Сравнение с конкурентами.',
    category: 'optimization',
    available: false,
    gradient: ['#f43f5e', '#fb7185'],
  },
  {
    id: 'scheduler',
    name: 'Планировщик контента',
    subtitle: 'Календарь · Авто',
    description: 'Планируйте публикации на неделю вперёд. Оптимальное время, серии видео, контент-план.',
    category: 'publishing',
    available: false,
    gradient: ['#0ea5e9', '#38bdf8'],
  },
  {
    id: 'templates',
    name: 'Шаблоны видео',
    subtitle: 'Библиотека · Готовые',
    description: 'Библиотека готовых шаблонов для разных форматов: Shorts, обзоры, туториалы, рекламные ролики.',
    category: 'creation',
    available: false,
    gradient: ['#a855f7', '#7c3aed'],
  },
  {
    id: 'ab-test',
    name: 'A/B Тестирование',
    subtitle: 'Оптимизация · ИИ',
    description: 'Тестируйте разные обложки и названия. ИИ анализирует CTR и рекомендует лучшие варианты.',
    category: 'optimization',
    available: false,
    gradient: ['#84cc16', '#65a30d'],
  },
  {
    id: 'collaboration',
    name: 'Совместная работа',
    subtitle: 'Команда · Realtime',
    description: 'Работайте над проектом вместе с командой в реальном времени. Комментарии, версии, права доступа.',
    category: 'publishing',
    available: false,
    gradient: ['#f59e0b', '#d97706'],
  },
];

const CATEGORIES: { key: ToolCategory; label: string }[] = [
  { key: 'all', label: 'Все инструменты' },
  { key: 'creation', label: 'Создание' },
  { key: 'optimization', label: 'Оптимизация' },
  { key: 'audio', label: 'Аудио и голос' },
  { key: 'publishing', label: 'Публикация' },
];

/* ═══════════════════════════════════════════════════════════════════
   SVG ICONS FOR TOOLS
   ═══════════════════════════════════════════════════════════════════ */

const TOOL_ICONS: Record<string, (color: string) => React.ReactNode> = {
  video: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  thumbnails: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  metadata: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  preview: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  scenario: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  voice: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  subtitles: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><line x1="6" y1="14" x2="10" y2="14" /><line x1="12" y1="14" x2="18" y2="14" /><line x1="6" y1="18" x2="14" y2="18" />
    </svg>
  ),
  montage: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="7.5 4.21 12 6.81 16.5 4.21" /><polyline points="7.5 19.79 7.5 14.6 3 12" /><polyline points="21 12 16.5 14.6 16.5 19.79" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  translate: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="5" x2="16" y2="5" /><line x1="9" y1="1" x2="9" y2="5" /><path d="M5 5c0 4 3 7.5 7 8.5" /><path d="M13 5c0 3-1.5 5.5-4 7" />
      <path d="M14 17l3-6 3 6" /><line x1="14.5" y1="15.5" x2="19.5" y2="15.5" /><path d="M22 22L14 14" />
    </svg>
  ),
  music: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  analytics: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  scheduler: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" />
    </svg>
  ),
  templates: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  'ab-test': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
    </svg>
  ),
  collaboration: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════════════════
   SEARCH ICON
   ═══════════════════════════════════════════════════════════════════ */

function SearchIcon({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SparkleIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
    </svg>
  );
}

function ArrowIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function LockIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TOOL CARD
   ═══════════════════════════════════════════════════════════════════ */

const ToolCard = memo(function ToolCard({
  tool,
  C,
  onOpen,
}: {
  tool: ToolDef;
  C: Theme;
  onOpen: (tool: ToolDef) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const iconFn = TOOL_ICONS[tool.id];

  return (
    <div
      role="button"
      tabIndex={tool.available ? 0 : -1}
      aria-label={tool.available ? `Открыть ${tool.name}` : `${tool.name} — скоро`}
      onClick={() => tool.available && onOpen(tool)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && tool.available) {
          e.preventDefault();
          onOpen(tool);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        borderRadius: 16,
        border: `1px solid ${hovered && tool.available ? tool.gradient[0] + '44' : C.border}`,
        background: C.card,
        cursor: tool.available ? 'pointer' : 'default',
        transition: 'all .2s ease',
        transform: hovered && tool.available ? 'translateY(-2px)' : 'none',
        boxShadow: hovered && tool.available
          ? `0 8px 30px ${tool.gradient[0]}18, 0 2px 8px rgba(0,0,0,0.08)`
          : '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        opacity: tool.available ? 1 : 0.7,
      }}
    >
      {/* Badge */}
      {tool.badge && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          padding: '3px 8px',
          borderRadius: 20,
          background: `linear-gradient(135deg, ${tool.gradient[0]}, ${tool.gradient[1]})`,
          color: '#fff',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.02em',
          zIndex: 2,
        }}>
          {tool.badge}
        </div>
      )}

      {/* Coming soon badge */}
      {!tool.available && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 8px',
          borderRadius: 20,
          background: C.surface,
          border: `1px solid ${C.border}`,
          color: C.sub,
          fontSize: 10,
          fontWeight: 600,
          zIndex: 2,
        }}>
          <LockIcon size={10} color={C.sub} />
          Скоро
        </div>
      )}

      {/* Icon + gradient background area */}
      <div style={{
        padding: '24px 20px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
      }}>
        {/* Icon container */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: tool.available
            ? `linear-gradient(135deg, ${tool.gradient[0]}15, ${tool.gradient[1]}15)`
            : C.surface,
          border: `1px solid ${tool.available ? tool.gradient[0] + '22' : C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all .2s',
          transform: hovered && tool.available ? 'scale(1.05)' : 'none',
        }}>
          {iconFn ? iconFn(tool.available ? tool.gradient[0] : C.dim) : null}
        </div>

        {/* Name + subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            color: tool.available ? C.text : C.sub,
            marginBottom: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            {tool.name}
          </div>
          <div style={{
            fontSize: 11,
            color: C.dim,
            fontWeight: 500,
          }}>
            {tool.subtitle}
          </div>
        </div>

        {/* Arrow */}
        {tool.available && (
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: hovered ? tool.gradient[0] + '15' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all .2s',
            flexShrink: 0,
            marginTop: 2,
          }}>
            <ArrowIcon size={14} color={hovered ? tool.gradient[0] : C.dim} />
          </div>
        )}
      </div>

      {/* Description */}
      <div style={{
        padding: '0 20px 20px',
        fontSize: 12.5,
        lineHeight: 1.5,
        color: C.sub,
      }}>
        {tool.description}
      </div>

      {/* Bottom action bar — only for available tools */}
      {tool.available && (
        <div style={{
          padding: '10px 20px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
            color: tool.gradient[0],
          }}>
            <SparkleIcon size={12} color={tool.gradient[0]} />
            Доступно
          </span>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: C.dim,
          }}>
            Открыть →
          </span>
        </div>
      )}

      {/* Bottom bar — coming soon tools */}
      {!tool.available && (
        <div style={{
          padding: '10px 20px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: C.dim,
            letterSpacing: '.02em',
          }}>
            Скоро будет
          </span>
        </div>
      )}
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   CATEGORY TAB
   ═══════════════════════════════════════════════════════════════════ */

const CategoryTab = memo(function CategoryTab({
  label,
  active,
  C,
  onClick,
}: {
  label: string;
  active: boolean;
  C: Theme;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 18px',
        borderRadius: 50,
        border: active ? 'none' : `1px solid ${hovered ? C.accent + '44' : C.border}`,
        background: active
          ? `linear-gradient(135deg, ${C.accent}, ${C.accent}dd)`
          : hovered ? C.surface : 'transparent',
        color: active ? '#fff' : C.text,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all .2s',
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT — TOOLS HUB
   ═══════════════════════════════════════════════════════════════════ */

export function ToolsHub() {
  const C = useThemeStore((s) => s.theme);
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ToolCategory>('all');

  const filtered = useMemo(() => {
    let list = TOOLS;
    if (category !== 'all') {
      list = list.filter((t) => t.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.subtitle.toLowerCase().includes(q),
      );
    }
    // Available first, then coming soon
    return [...list].sort((a, b) => (a.available === b.available ? 0 : a.available ? -1 : 1));
  }, [search, category]);

  const handleOpen = useCallback(
    (tool: ToolDef) => {
      if (tool.route) {
        router.push(tool.route);
      }
    },
    [router],
  );

  const availableCount = TOOLS.filter((t) => t.available).length;
  const comingSoonCount = TOOLS.filter((t) => !t.available).length;

  return (
    <div style={{
      width: '100%',
      maxWidth: 1200,
      margin: '0 auto',
      padding: '0 24px',
    }}>
      {/* ── Hero Section ──────────────────────────────────── */}
      <div style={{
        textAlign: 'center',
        padding: '48px 0 32px',
      }}>
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          color: C.text,
          margin: 0,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
        }}>
          Студия инструментов
        </h1>
        <p style={{
          fontSize: 16,
          color: C.sub,
          margin: '12px 0 0',
          lineHeight: 1.5,
        }}>
          Выберите инструмент под вашу задачу — от генерации видео до SEO-оптимизации
        </p>

        {/* Stats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          margin: '20px 0 0',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
            }} />
            <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>
              {availableCount} доступно
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: C.dim,
            }} />
            <span style={{ fontSize: 13, color: C.dim, fontWeight: 500 }}>
              {comingSoonCount} скоро
            </span>
          </div>
        </div>
      </div>

      {/* ── Search Bar ──────────────────────────────────── */}
      <div style={{
        maxWidth: 560,
        margin: '0 auto 24px',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <SearchIcon size={18} color={C.dim} />
        </div>
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию или описанию..."
          style={{
            width: '100%',
            padding: '14px 16px 14px 44px',
            borderRadius: 14,
            border: `1.5px solid ${C.border}`,
            background: C.surface,
            color: C.text,
            fontSize: 14,
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color .2s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = C.accent;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = C.border;
          }}
        />
        {search && (
          <button
            onClick={() => { setSearch(''); searchRef.current?.focus(); }}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 24,
              height: 24,
              borderRadius: 6,
              border: 'none',
              background: C.surface,
              color: C.dim,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Category Tabs ──────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 28,
        overflowX: 'auto',
        paddingBottom: 4,
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {CATEGORIES.map((cat) => (
          <CategoryTab
            key={cat.key}
            label={cat.label}
            active={category === cat.key}
            C={C}
            onClick={() => setCategory(cat.key)}
          />
        ))}
      </div>

      {/* ── Tools Grid ──────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: C.dim,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            Ничего не найдено
          </div>
          <div style={{ fontSize: 13 }}>
            Попробуйте изменить запрос или категорию
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
          paddingBottom: 60,
        }}>
          {filtered.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              C={C}
              onOpen={handleOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}
