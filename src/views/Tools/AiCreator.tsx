'use client';

import { useState, useCallback } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#f59e0b', '#f97316'];

const AVATAR_STYLES = [
  { id: 'professional', name: 'Professional', color: '#3b82f6' },
  { id: 'casual', name: 'Casual', color: '#10b981' },
  { id: 'animated', name: 'Animated', color: '#8b5cf6' },
  { id: 'cartoon', name: 'Cartoon', color: '#ec4899' },
  { id: 'realistic', name: 'Realistic', color: '#f59e0b' },
  { id: '3d', name: '3D Avatar', color: '#06b6d4' },
];

const VOICES = [
  { id: 'dan', name: 'Dan', desc: 'Deep, authoritative', color: '#3b82f6' },
  { id: 'sara', name: 'Sara', desc: 'Warm, friendly', color: '#ec4899' },
  { id: 'mike', name: 'Mike', desc: 'Energetic, youthful', color: '#f59e0b' },
  { id: 'anna', name: 'Anna', desc: 'Calm, professional', color: '#8b5cf6' },
  { id: 'james', name: 'James', desc: 'British narrator', color: '#10b981' },
  { id: 'lisa', name: 'Lisa', desc: 'Soft, soothing', color: '#ef4444' },
  { id: 'alex', name: 'Alex', desc: 'Casual, upbeat', color: '#06b6d4' },
  { id: 'emma', name: 'Emma', desc: 'Clear, articulate', color: '#d946ef' },
];

export function AiCreator() {
  const C = useThemeStore((s) => s.theme);
  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState<File | null>(null);
  const [avatarStyle, setAvatarStyle] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [hoveredAvatar, setHoveredAvatar] = useState<string | null>(null);
  const [hoveredVoice, setHoveredVoice] = useState<string | null>(null);
  const [downloadHover, setDownloadHover] = useState(false);

  const canAdvance = useCallback(() => {
    if (step === 1) return photo !== null || avatarStyle !== null;
    if (step === 2) return !!selectedVoice;
    if (step === 3) return script.trim().length > 0;
    return false;
  }, [step, photo, avatarStyle, selectedVoice, script]);

  const handleCreate = useCallback(() => {
    if (loading) return;
    setCreated(false);
    setIsPlaying(false);
    setLoading(true);
    setTimeout(() => { setLoading(false); setCreated(true); }, 3500);
  }, [loading]);

  const handleAiScript = useCallback(() => {
    setAiGenerating(true);
    setTimeout(() => {
      setScript('Welcome to my channel! Today, I want to share something incredible with you. AI technology has transformed the way we create content, and I am here to show you how you can leverage these tools to grow your audience. Let us dive right in!');
      setAiGenerating(false);
    }, 1500);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleDownload = useCallback(() => {
    /* Simulate download */
  }, []);

  const handleStartOver = useCallback(() => {
    setStep(1);
    setPhoto(null);
    setAvatarStyle(null);
    setSelectedVoice(VOICES[0].id);
    setScript('');
    setCreated(false);
    setIsPlaying(false);
    setLoading(false);
  }, []);

  const stepLabels = ['Upload / Avatar', 'Choose Voice', 'Write Script'];

  return (
    <ToolPageShell
      comingSoon
      title="AI Creator"
      subtitle="Become an AI-powered content creator -- generate videos with your AI avatar"
      gradient={GRADIENT}
    >
      {/* Progress bar */}
      <div style={{
        padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card,
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isComplete = step > stepNum;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: isComplete
                      ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                      : isActive ? `${GRADIENT[0]}22` : C.surface,
                    border: `2px solid ${isComplete || isActive ? GRADIENT[0] : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isComplete ? '#fff' : isActive ? GRADIENT[0] : C.dim,
                    fontSize: 13, fontWeight: 700, transition: 'all 0.3s ease',
                  }}>
                    {isComplete ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : stepNum}
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    color: isActive ? C.text : C.dim,
                  }}>{label}</span>
                </div>
                {i < 2 && (
                  <div style={{
                    flex: 1, height: 2, margin: '0 12px',
                    background: isComplete ? GRADIENT[0] : C.border,
                    borderRadius: 1, transition: 'background 0.3s ease',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        {/* Left: Step content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Step 1: Upload photo or pick avatar */}
          {step === 1 && (
            <>
              <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 14 }}>Upload Your Photo</span>
                {!photo ? (
                  <UploadArea C={C} accept="image/*" onFile={(f) => setPhoto(f)} label="Drop a photo or click to upload" />
                ) : (
                  <div style={{
                    padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: `linear-gradient(135deg, ${GRADIENT[0]}33, ${GRADIENT[1]}33)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GRADIENT[0]} strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.name}</div>
                      <div style={{ fontSize: 11, color: C.dim }}>{(photo.size / 1024).toFixed(0)} KB</div>
                    </div>
                    <button
                      onClick={() => setPhoto(null)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = C.card; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = C.surface; }}
                      style={{
                        padding: '5px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                        background: C.surface, color: C.sub, fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
                        outline: 'none', flexShrink: 0,
                      }}
                    >Remove</button>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', color: C.dim, fontSize: 13, fontWeight: 600 }}>--- OR ---</div>

              <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 14 }}>Select Avatar Style</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {AVATAR_STYLES.map((av) => {
                    const isSelected = avatarStyle === av.id;
                    const isHovered = hoveredAvatar === av.id;
                    return (
                      <button
                        key={av.id}
                        onClick={() => { setAvatarStyle(av.id); setPhoto(null); }}
                        onMouseEnter={() => setHoveredAvatar(av.id)}
                        onMouseLeave={() => setHoveredAvatar(null)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                          padding: '16px 12px', borderRadius: 12,
                          border: `1px solid ${isSelected ? av.color : isHovered ? `${av.color}88` : C.border}`,
                          background: isSelected ? `${av.color}11` : isHovered ? `${av.color}08` : C.surface,
                          cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                          outline: 'none',
                        }}
                        onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${av.color}44`; }}
                        onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{
                          width: 48, height: 48, borderRadius: '50%',
                          background: `linear-gradient(135deg, ${av.color}, ${av.color}88)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: isSelected ? av.color : C.sub,
                        }}>{av.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Choose voice */}
          {step === 2 && (
            <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 16 }}>Choose a Voice</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {VOICES.map((v) => {
                  const isSelected = selectedVoice === v.id;
                  const isHovered = hoveredVoice === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVoice(v.id)}
                      onMouseEnter={() => setHoveredVoice(v.id)}
                      onMouseLeave={() => setHoveredVoice(null)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                        borderRadius: 12,
                        border: `1px solid ${isSelected ? v.color : isHovered ? `${v.color}88` : C.border}`,
                        background: isSelected ? `${v.color}11` : isHovered ? `${v.color}08` : C.surface,
                        cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit', textAlign: 'left',
                        outline: 'none',
                      }}
                      onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${v.color}44`; }}
                      onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${v.color}, ${v.color}aa)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0,
                      }}>
                        {v.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v.name}</div>
                        <div style={{ fontSize: 11, color: C.dim }}>{v.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Script */}
          {step === 3 && (
            <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Script</span>
                <button
                  onClick={handleAiScript}
                  disabled={aiGenerating}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${GRADIENT[0]}55`,
                    background: hoveredBtn === 'ai' ? `${GRADIENT[0]}22` : `${GRADIENT[0]}11`,
                    color: GRADIENT[0], cursor: aiGenerating ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease', fontFamily: 'inherit',
                    opacity: aiGenerating ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: 6,
                    outline: 'none',
                  }}
                  onMouseEnter={() => setHoveredBtn('ai')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${GRADIENT[0]}44`; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {aiGenerating && (
                    <svg width="12" height="12" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="8" cy="8" r="6" stroke="rgba(245,158,11,.3)" strokeWidth="2" fill="none" />
                      <path d="M8 2a6 6 0 014.47 2" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round" fill="none" />
                    </svg>
                  )}
                  AI Generate Script
                </button>
              </div>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Write your script here or use AI to generate one..."
                style={{
                  width: '100%', minHeight: 200, padding: 14, borderRadius: 12,
                  border: `1px solid ${C.border}`, background: C.surface,
                  color: C.text, fontSize: 14, fontFamily: 'inherit',
                  resize: 'vertical', outline: 'none', lineHeight: 1.6,
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <span style={{ fontSize: 12, color: C.dim }}>{script.length} characters</span>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                onMouseEnter={() => setHoveredBtn('back')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  padding: '12px 24px', borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: hoveredBtn === 'back' ? C.surface : C.card,
                  color: C.text, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${GRADIENT[0]}44`; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 3 ? (
              <button
                onClick={() => { if (canAdvance()) setStep(step + 1); }}
                disabled={!canAdvance()}
                onMouseEnter={() => setHoveredBtn('next')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  padding: '12px 24px', borderRadius: 12, border: 'none',
                  background: canAdvance()
                    ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                    : '#555',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: canAdvance() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease', fontFamily: 'inherit',
                  boxShadow: canAdvance() ? `0 4px 16px ${GRADIENT[0]}33` : 'none',
                  transform: canAdvance() && hoveredBtn === 'next' ? 'translateY(-1px)' : 'none',
                  outline: 'none',
                }}
                onFocus={(e) => { if (canAdvance()) e.currentTarget.style.boxShadow = `0 4px 16px ${GRADIENT[0]}33, 0 0 0 2px ${GRADIENT[0]}44`; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = canAdvance() ? `0 4px 16px ${GRADIENT[0]}33` : 'none'; }}
              >
                Next Step
              </button>
            ) : (
              <ActionButton
                label="Create AI Video"
                gradient={GRADIENT}
                onClick={handleCreate}
                loading={loading}
                disabled={!script.trim()}
              />
            )}
          </div>
        </div>

        {/* Right: Preview area */}
        <div style={{
          padding: 24, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card,
          display: 'flex', flexDirection: 'column',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 16 }}>Preview</span>
          <div style={{
            flex: 1, minHeight: 400, borderRadius: 14,
            border: `1px solid ${C.border}`, background: C.surface,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <svg width="48" height="48" viewBox="0 0 48 48" style={{ animation: 'spin 1.5s linear infinite' }}>
                  <circle cx="24" cy="24" r="20" stroke={`${GRADIENT[0]}33`} strokeWidth="3" fill="none" />
                  <path d="M24 4a20 20 0 0114.14 5.86" stroke={GRADIENT[0]} strokeWidth="3" strokeLinecap="round" fill="none" />
                </svg>
                <span style={{ fontSize: 14, color: C.sub, fontWeight: 600 }}>Creating your AI video...</span>
                <span style={{ fontSize: 12, color: C.dim }}>Rendering avatar, syncing voice</span>
              </div>
            ) : created ? (
              <>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(135deg, ${GRADIENT[0]}11, ${GRADIENT[1]}11)`,
                }} />
                {/* Avatar placeholder */}
                <div style={{
                  width: 100, height: 100, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 8px 32px ${GRADIENT[0]}44`,
                  marginBottom: 16,
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span style={{ fontSize: 15, color: C.text, fontWeight: 700 }}>AI Avatar Ready</span>
                <span style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>Voice: {VOICES.find((v) => v.id === selectedVoice)?.name}</span>
                {/* Play button */}
                <button
                  onClick={handlePlay}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  style={{
                    width: 48, height: 48, borderRadius: '50%', marginTop: 20,
                    background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 16px ${GRADIENT[0]}44`,
                    transition: 'transform 0.2s ease', outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = `0 4px 16px ${GRADIENT[0]}44, 0 0 0 3px ${GRADIENT[0]}44`; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = `0 4px 16px ${GRADIENT[0]}44`; }}
                >
                  {isPlaying ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21" /></svg>
                  )}
                </button>
                <span style={{ fontSize: 12, color: C.dim, marginTop: 8 }}>
                  {isPlaying ? 'Playing...' : 'Click to preview'}
                </span>
              </>
            ) : (
              <>
                {/* Placeholder avatar */}
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: C.bg, border: `2px dashed ${C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" opacity={0.4}>
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span style={{ fontSize: 14, color: C.dim }}>AI avatar preview will appear here</span>
                <span style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>Complete all 3 steps to create</span>
              </>
            )}
          </div>

          {/* Download + Start Over buttons */}
          {created && (
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                onClick={handleDownload}
                onMouseEnter={() => setDownloadHover(true)}
                onMouseLeave={() => setDownloadHover(false)}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 12,
                  border: `1px solid ${C.border}`, background: downloadHover ? C.surface : C.card,
                  color: C.text, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s ease', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${GRADIENT[0]}44`; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Video
              </button>
              <button
                onClick={handleStartOver}
                onMouseEnter={() => setHoveredBtn('startover')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  padding: '12px 20px', borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: hoveredBtn === 'startover' ? C.surface : C.card,
                  color: C.sub, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s ease', fontFamily: 'inherit',
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${GRADIENT[0]}44`; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
