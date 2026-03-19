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
import { useLocaleStore } from '@/stores/useLocaleStore';
import type { Theme } from '@/lib/types';

/* ─── YouTube categories ─────────────────────────────── */
function getYouTubeCategories(t: (key: string) => string): { value: YouTubeCategory; label: string }[] {
  return [
    { value: '', label: t('metadata.cat.none') },
    { value: 'Entertainment', label: t('metadata.cat.entertainment') },
    { value: 'Education', label: t('metadata.cat.education') },
    { value: 'Science & Technology', label: t('metadata.cat.science') },
    { value: 'Gaming', label: t('metadata.cat.gaming') },
    { value: 'Music', label: t('metadata.cat.music') },
    { value: 'Sports', label: t('metadata.cat.sports') },
    { value: 'News & Politics', label: t('metadata.cat.news') },
    { value: 'Howto & Style', label: t('metadata.cat.howto') },
    { value: 'People & Blogs', label: t('metadata.cat.people') },
    { value: 'Comedy', label: t('metadata.cat.comedy') },
    { value: 'Film & Animation', label: t('metadata.cat.film') },
    { value: 'Autos & Vehicles', label: t('metadata.cat.autos') },
    { value: 'Travel & Events', label: t('metadata.cat.travel') },
    { value: 'Pets & Animals', label: t('metadata.cat.pets') },
    { value: 'Nonprofits & Activism', label: t('metadata.cat.nonprofits') },
  ];
}

/* ─── Description templates ──────────────────────────── */
function getDescTemplates(t: (key: string) => string) {
  return [
    {
      label: t('metadata.tpl.timecodes'),
      icon: '\u23F1',
      text: t('metadata.tpl.timecodes.text'),
    },
    {
      label: t('metadata.tpl.links'),
      icon: '\uD83D\uDD17',
      text: t('metadata.tpl.links.text'),
    },
    {
      label: t('metadata.tpl.social'),
      icon: '\uD83D\uDCF1',
      text: t('metadata.tpl.social.text'),
    },
    {
      label: t('metadata.tpl.cta'),
      icon: '\uD83D\uDD14',
      text: t('metadata.tpl.cta.text'),
    },
  ];
}

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
function friendlyAIError(err: { message: string; data?: { code?: string } }, t: (key: string) => string): string {
  const code = err.data?.code || '';
  const msg = err.message.toLowerCase();
  if (code === 'TOO_MANY_REQUESTS' || msg.includes('too many'))
    return t('ai.error.rateLimit');
  if (code === 'FORBIDDEN' || msg.includes('limit') || msg.includes('upgrade'))
    return t('ai.error.quota');
  if (code === 'INTERNAL_SERVER_ERROR' || msg.includes('api error'))
    return t('ai.error.generation');
  return t('ai.error.generic');
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
          <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>{'•'}</span>
          <span style={{ animation: 'pulse 1s ease-in-out 0.2s infinite' }}>{'•'}</span>
          <span style={{ animation: 'pulse 1s ease-in-out 0.4s infinite' }}>{'•'}</span>
        </span>
      ) : (
        <>
          <span style={{ fontSize: 11 }}>{'✨'}</span>
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
        padding: typeof window !== 'undefined' && window.innerWidth < 768 ? '14px 12px' : '20px 22px',
        width: '100%',
        boxSizing: 'border-box' as const,
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
  const color = current > max ? C.red : current >= warn ? C.accent : C.dim;
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
              ? C.red
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
  const t = useLocaleStore((s) => s.t);
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
        aria-label={`${t('metadata.tags.removeAria')} ${tag}`}
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
  const t = useLocaleStore((s) => s.t);
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

  const YOUTUBE_CATEGORIES = useMemo(() => getYouTubeCategories(t), [t]);
  const DESC_TEMPLATES = useMemo(() => getDescTemplates(t), [t]);

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
      toast.success(t('metadata.toast.titlesReady'));
    },
    onError: (err) => toast.error(friendlyAIError(err as { message: string; data?: { code?: string } }, t)),
    onSettled: () => setAiTitleLoading(false),
  });

  const generateDesc = trpc.ai.generateMetadata.useMutation({
    onSuccess: (data) => {
      if (data.description) {
        setAISuggestions({ descriptions: [data.description, ...(aiSuggestions.descriptions || [])].slice(0, 3) });
      }
      toast.success(t('metadata.toast.descGenerated'));
    },
    onError: (err) => toast.error(friendlyAIError(err as { message: string; data?: { code?: string } }, t)),
    onSettled: () => setAiDescLoading(false),
  });

  const generateTags = trpc.ai.generateMetadata.useMutation({
    onSuccess: (data) => {
      if (data.tags && Array.isArray(data.tags)) {
        const currentTags = useMetadataStore.getState().tags;
        // Filter out tags that already exist in the current tag list (case-insensitive)
        const isExisting = (t: string) => currentTags.some((ct) => ct.toLowerCase() === t.toLowerCase());
        const newTags = data.tags.filter(
          (t: string) => !isExisting(t)
        );
        // Also prune old AI suggestions that the user has since accepted
        const oldFiltered = (aiSuggestions.tags || []).filter((t) => !isExisting(t));
        const merged = [...new Set([...newTags, ...oldFiltered])].slice(0, 20);
        setAISuggestions({ tags: merged });
      }
      toast.success(t('metadata.toast.tagsReady'));
    },
    onError: (err) => toast.error(friendlyAIError(err as { message: string; data?: { code?: string } }, t)),
    onSettled: () => setAiTagsLoading(false),
  });

  const handleAITitle = useCallback(() => {
    if (!title && !desc) {
      toast.warning(t('metadata.toast.aiHint'));
    }
    setAiTitleLoading(true);
    generateTitle.mutate({ topic: title || desc || 'YouTube video', language: 'ru' });
  }, [title, desc]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAIDesc = useCallback(() => {
    if (!title && !desc) {
      toast.warning(t('metadata.toast.aiHint'));
    }
    setAiDescLoading(true);
    generateDesc.mutate({ topic: title || desc || 'YouTube video', language: 'ru' });
  }, [title, desc]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAITags = useCallback(() => {
    if (!title && !desc) {
      toast.warning(t('metadata.toast.aiHint'));
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
      toast.warning(t('metadata.toast.maxTags'));
      return;
    }
    const newCharCount = tagsCharCount + (tagsCharCount > 0 ? 2 : 0) + tag.length;
    if (newCharCount > 500) {
      toast.warning(t('metadata.toast.tagsCharLimit'));
      return;
    }
    if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      toast.warning(t('metadata.toast.tagDuplicate'));
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
    if (title) parts.push(`${t('metadata.copy.title')}: ${title}`);
    if (desc) parts.push(`\n${t('metadata.copy.desc')}:\n${desc}`);
    if (tags.length) parts.push(`\n${t('metadata.copy.tags')}: ${tags.join(', ')}`);
    if (category) {
      const cat = YOUTUBE_CATEGORIES.find((c) => c.value === category);
      if (cat) parts.push(`\n${t('metadata.copy.category')}: ${cat.label}`);
    }
    navigator.clipboard.writeText(parts.join('\n')).then(
      () => toast.success(t('metadata.toast.metadataCopied')),
      () => toast.error(t('metadata.toast.copyFailed'))
    );
  }, [title, desc, tags, category, t, YOUTUBE_CATEGORIES]);

  // Manual save
  const handleManualSave = useCallback(() => {
    if (!projectId) return;
    setManualSaving(true);
    saveProject.mutate(
      { id: projectId, title, description: desc, tags },
      {
        onSuccess: () => {
          setSaveStatus('saved');
          toast.success(t('metadata.toast.metadataSaved'));
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

  // Input style base — must be called before early returns to satisfy Rules of Hooks
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

  /* ─── Project picker ─────────────────────────────── */
  if (!projectId) {
    return <ProjectPicker target="/metadata" title={t('metadata.pageTitle')} />;
  }

  /* ─── Loading state ──────────────────────────────── */
  if (project.isLoading) {
    return (
      <div style={{ maxWidth: 1060 }}>
        <Skeleton width="220px" height="28px" />
        <div style={{ marginTop: 8 }}>
          <Skeleton width="320px" height="16px" />
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton width="100%" height="120px" />
            <Skeleton width="100%" height="220px" />
            <Skeleton width="100%" height="100px" />
          </div>
          <div style={{ width: '100%', maxWidth: 340 }}>
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
          {t('metadata.error.loadProject')}
        </div>
        <div style={{ fontSize: 12, color: C.sub }}>
          {project.error?.message || t('metadata.error.tryAgain')}
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
            {t('metadata.error.retry')}
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
            {t('metadata.error.toDashboard')}
          </button>
        </div>
      </div>
    );
  }

  /* ─── Derived state ──────────────────────────────── */
  const saveLabel =
    saveStatus === 'saving'
      ? { text: t('metadata.save.saving'), color: C.dim, icon: '\u25CB' }
      : saveStatus === 'saved'
        ? { text: t('metadata.save.saved'), color: C.green, icon: '\u2713' }
        : saveStatus === 'error'
          ? { text: t('metadata.saveError'), color: C.red, icon: '\u26A0' }
          : null;

  const titleWarning = title.length > 100;
  const titleCaution = title.length >= 70;
  const descWarning = desc.length > 5000;
  const descCaution = desc.length >= 4500;

  const currentProject = projectsList.data?.items?.find((p) => p.id === projectId);

  return (
    <div style={{ maxWidth: 1060, width: '100%', padding: isMobile ? '0 12px' : 0, boxSizing: 'border-box' as const }}>
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
          aria-label={t('metadata.breadcrumb.ariaLabel')}
        >
          {t('metadata.breadcrumb.projects')}
        </span>
        <span style={{ color: C.dim }}>/</span>
        {project.data?.title && (
          <>
            <span style={{ color: C.sub }}>{project.data.title}</span>
            <span style={{ color: C.dim }}>/</span>
          </>
        )}
        <span style={{ color: C.text, fontWeight: 500 }}>{t('metadata.pageTitle')}</span>
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
            {t('metadata.heading')}
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

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Copy all button */}
          <button
            onClick={handleCopyAll}
            title={t('metadata.copyAllTitle')}
            style={{
              padding: '8px 16px',
              minHeight: 44,
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
            {t('metadata.copyAll')}
          </button>

          {/* Save button */}
          <button
            onClick={handleManualSave}
            disabled={manualSaving || !projectId}
            style={{
              padding: '8px 22px',
              minHeight: 44,
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
            {manualSaving ? t('metadata.save.btnSaving') : t('metadata.save.btn')}
          </button>
        </div>
      </div>

      <p style={{ color: C.sub, fontSize: 13, marginBottom: 24 }}>
        {t('metadata.subtitle')}
      </p>

      {/* ─── Project selector ──────────────────────── */}
      <div ref={dropdownRef} style={{ position: 'relative', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('metadata.projectLabel')}
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
            maxWidth: isMobile ? '100%' : 400,
            textAlign: 'left',
            transition: 'border-color 0.2s',
          }}
        >
          {currentProject?.thumbnailUrl ? (
            <img
              src={currentProject.thumbnailUrl}
              alt={`Thumbnail for ${currentProject.title || 'current project'}`}
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
            {currentProject?.title || project.data?.title || t('metadata.untitled')}
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
                    alt={`Thumbnail for ${p.title || 'project'}`}
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
                  {p.title || t('metadata.untitled')}
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
      <div style={{ display: 'flex', gap: isMobile ? 16 : 24, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
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
                {t('metadata.title.label')}
              </label>
              <AIButton
                C={C}
                isLoading={aiTitleLoading}
                onClick={handleAITitle}
                label={t('metadata.title.aiBtn')}
                ariaLabel={t('metadata.title.aiBtnAria')}
              />
            </div>
            <input
              id="meta-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('metadata.title.placeholder')}
              maxLength={100}
              style={{
                ...inputBase,
                fontSize: 18,
                fontWeight: 600,
                padding: '14px 16px',
                borderColor: titleWarning ? C.red : titleCaution ? C.accent + '66' : C.border,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.accent;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}15`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = titleWarning ? C.red : titleCaution ? C.accent + '66' : C.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
              aria-describedby="meta-title-counter"
            />
            <CharCounter current={title.length} max={100} warn={70} C={C} />

            {/* AI Title Suggestions */}
            {aiTitleLoading && (
              <div style={{ marginTop: 12 }}>
                <PulsingLoader C={C} text={t('metadata.title.aiLoading')} />
              </div>
            )}
            {!aiTitleLoading && aiSuggestions.titles.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 6, fontWeight: 500 }}>
                  {t('metadata.title.aiSuggestions')}
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
                {t('metadata.desc.label')}
              </label>
              <AIButton
                C={C}
                isLoading={aiDescLoading}
                onClick={handleAIDesc}
                label={t('metadata.desc.aiBtn')}
                ariaLabel={t('metadata.desc.aiBtnAria')}
              />
            </div>
            <textarea
              id="meta-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={8}
              placeholder={t('metadata.desc.placeholder')}
              maxLength={5000}
              style={{
                ...inputBase,
                fontSize: 14,
                lineHeight: 1.65,
                resize: 'vertical',
                minHeight: 180,
                borderColor: descWarning ? C.red : descCaution ? C.accent + '66' : C.border,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.accent;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}15`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = descWarning ? C.red : descCaution ? C.accent + '66' : C.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
              aria-describedby="meta-desc-counter"
            />
            <CharCounter current={desc.length} max={5000} warn={4500} C={C} />

            {/* Template insert buttons */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 8, fontWeight: 500 }}>
                {t('metadata.desc.insertTemplate')}
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
                <PulsingLoader C={C} text={t('metadata.desc.aiLoading')} />
              </div>
            )}
            {!aiDescLoading && aiSuggestions.descriptions.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 6, fontWeight: 500 }}>
                  {t('metadata.desc.aiSuggestions')}
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
                {t('metadata.tags.label')}
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
                label={t('metadata.tags.aiBtn')}
                ariaLabel={t('metadata.tags.aiBtnAria')}
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
                  placeholder={tags.length === 0 ? t('metadata.tags.placeholder') : t('metadata.tags.placeholderMore')}
                  aria-label={t('metadata.tags.addAria')}
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
                  {t('metadata.tags.placeholder')}
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
                  aria-label={t('metadata.tags.addBtnAria')}
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
                  {t('metadata.tags.addBtn')}
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
                {t('metadata.tags.hint')}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: tagsCharCount > 500 ? C.red : tagsCharCount > 400 ? C.accent : C.dim,
                  fontWeight: tagsCharCount > 400 ? 600 : 400,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {tagsCharCount}/500 {t('metadata.tags.charCount')}
              </span>
            </div>

            {/* AI Tags Loading */}
            {aiTagsLoading && (
              <div style={{ marginTop: 12 }}>
                <PulsingLoader C={C} text={t('metadata.tags.aiLoading')} />
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
                    {t('metadata.tags.aiSuggestions')}
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
                    {t('metadata.tags.clear')}
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
                  {t('metadata.category.label')}
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
                {t('metadata.preview.thumbnail')}
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
                  {t('metadata.preview.editThumbnail')}
                </button>
              )}
            </div>
            {project.data?.thumbnailUrl ? (
              <img
                src={project.data.thumbnailUrl}
                alt={t('metadata.preview.thumbnailAlt')}
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
                  {t('metadata.preview.createThumbnail')}
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
                {t('metadata.preview.searchTitle')}
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
                        alt="Video thumbnail preview"
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
                      {title || t('metadata.preview.videoTitle')}
                    </div>
                    {/* Channel + views */}
                    <div
                      style={{
                        fontSize: 11,
                        color: C.dim,
                        lineHeight: 1.4,
                      }}
                    >
                      {t('metadata.preview.channel')}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.dim,
                        lineHeight: 1.4,
                      }}
                    >
                      {t('metadata.preview.views')} {'\u00B7'} {t('metadata.preview.justNow')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock YouTube video page preview */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.dim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {t('metadata.preview.pageTitle')}
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
                    {title || t('metadata.preview.videoTitle')}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.dim,
                      marginBottom: 8,
                    }}
                  >
                    {t('metadata.preview.views')} {'\u00B7'} {t('metadata.preview.justNow')}
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
                    {desc || t('metadata.preview.descPlaceholder')}
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
              {t('metadata.seo.title')}
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
  const t = useLocaleStore((s) => s.t);
  const checks = useMemo(() => {
    const items: { label: string; ok: boolean; tip: string }[] = [
      {
        label: t('metadata.seo.titleFilled'),
        ok: title.length >= 10,
        tip: title.length < 10 ? t('metadata.seo.titleMin') : t('metadata.seo.titleOk'),
      },
      {
        label: t('metadata.seo.titleLength'),
        ok: title.length > 0 && title.length <= 70,
        tip: title.length > 70 ? t('metadata.seo.titleTruncated') : t('metadata.seo.titleOptimal'),
      },
      {
        label: t('metadata.seo.descFilled'),
        ok: desc.length >= 50,
        tip: desc.length < 50 ? t('metadata.seo.descMin') : t('metadata.seo.descOk'),
      },
      {
        label: t('metadata.seo.descLength'),
        ok: desc.length >= 200,
        tip: desc.length < 200 ? t('metadata.seo.descRecommended') : t('metadata.seo.descGood'),
      },
      {
        label: t('metadata.seo.tagsAdded'),
        ok: tags.length >= 3,
        tip: tags.length < 3 ? t('metadata.seo.tagsMin') : `${tags.length} ${t('metadata.seo.tagsCount')}`,
      },
      {
        label: t('metadata.seo.categorySet'),
        ok: !!category,
        tip: !category ? t('metadata.seo.categoryMissing') : t('metadata.seo.categoryOk'),
      },
      {
        label: t('metadata.seo.thumbnailUploaded'),
        ok: !!thumbnailUrl,
        tip: !thumbnailUrl ? t('metadata.seo.thumbnailMissing') : t('metadata.seo.thumbnailOk'),
      },
      {
        label: t('metadata.seo.timestamps'),
        ok: extractValidTimestamps(desc).length >= 2,
        tip: extractValidTimestamps(desc).length >= 2
          ? `${extractValidTimestamps(desc).length} ${t('metadata.seo.timestampsCount')}`
          : t('metadata.seo.timestampsMissing'),
      },
    ];
    return items;
  }, [title, desc, tags, category, thumbnailUrl, t]);

  const score = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const pct = Math.round((score / total) * 100);
  const color = pct >= 80 ? C.green : pct >= 50 ? C.accent : C.red;

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
            {pct >= 80 ? t('metadata.seo.excellent') : pct >= 50 ? t('metadata.seo.good') : t('metadata.seo.needsWork')}
          </div>
          <div style={{ fontSize: 11, color: C.dim }}>
            {score}/{total} {t('metadata.seo.score')}
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
