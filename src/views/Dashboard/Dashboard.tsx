'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorFallback } from '@/components/ui/ErrorFallback';
import { toast } from '@/stores/useNotificationStore';
import { pluralRu, timeAgo } from '@/lib/utils';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

const STATUS_MAP: Record<string, { label: string; color: 'green' | 'orange' | 'blue' | 'dim' }> = {
  PUBLISHED: { label: 'Опубликовано', color: 'green' },
  READY: { label: 'Готово', color: 'blue' },
  RENDERING: { label: 'Рендер...', color: 'orange' },
  DRAFT: { label: 'Черновик', color: 'dim' },
};

const FILTER_OPTIONS = [
  { label: 'Все', value: undefined },
  { label: 'Черновик', value: 'DRAFT' as const },
  { label: 'Рендер', value: 'RENDERING' as const },
  { label: 'Готово', value: 'READY' as const },
  { label: 'Опубликовано', value: 'PUBLISHED' as const },
];

const SORT_OPTIONS = [
  { label: 'По дате', value: 'updatedAt' as const },
  { label: 'По названию', value: 'title' as const },
  { label: 'По созданию', value: 'createdAt' as const },
];

const PLAN_LABEL: Record<string, string> = {
  FREE: 'Бесплатный',
  PRO: 'Pro',
  STUDIO: 'Studio',
};


export function Dashboard() {
  const C = useThemeStore((s) => s.theme);
  const router = useRouter();
  const utils = trpc.useUtils();

  // Search with debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'DRAFT' | 'RENDERING' | 'READY' | 'PUBLISHED' | undefined>();
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');
  const [page, setPage] = useState(1);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Inline rename
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const profile = trpc.user.getProfile.useQuery();
  // Total count (unfiltered) for stats card
  const totalProjects = trpc.project.list.useQuery({ page: 1, limit: 1 });
  const projects = trpc.project.list.useQuery({
    search: debouncedSearch || undefined,
    status: statusFilter,
    sortBy,
    page,
    limit: 20,
  });

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

  // Focus rename input
  useEffect(() => {
    if (renameId && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [renameId]);

  // Single / double-click discrimination via e.detail
  const clickTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleTitleClick = (e: React.MouseEvent, projectId: string, title: string) => {
    // detail === 2 → second click of a double-click → enter rename mode
    if (e.detail >= 2) {
      e.stopPropagation();
      if (clickTimer.current) { clearTimeout(clickTimer.current); clickTimer.current = undefined; }
      setRenameId(projectId);
      setRenameValue(title);
      return;
    }
    // detail === 1 → single click → navigate after 350ms (cancelled if dbl follows)
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      clickTimer.current = undefined;
      router.push(`/editor?projectId=${projectId}`);
    }, 350);
  };

  // Error states
  if (profile.isError) {
    return <ErrorFallback error={profile.error instanceof Error ? profile.error : new Error(String(profile.error))} reset={() => profile.refetch()} />;
  }
  if (projects.isError) {
    return <ErrorFallback error={projects.error instanceof Error ? projects.error : new Error(String(projects.error))} reset={() => projects.refetch()} />;
  }

  const user = profile.data;
  const plan = user?.plan ?? 'FREE';

  const stats = useMemo(() => [
    { label: 'Проекты', value: String(totalProjects.data?.total ?? user?._count?.projects ?? 0), icon: '📁' },
    { label: 'План', value: PLAN_LABEL[plan] ?? plan, icon: '⭐' },
    { label: 'ИИ-запросов', value: String(user?.aiUsage ?? 0), icon: '🤖' },
    { label: 'Каналы', value: String(user?.channels?.length ?? 0), icon: '📺' },
  ], [totalProjects.data?.total, user?._count?.projects, plan, user?.aiUsage, user?.channels?.length]);

  const handleRename = (id: string) => {
    const val = renameValue.trim();
    if (val && val.length <= 100) {
      renameProject.mutate({ id, title: val });
    } else {
      if (!val) toast.warning('Название не может быть пустым');
      setRenameId(null);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-.02em' }}>
        {profile.isLoading ? <Skeleton width={240} height={32} /> : `Привет, ${user?.name ?? 'Создатель'}!`}
      </h2>
      <p style={{ color: C.sub, fontSize: 14, marginBottom: 24 }}>
        План: <span style={{ color: C.accent }}>{PLAN_LABEL[plan] ?? plan}</span>
      </p>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        {profile.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ flex: 1, minWidth: 150 }}>
                <Skeleton height={100} />
              </div>
            ))
          : stats.map((s, i) => (
              <div key={i} className="tf-stat-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', flex: 1, minWidth: 150, position: 'relative', overflow: 'hidden', cursor: 'default', transition: 'box-shadow .2s ease, transform .2s ease' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${C.accent},transparent)`, opacity: 0.5 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  <span style={{ fontSize: 14, color: C.sub }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em' }}>{s.value}</div>
              </div>
            ))}
      </div>

      {/* Projects list */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-.01em' }}>Мои видео</h3>
            {projects.isRefetching && (
              <span style={{ fontSize: 11, color: C.sub, animation: 'pulse 1s infinite' }}>обновление...</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.dim, pointerEvents: 'none' }}>&#128269;</span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Поиск..."
                aria-label="Поиск проектов"
                style={{ padding: '9px 14px 9px 34px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, fontFamily: 'inherit', width: 200, transition: 'border-color .2s' }}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
              aria-label="Сортировка проектов"
              style={{ padding: '8px 10px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, fontFamily: 'inherit' }}
            >
              {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 4 }} role="group" aria-label="Фильтр по статусу">
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => { setStatusFilter(f.value); setPage(1); }}
                  aria-pressed={statusFilter === f.value}
                  style={{
                    padding: '6px 14px', borderRadius: 9999, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s ease',
                    background: statusFilter === f.value ? C.accentDim : 'transparent',
                    color: statusFilter === f.value ? C.accent : C.sub,
                  }}
                >{f.label}</button>
              ))}
            </div>
            <button
              onClick={() => createProject.mutate({})}
              disabled={createProject.isPending}
              style={{
                background: C.accent, color: '#fff', border: 'none', borderRadius: 9999,
                padding: '9px 20px', fontSize: 14, fontWeight: 600, transition: 'all .2s ease',
                cursor: createProject.isPending ? 'wait' : 'pointer',
                fontFamily: 'inherit', opacity: createProject.isPending ? 0.6 : 1,
                boxShadow: `0 2px 8px ${C.accent}33`,
              }}
            >
              {createProject.isPending ? 'Создание...' : '+ Новое видео'}
            </button>
          </div>
        </div>

        {projects.isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={55} />)}
          </div>
        ) : !projects.data?.items?.length ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.2 }}>
              {debouncedSearch || statusFilter ? '\uD83D\uDD0D' : '\uD83C\uDFAC'}
            </div>
            <div style={{ color: C.sub, fontSize: 14, marginBottom: 8 }}>
              {debouncedSearch || statusFilter ? 'Ничего не найдено' : 'У вас пока нет проектов'}
            </div>
            {debouncedSearch || statusFilter ? (
              <button
                onClick={() => { setSearchInput(''); setDebouncedSearch(''); setStatusFilter(undefined); setPage(1); }}
                style={{ padding: '10px 24px', borderRadius: 9999, background: C.surface, color: C.text, border: `1px solid ${C.border}`, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s ease' }}
              >Сбросить фильтры</button>
            ) : (
              <button
                onClick={() => createProject.mutate({})}
                style={{ padding: '10px 24px', borderRadius: 9999, background: C.accent, color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 2px 8px ${C.accent}33`, transition: 'all .2s ease' }}
              >Создать первый проект</button>
            )}
          </div>
        ) : (
          <>
            {projects.data.items.map((p, i) => {
              const st = STATUS_MAP[p.status] ?? STATUS_MAP.DRAFT;
              const isDeleting = deleteId === p.id;
              return (
                <div
                  key={p.id}
                  className="tf-project-row"
                  style={{
                    display: 'flex', alignItems: 'center', padding: '12px 8px',
                    borderTop: i > 0 ? `1px solid ${C.border}` : 'none',
                    gap: 14, opacity: deleteProject.isPending && deleteId === p.id ? 0.4 : 1,
                    borderRadius: 10, transition: 'background .15s ease', margin: '0 -8px',
                  }}
                >
                  {/* Thumbnail preview */}
                  <div
                    onClick={() => router.push(`/editor?projectId=${p.id}`)}
                    style={{ width: 88, height: 50, borderRadius: 10, background: C.surface, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: C.dim, cursor: 'pointer', overflow: 'hidden', position: 'relative', transition: 'transform .15s ease' }}
                  >
                    {p.thumbnailUrl ? (
                      <Image src={p.thumbnailUrl} alt={p.title} fill style={{ objectFit: 'cover' }} sizes="80px" />
                    ) : '\u25B6'}
                  </div>

                  {/* Title / Rename */}
                  <div style={{ flex: 1, cursor: 'pointer' }}>
                    {renameId === p.id ? (
                      <input
                        ref={renameRef}
                        value={renameValue}
                        maxLength={100}
                        aria-label="Новое название проекта"
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleRename(p.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(p.id);
                          if (e.key === 'Escape') setRenameId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: 14, fontWeight: 500, border: `1px solid ${C.accent}`, borderRadius: 8, padding: '4px 8px', background: C.surface, color: C.text, fontFamily: 'inherit', width: '100%' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div
                          style={{ fontSize: 14, fontWeight: 500, flex: 1 }}
                          onClick={(e) => handleTitleClick(e, p.id, p.title)}
                          title="Двойной клик для переименования"
                        >
                          {p.title}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setRenameId(p.id); setRenameValue(p.title); }}
                          title="Переименовать"
                          aria-label={`Переименовать проект ${p.title}`}
                          style={{ width: 20, height: 20, borderRadius: 4, border: 'none', background: 'transparent', color: C.dim, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, flexShrink: 0 }}
                        >✎</button>
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>
                      {pluralRu(p._count.scenes, 'сцена', 'сцены', 'сцен')} {'\u00B7'} {timeAgo(p.updatedAt)}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span style={{ padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 600, background: `${C[st.color]}18`, color: C[st.color] }}>
                    {st.label}
                  </span>

                  {/* Delete */}
                  {isDeleting ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <span style={{ fontSize: 11, color: C.sub, fontWeight: 500, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Удалить «{p.title}»?</span>
                      <button
                        onClick={() => deleteProject.mutate({ id: p.id })}
                        disabled={deleteProject.isPending}
                        style={{ padding: '5px 14px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s ease' }}
                      >{deleteProject.isPending ? '...' : 'Да'}</button>
                      <button
                        onClick={() => setDeleteId(null)}
                        style={{ padding: '5px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s ease' }}
                      >Нет</button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }}
                      title="Удалить проект"
                      aria-label={`Удалить проект ${p.title}`}
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.dim, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', transition: 'all .15s ease' }}
                    >&#215;</button>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {projects.data.pages > 1 && (
              <nav aria-label="Навигация по страницам" style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                {Array.from({ length: Math.min(projects.data.pages, 10) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    aria-label={`Страница ${i + 1}`}
                    aria-current={page === i + 1 ? 'page' : undefined}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s ease',
                      background: page === i + 1 ? C.accent : 'transparent',
                      color: page === i + 1 ? '#fff' : C.sub,
                    }}
                  >{i + 1}</button>
                ))}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
