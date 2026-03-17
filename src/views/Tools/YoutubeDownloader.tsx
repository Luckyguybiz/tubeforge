'use client';

import { useState } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const QUALITIES = ['4K', '1080p', '720p', '480p', 'Audio Only'] as const;
const FORMATS = ['MP4', 'WebM', 'MP3'] as const;

export function YoutubeDownloader() {
  const C = useThemeStore((s) => s.theme);

  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState<(typeof QUALITIES)[number]>('1080p');
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('MP4');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsed, setParsed] = useState(false);
  const [hoveredQuality, setHoveredQuality] = useState<string | null>(null);
  const [hoveredFormat, setHoveredFormat] = useState<string | null>(null);
  const [pasteHover, setPasteHover] = useState(false);

  const handleParse = () => {
    if (!url.trim()) return;
    setParsed(true);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch { /* clipboard not available */ }
  };

  const handleDownload = () => {
    setLoading(true);
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(iv); setLoading(false); return 100; }
        return p + Math.random() * 12;
      });
    }, 300);
  };

  return (
    <ToolPageShell
      title="YouTube Video Downloader"
      subtitle="Download YouTube videos in any quality and format"
      gradient={['#ef4444', '#dc2626']}
    >
      {/* URL Input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: '0 16px', gap: 8,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          <input
            value={url}
            onChange={(e) => { setUrl(e.target.value); setParsed(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleParse()}
            placeholder="Paste YouTube URL here..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: C.text, fontSize: 14, padding: '14px 0', fontFamily: 'inherit',
            }}
          />
        </div>
        <button
          onClick={handlePaste}
          onMouseEnter={() => setPasteHover(true)}
          onMouseLeave={() => setPasteHover(false)}
          style={{
            padding: '0 20px', borderRadius: 12,
            border: `1px solid ${C.border}`,
            background: pasteHover ? C.surface : C.card,
            color: C.text, cursor: 'pointer', fontSize: 13,
            fontWeight: 600, transition: 'all .2s', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Paste
        </button>
      </div>

      {/* Video Info Preview */}
      {parsed && url.trim() && (
        <div style={{
          display: 'flex', gap: 16, padding: 16, borderRadius: 14,
          border: `1px solid ${C.border}`, background: C.card, marginBottom: 24,
        }}>
          <div style={{
            width: 200, height: 112, borderRadius: 10, background: C.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2" /><polygon points="10 8 16 12 10 16" fill={C.dim} stroke="none" />
            </svg>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Sample Video Title - Full HD Quality</div>
            <div style={{ fontSize: 12, color: C.sub }}>Channel Name</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: C.dim, background: C.surface, padding: '3px 8px', borderRadius: 6 }}>12:34</span>
              <span style={{ fontSize: 11, color: C.dim, background: C.surface, padding: '3px 8px', borderRadius: 6 }}>1080p available</span>
              <span style={{ fontSize: 11, color: C.dim, background: C.surface, padding: '3px 8px', borderRadius: 6 }}>24.5 MB</span>
            </div>
          </div>
        </div>
      )}

      {/* Quality Selector */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Quality</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUALITIES.map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              onMouseEnter={() => setHoveredQuality(q)}
              onMouseLeave={() => setHoveredQuality(null)}
              style={{
                padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: quality === q ? '2px solid #ef4444' : `1px solid ${C.border}`,
                background: quality === q ? 'rgba(239,68,68,.12)' : hoveredQuality === q ? C.surface : C.card,
                color: quality === q ? '#ef4444' : C.text,
                cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Format Selector */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Format</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {FORMATS.map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              onMouseEnter={() => setHoveredFormat(f)}
              onMouseLeave={() => setHoveredFormat(null)}
              style={{
                padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: format === f ? '2px solid #ef4444' : `1px solid ${C.border}`,
                background: format === f ? 'rgba(239,68,68,.12)' : hoveredFormat === f ? C.surface : C.card,
                color: format === f ? '#ef4444' : C.text,
                cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      {loading && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.sub }}>Downloading...</span>
            <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>{Math.min(100, Math.round(progress))}%</span>
          </div>
          <div style={{ width: '100%', height: 8, borderRadius: 4, background: C.surface }}>
            <div style={{
              width: `${Math.min(100, progress)}%`, height: '100%', borderRadius: 4,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)', transition: 'width .3s',
            }} />
          </div>
        </div>
      )}

      {/* Download Button */}
      <ActionButton
        label="Download"
        gradient={['#ef4444', '#dc2626']}
        onClick={handleDownload}
        disabled={!url.trim()}
        loading={loading}
      />
    </ToolPageShell>
  );
}
