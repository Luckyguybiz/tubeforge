'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ToolPageShell } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#3b82f6', '#06b6d4'];
const SPEEDS = [0.5, 1, 1.5, 2];

interface Segment {
  id: string;
  startTime: number;
  endTime: number;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function CutCrop() {
  const C = useThemeStore((s) => s.theme);

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [showCrop, setShowCrop] = useState(false);
  const [toast, setToast] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const animRef = useRef(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const trimRef = useRef<{ segId: string; edge: 'left' | 'right'; startX: number; origTime: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---- file handling ---- */
  const loadFile = useCallback((f: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(f);
    setFile(f);
    setVideoUrl(url);
    setIsPlaying(false);
    setCurrentTime(0);
    setSpeed(1);
    setZoom(1);
    setShowCrop(false);
    setSelectedSegmentId(null);
  }, [videoUrl]);

  useEffect(() => {
    return () => { if (videoUrl) URL.revokeObjectURL(videoUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const d = v.duration;
    setDuration(d);
    setSegments([{ id: uid(), startTime: 0, endTime: d }]);
  }, []);

  /* ---- playback ---- */
  const tick = useCallback(() => {
    const v = videoRef.current;
    if (v && !v.paused) {
      setCurrentTime(v.currentTime);
      animRef.current = requestAnimationFrame(tick);
    }
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
      animRef.current = requestAnimationFrame(tick);
    } else {
      v.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animRef.current);
    }
  }, [tick]);

  const rewind5 = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, v.currentTime - 5);
    setCurrentTime(v.currentTime);
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const idx = SPEEDS.indexOf(prev);
      const next = SPEEDS[(idx + 1) % SPEEDS.length];
      if (videoRef.current) videoRef.current.playbackRate = next;
      return next;
    });
  }, []);

  /* ---- segment operations ---- */
  const splitAtPlayhead = useCallback(() => {
    const t = videoRef.current?.currentTime ?? currentTime;
    setSegments((prev) => {
      const seg = prev.find((s) => s.id === selectedSegmentId && t > s.startTime + 0.1 && t < s.endTime - 0.1);
      if (!seg) return prev;
      const left: Segment = { id: uid(), startTime: seg.startTime, endTime: t };
      const right: Segment = { id: uid(), startTime: t, endTime: seg.endTime };
      return prev.map((s) => (s.id === seg.id ? left : s)).flatMap((s) => (s.id === left.id ? [left, right] : [s]));
    });
  }, [selectedSegmentId, currentTime]);

  const duplicateSegment = useCallback(() => {
    setSegments((prev) => {
      const idx = prev.findIndex((s) => s.id === selectedSegmentId);
      if (idx < 0) return prev;
      const seg = prev[idx];
      const copy: Segment = { id: uid(), startTime: seg.startTime, endTime: seg.endTime };
      const out = [...prev];
      out.splice(idx + 1, 0, copy);
      return out;
    });
  }, [selectedSegmentId]);

  const deleteSegment = useCallback(() => {
    setSegments((prev) => {
      if (prev.length <= 1) return prev;
      const out = prev.filter((s) => s.id !== selectedSegmentId);
      setSelectedSegmentId(out[0]?.id ?? null);
      return out;
    });
  }, [selectedSegmentId]);

  /* ---- timeline helpers ---- */
  const timelinePxPerSec = duration > 0 ? (700 * zoom) / duration : 4;

  const seekOnTimeline = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration <= 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const t = Math.max(0, Math.min(duration, x / timelinePxPerSec));
    if (videoRef.current) videoRef.current.currentTime = t;
    setCurrentTime(t);
  }, [duration, timelinePxPerSec]);

  /* ---- trim handle drag ---- */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const tr = trimRef.current;
      if (!tr || !timelineRef.current) return;
      const dx = e.clientX - tr.startX;
      const dt = dx / timelinePxPerSec;
      const newTime = Math.max(0, Math.min(duration, tr.origTime + dt));
      setSegments((prev) =>
        prev.map((s) => {
          if (s.id !== tr.segId) return s;
          if (tr.edge === 'left') return { ...s, startTime: Math.min(newTime, s.endTime - 0.1) };
          return { ...s, endTime: Math.max(newTime, s.startTime + 0.1) };
        }),
      );
    };
    const onUp = () => { trimRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [duration, timelinePxPerSec]);

  /* ---- toast ---- */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---- style helpers ---- */
  const btnBase: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`,
    background: C.card, color: C.text, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s ease', fontFamily: 'inherit', flexShrink: 0, fontSize: 13, fontWeight: 600,
  };
  const hover = (bg: string) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = bg; },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = C.card; },
  });

  /* ========== RENDER ========== */

  // ---------- Upload screen ----------
  if (!file) {
    return (
      <ToolPageShell title="Cut & Crop" subtitle="Trim, crop, and stitch video clips with precision" gradient={GRADIENT}>
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('video/')) loadFile(f); }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '64px 24px', borderRadius: 16,
            border: `2px dashed ${dragOver ? GRADIENT[0] : C.border}`,
            background: dragOver ? `${GRADIENT[0]}10` : C.surface,
            cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
          }}
        >
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text, marginTop: 16 }}>
            Drag & drop your video here
          </span>
          <span style={{ fontSize: 13, color: C.dim, marginTop: 6 }}>or choose a file</span>
          <input type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => {
            const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = '';
          }} />
        </label>
      </ToolPageShell>
    );
  }

  // ---------- Editor ----------
  const timelineW = duration > 0 ? duration * timelinePxPerSec : 700;
  const markerStep = duration > 120 ? 30 : duration > 30 ? 10 : 5;
  const markers: number[] = [];
  for (let t = 0; t <= duration; t += markerStep) markers.push(t);

  return (
    <ToolPageShell title="Cut & Crop" subtitle="Trim, crop, and stitch video clips with precision" gradient={GRADIENT}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* ---- VIDEO PLAYER ---- */}
        <div style={{
          width: '100%', background: '#000', borderRadius: '14px 14px 0 0', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          maxHeight: '60vh',
        }}>
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={onMetadata}
            onEnded={() => { setIsPlaying(false); cancelAnimationFrame(animRef.current); }}
            style={{ maxWidth: '100%', maxHeight: '60vh', display: 'block' }}
          />
          {showCrop && (
            <div style={{
              position: 'absolute', top: '15%', left: '20%', width: '60%', height: '70%',
              border: '2px dashed rgba(255,255,255,0.7)', borderRadius: 4,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)', pointerEvents: 'none',
            }} />
          )}
        </div>

        {/* ---- CONTROLS BAR ---- */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
          background: C.surface, border: `1px solid ${C.border}`, borderTop: 'none',
          flexWrap: 'wrap',
        }}>
          {/* Play/Pause */}
          <button onClick={togglePlay} style={btnBase} {...hover(C.cardHover)} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21" /></svg>
            )}
          </button>

          {/* Rewind 5s */}
          <button onClick={rewind5} style={btnBase} {...hover(C.cardHover)} title="Rewind 5s">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 105.64-8.36L1 10" />
            </svg>
          </button>

          {/* Speed */}
          <button onClick={cycleSpeed} style={{ ...btnBase, width: 'auto', padding: '0 10px' }} {...hover(C.cardHover)} title="Playback speed">
            {speed}x
          </button>

          {/* Time */}
          <span style={{ fontSize: 12, color: C.sub, fontFamily: 'monospace', padding: '0 6px', userSelect: 'none' }}>
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: C.border, margin: '0 4px', flexShrink: 0 }} />

          {/* Split */}
          <button onClick={splitAtPlayhead} style={btnBase} {...hover(C.cardHover)} title="Split at playhead">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>
          </button>

          {/* Crop toggle */}
          <button onClick={() => setShowCrop(!showCrop)} style={{ ...btnBase, background: showCrop ? `${GRADIENT[0]}22` : C.card, borderColor: showCrop ? GRADIENT[0] : C.border, color: showCrop ? GRADIENT[0] : C.text }} {...hover(showCrop ? `${GRADIENT[0]}33` : C.cardHover)} title="Toggle crop overlay">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.13 1L6 16a2 2 0 002 2h15" /><path d="M1 6.13L16 6a2 2 0 012 2v15" />
            </svg>
          </button>

          {/* Duplicate */}
          <button onClick={duplicateSegment} style={btnBase} {...hover(C.cardHover)} title="Duplicate segment">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </button>

          {/* Delete */}
          <button onClick={deleteSegment} style={{ ...btnBase, color: segments.length > 1 ? '#ef4444' : C.dim }} {...hover(C.cardHover)} title="Delete segment">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </button>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Zoom controls */}
          <button onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))} style={{ ...btnBase, width: 28, height: 28, fontSize: 16 }} {...hover(C.cardHover)} title="Zoom out">-</button>
          <input type="range" min={1} max={4} step={0.25} value={zoom}
            onChange={(e) => setZoom(+e.target.value)}
            style={{ width: 80, accentColor: GRADIENT[0] }}
          />
          <button onClick={() => setZoom((z) => Math.min(4, +(z + 0.5).toFixed(1)))} style={{ ...btnBase, width: 28, height: 28, fontSize: 16 }} {...hover(C.cardHover)} title="Zoom in">+</button>

          {/* Add video */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ ...btnBase, width: 'auto', padding: '0 12px', gap: 6 }}
            {...hover(C.cardHover)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            <span style={{ fontSize: 12 }}>Add Video</span>
          </button>
          <input ref={fileInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => {
            const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = '';
          }} />
        </div>

        {/* ---- TIMELINE ---- */}
        <div
          ref={timelineRef}
          onClick={seekOnTimeline}
          style={{
            overflowX: 'auto', overflowY: 'hidden', position: 'relative',
            background: C.card, border: `1px solid ${C.border}`, borderTop: 'none',
            borderRadius: '0 0 14px 14px', height: 90, cursor: 'crosshair',
          }}
        >
          <div style={{ position: 'relative', width: timelineW, height: '100%', minWidth: '100%' }}>
            {/* Time markers */}
            {markers.map((t) => (
              <div key={t} style={{ position: 'absolute', left: t * timelinePxPerSec, top: 0, height: '100%', pointerEvents: 'none' }}>
                <div style={{ width: 1, height: '100%', background: C.border, opacity: 0.5 }} />
                <span style={{ position: 'absolute', top: 2, left: 4, fontSize: 9, color: C.dim, whiteSpace: 'nowrap', userSelect: 'none' }}>
                  {fmt(t)}
                </span>
              </div>
            ))}

            {/* Segments */}
            {segments.map((seg) => {
              const left = seg.startTime * timelinePxPerSec;
              const w = (seg.endTime - seg.startTime) * timelinePxPerSec;
              const sel = seg.id === selectedSegmentId;
              return (
                <div
                  key={seg.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedSegmentId(seg.id); }}
                  style={{
                    position: 'absolute', top: 24, height: 48, left, width: Math.max(w, 4),
                    background: sel
                      ? `linear-gradient(90deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                      : `linear-gradient(90deg, ${GRADIENT[0]}99, ${GRADIENT[1]}99)`,
                    borderRadius: 6, cursor: 'pointer',
                    border: sel ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: sel ? `0 0 8px ${GRADIENT[0]}66` : 'none',
                    transition: 'background 0.15s, border 0.15s, box-shadow 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  }}
                >
                  <span style={{ fontSize: 10, color: '#fff', fontWeight: 600, userSelect: 'none', opacity: 0.85 }}>
                    {fmt(seg.startTime)}-{fmt(seg.endTime)}
                  </span>
                  {/* Left trim handle */}
                  <div
                    onMouseDown={(e) => { e.stopPropagation(); trimRef.current = { segId: seg.id, edge: 'left', startX: e.clientX, origTime: seg.startTime }; setSelectedSegmentId(seg.id); }}
                    style={{
                      position: 'absolute', left: 0, top: 0, width: 8, height: '100%', cursor: 'ew-resize',
                      background: 'rgba(255,255,255,0.25)', borderRadius: '6px 0 0 6px',
                    }}
                  />
                  {/* Right trim handle */}
                  <div
                    onMouseDown={(e) => { e.stopPropagation(); trimRef.current = { segId: seg.id, edge: 'right', startX: e.clientX, origTime: seg.endTime }; setSelectedSegmentId(seg.id); }}
                    style={{
                      position: 'absolute', right: 0, top: 0, width: 8, height: '100%', cursor: 'ew-resize',
                      background: 'rgba(255,255,255,0.25)', borderRadius: '0 6px 6px 0',
                    }}
                  />
                </div>
              );
            })}

            {/* Playhead */}
            <div style={{
              position: 'absolute', left: currentTime * timelinePxPerSec - 1, top: 0, width: 2,
              height: '100%', background: '#fff', pointerEvents: 'none', zIndex: 2,
              boxShadow: '0 0 4px rgba(0,0,0,0.5)',
            }}>
              <div style={{
                position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
                width: 10, height: 10, borderRadius: '50%', background: '#fff',
                boxShadow: '0 0 4px rgba(0,0,0,0.4)',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ---- EXPORT BUTTON (bottom-right) ---- */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button
          onClick={() => setToast('Export coming soon')}
          style={{
            padding: '12px 28px', borderRadius: 12, border: 'none',
            background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            boxShadow: `0 4px 16px ${GRADIENT[0]}44`,
            display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${GRADIENT[0]}66`; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 16px ${GRADIENT[0]}44`; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
          </svg>
          Export
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 24px', borderRadius: 10,
          background: C.surface, border: `1px solid ${C.border}`,
          color: C.text, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          zIndex: 9999,
        }}>
          {toast}
        </div>
      )}
    </ToolPageShell>
  );
}
