'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/Skeleton';
import { pluralRu } from '@/lib/utils';

const STATUS_LABEL: Record<string, { l: string; c: string }> = {
  DRAFT: { l: 'Черновик', c: 'blue' },
  RENDERING: { l: 'Генерация', c: 'orange' },
  READY: { l: 'Готово', c: 'green' },
  PUBLISHED: { l: 'Опубликовано', c: 'green' },
};

interface ProjectPickerProps {
  /** Target page path, e.g. '/editor', '/metadata', '/preview' */
  target: string;
  title: string;
}

export function ProjectPicker({ target, title }: ProjectPickerProps) {
  const C = useThemeStore((s) => s.theme);
  const router = useRouter();
  const [displayCount, setDisplayCount] = useState(10);
  const projects = trpc.project.list.useQuery({ page: 1, limit: 50 });
  const createProject = trpc.project.create.useMutation({
    onSuccess: (data) => {
      router.push(`${target}?projectId=${data.id}`);
    },
  });

  const statusColor = (key: string) => {
    const s = STATUS_LABEL[key];
    if (!s) return C.dim;
    const colorMap: Record<string, string> = { blue: C.blue, green: C.green, orange: C.orange };
    return colorMap[s.c] ?? C.dim;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
      <div style={{ fontSize: 36, opacity: 0.2 }}>📂</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{title}</div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 12 }}>Выберите проект для работы</div>
      {projects.isError ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, opacity: 0.3, marginBottom: 6 }}>⚠</div>
          <div style={{ color: C.accent, fontSize: 13, marginBottom: 12 }}>Ошибка загрузки проектов</div>
          <button
            onClick={() => projects.refetch()}
            style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Повторить
          </button>
        </div>
      ) : projects.isLoading ? (
        <div style={{ width: 360 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginTop: i > 1 ? 8 : 0 }}><Skeleton height={52} /></div>
          ))}
        </div>
      ) : !projects.data?.items?.length ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: C.dim, fontSize: 13, marginBottom: 12 }}>У вас пока нет проектов</div>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Создать проект на Дашборде
          </button>
        </div>
      ) : (
        <div style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* New project button */}
          <button
            onClick={() => createProject.mutate({ title: '' })}
            disabled={createProject.isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 10,
              border: `1.5px dashed ${C.accent}50`,
              background: `${C.accent}06`,
              color: C.accent,
              fontSize: 13,
              fontWeight: 600,
              cursor: createProject.isPending ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              width: '100%',
              transition: 'background .15s, border-color .15s',
              opacity: createProject.isPending ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${C.accent}12`; e.currentTarget.style.borderColor = C.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${C.accent}06`; e.currentTarget.style.borderColor = `${C.accent}50`; }}
          >
            <span style={{ width: 28, height: 28, borderRadius: 8, background: `${C.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>+</span>
            {createProject.isPending ? 'Создаём...' : 'Новый проект'}
          </button>

          <div style={{ height: 1, background: C.border, margin: '4px 0' }} />

          {projects.data.items.slice(0, displayCount).map((p) => {
            const st = STATUS_LABEL[p.status] ?? { l: p.status, c: 'dim' };
            return (
              <button
                key={p.id}
                onClick={() => router.push(`${target}?projectId=${p.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  color: C.text,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background .1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.cardHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = C.card)}
              >
                {/* Thumbnail preview */}
                {p.thumbnailUrl ? (
                  <img src={p.thumbnailUrl} alt={p.title} loading="lazy" style={{ width: 44, height: 28, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 44, height: 28, borderRadius: 4, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, opacity: 0.3 }}>▶</span>
                  </div>
                )}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                    {p.title || 'Без названия'}
                  </div>
                  <div style={{ fontSize: 10, color: C.sub, display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                    <span>{pluralRu(p._count.scenes, 'сцена', 'сцены', 'сцен')}</span>
                    <span style={{ color: statusColor(p.status), fontWeight: 600 }}>{st.l}</span>
                  </div>
                </div>
                <span style={{ fontSize: 10, color: C.dim }}>→</span>
              </button>
            );
          })}
          {projects.data.items.length > displayCount && (
            <button
              onClick={() => setDisplayCount((c) => c + 20)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.sub,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                marginTop: 4,
              }}
            >
              Показать ещё ({projects.data.items.length - displayCount})
            </button>
          )}
          {projects.data.total > projects.data.items.length && displayCount >= projects.data.items.length && (
            <div style={{ fontSize: 11, color: C.dim, textAlign: 'center', marginTop: 4 }}>
              Показано {projects.data.items.length} из {projects.data.total} проектов
            </div>
          )}
        </div>
      )}
    </div>
  );
}
