'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

const MAX_CHARS = 5000;

/* ── ElevenLabs voice presets ── */
interface ElevenLabsVoice {
  id: string;
  voiceId: string;
  labelKey: string;
  lang: string;
}

const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  { id: 'rachel', voiceId: '21m00Tcm4TlvDq8ikWAM', labelKey: 'tools.voiceover.voiceRachel', lang: 'en-US' },
  { id: 'adam', voiceId: 'pNInz6obpgDQGcFmaJgB', labelKey: 'tools.voiceover.voiceAdam', lang: 'en-US' },
  { id: 'sam', voiceId: 'yoZ06aMxZJJ28mfd3POQ', labelKey: 'tools.voiceover.voiceSam', lang: 'en-US' },
  { id: 'elli', voiceId: 'MF3mGyEYCl7XYWbV9V6O', labelKey: 'tools.voiceover.voiceElli', lang: 'en-US' },
  { id: 'josh', voiceId: 'TxGEqnHWrfWFTfGW9XjX', labelKey: 'tools.voiceover.voiceJosh', lang: 'en-US' },
  { id: 'bella', voiceId: 'EXAVITQu4vr4xnSDxMaL', labelKey: 'tools.voiceover.voiceBella', lang: 'en-US' },
];

/* ── Browser TTS voice presets (fallback) ── */
interface BrowserVoice {
  id: string;
  labelKey: string;
  lang: string;
}

const BROWSER_VOICES: BrowserVoice[] = [
  { id: 'male1', labelKey: 'tools.voiceover.voiceMale1', lang: 'en-US' },
  { id: 'male2', labelKey: 'tools.voiceover.voiceMale2', lang: 'en-GB' },
  { id: 'female1', labelKey: 'tools.voiceover.voiceFemale1', lang: 'en-US' },
  { id: 'female2', labelKey: 'tools.voiceover.voiceFemale2', lang: 'en-GB' },
  { id: 'child', labelKey: 'tools.voiceover.voiceChild', lang: 'en-US' },
  { id: 'narrator', labelKey: 'tools.voiceover.voiceNarrator', lang: 'en-GB' },
];

type Engine = 'elevenlabs' | 'browser';

const BAR_COUNT = 10;

export function VoiceoverGenerator() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredVoice, setHoveredVoice] = useState<string | null>(null);

  const [engine, setEngine] = useState<Engine>('elevenlabs');
  const [selectedELVoice, setSelectedELVoice] = useState('rachel');
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState('male1');
  const [hoveredEngine, setHoveredEngine] = useState<Engine | null>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [barHeights, setBarHeights] = useState<number[]>(Array(BAR_COUNT).fill(20));

  const ttsMutation = trpc.ai.generateTTS.useMutation();

  useEffect(() => {
    if (isSpeaking) {
      const animate = () => {
        setBarHeights(Array.from({ length: BAR_COUNT }, () => 15 + Math.random() * 85));
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setBarHeights(Array(BAR_COUNT).fill(20));
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSpeaking]);

  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleElevenLabsGenerate = useCallback(async () => {
    const voice = ELEVENLABS_VOICES.find((v) => v.id === selectedELVoice);
    if (!voice) return;

    setIsGenerating(true);
    setError(null);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);

    try {
      const result = await ttsMutation.mutateAsync({
        text,
        voiceId: voice.voiceId,
        speed,
      });

      const byteChars = atob(result.audioBase64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNums[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNums);
      const blob = new Blob([byteArray], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => { setIsPlaying(true); setIsSpeaking(true); };
      audio.onended = () => { setIsPlaying(false); setIsSpeaking(false); };
      audio.onerror = () => { setIsPlaying(false); setIsSpeaking(false); };
      audio.onpause = () => { setIsPlaying(false); setIsSpeaking(false); };
      await audio.play();

      toast.success(t('tools.voiceover.elevenLabsSuccess'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'TTS generation failed';
      if (msg.includes('not configured') || msg.includes('PRECONDITION_FAILED')) {
        setError(t('tools.voiceover.elevenLabsNotConfigured'));
      } else {
        setError(msg);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [text, selectedELVoice, speed, audioUrl, ttsMutation, t]);

  const handleBrowserGenerate = useCallback(() => {
    setError(null);
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    utterance.pitch = pitch;

    const voices = speechSynthesis.getVoices();
    const preset = BROWSER_VOICES.find((v) => v.id === selectedBrowserVoice);
    if (preset && voices.length > 0) {
      const langVoices = voices.filter((v) => v.lang.startsWith(preset.lang.slice(0, 2)));
      if (langVoices.length > 0) {
        const idx = preset.id.endsWith('2') || preset.id === 'narrator' ? 1 : 0;
        utterance.voice = langVoices[Math.min(idx, langVoices.length - 1)] ?? langVoices[0] ?? null;
      }
    }

    utterance.onstart = () => { setIsPlaying(true); setIsSpeaking(true); };
    utterance.onend = () => { setIsPlaying(false); setIsSpeaking(false); };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsSpeaking(false);
      setError(t('tools.voiceover.speechError'));
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [text, speed, pitch, selectedBrowserVoice, t]);

  const handleGenerate = useCallback(() => {
    if (!text.trim()) {
      setError(t('tools.voiceover.emptyText'));
      return;
    }
    if (engine === 'elevenlabs') {
      void handleElevenLabsGenerate();
    } else {
      handleBrowserGenerate();
    }
  }, [text, engine, handleElevenLabsGenerate, handleBrowserGenerate, t]);

  const handleStop = useCallback(() => {
    speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsSpeaking(false);
  }, []);

  const handleDownload = useCallback(() => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `voiceover-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [audioUrl]);

  const voices = engine === 'elevenlabs' ? ELEVENLABS_VOICES : BROWSER_VOICES;
  const selectedVoice = engine === 'elevenlabs' ? selectedELVoice : selectedBrowserVoice;
  const setSelectedVoice = engine === 'elevenlabs' ? setSelectedELVoice : setSelectedBrowserVoice;

  return (
    <ToolPageShell
      title={t('tools.voiceover.title')}
      subtitle={t('tools.voiceover.subtitle')}
      gradient={['#3b82f6', '#6366f1']}
    >
      {/* ── Engine selector ── */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>
          {t('tools.voiceover.engineLabel')}
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['elevenlabs', 'browser'] as const).map((eng) => (
            <button
              key={eng}
              onClick={() => setEngine(eng)}
              onMouseEnter={() => setHoveredEngine(eng)}
              onMouseLeave={() => setHoveredEngine(null)}
              style={{
                padding: '8px 20px', borderRadius: 20, fontSize: 13,
                fontWeight: engine === eng ? 700 : 500,
                height: 36, border: 'none',
                background: engine === eng
                  ? 'rgba(59,130,246,.15)'
                  : hoveredEngine === eng ? C.border : C.surface,
                color: engine === eng ? '#3b82f6' : C.sub,
                cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
              }}
            >
              {eng === 'elevenlabs' ? t('tools.voiceover.engineElevenLabs') : t('tools.voiceover.engineBrowser')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Text area ── */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>
          {t('tools.voiceover.textLabel')}
        </label>
        <div style={{ position: 'relative' }}>
          <textarea
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) setText(e.target.value);
            }}
            placeholder={t('tools.voiceover.placeholder')}
            rows={6}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 10,
              border: `1px solid ${C.border}`, background: C.surface,
              color: C.text, fontSize: 14, fontFamily: 'inherit',
              resize: 'vertical', outline: 'none', lineHeight: 1.6,
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.3)'; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          />
          <div style={{
            position: 'absolute', bottom: 10, right: 14,
            fontSize: 11, color: text.length >= MAX_CHARS ? '#ef4444' : C.dim,
            fontWeight: 600, pointerEvents: 'none',
          }}>
            {text.length}/{MAX_CHARS}
          </div>
        </div>
      </div>

      {/* ── Voice selector ── */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>
          {t('tools.voiceover.voiceLabel')}
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {voices.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVoice(v.id)}
              onMouseEnter={() => setHoveredVoice(v.id)}
              onMouseLeave={() => setHoveredVoice(null)}
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: selectedVoice === v.id ? 700 : 500,
                height: 36, border: 'none',
                background: selectedVoice === v.id ? 'rgba(59,130,246,.2)' : hoveredVoice === v.id ? C.border : C.surface,
                color: selectedVoice === v.id ? '#3b82f6' : C.sub,
                cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
              }}
            >
              {t(v.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Speed slider ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>
            {t('tools.voiceover.speed')}
          </label>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>{speed.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#3b82f6' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.dim, marginTop: 4 }}>
          <span>0.5x</span>
          <span>2.0x</span>
        </div>
      </div>

      {/* ── Pitch slider (browser TTS only) ── */}
      {engine === 'browser' && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>
              {t('tools.voiceover.pitch')}
            </label>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>{pitch.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#3b82f6' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.dim, marginTop: 4 }}>
            <span>0.5</span>
            <span>1.5</span>
          </div>
        </div>
      )}

      {/* ── Audio visualization ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4,
        height: 80, padding: '12px 16px', borderRadius: 16,
        border: `1px solid ${C.border}`, background: C.surface, marginBottom: 20,
      }}>
        {barHeights.map((h, i) => (
          <div
            key={i}
            style={{
              width: `${100 / BAR_COUNT - 2}%`,
              maxWidth: 20,
              height: `${h}%`,
              borderRadius: 4,
              background: isSpeaking
                ? 'linear-gradient(180deg, #3b82f6, #6366f1)'
                : C.border,
              transition: isSpeaking ? 'height 0.08s ease' : 'height 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* ── Engine badge ── */}
      <div style={{
        padding: '12px 16px', borderRadius: 16, marginBottom: 20,
        background: engine === 'elevenlabs' ? 'rgba(59,130,246,.1)' : C.surface,
        border: engine === 'elevenlabs' ? '1px solid rgba(59,130,246,.2)' : `1px solid ${C.border}`,
        fontSize: 13, color: engine === 'elevenlabs' ? '#3b82f6' : C.sub, lineHeight: 1.6,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {engine === 'elevenlabs' ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
            {t('tools.voiceover.elevenLabsBadge')}
          </>
        ) : (
          t('tools.voiceover.browserTtsNotice')
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div role="alert" style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12,
          border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)', marginBottom: 16,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{error}</span>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="tf-voice-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {isPlaying ? (
          <ActionButton
            label={t('tools.voiceover.stop')}
            gradient={['#ef4444', '#dc2626']}
            onClick={handleStop}
          />
        ) : (
          <ActionButton
            label={isGenerating ? t('tools.voiceover.generating') : t('tools.voiceover.generate')}
            gradient={['#3b82f6', '#6366f1']}
            onClick={handleGenerate}
            disabled={!text.trim() || isGenerating}
            loading={isGenerating}
          />
        )}

        {/* Download MP3 button (ElevenLabs only, when audio available) */}
        {engine === 'elevenlabs' && audioUrl && !isGenerating && (
          <ActionButton
            label={t('tools.voiceover.downloadMp3')}
            gradient={['#10b981', '#059669']}
            onClick={handleDownload}
          />
        )}
      </div>
    </ToolPageShell>
  );
}
