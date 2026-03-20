'use client';

import { useCallback } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useThemeStore } from '@/stores/useThemeStore';

function IconHeart({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function IconFilm({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const C = useThemeStore((s) => s.theme);
  const [hovCard, setHovCard] = useState<string | null>(null);

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.project.listByUser.useInfiniteQuery(
      { userId, limit: 20 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialCursor: undefined,
      },
    );

  const user = data?.pages[0]?.user;
  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.sub, fontSize: 16 }}>Загрузка...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>👤</div>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>Пользователь не найден</h1>
        <Link href="/gallery" style={{ color: C.accent, fontSize: 14, textDecoration: 'none', marginTop: 8 }}>
          Перейти в галерею
        </Link>
      </div>
    );
  }

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
          }}
        >
          Галерея
        </Link>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        {/* Profile card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20,
          marginBottom: 36, padding: '24px',
          borderRadius: 16, background: C.card,
          border: `1px solid ${C.border}`,
        }}>
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? ''}
              style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, flexShrink: 0,
            }}>
              {(user.name ?? '?')[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>
              {user.name ?? 'Аноним'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: C.sub, fontSize: 13 }}>
                {allItems.length} {allItems.length === 1 ? 'публичный проект' : allItems.length < 5 ? 'публичных проекта' : 'публичных проектов'}
              </span>
              <span style={{ color: C.dim, fontSize: 12 }}>
                С {new Date(user.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              marginTop: 8, padding: '4px 10px', borderRadius: 6,
              background: C.accentDim, color: C.accent,
              fontSize: 11, fontWeight: 700,
            }}>
              Создано с TubeForge
            </div>
          </div>
        </div>

        {/* Projects grid */}
        {allItems.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            borderRadius: 14, background: C.card,
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 12 }}>🎬</div>
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>
              Нет публичных проектов
            </h2>
            <p style={{ color: C.sub, fontSize: 14, margin: 0 }}>
              У этого пользователя пока нет публичных проектов
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Проекты</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}>
              {allItems.map((project) => (
                <Link
                  key={project.id}
                  href={`/share/${project.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  onMouseEnter={() => setHovCard(project.id)}
                  onMouseLeave={() => setHovCard(null)}
                >
                  <div style={{
                    borderRadius: 14, overflow: 'hidden',
                    border: `1px solid ${hovCard === project.id ? C.borderActive : C.border}`,
                    background: C.card,
                    transition: 'all .2s ease',
                    transform: hovCard === project.id ? 'translateY(-2px)' : 'none',
                    boxShadow: hovCard === project.id ? '0 8px 24px rgba(0,0,0,.12)' : 'none',
                  }}>
                    {/* Thumbnail */}
                    <div style={{
                      aspectRatio: '16/9',
                      background: C.surface,
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      {project.thumbnailUrl ? (
                        <img
                          src={project.thumbnailUrl}
                          alt={project.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <IconFilm size={28} color={C.dim} />
                        </div>
                      )}
                      {project.likesCount > 0 && (
                        <div style={{
                          position: 'absolute', top: 8, right: 8,
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '3px 8px', borderRadius: 6,
                          background: 'rgba(0,0,0,.6)', color: '#fff',
                          fontSize: 12, fontWeight: 600,
                        }}>
                          <IconHeart size={12} color="#ef4444" />
                          {project.likesCount}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '12px 14px' }}>
                      <h3 style={{
                        fontSize: 15, fontWeight: 700, margin: '0 0 4px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: C.text,
                      }}>
                        {project.title}
                      </h3>
                      <span style={{ fontSize: 12, color: C.dim }}>
                        {project._count.scenes} {project._count.scenes === 1 ? 'сцена' : project._count.scenes < 5 ? 'сцены' : 'сцен'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Load more */}
        {hasNextPage && (
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button
              onClick={handleLoadMore}
              disabled={isFetchingNextPage}
              style={{
                padding: '10px 28px', borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: 'transparent',
                color: C.text, fontSize: 14, fontWeight: 600,
                cursor: isFetchingNextPage ? 'default' : 'pointer',
                opacity: isFetchingNextPage ? 0.6 : 1,
              }}
            >
              {isFetchingNextPage ? 'Загрузка...' : 'Показать ещё'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
