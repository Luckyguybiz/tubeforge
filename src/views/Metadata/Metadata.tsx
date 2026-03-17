'use client';

import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useMetadataStore } from '@/stores/useMetadataStore';
import type { YouTubeCategory } from '@/stores/useMetadataStore';
import { useShallow } from 'zustand/react/shallow';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProjectPicker } from '@/components/ui/ProjectPicker';
import { useRouter } from 'next/navigation';
import type { Theme } from '@/lib/types';

/* ─── YouTube categories ─────────────────────────────── */
const YOUTUBE_CATEGORIES: { value: YouTubeCategory; label: string }[] = [
  { value: '', label: 'Не выбрана' },
  { value: 'Entertainment', label: 'Развлечения' },
  { value: 'Education', label: 'Образование' },
  { value: 'Science & Technology', label: 'Наука и технологии' },
  { value: 'Gaming', label: 'Видеоигры' },
  { value: 'Music', label: 'Музыка' },
  { value: 'Sports', label: 'Спорт' },
  { value: 'News & Politics', label: 'Новости и политика' },
  { value: 'Howto & Style', label: 'Хобби и стиль' },
  { value: 'People & Blogs', label: 'Люди и блоги' },
  { value: 'Comedy', label: 'Юмор' },
  { value: 'Film & Animation', label: 'Фильмы и анимация' },
  { value: 'Autos & Vehicles', label: 'Авто и транспорт' },
  { value: 'Travel & Events', label: 'Путешествия' },
  { value: 'Pets & Animals', label: 'Животные' },
  { value: 'Nonprofits & Activism', label: 'НКО и активизм' },
];

/* ─── Description templates ──────────────────────────── */
const DESC_TEMPLATES = [
  {
    label: 'Таймкоды',
    icon: '\u23F1',
    text: '\n\n\u23F1 Таймкоды:\n00:00 — Введение\n01:00 — Основная часть\n05:00 — Выводы',
  },
  {
    label: 'Ссылки',
    icon: '\uD83D\uDD17',
    text: '\n\n\uD83D\uDD17 Полезные ссылки:\n\u2022 Сайт: https://\n\u2022 Ресурсы: https://',
  },
  {
    label: 'Соцсети',
    icon: '\uD83D\uDCF1',
    text: '\n\n\uD83D\uDCF1 Мои соцсети:\n\u2022 Telegram: @\n\u2022 VK: vk.com/\n\u2022 Instagram: @',
  },
  {
    label: 'CTA',
    icon: '\uD83D\uDD14',
    text: '\n\n\uD83D\uDD14 Подпишись на канал и нажми колокольчик, чтобы не пропустить новые видео!\n\uD83D\uDC4D Поставь лайк, если видео было полезным!',
  },
];

/* ─── Robust timestamp validation ────────────────────── */
function isValidTimestamp(match: string): boolean {
  const parts = match.split(':').map(Number);
  if (parts.length === 2) return parts[0] < 24 && parts[1] < 60;
  if (parts.length === 3) return parts[0] < 24 && parts[1] < 60 && parts[2] < 60;
  return false;
}

function extractValidTimestamps(text: string): string[] {
  const regex = /(\d{1,2}):(\d{2})(?::(\d{2}))?/g;
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (isValidTimestamp(m[0])) results.push(m[0]);
  }
  return results;
}

/* ─── Friendly AI error mapping ──────────────────────── */
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

/* ─── Reusable AI button ─────────────────────────────── */
function AIButton({
  C,
  isLoading,
  onClick,
  label,
  ariaLabel,
}: {
  C: Theme;
  isLoading: boolean;
  onClick: () => void;
  label: string;
  ariaLabel: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && !isLoading ? `${C.accent}18` : 'none',
        border: `1px solid ${C.accent}44`,
        color: C.accent,
        borderRadius: 8,
        padding: '5px 14px',
        fontSize: 12,
        fontWeight: 600,
        cursor: isLoading ? 'wait' : 'pointer',
        fontFamily: 'inherit',
        opacity: isLoading ? 0.5 : 1,
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        whiteSpace: 'nowrap',
      }}
    >
      {isLoading ? (
        <span style={{ display: 'inline-flex', gap: 2 }}>
          <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>\u2022</span>
          <span style={{ animation: 'pulse 1s ease-in-out 0.2s infinite' }}>\u2022</span>
          <span style={{ animation: 'pulse 1s ease-in-out 0.4s infinite' }}>\u2022</span>
        </span>
      ) : (
        <>
          <span style={{ fontSize: 11 }}>\u2728</span>
          {label}
        </>
      )}
    </button>
  );
}

/* ─── Section card wrapper ───────────────────────────── */
function SectionCard({
  C,
  children,
  style,
}: {
  C: Theme;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '20px 22px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Character counter ──────────────────────────────── */
function CharCounter({
  current,
  max,
  warn,
  C,
}: {
  current: number;
  max: number;
  warn: number;
  C: Theme;
}) {
  const pct = current / max;
  const color = current > max ? '#ef4444' : current >= warn ? C.accent : C.dim;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <div
        style={{
          flex: 1,
          height: 3,
          borderRadius: 2,
          background: `${C.border}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(pct * 100, 100)}%`,
            height: '100%',
            borderRadius: 2,
            background: current > max
              ? '#ef4444'
              : current >= warn
                ? `linear-gradient(90deg, ${C.accent}, ${C.accent})`
                : `linear-gradient(90deg, ${C.green}, ${C.green})`,
            transition: 'width 0.2s, background 0.2s',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          color,
          fontWeight: current >= warn ? 600 : 400,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 60,
          textAlign: 'right',
        }}
      >
        {current}/{max}
      </span>
    </div>
  );
}

/* ─── Tag chip (memoized — avoids re-render when sibling tags change) ── */
const TagChip = memo(function TagChip({
  tag,
  C,
  onRemove,
}: {
  tag: string;
  C: Theme;
  onRemove: (tag: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const handleRemove = useCallback(() => onRemove(tag), [onRemove, tag]);
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '5px 6px 5px 12px',
        background: hovered ? `${C.accent}12` : C.surface,
        border: `1px solid ${hovered ? C.accent + '44' : C.border}`,
        borderRadius: 20,
        fontSize: 12,
        color: C.text,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        transition: 'all 0.15s',
        lineHeight: 1,
      }}
    >
      {tag}
      <span
        onClick={handleRemove}
        role="button"
        tabIndex={0}
        aria-label={`Удалить тег ${tag}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Backspace') handleRemove(); }}
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          cursor: 'pointer',
          color: hovered ? C.accent : C.dim,
          background: hovered ? `${C.accent}20` : 'transparent',
          transition: 'all 0.15s',
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        \u00D7
      </span>
    </span>
  );
});

/* ─── AI suggestion chip ─────────────────────────────── */
function SuggestionChip({
  text,
  C,
  onClick,
}: {
  text: string;
  C: Theme;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '6px 14px',
        background: hovered ? `${C.purple}22` : `${C.purple}0c`,
        border: `1px solid ${hovered ? C.purple + '55' : C.purple + '25'}`,
        borderRadius: 20,
        fontSize: 12,
        color: C.purple,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: 500,
        transition: 'all 0.15s',
        lineHeight: 1.3,
        textAlign: 'left',
        maxWidth: '100%',
      }}
    >
      {text}
    </button>
  );
}

/* ─── Pulsing dot loader ─────────────────────────────── */
function PulsingLoader({ C, text }: { C: Theme; text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 18px',
        background: `${C.accent}08`,
        border: `1px solid ${C.accent}20`,
        borderRadius: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {[0, 0.15, 0.3].map((delay, i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: C.accent,
              animation: `pulse 1.2s ease-in-out ${delay}s infinite`,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 13, color: C.accent, fontWeight: 500 }}>{text}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export function Metadata({ projectId }: { projectId: string | null }) {
  const C = useThemeStore((s) => s.theme);
  const router = useRouter();
  const {
    title,
    desc,
    tags,
    category,
    saveStatus,
    aiSuggestions,
  } = useMetadataStore(
    useShallow((s) => ({
      title: s.title,
      desc: s.desc,
      tags: s.tags,
      category: s.category,
      saveStatus: s.saveStatus,
      aiSuggestions: s.aiSuggestions,
    }))
  );
  const {
    setTitle,
    setDesc,
    addTag,
    removeTag,
    setCategory,
    setSaveStatus,
    loadFromProject,
    setAISuggestions,
    clearAISuggestions,
  } = useMetadataStore.getState();

  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);
  const [aiTitleLoading, setAiTitleLoading] = useState(false);
  const [aiDescLoading, setAiDescLoading] = useState(false);
  const [aiTagsLoading, setAiTagsLoading] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive check for sidebar layout
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Project selector dropdown
  const projectsList = trpc.project.list.useQuery({ page: 1, limit: 50 });
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false);
      }
    };
    if (showProjectDropdown) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [showProjectDropdown]);

  // Reset loadedRef and clear stale AI suggestions when projectId changes
  useEffect(() => {
    loadedRef.current = false;
    clearAISuggestions();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Debounced auto-save
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saveProject = trpc.project.update.useMutation();

  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current);
      clearTimeout(savedTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!loadedRef.current || !projectId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaveStatus('saving');
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
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, desc, tags]); // eslint-disable-line react-hooks/exhaustive-deps

  // AI mutations
  const generateTitle = trpc.ai.generateMetadata.useMutation({
    onSuccess: (data) => {
      if (data.title) {
        const currentTitle = useMetadataStore.getState().title;
        // Filter out suggestions identical to the current title (case-insensitive)
        const newTitle = data.title.trim();
        if (newTitle.toLowerCase() !== currentTitle.toLowerCase()) {
          const existing = aiSuggestions.titles || [];
          const deduped = [newTitle, ...existing].filter(
            (t, i, arr) => arr.findIndex((x) => x.trim().toLowerCase() === t.trim().toLowerCase()) === i
          ).slice(0, 5);
          setAISuggestions({ titles: deduped });
        }
      }
      toast.success('Варианты названий готовы');
    },
    onError: (err) => toast.error(friendlyAIError(err as { message: string; data?: { code?: string } })),
    onSettled: () => setAiTitleLoading(false),
  });

  const generateDesc = trpc.ai.generateMetadata.useMutation({
    onSuccess: (data) => {
      if (data.description) {
        setAISuggestions({ descriptions: [data.description, ...(aiSuggestions.descriptions || [])].slice(0, 3) });
      }
      toast.success('Описание сгенерировано');
    },
    onError: (err) => toast.error(friendlyAIError(err as { message: string; data?: { code?: string } })),
    onSettled: () => setAiDescLoading(false),
  });

  const generateTags = trpc.ai.generateMetadata.useMutation({
    onSuccess: (data) => {
      if (data.tags && Array.isArray(data.tags)) {
        const currentTags = useMetadataStore.getState().tags;
        // Filter out tags that already exist in the current tag list (case-insensitive)
        const newTags = data.tags.filter(
          (t: string) => !currentTags.some((ct) => ct.toLowerCase() === t.toLowerCase())
        );
        const merged = [...new Set([...newTags, ...(aiSuggestions.tags || [])])].slice(0, 20);
        setAISuggestions({ tags: merged });
      }
      toast.success('Теги подобраны');
    },
    onError: (err) => toast.error(friendlyAIError(err as { message: string; data?: { code?: string } })),
    onSettled: () => setAiTagsLoading(false),
  });

  const handleAITitle = useCallback(() => {
    if (!title && !desc) {
      toast.warning('Введите заголовок или описание для лучших результатов ИИ');
    }
    setAiTitleLoading(true);
    generateTitle.mutate({ topic: title || desc || 'YouTube video', language: 'ru' });
  }, [title, desc]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAIDesc = useCallback(() => {
    if (!title && !desc) {
      toast.warning('Введите заголовок или описание для лучших результатов ИИ');
    }
    setAiDescLoading(true);
    generateDesc.mutate({ topic: title || desc || 'YouTube video', language: 'ru' });
  }, [title, desc]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAITags = useCallback(() => {
    if (!title && !desc) {
      toast.warning('Введите заголовок или описание для лучших результатов ИИ');
    }
    setAiTagsLoading(true);
    generateTags.mutate({ topic: title || desc || 'YouTube video', language: 'ru' });
  }, [title, desc]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tag handling
  const tagsCharCount = useMemo(() => tags.join(', ').length, [tags]);

  const handleAddTag = useCallback((raw: string) => {
    let tag = raw.replace(/\s+/g, ' ').trim();
    if (!tag) return;
    if (tag.length > 50) tag = tag.slice(0, 50);
    if (tags.length >= 30) {
      toast.warning('Максимум 30 тегов');
      return;
    }
    const newCharCount = tagsCharCount + (tagsCharCount > 0 ? 2 : 0) + tag.length;
    if (newCharCount > 500) {
      toast.warning('Превышен лимит 500 символов для тегов');
      return;
    }
    if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      toast.warning('Тег уже добавлен');
      return;
    }
    addTag(tag);
  }, [tags, tagsCharCount, addTag]);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
        e.preventDefault();
        handleAddTag(tagInput);
        setTagInput('');
      }
      if (e.key === 'Escape') {
        setShowTagInput(false);
        setTagInput('');
      }
      if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
        removeTag(tags[tags.length - 1]);
      }
    },
    [tagInput, tags, handleAddTag, removeTag]
  );

  useEffect(() => {
    if (showTagInput && tagInputRef.current) tagInputRef.current.focus();
  }, [showTagInput]);

  // Copy all metadata
  const handleCopyAll = useCallback(() => {
    const parts = [];
    if (title) parts.push(`Название: ${title}`);
    if (desc) parts.push(`\nОписание:\n${desc}`);
    if (tags.length) parts.push(`\nТеги: ${tags.join(', ')}`);
    if (category) {
      const cat = YOUTUBE_CATEGORIES.find((c) => c.value === category);
      if (cat) parts.push(`\nКатегория: ${cat.label}`);
    }
    navigator.clipboard.writeText(parts.join('\n')).then(
      () => toast.success('Метаданные скопированы'),
      () => toast.error('Не удалось скопировать')
    );
  }, [title, desc, tags, category]);

  // Manual save
  const handleManualSave = useCallback(() => {
    if (!projectId) return;
    setManualSaving(true);
    saveProject.mutate(
      { id: projectId, title, description: desc, tags },
      {
        onSuccess: () => {
          setSaveStatus('saved');
          toast.success('Метаданные сохранены');
          if (savedTimer.current) clearTimeout(savedTimer.current);
          savedTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
        },
        onError: (err) => {
          setSaveStatus('error');
          toast.error(err.message);
        },
        onSettled: () => setManualSaving(false),
      }
    );
  }, [projectId, title, desc, tags]); // eslint-disable-line react-hooks/exhaustive-deps

  // Insert description template with timestamp validation
  const handleInsertTemplate = useCallback(
    (templateText: string) => {
      // Validate any timestamps in the template before insertion
      const validated = templateText.replace(
        /(\d{1,2}):(\d{2})(?::(\d{2}))?/g,
        (match) => isValidTimestamp(match) ? match : ''
      ).replace(/\n\s*— \n/g, '\n'); // clean up lines where invalid timestamps were removed
      setDesc(desc + validated);
    },
    [desc, setDesc]
  );

  /* ─── Project picker ─────────────────────────────── */
  if (!projectId) {
    return <ProjectPicker target="/metadata" title="Метаданные" />;
  }

  /* ─── Loading state ──────────────────────────────── */
  if (project.isLoading) {
    return (
      <div style={{ maxWidth: 1060 }}>
        <Skeleton width="220px" height="28px" />
        <div style={{ marginTop: 8 }}>
          <Skeleton width="320px" height="16px" />
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 28 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton width="100%" height="120px" />
            <Skeleton width="100%" height="220px" />
            <Skeleton width="100%" height="100px" />
          </div>
          <div style={{ width: 340 }}>
            <Skeleton width="100%" height="400px" />
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error state ────────────────────────────────── */
  if (project.isError) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          gap: 12,
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.3 }}>&#9888;</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
          Не удалось загрузить проект
        </div>
        <div style={{ fontSize: 12, color: C.sub }}>
          {project.error?.message || 'Попробуйте ещё раз'}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={() => project.refetch()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.text,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Повторить
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: C.accent,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            На дашборд
          </button>
        </div>
      </div>
    );
  }

  /* ─── Derived state ──────────────────────────────── */
  const saveLabel =
    saveStatus === 'saving'
      ? { text: 'Сохраняется...', color: C.dim, icon: '\u25CB' }
      : saveStatus === 'saved'
        ? { text: 'Сохранено', color: C.green, icon: '\u2713' }
        : saveStatus === 'error'
          ? { text: 'Ошибка сохранения', color: '#ef4444', icon: '\u26A0' }
          : null;

  const titleWarning = title.length > 100;
  const titleCaution = title.length >= 70;
  const descWarning = desc.length > 5000;
  const descCaution = desc.length >= 4500;

  const inputBase = useMemo<React.CSSProperties>(() => ({
    width: '100%',
    padding: '12px 16px',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.text,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    lineHeight: 1.5,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }), [C.surface, C.border, C.text]);

  const currentProject = projectsList.data?.items?.find((p) => p.id === projectId);

  return (
    <div style={{ maxWidth: 1060 }}>
      {/* ─── Breadcrumb ────────────────────────────── */}
      <div
        style={{
          fontSize: 12,
          color: C.dim,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          onClick={() => router.push('/dashboard')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              router.push('/dashboard');
            }
          }}
          style={{ cursor: 'pointer', color: C.sub }}
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
        <span style={{ color: C.text, fontWeight: 500 }}>Метаданные</span>
      </div>

      {/* ─── Header row ────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 6,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-.02em' }}>
            Метаданные видео
          </h2>
          {saveLabel && (
            <span
              style={{
                fontSize: 12,
                color: saveLabel.color,
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'opacity 0.3s',
              }}
            >
              {saveLabel.icon} {saveLabel.text}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Copy all button */}
          <button
            onClick={handleCopyAll}
            title="Скопировать все метаданные"
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.sub,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.accent + '55';
              e.currentTarget.style.color = C.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.sub;
            }}
          >
            <span style={{ fontSize: 14 }}>{'\uD83D\uDCCB'}</span>
            Копировать всё
          </button>

          {/* Save button */}
          <button
            onClick={handleManualSave}
            disabled={manualSaving || !projectId}
            style={{
              padding: '8px 22px',
              borderRadius: 10,
              border: 'none',
              background: C.accent,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: manualSaving ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              opacity: manualSaving ? 0.6 : 1,
              transition: 'all 0.2s',
              boxShadow: `0 2px 10px ${C.accent}33`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {manualSaving ? 'Сохраняю...' : 'Сохранить метаданные'}
          </button>
        </div>
      </div>

      <p style={{ color: C.sub, fontSize: 13, marginBottom: 24 }}>
        Заголовок, описание, теги — оптимизировано для YouTube SEO
      </p>

      {/* ─── Project selector ──────────────────────── */}
      <div ref={dropdownRef} style={{ position: 'relative', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Проект
        </div>
        <button
          onClick={() => setShowProjectDropdown(!showProjectDropdown)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            background: C.surface,
            border: `1px solid ${showProjectDropdown ? C.accent + '55' : C.border}`,
            borderRadius: 10,
            color: C.text,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            width: '100%',
            maxWidth: 400,
            textAlign: 'left',
            transition: 'border-color 0.2s',
          }}
        >
          {currentProject?.thumbnailUrl ? (
            <img
              src={currentProject.thumbnailUrl}
              alt=""
              style={{ width: 36, height: 22, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 22,
                borderRadius: 4,
                background: C.card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 10, color: C.dim }}>{'\u25B6'}</span>
            </div>
          )}
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentProject?.title || project.data?.title || 'Без названия'}
          </span>
          <span
            style={{
              fontSize: 10,
              color: C.dim,
              transform: showProjectDropdown ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }}
          >
            {'\u25BC'}
          </span>
        </button>

        {showProjectDropdown && projectsList.data?.items && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              width: '100%',
              maxWidth: 400,
              maxHeight: 280,
              overflowY: 'auto',
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              boxShadow: `0 8px 32px ${C.bg}cc`,
              zIndex: 100,
              padding: 4,
            }}
          >
            {projectsList.data.items.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  router.push(`/metadata?projectId=${p.id}`);
                  setShowProjectDropdown(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  background: p.id === projectId ? `${C.accent}12` : 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  color: C.text,
                  fontSize: 13,
                  fontWeight: p.id === projectId ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (p.id !== projectId) e.currentTarget.style.background = C.cardHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = p.id === projectId ? `${C.accent}12` : 'transparent';
                }}
              >
                {p.thumbnailUrl ? (
                  <img
                    src={p.thumbnailUrl}
                    alt=""
                    style={{ width: 36, height: 22, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 22,
                      borderRadius: 4,
                      background: C.surface,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 10, color: C.dim }}>{'\u25B6'}</span>
                  </div>
                )}
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.title || 'Без названия'}
                </span>
                {p.id === projectId && (
                  <span style={{ fontSize: 11, color: C.accent }}>{'\u2713'}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Main layout: left editor + right preview ─ */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
        {/* ──── LEFT: Editor ──────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* ─── TITLE SECTION ────────────────────── */}
          <SectionCard C={C}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <label
                htmlFor="meta-title"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 15 }}>{'\u270E'}</span>
                Название видео
              </label>
              <AIButton
                C={C}
                isLoading={aiTitleLoading}
                onClick={handleAITitle}
                label="Сгенерировать с ИИ"
                ariaLabel="Сгенерировать название с помощью ИИ"
              />
            </div>
            <input
              id="meta-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите привлекательное название..."
              maxLength={120}
              style={{
                ...inputBase,
                fontSize: 18,
                fontWeight: 600,
                padding: '14px 16px',
                borderColor: titleWarning ? '#ef4444' : titleCaution ? C.accent + '66' : C.border,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.accent;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}15`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = titleWarning ? '#ef4444' : titleCaution ? C.accent + '66' : C.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
              aria-describedby="meta-title-counter"
            />
            <CharCounter current={title.length} max={100} warn={70} C={C} />

            {/* AI Title Suggestions */}
            {aiTitleLoading && (
              <div style={{ marginTop: 12 }}>
                <PulsingLoader C={C} text="Генерация вариантов названий..." />
              </div>
            )}
            {!aiTitleLoading && aiSuggestions.titles.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 6, fontWeight: 500 }}>
                  Варианты от ИИ (нажмите, чтобы применить):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {aiSuggestions.titles.map((t, i) => (
                    <SuggestionChip
                      key={i}
                      text={t}
                      C={C}
                      onClick={() => {
                        setTitle(t);
                        setAISuggestions({
                          titles: aiSuggestions.titles.filter((_, j) => j !== i),
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* ─── DESCRIPTION SECTION ──────────────── */}
          <SectionCard C={C}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <label
                htmlFor="meta-desc"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 15 }}>{'\uD83D\uDCDD'}</span>
                Описание видео
              </label>
              <AIButton
                C={C}
                isLoading={aiDescLoading}
                onClick={handleAIDesc}
                label="Сгенерировать с ИИ"
                ariaLabel="Сгенерировать описание с помощью ИИ"
              />
            </div>
            <textarea
              id="meta-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={8}
              placeholder="Опишите содержание видео. Первые 2-3 строки особенно важны — они видны в поиске..."
              maxLength={5200}
              style={{
                ...inputBase,
                fontSize: 14,
                lineHeight: 1.65,
                resize: 'vertical',
                minHeight: 180,
                borderColor: descWarning ? '#ef4444' : descCaution ? C.accent + '66' : C.border,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.accent;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}15`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = descWarning ? '#ef4444' : descCaution ? C.accent + '66' : C.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
              aria-describedby="meta-desc-counter"
            />
            <CharCounter current={desc.length} max={5000} warn={4500} C={C} />

            {/* Template insert buttons */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 8, fontWeight: 500 }}>
                Вставить шаблон:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {DESC_TEMPLATES.map((tmpl) => (
                  <TemplateButton
                    key={tmpl.label}
                    C={C}
                    icon={tmpl.icon}
                    label={tmpl.label}
                    onClick={() => handleInsertTemplate(tmpl.text)}
                  />
                ))}
              </div>
            </div>

            {/* AI Description Suggestions */}
            {aiDescLoading && (
              <div style={{ marginTop: 12 }}>
                <PulsingLoader C={C} text="ИИ пишет описание..." />
              </div>
            )}
            {!aiDescLoading && aiSuggestions.descriptions.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 6, fontWeight: 500 }}>
                  Варианты от ИИ (нажмите, чтобы вставить):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {aiSuggestions.descriptions.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDesc(d);
                        setAISuggestions({
                          descriptions: aiSuggestions.descriptions.filter((_, j) => j !== i),
                        });
                      }}
                      style={{
                        padding: '10px 14px',
                        background: `${C.purple}08`,
                        border: `1px solid ${C.purple}22`,
                        borderRadius: 10,
                        color: C.sub,
                        fontSize: 12,
                        lineHeight: 1.5,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        maxHeight: 80,
                        overflow: 'hidden',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${C.purple}16`;
                        e.currentTarget.style.borderColor = `${C.purple}44`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `${C.purple}08`;
                        e.currentTarget.style.borderColor = `${C.purple}22`;
                      }}
                    >
                      {d.length > 200 ? d.slice(0, 200) + '...' : d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* ─── TAGS SECTION ─────────────────────── */}
          <SectionCard C={C}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <label
                htmlFor="meta-tags"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 15 }}>{'\uD83C\uDFF7'}</span>
                Теги
                {tags.length > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 400,
                      color: C.dim,
                      marginLeft: 4,
                    }}
                  >
                    {tags.length}/30
                  </span>
                )}
              </label>
              <AIButton
                C={C}
                isLoading={aiTagsLoading}
                onClick={handleAITags}
                label="Подобрать теги с ИИ"
                ariaLabel="Подобрать теги с помощью ИИ"
              />
            </div>

            {/* Tags container */}
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '10px 12px',
                minHeight: 48,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                alignItems: 'center',
                cursor: 'text',
                transition: 'border-color 0.2s',
              }}
              onClick={() => {
                if (!showTagInput) setShowTagInput(true);
              }}
            >
              {tags.map((t) => (
                <TagChip key={t} tag={t} C={C} onRemove={removeTag} />
              ))}
              {showTagInput ? (
                <input
                  id="meta-tags"
                  ref={tagInputRef}
                  value={tagInput}
                  maxLength={50}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => {
                    if (tagInput.trim()) {
                      handleAddTag(tagInput);
                      setTagInput('');
                    } else {
                      setShowTagInput(false);
                      setTagInput('');
                    }
                  }}
                  placeholder={tags.length === 0 ? 'Введите тег и нажмите Enter...' : 'Ещё тег...'}
                  aria-label="Ввод нового тега"
                  style={{
                    padding: '4px 2px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: 13,
                    color: C.text,
                    outline: 'none',
                    fontFamily: 'inherit',
                    flex: 1,
                    minWidth: 120,
                  }}
                />
              ) : tags.length === 0 ? (
                <span
                  style={{ fontSize: 13, color: C.dim, cursor: 'text' }}
                  onClick={() => setShowTagInput(true)}
                >
                  Введите тег и нажмите Enter...
                </span>
              ) : (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTagInput(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowTagInput(true);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Добавить новый тег"
                  style={{
                    padding: '4px 10px',
                    border: `1px dashed ${C.border}`,
                    borderRadius: 16,
                    fontSize: 12,
                    color: C.dim,
                    cursor: 'pointer',
                    background: 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  + добавить
                </span>
              )}
            </div>

            {/* Tag stats */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: 11, color: C.dim }}>
                Enter или запятая для добавления, Backspace для удаления
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: tagsCharCount > 500 ? '#ef4444' : tagsCharCount > 400 ? C.accent : C.dim,
                  fontWeight: tagsCharCount > 400 ? 600 : 400,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {tagsCharCount}/500 символов
              </span>
            </div>

            {/* AI Tags Loading */}
            {aiTagsLoading && (
              <div style={{ marginTop: 12 }}>
                <PulsingLoader C={C} text="ИИ подбирает теги..." />
              </div>
            )}

            {/* AI Tag Suggestions */}
            {!aiTagsLoading && aiSuggestions.tags.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 11, color: C.dim, fontWeight: 500 }}>
                    Рекомендации ИИ (нажмите, чтобы добавить):
                  </span>
                  <button
                    onClick={() => clearAISuggestions()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: C.dim,
                      fontSize: 11,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textDecoration: 'underline',
                    }}
                  >
                    Очистить
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {aiSuggestions.tags
                    .filter((t) => !tags.some((existing) => existing.toLowerCase() === t.toLowerCase()))
                    .map((t, i) => (
                      <SuggestionChip
                        key={i}
                        text={t}
                        C={C}
                        onClick={() => handleAddTag(t)}
                      />
                    ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* ─── CATEGORY SECTION ─────────────────── */}
          <SectionCard C={C}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label
                  htmlFor="meta-category"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 15 }}>{'\uD83D\uDCC1'}</span>
                  Категория YouTube
                </label>
                <select
                  id="meta-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as YouTubeCategory)}
                  style={{
                    ...inputBase,
                    fontSize: 14,
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 14px center',
                    paddingRight: 36,
                  }}
                >
                  {YOUTUBE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ──── RIGHT: Preview sidebar ────────────── */}
        <div style={{ width: isMobile ? '100%' : 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, position: isMobile ? 'static' : 'sticky', top: 24 }}>
          {/* ─── Thumbnail preview ────────────────── */}
          <SectionCard C={C} style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '14px 18px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 14 }}>{'\uD83D\uDDBC'}</span>
                Обложка
              </span>
              {project.data?.thumbnailUrl && (
                <button
                  onClick={() => router.push(`/thumbnails?projectId=${projectId}`)}
                  style={{
                    background: 'none',
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    color: C.sub,
                    fontSize: 11,
                    padding: '3px 10px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = C.accent + '44';
                    e.currentTarget.style.color = C.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.color = C.sub;
                  }}
                >
                  Редактировать
                </button>
              )}
            </div>
            {project.data?.thumbnailUrl ? (
              <img
                src={project.data.thumbnailUrl}
                alt="Обложка видео"
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  aspectRatio: '16/9',
                  background: `linear-gradient(135deg, ${C.surface}, ${C.card})`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 28, opacity: 0.2 }}>{'\uD83D\uDDBC'}</span>
                <button
                  onClick={() => router.push(`/thumbnails?projectId=${projectId}`)}
                  style={{
                    background: 'none',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: C.sub,
                    fontSize: 12,
                    padding: '6px 14px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = C.accent + '44';
                    e.currentTarget.style.color = C.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.color = C.sub;
                  }}
                >
                  Создать обложку
                </button>
              </div>
            )}
          </SectionCard>

          {/* ─── SEO Preview: YouTube search ─────── */}
          <SectionCard C={C} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px 0' }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 14 }}>{'\uD83D\uDD0D'}</span>
                Превью в поиске YouTube
              </span>
            </div>

            {/* Mock YouTube search result */}
            <div style={{ padding: '14px 18px 16px' }}>
              <div
                style={{
                  background: C.surface,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `1px solid ${C.border}`,
                }}
              >
                {/* Thumbnail bar */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <div
                    style={{
                      width: 168,
                      height: 94,
                      flexShrink: 0,
                      background: project.data?.thumbnailUrl ? 'none' : `linear-gradient(135deg, ${C.card}, ${C.surface})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {project.data?.thumbnailUrl ? (
                      <img
                        src={project.data.thumbnailUrl}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 20, opacity: 0.15 }}>{'\u25B6'}</span>
                    )}
                    {/* Duration badge */}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        background: 'rgba(0,0,0,.8)',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: 3,
                      }}
                    >
                      10:25
                    </span>
                  </div>

                  <div style={{ flex: 1, padding: '6px 8px 6px 0', minWidth: 0 }}>
                    {/* Title (2-line clamp like YouTube) */}
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        lineHeight: 1.3,
                        color: C.text,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: 4,
                      }}
                    >
                      {title || 'Название видео'}
                    </div>
                    {/* Channel + views */}
                    <div
                      style={{
                        fontSize: 11,
                        color: C.dim,
                        lineHeight: 1.4,
                      }}
                    >
                      Мой канал
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.dim,
                        lineHeight: 1.4,
                      }}
                    >
                      0 просмотров {'\u00B7'} только что
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock YouTube video page preview */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.dim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Превью страницы видео
                </div>
                <div
                  style={{
                    background: C.surface,
                    borderRadius: 10,
                    padding: '12px 14px',
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: C.text,
                      lineHeight: 1.3,
                      marginBottom: 6,
                    }}
                  >
                    {title || 'Название видео'}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.dim,
                      marginBottom: 8,
                    }}
                  >
                    0 просмотров {'\u00B7'} только что
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: C.sub,
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {desc || 'Описание видео...'}
                  </div>

                  {/* Tags preview */}
                  {tags.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 4,
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: `1px solid ${C.border}`,
                      }}
                    >
                      {tags.slice(0, 8).map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: 10,
                            color: C.blue,
                            background: `${C.blue}0c`,
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontWeight: 500,
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                      {tags.length > 8 && (
                        <span
                          style={{
                            fontSize: 10,
                            color: C.dim,
                            padding: '2px 4px',
                          }}
                        >
                          +{tags.length - 8}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Category badge */}
                  {category && (
                    <div style={{ marginTop: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          color: C.green,
                          background: `${C.green}12`,
                          padding: '3px 10px',
                          borderRadius: 10,
                          fontWeight: 500,
                        }}
                      >
                        {YOUTUBE_CATEGORIES.find((c) => c.value === category)?.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ─── SEO Score indicator ──────────────── */}
          <SectionCard C={C}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.text,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 14 }}>{'\uD83D\uDCCA'}</span>
              SEO проверка
            </div>
            <SEOChecklist
              C={C}
              title={title}
              desc={desc}
              tags={tags}
              category={category}
              thumbnailUrl={project.data?.thumbnailUrl || null}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

/* ─── Template button ────────────────────────────────── */
function TemplateButton({
  C,
  icon,
  label,
  onClick,
}: {
  C: Theme;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '6px 12px',
        background: hovered ? `${C.blue}14` : C.surface,
        border: `1px solid ${hovered ? C.blue + '44' : C.border}`,
        borderRadius: 8,
        fontSize: 12,
        color: hovered ? C.blue : C.sub,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: 500,
        transition: 'all 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      {label}
    </button>
  );
}

/* ─── SEO Checklist ──────────────────────────────────── */
function SEOChecklist({
  C,
  title,
  desc,
  tags,
  category,
  thumbnailUrl,
}: {
  C: Theme;
  title: string;
  desc: string;
  tags: string[];
  category: YouTubeCategory;
  thumbnailUrl: string | null;
}) {
  const checks = useMemo(() => {
    const items: { label: string; ok: boolean; tip: string }[] = [
      {
        label: 'Название заполнено',
        ok: title.length >= 10,
        tip: title.length < 10 ? 'Минимум 10 символов' : 'Отлично!',
      },
      {
        label: 'Название до 70 символов',
        ok: title.length > 0 && title.length <= 70,
        tip: title.length > 70 ? 'YouTube обрезает длинные названия' : 'Оптимальная длина',
      },
      {
        label: 'Описание заполнено',
        ok: desc.length >= 50,
        tip: desc.length < 50 ? 'Минимум 50 символов для SEO' : 'Отлично!',
      },
      {
        label: 'Описание > 200 символов',
        ok: desc.length >= 200,
        tip: desc.length < 200 ? 'Рекомендуется > 200 символов' : 'Хорошее описание',
      },
      {
        label: 'Добавлены теги',
        ok: tags.length >= 3,
        tip: tags.length < 3 ? 'Добавьте минимум 3 тега' : `${tags.length} тегов`,
      },
      {
        label: 'Выбрана категория',
        ok: !!category,
        tip: !category ? 'Укажите категорию видео' : 'Категория задана',
      },
      {
        label: 'Обложка загружена',
        ok: !!thumbnailUrl,
        tip: !thumbnailUrl ? 'Создайте обложку в редакторе' : 'Обложка есть',
      },
    ];
    return items;
  }, [title, desc, tags, category, thumbnailUrl]);

  const score = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const pct = Math.round((score / total) * 100);
  const color = pct >= 80 ? C.green : pct >= 50 ? C.accent : '#ef4444';

  return (
    <div>
      {/* Score bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: `3px solid ${color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              color,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {pct}
          </span>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
            {pct >= 80 ? 'Отлично!' : pct >= 50 ? 'Хорошо, но можно лучше' : 'Нужна доработка'}
          </div>
          <div style={{ fontSize: 11, color: C.dim }}>
            {score}/{total} рекомендаций выполнено
          </div>
        </div>
      </div>

      {/* Check items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {checks.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 0',
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                flexShrink: 0,
                background: item.ok ? `${C.green}18` : `${C.dim}15`,
                color: item.ok ? C.green : C.dim,
              }}
            >
              {item.ok ? '\u2713' : '\u2013'}
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  color: item.ok ? C.text : C.sub,
                  fontWeight: item.ok ? 500 : 400,
                }}
              >
                {item.label}
              </div>
            </div>
            <span
              style={{
                fontSize: 10,
                color: item.ok ? C.green : C.dim,
                whiteSpace: 'nowrap',
              }}
            >
              {item.tip}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
