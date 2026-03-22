'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

/* ── Constants ──────────────────────────────────────────────────────── */

const GRADIENT: [string, string] = ['#6366f1', '#8b5cf6'];

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
  const C = useThemeStore((s) => s.theme);
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

  /* ── Pill style helper ──────────────────────────── */
  const pillStyle = useMemo(
    () =>
      (active: boolean): React.CSSProperties => ({
        padding: '8px 16px',
        height: 36,
        borderRadius: 20,
        border: 'none',
        background: active ? `${GRADIENT[0]}18` : '#f5f5f7',
        color: active ? GRADIENT[0] : '#1d1d1f',
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
        outline: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }),
    [],
  );

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: '#86868b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 10,
    display: 'block',
  };

  const isLoading = generate.isPending;
  const isEditLoading = editMutation.isPending;

  /* ── Render ─────────────────────────────────────── */

  return (
    <div style={{ width: '100%', minHeight: '100dvh', background: '#f5f5f7' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: `${GRADIENT[0]}12`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={GRADIENT[0]}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
            {t('aithumbs.title')}
          </h1>
          <p style={{ fontSize: 13, color: '#86868b', margin: '4px 0 0' }}>
            {t('aithumbs.subtitle')}
          </p>
        </div>
        {/* Credits badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 10,
            background: canUseAI ? `${GRADIENT[0]}10` : '#ef444420',
            border: `1px solid ${canUseAI ? `${GRADIENT[0]}30` : '#ef444440'}`,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={canUseAI ? GRADIENT[0] : '#ef4444'}
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: canUseAI ? GRADIENT[0] : '#ef4444',
            }}
          >
            {remainingAI} {t('aithumbs.creditsLeft')}
          </span>
        </div>
      </div>

      {/* Main content: two-column layout */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 20,
          padding: 20,
          maxWidth: 1400,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Left Panel: Controls ────────────────────── */}
        <div
          style={{
            width: isMobile ? '100%' : '30%',
            minWidth: isMobile ? undefined : 320,
            maxWidth: isMobile ? undefined : 420,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            flexShrink: 0,
          }}
        >
          {/* Tab switcher */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 4,
                background: '#f5f5f7',
                borderRadius: 10,
                padding: 3,
              }}
            >
              {(['scratch', 'swap'] as const).map((tabId) => (
                <button
                  key={tabId}
                  onClick={() => setTab(tabId)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: tab === tabId ? '#ffffff' : 'transparent',
                    color: tab === tabId ? '#1d1d1f' : '#86868b',
                    fontSize: 13,
                    fontWeight: tab === tabId ? 600 : 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    boxShadow: tab === tabId ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {tabId === 'scratch' ? t('aithumbs.tab.scratch') : t('aithumbs.tab.swap')}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>
                {t('aithumbs.prompt.label')}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: prompt.length > 900 ? '#ef4444' : '#aeaeb2',
                }}
              >
                {prompt.length}/1000
              </span>
            </div>
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
                borderRadius: 10,
                border: 'none',
                background: '#f5f5f7',
                color: '#1d1d1f',
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                transition: 'box-shadow 0.2s ease',
                boxSizing: 'border-box',
                lineHeight: 1.5,
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 2px ${GRADIENT[0]}44`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            {/* Action row: YouTube link, Upload photo, Voice */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {/* YouTube URL input */}
              <button
                onClick={() => {
                  const url = window.prompt(t('aithumbs.ytUrl.prompt'));
                  if (url) handleYtUrl(url);
                }}
                title={t('aithumbs.ytUrl.title')}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: 'none',
                  background: ytTitle ? `${GRADIENT[0]}15` : '#f5f5f7',
                  color: ytTitle ? GRADIENT[0] : '#86868b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  fontSize: 14,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
              </button>

              {/* Upload photo */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title={t('aithumbs.upload.title')}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: 'none',
                  background: uploadedPhoto ? `${GRADIENT[0]}15` : '#f5f5f7',
                  color: uploadedPhoto ? GRADIENT[0] : '#86868b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  fontSize: 14,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: 'none',
                  background: isListening ? '#ef4444' : '#f5f5f7',
                  color: isListening ? '#ffffff' : '#86868b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  fontSize: 14,
                  animation: isListening ? 'pulse 1.5s ease infinite' : 'none',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
            </div>

            {/* YouTube title chip */}
            {ytTitle && (
              <div
                style={{
                  marginTop: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: `${GRADIENT[0]}08`,
                  border: `1px solid ${GRADIENT[0]}20`,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={GRADIENT[0]}
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
                <span
                  style={{
                    fontSize: 12,
                    color: GRADIENT[0],
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
                    color: '#86868b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}
            {ytLoading && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#86868b' }}>
                {t('aithumbs.ytUrl.loading')}
              </div>
            )}

            {/* Uploaded photo preview */}
            {uploadedPhoto && (
              <div style={{ marginTop: 10, position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedPhoto}
                  alt={t('aithumbs.upload.preview')}
                  style={{
                    width: '100%',
                    maxHeight: 120,
                    objectFit: 'cover',
                    borderRadius: 10,
                    display: 'block',
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
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            {/* Suggest idea button */}
            <button
              onClick={handleSuggestIdea}
              style={{
                marginTop: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                border: 'none',
                background: 'transparent',
                color: GRADIENT[0],
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${GRADIENT[0]}08`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
              </svg>
              {t('aithumbs.suggestIdea')}
            </button>
          </div>

          {/* Style selector */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <span style={sectionLabelStyle}>{t('aithumbs.section.style')}</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STYLES.map((s) => (
                <button key={s.id} onClick={() => setStyle(s.id)} style={pillStyle(style === s.id)}>
                  {t(s.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Count selector */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <span style={sectionLabelStyle}>{t('aithumbs.section.count')}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {COUNT_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCount(c as 1 | 2 | 3)}
                  style={{ ...pillStyle(count === c), position: 'relative' }}
                >
                  {c}
                  {c > 1 && plan === 'FREE' && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: '#fff',
                        background: GRADIENT[0],
                        padding: '1px 5px',
                        borderRadius: 6,
                        marginLeft: 4,
                      }}
                    >
                      PRO
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Format selector */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <span style={sectionLabelStyle}>{t('aithumbs.section.format')}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  style={{ ...pillStyle(format === f.id), position: 'relative' }}
                >
                  {f.id}
                  {f.pro && plan === 'FREE' && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: '#fff',
                        background: GRADIENT[0],
                        padding: '1px 5px',
                        borderRadius: 6,
                        marginLeft: 4,
                      }}
                    >
                      PRO
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Credit cost note */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 10,
              background: `${GRADIENT[0]}08`,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={GRADIENT[0]}
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <span style={{ fontSize: 13, color: GRADIENT[0], fontWeight: 500 }}>
              {count} {t('aithumbs.creditCost')}
            </span>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || !canUseAI || isLoading}
            aria-busy={isLoading || undefined}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 12,
              border: 'none',
              background:
                !prompt.trim() || !canUseAI || isLoading
                  ? '#d2d2d7'
                  : `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: !prompt.trim() || !canUseAI || isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              outline: 'none',
              boxShadow:
                !prompt.trim() || !canUseAI || isLoading
                  ? 'none'
                  : `0 4px 16px ${GRADIENT[0]}40`,
            }}
          >
            {isLoading && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                style={{ animation: 'spin 1s linear infinite' }}
              >
                <circle
                  cx="9"
                  cy="9"
                  r="7"
                  stroke="rgba(255,255,255,.3)"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M9 2a7 7 0 015.2 2.33"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
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
                background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              {t('aithumbs.upgrade')}
            </a>
          )}
        </div>

        {/* ── Right Panel: Results ────────────────────── */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {isLoading ? (
            /* Loading shimmer */
            <div
              style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                minHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 480,
                  aspectRatio: '16/9',
                  borderRadius: 16,
                  background:
                    'linear-gradient(110deg, #f5f5f7 8%, #eaeaef 18%, #f5f5f7 33%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s linear infinite',
                }}
              />
              <span
                style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', marginTop: 20 }}
              >
                {t('aithumbs.loading.title')}
              </span>
              <span style={{ fontSize: 13, color: '#86868b', marginTop: 6 }}>
                {t('aithumbs.loading.subtitle')}
              </span>
            </div>
          ) : results.length > 0 ? (
            /* Generated results */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {results.map((img) => (
                <div
                  key={img.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '16/9',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '16px 16px 0 0',
                      background: '#f5f5f7',
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
                      padding: '12px 16px',
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <ActionBtn
                      icon={<DownloadIcon />}
                      label={t('aithumbs.action.download')}
                      hovered={hoveredBtn === `dl-${img.id}`}
                      onHover={(h) => setHoveredBtn(h ? `dl-${img.id}` : null)}
                      onClick={() => handleDownload(img)}
                    />
                    <ActionBtn
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
                    <ActionBtn
                      icon={<CanvasIcon />}
                      label={t('aithumbs.action.openCanvas')}
                      hovered={hoveredBtn === `canvas-${img.id}`}
                      onHover={(h) => setHoveredBtn(h ? `canvas-${img.id}` : null)}
                      onClick={() => {
                        window.location.href = '/thumbnails';
                      }}
                    />
                    <ActionBtn
                      icon={<RefreshIcon />}
                      label={t('aithumbs.action.variants')}
                      hovered={hoveredBtn === `var-${img.id}`}
                      onHover={(h) => setHoveredBtn(h ? `var-${img.id}` : null)}
                      onClick={handleMoreVariants}
                    />
                    <ActionBtn
                      icon={<SaveIcon />}
                      label={t('aithumbs.action.save')}
                      hovered={hoveredBtn === `save-${img.id}`}
                      onHover={(h) => setHoveredBtn(h ? `save-${img.id}` : null)}
                      onClick={handleSaveToLibrary}
                    />
                  </div>

                  {/* Inline edit */}
                  {editingId === img.id && (
                    <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
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
                          height: 44,
                          padding: '0 14px',
                          borderRadius: 10,
                          border: 'none',
                          background: '#f5f5f7',
                          color: '#1d1d1f',
                          fontSize: 14,
                          fontFamily: 'inherit',
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={handleEditSubmit}
                        disabled={!editPrompt.trim() || isEditLoading}
                        style={{
                          height: 44,
                          padding: '0 18px',
                          borderRadius: 10,
                          border: 'none',
                          background:
                            !editPrompt.trim() || isEditLoading ? '#d2d2d7' : GRADIENT[0],
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor:
                            !editPrompt.trim() || isEditLoading ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isEditLoading && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            style={{ animation: 'spin 1s linear infinite' }}
                          >
                            <circle
                              cx="7"
                              cy="7"
                              r="5"
                              stroke="rgba(255,255,255,.3)"
                              strokeWidth="1.5"
                              fill="none"
                            />
                            <path
                              d="M7 2a5 5 0 013.54 1.46"
                              stroke="#fff"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              fill="none"
                            />
                          </svg>
                        )}
                        {t('aithumbs.edit.apply')}
                      </button>
                    </div>
                  )}

                  {/* Revised prompt */}
                  {img.revisedPrompt && (
                    <div style={{ padding: '0 16px 12px' }}>
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: '#f5f5f7',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: '#aeaeb2',
                            fontWeight: 600,
                            display: 'block',
                            marginBottom: 3,
                          }}
                        >
                          {t('aithumbs.revisedPrompt')}
                        </span>
                        <span style={{ fontSize: 12, color: '#86868b', lineHeight: 1.5 }}>
                          {img.revisedPrompt}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Empty state */
            <div
              style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: 60,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                minHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  background: `${GRADIENT[0]}08`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={`${GRADIENT[0]}55`}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
                {t('aithumbs.empty.title')}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: '#86868b',
                  marginTop: 8,
                  maxWidth: 360,
                  lineHeight: 1.6,
                }}
              >
                {t('aithumbs.empty.description')}
              </p>
            </div>
          )}

          {/* Version history */}
          {history.length > 0 && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: 16,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1d1d1f',
                  display: 'block',
                  marginBottom: 12,
                }}
              >
                {t('aithumbs.history.title')}
              </span>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
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
                          ? `2px solid ${GRADIENT[0]}`
                          : '1px solid #e5e5ea',
                        borderRadius: 10,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: '#f5f5f7',
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

function ActionBtn({
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
        padding: '8px 14px',
        height: 36,
        borderRadius: 10,
        border: 'none',
        background: active ? `${GRADIENT[0]}15` : hovered ? '#e8e8ed' : '#f5f5f7',
        color: active ? GRADIENT[0] : '#1d1d1f',
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
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CanvasIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
