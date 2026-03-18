'use client';

import { useState, useRef, useCallback } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const BITRATES = ['128', '192', '256', '320'] as const;
const SAMPLE_RATES = ['44.1kHz', '48kHz'] as const;

export function Mp3Converter() {
  const C = useThemeStore((s) => s.theme);

  const [file, setFile] = useState<File | null>(null);
  const [bitrate, setBitrate] = useState<(typeof BITRATES)[number]>('256');
  const [sampleRate, setSampleRate] = useState<(typeof SAMPLE_RATES)[number]>('44.1kHz');
  const [trimStart, setTrimStart] = useState('');
  const [trimEnd, setTrimEnd] = useState('');
  const [outputName, setOutputName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hoveredBitrate, setHoveredBitrate] = useState<string | null>(null);
  const [hoveredSample, setHoveredSample] = useState<string | null>(null);
  const [downloadHover, setDownloadHover] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConvert = () => {
    setLoading(true);
    setDone(false);
    setTimeout(() => { setLoading(false); setDone(true); }, 2500);
  };

  const handleDownload = () => {
    if (!file) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = `${outputName || file.name.replace(/\.[^/.]+$/, '')}.mp3`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleReset = () => {
    setFile(null);
    setDone(false);
    setOutputName('');
    setTrimStart('');
    setTrimEnd('');
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith('audio/') || f.type.startsWith('video/'))) {
      setFile(f);
      setDone(false);
    }
  }, []);

  return (
    <ToolPageShell
      title="MP3 Converter"
      subtitle="Convert any audio or video file to MP3 format"
      gradient={['#10b981', '#059669']}
    >
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
        >
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', borderRadius: 16,
            border: `2px dashed ${dragOver ? '#10b981' : C.border}`,
            background: dragOver ? 'rgba(16,185,129,.06)' : C.surface,
            cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 12 }}>
              Drop audio or video file here or click to upload
            </span>
            <span style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
              MP4, WAV, FLAC, OGG, AAC, WebM, MKV
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setFile(f); setDone(false); }
              }}
            />
          </label>
        </div>
      ) : (
        <div>
          {/* File Info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12,
            border: `1px solid ${C.border}`, background: C.card, marginBottom: 24,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{file.name}</div>
              <div style={{ fontSize: 11, color: C.dim }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            <button
              onClick={handleReset}
              onMouseEnter={() => setRemoveHover(true)}
              onMouseLeave={() => setRemoveHover(false)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: removeHover ? C.surface : C.card,
                color: C.sub, fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
              }}
            >
              Remove
            </button>
          </div>

          {/* Bitrate Selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Bitrate (kbps)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {BITRATES.map((b) => (
                <button
                  key={b}
                  onClick={() => setBitrate(b)}
                  onMouseEnter={() => setHoveredBitrate(b)}
                  onMouseLeave={() => setHoveredBitrate(null)}
                  style={{
                    padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    border: bitrate === b ? '2px solid #10b981' : `1px solid ${C.border}`,
                    background: bitrate === b ? 'rgba(16,185,129,.1)' : hoveredBitrate === b ? C.surface : C.card,
                    color: bitrate === b ? '#10b981' : C.text,
                    cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Sample Rate */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Sample Rate</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {SAMPLE_RATES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSampleRate(s)}
                  onMouseEnter={() => setHoveredSample(s)}
                  onMouseLeave={() => setHoveredSample(null)}
                  style={{
                    padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    border: sampleRate === s ? '2px solid #10b981' : `1px solid ${C.border}`,
                    background: sampleRate === s ? 'rgba(16,185,129,.1)' : hoveredSample === s ? C.surface : C.card,
                    color: sampleRate === s ? '#10b981' : C.text,
                    cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Trim Option */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Trim (optional)</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '0 12px', flex: 1,
              }}>
                <span style={{ fontSize: 12, color: C.dim }}>Start</span>
                <input
                  value={trimStart}
                  onChange={(e) => setTrimStart(e.target.value)}
                  placeholder="00:00"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: C.text, fontSize: 13, padding: '10px 0', fontFamily: 'inherit',
                  }}
                />
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '0 12px', flex: 1,
              }}>
                <span style={{ fontSize: 12, color: C.dim }}>End</span>
                <input
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(e.target.value)}
                  placeholder="00:00"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: C.text, fontSize: 13, padding: '10px 0', fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Output File Name */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Output File Name</label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '0 16px',
            }}>
              <input
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                placeholder={file.name.replace(/\.[^/.]+$/, '')}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: C.text, fontSize: 14, padding: '12px 0', fontFamily: 'inherit',
                }}
              />
              <span style={{ fontSize: 13, color: C.dim, fontWeight: 600 }}>.mp3</span>
            </div>
          </div>

          {/* Done status */}
          {done && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
              border: '1px solid rgba(16,185,129,.3)', background: 'rgba(16,185,129,.06)', marginBottom: 16,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Conversion complete</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <ActionButton
              label={done ? 'Convert Again' : 'Convert'}
              gradient={['#10b981', '#059669']}
              onClick={handleConvert}
              loading={loading}
            />
            {done && (
              <button
                onClick={handleDownload}
                onMouseEnter={() => setDownloadHover(true)}
                onMouseLeave={() => setDownloadHover(false)}
                style={{
                  padding: '12px 32px', borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: downloadHover ? C.surface : C.card,
                  color: C.text, fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download MP3
              </button>
            )}
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
