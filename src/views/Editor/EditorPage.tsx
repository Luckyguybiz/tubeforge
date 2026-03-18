'use client';

import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useEditorStore } from '@/stores/useEditorStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProjectPicker } from '@/components/ui/ProjectPicker';
import { MODELS } from '@/lib/constants';
import { fmtDur, pluralRu } from '@/lib/utils';
import { useProjectSync } from '@/hooks/useProjectSync';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import type { Theme, Scene } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════════
   STATUS BADGE CONFIG
   ═══════════════════════════════════════════════════════════════════ */
const STATUS_CFG: Record<string, { label: string; colorKey: string }> = {
  empty:      { label: 'Пусто',      colorKey: 'dim' },
  editing:    { label: 'Черновик',    colorKey: 'blue' },
  generating: { label: 'Генерация',  colorKey: 'orange' },
  ready:      { label: 'Готово',     colorKey: 'green' },
  error:      { label: 'Ошибка',    colorKey: 'accent' },
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
        border: `1.5px solid ${isDragOver ? col + '66' : isSel ? col + '40' : 'transparent'}`,
        cursor: 'pointer',
        transition: 'all .15s',
        opacity: isDragging ? 0.4 : 1,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Color thumbnail area */}
      <div
        style={{
          height: 44,
          background: sc.status === 'ready'
            ? `linear-gradient(135deg, ${col}20, ${col}08)`
            : `linear-gradient(135deg, ${col}12, transparent)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
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
      <div style={{ padding: '5px 8px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
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
      </div>
    </div>
  );
});

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
        left: 208,
        width: 280,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        boxShadow: '0 12px 40px rgba(0,0,0,.35)',
        zIndex: 50,
        overflow: 'hidden',
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
          Настройки сцены
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
          }}
        >
          &#10005;
        </button>
      </div>

      <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Scene name */}
        <div>
          <label style={compactLabelStyle(C)}>Название</label>
          <input
            value={sc.label}
            maxLength={100}
            onChange={(e) => onUpdate(sc.id, { label: e.target.value })}
            style={compactInputStyle(C)}
          />
        </div>

        {/* Model selector */}
        <div>
          <label style={compactLabelStyle(C)}>Модель</label>
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
            <label style={{ ...compactLabelStyle(C), marginBottom: 0 }}>Длительность</label>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: col }}>
              {sc.duration}с
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
            <span>1с</span>
            <span>30с</span>
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

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [modPick, setModPick] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const sceneListRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const promptHistoryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef(false);

  // Video generation hook for selected scene
  const videoGen = useVideoGeneration(selId);

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

  const handleGenerate = useCallback(() => {
    const store = useEditorStore.getState();
    const currentSel = store.scenes.find((s) => s.id === store.selId);
    if (!currentSel || !currentSel.prompt.trim() || videoGen.isGenerating) return;
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
  const historyLen = useEditorStore((s) => s.history.length);
  const futureLen = useEditorStore((s) => s.future.length);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.getState().undo();
      }
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        useEditorStore.getState().redo();
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
    const lineHeight = 20;
    const maxLines = 3;
    const maxH = lineHeight * maxLines + 16; // padding
    el.style.height = Math.min(el.scrollHeight, maxH) + 'px';
  }, []);

  /* --- Computed (memoized) --- */
  const gc = useCallback((k: string) => (C[k as keyof Theme] as string) || C.accent, [C]);
  const sel = useMemo(() => scenes.find((s) => s.id === selId), [scenes, selId]);
  const totalDur = useMemo(() => scenes.reduce((a, s) => a + s.duration, 0), [scenes]);

  const isGenerating = videoGen.isGenerating;
  const progress = videoGen.progress;

  /* ═══════════════════════════════════════════════════════════════
     NO PROJECT — Project picker
     ═══════════════════════════════════════════════════════════════ */
  if (!projectId) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <ProjectPicker target="/editor" title="Редактор" />
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
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Не удалось загрузить проект</div>
          <div style={{ fontSize: 12, color: C.sub, textAlign: 'center', maxWidth: 280 }}>Проверьте подключение и попробуйте ещё раз</div>
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
            Повторить
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
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 16px',
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
          minHeight: 42,
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
            title="Нажмите для редактирования"
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
            {sync.project?.title || 'Без названия'}
          </div>
        )}

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: C.border }} />

        {/* Scene count + duration */}
        <span style={{ fontSize: 10, color: C.sub, fontWeight: 500 }}>
          {pluralRu(scenes.length, 'сцена', 'сцены', 'сцен')} · {fmtDur(totalDur)}
        </span>

        <div style={{ flex: 1 }} />

        {/* Save status */}
        {saveStatus === 'saving' && (
          <span style={{ fontSize: 9, color: C.dim, fontWeight: 500 }}>Сохранение...</span>
        )}
        {saveStatus === 'saved' && (
          <span style={{ fontSize: 9, color: C.green, fontWeight: 500 }}>Сохранено &#10003;</span>
        )}
        {saveStatus === 'error' && (
          <span style={{ fontSize: 9, color: C.accent, fontWeight: 500 }}>Ошибка сохранения</span>
        )}

        {/* Undo / Redo */}
        <div style={{ display: 'flex', gap: 2 }}>
          <button
            onClick={undo}
            disabled={historyLen === 0}
            title="Отменить (Ctrl+Z)"
            aria-label="Отменить"
            style={{
              width: 28,
              height: 28,
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
            }}
          >
            &#8617;
          </button>
          <button
            onClick={redo}
            disabled={futureLen === 0}
            title="Повторить (Ctrl+Shift+Z)"
            aria-label="Повторить"
            style={{
              width: 28,
              height: 28,
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
            }}
          >
            &#8618;
          </button>
        </div>

        {/* Export / Generate pill */}
        <button
          onClick={handleGenerate}
          disabled={!sel || !sel.prompt.trim() || isGenerating}
          style={{
            padding: '6px 20px',
            borderRadius: 20,
            border: 'none',
            background: (!sel || !sel.prompt.trim() || isGenerating)
              ? C.dim
              : `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            cursor: (!sel || !sel.prompt.trim() || isGenerating) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '.02em',
            opacity: (!sel || !sel.prompt.trim() || isGenerating) ? 0.45 : 1,
            transition: 'all .2s',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: (!sel || !sel.prompt.trim() || isGenerating)
              ? 'none'
              : `0 2px 12px ${C.accent}30`,
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
              Генерация...
            </>
          ) : (
            <>
              <span style={{ fontSize: 10 }}>&#9654;</span>
              Генерировать
            </>
          )}
        </button>
      </div>

      {/* ── Main content area: Left scenes + Center preview ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ════════════════════════════════════════════════
            LEFT PANEL — Scene thumbnails (~200px)
            ════════════════════════════════════════════════ */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            background: C.surface,
            borderRight: `1px solid ${C.border}`,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Scene list header */}
          <div style={{ padding: '10px 10px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Сцены
            </span>
            <button
              onClick={() => addScene()}
              title="Добавить сцену"
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
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '0 8px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {scenes.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px 12px',
                  gap: 8,
                }}
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
                  }}
                >
                  +
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.sub, textAlign: 'center' }}>
                  Добавьте сцену
                </span>
              </div>
            ) : (
              scenes.map((sc, idx) => (
                <SceneThumb
                  key={sc.id}
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
              ))
            )}
          </div>

          {/* Selected scene actions at bottom of left panel */}
          {sel && (
            <div style={{ padding: '6px 8px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                onClick={() => dupScene(sel.id)}
                title="Дублировать сцену"
                style={{ ...tinyBtnStyle(C, false), display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 11 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Копия
              </button>
              <button
                onClick={() => addScene(sel.id)}
                title="Добавить сцену после"
                style={{ ...tinyBtnStyle(C, false), display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 11 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Добавить
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="Настройки сцены"
                style={{ ...tinyBtnStyle(C, showSettings), display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 11 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              </button>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => {
                  if (scenes.length <= 1) return;
                  handleSceneRequestDelete(sel.id);
                }}
                title="Удалить сцену"
                style={{
                  ...tinyBtnStyle(C, false),
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 11,
                  color: scenes.length <= 1 ? C.dim : C.accent,
                  opacity: scenes.length <= 1 ? 0.3 : 1,
                  cursor: scenes.length <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          )}

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
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Удалить сцену?</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleSceneConfirmDelete(confirmDel)}
                    style={{
                      padding: '5px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: C.accent,
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Да
                  </button>
                  <button
                    onClick={handleSceneCancelDelete}
                    style={{
                      padding: '5px 16px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.card,
                      color: C.sub,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Нет
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════
            CENTER — Video Preview + Prompt Input
            ════════════════════════════════════════════════ */}
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
                  padding: '20px 32px 12px',
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
                          Видео готово
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
                        Генерация видео...
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
                          {progress != null ? `${Math.round(progress)}%` : 'Подождите...'}
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
                        Ошибка генерации
                      </span>
                      <span style={{ fontSize: 10, color: C.sub }}>
                        Измените промпт и попробуйте снова
                      </span>
                    </div>
                  ) : !sel.prompt.trim() ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 24px' }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          border: `1.5px dashed ${C.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          color: C.dim,
                        }}
                      >
                        &#9998;
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.dim }}>
                        Введите промпт ниже
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: selCol + '10',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                          color: selCol,
                          opacity: 0.6,
                        }}
                      >
                        &#9654;
                      </div>
                      <span style={{ fontSize: 11, color: C.dim }}>
                        Нажмите &laquo;Генерировать&raquo;
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

              {/* ── Playback controls ── */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '0 32px 8px',
                  flexShrink: 0,
                }}
              >
                <button
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
                  title={isPlaying ? 'Пауза' : 'Воспроизвести'}
                >
                  {isPlaying ? '||' : '\u25B6'}
                </button>
                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: C.sub, fontWeight: 500 }}>
                  00:00 / {fmtDur(sel.duration)}
                </span>
                <div style={{ flex: 1 }} />
                {/* Model badge */}
                <span style={{ fontSize: 9, color: C.dim, fontWeight: 500 }}>
                  {(MODELS.find((m) => m.id === sel.model) || MODELS[1]).icon}{' '}
                  {(MODELS.find((m) => m.id === sel.model) || MODELS[1]).name}
                </span>
              </div>

              {/* ── Compact prompt input ── */}
              <div
                style={{
                  padding: '0 32px 12px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 8,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: '8px 12px',
                    transition: 'border-color .15s',
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
                      if (promptHistoryTimer.current) clearTimeout(promptHistoryTimer.current);
                      promptHistoryTimer.current = setTimeout(() => {
                        useEditorStore.getState().pushHistory();
                      }, 1000);
                    }}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    placeholder="Опишите, что происходит в сцене..."
                    maxLength={2000}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: C.text,
                      fontSize: 12,
                      lineHeight: '20px',
                      resize: 'none',
                      fontFamily: 'inherit',
                      minHeight: 20,
                      maxHeight: 76,
                      overflow: 'hidden',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, paddingBottom: 1 }}>
                    <span style={{ fontSize: 8, color: sel.prompt.length > 1800 ? C.accent : C.dim, fontFamily: "'JetBrains Mono', monospace" }}>
                      {sel.prompt.length > 0 ? `${sel.prompt.length}/2000` : ''}
                    </span>
                    <span
                      style={{
                        fontSize: 7,
                        color: C.dim,
                        padding: '1px 4px',
                        borderRadius: 3,
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
              </div>
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
                {scenes.length === 0 ? 'Добавьте первую сцену' : 'Выберите сцену слева'}
              </span>
              {scenes.length === 0 && (
                <button
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
                  }}
                >
                  + Добавить сцену
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          BOTTOM TIMELINE BAR
          ════════════════════════════════════════════════ */}
      <div
        style={{
          flexShrink: 0,
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          padding: '6px 12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            overflowX: 'auto',
            overflowY: 'hidden',
            minHeight: 40,
          }}
        >
          {scenes.map((sc, idx) => {
            const col = gc(sc.ck);
            const isSelScene = sc.id === selId;

            return (
              <div
                key={sc.id}
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
                  border: `1.5px solid ${sc.id === dragOv ? col + '66' : isSelScene ? col + '40' : C.border}`,
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
                title={`${sc.label} - ${fmtDur(sc.duration)}`}
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
            title="Добавить сцену"
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

      {/* ── Global hover styles ── */}
      <style>{`
        .scene-thumb:hover { opacity: 0.85; }
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
    width: 26,
    height: 26,
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
    transition: 'all .15s',
  };
}
