'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';

/* ═══════════════════════════════════════════════════════════════════════════
   Video Translator — AI-powered video translation with voice cloning
   Backend: /api/tools/video-translate (Whisper + GPT-4o + ElevenLabs)
   ═══════════════════════════════════════════════════════════════════════════ */

const GRADIENT: [string, string] = ['#06b6d4', '#0ea5e9'];

const LANGUAGES: Record<string, string> = {
  en: 'English', ru: 'Russian', es: 'Spanish', fr: 'French',
  de: 'German', it: 'Italian', pt: 'Portuguese', ja: 'Japanese',
  ko: 'Korean', zh: 'Chinese', ar: 'Arabic', hi: 'Hindi',
  tr: 'Turkish', pl: 'Polish', nl: 'Dutch', sv: 'Swedish',
  cs: 'Czech', ro: 'Romanian', el: 'Greek', hu: 'Hungarian',
  uk: 'Ukrainian', id: 'Indonesian', vi: 'Vietnamese',
  th: 'Thai', ms: 'Malay', fil: 'Filipino', da: 'Danish',
  fi: 'Finnish', no: 'Norwegian', bg: 'Bulgarian', hr: 'Croatian',
  sk: 'Slovak', ta: 'Tamil',
};

type JobStatus = 'idle' | 'uploading' | 'extracting' | 'transcribing' | 'translating' | 'cloning' | 'generating_tts' | 'merging' | 'done' | 'error';

const STATUS_LABELS: Record<string, string> = {
  uploading: 'Uploading video...',
  extracting: 'Extracting audio...',
  transcribing: 'Transcribing speech (Whisper)...',
  translating: 'Translating text (GPT-4o)...',
  cloning: 'Cloning voice (ElevenLabs)...',
  generating_tts: 'Generating dubbed audio...',
  merging: 'Merging translated audio with video...',
  done: 'Translation complete!',
  error: 'Translation failed',
};

const STATUS_PROGRESS: Record<string, number> = {
  uploading: 2,
  extracting: 10,
  transcribing: 30,
  translating: 50,
  cloning: 60,
  generating_tts: 75,
  merging: 90,
  done: 100,
};

export function VideoTranslator() {
  const C = useThemeStore((s) => s.theme);

  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('ru');
  const [status, setStatus] = useState<JobStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollStatus = useCallback((id: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/tools/video-translate?job_id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          stopPolling();
          setStatus('error');
          setError('Failed to check job status');
          return;
        }
        const data = await res.json();
        setStatus(data.status);
        setProgress(data.progress ?? STATUS_PROGRESS[data.status] ?? 0);
        if (data.status === 'done') {
          stopPolling();
          setProgress(100);
        } else if (data.status === 'error') {
          stopPolling();
          setError(data.error || 'Translation failed');
        }
      } catch {
        stopPolling();
        setStatus('error');
        setError('Connection lost');
      }
    }, 2000);
  }, [stopPolling]);

  const startTranslation = useCallback(async () => {
    setStatus('uploading');
    setProgress(2);
    setError(null);
    setJobId(null);

    try {
      const formData = new FormData();
      formData.append('source_lang', sourceLang);
      formData.append('target_lang', targetLang);
      if (file) {
        formData.append('file', file);
      } else if (sourceUrl.trim()) {
        formData.append('source_url', sourceUrl.trim());
      } else {
        setStatus('error');
        setError('Please upload a video file or paste a URL');
        return;
      }

      const res = await fetch('/api/tools/video-translate', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setError(data.error || `Server error (${res.status})`);
        return;
      }

      setJobId(data.job_id);
      setStatus(data.status || 'extracting');
      setProgress(STATUS_PROGRESS[data.status] ?? 5);
      pollStatus(data.job_id);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to start translation');
    }
  }, [file, sourceUrl, sourceLang, targetLang, pollStatus]);

  const downloadResult = useCallback(() => {
    if (!jobId) return;
    const a = document.createElement('a');
    a.href = `/api/tools/video-translate?job_id=${encodeURIComponent(jobId)}&download=true`;
    a.download = `translated_${targetLang}.mp4`;
    a.click();
  }, [jobId, targetLang]);

  const reset = useCallback(() => {
    stopPolling();
    setFile(null);
    setSourceUrl('');
    setStatus('idle');
    setProgress(0);
    setError(null);
    setJobId(null);
  }, [stopPolling]);

  const isProcessing = status !== 'idle' && status !== 'done' && status !== 'error';
  const canStart = (!!file || !!sourceUrl.trim()) && !isProcessing && status !== 'done';

  const selectStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    appearance: 'none' as const,
    cursor: 'pointer',
  };

  return (
    <ToolPageShell
      title="Video Translator"
      subtitle="Translate videos to 30+ languages with AI voice cloning"
      badge="PRO"
      gradient={GRADIENT}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left: Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Upload area */}
          {!file ? (
            <UploadArea
              C={C}
              accept="video/*,audio/*"
              onFile={(f) => { setFile(f); setSourceUrl(''); }}
              label="Drop a video or audio file"
            />
          ) : (
            <div style={{
              padding: '16px 18px',
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: C.surface,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round">
                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 12, color: C.sub }}>
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>
              {!isProcessing && (
                <button
                  onClick={() => setFile(null)}
                  style={{ background: 'none', border: 'none', color: C.sub, cursor: 'pointer', padding: 4 }}
                  aria-label="Remove file"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* OR divider + URL input */}
          {!file && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 12, color: C.dim, fontWeight: 500 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>
              <input
                type="url"
                placeholder="Paste video URL (YouTube, TikTok, etc.)"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  color: C.text,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </>
          )}

          {/* Language selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 6, display: 'block' }}>
                Source Language
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                disabled={isProcessing}
                style={selectStyle}
              >
                <option value="auto">Auto-detect</option>
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 6, display: 'block' }}>
                Target Language
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                disabled={isProcessing}
                style={selectStyle}
              >
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action button */}
          <div style={{ display: 'flex', gap: 12 }}>
            <ActionButton
              label={isProcessing ? 'Translating...' : status === 'done' ? 'Translate Another' : 'Start Translation'}
              gradient={GRADIENT}
              onClick={status === 'done' ? reset : startTranslation}
              disabled={status === 'done' ? false : !canStart}
              loading={isProcessing}
            />
          </div>
        </div>

        {/* Right: Progress / Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {status === 'idle' ? (
            /* Info panel */
            <div style={{
              padding: '32px 24px',
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              background: C.surface,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83C\uDF0D'}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
                AI Voice Cloning Translation
              </h3>
              <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, margin: 0 }}>
                Upload a video and we&apos;ll transcribe the speech, translate it, clone the speaker&apos;s voice,
                and generate a dubbed version — all automatically.
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 12,
                marginTop: 20,
              }}>
                {[
                  ['Whisper', 'Speech-to-text'],
                  ['GPT-4o', 'Translation'],
                  ['ElevenLabs', 'Voice cloning'],
                ].map(([title, desc]) => (
                  <div key={title} style={{
                    padding: '12px 8px',
                    borderRadius: 10,
                    background: `${GRADIENT[0]}10`,
                    border: `1px solid ${GRADIENT[0]}20`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: GRADIENT[0] }}>{title}</div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Progress/Result panel */
            <div style={{
              padding: '24px',
              borderRadius: 16,
              border: `1px solid ${status === 'error' ? '#ef444440' : status === 'done' ? '#22c55e40' : C.border}`,
              background: C.surface,
            }}>
              {/* Status header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                {status === 'done' ? (
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#22c55e20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                ) : status === 'error' ? (
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ef444420', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${GRADIENT[0]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="8" cy="8" r="6" stroke={C.dim} strokeWidth="2" fill="none" />
                      <path d="M8 2a6 6 0 014.47 2" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round" fill="none" />
                    </svg>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                    {STATUS_LABELS[status] || status}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub }}>
                    {LANGUAGES[sourceLang] || 'Auto'} &rarr; {LANGUAGES[targetLang]}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{
                width: '100%',
                height: 6,
                borderRadius: 3,
                background: C.border,
                overflow: 'hidden',
                marginBottom: 16,
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: 3,
                  background: status === 'error' ? '#ef4444' : status === 'done' ? '#22c55e' : `linear-gradient(90deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                  transition: 'width 0.5s ease',
                }} />
              </div>

              {/* Pipeline stages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(['extracting', 'transcribing', 'translating', 'cloning', 'generating_tts', 'merging'] as const).map((stage) => {
                  const stageIdx = ['extracting', 'transcribing', 'translating', 'cloning', 'generating_tts', 'merging'].indexOf(stage);
                  const currentIdx = ['extracting', 'transcribing', 'translating', 'cloning', 'generating_tts', 'merging'].indexOf(status);
                  const isDone = status === 'done' || currentIdx > stageIdx;
                  const isCurrent = status === stage;
                  return (
                    <div key={stage} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      opacity: isDone || isCurrent ? 1 : 0.4,
                    }}>
                      {isDone ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : isCurrent ? (
                        <svg width="14" height="14" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
                          <circle cx="8" cy="8" r="6" stroke={C.dim} strokeWidth="2" fill="none" />
                          <path d="M8 2a6 6 0 014.47 2" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round" fill="none" />
                        </svg>
                      ) : (
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${C.border}` }} />
                      )}
                      <span style={{ fontSize: 13, color: isDone ? '#22c55e' : isCurrent ? C.text : C.dim, fontWeight: isCurrent ? 600 : 400 }}>
                        {STATUS_LABELS[stage]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Error message */}
              {status === 'error' && error && (
                <div style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#ef444415',
                  border: '1px solid #ef444430',
                  fontSize: 13,
                  color: '#ef4444',
                  lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              {/* Download button */}
              {status === 'done' && jobId && (
                <button
                  onClick={downloadResult}
                  style={{
                    marginTop: 16,
                    width: '100%',
                    padding: '12px 24px',
                    borderRadius: 12,
                    border: 'none',
                    background: `linear-gradient(135deg, #22c55e, #16a34a)`,
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Translated Video
                </button>
              )}
            </div>
          )}

          {/* Supported languages grid */}
          {status === 'idle' && (
            <div style={{
              padding: '16px',
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: C.surface,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 10 }}>
                {Object.keys(LANGUAGES).length} Supported Languages
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <span key={code} style={{
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    background: targetLang === code ? `${GRADIENT[0]}25` : C.bg,
                    color: targetLang === code ? GRADIENT[0] : C.dim,
                    border: `1px solid ${targetLang === code ? `${GRADIENT[0]}40` : C.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                    onClick={() => setTargetLang(code)}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </ToolPageShell>
  );
}
