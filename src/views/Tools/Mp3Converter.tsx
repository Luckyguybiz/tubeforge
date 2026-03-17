'use client';

import { useState } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
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

  const handleConvert = () => {
    setLoading(true);
    setDone(false);
    setTimeout(() => { setLoading(false); setDone(true); }, 2500);
  };

  return (
    <ToolPageShell
      title="MP3 Converter"
      subtitle="Convert any audio or video file to MP3 format"
      gradient={['#10b981', '#059669']}
    >
      {!file ? (
        <UploadArea C={C} accept="audio/*,video/*" onFile={setFile} label="Drop audio or video file here or click to upload" />
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
              onClick={() => { setFile(null); setDone(false); }}
              style={{
                padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.surface, color: C.sub, fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit',
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
                    cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
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
                    cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
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

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <ActionButton
              label="Convert"
              gradient={['#10b981', '#059669']}
              onClick={handleConvert}
              loading={loading}
            />
            {done && (
              <button
                onClick={() => {}}
                onMouseEnter={() => setDownloadHover(true)}
                onMouseLeave={() => setDownloadHover(false)}
                style={{
                  padding: '12px 32px', borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: downloadHover ? C.surface : C.card,
                  color: C.text, fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
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
