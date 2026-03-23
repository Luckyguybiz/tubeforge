'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
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

const GRADIENT: [string, string] = ['#06b6d4', '#8b5cf6'];

const TABS = ['Calendar', 'Content List', 'Ideas Bank', 'Templates'] as const;
type Tab = (typeof TABS)[number];

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
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' },
  { value: 'status', label: 'By Status' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
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

export function ContentPlanner() {
  const C = useThemeStore((s) => s.theme);
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

  /* Ideas Bank */
  const [ideaText, setIdeaText] = useState('');
  const [ideaCategory, setIdeaCategory] = useState('General');
  const [ideaPriority, setIdeaPriority] = useState<1 | 2 | 3>(2);

  /* Hover states */
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  /* ── Derived data ──────────────────────────────────────── */

  const filteredItems = useMemo(
    () => getFilteredItems(),
    [contentItems, filterStatus, filterType, sortOption, getFilteredItems],
  );

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
      });
    }
    closeModal();
  }, [
    editingItem, formTitle, formDescription, formScript, formPlatforms,
    formContentType, formScheduledDate, formStatus, formTags, formNotes,
    addContentItem, updateContentItem, closeModal,
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

  return (
    <ToolPageShell
      title="Content Planner"
      subtitle="Plan, schedule, and organize your content pipeline across all platforms"
      gradient={GRADIENT}
    >
      {/* ── Stats Bar ────────────────────────────────────── */}
      <div className="tf-planner-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        {[
          { label: 'Total Items', value: stats.total, color: C.accent },
          { label: 'Scheduled', value: stats.scheduled, color: '#3b82f6' },
          { label: 'Ideas', value: stats.ideaCount, color: '#f59e0b' },
          { label: 'Published', value: stats.published, color: '#10b981' },
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
        borderBottom: `1px solid ${C.border}`,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          const isHovered = hoveredTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              onMouseEnter={() => setHoveredTab(tab)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                padding: '12px 20px',
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? GRADIENT[0] : isHovered ? C.text : C.sub,
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? `2px solid ${GRADIENT[0]}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                outline: 'none',
                flexShrink: 0,
                minHeight: 44,
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ── Add Content Button ───────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <ActionButton
          label="+ New Content"
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
              Today
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {items.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        title={item.title}
                        style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: STATUS_COLORS[item.status], flexShrink: 0,
                        }}
                      />
                    ))}
                    {items.length > 4 && (
                      <span style={{ fontSize: 9, color: C.dim, lineHeight: '8px' }}>
                        +{items.length - 4}
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
                  + Add Content
                </button>
              </div>
              {selectedDateItems.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: C.dim, fontSize: 14 }}>
                  No content scheduled for this date. Click &quot;+ Add Content&quot; to get started.
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
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: STATUS_COLORS[item.status], flexShrink: 0,
                      }} />
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
           Content List View
         ──────────────────────────────────────────────────── */}
      {activeTab === 'Content List' && (
        <div>
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
                    {s}
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
                    {t}
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
                No content items found
              </p>
              <p style={{ fontSize: 13, color: C.dim, margin: '8px 0 0' }}>
                {filterStatus !== 'All' || filterType !== 'All'
                  ? 'Try adjusting your filters to see more items.'
                  : 'Click "+ New Content" to create your first content item.'}
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
              Quick Add Idea
            </h3>
            <div className="tf-planner-ideas-add" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 250px' }}>
                <label style={labelStyle}>Idea</label>
                <input
                  type="text"
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  placeholder="What's your next content idea?"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddIdea(); }}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>
              <div style={{ flex: '0 0 140px' }}>
                <label style={labelStyle}>Category</label>
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
                <label style={labelStyle}>Priority</label>
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
                  label="Add"
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
                Your ideas bank is empty
              </p>
              <p style={{ fontSize: 13, color: C.dim, margin: '8px 0 0' }}>
                Capture fleeting ideas quickly. Add your first idea above!
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
                No templates available
              </p>
              <p style={{ fontSize: 13, color: C.dim, margin: '8px 0 0' }}>
                Templates help you create content faster with pre-filled structures.
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
                        Best at {tpl.optimalTime}
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
                      Use Template
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
                {editingItem ? 'Edit Content' : 'New Content'}
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
                <label style={labelStyle}>Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Enter a title for your content"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Write a description for your content..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>

              {/* Script */}
              <div>
                <label style={labelStyle}>Script</label>
                <textarea
                  value={formScript}
                  onChange={(e) => setFormScript(e.target.value)}
                  placeholder="Draft your script or talking points..."
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
                  <label style={labelStyle}>Content Type</label>
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
                  <label style={labelStyle}>Status</label>
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
                <label style={labelStyle}>Scheduled Date</label>
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
                <label style={labelStyle}>Platforms</label>
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
                <label style={labelStyle}>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="#vlog, #tutorial, #tech"
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
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Any additional notes, links, or reminders..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
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
                    Delete
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
                  Cancel
                </button>
                <ActionButton
                  label={editingItem ? 'Save Changes' : 'Create'}
                  gradient={GRADIENT}
                  onClick={handleSave}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
