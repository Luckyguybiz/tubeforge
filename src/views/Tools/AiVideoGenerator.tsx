'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ═══════════════════════════════════════════════════════════════════════════
   AI Video Providers — referral links page
   ═══════════════════════════════════════════════════════════════════════════ */

interface Provider {
  id: string;
  name: string;
  logo: string;        // emoji or icon
  description: string;
  descriptionRu: string;
  features: string[];
  featuresRu: string[];
  url: string;         // referral link
  pricing: string;
  pricingRu: string;
  badge?: string;
  gradient: [string, string];
}

const PROVIDERS: Provider[] = [
  {
    id: 'runway',
    name: 'Runway ML',
    logo: '🎬',
    description: 'Industry-leading AI video generation. Gen-3 Alpha creates photorealistic videos from text or images.',
    descriptionRu: 'Лидер индустрии ИИ-видео. Gen-3 Alpha создаёт фотореалистичные видео из текста или изображений.',
    features: ['Text to Video', 'Image to Video', 'Video to Video', 'Motion Brush', 'Lip Sync'],
    featuresRu: ['Текст → Видео', 'Изображение → Видео', 'Видео → Видео', 'Motion Brush', 'Синхронизация губ'],
    url: 'https://runwayml.com/?ref=tubeforge',
    pricing: 'From $12/mo • 625 credits',
    pricingRu: 'От $12/мес • 625 кредитов',
    badge: 'Popular',
    gradient: ['#7c3aed', '#c026d3'],
  },
  {
    id: 'kling',
    name: 'Kling AI',
    logo: '🎥',
    description: 'Professional AI video with cinematic quality. Excellent motion consistency and character coherence.',
    descriptionRu: 'Профессиональное ИИ-видео кинематографического качества. Отличная консистентность движений и персонажей.',
    features: ['1080p Video', 'Camera Control', 'Character Consistency', 'Up to 2 min', 'Lip Sync'],
    featuresRu: ['Видео 1080p', 'Управление камерой', 'Консистентность персонажей', 'До 2 минут', 'Синхронизация губ'],
    url: 'https://klingai.com/?ref=tubeforge',
    pricing: 'From $5.99/mo • 660 credits',
    pricingRu: 'От $5.99/мес • 660 кредитов',
    badge: 'Best Value',
    gradient: ['#0891b2', '#0d9488'],
  },
  {
    id: 'pika',
    name: 'Pika',
    logo: '⚡',
    description: 'Fast and creative AI video generation with unique style effects and scene transformations.',
    descriptionRu: 'Быстрая и креативная генерация видео с уникальными стилями и трансформациями сцен.',
    features: ['Text to Video', 'Pikaffects', 'Scene Ingredients', 'Lip Sync', 'Extend Video'],
    featuresRu: ['Текст → Видео', 'Спецэффекты', 'Ингредиенты сцены', 'Синхронизация губ', 'Продление видео'],
    url: 'https://pika.art/?ref=tubeforge',
    pricing: 'From $8/mo • 250 credits',
    pricingRu: 'От $8/мес • 250 кредитов',
    gradient: ['#f59e0b', '#ef4444'],
  },
  {
    id: 'luma',
    name: 'Luma Dream Machine',
    logo: '🌙',
    description: 'High-quality video generation powered by Luma\'s multimodal AI. Great for cinematic scenes.',
    descriptionRu: 'Высококачественная генерация видео на мультимодальном ИИ от Luma. Отлично для кинематографичных сцен.',
    features: ['Text to Video', 'Image to Video', 'Keyframes', 'Camera Motion', '4K Upscale'],
    featuresRu: ['Текст → Видео', 'Изображение → Видео', 'Ключевые кадры', 'Движение камеры', 'Масштаб до 4K'],
    url: 'https://lumalabs.ai/dream-machine?ref=tubeforge',
    pricing: 'From $9.99/mo • 150 generations',
    pricingRu: 'От $9.99/мес • 150 генераций',
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: 'minimax',
    name: 'MiniMax (Hailuo)',
    logo: '🔮',
    description: 'Powerful Chinese AI video model with impressive quality and long video generation capabilities.',
    descriptionRu: 'Мощная китайская модель для видео с впечатляющим качеством и генерацией длинных роликов.',
    features: ['Text to Video', 'Image to Video', 'Long Videos', 'High Quality', 'Director Mode'],
    featuresRu: ['Текст → Видео', 'Изображение → Видео', 'Длинные видео', 'Высокое качество', 'Режим режиссёра'],
    url: 'https://hailuoai.video/?ref=tubeforge',
    pricing: 'Free tier available • Pro from $9.99/mo',
    pricingRu: 'Есть бесплатный тариф • Pro от $9.99/мес',
    gradient: ['#ec4899', '#f43f5e'],
  },
  {
    id: 'veo',
    name: 'Google Veo 2',
    logo: '🌐',
    description: 'Google\'s latest AI video model. Available through Google AI Studio and Vertex AI.',
    descriptionRu: 'Новейшая модель Google для видео. Доступна через Google AI Studio и Vertex AI.',
    features: ['Text to Video', 'Image to Video', '4K Output', 'Cinematic Quality', 'Long Duration'],
    featuresRu: ['Текст → Видео', 'Изображение → Видео', 'Выход 4K', 'Кинематографическое качество', 'Длинные видео'],
    url: 'https://aistudio.google.com/?ref=tubeforge',
    pricing: 'Free with Google account',
    pricingRu: 'Бесплатно с аккаунтом Google',
    badge: 'Free',
    gradient: ['#4285f4', '#34a853'],
  },
];

export default function AiVideoGenerator() {
  const C = useThemeStore((s) => s.theme);
  const { locale } = useLocaleStore();
  const t = useLocaleStore((s) => s.t);
  const isRu = locale === 'ru' || locale === 'kk';
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: C.text,
          marginBottom: 8,
          letterSpacing: '-0.02em',
        }}>
          {isRu ? '🎬 ИИ-генерация видео' : '🎬 AI Video Generation'}
        </h1>
        <p style={{
          fontSize: 15,
          color: C.sub,
          lineHeight: 1.6,
          maxWidth: 600,
          margin: '0 auto',
        }}>
          {isRu
            ? 'Выберите провайдера для генерации видео с помощью ИИ. Каждый сервис предлагает уникальные возможности и стили.'
            : 'Choose a provider for AI video generation. Each service offers unique capabilities and styles.'}
        </p>
      </div>

      {/* Tip box */}
      <div style={{
        padding: '14px 18px',
        background: `${C.blue}0a`,
        border: `1px solid ${C.blue}20`,
        borderRadius: 12,
        marginBottom: 28,
        fontSize: 13,
        color: C.sub,
        lineHeight: 1.6,
      }}>
        💡 {isRu
          ? 'Совет: Для YouTube-контента мы рекомендуем Runway ML (лучшее качество) или Kling AI (лучшее соотношение цена/качество). Для бесплатного старта — Google Veo 2.'
          : 'Tip: For YouTube content we recommend Runway ML (best quality) or Kling AI (best value). For a free start — Google Veo 2.'}
      </div>

      {/* Provider cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16,
      }}>
        {PROVIDERS.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              display: 'block',
              textDecoration: 'none',
              padding: '20px',
              background: C.surface,
              border: `1px solid ${hoveredId === p.id ? C.accent : C.border}`,
              borderRadius: 16,
              transition: 'all 0.2s ease',
              transform: hoveredId === p.id ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredId === p.id ? `0 8px 24px ${C.accent}15` : 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Gradient top bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${p.gradient[0]}, ${p.gradient[1]})`,
            }} />

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{p.logo}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{p.name}</span>
                  {p.badge && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})`,
                      color: '#fff',
                      letterSpacing: 0.3,
                    }}>
                      {p.badge}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
                  {isRu ? p.pricingRu : p.pricing}
                </div>
              </div>
            </div>

            {/* Description */}
            <p style={{
              fontSize: 13,
              color: C.sub,
              lineHeight: 1.5,
              margin: '0 0 14px',
            }}>
              {isRu ? p.descriptionRu : p.description}
            </p>

            {/* Features */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(isRu ? p.featuresRu : p.features).map((f, i) => (
                <span
                  key={i}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    background: `${p.gradient[0]}12`,
                    color: p.gradient[0],
                    border: `1px solid ${p.gradient[0]}20`,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>

            {/* CTA arrow */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              marginTop: 14,
              fontSize: 13,
              fontWeight: 600,
              color: C.accent,
              gap: 6,
            }}>
              {isRu ? 'Перейти' : 'Visit'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </div>
          </a>
        ))}
      </div>

      {/* Bottom note */}
      <div style={{
        marginTop: 28,
        padding: '16px 20px',
        background: C.surface,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        fontSize: 13,
        color: C.dim,
        lineHeight: 1.6,
        textAlign: 'center',
      }}>
        {isRu
          ? '⚙️ Полная интеграция генерации видео в TubeForge — в разработке. Следите за обновлениями!'
          : '⚙️ Full video generation integration inside TubeForge — coming soon. Stay tuned!'}
      </div>
    </div>
  );
}
