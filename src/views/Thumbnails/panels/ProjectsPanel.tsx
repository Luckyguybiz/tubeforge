'use client';

import { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/stores/useNotificationStore';

export function ProjectsPanel() {
  const C = useThemeStore((s) => s.theme);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentProjectId = searchParams.get('projectId');

  const [folderId, setFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const projects = trpc.project.list.useQuery();
  const folders = trpc.folder.list.useQuery({ parentId: folderId });
  const assets = trpc.asset.list.useQuery({ folderId, page: 1, limit: 20 });

  const onMutError = (err: { message: string }) => toast.error(err.message);
  const createFolder = trpc.folder.create.useMutation({
    onSuccess: () => { folders.refetch(); setNewFolderName(''); setShowNewFolder(false); },
    onError: onMutError,
  });
  const renameFolder = trpc.folder.rename.useMutation({
    onSuccess: () => { folders.refetch(); setRenamingId(null); },
    onError: onMutError,
  });
  const deleteFolder = trpc.folder.delete.useMutation({
    onSuccess: () => folders.refetch(),
    onError: onMutError,
  });

  const btnStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 6,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  return (
    <div>
      {/* Projects section */}
      <div style={{ marginBottom: 18 }}>
        <h4 style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>
          Проекты
        </h4>
        {projects.isError ? (
          <div style={{ textAlign: 'center', padding: '16px 8px', color: C.dim, fontSize: 12 }}>
            <div style={{ marginBottom: 6, opacity: 0.4, display: 'flex', justifyContent: 'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
            <div style={{ color: C.accent, marginBottom: 8 }}>Ошибка загрузки</div>
            <button onClick={() => projects.refetch()} style={btnStyle}>Повторить</button>
          </div>
        ) : projects.isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height="44px" />)}
          </div>
        ) : projects.data && projects.data.items.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {projects.data.items.slice(0, 10).map((proj) => (
              <div
                key={proj.id}
                role="button"
                tabIndex={0}
                aria-label={`Открыть проект ${proj.title}`}
                aria-current={proj.id === currentProjectId ? 'true' : undefined}
                onClick={() => router.push(`/thumbnails?projectId=${proj.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/thumbnails?projectId=${proj.id}`); } }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${proj.id === currentProjectId ? C.accent + '55' : C.border}`,
                  background: proj.id === currentProjectId ? C.accentDim : C.surface,
                  cursor: 'pointer',
                  transition: 'all .12s',
                }}
              >
                {proj.thumbnailUrl ? (
                  <img src={proj.thumbnailUrl} alt={proj.title} loading="lazy" style={{ width: 36, height: 24, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 36, height: 24, borderRadius: 4, background: C.border, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {proj.title}
                  </div>
                  <div style={{ fontSize: 9, color: C.dim }}>
                    {proj.status === 'DRAFT' ? 'Черновик' : proj.status === 'READY' ? 'Готово' : proj.status === 'PUBLISHED' ? 'Опубликовано' : proj.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 8px', color: C.dim, fontSize: 12 }}>
            <div style={{ marginBottom: 6, opacity: 0.4, display: 'flex', justifyContent: 'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg></div>
            <div>Нет проектов</div>
            <div style={{ fontSize: 10, marginTop: 4 }}>Создайте проект на главной странице</div>
          </div>
        )}
      </div>

      {/* Folders section */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h4 style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '.04em', margin: 0 }}>
            Папки
          </h4>
          <button onClick={() => setShowNewFolder(true)} style={{ ...btnStyle, padding: '3px 8px', fontSize: 10 }}>+ Папка</button>
        </div>

        {/* Breadcrumb */}
        {folderId && (
          <button
            onClick={() => setFolderId(null)}
            style={{ ...btnStyle, marginBottom: 8, fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            &larr; Назад
          </button>
        )}

        {/* New folder input */}
        {showNewFolder && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            <input
              autoFocus
              value={newFolderName}
              maxLength={100}
              aria-label="Имя новой папки"
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Имя папки"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFolderName.trim()) {
                  createFolder.mutate({ name: newFolderName.trim(), parentId: folderId });
                }
                if (e.key === 'Escape') setShowNewFolder(false);
              }}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.text,
                fontSize: 11,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button
              onClick={() => {
                if (newFolderName.trim()) createFolder.mutate({ name: newFolderName.trim(), parentId: folderId });
              }}
              style={{ ...btnStyle, background: C.accent, color: '#fff', border: 'none' }}
            >
              OK
            </button>
          </div>
        )}

        {folders.isError ? (
          <div style={{ textAlign: 'center', padding: '12px 8px', color: C.dim, fontSize: 12 }}>
            <div style={{ color: C.accent, marginBottom: 6 }}>Ошибка загрузки папок</div>
            <button onClick={() => folders.refetch()} style={btnStyle}>Повторить</button>
          </div>
        ) : folders.isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[1, 2].map((i) => <Skeleton key={i} width="100%" height="36px" />)}
          </div>
        ) : folders.data && folders.data.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {folders.data.map((folder) => (
              <div
                key={folder.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  cursor: 'pointer',
                  transition: 'all .12s',
                }}
              >
                {renamingId === folder.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    maxLength={100}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && renameValue.trim()) renameFolder.mutate({ id: folder.id, name: renameValue.trim() });
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onBlur={() => {
                      if (renameValue.trim()) renameFolder.mutate({ id: folder.id, name: renameValue.trim() });
                      else setRenamingId(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '3px 6px',
                      borderRadius: 4,
                      border: `1px solid ${C.accent}`,
                      background: C.surface,
                      color: C.text,
                      fontSize: 12,
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <>
                    <span role="button" tabIndex={0} aria-label={`Открыть папку ${folder.name}`} onClick={() => setFolderId(folder.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFolderId(folder.id); } }} style={{ flex: 1, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> {folder.name}
                    </span>
                    <span style={{ fontSize: 9, color: C.dim }}>
                      {folder._count.assets}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setRenamingId(folder.id); setRenameValue(folder.name); }}
                      style={{ ...btnStyle, padding: '2px 6px', fontSize: 10, border: 'none', background: 'transparent', color: C.sub }}
                      title="Переименовать"
                      aria-label={`Переименовать папку ${folder.name}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteFolder.mutate({ id: folder.id }); }}
                      style={{ ...btnStyle, padding: '2px 6px', border: 'none', background: 'transparent', color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Удалить"
                      aria-label={`Удалить папку ${folder.name}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 8px', color: C.dim, fontSize: 12 }}>
            <div style={{ marginBottom: 4, opacity: 0.4, display: 'flex', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg></div>
            <div>Нет папок</div>
            <div style={{ fontSize: 10, marginTop: 3 }}>Создайте папку для организации ассетов</div>
          </div>
        )}
      </div>

      {/* Folder assets */}
      {folderId && (
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>
            Файлы в папке
          </h4>
          {assets.isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height="60px" rounded />)}
            </div>
          ) : assets.data && assets.data.items.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {assets.data.items.map((asset) => (
                <div key={asset.id} style={{ borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.border}`, aspectRatio: '1', cursor: 'pointer' }}>
                  <img src={asset.url} alt={asset.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: C.dim }}>Пусто</div>
          )}
        </div>
      )}
    </div>
  );
}
