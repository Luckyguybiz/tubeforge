'use client';

import { useState, useCallback, useMemo } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useMultiPublisherStore, type PublishPlatform, type PublishStatus } from '@/stores/useMultiPublisherStore';
import { toast } from '@/stores/useNotificationStore';
import type { Theme } from '@/lib/types';

/* ── Constants ─────────────────────────────────────────────── */

const GRADIENT: [string, string] = ['#0ea5e9', '#6366f1'];

const PLATFORMS: { id: PublishPlatform; color: string }[] = [
  { id: 'YouTube', color: '#ff0000' },
  { id: 'TikTok', color: '#010101' },
  { id: 'Instagram', color: '#e1306c' },
];

const STATUS_COLORS: Record<PublishStatus, string> = {
  draft: '#6b7280',
  scheduled: '#3b82f6',
  publishing: '#f59e0b',
  published: '#10b981',
  failed: '#ef4444',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/* ── Platform specs for preview ───────────────────────────── */

const PLATFORM_SPECS: Record<PublishPlatform, { maxTitle: number; maxDesc: number; aspect: string }> = {
  YouTube: { maxTitle: 100, maxDesc: 5000, aspect: '16:9' },
  TikTok: { maxTitle: 150, maxDesc: 2200, aspect: '9:16' },
  Instagram: { maxTitle: 0, maxDesc: 2200, aspect: '1:1 / 9:16' },
};

/* ── Helpers ───────────────────────────────────────────────── */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ── Main Component ───────────────────────────────────────── */

export function MultiPublisher() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const store = useMultiPublisherStore();

  const tabs = useMemo(() => [
    { key: 'publish' as const, label: t('multiPublisher.tab.publish') },
    { key: 'planner' as const, label: t('multiPublisher.tab.planner') },
  ], [t]);

  return (
    <ToolPageShell
      title={t('multiPublisher.title')}
      subtitle={t('multiPublisher.subtitle')}
      gradient={GRADIENT}
      badge="NEW"
    >
      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: C.surface, borderRadius: 10, padding: 4,
        border: `1px solid ${C.border}`,
      }}>
        {tabs.map((tab) => {
          const active = store.tab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => store.setTab(tab.key)}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 8,
                border: 'none', cursor: 'pointer',
                background: active ? `linear-gradient(135deg, ${GRADIENT[0]}20, ${GRADIENT[1]}20)` : 'transparent',
                color: active ? GRADIENT[0] : C.sub,
                fontWeight: active ? 700 : 500,
                fontSize: 14, fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {store.tab === 'publish' ? (
        <PublishTab C={C} t={t} />
      ) : (
        <PlannerTab C={C} t={t} />
      )}
    </ToolPageShell>
  );
}

/* ── Publish Tab ──────────────────────────────────────────── */

function PublishTab({ C, t }: { C: Theme; t: (k: string) => string }) {
  const store = useMultiPublisherStore();
  const [showSchedule, setShowSchedule] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error(t('multiPublisher.error.invalidVideo'));
      return;
    }
    if (file.size > 10 * 1024 * 1024 * 1024) {
      toast.error(t('multiPublisher.error.fileTooLarge'));
      return;
    }
    store.setVideoFile(file, file.name);
  }, [t, store]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      store.addTag(store.tagInput);
    }
  }, [store]);

  const canPublish = store.videoFile && store.title.trim() && store.platforms.length > 0;

  const handlePublish = useCallback(() => {
    if (!canPublish) return;
    const item = {
      id: uid(),
      title: store.title,
      platforms: [...store.platforms],
      scheduledDate: store.scheduledDate ?? new Date().toISOString(),
      status: (store.scheduledDate ? 'scheduled' : 'draft') as PublishStatus,
      createdAt: new Date().toISOString(),
    };
    store.addScheduled(item);
    toast.success(
      store.scheduledDate
        ? t('multiPublisher.scheduledSuccess')
        : t('multiPublisher.addedToDrafts'),
    );
    store.resetForm();
    setShowSchedule(false);
  }, [canPublish, store, t]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Video upload */}
      {!store.videoFile ? (
        <UploadArea
          C={C}
          accept="video/*"
          onFile={handleFile}
          label={t('multiPublisher.uploadVideo')}
        />
      ) : (
        <div style={{
          padding: 16, borderRadius: 12,
          background: C.surface, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10,
            background: `${GRADIENT[0]}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GRADIENT[0]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {store.videoName}
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
              {formatFileSize(store.videoFile.size)}
            </div>
          </div>
          <button
            onClick={() => store.setVideoFile(null)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: C.sub, padding: 6, borderRadius: 6,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Title */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6, display: 'block' }}>
          {t('multiPublisher.titleLabel')}
        </label>
        <input
          type="text"
          value={store.title}
          onChange={(e) => store.setTitle(e.target.value)}
          placeholder={t('multiPublisher.titlePlaceholder')}
          maxLength={200}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.surface,
            color: C.text, fontSize: 14, fontFamily: 'inherit',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Description */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6, display: 'block' }}>
          {t('multiPublisher.descriptionLabel')}
        </label>
        <textarea
          value={store.description}
          onChange={(e) => store.setDescription(e.target.value)}
          placeholder={t('multiPublisher.descriptionPlaceholder')}
          rows={4}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.surface,
            color: C.text, fontSize: 14, fontFamily: 'inherit',
            outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Tags */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6, display: 'block' }}>
          {t('multiPublisher.tagsLabel')}
        </label>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          padding: '8px 12px', borderRadius: 10,
          border: `1px solid ${C.border}`, background: C.surface,
          minHeight: 42, alignItems: 'center',
        }}>
          {store.tags.map((tag) => (
            <span key={tag} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 6,
              background: `${GRADIENT[0]}15`, color: GRADIENT[0],
              fontSize: 12, fontWeight: 600,
            }}>
              #{tag}
              <button
                onClick={() => store.removeTag(tag)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}
              >
                x
              </button>
            </span>
          ))}
          <input
            type="text"
            value={store.tagInput}
            onChange={(e) => store.setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={store.tags.length === 0 ? t('multiPublisher.tagsPlaceholder') : ''}
            style={{
              flex: 1, minWidth: 80, border: 'none', background: 'transparent',
              color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Platform selection */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
          {t('multiPublisher.selectPlatforms')}
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {PLATFORMS.map(({ id, color }) => {
            const active = store.platforms.includes(id);
            return (
              <button
                key={id}
                onClick={() => store.togglePlatform(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 10,
                  border: `2px solid ${active ? color : C.border}`,
                  background: active ? `${color}12` : C.surface,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                }}
              >
                <PlatformIcon platform={id} color={active ? color : C.dim} size={20} />
                <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? color : C.sub }}>
                  {id}
                </span>
                {active && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Platform adaptation preview */}
      {store.platforms.length > 0 && store.title.trim() && (
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
            {t('multiPublisher.adaptationPreview')}
          </label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {store.platforms.map((p) => {
              const spec = PLATFORM_SPECS[p];
              const plat = PLATFORMS.find((x) => x.id === p)!;
              const titleLen = store.title.length;
              const descLen = store.description.length;
              const titleOk = spec.maxTitle === 0 || titleLen <= spec.maxTitle;
              const descOk = descLen <= spec.maxDesc;
              return (
                <div key={p} style={{
                  flex: '1 1 220px', padding: 14, borderRadius: 12,
                  background: C.surface, border: `1px solid ${C.border}`,
                  minWidth: 200,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <PlatformIcon platform={p} color={plat.color} size={16} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p}</span>
                    <span style={{ fontSize: 11, color: C.dim, marginLeft: 'auto' }}>{spec.aspect}</span>
                  </div>
                  {spec.maxTitle > 0 && (
                    <div style={{ fontSize: 12, color: titleOk ? C.sub : '#ef4444', marginBottom: 4 }}>
                      {t('multiPublisher.titleLabel')}: {titleLen}/{spec.maxTitle} {!titleOk ? '!' : ''}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: descOk ? C.sub : '#ef4444' }}>
                    {t('multiPublisher.descriptionLabel')}: {descLen}/{spec.maxDesc} {!descOk ? '!' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Schedule toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => setShowSchedule(!showSchedule)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 8,
            border: `1px solid ${C.border}`, background: C.surface,
            color: showSchedule ? GRADIENT[0] : C.sub,
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {t('multiPublisher.schedule')}
        </button>
        {showSchedule && (
          <input
            type="datetime-local"
            value={store.scheduledDate?.slice(0, 16) ?? ''}
            onChange={(e) => store.setScheduledDate(e.target.value ? new Date(e.target.value).toISOString() : null)}
            style={{
              padding: '8px 12px', borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.surface,
              color: C.text, fontSize: 13, fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <ActionButton
          label={showSchedule && store.scheduledDate
            ? t('multiPublisher.scheduleBtn')
            : t('multiPublisher.publishNow')
          }
          gradient={GRADIENT}
          onClick={handlePublish}
          disabled={!canPublish}
        />
      </div>
    </div>
  );
}

/* ── Planner Tab ──────────────────────────────────────────── */

function PlannerTab({ C, t }: { C: Theme; t: (k: string) => string }) {
  const store = useMultiPublisherStore();

  const daysInMonth = new Date(store.calendarYear, store.calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(store.calendarYear, store.calendarMonth, 1).getDay();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDayOfWeek, daysInMonth]);

  const scheduledByDate = useMemo(() => {
    const map: Record<string, typeof store.scheduled> = {};
    for (const item of store.scheduled) {
      const d = new Date(item.scheduledDate);
      if (d.getMonth() === store.calendarMonth && d.getFullYear() === store.calendarYear) {
        const key = d.getDate().toString();
        if (!map[key]) map[key] = [];
        map[key].push(item);
      }
    }
    return map;
  }, [store.scheduled, store.calendarMonth, store.calendarYear]);

  const prevMonth = () => {
    if (store.calendarMonth === 0) {
      store.setCalendarMonth(11);
      store.setCalendarYear(store.calendarYear - 1);
    } else {
      store.setCalendarMonth(store.calendarMonth - 1);
    }
  };

  const nextMonth = () => {
    if (store.calendarMonth === 11) {
      store.setCalendarMonth(0);
      store.setCalendarYear(store.calendarYear + 1);
    } else {
      store.setCalendarMonth(store.calendarMonth + 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Calendar header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={prevMonth} style={navBtnStyle(C)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
          {MONTH_NAMES[store.calendarMonth]} {store.calendarYear}
        </span>
        <button onClick={nextMonth} style={navBtnStyle(C)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2,
      }}>
        {DAY_NAMES.map((d) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 700,
            color: C.dim, padding: '6px 0',
          }}>
            {d}
          </div>
        ))}
        {calendarDays.map((day, i) => {
          const items = day ? scheduledByDate[day.toString()] : null;
          const isToday = day === new Date().getDate()
            && store.calendarMonth === new Date().getMonth()
            && store.calendarYear === new Date().getFullYear();
          return (
            <div key={i} style={{
              minHeight: 64, padding: 4, borderRadius: 8,
              background: day ? C.surface : 'transparent',
              border: isToday ? `2px solid ${GRADIENT[0]}` : `1px solid ${day ? C.border : 'transparent'}`,
            }}>
              {day && (
                <>
                  <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? GRADIENT[0] : C.sub, marginBottom: 2 }}>
                    {day}
                  </div>
                  {items?.map((item) => (
                    <div key={item.id} style={{
                      fontSize: 10, padding: '2px 4px', borderRadius: 4,
                      background: `${STATUS_COLORS[item.status]}20`,
                      color: STATUS_COLORS[item.status],
                      fontWeight: 600, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginBottom: 2,
                    }}>
                      {item.title}
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Scheduled list */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 12 }}>
          {t('multiPublisher.scheduledList')}
        </h3>
        {store.scheduled.length === 0 ? (
          <div style={{
            padding: '32px 16px', textAlign: 'center',
            borderRadius: 12, border: `1px dashed ${C.border}`,
            color: C.dim, fontSize: 13,
          }}>
            {t('multiPublisher.noScheduled')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {store.scheduled.map((item) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 10,
                background: C.surface, border: `1px solid ${C.border}`,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    {item.platforms.map((p) => {
                      const plat = PLATFORMS.find((x) => x.id === p);
                      return (
                        <span key={p} style={{ fontSize: 11, color: plat?.color ?? C.sub, fontWeight: 600 }}>
                          {p}
                        </span>
                      );
                    })}
                    <span style={{ fontSize: 11, color: C.dim }}>
                      {new Date(item.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 6,
                  fontSize: 11, fontWeight: 700,
                  background: `${STATUS_COLORS[item.status]}20`,
                  color: STATUS_COLORS[item.status],
                }}>
                  {t(`multiPublisher.status.${item.status}`)}
                </span>
                <button
                  onClick={() => store.removeScheduled(item.id)}
                  style={{
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', color: C.dim, padding: 4,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Platform Icons ───────────────────────────────────────── */

function PlatformIcon({ platform, color, size = 20 }: { platform: PublishPlatform; color: string; size?: number }) {
  if (platform === 'YouTube') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (platform === 'TikTok') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.86a8.28 8.28 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.27z" />
      </svg>
    );
  }
  // Instagram
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill={color} stroke="none" />
    </svg>
  );
}

/* ── Style helpers ────────────────────────────────────────── */

function navBtnStyle(C: Theme): React.CSSProperties {
  return {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 8, width: 32, height: 32,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: C.sub,
  };
}
