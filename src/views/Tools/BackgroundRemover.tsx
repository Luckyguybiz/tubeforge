'use client';

import { useState, useRef, useCallback } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function BackgroundRemover() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<'original' | 'result'>('original');
  const [removeHover, setRemoveHover] = useState(false);
  const [downloadHover, setDownloadHover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError(t('tools.bgRemover.invalidType'));
      return;
    }
    if (f.size > MAX_SIZE) {
      setError(t('tools.bgRemover.tooLarge'));
      return;
    }
    setError(null);
    setFile(f);
    setProcessed(false);
    setViewMode('original');
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleRemoveBackground = useCallback(async () => {
    if (!file || !preview) return;
    setProcessing(true);
    setError(null);

    // Simulate processing delay for beta experience
    await new Promise((r) => setTimeout(r, 1500));

    setProcessing(false);
    setProcessed(true);
    setViewMode('result');
  }, [file, preview]);

  const handleDownload = useCallback(() => {
    if (!preview || !file) return;
    // Download original image as PNG
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace(/\.[^/.]+$/, '') + '_no_bg.png';
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = preview;
  }, [preview, file]);

  const handleReset = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setProcessed(false);
    setProcessing(false);
    setError(null);
    setViewMode('original');
  }, [preview]);

  return (
    <ToolPageShell
      title={t('tools.bgRemover.title')}
      subtitle={t('tools.bgRemover.subtitle')}
      gradient={['#8b5cf6', '#7c3aed']}
    >
      {!file ? (
        /* ── Upload area ── */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', borderRadius: 16,
            border: `2px dashed ${dragOver ? '#8b5cf6' : C.border}`,
            background: dragOver ? 'rgba(139,92,246,.1)' : C.surface,
            cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
          }}
          onMouseEnter={(e) => { if (!dragOver) { e.currentTarget.style.borderColor = C.dim; e.currentTarget.style.background = C.surface; } }}
          onMouseLeave={(e) => { if (!dragOver) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; } }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 12 }}>
              {t('tools.bgRemover.dropLabel')}
            </span>
            <span style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
              JPEG, PNG, WebP ({t('tools.bgRemover.maxSize')})
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      ) : (
        <div>
          {/* ── File info bar ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.surface, marginBottom: 20, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(139,92,246,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: 11, color: C.dim }}>{formatSize(file.size)}</div>
            </div>
            <button
              onClick={handleReset}
              onMouseEnter={() => setRemoveHover(true)}
              onMouseLeave={() => setRemoveHover(false)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                background: removeHover ? C.border : C.surface,
                color: C.sub, fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
                flexShrink: 0, height: 36,
              }}
            >
              {t('tools.remove')}
            </button>
          </div>

          {/* ── View toggle (Before / After) ── */}
          {processed && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['original', 'result'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '8px 20px', borderRadius: 20, fontSize: 13,
                    fontWeight: viewMode === mode ? 700 : 500,
                    height: 36, border: 'none',
                    background: viewMode === mode ? 'rgba(139,92,246,.2)' : C.surface,
                    color: viewMode === mode ? '#8b5cf6' : C.sub,
                    cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                  }}
                >
                  {mode === 'original' ? t('tools.bgRemover.before') : t('tools.bgRemover.after')}
                </button>
              ))}
            </div>
          )}

          {/* ── Image preview ── */}
          <div style={{
            position: 'relative', borderRadius: 16, overflow: 'hidden',
            border: 'none', marginBottom: 20,
            ...(processed && viewMode === 'result' ? {
              backgroundImage: `linear-gradient(45deg, ${C.border} 25%, transparent 25%), linear-gradient(-45deg, ${C.border} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${C.border} 75%), linear-gradient(-45deg, transparent 75%, ${C.border} 75%)`,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            } : { background: C.surface }),
          }}>
            {preview && (
              <img
                src={preview}
                alt="Preview"
                style={{
                  display: 'block', maxWidth: '100%', maxHeight: 500, margin: '0 auto',
                  ...(processed && viewMode === 'result' ? { opacity: 0.92 } : {}),
                }}
              />
            )}
            {processing && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                <span style={{ color: C.text, fontSize: 14, fontWeight: 600, marginTop: 12 }}>
                  {t('tools.bgRemover.processing')}
                </span>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
          </div>

          {/* ── Beta notice ── */}
          {processed && (
            <div style={{
              padding: '14px 18px', borderRadius: 16, marginBottom: 20,
              background: C.surface, border: `1px solid ${C.border}`,
              fontSize: 13, color: C.sub, lineHeight: 1.6,
            }}>
              {t('tools.bgRemover.betaNotice')}
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div role="alert" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
              border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)', marginBottom: 16,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{error}</span>
            </div>
          )}

          {/* ── Action buttons ── */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <ActionButton
              label={processed ? t('tools.bgRemover.removeAgain') : t('tools.bgRemover.removeBtn')}
              gradient={['#8b5cf6', '#7c3aed']}
              onClick={handleRemoveBackground}
              loading={processing}
            />
            {processed && (
              <button
                onClick={handleDownload}
                onMouseEnter={() => setDownloadHover(true)}
                onMouseLeave={() => setDownloadHover(false)}
                style={{
                  padding: '12px 32px', borderRadius: 22,
                  border: 'none',
                  background: downloadHover ? C.border : C.surface,
                  color: C.text, fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 8, height: 44,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t('tools.bgRemover.downloadPng')}
              </button>
            )}
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </ToolPageShell>
  );
}
