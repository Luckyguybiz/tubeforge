'use client';

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorFallback } from '@/components/ui/ErrorFallback';
import { toast } from '@/stores/useNotificationStore';
import { pluralRu, timeAgo } from '@/lib/utils';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

/* ── Status config ─────────────────────────────────────── */

const STATUS_MAP: Record<string, { label: string; color: 'green' | 'orange' | 'blue' | 'dim' | 'purple' }> = {
  PUBLISHED: { label: 'Опубликовано', color: 'green' },
  READY:     { label: 'Готово',       color: 'blue' },
  RENDERING: { label: 'Рендер...',    color: 'orange' },
  DRAFT:     { label: 'Черновик',     color: 'dim' },
};

const FILTER_OPTIONS = [
  { label: 'Все',           value: undefined },
  { label: 'Черновик',      value: 'DRAFT'     as const },
  { label: 'Рендер',        value: 'RENDERING' as const },
  { label: 'Готово',        value: 'READY'     as const },
  { label: 'Опубликовано',  value: 'PUBLISHED' as const },
];

const SORT_OPTIONS = [
  { label: 'По дате',      value: 'updatedAt'  as const },
  { label: 'По названию',  value: 'title'      as const },
  { label: 'По созданию',  value: 'createdAt'  as const },
];

const PLAN_LABEL: Record<string, string> = {
  FREE:   'Бесплатный',
  PRO:    'Pro',
  STUDIO: 'Studio',
};

/* ── SVG icons (inline, no deps) ───────────────────────── */

function IconFilm({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" /><line x1="17" y1="17" x2="22" y2="17" />
    </svg>
  );
}

function IconPlus({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconSearch({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconFolder({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

function IconSend({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconStar({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconTrash({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function IconEdit({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconChevronLeft({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconPlay({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function IconImage({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function IconEraser({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20H7L3 16c-.8-.8-.8-2 0-2.8L14.6 1.6c.8-.8 2-.8 2.8 0L21.4 5.6c.8.8.8 2 0 2.8L10 20" />
      <path d="M6 11l7 7" />
    </svg>
  );
}

function IconArrowRight({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/* ── Additional icons for welcome section ─────────────── */

function IconWrench({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconSparkles({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M18 14l.67 2 2 .67-2 .67L18 19.33l-.67-2-2-.67 2-.67L18 14z" />
    </svg>
  );
}

function IconFaceSmile({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

function IconMicrophone({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function IconUserX({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="18" y1="8" x2="23" y2="13" /><line x1="23" y1="8" x2="18" y2="13" />
    </svg>
  );
}

function IconVideo({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function IconDownload({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconScissors({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

/* ── Welcome Hero Section (Crayo-style) ──────────────── */

const HERO_ACTION_CARDS = [
  {
    title: 'Видео редактор',
    subtitle: 'Создавайте видео из текста',
    href: '/editor',
    gradient: 'linear-gradient(135deg, #4f46e5, #6366f1, #818cf8)',
    Icon: IconPlay,
  },
  {
    title: 'Редактор обложек',
    subtitle: 'Canvas-редактор как в Canva',
    href: '/thumbnails',
    gradient: 'linear-gradient(135deg, #e11d48, #ec4899, #f472b6)',
    Icon: IconImage,
  },
  {
    title: 'Бесплатные инструменты',
    subtitle: 'Конвертер, компрессор и другое',
    href: '/tools',
    gradient: 'linear-gradient(135deg, #059669, #10b981, #34d399)',
    Icon: IconWrench,
  },
];

const FEATURED_CARDS = [
  {
    title: 'AutoClip',
    description: 'Превратите длинные видео в вирусные клипы',
    href: '/tools/auto-clip',
    gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
    borderGradient: 'linear-gradient(135deg, #8b5cf6, #c084fc, #8b5cf6)',
    Icon: IconScissors,
  },
  {
    title: 'Удалить субтитры',
    description: 'Удалите субтитры с видео за минуты с помощью ИИ',
    href: '/tools/subtitle-remover',
    gradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
    borderGradient: 'linear-gradient(135deg, #ef4444, #fca5a5, #ef4444)',
    Icon: IconEraser,
  },
];

const QUICK_TOOLS = [
  { title: 'Image Generator', href: '/tools/image-generator', Icon: IconSparkles, gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
  { title: 'AI Face Swap', href: '/tools/face-swap', Icon: IconFaceSmile, gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  { title: 'Voiceover Generator', href: '/tools/voiceover-generator', Icon: IconMicrophone, gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
  { title: 'Background Remover', href: '/tools/background-remover', Icon: IconUserX, gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
  { title: 'VEO3 Generator', href: '/tools/veo3-generator', Icon: IconVideo, gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
  { title: 'YouTube Downloader', href: '/tools/youtube-downloader', Icon: IconDownload, gradient: 'linear-gradient(135deg, #ef4444, #f87171)' },
];

function WelcomeHeroSection({
  userName,
  router,
  isLoading,
}: {
  userName: string;
  router: ReturnType<typeof useRouter>;
  isLoading: boolean;
}) {
  const [hoveredHero, setHoveredHero] = useState<number | null>(null);
  const [hoveredFeatured, setHoveredFeatured] = useState<number | null>(null);
  const [hoveredQuick, setHoveredQuick] = useState<number | null>(null);
  const [hoveredAllTools, setHoveredAllTools] = useState(false);

  return (
    <div style={{ marginBottom: 32 }}>
      {/* ── Greeting ───────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 30,
          fontWeight: 800,
          margin: '0 0 6px',
          letterSpacing: '-.03em',
          lineHeight: 1.2,
        }}>
          {isLoading ? (
            <Skeleton width={300} height={36} />
          ) : (
            <>{'Привет, ' + userName + '! \uD83D\uDC4B'}</>
          )}
        </h1>
        <p style={{
          fontSize: 15,
          margin: 0,
          lineHeight: 1.5,
          opacity: 0.6,
        }}>
          Управляйте проектами и используйте инструменты
        </p>
      </div>

      {/* ── Hero Action Cards (3 columns) ──────────── */}
      <div style={{
        display: 'flex',
        gap: 14,
        flexWrap: 'wrap',
        marginBottom: 20,
      }}>
        {HERO_ACTION_CARDS.map((card, i) => {
          const isHovered = hoveredHero === i;
          return (
            <div
              key={card.href}
              onClick={() => router.push(card.href)}
              onMouseEnter={() => setHoveredHero(i)}
              onMouseLeave={() => setHoveredHero(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(card.href);
                }
              }}
              style={{
                flex: '1 1 240px',
                minWidth: 240,
                background: card.gradient,
                borderRadius: 16,
                padding: '20px 22px',
                cursor: 'pointer',
                transition: 'all .25s cubic-bezier(.4,0,.2,1)',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                boxShadow: isHovered
                  ? '0 12px 32px rgba(0,0,0,.25), 0 4px 12px rgba(0,0,0,.15)'
                  : '0 4px 16px rgba(0,0,0,.12)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(255,255,255,.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}>
                <card.Icon size={22} color="#fff" />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: 2,
                  letterSpacing: '-.01em',
                }}>
                  {card.title}
                </div>
                <div style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,.75)',
                  lineHeight: 1.4,
                }}>
                  {card.subtitle}
                </div>
              </div>

              {/* Arrow */}
              <div style={{
                flexShrink: 0,
                opacity: isHovered ? 1 : 0.5,
                transition: 'all .2s ease',
                transform: isHovered ? 'translateX(3px)' : 'none',
              }}>
                <IconArrowRight size={18} color="#fff" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Featured Tool Cards (2 columns) ────────── */}
      <div style={{
        display: 'flex',
        gap: 14,
        flexWrap: 'wrap',
        marginBottom: 24,
      }}>
        {FEATURED_CARDS.map((card, i) => {
          const isHovered = hoveredFeatured === i;
          return (
            <div
              key={card.href}
              onClick={() => router.push(card.href)}
              onMouseEnter={() => setHoveredFeatured(i)}
              onMouseLeave={() => setHoveredFeatured(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(card.href);
                }
              }}
              style={{
                flex: '1 1 320px',
                minWidth: 280,
                borderRadius: 16,
                padding: 2,
                background: card.borderGradient,
                cursor: 'pointer',
                transition: 'all .25s cubic-bezier(.4,0,.2,1)',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                boxShadow: isHovered
                  ? '0 12px 32px rgba(0,0,0,.2)'
                  : '0 2px 8px rgba(0,0,0,.06)',
              }}
            >
              <div style={{
                background: card.gradient,
                borderRadius: 14,
                padding: '24px 22px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}>
                  <card.Icon size={24} color="#fff" />
                </div>
                <div>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: 6,
                    letterSpacing: '-.01em',
                  }}>
                    {card.title}
                  </div>
                  <div style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,.8)',
                    lineHeight: 1.5,
                    maxWidth: 320,
                  }}>
                    {card.description}
                  </div>
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  marginTop: 'auto',
                  opacity: isHovered ? 1 : 0.85,
                  transition: 'opacity .2s ease',
                }}>
                  {'Попробовать \u2192'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick Tools Row ────────────────────────── */}
      <div>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-.01em',
          }}>
            Инструменты TubeForge
          </h2>
          <span
            onClick={() => router.push('/tools')}
            onMouseEnter={() => setHoveredAllTools(true)}
            onMouseLeave={() => setHoveredAllTools(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.push('/tools');
              }
            }}
            style={{
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: hoveredAllTools ? 1 : 0.6,
              transition: 'opacity .2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {'Все инструменты \u2192'}
          </span>
        </div>

        {/* Scrollable row */}
        <div style={{
          display: 'flex',
          gap: 14,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'thin',
        }}>
          {QUICK_TOOLS.map((tool, i) => {
            const isHovered = hoveredQuick === i;
            return (
              <div
                key={tool.href}
                onClick={() => router.push(tool.href)}
                onMouseEnter={() => setHoveredQuick(i)}
                onMouseLeave={() => setHoveredQuick(null)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(tool.href);
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  minWidth: 100,
                  padding: '16px 12px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  transition: 'all .25s cubic-bezier(.4,0,.2,1)',
                  transform: isHovered ? 'translateY(-2px)' : 'none',
                  background: isHovered ? 'rgba(128,128,128,.08)' : 'transparent',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: tool.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform .25s ease',
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: isHovered
                    ? '0 6px 20px rgba(0,0,0,.15)'
                    : '0 2px 8px rgba(0,0,0,.08)',
                }}>
                  <tool.Icon size={22} color="#fff" />
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: 'center',
                  lineHeight: 1.3,
                  letterSpacing: '-.01em',
                  whiteSpace: 'nowrap',
                }}>
                  {tool.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Empty state illustration ──────────────────────────── */

function EmptyIllustration({ color, dimColor }: { color: string; dimColor: string }) {
  return (
    <svg width="160" height="130" viewBox="0 0 160 130" fill="none">
      {/* Film strip */}
      <rect x="30" y="20" width="100" height="70" rx="10" stroke={dimColor} strokeWidth="2" strokeDasharray="6 4" />
      <rect x="42" y="35" width="24" height="18" rx="4" fill={`${color}18`} stroke={color} strokeWidth="1.2" />
      <rect x="72" y="35" width="24" height="18" rx="4" fill={`${color}18`} stroke={color} strokeWidth="1.2" />
      <rect x="102" y="35" width="24" height="18" rx="4" fill={`${color}10`} stroke={dimColor} strokeWidth="1" strokeDasharray="3 3" />
      {/* Play button */}
      <circle cx="80" cy="78" r="12" fill={`${color}20`} stroke={color} strokeWidth="1.5" />
      <polygon points="76,72 88,78 76,84" fill={color} />
      {/* Plus badge */}
      <circle cx="120" cy="28" r="14" fill={color} />
      <line x1="120" y1="22" x2="120" y2="34" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="114" y1="28" x2="126" y2="28" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      {/* Sparkles */}
      <circle cx="25" cy="50" r="2" fill={`${color}40`} />
      <circle cx="138" cy="65" r="1.5" fill={`${color}30`} />
      <circle cx="45" cy="100" r="1.8" fill={`${color}25`} />
      <text x="80" y="118" textAnchor="middle" fill={dimColor} fontSize="10" fontWeight="500" fontFamily="inherit">
        Ваша студия ждёт
      </text>
    </svg>
  );
}

/* ── Skeleton cards for grid loading ───────────────────── */

function ProjectCardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Skeleton height={140} style={{ borderRadius: '14px 14px 0 0' }} />
      <div style={{ padding: '14px 16px 16px' }}>
        <Skeleton height={16} width="70%" style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton height={12} width="40%" />
          <Skeleton height={24} width={80} rounded />
        </div>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div style={{ flex: '1 1 0', minWidth: 140 }}>
      <Skeleton height={90} style={{ borderRadius: 14 }} />
    </div>
  );
}

/* ── ProjectCard (memoized) ─────────────────────────────── */

interface ProjectCardItem {
  id: string;
  title: string;
  status: string;
  thumbnailUrl: string | null;
  updatedAt: string | Date;
  _count: { scenes: number };
}

interface ProjectCardProps {
  project: ProjectCardItem;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  isDeleting: boolean;
  isRenaming: boolean;
  renameValue: string;
  renameRef: React.RefObject<HTMLInputElement | null>;
  deleteIsPending: boolean;
  onNavigate: (id: string) => void;
  onDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onRename: (id: string) => void;
  onStartRename: (id: string, title: string) => void;
  onCancelRename: () => void;
  onRenameChange: (val: string) => void;
  onDuplicate: (title: string) => void;
}

const ProjectCard = memo(function ProjectCard({
  project: p,
  C,
  isDeleting,
  isRenaming,
  renameValue,
  renameRef,
  deleteIsPending,
  onNavigate,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onRename,
  onStartRename,
  onCancelRename,
  onRenameChange,
  onDuplicate,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hovBtn, setHovBtn] = useState<string | null>(null);

  const st = STATUS_MAP[p.status] ?? STATUS_MAP.DRAFT;
  const statusColor = C[st.color as keyof typeof C] ?? C.dim;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: C.surface,
        border: `1px solid ${isHovered ? C.borderActive : C.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all .25s cubic-bezier(.4,0,.2,1)',
        transform: isHovered ? 'translateY(-3px)' : 'none',
        boxShadow: isHovered
          ? '0 8px 30px rgba(0,0,0,.15), 0 2px 8px rgba(0,0,0,.08)'
          : '0 1px 3px rgba(0,0,0,.04)',
        opacity: deleteIsPending && isDeleting ? 0.4 : 1,
        position: 'relative',
      }}
      onClick={() => {
        if (!isDeleting && !isRenaming) onNavigate(p.id);
      }}
    >
      {/* Thumbnail area */}
      <div style={{
        width: '100%',
        height: 140,
        background: `linear-gradient(135deg, ${C.card}, ${C.bg})`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {p.thumbnailUrl ? (
          <Image
            src={p.thumbnailUrl}
            alt={p.title}
            fill
            style={{
              objectFit: 'cover',
              transition: 'transform .4s cubic-bezier(.4,0,.2,1)',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 6,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: `${C.accent}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform .3s ease',
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            }}>
              <IconFilm size={24} color={C.dim} />
            </div>
          </div>
        )}

        {/* Status badge — top-right */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          padding: '4px 10px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.02em',
          background: `${statusColor}20`,
          color: statusColor,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: `1px solid ${statusColor}30`,
        }}>
          {st.label}
        </div>

        {/* Scene count badge — bottom-left */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          padding: '3px 8px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          background: 'rgba(0,0,0,.55)',
          color: '#e8e8f0',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}>
          {pluralRu(p._count.scenes, 'сцена', 'сцены', 'сцен')}
        </div>

        {/* Hover overlay with play icon */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `rgba(0,0,0,${isHovered ? '.25' : '0'})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .25s ease',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'scale(1)' : 'scale(.7)',
            transition: 'all .25s cubic-bezier(.4,0,.2,1)',
            boxShadow: '0 4px 12px rgba(0,0,0,.2)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#111">
              <polygon points="6,3 21,12 6,21" />
            </svg>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Title / rename */}
        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            maxLength={100}
            aria-label="Новое название проекта"
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={() => onRename(p.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRename(p.id);
              if (e.key === 'Escape') onCancelRename();
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: 14, fontWeight: 600,
              border: `1.5px solid ${C.accent}`,
              borderRadius: 8, padding: '5px 8px',
              background: C.card, color: C.text,
              fontFamily: 'inherit', width: '100%',
              marginBottom: 8,
            }}
          />
        ) : (
          <div style={{
            fontSize: 14, fontWeight: 600, marginBottom: 8,
            lineHeight: 1.4, letterSpacing: '-.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {p.title}
          </div>
        )}

        {/* Footer: date + actions */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, color: C.sub, fontWeight: 400 }}>
            {timeAgo(p.updatedAt)}
          </span>

          {/* Action buttons */}
          <div style={{
            display: 'flex', gap: 4, alignItems: 'center',
            opacity: isHovered || isDeleting ? 1 : 0,
            transition: 'opacity .2s ease',
          }} onClick={(e) => e.stopPropagation()}>
            {isDeleting ? (
              <>
                <span style={{
                  fontSize: 11, color: C.sub, fontWeight: 500,
                  maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  marginRight: 4,
                }}>
                  Удалить?
                </span>
                <button
                  onClick={() => onConfirmDelete(p.id)}
                  disabled={deleteIsPending}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: 'none',
                    background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                  }}
                >
                  {deleteIsPending ? '...' : 'Да'}
                </button>
                <button
                  onClick={() => onCancelDelete()}
                  style={{
                    padding: '4px 10px', borderRadius: 6,
                    border: `1px solid ${C.border}`, background: 'transparent',
                    color: C.sub, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all .15s',
                  }}
                >
                  Нет
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartRename(p.id, p.title);
                  }}
                  title="Переименовать"
                  aria-label={`Переименовать проект ${p.title}`}
                  onMouseEnter={() => setHovBtn(`rename-${p.id}`)}
                  onMouseLeave={() => setHovBtn(null)}
                  style={{
                    width: 28, height: 28, borderRadius: 7,
                    border: `1px solid ${hovBtn === `rename-${p.id}` ? C.borderActive : C.border}`,
                    background: hovBtn === `rename-${p.id}` ? C.card : 'transparent',
                    color: C.sub, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s ease',
                  }}
                >
                  <IconEdit size={13} color={C.sub} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(p.title);
                  }}
                  title="Дублировать"
                  aria-label={`Дублировать проект ${p.title}`}
                  onMouseEnter={() => setHovBtn(`dup-${p.id}`)}
                  onMouseLeave={() => setHovBtn(null)}
                  style={{
                    width: 28, height: 28, borderRadius: 7,
                    border: `1px solid ${hovBtn === `dup-${p.id}` ? C.borderActive : C.border}`,
                    background: hovBtn === `dup-${p.id}` ? C.card : 'transparent',
                    color: C.sub, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s ease',
                  }}
                >
                  <IconPlus size={13} color={C.sub} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(p.id);
                  }}
                  title="Удалить проект"
                  aria-label={`Удалить проект ${p.title}`}
                  onMouseEnter={() => setHovBtn(`delete-${p.id}`)}
                  onMouseLeave={() => setHovBtn(null)}
                  style={{
                    width: 28, height: 28, borderRadius: 7,
                    border: `1px solid ${hovBtn === `delete-${p.id}` ? '#ef444440' : C.border}`,
                    background: hovBtn === `delete-${p.id}` ? '#ef444412' : 'transparent',
                    color: hovBtn === `delete-${p.id}` ? '#ef4444' : C.sub,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s ease',
                  }}
                >
                  <IconTrash size={13} color={hovBtn === `delete-${p.id}` ? '#ef4444' : C.sub} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

/* ── Getting Started Section ───────────────────────────── */

const GETTING_STARTED_TOOLS = [
  {
    title: 'Создание видео',
    description: 'Создайте видео из текстовых промптов с помощью ИИ',
    href: '/editor',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    iconBg: 'linear-gradient(135deg, #8b5cf620, #6366f110)',
    Icon: IconPlay,
    iconColor: '#8b5cf6',
  },
  {
    title: 'Редактор обложек',
    description: 'Создайте привлекательную обложку для видео',
    href: '/thumbnails',
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    iconBg: 'linear-gradient(135deg, #ec489920, #f43f5e10)',
    Icon: IconImage,
    iconColor: '#ec4899',
  },
  {
    title: 'Удалить субтитры',
    description: 'Удалите субтитры с видео с помощью ИИ',
    href: '/tools/subtitle-remover',
    gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
    iconBg: 'linear-gradient(135deg, #ef444420, #f9731610)',
    Icon: IconEraser,
    iconColor: '#ef4444',
  },
];

function GettingStartedSection({ C, router }: { C: ReturnType<typeof useThemeStore.getState>['theme']; router: ReturnType<typeof useRouter> }) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div
      style={{
        marginTop: 28,
        background: `linear-gradient(135deg, ${C.card}, ${C.surface})`,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: '28px 26px 32px',
      }}
    >
      <div style={{ marginBottom: 22 }}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 800,
          margin: '0 0 4px',
          letterSpacing: '-.02em',
          lineHeight: 1.2,
        }}>
          Начнём работу?
        </h2>
        <p style={{
          color: C.sub,
          fontSize: 14,
          margin: 0,
          lineHeight: 1.5,
        }}>
          Популярные инструменты для начала
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        {GETTING_STARTED_TOOLS.map((tool, i) => {
          const isHovered = hoveredCard === i;
          return (
            <div
              key={tool.href}
              onClick={() => router.push(tool.href)}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(tool.href);
                }
              }}
              style={{
                flex: '1 1 200px',
                minWidth: 200,
                background: C.card,
                border: `1px solid ${isHovered ? C.borderActive : C.border}`,
                borderRadius: 14,
                padding: '20px 18px',
                cursor: 'pointer',
                transition: 'all .25s cubic-bezier(.4,0,.2,1)',
                transform: isHovered ? 'translateY(-3px)' : 'none',
                boxShadow: isHovered
                  ? '0 8px 30px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)'
                  : '0 1px 3px rgba(0,0,0,.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: tool.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <tool.Icon size={20} color="#fff" />
                </div>
                <div style={{
                  opacity: isHovered ? 1 : 0.4,
                  transition: 'opacity .2s ease, transform .2s ease',
                  transform: isHovered ? 'translateX(2px)' : 'none',
                }}>
                  <IconArrowRight size={16} color={C.sub} />
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 4,
                  letterSpacing: '-.01em',
                  color: C.text,
                }}>
                  {tool.title}
                </div>
                <div style={{
                  fontSize: 13,
                  color: C.sub,
                  lineHeight: 1.45,
                }}>
                  {tool.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Dashboard Component ──────────────────────────── */

export function Dashboard() {
  const C = useThemeStore((s) => s.theme);
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();

  /* ── Local state (initialized from URL params) ── */
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('q') ?? '');
  const [statusFilter, setStatusFilter] = useState<'DRAFT' | 'RENDERING' | 'READY' | 'PUBLISHED' | undefined>(() => {
    const sp = searchParams.get('status');
    if (sp === 'DRAFT' || sp === 'RENDERING' || sp === 'READY' || sp === 'PUBLISHED') return sp;
    return undefined;
  });
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>(() => {
    const sp = searchParams.get('sort');
    if (sp === 'updatedAt' || sp === 'createdAt' || sp === 'title') return sp;
    return 'updatedAt';
  });
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef<HTMLInputElement>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  /* ── Debounce search ──────────────────────────── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ── Sync filter state to URL ───────────────── */
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (statusFilter) params.set('status', statusFilter);
    if (sortBy !== 'updatedAt') params.set('sort', sortBy);
    const qs = params.toString();
    router.replace(`/dashboard${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [debouncedSearch, statusFilter, sortBy, router]);

  /* ── tRPC queries ─────────────────────────────── */
  const profile = trpc.user.getProfile.useQuery();
  const totalProjects = trpc.project.list.useQuery({ page: 1, limit: 1 });
  const projects = trpc.project.list.useQuery({
    search: debouncedSearch || undefined,
    status: statusFilter,
    sortBy,
    page,
    limit: 12,
  });

  /* ── tRPC mutations ───────────────────────────── */
  const createProject = trpc.project.create.useMutation({
    onSuccess: (project) => {
      toast.success('Проект создан');
      utils.project.list.invalidate();
      utils.user.getProfile.invalidate();
      router.push(`/editor?projectId=${project.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteProject = trpc.project.delete.useMutation({
    onSuccess: () => {
      toast.success('Проект удалён');
      setDeleteId(null);
      utils.project.list.invalidate();
      utils.user.getProfile.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
      setDeleteId(null);
    },
  });

  const renameProject = trpc.project.update.useMutation({
    onSuccess: () => {
      toast.success('Переименовано');
      setRenameId(null);
      utils.project.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const duplicateProject = trpc.project.create.useMutation({
    onSuccess: () => {
      toast.success('Проект дублирован');
      utils.project.list.invalidate();
      utils.user.getProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  /* ── Focus rename input ───────────────────────── */
  useEffect(() => {
    if (renameId && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [renameId]);

  /* ── Rename handler ───────────────────────────── */
  const handleRename = useCallback((id: string) => {
    const val = renameValue.trim();
    if (val && val.length <= 100) {
      renameProject.mutate({ id, title: val });
    } else {
      if (!val) toast.warning('Название не может быть пустым');
      setRenameId(null);
    }
  }, [renameValue, renameProject]);

  /* ── Card callbacks (stable refs for memo) ──── */
  const handleNavigate = useCallback((id: string) => {
    router.push(`/editor?projectId=${id}`);
  }, [router]);

  const handleSetDeleteId = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const handleConfirmDelete = useCallback((id: string) => {
    deleteProject.mutate({ id });
  }, [deleteProject]);

  const handleCancelDelete = useCallback(() => {
    setDeleteId(null);
  }, []);

  const handleStartRename = useCallback((id: string, title: string) => {
    setRenameId(id);
    setRenameValue(title);
  }, []);

  const handleCancelRename = useCallback(() => {
    setRenameId(null);
  }, []);

  const handleRenameChange = useCallback((val: string) => {
    setRenameValue(val);
  }, []);

  const handleDuplicate = useCallback((title: string) => {
    duplicateProject.mutate({ title: title + ' (копия)' });
  }, [duplicateProject]);

  /* ── Compute stats ────────────────────────────── */
  const user = profile.data;
  const plan = user?.plan ?? 'FREE';
  const stats = useMemo(() => {
    const total = totalProjects.data?.total ?? user?._count?.projects ?? 0;
    // Count statuses from the unfiltered first-page query hint — for accurate stats
    // we rely on totalProjects (which has no filter). For status breakdown we check
    // the currently loaded items. Since the stats query only fetches 1 item, we use
    // the total count from profile for project count, and we cannot get per-status
    // counts without separate queries. Keep it simple and useful.
    return [
      {
        label: 'Всего проектов',
        value: String(total),
        icon: IconFolder,
        gradient: `linear-gradient(135deg, ${C.accent}18, ${C.accent}08)`,
        iconColor: C.accent,
      },
      {
        label: 'Тарифный план',
        value: PLAN_LABEL[plan] ?? plan,
        icon: IconStar,
        gradient: `linear-gradient(135deg, ${C.purple}18, ${C.purple}08)`,
        iconColor: C.purple,
      },
      {
        label: 'ИИ-запросов',
        value: String(user?.aiUsage ?? 0),
        icon: IconFilm,
        gradient: `linear-gradient(135deg, ${C.blue}18, ${C.blue}08)`,
        iconColor: C.blue,
      },
      {
        label: 'Каналы',
        value: String(user?.channels?.length ?? 0),
        icon: IconSend,
        gradient: `linear-gradient(135deg, ${C.green}18, ${C.green}08)`,
        iconColor: C.green,
      },
    ];
  }, [totalProjects.data?.total, user?._count?.projects, plan, user?.aiUsage, user?.channels?.length, C]);

  /* ── Error states ─────────────────────────────── */
  if (profile.isError) {
    return (
      <ErrorFallback
        error={profile.error instanceof Error ? profile.error : new Error(String(profile.error))}
        reset={() => profile.refetch()}
      />
    );
  }
  if (projects.isError) {
    return (
      <ErrorFallback
        error={projects.error instanceof Error ? projects.error : new Error(String(projects.error))}
        reset={() => projects.refetch()}
      />
    );
  }

  const hasFilters = !!(debouncedSearch || statusFilter);
  const isEmpty = !projects.data?.items?.length;
  const totalPages = projects.data?.pages ?? 1;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* ── Welcome Hero Section (Crayo-style) ───────── */}
      <WelcomeHeroSection
        userName={user?.name ?? 'Создатель'}
        router={router}
        isLoading={profile.isLoading}
      />

      {/* ── Header ──────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-.03em', lineHeight: 1.2 }}>
            {profile.isLoading ? <Skeleton width={260} height={34} /> : `Привет, ${user?.name ?? 'Создатель'}!`}
          </h1>
          <p style={{ color: C.sub, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            {profile.isLoading ? (
              <Skeleton width={160} height={16} style={{ marginTop: 4 }} />
            ) : (
              <>Управляйте своими видеопроектами</>
            )}
          </p>
        </div>
        <button
          onClick={() => createProject.mutate({})}
          disabled={createProject.isPending}
          onMouseEnter={() => setHoveredBtn('create-main')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: hoveredBtn === 'create-main' ? C.accent : C.accent,
            color: '#fff', border: 'none', borderRadius: 12,
            padding: '12px 24px', fontSize: 15, fontWeight: 700,
            cursor: createProject.isPending ? 'wait' : 'pointer',
            fontFamily: 'inherit', opacity: createProject.isPending ? 0.6 : 1,
            boxShadow: hoveredBtn === 'create-main'
              ? `0 6px 24px ${C.accent}44, 0 0 0 3px ${C.accent}20`
              : `0 4px 16px ${C.accent}33`,
            transition: 'all .25s cubic-bezier(.4,0,.2,1)',
            transform: hoveredBtn === 'create-main' ? 'translateY(-1px)' : 'none',
            letterSpacing: '-.01em',
            flexShrink: 0,
          }}
        >
          <IconPlus size={18} color="#fff" />
          {createProject.isPending ? 'Создание...' : 'Новый проект'}
        </button>
      </div>

      {/* ── Stat cards ──────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14,
        marginBottom: 28,
      }}>
        {profile.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((s, i) => {
              const StatIcon = s.icon;
              return (
                <div
                  key={i}
                  className="tf-stat-card"
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    padding: '18px 20px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'default',
                    transition: 'box-shadow .25s ease, transform .25s ease, border-color .25s ease',
                  }}
                >
                  {/* Gradient accent stripe */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${s.iconColor}, transparent)`,
                    opacity: 0.6,
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: s.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <StatIcon size={20} color={s.iconColor} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: C.sub, marginBottom: 2, fontWeight: 500, letterSpacing: '.01em' }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.1 }}>
                        {s.value}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* ── Projects section ────────────────────────── */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {/* Toolbar */}
        <div style={{
          padding: '18px 22px 16px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-.01em' }}>
              Мои проекты
            </h2>
            {projects.isRefetching && (
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: C.accent, animation: 'pulse 1s infinite',
              }} />
            )}
            {projects.data && !projects.isLoading && (
              <span style={{
                fontSize: 12, color: C.sub, fontWeight: 500,
                background: C.surface, padding: '2px 8px', borderRadius: 6,
              }}>
                {projects.data.total}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                pointerEvents: 'none', display: 'flex', alignItems: 'center',
              }}>
                <IconSearch size={15} color={C.dim} />
              </div>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Поиск..."
                aria-label="Поиск проектов"
                style={{
                  padding: '9px 14px 9px 32px',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  color: C.text,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  width: 180,
                  transition: 'border-color .2s, box-shadow .2s',
                }}
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
              aria-label="Сортировка проектов"
              style={{
                padding: '8px 10px',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                color: C.text,
                fontSize: 13,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Status filter pills */}
            <div style={{ display: 'flex', gap: 4 }} role="group" aria-label="Фильтр по статусу">
              {FILTER_OPTIONS.map((f) => {
                const isActive = statusFilter === f.value;
                return (
                  <button
                    key={f.label}
                    onClick={() => { setStatusFilter(f.value); setPage(1); }}
                    aria-pressed={isActive}
                    onMouseEnter={() => setHoveredBtn(`filter-${f.label}`)}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 9999,
                      border: `1px solid ${isActive ? C.accent : C.border}`,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .2s ease',
                      background: isActive ? C.accentDim : (hoveredBtn === `filter-${f.label}` ? C.surface : 'transparent'),
                      color: isActive ? C.accent : C.sub,
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div style={{ padding: '20px 22px 24px' }}>
          {projects.isLoading ? (
            /* ── Skeleton grid ─────────────── */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  background: C.surface,
                  borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  overflow: 'hidden',
                }}>
                  <ProjectCardSkeleton />
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            /* ── Empty state ───────────────── */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
            }}>
              {hasFilters ? (
                <>
                  <div style={{ marginBottom: 16, opacity: 0.6 }}>
                    <IconSearch size={48} color={C.dim} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: C.text }}>
                    Ничего не найдено
                  </h3>
                  <p style={{ color: C.sub, fontSize: 14, marginBottom: 20, maxWidth: 320, lineHeight: 1.5 }}>
                    Попробуйте изменить поисковый запрос или сбросить фильтры
                  </p>
                  <button
                    onClick={() => { setSearchInput(''); setDebouncedSearch(''); setStatusFilter(undefined); setPage(1); }}
                    onMouseEnter={() => setHoveredBtn('reset')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      padding: '11px 28px',
                      borderRadius: 12,
                      background: hoveredBtn === 'reset' ? C.surface : 'transparent',
                      color: C.text,
                      border: `1px solid ${C.border}`,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .2s ease',
                    }}
                  >
                    Сбросить фильтры
                  </button>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <EmptyIllustration color={C.accent} dimColor={C.dim} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: C.text, letterSpacing: '-.02em' }}>
                    Создайте первый проект
                  </h3>
                  <p style={{ color: C.sub, fontSize: 14, marginBottom: 24, maxWidth: 360, lineHeight: 1.6 }}>
                    Начните создавать видео с помощью ИИ. Добавьте сцены, сгенерируйте визуальный ряд и опубликуйте на YouTube.
                  </p>
                  <button
                    onClick={() => createProject.mutate({})}
                    disabled={createProject.isPending}
                    onMouseEnter={() => setHoveredBtn('create-empty')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '13px 32px',
                      borderRadius: 12,
                      background: C.accent,
                      color: '#fff',
                      border: 'none',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: createProject.isPending ? 'wait' : 'pointer',
                      fontFamily: 'inherit',
                      boxShadow: hoveredBtn === 'create-empty'
                        ? `0 8px 28px ${C.accent}44`
                        : `0 4px 16px ${C.accent}33`,
                      transition: 'all .25s cubic-bezier(.4,0,.2,1)',
                      transform: hoveredBtn === 'create-empty' ? 'translateY(-2px)' : 'none',
                      opacity: createProject.isPending ? 0.6 : 1,
                    }}
                  >
                    <IconPlus size={18} color="#fff" />
                    {createProject.isPending ? 'Создание...' : 'Создать проект'}
                  </button>
                </>
              )}
            </div>
          ) : (
            /* ── Project cards grid ────────── */
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 16,
              }}>
                {projects.data!.items.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    C={C}
                    isDeleting={deleteId === p.id}
                    isRenaming={renameId === p.id}
                    renameValue={renameValue}
                    renameRef={renameRef}
                    deleteIsPending={deleteProject.isPending}
                    onNavigate={handleNavigate}
                    onDelete={handleSetDeleteId}
                    onConfirmDelete={handleConfirmDelete}
                    onCancelDelete={handleCancelDelete}
                    onRename={handleRename}
                    onStartRename={handleStartRename}
                    onCancelRename={handleCancelRename}
                    onRenameChange={handleRenameChange}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </div>

              {/* ── Pagination ─────────────────── */}
              {totalPages > 1 && (
                <nav
                  aria-label="Навигация по страницам"
                  style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    gap: 6, paddingTop: 24, marginTop: 8,
                  }}
                >
                  {/* Prev button */}
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    aria-label="Предыдущая страница"
                    onMouseEnter={() => setHoveredBtn('page-prev')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      background: hoveredBtn === 'page-prev' && page > 1 ? C.surface : 'transparent',
                      color: page <= 1 ? C.dim : C.sub,
                      cursor: page <= 1 ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'inherit', transition: 'all .15s ease',
                      opacity: page <= 1 ? 0.4 : 1,
                    }}
                  >
                    <IconChevronLeft size={16} color={page <= 1 ? C.dim : C.sub} />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    // Smart pagination: show pages around current page
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    const isCurrent = page === pageNum;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        aria-label={`Страница ${pageNum}`}
                        aria-current={isCurrent ? 'page' : undefined}
                        onMouseEnter={() => setHoveredBtn(`page-${pageNum}`)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        style={{
                          width: 36, height: 36, borderRadius: 10,
                          border: `1px solid ${isCurrent ? C.accent : C.border}`,
                          fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all .2s ease',
                          background: isCurrent ? C.accent : (hoveredBtn === `page-${pageNum}` ? C.surface : 'transparent'),
                          color: isCurrent ? '#fff' : C.sub,
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Next button */}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    aria-label="Следующая страница"
                    onMouseEnter={() => setHoveredBtn('page-next')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      background: hoveredBtn === 'page-next' && page < totalPages ? C.surface : 'transparent',
                      color: page >= totalPages ? C.dim : C.sub,
                      cursor: page >= totalPages ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'inherit', transition: 'all .15s ease',
                      opacity: page >= totalPages ? 0.4 : 1,
                    }}
                  >
                    <IconChevronRight size={16} color={page >= totalPages ? C.dim : C.sub} />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Getting Started ────────────────────────── */}
      <GettingStartedSection C={C} router={router} />
    </div>
  );
}
