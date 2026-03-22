'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

/* ── Design tokens (YGen-inspired dark theme — always dark) ────────── */

const D = {
  bgDeep: '#060609',
  bgCard: '#0e0e14',
  bgInput: '#0a0a10',
  border: '#1a1a24',
  borderActive: '#2a2a38',
  text: '#e8e8f0',
  sub: '#8888a0',
  dim: '#555566',
  accent: '#c8ff00',
  accentDim: 'rgba(200,255,0,0.08)',
  accentHover: '#d4ff20',
  proBadgeBg: 'rgba(200,255,0,0.12)',
  proBadgeText: '#c8ff00',
  danger: '#ef4444',
};

/* ── Constants ──────────────────────────────────────────────────────── */

type TabId = 'scratch' | 'swap';
type StyleId = 'realistic' | 'anime' | 'cinematic' | '3d' | 'minimalist' | 'popart';
type FormatId = '16:9' | '9:16';

interface StyleOption { id: StyleId; labelKey: string }
interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: StyleId;
  revisedPrompt?: string;
  parentId?: string;
}

const STYLES: StyleOption[] = [
  { id: 'realistic', labelKey: 'aithumbs.style.realistic' },
  { id: 'anime', labelKey: 'aithumbs.style.anime' },
  { id: 'cinematic', labelKey: 'aithumbs.style.cinematic' },
  { id: '3d', labelKey: 'aithumbs.style.3d' },
  { id: 'minimalist', labelKey: 'aithumbs.style.minimalist' },
  { id: 'popart', labelKey: 'aithumbs.style.popart' },
];

const COUNT_OPTIONS = [1, 2, 3] as const;
const FORMAT_OPTIONS: { id: FormatId; labelKey: string; pro: boolean }[] = [
  { id: '16:9', labelKey: 'aithumbs.format.landscape', pro: false },
  { id: '9:16', labelKey: 'aithumbs.format.portrait', pro: true },
];

let _uid = 0;
function uid() { return `ait_${Date.now()}_${++_uid}`; }

/* ── YouTube URL helpers ────────────────────────────────────────────── */

const YT_REGEX = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/;

function extractVideoId(url: string): string | null {
  const m = url.match(YT_REGEX);
  return m ? m[1] : null;
}

/* ── Speech recognition type shim ───────────────────────────────────── */

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function createRecognition(): SpeechRecognitionInstance | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SR) return null;
  return new (SR as new () => SpeechRecognitionInstance)();
}

/* ── Main Component ─────────────────────────────────────────────────── */

export function AiThumbnailsPage() {
  const t = useLocaleStore((s) => s.t);
  const { canUseAI, remainingAI, plan } = usePlanLimits();

  /* ── State ──────────────────────────────────────── */
  const [tab, setTab] = useState<TabId>('scratch');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StyleId>('realistic');
  const [count, setCount] = useState<1 | 2 | 3>(1);
  const [format, setFormat] = useState<FormatId>('16:9');
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  /* YouTube context */
  const [ytUrl, setYtUrl] = useState('');
  const [ytTitle, setYtTitle] = useState<string | null>(null);
  const [ytLoading, setYtLoading] = useState(false);

  /* Voice input */
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  /* Upload photo */
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Responsive */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ── tRPC mutations ─────────────────────────────── */
  const generate = trpc.ai.generateThumbnail.useMutation({
    onSuccess: (data) => {
      const imgs: GeneratedImage[] = data.images.map(
        (img: { url: string; revisedPrompt?: string }) => ({
          id: uid(),
          url: img.url,
          prompt,
          style,
          revisedPrompt: img.revisedPrompt,
        }),
      );
      setResults(imgs);
      setHistory((prev) => [...imgs, ...prev].slice(0, 20));
      toast.success(t('aithumbs.toast.success'));
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const editMutation = trpc.ai.generateThumbnail.useMutation({
    onSuccess: (data) => {
      const imgs: GeneratedImage[] = data.images.map(
        (img: { url: string; revisedPrompt?: string }) => ({
          id: uid(),
          url: img.url,
          prompt: editPrompt,
          style,
          revisedPrompt: img.revisedPrompt,
          parentId: editingId ?? undefined,
        }),
      );
      setResults((prev) => [...prev, ...imgs]);
      setHistory((prev) => [...imgs, ...prev].slice(0, 20));
      setEditingId(null);
      setEditPrompt('');
      toast.success(t('aithumbs.toast.editSuccess'));
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  /* ── Handlers ───────────────────────────────────── */

  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || generate.isPending) return;
    if (!canUseAI) {
      toast.error(t('aithumbs.toast.limitReached'));
      return;
    }
    const countToUse = count > 1 && plan === 'FREE' ? 1 : count;
    generate.mutate({ prompt: prompt.trim(), style, count: countToUse });
  }, [prompt, style, count, plan, generate, canUseAI, t]);

  const handleEditSubmit = useCallback(() => {
    if (!editPrompt.trim() || editMutation.isPending || !editingId) return;
    if (!canUseAI) {
      toast.error(t('aithumbs.toast.limitReached'));
      return;
    }
    const original = results.find((r) => r.id === editingId);
    const combinedPrompt = original
      ? `Based on this thumbnail: "${original.prompt}". Modification: ${editPrompt.trim()}`
      : editPrompt.trim();
    editMutation.mutate({ prompt: combinedPrompt, style, count: 1 });
  }, [editPrompt, editingId, results, style, editMutation, canUseAI, t]);

  const handleDownload = useCallback(async (img: GeneratedImage) => {
    try {
      const res = await fetch(img.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tubeforge-thumbnail-${img.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(img.url, '_blank');
    }
  }, []);

  const handleSaveToLibrary = useCallback(() => {
    toast.success(t('aithumbs.toast.savedToLibrary'));
  }, [t]);

  const handleMoreVariants = useCallback(() => {
    if (!canUseAI || generate.isPending) return;
    if (results.length > 0) {
      generate.mutate({ prompt: results[0].prompt, style: results[0].style, count: 1 });
    }
  }, [results, generate, canUseAI]);

  /* ── YouTube URL fetch ──────────────────────────── */
  const handleYtUrl = useCallback(async (url: string) => {
    setYtUrl(url);
    const vid = extractVideoId(url);
    if (!vid) {
      setYtTitle(null);
      return;
    }
    setYtLoading(true);
    try {
      const res = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vid}`,
      );
      const data = await res.json();
      setYtTitle(data.title ?? null);
    } catch {
      setYtTitle(null);
    } finally {
      setYtLoading(false);
    }
  }, []);

  /* ── Voice input ────────────────────────────────── */
  const toggleVoice = useCallback(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const recognition = createRecognition();
    if (!recognition) {
      toast.error(t('aithumbs.toast.noSpeech'));
      return;
    }
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setPrompt((prev) => (prev ? prev + ' ' + transcript : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, t]);

  /* ── Photo upload ───────────────────────────────── */
  const handlePhotoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setUploadedPhoto(reader.result as string);
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [],
  );

  /* ── AI suggestions ─────────────────────────────── */
  const handleSuggestIdea = useCallback(() => {
    const ideas = [
      t('aithumbs.idea.1'),
      t('aithumbs.idea.2'),
      t('aithumbs.idea.3'),
      t('aithumbs.idea.4'),
      t('aithumbs.idea.5'),
    ];
    const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
    setPrompt(randomIdea);
  }, [t]);

  /* ── Helpers ─────────────────────────────────────── */

  const isLoading = generate.isPending;
  const isEditLoading = editMutation.isPending;
  const disabled = !prompt.trim() || !canUseAI || isLoading;

  /* Suppress unused variable warnings for ytUrl/ytLoading used in JSX */
  void ytUrl;

  /* Style chip helper */
  const styleChip = useMemo(
    () =>
      (active: boolean): React.CSSProperties => ({
        padding: '7px 14px',
        borderRadius: 8,
        border: `1px solid ${active ? D.accent : D.border}`,
        background: active ? D.accentDim : 'transparent',
        color: active ? D.accent : D.sub,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
        outline: 'none',
        whiteSpace: 'nowrap' as const,
      }),
    [],
  );

  /* ── Render ─────────────────────────────────────── */

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: D.bgDeep,
        color: D.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ── Top Bar ────────────────────────────────────── */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: `1px solid ${D.border}`,
          background: D.bgCard,
          flexShrink: 0,
          gap: 12,
        }}
      >
        {/* Left: Logo + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: D.accentDim,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={D.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: D.text, whiteSpace: 'nowrap' }}>
            {t('aithumbs.title')}
          </span>
        </div>

        {/* Right: My Works, Settings, Credits */}
        <button
          onClick={() => { window.location.href = '/thumbnails'; }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = D.borderActive; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = D.border; }}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: `1px solid ${D.border}`,
            background: 'transparent',
            color: D.sub,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s ease',
            display: isMobile ? 'none' : 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          My Works
        </button>

        {/* Credits badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 12px',
            borderRadius: 20,
            background: canUseAI ? D.accentDim : 'rgba(239,68,68,0.1)',
            border: `1px solid ${canUseAI ? 'rgba(200,255,0,0.15)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={canUseAI ? D.accent : D.danger} strokeWidth="2.5" strokeLinecap="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: canUseAI ? D.accent : D.danger,
            }}
          >
            {remainingAI}
          </span>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 16,
          padding: 16,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* ── Left Panel (Controls) ──────────────────── */}
        <div
          style={{
            width: isMobile ? '100%' : 380,
            flexShrink: 0,
            background: D.bgCard,
            borderRadius: 16,
            border: `1px solid ${D.border}`,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            overflowY: 'auto',
            maxHeight: isMobile ? 'none' : '100%',
          }}
        >
          {/* Mode tabs: FROM SCRATCH / SWAP CHARACTER */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['scratch', 'swap'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTab(m)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 14px',
                  borderRadius: 12,
                  background: tab === m ? D.bgInput : 'transparent',
                  border: `1px solid ${tab === m ? D.borderActive : D.border}`,
                  color: tab === m ? D.text : D.sub,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: D.accentDim,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {m === 'scratch' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={D.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={D.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  )}
                </div>
                {m === 'scratch' ? t('aithumbs.tab.scratch') : t('aithumbs.tab.swap')}
              </button>
            ))}
          </div>

          {/* Prompt label */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: D.text }}>
              {t('aithumbs.prompt.label')} <span style={{ color: D.accent }}>*</span>
            </span>
            <span style={{ fontSize: 11, color: prompt.length > 900 ? D.danger : D.dim }}>
              {prompt.length}/1000
            </span>
          </div>

          {/* Textarea */}
          <textarea
            value={prompt}
            onChange={(e) => {
              if (e.target.value.length <= 1000) setPrompt(e.target.value);
            }}
            placeholder={t('aithumbs.prompt.placeholder')}
            rows={4}
            style={{
              width: '100%',
              minHeight: 100,
              padding: 14,
              borderRadius: 12,
              border: `1px solid ${D.border}`,
              background: D.bgInput,
              color: D.text,
              fontSize: 14,
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              boxSizing: 'border-box',
              lineHeight: 1.5,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = D.borderActive;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = D.border;
            }}
          />

          {/* Action buttons row */}
          <div style={{ display: 'flex', gap: 8 }}>
            {/* YouTube URL */}
            <button
              onClick={() => {
                const url = window.prompt(t('aithumbs.ytUrl.prompt'));
                if (url) handleYtUrl(url);
              }}
              title={t('aithumbs.ytUrl.title')}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = D.borderActive; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = ytTitle ? D.accent + '40' : D.border; }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: `1px solid ${ytTitle ? D.accent + '40' : D.border}`,
                background: ytTitle ? D.accentDim : 'transparent',
                color: ytTitle ? D.accent : D.sub,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </button>

            {/* Upload photo */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title={t('aithumbs.upload.title')}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = D.borderActive; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = uploadedPhoto ? D.accent + '40' : D.border; }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: `1px solid ${uploadedPhoto ? D.accent + '40' : D.border}`,
                background: uploadedPhoto ? D.accentDim : 'transparent',
                color: uploadedPhoto ? D.accent : D.sub,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />

            {/* Voice input */}
            <button
              onClick={toggleVoice}
              title={t('aithumbs.voice.title')}
              onMouseEnter={(e) => { if (!isListening) e.currentTarget.style.borderColor = D.borderActive; }}
              onMouseLeave={(e) => { if (!isListening) e.currentTarget.style.borderColor = D.border; }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: `1px solid ${isListening ? D.danger : D.border}`,
                background: isListening ? 'rgba(239,68,68,0.15)' : 'transparent',
                color: isListening ? D.danger : D.sub,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                animation: isListening ? 'pulse 1.5s ease infinite' : 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Need an idea? button */}
            <button
              onClick={handleSuggestIdea}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = D.accent;
                e.currentTarget.style.color = D.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = D.border;
                e.currentTarget.style.color = D.sub;
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 14px',
                height: 38,
                borderRadius: 10,
                border: `1px solid ${D.border}`,
                background: 'transparent',
                color: D.sub,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
              </svg>
              {t('aithumbs.suggestIdea')}
            </button>
          </div>

          {/* YouTube title chip */}
          {ytTitle && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 10,
                background: D.accentDim,
                border: `1px solid rgba(200,255,0,0.12)`,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.accent} strokeWidth="2" strokeLinecap="round">
                <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
              <span
                style={{
                  fontSize: 12,
                  color: D.accent,
                  fontWeight: 500,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {ytTitle}
              </span>
              <button
                onClick={() => {
                  setYtUrl('');
                  setYtTitle(null);
                }}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  border: 'none',
                  background: 'transparent',
                  color: D.sub,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}
          {ytLoading && (
            <div style={{ fontSize: 12, color: D.sub }}>
              {t('aithumbs.ytUrl.loading')}
            </div>
          )}

          {/* Uploaded photo preview */}
          {uploadedPhoto && (
            <div style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedPhoto}
                alt={t('aithumbs.upload.preview')}
                style={{
                  width: '100%',
                  maxHeight: 120,
                  objectFit: 'cover',
                  borderRadius: 12,
                  display: 'block',
                  border: `1px solid ${D.border}`,
                }}
              />
              <button
                onClick={() => setUploadedPhoto(null)}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  border: 'none',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: D.border }} />

          {/* Style selector */}
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: D.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
              {t('aithumbs.section.style')}
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STYLES.map((s) => (
                <button key={s.id} onClick={() => setStyle(s.id)} style={styleChip(style === s.id)}>
                  {t(s.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: D.border }} />

          {/* Count & Format row */}
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Variant count */}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: D.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
                {t('aithumbs.section.count')}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {COUNT_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCount(c as 1 | 2 | 3)}
                    style={{
                      position: 'relative',
                      width: 40,
                      height: 36,
                      borderRadius: 8,
                      border: `1px solid ${count === c ? D.accent : D.border}`,
                      background: count === c ? D.accentDim : 'transparent',
                      color: count === c ? D.accent : D.sub,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      padding: 0,
                    }}
                  >
                    {c}
                    {c > 1 && plan === 'FREE' && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 800,
                          color: D.proBadgeText,
                          background: D.proBadgeBg,
                          padding: '1px 5px',
                          borderRadius: 4,
                          letterSpacing: 0.5,
                          lineHeight: 1,
                          position: 'absolute',
                          top: -6,
                          right: -6,
                        }}
                      >
                        PRO
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: D.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
                {t('aithumbs.section.format')}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    style={{
                      position: 'relative',
                      padding: '7px 14px',
                      borderRadius: 8,
                      border: `1px solid ${format === f.id ? D.accent : D.border}`,
                      background: format === f.id ? D.accentDim : 'transparent',
                      color: format === f.id ? D.accent : D.sub,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                    }}
                  >
                    {f.id}
                    {f.pro && plan === 'FREE' && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 800,
                          color: D.proBadgeText,
                          background: D.proBadgeBg,
                          padding: '1px 5px',
                          borderRadius: 4,
                          letterSpacing: 0.5,
                          lineHeight: 1,
                          position: 'absolute',
                          top: -6,
                          right: -6,
                        }}
                      >
                        PRO
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Credit cost indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 8,
              background: D.accentDim,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={D.accent} strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <span style={{ fontSize: 12, color: D.accent, fontWeight: 600 }}>
              {count} {t('aithumbs.creditCost')}
            </span>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Generate CTA button */}
          <button
            onClick={handleGenerate}
            disabled={disabled}
            aria-busy={isLoading || undefined}
            onMouseEnter={(e) => {
              if (!disabled) e.currentTarget.style.boxShadow = '0 6px 28px rgba(200,255,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = disabled ? 'none' : '0 4px 20px rgba(200,255,0,0.2)';
            }}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 12,
              background: disabled
                ? D.border
                : 'linear-gradient(135deg, #c8ff00, #a8e600)',
              color: disabled ? D.dim : '#0a0a0f',
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: disabled ? 'none' : '0 4px 20px rgba(200,255,0,0.2)',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
              outline: 'none',
              flexShrink: 0,
            }}
          >
            {isLoading && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                style={{ animation: 'spin 1s linear infinite' }}
              >
                <circle cx="9" cy="9" r="7" stroke="rgba(10,10,15,.2)" strokeWidth="2" fill="none" />
                <path d="M9 2a7 7 0 015.2 2.33" stroke="#0a0a0f" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            )}
            {isLoading ? t('aithumbs.generating') : t('aithumbs.generateBtn')}
          </button>

          {/* Upgrade prompt */}
          {!canUseAI && (
            <a
              href="/billing"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 12,
                background: D.accentDim,
                border: `1px solid rgba(200,255,0,0.15)`,
                color: D.accent,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              {t('aithumbs.upgrade')}
            </a>
          )}
        </div>

        {/* ── Right Panel (Preview) ──────────────────── */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: D.bgCard,
            borderRadius: 16,
            border: `1px solid ${D.border}`,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Preview label pill */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 14px',
                borderRadius: 20,
                background: D.accentDim,
                border: `1px solid rgba(200,255,0,0.1)`,
                fontSize: 11,
                fontWeight: 700,
                color: D.accent,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              PREVIEW {format}
            </span>
            {/* History toggle (if history exists, show count) */}
            {history.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 11, color: D.dim, fontWeight: 600 }}>
                {history.length} {t('aithumbs.history.title')}
              </span>
            )}
          </div>

          {/* Preview area */}
          <div
            style={{
              flex: 1,
              borderRadius: 12,
              background: D.bgInput,
              border: `1px solid ${D.border}`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            {isLoading ? (
              /* Loading state */
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: '70%',
                    maxWidth: 480,
                    aspectRatio: format === '16:9' ? '16/9' : '9/16',
                    borderRadius: 12,
                    background: `linear-gradient(110deg, ${D.bgCard} 8%, ${D.border} 18%, ${D.bgCard} 33%)`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s linear infinite',
                  }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, color: D.text }}>
                  {t('aithumbs.loading.title')}
                </span>
                <span style={{ fontSize: 13, color: D.sub }}>
                  {t('aithumbs.loading.subtitle')}
                </span>
              </div>
            ) : results.length > 0 ? (
              /* Generated results */
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                {results.map((img) => (
                  <div key={img.id}>
                    {/* Image */}
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: format === '16:9' ? '16/9' : '9/16',
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: 12,
                        background: D.bgDeep,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.prompt}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        marginTop: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <DarkActionBtn
                        icon={<DownloadIcon />}
                        label={t('aithumbs.action.download')}
                        hovered={hoveredBtn === `dl-${img.id}`}
                        onHover={(h) => setHoveredBtn(h ? `dl-${img.id}` : null)}
                        onClick={() => handleDownload(img)}
                      />
                      <DarkActionBtn
                        icon={<EditIcon />}
                        label={t('aithumbs.action.edit')}
                        hovered={hoveredBtn === `edit-${img.id}`}
                        onHover={(h) => setHoveredBtn(h ? `edit-${img.id}` : null)}
                        onClick={() => {
                          setEditingId(editingId === img.id ? null : img.id);
                          setEditPrompt('');
                        }}
                        active={editingId === img.id}
                      />
                      <DarkActionBtn
                        icon={<CanvasIcon />}
                        label={t('aithumbs.action.openCanvas')}
                        hovered={hoveredBtn === `canvas-${img.id}`}
                        onHover={(h) => setHoveredBtn(h ? `canvas-${img.id}` : null)}
                        onClick={() => {
                          window.location.href = '/thumbnails';
                        }}
                      />
                      <DarkActionBtn
                        icon={<RefreshIcon />}
                        label={t('aithumbs.action.variants')}
                        hovered={hoveredBtn === `var-${img.id}`}
                        onHover={(h) => setHoveredBtn(h ? `var-${img.id}` : null)}
                        onClick={handleMoreVariants}
                      />
                      <DarkActionBtn
                        icon={<SaveIcon />}
                        label={t('aithumbs.action.save')}
                        hovered={hoveredBtn === `save-${img.id}`}
                        onHover={(h) => setHoveredBtn(h ? `save-${img.id}` : null)}
                        onClick={handleSaveToLibrary}
                      />
                    </div>

                    {/* Inline edit */}
                    {editingId === img.id && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <input
                          type="text"
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSubmit();
                          }}
                          placeholder={t('aithumbs.edit.placeholder')}
                          autoFocus
                          style={{
                            flex: 1,
                            height: 42,
                            padding: '0 14px',
                            borderRadius: 10,
                            border: `1px solid ${D.border}`,
                            background: D.bgInput,
                            color: D.text,
                            fontSize: 13,
                            fontFamily: 'inherit',
                            outline: 'none',
                            transition: 'border-color 0.2s ease',
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = D.borderActive; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = D.border; }}
                        />
                        <button
                          onClick={handleEditSubmit}
                          disabled={!editPrompt.trim() || isEditLoading}
                          style={{
                            height: 42,
                            padding: '0 18px',
                            borderRadius: 10,
                            border: 'none',
                            background:
                              !editPrompt.trim() || isEditLoading
                                ? D.border
                                : 'linear-gradient(135deg, #c8ff00, #a8e600)',
                            color: !editPrompt.trim() || isEditLoading ? D.dim : '#0a0a0f',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor:
                              !editPrompt.trim() || isEditLoading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            whiteSpace: 'nowrap',
                            outline: 'none',
                          }}
                        >
                          {isEditLoading && (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              style={{ animation: 'spin 1s linear infinite' }}
                            >
                              <circle cx="7" cy="7" r="5" stroke="rgba(10,10,15,.2)" strokeWidth="1.5" fill="none" />
                              <path d="M7 2a5 5 0 013.54 1.46" stroke="#0a0a0f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            </svg>
                          )}
                          {t('aithumbs.edit.apply')}
                        </button>
                      </div>
                    )}

                    {/* Revised prompt */}
                    {img.revisedPrompt && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: D.bgDeep,
                          border: `1px solid ${D.border}`,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            color: D.dim,
                            fontWeight: 700,
                            display: 'block',
                            marginBottom: 4,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {t('aithumbs.revisedPrompt')}
                        </span>
                        <span style={{ fontSize: 12, color: D.sub, lineHeight: 1.5 }}>
                          {img.revisedPrompt}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {/* History thumbnails */}
                {history.length > 1 && (
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: D.dim,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        display: 'block',
                        marginBottom: 10,
                      }}
                    >
                      {t('aithumbs.history.title')}
                    </span>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                        gap: 8,
                      }}
                    >
                      {history.map((img) => {
                        const isActive = results.some((r) => r.id === img.id);
                        return (
                          <button
                            key={img.id}
                            onClick={() => setResults([img])}
                            style={{
                              padding: 0,
                              border: isActive
                                ? `2px solid ${D.accent}`
                                : `1px solid ${D.border}`,
                              borderRadius: 8,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              background: D.bgDeep,
                              aspectRatio: '16/9',
                              outline: 'none',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={img.prompt}
                              loading="lazy"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Empty state */
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                  padding: 40,
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 20,
                    background: D.accentDim,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={D.accent + '55'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: D.text, margin: 0 }}>
                  {t('aithumbs.empty.title')}
                </h3>
                <p style={{ fontSize: 14, color: D.sub, maxWidth: 300, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                  {t('aithumbs.empty.description')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function DarkActionBtn({
  icon,
  label,
  hovered,
  onHover,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  hovered: boolean;
  onHover: (h: boolean) => void;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 12px',
        height: 34,
        borderRadius: 8,
        border: `1px solid ${active ? D.accent + '40' : hovered ? D.borderActive : D.border}`,
        background: active ? D.accentDim : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        color: active ? D.accent : D.text,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
        outline: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/* ── Icon components ────────────────────────────────────────────────── */

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CanvasIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
