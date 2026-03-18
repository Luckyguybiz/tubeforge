'use client';

import { useState, useCallback, useRef } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#d946ef', '#c026d3'];
const QUALITIES = ['Fast', 'Balanced', 'High Quality'];
const FORMATS = ['MP3', 'WAV', 'FLAC'];

export function VocalRemover() {
  const C = useThemeStore((s) => s.theme);
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState('Balanced');
  const [format, setFormat] = useState('MP3');
  const [loading, setLoading] = useState(false);
  const [separated, setSeparated] = useState(false);
  const [hoveredDl, setHoveredDl] = useState<string | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [removeHover, setRemoveHover] = useState(false);
  const dragCounter = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSeparate = useCallback(() => {
    if (!file || loading) return;
    setSeparated(false);
    setPlayingTrack(null);
    setLoading(true);
    setTimeout(() => { setLoading(false); setSeparated(true); }, 3000);
  }, [file, loading]);

  const handleFileSet = useCallback((f: File) => {
    setFile(f);
    setSeparated(false);
    setPlayingTrack(null);
  }, []);

  const handleRemove = useCallback(() => {
    setFile(null);
    setSeparated(false);
    setPlayingTrack(null);
  }, []);

  const handleDownload = useCallback((_label: string) => {
    /* Simulate download */
  }, []);

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px', borderRadius: 10,
    border: `1px solid ${active ? GRADIENT[0] : C.border}`,
    background: active ? `${GRADIENT[0]}22` : C.card,
    color: active ? GRADIENT[0] : C.sub,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s ease', fontFamily: 'inherit',
    outline: 'none',
  });

  // Deterministic waveform bars to avoid hydration mismatch
  const vocalBars = Array.from({ length: 60 }, (_, i) => 12 + Math.sin(i * 0.3) * 22 + ((i * 13 + 7) % 18));
  const instrumentalBars = Array.from({ length: 60 }, (_, i) => 12 + Math.sin(i * 0.3) * 22 + ((i * 11 + 3) % 18));

  const TrackCard = ({ label, color, icon, bars }: { label: string; color: string; icon: React.ReactNode; bars: number[] }) => {
    const isPlaying = playingTrack === label;
    return (
      <div style={{
        flex: 1, minWidth: 0, padding: 20, borderRadius: 16,
        border: `1px solid ${C.border}`, background: C.card,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${color}22`, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {icon}
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{label}</span>
          </div>
          <button
            onClick={() => handleDownload(label)}
            onMouseEnter={() => setHoveredDl(label)}
            onMouseLeave={() => setHoveredDl(null)}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: `1px solid ${hoveredDl === label ? color : C.border}`,
              background: hoveredDl === label ? `${color}11` : C.surface,
              color: hoveredDl === label ? color : C.sub,
              cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
              outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${color}44`; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download {format}
          </button>
        </div>

        {/* Waveform */}
        <div style={{
          height: 80, borderRadius: 12, background: C.surface,
          border: `1px solid ${C.border}`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 2, padding: '0 16px',
        }}>
          {separated ? (
            bars.map((h, i) => (
              <div key={i} style={{
                width: 2, borderRadius: 2,
                height: `${h}%`,
                background: color,
                opacity: 0.6,
                transition: 'height 0.3s ease',
              }} />
            ))
          ) : (
            <span style={{ fontSize: 12, color: C.dim }}>Waveform will appear after processing</span>
          )}
        </div>

        {/* Play controls */}
        {separated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <button
              onClick={() => setPlayingTrack(isPlaying ? null : label)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: color, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.2s ease', outline: 'none',
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${color}44`; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              {isPlaying ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                  <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21" /></svg>
              )}
            </button>
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: C.border }}>
              <div style={{ width: isPlaying ? '35%' : '0%', height: '100%', borderRadius: 2, background: color, transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ fontSize: 11, color: C.dim }}>0:00 / 3:42</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <ToolPageShell
      comingSoon
      title="AI Vocal Remover"
      subtitle="Separate vocals and instrumentals from any audio track using AI"
      gradient={GRADIENT}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Upload area */}
        {!file ? (
          <div
            onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragOver(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              dragCounter.current = 0;
              setIsDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f && f.type.startsWith('audio/')) handleFileSet(f);
            }}
            style={{
              borderRadius: 16,
              border: isDragOver ? `2px solid ${GRADIENT[0]}` : undefined,
              background: isDragOver ? `${GRADIENT[0]}08` : undefined,
              transition: 'all 0.2s ease',
            }}
          >
            <UploadArea
              C={C}
              accept=".mp3,.wav,.flac,audio/*"
              onFile={handleFileSet}
              label="Drop your audio file here or click to upload"
            />
          </div>
        ) : (
          <div style={{
            padding: 16, borderRadius: 14, border: `1px solid ${C.border}`, background: C.card,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `linear-gradient(135deg, ${GRADIENT[0]}22, ${GRADIENT[1]}22)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: 12, color: C.dim }}>{(file.size / 1024 / 1024).toFixed(2)} MB &middot; Supported formats: MP3, WAV, FLAC</div>
            </div>
            <button
              onClick={handleRemove}
              onMouseEnter={() => setRemoveHover(true)}
              onMouseLeave={() => setRemoveHover(false)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: removeHover ? C.surface : C.card, color: C.sub, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
                outline: 'none', flexShrink: 0,
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${GRADIENT[0]}44`; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              Remove
            </button>
          </div>
        )}

        {/* Processing Options */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16,
        }}>
          {/* Separation quality */}
          <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>Separation Quality</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {QUALITIES.map((q) => (
                <button key={q} onClick={() => setQuality(q)} style={pillStyle(quality === q)}>{q}</button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>
              {quality === 'Fast' ? 'Quick processing, good quality' : quality === 'Balanced' ? 'Balanced speed and quality' : 'Best quality, slower processing'}
            </p>
          </div>

          {/* Output format */}
          <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>Output Format</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FORMATS.map((f) => (
                <button key={f} onClick={() => setFormat(f)} style={pillStyle(format === f)}>{f}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Separate button */}
        <ActionButton label="Separate" gradient={GRADIENT} onClick={handleSeparate} loading={loading} disabled={!file} />

        {/* Loading indicator */}
        {loading && (
          <div style={{
            padding: 40, textAlign: 'center', borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.card,
          }}>
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation: 'spin 1.2s linear infinite' }}>
              <circle cx="20" cy="20" r="16" stroke={`${GRADIENT[0]}33`} strokeWidth="3" fill="none" />
              <path d="M20 4a16 16 0 0111.31 4.69" stroke={GRADIENT[0]} strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
            <p style={{ fontSize: 14, color: C.sub, marginTop: 16, fontWeight: 600 }}>Separating vocals and instrumentals...</p>
            <p style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>Processing with {quality.toLowerCase()} quality</p>
          </div>
        )}

        {/* Output Tracks */}
        {separated && !loading && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <TrackCard
              label="Vocals"
              color="#ec4899"
              bars={vocalBars}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              }
            />
            <TrackCard
              label="Instrumental"
              color={GRADIENT[0]}
              bars={instrumentalBars}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                </svg>
              }
            />
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
