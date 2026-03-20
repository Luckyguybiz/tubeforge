'use client';

import { useMemo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useActivityStore, type ActivityEntry } from '@/stores/useActivityStore';

/* ═══════════════════════════════════════════════════════════════════
   Activity Panel

   Shows a chronological list of recent user actions on the project.
   ═══════════════════════════════════════════════════════════════════ */

const ACTIVITY_ICONS: Record<ActivityEntry['type'], string> = {
  scene_add: '+',
  scene_delete: '\u2715',
  scene_edit: '\u270E',
  scene_duplicate: '\u2398',
  description_edit: '\u270E',
  title_edit: 'T',
  version_save: '\u2B07',
  comment_add: '\u{1F4AC}',
  project_share: '\u{1F517}',
  scene_reorder: '\u2195',
  scene_generate: '\u25B6',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function ActivityPanel() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const activities = useActivityStore((s) => s.activities);
  const clearActivities = useActivityStore((s) => s.clearActivities);

  // Show newest first
  const sorted = useMemo(() => [...activities].reverse(), [activities]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          {t('collab.activity')} ({sorted.length})
        </span>
        {sorted.length > 0 && (
          <button
            onClick={clearActivities}
            style={{
              fontSize: 9,
              padding: '2px 8px',
              borderRadius: 4,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.dim,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 500,
            }}
          >
            {t('collab.clearAll')}
          </button>
        )}
      </div>

      {/* Activity list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 6,
        }}
      >
        {sorted.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px 10px',
              color: C.dim,
              fontSize: 11,
              textAlign: 'center',
            }}
          >
            {t('collab.noActivity')}
          </div>
        ) : (
          sorted.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '5px 4px',
                borderBottom: `1px solid ${C.border}08`,
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  color: C.sub,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {ACTIVITY_ICONS[entry.type] || '\u2022'}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: C.text,
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                  }}
                >
                  {entry.label}
                </div>
              </div>

              {/* Timestamp */}
              <span
                style={{
                  fontSize: 8,
                  color: C.dim,
                  flexShrink: 0,
                  marginTop: 2,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {timeAgo(entry.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
