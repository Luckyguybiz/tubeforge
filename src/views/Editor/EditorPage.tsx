'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
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
   STATUS BADGE COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
function StatusBadge({ status, C }: { status: string; C: Theme }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.empty;
  const col = getStatusColor(status, C);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 7px',
        borderRadius: 6,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '.01em',
        background: col + '15',
        color: col,
        border: `1px solid ${col}25`,
        whiteSpace: 'nowrap',
      }}
    >
      {status === 'generating' ? (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            border: `1.5px solid ${col}44`,
            borderTopColor: col,
            animation: 'spin .8s linear infinite',
            flexShrink: 0,
          }}
        />
      ) : (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: col,
            flexShrink: 0,
          }}
        />
      )}
      {cfg.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SKELETON LOADERS
   ═══════════════════════════════════════════════════════════════════ */
function SceneListSkeleton({ C }: { C: Theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 8px' }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 10px',
            borderRadius: 10,
            background: C.card,
          }}
        >
          <Skeleton width={20} height={20} rounded />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width="70%" height={12} />
            <Skeleton width="40%" height={10} />
          </div>
          <Skeleton width={48} height={18} rounded />
        </div>
      ))}
    </div>
  );
}

function DetailPanelSkeleton({ C }: { C: Theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
      <Skeleton width="50%" height={14} />
      <Skeleton width="100%" height={44} />
      <Skeleton width="100%" height={120} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Skeleton width="50%" height={36} />
        <Skeleton width="50%" height={36} />
      </div>
      <Skeleton width="100%" height={8} style={{ borderRadius: 4 }} />
      <Skeleton width="100%" height={48} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE CARD (memoized)
   ═══════════════════════════════════════════════════════════════════ */

interface SceneCardProps {
  scene: Scene;
  idx: number;
  C: Theme;
  isSel: boolean;
  isDragOver: boolean;
  isDragging: boolean;
  isConfirmDel: boolean;
  canDelete: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDragEnd: () => void;
  onDup: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}

const SceneCard = memo(function SceneCard({
  scene: sc,
  idx,
  C,
  isSel,
  isDragOver,
  isDragging,
  isConfirmDel,
  canDelete,
  onSelect,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDup,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: SceneCardProps) {
  const col = getStatusColor(sc.status, C) !== C.dim ? getStatusColor(sc.status, C) : (C[sc.ck as keyof Theme] as string || C.accent);

  return (
    <div
      className="sc-row"
      draggable
      onDragStart={() => onDragStart(sc.id)}
      onDragEnter={() => onDragEnter(sc.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => onSelect(sc.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        marginBottom: 2,
        borderRadius: 10,
        background: isSel ? col + '10' : 'transparent',
        border: `1.5px solid ${isDragOver ? col + '66' : isSel ? col + '30' : 'transparent'}`,
        cursor: 'pointer',
        transition: 'all .15s',
        position: 'relative',
        overflow: 'hidden',
        opacity: isDragging ? 0.45 : 1,
      }}
    >
      {/* Drag handle */}
      <div
        style={{
          width: 24,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          color: isSel ? col + '88' : C.dim,
          fontSize: 7,
          lineHeight: 1,
          gap: 1,
          paddingLeft: 4,
          userSelect: 'none',
        }}
        title="Перетащите для перемещения"
      >
        <span style={{ letterSpacing: '2px' }}>··</span>
        <span style={{ letterSpacing: '2px' }}>··</span>
        <span style={{ letterSpacing: '2px' }}>··</span>
      </div>

      {/* Color bar */}
      <div
        style={{
          width: 3,
          alignSelf: 'stretch',
          background: col,
          borderRadius: 2,
          flexShrink: 0,
          opacity: isSel ? 1 : 0.4,
          marginRight: 8,
        }}
      />

      {/* Scene content */}
      <div
        style={{
          flex: 1,
          padding: '9px 10px 9px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minWidth: 0,
        }}
      >
        {/* Top row: number + label + status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              fontWeight: 700,
              color: isSel ? col : C.dim,
              flexShrink: 0,
              width: 16,
            }}
          >
            {String(idx + 1).padStart(2, '0')}
          </span>
          <span
            style={{
              fontSize: 12,
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
          <StatusBadge status={sc.status} C={C} />
        </div>

        {/* Bottom row: duration + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
              color: C.dim,
              padding: '1px 5px',
              borderRadius: 4,
              background: C.card,
            }}
          >
            {fmtDur(sc.duration)}
          </span>

          {/* Prompt preview */}
          <span
            style={{
              fontSize: 10,
              color: C.dim,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              fontStyle: sc.prompt ? 'normal' : 'italic',
            }}
          >
            {sc.prompt
              ? sc.prompt.length > 30 ? sc.prompt.slice(0, 30) + '...' : sc.prompt
              : 'Нет промпта'}
          </span>

          <div style={{ flex: 1 }} />

          {/* Actions — shown on hover/select */}
          <div
            className="sc-row-actions"
            style={{
              display: 'flex',
              gap: 2,
              opacity: isSel ? 1 : 0,
              transition: 'opacity .15s',
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onDup(sc.id); }}
              title="Дублировать"
              style={actionBtnStyle(C)}
            >
              +
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!canDelete) return;
                onRequestDelete(sc.id);
              }}
              title="Удалить"
              style={{
                ...actionBtnStyle(C),
                color: !canDelete ? C.dim : C.accent,
                opacity: !canDelete ? 0.3 : 1,
              }}
            >
              x
            </button>
          </div>
        </div>
      </div>

      {/* Inline confirm delete overlay */}
      {isConfirmDel && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `${C.card}f0`,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            zIndex: 5,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>Удалить?</span>
          <button
            onClick={(e) => { e.stopPropagation(); onConfirmDelete(sc.id); }}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: 'none',
              background: C.accent,
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Да
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCancelDelete(); }}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.card,
              color: C.sub,
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Нет
          </button>
        </div>
      )}
    </div>
  );
});

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
  const titleInputRef = useRef<HTMLInputElement>(null);
  const modDropRef = useRef<HTMLDivElement>(null);
  const [modPick, setModPick] = useState(false);
  const sceneListRef = useRef<HTMLDivElement>(null);
  const promptHistoryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef(false);

  // Video generation hook for selected scene
  const videoGen = useVideoGeneration(selId);

  // Close model dropdown on outside click
  useEffect(() => {
    if (!modPick) return;
    const handler = (e: MouseEvent) => {
      if (modDropRef.current && !modDropRef.current.contains(e.target as Node)) {
        setModPick(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [modPick]);

  // Focus title input when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

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

  /* ─── Scene card callbacks (stable refs for memo) ──────────── */
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

  /* ─── Computed ──────────────────────────────────────────────── */
  const gc = (k: string) => (C[k as keyof Theme] as string) || C.accent;
  const sel = scenes.find((s) => s.id === selId);
  const totalDur = scenes.reduce((a, s) => a + s.duration, 0);
  const selMod = sel ? MODELS.find((m) => m.id === sel.model) || MODELS[1] : MODELS[1];

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
    return (
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Sidebar skeleton */}
        <div style={{ width: 280, flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 14px 8px' }}>
            <Skeleton width="60%" height={18} />
          </div>
          <div style={{ padding: '0 14px 8px' }}>
            <Skeleton width="40%" height={12} />
          </div>
          <SceneListSkeleton C={C} />
        </div>
        {/* Detail skeleton */}
        <div style={{ flex: 1, background: C.bg }}>
          <DetailPanelSkeleton C={C} />
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     ERROR STATE
     ═══════════════════════════════════════════════════════════════ */
  if (sync.isError) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
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
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ────────────────────────────────────────────────────────────
          LEFT SIDEBAR — Scene List
          ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: C.surface,
          borderRight: `1px solid ${C.border}`,
          overflow: 'hidden',
        }}
      >
        {/* ── Project header ── */}
        <div style={{ padding: '14px 14px 4px', display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                width: '100%',
                padding: '4px 8px',
                borderRadius: 6,
                border: `1.5px solid ${C.accent}55`,
                background: C.card,
                color: C.text,
                fontSize: 14,
                fontWeight: 700,
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <div
              onClick={startEditTitle}
              title="Нажмите для редактирования"
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.text,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                transition: 'background .15s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.card; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {sync.project?.title || 'Без названия'}
            </div>
          )}

          {/* Scene count + total duration + save status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px' }}>
            <span style={{ fontSize: 10, color: C.sub, fontWeight: 500 }}>
              {pluralRu(scenes.length, 'сцена', 'сцены', 'сцен')} · {fmtDur(totalDur)}
            </span>
            <div style={{ flex: 1 }} />
            {saveStatus === 'saving' && (
              <span style={{ fontSize: 9, color: C.dim, fontWeight: 500 }}>Сохранение...</span>
            )}
            {saveStatus === 'saved' && (
              <span style={{ fontSize: 9, color: C.green, fontWeight: 500 }}>Сохранено</span>
            )}
            {saveStatus === 'error' && (
              <span style={{ fontSize: 9, color: C.accent, fontWeight: 500 }}>Ошибка</span>
            )}
          </div>

          {/* Undo / Redo buttons */}
          <div style={{ display: 'flex', gap: 4, padding: '2px 8px 0' }}>
            <button
              onClick={undo}
              disabled={historyLen === 0}
              title="Отменить (Ctrl+Z)"
              aria-label="Отменить"
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: 'transparent',
                color: historyLen === 0 ? C.dim : C.sub,
                fontSize: 10,
                fontWeight: 600,
                cursor: historyLen === 0 ? 'default' : 'pointer',
                fontFamily: 'inherit',
                opacity: historyLen === 0 ? 0.4 : 1,
                transition: 'all .15s',
              }}
            >
              &#8617; Отменить
            </button>
            <button
              onClick={redo}
              disabled={futureLen === 0}
              title="Повторить (Ctrl+Shift+Z)"
              aria-label="Повторить"
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: 'transparent',
                color: futureLen === 0 ? C.dim : C.sub,
                fontSize: 10,
                fontWeight: 600,
                cursor: futureLen === 0 ? 'default' : 'pointer',
                fontFamily: 'inherit',
                opacity: futureLen === 0 ? 0.4 : 1,
                transition: 'all .15s',
              }}
            >
              Повторить &#8618;
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: C.border, margin: '4px 14px 0' }} />

        {/* ── Scrollable scene list ── */}
        <div
          ref={sceneListRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '8px 8px 4px',
          }}
        >
          {scenes.length === 0 ? (
            /* ── Empty state ── */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 20px',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: C.accent + '10',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: C.accent,
                }}
              >
                +
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                Добавьте первую сцену
              </span>
              <span style={{ fontSize: 11, color: C.sub, textAlign: 'center', lineHeight: 1.5 }}>
                Нажмите кнопку ниже, чтобы создать первую сцену вашего видео
              </span>
            </div>
          ) : (
            scenes.map((sc, idx) => (
              <SceneCard
                key={sc.id}
                scene={sc}
                idx={idx}
                C={C}
                isSel={sc.id === selId}
                isDragOver={sc.id === dragOv}
                isDragging={dragId === sc.id}
                isConfirmDel={confirmDel === sc.id}
                canDelete={scenes.length > 1}
                onSelect={handleSceneSelect}
                onDragStart={handleSceneDragStart}
                onDragEnter={handleSceneDragEnter}
                onDragEnd={handleSceneDragEnd}
                onDup={dupScene}
                onRequestDelete={handleSceneRequestDelete}
                onConfirmDelete={handleSceneConfirmDelete}
                onCancelDelete={handleSceneCancelDelete}
              />
            ))
          )}
        </div>

        {/* ── Add scene button ── */}
        <div style={{ padding: '8px 10px 10px' }}>
          <button
            onClick={() => addScene()}
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: 10,
              border: `1.5px dashed ${C.border}`,
              background: 'transparent',
              color: C.sub,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = C.accent + '55';
              (e.currentTarget as HTMLElement).style.color = C.accent;
              (e.currentTarget as HTMLElement).style.background = C.accent + '08';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = C.border;
              (e.currentTarget as HTMLElement).style.color = C.sub;
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            Добавить сцену
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          MAIN PANEL — Scene Detail
          ──────────────────────────────────────────────────────────── */}
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
            {/* ── Scene detail scrollable area ── */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '20px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {/* ── Video preview / status area ── */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  maxHeight: 360,
                  borderRadius: 14,
                  background: sel.status === 'ready' ? '#000' : `radial-gradient(ellipse at center, ${gc(sel.ck)}12 0%, ${C.surface} 70%)`,
                  border: `1.5px solid ${sel.status === 'ready' ? C.border : gc(sel.ck) + '20'}`,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: `0 4px 24px rgba(0,0,0,.15)`,
                }}
              >
                {sel.status === 'ready' ? (
                  /* Video player placeholder */
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: `${C.green}20`,
                        border: `2px solid ${C.green}44`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform .15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                    >
                      <span style={{ fontSize: 24, color: C.green, marginLeft: 3 }}>&#9654;</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.green }}>
                      Видео готово
                    </span>
                  </div>
                ) : sel.status === 'generating' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    {/* Spinner */}
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        border: `3px solid ${gc(sel.ck)}22`,
                        borderTopColor: gc(sel.ck),
                        animation: 'spin 1s linear infinite',
                        boxShadow: `0 0 24px ${gc(sel.ck)}15`,
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: gc(sel.ck) }}>
                      Генерация видео...
                    </span>
                    {/* Progress bar */}
                    <div style={{ width: 200, maxWidth: '60%' }}>
                      <div
                        style={{
                          height: 4,
                          borderRadius: 2,
                          background: C.card,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            borderRadius: 2,
                            background: `linear-gradient(90deg, ${gc(sel.ck)}, ${gc(sel.ck)}cc)`,
                            width: progress != null ? `${Math.min(progress, 100)}%` : '30%',
                            transition: progress != null ? 'width .5s ease' : 'none',
                            animation: progress == null ? 'shimmer 1.8s linear infinite' : 'none',
                            backgroundSize: progress == null ? '200% 100%' : 'auto',
                            backgroundImage: progress == null
                              ? `linear-gradient(90deg, ${gc(sel.ck)}44, ${gc(sel.ck)}, ${gc(sel.ck)}44)`
                              : `linear-gradient(90deg, ${gc(sel.ck)}, ${gc(sel.ck)}cc)`,
                          }}
                        />
                      </div>
                      <div style={{ textAlign: 'center', fontSize: 10, color: C.dim, marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
                        {progress != null ? `${Math.round(progress)}%` : 'Подождите...'}
                      </div>
                    </div>
                  </div>
                ) : sel.status === 'error' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        background: C.accent + '15',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        color: C.accent,
                      }}
                    >
                      !
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>
                      Ошибка генерации
                    </span>
                    <span style={{ fontSize: 11, color: C.sub }}>
                      Попробуйте изменить промпт или модель
                    </span>
                  </div>
                ) : !sel.prompt.trim() ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 28px' }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        border: `1.5px dashed ${C.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        color: C.dim,
                      }}
                    >
                      +
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.dim }}>
                      Добавьте промпт
                    </span>
                    <span style={{ fontSize: 11, color: C.dim, opacity: 0.7 }}>
                      Опишите, что должно быть в сцене
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        background: gc(sel.ck) + '12',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        color: gc(sel.ck),
                        opacity: 0.6,
                      }}
                    >
                      &#9654;
                    </div>
                    <span style={{ fontSize: 12, color: C.dim }}>
                      Нажмите &laquo;Генерировать видео&raquo;
                    </span>
                  </div>
                )}

                {/* Top-left scene label badge */}
                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: gc(sel.ck) + '18',
                      color: gc(sel.ck),
                      fontSize: 10,
                      fontWeight: 600,
                      border: `1px solid ${gc(sel.ck)}25`,
                    }}
                  >
                    {sel.label}
                  </span>
                </div>

                {/* Top-right duration badge */}
                <span
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: C.card + 'cc',
                    color: C.text,
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                    border: `1px solid ${C.border}`,
                  }}
                >
                  {fmtDur(sel.duration)}
                </span>
              </div>

              {/* ── Prompt textarea ── */}
              <div>
                <label style={labelStyle(C)}>
                  Промпт
                </label>
                <textarea
                  value={sel.prompt}
                  onChange={(e) => {
                    updScene(sel.id, { prompt: e.target.value, status: sel.status === 'empty' ? 'editing' : sel.status });
                    if (promptHistoryTimer.current) clearTimeout(promptHistoryTimer.current);
                    promptHistoryTimer.current = setTimeout(() => {
                      useEditorStore.getState().pushHistory();
                    }, 1000);
                  }}
                  placeholder="Опишите, что происходит в сцене. Например: «Камера плавно летит над горным озером на рассвете, туман поднимается от воды, мягкий золотистый свет»"
                  maxLength={2000}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  style={{
                    width: '100%',
                    minHeight: 120,
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: 13,
                    lineHeight: 1.6,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'border-color .15s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = gc(sel.ck) + '55'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: C.dim }}>
                    Ctrl+Enter — генерировать
                  </span>
                  <span style={{ fontSize: 9, color: sel.prompt.length > 1800 ? C.accent : C.dim }}>
                    {sel.prompt.length}/2000
                  </span>
                </div>
              </div>

              {/* ── Controls grid ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Label input */}
                <div>
                  <label style={labelStyle(C)}>Название сцены</label>
                  <input
                    value={sel.label}
                    maxLength={100}
                    onChange={(e) => updScene(sel.id, { label: e.target.value })}
                    style={inputStyle(C)}
                  />
                </div>

                {/* Model selector */}
                <div>
                  <label style={labelStyle(C)}>Модель</label>
                  <div style={{ position: 'relative' }} ref={modDropRef}>
                    <button
                      onClick={() => setModPick(!modPick)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: `1.5px solid ${modPick ? C.accent + '55' : C.border}`,
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
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{selMod.icon}</span>
                      <span style={{ flex: 1 }}>{selMod.name}</span>
                      <span style={{ fontSize: 8, color: C.dim, transform: modPick ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>&#9660;</span>
                    </button>

                    {/* Model dropdown */}
                    {modPick && (
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
                          borderRadius: 10,
                          padding: 4,
                          zIndex: 20,
                          boxShadow: '0 8px 32px rgba(0,0,0,.25)',
                        }}
                      >
                        {MODELS.map((m) => (
                          <div
                            key={m.id}
                            role="option"
                            tabIndex={0}
                            aria-selected={m.id === sel.model}
                            onClick={() => { updScene(sel.id, { model: m.id }); setModPick(false); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); updScene(sel.id, { model: m.id }); setModPick(false); }
                            }}
                            style={{
                              padding: '9px 12px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              background: m.id === sel.model ? C.accent + '10' : 'transparent',
                              transition: 'background .1s',
                            }}
                            onMouseEnter={(e) => {
                              if (m.id !== sel.model) (e.currentTarget as HTMLElement).style.background = C.cardHover;
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = m.id === sel.model ? C.accent + '10' : 'transparent';
                            }}
                          >
                            <span style={{ fontSize: 16 }}>{m.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: m.id === sel.model ? C.accent : C.text }}>{m.name}</div>
                              <div style={{ fontSize: 10, color: C.sub }}>{m.desc} · {m.speed}</div>
                            </div>
                            {m.id === sel.model && (
                              <span style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>&#10003;</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Duration slider ── */}
              <div>
                <label style={{ ...labelStyle(C), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Длительность</span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      fontWeight: 700,
                      color: gc(sel.ck),
                    }}
                  >
                    {sel.duration}с
                  </span>
                </label>
                <div style={{ position: 'relative', padding: '4px 0' }}>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={sel.duration}
                    onChange={(e) => updScene(sel.id, { duration: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      accentColor: gc(sel.ck),
                      cursor: 'pointer',
                      height: 6,
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.dim, marginTop: 2 }}>
                    <span>1с</span>
                    <span>30с</span>
                  </div>
                </div>
              </div>

              {/* ── Scene actions row ── */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => dupScene(sel.id)}
                  title="Дублировать сцену"
                  style={secondaryBtnStyle(C)}
                >
                  Дублировать
                </button>
                <button
                  onClick={() => {
                    if (scenes.length <= 1) return;
                    setConfirmDel(sel.id);
                  }}
                  title="Удалить сцену"
                  style={{
                    ...secondaryBtnStyle(C),
                    color: scenes.length <= 1 ? C.dim : C.accent,
                    borderColor: scenes.length <= 1 ? C.border : C.accent + '30',
                    opacity: scenes.length <= 1 ? 0.5 : 1,
                    cursor: scenes.length <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Удалить
                </button>
                <button
                  onClick={() => addScene(sel.id)}
                  title="Добавить сцену после текущей"
                  style={secondaryBtnStyle(C)}
                >
                  + Сцена после
                </button>
              </div>

              {/* Delete confirm in detail panel */}
              {confirmDel === sel.id && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: C.accent + '0a',
                    border: `1px solid ${C.accent}25`,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text, flex: 1 }}>
                    Удалить сцену &laquo;{sel.label}&raquo;?
                  </span>
                  <button
                    onClick={() => { delScene(sel.id); setConfirmDel(null); }}
                    style={{
                      padding: '6px 18px',
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
                    Удалить
                  </button>
                  <button
                    onClick={() => setConfirmDel(null)}
                    style={{
                      padding: '6px 18px',
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
                    Отмена
                  </button>
                </div>
              )}
            </div>

            {/* ── Bottom bar: Generate button + shortcut hint ── */}
            <div
              style={{
                padding: '12px 28px 14px',
                borderTop: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: C.surface,
              }}
            >
              <button
                onClick={handleGenerate}
                disabled={!sel.prompt.trim() || isGenerating}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 12,
                  border: 'none',
                  background: !sel.prompt.trim() || isGenerating
                    ? C.dim
                    : `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: !sel.prompt.trim() || isGenerating ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  letterSpacing: '.02em',
                  boxShadow: !sel.prompt.trim() || isGenerating
                    ? 'none'
                    : `0 4px 20px ${C.accent}25, 0 2px 10px ${C.pink}15`,
                  transition: 'all .2s',
                  opacity: !sel.prompt.trim() || isGenerating ? 0.45 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {isGenerating ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
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
                  'Генерировать видео'
                )}
              </button>
              <div
                style={{
                  fontSize: 9,
                  color: C.dim,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8,
                    fontWeight: 600,
                    color: C.sub,
                  }}
                >
                  Ctrl+Enter
                </span>
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
                width: 64,
                height: 64,
                borderRadius: 18,
                background: C.card,
                border: `1.5px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                color: C.dim,
              }}
            >
              &#9671;
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.sub }}>
              {scenes.length === 0 ? 'Добавьте первую сцену' : 'Выберите сцену слева'}
            </span>
            {scenes.length === 0 && (
              <button
                onClick={() => addScene()}
                style={{
                  marginTop: 4,
                  padding: '10px 28px',
                  borderRadius: 10,
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

      {/* ── Timeline bar at bottom ── */}
      {scenes.length > 0 && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            padding: '0 20px 8px',
            background: `linear-gradient(transparent, ${C.bg})`,
            pointerEvents: 'none',
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderRadius: 6,
                overflow: 'hidden',
                background: C.card,
                border: `1px solid ${C.border}`,
                height: 22,
              }}
            >
              {scenes.map((sc) => {
                const col = gc(sc.ck);
                const pct = totalDur > 0 ? (sc.duration / totalDur) * 100 : 0;
                const isSelScene = sc.id === selId;

                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelId(sc.id)}
                    style={{
                      flex: `0 0 ${pct}%`,
                      height: '100%',
                      background: isSelScene ? col + '22' : 'transparent',
                      borderRight: `1px solid ${C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background .15s',
                      overflow: 'hidden',
                    }}
                    title={`${sc.label} — ${fmtDur(sc.duration)}`}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: isSelScene ? 3 : 2,
                        background: col,
                        opacity: isSelScene ? 1 : 0.35,
                        transition: 'all .15s',
                      }}
                    />
                    {pct > 10 && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 600,
                          color: isSelScene ? col : C.dim,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {fmtDur(sc.duration)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Global hover styles ── */}
      <style>{`
        .sc-row:hover { background: ${C.cardHover} !important; }
        .sc-row:hover .sc-row-actions { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STYLE HELPERS
   ═══════════════════════════════════════════════════════════════════ */
function labelStyle(C: Theme): React.CSSProperties {
  return {
    fontSize: 10,
    fontWeight: 600,
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: '.05em',
    marginBottom: 6,
    display: 'block',
  };
}

function inputStyle(C: Theme): React.CSSProperties {
  return {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 10,
    border: `1.5px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontSize: 13,
    fontWeight: 600,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    transition: 'border-color .15s',
  };
}

function secondaryBtnStyle(C: Theme): React.CSSProperties {
  return {
    flex: 1,
    padding: '8px 0',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.sub,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    transition: 'all .15s',
  };
}

function actionBtnStyle(C: Theme): React.CSSProperties {
  return {
    width: 20,
    height: 20,
    borderRadius: 5,
    border: 'none',
    background: C.card,
    color: C.sub,
    fontSize: 10,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontFamily: 'inherit',
    lineHeight: 1,
  };
}
