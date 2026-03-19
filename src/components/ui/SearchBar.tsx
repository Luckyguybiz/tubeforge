'use client';

import { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { SEARCH_DEBOUNCE_MS, Z_INDEX } from '@/lib/constants';

/** Highlight matching text segments within a string */
function HighlightText({
  text,
  query,
  color,
  highlightBg,
}: {
  text: string;
  query: string;
  color: string;
  highlightBg: string;
}) {
  if (!query.trim() || !text) {
    return <span>{text}</span>;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const splitRegex = new RegExp(`(${escaped})`, 'gi');
  const matchRegex = new RegExp(`^${escaped}$`, 'i');
  const parts = text.split(splitRegex);

  return (
    <span>
      {parts.map((part, i) =>
        matchRegex.test(part) ? (
          <mark
            key={i}
            style={{
              background: highlightBg,
              color,
              borderRadius: 2,
              padding: '0 1px',
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#6b7280',
  RENDERING: '#f59e0b',
  READY: '#22c55e',
  PUBLISHED: '#3b82f6',
};

interface SearchBarProps {
  /** Whether the search bar is expanded/visible */
  expanded: boolean;
  /** Callback when closing the search bar */
  onClose: () => void;
}

export const SearchBar = memo(function SearchBar({ expanded, onClose }: SearchBarProps) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Debounce the query
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results
  const { data, isLoading } = trpc.project.search.useQuery(
    { query: debouncedQuery, take: 10 },
    {
      enabled: debouncedQuery.length > 0,
      placeholderData: keepPreviousData,
      staleTime: 30_000,
    },
  );

  const projects = data?.projects ?? [];
  const scenes = data?.scenes ?? [];

  // Build flat list of selectable items for keyboard navigation
  const items = useMemo(() => {
    const list: Array<{ type: 'project' | 'scene'; id: string; projectId: string }> = [];
    for (const p of projects) {
      list.push({ type: 'project', id: p.id, projectId: p.id });
    }
    for (const s of scenes) {
      list.push({ type: 'scene', id: s.id, projectId: s.projectId });
    }
    return list;
  }, [projects, scenes]);

  // Open dropdown when there's a query
  useEffect(() => {
    setIsOpen(debouncedQuery.length > 0);
    setActiveIndex(-1);
  }, [debouncedQuery]);

  // Focus input on expand
  useEffect(() => {
    if (expanded) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setDebouncedQuery('');
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }, [expanded]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const navigateTo = useCallback(
    (projectId: string) => {
      router.push(`/editor/${projectId}`);
      setQuery('');
      setIsOpen(false);
      onClose();
    },
    [router, onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isOpen) {
          setIsOpen(false);
        } else {
          onClose();
        }
        return;
      }

      if (!isOpen || items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev < items.length - 1 ? prev + 1 : 0;
          itemRefs.current[next]?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev > 0 ? prev - 1 : items.length - 1;
          itemRefs.current[next]?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < items.length) {
          navigateTo(items[activeIndex].projectId);
        }
      }
    },
    [isOpen, items, activeIndex, navigateTo, onClose],
  );

  if (!expanded) return null;

  const highlightBg = `${C.accent}22`;
  const hasResults = projects.length > 0 || scenes.length > 0;
  const showDropdown = isOpen && debouncedQuery.length > 0;

  let flatIndex = -1;

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
      {/* Search icon */}
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke={C.sub}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (debouncedQuery.length > 0) setIsOpen(true);
        }}
        placeholder={t('topbar.searchProjects')}
        aria-label={t('topbar.searchProjects')}
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        role="combobox"
        style={{
          width: 260,
          height: 28,
          padding: '0 10px',
          borderRadius: 7,
          border: `1px solid ${C.borderActive}`,
          background: C.bg,
          color: C.text,
          fontSize: 12,
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color .15s',
        }}
      />

      {/* Loading spinner */}
      {isLoading && debouncedQuery && (
        <div
          style={{
            width: 14,
            height: 14,
            border: `2px solid ${C.border}`,
            borderTopColor: C.accent,
            borderRadius: '50%',
            animation: 'tf-spin 0.6s linear infinite',
            flexShrink: 0,
          }}
        />
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        aria-label={t('topbar.clearSearch')}
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          border: `1px solid ${C.border}`,
          background: 'transparent',
          color: C.sub,
          fontSize: 10,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'inherit',
          flexShrink: 0,
        }}
      >
        x
      </button>

      {/* Results dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          role="listbox"
          style={{
            position: 'absolute',
            top: 36,
            left: 0,
            width: 380,
            maxHeight: 420,
            overflowY: 'auto',
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            boxShadow: `0 8px 32px ${C.overlay}`,
            zIndex: Z_INDEX.DROPDOWN,
          }}
        >
          {isLoading && !data && (
            <div style={{ padding: '16px 14px', textAlign: 'center', color: C.dim, fontSize: 12 }}>
              {t('search.loading')}
            </div>
          )}

          {!isLoading && !hasResults && (
            <div style={{ padding: '16px 14px', textAlign: 'center', color: C.dim, fontSize: 12 }}>
              {t('search.noResults')}
            </div>
          )}

          {/* Project results */}
          {projects.length > 0 && (
            <>
              <div
                style={{
                  padding: '8px 14px 4px',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: C.dim,
                }}
              >
                {t('search.projects')}
              </div>
              {projects.map((p) => {
                flatIndex++;
                const idx = flatIndex;
                const isActive = idx === activeIndex;
                return (
                  <div
                    key={p.id}
                    ref={(el) => { itemRefs.current[idx] = el; }}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => navigateTo(p.id)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 14px',
                      cursor: 'pointer',
                      background: isActive ? C.surface : 'transparent',
                      borderBottom: `1px solid ${C.border}`,
                      transition: 'background 0.1s',
                    }}
                  >
                    {/* Thumbnail or icon */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 6,
                        background: p.thumbnailUrl ? `url(${p.thumbnailUrl}) center/cover` : `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        color: '#fff',
                        fontWeight: 800,
                      }}
                    >
                      {!p.thumbnailUrl && p.title.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <HighlightText text={p.title} query={query} color={C.text} highlightBg={highlightBg} />
                      </div>
                      {p.description && (
                        <div style={{ fontSize: 11, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                          <HighlightText text={p.description.slice(0, 80)} query={query} color={C.sub} highlightBg={highlightBg} />
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: C.dim }}>{p.sceneCount} {t('search.scenes')}</span>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          background: STATUS_COLORS[p.status] ?? C.dim,
                          flexShrink: 0,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Scene results */}
          {scenes.length > 0 && (
            <>
              <div
                style={{
                  padding: '8px 14px 4px',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: C.dim,
                }}
              >
                {t('search.scenesLabel')}
              </div>
              {scenes.map((s) => {
                flatIndex++;
                const idx = flatIndex;
                const isActive = idx === activeIndex;
                return (
                  <div
                    key={s.id}
                    ref={(el) => { itemRefs.current[idx] = el; }}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => navigateTo(s.projectId)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 14px',
                      cursor: 'pointer',
                      background: isActive ? C.surface : 'transparent',
                      borderBottom: `1px solid ${C.border}`,
                      transition: 'background 0.1s',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 6,
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        color: C.sub,
                        fontWeight: 700,
                      }}
                    >
                      #{s.order + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <HighlightText text={s.label || `Scene ${s.order + 1}`} query={query} color={C.text} highlightBg={highlightBg} />
                      </div>
                      {s.prompt && (
                        <div style={{ fontSize: 11, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                          <HighlightText text={s.prompt.slice(0, 80)} query={query} color={C.sub} highlightBg={highlightBg} />
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: C.dim, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>
                      {s.projectTitle}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Spinner keyframe animation */}
      <style>{`
        @keyframes tf-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});
