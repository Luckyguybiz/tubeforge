'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useEditorStore, MUSIC_TRACKS } from '@/stores/useEditorStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ProjectPicker } from '@/components/ui/ProjectPicker';
import { OnlineUsers } from '@/components/ui/OnlineUsers';
import { SceneLockIndicator } from '@/components/ui/SceneLockIndicator';
import { MODELS } from '@/lib/constants';
import { fmtDur, pluralRu } from '@/lib/utils';
import { useProjectSync } from '@/hooks/useProjectSync';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { useCollaboration, useSceneEditLock } from '@/hooks/useCollaboration';
import { useUndoHint } from '@/hooks/useUndoHint';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { Theme, Scene, TransitionType } from '@/lib/types';
import { trackEvent } from '@/lib/analytics-events';

/* ═══════════════════════════════════════════════════════════════════
   STATUS BADGE CONFIG
   ═══════════════════════════════════════════════════════════════════ */
const STATUS_CFG: Record<string, { labelKey: string; colorKey: string }> = {
  empty:      { labelKey: 'editor.status.empty',      colorKey: 'dim' },
  editing:    { labelKey: 'editor.status.editing',    colorKey: 'blue' },
  generating: { labelKey: 'editor.status.generating', colorKey: 'orange' },
  ready:      { labelKey: 'editor.status.ready',      colorKey: 'green' },
  error:      { labelKey: 'editor.status.error',      colorKey: 'accent' },
};

function getStatusColor(status: string, C: Theme): string {
  const cfg = STATUS_CFG[status] || STATUS_CFG.empty;
  return (C[cfg.colorKey as keyof Theme] as string) || C.dim;
}

/* ═══════════════════════════════════════════════════════════════════
   TINY STATUS DOT
   ═══════════════════════════════════════════════════════════════════ */
function StatusDot({ status, C, size = 6 }: { status: string; C: Theme; size?: number }) {
  const col = getStatusColor(status, C);
  if (status === 'generating') {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `1.5px solid ${col}44`,
          borderTopColor: col,
          animation: 'spin .8s linear infinite',
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
    );
  }
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: col,
        flexShrink: 0,
        display: 'inline-block',
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FRAME UPLOAD SLOT — Start / End frame for a scene
   ═══════════════════════════════════════════════════════════════════ */
interface FrameSlotProps {
  label: string;
  value: string | null;
  C: Theme;
  accentCol: string;
  onChange: (dataUrl: string | null) => void;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

function FrameSlot({ label, value, C, accentCol, onChange }: FrameSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);

      // Validate file type
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError(useLocaleStore.getState().t('editor.frame.invalidFormat'));
        e.target.value = '';
        return;
      }

      // Validate file size
      if (file.size > MAX_IMAGE_SIZE) {
        setError(useLocaleStore.getState().t('editor.frame.maxSize'));
        e.target.value = '';
        return;
      }

      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = () => {
        onChange(reader.result as string);
        setIsLoading(false);
      };
      reader.onerror = () => {
        setError(useLocaleStore.getState().t('editor.frame.readError'));
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
      // Reset so same file can be re-selected
      e.target.value = '';
    },
    [onChange],
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        width: 120,
        maxWidth: '100%',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 600, color: C.sub, textTransform: 'uppercase', letterSpacing: '.03em' }}>
        {label}
      </span>
      <div
        style={{
          width: 112,
          maxWidth: '100%',
          height: 72,
          borderRadius: 8,
          border: value ? `1.5px solid ${accentCol}30` : `1.5px dashed ${C.border}`,
          background: value ? 'transparent' : C.card,
          position: 'relative',
          cursor: 'pointer',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color .15s, background .15s',
        }}
        onClick={() => {
          if (!value && !isLoading) inputRef.current?.click();
        }}
        onMouseEnter={(e) => {
          if (!value) {
            (e.currentTarget as HTMLElement).style.borderColor = accentCol + '55';
            (e.currentTarget as HTMLElement).style.background = accentCol + '06';
          }
        }}
        onMouseLeave={(e) => {
          if (!value) {
            (e.currentTarget as HTMLElement).style.borderColor = C.border;
            (e.currentTarget as HTMLElement).style.background = C.card;
          }
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: `2px solid ${accentCol}33`,
                borderTopColor: accentCol,
                animation: 'spin .8s linear infinite',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 8, color: C.dim, fontWeight: 500 }}>{useLocaleStore.getState().t('editor.frame.loading')}</span>
          </div>
        ) : value ? (
          <>
            <img
              src={value}
              alt={label}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 6,
              }}
            />
            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setError(null);
              }}
              style={{
                position: 'absolute',
                top: 3,
                right: 3,
                width: 18,
                height: 18,
                borderRadius: 5,
                border: 'none',
                background: 'rgba(0,0,0,.55)',
                color: '#fff',
                fontSize: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'inherit',
                lineHeight: 1,
                backdropFilter: 'blur(4px)',
                transition: 'background .15s',
              }}
              title={useLocaleStore.getState().t('editor.frame.remove')}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,50,50,.75)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,.55)'; }}
            >
              &#10005;
            </button>
            {/* Replace button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              style={{
                position: 'absolute',
                bottom: 3,
                right: 3,
                width: 18,
                height: 18,
                borderRadius: 5,
                border: 'none',
                background: 'rgba(0,0,0,.45)',
                color: '#fff',
                fontSize: 9,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'inherit',
                lineHeight: 1,
                backdropFilter: 'blur(4px)',
                transition: 'background .15s',
              }}
              title={useLocaleStore.getState().t('editor.frame.replace')}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,.7)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,.45)'; }}
            >
              &#8635;
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 22, color: error ? C.accent : C.dim, lineHeight: 1 }}>{error ? '!' : '+'}</span>
            <span style={{ fontSize: 8, color: error ? C.accent : C.dim, fontWeight: 500 }}>{error || useLocaleStore.getState().t('editor.frame.upload')}</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SKELETON LOADERS
   ═══════════════════════════════════════════════════════════════════ */
function EditorSkeleton({ C }: { C: Theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel skeleton */}
        <div style={{ width: 200, flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, padding: '12px 8px' }}>
          <Skeleton width="60%" height={14} />
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} width="100%" height={56} style={{ borderRadius: 10 }} />
            ))}
          </div>
        </div>
        {/* Center skeleton */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, padding: 24 }}>
          <Skeleton width="80%" height={0} style={{ borderRadius: 12, aspectRatio: '16/9', maxWidth: 640, paddingBottom: '45%' }} />
          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            <Skeleton width={36} height={36} rounded />
            <Skeleton width={100} height={36} style={{ borderRadius: 8 }} />
          </div>
        </div>
      </div>
      {/* Timeline skeleton */}
      <div style={{ height: 52, background: C.surface, borderTop: `1px solid ${C.border}`, padding: '8px 16px' }}>
        <Skeleton width="100%" height={36} style={{ borderRadius: 8 }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE THUMBNAIL CARD — Left panel (memoized)
   ═══════════════════════════════════════════════════════════════════ */

interface SceneThumbProps {
  scene: Scene;
  idx: number;
  C: Theme;
  isSel: boolean;
  isDragOver: boolean;
  isDragging: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDragEnd: () => void;
}

const SceneThumb = memo(function SceneThumb({
  scene: sc,
  idx,
  C,
  isSel,
  isDragOver,
  isDragging,
  onSelect,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: SceneThumbProps) {
  const col = getStatusColor(sc.status, C) !== C.dim
    ? getStatusColor(sc.status, C)
    : (C[sc.ck as keyof Theme] as string || C.accent);

  return (
    <div
      className="scene-thumb"
      draggable
      onDragStart={() => onDragStart(sc.id)}
      onDragEnter={() => onDragEnter(sc.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => onSelect(sc.id)}
      style={{
        borderRadius: 10,
        background: isSel ? col + '14' : C.card,
        border: `1.5px solid ${isDragOver ? col + '66' : isSel ? col + '40' : sc.status === 'error' ? col + '50' : 'transparent'}`,
        cursor: 'pointer',
        transition: 'all .15s',
        opacity: isDragging ? 0.4 : 1,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Drop indicator line */}
      {isDragOver && (
        <div style={{ position: 'absolute', top: -2, left: 4, right: 4, height: 3, borderRadius: 2, background: col, zIndex: 5 }} />
      )}

      {/* Color thumbnail area */}
      <div
        style={{
          height: 32,
          background: sc.status === 'ready'
            ? `linear-gradient(135deg, ${col}20, ${col}08)`
            : `linear-gradient(135deg, ${col}12, transparent)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Drag handle icon */}
        <span
          className="scene-drag-handle"
          style={{
            position: 'absolute',
            top: 2,
            left: 4,
            fontSize: 10,
            color: C.dim,
            cursor: 'grab',
            opacity: 0.4,
            lineHeight: 1,
            userSelect: 'none',
          }}
          title={useLocaleStore.getState().t('editor.dragHandle')}
        >
          &#8801;
        </span>

        {sc.status === 'ready' ? (
          <span style={{ fontSize: 14, color: col, opacity: 0.7 }}>&#9654;</span>
        ) : sc.status === 'generating' ? (
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: `2px solid ${col}33`,
              borderTopColor: col,
              animation: 'spin .8s linear infinite',
            }}
          />
        ) : sc.status === 'error' ? (
          <span style={{ fontSize: 14, color: col, fontWeight: 700 }}>!</span>
        ) : (
          <span style={{ fontSize: 12, color: C.dim, opacity: 0.5 }}>
            {String(idx + 1).padStart(2, '0')}
          </span>
        )}
        {/* Duration badge */}
        <span
          style={{
            position: 'absolute',
            bottom: 3,
            right: 4,
            fontSize: 8,
            fontWeight: 600,
            color: C.sub,
            fontFamily: "'JetBrains Mono', monospace",
            background: C.card + 'cc',
            padding: '1px 4px',
            borderRadius: 4,
          }}
        >
          {fmtDur(sc.duration)}
        </span>
      </div>

      {/* Scene info */}
      <div style={{ padding: '3px 6px 4px', display: 'flex', alignItems: 'center', gap: 3 }}>
        <StatusDot status={sc.status} C={C} size={5} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: isSel ? C.text : C.sub,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}
        >
          {sc.label}
        </span>
        <SceneLockIndicator sceneId={sc.id} />
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   TRANSITION PICKER — small dropdown between scene cards
   ═══════════════════════════════════════════════════════════════════ */
const TRANSITION_OPTIONS: { value: TransitionType; labelKey: string }[] = [
  { value: 'none', labelKey: 'editor.transition.none' },
  { value: 'fade', labelKey: 'editor.transition.fade' },
  { value: 'slide', labelKey: 'editor.transition.slide' },
  { value: 'zoom', labelKey: 'editor.transition.zoom' },
];

function TransitionPicker({ sceneId, current, C, onChange }: { sceneId: string; current: TransitionType; C: Theme; onChange: (id: string, v: TransitionType) => void }) {
  const tFn = useLocaleStore.getState().t;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: 18, margin: '-2px 0' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          fontSize: 8,
          color: current !== 'none' ? C.accent : C.dim,
          background: 'transparent',
          border: `1px solid ${current !== 'none' ? C.accent + '40' : C.border}`,
          borderRadius: 4,
          padding: '1px 6px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: 500,
          transition: 'all .15s',
          whiteSpace: 'nowrap',
        }}
        title={tFn('editor.transition.label')}
      >
        {current !== 'none' ? tFn(`editor.transition.${current}`) : '+ ' + tFn('editor.transition.label').toLowerCase()}
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: 2,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 6,
          padding: 2,
          zIndex: 30,
          boxShadow: '0 4px 16px rgba(0,0,0,.25)',
          minWidth: 90,
        }}>
          {TRANSITION_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              onClick={() => { onChange(sceneId, opt.value); setOpen(false); }}
              style={{
                padding: '4px 8px',
                fontSize: 9,
                fontWeight: opt.value === current ? 600 : 400,
                color: opt.value === current ? C.accent : C.text,
                cursor: 'pointer',
                borderRadius: 4,
                background: opt.value === current ? C.accent + '10' : 'transparent',
                transition: 'background .1s',
              }}
              onMouseEnter={(e) => { if (opt.value !== current) (e.currentTarget as HTMLElement).style.background = C.cardHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = opt.value === current ? C.accent + '10' : 'transparent'; }}
            >
              {tFn(opt.labelKey)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE SETTINGS POPOVER — appears when clicking settings on selected scene
   ═══════════════════════════════════════════════════════════════════ */
interface SceneSettingsProps {
  scene: Scene;
  C: Theme;
  onUpdate: (id: string, patch: Partial<Scene>) => void;
  onClose: () => void;
  modelsOpen: boolean;
  setModelsOpen: (v: boolean) => void;
}

function SceneSettingsPopover({ scene: sc, C, onUpdate, onClose, modelsOpen, setModelsOpen }: SceneSettingsProps) {
  const gc = (k: string) => (C[k as keyof Theme] as string) || C.accent;
  const col = gc(sc.ck);
  const selMod = MODELS.find((m) => m.id === sc.model) || MODELS[1];
  const modDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modelsOpen) return;
    const handler = (e: MouseEvent) => {
      if (modDropRef.current && !modDropRef.current.contains(e.target as Node)) {
        setModelsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [modelsOpen, setModelsOpen]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 0,
        left: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : 168,
        width: 280,
        maxWidth: 'calc(100vw - 32px)',
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        boxShadow: '0 12px 40px rgba(0,0,0,.35)',
        zIndex: 50,
        overflow: 'visible',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>
          {useLocaleStore.getState().t('editor.settingsTitle')}
        </span>
        <button
          onClick={onClose}
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: C.sub,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'inherit',
            transition: 'all .15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.cardHover; (e.currentTarget as HTMLElement).style.color = C.text; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.sub; }}
        >
          &#10005;
        </button>
      </div>

      <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Scene name */}
        <div>
          <label style={compactLabelStyle(C)}>{useLocaleStore.getState().t('editor.settingsName')}</label>
          <input
            value={sc.label}
            maxLength={100}
            onChange={(e) => onUpdate(sc.id, { label: e.target.value })}
            style={compactInputStyle(C)}
          />
        </div>

        {/* Model selector */}
        <div>
          <label style={compactLabelStyle(C)}>{useLocaleStore.getState().t('editor.settingsModel')}</label>
          <div style={{ position: 'relative' }} ref={modDropRef}>
            <button
              onClick={() => setModelsOpen(!modelsOpen)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 8,
                border: `1px solid ${modelsOpen ? C.accent + '55' : C.border}`,
                background: C.surface,
                color: C.text,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'inherit',
                textAlign: 'left',
                boxSizing: 'border-box',
                transition: 'border-color .15s',
              }}
            >
              <span style={{ fontSize: 12 }}>{selMod.icon}</span>
              <span style={{ flex: 1 }}>{selMod.name}</span>
              <span style={{ fontSize: 7, color: C.dim, transform: modelsOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>&#9660;</span>
            </button>

            {modelsOpen && (
              <div
                role="listbox"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 3,
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: 3,
                  zIndex: 60,
                  boxShadow: '0 8px 24px rgba(0,0,0,.3)',
                }}
              >
                {MODELS.map((m) => (
                  <div
                    key={m.id}
                    role="option"
                    tabIndex={0}
                    aria-selected={m.id === sc.model}
                    onClick={() => { onUpdate(sc.id, { model: m.id }); setModelsOpen(false); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onUpdate(sc.id, { model: m.id }); setModelsOpen(false); }
                    }}
                    style={{
                      padding: '7px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: m.id === sc.model ? C.accent + '10' : 'transparent',
                      transition: 'background .1s',
                    }}
                    onMouseEnter={(e) => {
                      if (m.id !== sc.model) (e.currentTarget as HTMLElement).style.background = C.cardHover;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = m.id === sc.model ? C.accent + '10' : 'transparent';
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{m.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: m.id === sc.model ? C.accent : C.text }}>{m.name}</div>
                      <div style={{ fontSize: 9, color: C.sub }}>{m.desc} · {m.speed}</div>
                    </div>
                    {m.id === sc.model && (
                      <span style={{ fontSize: 10, color: C.accent, fontWeight: 700 }}>&#10003;</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Duration slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label style={{ ...compactLabelStyle(C), marginBottom: 0 }}>{useLocaleStore.getState().t('editor.settingsDuration')}</label>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: col }}>
              {sc.duration}{useLocaleStore.getState().t('editor.sec')}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={sc.duration}
            onChange={(e) => onUpdate(sc.id, { duration: Number(e.target.value) })}
            style={{ width: '100%', accentColor: col, cursor: 'pointer', height: 4 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: C.dim, marginTop: 1 }}>
            <span>1{useLocaleStore.getState().t('editor.sec')}</span>
            <span>30{useLocaleStore.getState().t('editor.sec')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN EDITOR PAGE
   ═══════════════════════════════════════════════════════════════════ */
export function EditorPage({ projectId = null }: { projectId?: string | null }) {
  const sync = useProjectSync(projectId);
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  const scenes = useEditorStore((s) => s.scenes);
  const selId = useEditorStore((s) => s.selId);
  const setSelId = useEditorStore((s) => s.setSelId);
  const dragId = useEditorStore((s) => s.dragId);
  const setDragId = useEditorStore((s) => s.setDragId);
  const dragOv = useEditorStore((s) => s.dragOv);
  const setDragOv = useEditorStore((s) => s.setDragOv);
  const confirmDel = useEditorStore((s) => s.confirmDel);
  const setConfirmDel = useEditorStore((s) => s.setConfirmDel);
  const saveStatus = useEditorStore((s) => s.saveStatus);
  const autoSaveDirty = useEditorStore((s) => s.autoSaveDirty);
  const musicTrackId = useEditorStore((s) => s.musicTrackId);
  const musicVolume = useEditorStore((s) => s.musicVolume);

  // Real-time collaboration
  useCollaboration(projectId);
  useSceneEditLock(selId);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [modPick, setModPick] = useState(false);
  const [scenePanelOpen, setScenePanelOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicDropOpen, setMusicDropOpen] = useState(false);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicDropRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const sceneListRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const savedRef = useRef(false);

  // Video generation hook for selected scene
  const videoGen = useVideoGeneration(selId);

  // Auto-save: listen for custom event dispatched by store timer
  useEffect(() => {
    if (!projectId) return;
    const handler = () => {
      // Trigger a full save of the current project state
      const store = useEditorStore.getState();
      store.scenes.forEach((sc) => {
        sync.updateScene(sc.id, { prompt: sc.prompt, label: sc.label, duration: sc.duration });
      });
    };
    window.addEventListener('tf-autosave', handler);
    return () => {
      window.removeEventListener('tf-autosave', handler);
      useEditorStore.getState().clearAutoSaveTimer();
    };
  }, [projectId, sync]);

  // Background music playback
  useEffect(() => {
    if (!musicTrackId) {
      if (musicAudioRef.current) { musicAudioRef.current.pause(); musicAudioRef.current = null; }
      return;
    }
    const track = MUSIC_TRACKS.find((t) => t.id === musicTrackId);
    if (!track) return;
    if (!musicAudioRef.current || musicAudioRef.current.src !== track.url) {
      if (musicAudioRef.current) musicAudioRef.current.pause();
      const audio = new Audio(track.url);
      audio.loop = true;
      audio.volume = musicVolume / 100;
      audio.play().catch(() => {/* autoplay blocked — user interaction required */});
      musicAudioRef.current = audio;
    } else {
      musicAudioRef.current.volume = musicVolume / 100;
    }
    return () => {
      // Don't stop on re-render, only on unmount
    };
  }, [musicTrackId, musicVolume]);

  // Cleanup music on unmount
  useEffect(() => {
    return () => {
      if (musicAudioRef.current) { musicAudioRef.current.pause(); musicAudioRef.current = null; }
    };
  }, []);

  // Close music dropdown on outside click
  useEffect(() => {
    if (!musicDropOpen) return;
    const handler = (e: MouseEvent) => {
      if (musicDropRef.current && !musicDropRef.current.contains(e.target as Node)) setMusicDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [musicDropOpen]);

  // Focus title input when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  // Close settings when selection changes
  useEffect(() => {
    setShowSettings(false);
    setModPick(false);
  }, [selId]);

  // Sync wrappers
  const updScene = useCallback((id: string, patch: Partial<Scene>) => {
    if (projectId) { sync.updateScene(id, patch); } else { useEditorStore.getState().updScene(id, patch); }
    useEditorStore.getState().markDirty();
  }, [projectId, sync]);

  const addScene = useCallback((afterId?: string) => {
    if (projectId) { sync.addScene(afterId); } else { useEditorStore.getState().addScene(afterId); }
  }, [projectId, sync]);

  const delScene = useCallback((id: string) => {
    if (projectId) { sync.deleteScene(id); } else { useEditorStore.getState().delScene(id); }
  }, [projectId, sync]);

  const dupScene = useCallback((id: string) => {
    if (projectId) { sync.duplicateScene(id); } else { useEditorStore.getState().dupScene(id); }
  }, [projectId, sync]);

  const reorderScenes = useCallback((fromId: string, toId: string) => {
    if (projectId) { sync.reorder(fromId, toId); } else { useEditorStore.getState().reorderScenes(fromId, toId); }
  }, [projectId, sync]);

  const handleTransitionChange = useCallback((sceneId: string, transition: TransitionType) => {
    useEditorStore.getState().setTransition(sceneId, transition);
    if (projectId) { sync.updateScene(sceneId, { transition } as Partial<Scene>); }
  }, [projectId, sync]);

  const handleGenerate = useCallback(() => {
    const store = useEditorStore.getState();
    const currentSel = store.scenes.find((s) => s.id === store.selId);
    if (!currentSel || !currentSel.prompt.trim() || videoGen.isGenerating) return;
    trackEvent('video_generate', { model: currentSel.model, duration: currentSel.duration });
    videoGen.start(currentSel.prompt, currentSel.model, currentSel.duration);
  }, [videoGen]);

  // Keyboard shortcut: Ctrl+Enter to generate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleGenerate]);

  // Undo / Redo keyboard shortcuts
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const historyLen = useEditorStore((s) => s.historyCount);
  const futureLen = useEditorStore((s) => s.futureCount);
  useUndoHint(historyLen);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const es = useEditorStore.getState();
        if (es.historyCount > 0) {
          es.undo();
          useNotificationStore.getState().addToast('info', useLocaleStore.getState().t('editor.actionUndone'), 1500);
        }
      }
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        const es = useEditorStore.getState();
        if (es.futureCount > 0) {
          es.redo();
          useNotificationStore.getState().addToast('info', useLocaleStore.getState().t('editor.actionRedone'), 1500);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Dismiss delete confirmation with Escape key
  useEffect(() => {
    if (!confirmDel) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConfirmDel(null);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [confirmDel, setConfirmDel]);

  // Project title edit handlers
  const startEditTitle = useCallback(() => {
    if (!sync.project) return;
    savedRef.current = false;
    setTitleDraft(sync.project.title || '');
    setEditingTitle(true);
  }, [sync.project]);

  const saveTitle = useCallback(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    if (!projectId || !titleDraft.trim()) {
      setEditingTitle(false);
      return;
    }
    sync.updateProjectTitle?.(titleDraft.trim());
    setEditingTitle(false);
  }, [projectId, titleDraft, sync]);

  /* --- Scene card callbacks (stable refs for memo) --- */
  const handleSceneSelect = useCallback((id: string) => {
    useEditorStore.getState().setSelId(id);
  }, []);

  const handleSceneDragStart = useCallback((id: string) => {
    useEditorStore.getState().setDragId(id);
  }, []);

  const handleSceneDragEnter = useCallback((id: string) => {
    const d = useEditorStore.getState().dragId;
    if (d && id !== d) useEditorStore.getState().setDragOv(id);
  }, []);

  const handleSceneDragEnd = useCallback(() => {
    const { dragId: d, dragOv: ov } = useEditorStore.getState();
    if (d && ov) reorderScenes(d, ov);
    useEditorStore.getState().setDragId(null);
    useEditorStore.getState().setDragOv(null);
  }, [reorderScenes]);

  const handleSceneRequestDelete = useCallback((id: string) => {
    useEditorStore.getState().setConfirmDel(id);
  }, []);

  const handleSceneConfirmDelete = useCallback((id: string) => {
    delScene(id);
    useEditorStore.getState().setConfirmDel(null);
  }, [delScene]);

  const handleSceneCancelDelete = useCallback(() => {
    useEditorStore.getState().setConfirmDel(null);
  }, []);

  // Auto-resize prompt textarea
  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    const maxH = 96; // matches maxHeight on the textarea
    const sh = el.scrollHeight;
    el.style.height = Math.min(sh, maxH) + 'px';
    el.style.overflowY = sh > maxH ? 'auto' : 'hidden';
  }, []);

  /* --- Computed (memoized) --- */
  const gc = useCallback((k: string) => (C[k as keyof Theme] as string) || C.accent, [C]);
  const sel = useMemo(() => scenes.find((s) => s.id === selId), [scenes, selId]);
  const totalDur = useMemo(() => scenes.reduce((a, s) => a + s.duration, 0), [scenes]);

  const isGenerating = videoGen.isGenerating;
  const progress = videoGen.progress;
  const lastError = videoGen.lastError;

  /* ═══════════════════════════════════════════════════════════════
     NO PROJECT — Project picker
     ═══════════════════════════════════════════════════════════════ */
  if (!projectId) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <ProjectPicker target="/editor" title={t('editor.title')} />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     LOADING STATE
     ═══════════════════════════════════════════════════════════════ */
  if (sync.isLoading) {
    return <EditorSkeleton C={C} />;
  }

  /* ═══════════════════════════════════════════════════════════════
     ERROR STATE
     ═══════════════════════════════════════════════════════════════ */
  if (sync.isError) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accent + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: C.accent }}>!</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{t('editor.loadError')}</div>
          <div style={{ fontSize: 12, color: C.sub, textAlign: 'center', maxWidth: 280 }}>{t('editor.loadErrorHint')}</div>
          <button
            onClick={() => sync.refetch()}
            style={{
              marginTop: 4,
              padding: '9px 24px',
              borderRadius: 10,
              border: 'none',
              background: C.accent,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {t('editor.retry')}
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════════════════════ */
  const selCol = sel ? gc(sel.ck) : C.accent;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: C.bg }}>

      {/* ── Top bar ── */}
      <div
        className="tf-editor-topbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
          minHeight: 42,
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        {/* Project title */}
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            maxLength={100}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              border: `1.5px solid ${C.accent}55`,
              background: C.card,
              color: C.text,
              fontSize: 13,
              fontWeight: 700,
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              width: 200,
            }}
          />
        ) : (
          <div
            onClick={startEditTitle}
            title={t('editor.clickToEdit')}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.text,
              cursor: 'pointer',
              padding: '3px 8px',
              borderRadius: 6,
              transition: 'background .15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 200,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.card; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {sync.project?.title || t('editor.untitled')}
          </div>
        )}

        {/* Scene panel toggle (useful on mobile) */}
        <button
          onClick={() => setScenePanelOpen((v) => !v)}
          title={scenePanelOpen ? t('editor.hideScenes') : t('editor.showScenes')}
          aria-label={scenePanelOpen ? t('editor.hideScenes') : t('editor.showScenes')}
          style={{
            width: 44,
            height: 44,
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            background: 'transparent',
            color: C.sub,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'inherit',
            transition: 'all .15s',
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {scenePanelOpen
              ? <><line x1="3" y1="3" x2="3" y2="21" /><line x1="9" y1="3" x2="9" y2="21" /><polyline points="15 8 19 12 15 16" /></>
              : <><line x1="3" y1="3" x2="3" y2="21" /><line x1="9" y1="3" x2="9" y2="21" /><polyline points="19 8 15 12 19 16" /></>}
          </svg>
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: C.border }} />

        {/* Scene count + total duration */}
        <span style={{ fontSize: 10, color: C.sub, fontWeight: 500 }}>
          {pluralRu(scenes.length, t('editor.scene.one'), t('editor.scene.few'), t('editor.scene.many'))} · {fmtDur(totalDur)}
        </span>

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: C.border }} />

        {/* Total duration badge */}
        <span style={{ fontSize: 9, color: C.dim, fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" }}>
          {t('editor.totalDuration')}: {fmtDur(totalDur)}
        </span>

        {/* Background music dropdown */}
        <div ref={musicDropRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMusicDropOpen(!musicDropOpen)}
            style={{
              fontSize: 10,
              padding: '4px 8px',
              borderRadius: 6,
              border: `1px solid ${musicTrackId ? C.accent + '55' : C.border}`,
              background: musicTrackId ? C.accent + '08' : 'transparent',
              color: musicTrackId ? C.accent : C.sub,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 500,
              transition: 'all .15s',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 12 }}>&#9835;</span>
            {musicTrackId ? MUSIC_TRACKS.find((tr) => tr.id === musicTrackId)?.name ?? t('editor.music.label') : t('editor.music.label')}
          </button>
          {musicDropOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: 4,
              zIndex: 60,
              boxShadow: '0 8px 24px rgba(0,0,0,.3)',
              minWidth: 180,
            }}>
              {/* None option */}
              <div
                onClick={() => { useEditorStore.getState().setMusicTrack(null); setMusicDropOpen(false); }}
                style={{
                  padding: '6px 10px',
                  fontSize: 10,
                  fontWeight: !musicTrackId ? 600 : 400,
                  color: !musicTrackId ? C.accent : C.text,
                  cursor: 'pointer',
                  borderRadius: 5,
                  background: !musicTrackId ? C.accent + '10' : 'transparent',
                  transition: 'background .1s',
                }}
                onMouseEnter={(e) => { if (musicTrackId) (e.currentTarget as HTMLElement).style.background = C.cardHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = !musicTrackId ? C.accent + '10' : 'transparent'; }}
              >
                {t('editor.music.none')}
              </div>
              {MUSIC_TRACKS.map((tr) => (
                <div
                  key={tr.id}
                  onClick={() => { useEditorStore.getState().setMusicTrack(tr.id); setMusicDropOpen(false); }}
                  style={{
                    padding: '6px 10px',
                    fontSize: 10,
                    fontWeight: musicTrackId === tr.id ? 600 : 400,
                    color: musicTrackId === tr.id ? C.accent : C.text,
                    cursor: 'pointer',
                    borderRadius: 5,
                    background: musicTrackId === tr.id ? C.accent + '10' : 'transparent',
                    transition: 'background .1s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => { if (musicTrackId !== tr.id) (e.currentTarget as HTMLElement).style.background = C.cardHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = musicTrackId === tr.id ? C.accent + '10' : 'transparent'; }}
                >
                  <span>{tr.name}</span>
                  <span style={{ fontSize: 8, color: C.dim }}>{tr.category}</span>
                </div>
              ))}
              {/* Volume slider */}
              {musicTrackId && (
                <div style={{ padding: '6px 10px 4px', borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 8, color: C.sub, fontWeight: 600 }}>{t('editor.music.volume')}</span>
                    <span style={{ fontSize: 8, color: C.dim, fontFamily: "'JetBrains Mono', monospace" }}>{musicVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={musicVolume}
                    onChange={(e) => useEditorStore.getState().setMusicVolume(Number(e.target.value))}
                    style={{ width: '100%', accentColor: C.accent, cursor: 'pointer', height: 3 }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Online collaborators */}
        <OnlineUsers />

        {/* Auto-save / Save status indicator */}
        {saveStatus === 'saving' ? (
          <span style={{ fontSize: 9, color: C.dim, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', border: '1.5px solid transparent', borderTopColor: C.dim, animation: 'spin .8s linear infinite', display: 'inline-block' }} />
            {t('editor.autoSave.saving')}
          </span>
        ) : saveStatus === 'saved' ? (
          <span style={{ fontSize: 9, color: C.green, fontWeight: 500 }}>{t('editor.autoSave.saved')} &#10003;</span>
        ) : saveStatus === 'error' ? (
          <span style={{ fontSize: 9, color: C.accent, fontWeight: 500 }}>{t('editor.saveError')}</span>
        ) : autoSaveDirty ? (
          <span style={{ fontSize: 9, color: C.orange, fontWeight: 500 }}>{t('editor.autoSave.unsaved')}</span>
        ) : null}

        {/* Undo / Redo */}
        <div style={{ display: 'flex', gap: 2 }}>
          <button
            className={historyLen > 0 ? 'ed-action-btn' : undefined}
            onClick={undo}
            disabled={historyLen === 0}
            title={`${t('editor.toolbar.undo')} (Ctrl+Z)${historyLen > 0 ? ` \u2014 ${historyLen}` : ''}`}
            aria-label={`${t('editor.toolbar.undo')}${historyLen > 0 ? ` (${historyLen})` : ''}`}
            style={{
              minWidth: 44,
              height: 44,
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: historyLen === 0 ? C.dim : C.sub,
              fontSize: 13,
              cursor: historyLen === 0 ? 'default' : 'pointer',
              fontFamily: 'inherit',
              opacity: historyLen === 0 ? 0.4 : 1,
              transition: 'all .15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '0 6px',
            }}
          >
            &#8617;{historyLen > 0 && <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.7 }}>({historyLen})</span>}
          </button>
          <button
            className={futureLen > 0 ? 'ed-action-btn' : undefined}
            onClick={redo}
            disabled={futureLen === 0}
            title={`${t('editor.toolbar.redo')} (Ctrl+Shift+Z)${futureLen > 0 ? ` \u2014 ${futureLen}` : ''}`}
            aria-label={`${t('editor.toolbar.redo')}${futureLen > 0 ? ` (${futureLen})` : ''}`}
            style={{
              minWidth: 44,
              height: 44,
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: futureLen === 0 ? C.dim : C.sub,
              fontSize: 13,
              cursor: futureLen === 0 ? 'default' : 'pointer',
              fontFamily: 'inherit',
              opacity: futureLen === 0 ? 0.4 : 1,
              transition: 'all .15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '0 6px',
            }}
          >
            &#8618;{futureLen > 0 && <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.7 }}>({futureLen})</span>}
          </button>
        </div>

        {/* Export / Generate pill */}
        <button
          className="ed-gen-btn"
          onClick={handleGenerate}
          disabled={!sel || !sel.prompt.trim() || isGenerating}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            border: 'none',
            background: (!sel || !sel.prompt.trim() || isGenerating)
              ? C.dim
              : `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            cursor: (!sel || !sel.prompt.trim() || isGenerating) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '.02em',
            opacity: (!sel || !sel.prompt.trim() || isGenerating) ? 0.45 : 1,
            transition: 'all .2s',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxShadow: (!sel || !sel.prompt.trim() || isGenerating)
              ? 'none'
              : `0 4px 16px ${C.accent}40`,
          }}
        >
          {isGenerating ? (
            <>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,.3)',
                  borderTopColor: '#fff',
                  animation: 'spin .8s linear infinite',
                  flexShrink: 0,
                }}
              />
              {t('editor.generating')}
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M8 5v14l11-7z" />
              </svg>
              {t('editor.generateVideo')}
            </>
          )}
        </button>
      </div>

      {/* ── Main content area: Left scenes + Center preview ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ════════════════════════════════════════════════
            LEFT PANEL — Scene thumbnails (~160px), collapsible on mobile
            ════════════════════════════════════════════════ */}
        <ErrorBoundary>
        <div
          className="tf-editor-scene-panel"
          style={{
            width: scenePanelOpen ? 160 : 0,
            maxWidth: scenePanelOpen ? 160 : 0,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            background: C.surface,
            borderRight: scenePanelOpen ? `1px solid ${C.border}` : 'none',
            overflow: 'hidden',
            position: 'relative',
            transition: 'width .2s ease, max-width .2s ease',
          }}
        >
          {/* Scene list header */}
          <div style={{ padding: '10px 10px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {t('editor.scenes')}
            </span>
            <button
              onClick={() => addScene()}
              title={t('editor.addScene')}
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: 'transparent',
                color: C.sub,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'inherit',
                lineHeight: 1,
                transition: 'all .15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = C.accent + '55';
                (e.currentTarget as HTMLElement).style.color = C.accent;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = C.border;
                (e.currentTarget as HTMLElement).style.color = C.sub;
              }}
            >
              +
            </button>
          </div>

          {/* Scrollable scene list */}
          <div
            ref={sceneListRef}
            className="ed-scene-list"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '0 8px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              scrollBehavior: 'smooth',
            }}
          >
            {scenes.length === 0 ? (
              <div
                onClick={() => addScene()}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px 12px',
                  gap: 8,
                  cursor: 'pointer',
                  borderRadius: 10,
                  transition: 'background .15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.card; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: C.accent + '10',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    color: C.accent,
                    transition: 'background .15s',
                  }}
                >
                  +
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.sub, textAlign: 'center' }}>
                  {t('editor.clickToAddScene')}
                </span>
              </div>
            ) : (
              scenes.map((sc, idx) => (
                <React.Fragment key={sc.id}>
                  <SceneThumb
                    scene={sc}
                    idx={idx}
                    C={C}
                    isSel={sc.id === selId}
                    isDragOver={sc.id === dragOv}
                    isDragging={dragId === sc.id}
                    onSelect={handleSceneSelect}
                    onDragStart={handleSceneDragStart}
                    onDragEnter={handleSceneDragEnter}
                    onDragEnd={handleSceneDragEnd}
                  />
                  {/* Transition picker between scenes */}
                  {idx < scenes.length - 1 && (
                    <TransitionPicker
                      sceneId={sc.id}
                      current={sc.transition ?? 'none'}
                      C={C}
                      onChange={handleTransitionChange}
                    />
                  )}
                </React.Fragment>
              ))
            )}
          </div>

          {/* Scene actions moved to bottom bar */}

          {/* Settings popover — positioned next to left panel */}
          {showSettings && sel && (
            <SceneSettingsPopover
              scene={sel}
              C={C}
              onUpdate={updScene}
              onClose={() => setShowSettings(false)}
              modelsOpen={modPick}
              setModelsOpen={setModPick}
            />
          )}

          {/* Delete confirmation overlay */}
          {confirmDel && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: C.overlay,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 40,
                borderRadius: 0,
              }}
            >
              <div
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 8px 32px rgba(0,0,0,.3)',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{t('editor.deleteSceneConfirm')}</span>
                <span style={{ fontSize: 10, color: C.sub }}>{t('editor.deleteIrreversible')}</span>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <button
                    onClick={() => handleSceneConfirmDelete(confirmDel)}
                    style={{
                      padding: '6px 20px',
                      borderRadius: 8,
                      border: 'none',
                      background: C.accent,
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                  >
                    {t('editor.delete')}
                  </button>
                  <button
                    onClick={handleSceneCancelDelete}
                    style={{
                      padding: '6px 20px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.card,
                      color: C.sub,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.cardHover; (e.currentTarget as HTMLElement).style.color = C.text; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.card; (e.currentTarget as HTMLElement).style.color = C.sub; }}
                  >
                    {t('editor.cancel')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </ErrorBoundary>

        {/* ════════════════════════════════════════════════
            CENTER — Video Preview + Prompt Input
            ════════════════════════════════════════════════ */}
        <ErrorBoundary>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: C.bg,
          }}
        >
          {sel ? (
            <>
              {/* ── Video preview container ── */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: scenePanelOpen && typeof window !== 'undefined' && window.innerWidth < 768 ? '12px 12px 8px' : '20px 32px 12px',
                  minHeight: 0,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: 800,
                    aspectRatio: '16/9',
                    borderRadius: 12,
                    background: sel.status === 'ready'
                      ? '#000'
                      : `radial-gradient(ellipse at center, ${selCol}08 0%, ${C.surface} 80%)`,
                    border: `1px solid ${sel.status === 'ready' ? C.border : selCol + '18'}`,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxShadow: '0 8px 40px rgba(0,0,0,.2)',
                  }}
                >
                  {/* Video content states */}
                  {sel.status === 'ready' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      {sel.videoUrl ? (
                        <video
                          src={sel.videoUrl}
                          controls={isPlaying}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: 12,
                          }}
                        />
                      ) : null}
                      {!isPlaying && (
                        <div
                          onClick={() => setIsPlaying(true)}
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: `${C.green}22`,
                            border: `2px solid ${C.green}55`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'transform .15s, background .15s',
                            zIndex: 2,
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; (e.currentTarget as HTMLElement).style.background = C.green + '33'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = C.green + '22'; }}
                        >
                          <span style={{ fontSize: 20, color: C.green, marginLeft: 3 }}>&#9654;</span>
                        </div>
                      )}
                      {!isPlaying && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.green, zIndex: 2 }}>
                          {t('editor.videoReady')}
                        </span>
                      )}
                    </div>
                  ) : sel.status === 'generating' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          border: `3px solid ${selCol}22`,
                          borderTopColor: selCol,
                          animation: 'spin 1s linear infinite',
                          boxShadow: `0 0 20px ${selCol}12`,
                        }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 600, color: selCol }}>
                        {t('editor.generatingVideo')}
                      </span>
                      {/* Progress bar */}
                      <div style={{ width: 180 }}>
                        <div
                          style={{
                            height: 3,
                            borderRadius: 2,
                            background: C.card,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: 2,
                              background: `linear-gradient(90deg, ${selCol}, ${selCol}cc)`,
                              width: progress != null ? `${Math.min(progress, 100)}%` : '30%',
                              transition: progress != null ? 'width .5s ease' : 'none',
                              animation: progress == null ? 'shimmer 1.8s linear infinite' : 'none',
                              backgroundSize: progress == null ? '200% 100%' : 'auto',
                              backgroundImage: progress == null
                                ? `linear-gradient(90deg, ${selCol}44, ${selCol}, ${selCol}44)`
                                : `linear-gradient(90deg, ${selCol}, ${selCol}cc)`,
                            }}
                          />
                        </div>
                        <div style={{ textAlign: 'center', fontSize: 9, color: C.dim, marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>
                          {progress != null ? `${Math.round(progress)}%` : t('editor.pleaseWait')}
                        </div>
                      </div>
                    </div>
                  ) : sel.status === 'error' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: C.accent + '12',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                          color: C.accent,
                        }}
                      >
                        !
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>
                        {t('editor.generationError')}
                      </span>
                      {lastError && (
                        <span style={{ fontSize: 10, color: C.sub, textAlign: 'center', maxWidth: 260, lineHeight: 1.4 }}>
                          {lastError}
                        </span>
                      )}
                      <button
                        onClick={handleGenerate}
                        disabled={!sel.prompt.trim()}
                        style={{
                          marginTop: 4,
                          padding: '7px 18px',
                          borderRadius: 8,
                          border: 'none',
                          background: sel.prompt.trim() ? C.accent : C.dim,
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: sel.prompt.trim() ? 'pointer' : 'not-allowed',
                          fontFamily: 'inherit',
                          transition: 'all .15s',
                          opacity: sel.prompt.trim() ? 1 : 0.5,
                        }}
                      >
                        {t('editor.retryGeneration')}
                      </button>
                      <span style={{ fontSize: 10, color: C.dim }}>
                        {t('editor.changePromptRetry')}
                      </span>
                    </div>
                  ) : (
                    /* ── Empty / editing state: show frame upload slots ── */
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '16px 12px', width: '100%', boxSizing: 'border-box' as const }}>
                      {/* Frame upload row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <FrameSlot
                          label={t('editor.frame.startFrame')}
                          value={sel.sf}
                          C={C}
                          accentCol={selCol}
                          onChange={(v) => updScene(sel.id, { sf: v })}
                        />
                        {/* Arrow + duration between frames */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 0 0' }}>
                          <span style={{ fontSize: 16, color: C.dim, letterSpacing: 2, lineHeight: 1 }}>
                            &#8594;&#8594;&#8594;
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: selCol,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {sel.duration} {t('editor.sec')}
                          </span>
                        </div>
                        <FrameSlot
                          label={t('editor.frame.endFrame')}
                          value={sel.ef}
                          C={C}
                          accentCol={selCol}
                          onChange={(v) => updScene(sel.id, { ef: v })}
                        />
                      </div>

                      {/* Hint text */}
                      <span style={{ fontSize: 11, color: C.dim, fontWeight: 500 }}>
                        {!sel.prompt.trim()
                          ? t('editor.enterPromptBelow')
                          : t('editor.clickGenerate')}
                      </span>
                    </div>
                  )}

                  {/* Top-left scene label overlay */}
                  <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: 6,
                        background: selCol + '18',
                        color: selCol,
                        fontSize: 9,
                        fontWeight: 600,
                        border: `1px solid ${selCol}20`,
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      {sel.label}
                    </span>
                    <StatusDot status={sel.status} C={C} size={5} />
                  </div>

                  {/* Top-right duration overlay */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      padding: '2px 7px',
                      borderRadius: 6,
                      background: C.card + 'dd',
                      color: C.text,
                      fontSize: 9,
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      border: `1px solid ${C.border}`,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {fmtDur(sel.duration)}
                  </span>
                </div>
              </div>

              {/* ── Playback controls / info bar ── */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '0 12px 8px',
                  flexShrink: 0,
                  flexWrap: 'wrap',
                }}
              >
                {sel.status === 'ready' ? (
                  <button
                    className="ed-action-btn"
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      color: C.text,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'inherit',
                      transition: 'all .15s',
                    }}
                    title={isPlaying ? t('editor.pause') : t('editor.play')}
                  >
                    {isPlaying ? '\u23F8' : '\u25B6'}
                  </button>
                ) : (
                  <StatusDot status={sel.status} C={C} size={7} />
                )}
                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: C.sub, fontWeight: 500 }}>
                  {sel.status === 'ready' ? `00:00 / ${fmtDur(sel.duration)}` : t(STATUS_CFG[sel.status]?.labelKey || 'editor.status.empty')}
                </span>
                <div style={{ flex: 1 }} />
                {/* Model badge */}
                <span style={{ fontSize: 9, color: C.dim, fontWeight: 500 }}>
                  {(MODELS.find((m) => m.id === sel.model) || MODELS[1]).icon}{' '}
                  {(MODELS.find((m) => m.id === sel.model) || MODELS[1]).name}
                </span>
              </div>

              {/* Prompt moved to bottom bar */}
            </>
          ) : (
            /* ── No scene selected ── */
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: C.card,
                  border: `1.5px solid ${C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: C.dim,
                }}
              >
                &#9671;
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.sub }}>
                {scenes.length === 0 ? t('editor.addFirstScene') : t('editor.selectSceneLeft')}
              </span>
              {scenes.length === 0 && (
                <button
                  className="ed-gen-btn"
                  onClick={() => addScene()}
                  style={{
                    marginTop: 4,
                    padding: '10px 28px',
                    borderRadius: 20,
                    border: 'none',
                    background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all .2s',
                    boxShadow: `0 4px 16px ${C.accent}40`,
                  }}
                >
                  {t('editor.addSceneBtn')}
                </button>
              )}
            </div>
          )}
        </div>
        </ErrorBoundary>
      </div>

      {/* ════════════════════════════════════════════════
          BOTTOM AREA: Scene actions + prompt row, then timeline
          ════════════════════════════════════════════════ */}
      <div
        style={{
          flexShrink: 0,
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          position: 'relative',
        }}
      >
        {/* ── Row 1: Scene actions + compact inline prompt ── */}
        {sel && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              marginBottom: 0,
              borderBottom: `1px solid ${C.border}`,
              flexWrap: 'wrap',
            }}
          >
            {/* Scene action buttons */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
              <button className="ed-action-btn" onClick={() => dupScene(sel.id)} title={t('editor.duplicateScene')} style={tinyBtnStyle(C, false)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              </button>
              <button className="ed-action-btn" onClick={() => addScene(sel.id)} title={t('editor.addSceneAfter')} style={tinyBtnStyle(C, false)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <button className="ed-action-btn" onClick={() => setShowSettings(!showSettings)} title={t('editor.sceneSettings')} style={tinyBtnStyle(C, showSettings)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              </button>
              <div style={{ width: 1, height: 16, background: C.border, margin: '0 2px' }} />
              <button
                className={scenes.length > 1 && !isGenerating ? 'ed-action-btn' : undefined}
                onClick={() => { if (scenes.length > 1 && !isGenerating) handleSceneRequestDelete(sel.id); }}
                disabled={scenes.length <= 1 || isGenerating}
                title={scenes.length <= 1 ? t('editor.cannotDeleteOnly') : isGenerating ? t('editor.cannotDeleteGenerating') : t('editor.deleteScene')}
                style={{ ...tinyBtnStyle(C, false), color: (scenes.length <= 1 || isGenerating) ? C.dim : C.accent, opacity: (scenes.length <= 1 || isGenerating) ? 0.3 : 1, cursor: (scenes.length <= 1 || isGenerating) ? 'not-allowed' : 'pointer' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>

              {/* Voiceover (TTS) button */}
              <div style={{ width: 1, height: 16, background: C.border, margin: '0 2px' }} />
              <button
                className={sel.voiceoverStatus !== 'generating' ? 'ed-action-btn' : undefined}
                onClick={() => {
                  // TTS not yet configured — show "soon" tooltip
                  useNotificationStore.getState().addToast('info', t('editor.voiceover.soon'), 2000);
                }}
                disabled={sel.voiceoverStatus === 'generating'}
                title={!sel.prompt.trim() ? t('editor.voiceover.noText') : t('editor.voiceover.btn')}
                style={{
                  ...tinyBtnStyle(C, sel.voiceoverStatus === 'done'),
                  minWidth: 'auto',
                  width: 'auto',
                  padding: '0 6px',
                  gap: 3,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 9,
                  fontWeight: 500,
                  color: sel.voiceoverStatus === 'done' ? C.green : sel.voiceoverStatus === 'generating' ? C.orange : C.sub,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                {sel.voiceoverStatus === 'generating' ? t('editor.voiceover.generating') : sel.voiceoverStatus === 'done' ? t('editor.voiceover.done') : t('editor.voiceover.btn')}
              </button>

              {/* Voiceover audio player (when available) */}
              {sel.voiceoverUrl && (
                <audio controls src={sel.voiceoverUrl} style={{ height: 24, maxWidth: 120, flexShrink: 0 }} />
              )}

              {/* Scene duration inline control */}
              <div style={{ width: 1, height: 16, background: C.border, margin: '0 2px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                <span style={{ fontSize: 8, color: C.sub, fontWeight: 500 }}>{t('editor.sceneDuration')}:</span>
                <input
                  type="range"
                  min={3}
                  max={30}
                  value={sel.duration}
                  onChange={(e) => updScene(sel.id, { duration: Number(e.target.value) })}
                  style={{ width: 60, accentColor: selCol, cursor: 'pointer', height: 3 }}
                />
                <span style={{ fontSize: 9, fontWeight: 600, color: selCol, fontFamily: "'JetBrains Mono', monospace", minWidth: 20, textAlign: 'center' }}>
                  {sel.duration}{t('editor.sec')}
                </span>
              </div>
            </div>

            {/* Rich text formatting buttons + Prompt input area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, width: '100%' }}>
              {/* Bold / Italic toggle bar */}
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <button
                  className="ed-action-btn"
                  title={t('editor.richText.bold')}
                  onClick={() => {
                    if (!promptRef.current) return;
                    const ta = promptRef.current;
                    const start = ta.selectionStart;
                    const end = ta.selectionEnd;
                    const text = sel.prompt;
                    if (start === end) return;
                    const selected = text.slice(start, end);
                    // Toggle bold: wrap or unwrap **...**
                    const isBold = selected.startsWith('**') && selected.endsWith('**');
                    const newText = isBold
                      ? text.slice(0, start) + selected.slice(2, -2) + text.slice(end)
                      : text.slice(0, start) + '**' + selected + '**' + text.slice(end);
                    updScene(sel.id, { prompt: newText });
                    useEditorStore.getState().pushHistoryDebounced();
                  }}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    border: `1px solid ${C.border}`,
                    background: 'transparent',
                    color: C.sub,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'inherit',
                    padding: 0,
                    transition: 'all .15s',
                  }}
                >
                  B
                </button>
                <button
                  className="ed-action-btn"
                  title={t('editor.richText.italic')}
                  onClick={() => {
                    if (!promptRef.current) return;
                    const ta = promptRef.current;
                    const start = ta.selectionStart;
                    const end = ta.selectionEnd;
                    const text = sel.prompt;
                    if (start === end) return;
                    const selected = text.slice(start, end);
                    // Toggle italic: wrap or unwrap *...*
                    const isItalic = selected.startsWith('*') && selected.endsWith('*') && !selected.startsWith('**');
                    const newText = isItalic
                      ? text.slice(0, start) + selected.slice(1, -1) + text.slice(end)
                      : text.slice(0, start) + '*' + selected + '*' + text.slice(end);
                    updScene(sel.id, { prompt: newText });
                    useEditorStore.getState().pushHistoryDebounced();
                  }}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    border: `1px solid ${C.border}`,
                    background: 'transparent',
                    color: C.sub,
                    fontSize: 11,
                    fontWeight: 400,
                    fontStyle: 'italic',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'serif',
                    padding: 0,
                    transition: 'all .15s',
                  }}
                >
                  I
                </button>
              </div>

            {/* Prompt input area */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 8,
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '6px 10px',
                transition: 'border-color .15s',
                minWidth: 0,
                width: '100%',
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = selCol + '55';
              }}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  (e.currentTarget as HTMLElement).style.borderColor = C.border;
                }
              }}
            >
              <textarea
                ref={promptRef}
                value={sel.prompt}
                rows={1}
                onChange={(e) => {
                  updScene(sel.id, { prompt: e.target.value, status: sel.status === 'empty' ? 'editing' : sel.status });
                  autoResize(e.target);
                  useEditorStore.getState().pushHistoryDebounced();
                }}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder={t('editor.promptPlaceholder')}
                maxLength={2000}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: C.text,
                  fontSize: 13,
                  lineHeight: '22px',
                  resize: 'none',
                  fontFamily: 'inherit',
                  minHeight: 48,
                  maxHeight: 96,
                  overflow: 'hidden',
                  padding: '4px 0',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, paddingBottom: 1 }}>
                <span style={{ fontSize: 9, color: sel.prompt.length > 1800 ? '#ef4444' : sel.prompt.length > 1500 ? '#eab308' : sel.prompt.length > 0 ? C.sub : C.dim, fontFamily: "'JetBrains Mono', monospace", fontWeight: sel.prompt.length > 1500 ? 600 : 400 }}>
                  {sel.prompt.length}/2000
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: C.sub,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Ctrl+Enter
                </span>
              </div>
            </div>
            </div>{/* close rich text + prompt wrapper */}
          </div>
        )}

        {/* ── Row 2: Timeline tabs ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            overflowX: 'auto',
            overflowY: 'hidden',
            minHeight: 40,
            padding: '6px 12px',
          }}
        >
          {scenes.map((sc, idx) => {
            const col = gc(sc.ck);
            const isSelScene = sc.id === selId;

            return (
              <div
                key={sc.id}
                className="ed-timeline-tab"
                draggable
                onDragStart={() => handleSceneDragStart(sc.id)}
                onDragEnter={() => handleSceneDragEnter(sc.id)}
                onDragEnd={handleSceneDragEnd}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => setSelId(sc.id)}
                style={{
                  flex: `0 0 ${Math.max(50, sc.duration * 6)}px`,
                  height: 36,
                  background: isSelScene ? col + '18' : C.card,
                  borderRadius: 6,
                  border: `1.5px solid ${sc.id === dragOv ? col + '66' : isSelScene ? col + '40' : sc.status === 'error' ? C.accent + '50' : C.border}`,
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  transition: 'all .15s',
                  overflow: 'hidden',
                  opacity: dragId === sc.id ? 0.4 : 1,
                }}
                title={`${sc.label} — ${fmtDur(sc.duration)}`}
              >
                {/* Color bar at bottom */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: isSelScene ? 3 : 2,
                    background: col,
                    opacity: isSelScene ? 1 : 0.35,
                    borderRadius: '0 0 4px 4px',
                    transition: 'all .15s',
                  }}
                />
                <span style={{ fontSize: 9, fontWeight: 700, color: isSelScene ? col : C.sub, fontFamily: "'JetBrains Mono', monospace" }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: 7, color: C.dim, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
                  {fmtDur(sc.duration)}
                </span>
              </div>
            );
          })}

          {/* Add scene "+" block at end of timeline */}
          <div
            onClick={() => addScene()}
            style={{
              flex: '0 0 36px',
              height: 36,
              borderRadius: 6,
              border: `1.5px dashed ${C.border}`,
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all .15s',
              color: C.dim,
              fontSize: 16,
            }}
            title={t('editor.addScene')}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = C.accent + '55';
              (e.currentTarget as HTMLElement).style.color = C.accent;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = C.border;
              (e.currentTarget as HTMLElement).style.color = C.dim;
            }}
          >
            +
          </div>

          <div style={{ flex: 1 }} />

          {/* Total duration */}
          <span style={{ fontSize: 9, color: C.dim, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, flexShrink: 0, paddingLeft: 8 }}>
            {fmtDur(totalDur)}
          </span>
        </div>
      </div>

      {/* ── Global hover styles + keyframes ── */}
      <style>{`
        .scene-thumb:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,.15); }
        .scene-thumb:hover .scene-drag-handle { opacity: 0.8 !important; }
        .scene-thumb { transition: all .15s ease !important; }
        .ed-action-btn:hover { background: ${C.cardHover} !important; border-color: ${C.borderActive} !important; color: ${C.text} !important; }
        .ed-timeline-tab:hover { border-color: ${C.borderActive} !important; }
        .ed-gen-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px ${C.accent}55 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .ed-scene-list::-webkit-scrollbar { width: 4px; }
        .ed-scene-list::-webkit-scrollbar-track { background: transparent; }
        .ed-scene-list::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        .ed-scene-list::-webkit-scrollbar-thumb:hover { background: ${C.dim}; }

        /* ── Mobile editor optimizations ── */
        @media (max-width: 768px) {
          .tf-editor-scene-panel {
            position: fixed !important;
            top: 0; left: 0; bottom: 0;
            z-index: 900;
            width: 160px !important;
            max-width: 160px !important;
            box-shadow: 4px 0 24px rgba(0,0,0,.4);
          }
          .tf-editor-topbar {
            padding: 6px 8px !important;
            gap: 6px !important;
          }
          .tf-editor-topbar button,
          .tf-editor-topbar a {
            min-width: 44px;
            min-height: 44px;
          }
          .ed-action-btn {
            min-width: 44px !important;
            min-height: 44px !important;
          }
          .ed-timeline-tab {
            min-height: 44px !important;
            height: 44px !important;
          }
          .ed-gen-btn {
            min-height: 44px !important;
            padding: 10px 20px !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STYLE HELPERS
   ═══════════════════════════════════════════════════════════════════ */
function compactLabelStyle(C: Theme): React.CSSProperties {
  return {
    fontSize: 9,
    fontWeight: 600,
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: '.04em',
    marginBottom: 4,
    display: 'block',
  };
}

function compactInputStyle(C: Theme): React.CSSProperties {
  return {
    width: '100%',
    padding: '6px 10px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontSize: 11,
    fontWeight: 600,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    transition: 'border-color .15s',
  };
}

function tinyBtnStyle(C: Theme, active: boolean): React.CSSProperties {
  return {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: `1px solid ${active ? C.accent + '55' : C.border}`,
    background: active ? C.accent + '10' : 'transparent',
    color: active ? C.accent : C.sub,
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
    lineHeight: 1,
    padding: 0,
    transition: 'all .15s',
  };
}
