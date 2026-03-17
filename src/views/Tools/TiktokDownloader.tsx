'use client';

import { useState } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const FORMATS = ['MP4', 'MP3'] as const;

export function TiktokDownloader() {
  const C = useThemeStore((s) => s.theme);

  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('MP4');
  const [removeWatermark, setRemoveWatermark] = useState(true);
  const [hdQuality, setHdQuality] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hoveredFormat, setHoveredFormat] = useState<string | null>(null);

  const handleDownload = () => {
    if (!url.trim()) return;
    setLoading(true);
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(iv); setLoading(false); return 100; }
        return p + Math.random() * 15;
      });
    }, 250);
  };

  return (
    <ToolPageShell
      title="TikTok Video Downloader"
      subtitle="Download TikTok videos without watermark in HD quality"
      gradient={['#000000', '#333333']}
    >
      {/* URL Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '0 16px', marginBottom: 24,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste TikTok video URL here..."
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: C.text, fontSize: 14, padding: '14px 0', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Video Preview Area */}
      {url.trim() && (
        <div style={{
          display: 'flex', justifyContent: 'center', padding: 32, borderRadius: 14,
          border: `1px solid ${C.border}`, background: C.card, marginBottom: 24,
        }}>
          <div style={{
            width: 180, height: 320, borderRadius: 16, background: C.surface,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${C.border}`,
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21" fill={C.dim} stroke="none" opacity={0.3} />
              <polygon points="5 3 19 12 5 21" />
            </svg>
            <span style={{ fontSize: 11, color: C.dim, marginTop: 12 }}>Video Preview</span>
          </div>
        </div>
      )}

      {/* Options */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24,
      }}>
        {/* Remove Watermark Toggle */}
        <div style={{
          padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Remove Watermark</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Download without TikTok logo</div>
          </div>
          <button
            onClick={() => setRemoveWatermark(!removeWatermark)}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none',
              background: removeWatermark ? '#000' : C.surface,
              cursor: 'pointer', position: 'relative', transition: 'all .2s',
              boxShadow: removeWatermark ? '0 0 8px rgba(0,0,0,.3)' : 'none',
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 9, background: '#fff',
              position: 'absolute', top: 3,
              left: removeWatermark ? 23 : 3,
              transition: 'left .2s',
              boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            }} />
          </button>
        </div>

        {/* HD Quality Toggle */}
        <div style={{
          padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>HD Quality</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Download in highest resolution</div>
          </div>
          <button
            onClick={() => setHdQuality(!hdQuality)}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none',
              background: hdQuality ? '#000' : C.surface,
              cursor: 'pointer', position: 'relative', transition: 'all .2s',
              boxShadow: hdQuality ? '0 0 8px rgba(0,0,0,.3)' : 'none',
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 9, background: '#fff',
              position: 'absolute', top: 3,
              left: hdQuality ? 23 : 3,
              transition: 'left .2s',
              boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            }} />
          </button>
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
                padding: '8px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: format === f ? '2px solid #000' : `1px solid ${C.border}`,
                background: format === f ? 'rgba(0,0,0,.1)' : hoveredFormat === f ? C.surface : C.card,
                color: format === f ? C.text : C.sub,
                cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
              }}
            >
              {f}
              {f === 'MP3' && <span style={{ fontSize: 10, color: C.dim, marginLeft: 4 }}>(audio only)</span>}
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
              background: 'linear-gradient(135deg, #000, #333)', transition: 'width .3s',
            }} />
          </div>
        </div>
      )}

      {/* Download Button */}
      <ActionButton
        label="Download"
        gradient={['#000000', '#333333']}
        onClick={handleDownload}
        disabled={!url.trim()}
        loading={loading}
      />
    </ToolPageShell>
  );
}
