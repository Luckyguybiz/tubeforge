'use client';

import { useEffect, useState, useRef } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useMetadataStore } from '@/stores/useMetadataStore';
import { useShallow } from 'zustand/react/shallow';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { Skeleton } from '@/components/ui';
import { ProjectPicker } from '@/components/ui/ProjectPicker';
import { useRouter } from 'next/navigation';
import type { Theme } from '@/lib/types';

// M3: Friendly AI error mapping
function friendlyAIError(err: { message: string; data?: { code?: string } }): string {
  const code = err.data?.code || '';
  const msg = err.message.toLowerCase();
  if (code === 'TOO_MANY_REQUESTS' || msg.includes('too many'))
    return 'Слишком много запросов. Подождите минуту.';
  if (code === 'FORBIDDEN' || msg.includes('limit') || msg.includes('upgrade'))
    return 'Лимит ИИ исчерпан. Обновите план.';
  if (code === 'INTERNAL_SERVER_ERROR' || msg.includes('api error'))
    return 'Ошибка генерации. Попробуйте снова.';
  return 'Ошибка ИИ. Попробуйте позже.';
}

// M3: Shared AI button style
function aiButtonStyle(C: Theme, isLoading: boolean): React.CSSProperties {
  return {
    background: 'none',
    border: `1px solid ${C.accent}44`,
    color: C.accent,
    borderRadius: 6,
    padding: '4px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: isLoading ? 'wait' : 'pointer',
    fontFamily: 'inherit',
    opacity: isLoading ? 0.5 : 1,
    transition: 'opacity 0.15s',
  };
}

export function Metadata({ projectId }: { projectId: string | null }) {
  const C = useThemeStore((s) => s.theme);
  const router = useRouter();
  const { title, desc, tags, saveStatus } = useMetadataStore(
    useShallow((s) => ({ title: s.title, desc: s.desc, tags: s.tags, saveStatus: s.saveStatus }))
  );
  const { setTitle, setDesc, addTag, removeTag, setSaveStatus, loadFromProject } = useMetadataStore.getState();
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);

  // Reset loadedRef when projectId changes so new project data is loaded
  useEffect(() => {
    loadedRef.current = false;
  }, [projectId]);

  const project = trpc.project.getById.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  useEffect(() => {
    if (project.data && !loadedRef.current) {
      loadFromProject(project.data);
      loadedRef.current = true;
    }
  }, [project.data]); // eslint-disable-line react-hooks/exhaustive-deps

  // M1: Debounced auto-save with status tracking
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saveProject = trpc.project.update.useMutation();

  // Cleanup both timers on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current);
      clearTimeout(savedTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!loadedRef.current || !projectId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus('saving');
    saveTimer.current = setTimeout(() => {
      saveProject.mutate(
        { id: projectId, title, description: desc, tags },
        {
          onSuccess: () => {
            setSaveStatus('saved');
            if (savedTimer.current) clearTimeout(savedTimer.current);
            savedTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
          },
          onError: (err) => {
            setSaveStatus('error');
            toast.error(err.message);
          },
        }
      );
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [title, desc, tags]); // eslint-disable-line react-hooks/exhaustive-deps

  // M3: AI generation with friendly errors
  const generateMeta = trpc.ai.generateMetadata.useMutation({
    onSuccess: (data) => {
      if (data.title) setTitle(data.title);
      if (data.description) setDesc(data.description);
      if (data.tags) data.tags.forEach((t: string) => addTag(t));
      toast.success('Метаданные сгенерированы');
    },
    onError: (err) => toast.error(friendlyAIError(err as { message: string; data?: { code?: string } })),
  });

  const handleAIGenerate = () => {
    generateMeta.mutate({ topic: title || desc || 'video', language: 'ru' });
  };

  // M2: Tag validation
  const handleAddTag = (raw: string) => {
    // Normalize whitespace: collapse multiple spaces, trim
    let tag = raw.replace(/\s+/g, ' ').trim();
    if (!tag) return;
    if (tag.length > 50) tag = tag.slice(0, 50);
    if (tags.length >= 30) {
      toast.warning('Максимум 30 тегов');
      return;
    }
    if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      toast.warning('Тег уже добавлен');
      return;
    }
    addTag(tag);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      handleAddTag(tagInput);
      setTagInput('');
    }
    if (e.key === 'Escape') {
      setShowTagInput(false);
      setTagInput('');
    }
  };

  useEffect(() => {
    if (showTagInput && tagInputRef.current) tagInputRef.current.focus();
  }, [showTagInput]);

  if (!projectId) {
    return <ProjectPicker target="/metadata" title="Метаданные" />;
  }

  if (project.isLoading) {
    return (
      <div style={{ maxWidth: 900 }}>
        <Skeleton width="200px" height="28px" />
        <div style={{ marginTop: 8 }}><Skeleton width="300px" height="16px" /></div>
        <div style={{ display: 'flex', gap: 28, marginTop: 24 }}>
          <div style={{ flex: 1 }}>
            <Skeleton width="100%" height="42px" />
            <div style={{ marginTop: 16 }}><Skeleton width="100%" height="160px" /></div>
            <div style={{ marginTop: 16 }}><Skeleton width="100%" height="40px" /></div>
          </div>
          <div style={{ width: 320 }}><Skeleton width="100%" height="340px" /></div>
        </div>
      </div>
    );
  }

  if (project.isError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
        <div style={{ fontSize: 32, opacity: 0.3 }}>&#9888;</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Не удалось загрузить проект</div>
        <div style={{ fontSize: 12, color: C.sub }}>{project.error?.message || 'Попробуйте ещё раз'}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={() => project.refetch()} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Повторить</button>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>На дашборд</button>
        </div>
      </div>
    );
  }

  const isAILoading = generateMeta.isPending;

  // M1: Save status label
  const saveLabel = saveStatus === 'saving'
    ? { text: 'Сохраняется...', color: C.dim }
    : saveStatus === 'saved'
    ? { text: '✓ Сохранено', color: C.green }
    : saveStatus === 'error'
    ? { text: '⚠ Ошибка сохранения', color: '#e74c3c' }
    : null;

  // M5: Common input styles
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 9,
    color: C.text,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    lineHeight: 1.5,
  };

  return (
    <div style={{ maxWidth: 900 }}>
      {/* M6: Breadcrumb */}
      <div style={{ fontSize: 12, color: C.dim, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          onClick={() => router.push('/dashboard')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/dashboard'); } }}
          style={{ cursor: 'pointer', color: C.sub, textDecoration: 'none' }}
          role="link"
          tabIndex={0}
          aria-label="Вернуться на главную"
        >
          Проекты
        </span>
        <span style={{ color: C.dim }}>/</span>
        {project.data?.title && (
          <>
            <span style={{ color: C.sub }}>{project.data.title}</span>
            <span style={{ color: C.dim }}>/</span>
          </>
        )}
        <span style={{ color: C.text }}>Метаданные</span>
      </div>

      {/* Header + save status */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Метаданные видео</h2>
        {/* M1: Save indicator */}
        {saveLabel && (
          <span style={{ fontSize: 11, color: saveLabel.color, fontWeight: 500, transition: 'opacity 0.3s' }}>
            {saveLabel.text}
          </span>
        )}
      </div>
      <p style={{ color: C.sub, fontSize: 13, marginBottom: 24 }}>Заголовок, описание, теги — оптимизировано ИИ</p>

      <div style={{ display: 'flex', gap: 28, position: 'relative' }}>
        {/* M6: AI loading overlay */}
        {isAILoading && (
          <div style={{
            position: 'absolute', inset: 0, background: `${C.bg}88`, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, backdropFilter: 'blur(2px)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.accent }}>ИИ генерирует...</div>
          </div>
        )}

        <div style={{ flex: 1 }}>
          {/* Title field */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label htmlFor="meta-title" style={{ fontSize: 11, fontWeight: 600, color: C.sub }}>Название</label>
              <button
                onClick={handleAIGenerate}
                disabled={isAILoading}
                style={aiButtonStyle(C, isAILoading)}
                aria-label="Сгенерировать название с помощью ИИ"
              >
                {isAILoading ? '...' : '✦ ИИ'}
              </button>
            </div>
            <input
              id="meta-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название видео..."
              maxLength={100}
              style={inputStyle}
              aria-describedby="meta-title-counter"
            />
            <div id="meta-title-counter" style={{ fontSize: 10, color: title.length > 70 ? C.accent : C.dim, marginTop: 3, textAlign: 'right' }}>
              {title.length}/100
            </div>
          </div>

          {/* Description field */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label htmlFor="meta-desc" style={{ fontSize: 11, fontWeight: 600, color: C.sub }}>Описание</label>
              <button
                onClick={handleAIGenerate}
                disabled={isAILoading}
                style={aiButtonStyle(C, isAILoading)}
                aria-label="Сгенерировать описание с помощью ИИ"
              >
                {isAILoading ? '...' : '✦ ИИ'}
              </button>
            </div>
            <textarea
              id="meta-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={6}
              placeholder="Опишите содержание видео..."
              maxLength={5000}
              style={{ ...inputStyle, fontSize: 14, lineHeight: 1.6, resize: 'vertical', minHeight: 140 }}
              aria-describedby="meta-desc-counter"
            />
            {/* M2: Description character counter */}
            <div id="meta-desc-counter" style={{ fontSize: 10, color: desc.length > 4500 ? C.accent : C.dim, marginTop: 3, textAlign: 'right' }}>
              {desc.length}/5000
            </div>
          </div>

          {/* Tags field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label htmlFor="meta-tags" style={{ fontSize: 11, fontWeight: 600, color: C.sub }}>
                Теги {tags.length > 0 && <span style={{ fontWeight: 400, color: C.dim }}>({tags.length}/30)</span>}
              </label>
              {/* M3: ИИ button for tags */}
              <button
                onClick={handleAIGenerate}
                disabled={isAILoading}
                style={aiButtonStyle(C, isAILoading)}
                aria-label="Сгенерировать теги с помощью ИИ"
              >
                {isAILoading ? '...' : '✦ ИИ'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tags.map((t) => (
                <span
                  key={t}
                  role="button"
                  aria-label={`Удалить тег ${t}`}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Backspace') removeTag(t); }}
                  style={{
                    padding: '5px 8px 5px 12px',
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    fontSize: 11,
                    color: C.sub,
                    cursor: 'default',
                    transition: 'border-color 0.15s, background 0.15s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {t}
                  <span
                    onClick={() => removeTag(t)}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      cursor: 'pointer',
                      color: C.dim,
                      transition: 'background 0.1s, color 0.1s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = C.accent + '20'; e.currentTarget.style.color = C.accent; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.dim; }}
                  >
                    ×
                  </span>
                </span>
              ))}
              {showTagInput ? (
                <input
                  id="meta-tags"
                  ref={tagInputRef}
                  value={tagInput}
                  maxLength={50}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => { if (tagInput.trim()) handleAddTag(tagInput); setShowTagInput(false); setTagInput(''); }}
                  placeholder="Новый тег..."
                  aria-label="Ввод нового тега"
                  style={{
                    padding: '5px 12px',
                    background: C.card,
                    border: `1px solid ${C.accent}`,
                    borderRadius: 16,
                    fontSize: 11,
                    color: C.text,
                    outline: 'none',
                    fontFamily: 'inherit',
                    width: 140,
                  }}
                />
              ) : (
                <span
                  onClick={() => setShowTagInput(true)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowTagInput(true); } }}
                  role="button"
                  tabIndex={0}
                  aria-label="Добавить новый тег"
                  style={{
                    padding: '5px 12px',
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    fontSize: 11,
                    color: C.dim,
                    cursor: 'pointer',
                    background: C.surface,
                  }}
                >
                  + добавить
                </span>
              )}
            </div>
          </div>
        </div>

        {/* M4: Preview card */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 8 }}>Как видят зрители</div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {/* Thumbnail placeholder */}
            <div style={{
              aspectRatio: '16/9',
              background: C.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: C.dim,
            }}>
              Обложка видео
            </div>
            <div style={{ padding: 14 }}>
              {/* M4: Title with 2-line clamp */}
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.3,
                marginBottom: 4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {title || 'Название видео'}
              </div>
              <div style={{ fontSize: 10, color: C.dim }}>Мой канал · 0 просмотров · только что</div>
              <div style={{
                fontSize: 11,
                color: C.sub,
                marginTop: 6,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {desc || 'Описание видео...'}
              </div>
              {/* M4: Tag chips in preview */}
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {tags.slice(0, 5).map((t) => (
                    <span key={t} style={{
                      fontSize: 9,
                      color: C.accent,
                      background: `${C.accent}15`,
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontWeight: 500,
                    }}>
                      #{t}
                    </span>
                  ))}
                  {tags.length > 5 && (
                    <span style={{ fontSize: 9, color: C.dim, padding: '2px 4px' }}>
                      +{tags.length - 5}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
