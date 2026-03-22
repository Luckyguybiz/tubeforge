'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import { useEditorStore, MUSIC_TRACKS } from '@/stores/useEditorStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { OnlineUsers } from '@/components/ui/OnlineUsers';
import { SceneLockIndicator } from '@/components/ui/SceneLockIndicator';
import { MODELS } from '@/lib/constants';
import { fmtDur, pluralRu } from '@/lib/utils';
import { useProjectSync } from '@/hooks/useProjectSync';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { useCollaboration, useSceneEditLock } from '@/hooks/useCollaboration';
import { useUndoHint } from '@/hooks/useUndoHint';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
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
          borderRadius: 12,
          border: value ? `1.5px solid ${accentCol}30` : `1.5px dashed ${C.border}`,
          background: value ? 'transparent' : C.bg,
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
            (e.currentTarget as HTMLElement).style.background = C.bg;
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
                color: C.text,
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
                color: C.text,
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
      {/* Top bar skeleton */}
      <div style={{ height: 44, background: C.card, borderBottom: `1px solid ${C.border}`, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Skeleton width={160} height={20} style={{ borderRadius: 8 }} />
        <Skeleton width={6} height={6} rounded />
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel skeleton */}
        <div style={{ width: 320, flexShrink: 0, background: C.card, borderRight: `1px solid ${C.border}`, padding: '16px 16px' }}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
            <Skeleton width={112} height={72} style={{ borderRadius: 12 }} />
            <Skeleton width={112} height={72} style={{ borderRadius: 12 }} />
          </div>
          <Skeleton width="100%" height={80} style={{ borderRadius: 10, marginBottom: 14 }} />
          <Skeleton width="100%" height={40} style={{ borderRadius: 10, marginBottom: 14 }} />
          <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} width="25%" height={36} style={{ borderRadius: 8 }} />
            ))}
          </div>
          <Skeleton width="100%" height={48} style={{ borderRadius: 12 }} />
        </div>
        {/* Right preview skeleton */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, padding: 24 }}>
          <Skeleton width="80%" height={0} style={{ borderRadius: 16, aspectRatio: '16/9', maxWidth: 640, paddingBottom: '45%' }} />
        </div>
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
        background: C.card,
        border: `1.5px solid ${isDragOver ? col + '66' : isSel ? col : sc.status === 'error' ? col + '50' : C.border}`,
        cursor: 'pointer',
        transition: 'all .2s ease-out',
        opacity: isDragging ? 0.35 : 1,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Drop indicator line */}
      {isDragOver && (
        <div style={{ position: 'absolute', top: -2, left: 4, right: 4, height: 3, borderRadius: 2, background: col, zIndex: 5 }} />
      )}

      {/* Thumbnail area — 120px wide aspect maintained */}
      <div
        style={{
          width: '100%',
          height: 80,
          background: (sc.sf || sc.videoUrl)
            ? `url(${sc.sf || sc.videoUrl}) center/cover no-repeat`
            : sc.status === 'ready'
              ? `linear-gradient(135deg, ${col}14, ${col}06)`
              : C.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Drag handle — 3 dots vertical */}
        <span
          className="scene-drag-handle"
          style={{
            position: 'absolute',
            top: 6,
            left: 5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            cursor: 'grab',
            opacity: 0,
            transition: 'opacity .2s ease-out',
            userSelect: 'none',
          }}
          title={useLocaleStore.getState().t('editor.dragHandle')}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: C.dim }} />
          ))}
        </span>

        {/* Scene number badge overlay */}
        <span
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            fontSize: 9,
            fontWeight: 700,
            color: C.sub,
            fontFamily: "'JetBrains Mono', monospace",
            background: 'rgba(0,0,0,0.5)',
            padding: '1px 5px',
            borderRadius: 6,
            backdropFilter: 'blur(4px)',
            lineHeight: '14px',
          }}
        >
          {String(idx + 1).padStart(2, '0')}
        </span>

        {sc.status === 'ready' ? (
          <span style={{ fontSize: 16, color: col, opacity: 0.7 }}>&#9654;</span>
        ) : sc.status === 'generating' ? (
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: `2px solid ${col}33`,
              borderTopColor: col,
              animation: 'spin .8s linear infinite',
            }}
          />
        ) : sc.status === 'error' ? (
          <span style={{ fontSize: 16, color: col, fontWeight: 700 }}>!</span>
        ) : null}

        {/* Duration badge */}
        <span
          style={{
            position: 'absolute',
            bottom: 4,
            right: 5,
            fontSize: 8,
            fontWeight: 600,
            color: C.sub,
            fontFamily: "'JetBrains Mono', monospace",
            background: 'rgba(0,0,0,0.5)',
            padding: '1px 5px',
            borderRadius: 4,
            backdropFilter: 'blur(4px)',
          }}
        >
          {fmtDur(sc.duration)}
        </span>
      </div>

      {/* Scene info */}
      <div style={{ padding: '5px 8px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
        <StatusDot status={sc.status} C={C} size={5} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: isSel ? C.text : C.sub,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            letterSpacing: '-0.01em',
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
          marginTop: 4,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 3,
          zIndex: 30,
          boxShadow: '0 4px 16px rgba(0,0,0,.35)',
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
        left: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : 184,
        width: 280,
        maxWidth: 'calc(100vw - 32px)',
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,.5)',
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
                  marginTop: 4,
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: 4,
                  zIndex: 60,
                  boxShadow: '0 4px 20px rgba(0,0,0,.4)',
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
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');

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
  const [scenePanelOpen, setScenePanelOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicDropOpen, setMusicDropOpen] = useState(false);
  const [leftModelsOpen, setLeftModelsOpen] = useState(false);
  const leftModDropRef = useRef<HTMLDivElement>(null);

  // Z1: AI Script Generator
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptTopic, setScriptTopic] = useState('');
  const [scriptTone, setScriptTone] = useState<'professional' | 'casual' | 'fun'>('professional');
  const [scriptDuration, setScriptDuration] = useState<'30s' | '1min' | '3min'>('1min');

  // Z2: AI Captions
  const [showCaptionsModal, setShowCaptionsModal] = useState(false);
  const [captionsSrt, setCaptionsSrt] = useState<string | null>(null);

  // Z5: AI Content Repurposing
  const [showShortsModal, setShowShortsModal] = useState(false);

  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicDropRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const sceneListRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const savedRef = useRef(false);

  // Video generation hook for selected scene
  const videoGen = useVideoGeneration(selId);

  // Z1: AI Script Generator mutation
  const generateScript = trpc.ai.generateScript.useMutation({
    onSuccess: (data) => {
      const store = useEditorStore.getState();
      // Create scenes from the generated script
      data.scenes.forEach((s: { text: string; duration: number }) => {
        const newScene = store.addScene();
        store.updScene(newScene.id, {
          prompt: s.text,
          duration: s.duration,
          status: 'editing',
          label: s.text.slice(0, 30) + (s.text.length > 30 ? '...' : ''),
        });
        if (projectId) {
          sync.updateScene(newScene.id, { prompt: s.text, duration: s.duration, label: s.text.slice(0, 30) });
        }
      });
      setShowScriptModal(false);
      setScriptTopic('');
      toast.success(t('editor.script.generated') + data.scenes.length);
      trackEvent('ai_script_generated', { tone: scriptTone, duration: scriptDuration, scenesCount: data.scenes.length });
    },
    onError: (err) => toast.error(err.message),
  });

  // Z2: AI Captions mutation
  const generateCaptions = trpc.ai.generateCaptions.useMutation({
    onSuccess: (data) => {
      setCaptionsSrt(data.srt);
      setShowCaptionsModal(true);
      toast.success(t('editor.captions.generated'));
    },
    onError: (err) => toast.error(err.message),
  });

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

  // Close left model dropdown on outside click
  useEffect(() => {
    if (!leftModelsOpen) return;
    const handler = (e: MouseEvent) => {
      if (leftModDropRef.current && !leftModDropRef.current.contains(e.target as Node)) setLeftModelsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [leftModelsOpen]);

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
    const maxH = 160; // matches maxHeight on the textarea
    const sh = el.scrollHeight;
    el.style.height = Math.max(100, Math.min(sh, maxH)) + 'px';
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
     MOBILE FALLBACK — editor is unusable on small screens
     ═══════════════════════════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', padding: 24,
        textAlign: 'center', background: C.bg,
      }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '16px 0 8px' }}>
          {t('editor.mobileTitle')}
        </h2>
        <p style={{ fontSize: 14, color: C.sub, maxWidth: 300, lineHeight: 1.5 }}>
          {t('editor.mobileDesc')}
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            marginTop: 20, padding: '12px 24px', borderRadius: 12,
            border: 'none', background: C.accent, color: C.text,
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {t('editor.backToDashboard')}
        </button>
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
              color: C.text,
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

  const selMod = sel ? (MODELS.find((m) => m.id === sel.model) || MODELS[1]) : MODELS[1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: C.bg }}>

      {/* ── Simplified Top Bar ── */}
      <div
        className="tf-editor-topbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 16px',
          background: C.card,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
          minHeight: 44,
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
              padding: '4px 10px',
              borderRadius: 8,
              border: `1.5px solid ${C.accent}55`,
              background: C.surface,
              color: C.text,
              fontSize: 14,
              fontWeight: 500,
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              width: 220,
            }}
          />
        ) : (
          <div
            onClick={startEditTitle}
            title={t('editor.clickToEdit')}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: C.text,
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: 8,
              transition: 'background .15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 220,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {sync.project?.title || t('editor.untitled')}
          </div>
        )}

        {/* Auto-save dot */}
        {autoSaveDirty ? (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.orange, flexShrink: 0 }} title={t('editor.autoSave.unsaved')} />
        ) : saveStatus === 'saved' ? (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0, opacity: 0.7 }} title={t('editor.autoSave.saved')} />
        ) : saveStatus === 'saving' ? (
          <span style={{ width: 6, height: 6, borderRadius: '50%', border: '1.5px solid transparent', borderTopColor: C.dim, animation: 'spin .8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
        ) : null}

        {/* Save error */}
        {saveStatus === 'error' && (
          <span role="status" aria-live="polite" style={{ fontSize: 9, color: C.accent, fontWeight: 500 }}>{t('editor.saveError')}</span>
        )}

        <div style={{ flex: 1 }} />

        {/* Online collaborators */}
        <OnlineUsers />

        {/* Undo / Redo — subtle */}
        <div style={{ display: 'flex', gap: 2 }}>
          <button
            className={historyLen > 0 ? 'ed-action-btn' : undefined}
            onClick={undo}
            disabled={historyLen === 0}
            title={`${t('editor.toolbar.undo')} (Ctrl+Z)`}
            aria-label={`${t('editor.toolbar.undo')}${historyLen > 0 ? ` (${historyLen})` : ''}`}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: `1px solid ${C.border}`, background: 'transparent',
              color: historyLen === 0 ? C.dim : C.sub, fontSize: 13,
              cursor: historyLen === 0 ? 'default' : 'pointer',
              fontFamily: 'inherit', opacity: historyLen === 0 ? 0.3 : 1,
              transition: 'all .15s', display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >
            &#8617;
          </button>
          <button
            className={futureLen > 0 ? 'ed-action-btn' : undefined}
            onClick={redo}
            disabled={futureLen === 0}
            title={`${t('editor.toolbar.redo')} (Ctrl+Shift+Z)`}
            aria-label={`${t('editor.toolbar.redo')}${futureLen > 0 ? ` (${futureLen})` : ''}`}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: `1px solid ${C.border}`, background: 'transparent',
              color: futureLen === 0 ? C.dim : C.sub, fontSize: 13,
              cursor: futureLen === 0 ? 'default' : 'pointer',
              fontFamily: 'inherit', opacity: futureLen === 0 ? 0.3 : 1,
              transition: 'all .15s', display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >
            &#8618;
          </button>
        </div>
      </div>

      {/* ── Main content: Left controls + Right preview ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ════════════════════════════════════════════════
            LEFT PANEL — Controls (~320px), Higgsfield-style
            ════════════════════════════════════════════════ */}
        <ErrorBoundary>
        <div
          className="tf-editor-left-panel"
          style={{
            width: 320,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            background: C.card,
            borderRight: `1px solid ${C.border}`,
            overflow: 'hidden',
          }}
        >
          {/* Scrollable controls area */}
          <div
            className="ed-scene-list"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '16px 16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* ── Frame upload row (compact) ── */}
            {sel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                <FrameSlot
                  label={t('editor.frame.startFrame')}
                  value={sel.sf}
                  C={C}
                  accentCol={selCol}
                  onChange={(v) => updScene(sel.id, { sf: v })}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 0 0' }}>
                  <span style={{ fontSize: 14, color: C.dim, lineHeight: 1 }}>&#8594;</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: selCol, fontFamily: "'JetBrains Mono', monospace" }}>
                    {sel?.duration || 5}{t('editor.sec')}
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
            )}

            {/* ── Prompt textarea — main focus ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('editor.promptPlaceholder').split('\n')[0] || 'Describe your video'}
              </label>
              <div
                style={{
                  position: 'relative',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  transition: 'border-color .2s, box-shadow .2s',
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = selCol + '55';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 2px ${selCol}18`;
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    (e.currentTarget as HTMLElement).style.borderColor = C.border;
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }
                }}
              >
                <textarea
                  ref={promptRef}
                  value={sel?.prompt || ''}
                  rows={1}
                  onChange={(e) => {
                    if (!sel) return;
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
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: C.text,
                    fontSize: 13,
                    lineHeight: '20px',
                    resize: 'none',
                    fontFamily: 'inherit',
                    minHeight: 80,
                    maxHeight: 140,
                    overflow: 'hidden',
                    padding: 0,
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: (sel?.prompt?.length || 0) > 1800 ? '#ef4444' : C.dim, fontFamily: "'JetBrains Mono', monospace" }}>
                    {sel?.prompt?.length || 0}/2000
                  </span>
                </div>
              </div>
            </div>

            {/* ── Model selector (compact) ── */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>
                {t('editor.settingsModel')}
              </label>
              <div style={{ position: 'relative' }} ref={leftModDropRef}>
                <button
                  onClick={() => setLeftModelsOpen(!leftModelsOpen)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: `1px solid ${leftModelsOpen ? C.accent + '55' : C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                    transition: 'border-color .15s',
                    height: 40,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{selMod.icon}</span>
                  <span style={{ flex: 1 }}>{selMod.name}</span>
                  <span style={{ fontSize: 8, color: C.dim, transform: leftModelsOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>&#9660;</span>
                </button>
                {leftModelsOpen && (
                  <div
                    role="listbox"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0, right: 0,
                      marginTop: 4,
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      padding: 4,
                      zIndex: 60,
                      boxShadow: '0 4px 20px rgba(0,0,0,.4)',
                    }}
                  >
                    {MODELS.map((m) => (
                      <div
                        key={m.id}
                        role="option"
                        tabIndex={0}
                        aria-selected={m.id === sel?.model}
                        onClick={() => { if (sel) updScene(sel.id, { model: m.id }); setLeftModelsOpen(false); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (sel) updScene(sel.id, { model: m.id }); setLeftModelsOpen(false); }
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: m.id === sel?.model ? C.accent + '10' : 'transparent',
                          transition: 'background .1s',
                        }}
                        onMouseEnter={(e) => { if (m.id !== sel?.model) (e.currentTarget as HTMLElement).style.background = C.cardHover; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = m.id === sel?.model ? C.accent + '10' : 'transparent'; }}
                      >
                        <span style={{ fontSize: 14 }}>{m.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: m.id === sel?.model ? C.accent : C.text }}>{m.name}</div>
                          <div style={{ fontSize: 9, color: C.sub }}>{m.desc} · {m.speed}</div>
                        </div>
                        {m.id === sel?.model && (
                          <span style={{ fontSize: 10, color: C.accent, fontWeight: 700 }}>&#10003;</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Duration + Aspect ratio row (compact pills) ── */}
            <div style={{ display: 'flex', gap: 12 }}>
              {/* Duration */}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>
                  {t('editor.settingsDuration')}
                </label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[5, 10, 15, 30].map((dur) => (
                    <button
                      key={dur}
                      onClick={() => { if (sel) updScene(sel.id, { duration: dur }); }}
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: 8,
                        border: `1px solid ${sel?.duration === dur ? selCol + '55' : C.border}`,
                        background: sel?.duration === dur ? selCol + '12' : C.surface,
                        color: sel?.duration === dur ? selCol : C.sub,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: "'JetBrains Mono', monospace",
                        transition: 'all .15s',
                        padding: 0,
                      }}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Generate button — full width, accent gradient, glow ── */}
            <button
              className="ed-gen-btn"
              onClick={handleGenerate}
              disabled={!sel?.prompt?.trim() || isGenerating}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 12,
                border: 'none',
                background: (!sel?.prompt?.trim() || isGenerating)
                  ? C.border
                  : `linear-gradient(135deg, ${C.accent}, ${C.blue})`,
                color: (!sel?.prompt?.trim() || isGenerating) ? C.dim : '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: (!sel?.prompt?.trim() || isGenerating) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '-0.01em',
                transition: 'all .2s ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: (!sel?.prompt?.trim() || isGenerating)
                  ? 'none'
                  : `0 4px 24px ${C.accent}44, 0 0 48px ${C.accent}12`,
                flexShrink: 0,
              }}
            >
              {isGenerating ? (
                <>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${C.dim}`, borderTopColor: '#fff', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
                  {t('editor.generating')}
                </>
              ) : (
                <>{'Generate '}</>
              )}
            </button>

            {/* ── Collapsible: Scenes list ── */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
              <button
                onClick={() => setScenePanelOpen((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: C.sub,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  padding: '4px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {t('editor.scenes')}
                  <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.dim }}>{scenes.length} · {fmtDur(totalDur)}</span>
                </span>
                <span style={{ fontSize: 8, transform: scenePanelOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>&#9660;</span>
              </button>

              {scenePanelOpen && (
                <div
                  ref={sceneListRef}
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    maxHeight: 240,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                  }}
                >
                  {scenes.length === 0 ? (
                    <div
                      onClick={() => addScene()}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '20px 12px', gap: 8, cursor: 'pointer', borderRadius: 8,
                        border: `1px dashed ${C.border}`, transition: 'background .15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: 14, color: C.dim }}>+</span>
                      <span style={{ fontSize: 11, color: C.dim, fontWeight: 500 }}>{t('editor.clickToAddScene')}</span>
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
                        {idx < scenes.length - 1 && (
                          <TransitionPicker sceneId={sc.id} current={sc.transition ?? 'none'} C={C} onChange={handleTransitionChange} />
                        )}
                      </React.Fragment>
                    ))
                  )}

                  {/* Add scene button */}
                  {scenes.length > 0 && (
                    <button
                      onClick={() => addScene()}
                      style={{
                        width: '100%', padding: '6px 0', borderRadius: 8,
                        border: `1px dashed ${C.border}`, background: 'transparent',
                        color: C.dim, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all .15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.accent + '55'; (e.currentTarget as HTMLElement).style.color = C.accent; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.dim; }}
                    >
                      + {t('editor.addScene')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Collapsible: Advanced (music, voiceover, subtitles, AI tools) ── */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
              <button
                onClick={() => setTimelineOpen((v) => !v)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', background: 'transparent', border: 'none',
                  color: C.sub, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', padding: '4px 0', textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                <span>Advanced</span>
                <span style={{ fontSize: 8, transform: timelineOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>&#9660;</span>
              </button>

              {timelineOpen && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Scene actions */}
                  {sel && (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
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
                    </div>
                  )}

                  {/* Music */}
                  <div ref={musicDropRef} style={{ position: 'relative' }}>
                    <button
                      onClick={() => setMusicDropOpen(!musicDropOpen)}
                      style={{
                        width: '100%', fontSize: 11, padding: '8px 12px', borderRadius: 8,
                        border: `1px solid ${C.border}`, height: 36,
                        background: musicTrackId ? C.accent + '08' : C.surface,
                        color: musicTrackId ? C.accent : C.sub,
                        cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                        transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 6,
                        textAlign: 'left', boxSizing: 'border-box',
                      }}
                    >
                      <span style={{ fontSize: 12 }}>&#9835;</span>
                      <span style={{ flex: 1 }}>{musicTrackId ? MUSIC_TRACKS.find((tr) => tr.id === musicTrackId)?.name ?? t('editor.music.label') : t('editor.music.label')}</span>
                      <span style={{ fontSize: 8, color: C.dim }}>&#9660;</span>
                    </button>
                    {musicDropOpen && (
                      <div style={{
                        position: 'absolute', bottom: '100%', left: 0, right: 0,
                        marginBottom: 4, background: C.card, border: `1px solid ${C.border}`,
                        borderRadius: 12, padding: 4, zIndex: 60,
                        boxShadow: '0 4px 20px rgba(0,0,0,.4)',
                      }}>
                        <div
                          onClick={() => { useEditorStore.getState().setMusicTrack(null); setMusicDropOpen(false); }}
                          style={{ padding: '6px 10px', fontSize: 10, fontWeight: !musicTrackId ? 600 : 400, color: !musicTrackId ? C.accent : C.text, cursor: 'pointer', borderRadius: 5, background: !musicTrackId ? C.accent + '10' : 'transparent', transition: 'background .1s' }}
                          onMouseEnter={(e) => { if (musicTrackId) (e.currentTarget as HTMLElement).style.background = C.cardHover; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = !musicTrackId ? C.accent + '10' : 'transparent'; }}
                        >
                          {t('editor.music.none')}
                        </div>
                        {MUSIC_TRACKS.map((tr) => (
                          <div key={tr.id}
                            onClick={() => { useEditorStore.getState().setMusicTrack(tr.id); setMusicDropOpen(false); }}
                            style={{ padding: '6px 10px', fontSize: 10, fontWeight: musicTrackId === tr.id ? 600 : 400, color: musicTrackId === tr.id ? C.accent : C.text, cursor: 'pointer', borderRadius: 5, background: musicTrackId === tr.id ? C.accent + '10' : 'transparent', transition: 'background .1s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onMouseEnter={(e) => { if (musicTrackId !== tr.id) (e.currentTarget as HTMLElement).style.background = C.cardHover; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = musicTrackId === tr.id ? C.accent + '10' : 'transparent'; }}
                          >
                            <span>{tr.name}</span>
                            <span style={{ fontSize: 8, color: C.dim }}>{tr.category}</span>
                          </div>
                        ))}
                        {musicTrackId && (
                          <div style={{ padding: '6px 10px 4px', borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                              <span style={{ fontSize: 8, color: C.sub, fontWeight: 600 }}>{t('editor.music.volume')}</span>
                              <span style={{ fontSize: 8, color: C.dim, fontFamily: "'JetBrains Mono', monospace" }}>{musicVolume}%</span>
                            </div>
                            <input type="range" min={0} max={100} value={musicVolume}
                              onChange={(e) => useEditorStore.getState().setMusicVolume(Number(e.target.value))}
                              style={{ width: '100%', accentColor: C.accent, cursor: 'pointer', height: 3 }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Voiceover + Subtitles row */}
                  {sel && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className={sel.voiceoverStatus !== 'generating' ? 'ed-action-btn' : undefined}
                        onClick={() => { useNotificationStore.getState().addToast('info', t('editor.voiceover.soon'), 2000); }}
                        disabled={sel.voiceoverStatus === 'generating'}
                        title={t('editor.voiceover.btn')}
                        style={{
                          flex: 1, height: 36, borderRadius: 8, border: `1px solid ${C.border}`,
                          background: sel.voiceoverStatus === 'done' ? C.green + '10' : C.surface,
                          color: sel.voiceoverStatus === 'done' ? C.green : C.sub,
                          fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          transition: 'all .15s',
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                          <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                        </svg>
                        {t('editor.voiceover.btn')}
                      </button>
                      <button
                        className={!generateCaptions.isPending ? 'ed-action-btn' : undefined}
                        onClick={() => {
                          if (generateCaptions.isPending) return;
                          const scenesData = scenes.filter(s => s.prompt.trim()).map(s => ({ text: s.prompt, duration: s.duration }));
                          if (scenesData.length === 0) { toast.info(t('editor.captions.addTextHint')); return; }
                          generateCaptions.mutate({ scenes: scenesData });
                        }}
                        disabled={generateCaptions.isPending}
                        title={t('editor.captions.generateTitle')}
                        style={{
                          flex: 1, height: 36, borderRadius: 8, border: `1px solid ${C.border}`,
                          background: captionsSrt ? C.green + '10' : C.surface,
                          color: generateCaptions.isPending ? C.orange : captionsSrt ? C.green : C.sub,
                          fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          transition: 'all .15s',
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h4m-4-3h10"/>
                        </svg>
                        {generateCaptions.isPending ? t('editor.captions.generating') : t('editor.captions.label')}
                      </button>
                    </div>
                  )}

                  {/* Voiceover audio player */}
                  {sel?.voiceoverUrl && (
                    <audio controls src={sel.voiceoverUrl} style={{ height: 24, width: '100%' }} />
                  )}

                  {/* AI Script + Shorts buttons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setShowScriptModal(true)}
                      title={t('editor.script.generateBtnTitle')}
                      style={{
                        flex: 1, height: 36, borderRadius: 8,
                        border: `1px solid ${C.border}`, background: C.surface,
                        color: C.purple, fontSize: 10, fontWeight: 500, cursor: 'pointer',
                        fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 4, transition: 'all .15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.purple + '10'; (e.currentTarget as HTMLElement).style.borderColor = C.purple + '40'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      {t('editor.script.generateBtn')}
                    </button>
                    {scenes.length >= 3 && (
                      <button
                        onClick={() => setShowShortsModal(true)}
                        title={t('editor.shorts.createTitle')}
                        style={{
                          flex: 1, height: 36, borderRadius: 8,
                          border: `1px solid ${C.border}`, background: C.surface,
                          color: C.cyan, fontSize: 10, fontWeight: 500, cursor: 'pointer',
                          fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', gap: 4, transition: 'all .15s',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.cyan + '10'; (e.currentTarget as HTMLElement).style.borderColor = C.cyan + '40'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="7" y="2" width="10" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/>
                        </svg>
                        {t('editor.shorts.createBtn')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Settings popover */}
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
                position: 'absolute', inset: 0, background: C.overlay,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 40,
              }}
            >
              <div style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
                padding: '20px 24px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 10, boxShadow: '0 4px 24px rgba(0,0,0,.4)',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{t('editor.deleteSceneConfirm')}</span>
                <span style={{ fontSize: 10, color: C.sub }}>{t('editor.deleteIrreversible')}</span>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <button
                    onClick={() => handleSceneConfirmDelete(confirmDel)}
                    style={{ padding: '7px 22px', borderRadius: 10, border: 'none', background: C.red, color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s ease' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                  >
                    {t('editor.delete')}
                  </button>
                  <button
                    onClick={handleSceneCancelDelete}
                    style={{ padding: '7px 22px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s ease' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.cardHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.bg; }}
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
            RIGHT PANEL — Preview area (spacious, dark)
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
                  padding: 24,
                  minHeight: 0,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: 860,
                    aspectRatio: '16/9',
                    borderRadius: 16,
                    background: sel.status === 'ready' ? '#000' : C.card,
                    border: `1px solid ${C.border}`,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {sel.status === 'ready' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      {sel.videoUrl ? (
                        <video src={sel.videoUrl} controls={isPlaying}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', borderRadius: 16 }}
                        />
                      ) : null}
                      {!isPlaying && (
                        <div onClick={() => setIsPlaying(true)}
                          style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: `${C.green}22`, border: `2px solid ${C.green}55`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'transform .15s, background .15s', zIndex: 2,
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; (e.currentTarget as HTMLElement).style.background = C.green + '33'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = C.green + '22'; }}
                        >
                          <span style={{ fontSize: 24, color: C.green, marginLeft: 3 }}>&#9654;</span>
                        </div>
                      )}
                      {!isPlaying && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.green, zIndex: 2 }}>{t('editor.videoReady')}</span>
                      )}
                    </div>
                  ) : sel.status === 'generating' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${selCol}22`, borderTopColor: selCol, animation: 'spin 1s linear infinite', boxShadow: `0 0 20px ${selCol}12` }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: selCol }}>{t('editor.generatingVideo')}</span>
                      <div style={{ width: 200 }}>
                        <div style={{ height: 3, borderRadius: 2, background: C.card, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 2,
                            background: `linear-gradient(90deg, ${selCol}, ${selCol}cc)`,
                            width: progress != null ? `${Math.min(progress, 100)}%` : '30%',
                            transition: progress != null ? 'width .5s ease' : 'none',
                            animation: progress == null ? 'shimmer 1.8s linear infinite' : 'none',
                            backgroundSize: progress == null ? '200% 100%' : 'auto',
                            backgroundImage: progress == null ? `linear-gradient(90deg, ${selCol}44, ${selCol}, ${selCol}44)` : `linear-gradient(90deg, ${selCol}, ${selCol}cc)`,
                          }} />
                        </div>
                        <div style={{ textAlign: 'center', fontSize: 9, color: C.dim, marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>
                          {progress != null ? `${Math.round(progress)}%` : t('editor.pleaseWait')}
                        </div>
                      </div>
                    </div>
                  ) : sel.status === 'error' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.accent + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: C.accent }}>!</div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>{t('editor.generationError')}</span>
                      {lastError && (
                        <span style={{ fontSize: 11, color: C.sub, textAlign: 'center', maxWidth: 300, lineHeight: 1.4 }}>{lastError}</span>
                      )}
                      <button onClick={handleGenerate} disabled={!sel.prompt.trim()}
                        style={{
                          marginTop: 4, padding: '8px 20px', borderRadius: 10, border: 'none',
                          background: sel.prompt.trim() ? C.accent : C.dim, color: C.text,
                          fontSize: 12, fontWeight: 600,
                          cursor: sel.prompt.trim() ? 'pointer' : 'not-allowed',
                          fontFamily: 'inherit', transition: 'all .15s',
                          opacity: sel.prompt.trim() ? 1 : 0.5,
                        }}
                      >
                        {t('editor.retryGeneration')}
                      </button>
                    </div>
                  ) : (
                    /* ── Empty / editing state ── */
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 24 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="3" />
                          <path d="M10 8l6 4-6 4V8z" />
                        </svg>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                        {!sel.prompt.trim() ? t('editor.enterPromptBelow') : t('editor.clickGenerate')}
                      </span>
                      <span style={{ fontSize: 11, color: C.dim, textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>
                        {t('editor.promptPlaceholder')}
                      </span>
                    </div>
                  )}

                  {/* Top-left scene label overlay */}
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 5, alignItems: 'center' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 8, background: 'rgba(0,0,0,.55)',
                      color: C.text, fontSize: 10, fontWeight: 500, border: `1px solid ${C.border}`,
                      backdropFilter: 'blur(12px)',
                    }}>
                      {sel.label}
                    </span>
                    <StatusDot status={sel.status} C={C} size={6} />
                  </div>

                  {/* Top-right model + duration overlay */}
                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 8, background: 'rgba(0,0,0,.55)',
                      color: C.text, fontSize: 10, fontWeight: 500, border: `1px solid ${C.border}`,
                      backdropFilter: 'blur(12px)',
                    }}>
                      {selMod.icon} {selMod.name}
                    </span>
                    <span style={{
                      padding: '3px 8px', borderRadius: 8, background: 'rgba(0,0,0,.55)',
                      color: C.text, fontSize: 10, fontWeight: 500,
                      fontFamily: "'JetBrains Mono', monospace",
                      border: `1px solid ${C.border}`, backdropFilter: 'blur(12px)',
                    }}>
                      {fmtDur(sel.duration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Playback controls ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 24px 12px', flexShrink: 0 }}>
                {sel.status === 'ready' ? (
                  <button className="ed-action-btn" onClick={() => setIsPlaying(!isPlaying)}
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      border: `1px solid ${C.border}`, background: C.surface,
                      color: C.text, fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'inherit', transition: 'all .15s',
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
              </div>
            </>
          ) : (
            /* ── No scene selected — "How it works" empty state ── */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: C.card, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="3" />
                  <path d="M10 8l6 4-6 4V8z" />
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                  {scenes.length === 0 ? t('editor.addFirstScene') : t('editor.selectSceneLeft')}
                </div>
                <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, maxWidth: 400 }}>
                  {t('editor.promptPlaceholder')}
                </div>
              </div>
              {scenes.length === 0 && (
                <button
                  className="ed-gen-btn"
                  onClick={() => addScene()}
                  style={{
                    marginTop: 8, padding: '12px 32px', borderRadius: 12, border: 'none',
                    background: `linear-gradient(135deg, ${C.accent}, ${C.blue})`,
                    color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all .2s ease',
                    boxShadow: `0 4px 20px ${C.accent}30`,
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

      {/* ═══ Z1: Script Generator Modal ═══ */}
      {showScriptModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('editor.toolbar.generateScript')}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowScriptModal(false); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(12px)',
          }}
          onClick={() => setShowScriptModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
              padding: '32px 28px', width: 420, maxWidth: 'calc(100vw - 32px)',
              boxShadow: '0 8px 40px rgba(0,0,0,.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                {t('editor.script.generateTitle')}
              </h3>
              <button
                onClick={() => setShowScriptModal(false)}
                aria-label={t('common.close')}
                style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: C.sub, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}
              >
                &#10005;
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 6, display: 'block' }}>{t('editor.script.videoTopic')}</label>
              <input
                value={scriptTopic}
                onChange={(e) => setScriptTopic(e.target.value)}
                placeholder={t('editor.script.topicPlaceholder')}
                maxLength={500}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.surface,
                  color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color .15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.purple + '55'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 6, display: 'block' }}>{t('editor.script.tone')}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {([
                    { value: 'professional' as const, label: t('editor.script.toneProfessional') },
                    { value: 'casual' as const, label: t('editor.script.toneCasual') },
                    { value: 'fun' as const, label: t('editor.script.toneFun') },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setScriptTone(opt.value)}
                      style={{
                        padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                        border: `1px solid ${scriptTone === opt.value ? C.purple + '55' : C.border}`,
                        background: scriptTone === opt.value ? C.purple + '10' : 'transparent',
                        color: scriptTone === opt.value ? C.purple : C.text,
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        transition: 'all .15s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 6, display: 'block' }}>{t('editor.script.durationLabel')}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {([
                    { value: '30s' as const, label: t('editor.script.duration30s') },
                    { value: '1min' as const, label: t('editor.script.duration1min') },
                    { value: '3min' as const, label: t('editor.script.duration3min') },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setScriptDuration(opt.value)}
                      style={{
                        padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                        border: `1px solid ${scriptDuration === opt.value ? C.purple + '55' : C.border}`,
                        background: scriptDuration === opt.value ? C.purple + '10' : 'transparent',
                        color: scriptDuration === opt.value ? C.purple : C.text,
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        transition: 'all .15s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: C.dim, marginBottom: 16 }}>
              {t('editor.script.costNote')}
            </div>

            <button
              onClick={() => {
                if (!scriptTopic.trim()) { toast.error(t('editor.script.topicRequired')); return; }
                generateScript.mutate({ topic: scriptTopic, tone: scriptTone, duration: scriptDuration });
              }}
              disabled={generateScript.isPending || !scriptTopic.trim()}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
                background: (!scriptTopic.trim() || generateScript.isPending) ? C.dim : C.purple,
                color: C.text, fontSize: 14, fontWeight: 600, cursor: (!scriptTopic.trim() || generateScript.isPending) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all .2s ease',
                opacity: (!scriptTopic.trim() || generateScript.isPending) ? 0.4 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: (!scriptTopic.trim() || generateScript.isPending) ? 'none' : `0 2px 12px ${C.purple}30`,
              }}
            >
              {generateScript.isPending ? (
                <>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${C.dim}`, borderTopColor: '#fff', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
                  {t('editor.script.generating')}
                </>
              ) : t('editor.script.generateScenario')}
            </button>
          </div>
        </div>
      )}

      {/* ═══ Z2: Captions Modal (SRT preview + download) ═══ */}
      {showCaptionsModal && captionsSrt && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(12px)',
          }}
          onClick={() => setShowCaptionsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
              padding: '32px 28px', width: 500, maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
              boxShadow: '0 8px 40px rgba(0,0,0,.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0 }}>{t('editor.captions.title')}</h3>
              <button
                onClick={() => setShowCaptionsModal(false)}
                style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: C.sub, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}
              >
                &#10005;
              </button>
            </div>

            <pre style={{
              flex: 1, minHeight: 0, overflow: 'auto', padding: 16, borderRadius: 10,
              background: C.surface, border: `1px solid ${C.border}`, color: C.text,
              fontSize: 12, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6,
              whiteSpace: 'pre-wrap', margin: '0 0 16px 0',
            }}>
              {captionsSrt}
            </pre>

            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button
                onClick={() => {
                  const blob = new Blob([captionsSrt], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${sync.project?.title || 'video'}-subtitles.srt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success(t('editor.captions.downloaded'));
                }}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                  background: C.green, color: C.text, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {t('editor.captions.downloadSrt')}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(captionsSrt).then(() => toast.success(t('editor.captions.copied')));
                }}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: 'transparent',
                  color: C.text, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {t('editor.captions.copy')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Z5: Create Shorts Modal ═══ */}
      {showShortsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('editor.toolbar.createShorts')}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowShortsModal(false); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(12px)',
          }}
          onClick={() => setShowShortsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
              padding: '36px 32px', width: 400, maxWidth: 'calc(100vw - 32px)',
              boxShadow: '0 8px 40px rgba(0,0,0,.4)', textAlign: 'center',
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
              background: C.cyan + '12', border: `2px solid ${C.cyan}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="7" y="2" width="10" height="20" rx="2"/>
                <line x1="12" y1="18" x2="12" y2="18"/>
              </svg>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
              {t('editor.shorts.title')}
            </h3>
            <p style={{ fontSize: 13, color: C.sub, margin: '0 0 20px', lineHeight: 1.6 }}>
              {t('editor.shorts.description')}
            </p>

            <div style={{
              background: C.surface, borderRadius: 10, padding: 16,
              border: `1px solid ${C.border}`, marginBottom: 20, textAlign: 'left',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>{t('editor.shorts.whatWillBeDone')}</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: C.sub, fontSize: 12, lineHeight: 1.8 }}>
                <li>{t('editor.shorts.analyzeHighlights')}</li>
                <li>{t('editor.shorts.autoCrop')}</li>
                <li>{t('editor.shorts.verticalFormat')}</li>
                <li>{t('editor.shorts.optimizeAlgorithms')}</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setShowShortsModal(false);
                toast.info(t('editor.shorts.comingSoon'));
              }}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
                background: C.blue,
                color: C.text, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .2s ease',
                boxShadow: `0 2px 12px ${C.blue}30`,
              }}
            >
              {t('editor.shorts.generate')}
            </button>
            <button
              onClick={() => setShowShortsModal(false)}
              style={{
                width: '100%', padding: '11px 0', marginTop: 8, borderRadius: 12,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.sub, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .2s ease',
              }}
            >
              {t('editor.shorts.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* ── Global hover styles + keyframes ── */}
      <style>{`
        .scene-thumb { transition: all .2s ease-out !important; }
        .scene-thumb:hover { transform: translateY(-1px); }
        .scene-thumb:hover .scene-drag-handle { opacity: 0.8 !important; }
        .ed-action-btn { transition: all .2s ease-out !important; }
        .ed-action-btn:hover { background: ${C.border} !important; border-color: ${C.border} !important; color: ${C.text} !important; }
        .ed-timeline-tab { transition: all .2s ease-out !important; }
        .ed-timeline-tab:hover { border-color: ${C.borderActive} !important; }
        .ed-gen-btn { transition: all .2s ease-out !important; }
        .ed-gen-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.08); box-shadow: 0 6px 24px ${C.accent}55 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes editorShimmer {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        /* Thin scrollbars */
        .ed-scene-list::-webkit-scrollbar,
        .ed-timeline-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .ed-scene-list::-webkit-scrollbar-track,
        .ed-timeline-scroll::-webkit-scrollbar-track { background: transparent; }
        .ed-scene-list::-webkit-scrollbar-thumb,
        .ed-timeline-scroll::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        .ed-scene-list::-webkit-scrollbar-thumb:hover,
        .ed-timeline-scroll::-webkit-scrollbar-thumb:hover { background: ${C.borderActive}; }
        * { scrollbar-width: thin; scrollbar-color: ${C.border} transparent; }

        /* Focus ring accent */
        .ed-action-btn:focus-visible,
        .ed-gen-btn:focus-visible,
        .ed-timeline-tab:focus-visible {
          outline: 2px solid ${C.accent};
          outline-offset: 2px;
        }

        /* ── Left panel ── */
        .tf-editor-left-panel {
          position: relative;
        }

        /* ── Mobile editor optimizations ── */
        @media (max-width: 768px) {
          .tf-editor-left-panel {
            position: fixed !important;
            top: 0; left: 0; bottom: 0;
            z-index: 900;
            width: 300px !important;
            box-shadow: 0 0 40px rgba(0,0,0,.5);
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
          .ed-gen-btn {
            min-height: 48px !important;
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
    fontSize: 11,
    fontWeight: 600,
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: 6,
    display: 'block',
  };
}

function compactInputStyle(C: Theme): React.CSSProperties {
  return {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontSize: 12,
    fontWeight: 500,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    transition: 'border-color .2s ease-out',
  };
}

function tinyBtnStyle(C: Theme, active: boolean): React.CSSProperties {
  return {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: `1px solid ${active ? C.accent + '30' : C.border}`,
    background: active ? C.accent + '12' : 'transparent',
    color: active ? C.accent : C.sub,
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
    lineHeight: 1,
    padding: 0,
    transition: 'all .2s ease-out',
  };
}
