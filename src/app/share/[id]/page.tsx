'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useThemeStore } from '@/stores/useThemeStore';

/* ── Inline SVG icons ──────────────────────────── */

function IconHeart({ size = 20, filled = false, color = 'currentColor' }: { size?: number; filled?: boolean; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function IconCopy({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function IconShare({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function IconPlay({ size = 32, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

const SHARE_TEXT = encodeURIComponent('Посмотрите видео, созданное с TubeForge!');

export default function SharePage() {
  const params = useParams();
  const id = params.id as string;
  const C = useThemeStore((s) => s.theme);

  const { data: project, isLoading, error } = trpc.project.getPublic.useQuery({ id });
  const likeMutation = trpc.project.likeProject.useMutation();
  const utils = trpc.useUtils();

  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleLike = useCallback(() => {
    if (liked) return;
    setLiked(true);
    likeMutation.mutate({ id }, {
      onSuccess: () => {
        utils.project.getPublic.invalidate({ id });
      },
    });
  }, [id, liked, likeMutation, utils]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select + copy
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.sub, fontSize: 16 }}>Загрузка...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>🔒</div>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>Этот проект приватный</h1>
        <p style={{ color: C.sub, fontSize: 15, margin: 0 }}>Проект не найден или является приватным</p>
        <Link href="/" style={{ color: C.accent, fontSize: 14, textDecoration: 'none', marginTop: 8 }}>
          Вернуться на главную
        </Link>
      </div>
    );
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${SHARE_TEXT}&url=${encodeURIComponent(shareUrl)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${SHARE_TEXT}`;
  const whatsappUrl = `https://wa.me/?text=${SHARE_TEXT}%20${encodeURIComponent(shareUrl)}`;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ color: C.accent, fontSize: 20, fontWeight: 800, textDecoration: 'none', letterSpacing: '-0.5px' }}>
          TubeForge
        </Link>
        <Link
          href="/gallery"
          style={{
            color: C.sub, fontSize: 13, textDecoration: 'none',
            padding: '6px 14px', borderRadius: 8,
            border: `1px solid ${C.border}`,
            transition: 'all .15s',
          }}
        >
          Галерея
        </Link>
      </header>

      {/* Main content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        {/* Project info */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.2 }}>{project.title}</h1>
          {project.description && (
            <p style={{ color: C.sub, fontSize: 15, margin: '0 0 12px', lineHeight: 1.5 }}>{project.description}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Author */}
            <Link
              href={`/profile/${project.user.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: C.text }}
            >
              {project.user.image ? (
                <img src={project.user.image} alt={`${project.user.name ?? 'User'} avatar`} loading="lazy" decoding="async" width={28} height={28} style={{ width: 28, height: 28, borderRadius: '50%' }} />
              ) : (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: C.accent, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {(project.user.name ?? '?')[0]?.toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: 14, fontWeight: 600 }}>{project.user.name ?? 'Аноним'}</span>
            </Link>
            <span style={{ color: C.dim, fontSize: 13 }}>
              {new Date(project.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            {project.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {project.tags.slice(0, 5).map((tag) => (
                  <span key={tag} style={{
                    padding: '2px 8px', borderRadius: 6,
                    background: C.card, color: C.sub,
                    fontSize: 12, fontWeight: 500,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail / Preview */}
        {project.thumbnailUrl && (
          <div style={{
            borderRadius: 14, overflow: 'hidden',
            marginBottom: 24, border: `1px solid ${C.border}`,
            aspectRatio: '16/9', position: 'relative',
            background: C.card,
          }}>
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Scenes preview */}
        {project.scenes.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 14px' }}>
              Сцены ({project.scenes.length})
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
            }}>
              {project.scenes.map((scene) => (
                <div key={scene.id} style={{
                  borderRadius: 10, border: `1px solid ${C.border}`,
                  background: C.card, padding: 12,
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  {scene.videoUrl ? (
                    <div style={{
                      aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden',
                      background: C.surface, position: 'relative',
                    }}>
                      <video
                        src={scene.videoUrl}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,.3)',
                      }}>
                        <IconPlay size={28} color="#fff" />
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      aspectRatio: '16/9', borderRadius: 8,
                      background: C.surface,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: C.dim, fontSize: 12,
                    }}>
                      Нет видео
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                    {scene.label || `Сцена ${scene.order + 1}`}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub }}>
                    {scene.duration}с
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Like + Share buttons */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '20px 0', borderTop: `1px solid ${C.border}`,
          flexWrap: 'wrap',
        }}>
          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={liked}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10,
              border: `1px solid ${liked ? C.accent : C.border}`,
              background: liked ? C.accentDim : 'transparent',
              color: liked ? C.accent : C.text,
              cursor: liked ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 600,
              transition: 'all .2s',
            }}
          >
            <IconHeart size={18} filled={liked} color={liked ? C.accent : C.sub} />
            {(project.likesCount ?? 0) + (liked ? 1 : 0)}
          </button>

          <div style={{ flex: 1 }} />

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: copied ? C.green + '18' : 'transparent',
              color: copied ? C.green : C.text,
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
              transition: 'all .2s',
            }}
          >
            <IconCopy size={15} color={copied ? C.green : C.sub} />
            {copied ? 'Скопировано!' : 'Копировать ссылку'}
          </button>

          {/* Twitter/X */}
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.text, textDecoration: 'none',
              fontSize: 13, fontWeight: 500,
              transition: 'all .15s',
            }}
          >
            <IconShare size={15} color={C.sub} />
            X / Twitter
          </a>

          {/* Telegram */}
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.text, textDecoration: 'none',
              fontSize: 13, fontWeight: 500,
              transition: 'all .15s',
            }}
          >
            <IconShare size={15} color={C.sub} />
            Telegram
          </a>

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.text, textDecoration: 'none',
              fontSize: 13, fontWeight: 500,
              transition: 'all .15s',
            }}
          >
            <IconShare size={15} color={C.sub} />
            WhatsApp
          </a>
        </div>

        {/* Footer CTA */}
        <div style={{
          marginTop: 32, padding: '24px', borderRadius: 14,
          background: C.card, border: `1px solid ${C.border}`,
          textAlign: 'center',
        }}>
          <p style={{ color: C.sub, fontSize: 14, margin: '0 0 12px' }}>
            Создано с помощью TubeForge — ИИ-студия для YouTube
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '10px 24px', borderRadius: 10,
              background: C.accent, color: '#fff',
              fontSize: 14, fontWeight: 700,
              textDecoration: 'none',
              transition: 'opacity .15s',
            }}
          >
            Попробовать бесплатно
          </Link>
        </div>
      </div>
    </div>
  );
}
