'use client';

import { useState } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

export function FaceSwap() {
  const C = useThemeStore((s) => s.theme);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [enhance, setEnhance] = useState(true);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [downloadHover, setDownloadHover] = useState(false);

  const handleSwap = () => {
    setLoading(true);
    setDone(false);
    setTimeout(() => { setLoading(false); setDone(true); }, 3000);
  };

  const UploadCard = ({ label, sublabel, file, onFile, onRemove }: {
    label: string; sublabel: string; file: File | null;
    onFile: (f: File) => void; onRemove: () => void;
  }) => (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>{label}</label>
      {!file ? (
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '40px 16px', borderRadius: 14,
          border: `2px dashed ${C.border}`, background: C.surface,
          cursor: 'pointer', transition: 'all .2s', textAlign: 'center',
          minHeight: 200,
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text, marginTop: 12 }}>{sublabel}</span>
          <span style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>JPG, PNG, WebP</span>
          <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }} />
        </label>
      ) : (
        <div style={{
          padding: 16, borderRadius: 14, border: `1px solid ${C.border}`,
          background: C.card, minHeight: 200, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', position: 'relative',
        }}>
          {/* Placeholder face detection preview */}
          <div style={{
            width: 100, height: 100, borderRadius: 50,
            border: `3px dashed #f97316`, background: C.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12, position: 'relative',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5">
              <circle cx="12" cy="7" r="4" /><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            </svg>
            {/* Bounding box corners */}
            <div style={{ position: 'absolute', top: -4, left: -4, width: 12, height: 12, borderTop: '3px solid #f97316', borderLeft: '3px solid #f97316' }} />
            <div style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderTop: '3px solid #f97316', borderRight: '3px solid #f97316' }} />
            <div style={{ position: 'absolute', bottom: -4, left: -4, width: 12, height: 12, borderBottom: '3px solid #f97316', borderLeft: '3px solid #f97316' }} />
            <div style={{ position: 'absolute', bottom: -4, right: -4, width: 12, height: 12, borderBottom: '3px solid #f97316', borderRight: '3px solid #f97316' }} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{file.name}</div>
          <div style={{ fontSize: 11, color: '#f97316', marginTop: 4 }}>Face detected</div>
          <button
            onClick={onRemove}
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 24, height: 24, borderRadius: 12,
              border: `1px solid ${C.border}`, background: C.surface,
              color: C.dim, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}
          >
            x
          </button>
        </div>
      )}
    </div>
  );

  return (
    <ToolPageShell
      title="AI Face Swap"
      subtitle="Swap faces between images and videos with AI technology"
      gradient={['#f97316', '#ef4444']}
    >
      {/* Two Upload Areas Side by Side */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
        <UploadCard
          label="Source Face"
          sublabel="Upload source face"
          file={sourceFile}
          onFile={setSourceFile}
          onRemove={() => { setSourceFile(null); setDone(false); }}
        />
        {/* Arrow */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          paddingTop: 28,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
        <UploadCard
          label="Target Image / Video"
          sublabel="Upload target image or video"
          file={targetFile}
          onFile={setTargetFile}
          onRemove={() => { setTargetFile(null); setDone(false); }}
        />
      </div>

      {/* Enhancement Toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, borderRadius: 12, border: `1px solid ${C.border}`,
        background: C.card, marginBottom: 24,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Enhance Result Quality</div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Apply AI enhancement for smoother, higher quality output</div>
        </div>
        <button
          onClick={() => setEnhance(!enhance)}
          style={{
            width: 44, height: 24, borderRadius: 12, border: 'none',
            background: enhance ? '#f97316' : C.surface,
            cursor: 'pointer', position: 'relative', transition: 'all .2s',
            boxShadow: enhance ? '0 0 8px rgba(249,115,22,.3)' : 'none',
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: 9, background: '#fff',
            position: 'absolute', top: 3,
            left: enhance ? 23 : 3,
            transition: 'left .2s',
            boxShadow: '0 1px 3px rgba(0,0,0,.2)',
          }} />
        </button>
      </div>

      {/* Result Preview */}
      {done && (
        <div style={{
          padding: 32, borderRadius: 14, border: `1px solid ${C.border}`,
          background: C.card, textAlign: 'center', marginBottom: 24,
        }}>
          <div style={{
            width: 200, height: 200, borderRadius: 16, margin: '0 auto 16px',
            background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ textAlign: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" opacity={0.7}>
                <circle cx="12" cy="7" r="4" /><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              </svg>
              <div style={{ fontSize: 12, color: '#f97316', marginTop: 8, fontWeight: 600 }}>Face Swapped</div>
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Result Ready</div>
          <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>Face swap completed successfully</div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <ActionButton
          label="Swap Faces"
          gradient={['#f97316', '#ef4444']}
          onClick={handleSwap}
          disabled={!sourceFile || !targetFile}
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
            Download Result
          </button>
        )}
      </div>

      {/* Ethical Disclaimer */}
      <div style={{
        padding: 14, borderRadius: 10,
        background: 'rgba(249,115,22,.06)',
        border: '1px solid rgba(249,115,22,.2)',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f97316' }}>Ethical Usage Disclaimer</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.5 }}>
            This tool is intended for entertainment and creative purposes only. Do not use face swap
            technology to create misleading, harmful, or non-consensual content. Misuse may violate
            laws and regulations. Always obtain consent before using someone&apos;s likeness.
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}
