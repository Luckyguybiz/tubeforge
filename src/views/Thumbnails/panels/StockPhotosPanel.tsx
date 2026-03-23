'use client';

import { useState, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { trpc } from '@/lib/trpc';

interface StockPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographerUrl: string;
  src: { medium: string; large: string; original: string; small: string };
  alt: string;
}

export function StockPhotosPanel() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = trpc.stock.searchPhotos.useQuery(
    { query: searchTerm, page, perPage: 20 },
    { enabled: searchTerm.length > 0 },
  );

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length > 0) {
      setSearchTerm(trimmed);
      setPage(1);
    }
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  const handleAddPhoto = useCallback((photo: StockPhoto) => {
    const store = useThumbnailStore.getState();
    store.addImage(photo.src.large);
  }, []);

  const photos = data?.photos ?? [];
  const total = data?.total ?? 0;
  const note = data?.note;
  const hasMore = photos.length > 0 && page * 20 < total;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search input */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('thumbs.stock.searchPlaceholder')}
          aria-label={t('thumbs.stock.searchPlaceholder')}
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.surface,
            color: C.text,
            fontSize: 12,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSearch}
          aria-label={t('thumbs.stock.search')}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: C.accent,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>

      {/* Note / error */}
      {note && (
        <div style={{ fontSize: 11, color: C.dim, textAlign: 'center', padding: '4px 0' }}>
          {note}
        </div>
      )}

      {/* Loading skeletons */}
      {(isLoading || isFetching) && searchTerm && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '4/3',
                borderRadius: 8,
                background: C.surface,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isFetching && searchTerm && photos.length === 0 && !note && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: C.dim, fontSize: 12 }}>
          {t('thumbs.stock.noResults')}
        </div>
      )}

      {/* Initial state */}
      {!searchTerm && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: C.dim, fontSize: 12 }}>
          {t('thumbs.stock.initialHint')}
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {photos.map((photo) => (
            <div
              key={photo.id}
              role="button"
              tabIndex={0}
              aria-label={photo.alt || `${t('thumbs.stock.photoBy')} ${photo.photographer}`}
              onClick={() => handleAddPhoto(photo)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAddPhoto(photo); } }}
              style={{
                position: 'relative',
                borderRadius: 8,
                overflow: 'hidden',
                cursor: 'pointer',
                border: `1px solid ${C.border}`,
                transition: 'all .15s',
                aspectRatio: '4/3',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = C.accent;
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = C.border;
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              <img
                src={photo.src.small}
                alt={photo.alt || `Photo by ${photo.photographer}`}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {/* Photographer attribution overlay */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 6px 4px',
                background: 'linear-gradient(transparent, rgba(0,0,0,.7))',
                fontSize: 9,
                color: 'rgba(255,255,255,.8)',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {photo.photographer}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isFetching}
          style={{
            width: '100%',
            padding: '8px 0',
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.surface,
            color: C.sub,
            fontSize: 11,
            fontWeight: 600,
            cursor: isFetching ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            transition: 'all .12s',
          }}
        >
          {isFetching ? t('thumbs.stock.loading') : t('thumbs.stock.loadMore')}
        </button>
      )}

      {/* Powered by Pexels attribution */}
      <div style={{
        textAlign: 'center',
        padding: '6px 0 2px',
        borderTop: `1px solid ${C.border}`,
        marginTop: 4,
      }}>
        <a
          href="https://www.pexels.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 10,
            color: C.dim,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            transition: 'color .12s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.sub; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.dim; }}
        >
          <svg width="12" height="12" viewBox="0 0 32 32" fill="currentColor">
            <path d="M2 0h28a2 2 0 012 2v28a2 2 0 01-2 2H2a2 2 0 01-2-2V2a2 2 0 012-2zm12.9 17.5a4.6 4.6 0 100-9.2 4.6 4.6 0 000 9.2zm0-12.7a8.1 8.1 0 110 16.2 8.1 8.1 0 010-16.2zM8 25h16v2H8v-2z" />
          </svg>
          Powered by Pexels
        </a>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
