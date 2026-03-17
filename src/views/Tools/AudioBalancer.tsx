'use client';

import { useState } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
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

  const handleBalance = () => {
    setLoading(true);
    setDone(false);
    setTimeout(() => { setLoading(false); setDone(true); }, 2000);
  };

  // Simple waveform bar generator
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
          const h = (Math.sin(i * 0.5) * 0.4 + Math.random() * 0.6) * (vol / 100);
          return (
            <div
              key={i}
              style={{
                flex: 1, height: `${Math.max(8, h * 100)}%`,
                background: color, borderRadius: 2, opacity: 0.7,
                minWidth: 2,
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
        <UploadArea C={C} accept="audio/*" onFile={setFile} label="Drop audio file here or click to upload" />
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

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <ActionButton
              label="Balance"
              gradient={['#3b82f6', '#6366f1']}
              onClick={handleBalance}
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
                Download
              </button>
            )}
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
