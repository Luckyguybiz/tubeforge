'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { toast } from '@/stores/useNotificationStore';

/* ═══════════════════════════════════════════════════════════════════════════
   Video Translator — AI-powered video translation pipeline
   Whisper (transcribe) → GPT-4o (translate) → ElevenLabs (TTS) → FFmpeg (merge)
   ═══════════════════════════════════════════════════════════════════════════ */

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Russian' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'tr', label: 'Turkish' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'pl', label: 'Polish' },
  { code: 'nl', label: 'Dutch' },
] as const;

const PIPELINE_STEPS = [
  { key: 'extracting_audio', labelKey: 'tools.translator.stepExtract' },
  { key: 'transcribing', labelKey: 'tools.translator.stepTranscribe' },
  { key: 'translating', labelKey: 'tools.translator.stepTranslate' },
  { key: 'generating_speech', labelKey: 'tools.translator.stepSpeech' },
  { key: 'merging', labelKey: 'tools.translator.stepMerge' },
] as const;

type PipelineStatus = typeof PIPELINE_STEPS[number]['key'];
type Status = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];
const ACCEPTED_EXTENSIONS = '.mp4,.mov,.webm,.mkv';

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function VideoTranslator() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  /* ── State ── */
  const [file, setFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<PipelineStatus | ''>('');
  const [resultUrl, setResultUrl] = useState('');
  const [jobId, setJobId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  /* ── Refs ── */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  /* ── Hover states ── */
  const [dragOver, setDragOver] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  /* ── File handling ── */
  const handleFile = useCallback((f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(mp4|mov|webm|mkv)$/i)) {
      toast.error(t('tools.translator.invalidFormat'));
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error(t('tools.translator.fileTooLarge'));
      return;
    }
    setFile(f);
    setStatus('idle');
    setProgress(0);
    setStage('');
    setResultUrl('');
    setJobId('');
    setErrorMsg('');
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  /* ── Poll job status ── */
  const pollStatus = useCallback((id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/tools/video-translate?job_id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Network error' })) as { error?: string };
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json() as {
          status: PipelineStatus | 'done' | 'error';
          progress: number;
          error?: string;
        };

        setStage(data.status === 'done' || data.status === 'error' ? '' : data.status as PipelineStatus);
        setProgress(data.progress);

        if (data.status === 'done') {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setStatus('done');
          setResultUrl(`/api/tools/video-translate?job_id=${encodeURIComponent(id)}&download=true`);
          toast.success(t('tools.translator.translationDone'));
        }
        if (data.status === 'error') {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setStatus('error');
          setErrorMsg(data.error ?? t('tools.translator.pipelineError'));
        }
      } catch (err) {
        // Don't stop polling on transient errors
        console.error('Poll error:', err);
      }
    }, 2000);
  }, [t]);

  /* ── Start translation ── */
  const handleTranslate = useCallback(async () => {
    if (!file) return;

    setStatus('uploading');
    setProgress(0);
    setStage('');
    setResultUrl('');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sourceLang', sourceLang);
      formData.append('targetLang', targetLang);

      const res = await fetch('/api/tools/video-translate', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json() as { jobId?: string; error?: string; status?: string; progress?: number };

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error ?? t('tools.translator.uploadError'));
        return;
      }

      if (data.jobId) {
        setJobId(data.jobId);
        setStatus('processing');
        setStage((data.status as PipelineStatus) ?? 'extracting_audio');
        setProgress(data.progress ?? 5);
        pollStatus(data.jobId);
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : t('tools.translator.networkError'));
    }
  }, [file, sourceLang, targetLang, pollStatus, t]);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setStage('');
    setResultUrl('');
    setJobId('');
    setErrorMsg('');
  }, []);

  /* ── Get current pipeline step index ── */
  const currentStepIdx = PIPELINE_STEPS.findIndex((s) => s.key === stage);

  /* ── Determine stage description ── */
  const stageDescriptions: Record<string, string> = {
    extracting_audio: t('tools.translator.stageExtractDesc'),
    transcribing: t('tools.translator.stageTranscribeDesc'),
    translating: t('tools.translator.stageTranslateDesc'),
    generating_speech: t('tools.translator.stageSpeechDesc'),
    merging: t('tools.translator.stageMergeDesc'),
  };

  const isProcessing = status === 'uploading' || status === 'processing';

  return (
    <ToolPageShell
      title={t('tools.translator.title')}
      subtitle={t('tools.translator.subtitle')}
      badge="PRO"
      gradient={['#06b6d4', '#0ea5e9']}
    >
      {/* ── Upload Area ── */}
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '56px 24px',
            borderRadius: 16,
            border: `2px dashed ${dragOver ? '#06b6d4' : C.border}`,
            background: dragOver ? '#06b6d408' : C.surface,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'center',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={dragOver ? '#06b6d4' : C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 12 }}>
            {t('tools.translator.dropLabel')}
          </span>
          <span style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
            MP4, MOV, WebM, MKV &bull; {t('tools.translator.maxSize')}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
        </div>
      ) : (
        /* ── File Info ── */
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 12,
          background: C.surface,
          border: `1px solid ${C.border}`,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 600, color: C.text,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {file.name}
            </div>
            <div style={{ fontSize: 12, color: C.sub }}>{formatFileSize(file.size)}</div>
          </div>
          {!isProcessing && status !== 'done' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleReset(); }}
              onMouseEnter={() => setRemoveHover(true)}
              onMouseLeave={() => setRemoveHover(false)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: 'none', cursor: 'pointer',
                background: removeHover ? '#ef444420' : 'transparent',
                color: removeHover ? '#ef4444' : C.sub,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* ── Language selectors ── */}
      {file && (
        <div style={{
          display: 'flex',
          gap: 16,
          marginTop: 20,
          flexWrap: 'wrap',
        }}>
          {/* Source language */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
              {t('tools.translator.sourceLabel')}
            </label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              disabled={isProcessing || status === 'done'}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.text,
                fontSize: 14,
                fontFamily: 'inherit',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1,
                outline: 'none',
                appearance: 'auto',
              }}
            >
              <option value="auto">{t('tools.translator.autoDetect')}</option>
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10, flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </div>

          {/* Target language */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
              {t('tools.translator.targetLabel')}
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              disabled={isProcessing || status === 'done'}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.text,
                fontSize: 14,
                fontFamily: 'inherit',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1,
                outline: 'none',
                appearance: 'auto',
              }}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── Pipeline progress ── */}
      {file && (isProcessing || status === 'done' || status === 'error') && (
        <div style={{
          marginTop: 24,
          padding: '20px',
          borderRadius: 14,
          background: C.surface,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>
            {t('tools.translator.pipeline')}
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PIPELINE_STEPS.map((step, idx) => {
              let stepStatus: 'done' | 'active' | 'pending' | 'error' = 'pending';
              if (status === 'done') {
                stepStatus = 'done';
              } else if (status === 'error') {
                if (idx < currentStepIdx) stepStatus = 'done';
                else if (idx === currentStepIdx) stepStatus = 'error';
                else stepStatus = 'pending';
              } else if (currentStepIdx >= 0) {
                if (idx < currentStepIdx) stepStatus = 'done';
                else if (idx === currentStepIdx) stepStatus = 'active';
                else stepStatus = 'pending';
              }

              return (
                <div key={step.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  {/* Status icon */}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    background: stepStatus === 'done' ? '#10b98120' :
                                stepStatus === 'active' ? '#06b6d420' :
                                stepStatus === 'error' ? '#ef444420' :
                                `${C.border}`,
                    transition: 'all 0.3s ease',
                  }}>
                    {stepStatus === 'done' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {stepStatus === 'active' && (
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#06b6d4',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }} />
                    )}
                    {stepStatus === 'error' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                    {stepStatus === 'pending' && (
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: C.dim,
                      }} />
                    )}
                  </div>

                  {/* Label */}
                  <span style={{
                    fontSize: 13,
                    fontWeight: stepStatus === 'active' ? 600 : 400,
                    color: stepStatus === 'done' ? '#10b981' :
                           stepStatus === 'active' ? C.text :
                           stepStatus === 'error' ? '#ef4444' :
                           C.dim,
                    transition: 'all 0.3s ease',
                  }}>
                    {t(step.labelKey)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          {isProcessing && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.sub }}>
                  {stage && stageDescriptions[stage] ? stageDescriptions[stage] : t('tools.translator.processing')}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#06b6d4' }}>{progress}%</span>
              </div>
              <div style={{
                height: 6,
                borderRadius: 3,
                background: C.border,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, #06b6d4, #0ea5e9)',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          )}

          {/* Error message */}
          {status === 'error' && errorMsg && (
            <div style={{
              marginTop: 14,
              padding: '10px 14px',
              borderRadius: 10,
              background: '#ef444412',
              border: '1px solid #ef444425',
              fontSize: 13,
              color: '#ef4444',
            }}>
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* ── Action buttons ── */}
      {file && (
        <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {status === 'idle' && (
            <ActionButton
              label={t('tools.translator.translateBtn')}
              gradient={['#06b6d4', '#0ea5e9']}
              onClick={handleTranslate}
              disabled={!file || sourceLang === targetLang}
            />
          )}

          {status === 'uploading' && (
            <ActionButton
              label={t('tools.translator.uploading')}
              gradient={['#06b6d4', '#0ea5e9']}
              onClick={() => {}}
              loading
              disabled
            />
          )}

          {status === 'processing' && (
            <ActionButton
              label={t('tools.translator.processing')}
              gradient={['#06b6d4', '#0ea5e9']}
              onClick={() => {}}
              loading
              disabled
            />
          )}

          {(status === 'done' || status === 'error') && (
            <ActionButton
              label={t('tools.translator.translateAgain')}
              gradient={['#06b6d4', '#0ea5e9']}
              onClick={handleReset}
            />
          )}
        </div>
      )}

      {/* ── Result ── */}
      {status === 'done' && resultUrl && (
        <div style={{
          marginTop: 24,
          padding: '20px',
          borderRadius: 14,
          background: C.surface,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>
            {t('tools.translator.result')}
          </div>

          {/* Video player */}
          <video
            ref={videoPreviewRef}
            src={resultUrl}
            controls
            style={{
              width: '100%',
              maxHeight: 400,
              borderRadius: 10,
              background: '#000',
            }}
          />

          {/* Download button */}
          <a
            href={resultUrl}
            download="translated_video.mp4"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 14,
              padding: '10px 24px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t('tools.translator.downloadBtn')}
          </a>
        </div>
      )}

      {/* ── Pulse animation ── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </ToolPageShell>
  );
}
