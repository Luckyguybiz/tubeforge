'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { useLocaleStore } from '@/stores/useLocaleStore';

const MAX_CHARS = 5000;

interface VoicePreset {
  id: string;
  labelKey: string;
  lang: string;
}

const VOICE_PRESETS: VoicePreset[] = [
  { id: 'male1', labelKey: 'tools.voiceover.voiceMale1', lang: 'ru-RU' },
  { id: 'male2', labelKey: 'tools.voiceover.voiceMale2', lang: 'en-US' },
  { id: 'female1', labelKey: 'tools.voiceover.voiceFemale1', lang: 'ru-RU' },
  { id: 'female2', labelKey: 'tools.voiceover.voiceFemale2', lang: 'en-US' },
  { id: 'child', labelKey: 'tools.voiceover.voiceChild', lang: 'en-US' },
  { id: 'narrator', labelKey: 'tools.voiceover.voiceNarrator', lang: 'en-GB' },
];

const BAR_COUNT = 10;

export function VoiceoverGenerator() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);

  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('male1');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredVoice, setHoveredVoice] = useState<string | null>(null);
  const [ttsMode, setTtsMode] = useState<'browser' | 'ai'>('browser');
  const [aiVoice, setAiVoice] = useState('alloy');
  const [aiLoading, setAiLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [downloadHover, setDownloadHover] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch tool usage limits
  const { data: usage, refetch: refetchUsage } = trpc.user.getToolUsage.useQuery(undefined, {
    staleTime: 30_000,
  });
  const ttsRemaining = usage ? Math.max(0, usage.tts.limit - usage.tts.used) : null;
  const ttsLimitReached = usage ? usage.tts.used >= usage.tts.limit : false;

  const AI_VOICES = [
    { id: 'alloy', label: 'Alloy' },
    { id: 'echo', label: 'Echo' },
    { id: 'fable', label: 'Fable' },
    { id: 'onyx', label: 'Onyx' },
    { id: 'nova', label: 'Nova' },
    { id: 'shimmer', label: 'Shimmer' },
  ];

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [barHeights, setBarHeights] = useState<number[]>(Array(BAR_COUNT).fill(20));

  // Animate bars while speaking
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const handleGenerate = useCallback(() => {
    if (!text.trim()) {
      setError(t('tools.voiceover.emptyText'));
      return;
    }
    setError(null);

    // Cancel any previous speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    utterance.pitch = pitch;

    // Try to pick a voice matching the preset
    const voices = speechSynthesis.getVoices();
    const preset = VOICE_PRESETS.find((v) => v.id === selectedVoice);
    if (preset && voices.length > 0) {
      const langVoices = voices.filter((v) => v.lang.startsWith(preset.lang.slice(0, 2)));
      if (langVoices.length > 0) {
        // Pick different index based on preset id for variety
        const idx = preset.id.endsWith('2') || preset.id === 'narrator' ? 1 : 0;
        utterance.voice = langVoices[Math.min(idx, langVoices.length - 1)] ?? langVoices[0] ?? null;
      }
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsSpeaking(false);
      setError(t('tools.voiceover.speechError'));
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [text, speed, pitch, selectedVoice, t]);

  const handleStop = useCallback(() => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsSpeaking(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const handleAiGenerate = useCallback(async () => {
    if (!text.trim()) {
      setError(t('tools.voiceover.emptyText'));
      return;
    }
    setError(null);
    setAiLoading(true);
    setIsSpeaking(true);

    try {
      const res = await fetch('/api/tools/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: aiVoice, model: 'tts-1' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(data.error || 'TTS generation failed');
      }

      const blob = await res.blob();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Auto-play the generated audio
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => { setIsPlaying(true); setIsSpeaking(true); };
      audio.onended = () => { setIsPlaying(false); setIsSpeaking(false); };
      audio.onerror = () => { setIsPlaying(false); setIsSpeaking(false); };
      audio.play();
      refetchUsage();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI voice generation failed';
      setError(msg);
      setIsSpeaking(false);
    } finally {
      setAiLoading(false);
    }
  }, [text, aiVoice, audioUrl, t]);

  const handleDownloadAudio = useCallback(() => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = 'voiceover.mp3';
    a.click();
  }, [audioUrl]);

  return (
    <ToolPageShell
      title={t('tools.voiceover.title')}
      subtitle={t('tools.voiceover.subtitle')}
      gradient={['#3b82f6', '#6366f1']}
    >
      {/* TTS Usage Banner */}
      {usage && ttsMode === 'ai' && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: ttsLimitReached ? 'rgba(239,68,68,0.06)' : 'rgba(59,130,246,0.06)',
          border: `1px solid ${ttsLimitReached ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.15)'}`,
        }}>
          <span style={{ fontSize: 12, color: C.sub }}>
            {ttsLimitReached
              ? 'AI voice limit reached this month.'
              : `${ttsRemaining} AI voice generation${ttsRemaining === 1 ? '' : 's'} remaining this month.`}
          </span>
        </div>
      )}

      {/* ── TTS Mode Toggle ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['browser', 'ai'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setTtsMode(mode)}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: ttsMode === mode ? '2px solid #3b82f6' : `1px solid ${C.border}`,
              background: ttsMode === mode ? 'rgba(59,130,246,.1)' : C.card,
              color: ttsMode === mode ? '#3b82f6' : C.text,
              cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
              textAlign: 'center',
            }}
          >
            {mode === 'browser' ? (t('tools.voiceover.browserMode') || 'Browser TTS (Free)') : (t('tools.voiceover.aiMode') || 'AI Voice (Pro)')}
          </button>
        ))}
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
              width: '100%', padding: '14px 16px', borderRadius: 12,
              border: `1px solid ${C.border}`, background: C.surface,
              color: C.text, fontSize: 14, fontFamily: 'inherit',
              resize: 'vertical', outline: 'none', lineHeight: 1.6,
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
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
      {ttsMode === 'browser' ? (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>
            {t('tools.voiceover.voiceLabel')}
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {VOICE_PRESETS.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVoice(v.id)}
                onMouseEnter={() => setHoveredVoice(v.id)}
                onMouseLeave={() => setHoveredVoice(null)}
                style={{
                  padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: selectedVoice === v.id ? '2px solid #3b82f6' : `1px solid ${C.border}`,
                  background: selectedVoice === v.id ? 'rgba(59,130,246,.1)' : hoveredVoice === v.id ? C.surface : C.card,
                  color: selectedVoice === v.id ? '#3b82f6' : C.text,
                  cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                }}
              >
                {t(v.labelKey)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>
            AI Voice
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {AI_VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => setAiVoice(v.id)}
                style={{
                  padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: aiVoice === v.id ? '2px solid #6366f1' : `1px solid ${C.border}`,
                  background: aiVoice === v.id ? 'rgba(99,102,241,.1)' : C.card,
                  color: aiVoice === v.id ? '#6366f1' : C.text,
                  cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Speed slider (browser mode only) ── */}
      {ttsMode === 'browser' && <div style={{ marginBottom: 20 }}>
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
      </div>}

      {/* ── Pitch slider ── */}
      {ttsMode === 'browser' && <div style={{ marginBottom: 24 }}>
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
      </div>}

      {/* ── Audio visualization ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4,
        height: 80, padding: '12px 16px', borderRadius: 12,
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
                ? `linear-gradient(180deg, #3b82f6, #6366f1)`
                : C.border,
              transition: isSpeaking ? 'height 0.08s ease' : 'height 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* ── TTS notice ── */}
      <div style={{
        padding: '12px 16px', borderRadius: 12, marginBottom: 20,
        background: ttsMode === 'ai' ? `rgba(99,102,241,.06)` : `rgba(59,130,246,.06)`,
        border: `1px solid ${ttsMode === 'ai' ? 'rgba(99,102,241,.2)' : 'rgba(59,130,246,.2)'}`,
        fontSize: 13, color: C.sub, lineHeight: 1.6,
      }}>
        {ttsMode === 'ai'
          ? (t('tools.voiceover.aiTtsNotice') || 'AI Voice uses OpenAI text-to-speech for high-quality, natural-sounding voiceovers. Generates downloadable MP3 files. Requires Pro subscription.')
          : t('tools.voiceover.browserTtsNotice')
        }
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
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {isPlaying ? (
          <ActionButton
            label={t('tools.voiceover.stop')}
            gradient={['#ef4444', '#dc2626']}
            onClick={handleStop}
          />
        ) : ttsMode === 'ai' ? (
          <ActionButton
            label={aiLoading ? (t('tools.voiceover.generating') || 'Generating...') : (t('tools.voiceover.generateAi') || 'Generate AI Voice')}
            gradient={['#6366f1', '#8b5cf6']}
            onClick={handleAiGenerate}
            disabled={!text.trim() || aiLoading || ttsLimitReached}
            loading={aiLoading}
          />
        ) : (
          <ActionButton
            label={t('tools.voiceover.generate')}
            gradient={['#3b82f6', '#6366f1']}
            onClick={handleGenerate}
            disabled={!text.trim()}
          />
        )}
        {audioUrl && ttsMode === 'ai' && (
          <button
            onClick={handleDownloadAudio}
            onMouseEnter={() => setDownloadHover(true)}
            onMouseLeave={() => setDownloadHover(false)}
            style={{
              padding: '12px 24px', borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: downloadHover ? C.surface : C.card,
              color: C.text, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8, minHeight: 44,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t('tools.voiceover.downloadMp3') || 'Download MP3'}
          </button>
        )}
      </div>
    </ToolPageShell>
  );
}
