'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const FORMATS = ['MP4', 'MP3'] as const;

function isValidTiktokUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.|vm\.)?(tiktok\.com\/)/.test(url.trim());
}

export function TiktokDownloader() {
  const C = useThemeStore((s) => s.theme);

  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('MP4');
  const [removeWatermark, setRemoveWatermark] = useState(true);
  const [hdQuality, setHdQuality] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [hoveredFormat, setHoveredFormat] = useState<string | null>(null);
  const [pasteHover, setPasteHover] = useState(false);
  const [downloadHover, setDownloadHover] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const validateUrl = useCallback((value: string) => {
    if (!value.trim()) {
      setUrlError('');
      return false;
    }
    if (!isValidTiktokUrl(value)) {
      setUrlError('Please enter a valid TikTok URL');
      return false;
    }
    setUrlError('');
    return true;
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      validateUrl(text);
    } catch { /* clipboard not available */ }
  };

  const handleDownload = () => {
    if (!url.trim()) return;
    if (!validateUrl(url)) return;
    setLoading(true);
    setProgress(0);
    setDone(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { if (intervalRef.current) clearInterval(intervalRef.current); intervalRef.current = null; setLoading(false); setDone(true); return 100; }
        return p + Math.random() * 15;
      });
    }, 250);
  };

  return (
    <ToolPageShell
      comingSoon
      title="TikTok Video Downloader"
      subtitle="Download TikTok videos without watermark in HD quality"
      gradient={['#000000', '#333333']}
    >
      {/* URL Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: urlError ? 8 : 24,
      }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: C.surface, border: `1px solid ${urlError ? '#ef4444' : C.border}`,
          borderRadius: 12, padding: '0 16px',
          transition: 'all 0.2s ease',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          <input
            value={url}
            onChange={(e) => { setUrl(e.target.value); setUrlError(''); setDone(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
            onBlur={() => { if (url.trim()) validateUrl(url); }}
            placeholder="Paste TikTok video URL here..."
            aria-label="TikTok video URL"
            aria-invalid={!!urlError || undefined}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: C.text, fontSize: 14, padding: '14px 0', fontFamily: 'inherit',
            }}
          />
          {url && (
            <button
              onClick={() => { setUrl(''); setUrlError(''); setDone(false); setProgress(0); }}
              aria-label="Clear URL"
              style={{
                background: 'none', border: 'none', color: C.dim, cursor: 'pointer',
                padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={handlePaste}
          onMouseEnter={() => setPasteHover(true)}
          onMouseLeave={() => setPasteHover(false)}
          style={{
            padding: '14px 20px', borderRadius: 12,
            border: `1px solid ${C.border}`,
            background: pasteHover ? C.surface : C.card,
            color: C.text, cursor: 'pointer', fontSize: 13,
            fontWeight: 600, transition: 'all 0.2s ease', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Paste
        </button>
      </div>

      {/* URL Error */}
      {urlError && (
        <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {urlError}
        </div>
      )}

      {/* Video Preview Area */}
      {url.trim() && !urlError && (
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
          transition: 'all 0.2s ease',
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
              cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease',
              boxShadow: removeWatermark ? '0 0 8px rgba(0,0,0,.3)' : 'none',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 9, background: '#fff',
              position: 'absolute', top: 3,
              left: removeWatermark ? 23 : 3,
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            }} />
          </button>
        </div>

        {/* HD Quality Toggle */}
        <div style={{
          padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'all 0.2s ease',
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
              cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease',
              boxShadow: hdQuality ? '0 0 8px rgba(0,0,0,.3)' : 'none',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 9, background: '#fff',
              position: 'absolute', top: 3,
              left: hdQuality ? 23 : 3,
              transition: 'left 0.2s ease',
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
                cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
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
              background: 'linear-gradient(135deg, #000, #333)', transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Download Complete */}
      {done && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12,
          border: '1px solid rgba(0,0,0,.2)', background: 'rgba(0,0,0,.04)', marginBottom: 20,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Download Complete</div>
            <div style={{ fontSize: 12, color: C.sub }}>Your {format} file is ready{removeWatermark ? ' (watermark removed)' : ''}</div>
          </div>
          <button
            onClick={() => { setDone(false); setProgress(0); }}
            onMouseEnter={() => setDownloadHover(true)}
            onMouseLeave={() => setDownloadHover(false)}
            style={{
              padding: '8px 20px', borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: downloadHover ? C.surface : C.card,
              color: C.text, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Save File
          </button>
        </div>
      )}

      {/* Download Button */}
      <ActionButton
        label={done ? 'Download Again' : 'Download'}
        gradient={['#000000', '#333333']}
        onClick={handleDownload}
        disabled={!url.trim() || !!urlError}
        loading={loading}
      />
    </ToolPageShell>
  );
}
