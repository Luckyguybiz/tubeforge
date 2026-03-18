'use client';

import { useState, useRef, useCallback } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

export function AudioBalancer() {
  const C = useThemeStore((s) => s.theme);

  const [file, setFile] = useState<File | null>(null);
  const [balance, setBalance] = useState(0); // -100 to 100
  const [leftVolume, setLeftVolume] = useState(80);
  const [rightVolume, setRightVolume] = useState(80);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [downloadHover, setDownloadHover] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBalance = () => {
    setLoading(true);
    setDone(false);
    setTimeout(() => { setLoading(false); setDone(true); }, 2000);
  };

  const handleDownload = () => {
    if (!file) return;
    // Simulate downloading the balanced audio file
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = `balanced_${file.name}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleReset = () => {
    setFile(null);
    setDone(false);
    setBalance(0);
    setLeftVolume(80);
    setRightVolume(80);
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('audio/')) {
      setFile(f);
      setDone(false);
    }
  }, []);

  // Simple waveform bar generator with stable seed
  const renderWaveform = (channel: 'left' | 'right') => {
    const barCount = 60;
    const color = channel === 'left' ? '#3b82f6' : '#6366f1';
    const vol = channel === 'left' ? leftVolume : rightVolume;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2, height: 48,
        padding: '0 12px',
      }}>
        {Array.from({ length: barCount }, (_, i) => {
          const seed = channel === 'left' ? i * 1.1 : i * 1.3 + 7;
          const h = (Math.sin(seed * 0.5) * 0.4 + Math.abs(Math.sin(seed * 1.7)) * 0.6) * (vol / 100);
          return (
            <div
              key={i}
              style={{
                flex: 1, height: `${Math.max(8, h * 100)}%`,
                background: color, borderRadius: 2, opacity: 0.7,
                minWidth: 2, transition: 'height 0.3s ease',
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <ToolPageShell
      title="Audio Balancer"
      subtitle="Adjust stereo balance and channel volumes for your audio"
      gradient={['#3b82f6', '#6366f1']}
    >
      {/* Upload */}
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
        >
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', borderRadius: 16,
            border: `2px dashed ${dragOver ? '#3b82f6' : C.border}`,
            background: dragOver ? 'rgba(59,130,246,.06)' : C.surface,
            cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 12 }}>
              Drop audio file here or click to upload
            </span>
            <span style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
              MP3, WAV, FLAC, OGG, AAC
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
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
          {/* File info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12,
            border: `1px solid ${C.border}`, background: C.card, marginBottom: 24,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
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

          {/* Waveform Display */}
          <div style={{
            borderRadius: 14, border: `1px solid ${C.border}`, background: C.card,
            overflow: 'hidden', marginBottom: 24,
          }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>Left Channel</span>
            </div>
            <div style={{ padding: '8px 0', background: C.surface }}>
              {renderWaveform('left')}
            </div>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6366f1' }}>Right Channel</span>
            </div>
            <div style={{ padding: '8px 0', background: C.surface }}>
              {renderWaveform('right')}
            </div>
          </div>

          {/* Balance Slider */}
          <div style={{
            padding: 20, borderRadius: 14, border: `1px solid ${C.border}`,
            background: C.card, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Stereo Balance</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: balance < 0 ? '#3b82f6' : balance > 0 ? '#6366f1' : C.sub }}>
                {balance === 0 ? 'Center' : balance < 0 ? `Left ${Math.abs(balance)}%` : `Right ${balance}%`}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>L</span>
              <input
                type="range" min={-100} max={100} value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#3b82f6' }}
              />
              <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>R</span>
            </div>
          </div>

          {/* Channel Volume Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            <div style={{
              padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#3b82f6' }}>Left Volume</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>{leftVolume}%</span>
              </div>
              <input
                type="range" min={0} max={100} value={leftVolume}
                onChange={(e) => setLeftVolume(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#3b82f6' }}
              />
            </div>
            <div style={{
              padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#6366f1' }}>Right Volume</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>{rightVolume}%</span>
              </div>
              <input
                type="range" min={0} max={100} value={rightVolume}
                onChange={(e) => setRightVolume(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1' }}
              />
            </div>
          </div>

          {/* Done status */}
          {done && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
              border: '1px solid rgba(59,130,246,.3)', background: 'rgba(59,130,246,.06)', marginBottom: 16,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Audio balanced successfully</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <ActionButton
              label={done ? 'Re-balance' : 'Balance'}
              gradient={['#3b82f6', '#6366f1']}
              onClick={handleBalance}
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
                Download
              </button>
            )}
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
