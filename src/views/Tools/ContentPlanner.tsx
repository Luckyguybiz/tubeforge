'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import {
  useContentPlannerStore,
  type ContentStatus,
  type ContentType,
  type Platform,
  type ContentItem,
  type IdeaItem,
  type ContentTemplate,
  type SortOption,
  type FilterStatus,
  type FilterType,
} from '@/stores/useContentPlannerStore';

/* ── Constants ─────────────────────────────────────────────── */

const GRADIENT: [string, string] = ['#6366f1', '#8b5cf6'];

const TAB_KEYS = ['Calendar', 'Kanban', 'Content List', 'Ideas Bank', 'Templates'] as const;
type Tab = (typeof TAB_KEYS)[number];

const STATUS_COLORS: Record<ContentStatus, string> = {
  Idea: '#6b7280',
  Draft: '#f59e0b',
  Scheduled: '#3b82f6',
  Published: '#10b981',
};

const PLATFORM_COLORS: Record<Platform, string> = {
  YouTube: '#ff0000',
  TikTok: '#000000',
  Instagram: '#e1306c',
  Twitter: '#1da1f2',
  Facebook: '#1877f2',
};

const ALL_STATUSES: ContentStatus[] = ['Idea', 'Draft', 'Scheduled', 'Published'];
const ALL_TYPES: ContentType[] = ['Video', 'Short', 'Post', 'Story', 'Reel'];
const ALL_PLATFORMS: Platform[] = ['YouTube', 'TikTok', 'Instagram', 'Twitter', 'Facebook'];
const FILTER_STATUSES: FilterStatus[] = ['All', ...ALL_STATUSES];
const FILTER_TYPES: FilterType[] = ['All', ...ALL_TYPES];
const SORT_OPTION_KEYS: { value: SortOption; key: string }[] = [
  { value: 'date-desc', key: 'contentPlanner.sort.newestFirst' },
  { value: 'date-asc', key: 'contentPlanner.sort.oldestFirst' },
  { value: 'title-asc', key: 'contentPlanner.sort.titleAZ' },
  { value: 'title-desc', key: 'contentPlanner.sort.titleZA' },
  { value: 'status', key: 'contentPlanner.sort.byStatus' },
];

const DAY_KEYS = ['contentPlanner.day.sun', 'contentPlanner.day.mon', 'contentPlanner.day.tue', 'contentPlanner.day.wed', 'contentPlanner.day.thu', 'contentPlanner.day.fri', 'contentPlanner.day.sat'];
const MONTH_KEYS = [
  'contentPlanner.month.january', 'contentPlanner.month.february', 'contentPlanner.month.march',
  'contentPlanner.month.april', 'contentPlanner.month.may', 'contentPlanner.month.june',
  'contentPlanner.month.july', 'contentPlanner.month.august', 'contentPlanner.month.september',
  'contentPlanner.month.october', 'contentPlanner.month.november', 'contentPlanner.month.december',
];

const IDEA_CATEGORIES = ['General', 'Tutorial', 'Vlog', 'Review', 'Shorts', 'Challenge', 'Collab', 'Trend'];

const TEMPLATE_CATEGORY_COLORS: Record<string, string> = {
  Tutorial: '#3b82f6',
  Vlog: '#8b5cf6',
  Review: '#f59e0b',
  Shorts: '#ef4444',
  Challenge: '#10b981',
  Collab: '#ec4899',
};

/* ── Helpers ───────────────────────────────────────────────── */

function formatDate(iso: string | null): string {
  if (!iso) return 'Not scheduled';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function dateToISO(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
}

/* ── Main Component ────────────────────────────────────────── */

export function ContentPlanner({ embedded }: { embedded?: boolean } = {}) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  const TAB_LABELS: Record<Tab, string> = {
    'Calendar': t('contentPlanner.tab.calendar'),
    'Kanban': t('contentPlanner.tab.kanban') || 'Kanban',
    'Content List': t('contentPlanner.tab.contentList'),
    'Ideas Bank': t('contentPlanner.tab.ideasBank'),
    'Templates': t('contentPlanner.tab.templates'),
  };
  const SORT_OPTIONS = SORT_OPTION_KEYS.map((o) => ({ value: o.value, label: t(o.key) }));
  const DAYS = DAY_KEYS.map((k) => t(k));
  const MONTHS = MONTH_KEYS.map((k) => t(k));

  const STATUS_LABELS: Record<string, string> = {
    'All': t('contentPlanner.filter.all'),
    'Idea': t('contentPlanner.filter.idea'),
    'Draft': t('contentPlanner.filter.draft'),
    'Scheduled': t('contentPlanner.filter.scheduled'),
    'Published': t('contentPlanner.filter.published'),
  };
  const TYPE_LABELS: Record<string, string> = {
    'All': t('contentPlanner.filter.all'),
    'Video': t('contentPlanner.filter.video'),
    'Short': t('contentPlanner.filter.short'),
    'Post': t('contentPlanner.filter.post'),
    'Story': t('contentPlanner.filter.story'),
    'Reel': t('contentPlanner.filter.reel'),
  };
  const isDark = useThemeStore((s) => s.isDark);

  const store = useContentPlannerStore();
  const {
    contentItems, ideas, templates,
    filterStatus, filterType, sortOption,
    addContentItem, updateContentItem, deleteContentItem,
    addIdea, updateIdea, deleteIdea, promoteIdea,
    setFilterStatus, setFilterType, setSortOption,
    getItemsForDate, getFilteredItems,
  } = store;

  const [activeTab, setActiveTab] = useState<Tab>('Calendar');
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  /* Form state */
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formScript, setFormScript] = useState('');
  const [formPlatforms, setFormPlatforms] = useState<Platform[]>([]);
  const [formContentType, setFormContentType] = useState<ContentType>('Video');
  const [formScheduledDate, setFormScheduledDate] = useState('');
  const [formStatus, setFormStatus] = useState<ContentStatus>('Idea');
  const [formTags, setFormTags] = useState('');
  const [formNotes, setFormNotes] = useState('');

  /* Thumbnail upload */
  const [formThumbnailUrl, setFormThumbnailUrl] = useState<string | null>(null);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  /* Ideas Bank */
  const [ideaText, setIdeaText] = useState('');
  const [ideaCategory, setIdeaCategory] = useState('General');
  const [ideaPriority, setIdeaPriority] = useState<1 | 2 | 3>(2);

  /* Search */
  const [searchQuery, setSearchQuery] = useState('');

  /* Kanban drag state */
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ContentStatus | null>(null);

  /* Hover states */
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  /* ── Backend sync ──────────────────────────────────────── */

  const serverState = trpc.contentPlanner.getState.useQuery(undefined, {
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const saveToServer = trpc.contentPlanner.saveState.useMutation();
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSyncedRef = useRef(false);

  // Hydrate store from backend on first successful load
  useEffect(() => {
    if (!serverState.data || hasSyncedRef.current) return;
    const { contentItems: serverItems, ideas: serverIdeas } = serverState.data as {
      contentItems: ContentItem[];
      ideas: IdeaItem[];
    };

    // Only hydrate if server has data and local is empty (first visit) or server is newer
    const localItems = useContentPlannerStore.getState().contentItems;
    if (serverItems.length > 0 && localItems.length === 0) {
      // Replace local store with server data
      const storeState = useContentPlannerStore.getState();
      for (const item of serverItems) {
        // Check if item already exists locally
        if (!storeState.contentItems.find((i) => i.id === item.id)) {
          storeState.addContentItem({
            ...item,
            thumbnailUrl: item.thumbnailUrl ?? null,
          });
        }
      }
      for (const idea of serverIdeas) {
        if (!storeState.ideas.find((i) => i.id === idea.id)) {
          storeState.addIdea(idea.text, idea.category, idea.priority);
        }
      }
    }
    hasSyncedRef.current = true;
  }, [serverState.data]);

  // Debounced save to backend when store changes
  useEffect(() => {
    if (!hasSyncedRef.current) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      saveToServer.mutate(
        { contentItems, ideas },
        { onError: () => toast.error('Failed to sync to server') },
      );
    }, 2000);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentItems, ideas]);

  /* ── Thumbnail upload handler ──────────────────────────── */

  const handleThumbnailUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10 MB)');
      return;
    }

    setIsUploadingThumb(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Upload failed' }));
        toast.error(data.error || 'Upload failed');
        return;
      }
      const { url } = await res.json();
      setFormThumbnailUrl(url);
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploadingThumb(false);
      if (thumbInputRef.current) thumbInputRef.current.value = '';
    }
  }, []);

  /* ── Derived data ──────────────────────────────────────── */

  const filteredItems = useMemo(() => {
    let items = getFilteredItems();
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return items;
  }, [contentItems, filterStatus, filterType, sortOption, getFilteredItems, searchQuery]);

  const kanbanColumns = useMemo(() => {
    const columns: Record<ContentStatus, ContentItem[]> = {
      Idea: [], Draft: [], Scheduled: [], Published: [],
    };
    contentItems.forEach((item) => {
      columns[item.status].push(item);
    });
    return columns;
  }, [contentItems]);

  const stats = useMemo(() => {
    const total = contentItems.length;
    const scheduled = contentItems.filter((i) => i.status === 'Scheduled').length;
    const published = contentItems.filter((i) => i.status === 'Published').length;
    const ideaCount = ideas.length;
    return { total, scheduled, published, ideaCount };
  }, [contentItems, ideas]);

  /* ── Calendar data ─────────────────────────────────────── */

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDayOfWeek(calYear, calMonth);
    const days: Array<{ day: number; dateStr: string; items: ContentItem[] } | null> = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = dateToISO(calYear, calMonth, d);
      const items = getItemsForDate(dateStr);
      days.push({ day: d, dateStr, items });
    }
    return days;
  }, [calYear, calMonth, contentItems, getItemsForDate]);

  const selectedDateItems = useMemo(() => {
    if (!selectedDate) return [];
    return getItemsForDate(selectedDate);
  }, [selectedDate, contentItems, getItemsForDate]);

  /* ── Modal handlers ────────────────────────────────────── */

  const openAddModal = useCallback((prefillDate?: string, template?: ContentTemplate) => {
    setEditingItem(null);
    setFormTitle(template?.titlePattern ?? '');
    setFormDescription(template?.descriptionTemplate ?? '');
    setFormScript('');
    setFormPlatforms([]);
    setFormContentType(template?.contentType ?? 'Video');
    setFormScheduledDate(prefillDate ?? '');
    setFormStatus('Idea');
    setFormTags(template?.hashtags?.join(', ') ?? '');
    setFormNotes('');
    setFormThumbnailUrl(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((item: ContentItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description);
    setFormScript(item.script);
    setFormPlatforms([...item.platforms]);
    setFormContentType(item.contentType);
    setFormScheduledDate(toDateInputValue(item.scheduledDate));
    setFormStatus(item.status);
    setFormTags(item.tags.join(', '));
    setFormNotes(item.notes);
    setFormThumbnailUrl(item.thumbnailUrl ?? null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingItem(null);
  }, []);

  const handleSave = useCallback(() => {
    const tags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const scheduledDate = formScheduledDate
      ? new Date(formScheduledDate + 'T00:00:00').toISOString()
      : null;

    if (editingItem) {
      updateContentItem(editingItem.id, {
        title: formTitle,
        description: formDescription,
        script: formScript,
        platforms: formPlatforms,
        contentType: formContentType,
        scheduledDate,
        status: formStatus,
        tags,
        notes: formNotes,
        thumbnailUrl: formThumbnailUrl,
      });
    } else {
      addContentItem({
        title: formTitle || 'Untitled',
        description: formDescription,
        script: formScript,
        platforms: formPlatforms,
        contentType: formContentType,
        scheduledDate,
        status: formStatus,
        tags,
        notes: formNotes,
        thumbnailColor: null,
        thumbnailUrl: formThumbnailUrl,
      });
    }
    closeModal();
  }, [
    editingItem, formTitle, formDescription, formScript, formPlatforms,
    formContentType, formScheduledDate, formStatus, formTags, formNotes,
    formThumbnailUrl, addContentItem, updateContentItem, closeModal,
  ]);

  const handleDelete = useCallback(() => {
    if (editingItem) {
      deleteContentItem(editingItem.id);
      closeModal();
    }
  }, [editingItem, deleteContentItem, closeModal]);

  const togglePlatform = useCallback((p: Platform) => {
    setFormPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }, []);

  /* ── Keyboard: Escape to close modal ───────────────────── */

  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modalOpen, closeModal]);

  /* ── Focus modal on open ───────────────────────────────── */

  useEffect(() => {
    if (modalOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [modalOpen]);

  /* ── Calendar nav ──────────────────────────────────────── */

  const prevMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 0) {
        setCalYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
    setSelectedDate(null);
  }, []);

  const nextMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 11) {
        setCalYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
    setSelectedDate(null);
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth());
    setSelectedDate(dateToISO(now.getFullYear(), now.getMonth(), now.getDate()));
  }, []);

  /* ── Ideas Bank handlers ───────────────────────────────── */

  const handleAddIdea = useCallback(() => {
    if (!ideaText.trim()) return;
    addIdea(ideaText.trim(), ideaCategory, ideaPriority);
    setIdeaText('');
    setIdeaPriority(2);
  }, [ideaText, ideaCategory, ideaPriority, addIdea]);

  /* ── Kanban DnD handlers ──────────────────────────────── */

  const handleDragStart = useCallback((itemId: string) => {
    setDraggedItemId(itemId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: ContentStatus) => {
    e.preventDefault();
    setDragOverStatus(status);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverStatus(null);
  }, []);

  const handleDrop = useCallback((targetStatus: ContentStatus) => {
    if (draggedItemId) {
      updateContentItem(draggedItemId, { status: targetStatus });
    }
    setDraggedItemId(null);
    setDragOverStatus(null);
  }, [draggedItemId, updateContentItem]);

  const handleDragEnd = useCallback(() => {
    setDraggedItemId(null);
    setDragOverStatus(null);
  }, []);

  const handlePromoteIdea = useCallback((id: string) => {
    const newId = promoteIdea(id);
    if (newId) {
      /* Small delay to allow store to update before reading the promoted item */
      const promoted = useContentPlannerStore.getState().contentItems.find((i) => i.id === newId);
      if (promoted) openEditModal(promoted);
    }
  }, [promoteIdea, openEditModal]);

  /* ── Shared Styles ─────────────────────────────────────── */

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(C.dim)}' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: 36,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: C.sub,
    marginBottom: 6,
    display: 'block',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  };

  const navBtnStyle: React.CSSProperties = {
    width: 44, height: 44, borderRadius: 10,
    border: `1px solid ${C.border}`, background: C.card,
    color: C.text, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease', fontFamily: 'inherit',
    outline: 'none', flexShrink: 0,
  };

  /* ── Render ────────────────────────────────────────────── */

  const content = (
    <>
      {/* ── Stats Bar ────────────────────────────────────── */}
      <div className="tf-planner-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        {[
          { label: t('contentPlanner.stats.totalItems'), value: stats.total, color: C.accent },
          { label: t('contentPlanner.stats.scheduled'), value: stats.scheduled, color: '#3b82f6' },
          { label: t('contentPlanner.stats.ideas'), value: stats.ideaCount, color: '#f59e0b' },
          { label: t('contentPlanner.stats.published'), value: stats.published, color: '#10b981' },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: '16px 20px',
            borderRadius: 14,
            background: C.card,
            border: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: `${stat.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>
                {stat.value}
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="tf-planner-tabs" style={{
        display: 'flex',
        gap: 4,
        marginBottom: 24,
        padding: 4,
        borderRadius: 12,
        background: C.surface,
        border: `1px solid ${C.border}`,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        width: 'fit-content',
        maxWidth: '100%',
      }}>
        {TAB_KEYS.map((tab) => {
          const isActive = activeTab === tab;
          const isHovered = hoveredTab === tab;
          const tabIcons: Record<Tab, string> = {
            'Calendar': '\uD83D\uDCC5',
            'Kanban': '\u2B50',
            'Content List': '\uD83D\uDCCB',
            'Ideas Bank': '\uD83D\uDCA1',
            'Templates': '\uD83D\uDCC4',
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              onMouseEnter={() => setHoveredTab(tab)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#fff' : isHovered ? C.text : C.sub,
                background: isActive ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})` : 'transparent',
                border: 'none',
                borderRadius: 9,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                outline: 'none',
                flexShrink: 0,
                minHeight: 38,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: isActive ? `0 2px 8px ${GRADIENT[0]}30` : 'none',
              }}
            >
              <span style={{ fontSize: 14 }}>{tabIcons[tab]}</span>
              {TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      {/* ── Add Content Button ───────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <ActionButton
          label={t('contentPlanner.newContent')}
          gradient={GRADIENT}
          onClick={() => openAddModal()}
        />
      </div>

      {/* ────────────────────────────────────────────────────
           Calendar View
         ──────────────────────────────────────────────────── */}
      {activeTab === 'Calendar' && (
        <div>
          {/* Calendar Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 20, flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={prevMonth}
                aria-label="Previous month"
                style={navBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <h2 style={{
                fontSize: 20, fontWeight: 700, color: C.text, margin: 0,
                minWidth: 180, textAlign: 'center',
              }}>
                {MONTHS[calMonth]} {calYear}
              </h2>
              <button
                onClick={nextMonth}
                aria-label="Next month"
                style={navBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
            <button
              onClick={goToToday}
              style={{
                padding: '8px 16px', borderRadius: 8, minHeight: 44,
                border: `1px solid ${C.border}`, background: C.card,
                color: C.text, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s ease',
                fontFamily: 'inherit', outline: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
            >
              {t('contentPlanner.today')}
            </button>
          </div>

          {/* Day Headers */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(40px, 1fr))', gap: 1, marginBottom: 4, minWidth: 320 }}>
            {DAYS.map((day) => (
              <div key={day} style={{
                padding: '8px 4px', textAlign: 'center',
                fontSize: 12, fontWeight: 700, color: C.dim,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, minmax(40px, 1fr))', gap: 1,
            background: C.border, borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${C.border}`, minWidth: 320,
          }}>
            {calendarDays.map((cell, idx) => {
              if (!cell) {
                return (
                  <div key={`empty-${idx}`} style={{
                    minHeight: 60, background: C.surface, padding: 4, opacity: 0.4,
                  }} />
                );
              }
              const { day, dateStr, items } = cell;
              const isSelected = selectedDate === dateStr;
              const isTodayDate = isToday(calYear, calMonth, day);
              const isHovered = hoveredDay === dateStr;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  onMouseEnter={() => setHoveredDay(dateStr)}
                  onMouseLeave={() => setHoveredDay(null)}
                  aria-label={`${MONTHS[calMonth]} ${day}, ${items.length} items`}
                  style={{
                    minHeight: 60,
                    background: isSelected
                      ? `${GRADIENT[0]}15`
                      : isHovered ? C.cardHover : C.surface,
                    padding: 4,
                    border: isSelected ? `2px solid ${GRADIENT[0]}` : '2px solid transparent',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit', outline: 'none', textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontSize: 13,
                    fontWeight: isTodayDate ? 800 : 500,
                    color: isTodayDate ? GRADIENT[0] : C.text,
                    width: 26, height: 26, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isTodayDate ? `${GRADIENT[0]}20` : 'transparent',
                    marginBottom: 4,
                  }}>
                    {day}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', overflow: 'hidden' }}>
                    {items.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        title={item.title}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          width: '100%', overflow: 'hidden',
                        }}
                      >
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: STATUS_COLORS[item.status], flexShrink: 0,
                        }} />
                        <span style={{
                          fontSize: 9, fontWeight: 600, color: C.sub,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          lineHeight: '12px',
                        }}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                    {items.length > 2 && (
                      <span style={{ fontSize: 9, color: C.dim, fontWeight: 600, paddingLeft: 8 }}>
                        +{items.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          </div>

          {/* Selected Date Panel */}
          {selectedDate && (
            <div style={{
              marginTop: 20, padding: 20, borderRadius: 14,
              background: C.card, border: `1px solid ${C.border}`,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16, flexWrap: 'wrap', gap: 8,
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                  {formatDate(selectedDate + 'T00:00:00')}
                </h3>
                <button
                  onClick={() => openAddModal(selectedDate)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', minHeight: 44,
                    background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                    color: '#fff', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s ease', outline: 'none',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                >
                  {t('contentPlanner.addContent')}
                </button>
              </div>
              {selectedDateItems.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: C.dim, fontSize: 14 }}>
                  {t('contentPlanner.noContentForDate')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedDateItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => openEditModal(item)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', borderRadius: 10,
                        background: C.surface, border: `1px solid ${C.border}`,
                        cursor: 'pointer', transition: 'all 0.15s ease',
                        fontFamily: 'inherit', textAlign: 'left', width: '100%', outline: 'none',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = C.surface; }}
                    >
                      {item.thumbnailUrl ? (
                        <Image
                          src={item.thumbnailUrl}
                          alt=""
                          width={48}
                          height={28}
                          style={{ objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: STATUS_COLORS[item.status], flexShrink: 0,
                        }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 600, color: C.text,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
                          {item.contentType} &middot; {item.status}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
                        {item.platforms.slice(0, 3).map((p) => (
                          <span key={p} style={{
                            padding: '2px 8px', borderRadius: 12,
                            fontSize: 10, fontWeight: 600,
                            background: `${PLATFORM_COLORS[p]}18`,
                            color: isDark ? `${PLATFORM_COLORS[p]}` : PLATFORM_COLORS[p],
                          }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────
           Kanban Board View
         ──────────────────────────────────────────────────── */}
      {activeTab === 'Kanban' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          minHeight: 400,
          overflowX: 'auto',
        }}>
          {ALL_STATUSES.map((status) => {
            const colItems = kanbanColumns[status];
            const colColor = STATUS_COLORS[status];
            const isDragOver = dragOverStatus === status;
            return (
              <div
                key={status}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(status)}
                style={{
                  display: 'flex', flexDirection: 'column',
                  borderRadius: 14,
                  background: isDragOver ? `${colColor}08` : C.surface,
                  border: isDragOver ? `2px dashed ${colColor}` : `1px solid ${C.border}`,
                  transition: 'all 0.2s ease',
                  minWidth: 200,
                  overflow: 'hidden',
                }}
              >
                {/* Column Header */}
                <div style={{
                  padding: '14px 16px 12px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', background: colColor,
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                      {STATUS_LABELS[status] ?? status}
                    </span>
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10,
                    fontSize: 11, fontWeight: 700,
                    background: `${colColor}15`, color: colColor,
                  }}>
                    {colItems.length}
                  </span>
                </div>

                {/* Column Body */}
                <div style={{
                  padding: 8, flex: 1,
                  display: 'flex', flexDirection: 'column', gap: 8,
                  minHeight: 100,
                }}>
                  {colItems.length === 0 && (
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, color: C.dim, fontStyle: 'italic', padding: 16,
                    }}>
                      {isDragOver ? 'Drop here' : 'No items'}
                    </div>
                  )}
                  {colItems.map((item) => {
                    const isDragging = draggedItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(item.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => openEditModal(item)}
                        style={{
                          padding: '12px 14px', borderRadius: 10,
                          background: C.card,
                          border: `1px solid ${isDragging ? colColor : C.border}`,
                          cursor: 'grab',
                          opacity: isDragging ? 0.5 : 1,
                          transition: 'all 0.15s ease',
                          display: 'flex', flexDirection: 'column', gap: 8,
                        }}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            e.currentTarget.style.borderColor = C.borderActive;
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = `0 4px 12px ${isDark ? 'rgba(0,0,0,.3)' : 'rgba(0,0,0,.08)'}`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = isDragging ? colColor : C.border;
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {/* Card Title */}
                        <div style={{
                          fontSize: 13, fontWeight: 600, color: C.text,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          wordBreak: 'break-word', lineHeight: '18px',
                        }}>
                          {item.title}
                        </div>

                        {/* Card Meta */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '1px 7px', borderRadius: 5,
                            fontSize: 10, fontWeight: 600,
                            background: C.surface, color: C.dim,
                          }}>
                            {item.contentType}
                          </span>
                          {item.scheduledDate && (
                            <span style={{ fontSize: 10, color: C.dim }}>
                              {new Date(item.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>

                        {/* Card Platforms */}
                        {item.platforms.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {item.platforms.slice(0, 3).map((p) => (
                              <span key={p} style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: PLATFORM_COLORS[p],
                              }} title={p} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add to column */}
                  <button
                    onClick={() => {
                      setFormStatus(status);
                      openAddModal();
                    }}
                    style={{
                      padding: '10px 12px', borderRadius: 8,
                      border: `1px dashed ${C.border}`, background: 'transparent',
                      color: C.dim, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      fontFamily: 'inherit', outline: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = colColor; e.currentTarget.style.color = colColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ────────────────────────────────────────────────────
           Content List View
         ──────────────────────────────────────────────────── */}
      {activeTab === 'Content List' && (
        <div>
          {/* Search Bar */}
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              display: 'flex', alignItems: 'center', pointerEvents: 'none',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('contentPlanner.searchPlaceholder') || 'Search content...'}
              style={{
                ...inputStyle,
                paddingLeft: 40,
                height: 44,
                borderRadius: 12,
                background: C.surface,
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; e.currentTarget.style.boxShadow = `0 0 0 3px ${GRADIENT[0]}15`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  width: 24, height: 24, borderRadius: 6, border: 'none',
                  background: C.cardHover, color: C.sub, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  outline: 'none',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="tf-planner-filter-bar" style={{
            display: 'flex', gap: 12, marginBottom: 20,
            flexWrap: 'wrap', alignItems: 'center',
          }}>
            {/* Status Filter */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {FILTER_STATUSES.map((s) => {
                const active = filterStatus === s;
                return (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    style={{
                      padding: '6px 14px', borderRadius: 20, minHeight: 44,
                      border: active ? `1px solid ${GRADIENT[0]}` : `1px solid ${C.border}`,
                      background: active ? `${GRADIENT[0]}18` : C.card,
                      color: active ? GRADIENT[0] : C.sub,
                      fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      fontFamily: 'inherit', outline: 'none',
                      display: 'flex', alignItems: 'center',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.cardHover; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = C.card; }}
                  >
                    {STATUS_LABELS[s] ?? s}
                  </button>
                );
              })}
            </div>

            {/* Separator */}
            <div style={{ height: 24, width: 1, background: C.border, flexShrink: 0 }} />

            {/* Type Filter */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {FILTER_TYPES.map((t) => {
                const active = filterType === t;
                return (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    style={{
                      padding: '6px 14px', borderRadius: 20, minHeight: 44,
                      border: active ? `1px solid ${GRADIENT[1]}` : `1px solid ${C.border}`,
                      background: active ? `${GRADIENT[1]}18` : C.card,
                      color: active ? GRADIENT[1] : C.sub,
                      fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      fontFamily: 'inherit', outline: 'none',
                      display: 'flex', alignItems: 'center',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.cardHover; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = C.card; }}
                  >
                    {TYPE_LABELS[t] ?? t}
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown */}
            <div className="tf-planner-sort" style={{ marginLeft: 'auto', flex: '0 0 auto' }}>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                style={{ ...selectStyle, width: 'auto', minWidth: 130, minHeight: 44 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Content Cards */}
          {filteredItems.length === 0 ? (
            <div style={{
              padding: '64px 24px', textAlign: 'center', borderRadius: 16,
              border: `1px solid ${C.border}`, background: C.card,
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.4, marginBottom: 16 }}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.sub, margin: 0 }}>
                {t('contentPlanner.noContentItems')}
              </p>
              <p style={{ fontSize: 13, color: C.dim, margin: '8px 0 0' }}>
                {filterStatus !== 'All' || filterType !== 'All'
                  ? t('contentPlanner.adjustFilters')
                  : t('contentPlanner.clickNewContent')}
              </p>
            </div>
          ) : (
            <div className="tf-planner-content-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 12,
            }}>
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openEditModal(item)}
                  style={{
                    padding: 16, borderRadius: 14,
                    background: C.card, border: `1px solid ${C.border}`,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    fontFamily: 'inherit', textAlign: 'left', width: '100%',
                    outline: 'none', display: 'flex', flexDirection: 'column', gap: 12,
                    minWidth: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.cardHover;
                    e.currentTarget.style.borderColor = C.borderActive;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = C.card;
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  {/* Thumbnail Preview */}
                  {item.thumbnailUrl && (
                    <div style={{
                      width: '100%', borderRadius: 10, overflow: 'hidden',
                      aspectRatio: '16/9', position: 'relative',
                      background: C.surface,
                    }}>
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.title}
                        fill
                        sizes="260px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  {/* Title + Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <h3 style={{
                      fontSize: 15, fontWeight: 700, color: C.text, margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      minWidth: 0, wordBreak: 'break-word',
                    }}>
                      {item.title}
                    </h3>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20,
                      fontSize: 11, fontWeight: 700,
                      background: `${STATUS_COLORS[item.status]}18`,
                      color: STATUS_COLORS[item.status],
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {item.status}
                    </span>
                  </div>

                  {/* Meta: type + date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.dim, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6,
                      background: C.surface, fontWeight: 600,
                    }}>
                      {item.contentType}
                    </span>
                    <span>{formatDate(item.scheduledDate)}</span>
                  </div>

                  {/* Platforms */}
                  {item.platforms.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {item.platforms.map((p) => (
                        <span key={p} style={{
                          padding: '3px 10px', borderRadius: 12,
                          fontSize: 11, fontWeight: 600,
                          background: `${PLATFORM_COLORS[p]}15`,
                          color: PLATFORM_COLORS[p],
                        }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {item.tags.slice(0, 5).map((tag) => (
                        <span key={tag} style={{
                          padding: '2px 8px', borderRadius: 6,
                          fontSize: 10, fontWeight: 500,
                          background: `${GRADIENT[0]}10`, color: GRADIENT[0],
                        }}>
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 5 && (
                        <span style={{ fontSize: 10, color: C.dim }}>+{item.tags.length - 5}</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────
           Ideas Bank
         ──────────────────────────────────────────────────── */}
      {activeTab === 'Ideas Bank' && (
        <div>
          {/* Quick Add */}
          <div style={{
            padding: 20, borderRadius: 14,
            background: C.card, border: `1px solid ${C.border}`, marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 16px' }}>
              {t('contentPlanner.quickAddIdea')}
            </h3>
            <div className="tf-planner-ideas-add" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 250px' }}>
                <label style={labelStyle}>{t('contentPlanner.idea')}</label>
                <input
                  type="text"
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  placeholder={t('contentPlanner.ideaPlaceholder')}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddIdea(); }}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>
              <div style={{ flex: '0 0 140px' }}>
                <label style={labelStyle}>{t('contentPlanner.category')}</label>
                <select
                  value={ideaCategory}
                  onChange={(e) => setIdeaCategory(e.target.value)}
                  style={selectStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                >
                  {IDEA_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: '0 0 120px' }}>
                <label style={labelStyle}>{t('contentPlanner.priority')}</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {([1, 2, 3] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setIdeaPriority(p)}
                      aria-label={`Priority ${p}`}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 8,
                        border: ideaPriority === p ? '1px solid #f59e0b' : `1px solid ${C.border}`,
                        background: ideaPriority === p ? '#f59e0b18' : C.surface,
                        color: ideaPriority === p ? '#f59e0b' : C.dim,
                        fontSize: 14, cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontFamily: 'inherit', outline: 'none',
                      }}
                    >
                      {'\u2605'.repeat(p)}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: '0 0 auto' }}>
                <ActionButton
                  label={t('contentPlanner.add')}
                  gradient={GRADIENT}
                  onClick={handleAddIdea}
                  disabled={!ideaText.trim()}
                />
              </div>
            </div>
          </div>

          {/* Ideas List */}
          {ideas.length === 0 ? (
            <div style={{
              padding: '64px 24px', textAlign: 'center', borderRadius: 16,
              border: `1px solid ${C.border}`, background: C.card,
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.4, marginBottom: 16 }}>
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.sub, margin: 0 }}>
                {t('contentPlanner.ideasBankEmpty')}
              </p>
              <p style={{ fontSize: 13, color: C.dim, margin: '8px 0 0' }}>
                {t('contentPlanner.captureIdeas')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', borderRadius: 12, flexWrap: 'wrap',
                    background: C.card, border: `1px solid ${C.border}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Priority Stars */}
                  <span style={{
                    fontSize: 14, color: '#f59e0b', flexShrink: 0,
                    width: 44, textAlign: 'center',
                  }}>
                    {'\u2605'.repeat(idea.priority)}{'\u2606'.repeat(3 - idea.priority)}
                  </span>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: C.text,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {idea.text}
                    </div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
                      {new Date(idea.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  {/* Category Badge */}
                  <span style={{
                    padding: '3px 10px', borderRadius: 12,
                    fontSize: 11, fontWeight: 600,
                    background: `${GRADIENT[1]}15`, color: GRADIENT[1],
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {idea.category}
                  </span>

                  {/* Promote Button */}
                  <button
                    onClick={() => handlePromoteIdea(idea.id)}
                    title="Promote to content item"
                    aria-label="Promote to content item"
                    style={{
                      width: 44, height: 44, borderRadius: 8,
                      border: `1px solid ${C.border}`, background: C.surface,
                      color: '#10b981', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s ease', outline: 'none', flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#10b98118'; e.currentTarget.style.borderColor = '#10b981'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="17 11 12 6 7 11" /><line x1="12" y1="6" x2="12" y2="18" />
                    </svg>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteIdea(idea.id)}
                    title="Delete idea"
                    aria-label="Delete idea"
                    style={{
                      width: 44, height: 44, borderRadius: 8,
                      border: `1px solid ${C.border}`, background: C.surface,
                      color: C.dim, cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s ease', outline: 'none', flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#ef444418'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.dim; e.currentTarget.style.borderColor = C.border; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────
           Templates
         ──────────────────────────────────────────────────── */}
      {activeTab === 'Templates' && (
        <div>
          {templates.length === 0 ? (
            <div style={{
              padding: '64px 24px', textAlign: 'center', borderRadius: 16,
              border: `1px solid ${C.border}`, background: C.card,
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.4, marginBottom: 16 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" /><path d="M9 21V9" />
              </svg>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.sub, margin: 0 }}>
                {t('contentPlanner.noTemplates')}
              </p>
              <p style={{ fontSize: 13, color: C.dim, margin: '8px 0 0' }}>
                {t('contentPlanner.templatesHelp')}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}>
              {templates.map((tpl) => {
                const catColor = TEMPLATE_CATEGORY_COLORS[tpl.category] ?? C.accent;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => openAddModal(undefined, tpl)}
                    style={{
                      padding: 16, borderRadius: 14,
                      background: C.card, border: `1px solid ${C.border}`,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      fontFamily: 'inherit', textAlign: 'left', width: '100%',
                      outline: 'none', display: 'flex', flexDirection: 'column', gap: 14,
                      minWidth: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = C.cardHover;
                      e.currentTarget.style.borderColor = catColor;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${catColor}15`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = C.card;
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: `${catColor}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={catColor} strokeWidth="2" strokeLinecap="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
                        </svg>
                      </div>
                      <span style={{
                        padding: '3px 10px', borderRadius: 12,
                        fontSize: 11, fontWeight: 700,
                        background: `${catColor}15`, color: catColor,
                        whiteSpace: 'nowrap',
                      }}>
                        {tpl.category}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0, wordBreak: 'break-word' }}>
                      {tpl.name}
                    </h3>

                    {/* Title pattern preview */}
                    <p style={{
                      fontSize: 13, color: C.sub, margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {tpl.titlePattern}
                    </p>

                    {/* Meta row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: C.dim, flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 6,
                        background: C.surface, fontWeight: 600,
                      }}>
                        {tpl.contentType}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                        </svg>
                        {t('contentPlanner.bestAt')} {tpl.optimalTime}
                      </span>
                    </div>

                    {/* Hashtags */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {tpl.hashtags.slice(0, 4).map((tag) => (
                        <span key={tag} style={{
                          padding: '2px 8px', borderRadius: 6,
                          fontSize: 10, fontWeight: 500,
                          background: `${GRADIENT[0]}10`, color: GRADIENT[0],
                        }}>
                          {tag}
                        </span>
                      ))}
                      {tpl.hashtags.length > 4 && (
                        <span style={{ fontSize: 10, color: C.dim }}>+{tpl.hashtags.length - 4}</span>
                      )}
                    </div>

                    {/* CTA */}
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: catColor,
                      display: 'flex', alignItems: 'center', gap: 6, marginTop: 2,
                    }}>
                      {t('contentPlanner.useTemplate')}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────
           Add / Edit Content Modal
         ──────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: C.overlay, padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          role="dialog"
          aria-modal="true"
          aria-label={editingItem ? 'Edit content item' : 'Add content item'}
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            style={{
              width: 'calc(100vw - 32px)', maxWidth: 640,
              maxHeight: 'calc(100dvh - 80px)', overflowY: 'auto',
              borderRadius: 18, background: C.card,
              border: `1px solid ${C.border}`,
              boxShadow: `0 24px 64px ${isDark ? 'rgba(0,0,0,.5)' : 'rgba(0,0,0,.15)'}`,
              outline: 'none',
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 16px 12px', borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'sticky', top: 0, background: C.card,
              borderRadius: '18px 18px 0 0', zIndex: 1, gap: 8,
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
                {editingItem ? t('contentPlanner.editContent') : t('contentPlanner.newContentModal')}
              </h2>
              <button
                onClick={closeModal}
                aria-label="Close modal"
                style={{
                  width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                  border: `1px solid ${C.border}`, background: C.surface,
                  color: C.text, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease', outline: 'none', fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.surface; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Title */}
              <div>
                <label style={labelStyle}>{t('contentPlanner.titleLabel')}</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={t('contentPlanner.titlePlaceholder')}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>{t('contentPlanner.description')}</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={t('contentPlanner.descriptionPlaceholder')}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>

              {/* Script */}
              <div>
                <label style={labelStyle}>{t('contentPlanner.script')}</label>
                <textarea
                  value={formScript}
                  onChange={(e) => setFormScript(e.target.value)}
                  placeholder={t('contentPlanner.scriptPlaceholder')}
                  rows={4}
                  style={{
                    ...inputStyle, resize: 'vertical', minHeight: 100,
                    fontFamily: 'monospace, inherit',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>

              {/* Two-column: Content Type + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label style={labelStyle}>{t('contentPlanner.contentType')}</label>
                  <select
                    value={formContentType}
                    onChange={(e) => setFormContentType(e.target.value as ContentType)}
                    style={selectStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                  >
                    {ALL_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{t('contentPlanner.status')}</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ContentStatus)}
                    style={selectStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scheduled Date */}
              <div>
                <label style={labelStyle}>{t('contentPlanner.scheduledDate')}</label>
                <input
                  type="date"
                  value={formScheduledDate}
                  onChange={(e) => setFormScheduledDate(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>

              {/* Platforms (Multi-select checkboxes) */}
              <div>
                <label style={labelStyle}>{t('contentPlanner.platforms')}</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ALL_PLATFORMS.map((p) => {
                    const isChecked = formPlatforms.includes(p);
                    const pColor = PLATFORM_COLORS[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        role="checkbox"
                        aria-checked={isChecked}
                        style={{
                          padding: '7px 14px', borderRadius: 10, minHeight: 44,
                          border: isChecked ? `1.5px solid ${pColor}` : `1px solid ${C.border}`,
                          background: isChecked ? `${pColor}15` : C.surface,
                          color: isChecked ? pColor : C.sub,
                          fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.15s ease',
                          fontFamily: 'inherit', outline: 'none',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                        onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = C.cardHover; }}
                        onMouseLeave={(e) => { if (!isChecked) e.currentTarget.style.background = C.surface; }}
                      >
                        <span style={{
                          width: 16, height: 16, borderRadius: 4,
                          border: isChecked ? `2px solid ${pColor}` : `2px solid ${C.dim}`,
                          background: isChecked ? pColor : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s ease', flexShrink: 0,
                        }}>
                          {isChecked && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label style={labelStyle}>{t('contentPlanner.tags')}</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder={t('contentPlanner.tagsPlaceholder')}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
                {formTags.trim() && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                    {formTags.split(',').map((t) => t.trim()).filter(Boolean).map((tag, idx) => (
                      <span key={`${tag}-${idx}`} style={{
                        padding: '2px 8px', borderRadius: 6,
                        fontSize: 11, fontWeight: 500,
                        background: `${GRADIENT[0]}12`, color: GRADIENT[0],
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>{t('contentPlanner.notes')}</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder={t('contentPlanner.notesPlaceholder')}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label style={labelStyle}>Thumbnail</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {formThumbnailUrl ? (
                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                      <Image
                        src={formThumbnailUrl}
                        alt="Thumbnail"
                        width={160}
                        height={90}
                        style={{ objectFit: 'cover', borderRadius: 10, display: 'block' }}
                      />
                      <button
                        onClick={() => setFormThumbnailUrl(null)}
                        style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 24, height: 24, borderRadius: 6,
                          background: 'rgba(0,0,0,0.7)', border: 'none',
                          color: '#fff', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700,
                        }}
                        aria-label="Remove thumbnail"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => thumbInputRef.current?.click()}
                      disabled={isUploadingThumb}
                      style={{
                        width: 160, height: 90, borderRadius: 10,
                        border: `2px dashed ${C.border}`, background: C.surface,
                        color: C.dim, cursor: 'pointer', display: 'flex',
                        flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', gap: 4,
                        transition: 'all 0.2s ease', fontFamily: 'inherit',
                        fontSize: 12, opacity: isUploadingThumb ? 0.5 : 1,
                      }}
                    >
                      {isUploadingThumb ? (
                        <span>Uploading...</span>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span>Upload image</span>
                        </>
                      )}
                    </button>
                  )}
                  <input
                    ref={thumbInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleThumbnailUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 16px 16px', borderTop: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', gap: 10,
              justifyContent: 'space-between', flexWrap: 'wrap',
              position: 'sticky', bottom: 0, background: C.card,
              borderRadius: '0 0 18px 18px', zIndex: 1,
            }}>
              <div>
                {editingItem && (
                  <button
                    onClick={handleDelete}
                    style={{
                      padding: '10px 20px', borderRadius: 10, minHeight: 44,
                      border: '1px solid #ef444440', background: '#ef444412',
                      color: '#ef4444', fontSize: 14, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      fontFamily: 'inherit', outline: 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#ef444425'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#ef444412'; }}
                  >
                    {t('contentPlanner.delete')}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={closeModal}
                  style={{
                    padding: '10px 24px', borderRadius: 10, minHeight: 44,
                    border: `1px solid ${C.border}`, background: C.surface,
                    color: C.text, fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    fontFamily: 'inherit', outline: 'none',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = C.surface; }}
                >
                  {t('contentPlanner.cancel')}
                </button>
                <ActionButton
                  label={editingItem ? t('contentPlanner.saveChanges') : t('contentPlanner.create')}
                  gradient={GRADIENT}
                  onClick={handleSave}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <ToolPageShell
      title={t('contentPlanner.title')}
      subtitle={t('contentPlanner.subtitle')}
      gradient={GRADIENT}
    >
      {content}
    </ToolPageShell>
  );
}
