'use client';

import { useCallback, useMemo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useVersionStore, type VersionSnapshot } from '@/stores/useVersionStore';

/* ═══════════════════════════════════════════════════════════════════
   Version History Modal

   Shows a list of saved version snapshots.
   Each version shows timestamp + scene count.
   User can restore any version.
   ═══════════════════════════════════════════════════════════════════ */

interface VersionHistoryModalProps {
  onClose: () => void;
  onRestore: (scenes: unknown[], chars: unknown[]) => void;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function VersionHistoryModal({ onClose, onRestore }: VersionHistoryModalProps) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const versions = useVersionStore((s) => s.versions);
  const deleteVersion = useVersionStore((s) => s.deleteVersion);
  const clearVersions = useVersionStore((s) => s.clearVersions);

  // Show newest first
  const sortedVersions = useMemo(() => [...versions].reverse(), [versions]);

  const handleRestore = useCallback(
    (v: VersionSnapshot) => {
      try {
        const scenes = JSON.parse(v.scenesJson);
        const chars = JSON.parse(v.charsJson);
        onRestore(scenes, chars);
        onClose();
      } catch {
        // Failed to parse — version is corrupt
      }
    },
    [onRestore, onClose],
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: C.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          width: '100%',
          maxWidth: 480,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,.4)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
            {t('collab.versionHistory')}
          </h3>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {versions.length > 0 && (
              <button
                onClick={clearVersions}
                style={{
                  fontSize: 10,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: 'transparent',
                  color: C.accent,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                }}
              >
                {t('collab.clearAll')}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: 'transparent',
                color: C.sub,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'inherit',
                fontSize: 14,
              }}
            >
              &#10005;
            </button>
          </div>
        </div>

        {/* Version list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {sortedVersions.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                color: C.dim,
                fontSize: 12,
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>&#128196;</div>
              {t('collab.noVersions')}
            </div>
          ) : (
            sortedVersions.map((v, idx) => (
              <div
                key={v.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.borderActive; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
              >
                {/* Version number circle */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: idx === 0 ? `${C.accent}15` : C.card,
                    border: `1px solid ${idx === 0 ? C.accent + '33' : C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: idx === 0 ? C.accent : C.sub,
                    flexShrink: 0,
                  }}
                >
                  {versions.length - idx}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                    {v.label}
                  </div>
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>
                    {formatTimestamp(v.timestamp)} &middot; {v.sceneCount} {v.sceneCount === 1 ? 'scene' : 'scenes'}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => handleRestore(v)}
                    title={t('collab.restore')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      border: 'none',
                      background: C.accent,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t('collab.restore')}
                  </button>
                  <button
                    onClick={() => deleteVersion(v.id)}
                    title={t('collab.delete')}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: `1px solid ${C.border}`,
                      background: 'transparent',
                      color: C.dim,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'inherit',
                      fontSize: 11,
                    }}
                  >
                    &#10005;
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
