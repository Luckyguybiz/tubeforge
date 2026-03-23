'use client';

import { useState, useRef, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

export function Mp4ToGif() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);

  // Settings
  const [fps, setFps] = useState(15);
  const [width, setWidth] = useState(480);
  const [startTime, setStartTime] = useState(0);
  const [duration, setDuration] = useState(5);

  const handleFile = useCallback((f: File) => {
    if (f.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum 50MB.');
      return;
    }
    setFile(f);
    setError(null);
    setResultUrl(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(f));
  }, [videoUrl]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const convert = async () => {
    if (!file) return;
    setConverting(true);
    setProgress('Converting...');
    setError(null);
    setResultUrl(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fps', String(fps));
      formData.append('width', String(width));
      formData.append('start', String(startTime));
      formData.append('duration', String(duration));

      const res = await fetch('/api/tools/mp4-to-gif', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Conversion failed' }));
        throw new Error(data.error || 'Conversion failed');
      }

      const blob = await res.blob();
      setResultSize(blob.size);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setProgress('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setProgress('');
    } finally {
      setConverting(false);
    }
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace(/\.\w+$/, '') + '.gif';
    a.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: '0 0 6px' }}>
          MP4 to GIF Converter
        </h1>
        <p style={{ fontSize: 14, color: C.sub, margin: 0 }}>
          Convert video files to high-quality GIF animations. Supports MP4, WebM, MOV.
        </p>
      </div>

      {/* Upload area */}
      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${C.border}`,
            borderRadius: 16,
            padding: 60,
            textAlign: 'center',
            cursor: 'pointer',
            background: C.surface,
            transition: 'border-color .15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget).style.borderColor = C.accent; }}
          onMouseLeave={(e) => { (e.currentTarget).style.borderColor = C.border; }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" style={{ margin: '0 auto 16px', display: 'block' }}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>
            Drop video here or click to upload
          </div>
          <div style={{ fontSize: 13, color: C.dim }}>
            MP4, WebM, MOV, AVI — max 50MB
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* Video preview */}
          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, background: '#000' }}>
              {videoUrl && (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  muted
                  style={{ width: '100%', display: 'block', maxHeight: 400 }}
                  onLoadedMetadata={(e) => {
                    const vid = e.currentTarget;
                    setDuration(Math.min(10, Math.floor(vid.duration)));
                  }}
                />
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                {file.name}
              </span>
              <button
                onClick={() => { setFile(null); setResultUrl(null); setError(null); if (videoUrl) URL.revokeObjectURL(videoUrl); setVideoUrl(null); }}
                style={{ fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              >
                Change file
              </button>
            </div>
          </div>

          {/* Settings */}
          <div style={{ flex: '1 1 240px', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* FPS */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', marginBottom: 6 }}>
                FPS: {fps}
              </div>
              <input type="range" min={5} max={30} value={fps} onChange={(e) => setFps(+e.target.value)}
                style={{ width: '100%', accentColor: C.accent }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.dim }}>
                <span>5</span><span>15</span><span>30</span>
              </div>
            </div>

            {/* Width */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', marginBottom: 6 }}>
                Width: {width}px
              </div>
              <input type="range" min={160} max={1280} step={80} value={width} onChange={(e) => setWidth(+e.target.value)}
                style={{ width: '100%', accentColor: C.accent }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.dim }}>
                <span>160</span><span>480</span><span>1280</span>
              </div>
            </div>

            {/* Start time */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', marginBottom: 6 }}>
                Start: {startTime}s
              </div>
              <input type="range" min={0} max={60} value={startTime} onChange={(e) => setStartTime(+e.target.value)}
                style={{ width: '100%', accentColor: C.accent }} />
            </div>

            {/* Duration */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', marginBottom: 6 }}>
                Duration: {duration}s
              </div>
              <input type="range" min={1} max={30} value={duration} onChange={(e) => setDuration(+e.target.value)}
                style={{ width: '100%', accentColor: C.accent }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.dim }}>
                <span>1s</span><span>10s</span><span>30s</span>
              </div>
            </div>

            {/* Convert button */}
            <button
              onClick={convert}
              disabled={converting}
              style={{
                width: '100%', padding: '14px 24px', borderRadius: 10,
                border: 'none', background: converting ? C.dim : C.accent,
                color: '#fff', fontSize: 15, fontWeight: 700, cursor: converting ? 'wait' : 'pointer',
                fontFamily: 'inherit', transition: 'all .15s',
              }}
            >
              {converting ? progress || 'Converting...' : 'Convert to GIF'}
            </button>

            {error && (
              <div style={{ padding: 10, borderRadius: 8, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', color: '#ef4444', fontSize: 12 }}>
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Result */}
      {resultUrl && (
        <div style={{ marginTop: 24, padding: 20, borderRadius: 14, border: `1px solid ${C.border}`, background: C.surface }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>GIF Ready!</span>
              <span style={{ fontSize: 12, color: C.dim, marginLeft: 8 }}>{formatSize(resultSize)}</span>
            </div>
            <button
              onClick={download}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: C.accent, color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Download GIF
            </button>
          </div>
          <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000', textAlign: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="Converted GIF" style={{ maxWidth: '100%', maxHeight: 500, display: 'block', margin: '0 auto' }} />
          </div>
        </div>
      )}
    </div>
  );
}
