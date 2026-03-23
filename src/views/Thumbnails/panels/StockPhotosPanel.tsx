'use client';

import { useState, useCallback, useRef } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/Skeleton';

const CATEGORIES = ['Nature', 'People', 'Technology', 'Business', 'Food', 'Travel', 'Abstract', 'Textures'] as const;
const PER_PAGE = 15;

export function StockPhotosPanel() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const addImage = useThumbnailStore((s) => s.addImage);

  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isFetching } = trpc.stock.searchPhotos.useQuery(
    { query: searchTerm, page, perPage: PER_PAGE },
    { enabled: searchTerm.length > 0, keepPreviousData: true },
  );

  const photos = data?.photos ?? [];
  const total = data?.total ?? 0;
  const hasMore = photos.length > 0 && page * PER_PAGE < total;

  const doSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setSearchTerm(trimmed);
    setPage(1);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const handleCategory = (cat: string) => {
    setQuery(cat);
    setSearchTerm(cat);
    setPage(1);
    inputRef.current?.focus();
  };

  const handleAddPhoto = (url: string) => {
    addImage(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search bar */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 6 }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stock photos..."
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: 7,
            border: `1px solid ${C.border}`,
            background: C.surface,
            color: C.text,
            fontSize: 12,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 14px',
            borderRadius: 7,
            border: 'none',
            background: C.accent,
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          Search
        </button>
      </form>

      {/* Quick category filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategory(cat)}
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              border: `1px solid ${searchTerm === cat ? C.accent : C.border}`,
              background: searchTerm === cat ? `${C.accent}22` : C.surface,
              color: searchTerm === cat ? C.accent : C.sub,
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .12s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading && searchTerm ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="72px" rounded />
          ))}
        </div>
      ) : photos.length > 0 ? (
        <>
          <div style={{ fontSize: 10, color: C.dim, fontWeight: 500 }}>
            {total.toLocaleString()} results for &ldquo;{searchTerm}&rdquo;
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {photos.map((photo) => (
              <div
                key={photo.id}
                role="button"
                tabIndex={0}
                title={`${photo.alt || searchTerm} - ${photo.photographer}`}
                onClick={() => handleAddPhoto(photo.src.large)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleAddPhoto(photo.src.large);
                  }
                }}
                style={{
                  position: 'relative',
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  aspectRatio: '1',
                  background: C.surface,
                  transition: 'border-color .12s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = C.accent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = C.border;
                }}
              >
                <img
                  src={photo.src.small}
                  alt={photo.alt || searchTerm}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,.65))',
                    padding: '10px 4px 3px',
                    fontSize: 8,
                    color: '#ffffffcc',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {photo.photographer}
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching}
              style={{
                padding: '8px 0',
                borderRadius: 7,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.text,
                fontSize: 11,
                fontWeight: 600,
                cursor: isFetching ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                opacity: isFetching ? 0.5 : 1,
                transition: 'opacity .15s',
              }}
            >
              {isFetching ? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      ) : searchTerm && !isLoading ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: C.dim, fontSize: 12 }}>
          <div style={{ marginBottom: 6, opacity: 0.3, fontSize: 28 }}>&#128247;</div>
          No photos found for &ldquo;{searchTerm}&rdquo;
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0', color: C.dim, fontSize: 12 }}>
          <div style={{ marginBottom: 6, opacity: 0.3, fontSize: 28 }}>&#128247;</div>
          Search for free stock photos to add to your design
        </div>
      )}

      {/* Attribution */}
      <div style={{ textAlign: 'center', fontSize: 9, color: C.dim, paddingTop: 4, borderTop: `1px solid ${C.border}` }}>
        Photos by{' '}
        <a
          href="https://www.pexels.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: C.sub, textDecoration: 'underline' }}
        >
          Pexels
        </a>
      </div>
    </div>
  );
}
