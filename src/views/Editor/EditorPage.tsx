'use client';

import { useEffect, useRef } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useEditorStore } from '@/stores/useEditorStore';
import { StatusDot, Toggle, FrameSlot } from '@/components/ui';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProjectPicker } from '@/components/ui/ProjectPicker';
import { MODELS, AVATARS, PK } from '@/lib/constants';
import { fmtTime, fmtDur, pluralRu } from '@/lib/utils';
import { useProjectSync } from '@/hooks/useProjectSync';
import type { Theme } from '@/lib/types';

/* ───────────────────────── FORMAT BUTTONS ──────────────────────── */
const FORMATS = ['16:9', '9:16', '1:1', '4:5'] as const;

export function EditorPage({ projectId = null }: { projectId?: string | null }) {
  const sync = useProjectSync(projectId);
  const C = useThemeStore((s) => s.theme);

  const format = useEditorStore((s) => s.format);
  const setFormat = useEditorStore((s) => s.setFormat);
  const scenes = useEditorStore((s) => s.scenes);
  const chars = useEditorStore((s) => s.chars);
  const selId = useEditorStore((s) => s.selId);
  const setSelId = useEditorStore((s) => s.setSelId);
  const rpanel = useEditorStore((s) => s.rpanel);
  const setRpanel = useEditorStore((s) => s.setRpanel);
  const editCh = useEditorStore((s) => s.editCh);
  const setEditCh = useEditorStore((s) => s.setEditCh);
  const chForm = useEditorStore((s) => s.chForm);
  const setChForm = useEditorStore((s) => s.setChForm);
  const genIn = useEditorStore((s) => s.genIn);
  const setGenIn = useEditorStore((s) => s.setGenIn);
  const chPick = useEditorStore((s) => s.chPick);
  const setChPick = useEditorStore((s) => s.setChPick);
  const modPick = useEditorStore((s) => s.modPick);
  const setModPick = useEditorStore((s) => s.setModPick);
  const dragId = useEditorStore((s) => s.dragId);
  const setDragId = useEditorStore((s) => s.setDragId);
  const dragOv = useEditorStore((s) => s.dragOv);
  const setDragOv = useEditorStore((s) => s.setDragOv);
  const confirmDel = useEditorStore((s) => s.confirmDel);
  const setConfirmDel = useEditorStore((s) => s.setConfirmDel);
  const saveStatus = useEditorStore((s) => s.saveStatus);

  // E1: Close model dropdown on outside click
  const modDropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!modPick) return;
    const handler = (e: MouseEvent) => {
      if (modDropRef.current && !modDropRef.current.contains(e.target as Node)) {
        setModPick(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [modPick, setModPick]);

  // Use sync wrappers that save to DB, fallback to store-only when no projectId
  const updScene = (id: string, patch: Partial<import('@/lib/types').Scene>) => {
    if (projectId) { sync.updateScene(id, patch); } else { useEditorStore.getState().updScene(id, patch); }
  };
  const addScene = (afterId?: string) => {
    if (projectId) { sync.addScene(afterId); } else { useEditorStore.getState().addScene(afterId); }
  };
  const delScene = (id: string) => {
    if (projectId) { sync.deleteScene(id); } else { useEditorStore.getState().delScene(id); }
  };
  const dupScene = (id: string) => {
    if (projectId) { sync.duplicateScene(id); } else { useEditorStore.getState().dupScene(id); }
  };
  const splitScene = (id: string) => {
    if (projectId) { sync.splitScene(id); } else { useEditorStore.getState().splitScene(id); }
  };
  const regenScene = (id: string, newPrompt?: string) => {
    useEditorStore.getState().regenScene(id, newPrompt);
    if (projectId) {
      const patch: Partial<import('@/lib/types').Scene> = { status: 'generating' };
      if (newPrompt) patch.prompt = newPrompt;
      sync.updateScene(id, patch);
    }
  };
  const togChar = (sceneId: string, charId: string) => {
    useEditorStore.getState().togChar(sceneId, charId);
    if (projectId) {
      const scene = useEditorStore.getState().scenes.find((s) => s.id === sceneId);
      if (scene) sync.updateScene(sceneId, { chars: scene.chars });
    }
  };
  const saveCh = () => {
    useEditorStore.getState().saveCh();
    sync.saveCharacters();
  };
  const delCh = (id: string) => {
    useEditorStore.getState().delCh(id);
    sync.saveCharacters();
  };
  const reorderScenes = (fromId: string, toId: string) => {
    if (projectId) { sync.reorder(fromId, toId); } else { useEditorStore.getState().reorderScenes(fromId, toId); }
  };
  const addSceneFromPrompt = (prompt: string) => {
    useEditorStore.getState().addSceneFromPrompt(prompt);
    if (projectId) {
      const scenes = useEditorStore.getState().scenes;
      const newest = scenes[scenes.length - 1];
      if (newest) sync.syncNewScene(newest);
    }
  };

  /* ─── Computed ──────────────────────────────────────────────── */
  const gc = (k: string) => (C[k as keyof Theme] as string) || C.accent;

  const sel = scenes.find((s) => s.id === selId);
  const totalDur = scenes.reduce((a, s) => a + s.duration, 0);
  const scChars = sel ? chars.filter((c) => sel.chars.includes(c.id)) : [];
  const selMod = sel
    ? MODELS.find((m) => m.id === sel.model) || MODELS[1]
    : MODELS[1];
  const aspect =
    format === '9:16'
      ? '9/16'
      : format === '1:1'
        ? '1/1'
        : format === '4:5'
          ? '4/5'
          : '16/9';

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  if (!projectId) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <ProjectPicker target="/editor" title="Редактор" />
      </div>
    );
  }

  if (sync.isLoading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 16, flexDirection: 'column' }}>
        <Skeleton width={200} height={24} />
        <Skeleton width={300} height={16} />
      </div>
    );
  }

  if (sync.isError) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 32, opacity: 0.3 }}>&#9888;</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Не удалось загрузить проект</div>
          <div style={{ fontSize: 12, color: C.sub }}>Попробуйте ещё раз или вернитесь на дашборд</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={() => sync.refetch()} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Повторить</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        gap: 0,
        overflow: 'hidden',
      }}
    >
      {/* ============================================================
          LEFT PANEL — Scene list
          ============================================================ */}
      <div
        style={{
          width: 268,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: C.surface,
          borderRight: `1px solid ${C.border}`,
          overflow: 'hidden',
        }}
      >
        {/* ── Format selector row ── */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '10px 12px 6px',
            alignItems: 'center',
          }}
        >
          {FORMATS.map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              style={{
                flex: 1,
                padding: '5px 0',
                fontSize: 10,
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                border: `1px solid ${format === f ? gc('accent') + '55' : C.border}`,
                borderRadius: 6,
                background: format === f ? gc('accent') + '15' : C.card,
                color: format === f ? gc('accent') : C.sub,
                cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              {f}
            </button>
          ))}
          {/* E3: Visual separator before add button */}
          <div style={{ width: 1, height: 20, background: C.border, marginLeft: 4, flexShrink: 0 }} />
          <button
            onClick={() => addScene()}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: `1px solid ${C.border}`,
              background: C.card,
              color: C.sub,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'inherit',
              flexShrink: 0,
              marginLeft: 2,
            }}
            title="Добавить новую сцену"
          >
            +
          </button>
        </div>

        {/* ── Info bar ── */}
        <div
          style={{
            padding: '4px 12px 8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11,
            fontWeight: 600,
            color: C.sub,
          }}
        >
          <span>
            {pluralRu(scenes.length, 'сцена', 'сцены', 'сцен')} · {fmtTime(totalDur)}
          </span>
          <span style={{ color: C.dim, fontSize: 9, padding: '1px 6px', borderRadius: 4, border: `1px solid ${C.border}`, fontFamily: "'JetBrains Mono', monospace" }}>{format}</span>
        </div>

        {/* ── Scrollable scene list ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '0 6px',
          }}
        >
          {scenes.map((sc, idx) => {
            const col = gc(sc.ck);
            const isSel = sc.id === selId;
            const isDragOver = sc.id === dragOv;
            const scCharsList = chars.filter((c) =>
              sc.chars.includes(c.id),
            );
            const scModel = MODELS.find((m) => m.id === sc.model) || MODELS[1];

            return (
              <div
                key={sc.id}
                className="sc-row"
                draggable
                onDragStart={() => setDragId(sc.id)}
                onDragEnter={() => {
                  if (dragId && sc.id !== dragId) setDragOv(sc.id);
                }}
                onDragEnd={() => {
                  if (dragId && dragOv) reorderScenes(dragId, dragOv);
                  setDragId(null);
                  setDragOv(null);
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => setSelId(sc.id)}
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 0,
                  padding: 0,
                  marginBottom: 2,
                  borderRadius: 10,
                  background: isSel ? col + '10' : 'transparent',
                  border: `1px solid ${
                    isDragOver
                      ? col + '66'
                      : isSel
                        ? col + '30'
                        : 'transparent'
                  }`,
                  cursor: 'pointer',
                  transition: 'all .15s',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: dragId === sc.id ? 0.5 : 1,
                }}
              >
                {/* color bar */}
                <div
                  style={{
                    width: 2.5,
                    background: col,
                    borderRadius: '10px 0 0 10px',
                    flexShrink: 0,
                    opacity: isSel ? 1 : 0.5,
                  }}
                />

                {/* scene content */}
                <div
                  style={{
                    flex: 1,
                    padding: '8px 8px 8px 7px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    minWidth: 0,
                  }}
                >
                  {/* top row: number + label + status */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        fontWeight: 700,
                        color: C.dim,
                        flexShrink: 0,
                      }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: C.text,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                      }}
                    >
                      {sc.label}
                    </span>
                    <StatusDot status={sc.status} />
                  </div>

                  {/* prompt preview */}
                  <div
                    style={{
                      fontSize: 10,
                      color: C.sub,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.3,
                    }}
                  >
                    {sc.prompt || (
                      <span style={{ color: C.dim, fontStyle: 'italic' }}>
                        Нет промпта
                      </span>
                    )}
                  </div>

                  {/* bottom row: duration, model, chars, actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 1,
                    }}
                  >
                    {/* model icon */}
                    <span
                      style={{
                        fontSize: 9,
                        padding: '1px 4px',
                        borderRadius: 4,
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        color: C.sub,
                        fontWeight: 600,
                      }}
                      title={scModel.name}
                    >
                      {scModel.icon}
                    </span>

                    {/* character mini-avatars */}
                    {scCharsList.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          gap: 0,
                          marginLeft: 1,
                        }}
                      >
                        {scCharsList.slice(0, 3).map((ch) => (
                          <span
                            key={ch.id}
                            style={{
                              fontSize: 10,
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: gc(ch.ck) + '20',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginLeft: -3,
                              border: `1px solid ${C.surface}`,
                            }}
                            title={ch.name}
                          >
                            {ch.avatar}
                          </span>
                        ))}
                        {scCharsList.length > 3 && (
                          <span
                            style={{
                              fontSize: 8,
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: C.card,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginLeft: -3,
                              border: `1px solid ${C.surface}`,
                              color: C.sub,
                              fontWeight: 600,
                            }}
                          >
                            +{scCharsList.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* spacer */}
                    <div style={{ flex: 1 }} />

                    {/* E1: action buttons — visible for selected scene */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 2,
                        opacity: isSel ? 1 : 0,
                        transition: 'opacity .15s',
                      }}
                      className="sc-row-actions"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          regenScene(sc.id);
                        }}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 5,
                          border: 'none',
                          background: C.card,
                          color: C.sub,
                          fontSize: 10,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Перегенерировать сцену"
                        aria-label={`Перегенерировать сцену ${sc.label}`}
                      >
                        ↻
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          splitScene(sc.id);
                        }}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 5,
                          border: 'none',
                          background: C.card,
                          color: C.sub,
                          fontSize: 10,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Разделить сцену"
                        aria-label={`Разделить сцену ${sc.label}`}
                      >
                        ✂
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (scenes.length <= 1) return;
                          setConfirmDel(sc.id);
                        }}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 5,
                          border: 'none',
                          background: C.card,
                          color: C.accent,
                          fontSize: 10,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: scenes.length <= 1 ? 0.3 : 1,
                        }}
                        title="Удалить сцену"
                        aria-label={`Удалить сцену ${sc.label}`}
                      >
                        ✕
                      </button>
                    </div>
                    {/* E1: Inline confirm delete */}
                    {confirmDel === sc.id && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: `${C.card}ee`,
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          zIndex: 5,
                        }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.text }}>Удалить?</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); delScene(sc.id); setConfirmDel(null); }}
                          style={{ padding: '3px 10px', borderRadius: 5, border: 'none', background: C.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Да
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDel(null); }}
                          style={{ padding: '3px 10px', borderRadius: 5, border: `1px solid ${C.border}`, background: C.card, color: C.sub, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Отмена
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bottom prompt input ── */}
        <div
          style={{
            padding: '8px 10px 10px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            gap: 6,
          }}
        >
          <input
            value={genIn}
            maxLength={2000}
            onChange={(e) => setGenIn(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && genIn.trim()) {
                addSceneFromPrompt(genIn.trim());
                setGenIn('');
              }
            }}
            placeholder="Опишите сцену..."
            aria-label="Промпт для новой сцены"
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.card,
              color: C.text,
              fontSize: 11,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => {
              if (genIn.trim()) { addSceneFromPrompt(genIn.trim()); setGenIn(''); }
            }}
            disabled={!genIn.trim()}
            aria-label="Сгенерировать сцену из промпта"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: 'none',
              background: genIn.trim()
                ? `linear-gradient(135deg, ${C.accent}, ${C.pink})`
                : C.dim,
              color: '#fff',
              fontSize: 14,
              cursor: genIn.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: genIn.trim() ? 1 : 0.4,
              transition: 'opacity .15s, background .15s',
            }}
            title={genIn.trim() ? 'Сгенерировать сцену' : 'Введите промпт'}
          >
            ✦
          </button>
        </div>
      </div>

      {/* ============================================================
          CENTER PANEL — Preview + Timeline
          ============================================================ */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: C.bg,
        }}
      >
        {/* ── Scene preview area ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              aspectRatio: aspect,
              maxWidth:
                format === '9:16'
                  ? 280
                  : format === '1:1'
                    ? 380
                    : format === '4:5'
                      ? 340
                      : 560,
              maxHeight:
                format === '9:16'
                  ? 500
                  : format === '1:1'
                    ? 380
                    : format === '4:5'
                      ? 425
                      : 315,
              width: '100%',
              borderRadius: 16,
              background: sel
                ? `radial-gradient(ellipse at center, ${gc(sel.ck)}18 0%, ${C.surface} 70%)`
                : C.surface,
              border: `1.5px solid ${sel ? gc(sel.ck) + '25' : C.border}`,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: sel
                ? `0 0 60px ${gc(sel.ck)}08, 0 4px 20px rgba(0,0,0,.2)`
                : `0 4px 20px rgba(0,0,0,.15)`,
            }}
          >
            {sel ? (
              <>
                {/* Top badges row */}
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    right: 12,
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                  }}
                >
                  {/* Scene label badge */}
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: gc(sel.ck) + '20',
                      color: gc(sel.ck),
                      fontSize: 10,
                      fontWeight: 600,
                      border: `1px solid ${gc(sel.ck)}30`,
                    }}
                  >
                    {sel.label}
                  </span>

                  <div style={{ flex: 1 }} />

                  {/* Duration badge */}
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: C.card,
                      color: C.text,
                      fontSize: 10,
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    {fmtTime(sel.duration)}
                  </span>
                </div>

                {/* Center status */}
                {sel.status === 'generating' ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        border: `2.5px solid ${gc(sel.ck)}44`,
                        borderTopColor: gc(sel.ck),
                        animation: 'spin 1s linear infinite',
                        boxShadow: `0 0 24px ${gc(sel.ck)}20`,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: gc(sel.ck),
                        letterSpacing: '.02em',
                      }}
                    >
                      Генерация...
                    </span>
                  </div>
                ) : sel.status === 'error' ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 36, opacity: 0.7 }}>&#9888;</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.accent,
                      }}
                    >
                      Ошибка генерации
                    </span>
                  </div>
                ) : !sel.prompt ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 10,
                      padding: '20px 28px',
                      border: `1.5px dashed ${C.border}`,
                      borderRadius: 14,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 36,
                        color: C.dim,
                        opacity: 0.5,
                      }}
                    >
                      ✦
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: C.dim,
                      }}
                    >
                      Добавьте промпт
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 48,
                        color: C.text,
                        opacity: 0.12,
                        cursor: 'pointer',
                      }}
                    >
                      ▶
                    </span>
                  </div>
                )}

                {/* Bottom character badges */}
                {scChars.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      left: 12,
                      right: 12,
                      display: 'flex',
                      gap: 5,
                      flexWrap: 'wrap',
                    }}
                  >
                    {scChars.map((ch) => (
                      <span
                        key={ch.id}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: gc(ch.ck) + '18',
                          color: gc(ch.ck),
                          fontSize: 10,
                          fontWeight: 600,
                          border: `1px solid ${gc(ch.ck)}25`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 12 }}>{ch.avatar}</span>
                        {ch.name}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 32, color: C.dim, opacity: 0.5 }}>
                  ◇
                </span>
                <span style={{ fontSize: 12, color: C.dim }}>
                  Выберите сцену
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Timeline bar ── */}
        <div
          style={{
            padding: '0 16px 12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderRadius: 8,
              overflow: 'hidden',
              background: C.card,
              border: `1px solid ${C.border}`,
              height: 28,
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
                    background: isSelScene ? col + '25' : col + '0a',
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
                  {/* color indicator at bottom */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: isSelScene ? 3 : 2,
                      background: col,
                      opacity: isSelScene ? 1 : 0.4,
                      transition: 'all .15s',
                    }}
                  />
                  {pct > 8 && (
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 600,
                        color: isSelScene ? col : C.dim,
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: '.02em',
                      }}
                    >
                      {fmtDur(sc.duration)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Timeline total */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 4,
              fontSize: 9,
              color: C.dim,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span>0:00</span>
            <span>{fmtTime(totalDur)}</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          RIGHT PANEL — Scene / Characters tabs
          ============================================================ */}
      <div
        style={{
          width: 300,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: C.surface,
          borderLeft: `1px solid ${C.border}`,
          overflow: 'hidden',
        }}
      >
        {/* E9: Save indicator */}
        {saveStatus !== 'idle' && (
          <div role="status" aria-live="polite" style={{ padding: '4px 12px', fontSize: 10, fontWeight: 500, textAlign: 'right', color: saveStatus === 'saving' ? C.dim : saveStatus === 'saved' ? C.green : '#e74c3c' }}>
            {saveStatus === 'saving' ? 'Сохраняется...' : saveStatus === 'saved' ? '✓ Сохранено' : '⚠ Ошибка сохранения'}
          </div>
        )}

        {/* ── Tab row ── */}
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          {[
            { id: 'scene', label: 'Сцена' },
            { id: 'chars', label: `Персонажи (${chars.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRpanel(tab.id)}
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: 11,
                fontWeight: 600,
                color: rpanel === tab.id ? C.text : C.sub,
                background: rpanel === tab.id ? C.card : 'transparent',
                border: 'none',
                borderBottom: rpanel === tab.id ? `2px solid ${C.accent}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all .15s',
                fontFamily: 'inherit',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '12px',
          }}
        >
          {rpanel === 'scene' && sel ? (
            /* ─────────────────────────────────────────────
               SCENE TAB
               ───────────────────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Label input */}
              <div>
                <label
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: C.sub,
                    textTransform: 'uppercase',
                    letterSpacing: '.04em',
                    marginBottom: 4,
                    display: 'block',
                  }}
                >
                  Название
                </label>
                <input
                  value={sel.label}
                  maxLength={100}
                  onChange={(e) => updScene(sel.id, { label: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    color: C.text,
                    fontSize: 12,
                    fontWeight: 600,
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Model selector */}
              <div>
                <label
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: C.sub,
                    textTransform: 'uppercase',
                    letterSpacing: '.04em',
                    marginBottom: 4,
                    display: 'block',
                  }}
                >
                  Модель
                </label>
                <div style={{ position: 'relative' }} ref={modDropRef}>
                  <button
                    onClick={() => setModPick(!modPick)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: `1px solid ${modPick ? C.accent + '55' : C.border}`,
                      background: C.card,
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
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{selMod.icon}</span>
                    <span style={{ flex: 1 }}>{selMod.name}</span>
                    <span style={{ fontSize: 10, color: C.sub }}>
                      {selMod.speed}
                    </span>
                    <span
                      style={{
                        fontSize: 8,
                        color: C.dim,
                        transform: modPick ? 'rotate(180deg)' : 'none',
                        transition: 'transform .15s',
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {/* Model dropdown */}
                  {modPick && (
                    <div
                      role="listbox"
                      aria-label="Выбор модели"
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
                        boxShadow: `0 8px 24px rgba(0,0,0,.3)`,
                      }}
                    >
                      {MODELS.map((m) => (
                        <div
                          key={m.id}
                          role="option"
                          tabIndex={0}
                          aria-selected={m.id === sel.model}
                          onClick={() => {
                            updScene(sel.id, { model: m.id });
                            setModPick(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              updScene(sel.id, { model: m.id });
                              setModPick(false);
                            }
                          }}
                          style={{
                            padding: '7px 10px',
                            borderRadius: 7,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background:
                              m.id === sel.model ? C.accent + '12' : 'transparent',
                            transition: 'background .1s',
                          }}
                        >
                          <span style={{ fontSize: 14 }}>{m.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color:
                                  m.id === sel.model ? C.accent : C.text,
                              }}
                            >
                              {m.name}
                            </div>
                            <div style={{ fontSize: 9, color: C.sub }}>
                              {m.desc} · {m.speed}
                            </div>
                          </div>
                          {m.id === sel.model && (
                            <span
                              style={{
                                fontSize: 10,
                                color: C.accent,
                                fontWeight: 700,
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Frame slots */}
              <div>
                <label
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: C.sub,
                    textTransform: 'uppercase',
                    letterSpacing: '.04em',
                    marginBottom: 4,
                    display: 'block',
                  }}
                >
                  Кадры
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <FrameSlot
                    label="Начальный"
                    has={sel.sf}
                    onClick={() =>
                      updScene(sel.id, { sf: sel.sf ? null : 'uploaded' })
                    }
                  />
                  <FrameSlot
                    label="Конечный"
                    has={sel.ef}
                    onClick={() =>
                      updScene(sel.id, { ef: sel.ef ? null : 'uploaded' })
                    }
                  />
                </div>
              </div>

              {/* Character picker */}
              <div>
                <label
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: C.sub,
                    textTransform: 'uppercase',
                    letterSpacing: '.04em',
                    marginBottom: 4,
                    display: 'block',
                  }}
                >
                  Персонажи
                </label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                  }}
                >
                  {chars.map((ch) => {
                    const inScene = sel.chars.includes(ch.id);
                    const col2 = gc(ch.ck);
                    return (
                      <button
                        key={ch.id}
                        onClick={() => togChar(sel.id, ch.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 7,
                          border: `1px solid ${inScene ? col2 + '50' : C.border}`,
                          background: inScene ? col2 + '15' : C.card,
                          color: inScene ? col2 : C.sub,
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontFamily: 'inherit',
                          transition: 'all .15s',
                        }}
                      >
                        <span style={{ fontSize: 12 }}>{ch.avatar}</span>
                        {ch.name}
                        {inScene && (
                          <span style={{ fontSize: 8, marginLeft: 2 }}>
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {chars.length === 0 && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Добавить персонажа"
                      onClick={() => { setRpanel('chars'); setEditCh('new'); setChForm({ name: '', role: '', avatar: '\u{1F468}\u200D\u{1F4BB}', ck: 'blue', desc: '' }); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRpanel('chars'); setEditCh('new'); setChForm({ name: '', role: '', avatar: '\u{1F468}\u200D\u{1F4BB}', ck: 'blue', desc: '' }); } }}
                      style={{ fontSize: 10, color: C.accent, cursor: 'pointer', fontWeight: 500 }}
                    >
                      + Добавить персонажа
                    </span>
                  )}
                </div>
              </div>

              {/* Prompt textarea */}
              <div>
                <label
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: C.sub,
                    textTransform: 'uppercase',
                    letterSpacing: '.04em',
                    marginBottom: 4,
                    display: 'block',
                  }}
                >
                  Промпт
                </label>
                <textarea
                  value={sel.prompt}
                  onChange={(e) =>
                    updScene(sel.id, { prompt: e.target.value })
                  }
                  placeholder="Опишите, что происходит в сцене..."
                  maxLength={2000}
                  style={{
                    width: '100%',
                    minHeight: 100,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    color: C.text,
                    fontSize: 11,
                    lineHeight: 1.5,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: 9, color: sel.prompt.length > 1800 ? C.accent : C.dim, marginTop: 2, textAlign: 'right' }}>
                  {sel.prompt.length}/2000
                </div>
              </div>

              {/* Duration slider */}
              <div>
                <label
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: C.sub,
                    textTransform: 'uppercase',
                    letterSpacing: '.04em',
                    marginBottom: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>Длительность</span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.text,
                    }}
                  >
                    {fmtDur(sel.duration)}
                  </span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={sel.duration}
                  onChange={(e) =>
                    updScene(sel.id, { duration: Number(e.target.value) })
                  }
                  style={{
                    width: '100%',
                    accentColor: '#888',
                    cursor: 'pointer',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 9,
                    color: C.dim,
                    marginTop: 2,
                  }}
                >
                  <span>1с</span>
                  <span>60с</span>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: 6 }}>
                <Toggle
                  on={sel.enh}
                  onChange={() => updScene(sel.id, { enh: !sel.enh })}
                  label="Улучшение"
                  ck="green"
                />
                <Toggle
                  on={sel.snd}
                  onChange={() => updScene(sel.id, { snd: !sel.snd })}
                  label="Звук"
                  ck="green"
                />
              </div>

              {/* Action buttons row */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => splitScene(sel.id)}
                  title="Разделить сцену на две части"
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 7,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    color: C.sub,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  ✂ Разделить
                </button>
                <button
                  onClick={() => dupScene(sel.id)}
                  title="Дублировать сцену"
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 7,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    color: C.sub,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  ❐ Копия
                </button>
                <button
                  onClick={() => {
                    /* inpaint placeholder */
                  }}
                  title="Ретушь видео (скоро)"
                  disabled
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 7,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    color: C.dim,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'not-allowed',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    opacity: 0.5,
                  }}
                >
                  ✎ Ретушь
                </button>
              </div>

              {/* E7: Separator before delete */}
              <div style={{ borderTop: `1px solid ${C.border}`, margin: '4px 0' }} />

              {/* E1: Delete scene button with confirm */}
              {confirmDel === sel.id ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: C.text, flex: 1 }}>Удалить сцену?</span>
                  <button
                    onClick={() => { delScene(sel.id); setConfirmDel(null); }}
                    style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: C.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Да
                  </button>
                  <button
                    onClick={() => setConfirmDel(null)}
                    style={{ padding: '5px 14px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, color: C.sub, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDel(sel.id)}
                  style={{
                    padding: '7px 0',
                    borderRadius: 8,
                    border: `1px solid ${C.accent}25`,
                    background: C.accent + '08',
                    color: C.accent,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    width: '100%',
                  }}
                >
                  ✕ Удалить сцену
                </button>
              )}
            </div>
          ) : rpanel === 'scene' && !sel ? (
            /* No scene selected */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                gap: 8,
              }}
            >
              <span style={{ fontSize: 28, color: C.dim, opacity: 0.5 }}>
                ◇
              </span>
              <span style={{ fontSize: 12, color: C.dim }}>
                Выберите сцену слева
              </span>
            </div>
          ) : (
            /* ─────────────────────────────────────────────
               CHARACTERS TAB
               ───────────────────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Add character button */}
              {editCh === null && (
                <button
                  onClick={() => {
                    setEditCh('new');
                    setChForm({
                      name: '',
                      role: '',
                      avatar: '👨‍💻',
                      ck: 'blue',
                      desc: '',
                    });
                  }}
                  style={{
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
                    gap: 5,
                    width: '100%',
                    marginBottom: 4,
                  }}
                >
                  + Новый персонаж
                </button>
              )}

              {/* Character edit form */}
              {editCh !== null && (
                <div
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {/* Form header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: C.text,
                      }}
                    >
                      {editCh === 'new'
                        ? 'Новый персонаж'
                        : 'Редактировать'}
                    </span>
                    <button
                      onClick={() => setEditCh(null)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        border: 'none',
                        background: C.surface,
                        color: C.sub,
                        fontSize: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Avatar picker */}
                  <div>
                    <label
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: C.sub,
                        textTransform: 'uppercase',
                        letterSpacing: '.04em',
                        marginBottom: 4,
                        display: 'block',
                      }}
                    >
                      Аватар
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        gap: 4,
                        flexWrap: 'wrap',
                      }}
                    >
                      {AVATARS.map((av) => (
                        <button
                          key={av}
                          onClick={() =>
                            setChForm((p) => ({ ...p, avatar: av }))
                          }
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            border: `1.5px solid ${
                              chForm.avatar === av
                                ? gc(chForm.ck) + '55'
                                : C.border
                            }`,
                            background:
                              chForm.avatar === av
                                ? gc(chForm.ck) + '15'
                                : C.surface,
                            fontSize: 14,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all .1s',
                          }}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Photo upload placeholder — disabled until feature is implemented */}
                  <div
                    style={{
                      borderRadius: 8,
                      border: `1.5px dashed ${C.border}`,
                      background: C.surface,
                      padding: '10px 6px',
                      textAlign: 'center',
                      cursor: 'not-allowed',
                      opacity: 0.5,
                    }}
                    title="Загрузка фото персонажа — скоро"
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: C.dim,
                      }}
                    >
                      📷 Загрузить фото (скоро)
                    </span>
                  </div>

                  {/* Name */}
                  <div>
                    <label
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: C.sub,
                        textTransform: 'uppercase',
                        letterSpacing: '.04em',
                        marginBottom: 4,
                        display: 'block',
                      }}
                    >
                      Имя
                    </label>
                    <input
                      value={chForm.name}
                      maxLength={100}
                      onChange={(e) =>
                        setChForm((p) => ({
                          ...p,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Имя персонажа"
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        color: C.text,
                        fontSize: 11,
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: C.sub,
                        textTransform: 'uppercase',
                        letterSpacing: '.04em',
                        marginBottom: 4,
                        display: 'block',
                      }}
                    >
                      Роль
                    </label>
                    <input
                      value={chForm.role}
                      maxLength={100}
                      onChange={(e) =>
                        setChForm((p) => ({
                          ...p,
                          role: e.target.value,
                        }))
                      }
                      placeholder="Роль в видео"
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        color: C.text,
                        fontSize: 11,
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: C.sub,
                        textTransform: 'uppercase',
                        letterSpacing: '.04em',
                        marginBottom: 4,
                        display: 'block',
                      }}
                    >
                      Описание
                    </label>
                    <textarea
                      value={chForm.desc}
                      maxLength={500}
                      onChange={(e) =>
                        setChForm((p) => ({
                          ...p,
                          desc: e.target.value,
                        }))
                      }
                      placeholder="Опишите внешность, одежду, стиль..."
                      style={{
                        width: '100%',
                        minHeight: 56,
                        padding: '7px 10px',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        color: C.text,
                        fontSize: 11,
                        lineHeight: 1.4,
                        resize: 'vertical',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Color picker */}
                  <div>
                    <label
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: C.sub,
                        textTransform: 'uppercase',
                        letterSpacing: '.04em',
                        marginBottom: 4,
                        display: 'block',
                      }}
                    >
                      Цвет
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        gap: 4,
                        flexWrap: 'wrap',
                      }}
                    >
                      {PK.map((ck) => {
                        const isActive = chForm.ck === ck;
                        return (
                          <button
                            key={ck}
                            onClick={() =>
                              setChForm((p) => ({ ...p, ck }))
                            }
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              border: `2px solid ${
                                isActive ? gc(ck) : 'transparent'
                              }`,
                              background: gc(ck) + '30',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all .1s',
                            }}
                          >
                            {isActive && (
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: gc(ck),
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save / Delete buttons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={saveCh}
                      disabled={!chForm.name.trim()}
                      style={{
                        flex: 1,
                        padding: '7px 0',
                        borderRadius: 8,
                        border: 'none',
                        background: chForm.name.trim() ? C.accent : C.dim,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: chForm.name.trim() ? 'pointer' : 'not-allowed',
                        fontFamily: 'inherit',
                        opacity: chForm.name.trim() ? 1 : 0.5,
                        transition: 'all .15s',
                      }}
                    >
                      {editCh === 'new' ? 'Создать' : 'Сохранить'}
                    </button>
                    {editCh !== 'new' && (
                      <button
                        onClick={() => {
                          if (editCh) delCh(editCh);
                        }}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 8,
                          border: `1px solid ${C.accent}30`,
                          background: C.accent + '0a',
                          color: C.accent,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Character list */}
              {chars.map((ch) => {
                const col3 = gc(ch.ck);
                const isEditing = editCh === ch.id;

                return (
                  <div
                    key={ch.id}
                    role="button"
                    tabIndex={editCh === null ? 0 : -1}
                    aria-label={`Редактировать персонажа ${ch.name}`}
                    onClick={() => {
                      if (editCh === null) {
                        setEditCh(ch.id);
                        setChForm({
                          name: ch.name,
                          role: ch.role,
                          avatar: ch.avatar,
                          ck: ch.ck,
                          desc: ch.desc,
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && editCh === null) {
                        e.preventDefault();
                        setEditCh(ch.id);
                        setChForm({ name: ch.name, role: ch.role, avatar: ch.avatar, ck: ch.ck, desc: ch.desc });
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: isEditing ? col3 + '10' : C.card,
                      border: `1px solid ${isEditing ? col3 + '30' : C.border}`,
                      cursor: editCh === null ? 'pointer' : 'default',
                      transition: 'all .15s',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        background: col3 + '18',
                        border: `1px solid ${col3}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 17,
                        flexShrink: 0,
                      }}
                    >
                      {ch.avatar}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.text,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {ch.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.sub,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {ch.role}
                      </div>
                    </div>

                    {/* Color dot */}
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: col3,
                        flexShrink: 0,
                      }}
                    />

                    {/* Scene count badge */}
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: C.dim,
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: C.surface,
                      }}
                    >
                      {pluralRu(scenes.filter((sc) => sc.chars.includes(ch.id)).length, 'сцена', 'сцены', 'сцен')}
                    </span>
                  </div>
                );
              })}

              {/* Empty state */}
              {chars.length === 0 && editCh === null && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 30,
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 28, color: C.dim, opacity: 0.4 }}>
                    ◇
                  </span>
                  <span style={{ fontSize: 12, color: C.dim }}>
                    Нет персонажей
                  </span>
                  <span style={{ fontSize: 10, color: C.sub }}>
                    Нажмите «+ Новый персонаж» выше
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel footer — Generate button ── */}
        {rpanel === 'scene' && sel && (
          <div
            style={{
              padding: '10px 12px',
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <button
              onClick={() => regenScene(sel.id)}
              disabled={!sel.prompt.trim() || sel.status === 'generating'}
              style={{
                width: '100%',
                padding: '10px 0',
                borderRadius: 10,
                border: 'none',
                background: !sel.prompt.trim() || sel.status === 'generating'
                  ? C.dim
                  : `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: !sel.prompt.trim() || sel.status === 'generating' ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '.02em',
                boxShadow: !sel.prompt.trim() || sel.status === 'generating'
                  ? 'none'
                  : `0 4px 16px ${C.accent}30, 0 2px 8px ${C.pink}20`,
                transition: 'all .15s',
                opacity: !sel.prompt.trim() || sel.status === 'generating' ? 0.5 : 1,
              }}
              title={!sel.prompt.trim() ? 'Сначала добавьте промпт' : sel.status === 'generating' ? 'Генерация в процессе...' : 'Сгенерировать видео'}
            >
              {sel.status === 'generating' ? 'Генерация...' : 'Сгенерировать ✦'}
            </button>
          </div>
        )}
      </div>

      {/* ── Global style for sc-row hover ── */}
      <style>{`
        .sc-row:hover { background: ${C.cardHover} !important; }
        .sc-row:hover .sc-row-actions { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
