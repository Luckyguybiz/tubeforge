'use client';

import { useState, useCallback } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#f97316', '#ef4444'];

const VOICES = [
  { id: 'male-1', label: 'Male — Deep', icon: '1' },
  { id: 'male-2', label: 'Male — Casual', icon: '2' },
  { id: 'female-1', label: 'Female — Clear', icon: '3' },
  { id: 'female-2', label: 'Female — Warm', icon: '4' },
  { id: 'tts-robot', label: 'TTS Robot', icon: '5' },
] as const;

const BACKGROUNDS = [
  { id: 'minecraft', label: 'Minecraft Parkour', color: '#22c55e' },
  { id: 'gta', label: 'GTA Driving', color: '#3b82f6' },
  { id: 'subway', label: 'Subway Surfers', color: '#f59e0b' },
  { id: 'satisfying', label: 'Satisfying Clips', color: '#a855f7' },
] as const;

const MUSIC_GENRES = ['Lo-fi', 'Hip Hop', 'Ambient', 'Cinematic', 'None'] as const;

export function RedditVideoGenerator() {
  const C = useThemeStore((s) => s.theme);
  const [inputMode, setInputMode] = useState<'url' | 'manual'>('url');
  const [redditUrl, setRedditUrl] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualText, setManualText] = useState('');
  const [voice, setVoice] = useState('male-1');
  const [background, setBackground] = useState('minecraft');
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicGenre, setMusicGenre] = useState<typeof MUSIC_GENRES[number]>('Lo-fi');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = useCallback(() => {
    if (loading) return;
    setLoading(true);
    setGenerated(false);
    setTimeout(() => {
      setLoading(false);
      setGenerated(true);
    }, 3000);
  }, [loading]);

  const canGenerate = inputMode === 'url' ? redditUrl.trim().length > 0 : manualText.trim().length > 0;

  return (
    <ToolPageShell
      title="Reddit Video Generator"
      subtitle="Turn Reddit posts into viral short-form videos with AI narration"
      gradient={GRADIENT}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 400px)', gap: 24 }}>
        {/* Left column: controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Input mode toggle */}
          <div style={{
            display: 'flex', borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${C.border}`,
          }}>
            {(['url', 'manual'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                style={{
                  flex: 1, padding: '12px 0', border: 'none',
                  background: inputMode === mode
                    ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                    : C.card,
                  color: inputMode === mode ? '#fff' : C.sub,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { if (inputMode !== mode) e.currentTarget.style.background = C.cardHover; }}
                onMouseLeave={(e) => { if (inputMode !== mode) e.currentTarget.style.background = C.card; }}
              >
                {mode === 'url' ? 'Reddit Post URL' : 'Manual Text Input'}
              </button>
            ))}
          </div>

          {/* URL or Manual input */}
          {inputMode === 'url' ? (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
                Reddit Post URL
              </label>
              <input
                value={redditUrl}
                onChange={(e) => setRedditUrl(e.target.value)}
                placeholder="https://www.reddit.com/r/..."
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.card,
                  color: C.text, fontSize: 14, boxSizing: 'border-box',
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
                  Post Title
                </label>
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Enter a title for the Reddit post..."
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: `1px solid ${C.border}`, background: C.card,
                    color: C.text, fontSize: 14, boxSizing: 'border-box',
                    outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
                  Post Content
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Enter the text content of the Reddit post..."
                  rows={6}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: `1px solid ${C.border}`, background: C.card,
                    color: C.text, fontSize: 14, boxSizing: 'border-box',
                    outline: 'none', fontFamily: 'inherit', resize: 'vertical',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>
            </div>
          )}

          {/* Voice selector */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
              Narration Voice
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
              {VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoice(v.id)}
                  style={{
                    padding: '12px 14px', borderRadius: 10,
                    border: voice === v.id ? `2px solid ${GRADIENT[0]}` : `1px solid ${C.border}`,
                    background: voice === v.id ? `${GRADIENT[0]}12` : C.card,
                    color: voice === v.id ? GRADIENT[0] : C.text,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s ease', fontFamily: 'inherit',
                    textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                  onMouseEnter={(e) => { if (voice !== v.id) e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { if (voice !== v.id) e.currentTarget.style.background = voice === v.id ? `${GRADIENT[0]}12` : C.card; }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: voice === v.id ? `${GRADIENT[0]}22` : C.surface,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    color: voice === v.id ? GRADIENT[0] : C.dim,
                    flexShrink: 0,
                  }}>
                    {v.icon}
                  </span>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background video selector */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
              Background Video
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setBackground(bg.id)}
                  style={{
                    padding: '16px 14px', borderRadius: 12,
                    border: background === bg.id ? `2px solid ${bg.color}` : `1px solid ${C.border}`,
                    background: background === bg.id ? `${bg.color}12` : C.card,
                    color: C.text, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    fontFamily: 'inherit', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                  onMouseEnter={(e) => { if (background !== bg.id) e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { if (background !== bg.id) e.currentTarget.style.background = background === bg.id ? `${bg.color}12` : C.card; }}
                >
                  <span style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${bg.color}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={bg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </span>
                  {bg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Video format badge */}
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: C.surface, border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Video Format</span>
            <span style={{
              padding: '4px 12px', borderRadius: 8,
              background: `${GRADIENT[0]}18`, color: GRADIENT[0],
              fontSize: 12, fontWeight: 700,
            }}>
              Vertical 9:16 (Shorts / TikTok)
            </span>
          </div>

          {/* Music toggle + genre */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 10,
              background: C.card, border: `1px solid ${C.border}`,
              marginBottom: musicEnabled ? 10 : 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Background Music</span>
              <button
                onClick={() => setMusicEnabled(!musicEnabled)}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none',
                  background: musicEnabled
                    ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                    : C.border,
                  cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: 3, left: musicEnabled ? 23 : 3,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff', transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>

            {musicEnabled && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {MUSIC_GENRES.filter((g) => g !== 'None').map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setMusicGenre(genre)}
                    style={{
                      padding: '8px 14px', borderRadius: 8,
                      border: musicGenre === genre ? `2px solid ${GRADIENT[0]}` : `1px solid ${C.border}`,
                      background: musicGenre === genre ? `${GRADIENT[0]}14` : C.card,
                      color: musicGenre === genre ? GRADIENT[0] : C.text,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s ease', fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => { if (musicGenre !== genre) e.currentTarget.style.background = C.cardHover; }}
                    onMouseLeave={(e) => { if (musicGenre !== genre) e.currentTarget.style.background = musicGenre === genre ? `${GRADIENT[0]}14` : C.card; }}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Generate button */}
          <ActionButton
            label={loading ? 'Generating Video...' : 'Generate'}
            gradient={GRADIENT}
            onClick={handleGenerate}
            disabled={!canGenerate}
            loading={loading}
          />
        </div>

        {/* Right column: video preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>
            Video Preview
          </h3>

          {!generated ? (
            <div style={{
              width: '100%', aspectRatio: '9/16', borderRadius: 14,
              border: `1px solid ${C.border}`, background: C.card,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              maxHeight: 580, position: 'relative', overflow: 'hidden',
            }}>
              {/* Loading overlay */}
              {loading && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: C.card,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                  zIndex: 2,
                }}>
                  <svg width="32" height="32" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="8" cy="8" r="6" stroke={C.border} strokeWidth="2" fill="none" />
                    <path d="M8 2a6 6 0 014.47 2" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                  <span style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>Generating video...</span>
                </div>
              )}
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" opacity={0.3}>
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <p style={{ fontSize: 13, color: C.dim, marginTop: 12 }}>
                Generated video will appear here
              </p>
            </div>
          ) : (
            <div style={{
              width: '100%', aspectRatio: '9/16', borderRadius: 14,
              background: '#000', position: 'relative', overflow: 'hidden',
              border: `1px solid ${C.border}`,
              maxHeight: 580,
            }}>
              {/* Simulated Reddit video preview */}
              <div style={{
                position: 'absolute', inset: 0,
                background: (() => {
                  const bg = BACKGROUNDS.find((b) => b.id === background);
                  return `linear-gradient(180deg, ${bg?.color ?? '#333'}22 0%, #111 100%)`;
                })(),
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: 24,
              }}>
                {/* Reddit post card mock */}
                <div style={{
                  width: '85%', padding: 16, borderRadius: 12,
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(8px)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: GRADIENT[0], flexShrink: 0,
                    }} />
                    <span style={{ color: '#ccc', fontSize: 11, fontWeight: 600 }}>r/AskReddit</span>
                  </div>
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.4 }}>
                    {inputMode === 'url'
                      ? 'What is the most mind-blowing fact you know?'
                      : manualTitle || 'Your post title here'}
                  </p>
                  <p style={{ color: '#aaa', fontSize: 12, margin: 0, lineHeight: 1.4 }}>
                    {inputMode === 'url'
                      ? 'I just learned that octopuses have three hearts and blue blood...'
                      : (manualText || 'Your post content here...').slice(0, 100)}
                  </p>
                </div>
              </div>

              {/* Play button overlay */}
              <div style={{
                position: 'absolute', bottom: 20, left: '50%',
                transform: 'translateX(-50%)',
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>
          )}

          {generated && (
            <button
              style={{
                padding: '12px 0', borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: C.card, color: C.text,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Video
            </button>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
