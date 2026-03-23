'use client';

import { useState, useRef, useCallback } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import {
  parseSubtitles,
  toSRT,
  toVTT,
  formatTimestamp,
  parseTimestamp,
  type SubtitleEntry,
} from '@/lib/subtitle-parser';

const GRADIENT: [string, string] = ['#6366f1', '#8b5cf6'];

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SubtitleEditor() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  const [entries, setEntries] = useState<SubtitleEntry[]>([]);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Stats ─────────────────────────────────────────────────────────── */
  const totalEntries = entries.length;
  const totalDuration =
    entries.length > 0
      ? entries[entries.length - 1].endTime - entries[0].startTime
      : 0;
  const avgWords =
    totalEntries > 0
      ? Math.round(
          entries.reduce(
            (sum, e) =>
              sum + e.text.split(/\s+/).filter((w) => w.length > 0).length,
            0,
          ) / totalEntries,
        )
      : 0;

  /* ── File load ─────────────────────────────────────────────────────── */
  const loadFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result;
        if (typeof content !== 'string') return;
        const parsed = parseSubtitles(content);
        if (parsed.length === 0) {
          showToast(t('tools.subedit.parseError'));
          return;
        }
        setEntries(parsed);
        setFileName(file.name.replace(/\.[^/.]+$/, ''));
        setPasteMode(false);
      };
      reader.readAsText(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handlePasteImport = useCallback(() => {
    if (!pasteText.trim()) return;
    const parsed = parseSubtitles(pasteText);
    if (parsed.length === 0) {
      showToast(t('tools.subedit.parseError'));
      return;
    }
    setEntries(parsed);
    setFileName('subtitles');
    setPasteMode(false);
    setPasteText('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasteText]);

  /* ── Entry mutations ───────────────────────────────────────────────── */
  const updateEntry = useCallback(
    (id: number, patch: Partial<SubtitleEntry>) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
    },
    [],
  );

  const deleteEntry = useCallback((id: number) => {
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.id !== id);
      // Re-number IDs
      return filtered.map((e, i) => ({ ...e, id: i + 1 }));
    });
  }, []);

  const addEntry = useCallback(() => {
    setEntries((prev) => {
      const lastEnd = prev.length > 0 ? prev[prev.length - 1].endTime : 0;
      const newEntry: SubtitleEntry = {
        id: prev.length + 1,
        startTime: lastEnd,
        endTime: lastEnd + 3,
        text: '',
      };
      return [...prev, newEntry];
    });
  }, []);

  const newDocument = useCallback(() => {
    setEntries([
      { id: 1, startTime: 0, endTime: 3, text: '' },
    ]);
    setFileName('subtitles');
    setPasteMode(false);
  }, []);

  /* ── Toast ─────────────────────────────────────────────────────────── */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  /* ── Timestamp change handler ──────────────────────────────────────── */
  const handleTimestampChange = useCallback(
    (id: number, field: 'startTime' | 'endTime', value: string) => {
      const seconds = parseTimestamp(value);
      updateEntry(id, { [field]: seconds });
    },
    [updateEntry],
  );

  /* ── Style helpers ─────────────────────────────────────────────────── */
  const cardStyle: React.CSSProperties = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: 16,
  };

  const inputStyle: React.CSSProperties = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.text,
    padding: '10px 12px',
    fontSize: 13,
    fontFamily: 'monospace',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    height: 44,
  };

  const smallBtnStyle: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 20,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.sub,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    height: 36,
  };

  /* ═══════════ Upload / Empty state ═══════════ */
  if (entries.length === 0 && !pasteMode) {
    return (
      <ToolPageShell
        title={t('tools.subedit.title')}
        subtitle={t('tools.subedit.subtitle')}
        gradient={GRADIENT}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640, margin: '0 auto' }}>
          {/* Upload area */}
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) loadFile(f);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '56px 24px',
              borderRadius: 16,
              border: `2px dashed ${dragOver ? GRADIENT[0] : C.border}`,
              background: dragOver ? `${GRADIENT[0]}15` : C.surface,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              if (!dragOver) {
                e.currentTarget.style.borderColor = C.dim;
                e.currentTarget.style.background = C.surface;
              }
            }}
            onMouseLeave={(e) => {
              if (!dragOver) {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = C.surface;
              }
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke={C.dim}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: C.text,
                marginTop: 14,
              }}
            >
              {t('tools.subedit.dropLabel')}
            </span>
            <span
              style={{ fontSize: 12, color: C.dim, marginTop: 4 }}
            >
              {t('tools.subedit.dropHint')}
            </span>
            <input
              type="file"
              accept=".srt,.vtt,.txt"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) loadFile(f);
                e.target.value = '';
              }}
            />
          </label>

          {/* Or buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <ActionButton
              label={t('tools.subedit.pasteBtn')}
              gradient={GRADIENT}
              onClick={() => setPasteMode(true)}
            />
            <ActionButton
              label={t('tools.subedit.newBtn')}
              gradient={GRADIENT}
              onClick={newDocument}
            />
          </div>
        </div>

        {/* Toast */}
        {toast && <Toast C={C} message={toast} />}
      </ToolPageShell>
    );
  }

  /* ═══════════ Paste mode ═══════════ */
  if (pasteMode && entries.length === 0) {
    return (
      <ToolPageShell
        title={t('tools.subedit.title')}
        subtitle={t('tools.subedit.subtitle')}
        gradient={GRADIENT}
      >
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={cardStyle}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 10px' }}>
              {t('tools.subedit.pasteLabel')}
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`1\n00:00:01,000 --> 00:00:04,000\nHello World`}
              style={{
                ...inputStyle,
                width: '100%',
                minHeight: 200,
                resize: 'vertical',
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ActionButton
              label={t('tools.subedit.importBtn')}
              gradient={GRADIENT}
              onClick={handlePasteImport}
              disabled={!pasteText.trim()}
            />
            <button
              onClick={() => {
                setPasteMode(false);
                setPasteText('');
              }}
              style={smallBtnStyle}
            >
              {t('tools.subedit.cancelBtn')}
            </button>
          </div>
        </div>
        {toast && <Toast C={C} message={toast} />}
      </ToolPageShell>
    );
  }

  /* ═══════════ Editor ═══════════ */
  return (
    <ToolPageShell
      title={t('tools.subedit.title')}
      subtitle={t('tools.subedit.subtitle')}
      gradient={GRADIENT}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* ── Toolbar ──────────────────────────────────────────────────── */}
        <div
          className="tf-subedit-toolbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {/* New */}
          <button
            onClick={newDocument}
            style={smallBtnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.cardHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.card;
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {t('tools.subedit.newBtn')}
          </button>

          {/* Open file */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={smallBtnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.cardHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.card;
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            {t('tools.subedit.openBtn')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".srt,.vtt,.txt"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) loadFile(f);
              e.target.value = '';
            }}
          />

          {/* Add entry */}
          <button
            onClick={addEntry}
            style={smallBtnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.cardHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.card;
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('tools.subedit.addEntry')}
          </button>

          <div className="tf-subedit-toolbar-spacer" style={{ flex: 1 }} />

          {/* Download SRT */}
          <ActionButton
            label={t('tools.subedit.downloadSrt')}
            gradient={GRADIENT}
            onClick={() => {
              download(`${fileName || 'subtitles'}.srt`, toSRT(entries));
              showToast(t('tools.subedit.downloaded'));
            }}
          />
          {/* Download VTT */}
          <ActionButton
            label={t('tools.subedit.downloadVtt')}
            gradient={['#8b5cf6', '#a855f7']}
            onClick={() => {
              download(`${fileName || 'subtitles'}.vtt`, toVTT(entries));
              showToast(t('tools.subedit.downloaded'));
            }}
          />
        </div>

        {/* ── Stats bar ────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            padding: '10px 14px',
            borderRadius: 10,
            background: `${GRADIENT[0]}08`,
            border: `1px solid ${GRADIENT[0]}20`,
            fontSize: 13,
            color: C.sub,
          }}
        >
          <span>
            <strong style={{ color: C.text }}>{totalEntries}</strong>{' '}
            {t('tools.subedit.statEntries')}
          </span>
          <span>
            <strong style={{ color: C.text }}>
              {formatTimestamp(totalDuration, 'srt')}
            </strong>{' '}
            {t('tools.subedit.statDuration')}
          </span>
          <span>
            <strong style={{ color: C.text }}>{avgWords}</strong>{' '}
            {t('tools.subedit.statAvgWords')}
          </span>
        </div>

        {/* ── Entry list ───────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxHeight: '65vh',
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              C={C}
              inputStyle={inputStyle}
              onUpdate={updateEntry}
              onDelete={deleteEntry}
              onTimestamp={handleTimestampChange}
              t={t}
            />
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast C={C} message={toast} />}
    </ToolPageShell>
  );
}

/* ── Entry row component ─────────────────────────────────────────────── */

interface EntryRowProps {
  entry: SubtitleEntry;
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  inputStyle: React.CSSProperties;
  onUpdate: (id: number, patch: Partial<SubtitleEntry>) => void;
  onDelete: (id: number) => void;
  onTimestamp: (id: number, field: 'startTime' | 'endTime', value: string) => void;
  t: (key: string) => string;
}

function EntryRow({
  entry,
  C,
  inputStyle,
  onUpdate,
  onDelete,
  onTimestamp,
  t,
}: EntryRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="tf-subedit-entry"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 16,
        background: hovered ? C.border : C.surface,
        border: 'none',
        boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.15s ease',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}
    >
      {/* Entry number */}
      <div
        className="tf-subedit-entry-num"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${GRADIENT[0]}20, ${GRADIENT[1]}20)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          color: GRADIENT[0],
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {entry.id}
      </div>

      {/* Timestamps */}
      <div
        className="tf-subedit-timestamps"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minWidth: 150,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: C.dim, width: 32, flexShrink: 0 }}>
            {t('tools.subedit.start')}
          </span>
          <input
            type="text"
            defaultValue={formatTimestamp(entry.startTime, 'srt')}
            onBlur={(e) => onTimestamp(entry.id, 'startTime', e.target.value)}
            style={{ ...inputStyle, width: 130 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: C.dim, width: 32, flexShrink: 0 }}>
            {t('tools.subedit.end')}
          </span>
          <input
            type="text"
            defaultValue={formatTimestamp(entry.endTime, 'srt')}
            onBlur={(e) => onTimestamp(entry.id, 'endTime', e.target.value)}
            style={{ ...inputStyle, width: 130 }}
          />
        </div>
      </div>

      {/* Text */}
      <div className="tf-subedit-text" style={{ flex: 1, minWidth: 180 }}>
        <textarea
          value={entry.text}
          onChange={(e) => onUpdate(entry.id, { text: e.target.value })}
          rows={2}
          style={{
            ...inputStyle,
            resize: 'vertical',
            minHeight: 52,
            lineHeight: 1.5,
            fontFamily: 'inherit',
          }}
          placeholder={t('tools.subedit.textPlaceholder')}
        />
      </div>

      {/* Delete */}
      <button
        className="tf-subedit-delete-btn"
        onClick={() => onDelete(entry.id)}
        title={t('tools.subedit.deleteEntry')}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          background: 'transparent',
          color: C.dim,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s ease',
          marginTop: 2,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = C.red;
          e.currentTarget.style.borderColor = C.red;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = C.dim;
          e.currentTarget.style.borderColor = C.border;
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
    </div>
  );
}

/* ── Toast component ─────────────────────────────────────────────────── */

function Toast({
  C,
  message,
}: {
  C: ReturnType<typeof useThemeStore.getState>['theme'];
  message: string;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '10px 24px',
        borderRadius: 10,
        background: C.surface,
        border: `1px solid ${C.border}`,
        color: C.text,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        zIndex: 9999,
        maxWidth: 'calc(100vw - 32px)',
        textAlign: 'center',
        wordBreak: 'break-word',
      }}
    >
      {message}
    </div>
  );
}
