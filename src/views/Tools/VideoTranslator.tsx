'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';

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

type DubStatus = 'idle' | 'uploading' | 'processing' | 'dubbed' | 'error';

export function VideoTranslator() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const router = useRouter();

  const [sourceUrl, setSourceUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [numSpeakers, setNumSpeakers] = useState(1);
  const [dropBg, setDropBg] = useState(true);
  const [status, setStatus] = useState<DubStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [dubbingId, setDubbingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [expectedDuration, setExpectedDuration] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const accent = '#7c5cfc';

  const card: React.CSSProperties = {
    background: C?.surface ?? '#fff',
    border: `1px solid ${C?.border ?? '#eee'}`,
    borderRadius: 16, padding: 24, marginBottom: 12,
  };

  /* ── Cleanup polling on unmount ────────────────────────────── */
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  /* ── Poll status ───────────────────────────────────────────── */
  const startPolling = useCallback((dubId: string, tLang: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let elapsed = 0;
    pollRef.current = setInterval(async () => {
      elapsed += 5;
      try {
        const res = await fetch(`/api/tools/video-translate?dubbing_id=${dubId}&target_lang=${tLang}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'dubbed') {
          setStatus('dubbed');
          setProgress(100);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === 'failed' || data.error) {
          setStatus('error');
          setError(data.error ?? '\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435');
          if (pollRef.current) clearInterval(pollRef.current);
        } else {
          // Show real status from ElevenLabs
          const statusMap: Record<string, string> = {
            preparing: '\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u0432\u0438\u0434\u0435\u043E...',
            transcribing: '\u0420\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0451\u043C \u0440\u0435\u0447\u044C...',
            translating: '\u041F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u043C \u0442\u0435\u043A\u0441\u0442...',
            generating: '\u0413\u0435\u043D\u0435\u0440\u0438\u0440\u0443\u0435\u043C \u043E\u0437\u0432\u0443\u0447\u043A\u0443...',
            rendering: '\u0421\u0431\u043E\u0440\u043A\u0430 \u0432\u0438\u0434\u0435\u043E...',
          };
          const phaseProgress: Record<string, number> = {
            preparing: 15,
            transcribing: 35,
            translating: 55,
            generating: 75,
            rendering: 90,
          };
          setStatusText(statusMap[data.status] ?? data.status);
          setProgress(phaseProgress[data.status] ?? Math.min(elapsed * 2, 90));
        }
      } catch { /* network error, retry */ }
    }, 5000);
  }, [expectedDuration]);

  /* ── Submit ────────────────────────────────────────────────── */
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
      formData.append('watermark', 'false');
      formData.append('num_speakers', String(numSpeakers));
      formData.append('drop_background_audio', String(dropBg));

      const res = await fetch('/api/tools/video-translate', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any)?.error ?? `\u041E\u0448\u0438\u0431\u043A\u0430 ${res.status}`);
      }

      const data = await res.json();
      setDubbingId(data.dubbing_id);
      setExpectedDuration(data.expected_duration_sec ?? 60);
      setStatus('processing');
      setProgress(5);
      startPolling(data.dubbing_id, targetLang);
    } catch (err: unknown) {
      setStatus('error');
      setError((err as Error)?.message ?? '\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430');
    }
  }, [sourceUrl, file, sourceLang, targetLang, startPolling]);

  /* ── Download ──────────────────────────────────────────────── */
  const handleDownload = useCallback(() => {
    if (!dubbingId) return;
    window.open(`/api/tools/video-translate?dubbing_id=${dubbingId}&target_lang=${targetLang}&download=true`, '_blank');
  }, [dubbingId, targetLang]);

  /* ── Reset ─────────────────────────────────────────────────── */
  const handleReset = useCallback(() => {
    setStatus('idle'); setError(null); setDubbingId(null);
    setProgress(0); setFile(null); setSourceUrl('');
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const isReady = (sourceUrl.trim() || file) && targetLang;

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div style={{ width: '100%', padding: '0 0 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingTop: 8 }}>
        <button onClick={() => router.push('/tools')} style={{
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
            {'\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0432\u0438\u0434\u0435\u043E'}
          </h1>
          <p style={{ fontSize: 12, color: C?.dim ?? '#999', margin: 0, marginTop: 2 }}>
            {'\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0430\u0443\u0434\u0438\u043E \u0441 \u043A\u043B\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435\u043C \u0433\u043E\u043B\u043E\u0441\u0430 \u043D\u0430 32 \u044F\u0437\u044B\u043A\u0430'}
          </p>
        </div>
      </div>

      {status === 'idle' && (
        <>
          {/* Source: URL or File */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {/* URL input */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C?.text ?? '#111', marginBottom: 12 }}>{'\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0432\u0438\u0434\u0435\u043E'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, border: `1px solid ${C?.border ?? '#eee'}`, background: C?.bg ?? '#fafafa' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C?.dim ?? '#aaa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                <input type="text" value={sourceUrl} onChange={(e) => { setSourceUrl(e.target.value); setFile(null); }}
                  placeholder="YouTube, TikTok, Vimeo..."
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: C?.text ?? '#111', fontSize: 14, fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ fontSize: 11, color: C?.dim ?? '#aaa', marginTop: 8 }}>YouTube, TikTok, Vimeo, X {'\u0438\u043B\u0438 \u043F\u0440\u044F\u043C\u0430\u044F \u0441\u0441\u044B\u043B\u043A\u0430'}</div>
            </div>

            {/* File upload */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C?.text ?? '#111', marginBottom: 12 }}>{'\u0418\u043B\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0444\u0430\u0439\u043B'}</div>
              <input ref={fileRef} type="file" accept="video/*,audio/*" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setSourceUrl(''); } }}
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
                  <span>{'\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u0438\u043B\u0438 \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435'}</span>
                )}
              </button>
              <div style={{ fontSize: 11, color: C?.dim ?? '#aaa', marginTop: 8 }}>MP4, MOV, MP3, WAV {'\u2022 \u0434\u043E 500 MB'}</div>
            </div>
          </div>

          {/* Language Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'start', marginBottom: 12 }}>
            {/* Source lang */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C?.text ?? '#111', marginBottom: 12 }}>{'\u042F\u0437\u044B\u043A \u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u0430'}</div>
              <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: `1px solid ${C?.border ?? '#eee'}`, background: C?.bg ?? '#fafafa',
                color: C?.text ?? '#111', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                appearance: 'none', cursor: 'pointer',
              }}>
                <option value="auto">{'\uD83C\uDF10 \u0410\u0432\u0442\u043E\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435'}</option>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
              </select>
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 48 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>

            {/* Target lang */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C?.text ?? '#111', marginBottom: 12 }}>{'\u041D\u0430 \u043A\u0430\u043A\u043E\u0439 \u044F\u0437\u044B\u043A'}</div>
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
                <option value="">{'\u0412\u0441\u0435 \u044F\u0437\u044B\u043A\u0438...'}</option>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
              </select>
            </div>
          </div>

          {/* Settings */}
          <div style={{ ...card, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C?.text ?? '#111', marginBottom: 16 }}>{String.fromCharCode(0x41D, 0x430, 0x441, 0x442, 0x440, 0x43E, 0x439, 0x43A, 0x438)}</div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Num speakers */}
              <div>
                <div style={{ fontSize: 11, color: C?.dim ?? '#aaa', marginBottom: 6 }}>{String.fromCharCode(0x421, 0x43F, 0x438, 0x43A, 0x435, 0x440, 0x43E, 0x432, 0x20, 0x432, 0x20, 0x432, 0x438, 0x434, 0x435, 0x43E)}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3].map((n) => (
                    <button key={n} onClick={() => setNumSpeakers(n)} style={{
                      width: 40, height: 36, borderRadius: 8,
                      border: numSpeakers === n ? `2px solid ${accent}` : `1px solid ${C?.border ?? '#eee'}`,
                      background: numSpeakers === n ? (isDark ? 'rgba(124,92,252,0.12)' : 'rgba(124,92,252,0.06)') : 'transparent',
                      color: numSpeakers === n ? accent : (C?.text ?? '#111'),
                      fontSize: 14, fontWeight: numSpeakers === n ? 700 : 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>{n}</button>
                  ))}
                  <button onClick={() => setNumSpeakers(0)} style={{
                    padding: '0 12px', height: 36, borderRadius: 8,
                    border: numSpeakers === 0 ? `2px solid ${accent}` : `1px solid ${C?.border ?? '#eee'}`,
                    background: numSpeakers === 0 ? (isDark ? 'rgba(124,92,252,0.12)' : 'rgba(124,92,252,0.06)') : 'transparent',
                    color: numSpeakers === 0 ? accent : (C?.text ?? '#111'),
                    fontSize: 12, fontWeight: numSpeakers === 0 ? 700 : 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>{'\u0410\u0432\u0442\u043E'}</button>
                </div>
              </div>
              {/* Drop background */}
              <div>
                <div style={{ fontSize: 11, color: C?.dim ?? '#aaa', marginBottom: 6 }}>{String.fromCharCode(0x423, 0x431, 0x440, 0x430, 0x442, 0x44C, 0x20, 0x0444, 0x043E, 0x043D)}</div>
                <button onClick={() => setDropBg(!dropBg)} style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: `1px solid ${dropBg ? accent : (C?.border ?? '#eee')}`,
                  background: dropBg ? (isDark ? 'rgba(124,92,252,0.12)' : 'rgba(124,92,252,0.06)') : 'transparent',
                  color: dropBg ? accent : (C?.sub ?? '#888'),
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>{dropBg ? String.fromCharCode(0x2705) + ' ' + String.fromCharCode(0x0414, 0x0430) : String.fromCharCode(0x274C) + ' ' + String.fromCharCode(0x041D, 0x0435, 0x0442)}</button>
                <div style={{ fontSize: 10, color: C?.dim ?? '#aaa', marginTop: 4 }}>{String.fromCharCode(0x041B, 0x0443, 0x0447, 0x0448, 0x0435, 0x20, 0x0434, 0x043B, 0x044F, 0x20, 0x0440, 0x0435, 0x0447, 0x0438, 0x20, 0x0431, 0x0435, 0x0437, 0x20, 0x043C, 0x0443, 0x0437, 0x044B, 0x043A, 0x0438)}</div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={!isReady} style={{
            width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
            background: isReady ? `linear-gradient(135deg, ${accent}, #a78bfa)` : (isDark ? '#333' : '#ddd'),
            color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'inherit',
            cursor: isReady ? 'pointer' : 'not-allowed', opacity: isReady ? 1 : 0.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.913 17H20.087M3.913 17H11.087"/><circle cx="12" cy="17" r="1"/><path d="M5.5 7H18.5"/><path d="M3 12H21"/></svg>
            {'\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u0432\u0438\u0434\u0435\u043E'}
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
              ? '\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C \u0432\u0438\u0434\u0435\u043E \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440...'
              : (statusText || '\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430...')}
          </div>
          <div style={{ fontSize: 13, color: C?.sub ?? '#888', marginBottom: 20 }}>
            {status === 'uploading'
              ? '\u042D\u0442\u043E \u043C\u043E\u0436\u0435\u0442 \u0437\u0430\u043D\u044F\u0442\u044C \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043C\u0438\u043D\u0443\u0442 \u0434\u043B\u044F \u0431\u043E\u043B\u044C\u0448\u0438\u0445 \u0444\u0430\u0439\u043B\u043E\u0432'
              : (expectedDuration > 0
                ? `\u041E\u0436\u0438\u0434\u0430\u0435\u043C\u043E\u0435 \u0432\u0440\u0435\u043C\u044F: ~${Math.ceil(expectedDuration / 60)} \u043C\u0438\u043D.`
                : '\u041A\u043B\u043E\u043D\u0438\u0440\u0443\u0435\u043C \u0433\u043E\u043B\u043E\u0441, \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u043C \u0438 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u0443\u0435\u043C')}
          </div>
          {/* Progress bar — only show during processing, not upload */}
          {status === 'processing' && (
            <>
              <div style={{ height: 6, borderRadius: 3, background: C?.border ?? '#eee', overflow: 'hidden', maxWidth: 400, margin: '0 auto' }}>
                <div style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${accent}, #a78bfa)`, width: `${progress}%`, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: 12, color: C?.dim ?? '#aaa', marginTop: 8 }}>{progress}%</div>
            </>
          )}
          {/* Indeterminate animation during upload */}
          {status === 'uploading' && (
            <div style={{ height: 6, borderRadius: 3, background: C?.border ?? '#eee', overflow: 'hidden', maxWidth: 400, margin: '0 auto' }}>
              <div style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${accent}, #a78bfa)`, width: '30%', animation: 'uploadPulse 1.5s ease-in-out infinite' }} />
            </div>
          )}
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes uploadPulse{0%{transform:translateX(-100%)}50%{transform:translateX(250%)}100%{transform:translateX(-100%)}}`}</style>
        </div>
      )}

      {/* Done */}
      {status === 'dubbed' && (
        <div style={{ ...card, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{'\u2705'}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C?.text ?? '#111', marginBottom: 8 }}>
            {'\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0433\u043E\u0442\u043E\u0432!'}
          </div>
          <div style={{ fontSize: 13, color: C?.sub ?? '#888', marginBottom: 24 }}>
            {'\u0412\u0438\u0434\u0435\u043E \u043F\u0435\u0440\u0435\u0432\u0435\u0434\u0435\u043D\u043E \u043D\u0430 '}{LANGUAGES.find((l) => l.code === targetLang)?.name ?? targetLang}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={handleDownload} style={{
              padding: '12px 28px', borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg, ${accent}, #a78bfa)`,
              color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {'\u0421\u043A\u0430\u0447\u0430\u0442\u044C'}
            </button>
            <button onClick={handleReset} style={{
              padding: '12px 28px', borderRadius: 12,
              border: `1px solid ${C?.border ?? '#eee'}`, background: C?.surface ?? '#fff',
              color: C?.text ?? '#111', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
            }}>
              {'\u041D\u043E\u0432\u044B\u0439 \u043F\u0435\u0440\u0435\u0432\u043E\u0434'}
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
            {'\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0441\u043D\u043E\u0432\u0430'}
          </button>
        </div>
      )}
    </div>
  );
}
