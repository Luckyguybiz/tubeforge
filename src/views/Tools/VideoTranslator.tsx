'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { WaitingGame } from '@/components/ui/WaitingGame';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';

/* eslint-disable @typescript-eslint/no-explicit-any */

const LANGUAGES: { code: string; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '\uD83C\uDDEC\uD83C\uDDE7' },
  { code: 'ru', name: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439', flag: '\uD83C\uDDF7\uD83C\uDDFA' },
  { code: 'es', name: 'Espa\u00F1ol', flag: '\uD83C\uDDEA\uD83C\uDDF8' },
  { code: 'fr', name: 'Fran\u00E7ais', flag: '\uD83C\uDDEB\uD83C\uDDF7' },
  { code: 'de', name: 'Deutsch', flag: '\uD83C\uDDE9\uD83C\uDDEA' },
  { code: 'it', name: 'Italiano', flag: '\uD83C\uDDEE\uD83C\uDDF9' },
  { code: 'pt', name: 'Portugu\u00EAs', flag: '\uD83C\uDDE7\uD83C\uDDF7' },
  { code: 'ja', name: '\u65E5\u672C\u8A9E', flag: '\uD83C\uDDEF\uD83C\uDDF5' },
  { code: 'ko', name: '\uD55C\uAD6D\uC5B4', flag: '\uD83C\uDDF0\uD83C\uDDF7' },
  { code: 'zh', name: '\u4E2D\u6587', flag: '\uD83C\uDDE8\uD83C\uDDF3' },
  { code: 'ar', name: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', flag: '\uD83C\uDDF8\uD83C\uDDE6' },
  { code: 'hi', name: '\u0939\u093F\u0928\u094D\u0926\u0940', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { code: 'tr', name: 'T\u00FCrk\u00E7e', flag: '\uD83C\uDDF9\uD83C\uDDF7' },
  { code: 'uk', name: '\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430', flag: '\uD83C\uDDFA\uD83C\uDDE6' },
  { code: 'pl', name: 'Polski', flag: '\uD83C\uDDF5\uD83C\uDDF1' },
  { code: 'nl', name: 'Nederlands', flag: '\uD83C\uDDF3\uD83C\uDDF1' },
];

/** Max file size: 500 MB */
const MAX_FILE_SIZE = 500 * 1024 * 1024;

type TranslateStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

/** Pipeline stage status messages */
const STAGE_LABELS: Record<string, string> = {
  extracting: 'Extracting audio from video...',
  transcribing: 'Transcribing speech with Whisper...',
  translating: 'Translating text with GPT-4o...',
  cloning: 'Cloning your voice...',
  generating_tts: 'Generating translated speech...',
  merging: 'Merging translated audio with video...',
  done: 'Done!',
};

export function VideoTranslator() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const isDark = useThemeStore((s) => s.isDark);
  const router = useRouter();

  const [sourceUrl, setSourceUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ru');
  const [status, setStatus] = useState<TranslateStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const accent = '#7c5cfc';

  // Fetch tool usage limits
  const { data: usage } = trpc.user.getToolUsage.useQuery(undefined, {
    staleTime: 30_000,
  });
  const translationsRemaining = usage ? Math.max(0, usage.translations.limit - usage.translations.used) : null;
  const translationLimitReached = false; // LIMITS PAUSED

  const card: React.CSSProperties = {
    background: C?.surface ?? '#fff',
    border: `1px solid ${C?.border ?? '#eee'}`,
    borderRadius: 16, padding: 24, marginBottom: 12,
  };

  /* -- Estimated processing time based on file size -- */
  const estimatedTime = useMemo(() => {
    if (!file) return null;
    const sizeMB = file.size / (1024 * 1024);
    const minutes = Math.max(2, Math.ceil(sizeMB / 10));
    return minutes;
  }, [file]);

  /* -- File validation on select -- */
  const handleFileSelect = useCallback((f: File) => {
    setFileWarning(null);

    if (!f.type.startsWith('video/') && !f.type.startsWith('audio/')) {
      setFileWarning(t('videoTranslator.invalidFileType') || 'Invalid file type. Please upload a video or audio file.');
      return;
    }

    if (f.size > MAX_FILE_SIZE) {
      setFileWarning(
        (t('videoTranslator.fileTooLarge') || 'File too large') +
        ` (${(f.size / 1024 / 1024).toFixed(0)} MB). ` +
        (t('videoTranslator.maxFileSize') || 'Maximum is 500 MB.'),
      );
      return;
    }

    if (f.size < 1 * 1024 * 1024) {
      setFileWarning(
        t('videoTranslator.shortVideoWarning') ||
        'Short videos (under 10 seconds) may produce less accurate voice cloning. For best results, use videos with 30+ seconds of clear speech.',
      );
    }

    setFile(f);
    setSourceUrl('');
  }, [t]);

  /* -- Cleanup polling on unmount -- */
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  /* -- Poll status -- */
  const startPolling = useCallback((jId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/tools/video-translate?job_id=${jId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'done') {
          setStatus('done');
          setProgress(100);
          setStatusText(STAGE_LABELS.done);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === 'error') {
          setStatus('error');
          setError(data.error ?? 'Processing error');
          if (pollRef.current) clearInterval(pollRef.current);
        } else {
          setStatusText(STAGE_LABELS[data.status] ?? data.status);
          setProgress(data.progress ?? 0);
        }
      } catch { /* network error, retry */ }
    }, 3000);
  }, []);

  /* -- Submit -- */
  const handleSubmit = useCallback(async () => {
    if (!sourceUrl.trim() && !file) return;
    setError(null); setStatus('uploading'); setProgress(0);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('source_url', sourceUrl.trim());
      }
      formData.append('source_lang', sourceLang);
      formData.append('target_lang', targetLang);

      const res = await fetch('/api/tools/video-translate', {
        method: 'POST',
        headers: promoCode ? { 'x-promo-code': promoCode } : {},
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any)?.error ?? `Processing error ${res.status}`);
      }

      const data = await res.json();
      setJobId(data.job_id);
      setStatus('processing');
      setProgress(5);
      setStatusText(STAGE_LABELS.extracting);
      startPolling(data.job_id);
    } catch (err: unknown) {
      setStatus('error');
      setError((err as Error)?.message ?? 'Unknown error');
    }
  }, [sourceUrl, file, sourceLang, targetLang, startPolling]);

  /* -- Download -- */
  const handleDownload = useCallback(() => {
    if (!jobId) return;
    window.open(`/api/tools/video-translate?job_id=${jobId}&download=true`, '_blank');
  }, [jobId]);

  /* -- Reset -- */
  const handleReset = useCallback(() => {
    setStatus('idle'); setError(null); setJobId(null);
    setProgress(0); setFile(null); setSourceUrl('');
    setFileWarning(null); setStatusText('');
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const isReady = (sourceUrl.trim() || file) && targetLang && sourceLang !== '' && !false /* translationLimitReached */;

  /* -- Render -- */
  return (
    <div style={{ width: '100%', padding: '0 0 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingTop: 8 }}>
        <button onClick={() => { if (window.history.length > 1) { router.back(); } else { router.push('/tools'); } }} style={{
          width: 36, height: 36, borderRadius: 10,
          border: `1px solid ${C?.border ?? '#eee'}`, background: C?.surface ?? '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: C?.text ?? '#111', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${accent}, #a78bfa)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.913 17H20.087M3.913 17H11.087"/><circle cx="12" cy="17" r="1"/><path d="M5.5 7H18.5"/><path d="M3 12H21"/><path d="M16 3L8 21"/></svg>
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: C?.text ?? '#111', letterSpacing: '-0.02em', margin: 0 }}>
            {t('videoTranslator.title')}
          </h1>
          <p style={{ fontSize: 12, color: C?.dim ?? '#999', margin: 0, marginTop: 2 }}>
            {t('videoTranslator.subtitle')}
          </p>
        </div>
      </div>

      {status === 'idle' && (
        <>
          {/* Voice Cloning Quality Tip */}
          <div style={{
            ...card,
            marginBottom: 16,
            background: isDark ? 'rgba(124,92,252,0.06)' : 'rgba(124,92,252,0.03)',
            border: `1px solid ${isDark ? 'rgba(124,92,252,0.2)' : 'rgba(124,92,252,0.15)'}`,
            display: 'flex', gap: 12, alignItems: 'flex-start', padding: 16,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
            </svg>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C?.text ?? '#111', marginBottom: 4 }}>
                {t('videoTranslator.qualityTipTitle') || 'Voice Cloning Quality Tips'}
              </div>
              <div style={{ fontSize: 11, color: C?.sub ?? '#888', lineHeight: 1.5 }}>
                {t('videoTranslator.qualityTipText') || 'For best voice cloning: use videos with clear speech, minimal background noise, and 30+ seconds of audio. Always specify the source language instead of using auto-detect. Single-speaker videos produce the most accurate voice clones.'}
              </div>
            </div>
          </div>


          {/* Usage Limits Banner */}
          {false && usage && (
            <div style={{
              ...card,
              marginBottom: 16,
              padding: 14,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: false /* translationLimitReached */
                ? (isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.03)')
                : (isDark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.03)'),
              border: `1px solid ${false /* translationLimitReached */
                ? (isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)')
                : (isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.15)')}`,
            }}>
              <div style={{ fontSize: 12, color: C?.sub ?? '#888' }}>
                {false /* translationLimitReached */
                  ? 'Translation limit reached this month.'
                  : `You have ${translationsRemaining} translation${translationsRemaining === 1 ? '' : 's'} remaining this month.`}
              </div>
              {false /* translationLimitReached */ && (
                <button onClick={() => router.push('/billing')} style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none',
                  background: accent, color: '#fff', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}>
                  Upgrade Plan
                </button>
              )}
            </div>
          )}

          {/* Source: URL or File */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {/* URL input */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C?.text ?? '#111', marginBottom: 12 }}>{t('videoTranslator.videoLink')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, border: `1px solid ${C?.border ?? '#eee'}`, background: C?.bg ?? '#fafafa' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C?.dim ?? '#aaa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                <input type="text" value={sourceUrl} onChange={(e) => { setSourceUrl(e.target.value); setFile(null); setFileWarning(null); }}
                  placeholder="YouTube, TikTok, Vimeo..."
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: C?.text ?? '#111', fontSize: 14, fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ fontSize: 11, color: C?.dim ?? '#aaa', marginTop: 8 }}>YouTube, TikTok, Vimeo, X {t('videoTranslator.orDirectLink')}</div>
            </div>

            {/* File upload */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C?.text ?? '#111', marginBottom: 12 }}>{t('videoTranslator.orUploadFile')}</div>
              <input ref={fileRef} type="file" accept="video/*,audio/*" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />
              <button onClick={() => fileRef.current?.click()} style={{
                width: '100%', padding: '20px 16px', borderRadius: 10,
                border: `2px dashed ${file ? accent : (C?.border ?? '#ddd')}`,
                background: file ? (isDark ? 'rgba(124,92,252,0.08)' : 'rgba(124,92,252,0.04)') : 'transparent',
                cursor: 'pointer', color: C?.sub ?? '#888', fontSize: 13, fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={file ? accent : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {file ? (
                  <span style={{ color: accent, fontWeight: 600 }}>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                ) : (
                  <span>{t('videoTranslator.clickOrDrag')}</span>
                )}
              </button>
              <div style={{ fontSize: 11, color: C?.dim ?? '#aaa', marginTop: 8 }}>MP4, MOV, MP3, WAV {`\u2022 ${t('videoTranslator.upTo500mb')}`}</div>
              {fileWarning && (
                <div style={{
                  marginTop: 8, padding: '8px 10px', borderRadius: 8,
                  background: isDark ? 'rgba(234,179,8,0.1)' : 'rgba(234,179,8,0.08)',
                  border: '1px solid rgba(234,179,8,0.3)',
                  fontSize: 11, color: '#b45309', lineHeight: 1.4,
                }}>
                  {fileWarning}
                </div>
              )}
              {file && estimatedTime && !fileWarning?.includes('Invalid') && !fileWarning?.includes('too large') && (
                <div style={{ fontSize: 11, color: C?.dim ?? '#aaa', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {t('videoTranslator.estimatedTime') || 'Estimated processing time'}: ~{estimatedTime} {t('videoTranslator.min') || 'min'}
                </div>
              )}
            </div>
          </div>

          {/* Language Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'start', marginBottom: 12 }}>
            {/* Source lang */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C?.text ?? '#111' }}>{t('videoTranslator.sourceLanguage')}</div>
                <div style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  background: isDark ? 'rgba(234,179,8,0.15)' : 'rgba(234,179,8,0.1)',
                  color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {t('videoTranslator.important') || 'Important'}
                </div>
              </div>
              <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: `1px solid ${sourceLang === 'auto' ? 'rgba(234,179,8,0.5)' : (C?.border ?? '#eee')}`,
                background: C?.bg ?? '#fafafa',
                color: C?.text ?? '#111', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                appearance: 'none', cursor: 'pointer',
              }}>
                <option value="auto">{`\uD83C\uDF10 ${t('videoTranslator.autoDetect')} (${t('videoTranslator.notRecommended') || 'not recommended'})`}</option>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
              </select>
              {sourceLang === 'auto' && (
                <div style={{
                  marginTop: 8, padding: '6px 10px', borderRadius: 6,
                  background: isDark ? 'rgba(234,179,8,0.1)' : 'rgba(234,179,8,0.06)',
                  border: '1px solid rgba(234,179,8,0.25)',
                  fontSize: 10, color: '#b45309', lineHeight: 1.4,
                }}>
                  {t('videoTranslator.autoDetectWarning') || 'Auto-detect produces lower quality. Please select the actual source language for best results.'}
                </div>
              )}
              <div style={{ fontSize: 10, color: C?.dim ?? '#aaa', marginTop: 6 }}>
                {t('videoTranslator.sourceLangHint') || 'Specifying the correct source language significantly improves transcription and voice cloning accuracy'}
              </div>
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 48 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>

            {/* Target lang */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C?.text ?? '#111', marginBottom: 12 }}>{t('videoTranslator.targetLanguage')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {LANGUAGES.slice(0, 12).map((l) => (
                  <button key={l.code} onClick={() => setTargetLang(l.code)} style={{
                    padding: '8px 10px', borderRadius: 8,
                    border: targetLang === l.code ? `2px solid ${accent}` : `1px solid ${C?.border ?? '#eee'}`,
                    background: targetLang === l.code ? (isDark ? 'rgba(124,92,252,0.12)' : 'rgba(124,92,252,0.06)') : 'transparent',
                    color: targetLang === l.code ? accent : (C?.text ?? '#111'),
                    fontSize: 12, fontWeight: targetLang === l.code ? 700 : 500,
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  }}>
                    {l.flag} {l.name}
                  </button>
                ))}
              </div>
              <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} style={{
                width: '100%', marginTop: 8, padding: '8px 10px', borderRadius: 8,
                border: `1px solid ${C?.border ?? '#eee'}`, background: C?.bg ?? '#fafafa',
                color: C?.sub ?? '#888', fontSize: 12, fontFamily: 'inherit', outline: 'none',
                appearance: 'none', cursor: 'pointer',
              }}>
                <option value="">{t('videoTranslator.allLanguages')}</option>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
              </select>
            </div>
          </div>

          {/* Pipeline Info */}
          <div style={{
            ...card, marginBottom: 16, padding: 16,
            background: isDark ? 'rgba(34,197,94,0.04)' : 'rgba(34,197,94,0.02)',
            border: `1px solid ${isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)'}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C?.text ?? '#111', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              {t('videoTranslator.activeOptimizations') || 'Translation Pipeline'}
            </div>
            <div style={{ fontSize: 11, color: C?.sub ?? '#888', lineHeight: 1.6 }}>
              {'\u2022 Whisper AI transcription (accurate speech recognition)'}<br/>
              {'\u2022 GPT-4o translation (natural, context-aware translations)'}<br/>
              {'\u2022 ElevenLabs voice cloning (preserves your original voice)'}<br/>
              {'\u2022 Multilingual v2 model (best quality for 29+ languages)'}
            </div>
          </div>

          {/* Promo code */}
          <details style={{ marginBottom: 16, cursor: 'pointer' }}>
            <summary style={{ fontSize: 12, color: C?.dim ?? '#aaa' }}>
              {t('videoTranslator.havePromo') || 'Есть промокод?'}
            </summary>
            <div style={{ marginTop: 8 }}>
              <input
                type='text'
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder={t('videoTranslator.enterPromo') || 'Введите промокод'}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1px solid ' + (C?.border ?? '#eee'), background: C?.bg ?? '#fafafa',
                  color: C?.text ?? '#111', fontSize: 13, fontFamily: 'inherit',
                  boxSizing: 'border-box' as const,
                }}
              />
              {promoCode && (
                <div style={{ fontSize: 11, color: '#22c55e', marginTop: 4 }}>
                  ✅ {t('videoTranslator.promoApplied') || 'Промокод применён — лимиты сняты'}
                </div>
              )}
            </div>
          </details>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={!isReady} style={{
            width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
            background: isReady ? `linear-gradient(135deg, ${accent}, #a78bfa)` : (isDark ? '#333' : '#ddd'),
            color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'inherit',
            cursor: isReady ? 'pointer' : 'not-allowed', opacity: isReady ? 1 : 0.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.913 17H20.087M3.913 17H11.087"/><circle cx="12" cy="17" r="1"/><path d="M5.5 7H18.5"/><path d="M3 12H21"/></svg>
            {t('videoTranslator.translateVideo')}
          </button>
        </>
      )}

      {/* Processing / Progress */}
      {(status === 'uploading' || status === 'processing') && (
        <div style={{ ...card, textAlign: 'center', padding: 48 }}>
          <div style={{ marginBottom: 20 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" style={{ animation: 'spin 2s linear infinite' }}>
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeDasharray="56" strokeDashoffset="14"/>
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C?.text ?? '#111', marginBottom: 8 }}>
            {status === 'uploading'
              ? (t('videoTranslator.uploadingToServer') || 'Uploading to server...')
              : (statusText || 'Processing...')}
          </div>
          <div style={{ fontSize: 13, color: C?.sub ?? '#888', marginBottom: 20 }}>
            {status === 'uploading'
              ? (t('videoTranslator.mayTakeMinutes') || 'This may take a moment...')
              : 'Pipeline: Extract \u2192 Transcribe \u2192 Translate \u2192 Clone Voice \u2192 TTS \u2192 Merge'}
          </div>
          {/* Progress bar */}
          {status === 'processing' && (
            <>
              <div style={{ height: 6, borderRadius: 3, background: C?.border ?? '#eee', overflow: 'hidden', maxWidth: 400, margin: '0 auto' }}>
                <div style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${accent}, #a78bfa)`, width: `${progress}%`, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: 12, color: C?.dim ?? '#aaa', marginTop: 8 }}>{progress}%</div>
            </>
          )}
          {status === 'uploading' && (
            <div style={{ height: 6, borderRadius: 3, background: C?.border ?? '#eee', overflow: 'hidden', maxWidth: 400, margin: '0 auto' }}>
              <div style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${accent}, #a78bfa)`, width: '30%', animation: 'uploadPulse 1.5s ease-in-out infinite' }} />
            </div>
          )}
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes uploadPulse{0%{transform:translateX(-100%)}50%{transform:translateX(250%)}100%{transform:translateX(-100%)}}`}</style>
          <WaitingGame />
        </div>
      )}

      {/* Done */}
      {status === 'done' && (
        <div style={{ ...card, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{'\u2705'}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C?.text ?? '#111', marginBottom: 8 }}>
            {t('videoTranslator.translationReady')}
          </div>
          <div style={{ fontSize: 13, color: C?.sub ?? '#888', marginBottom: 24 }}>
            {t('videoTranslator.videoTranslatedTo')}{LANGUAGES.find((l) => l.code === targetLang)?.name ?? targetLang}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={handleDownload} style={{
              padding: '12px 28px', borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg, ${accent}, #a78bfa)`,
              color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {t('videoTranslator.download')}
            </button>
            <button onClick={handleReset} style={{
              padding: '12px 28px', borderRadius: 12,
              border: `1px solid ${C?.border ?? '#eee'}`, background: C?.surface ?? '#fff',
              color: C?.text ?? '#111', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
            }}>
              {t('videoTranslator.newTranslation')}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div style={{ ...card, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{'\u274C'}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>{error}</div>
          <button onClick={handleReset} style={{
            marginTop: 12, padding: '10px 24px', borderRadius: 10,
            border: `1px solid ${C?.border ?? '#eee'}`, background: C?.surface ?? '#fff',
            color: C?.text ?? '#111', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
          }}>
            {t('videoTranslator.tryAgain')}
          </button>
        </div>
      )}
    </div>
  );
}
