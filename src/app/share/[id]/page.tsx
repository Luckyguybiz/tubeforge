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

function IconPlay({ size = 32, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function IconTwitter({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconTelegram({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function IconWhatsApp({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconReddit({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0zm5.5 13.5c0 .276-.224.5-.5.5s-.5-.224-.5-.5.224-.5.5-.5.5.224.5.5zm-5.5 5c-2.485 0-4.5-1.343-4.5-3s2.015-3 4.5-3 4.5 1.343 4.5 3-2.015 3-4.5 3zm-5-5.5c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5-.5z" />
    </svg>
  );
}

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
  const shareText = project ? `Check out "${project.title}" made with TubeForge!` : 'Check out this video made with TubeForge!';
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

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
        <div style={{ color: C.sub, fontSize: 16 }}>Loading...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>This project is private</h1>
        <p style={{ color: C.sub, fontSize: 15, margin: 0 }}>The project was not found or is set to private.</p>
        <Link href="/gallery" style={{ color: C.accent, fontSize: 14, textDecoration: 'none', marginTop: 8 }}>
          Browse the Gallery
        </Link>
      </div>
    );
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
  const whatsappUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
  const redditUrl = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`;

  const socialLinks = [
    { label: 'X / Twitter', href: twitterUrl, icon: <IconTwitter size={15} color={C.sub} />, hoverBg: 'rgba(29,155,240,.08)' },
    { label: 'Telegram', href: telegramUrl, icon: <IconTelegram size={15} color={C.sub} />, hoverBg: 'rgba(0,136,204,.08)' },
    { label: 'WhatsApp', href: whatsappUrl, icon: <IconWhatsApp size={15} color={C.sub} />, hoverBg: 'rgba(37,211,102,.08)' },
    { label: 'Reddit', href: redditUrl, icon: <IconReddit size={15} color={C.sub} />, hoverBg: 'rgba(255,69,0,.08)' },
  ];

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
          Gallery
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
              <span style={{ fontSize: 14, fontWeight: 600 }}>{project.user.name ?? 'Anonymous'}</span>
            </Link>
            <span style={{ color: C.dim, fontSize: 13 }}>
              {new Date(project.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            {project.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {project.tags.slice(0, 5).map((tag) => (
                  <Link key={tag} href={`/gallery?tag=${encodeURIComponent(tag)}`} style={{
                    padding: '2px 8px', borderRadius: 6,
                    background: C.card, color: C.sub,
                    fontSize: 12, fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'all .15s',
                  }}>
                    {tag}
                  </Link>
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
              Scenes ({project.scenes.length})
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
                      No video
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                    {scene.label || `Scene ${scene.order + 1}`}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub }}>
                    {scene.duration}s
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Like + Share buttons */}
        <div style={{
          padding: '20px 0', borderTop: `1px solid ${C.border}`,
        }}>
          {/* Like button row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
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
              {liked ? 'Liked!' : 'Like'} ({(project.likesCount ?? 0) + (liked ? 1 : 0)})
            </button>
          </div>

          {/* Share section */}
          <div style={{
            padding: '16px', borderRadius: 12,
            background: C.card, border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Share this project</div>

            {/* Copy link */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{
                flex: 1, padding: '8px 12px', borderRadius: 8,
                background: C.surface, border: `1px solid ${C.border}`,
                color: C.sub, fontSize: 13,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {shareUrl}
              </div>
              <button
                onClick={handleCopyLink}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8,
                  border: `1px solid ${copied ? C.green : C.border}`,
                  background: copied ? C.green + '18' : 'transparent',
                  color: copied ? C.green : C.text,
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  transition: 'all .2s', whiteSpace: 'nowrap',
                }}
              >
                <IconCopy size={15} color={copied ? C.green : C.sub} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Social share buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: 'transparent',
                    color: C.text, textDecoration: 'none',
                    fontSize: 13, fontWeight: 500,
                    transition: 'all .15s',
                  }}
                >
                  {link.icon}
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{
          marginTop: 32, padding: '24px', borderRadius: 14,
          background: C.card, border: `1px solid ${C.border}`,
          textAlign: 'center',
        }}>
          <p style={{ color: C.sub, fontSize: 14, margin: '0 0 12px' }}>
            Made with TubeForge -- the AI-powered YouTube studio
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
            Try for Free
          </Link>
        </div>
      </div>
    </div>
  );
}
