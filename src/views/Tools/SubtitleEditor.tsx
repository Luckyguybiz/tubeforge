'use client';

import { useState, useCallback } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#6366f1', '#8b5cf6'];

const TABS = ['Style Subtitles', 'Edit Subtitles', 'Edit Video', 'Edit Title', 'Edit Watermark'] as const;
type Tab = typeof TABS[number];

const STYLE_PRESETS = [
  { id: 1, name: 'Bold White', preview: 'Bold', textColor: '#fff', bg: 'transparent', fontWeight: 900, fontSize: 18, outline: false },
  { id: 2, name: 'Neon Green', preview: 'NEON', textColor: '#22c55e', bg: 'transparent', fontWeight: 800, fontSize: 18, outline: false },
  { id: 3, name: 'Yellow Highlight', preview: 'Highlight', textColor: '#000', bg: '#facc15', fontWeight: 700, fontSize: 16, outline: false },
  { id: 4, name: 'Red Outlined', preview: 'Outline', textColor: '#ef4444', bg: 'transparent', fontWeight: 800, fontSize: 18, outline: true },
  { id: 5, name: 'Blue Glow', preview: 'Glow', textColor: '#3b82f6', bg: 'transparent', fontWeight: 800, fontSize: 18, outline: false },
  { id: 6, name: 'White Shadow', preview: 'Shadow', textColor: '#fff', bg: 'transparent', fontWeight: 700, fontSize: 17, outline: false },
  { id: 7, name: 'Pink Bold', preview: 'PINK', textColor: '#ec4899', bg: 'transparent', fontWeight: 900, fontSize: 18, outline: false },
  { id: 8, name: 'Orange Pop', preview: 'POP', textColor: '#f97316', bg: 'transparent', fontWeight: 900, fontSize: 19, outline: false },
  { id: 9, name: 'Box White', preview: 'BOX', textColor: '#fff', bg: 'rgba(0,0,0,0.7)', fontWeight: 700, fontSize: 16, outline: false },
  { id: 10, name: 'Gradient Text', preview: 'GRADIENT', textColor: '#a855f7', bg: 'transparent', fontWeight: 800, fontSize: 17, outline: false },
  { id: 11, name: 'Minimal', preview: 'minimal', textColor: '#d1d5db', bg: 'transparent', fontWeight: 500, fontSize: 15, outline: false },
  { id: 12, name: 'Cyan Bright', preview: 'CYAN', textColor: '#06b6d4', bg: 'transparent', fontWeight: 900, fontSize: 18, outline: false },
  { id: 13, name: 'Double Color', preview: 'DOUBLE', textColor: '#fbbf24', bg: 'transparent', fontWeight: 800, fontSize: 17, outline: true },
  { id: 14, name: 'Karaoke', preview: 'Karaoke', textColor: '#fff', bg: '#6366f1', fontWeight: 700, fontSize: 16, outline: false },
];

const SPEED_OPTIONS = ['0.5x', '1x', '1.5x', '2x'] as const;

export function SubtitleEditor() {
  const C = useThemeStore((s) => s.theme);
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Style Subtitles');
  const [selectedStyle, setSelectedStyle] = useState(1);
  const [oneWord, setOneWord] = useState(false);
  const [showLines, setShowLines] = useState(true);
  const [editorMode, setEditorMode] = useState<'simple' | 'advanced'>('simple');
  const [videoTitle, setVideoTitle] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(false);
  const [speed, setSpeed] = useState<typeof SPEED_OPTIONS[number]>('1x');

  const handleExport = useCallback(() => {
    if (loading) return;
    setLoading(true);
    setExported(false);
    setTimeout(() => {
      setLoading(false);
      setExported(true);
    }, 2500);
  }, [loading]);

  const handleSave = useCallback(() => {
    // Simulate save
    setExported(false);
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const idx = SPEED_OPTIONS.indexOf(prev);
      return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    });
  }, []);

  if (!file) {
    return (
      <ToolPageShell
        title="Subtitle Editor"
        subtitle="Add, style, and edit subtitles for your videos"
        gradient={GRADIENT}
        badge="PRO"
        badgeColor="#8b5cf6"
      >
        <UploadArea
          C={C}
          accept="video/*"
          onFile={setFile}
          label="Upload your video to add subtitles"
        />
      </ToolPageShell>
    );
  }

  return (
    <ToolPageShell
      title="Subtitle Editor"
      subtitle="Add, style, and edit subtitles for your videos"
      gradient={GRADIENT}
      badge="PRO"
      badgeColor="#8b5cf6"
    >
      {/* Top bar: editor mode toggle + title + save/export */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 20, flexWrap: 'wrap',
      }}>
        {/* Simple / Advanced toggle */}
        <div style={{
          display: 'flex', borderRadius: 10,
          border: `1px solid ${C.border}`, overflow: 'hidden',
        }}>
          {(['simple', 'advanced'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setEditorMode(mode)}
              style={{
                padding: '8px 16px', border: 'none',
                background: editorMode === mode
                  ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                  : C.card,
                color: editorMode === mode ? '#fff' : C.sub,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                textTransform: 'capitalize', fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { if (editorMode !== mode) e.currentTarget.style.background = C.cardHover; }}
              onMouseLeave={(e) => { if (editorMode !== mode) e.currentTarget.style.background = C.card; }}
            >
              {mode} Editor
            </button>
          ))}
        </div>

        {/* Video title input */}
        <input
          value={videoTitle}
          onChange={(e) => setVideoTitle(e.target.value)}
          placeholder="Video title..."
          style={{
            flex: 1, minWidth: 120, padding: '8px 14px', borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.card,
            color: C.text, fontSize: 13, outline: 'none',
            fontFamily: 'inherit', transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
        />

        {/* Save */}
        <button
          onClick={handleSave}
          style={{
            padding: '8px 20px', borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.card,
            color: C.text, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
        >
          Save
        </button>

        {/* Export */}
        <ActionButton
          label={loading ? 'Exporting...' : 'Export Video'}
          gradient={GRADIENT}
          onClick={handleExport}
          loading={loading}
        />
      </div>

      {/* Export success feedback */}
      {exported && (
        <div style={{
          padding: 14, borderRadius: 10, marginBottom: 16,
          background: '#22c55e12', border: '1px solid #22c55e33',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
            Video exported successfully!
          </span>
        </div>
      )}

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: `1px solid ${C.border}`,
        marginBottom: 20,
        overflowX: 'auto',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 20px', border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${GRADIENT[0]}` : '2px solid transparent',
              background: 'transparent',
              color: activeTab === tab ? GRADIENT[0] : C.sub,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s ease', fontFamily: 'inherit',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab) e.currentTarget.style.color = C.text;
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) e.currentTarget.style.color = C.sub;
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main content: left panel + video preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 420px)', gap: 24 }}>
        {/* Left: tab content */}
        <div>
          {activeTab === 'Style Subtitles' && (
            <div>
              {/* Toggles */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
                {/* One Word toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>One Word</span>
                  <button
                    onClick={() => setOneWord(!oneWord)}
                    style={{
                      width: 40, height: 22, borderRadius: 11, border: 'none',
                      background: oneWord
                        ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                        : C.border,
                      cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: 3, left: oneWord ? 21 : 3,
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#fff', transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>

                {/* Lines toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Lines</span>
                  <button
                    onClick={() => setShowLines(!showLines)}
                    style={{
                      width: 40, height: 22, borderRadius: 11, border: 'none',
                      background: showLines
                        ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                        : C.border,
                      cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: 3, left: showLines ? 21 : 3,
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#fff', transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>

                <div style={{ flex: 1 }} />

                {/* Edit Size & Position */}
                <button
                  style={{
                    padding: '6px 14px', borderRadius: 8,
                    border: `1px solid ${GRADIENT[0]}`,
                    background: `${GRADIENT[0]}12`,
                    color: GRADIENT[0], fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${GRADIENT[0]}22`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `${GRADIENT[0]}12`; }}
                >
                  Edit Size &amp; Position
                </button>
              </div>

              {/* Style presets grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 12,
              }}>
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedStyle(preset.id)}
                    style={{
                      height: 90, borderRadius: 12,
                      border: selectedStyle === preset.id
                        ? `2px solid ${GRADIENT[0]}`
                        : `1px solid ${C.border}`,
                      background: '#1a1a2e',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: 6, transition: 'all 0.2s ease',
                      position: 'relative', overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03)';
                      e.currentTarget.style.boxShadow = `0 4px 12px ${GRADIENT[0]}22`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Selected indicator */}
                    {selectedStyle === preset.id && (
                      <span style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 16, height: 16, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}

                    <span style={{
                      fontSize: preset.fontSize,
                      fontWeight: preset.fontWeight,
                      color: preset.textColor,
                      background: preset.bg,
                      padding: preset.bg !== 'transparent' ? '2px 8px' : 0,
                      borderRadius: 4,
                      textShadow: preset.outline
                        ? `-1px -1px 0 rgba(0,0,0,0.8), 1px -1px 0 rgba(0,0,0,0.8), -1px 1px 0 rgba(0,0,0,0.8), 1px 1px 0 rgba(0,0,0,0.8)`
                        : preset.name === 'White Shadow'
                          ? '2px 2px 4px rgba(0,0,0,0.8)'
                          : preset.name === 'Blue Glow'
                            ? '0 0 8px #3b82f6, 0 0 16px #3b82f6'
                            : 'none',
                    }}>
                      {preset.preview}
                    </span>
                    <span style={{ fontSize: 9, color: '#888', fontWeight: 500 }}>
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Edit Subtitles' && (
            <div style={{
              padding: 20, borderRadius: 12,
              background: C.card, border: `1px solid ${C.border}`,
            }}>
              <p style={{ fontSize: 14, color: C.sub, margin: 0 }}>
                Subtitle timeline editor will appear here. Upload a video to auto-generate subtitles
                using AI speech recognition, then edit timing and text for each line.
              </p>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { time: '00:00:01 - 00:00:04', text: 'Hey everyone, welcome back to the channel!' },
                  { time: '00:00:04 - 00:00:08', text: 'Today we are going to talk about something really exciting.' },
                  { time: '00:00:08 - 00:00:12', text: 'So without further ado, let\'s jump right into it.' },
                ].map((sub, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 12, alignItems: 'center',
                    padding: '10px 14px', borderRadius: 8,
                    background: C.surface, border: `1px solid ${C.border}`,
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ fontSize: 11, color: C.dim, fontFamily: 'monospace', minWidth: 150, flexShrink: 0 }}>
                      {sub.time}
                    </span>
                    <input
                      defaultValue={sub.text}
                      style={{
                        flex: 1, padding: '6px 10px', borderRadius: 6,
                        border: `1px solid ${C.border}`, background: C.card,
                        color: C.text, fontSize: 13, outline: 'none',
                        fontFamily: 'inherit', transition: 'border-color 0.2s ease',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Edit Video' && (
            <div style={{
              padding: 20, borderRadius: 12,
              background: C.card, border: `1px solid ${C.border}`,
            }}>
              <p style={{ fontSize: 14, color: C.sub, margin: 0 }}>
                Video editing controls: trim, split, merge, adjust speed, and add transitions
                between segments.
              </p>
            </div>
          )}

          {activeTab === 'Edit Title' && (
            <div style={{
              padding: 20, borderRadius: 12,
              background: C.card, border: `1px solid ${C.border}`,
            }}>
              <p style={{ fontSize: 14, color: C.sub, margin: '0 0 12px' }}>
                Add a title card to the beginning of your video.
              </p>
              <input
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter video title..."
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.surface,
                  color: C.text, fontSize: 15, fontWeight: 600,
                  boxSizing: 'border-box', outline: 'none',
                  fontFamily: 'inherit', transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              />
            </div>
          )}

          {activeTab === 'Edit Watermark' && (
            <div style={{
              padding: 20, borderRadius: 12,
              background: C.card, border: `1px solid ${C.border}`,
            }}>
              <p style={{ fontSize: 14, color: C.sub, margin: 0 }}>
                Add or remove watermarks from your video. Upload a logo or enter text to
                overlay on your video.
              </p>
            </div>
          )}
        </div>

        {/* Right: video preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Video preview area */}
          <div style={{
            width: '100%', aspectRatio: '9/16', borderRadius: 14,
            background: '#000', position: 'relative', overflow: 'hidden',
            border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            maxHeight: 500,
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" opacity={0.3}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>

            {/* Subtitle preview overlay */}
            <div style={{
              position: 'absolute', bottom: 40, left: '50%',
              transform: 'translateX(-50%)',
              padding: '6px 16px', borderRadius: 6,
              maxWidth: '90%', textAlign: 'center',
            }}>
              {(() => {
                const preset = STYLE_PRESETS.find((p) => p.id === selectedStyle);
                if (!preset) return null;
                return (
                  <span style={{
                    fontSize: preset.fontSize,
                    fontWeight: preset.fontWeight,
                    color: preset.textColor,
                    background: preset.bg,
                    padding: preset.bg !== 'transparent' ? '4px 12px' : 0,
                    borderRadius: 4,
                    textShadow: preset.outline
                      ? `-1px -1px 0 rgba(0,0,0,0.8), 1px -1px 0 rgba(0,0,0,0.8), -1px 1px 0 rgba(0,0,0,0.8), 1px 1px 0 rgba(0,0,0,0.8)`
                      : '2px 2px 4px rgba(0,0,0,0.8)',
                    transition: 'all 0.3s ease',
                  }}>
                    {oneWord ? 'Hello' : 'Hello World'}
                  </span>
                );
              })()}
            </div>

            {/* File indicator */}
            <span style={{
              position: 'absolute', top: 10, left: 10,
              color: '#fff', fontSize: 10, opacity: 0.6,
              background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 6,
              maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {file.name}
            </span>
          </div>

          {/* Playback controls */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', borderRadius: 10,
            background: C.surface, border: `1px solid ${C.border}`,
          }}>
            {/* Rewind */}
            <button
              onClick={() => setIsPlaying(false)}
              style={{
                width: 30, height: 30, borderRadius: 8, border: 'none',
                background: C.card, color: C.text, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 19 2 12 11 5 11 19" /><polygon points="22 19 13 12 22 5 22 19" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                width: 36, height: 36, borderRadius: 10, border: 'none',
                background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            {/* Speed */}
            <button
              onClick={cycleSpeed}
              style={{
                padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`,
                background: C.card, color: C.text, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
            >
              {speed}
            </button>

            {/* Timer */}
            <span style={{ flex: 1, fontSize: 11, color: C.dim, fontFamily: 'monospace', textAlign: 'center' }}>
              00:00:00 / 00:03:24
            </span>

            {/* Volume */}
            <button
              onClick={() => {/* Volume toggle placeholder */}}
              style={{
                width: 30, height: 30, borderRadius: 8, border: 'none',
                background: C.card, color: C.text, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 010 7.07" />
              </svg>
            </button>
          </div>

          {/* Remove video button */}
          <button
            onClick={() => { setFile(null); setExported(false); setIsPlaying(false); }}
            style={{
              padding: '8px 0', borderRadius: 10,
              border: `1px solid ${C.border}`, background: C.card,
              color: C.dim, fontSize: 12, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.color = C.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.dim; }}
          >
            Remove Video
          </button>
        </div>
      </div>
    </ToolPageShell>
  );
}
