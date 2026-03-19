'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import type { Theme } from '@/lib/types';

const GRADIENT: [string, string] = ['#6366f1', '#8b5cf6'];

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SubtitleEntry {
  id: string;
  index: number;
  startTime: number; // seconds
  endTime: number;   // seconds
  text: string;
}

type ExportFormat = 'srt' | 'vtt';

/* ------------------------------------------------------------------ */
/*  Time helpers                                                       */
/* ------------------------------------------------------------------ */

/** Parse "HH:MM:SS,mmm" (SRT) or "HH:MM:SS.mmm" (VTT) into seconds */
function parseTime(raw: string): number {
  const cleaned = raw.trim().replace(',', '.');
  const parts = cleaned.split(':');
  if (parts.length !== 3) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const secParts = parts[2].split('.');
  const seconds = parseInt(secParts[0], 10) || 0;
  const millis = parseInt((secParts[1] ?? '0').padEnd(3, '0').slice(0, 3), 10) || 0;
  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

/** Format seconds into "HH:MM:SS,mmm" (SRT) or "HH:MM:SS.mmm" (VTT) */
function formatTime(totalSeconds: number, format: ExportFormat = 'srt'): string {
  const clamped = Math.max(0, totalSeconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  const ms = Math.round((clamped % 1) * 1000);
  const sep = format === 'vtt' ? '.' : ',';
  return (
    String(h).padStart(2, '0') + ':' +
    String(m).padStart(2, '0') + ':' +
    String(s).padStart(2, '0') + sep +
    String(ms).padStart(3, '0')
  );
}

/** Format seconds for display in inputs: "HH:MM:SS.mmm" (always dot for editing) */
function formatTimeForInput(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  const ms = Math.round((clamped % 1) * 1000);
  return (
    String(h).padStart(2, '0') + ':' +
    String(m).padStart(2, '0') + ':' +
    String(s).padStart(2, '0') + '.' +
    String(ms).padStart(3, '0')
  );
}

/* ------------------------------------------------------------------ */
/*  Parsers                                                            */
/* ------------------------------------------------------------------ */

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return 'sub-' + idCounter + '-' + Date.now().toString(36);
}

function parseSRT(content: string): SubtitleEntry[] {
  const entries: SubtitleEntry[] = [];
  // Normalise line endings and split into blocks
  const blocks = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;

    const indexLine = parseInt(lines[0], 10);
    if (isNaN(indexLine)) continue;

    const timeLine = lines[1];
    const arrowMatch = timeLine.match(/^([\d:,.\s]+)\s*-->\s*([\d:,.\s]+)$/);
    if (!arrowMatch) continue;

    const startTime = parseTime(arrowMatch[1]);
    const endTime = parseTime(arrowMatch[2]);
    const text = lines.slice(2).join('\n');

    entries.push({ id: nextId(), index: indexLine, startTime, endTime, text });
  }

  return entries;
}

function parseVTT(content: string): SubtitleEntry[] {
  const entries: SubtitleEntry[] = [];
  // Strip header
  const withoutHeader = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const headerEnd = withoutHeader.indexOf('\n\n');
  const body = headerEnd >= 0 ? withoutHeader.slice(headerEnd + 2) : withoutHeader;
  const blocks = body.trim().split(/\n\n+/);

  let idx = 1;
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    // Lines might start with an optional numeric cue id
    let timeLineIdx = 0;
    if (!lines[0].includes('-->')) {
      timeLineIdx = 1;
    }
    if (timeLineIdx >= lines.length) continue;

    const timeLine = lines[timeLineIdx];
    const arrowMatch = timeLine.match(/^([\d:.\s]+)\s*-->\s*([\d:.\s]+)/);
    if (!arrowMatch) continue;

    const startTime = parseTime(arrowMatch[1]);
    const endTime = parseTime(arrowMatch[2]);
    const text = lines.slice(timeLineIdx + 1).join('\n');

    entries.push({ id: nextId(), index: idx, startTime, endTime, text });
    idx++;
  }

  return entries;
}

/* ------------------------------------------------------------------ */
/*  Exporters                                                          */
/* ------------------------------------------------------------------ */

function exportSRT(entries: SubtitleEntry[]): string {
  return entries
    .sort((a, b) => a.startTime - b.startTime)
    .map((e, i) =>
      `${i + 1}\n${formatTime(e.startTime, 'srt')} --> ${formatTime(e.endTime, 'srt')}\n${e.text}`
    )
    .join('\n\n') + '\n';
}

function exportVTT(entries: SubtitleEntry[]): string {
  const cues = entries
    .sort((a, b) => a.startTime - b.startTime)
    .map(
      (e) =>
        `${formatTime(e.startTime, 'vtt')} --> ${formatTime(e.endTime, 'vtt')}\n${e.text}`
    )
    .join('\n\n');
  return `WEBVTT\n\n${cues}\n`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SubtitleEditor() {
  const C = useThemeStore((s) => s.theme);

  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [entries, setEntries] = useState<SubtitleEntry[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('srt');
  const [parseError, setParseError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* ---- Derived values ---- */
  const totalDuration = useMemo(() => {
    if (entries.length === 0) return 60;
    return Math.max(...entries.map((e) => e.endTime), 60);
  }, [entries]);

  /* ---- File handlers ---- */
  const handleSubtitleFile = useCallback((file: File) => {
    setSubtitleFile(file);
    setParseError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const name = file.name.toLowerCase();
      let parsed: SubtitleEntry[];
      if (name.endsWith('.vtt')) {
        parsed = parseVTT(text);
      } else {
        parsed = parseSRT(text);
      }
      if (parsed.length === 0) {
        setParseError('Could not parse any subtitle entries from this file. Please check the format.');
      }
      setEntries(parsed);
    };
    reader.onerror = () => {
      setParseError('Failed to read file.');
    };
    reader.readAsText(file);
  }, []);

  const handleVideoFile = useCallback((file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
  }, []);

  /* ---- Entry mutation helpers ---- */
  const updateEntry = useCallback((id: string, patch: Partial<SubtitleEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addEntry = useCallback(() => {
    const lastEnd = entries.length > 0 ? Math.max(...entries.map((e) => e.endTime)) : 0;
    const newEntry: SubtitleEntry = {
      id: nextId(),
      index: entries.length + 1,
      startTime: lastEnd + 0.5,
      endTime: lastEnd + 3.5,
      text: '',
    };
    setEntries((prev) => [...prev, newEntry]);
    // Scroll to bottom after adding
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 50);
  }, [entries]);

  /* ---- Export / Download ---- */
  const handleDownload = useCallback(() => {
    if (entries.length === 0) return;
    const content = exportFormat === 'vtt' ? exportVTT(entries) : exportSRT(entries);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = subtitleFile
      ? subtitleFile.name.replace(/\.(srt|vtt)$/i, '')
      : 'subtitles';
    a.download = `${baseName}.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries, exportFormat, subtitleFile]);

  /* ---- Reset ---- */
  const handleReset = useCallback(() => {
    setSubtitleFile(null);
    setVideoFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setEntries([]);
    setParseError(null);
  }, [videoUrl]);

  /* ---- Time input change handler (returns seconds or null if invalid) ---- */
  const handleTimeChange = useCallback(
    (id: string, field: 'startTime' | 'endTime', raw: string) => {
      const seconds = parseTime(raw);
      updateEntry(id, { [field]: seconds });
    },
    [updateEntry]
  );

  /* ================================================================ */
  /*  Upload screen (no file loaded yet)                               */
  /* ================================================================ */

  if (!subtitleFile) {
    return (
      <ToolPageShell
        title="Subtitle Editor"
        subtitle="Edit, create, and export SRT/VTT subtitle files"
        gradient={GRADIENT}
        badge="TOOL"
        badgeColor="#6366f1"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <UploadArea
            C={C}
            accept=".srt,.vtt,text/plain"
            onFile={handleSubtitleFile}
            label="Upload an SRT or VTT subtitle file to start editing"
          />
          <div style={{
            padding: 16, borderRadius: 12,
            background: C.card, border: `1px solid ${C.border}`,
            textAlign: 'center',
          }}>
            <span style={{ fontSize: 13, color: C.sub }}>
              Or{' '}
            </span>
            <button
              onClick={() => {
                // Create an empty project to start from scratch
                setSubtitleFile(new File([''], 'new-subtitles.srt', { type: 'text/plain' }));
                setEntries([{
                  id: nextId(),
                  index: 1,
                  startTime: 0,
                  endTime: 3,
                  text: 'First subtitle',
                }]);
              }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: GRADIENT[0], fontWeight: 600, fontSize: 13,
                textDecoration: 'underline', fontFamily: 'inherit',
              }}
            >
              start from scratch
            </button>
          </div>
        </div>
      </ToolPageShell>
    );
  }

  /* ================================================================ */
  /*  Main editor screen                                               */
  /* ================================================================ */

  return (
    <ToolPageShell
      title="Subtitle Editor"
      subtitle="Edit, create, and export SRT/VTT subtitle files"
      gradient={GRADIENT}
      badge="TOOL"
      badgeColor="#6366f1"
    >
      {/* Parse error */}
      {parseError && (
        <div role="alert" style={{
          padding: 14, borderRadius: 10, marginBottom: 16,
          background: '#ef444412', border: '1px solid #ef444433',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
            {parseError}
          </span>
        </div>
      )}

      {/* Top bar: file info, video upload, format selector, download */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 16, flexWrap: 'wrap',
      }}>
        {/* File info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 10,
          background: C.card, border: `1px solid ${C.border}`,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.text, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subtitleFile.name}
          </span>
          <span style={{ fontSize: 11, color: C.dim }}>
            ({entries.length} entries)
          </span>
        </div>

        {/* Optional video upload */}
        {!videoFile && (
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.card,
            cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.sub,
            transition: 'all 0.2s ease',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            Add Video Preview
            <input type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleVideoFile(f);
              e.target.value = '';
            }} />
          </label>
        )}

        <div style={{ flex: 1 }} />

        {/* Export format selector */}
        <div style={{
          display: 'flex', borderRadius: 10,
          border: `1px solid ${C.border}`, overflow: 'hidden',
        }}>
          {(['srt', 'vtt'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setExportFormat(fmt)}
              style={{
                padding: '8px 16px', border: 'none',
                background: exportFormat === fmt
                  ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                  : C.card,
                color: exportFormat === fmt ? '#fff' : C.sub,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                textTransform: 'uppercase', fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
            >
              .{fmt}
            </button>
          ))}
        </div>

        {/* Download */}
        <ActionButton
          label="Download"
          gradient={GRADIENT}
          onClick={handleDownload}
          disabled={entries.length === 0}
        />
      </div>

      {/* Main layout: subtitle list + optional video preview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: videoUrl ? '1fr 360px' : '1fr',
        gap: 20,
        alignItems: 'start',
      }}>
        {/* Left column: subtitle entries + timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Action bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={addEntry}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10,
                border: `1px solid ${GRADIENT[0]}44`,
                background: `${GRADIENT[0]}12`,
                color: GRADIENT[0], fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${GRADIENT[0]}22`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${GRADIENT[0]}12`; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Subtitle
            </button>

            <div style={{ flex: 1 }} />

            {/* Sort hint */}
            <span style={{ fontSize: 11, color: C.dim }}>
              {entries.length} subtitle{entries.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Subtitle entry list */}
          <div
            ref={listRef}
            style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              maxHeight: 520, overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {entries.length === 0 && (
              <div style={{
                padding: 40, textAlign: 'center', borderRadius: 12,
                background: C.card, border: `1px solid ${C.border}`,
              }}>
                <p style={{ fontSize: 14, color: C.dim, margin: 0 }}>
                  No subtitle entries. Click &quot;Add Subtitle&quot; to create one.
                </p>
              </div>
            )}

            {entries
              .slice()
              .sort((a, b) => a.startTime - b.startTime)
              .map((entry, displayIdx) => (
                <SubtitleRow
                  key={entry.id}
                  entry={entry}
                  displayIndex={displayIdx + 1}
                  C={C}
                  gradient={GRADIENT}
                  onUpdate={updateEntry}
                  onDelete={deleteEntry}
                  onTimeChange={handleTimeChange}
                  onSeek={(t) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = t;
                    }
                  }}
                />
              ))}
          </div>

          {/* Timeline bar */}
          <div style={{
            padding: '14px 16px', borderRadius: 12,
            background: C.card, border: `1px solid ${C.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>Timeline</span>
              <span style={{ fontSize: 10, color: C.dim, fontFamily: 'monospace' }}>
                {formatTimeForInput(0)} - {formatTimeForInput(totalDuration)}
              </span>
            </div>
            <div style={{
              position: 'relative', height: 32, borderRadius: 6,
              background: C.surface, border: `1px solid ${C.border}`,
              overflow: 'hidden',
            }}>
              {/* Time markers */}
              {Array.from({ length: 5 }).map((_, i) => {
                const pct = (i + 1) * 20;
                return (
                  <div key={i} style={{
                    position: 'absolute', left: `${pct}%`, top: 0, bottom: 0,
                    width: 1, background: C.border, opacity: 0.5,
                  }} />
                );
              })}

              {/* Subtitle blocks */}
              {entries.map((e) => {
                const left = (e.startTime / totalDuration) * 100;
                const width = Math.max(((e.endTime - e.startTime) / totalDuration) * 100, 0.5);
                return (
                  <div
                    key={e.id}
                    title={`${formatTimeForInput(e.startTime)} - ${formatTimeForInput(e.endTime)}\n${e.text.slice(0, 60)}`}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      width: `${width}%`,
                      top: 4, bottom: 4,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${GRADIENT[0]}cc, ${GRADIENT[1]}cc)`,
                      cursor: 'pointer',
                      transition: 'opacity 0.15s ease',
                      minWidth: 3,
                    }}
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = e.startTime;
                      }
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.7'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                  />
                );
              })}
            </div>

            {/* Time labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {Array.from({ length: 6 }).map((_, i) => {
                const t = (totalDuration / 5) * i;
                return (
                  <span key={i} style={{ fontSize: 9, color: C.dim, fontFamily: 'monospace' }}>
                    {formatTimeForInput(t)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: optional video preview */}
        {videoUrl && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 20 }}>
            <div style={{
              borderRadius: 12, overflow: 'hidden',
              border: `1px solid ${C.border}`, background: '#000',
              position: 'relative',
            }}>
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                style={{ width: '100%', display: 'block', maxHeight: 400 }}
              />
            </div>

            {/* Remove video */}
            <button
              onClick={() => {
                setVideoFile(null);
                if (videoUrl) URL.revokeObjectURL(videoUrl);
                setVideoUrl(null);
              }}
              style={{
                padding: '8px 0', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.card,
                color: C.dim, fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.color = C.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.dim; }}
            >
              Remove Video
            </button>
          </div>
        )}
      </div>

      {/* Bottom bar: reset + re-upload */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginTop: 20, paddingTop: 16,
        borderTop: `1px solid ${C.border}`,
      }}>
        <button
          onClick={handleReset}
          style={{
            padding: '8px 20px', borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.card,
            color: C.dim, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.color = C.text; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.dim; }}
        >
          Start Over
        </button>

        {/* Re-upload subtitle */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 20px', borderRadius: 10,
          border: `1px solid ${C.border}`, background: C.card,
          cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.sub,
          transition: 'all 0.2s ease',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Load Different File
          <input type="file" accept=".srt,.vtt,text/plain" style={{ display: 'none' }} onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleSubtitleFile(f);
            e.target.value = '';
          }} />
        </label>
      </div>
    </ToolPageShell>
  );
}

/* ------------------------------------------------------------------ */
/*  SubtitleRow component                                              */
/* ------------------------------------------------------------------ */

interface SubtitleRowProps {
  entry: SubtitleEntry;
  displayIndex: number;
  C: Theme;
  gradient: [string, string];
  onUpdate: (id: string, patch: Partial<SubtitleEntry>) => void;
  onDelete: (id: string) => void;
  onTimeChange: (id: string, field: 'startTime' | 'endTime', raw: string) => void;
  onSeek: (time: number) => void;
}

function SubtitleRow({
  entry, displayIndex, C, gradient, onUpdate, onDelete, onTimeChange, onSeek,
}: SubtitleRowProps) {
  const [startStr, setStartStr] = useState(formatTimeForInput(entry.startTime));
  const [endStr, setEndStr] = useState(formatTimeForInput(entry.endTime));

  // Keep local strings in sync if external changes happen
  // (We use local state for smooth editing, commit on blur)
  const commitStart = useCallback(() => {
    onTimeChange(entry.id, 'startTime', startStr);
  }, [entry.id, startStr, onTimeChange]);

  const commitEnd = useCallback(() => {
    onTimeChange(entry.id, 'endTime', endStr);
  }, [entry.id, endStr, onTimeChange]);

  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      padding: '12px 14px', borderRadius: 10,
      background: C.card, border: `1px solid ${C.border}`,
      transition: 'all 0.15s ease',
    }}>
      {/* Index number */}
      <button
        onClick={() => onSeek(entry.startTime)}
        title="Seek to this subtitle"
        style={{
          width: 28, height: 28, borderRadius: 8, border: 'none',
          background: `${gradient[0]}18`,
          color: gradient[0], fontSize: 11, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0, fontFamily: 'inherit',
          transition: 'all 0.2s ease', marginTop: 2,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `${gradient[0]}30`; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = `${gradient[0]}18`; }}
      >
        {displayIndex}
      </button>

      {/* Time fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <input
          value={startStr}
          onChange={(e) => setStartStr(e.target.value)}
          onBlur={commitStart}
          onKeyDown={(e) => { if (e.key === 'Enter') commitStart(); }}
          placeholder="00:00:00.000"
          aria-label={`Start time for subtitle ${displayIndex}`}
          style={{
            width: 110, padding: '5px 8px', borderRadius: 6,
            border: `1px solid ${C.border}`, background: C.surface,
            color: C.text, fontSize: 11, fontFamily: 'monospace',
            outline: 'none', transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = gradient[0]; }}
        />
        <input
          value={endStr}
          onChange={(e) => setEndStr(e.target.value)}
          onBlur={commitEnd}
          onKeyDown={(e) => { if (e.key === 'Enter') commitEnd(); }}
          placeholder="00:00:00.000"
          aria-label={`End time for subtitle ${displayIndex}`}
          style={{
            width: 110, padding: '5px 8px', borderRadius: 6,
            border: `1px solid ${C.border}`, background: C.surface,
            color: C.text, fontSize: 11, fontFamily: 'monospace',
            outline: 'none', transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = gradient[0]; }}
        />
        <span style={{ fontSize: 9, color: C.dim, fontFamily: 'monospace', paddingLeft: 2 }}>
          {((entry.endTime - entry.startTime)).toFixed(1)}s
        </span>
      </div>

      {/* Text area */}
      <textarea
        value={entry.text}
        onChange={(e) => onUpdate(entry.id, { text: e.target.value })}
        placeholder="Subtitle text..."
        aria-label={`Text for subtitle ${displayIndex}`}
        rows={2}
        style={{
          flex: 1, padding: '6px 10px', borderRadius: 8,
          border: `1px solid ${C.border}`, background: C.surface,
          color: C.text, fontSize: 13, outline: 'none',
          fontFamily: 'inherit', resize: 'vertical',
          minHeight: 44, transition: 'border-color 0.2s ease',
          lineHeight: 1.4,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = gradient[0]; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
      />

      {/* Delete button */}
      <button
        onClick={() => onDelete(entry.id)}
        title="Delete this subtitle"
        aria-label={`Delete subtitle ${displayIndex}`}
        style={{
          width: 28, height: 28, borderRadius: 8, border: 'none',
          background: 'transparent', color: C.dim,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
          transition: 'all 0.2s ease', marginTop: 2,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ef444418';
          e.currentTarget.style.color = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = C.dim;
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>
    </div>
  );
}
