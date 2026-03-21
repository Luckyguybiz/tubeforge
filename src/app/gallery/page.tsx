'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { useThemeStore } from '@/stores/useThemeStore';

/* ── Inline SVG icons ──────────────────────────── */

function IconHeart({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
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

function IconSearch({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconX({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

type SortOption = 'createdAt' | 'likesCount';

export default function GalleryPage() {
  const C = useThemeStore((s) => s.theme);
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [hovCard, setHovCard] = useState<string | null>(null);
  const [hovTag, setHovTag] = useState<string | null>(null);

  const queryInput = useMemo(() => ({
    sortBy,
    limit: 20,
    ...(activeTag ? { tag: activeTag } : {}),
    ...(searchQuery ? { search: searchQuery } : {}),
  }), [sortBy, activeTag, searchQuery]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.project.listPublic.useInfiniteQuery(
      queryInput,
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialCursor: undefined,
      },
    );

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];
  const popularTags = data?.pages[0]?.popularTags ?? [];

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput.trim());
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
  }, []);

  const handleTagClick = useCallback((tag: string) => {
    setActiveTag((prev) => (prev === tag ? undefined : tag));
  }, []);

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Newest', value: 'createdAt' },
    { label: 'Most Liked', value: 'likesCount' },
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
          href="/dashboard"
          style={{
            color: C.sub, fontSize: 13, textDecoration: 'none',
            padding: '6px 14px', borderRadius: 8,
            border: `1px solid ${C.border}`,
          }}
        >
          My Projects
        </Link>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        {/* Title + sort */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>Community Gallery</h1>
            <p style={{ color: C.sub, fontSize: 14, margin: '6px 0 0' }}>Public projects created by TubeForge members</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                style={{
                  padding: '7px 16px', borderRadius: 8,
                  border: `1px solid ${sortBy === opt.value ? C.accent : C.border}`,
                  background: sortBy === opt.value ? C.accentDim : 'transparent',
                  color: sortBy === opt.value ? C.accent : C.sub,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.card,
          }}>
            <IconSearch size={16} color={C.dim} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Search projects..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: C.text, fontSize: 14,
              }}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: 2, display: 'flex', alignItems: 'center',
                }}
              >
                <IconX size={14} color={C.sub} />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            style={{
              padding: '8px 18px', borderRadius: 10,
              background: C.accent, color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'opacity .15s',
            }}
          >
            Search
          </button>
        </div>

        {/* Tag filters */}
        {popularTags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {activeTag && (
              <button
                onClick={() => setActiveTag(undefined)}
                style={{
                  padding: '5px 12px', borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: 'transparent',
                  color: C.sub,
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'all .15s',
                }}
              >
                <IconX size={11} color={C.sub} />
                Clear filter
              </button>
            )}
            {popularTags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => handleTagClick(tag.name)}
                onMouseEnter={() => setHovTag(tag.name)}
                onMouseLeave={() => setHovTag(null)}
                style={{
                  padding: '5px 12px', borderRadius: 8,
                  border: `1px solid ${activeTag === tag.name ? C.accent : C.border}`,
                  background: activeTag === tag.name ? C.accentDim : hovTag === tag.name ? C.card : 'transparent',
                  color: activeTag === tag.name ? C.accent : C.sub,
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {tag.name}
                <span style={{ opacity: 0.6, marginLeft: 4 }}>{tag.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Active filters indicator */}
        {(searchQuery || activeTag) && (
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.dim, fontSize: 13 }}>Filtered by:</span>
            {searchQuery && (
              <span style={{
                padding: '3px 10px', borderRadius: 6,
                background: C.card, color: C.text,
                fontSize: 12, fontWeight: 500,
              }}>
                &ldquo;{searchQuery}&rdquo;
              </span>
            )}
            {activeTag && (
              <span style={{
                padding: '3px 10px', borderRadius: 6,
                background: C.accentDim, color: C.accent,
                fontSize: 12, fontWeight: 500,
              }}>
                #{activeTag}
              </span>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                borderRadius: 14, background: C.card, border: `1px solid ${C.border}`,
                height: 260, animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && allItems.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
          }}>
            <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }}>
              <IconFilm size={48} color={C.dim} />
            </div>
            <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
              {searchQuery || activeTag ? 'No projects match your filters' : 'No public projects yet'}
            </h2>
            <p style={{ color: C.sub, fontSize: 14, margin: '0 0 20px' }}>
              {searchQuery || activeTag
                ? 'Try adjusting your search or clearing filters.'
                : 'Be the first! Create a project and make it public.'}
            </p>
            {(searchQuery || activeTag) ? (
              <button
                onClick={() => { handleClearSearch(); setActiveTag(undefined); }}
                style={{
                  display: 'inline-block',
                  padding: '10px 24px', borderRadius: 10,
                  background: C.accent, color: '#fff',
                  fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
                }}
              >
                Clear Filters
              </button>
            ) : (
              <Link
                href="/dashboard"
                style={{
                  display: 'inline-block',
                  padding: '10px 24px', borderRadius: 10,
                  background: C.accent, color: '#fff',
                  fontSize: 14, fontWeight: 700, textDecoration: 'none',
                }}
              >
                Create a Project
              </Link>
            )}
          </div>
        )}

        {/* Grid */}
        {allItems.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
                        color: C.dim, fontSize: 13,
                      }}>
                        <IconFilm size={32} color={C.dim} />
                      </div>
                    )}
                    {/* Like badge */}
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
                      fontSize: 15, fontWeight: 700, margin: '0 0 6px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: C.text,
                    }}>
                      {project.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {/* Author */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {project.user.image ? (
                          <img src={project.user.image} alt={`${project.user.name ?? 'User'} avatar`} loading="lazy" decoding="async" width={20} height={20} style={{ width: 20, height: 20, borderRadius: '50%' }} />
                        ) : (
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: C.accent, color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 700,
                          }}>
                            {(project.user.name ?? '?')[0]?.toUpperCase()}
                          </div>
                        )}
                        <span style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>
                          {project.user.name ?? 'Anonymous'}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: C.dim }}>
                        {project._count.scenes} {project._count.scenes === 1 ? 'scene' : 'scenes'}
                      </span>
                    </div>
                    {/* Tags */}
                    {project.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                        {project.tags.slice(0, 3).map((tag) => (
                          <span key={tag} style={{
                            padding: '2px 6px', borderRadius: 4,
                            background: C.surface, color: C.dim,
                            fontSize: 11, fontWeight: 500,
                          }}>
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span style={{ fontSize: 11, color: C.dim }}>+{project.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
                transition: 'all .15s',
              }}
            >
              {isFetchingNextPage ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.5 }
        }
      `}</style>
    </div>
  );
}
