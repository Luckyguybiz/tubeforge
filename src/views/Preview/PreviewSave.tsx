'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { fmtTime } from '@/lib/utils';
import { Skeleton } from '@/components/ui';
import { ProjectPicker } from '@/components/ui/ProjectPicker';
import { useRouter } from 'next/navigation';

export function PreviewSave({ projectId }: { projectId: string | null }) {
  const C = useThemeStore((s) => s.theme);
  const router = useRouter();

  const project = trpc.project.getById.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  const saveProject = trpc.project.update.useMutation({
    onSuccess: () => {
      toast.success('Проект сохранён');
      router.push('/dashboard');
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadVideo = trpc.youtube.uploadVideo.useMutation({
    onSuccess: () => {
      toast.success('Видео отправлено на YouTube!');
      if (projectId) saveProject.mutate({ id: projectId, status: 'PUBLISHED' });
    },
    onError: (err) => toast.error(err.message),
  });

  if (!projectId) {
    return <ProjectPicker target="/preview" title="Финальное превью" />;
  }

  if (project.isLoading) {
    return (
      <div>
        <Skeleton width="200px" height="28px" />
        <div style={{ marginTop: 8 }}><Skeleton width="300px" height="16px" /></div>
        <div style={{ display: 'flex', gap: 20, marginTop: 24 }}>
          <div style={{ flex: 1 }}><Skeleton width="100%" height="350px" rounded /></div>
          <div style={{ width: 260 }}><Skeleton width="100%" height="250px" rounded /></div>
        </div>
      </div>
    );
  }

  if (project.isError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
        <div style={{ fontSize: 32, opacity: 0.3 }}>⚠️</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Не удалось загрузить проект</div>
        <div style={{ fontSize: 12, color: C.sub }}>{project.error?.message || 'Попробуйте ещё раз'}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={() => project.refetch()} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Повторить</button>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>На дашборд</button>
        </div>
      </div>
    );
  }

  const p = project.data;
  if (!p) return null;

  const totalDuration = p.scenes?.reduce((sum, sc) => sum + sc.duration, 0) ?? 0;

  const checklist = [
    { l: 'Видео готово', d: (p.scenes?.length ?? 0) > 0 && p.scenes!.every(s => s.status === 'READY'), href: `/editor?projectId=${projectId}`, hint: 'Перейти в редактор' },
    { l: 'Обложка выбрана', d: !!(p.thumbnailUrl || p.thumbnailData), href: `/thumbnails?projectId=${projectId}`, hint: 'Перейти к обложкам' },
    { l: 'Название заполнено', d: (p.title?.length ?? 0) > 0, href: `/metadata?projectId=${projectId}`, hint: 'Перейти к метаданным' },
    { l: 'Описание добавлено', d: (p.description?.length ?? 0) > 0, href: `/metadata?projectId=${projectId}`, hint: 'Перейти к метаданным' },
    { l: 'Теги указаны', d: ((p.tags as string[])?.length ?? 0) > 0, href: `/metadata?projectId=${projectId}`, hint: 'Перейти к метаданным' },
  ];
  const allReady = checklist.every(c => c.d);

  const handleSave = () => {
    saveProject.mutate({ id: projectId, status: 'READY' });
  };

  const handlePublish = () => {
    if (!allReady) {
      toast.warning('Заполните все пункты чеклиста перед публикацией');
      return;
    }
    const readyScenes = p.scenes?.filter(s => s.status === 'READY' && s.videoUrl) ?? [];
    const videoUrl = readyScenes[0]?.videoUrl;
    if (!videoUrl) {
      toast.error('Нет готового видео для публикации');
      return;
    }
    uploadVideo.mutate({
      title: p.title,
      description: p.description ?? '',
      tags: (p.tags as string[]) ?? [],
      videoUrl,
      thumbnailUrl: p.thumbnailUrl ?? undefined,
      privacyStatus: 'private',
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <button
          onClick={() => router.push('/dashboard')}
          title="Вернуться на дашборд"
          style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          &larr; Назад
        </button>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Финальное превью</h2>
      </div>
      <p style={{ color: C.sub, fontSize: 13, marginBottom: 24 }}>Проверьте как всё выглядит перед сохранением</p>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ aspectRatio: '16/9', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {/* Thumbnail as video poster */}
              {p.thumbnailUrl ? (
                <img src={p.thumbnailUrl} alt="Обложка" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : p.thumbnailData ? (
                <div style={{ position: 'absolute', inset: 0, background: C.surface }} />
              ) : null}
              {/* Play button overlay */}
              <div style={{ width: 64, height: 44, borderRadius: 10, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                <div style={{ width: 0, height: 0, borderLeft: '16px solid #fff', borderTop: '10px solid transparent', borderBottom: '10px solid transparent', marginLeft: 3 }} />
              </div>
              {/* Duration badge */}
              <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.8)', borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600, color: '#fff', zIndex: 2 }}>{fmtTime(totalDuration)}</div>
              {/* Progress bar */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,.2)', zIndex: 2 }}>
                <div style={{ width: '0%', height: '100%', background: '#ff0000', borderRadius: '0 2px 2px 0' }} />
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{p.title || 'Без названия'}</div>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 10 }}>0 просмотров · только что</div>
              {/* Engagement bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.sub }}>
                  <span>👍</span><span>0</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.sub }}>
                  <span>👎</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.sub }}>
                  <span>↗</span><span>Поделиться</span>
                </div>
              </div>
              {/* Channel row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Мой канал</div>
                  <div style={{ fontSize: 10, color: C.dim }}>0 подписчиков</div>
                </div>
              </div>
              {/* Description */}
              <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{p.description || 'Нет описания'}</div>
              {/* Tags */}
              {((p.tags as string[])?.length ?? 0) > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                  {(p.tags as string[]).map((tag, i) => (
                    <span key={i} style={{ padding: '2px 8px', borderRadius: 4, background: C.surface, color: C.blue, fontSize: 11 }}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ width: 260 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Чеклист</div>
              <div style={{ fontSize: 11, color: allReady ? C.green : C.sub, fontWeight: 600 }}>
                {checklist.filter(c => c.d).length}/{checklist.length}
              </div>
            </div>
            {checklist.map((it, i) => (
              <div
                key={i}
                role={it.d ? undefined : 'link'}
                tabIndex={it.d ? undefined : 0}
                onClick={() => !it.d && router.push(it.href)}
                onKeyDown={(e) => { if (!it.d && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); router.push(it.href); } }}
                title={it.d ? undefined : it.hint}
                aria-label={it.d ? `${it.l} — выполнено` : `${it.l} — ${it.hint}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 6px', borderTop: i ? `1px solid ${C.border}` : 'none', borderRadius: 6, cursor: it.d ? 'default' : 'pointer', transition: 'background .1s', marginLeft: -6, marginRight: -6 }}
                onMouseEnter={(e) => { if (!it.d) e.currentTarget.style.background = C.surface; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${it.d ? C.green : C.border}`, background: it.d ? `${C.green}20` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: C.green, flexShrink: 0 }}>{it.d ? '✓' : ''}</div>
                <span style={{ fontSize: 12, color: it.d ? C.text : C.sub, flex: 1 }}>{it.l}</span>
                {!it.d && <span style={{ fontSize: 10, color: C.dim }}>→</span>}
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saveProject.isPending}
            style={{ width: '100%', padding: '12px 0', background: C.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saveProject.isPending ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 20px ${C.accent}33`, marginBottom: 10, opacity: saveProject.isPending ? 0.7 : 1 }}
          >
            {saveProject.isPending ? 'Сохранение...' : 'Сохранить в кабинет'}
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={handlePublish}
              disabled={!allReady || uploadVideo.isPending}
              title={!allReady ? 'Заполните все пункты чеклиста для публикации' : undefined}
              style={{ width: '100%', padding: '12px 0', background: 'transparent', color: allReady ? C.text : C.sub, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: !allReady || uploadVideo.isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: allReady ? 1 : 0.5 }}
            >
              {uploadVideo.isPending ? 'Публикация...' : 'Опубликовать на YouTube'}
            </button>
            {!allReady && (
              <div style={{ fontSize: 10, color: C.dim, textAlign: 'center', marginTop: 4 }}>
                Завершите все пункты чеклиста
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
